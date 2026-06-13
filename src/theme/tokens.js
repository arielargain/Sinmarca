// ═══════════════════════════════════════════════════════════════════
// INNOVATE.IA — DESIGN TOKENS v9
// REGLA CANÓNICA: el SKIN lo define el DOMINIO, no el rol del user
//   - app.innovate-ia.com → skin DORADO (tenantPalette)
//   - chat.innovate-ia.com → skin AZUL institucional (chatPalette)
//   - innovate-ia.com (apex) + www → skin AZUL (retail oficial, 21/05/2026)
//
// v9 (17/05/2026) — a11y Lighthouse 79 → 90+:
//   - tenant.muted #6b7085 → #8590A8 (contrast 3.84:1 → 5.1:1 ✅)
//   - tenant.dim   #4a4e63 → #7280A0 (contrast 2.16:1 → 4.6:1 ✅)
//   Solo afecta skin tenant; chat ya tenía contrast OK.
// ═══════════════════════════════════════════════════════════════════
// 21/05/2026 — el apex innovate-ia.com ahora sirve retail (decisión "landing + retail"),
// 21/05/2026 — El skin ahora sale de la FUENTE ÚNICA hostConfig.resolveHost().
// Ya NO hay lista propia acá (eso causaba desincronización con el routing).
import { hostSkin } from '../lib/hostConfig';

const SKIN = hostSkin();
const IS_CHAT = SKIN === 'chat';

// ── PALETA TENANT (DORADO — app.innovate-ia.com) ─────────────────
const tenantPalette = {
  bg:           '#080B12',
  card:         '#111420',
  surface:      '#0D1018',
  surface2:     '#181B2A',
  border:       '#1e2130',
  borderStrong: '#2a2f45',
  text:         '#E9E7E0',
  muted:        '#8590A8',  // v9 a11y: era #6b7085 (3.84:1) → #8590A8 (5.1:1 sobre bg)
  dim:          '#7280A0',  // v9 a11y: era #4a4e63 (2.16:1) → #7280A0 (4.6:1 sobre bg)
  primary:      '#D4A843',
  primaryDim:   '#B8902B',
  primaryLite:  '#E5BA59',
  primarySoft:  '#D4A84318',
  accent:       '#D4A843',
  accentDim:    '#B8902B',
  accentSoft:   '#D4A84318',
  brand:        '#D4A843',
  brandDim:     '#B8902B',
  brandSoft:    '#D4A84318',
};

// ── PALETA CHAT (AZUL institucional — chat.innovate-ia.com) ──────
const chatPalette = {
  bg:           '#060912',     // azul muy oscuro casi negro
  card:         '#0D1220',     // card azul oscuro
  surface:      '#0A0F1C',
  surface2:     '#131A2C',     // superficie elevada
  border:       '#1F2942',     // hairline azul
  borderStrong: '#2A3656',
  text:         '#EDF1F8',     // blanco frío
  muted:        '#8595B5',     // azul gris (6.68:1 ✅)
  dim:          '#7382A5',     // v9 a11y: era #5C6985 (3.95:1) → #7382A5 (4.6:1)
  primary:      '#2D6BD8',     // azul institucional
  primaryDim:   '#1F4FAA',
  primaryLite:  '#5589E8',
  primarySoft:  '#2D6BD81F',
  accent:       '#E8B547',     // dorado de acento (botones CTA)
  accentDim:    '#C99836',
  accentSoft:   '#E8B5471F',
  brand:        '#2D6BD8',
  brandDim:     '#1F4FAA',
  brandSoft:    '#2D6BD81F',
};

const P = IS_CHAT ? chatPalette : tenantPalette;

const success     = IS_CHAT ? '#3DD68C' : '#22c55e';
const successSoft = IS_CHAT ? '#3DD68C1F' : '#22c55e18';
const info        = IS_CHAT ? P.primary : '#4a9eff';
const infoSoft    = IS_CHAT ? P.primarySoft : '#4a9eff18';
const warning     = IS_CHAT ? '#F4B740' : '#f59e0b';
const warningSoft = IS_CHAT ? '#F4B7401F' : '#f59e0b18';
const danger      = IS_CHAT ? '#E84545' : '#ef4444';
const dangerSoft  = IS_CHAT ? '#E845451F' : '#ef444418';
const crypto      = '#f7931a';
const ai          = IS_CHAT ? '#9C7AF2' : '#8b5cf6';
const wa          = IS_CHAT ? '#3DD68C' : '#25d366';

export const COLORS = {
  bg: P.bg, card: P.card, surface: P.surface, surface2: P.surface2,
  border: P.border, borderStrong: P.borderStrong,
  text: P.text, muted: P.muted, dim: P.dim,
  primary: P.primary, primaryDim: P.primaryDim, primaryLite: P.primaryLite, primarySoft: P.primarySoft,
  accent: P.accent, accentDim: P.accentDim, accentSoft: P.accentSoft,
  brand: P.brand, brandDim: P.brandDim, brandSoft: P.brandSoft,
  success, successSoft, info, infoSoft, warning, warningSoft,
  danger, dangerSoft, crypto, ai, wa,
  gold: P.accent, goldDim: P.accentDim, green: success, red: danger,
  blue: IS_CHAT ? P.primary : '#4a9eff',
};

export const SKIN_NAME = SKIN;
export const IS_CHAT_SKIN = IS_CHAT;
// Mantengo IS_ADMIN_SKIN como alias para compatibilidad con código existente
export const IS_ADMIN_SKIN = IS_CHAT;

// ── RADIUS ────────────────────────────────────────────────────────
export const RADIUS = IS_CHAT ? {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   22,
  pill: 999,
} : {
  sm:   6,
  md:   10,
  lg:   14,
  xl:   20,
  pill: 999,
};

export const SHADOW = {
  card:   IS_CHAT ? '0 1px 3px rgba(0,0,0,.4), 0 8px 24px rgba(0,0,0,.3)' : '0 1px 3px rgba(0,0,0,.3)',
  button: `0 2px 8px ${P.primary}40`,
  hover:  IS_CHAT ? '0 2px 6px rgba(0,0,0,.5), 0 16px 40px rgba(0,0,0,.4)' : `0 4px 14px ${P.primary}59`,
  modal:  IS_CHAT ? '0 32px 100px rgba(0,0,0,.85)' : '0 24px 80px rgba(0,0,0,.6)',
  focus:  `0 0 0 3px ${P.primary}33`,
};

export const SPACING = { xs:4, sm:8, md:12, lg:16, xl:20, xxl:32 };

// ── TYPOGRAPHY ────────────────────────────────────────────────────
export const FONT = {
  body: IS_CHAT
    ? 'Manrope, Inter, -apple-system, BlinkMacSystemFont, system-ui, sans-serif'
    : 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  mono: IS_CHAT
    ? '"DM Mono", "JetBrains Mono", "SF Mono", Menlo, Monaco, monospace'
    : '"SF Mono", Menlo, Monaco, Consolas, monospace',
};

export const FONT_SIZE = { xs:10, sm:11, md:12, base:13, lg:15, xl:18, xxl:24, hero:32 };
export const FONT_WEIGHT = { normal:400, medium:500, semibold:600, bold:700, black:800 };
export const TRANSITION = { fast:'120ms cubic-bezier(.4,0,.2,1)', base:'200ms cubic-bezier(.4,0,.2,1)', slow:'320ms cubic-bezier(.4,0,.2,1)' };
export const Z = { base:1, sticky:10, dropdown:50, modal:1000, toast:2000 };
