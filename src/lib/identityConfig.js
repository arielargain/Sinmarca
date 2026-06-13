// ════════════════════════════════════════════════════════════════════
// identityConfig.js — Fuente única de verdad para identity del retail/sub-tenant
// ════════════════════════════════════════════════════════════════════
// Las 4 identidades soportadas (mismo enum que el constraint en DB:
// `tenants_identity_check: identity IN ('casino','tienda','marketing','profesional')`).
//
// CADA campo de este archivo es consumido por ALGÚN componente del panel
// retail/sub-tenant. Antes de cambiar la estructura, ver qué consume qué:
//
//   icon (Phosphor component)        → menú lateral, modal IdentityBlock, header
//   label                            → menú lateral, header, cards
//   accent                           → colores de cards en IdentityBlock
//   description / bestFor            → IdentityBlock (modal cambio)
//   menuLabel                        → label del item "Catálogo" en menú lateral
//   businessFields                   → array de campos a mostrar en card "Tu negocio"
//   botActions                       → array de acciones disponibles en ActionModal
//   instructions                     → qué componente Instrucciones renderizar
//   dashboard                        → labels de las tarjetas del dashboard
//
// Para agregar una identidad nueva:
//   1. Agregar el constraint check en DB (ALTER TABLE)
//   2. Agregar entry en IDENTITIES acá
//   3. Crear los componentes InstruccionesNegocio<X> y InstruccionesAgenteBot<X>
//   4. Verificar que las RPCs change_my_*_identity acepten el valor nuevo
//
// 16/05/2026 (S12): migrado de lucide-react a @phosphor-icons/react para
// eliminar duplicación de librerías de iconos. lucide era el único consumer.
// ════════════════════════════════════════════════════════════════════
import {
  DiceFive,
  ShoppingBag,
  Megaphone,
  Briefcase,
} from '@phosphor-icons/react'

// Default si el campo identity viene null o no es un valor válido.
// 'casino' es el default histórico del schema (column_default).
export const DEFAULT_IDENTITY = 'casino'

export const IDENTITIES = [
  {
    // ── identidad CASINO ──────────────────────────────────────────────
    key: 'casino',
    label: 'Casino',
    Icon: DiceFive,
    accent: '#22c55e',
    description:
      'El bot crea cuentas de jugador, genera links de carga vía Mercado Pago y acredita saldo automáticamente al casino (motor ImperiumBet).',
    bestFor:
      'Operadores de casino online que quieran automatizar altas y depósitos por WhatsApp.',

    // Label del ítem "Catálogo" del menú lateral
    menuLabel: 'Catálogo',

    // Campos visibles en la card "Tu negocio" (panel /mi-cuenta y /cliente).
    // Cada uno es una key de tenant_config / sub_tenant_settings.
    businessFields: [
      'casino_name',           // genérico: el "nombre del negocio"
      'casino_url',            // genérico: el "link de tu negocio"
      'min_deposit',
      'min_withdrawal',
      'welcome_bonus_pct',
      'schedule',
      'wa_group',
    ],

    // Acciones que el operador puede ejecutar desde el ActionModal en /chats.
    // Cada key debe matchear una rama en el componente ActionModal.
    botActions: [
      'create_user',
      'credit_balance',
      'debit_balance',
      'reset_password',
    ],

    // Componentes de instrucciones a renderizar en /mi-cuenta/instrucciones.
    instructions: {
      negocio: 'InstruccionesNegocioCasino',
      bot: 'InstruccionesAgenteBotCasino',
    },

    // Labels para tarjetas del dashboard.
    dashboard: {
      conversionsLabel: 'Cuentas creadas',
      revenueLabel: 'Depósitos acreditados',
      pendingLabel: 'Pagos en proceso',
    },
  },

  {
    // ── identidad TIENDA ──────────────────────────────────────────────
    key: 'tienda',
    label: 'Tienda',
    Icon: ShoppingBag,
    accent: '#3b82f6',
    description:
      'El bot atiende consultas sobre productos, toma pedidos, genera links de pago y avisa al equipo cuándo despachar.',
    bestFor:
      'E-commerce, tiendas locales o negocios que vendan productos físicos por WhatsApp.',

    menuLabel: 'Productos',

    businessFields: [
      'casino_name',           // reusamos como "Nombre del negocio"
      'casino_url',            // reusamos como "Link de la tienda"
      'schedule',
      'wa_group',
    ],

    botActions: [
      'create_order',          // tomar pedido
      'mark_delivered',        // marcar entregado
      'cancel_order',
    ],

    instructions: {
      negocio: 'InstruccionesNegocioTienda',
      bot: 'InstruccionesAgenteBotTienda',
    },

    dashboard: {
      conversionsLabel: 'Pedidos confirmados',
      revenueLabel: 'Ventas',
      pendingLabel: 'Pedidos pendientes',
    },
  },

  {
    // ── identidad MARKETING ───────────────────────────────────────────
    key: 'marketing',
    label: 'Marketing',
    Icon: Megaphone,
    accent: '#a78bfa',
    description:
      'El bot califica leads de campañas, agenda demos y deriva a un comercial. Pensado para landings + ads.',
    bestFor:
      'Agencias, infoproductos y servicios que corran campañas de captación.',

    menuLabel: 'Campañas',

    businessFields: [
      'casino_name',           // reusamos como "Nombre de la marca/agencia"
      'casino_url',            // reusamos como "Sitio web"
      'schedule',
      'wa_group',
    ],

    botActions: [
      'qualify_lead',          // calificar lead
      'schedule_demo',         // agendar demo
      'forward_to_sales',      // derivar a comercial
    ],

    instructions: {
      negocio: 'InstruccionesNegocioMarketing',
      bot: 'InstruccionesAgenteBotMarketing',
    },

    dashboard: {
      conversionsLabel: 'Leads calificados',
      revenueLabel: 'Demos agendadas',
      pendingLabel: 'Leads sin calificar',
    },
  },

  {
    // ── identidad PROFESIONAL ─────────────────────────────────────────
    key: 'profesional',
    label: 'Profesional',
    Icon: Briefcase,
    accent: '#ec4899',
    description:
      'El bot funciona como agente comercial / asistente: responde dudas, agenda turnos y filtra a quién derivar.',
    bestFor:
      'Profesionales independientes, consultoras y servicios B2B.',

    menuLabel: 'Servicios',

    businessFields: [
      'casino_name',           // reusamos como "Nombre profesional / consultora"
      'casino_url',            // reusamos como "Sitio web / portfolio"
      'schedule',
      'wa_group',
    ],

    botActions: [
      'schedule_appointment',  // reservar turno
      'cancel_appointment',
      'send_quote',            // enviar presupuesto
    ],

    instructions: {
      negocio: 'InstruccionesNegocioProfesional',
      bot: 'InstruccionesAgenteBotProfesional',
    },

    dashboard: {
      conversionsLabel: 'Turnos confirmados',
      revenueLabel: 'Presupuestos enviados',
      pendingLabel: 'Consultas pendientes',
    },
  },
]

// ─── Helpers ────────────────────────────────────────────────────────

/**
 * Devuelve el config completo de una identity dada.
 * Si la key es null, undefined o no existe, devuelve el default (casino).
 */
export function getIdentityConfig(key) {
  if (!key) return IDENTITIES.find(i => i.key === DEFAULT_IDENTITY)
  return IDENTITIES.find(i => i.key === key)
      || IDENTITIES.find(i => i.key === DEFAULT_IDENTITY)
}

/**
 * Devuelve solo la lista de keys válidas (útil para validaciones).
 */
export function getValidIdentityKeys() {
  return IDENTITIES.map(i => i.key)
}

/**
 * Chequea si una key es válida.
 */
export function isValidIdentity(key) {
  return getValidIdentityKeys().includes(key)
}

/**
 * Helper para checkear si un campo concreto debe verse para una identity.
 * Ej: shouldShowField('welcome_bonus_pct', 'casino') → true
 *     shouldShowField('welcome_bonus_pct', 'tienda') → false
 */
export function shouldShowField(fieldKey, identityKey) {
  const config = getIdentityConfig(identityKey)
  return config.businessFields.includes(fieldKey)
}

/**
 * Helper para checkear si una acción del bot está disponible para una identity.
 * Ej: hasBotAction('create_user', 'casino')  → true
 *     hasBotAction('create_user', 'tienda')  → false
 *     hasBotAction('create_order', 'tienda') → true
 */
export function hasBotAction(actionKey, identityKey) {
  const config = getIdentityConfig(identityKey)
  return config.botActions.includes(actionKey)
}
