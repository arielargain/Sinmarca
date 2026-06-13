import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { signInWithGoogle } from '../lib/auth'
import { useAuth } from '../contexts/AuthContext'
import { COLORS as C, FONT, RADIUS, SHADOW, TRANSITION } from '../theme/tokens'
import {
  Brand, Card, Field, ErrorBanner, PrimaryButton, FooterTrust,
  inputStyle, onInputFocus, onInputBlur,
} from './LoginCliente'

// ════════════════════════════════════════════════════════════════
// RegisterCliente — registro self-service (Google + email)
//
// 12/06/2026: montado en /register del host partner (app.innovate-ia.com)
// además de /mi-cuenta/register del apex. Los CTAs del landing apuntan acá.
// Quitadas menciones a "socio" — el modelo es Admin/tenant/subtenant.
//
// 17/05/2026 (HARDENED): el guard backend chequea AMBOS:
//   • auth.users.email del auth_user_id de un sub_tenant linkeado
//   • sub_tenants.contact_email directamente
// Así protege también al subtenant que el partner ya cargó pero todavía
// nunca entró por primera vez (auth_user_id IS NULL).
// 17/05/2026: agregada detección del error S17 sub_tenant_email_collision.
// 08/05/2026: agregado Google OAuth como método primario de signup.
// ════════════════════════════════════════════════════════════════

const IDENTITIES = [
  { id: 'casino',       label: 'Casino / Apuestas' },
  { id: 'tienda',       label: 'Tienda / E-commerce' },
  { id: 'profesional',  label: 'Profesional / Servicios' },
  { id: 'marketing',    label: 'Marketing / Agencia' },
]

function isSubTenantCollision(msg) {
  if (!msg) return false
  return msg.includes('sub_tenant_email_collision')
}

function friendlyError(msg) {
  if (!msg) return 'Error desconocido'
  if (isSubTenantCollision(msg)) {
    return '__COLLISION__'
  }
  if (msg.includes('already registered') || msg.includes('User already registered')) return 'Ya hay una cuenta con ese email. Iniciá sesión.'
  if (msg.includes('password') && msg.includes('6')) return 'La contraseña debe tener al menos 6 caracteres.'
  if (msg.includes('Invalid email')) return 'El email no es válido.'
  if (msg.includes('rate limit') || msg.includes('too many')) return 'Demasiados intentos. Esperá unos minutos.'
  if (msg.includes('Registro no autorizado')) return 'Ese email no está habilitado para registro.'
  return msg
}

export default function RegisterCliente() {
  const navigate = useNavigate()
  const { refreshTenant } = useAuth()
  const [form, setForm] = useState({
    email: '', password: '', business_name: '', identity: 'profesional',
    accept_terms: false,
  })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [done, setDone]       = useState(false)
  const [redirectInfo, setRedirectInfo] = useState(null)

  async function handleGoogle() {
    if (!form.accept_terms) {
      setError('Tenés que aceptar los términos para continuar.')
      return
    }
    setError('')
    setGoogleLoading(true)
    try {
      await signInWithGoogle()
    } catch (err) {
      setError(friendlyError(err.message))
      setGoogleLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.accept_terms) {
      setError('Tenés que aceptar los términos para continuar.')
      return
    }
    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (form.business_name.trim().length < 2) {
      setError('Ingresá el nombre de tu negocio.')
      return
    }
    setLoading(true)
    try {
      const emailNorm = form.email.trim().toLowerCase()
      try {
        const { data: chk } = await supabase.rpc('check_email_account_type', { p_email: emailNorm })
        if (chk?.exists && chk?.login_path) {
          const tipoLabel = chk.type === 'subtenant' ? 'cliente de un operador'
            : chk.type === 'partner' ? 'operador' : 'cliente'
          setRedirectInfo({ type: chk.type, login_path: chk.login_path, label: tipoLabel })
          setLoading(false)
          setTimeout(() => navigate(chk.login_path), 1800)
          return
        }
      } catch (_e) {}

      const { data, error: signUpErr } = await supabase.auth.signUp({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        options: {
          data: {
            business_name: form.business_name.trim(),
            identity: form.identity,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (signUpErr) throw signUpErr
      if (data?.session) {
        await new Promise(r => setTimeout(r, 600))
        try { await refreshTenant() } catch {}
        navigate('/onboarding-cliente')
      }
      else setDone(true)
    } catch (err) {
      setError(friendlyError(err.message))
    } finally {
      setLoading(false)
    }
  }

  if (done) return <DoneScreen email={form.email} />

  const anyLoading = loading || googleLoading
  const showCollision = error === '__COLLISION__'

  return (
    <div style={{
      minHeight: '100dvh',
      background: C.bg,
      color: C.text,
      fontFamily: FONT.body,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
    }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <Brand subtitle="Crear cuenta" />

        <Card>
          <h1 style={{
            fontSize: 22, fontWeight: 600, color: C.text,
            margin: '0 0 6px', letterSpacing: '-0.02em',
          }}>
            Empezá a usar Innovate.ia
          </h1>
          <p style={{
            fontSize: 13, color: C.muted,
            margin: '0 0 22px', lineHeight: 1.5,
          }}>
            Configurá tu negocio en menos de 2 minutos. Después conectás Mercado Pago y empezás a operar.
          </p>

          {showCollision && (
            <CollisionBanner email={form.email} />
          )}

          {redirectInfo && (
            <div style={{
              padding: '12px 14px', borderRadius: 12, marginBottom: 4,
              background: 'rgba(45,107,216,0.10)', border: '1px solid rgba(45,107,216,0.35)',
              color: '#EDF1F8', fontSize: 13.5, lineHeight: 1.5,
            }}>
              Este email ya tiene una cuenta como <strong>{redirectInfo.label}</strong>.
              Te llevamos a tu ingreso…
            </div>
          )}

          <label style={{
            display: 'flex', alignItems: 'center', gap: 10,
            fontSize: 12, color: C.muted, lineHeight: 1.5,
            cursor: 'pointer', marginBottom: 18,
            padding: '12px 14px',
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: RADIUS.sm,
            textTransform: 'none', letterSpacing: 'normal',
          }}>
            <input
              type="checkbox" checked={form.accept_terms}
              onChange={e => setForm({ ...form, accept_terms: e.target.checked })}
              style={{ width: 18, height: 18, marginTop: 0, accentColor: C.primary, cursor: 'pointer', flexShrink: 0 }}
            />
            <span style={{ flex: 1, textTransform: 'none', letterSpacing: 'normal' }}>
              Acepto los <Link to="/terminos-bot" target="_blank" style={{ color: C.primaryLite, textDecoration: 'none' }}>términos</Link>
              {' '}y la <Link to="/privacidad" target="_blank" style={{ color: C.primaryLite, textDecoration: 'none' }}>política de privacidad</Link>.
            </span>
          </label>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={anyLoading}
            style={{
              width: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              padding: '11px 16px',
              borderRadius: RADIUS.sm,
              cursor: anyLoading ? 'not-allowed' : 'pointer',
              background: '#fff',
              color: '#1f1f1f',
              border: '1px solid #e0e0e0',
              fontSize: 14, fontWeight: 500,
              fontFamily: 'inherit',
              opacity: anyLoading ? 0.5 : 1,
              transition: `all ${TRANSITION.fast}`,
              boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
              marginBottom: 18,
            }}
            onMouseEnter={e => { if (!anyLoading) e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)' }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.12)' }}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" style={{ flexShrink: 0 }}>
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {googleLoading ? 'Redirigiendo a Google…' : 'Crear cuenta con Google'}
          </button>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            marginBottom: 18,
            color: C.muted, fontSize: 11,
            fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.1em',
          }}>
            <div style={{ flex: 1, height: 1, background: C.border }} />
            <span>o con email</span>
            <div style={{ flex: 1, height: 1, background: C.border }} />
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Nombre del negocio">
              <input
                type="text" required autoComplete="organization"
                value={form.business_name}
                onChange={e => setForm({ ...form, business_name: e.target.value })}
                placeholder="Mi Negocio S.A."
                style={inputStyle()}
                onFocus={onInputFocus}
                onBlur={onInputBlur}
                disabled={anyLoading}
              />
            </Field>

            <Field label="¿A qué se dedica?">
              <select
                value={form.identity}
                onChange={e => setForm({ ...form, identity: e.target.value })}
                style={{
                  ...inputStyle(),
                  cursor: 'pointer',
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='none' stroke='%238595B5' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' d='M1 1l5 5 5-5'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 14px center',
                  paddingRight: 36,
                }}
                onFocus={onInputFocus}
                onBlur={onInputBlur}
                disabled={anyLoading}
              >
                {IDENTITIES.map(i => <option key={i.id} value={i.id}>{i.label}</option>)}
              </select>
            </Field>

            <Field label="Email">
              <input
                type="email" required autoComplete="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="tu@email.com"
                style={inputStyle()}
                onFocus={onInputFocus}
                onBlur={onInputBlur}
                disabled={anyLoading}
              />
            </Field>

            <Field label="Contraseña">
              <input
                type="password" required autoComplete="new-password" minLength={6}
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="Mínimo 6 caracteres"
                style={inputStyle()}
                onFocus={onInputFocus}
                onBlur={onInputBlur}
                disabled={anyLoading}
              />
            </Field>

            {error && !showCollision && <ErrorBanner>{error}</ErrorBanner>}

            <PrimaryButton type="submit" disabled={anyLoading}>
              {loading ? 'Creando cuenta…' : 'Crear cuenta con email'}
            </PrimaryButton>
          </form>

          <div style={{
            marginTop: 20, paddingTop: 20,
            borderTop: `1px solid ${C.border}`,
            textAlign: 'center', fontSize: 13, color: C.muted,
          }}>
            ¿Ya tenés cuenta? <Link to="/login" style={{ color: C.primaryLite, textDecoration: 'none', fontWeight: 500 }}>Iniciar sesión</Link>
          </div>
        </Card>

        <FooterTrust />
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// CollisionBanner — banner especial para error sub_tenant_email_collision
// (S17). Reemplaza al ErrorBanner genérico cuando el backend detecta que
// el email ya pertenece a un cliente de un operador Innovate.
// ════════════════════════════════════════════════════════════════
function CollisionBanner({ email }) {
  return (
    <div style={{
      background: `${C.accent}10`,
      border: `1px solid ${C.accent}50`,
      borderRadius: RADIUS.md,
      padding: '16px 18px',
      marginBottom: 18,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <span style={{ fontSize: 20, flexShrink: 0, lineHeight: 1 }}>ℹ️</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            margin: '0 0 4px',
            fontSize: 14,
            fontWeight: 600,
            color: C.accent,
            lineHeight: 1.4,
          }}>
            Este email ya tiene cuenta como cliente de un operador
          </p>
          <p style={{
            margin: '0 0 8px',
            fontSize: 13,
            color: C.text,
            lineHeight: 1.5,
          }}>
            {email ? <><strong style={{ color: C.text }}>{email}</strong> ya está vinculado</> : 'Este email ya está vinculado'}
            {' '}a un panel de cliente gestionado por un operador Innovate.
          </p>
          <p style={{
            margin: 0,
            fontSize: 12,
            color: C.muted,
            lineHeight: 1.55,
          }}>
            Si ya tenés credenciales, ingresá en el login de cliente.
            Si tu operador cargó tu email pero nunca te enviaron una
            contraseña, pedile que te la mande o contactá a soporte.
          </p>
        </div>
      </div>
      <Link
        to="/cliente/login"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          padding: '10px 14px',
          background: C.primary,
          color: '#fff',
          textDecoration: 'none',
          fontSize: 13,
          fontWeight: 600,
          borderRadius: RADIUS.sm,
          letterSpacing: '-0.01em',
          transition: `background ${TRANSITION.fast}`,
        }}
      >
        Ir al login de cliente →
      </Link>
    </div>
  )
}

function DoneScreen({ email }) {
  return (
    <div style={{
      minHeight: '100dvh', background: C.bg, color: C.text,
      fontFamily: FONT.body,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <Brand subtitle="Cuenta creada" />
        <Card>
          <div style={{
            width: 56, height: 56, margin: '0 auto 18px',
            borderRadius: RADIUS.md, background: C.primarySoft,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </div>
          <h1 style={{
            margin: '0 0 10px', fontSize: 22, fontWeight: 600,
            letterSpacing: '-0.02em', textAlign: 'center',
          }}>
            Revisá tu email
          </h1>
          <p style={{
            margin: '0 0 22px', color: C.muted, fontSize: 13,
            lineHeight: 1.6, textAlign: 'center',
          }}>
            Te enviamos un link de confirmación a <strong style={{ color: C.text, fontWeight: 500 }}>{email}</strong>.
            Hacé click para activar tu cuenta y empezar el onboarding.
          </p>
          <div style={{ textAlign: 'center' }}>
            <Link to="/login" style={{
              color: C.primaryLite, fontSize: 13,
              textDecoration: 'none', fontWeight: 500,
            }}>
              ← Volver al login
            </Link>
          </div>
        </Card>
        <FooterTrust />
      </div>
    </div>
  )
}
