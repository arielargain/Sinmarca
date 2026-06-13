import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { resolveHost } from '../lib/hostConfig'
import { COLORS as C, FONT } from '../theme/tokens'

// AuthCallback v4 (08/05/2026)
// Punto de aterrizaje post-OAuth y post-email-confirmation.
//
// Cambios vs v3:
//  - Cuando un retail/sub_tenant cae en app.innovate (por Site URL fallback
//    de Supabase OAuth), en vez de intentar transferir el hash al chat host
//    (que no funciona con PKCE flow porque el code verifier vive en el
//    origin que inició el flow), hacemos signOut local + redirect a
//    /login del host correcto. El user entra de nuevo (su refresh_token
//    global sigue válido, supabase-js lo recoge automáticamente al cargar).
//  - Mismo trato para tenant (partner) en chat.innovate.
//
// Cambios vs v2:
//  - Cross-host correction: detectar el host equivocado y mover al user.
//  - Anti-loop guard via sessionStorage.

const MAX_RETRIES = 8
const RETRY_DELAY = 1500
const CROSS_HOST_MARK = 'innovateia_cross_host_correction'

const APP_HOST  = 'app.innovate-ia.com'
const CHAT_HOST = 'chat.innovate-ia.com'
// 21/05/2026 — apex = host OFICIAL retail. Solo retail puede entrar por acá.
const APEX_HOSTS = ['innovate-ia.com', 'www.innovate-ia.com']

function currentHost() {
  return (typeof window !== 'undefined') ? window.location.hostname.replace(/\.$/, '') : ''
}

function isApexHost(host) {
  return APEX_HOSTS.includes(host)
}

// 21/05/2026 — host canónico por categoría, coherente con hostConfig.
// retail vive en el APEX (no en chat). Esto evita que Google mande al host
// equivocado con el skin equivocado.
const CATEGORY_HOST = {
  retail:    'innovate-ia.com',
  subtenant: CHAT_HOST,
  partner:   APP_HOST,
}
const KIND_TO_CATEGORY = { sub_tenant: 'subtenant', retail: 'retail', tenant: 'partner' }

function expectedHost(identity) {
  if (!identity) return null
  const cat = KIND_TO_CATEGORY[identity.kind]
  return CATEGORY_HOST[cat] || null
}

export default function AuthCallback() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('Iniciando sesión...')

  useEffect(() => {
    let cancelled = false
    let unsub = null
    let timeoutId = null

    async function pickIdentity() {
      for (let i = 0; i < MAX_RETRIES; i++) {
        if (cancelled) return null
        const { data, error } = await supabase.rpc('get_my_full_identity')
        if (!error && data && (data.kind === 'sub_tenant' || data.kind === 'retail' || data.kind === 'tenant')) {
          return data
        }
        await new Promise(r => setTimeout(r, RETRY_DELAY))
        if (i === 1) setStatus('Configurando tu cuenta...')
        if (i === 4) setStatus('Casi listo...')
      }
      return null
    }

    function destFor(identity) {
      if (!identity) return '/login'
      if (identity.kind === 'sub_tenant') return '/cliente'
      if (identity.kind === 'retail')     return '/mi-cuenta'
      if (identity.kind === 'tenant')     return '/'
      return '/login'
    }

    // Devuelve true si efectuó redirect cross-host (caller debe abortar el resto).
    //
    // v4: ya NO intentamos transferir el hash de OAuth al host destino. Con
    // PKCE flow el code verifier vive en localStorage del origin que inició
    // el OAuth — al transferir solo el code, el destino no puede canjearlo.
    // En su lugar:
    //   1. signOut local del origin equivocado (purga el JWT que
    //      detectSessionInUrl ya pudo haber creado)
    //   2. window.location.replace al /login del host correcto
    //   3. Allá supabase-js levanta la sesión del refresh_token global (que
    //      sigue válido) y el user entra. Si por algún motivo no levanta,
    //      el user simplemente vuelve a loguearse — un re-login es aceptable
    //      como red de seguridad.
    async function maybeCrossHostRedirect(identity) {
      const host = currentHost()
      const want = expectedHost(identity)
      if (!want || host === want) return false

      // Entre los 3 hosts productivos (apex/app/chat). No tocar admin/previews/localhost.
      const PROD_HOSTS = ['innovate-ia.com', 'www.innovate-ia.com', APP_HOST, CHAT_HOST]
      if (!PROD_HOSTS.includes(host)) return false

      // Anti-loop
      try {
        if (sessionStorage.getItem(CROSS_HOST_MARK) === '1') return false
        sessionStorage.setItem(CROSS_HOST_MARK, '1')
      } catch {}

      setStatus('Redirigiendo al panel correcto...')

      // Capa 3 (host isolation): purgar la sesión del origin equivocado.
      // Sin esto, el JWT queda persistido y un atacante con XSS podría hacer
      // fetch directo a las RPCs.
      // scope: 'local' = solo limpia este origin, no invalida el refresh_token
      // global del usuario. La sesión real se materializa en el host correcto.
      try {
        await supabase.auth.signOut({ scope: 'local' })
      } catch (e) {
        console.warn('[AuthCallback] local signOut antes de cross-host falló:', e)
      }

      // Limpiar storage de auth manualmente por las dudas (signOut a veces
      // no limpia 100%):
      try {
        const keysToWipe = []
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i)
          if (k && (k.startsWith('sb-') || k.includes('supabase'))) keysToWipe.push(k)
        }
        keysToWipe.forEach(k => localStorage.removeItem(k))
      } catch {}

      // Redirect al /login del host correcto. El refresh_token global sigue
      // válido — supabase-js allá lo recoge y el user entra sin re-login.
      // Si por algún motivo no lo recoge, el user re-loguea — eso es OK.
      const target = `https://${want}/login?fromCrossHost=1`
      window.location.replace(target)
      return true
    }

    async function go() {
      try {
        const { data: { session: existing } } = await supabase.auth.getSession()
        if (existing) {
          setStatus('Configurando tu cuenta...')
          const identity = await pickIdentity()
          if (cancelled) return
          // 21/05 — Apex solo retail: si entra sub_tenant/socio por Google, error.
          if (isApexHost(currentHost()) && identity && identity.kind !== 'retail') {
            await supabase.auth.signOut()
            const dest = identity.kind === 'sub_tenant' ? 'chat.innovate-ia.com/cliente/login' : 'app.innovate-ia.com'
            navigate('/login?error=apex_no_retail&dest=' + encodeURIComponent(dest), { replace: true })
            return
          }
          if (await maybeCrossHostRedirect(identity)) return
          try { sessionStorage.removeItem(CROSS_HOST_MARK) } catch {}
          navigate(destFor(identity), { replace: true })
          return
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (cancelled) return
            if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
              subscription.unsubscribe()
              setStatus('Configurando tu cuenta...')
              const identity = await pickIdentity()
              if (cancelled) return
              // 21/05 — Apex solo retail (mismo guard que arriba).
              if (isApexHost(currentHost()) && identity && identity.kind !== 'retail') {
                await supabase.auth.signOut()
                const dest = identity.kind === 'sub_tenant' ? 'chat.innovate-ia.com/cliente/login' : 'app.innovate-ia.com'
                navigate('/login?error=apex_no_retail&dest=' + encodeURIComponent(dest), { replace: true })
                return
              }
              if (await maybeCrossHostRedirect(identity)) return
              try { sessionStorage.removeItem(CROSS_HOST_MARK) } catch {}
              navigate(destFor(identity), { replace: true })
            } else if (event === 'SIGNED_OUT') {
              subscription.unsubscribe()
              navigate('/login', { replace: true })
            }
          }
        )
        unsub = () => subscription.unsubscribe()

        timeoutId = setTimeout(() => {
          if (cancelled) return
          if (unsub) unsub()
          navigate('/login', { replace: true })
        }, 20000)

      } catch (err) {
        console.error('[AuthCallback] error:', err)
        if (!cancelled) navigate('/login', { replace: true })
      }
    }

    go()
    return () => {
      cancelled = true
      if (unsub) unsub()
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [navigate])

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: C.bg, flexDirection: 'column', gap: 16,
      fontFamily: FONT.body,
    }}>
      <svg viewBox="0 0 32 32" fill="none" width="40" height="40">
        <circle cx="16" cy="16" r="14" fill={C.primary} opacity=".12"/>
        <circle cx="16" cy="16" r="10" fill={C.primary} opacity=".18"/>
        <rect x="11" y="10" width="2.5" height="12" rx="1.2" fill={C.primary}/>
        <path d="M18 22L21 10L24 22" stroke={C.primary} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <path d="M18.8 18L23.2 18" stroke={C.primary} strokeWidth="1.8" strokeLinecap="round"/>
        <circle cx="12.25" cy="8" r="1.4" fill={C.primary}/>
      </svg>
      <p style={{ color: C.primary, fontFamily: 'monospace', fontSize: 12, letterSpacing: 2 }}>
        {status}
      </p>
    </div>
  )
}
