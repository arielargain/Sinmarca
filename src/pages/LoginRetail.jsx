// 17/05/2026 — LoginRetail: pantalla de login dedicada para clientes
// retail (autoservicio). Google + email/password + link a /mi-cuenta/register.
//
// 12/06/2026 — Quitada mención a "socio" → "operador".
import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signIn, signInWithGoogle } from '../lib/auth'
import { assertAllowedHostForIdentity } from '../lib/hostGuard'
import { COLORS as C, FONT, RADIUS, TRANSITION } from '../theme/tokens'
import {
  Brand, Card, Field, ErrorBanner, PrimaryButton, FooterTrust,
  inputStyle, onInputFocus, onInputBlur,
} from './LoginCliente'

function friendlyError(msg) {
  if (!msg) return 'Error inesperado. Intentá de nuevo.'
  if (msg.includes('app.innovate-ia.com') || msg.includes('chat.innovate-ia.com')) return msg
  if (msg.includes('no tiene permiso para acceder')) return msg
  if (msg.includes('Invalid login credentials')) return 'Email o contraseña incorrectos'
  if (msg.includes('Email not confirmed')) return 'Confirmá tu email antes de entrar'
  if (msg.includes('refresh token') || msg.includes('500')) return 'Error de conexión. Intentá de nuevo.'
  if (msg.includes('rate limit') || msg.includes('too many')) return 'Demasiados intentos. Esperá unos minutos.'
  if (msg.includes('network') || msg.includes('fetch')) return 'Sin conexión. Verificá tu internet.'
  return 'Error inesperado. Intentá de nuevo.'
}

export default function LoginRetail() {
  const navigate = useNavigate()
  const [form, setForm]       = useState({ email: '', password: '' })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      if (params.get('error') === 'apex_no_retail') {
        const dest = params.get('dest') || ''
        setError(
          'Esta cuenta no es de cliente final (retail) y no puede ingresar desde este sitio.' +
          (dest ? ' Ingresá en ' + decodeURIComponent(dest) + '.' : '')
        )
        window.history.replaceState({}, '', window.location.pathname)
      }
    } catch {}
  }, [])

  async function handleGoogle() {
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
    setLoading(true)
    try {
      await signIn(form)
      const { redirectTo } = await assertAllowedHostForIdentity('retail')
      navigate(redirectTo)
    } catch (err) {
      setError(friendlyError(err.message))
    } finally {
      setLoading(false)
    }
  }

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
      <div style={{ width: '100%', maxWidth: 400 }}>
        <Brand subtitle="Conversaciones que venden" withoutLogo />

        <Card>
          <h1 style={{
            fontSize: 22, fontWeight: 600, color: C.text,
            margin: '0 0 6px', letterSpacing: '-0.02em',
          }}>
            Bienvenido de vuelta
          </h1>
          <p style={{
            fontSize: 13, color: C.muted,
            margin: '0 0 22px', lineHeight: 1.5,
          }}>
            Ingresá a tu panel para gestionar conversaciones, ventas y landings.
          </p>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading || loading}
            style={{
              width: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              padding: '11px 16px',
              borderRadius: RADIUS.sm,
              cursor: (googleLoading || loading) ? 'not-allowed' : 'pointer',
              background: '#fff',
              color: '#1f1f1f',
              border: '1px solid #e0e0e0',
              fontSize: 14, fontWeight: 500,
              fontFamily: 'inherit',
              opacity: (googleLoading || loading) ? 0.5 : 1,
              transition: `all ${TRANSITION.fast}`,
              boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
              marginBottom: 18,
            }}
            onMouseEnter={e => { if (!googleLoading && !loading) e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)' }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.12)' }}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" style={{ flexShrink: 0 }}>
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {googleLoading ? 'Redirigiendo a Google…' : 'Continuar con Google'}
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
            <Field label="Email">
              <input
                type="email" required autoComplete="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="tu@email.com"
                style={inputStyle()}
                onFocus={onInputFocus}
                onBlur={onInputBlur}
              />
            </Field>

            <Field label="Contraseña">
              <input
                type="password" required autoComplete="current-password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                style={inputStyle()}
                onFocus={onInputFocus}
                onBlur={onInputBlur}
              />
            </Field>

            {error && <ErrorBanner>{error}</ErrorBanner>}

            <PrimaryButton type="submit" disabled={loading}>
              {loading ? 'Ingresando…' : 'Ingresar'}
            </PrimaryButton>
          </form>

          <div style={{
            marginTop: 20, paddingTop: 20,
            borderTop: `1px solid ${C.border}`,
            display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center',
          }}>
            <Link to="/mi-cuenta/register" style={{
              color: C.text, fontSize: 13, fontWeight: 500,
              textDecoration: 'none', padding: '9px 18px',
              border: `1px solid ${C.borderStrong}`,
              borderRadius: RADIUS.sm,
              background: 'transparent',
              transition: `all ${TRANSITION.fast}`,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = C.surface2; e.currentTarget.style.borderColor = C.primary }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = C.borderStrong }}>
              Crear cuenta nueva
            </Link>
            <Link to="/forgot-password" style={{
              color: C.primaryLite, fontSize: 12,
              textDecoration: 'none', fontWeight: 500,
            }}>
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </Card>

        <FooterTrust />

        <div style={{
          marginTop: 18,
          paddingTop: 14,
          borderTop: `1px dashed ${C.border}`,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}>
          <div>
            <p style={{ fontSize: 11, color: C.dim, margin: '0 0 4px', fontFamily: FONT.mono, letterSpacing: '0.04em' }}>
              ¿Sos cliente de un operador Innovate?
            </p>
            <a
              href="https://chat.innovate-ia.com/cliente/login"
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: C.primaryLite,
                textDecoration: 'none',
                letterSpacing: '0.01em',
              }}
            >
              Entrá acá →
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
