// ═════════════════════════════════════════════════════════════════
// RetailLineas.jsx — Página unificada /mi-cuenta/lineas
// ═════════════════════════════════════════════════════════════════
// Centraliza TODA la configuración de WhatsApp del retail en una sola
// página dedicada. Reemplaza la sección "Línea de WhatsApp" + "Proveedor
// de WhatsApp" que vivían dentro de /mi-cuenta/config.
//
// Estructura:
//   1) Estado actual de la línea — badge con phone + provider activo
//   2) Selector de proveedor — Meta vs Wasender (radio cards)
//   3) Bloque Meta (visible solo si provider=meta)
//      - CTA "Comprar línea oficial" hacia /mi-cuenta/billing
//      - Phone Number ID + Access Token + App Secret + Token Landing
//   4) Bloque Wasender (visible solo si provider=wasender)
//      - Componente <ConectarWhatsApp/> con QR + polling + estados
//   5) ⭐ 2da línea de campañas (28/05/2026) — sección separada al final
//      - Toggle "Tengo una 2da línea dedicada a campañas"
//      - Selector Meta vs Wasender para la 2da línea
//      - Bloque Meta (campaign_wa_phone_id + campaign_wa_token)
//      - Bloque Wasender: <ConectarWhatsApp role="campaigns" embedded />
//
// 11/05/2026 — UX wasender: disclaimer "Conexión no oficial" movido adentro.
// 11/05/2026 — CTA "Comprar línea API" reubicado wasender → meta.
// 12/05/2026 — Quitar banner "Conexión no oficial".
// 12/05/2026 — Lock por días activos vía DaysLockedOverlay.
// 28/05/2026 — Sección 2da línea (campañas) self-service para retail.
// ═════════════════════════════════════════════════════════════════
import { useEffect, useState, useCallback } from 'react'
import { Link as NavLink } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import {
  PageHeader, SectionHeader, Card, Button, Banner,
  COLORS as C, RADIUS, FONT_SIZE, FONT_WEIGHT, FONT, TRANSITION,
} from '../../components/ui'
import SecretField from '../../components/SecretField'
import Icon from '../../components/Icon'
import ConectarWhatsApp from '../ConectarWhatsApp'
import DaysLockedOverlay from '../../components/DaysLockedOverlay'

const SB_URL = import.meta.env.VITE_SUPABASE_URL || 'https://dvzxkortcvuakjhsidrr.supabase.co'

const fi = {
  width: '100%',
  background: C.bg,
  border: `1px solid ${C.border}`,
  borderRadius: RADIUS.md,
  padding: '10px 12px',
  color: C.text,
  fontSize: FONT_SIZE.base,
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
}

function FieldMini({ label, hint, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{
        fontSize: FONT_SIZE.xs,
        color: C.muted,
        textTransform: 'uppercase',
        letterSpacing: '.08em',
        display: 'block',
        marginBottom: 5,
        fontFamily: FONT.mono,
        fontWeight: FONT_WEIGHT.semibold,
      }}>{label}</label>
      {children}
      {hint && (
        <p style={{
          fontSize: FONT_SIZE.sm,
          color: C.muted,
          margin: '4px 0 0',
          lineHeight: 1.45,
        }}>{hint}</p>
      )}
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════
// CTA hacia /mi-cuenta/billing — promoción de comprar línea WhatsApp API
// ═════════════════════════════════════════════════════════════════
function BuyWaLineCta() {
  return (
    <NavLink
      to="/mi-cuenta/billing"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        marginBottom: 18,
        borderRadius: RADIUS.md,
        background: `${C.brand}10`,
        border: `1px solid ${C.brand}40`,
        color: C.brand,
        textDecoration: 'none',
        transition: TRANSITION,
        cursor: 'pointer',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = `${C.brand}1c`
        e.currentTarget.style.borderColor = `${C.brand}70`
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = `${C.brand}10`
        e.currentTarget.style.borderColor = `${C.brand}40`
      }}
    >
      <span style={{ fontSize: 22, flexShrink: 0 }}>📱</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: FONT_SIZE.base,
          fontWeight: FONT_WEIGHT.bold,
          marginBottom: 2,
        }}>
          ¿Querés que te activemos una línea oficial de WhatsApp API?
        </div>
        <div style={{
          fontSize: FONT_SIZE.sm,
          color: C.muted,
          lineHeight: 1.45,
        }}>
          Comprala desde <strong style={{ color: C.brand }}>Saldo</strong> — activación oficial Meta, sin riesgo de baneo.
        </div>
      </div>
      <span style={{
        fontSize: 18,
        flexShrink: 0,
        fontWeight: FONT_WEIGHT.bold,
      }}>→</span>
    </NavLink>
  )
}

// ═════════════════════════════════════════════════════════════════
// SELECTOR DE PROVIDER (radio cards)
// ═════════════════════════════════════════════════════════════════
function ProviderSelector({ value, onChange, disabled }) {
  return (
    <div style={{
      display: 'flex',
      gap: 10,
      flexWrap: 'wrap',
    }}>
      {[
        {
          v: 'meta',
          label: 'WhatsApp API',
          desc: 'Conexión oficial vía Meta Cloud API. Requiere número aprobado por Meta Business.',
          icon: '✅',
        },
        {
          v: 'wasender',
          label: 'WA',
          desc: 'Conexión vía QR (como WhatsApp Web). Más rápido de configurar, sujeto a baneos.',
          icon: '⚡',
        },
      ].map(opt => {
        const active = value === opt.v
        return (
          <button
            key={opt.v}
            type="button"
            onClick={() => !disabled && onChange(opt.v)}
            disabled={disabled}
            style={{
              flex: '1 1 240px',
              padding: '14px 16px',
              borderRadius: RADIUS.md,
              border: `2px solid ${active ? C.brand : C.border}`,
              background: active ? `${C.brand}10` : C.surface,
              color: active ? C.brand : C.text,
              fontSize: FONT_SIZE.base,
              fontWeight: active ? FONT_WEIGHT.semibold : FONT_WEIGHT.medium,
              cursor: disabled ? 'wait' : 'pointer',
              fontFamily: 'inherit',
              textAlign: 'left',
              transition: TRANSITION,
              opacity: disabled ? 0.6 : 1,
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 6,
            }}>
              <span style={{ fontSize: 18 }}>{opt.icon}</span>
              <span style={{ fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold }}>
                {opt.label}
              </span>
              {active && (
                <span style={{
                  marginLeft: 'auto',
                  fontSize: FONT_SIZE.xs,
                  fontFamily: FONT.mono,
                  color: C.brand,
                  background: `${C.brand}22`,
                  padding: '2px 8px',
                  borderRadius: 999,
                  letterSpacing: '.05em',
                  textTransform: 'uppercase',
                  fontWeight: FONT_WEIGHT.bold,
                }}>activo</span>
              )}
            </div>
            <div style={{
              fontSize: FONT_SIZE.sm,
              color: active ? C.brand : C.muted,
              fontWeight: FONT_WEIGHT.normal,
              lineHeight: 1.45,
            }}>{opt.desc}</div>
          </button>
        )
      })}
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════
// BLOQUE META (Phone Number ID + secrets) — línea BOT
// ═════════════════════════════════════════════════════════════════
function MetaBlock({ retail, onChanged }) {
  const [form, setForm] = useState({
    wa_phone_id:               retail?.wa_phone_id || '',
    wa_token:                  '',
    meta_app_secret:           '',
    meta_access_token_landing: '',
  })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    setForm(f => ({
      ...f,
      wa_phone_id: retail?.wa_phone_id || '',
    }))
  }, [retail?.wa_phone_id])

  const setField = (k) => (e) => {
    const v = e?.target?.value ?? e
    setForm(f => ({ ...f, [k]: v }))
  }

  const save = async () => {
    setSaving(true); setMsg('')
    try {
      if ((form.wa_phone_id || '') !== (retail?.wa_phone_id || '')) {
        const { error } = await supabase.rpc('update_my_retail_settings', {
          p_patch: { wa_phone_id: form.wa_phone_id || null },
        })
        if (error) throw error
      }

      const platformParams = {}
      if (form.wa_token)                  platformParams.p_wa_token                  = form.wa_token
      if (form.meta_app_secret)           platformParams.p_meta_app_secret           = form.meta_app_secret
      if (form.meta_access_token_landing) platformParams.p_meta_access_token_landing = form.meta_access_token_landing
      if (Object.keys(platformParams).length > 0) {
        const { error } = await supabase.rpc('set_my_retail_platform_secrets', platformParams)
        if (error) throw error
      }

      await onChanged?.()
      setForm(f => ({
        ...f,
        wa_token: '',
        meta_app_secret: '',
        meta_access_token_landing: '',
      }))
      setMsg('✓ Guardado')
      setTimeout(() => setMsg(''), 2500)
    } catch (e) {
      setMsg('⚠ ' + (e.message || 'Error'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <BuyWaLineCta />

      <p style={{
        fontSize: FONT_SIZE.sm,
        color: C.muted,
        margin: '0 0 16px',
        lineHeight: 1.55,
      }}>
        Conexión oficial vía Meta Cloud API. Necesitás una cuenta de Meta Business y un número
        aprobado en WhatsApp Cloud API. Configurá los datos abajo, y después tu número va a
        empezar a recibir mensajes.
      </p>

      <FieldMini
        label="Phone Number ID"
        hint="Numérico. Lo encontrás en Meta Business → WhatsApp → Configuración de la API"
      >
        <input
          value={form.wa_phone_id}
          onChange={setField('wa_phone_id')}
          style={{ ...fi, fontFamily: FONT.mono }}
          placeholder="1074031509123105"
        />
      </FieldMini>

      <SecretField
        label="Access Token de WhatsApp Cloud API"
        hasValue={!!retail?.has_wa_token}
        value={form.wa_token}
        onChange={(e) => setForm(f => ({ ...f, wa_token: e.target.value }))}
        placeholder="EAAxxxxxxxxxxx..."
        hint="Token permanente del System User. Se cifra al guardarse."
        helpUrl="https://business.facebook.com/wa/manage/phone-numbers"
        helpText="Ir a Meta Business →"
        provider="meta"
      />

      <div style={{ marginTop: 14 }}>
        <SecretField
          label="App Secret (opcional)"
          hasValue={!!retail?.has_meta_app_secret}
          value={form.meta_app_secret}
          onChange={(e) => setForm(f => ({ ...f, meta_app_secret: e.target.value }))}
          placeholder="abc123..."
          hint="Para validar firmas X-Hub-Signature de Meta. Solo necesario si activás verificación de firma."
          provider="meta"
        />
      </div>

      <div style={{ marginTop: 14 }}>
        <SecretField
          label="Access Token de Landing (opcional)"
          hasValue={!!retail?.has_meta_access_token_landing}
          value={form.meta_access_token_landing}
          onChange={(e) => setForm(f => ({ ...f, meta_access_token_landing: e.target.value }))}
          placeholder="EAAxxxxxxxxxxx..."
          hint="Token específico para campañas que disparan eventos desde tu landing. Si está vacío, se usa el Access Token principal."
          provider="meta"
        />
      </div>

      {!retail?.wa_phone_id && (
        <div style={{
          background: 'rgba(251, 191, 36, 0.08)',
          border: `1px solid rgba(251, 191, 36, 0.35)`,
          borderRadius: 8,
          padding: '10px 12px',
          marginTop: 14,
          fontSize: FONT_SIZE.sm,
          color: '#fbbf24',
          lineHeight: 1.5,
        }}>
          <Icon e="⚠️"/> Sin Phone Number ID configurado, el bot no puede recibir mensajes.
          Cargalo y guardá los cambios para activar tu línea.
        </div>
      )}

      <div style={{
        marginTop: 18,
        paddingTop: 16,
        borderTop: `1px solid ${C.border}`,
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: 12,
      }}>
        {msg && (
          <span style={{
            fontSize: FONT_SIZE.md,
            color: msg.startsWith('✓') ? C.success : C.warning,
            fontWeight: FONT_WEIGHT.semibold,
          }}>{msg}</span>
        )}
        <Button
          variant="primary"
          onClick={save}
          disabled={saving}
          loading={saving}
        >
          {saving ? 'Guardando…' : 'Guardar configuración Meta'}
        </Button>
      </div>
    </div>
  )
}


// ═════════════════════════════════════════════════════════════════
// ⭐ 2da LÍNEA — sección self-service para retail (28/05/2026)
// ═════════════════════════════════════════════════════════════════
// Lee estado de get_my_wa_link_status (sub-obj campaign_line) + retail.
// Permite:
//   1) Habilitar/deshabilitar la 2da línea (toggle campaign_line_enabled)
//   2) Elegir provider (Meta o Wasender)
//   3) Cargar creds Meta vía RPC set_my_campaign_line_meta_creds
//   4) Vincular Wasender vía <ConectarWhatsApp role="campaigns" />
// ═════════════════════════════════════════════════════════════════
function CampaignLineSection({ retail, refreshRetail }) {
  const [campaignState, setCampaignState] = useState({ loading: true })
  const [savingProvider, setSavingProvider] = useState(false)
  const [savingMeta, setSavingMeta] = useState(false)
  const [savingToggle, setSavingToggle] = useState(false)
  const [metaForm, setMetaForm] = useState({ wa_phone_id: '', wa_token: '' })
  const [msg, setMsg] = useState('')

  // Cargar el estado de la 2da línea desde get_my_wa_link_status
  const loadCampaignState = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_my_wa_link_status')
      if (error) throw error
      const c = data?.campaign_line || {}
      setCampaignState({
        loading: false,
        enabled: !!c.enabled,
        provider: c.wa_provider || null,
        phone: c.phone || null,
        sessionStatus: c.status || 'not_initialized',
        hasSession: !!c.has_session,
        hasWaToken: !!c.has_wa_token,
      })
      setMetaForm(f => ({
        ...f,
        wa_phone_id: retail?.campaign_wa_phone_id || '',
      }))
    } catch (e) {
      console.error('[CampaignLineSection] load error:', e)
      setCampaignState({ loading: false, error: e.message })
    }
  }, [retail?.campaign_wa_phone_id])

  useEffect(() => { loadCampaignState() }, [loadCampaignState])

  // Toggle habilitar/deshabilitar la 2da línea
  const toggleEnabled = async () => {
    setSavingToggle(true); setMsg('')
    try {
      const newValue = !campaignState.enabled
      const { error } = await supabase.rpc('update_my_retail_settings', {
        p_patch: { campaign_line_enabled: newValue },
      })
      if (error) throw error
      await refreshRetail?.()
      await loadCampaignState()
      setMsg(newValue ? '✓ 2da línea habilitada' : '✓ 2da línea deshabilitada')
      setTimeout(() => setMsg(''), 2500)
    } catch (e) {
      setMsg('⚠ ' + (e.message || 'Error'))
    } finally {
      setSavingToggle(false)
    }
  }

  // Cambiar provider de la 2da línea
  const switchProvider = async (newProvider) => {
    if (newProvider === campaignState.provider) return
    setSavingProvider(true); setMsg('')
    try {
      const { error } = await supabase.rpc('update_my_retail_settings', {
        p_patch: { campaign_wa_provider: newProvider },
      })
      if (error) throw error
      await refreshRetail?.()
      await loadCampaignState()
      setMsg(`✓ Provider cambiado a ${newProvider === 'meta' ? 'WhatsApp API' : 'WA'}`)
      setTimeout(() => setMsg(''), 2500)
    } catch (e) {
      setMsg('⚠ ' + (e.message || 'Error'))
    } finally {
      setSavingProvider(false)
    }
  }

  // Guardar creds Meta de la 2da línea
  const saveMetaCreds = async () => {
    setSavingMeta(true); setMsg('')
    try {
      const params = {}
      if ((metaForm.wa_phone_id || '') !== (retail?.campaign_wa_phone_id || '')) {
        params.p_wa_phone_id = metaForm.wa_phone_id || ''
      }
      if (metaForm.wa_token) {
        params.p_wa_token = metaForm.wa_token
      }
      if (Object.keys(params).length === 0) {
        setMsg('⚠ No hay cambios para guardar')
        setSavingMeta(false)
        return
      }
      const { error } = await supabase.rpc('set_my_campaign_line_meta_creds', params)
      if (error) throw error
      await refreshRetail?.()
      await loadCampaignState()
      setMetaForm(f => ({ ...f, wa_token: '' }))
      setMsg('✓ Guardado')
      setTimeout(() => setMsg(''), 2500)
    } catch (e) {
      setMsg('⚠ ' + (e.message || 'Error'))
    } finally {
      setSavingMeta(false)
    }
  }

  if (campaignState.loading) {
    return (
      <Card padding={18}>
        <div style={{ color: C.muted, textAlign: 'center' }}>Cargando estado 2da línea…</div>
      </Card>
    )
  }

  // ─── Estado: deshabilitada ─────────────────────────────────
  if (!campaignState.enabled) {
    return (
      <Card padding={0} style={{ overflow: 'hidden' }}>
        <div style={{
          padding: '14px 18px',
          borderBottom: `1px solid ${C.border}`,
          background: 'rgba(232, 181, 71, 0.06)',
        }}>
          <SectionHeader
            title="📢 2da línea para campañas"
            style={{ margin: 0 }}
          />
        </div>
        <div style={{ padding: 22 }}>
          <p style={{
            fontSize: FONT_SIZE.base,
            color: C.text,
            margin: '0 0 12px',
            lineHeight: 1.55,
          }}>
            ¿Querés mandar campañas desde un <strong>número distinto</strong> al de tu bot?
          </p>
          <p style={{
            fontSize: FONT_SIZE.sm,
            color: C.muted,
            margin: '0 0 20px',
            lineHeight: 1.6,
            maxWidth: 640,
          }}>
            Vinculá una 2da línea de WhatsApp dedicada solo a envío de campañas.
            El bot va a seguir contestando los mensajes que lleguen a tu número principal —
            la 2da línea es solo para mandar (los mensajes que lleguen a ella se ignoran,
            no aparecen en tu panel).
            <br /><br />
            Si no la activás, las campañas salen por tu número principal (comportamiento actual).
          </p>
          <Button
            variant="primary"
            onClick={toggleEnabled}
            disabled={savingToggle}
            loading={savingToggle}
          >
            {savingToggle ? 'Activando…' : '🚀 Activar 2da línea de campañas'}
          </Button>
          {msg && (
            <div style={{
              marginTop: 14,
              fontSize: FONT_SIZE.sm,
              color: msg.startsWith('✓') ? C.success : C.warning,
              fontWeight: FONT_WEIGHT.semibold,
            }}>{msg}</div>
          )}
        </div>
      </Card>
    )
  }

  // ─── Estado: habilitada ─────────────────────────────────────
  const currentProvider = campaignState.provider || 'meta'

  return (
    <div>
      <Card padding={0} style={{ overflow: 'hidden', marginBottom: 16 }}>
        <div style={{
          padding: '14px 18px',
          borderBottom: `1px solid ${C.border}`,
          background: 'rgba(232, 181, 71, 0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}>
          <SectionHeader
            title="📢 2da línea para campañas"
            style={{ margin: 0 }}
          />
          <Button
            variant="ghost"
            onClick={toggleEnabled}
            disabled={savingToggle}
          >
            {savingToggle ? 'Desactivando…' : 'Desactivar 2da línea'}
          </Button>
        </div>

        <div style={{ padding: 18 }}>
          <div style={{
            padding: '10px 14px',
            background: 'rgba(232, 181, 71, 0.08)',
            border: `1px solid rgba(232, 181, 71, 0.35)`,
            borderRadius: RADIUS.md,
            marginBottom: 18,
            fontSize: FONT_SIZE.sm,
            color: C.text,
            lineHeight: 1.55,
          }}>
            <strong style={{ color: '#E8B547' }}>2da línea activa.</strong>{' '}
            Las campañas van a salir por esta línea (no por tu número principal del bot).
            Los mensajes que lleguen a este número NO se procesan ni aparecen en tu panel.
          </div>

          <p style={{
            fontSize: FONT_SIZE.xs,
            color: C.muted,
            textTransform: 'uppercase',
            letterSpacing: '.08em',
            fontWeight: FONT_WEIGHT.semibold,
            margin: '0 0 8px',
            fontFamily: FONT.mono,
          }}>Proveedor de la 2da línea</p>

          <ProviderSelector
            value={currentProvider}
            onChange={switchProvider}
            disabled={savingProvider}
          />

          {msg && (
            <div style={{
              marginTop: 12,
              fontSize: FONT_SIZE.sm,
              color: msg.startsWith('✓') ? C.success : C.warning,
              fontWeight: FONT_WEIGHT.semibold,
            }}>{msg}</div>
          )}
        </div>
      </Card>

      {/* Bloque Meta de la 2da línea */}
      {currentProvider === 'meta' && (
        <Card padding={18} style={{ marginBottom: 16 }}>
          <SectionHeader
            title="✅ Configurar línea Meta (campañas)"
            style={{ marginBottom: 8 }}
          />
          <p style={{
            fontSize: FONT_SIZE.sm,
            color: C.muted,
            margin: '0 0 16px',
            lineHeight: 1.55,
          }}>
            Cargá los datos de un número Meta dedicado a envío de campañas.
            <strong> Tiene que ser distinto al de tu línea bot.</strong>
          </p>

          <FieldMini
            label="Phone Number ID (2da línea)"
            hint="Numérico. Distinto al de tu línea principal."
          >
            <input
              value={metaForm.wa_phone_id}
              onChange={(e) => setMetaForm(f => ({ ...f, wa_phone_id: e.target.value }))}
              style={{ ...fi, fontFamily: FONT.mono }}
              placeholder="9876543210987654"
            />
          </FieldMini>

          <SecretField
            label="Access Token (2da línea)"
            hasValue={!!campaignState.hasWaToken}
            value={metaForm.wa_token}
            onChange={(e) => setMetaForm(f => ({ ...f, wa_token: e.target.value }))}
            placeholder="EAAxxxxxxxxxxx..."
            hint="Token del System User asociado a la 2da línea. Se cifra al guardarse."
            provider="meta"
          />

          <div style={{
            marginTop: 18,
            paddingTop: 16,
            borderTop: `1px solid ${C.border}`,
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 12,
          }}>
            <Button
              variant="primary"
              onClick={saveMetaCreds}
              disabled={savingMeta}
              loading={savingMeta}
            >
              {savingMeta ? 'Guardando…' : 'Guardar línea Meta'}
            </Button>
          </div>
        </Card>
      )}

      {/* Bloque Wasender de la 2da línea — reutiliza ConectarWhatsApp con role */}
      {currentProvider === 'wasender' && (
        <Card padding={0} style={{ marginBottom: 16, overflow: 'hidden' }}>
          <div style={{
            padding: '14px 18px',
            borderBottom: `1px solid ${C.border}`,
            background: C.surface,
          }}>
            <SectionHeader
              title="⚡ Vincular línea Wasender (campañas)"
              style={{ margin: 0 }}
            />
          </div>
          <div style={{ padding: 18 }}>
            <ConectarWhatsApp role="campaigns" embedded />
          </div>
        </Card>
      )}
    </div>
  )
}


// ═════════════════════════════════════════════════════════════════
// BADGE DE ESTADO ACTUAL (línea BOT)
// ═════════════════════════════════════════════════════════════════
function CurrentStatusBadge({ retail }) {
  const provider = retail?.wa_provider || 'meta'
  const isMeta = provider === 'meta'
  const isWasender = provider === 'wasender'

  const metaConnected = isMeta && !!retail?.wa_phone_id && !!retail?.has_wa_token
  const wasenderConnected = isWasender && retail?.wasender_session_status === 'connected'
  const isConnected = metaConnected || wasenderConnected

  let bg, color, icon, title, subtitle
  if (isConnected) {
    bg = 'rgba(74, 222, 128, 0.1)'
    color = '#4ade80'
    icon = '✅'
    title = isMeta ? 'WhatsApp API conectado' : 'WA conectado'
    if (isMeta && retail?.wa_phone_id) {
      subtitle = `Phone ID: ${retail.wa_phone_id}`
    } else if (isWasender && retail?.wasender_phone) {
      subtitle = `+${retail.wasender_phone}`
    } else {
      subtitle = 'Listo para recibir y enviar mensajes'
    }
  } else {
    bg = 'rgba(251, 146, 60, 0.1)'
    color = '#fb923c'
    icon = '⚠️'
    title = `${isMeta ? 'WhatsApp API' : 'WA'} sin conectar`
    subtitle = `Configurá tu ${isMeta ? 'línea Meta' : 'conexión por QR'} más abajo para activar el bot.`
  }

  return (
    <div style={{
      background: bg,
      border: `1px solid ${color}55`,
      borderRadius: 12,
      padding: '14px 18px',
      marginBottom: 22,
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      flexWrap: 'wrap',
    }}>
      <span style={{ fontSize: 24, flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{
          fontSize: FONT_SIZE.base,
          fontWeight: FONT_WEIGHT.bold,
          color,
          marginBottom: 2,
        }}>{title}</div>
        <div style={{
          fontSize: FONT_SIZE.sm,
          color: C.muted,
          fontFamily: subtitle?.startsWith('Phone ID') || subtitle?.startsWith('+') ? FONT.mono : 'inherit',
          lineHeight: 1.4,
        }}>{subtitle}</div>
      </div>
      <div style={{
        fontSize: FONT_SIZE.xs,
        fontFamily: FONT.mono,
        color: C.muted,
        textTransform: 'uppercase',
        letterSpacing: '.08em',
        fontWeight: FONT_WEIGHT.semibold,
      }}>
        Proveedor: <strong style={{ color: C.brand }}>{isMeta ? 'WhatsApp API' : 'WA'}</strong>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════
// MAIN
// ═════════════════════════════════════════════════════════════════
export default function RetailLineas() {
  const { retail, refreshRetail } = useAuth()
  const [providerSwitching, setProviderSwitching] = useState(false)
  const [msg, setMsg] = useState('')

  if (!retail) {
    return (
      <div>
        <PageHeader eyebrow="Líneas" title="Líneas de WhatsApp" />
        <Card padding={32}>
          <div style={{ color: C.muted, textAlign: 'center' }}>Cargando…</div>
        </Card>
      </div>
    )
  }

  const currentProvider = retail?.wa_provider || 'meta'

  const switchProvider = async (newProvider) => {
    if (newProvider === currentProvider) return
    setProviderSwitching(true); setMsg('')
    try {
      const { error } = await supabase.rpc('set_my_retail_wa_provider', {
        p_wa_provider: newProvider,
        p_wasender_session_id: retail?.wasender_session_id || '',
      })
      if (error) throw error
      await refreshRetail?.()
      setMsg(`✓ Cambiado a ${newProvider === 'meta' ? 'WhatsApp API' : 'WA'}`)
      setTimeout(() => setMsg(''), 2500)
    } catch (e) {
      setMsg('⚠ ' + (e.message || 'Error al cambiar proveedor'))
    } finally {
      setProviderSwitching(false)
    }
  }

  return (
    <DaysLockedOverlay featureName="Líneas de WhatsApp">
    <div>
      <PageHeader
        eyebrow="Líneas"
        title="Líneas de WhatsApp"
        subtitle="Acá configurás cómo se conecta tu WhatsApp al bot. Elegí entre la API oficial de Meta o conexión por QR (más simple, pero no oficial)."
      />

      <CurrentStatusBadge retail={retail} />

      {/* ─── 1) SELECTOR DE PROVIDER (línea BOT) ─────────────── */}
      <Card padding={18} style={{ marginBottom: 16 }}>
        <SectionHeader
          title="🔌 Proveedor de la línea bot"
          style={{ marginBottom: 8 }}
        />
        <p style={{
          fontSize: FONT_SIZE.sm,
          color: C.muted,
          margin: '0 0 16px',
          lineHeight: 1.55,
        }}>
          Elegí cómo se conecta tu línea principal del bot. Podés cambiar en cualquier momento;
          tus credenciales del otro proveedor se mantienen guardadas.
        </p>

        <ProviderSelector
          value={currentProvider}
          onChange={switchProvider}
          disabled={providerSwitching}
        />

        {msg && (
          <div style={{
            marginTop: 12,
            fontSize: FONT_SIZE.sm,
            color: msg.startsWith('✓') ? C.success : C.warning,
            fontWeight: FONT_WEIGHT.semibold,
          }}>{msg}</div>
        )}
      </Card>

      {/* ─── 2) BLOQUE META (línea BOT, si provider=meta) ────────── */}
      {currentProvider === 'meta' && (
        <Card padding={18} style={{ marginBottom: 16 }}>
          <SectionHeader
            title="✅ Configuración WhatsApp API (Meta)"
            style={{ marginBottom: 8 }}
          />
          <MetaBlock retail={retail} onChanged={refreshRetail} />
        </Card>
      )}

      {/* ─── 3) BLOQUE QR (línea BOT, si provider=wasender) ──────── */}
      {currentProvider === 'wasender' && (
        <Card padding={0} style={{ marginBottom: 16, overflow: 'hidden' }}>
          <div style={{
            padding: '14px 18px',
            borderBottom: `1px solid ${C.border}`,
            background: C.surface,
          }}>
            <SectionHeader
              title="⚡ Vincular WhatsApp por QR"
              style={{ margin: 0 }}
            />
          </div>
          <div style={{ padding: 18 }}>
            <ConectarWhatsApp />
          </div>
        </Card>
      )}

      {/* ─── 4) AYUDA ──────────────────────────────────────── */}
      <Card padding={18} style={{ background: C.surface, marginBottom: 24 }}>
        <SectionHeader
          title="❓ ¿Cuál elijo?"
          style={{ marginBottom: 10 }}
        />
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 16,
        }}>
          <div>
            <p style={{
              fontSize: FONT_SIZE.base,
              fontWeight: FONT_WEIGHT.bold,
              color: C.brand,
              margin: '0 0 6px',
            }}>✅ WhatsApp API (Meta)</p>
            <ul style={{
              margin: 0,
              paddingLeft: 18,
              fontSize: FONT_SIZE.sm,
              color: C.text,
              lineHeight: 1.6,
            }}>
              <li>Conexión oficial, estable a largo plazo</li>
              <li>Sin riesgo de baneo si seguís las políticas</li>
              <li>Requiere aprobación de Meta Business (puede tardar días)</li>
              <li>Recomendado si tu negocio depende del bot</li>
            </ul>
          </div>
          <div>
            <p style={{
              fontSize: FONT_SIZE.base,
              fontWeight: FONT_WEIGHT.bold,
              color: C.brand,
              margin: '0 0 6px',
            }}>⚡ WA por QR</p>
            <ul style={{
              margin: 0,
              paddingLeft: 18,
              fontSize: FONT_SIZE.sm,
              color: C.text,
              lineHeight: 1.6,
            }}>
              <li>Conectás escaneando un QR — al toque</li>
              <li>Funciona con cualquier WhatsApp normal</li>
              <li>Meta puede banear el número sin aviso</li>
              <li>Recomendado para probar o casos de bajo volumen</li>
            </ul>
          </div>
        </div>
        <p style={{
          fontSize: FONT_SIZE.xs,
          color: C.muted,
          margin: '14px 0 0',
          lineHeight: 1.5,
        }}>
          ¿Necesitás ayuda? Escribinos a{' '}
          <NavLink to="/mi-cuenta/instrucciones" style={{ color: C.brand, fontWeight: FONT_WEIGHT.semibold }}>
            Instrucciones
          </NavLink>
          {' '}o desde el menú de soporte.
        </p>
      </Card>

      {/* ─── 5) ⭐ 2da LÍNEA DE CAMPAÑAS (28/05/2026) ────────────── */}
      <div style={{
        marginTop: 32,
        marginBottom: 16,
        paddingTop: 24,
        borderTop: `2px solid ${C.border}`,
      }}>
        <div style={{ marginBottom: 16 }}>
          <p style={{
            fontSize: FONT_SIZE.xs,
            color: '#E8B547',
            textTransform: 'uppercase',
            letterSpacing: '.1em',
            fontWeight: FONT_WEIGHT.bold,
            margin: '0 0 4px',
            fontFamily: FONT.mono,
          }}>2da línea — opcional</p>
          <h2 style={{
            fontSize: 22,
            fontWeight: FONT_WEIGHT.bold,
            color: C.text,
            margin: 0,
          }}>📢 Línea dedicada a campañas</h2>
        </div>
        <CampaignLineSection retail={retail} refreshRetail={refreshRetail} />
      </div>
    </div>
    </DaysLockedOverlay>
  )
}
