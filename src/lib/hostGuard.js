import { supabase } from './supabase'
import { resolveHost } from './hostConfig'

/**
 * Validación de host post-login (21/05/2026 — reescrito con FUENTE ÚNICA).
 *
 * La categoría que cada host acepta sale de hostConfig.resolveHost(), el MISMO
 * lugar del que salen el routing y el skin. Una sola regla: la categoría del
 * usuario debe coincidir con la del host; si no, signOut + error indicando dónde.
 *
 * Devuelve { kind, redirectTo } si coincide.
 */

/**
 * Llamar después de cualquier signIn exitoso. Detecta el kind via
 * get_my_full_identity y corrobora que coincida con el host actual.
 *
 * Si NO coincide:
 *   - signOut()
 *   - throw new Error con mensaje human-readable
 *
 * Si coincide, retorna { kind, redirectTo } donde redirectTo es la ruta
 * a la que el caller debería navegar.
 */
export async function assertAllowedHostForIdentity(expectedKind = null) {
  // Esperar un instante: a veces get_my_full_identity sufre race justo después
  // del signIn. Reintentamos hasta 6 veces con 500ms de gap (antes 3x400ms,
  // insuficiente y expulsaba al sub-tenant al volver al login). 21/05.
  let identity = null
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      const { data, error } = await supabase.rpc('get_my_full_identity')
      if (!error && data && data.kind && data.kind !== 'none') {
        identity = data
        break
      }
    } catch { /* ignore, retry */ }
    await new Promise(r => setTimeout(r, 500))
  }

  if (!identity || !identity.kind || identity.kind === 'none') {
    // No se pudo determinar el kind tras los reintentos (race con la sesión recién
    // creada). En vez de mandar a '/' (que en chat expulsa al sub-tenant de vuelta
    // al login), confiamos en el login que se usó: mandamos al panel del expectedKind
    // y dejamos que App.jsx (AuthContext, con más reintentos) revalide. 21/05 fix.
    console.warn('[host-guard] identity no determinada; uso expectedKind:', expectedKind)
    if (expectedKind === 'sub_tenant') return { kind: 'sub_tenant', redirectTo: '/cliente' }
    if (expectedKind === 'retail')     return { kind: 'retail',     redirectTo: '/mi-cuenta' }
    return { kind: 'unknown', redirectTo: '/' }
  }

  const kind = identity.kind
  const hc = resolveHost()  // FUENTE ÚNICA: categoría que ESTE host acepta

  // kind (get_my_full_identity) → category (hostConfig)
  const kindToCategory = { tenant: 'partner', retail: 'retail', sub_tenant: 'subtenant' }
  const myCategory = kindToCategory[kind] || 'unknown'

  // Panel destino según el kind real
  const homeByKind = { tenant: '/', retail: '/mi-cuenta', sub_tenant: '/cliente' }
  const loginByCategory = {
    partner:   'app.innovate-ia.com',
    retail:    'innovate-ia.com',
    subtenant: 'chat.innovate-ia.com/cliente/login',
  }

  // ✅ La categoría del usuario coincide con la del host → entra a su panel.
  if (myCategory === hc.category) {
    return { kind, redirectTo: homeByKind[kind] || '/' }
  }

  // ❌ No coincide → este host NO es para esta cuenta. signOut + error claro,
  // indicando dónde debe ingresar. (Una sola regla para los 3 hosts.)
  await supabase.auth.signOut()
  const donde = loginByCategory[myCategory]
  if (donde) {
    throw new Error(
      'Esta cuenta no puede ingresar desde este sitio. Iniciá sesión en ' + donde + '.'
    )
  }
  throw new Error('Tu cuenta no tiene permiso para acceder desde este sitio.')
}

/**
 * Helper para pintar mensajes de error post-rechazo. Los mensajes ya vienen
 * de assertAllowedHostForIdentity en formato user-friendly, así que esta
 * función simplemente los pasa.
 */
export function isHostMismatchError(err) {
  if (!err || !err.message) return false
  const m = err.message.toLowerCase()
  return m.includes('app.innovate-ia.com') ||
         m.includes('chat.innovate-ia.com') ||
         m.includes('no podés ingresar desde acá') ||
         m.includes('no tiene permiso para acceder')
}
