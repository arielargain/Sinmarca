import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { COLORS as C, FONT, RADIUS } from '../../theme/tokens'
import { PageHeader, Card, Button, Banner } from '../../components/ui'
import { LANDING_AI_URL } from '../../lib/constants'
import { callEdgeFunction } from '../../lib/callEdgeFunction'
import DaysLockedOverlay from '../../components/DaysLockedOverlay'

// ─── Identity helpers (10/05/2026) ──────────────────────────────
// Usamos data.template_type como discriminador (puede ser casino|tienda|
// marketing|profesional). Toda la UI específica de casino se condiciona
// con identity === 'casino' para que tienda/marketing/profesional vean
// labels y placeholders neutrales o propios de su rubro.
//
// 11/05/2026 (placeholders neutros — espejo de ClienteLanding.jsx):
// cada identity expone su propia variable recomendada para el hero
// (`nameVar`). Casino sigue usando {casino_name} por backward-compat con
// las landings históricas; tienda/marketing/profesional usan {nombre}
// para no exponer el placeholder casino-flavored. La EF landing v81+
// acepta {casino_name}, {nombre}, {business_name}, {name} como aliases
// del mismo valor (landing_pages.casino_name = nombre del negocio en DB),
// así que es seguro cambiar solo lo que muestra la UI sin migrar datos.
//
// 12/05/2026: wrapper con <DaysLockedOverlay/> — si retail no tiene días
// activos (daysLeft <= 0), oscurece toda la página y muestra el widget
// de activación centrado tipo modal. Sin días activos, la landing no
// está accesible (la EF landing podría no servirla igual, pero el lock
// frontend ya da feedback claro al user).
const ID_LABELS = {
  casino:      { negocioH: 'Datos del casino',     bizUrlLabel: 'URL del sitio del casino', bizUrlPh: 'https://ganamosorg.com', heroTitlePh: '¡Jugá en {casino_name}!',  heroSubtitlePh: 'Casino online con los mejores juegos y pagos inmediatos.', heroCtaPh: 'Crear cuenta gratis', waTextPh: '¡Hola! Quiero crear mi cuenta', metaTitlePh: 'Ganamos — Casino Online Argentina', metaDescPh: 'Creá tu cuenta gratis en segundos. Bono del 50%...', nameVar: 'casino_name' },
  tienda:      { negocioH: 'Datos de la tienda',   bizUrlLabel: 'URL del sitio de la tienda', bizUrlPh: 'https://mitienda.com',  heroTitlePh: 'Bienvenido a {nombre}',          heroSubtitlePh: 'Comprá fácil y rápido con pagos seguros y envíos a todo el país.', heroCtaPh: 'Ver productos', waTextPh: '¡Hola! Quiero hacer una consulta', metaTitlePh: 'Mi Tienda — Productos online',           metaDescPh: 'Tienda online con productos seleccionados. Pagos seguros y envíos a todo el país.', nameVar: 'nombre' },
  marketing:   { negocioH: 'Datos del servicio',   bizUrlLabel: 'URL de tu sitio o portfolio', bizUrlPh: 'https://miagencia.com', heroTitlePh: 'Hacemos crecer {nombre}',        heroSubtitlePh: 'Hacemos crecer tu negocio con estrategia y resultados medibles.',  heroCtaPh: 'Quiero info',          waTextPh: '¡Hola! Quiero info de los servicios', metaTitlePh: 'Mi Agencia — Marketing Digital',     metaDescPh: 'Soluciones de marketing digital con estrategia clara y resultados medibles.', nameVar: 'nombre' },
  profesional: { negocioH: 'Datos del estudio',    bizUrlLabel: 'URL de tu sitio (opcional)', bizUrlPh: 'https://misitio.com',     heroTitlePh: 'Hola, soy {nombre}',             heroSubtitlePh: 'Tu consulta de confianza con turnos y asesoramiento profesional.', heroCtaPh: 'Reservar turno',     waTextPh: '¡Hola! Quiero hacer una consulta',     metaTitlePh: 'Dr/a — Atención Profesional',         metaDescPh: 'Atención profesional con turnos disponibles y asesoramiento personalizado.', nameVar: 'nombre' },
}
function getIdentityFromData(data) {
  const t = String(data?.template_type || 'casino').toLowerCase()
  if (t === 'tienda' || t === 'marketing' || t === 'profesional') return t
  return 'casino'
}
function getLabels(identity) {
  return ID_LABELS[identity] || ID_LABELS.casino
}

const TABS = [
  { id: 'identidad',  label: 'Identidad'   },
  { id: 'hero',       label: 'Hero'        },
  { id: 'negocio',    label: 'Negocio'     },
  { id: 'features',   label: 'Features'    },
  { id: 'productos',  label: 'Productos'   },
  { id: 'tracking',   label: 'Tracking'    },
  { id: 'avanzado',   label: 'Avanzado'    },
  { id: 'preview',    label: 'Vista previa' },
]
const mono = { fontFamily: FONT.mono }
const inputStyle = {
  width: '100%', padding: '10px 12px',
  background: C.surface, border: `1px solid ${C.border}`, borderRadius: RADIUS.md,
  color: C.text, fontSize: 14, fontFamily: FONT.body,
  outline: 'none', transition: 'border-color 0.15s ease',
}
function TextInput({ style, ...rest }) { return <input style={{ ...inputStyle, ...style }} {...rest} /> }
function TextArea({ rows = 3, style, ...rest }) { return <textarea rows={rows} style={{ ...inputStyle, resize: 'vertical', ...style }} {...rest} /> }

export default function RetailLanding() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState(null)
  const [success, setSuccess] = useState(null)
  const [tab, setTab]         = useState('identidad')
  const [data, setData]       = useState(null)
  const [products, setProducts] = useState([])
  const [catalog, setCatalog] = useState([])
  const [previewKey, setPreviewKey] = useState(0)
  const [previewDevice, setPreviewDevice] = useState('desktop')

  // ─── IA: generar landing completa desde descripción ───────────────────
  // Mismo patrón que ClienteLanding.jsx (commit 0dfcfca5). EF landing-ai v2
  // resuelve el contexto del usuario probando primero get_my_sub_tenant_landing
  // y cayendo a get_my_retail_landing si el primero falla, así que el frontend
  // del retail no tiene que mandar nada extra.
  const [aiGenOpen, setAiGenOpen]       = useState(false)
  const [aiGenPrompt, setAiGenPrompt]   = useState('')
  const [aiGenLoading, setAiGenLoading] = useState(false)
  const [aiGenError, setAiGenError]     = useState(null)
  const [aiGenPreview, setAiGenPreview] = useState(null) // patch propuesto antes de aplicar

  // ─── IA: chat lateral en vista previa ─────────────────────────────
  const [aiChatMessages, setAiChatMessages] = useState([
    { role: 'assistant', content: '¡Hola! Decime qué querés cambiar de la landing y lo aplico al instante. Ej: "El hero tiene que vender más urgencia", "Cambiá el color principal a verde", "Agregá una feature sobre envío gratis".' }
  ])
  const [aiChatInput, setAiChatInput]       = useState('')
  const [aiChatLoading, setAiChatLoading]   = useState(false)
  const aiChatEndRef = useRef(null)

  const reload = async () => {
    setLoading(true); setError(null)
    try {
      const { data: r, error: err } = await supabase.rpc('get_my_retail_landing')
      if (err) throw err
      if (!r) throw new Error('Sin datos')
      if (!r.landing) {
        const msg = r.reason === 'no_landing_purchase_first_pack'
          ? 'Tu landing se activa al comprar tu primer pack. Andá a Saldo y elegí tu plan para empezar.'
          : 'Tu landing aún no se generó. Comprá un pack desde Saldo para activarla.'
        setError(msg)
      } else {
        setData(r.landing)
        setProducts(r.products || [])
        setCatalog(r.catalog || [])
      }
    } catch (e) { setError(e.message || 'Error al cargar la landing') }
    finally { setLoading(false) }
  }
  useEffect(() => { reload() }, [])

  // Auto-scroll en chat IA
  useEffect(() => {
    aiChatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [aiChatMessages])

  const update = (field, value) => { setData(prev => ({ ...prev, [field]: value })); setSuccess(null) }

  const save = async (patch = null) => {
    setSaving(true); setError(null); setSuccess(null)
    try {
      const fields = patch || {
        casino_name: data.casino_name, logo_url: data.logo_url, favicon_url: data.favicon_url,
        color_primary: data.color_primary, color_bg: data.color_bg, color_surface: data.color_surface, color_text: data.color_text,
        hero_title: data.hero_title, hero_subtitle: data.hero_subtitle, hero_cta: data.hero_cta,
        wa_number: data.wa_number, wa_text: data.wa_text,
        min_deposit: data.min_deposit, min_withdrawal: data.min_withdrawal,
        welcome_bonus: data.welcome_bonus, schedule: data.schedule, casino_url: data.casino_url,
        features: data.features || [],
        meta_title: data.meta_title, meta_description: data.meta_description,
        published: data.published,
        custom_html: data.custom_html, custom_head_code: data.custom_head_code,
        meta_pixel_id: data.meta_pixel_id, meta_tag: data.meta_tag, meta_test_event_code: data.meta_test_event_code,
        google_analytics_id: data.google_analytics_id, google_tag_manager: data.google_tag_manager,
        tiktok_pixel_id: data.tiktok_pixel_id,
        linkedin_partner_id: data.linkedin_partner_id, twitter_pixel_id: data.twitter_pixel_id,
        reddit_pixel_id: data.reddit_pixel_id, pinterest_tag_id: data.pinterest_tag_id,
        clarity_project_id: data.clarity_project_id, hotjar_site_id: data.hotjar_site_id,
        snap_pixel_id: data.snap_pixel_id,
      }
      const { error: err } = await supabase.rpc('update_my_retail_landing', { p_patch: fields })
      if (err) throw err
      setSuccess('Cambios guardados ✓')
      setPreviewKey(k => k + 1)
      setTimeout(() => setSuccess(null), 3000)
    } catch (e) { setError(e.message || 'Error al guardar') }
    finally { setSaving(false) }
  }

  const saveProducts = async (newProducts) => {
    setSaving(true); setError(null); setSuccess(null)
    try {
      const items = newProducts.map((p, idx) => ({
        product_id: p.id, sort_order: idx,
        override_title: p.override_title || null,
        override_description: p.override_description || null,
      }))
      const { error: err } = await supabase.rpc('set_my_landing_products', { p_items: items })
      if (err) throw err
      setProducts(newProducts)
      setSuccess('Productos actualizados ✓')
      setPreviewKey(k => k + 1)
      setTimeout(() => setSuccess(null), 3000)
    } catch (e) { setError(e.message || 'Error al guardar productos') }
    finally { setSaving(false) }
  }

  // ─── IA: GENERATE — descripción libre → patch completo ───────────────
  const aiGenerate = async () => {
    if (!aiGenPrompt.trim() || aiGenLoading) return
    setAiGenLoading(true); setAiGenError(null); setAiGenPreview(null)
    try {
      const { ok, status, data: res } = await callEdgeFunction(LANDING_AI_URL, {
        mode: 'generate',
        description: aiGenPrompt.trim(),
      })
      if (!ok) {
        setAiGenError(res?.error || `http_${status}`)
        return
      }
      const patch = res?.patch || {}
      if (Object.keys(patch).length === 0) {
        setAiGenError('La IA no devolvió campos válidos. Probá con una descripción más detallada.')
        return
      }
      setAiGenPreview(patch)
    } catch (e) {
      setAiGenError(e.message || 'Error inesperado')
    } finally {
      setAiGenLoading(false)
    }
  }

  // Aplicar el patch propuesto: actualiza estado local + persiste server-side
  const aiApplyGenerated = async () => {
    if (!aiGenPreview) return
    setAiGenLoading(true)
    try {
      // Merge local primero (UX inmediata)
      const merged = { ...data, ...aiGenPreview }
      setData(merged)
      // Persistir solo los campos del patch — más eficiente que mandar todo
      await save(aiGenPreview)
      setAiGenOpen(false)
      setAiGenPrompt('')
      setAiGenPreview(null)
    } catch (e) {
      setAiGenError(e.message || 'Error al aplicar')
    } finally {
      setAiGenLoading(false)
    }
  }

  // ─── IA: CHAT — conversación iterativa con auto-aplicación ─────────
  const aiChatSend = async () => {
    const text = aiChatInput.trim()
    if (!text || aiChatLoading) return
    const userMsg = { role: 'user', content: text }
    const newMessages = [...aiChatMessages, userMsg]
    setAiChatMessages(newMessages)
    setAiChatInput('')
    setAiChatLoading(true)
    try {
      // Mandamos solo los últimos 10 turnos (la EF también los limita)
      const sendable = newMessages.filter(m => m.role !== 'system').slice(-10)
      const { ok, status, data: res } = await callEdgeFunction(LANDING_AI_URL, {
        mode: 'chat',
        messages: sendable,
      })
      if (!ok) {
        setAiChatMessages(m => [...m, {
          role: 'assistant',
          content: `Hubo un error (${res?.error || `http_${status}`}). Probá de nuevo.`,
          isError: true,
        }])
        return
      }
      const reply = res?.reply || 'Listo.'
      const patch = res?.patch || {}
      const patchKeys = Object.keys(patch)

      setAiChatMessages(m => [...m, {
        role: 'assistant',
        content: reply,
        patchKeys: patchKeys.length > 0 ? patchKeys : null,
      }])

      // Si hay patch, aplicarlo: merge local + persist server
      if (patchKeys.length > 0) {
        const merged = { ...data, ...patch }
        setData(merged)
        try {
          await save(patch)
        } catch (e) {
          setAiChatMessages(m => [...m, {
            role: 'assistant',
            content: `Apliqué los cambios pero no pude guardarlos: ${e.message}`,
            isError: true,
          }])
        }
      }
    } catch (e) {
      setAiChatMessages(m => [...m, {
        role: 'assistant',
        content: `Error de red: ${e.message}`,
        isError: true,
      }])
    } finally {
      setAiChatLoading(false)
    }
  }

  if (loading) return (
    <DaysLockedOverlay featureName="Landing">
      <div style={{ color: C.muted, padding: 20 }}>Cargando landing…</div>
    </DaysLockedOverlay>
  )
  if (error && !data) return (
    <DaysLockedOverlay featureName="Landing">
      <div>
        <PageHeader eyebrow="Centro de landing" title="Landing" subtitle="Editor de tu landing pública." />
        <Banner kind="warning">{error}</Banner>
      </div>
    </DaysLockedOverlay>
  )
  if (!data) return null

  const publicUrl = `https://app.innovate-ia.com/l/${data.slug}`
  const identity  = getIdentityFromData(data)
  const L         = getLabels(identity)
  const isCasino  = identity === 'casino'

  return (
    <DaysLockedOverlay featureName="Landing">
    <div>
      <PageHeader
        eyebrow="Centro de landing"
        title="Landing"
        subtitle="Editá los textos, colores, productos y tracking de tu landing pública."
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <a href={publicUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              <Button variant="ghost" size="md">Ver landing →</Button>
            </a>
            <Button variant="primary" size="md" onClick={() => save()} disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </div>
        }
      />

      {/* ─── BOTÓN GRANDE: Generar con IA ─────────────────────────────── */}
      <div style={{
        marginBottom: 16,
        background: `linear-gradient(135deg, ${C.brand}15, ${C.brand}05)`,
        border: `1px solid ${C.brand}40`,
        borderRadius: RADIUS.lg || 12,
        padding: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        flexWrap: 'wrap',
      }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: C.text, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>✨</span> Generar landing con IA
          </h3>
          <p style={{ margin: 0, fontSize: 13, color: C.muted, lineHeight: 1.5 }}>
            Describí tu negocio en pocas palabras y la IA te arma toda la landing: hero, copy, features, SEO. Después podés editar a mano lo que quieras.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => { setAiGenOpen(true); setAiGenError(null); setAiGenPreview(null) }}
          style={{ flexShrink: 0 }}
        >
          ✨ Generar con IA →
        </Button>
      </div>

      <div style={{
        marginBottom: 20, padding: 14, background: C.card, border: `1px solid ${C.border}`, borderRadius: RADIUS.md,
        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
      }}>
        <div style={{
          padding: '4px 10px', borderRadius: 999,
          background: data.published ? `${C.success}20` : `${C.danger}20`,
          color: data.published ? C.success : C.danger,
          fontSize: 11, fontWeight: 700, ...mono, textTransform: 'uppercase', letterSpacing: '0.08em',
          border: `1px solid ${data.published ? C.success : C.danger}40`,
        }}>{data.published ? '● PUBLICADA' : '○ NO PUBLICADA'}</div>
        <div style={{ ...mono, fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>URL pública:</div>
        <a href={publicUrl} target="_blank" rel="noopener noreferrer"
           style={{ ...mono, fontSize: 12, color: C.brand, textDecoration: 'none' }}>{publicUrl}</a>
        {/* Identity badge */}
        <div style={{
          padding: '3px 9px', borderRadius: 999,
          background: `${C.brand}15`, border: `1px solid ${C.brand}30`,
          color: C.brand, fontSize: 10, fontWeight: 700, ...mono, textTransform: 'uppercase', letterSpacing: '0.08em',
        }}>{identity}</div>
        <div style={{ marginLeft: 'auto' }}>
          <Button variant={data.published ? 'ghost' : 'primary'} size="sm"
            onClick={async () => { update('published', !data.published); await save({ published: !data.published }) }}>
            {data.published ? 'Despublicar' : 'Publicar'}
          </Button>
        </div>
      </div>

      {error && <Banner kind="error" style={{ marginBottom: 12 }}>{error}</Banner>}
      {success && <Banner kind="success" style={{ marginBottom: 12 }}>{success}</Banner>}

      <div style={{
        display: 'flex', gap: 4, borderBottom: `1px solid ${C.border}`,
        marginBottom: 24, overflowX: 'auto',
      }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              padding: '12px 16px', background: 'transparent', border: 'none',
              color: tab === t.id ? C.text : C.muted,
              fontSize: 14, fontWeight: tab === t.id ? 700 : 500,
              borderBottom: `2px solid ${tab === t.id ? C.brand : 'transparent'}`,
              cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s ease',
            }}>{t.label}</button>
        ))}
      </div>

      {tab === 'identidad' && (
        <Card padding={24}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: C.text }}>Identidad de marca</h3>
          <Field label="Nombre del negocio" required>
            <TextInput value={data.casino_name || ''} onChange={e => update('casino_name', e.target.value)} placeholder="Ganamos" />
          </Field>
          <Field label="URL del logo" hint="Imagen cuadrada o rectangular. Se muestra arriba a la izquierda.">
            <TextInput value={data.logo_url || ''} onChange={e => update('logo_url', e.target.value)} placeholder="https://..." />
            {data.logo_url && (
              <div style={{ marginTop: 8, padding: 12, background: C.surface, borderRadius: RADIUS.md, border: `1px solid ${C.border}`, display: 'inline-block' }}>
                <img src={data.logo_url} alt="logo" style={{ maxHeight: 60, maxWidth: 200 }} onError={e => { e.target.style.display = 'none' }} />
              </div>
            )}
          </Field>
          <Field label="URL del favicon" hint="Icono pequeño que aparece en la pestaña del navegador.">
            <TextInput value={data.favicon_url || ''} onChange={e => update('favicon_url', e.target.value)} placeholder="https://..." />
          </Field>
          <h3 style={{ margin: '24px 0 16px', fontSize: 16, fontWeight: 700, color: C.text }}>Colores</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <ColorField label="Color primario"   value={data.color_primary || '#D4A843'} onChange={v => update('color_primary', v)} />
            <ColorField label="Color de fondo"   value={data.color_bg      || '#080B12'} onChange={v => update('color_bg', v)} />
            <ColorField label="Color de surface" value={data.color_surface || '#0D0F1A'} onChange={v => update('color_surface', v)} />
            <ColorField label="Color de texto"   value={data.color_text    || '#E9E7E0'} onChange={v => update('color_text', v)} />
          </div>
        </Card>
      )}

      {tab === 'hero' && (
        <Card padding={24}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: C.text }}>Sección principal</h3>
          <Field label="Título del hero" hint={`Podés usar {${L.nameVar}} para que se reemplace por el nombre de tu negocio.`}>
            <TextInput value={data.hero_title || ''} onChange={e => update('hero_title', e.target.value)} placeholder={L.heroTitlePh} />
          </Field>
          <Field label="Subtítulo del hero" hint="Frase corta debajo del título.">
            <TextArea rows={2} value={data.hero_subtitle || ''} onChange={e => update('hero_subtitle', e.target.value)}
                      placeholder={L.heroSubtitlePh} />
          </Field>
          <Field label="Texto del botón CTA">
            <TextInput value={data.hero_cta || ''} onChange={e => update('hero_cta', e.target.value)} placeholder={L.heroCtaPh} />
          </Field>
          <h3 style={{ margin: '24px 0 16px', fontSize: 16, fontWeight: 700, color: C.text }}>Botón de WhatsApp</h3>
          <Field label="Número de WhatsApp" hint="Sin + ni espacios. Ej: 5493455527675">
            <TextInput value={data.wa_number || ''} onChange={e => update('wa_number', e.target.value)} placeholder="5493455527675" />
          </Field>
          <Field label="Mensaje pre-cargado">
            <TextInput value={data.wa_text || ''} onChange={e => update('wa_text', e.target.value)} placeholder={L.waTextPh} />
          </Field>
        </Card>
      )}

      {tab === 'negocio' && (
        <Card padding={24}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: C.text }}>{L.negocioH}</h3>
          <Field label={L.bizUrlLabel}>
            <TextInput value={data.casino_url || ''} onChange={e => update('casino_url', e.target.value)} placeholder={L.bizUrlPh} />
          </Field>

          {isCasino && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                <Field label="Mínimo de depósito (ARS)">
                  <TextInput type="number" value={data.min_deposit || 0}
                             onChange={e => update('min_deposit', parseInt(e.target.value) || 0)} placeholder="2000" />
                </Field>
                <Field label="Mínimo de retiro (ARS)">
                  <TextInput type="number" value={data.min_withdrawal || 0}
                             onChange={e => update('min_withdrawal', parseInt(e.target.value) || 0)} placeholder="5000" />
                </Field>
              </div>
              <Field label="Bono de bienvenida">
                <TextInput value={data.welcome_bonus || ''} onChange={e => update('welcome_bonus', e.target.value)} placeholder="50% en primera carga" />
              </Field>
            </>
          )}

          {identity === 'tienda' && (
            <Field label="Info de envíos" hint="Aparece en la sección Información de tu landing. Ej: 'Envío gratis en CABA, 24-48hs al resto del país'.">
              <TextInput value={data.welcome_bonus || ''} onChange={e => update('welcome_bonus', e.target.value)}
                         placeholder="Envío a todo el país en 24-48hs" />
            </Field>
          )}

          {identity === 'marketing' && (
            <Field label="Gancho del CTA final" hint="Frase corta que aparece debajo del título '¿Empezamos?' en el cierre. Ej: 'Primera charla sin costo'.">
              <TextInput value={data.welcome_bonus || ''} onChange={e => update('welcome_bonus', e.target.value)}
                         placeholder="Coordiná una primera charla sin costo." />
            </Field>
          )}

          {identity === 'profesional' && (
            <Field label="Información adicional" hint="Texto corto que aparece en la card 'Información del estudio'. Ej: 'Atención particular y obras sociales'.">
              <TextInput value={data.welcome_bonus || ''} onChange={e => update('welcome_bonus', e.target.value)}
                         placeholder="Atención particular y obras sociales" />
            </Field>
          )}

          <Field label={isCasino ? 'Horario de retiros' : 'Horario de atención'}>
            <TextInput value={data.schedule || ''} onChange={e => update('schedule', e.target.value)} placeholder="09 a 23hs" />
          </Field>

          <h3 style={{ margin: '24px 0 16px', fontSize: 16, fontWeight: 700, color: C.text }}>SEO</h3>
          <Field label="Meta title" hint="Aparece en la pestaña del navegador y en Google.">
            <TextInput value={data.meta_title || ''} onChange={e => update('meta_title', e.target.value)} placeholder={L.metaTitlePh} />
          </Field>
          <Field label="Meta description" hint="Texto que aparece en los resultados de búsqueda. ~150 caracteres.">
            <TextArea rows={3} value={data.meta_description || ''} onChange={e => update('meta_description', e.target.value)}
                      placeholder={L.metaDescPh} />
          </Field>
        </Card>
      )}

      {tab === 'features' && (
        <FeaturesEditor features={data.features || []} onChange={f => update('features', f)} identity={identity} />
      )}
      {tab === 'productos' && (
        <ProductsEditor products={products} catalog={catalog} onSave={saveProducts} saving={saving} />
      )}

      {tab === 'tracking' && <TrackingTab data={data} update={update} />}

      {tab === 'avanzado' && (
        <Card padding={24}>
          <Banner kind="warning" style={{ marginBottom: 20 }}>
            <strong>⚠️ Zona avanzada — solo si sabés HTML/CSS.</strong>
            <br />
            El código que pongas acá se ejecuta en tu landing pública. Un error puede romper la página. Si no estás seguro, no toques nada.
          </Banner>
          <Field label="HTML personalizado completo" hint="Reemplaza el template estándar. Si está vacío, se usa el template por defecto.">
            <TextArea rows={20} value={data.custom_html || ''} onChange={e => update('custom_html', e.target.value)}
                      style={{ ...mono, fontSize: 12 }} placeholder="<!DOCTYPE html>..." />
          </Field>
          <Field label="Código en <head>" hint="Scripts, estilos, meta tags adicionales que se inyectan en el head.">
            <TextArea rows={10} value={data.custom_head_code || ''} onChange={e => update('custom_head_code', e.target.value)}
                      style={{ ...mono, fontSize: 12 }} placeholder="<script>...</script>" />
          </Field>
        </Card>
      )}

      {tab === 'preview' && (
        <PreviewWithAIChat
          url={publicUrl}
          previewKey={previewKey}
          setPreviewKey={setPreviewKey}
          previewDevice={previewDevice}
          setPreviewDevice={setPreviewDevice}
          aiChatMessages={aiChatMessages}
          aiChatInput={aiChatInput}
          setAiChatInput={setAiChatInput}
          aiChatLoading={aiChatLoading}
          aiChatSend={aiChatSend}
          aiChatEndRef={aiChatEndRef}
          saving={saving}
        />
      )}

      {/* ─── MODAL: Generar con IA ─────────────────────────────────── */}
      {aiGenOpen && (
        <AiGenerateModal
          prompt={aiGenPrompt}
          setPrompt={setAiGenPrompt}
          loading={aiGenLoading}
          error={aiGenError}
          preview={aiGenPreview}
          onGenerate={aiGenerate}
          onApply={aiApplyGenerated}
          onClose={() => { setAiGenOpen(false); setAiGenPreview(null); setAiGenError(null) }}
          identity={identity}
        />
      )}
    </div>
    </DaysLockedOverlay>
  )
}

// ─── Vista previa CON chat de IA al costado ──────────────────────
function PreviewWithAIChat({
  url, previewKey, setPreviewKey, previewDevice, setPreviewDevice,
  aiChatMessages, aiChatInput, setAiChatInput, aiChatLoading, aiChatSend,
  aiChatEndRef, saving,
}) {
  const widths  = { mobile: 390, tablet: 768, desktop: '100%' }
  const heights = { mobile: 844, tablet: 1024, desktop: 800 }

  const isWide = typeof window !== 'undefined' && window.innerWidth >= 1100

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isWide ? 'minmax(0, 1fr) 380px' : '1fr',
      gap: 16,
      alignItems: 'start',
    }}>
      <Card padding={20} style={{ order: isWide ? 0 : 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ ...mono, fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Vista previa:
          </div>
          <a href={url} target="_blank" rel="noopener noreferrer" style={{ ...mono, fontSize: 12, color: C.brand, textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis' }}>{url}</a>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {[
              { id: 'mobile',  label: '📱' },
              { id: 'tablet',  label: '📱' },
              { id: 'desktop', label: '🖥' },
            ].map(d => (
              <button key={d.id} onClick={() => setPreviewDevice(d.id)}
                style={{
                  padding: '6px 10px', fontSize: 12, fontWeight: 600,
                  background: previewDevice === d.id ? C.brand : C.surface,
                  color: previewDevice === d.id ? '#000' : C.text,
                  border: `1px solid ${previewDevice === d.id ? C.brand : C.border}`,
                  borderRadius: RADIUS.sm, cursor: 'pointer',
                }}>{d.label}</button>
            ))}
            <Button variant="ghost" size="sm" onClick={() => setPreviewKey(k => k + 1)}>↻</Button>
          </div>
        </div>

        <div style={{
          display: 'flex', justifyContent: 'center',
          background: C.surface, borderRadius: RADIUS.md, padding: 12,
          border: `1px solid ${C.border}`, overflowX: 'auto',
        }}>
          <div style={{
            width: widths[previewDevice], maxWidth: '100%',
            height: heights[previewDevice],
            background: '#fff', borderRadius: RADIUS.md, overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            border: `1px solid ${C.border}`,
          }}>
            {url ? (
              <iframe key={`${url}-${previewKey}`} src={url}
                      title="Landing preview" loading="eager"
                      referrerPolicy="no-referrer"
                      style={{ width: '100%', height: '100%', border: 'none', display: 'block', background: '#fff' }} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', color: '#666', fontSize: 13 }}>
                Cargando…
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card padding={0} style={{
        order: isWide ? 0 : 1,
        position: isWide ? 'sticky' : 'static',
        top: 16,
        height: isWide ? 'calc(100vh - 60px)' : 'auto',
        maxHeight: isWide ? 720 : 600,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '14px 18px',
          borderBottom: `1px solid ${C.border}`,
          background: `linear-gradient(135deg, ${C.brand}10, transparent)`,
          flexShrink: 0,
        }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.text, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>🪄</span> Editar con IA
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: C.muted, lineHeight: 1.4 }}>
            Decime los cambios y los aplico al instante.
          </p>
        </div>

        <div style={{
          flex: 1, overflowY: 'auto', padding: 14,
          display: 'flex', flexDirection: 'column', gap: 10,
          background: C.bg,
        }}>
          {aiChatMessages.map((m, i) => (
            <div key={i} style={{
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              padding: '8px 12px',
              background: m.role === 'user'
                ? C.brand
                : m.isError
                  ? `${C.danger}15`
                  : C.surface,
              border: m.isError
                ? `1px solid ${C.danger}40`
                : m.role === 'user'
                  ? `1px solid ${C.brand}`
                  : `1px solid ${C.border}`,
              borderRadius: RADIUS.md,
              color: m.role === 'user' ? '#000' : m.isError ? C.danger : C.text,
              fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>
              {m.content}
              {m.patchKeys && m.patchKeys.length > 0 && (
                <div style={{
                  marginTop: 6, paddingTop: 6, borderTop: `1px dashed ${C.border}`,
                  fontSize: 11, color: C.muted,
                }}>
                  ✓ Cambié: {m.patchKeys.join(', ')}
                </div>
              )}
            </div>
          ))}
          {aiChatLoading && (
            <div style={{
              alignSelf: 'flex-start',
              padding: '8px 12px',
              background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: RADIUS.md, fontSize: 13, color: C.muted,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{ animation: 'pulse 1s ease-in-out infinite' }}>⚙️</span>
              Pensando…
            </div>
          )}
          <div ref={aiChatEndRef} />
        </div>

        <div style={{
          padding: 12, borderTop: `1px solid ${C.border}`,
          background: C.surface, flexShrink: 0,
        }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <textarea
              value={aiChatInput}
              onChange={e => setAiChatInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  aiChatSend()
                }
              }}
              placeholder="Ej: Cambiá el color principal a verde…"
              rows={2}
              disabled={aiChatLoading}
              style={{
                flex: 1, background: C.bg, border: `1px solid ${C.border}`,
                borderRadius: RADIUS.md, padding: '8px 12px', color: C.text,
                fontSize: 13, resize: 'none', outline: 'none', fontFamily: 'inherit',
                lineHeight: 1.4,
              }}
            />
            <Button
              variant="primary"
              size="sm"
              onClick={aiChatSend}
              disabled={!aiChatInput.trim() || aiChatLoading}
              style={{ alignSelf: 'flex-end', height: 38 }}
            >↑</Button>
          </div>
          {saving && (
            <div style={{
              marginTop: 6, fontSize: 11, color: C.muted,
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              💾 Guardando cambios…
            </div>
          )}
        </div>
      </Card>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}

function AiGenerateModal({ prompt, setPrompt, loading, error, preview, onGenerate, onApply, onClose, identity }) {
  const phByIdentity = {
    casino:      'Ej: Soy GanamosOrg, casino online en Argentina. Apuntamos a jugadores casuales que quieren cargar poco y cobrar rápido. Mínimo $2000 y retiros en 30 minutos. Tenemos tragamonedas y ruleta en vivo. Tono divertido y argento, nada formal.',
    tienda:      'Ej: Tengo una tienda online de ropa femenina, "Modistería". Apuntamos a mujeres 25-45 que buscan calidad y atención. Envíos a todo el país en 24-48hs, MercadoPago. Tono cálido y cercano.',
    marketing:   'Ej: Somos "BrandUp", agencia de marketing digital. Apuntamos a PyMEs que quieren más leads. Hacemos Google Ads, Meta Ads y SEO. Plan a medida según presupuesto. Tono profesional pero cercano.',
    profesional: 'Ej: Soy la Lic. Ana López, psicóloga clínica. Atiendo adultos por consulta particular y obras sociales. Turnos de lunes a viernes 9-19hs. Tono profesional, cálido y respetuoso.',
  }
  const placeholder = phByIdentity[identity] || phByIdentity.casino
  return (
    <div
      onClick={e => { if (e.target === e.currentTarget && !loading) onClose() }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)',
        backdropFilter: 'blur(4px)', zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
    >
      <div style={{
        background: C.card, border: `1px solid ${C.border}`,
        borderRadius: RADIUS.xl || 16, width: '100%', maxWidth: 640,
        maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
      }}>
        <div style={{
          padding: '18px 22px', borderBottom: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: C.text, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>✨</span> Generar landing con IA
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: C.muted }}>
              Describí tu negocio y la IA arma el copy completo.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            style={{ background: 'none', border: 'none', color: C.muted, fontSize: 22, cursor: loading ? 'default' : 'pointer', padding: 4 }}
          >×</button>
        </div>

        <div style={{ padding: 22, overflowY: 'auto', flex: 1 }}>
          {!preview && (
            <>
              <Field label="Describí tu negocio" hint="Cuanto más específico, mejor. Ej: nombre, qué vendés, a quién, qué te diferencia, tono que querés.">
                <TextArea
                  rows={6}
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder={placeholder}
                  disabled={loading}
                  style={{ minHeight: 140 }}
                />
              </Field>

              {error && (
                <Banner kind="error" style={{ marginTop: 12 }}>{error}</Banner>
              )}

              <div style={{
                marginTop: 12, padding: 12,
                background: `${C.brand}08`, border: `1px solid ${C.brand}30`,
                borderRadius: RADIUS.md, fontSize: 12, color: C.text, lineHeight: 1.5,
              }}>
                💡 La IA respeta el tipo de negocio (Casino / Tienda / Marketing / Profesional) que tenés configurado en{' '}
                <strong style={{ color: C.brand }}>Configuración → Identidad</strong>. Si querés cambiarlo, hacelo antes de generar.
              </div>
            </>
          )}

          {preview && (
            <>
              <div style={{
                marginBottom: 14, padding: '10px 14px',
                background: `${C.success}10`, border: `1px solid ${C.success}40`,
                borderRadius: RADIUS.md, fontSize: 13, color: C.success,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span>✓</span> La IA generó {Object.keys(preview).length} campos. Revisá la propuesta abajo y aplicá si te gusta.
              </div>
              <div style={{
                background: C.surface, border: `1px solid ${C.border}`,
                borderRadius: RADIUS.md, padding: 14,
                fontSize: 12, color: C.text, lineHeight: 1.6,
              }}>
                {Object.entries(preview).map(([k, v]) => (
                  <div key={k} style={{
                    marginBottom: 12, paddingBottom: 12,
                    borderBottom: `1px solid ${C.border}`,
                  }}>
                    <div style={{
                      ...mono, fontSize: 10, color: C.muted, fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4,
                    }}>{k}</div>
                    <div style={{ wordBreak: 'break-word' }}>
                      {Array.isArray(v) ? (
                        <ul style={{ margin: 0, paddingLeft: 18 }}>
                          {v.map((f, i) => (
                            <li key={i} style={{ marginBottom: 4 }}>
                              <strong>{f.icon} {f.title}</strong>
                              {f.desc && <span style={{ color: C.muted }}> — {f.desc}</span>}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        String(v)
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div style={{
          padding: '14px 22px', borderTop: `1px solid ${C.border}`,
          display: 'flex', gap: 10, justifyContent: 'flex-end',
        }}>
          {!preview ? (
            <>
              <Button variant="ghost" size="md" onClick={onClose} disabled={loading}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={onGenerate}
                disabled={loading || !prompt.trim()}
              >
                {loading ? 'Generando…' : '✨ Generar →'}
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="md" onClick={onClose} disabled={loading}>
                Descartar
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={onApply}
                disabled={loading}
              >
                {loading ? 'Aplicando…' : '✓ Aplicar a mi landing'}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function TrackingTab({ data, update }) {
  return (
    <div>
      <Card padding={24} style={{ marginBottom: 16 }}>
        <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: C.text }}>Meta (Facebook & Instagram)</h3>
        <p style={{ margin: '0 0 16px', fontSize: 12, color: C.muted }}>Píxel para tracking de visitas y conversiones desde campañas de Meta Ads.</p>
        <Field label="Meta Pixel ID" hint="Solo el número. Ej: 1475522311021682">
          <TextInput value={data.meta_pixel_id || ''} onChange={e => update('meta_pixel_id', e.target.value)} placeholder="123456789012345" />
        </Field>
        <Field label="Test Event Code" hint="Para verificar eventos en Events Manager. Ej: TEST12345. Dejá vacío en producción.">
          <TextInput value={data.meta_test_event_code || ''} onChange={e => update('meta_test_event_code', e.target.value)} placeholder="TEST12345" />
        </Field>
        <Field label="Meta tag de verificación" hint="Si Facebook te pidió verificar el dominio.">
          <TextInput value={data.meta_tag || ''} onChange={e => update('meta_tag', e.target.value)} placeholder="abc123..." />
        </Field>
      </Card>

      <Card padding={24} style={{ marginBottom: 16 }}>
        <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: C.text }}>Google</h3>
        <p style={{ margin: '0 0 16px', fontSize: 12, color: C.muted }}>Analytics + Tag Manager para Google Ads y reporting.</p>
        <Field label="Google Analytics 4 ID" hint="Formato G-XXXXXXX">
          <TextInput value={data.google_analytics_id || ''} onChange={e => update('google_analytics_id', e.target.value)} placeholder="G-XXXXXXX" />
        </Field>
        <Field label="Google Tag Manager ID" hint="Formato GTM-XXXXXX. Si lo usás, no necesitás GA4 ID acá.">
          <TextInput value={data.google_tag_manager || ''} onChange={e => update('google_tag_manager', e.target.value)} placeholder="GTM-XXXXXX" />
        </Field>
      </Card>

      <Card padding={24} style={{ marginBottom: 16 }}>
        <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: C.text }}>TikTok</h3>
        <p style={{ margin: '0 0 16px', fontSize: 12, color: C.muted }}>Píxel para campañas en TikTok Ads.</p>
        <Field label="TikTok Pixel ID" hint="Formato C9XXXXXXXXXXXXX">
          <TextInput value={data.tiktok_pixel_id || ''} onChange={e => update('tiktok_pixel_id', e.target.value)} placeholder="C9..." />
        </Field>
      </Card>

      <Card padding={24} style={{ marginBottom: 16 }}>
        <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: C.text }}>Otros píxeles publicitarios</h3>
        <p style={{ margin: '0 0 16px', fontSize: 12, color: C.muted }}>LinkedIn, Twitter/X, Reddit, Pinterest, Snap.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          <Field label="LinkedIn Insight Tag" hint="Partner ID numérico">
            <TextInput value={data.linkedin_partner_id || ''} onChange={e => update('linkedin_partner_id', e.target.value)} placeholder="123456" />
          </Field>
          <Field label="Twitter/X Pixel" hint="Universal Website Tag ID">
            <TextInput value={data.twitter_pixel_id || ''} onChange={e => update('twitter_pixel_id', e.target.value)} placeholder="o1234" />
          </Field>
          <Field label="Reddit Pixel" hint="Formato a2_xxxxx">
            <TextInput value={data.reddit_pixel_id || ''} onChange={e => update('reddit_pixel_id', e.target.value)} placeholder="a2_xxxxx" />
          </Field>
          <Field label="Pinterest Tag" hint="Tag ID numérico">
            <TextInput value={data.pinterest_tag_id || ''} onChange={e => update('pinterest_tag_id', e.target.value)} placeholder="2612345678901" />
          </Field>
          <Field label="Snap Pixel" hint="Snap Pixel ID">
            <TextInput value={data.snap_pixel_id || ''} onChange={e => update('snap_pixel_id', e.target.value)} placeholder="abc-123-xyz" />
          </Field>
        </div>
      </Card>

      <Card padding={24}>
        <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: C.text }}>Heatmaps y session recording</h3>
        <p style={{ margin: '0 0 16px', fontSize: 12, color: C.muted }}>Microsoft Clarity es gratis. Hotjar es premium.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          <Field label="Microsoft Clarity Project ID" hint="Gratis e ilimitado. Heatmaps + session recording.">
            <TextInput value={data.clarity_project_id || ''} onChange={e => update('clarity_project_id', e.target.value)} placeholder="abcd1234" />
          </Field>
          <Field label="Hotjar Site ID" hint="ID numérico de tu site en Hotjar.">
            <TextInput value={data.hotjar_site_id || ''} onChange={e => update('hotjar_site_id', e.target.value)} placeholder="3456789" />
          </Field>
        </div>
      </Card>
    </div>
  )
}

function Field({ label, required, hint, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: C.text }}>
        {label} {required && <span style={{ color: C.danger }}>*</span>}
      </label>
      {children}
      {hint && <p style={{ margin: '6px 0 0', fontSize: 12, color: C.muted, lineHeight: 1.5 }}>{hint}</p>}
    </div>
  )
}

function ColorField({ label, value, onChange }) {
  return (
    <div>
      <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: C.text }}>{label}</label>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: 8, background: C.surface, border: `1px solid ${C.border}`, borderRadius: RADIUS.md,
      }}>
        <input type="color" value={value} onChange={e => onChange(e.target.value)}
               style={{ width: 40, height: 40, padding: 0, border: 'none', borderRadius: RADIUS.sm, background: 'transparent', cursor: 'pointer' }} />
        <TextInput value={value} onChange={e => onChange(e.target.value)} style={{ ...mono, flex: 1, fontSize: 12 }} />
      </div>
    </div>
  )
}

function FeaturesEditor({ features, onChange, identity = 'casino' }) {
  const NEW_FEATURE_BY_IDENTITY = {
    casino:      { icon: '⭐', title: 'Nueva feature', desc: 'Descripción corta' },
    tienda:      { icon: '🛍️', title: 'Nueva feature', desc: 'Descripción corta' },
    marketing:   { icon: '📈', title: 'Nueva feature', desc: 'Descripción corta' },
    profesional: { icon: '👔', title: 'Nueva feature', desc: 'Descripción corta' },
  }
  const PH_BY_IDENTITY = {
    casino:      { title: 'Pagos rápidos',    desc: 'Depósitos y retiros con Mercado Pago' },
    tienda:      { title: 'Envíos al país',   desc: 'Recibís el pedido en tu casa' },
    marketing:   { title: 'Estrategia clara', desc: 'Plan a medida según objetivos' },
    profesional: { title: 'Turnos flexibles', desc: 'Reservá fácil por WhatsApp' },
  }
  const newF = NEW_FEATURE_BY_IDENTITY[identity] || NEW_FEATURE_BY_IDENTITY.casino
  const ph   = PH_BY_IDENTITY[identity]          || PH_BY_IDENTITY.casino

  const addFeature = () => onChange([...(features || []), { ...newF }])
  const removeFeature = (idx) => onChange(features.filter((_, i) => i !== idx))
  const updateFeature = (idx, field, value) => onChange(features.map((f, i) => i === idx ? { ...f, [field]: value } : f))
  const move = (idx, dir) => {
    const newIdx = idx + dir
    if (newIdx < 0 || newIdx >= features.length) return
    const next = [...features]
    ;[next[idx], next[newIdx]] = [next[newIdx], next[idx]]
    onChange(next)
  }

  return (
    <Card padding={24}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.text }}>Features de la landing</h3>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: C.muted }}>Bloques destacados con icono, título y descripción.</p>
        </div>
        <Button variant="ghost" size="sm" onClick={addFeature}>+ Agregar feature</Button>
      </div>
      {(!features || features.length === 0) && (
        <div style={{ padding: 24, textAlign: 'center', color: C.muted, fontSize: 14, background: C.surface, borderRadius: RADIUS.md, border: `1px dashed ${C.border}` }}>
          Sin features. Agregá la primera con el botón de arriba.
        </div>
      )}
      {(features || []).map((f, idx) => (
        <div key={idx} style={{
          display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 12,
          padding: 16, marginBottom: 12,
          background: C.surface, border: `1px solid ${C.border}`, borderRadius: RADIUS.md,
        }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: C.muted, marginBottom: 4, textTransform: 'uppercase', ...mono }}>Icono</label>
            <TextInput value={f.icon || ''} onChange={e => updateFeature(idx, 'icon', e.target.value)}
                       style={{ width: 60, textAlign: 'center', fontSize: 22 }} placeholder={newF.icon} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: C.muted, marginBottom: 4, textTransform: 'uppercase', ...mono }}>Título</label>
            <TextInput value={f.title || ''} onChange={e => updateFeature(idx, 'title', e.target.value)} placeholder={ph.title} />
            <label style={{ display: 'block', fontSize: 11, color: C.muted, margin: '8px 0 4px', textTransform: 'uppercase', ...mono }}>Descripción</label>
            <TextArea rows={2} value={f.desc || ''} onChange={e => updateFeature(idx, 'desc', e.target.value)}
                      placeholder={ph.desc} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Button variant="ghost" size="sm" onClick={() => move(idx, -1)} disabled={idx === 0} title="Subir">↑</Button>
            <Button variant="ghost" size="sm" onClick={() => move(idx, 1)} disabled={idx === features.length - 1} title="Bajar">↓</Button>
            <Button variant="ghost" size="sm" onClick={() => removeFeature(idx)} title="Eliminar"
                    style={{ color: C.danger }}>×</Button>
          </div>
        </div>
      ))}
    </Card>
  )
}

function ProductsEditor({ products, catalog, onSave, saving }) {
  const [selected, setSelected] = useState(products)
  const selectedIds = new Set(selected.map(p => p.id))
  const available   = catalog.filter(p => !selectedIds.has(p.id))

  const addProduct = (p) => setSelected([...selected, { ...p, override_title: '', override_description: '' }])
  const removeProduct = (idx) => setSelected(selected.filter((_, i) => i !== idx))
  const move = (idx, dir) => {
    const newIdx = idx + dir
    if (newIdx < 0 || newIdx >= selected.length) return
    const next = [...selected]
    ;[next[idx], next[newIdx]] = [next[newIdx], next[idx]]
    setSelected(next)
  }
  const updateOverride = (idx, field, value) => setSelected(selected.map((p, i) => i === idx ? { ...p, [field]: value } : p))

  return (
    <div>
      <Card padding={24} style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.text }}>Productos en la landing</h3>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: C.muted }}>Estos productos aparecen en tu landing pública. Podés cambiar el orden y editar los textos.</p>
          </div>
          <Button variant="primary" size="md" onClick={() => onSave(selected)} disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar productos'}
          </Button>
        </div>
        {selected.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', color: C.muted, fontSize: 14, background: C.surface, borderRadius: RADIUS.md, border: `1px dashed ${C.border}` }}>
            Aún no agregaste productos a la landing. Elegí del catálogo abajo ↓
          </div>
        )}
        {selected.map((p, idx) => (
          <div key={p.id} style={{
            display: 'grid', gridTemplateColumns: '60px 1fr auto', gap: 12,
            padding: 16, marginBottom: 12,
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: RADIUS.md,
          }}>
            {p.image_url ? (
              <img src={p.image_url} alt={p.name} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: RADIUS.sm }}
                   onError={e => { e.target.style.display = 'none' }} />
            ) : (
              <div style={{ width: 60, height: 60, background: C.bg, borderRadius: RADIUS.sm, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>📦</div>
            )}
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{p.name}</div>
              <div style={{ ...mono, fontSize: 12, color: C.brand, marginBottom: 8 }}>${p.price_ars?.toLocaleString('es-AR')}</div>
              <TextInput style={{ marginBottom: 6, fontSize: 12 }}
                value={p.override_title || ''}
                onChange={e => updateOverride(idx, 'override_title', e.target.value)}
                placeholder={`Título personalizado (default: "${p.name}")`} />
              <TextArea rows={2} style={{ fontSize: 12 }}
                value={p.override_description || ''}
                onChange={e => updateOverride(idx, 'override_description', e.target.value)}
                placeholder="Descripción personalizada para la landing (opcional)" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <Button variant="ghost" size="sm" onClick={() => move(idx, -1)} disabled={idx === 0}>↑</Button>
              <Button variant="ghost" size="sm" onClick={() => move(idx, 1)} disabled={idx === selected.length - 1}>↓</Button>
              <Button variant="ghost" size="sm" onClick={() => removeProduct(idx)} style={{ color: C.danger }}>×</Button>
            </div>
          </div>
        ))}
      </Card>

      {available.length > 0 && (
        <Card padding={24}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: C.text }}>Catálogo disponible</h3>
          <p style={{ margin: '-12px 0 16px', fontSize: 13, color: C.muted }}>Hacé click en + para agregar a la landing.</p>
          {available.map(p => (
            <div key={p.id} style={{
              display: 'grid', gridTemplateColumns: '60px 1fr auto', gap: 12,
              padding: 12, marginBottom: 8,
              background: C.surface, border: `1px solid ${C.border}`, borderRadius: RADIUS.md,
              alignItems: 'center',
            }}>
              {p.image_url ? (
                <img src={p.image_url} alt={p.name} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: RADIUS.sm }}
                     onError={e => { e.target.style.display = 'none' }} />
              ) : (
                <div style={{ width: 60, height: 60, background: C.bg, borderRadius: RADIUS.sm, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>📦</div>
              )}
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{p.name}</div>
                <div style={{ ...mono, fontSize: 12, color: C.brand }}>${p.price_ars?.toLocaleString('es-AR')}</div>
                {p.description && (
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{p.description.slice(0, 80)}{p.description.length > 80 && '…'}</div>
                )}
              </div>
              <Button variant="ghost" size="md" onClick={() => addProduct(p)}>+ Agregar</Button>
            </div>
          ))}
        </Card>
      )}
      {available.length === 0 && catalog.length > 0 && selected.length === catalog.length && (
        <div style={{ padding: 16, textAlign: 'center', color: C.muted, fontSize: 13 }}>Todo tu catálogo ya está en la landing.</div>
      )}
      {catalog.length === 0 && (
        <Banner kind="info">Tu catálogo está vacío. Agregá productos desde la sección "Catálogo" del menú principal.</Banner>
      )}
    </div>
  )
}
