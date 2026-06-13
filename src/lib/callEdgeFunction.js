// ══════════════════════════════════════════════════════
// Helper para invocar Edge Functions autenticadas.
// Agrega el Bearer JWT del user actual + anon apikey automáticamente.
// ══════════════════════════════════════════════════════
import { supabase } from './supabase'

/**
 * POST a una Edge Function con el JWT del user autenticado.
 * @param {string} url  URL completa de la EF (usar constantes de ./constants)
 * @param {object} body payload a mandar como JSON
 * @returns {Promise<{ok:boolean, status:number, data:any}>}
 */
export async function callEdgeFunction(url, body) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return { ok: false, status: 401, data: { error: 'no_session' } }
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body || {}),
    })
    let data = {}
    try { data = await res.json() } catch { /* empty body is ok */ }
    return { ok: res.ok, status: res.status, data }
  } catch (e) {
    return { ok: false, status: 0, data: { error: e.message } }
  }
}
