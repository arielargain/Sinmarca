// ═══════════════════════════════════════════════════════════════════
// quickReplies.js — Templates de respuestas rápidas por identity
//
// 11/05/2026 sprint quick-replies-per-identity:
// Cada identity tiene su propio set de fields relevantes. El QuickRepliesModal
// (en Chats.jsx) y el editor QuickRepliesEditor consumen este helper para
// saber qué mostrar para cada retail/sub-tenant.
//
// Schema en DB (tenant_config y sub_tenants, columnas text):
//   qr_cvu          → "Datos de pago" (universal, sirve a todas las identities)
//   qr_credentials  → "Credenciales del usuario" con {usuario}/{clave}/{link} (casino only)
//   qr_access_link  → "Link de acceso" (casino only)
//   qr_address      → "Dirección/Ubicación" (profesional, tienda)
//   qr_pricing      → "Precios/Aranceles" (profesional, marketing)
//   qr_schedule     → "Horarios de atención" (profesional, tienda)
//   qr_catalog_link → "Link al catálogo" (tienda, marketing)
//   qr_demo_info    → "Info para agendar demo" (marketing)
//   qr_custom[]     → libre, todas las identities (jsonb array de {label, text})
//
// El SCHEMA define qué fields se muestran para qué identity y con qué label/icon.
// Los QR_DEFAULTS sugieren copys default cuando el field está vacío.
// ═══════════════════════════════════════════════════════════════════

/**
 * Definición de fields por identity.
 * Cada entrada: { key, icon, label, hint, hasVars }
 * - key: nombre de la columna en tenant_config/sub_tenants
 * - hasVars: si el texto puede contener {usuario}/{clave}/{link} (solo casino)
 */
export const QUICK_REPLY_SCHEMA = {
  casino: [
    { key: 'qr_cvu',          icon: '💰', label: 'Datos de cobranza (CVU/Alias)', hint: 'CVU, alias o info para que el cliente transfiera.', hasVars: false },
    { key: 'qr_credentials',  icon: '👤', label: 'Credenciales del usuario',      hint: 'Plantilla con {usuario}, {clave} y {link}. Las variables se reemplazan al insertar.', hasVars: true },
    { key: 'qr_access_link',  icon: '🔗', label: 'Link de acceso',                hint: 'Link al panel del casino para que el cliente entre.', hasVars: false },
  ],
  profesional: [
    { key: 'qr_cvu',          icon: '💰', label: 'Datos de pago',                  hint: 'CVU, alias, MP — cómo te transfieren las consultas y turnos.', hasVars: false },
    { key: 'qr_address',      icon: '📍', label: 'Dirección / Ubicación',          hint: 'Dirección del consultorio o link de Google Maps.', hasVars: false },
    { key: 'qr_schedule',     icon: '🕒', label: 'Horarios de atención',           hint: 'Días y horarios de atención.', hasVars: false },
    { key: 'qr_pricing',      icon: '💵', label: 'Aranceles / Honorarios',         hint: 'Lista de precios por consulta o tipo de servicio.', hasVars: false },
  ],
  tienda: [
    { key: 'qr_cvu',          icon: '💰', label: 'Datos de pago',                  hint: 'CVU, alias, MP — cómo te transfieren las compras manuales.', hasVars: false },
    { key: 'qr_address',      icon: '📍', label: 'Dirección / Local',              hint: 'Dirección del local o zona de retiro.', hasVars: false },
    { key: 'qr_schedule',     icon: '🕒', label: 'Horarios de atención',           hint: 'Días y horarios del local.', hasVars: false },
    { key: 'qr_catalog_link', icon: '🛍', label: 'Link al catálogo',               hint: 'Link a tu tienda online o catálogo PDF/imagen.', hasVars: false },
  ],
  marketing: [
    { key: 'qr_cvu',          icon: '💰', label: 'Datos de pago',                  hint: 'CVU, alias o link de cobranza para servicios.', hasVars: false },
    { key: 'qr_pricing',      icon: '💵', label: 'Precios / Planes',               hint: 'Lista de planes o precios del servicio.', hasVars: false },
    { key: 'qr_demo_info',    icon: '📅', label: 'Datos para la demo',             hint: 'Qué preparar antes de la demo, link de Zoom/Meet, agenda.', hasVars: false },
    { key: 'qr_catalog_link', icon: '🔗', label: 'Link al material',               hint: 'Link a presentación, propuesta o landing comercial.', hasVars: false },
  ],
}

/**
 * Sugerencias default por field (placeholders en el editor).
 * El operador puede pisar cada una con su copy real.
 */
export const QUICK_REPLY_DEFAULTS = {
  // Universales
  qr_cvu: 'Podés transferirnos a:\nCVU: 0000003100012345678901\nAlias: mi.alias.mp\nTitular: [Tu nombre]',

  // Casino
  qr_credentials: '👤 Usuario: {usuario}\n🔑 Contraseña: {clave}\n🔗 Link: {link}',
  qr_access_link: 'Ingresá al panel del casino:\nhttps://mi-casino.com',

  // Profesional + Tienda
  qr_address: '📍 Dirección:\n[Calle 1234, Localidad]\nVer mapa: https://maps.google.com/...',
  qr_schedule: '🕒 Horarios de atención:\nLunes a viernes: 9 a 18hs\nSábados: 9 a 13hs',

  // Profesional + Marketing
  qr_pricing: '💵 Aranceles:\nConsulta: $X.XXX\nSesión completa: $X.XXX\n\nLa primera consulta tiene 10% de descuento.',

  // Tienda + Marketing
  qr_catalog_link: 'Mirá nuestro catálogo:\nhttps://mi-tienda.com',

  // Marketing
  qr_demo_info: 'Para la demo:\n• Duración: 30 minutos\n• Modalidad: Zoom (te paso el link al confirmar)\n• Preparate con: tus métricas actuales y objetivos\n\nHorarios disponibles: martes y jueves de 10 a 17hs.',
}

/**
 * Devuelve la lista de templates configurados para un entity (retail/sub-tenant).
 * Solo incluye los que están definidos en el schema de la identity Y tienen
 * un valor no-vacío en el entity. Suma además qr_custom[] al final.
 *
 * @param {object} entity - retail o sub-tenant (con identity y qr_* fields)
 * @returns {Array<{key, icon, label, text, hasVars}>}
 */
export function getActiveQuickReplies(entity) {
  if (!entity) return []
  const identity = entity.identity || 'casino'
  const schema = QUICK_REPLY_SCHEMA[identity] || QUICK_REPLY_SCHEMA.casino
  const hasValue = (v) => v && String(v).trim().length > 0

  const templates = []

  // Fields del schema según identity
  for (const f of schema) {
    if (hasValue(entity[f.key])) {
      templates.push({
        key: f.key,
        icon: f.icon,
        label: f.label,
        text: entity[f.key],
        hasVars: f.hasVars,
      })
    }
  }

  // Custom (siempre se muestran, en todas las identities)
  ;(entity.qr_custom || []).forEach((q, i) => {
    if (hasValue(q?.text)) {
      templates.push({
        key: `custom_${i}`,
        icon: '💬',
        label: q.label || 'Respuesta rápida',
        text: q.text,
        hasVars: false,
      })
    }
  })

  return templates
}

/**
 * Devuelve el schema de fields que el editor debe mostrar para un identity dado.
 * Incluye fields configurados (con valor) Y vacíos (para que el operador los pueda llenar).
 *
 * @param {string} identity - 'casino' | 'profesional' | 'tienda' | 'marketing'
 * @returns {Array<{key, icon, label, hint, hasVars}>}
 */
export function getQuickReplyFields(identity) {
  return QUICK_REPLY_SCHEMA[identity || 'casino'] || QUICK_REPLY_SCHEMA.casino
}

/**
 * ¿La identity soporta este field? Útil para el save: si el usuario está en
 * profesional, no le grabamos qr_credentials aunque accidentalmente venga en el form.
 */
export function isFieldAllowedForIdentity(key, identity) {
  if (key === 'qr_custom') return true
  const fields = getQuickReplyFields(identity)
  return fields.some(f => f.key === key)
}
