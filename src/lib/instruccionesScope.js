// ═════════════════════════════════════════════════════════════════
// instruccionesScope.js — 13/05/2026
// ─────────────────────────────────────────────────────────────────
// Helper para detectar bajo qué shell se está renderizando una página
// de Instrucciones, y devolver los paths correctos para navegación.
//
// Tres scopes posibles:
//   • '/cliente/instrucciones/*'   — sub-tenant (panel /cliente)
//   • '/mi-cuenta/instrucciones/*' — retail (panel /mi-cuenta)
//   • '/instrucciones/*'           — tenant partner (panel raíz)
//
// Antes del 13/05/2026 muchos componentes (Instrucciones*.jsx +
// _WalletTutorialLayout + _AgenteTutorialLayout) usaban un patrón
// booleano isFromCliente que solo discriminaba '/cliente' vs todo lo
// demás. Eso provocaba que el retail (que vive en /mi-cuenta/...)
// navegara a /instrucciones/... — ruta que NO existe en chat host —
// y terminara en el catch-all → /login → redirect a /mi-cuenta.
// Síntoma reportado por owner: "abro mercadopago y me lleva a inicio".
//
// Este helper centraliza la detección en un único lugar para que el
// fix no se desincronice si en el futuro se agregan más scopes.
// ═════════════════════════════════════════════════════════════════

/**
 * Devuelve el path raíz de instrucciones según el pathname actual.
 *
 * @param {string} pathname - typically location.pathname desde useLocation()
 * @returns {string} - '/cliente/instrucciones' | '/mi-cuenta/instrucciones' | '/instrucciones'
 */
export function getInstruccionesBase(pathname) {
  if (!pathname || typeof pathname !== 'string') return '/instrucciones'
  if (pathname.startsWith('/cliente'))    return '/cliente/instrucciones'
  if (pathname.startsWith('/mi-cuenta'))  return '/mi-cuenta/instrucciones'
  return '/instrucciones'
}

/**
 * Atajo opcional para componentes que solo necesitan saber bajo qué
 * shell están corriendo. Devuelve uno de: 'subTenant' | 'retail' | 'partner'.
 *
 * Útil cuando hay UI condicional según el shell (no solo paths).
 *
 * @param {string} pathname
 * @returns {'subTenant'|'retail'|'partner'}
 */
export function getInstruccionesScope(pathname) {
  if (!pathname || typeof pathname !== 'string') return 'partner'
  if (pathname.startsWith('/cliente'))    return 'subTenant'
  if (pathname.startsWith('/mi-cuenta'))  return 'retail'
  return 'partner'
}
