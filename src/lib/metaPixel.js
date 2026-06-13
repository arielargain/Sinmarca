// ═══════════════════════════════════════════════════════════════════
// Meta Pixel — helper de la plataforma Innovate.ia
// ═══════════════════════════════════════════════════════════════════
//
// Pixel ID 1312283727497348 — para tracking de la landing comercial
// de innovate-ia.com (NO el de los tenants, que viven en tenant_secrets).
//
// Uso típico:
//
//   import { metaPixel } from '../lib/metaPixel'
//
//   useEffect(() => {
//     metaPixel.init()           // carga el script si no está
//     metaPixel.track('PageView')
//   }, [])
//
//   // En signup:
//   metaPixel.track('Lead', { content_name: 'Signup' }, eventId)
//
//   // En compra:
//   metaPixel.track('Purchase', { value: 35, currency: 'USD' }, eventId)
//
// Notas:
// - El parámetro `eventId` (3er arg) permite deduplicar entre Pixel cliente
//   y CAPI server-side. Mismo ID en ambos lados → Meta lo cuenta una sola vez.
// - init() es idempotente: chequea window.fbq antes de inyectar el script.
// - Si window no existe (SSR), las funciones son no-ops.
// ═══════════════════════════════════════════════════════════════════

export const META_PIXEL_ID = '1312283727497348'

function isBrowser() {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

function loadScript() {
  if (!isBrowser()) return
  if (window.fbq) return  // ya cargado

  // Snippet oficial de Meta convertido a vanilla JS
  ;(function(f, b, e, v) {
    if (f.fbq) return
    const n = f.fbq = function() {
      n.callMethod
        ? n.callMethod.apply(n, arguments)
        : n.queue.push(arguments)
    }
    if (!f._fbq) f._fbq = n
    n.push = n
    n.loaded = true
    n.version = '2.0'
    n.queue = []
    const t = b.createElement(e)
    t.async = true
    t.src = v
    const s = b.getElementsByTagName(e)[0]
    s.parentNode.insertBefore(t, s)
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js')
}

export const metaPixel = {
  /**
   * Inicializa el Pixel. Idempotente: se puede llamar múltiples veces
   * sin riesgo (chequea window.fbq y un flag interno para no re-init).
   */
  init() {
    if (!isBrowser()) return
    loadScript()
    // Solo init una vez por sesión de página
    if (!window.__meta_pixel_inited) {
      window.fbq('init', META_PIXEL_ID)
      window.__meta_pixel_inited = true
    }
  },

  /**
   * Trackea un evento. Si pasás eventId, Meta lo usa para deduplicar
   * con el evento equivalente que llegue por CAPI server-side.
   *
   * @param {string} event       'PageView' | 'Lead' | 'Purchase' | 'CompleteRegistration' | etc.
   * @param {object} [params]    Parámetros del evento (value, currency, content_name, etc.)
   * @param {string} [eventId]   ID determinístico para dedup con CAPI
   */
  track(event, params = {}, eventId) {
    if (!isBrowser() || !window.fbq) return
    if (eventId) {
      window.fbq('track', event, params, { eventID: eventId })
    } else {
      window.fbq('track', event, params)
    }
  },

  /**
   * Lee la cookie _fbp (Facebook browser ID) que setea fbevents.js al cargar.
   * Útil para mandarla al backend CAPI y mejorar el match rate.
   */
  getFbp() {
    if (!isBrowser()) return null
    const m = document.cookie.match(/(?:^|;\s*)_fbp=([^;]+)/)
    return m ? m[1] : null
  },

  /**
   * Lee/construye el _fbc (Facebook click ID) cuando el usuario llega
   * desde un anuncio. Si hay cookie _fbc, la usa; si no, construye desde
   * fbclid en la URL al formato fb.1.<ts>.<fbclid>.
   */
  getFbc() {
    if (!isBrowser()) return null
    const cookie = document.cookie.match(/(?:^|;\s*)_fbc=([^;]+)/)
    if (cookie) return cookie[1]
    const params = new URLSearchParams(window.location.search)
    const fbclid = params.get('fbclid')
    return fbclid ? `fb.1.${Date.now()}.${fbclid}` : null
  },
}
