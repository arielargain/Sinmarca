import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import {
  COLORS as C, RADIUS, FONT_SIZE, FONT_WEIGHT, FONT, TRANSITION, Z,
} from '../../components/ui'
import OnboardingChat from './OnboardingChat'

// v1.0 (15/05/2026) — Onboarding retail premium con chat IA lateral
// 6 pasos guiados, chat IA contextualizado, persistencia en BD

const STEPS = [
  {
    id: 0,
    title: 'Bienvenido a Innovate IA',
    eyebrow: 'EMPECEMOS',
    icon: '👋',
    description: 'En 10 minutos vas a tener tu bot atendiendo clientes 24/7.',
    body: 'subtitle',
  },
  {
    id: 1,
    title: 'Conectá WhatsApp',
    eyebrow: 'PASO 1',
    icon: '💬',
    description: 'Sin WhatsApp el bot no responde. Tenés 2 opciones: QR (rápido) o API oficial Meta.',
    cta: { label: 'Configurar WhatsApp →', path: '/mi-cuenta/lineas' },
    autoCheck: (retail) => !!retail?.wa_phone_id || !!retail?.has_wasender_session,
  },
  {
    id: 2,
    title: 'Elegí tu identidad',
    eyebrow: 'PASO 2',
    icon: '🎯',
    description: 'Cambia cómo habla el bot y qué herramientas ves en el panel.',
    body: 'identity-picker',
    autoCheck: (retail) => !!retail?.identity && retail?.identity !== 'casino',
  },
  // 15/05/2026 — paso 3 NUEVO: billetera de cobro
  {
    id: 3,
    title: 'Conectá tu billetera',
    eyebrow: 'PASO 3',
    icon: '💳',
    description: 'Para que el bot pueda generar links de pago a tus clientes. Soportamos Mercado Pago, Ualá, MODO, Lemon y Belo.',
    cta: { label: 'Configurar billetera →', path: '/mi-cuenta/config' },
    autoCheck: (retail) => !!retail?.wallet_provider_set,
  },
  // 15/05/2026 — paso 4: datos del negocio (wizard inline, sin salir del onboarding)
  {
    id: 4,
    title: 'Configurá tu negocio',
    eyebrow: 'PASO 4',
    icon: '🏢',
    description: 'Llená los datos básicos. Vamos a guardarlos automáticamente.',
    body: 'business-form',
    autoCheck: (retail) => !!retail?.business_configured,
  },
  {
    id: 5,
    title: 'Personalizá tu bot',
    eyebrow: 'PASO 5',
    icon: '🤖',
    description: 'Definí cómo te presenta y qué responde. Lo guardamos automáticamente.',
    body: 'bot-form',
    autoCheck: (retail) => !!retail?.bot_welcome_message || retail?.bot_prompt_set,
  },
  {
    id: 6,
    title: 'Activá tu saldo',
    eyebrow: 'PASO 6',
    icon: '⚡',
    description: 'Cada día de bot consume 1 crédito. Elegí el plan que mejor encaje con vos.',
    cta: { label: 'Ver planes →', path: '/mi-cuenta/billing' },
    autoCheck: (retail) => {
      if (!retail?.activated_until) return false
      return new Date(retail.activated_until).getTime() > Date.now()
    },
  },
  {
    id: 7,
    title: '¡Listo! 🎉',
    eyebrow: 'TERMINASTE',
    icon: '🎊',
    description: 'Tu bot está armado. Te recomendamos probarlo enviándole un mensaje a tu propio número.',
    body: 'final',
  },
]

const IDENTITIES = [
  { key: 'casino',      label: 'Casino',       icon: '🎰', desc: 'Usuarios, balance, links de pago' },
  { key: 'tienda',      label: 'Tienda',       icon: '🛍️', desc: 'Productos, pedidos, catálogo' },
  { key: 'profesional', label: 'Profesional',  icon: '👔', desc: 'Agenda de turnos, servicios' },
  { key: 'marketing',   label: 'Marketing',    icon: '📣', desc: 'Leads, campañas, captura' },
]

export default function RetailOnboarding() {
  const { retail, refreshRetail } = useAuth()
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState([])
  const [retailData, setRetailData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isCompleted, setIsCompleted] = useState(false)
  const [savingIdentity, setSavingIdentity] = useState(false)
  const [error, setError] = useState(null)

  // Load inicial
  // 15/05/2026 — Si el onboarding ya esta completed o skipped, reset automatico
  // para que el cliente pueda repetir el recorrido. Antes redirigia a /mi-cuenta.
  const loadOnboarding = useCallback(async () => {
    setLoading(true)
    try {
      let { data, error: rpcErr } = await supabase.rpc('get_my_retail_onboarding')
      if (rpcErr) throw rpcErr
      if (data?.error) {
        if (data.error === 'not_a_retail') {
          navigate('/mi-cuenta', { replace: true })
          return
        }
        throw new Error(data.error)
      }

      // Si ya completo o salteo, resetear automaticamente y volver a cargar.
      // Tambien limpio el flag de redirect-once para que la proxima vez que
      // entre al panel desde otra URL, el guard pueda redirigir si corresponde.
      if (data?.is_completed || data?.is_skipped) {
        try {
          await supabase.rpc('reset_my_onboarding')
          try { sessionStorage.removeItem('innovate_onboarding_redirected_v1') } catch {}
        } catch (e) {
          console.error('reset_my_onboarding failed:', e)
        }
        // Re-cargar estado post-reset
        const { data: fresh, error: freshErr } = await supabase.rpc('get_my_retail_onboarding')
        if (freshErr) throw freshErr
        data = fresh
      }

      setRetailData(data?.retail || null)
      const prog = data?.progress || {}
      setCurrentStep(Number(prog.current_step) || 0)
      setCompletedSteps(Array.isArray(prog.completed_steps) ? prog.completed_steps : [])
    } catch (e) {
      setError(e.message || 'Error cargando onboarding')
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => { loadOnboarding() }, [loadOnboarding])

  // Auto-check: si un paso tiene autoCheck y el retail cumple, marcarlo
  useEffect(() => {
    if (!retailData || loading) return
    const step = STEPS[currentStep]
    if (step?.autoCheck && step.autoCheck(retailData) && !completedSteps.includes(currentStep)) {
      markStepDone(currentStep)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retailData, currentStep, loading])

  async function markStepDone(stepId) {
    try {
      const { data, error } = await supabase.rpc('mark_onboarding_step_done', { p_step: stepId })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      setCompletedSteps(prev => prev.includes(stepId) ? prev : [...prev, stepId])
    } catch (e) {
      console.error('mark_onboarding_step_done failed:', e)
    }
  }

  async function handleSkip() {
    if (!window.confirm('¿Saltar el onboarding? Podés volver a /mi-cuenta/bienvenida cuando quieras.')) return
    try {
      await supabase.rpc('skip_onboarding')
      navigate('/mi-cuenta', { replace: true })
    } catch (e) {
      setError('No pudimos guardar. ' + e.message)
    }
  }

  async function handleComplete() {
    try {
      await supabase.rpc('complete_onboarding')
      navigate('/mi-cuenta', { replace: true })
    } catch (e) {
      setError('No pudimos completar. ' + e.message)
    }
  }

  async function selectIdentity(identityKey) {
    setSavingIdentity(true)
    try {
      const { error: rpcErr } = await supabase.rpc('set_my_retail_identity', { p_identity: identityKey })
      if (rpcErr) throw rpcErr
      // Refresh contexto
      if (refreshRetail) await refreshRetail()
      // Refresh local retail data
      const { data: refreshed } = await supabase.rpc('get_my_retail_onboarding')
      if (refreshed?.retail) setRetailData(refreshed.retail)
      await markStepDone(2)
    } catch (e) {
      setError('No pudimos guardar identidad. ' + e.message)
    } finally {
      setSavingIdentity(false)
    }
  }

  function goPrev() {
    if (currentStep > 0) setCurrentStep(s => s - 1)
  }
  function goNext() {
    // Marcar actual como done si no estaba
    if (!completedSteps.includes(currentStep)) {
      markStepDone(currentStep)
    }
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(s => s + 1)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}>
        Cargando…
      </div>
    )
  }

  const step = STEPS[currentStep]
  const isLastStep = currentStep === STEPS.length - 1
  const stepCompleted = completedSteps.includes(currentStep)

  return (
    <div style={{
      minHeight: '100vh',
      background: C.bg,
      padding: '32px 24px 48px',
      maxWidth: 1200,
      margin: '0 auto',
    }}>
      {/* Header: progreso + skip */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 32,
        flexWrap: 'wrap',
        gap: 16,
      }}>
        <div>
          <div style={{ fontSize: FONT_SIZE.xs, color: C.brand, fontFamily: FONT.mono, fontWeight: FONT_WEIGHT.bold, letterSpacing: '.08em', textTransform: 'uppercase' }}>
            Bienvenida · {currentStep + 1} de {STEPS.length}
          </div>
          <div style={{ fontSize: 22, color: C.text, fontWeight: FONT_WEIGHT.bold, marginTop: 4 }}>
            Hola{retailData?.name ? `, ${retailData.name}` : ''} 👋
          </div>
        </div>
        <button
          type="button"
          onClick={handleSkip}
          style={{
            background: 'transparent',
            color: C.muted,
            border: `1px solid ${C.border}`,
            borderRadius: RADIUS.md,
            padding: '8px 14px',
            fontSize: FONT_SIZE.sm,
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: TRANSITION,
          }}
          onMouseEnter={e => e.currentTarget.style.color = C.text}
          onMouseLeave={e => e.currentTarget.style.color = C.muted}
        >
          Saltar onboarding
        </button>
      </div>

      {/* Progress bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${STEPS.length}, 1fr)`,
        gap: 6,
        marginBottom: 32,
      }}>
        {STEPS.map((s, i) => {
          const done = completedSteps.includes(i)
          const current = i === currentStep
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setCurrentStep(i)}
              style={{
                height: 6,
                background: done ? C.brand : current ? C.accent || C.brand : C.border,
                opacity: done || current ? 1 : 0.4,
                borderRadius: 999,
                border: 'none',
                cursor: 'pointer',
                transition: TRANSITION,
                padding: 0,
              }}
              title={s.title}
            />
          )
        })}
      </div>

      {error && (
        <div style={{
          background: 'rgba(248, 113, 113, 0.1)',
          color: '#f87171',
          padding: '10px 14px',
          borderRadius: RADIUS.md,
          marginBottom: 16,
          fontSize: FONT_SIZE.sm,
        }}>
          {error}
        </div>
      )}

      {/* Layout: step content + chat lateral
          15/05/2026 — Altura fija unificada (min 720px, 75vh max).
          Ambos contenedores SIEMPRE igual de altos. Si el form excede,
          scroll interno. Si necesita mas espacio, crece en ancho. */}
      <div className="onb-layout" style={{
        display: 'grid',
        gridTemplateColumns: '1fr 360px',
        gap: 24,
        alignItems: 'stretch',
      }}>
        {/* COLUMNA IZQ: contenido del paso */}
        <div className="onb-step-card" style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: RADIUS.xl,
          padding: 32,
          height: 'min(720px, 75vh)',
          minHeight: 580,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* 15/05/2026 — Wrapper scrollable para que el contenido largo
              no rompa la altura fija. La nav inferior queda fuera, pegada al fondo. */}
          <div className="onb-step-scroll" style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            paddingRight: 8,
            marginRight: -8,
          }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>{step.icon}</div>
            <div style={{
              fontSize: FONT_SIZE.xs,
              color: C.brand,
              fontFamily: FONT.mono,
              fontWeight: FONT_WEIGHT.bold,
              letterSpacing: '.1em',
              textTransform: 'uppercase',
              marginBottom: 6,
            }}>
              {step.eyebrow}
            </div>
            <h2 style={{
              fontSize: 28,
              color: C.text,
              fontWeight: FONT_WEIGHT.bold,
              margin: 0,
              lineHeight: 1.2,
            }}>{step.title}</h2>
            <p style={{
              fontSize: 15,
              color: C.muted,
              marginTop: 12,
              lineHeight: 1.6,
            }}>{step.description}</p>
          </div>

          {/* BODY POR TIPO */}
          {step.body === 'subtitle' && (
            <div style={{
              background: `${C.brand}10`,
              border: `1px solid ${C.brand}40`,
              borderRadius: RADIUS.lg,
              padding: 20,
              marginTop: 16,
            }}>
              <div style={{ fontSize: FONT_SIZE.sm, color: C.text, lineHeight: 1.7 }}>
                <p style={{ margin: '0 0 12px' }}><strong>Qué vamos a hacer:</strong></p>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  <li>Conectar tu línea de WhatsApp</li>
                  <li>Elegir qué tipo de negocio tenés</li>
                  <li>Personalizar el bot con tu voz</li>
                  <li>Activar tu saldo para que empiece a funcionar</li>
                </ul>
              </div>
            </div>
          )}

          {step.body === 'identity-picker' && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: 12,
              marginTop: 16,
            }}>
              {IDENTITIES.map(idn => {
                const selected = retailData?.identity === idn.key
                return (
                  <button
                    key={idn.key}
                    type="button"
                    onClick={() => selectIdentity(idn.key)}
                    disabled={savingIdentity}
                    style={{
                      padding: 16,
                      background: selected ? `${C.brand}15` : C.surface,
                      border: `2px solid ${selected ? C.brand : C.border}`,
                      borderRadius: RADIUS.lg,
                      cursor: savingIdentity ? 'wait' : 'pointer',
                      textAlign: 'left',
                      transition: TRANSITION,
                      fontFamily: 'inherit',
                      opacity: savingIdentity ? 0.6 : 1,
                    }}
                  >
                    <div style={{ fontSize: 28, marginBottom: 8 }}>{idn.icon}</div>
                    <div style={{
                      fontSize: FONT_SIZE.base,
                      fontWeight: FONT_WEIGHT.bold,
                      color: selected ? C.brand : C.text,
                      marginBottom: 4,
                    }}>{idn.label}{selected ? ' ✓' : ''}</div>
                    <div style={{
                      fontSize: FONT_SIZE.xs,
                      color: C.muted,
                      lineHeight: 1.4,
                    }}>{idn.desc}</div>
                  </button>
                )
              })}
            </div>
          )}

          {step.body === 'business-form' && (
            <BusinessForm
              retail={retailData}
              onSaved={async () => {
                // Refresh retail data y marca paso como done
                const { data } = await supabase.rpc('get_my_retail_onboarding')
                if (data?.retail) setRetailData(data.retail)
                await markStepDone(4)
              }}
            />
          )}

          {step.body === 'bot-form' && (
            <BotForm
              retail={retailData}
              onSaved={async () => {
                const { data } = await supabase.rpc('get_my_retail_onboarding')
                if (data?.retail) setRetailData(data.retail)
                await markStepDone(5)
              }}
            />
          )}

          {step.body === 'final' && (
            <div style={{
              background: `${C.brand}10`,
              border: `1px solid ${C.brand}40`,
              borderRadius: RADIUS.lg,
              padding: 24,
              marginTop: 16,
            }}>
              <div style={{ fontSize: 38, marginBottom: 12 }}>🎊</div>
              <div style={{ fontSize: FONT_SIZE.base, color: C.text, lineHeight: 1.7, marginBottom: 16 }}>
                <strong>¡Buenísimo!</strong> Tu cuenta está lista. Sugerencias para empezar fuerte:
              </div>
              <ul style={{ margin: 0, paddingLeft: 20, color: C.muted, fontSize: FONT_SIZE.sm, lineHeight: 1.7 }}>
                <li><strong>Probá tu bot ahora</strong>: mandate un WhatsApp a tu propio número y ve cómo responde</li>
                <li><strong>Personalizá tu landing</strong> en <code style={{ color: C.brand }}>/mi-cuenta/landing</code></li>
                <li><strong>Conectá integraciones</strong> (HubSpot, Calendly, Notion) en <code style={{ color: C.brand }}>/mi-cuenta/configuracion</code></li>
              </ul>
            </div>
          )}

          {/* CTA (botón redirige al panel correspondiente) */}
          {step.cta && (
            <div style={{ marginTop: 24 }}>
              {stepCompleted ? (
                <div style={{
                  background: 'rgba(52, 211, 153, 0.1)',
                  border: '1px solid rgba(52, 211, 153, 0.3)',
                  color: '#34d399',
                  padding: '12px 16px',
                  borderRadius: RADIUS.md,
                  fontSize: FONT_SIZE.sm,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}>
                  ✅ Listo. Podés seguir al siguiente paso.
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    // Abrir en nueva pestaña para que pueda volver y seguir
                    window.open(step.cta.path, '_blank', 'noopener')
                  }}
                  style={{
                    background: `linear-gradient(135deg, ${C.brand}, ${C.brand}cc)`,
                    color: '#000',
                    border: 'none',
                    borderRadius: RADIUS.md,
                    padding: '12px 24px',
                    fontSize: FONT_SIZE.base,
                    fontWeight: FONT_WEIGHT.bold,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: TRANSITION,
                  }}
                >
                  {step.cta.label}
                </button>
              )}
              <div style={{
                marginTop: 10,
                fontSize: FONT_SIZE.xs,
                color: C.muted,
              }}>
                Tip: se abre en una pestaña aparte. Volvé acá cuando termines y avanzá al siguiente paso.
                {' '}
                <button
                  type="button"
                  onClick={() => loadOnboarding()}
                  style={{
                    background: 'transparent',
                    color: C.brand,
                    border: 'none',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    padding: 0,
                    font: 'inherit',
                  }}
                >Refrescar estado</button>
              </div>
            </div>
          )}

          </div>
          {/* /onb-step-scroll */}

          {/* Nav inferior — fija al fondo del card */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 16,
            paddingTop: 24,
            borderTop: `1px solid ${C.border}`,
            flexShrink: 0,
          }}>
            <button
              type="button"
              onClick={goPrev}
              disabled={currentStep === 0}
              style={{
                background: 'transparent',
                color: currentStep === 0 ? C.muted : C.text,
                border: `1px solid ${C.border}`,
                borderRadius: RADIUS.md,
                padding: '10px 18px',
                fontSize: FONT_SIZE.sm,
                cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                opacity: currentStep === 0 ? 0.4 : 1,
              }}
            >
              ← Anterior
            </button>
            {isLastStep ? (
              <button
                type="button"
                onClick={handleComplete}
                style={{
                  background: `linear-gradient(135deg, ${C.brand}, ${C.brand}cc)`,
                  color: '#000',
                  border: 'none',
                  borderRadius: RADIUS.md,
                  padding: '10px 24px',
                  fontSize: FONT_SIZE.sm,
                  fontWeight: FONT_WEIGHT.bold,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Ir al panel →
              </button>
            ) : (
              <button
                type="button"
                onClick={goNext}
                style={{
                  background: `linear-gradient(135deg, ${C.brand}, ${C.brand}cc)`,
                  color: '#000',
                  border: 'none',
                  borderRadius: RADIUS.md,
                  padding: '10px 24px',
                  fontSize: FONT_SIZE.sm,
                  fontWeight: FONT_WEIGHT.bold,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Siguiente →
              </button>
            )}
          </div>
        </div>

        {/* COLUMNA DER: chat IA */}
        <OnboardingChat currentStep={currentStep} stepTitle={step.title} />
      </div>

      {/* Responsive: en mobile el chat va abajo */}
      <style>{`
        @media (max-width: 900px) {
          .onb-layout {
            grid-template-columns: 1fr !important;
          }
        }
        /* 15/05/2026 — Scrollbar estilizada dentro del card del paso */
        .onb-step-scroll {
          scrollbar-width: thin;
          scrollbar-color: ${C.border} transparent;
        }
        .onb-step-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .onb-step-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .onb-step-scroll::-webkit-scrollbar-thumb {
          background-color: ${C.border};
          border-radius: 3px;
        }
        .onb-step-scroll::-webkit-scrollbar-thumb:hover {
          background-color: ${C.muted};
        }
        code {
          background: ${C.surface};
          padding: 2px 6px;
          border-radius: 4px;
          font-family: ${FONT.mono};
          font-size: 0.92em;
        }
      `}</style>
    </div>
  )
}


// ═══════════════════════════════════════════════════════════════════
// 15/05/2026 — Wizard inline: BusinessForm
// Renderiza campos segun identity. Pre-llena con datos actuales.
// Autosave al click "Guardar y continuar".
// ═══════════════════════════════════════════════════════════════════
function BusinessForm({ retail, onSaved }) {
  const identity = retail?.identity || 'tienda'
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [saved, setSaved] = useState(false)

  // Pre-rellenar desde retail al mount (y cuando cambie identity)
  useEffect(() => {
    setForm({
      casino_name: retail?.casino_name || retail?.name || '',
      casino_url: retail?.casino_url || '',
      casino_min_deposit: retail?.casino_min_deposit ?? '',
      casino_min_withdrawal: retail?.casino_min_withdrawal ?? '',
      casino_welcome_bonus: retail?.casino_welcome_bonus || '',
      contact_phone: retail?.contact_phone || '',
      contact_email: retail?.contact_email || '',
      schedule: retail?.schedule || '',
    })
    setSaved(false)
  }, [identity, retail?.casino_name, retail?.contact_phone])

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSave() {
    setSaving(true); setError(null)
    try {
      // Construir payload solo con campos no vacios
      const payload = {}
      const sendIfFilled = (k, v) => {
        const t = typeof v === 'string' ? v.trim() : v
        if (t !== '' && t !== null && t !== undefined) payload[k] = t
      }
      sendIfFilled('contact_phone', form.contact_phone)
      sendIfFilled('contact_email', form.contact_email)
      sendIfFilled('schedule', form.schedule)
      sendIfFilled('casino_name', form.casino_name)
      sendIfFilled('casino_url', form.casino_url)
      sendIfFilled('casino_welcome_bonus', form.casino_welcome_bonus)
      if (form.casino_min_deposit !== '' && form.casino_min_deposit != null) {
        payload.casino_min_deposit = Number(form.casino_min_deposit)
      }
      if (form.casino_min_withdrawal !== '' && form.casino_min_withdrawal != null) {
        payload.casino_min_withdrawal = Number(form.casino_min_withdrawal)
      }

      const { data, error } = await supabase.rpc('update_my_retail_business_data', { p_data: payload })
      if (error) throw error
      if (!data?.ok) throw new Error(data?.error || 'error')

      setSaved(true)
      if (onSaved) await onSaved()
    } catch (e) {
      setError(e.message || 'No pudimos guardar')
    } finally {
      setSaving(false)
    }
  }

  // Campos por identity
  const fields = (() => {
    if (identity === 'casino') {
      return [
        { k: 'casino_name', label: 'Nombre del casino *', placeholder: 'Ej: CasinoPig', type: 'text' },
        { k: 'casino_url', label: 'URL del casino', placeholder: 'https://casinopig.bet', type: 'url' },
        { k: 'contact_phone', label: 'Teléfono de contacto *', placeholder: '+54 9 11 1234-5678', type: 'tel' },
        { k: 'schedule', label: 'Horario de atención *', placeholder: 'L a D de 09 a 23hs', type: 'text' },
        { k: 'casino_min_deposit', label: 'Mínimo de depósito ($)', placeholder: '2000', type: 'number' },
        { k: 'casino_min_withdrawal', label: 'Mínimo de retiro ($)', placeholder: '5000', type: 'number' },
        { k: 'casino_welcome_bonus', label: 'Bonificación de bienvenida', placeholder: '50% en primera carga hasta $20.000', type: 'textarea' },
      ]
    }
    if (identity === 'tienda') {
      return [
        { k: 'casino_name', label: 'Nombre de la tienda *', placeholder: 'Ej: Mi Tienda Online', type: 'text' },
        { k: 'casino_url', label: 'URL de la tienda', placeholder: 'https://mitienda.com', type: 'url' },
        { k: 'contact_phone', label: 'Teléfono de contacto *', placeholder: '+54 9 11 1234-5678', type: 'tel' },
        { k: 'contact_email', label: 'Email de contacto', placeholder: 'hola@mitienda.com', type: 'email' },
        { k: 'schedule', label: 'Horario de atención *', placeholder: 'L a V de 9 a 18hs', type: 'text' },
      ]
    }
    if (identity === 'profesional') {
      return [
        { k: 'casino_name', label: 'Tu nombre / consultorio *', placeholder: 'Ej: Dr. Pérez', type: 'text' },
        { k: 'casino_welcome_bonus', label: 'Especialidad y servicios *', placeholder: 'Ej: Psicología clínica. Atiendo adultos y adolescentes...', type: 'textarea' },
        { k: 'schedule', label: 'Horarios de atención *', placeholder: 'L a V de 9 a 18hs', type: 'text' },
        { k: 'contact_phone', label: 'Teléfono *', placeholder: '+54 9 11 1234-5678', type: 'tel' },
        { k: 'contact_email', label: 'Email', placeholder: 'contacto@consultorio.com', type: 'email' },
      ]
    }
    // marketing
    return [
      { k: 'casino_name', label: 'Nombre de la marca *', placeholder: 'Ej: Innovate IA', type: 'text' },
      { k: 'casino_welcome_bonus', label: '¿Qué vendés o promocionás? *', placeholder: 'Ej: Servicios de marketing digital para PyMEs', type: 'textarea' },
      { k: 'contact_phone', label: 'Teléfono de atención al lead *', placeholder: '+54 9 11 1234-5678', type: 'tel' },
      { k: 'schedule', label: 'Horarios de atención *', placeholder: 'L a V de 9 a 18hs', type: 'text' },
      { k: 'contact_email', label: 'Email', placeholder: 'hola@marca.com', type: 'email' },
    ]
  })()

  return (
    <div style={{ marginTop: 14 }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 12,
      }}>
        {fields.map(f => (
          <div key={f.k} style={{ display: 'flex', flexDirection: 'column', gap: 6, gridColumn: f.type === 'textarea' ? '1 / -1' : 'auto' }}>
            <label style={{
              fontSize: FONT_SIZE.xs, color: C.muted,
              fontFamily: FONT.mono, textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}>{f.label}</label>
            {f.type === 'textarea' ? (
              <textarea
                value={form[f.k] || ''}
                onChange={set(f.k)}
                placeholder={f.placeholder}
                rows={3}
                style={{
                  background: C.surface, border: `1px solid ${C.border}`,
                  borderRadius: RADIUS.md, color: C.text,
                  padding: '10px 12px', fontSize: FONT_SIZE.sm,
                  fontFamily: 'inherit', resize: 'vertical', minHeight: 70,
                }}
              />
            ) : (
              <input
                type={f.type}
                value={form[f.k] ?? ''}
                onChange={set(f.k)}
                placeholder={f.placeholder}
                style={{
                  background: C.surface, border: `1px solid ${C.border}`,
                  borderRadius: RADIUS.md, color: C.text,
                  padding: '10px 12px', fontSize: FONT_SIZE.sm,
                  fontFamily: 'inherit',
                }}
              />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div style={{
          marginTop: 12,
          background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
          color: '#f87171', padding: '8px 12px', borderRadius: RADIUS.md,
          fontSize: FONT_SIZE.xs,
        }}>{error}</div>
      )}

      <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          style={{
            background: `linear-gradient(135deg, ${C.brand}, ${C.brand}cc)`,
            color: '#000', border: 'none', borderRadius: RADIUS.md,
            padding: '10px 18px', fontSize: FONT_SIZE.sm,
            fontWeight: FONT_WEIGHT.bold, cursor: saving ? 'wait' : 'pointer',
            fontFamily: 'inherit', opacity: saving ? 0.7 : 1,
          }}
        >{saving ? 'Guardando…' : (saved ? '✓ Guardado' : 'Guardar y continuar')}</button>
        {saved && (
          <span style={{ fontSize: FONT_SIZE.xs, color: '#34d399' }}>
            Datos guardados. Podés seguir al siguiente paso.
          </span>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// 15/05/2026 — Wizard inline: BotForm
// Personalidad (selector) + welcome (textarea) + prompt (textarea).
// ═══════════════════════════════════════════════════════════════════
const BOT_PERSONALITIES = [
  { key: 'formal',       label: 'Formal',       icon: '🎩', desc: 'Trato profesional, usted, sin coloquialismos' },
  { key: 'cercano',      label: 'Cercano',      icon: '🤝', desc: 'Voseo, amable, conversacional' },
  { key: 'divertido',    label: 'Divertido',    icon: '🎉', desc: 'Suelto, con humor, emojis ocasionales' },
  { key: 'profesional',  label: 'Profesional',  icon: '💼', desc: 'Directo, ejecutivo, sin rodeos' },
]

function getDefaultWelcome(identity, name) {
  const n = name || 'nuestra empresa'
  if (identity === 'casino') return `¡Hola! Soy el asistente de ${n}. Te ayudo con depósitos, retiros y cualquier consulta. ¿En qué puedo ayudarte hoy?`
  if (identity === 'tienda') return `¡Hola! Soy el asistente de ${n}. Te ayudo con productos, pedidos y consultas. ¿Qué estás buscando hoy?`
  if (identity === 'profesional') return `¡Hola! Soy el asistente de ${n}. Te ayudo a coordinar turnos y responder consultas sobre servicios. ¿En qué te puedo ayudar?`
  if (identity === 'marketing') return `¡Hola! Soy el asistente de ${n}. Estoy para responder consultas y agendar reuniones. ¿Qué necesitás?`
  return `¡Hola! Soy el asistente de ${n}. ¿En qué te puedo ayudar?`
}

function getDefaultPrompt(identity, name) {
  const n = name || 'el negocio'
  if (identity === 'casino') {
    return `Sos el asistente de WhatsApp de ${n}, un casino online. Tu rol es:
- Ayudar a usuarios nuevos a registrarse y hacer su primer depósito
- Generar links de pago cuando un usuario quiera depositar
- Responder dudas sobre retiros, depósitos mínimos y bonificaciones
- Escalar a un agente humano si el usuario tiene un problema técnico o reclamo

Mantené las respuestas breves (máximo 3 líneas). No prometas cosas que no sabés. Si no sabés algo, decí que vas a derivar con un agente.`
  }
  if (identity === 'tienda') {
    return `Sos el asistente de WhatsApp de ${n}, una tienda online. Tu rol es:
- Responder dudas sobre productos, precios y disponibilidad
- Tomar pedidos y guiar al cliente hasta concretar la compra
- Informar tiempos de entrega y formas de pago
- Escalar a un agente humano si hay un reclamo o cambio/devolución

Mantené las respuestas breves (máximo 3 líneas). Tono amigable pero profesional. Si no sabés un precio o stock, decilo honestamente y ofrecé consultar.`
  }
  if (identity === 'profesional') {
    return `Sos el asistente de WhatsApp de ${n}. Tu rol es:
- Coordinar turnos según disponibilidad del profesional
- Responder consultas sobre servicios ofrecidos
- Confirmar y recordar turnos próximos
- Escalar a el/la profesional para consultas clínicas/técnicas que requieran su criterio

Tono cálido y profesional. Nunca des consejos médicos/profesionales puntuales — solo coordiná y derivá.`
  }
  // marketing
  return `Sos el asistente de WhatsApp de ${n}. Tu rol es:
- Calificar leads que llegan: nombre, email, qué buscan, presupuesto
- Agendar reuniones con el equipo comercial cuando el lead esté calificado
- Responder dudas básicas sobre los servicios
- Escalar al equipo cuando el lead esté listo para una propuesta

Mantené el tono profesional pero amigable. Hacé preguntas abiertas para entender al lead.`
}

function BotForm({ retail, onSaved }) {
  const [welcome, setWelcome] = useState('')
  const [prompt, setPrompt] = useState('')
  const [personality, setPersonality] = useState('cercano')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const id = retail?.identity || 'tienda'
    const n = retail?.casino_name || retail?.name || ''
    setWelcome(retail?.bot_welcome_message || getDefaultWelcome(id, n))
    setPrompt(retail?.bot_prompt || getDefaultPrompt(id, n))
    setPersonality(retail?.bot_personality || 'cercano')
    setSaved(false)
  }, [retail?.identity, retail?.casino_name, retail?.bot_welcome_message, retail?.bot_prompt, retail?.bot_personality])

  async function handleSave() {
    setSaving(true); setError(null)
    try {
      const { data, error } = await supabase.rpc('update_my_retail_bot_data', {
        p_welcome_message: welcome || null,
        p_prompt: prompt || null,
        p_personality: personality || null,
      })
      if (error) throw error
      if (!data?.ok) throw new Error(data?.error || 'error')
      setSaved(true)
      if (onSaved) await onSaved()
    } catch (e) {
      setError(e.message || 'No pudimos guardar')
    } finally {
      setSaving(false)
    }
  }

  function regenerateDefaults() {
    const id = retail?.identity || 'tienda'
    const n = retail?.casino_name || retail?.name || ''
    setWelcome(getDefaultWelcome(id, n))
    setPrompt(getDefaultPrompt(id, n))
  }

  return (
    <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Personalidad */}
      <div>
        <label style={{
          fontSize: FONT_SIZE.xs, color: C.muted,
          fontFamily: FONT.mono, textTransform: 'uppercase',
          letterSpacing: '0.06em', display: 'block', marginBottom: 8,
        }}>Tono del bot</label>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 8,
        }}>
          {BOT_PERSONALITIES.map(p => {
            const sel = personality === p.key
            return (
              <button
                key={p.key} type="button"
                onClick={() => setPersonality(p.key)}
                style={{
                  padding: 12,
                  background: sel ? `${C.brand}15` : C.surface,
                  border: `2px solid ${sel ? C.brand : C.border}`,
                  borderRadius: RADIUS.md,
                  cursor: 'pointer', textAlign: 'left',
                  fontFamily: 'inherit', transition: TRANSITION,
                }}
              >
                <div style={{ fontSize: 18, marginBottom: 4 }}>{p.icon}</div>
                <div style={{
                  fontSize: FONT_SIZE.sm,
                  fontWeight: FONT_WEIGHT.bold,
                  color: sel ? C.brand : C.text,
                }}>{p.label}{sel ? ' ✓' : ''}</div>
                <div style={{ fontSize: 10, color: C.muted, marginTop: 2, lineHeight: 1.3 }}>{p.desc}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Welcome */}
      <div>
        <label style={{
          fontSize: FONT_SIZE.xs, color: C.muted,
          fontFamily: FONT.mono, textTransform: 'uppercase',
          letterSpacing: '0.06em', display: 'block', marginBottom: 6,
        }}>Mensaje de bienvenida (lo primero que ve el cliente)</label>
        <textarea
          value={welcome}
          onChange={e => setWelcome(e.target.value)}
          rows={3}
          maxLength={1000}
          style={{
            width: '100%', background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: RADIUS.md, color: C.text,
            padding: '10px 12px', fontSize: FONT_SIZE.sm,
            fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box',
          }}
        />
        <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>
          {welcome.length}/1000
        </div>
      </div>

      {/* Prompt */}
      <div>
        <label style={{
          fontSize: FONT_SIZE.xs, color: C.muted,
          fontFamily: FONT.mono, textTransform: 'uppercase',
          letterSpacing: '0.06em', display: 'block', marginBottom: 6,
        }}>
          Prompt — instrucciones para el bot
          {' '}
          <button type="button" onClick={regenerateDefaults}
            style={{
              background: 'transparent', color: C.brand, border: 'none',
              fontSize: 10, cursor: 'pointer', textDecoration: 'underline',
              fontFamily: 'inherit', padding: 0,
            }}
          >regenerar sugerencia</button>
        </label>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          rows={8}
          maxLength={5000}
          style={{
            width: '100%', background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: RADIUS.md, color: C.text,
            padding: '10px 12px', fontSize: FONT_SIZE.sm,
            fontFamily: FONT.mono, lineHeight: 1.55,
            resize: 'vertical', boxSizing: 'border-box', minHeight: 160,
          }}
        />
        <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>
          {prompt.length}/5000 · Te dejamos una sugerencia adaptada a tu rubro. Editala libre.
        </div>
      </div>

      {error && (
        <div style={{
          background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
          color: '#f87171', padding: '8px 12px', borderRadius: RADIUS.md,
          fontSize: FONT_SIZE.xs,
        }}>{error}</div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          style={{
            background: `linear-gradient(135deg, ${C.brand}, ${C.brand}cc)`,
            color: '#000', border: 'none', borderRadius: RADIUS.md,
            padding: '10px 18px', fontSize: FONT_SIZE.sm,
            fontWeight: FONT_WEIGHT.bold, cursor: saving ? 'wait' : 'pointer',
            fontFamily: 'inherit', opacity: saving ? 0.7 : 1,
          }}
        >{saving ? 'Guardando…' : (saved ? '✓ Guardado' : 'Guardar y continuar')}</button>
        {saved && (
          <span style={{ fontSize: FONT_SIZE.xs, color: '#34d399' }}>
            Bot personalizado. Podés seguir.
          </span>
        )}
      </div>
    </div>
  )
}
