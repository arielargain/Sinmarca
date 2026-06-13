// ════════════════════════════════════════════════════════════════════
// hostConfig.js — FUENTE ÚNICA DE VERDAD para la decisión por host.
//
// 12/06/2026 — Tenant vive en innovate-ia.com (dominio principal).
// app.innovate-ia.com es alias (misma categoría partner).
// chat.innovate-ia.com sigue siendo subtenant.
// Retail desactivado (se va a proyecto separado).
// ════════════════════════════════════════════════════════════════════

function rawHost() {
  if (typeof window === 'undefined') return ''
  return window.location.hostname.replace(/\.$/, '').toLowerCase()
}

const PARTNER_CONFIG = {
  category: 'partner',
  skin: 'tenant',
  loginPath: '/login',
  homePath: '/',
  registerPath: '/register',
  allowsGoogle: true,
  allowsRegister: true,
}

const HOST_TABLE = [
  {
    // Dominio principal — tenant (landing + panel)
    match: (h) => h === 'innovate-ia.com' || h === 'www.innovate-ia.com',
    config: PARTNER_CONFIG,
  },
  {
    // Alias del tenant
    match: (h) => h === 'app.innovate-ia.com',
    config: PARTNER_CONFIG,
  },
  {
    // Sub-tenant
    match: (h) => h === 'chat.innovate-ia.com',
    config: {
      category: 'subtenant',
      skin: 'chat',
      loginPath: '/cliente/login',
      homePath: '/cliente',
      registerPath: null,
      allowsGoogle: false,
      allowsRegister: false,
    },
  },
]

// Fallback (admin, previews, localhost)
const FALLBACK = PARTNER_CONFIG

export function resolveHost(hostnameArg) {
  const h = (hostnameArg || rawHost())
  for (const entry of HOST_TABLE) {
    if (entry.match(h)) return { host: h, ...entry.config }
  }
  return { host: h, ...FALLBACK }
}

export function hostCategory()  { return resolveHost().category }
export function hostSkin()      { return resolveHost().skin }
export function hostLoginPath() { return resolveHost().loginPath }
export function hostHomePath()  { return resolveHost().homePath }

export function hostAcceptsCategory(category) {
  return resolveHost().category === category
}
