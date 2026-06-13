import { COLORS, RADIUS, SHADOW, FONT_SIZE, FONT_WEIGHT, TRANSITION } from '../../theme/tokens'

/**
 * Button unificado para toda la app.
 *
 * Variants:
 *  - primary:   acción principal (gold sólido). MAX 1 por pantalla.
 *  - secondary: acción secundaria (outline neutro)
 *  - ghost:     acción terciaria (solo texto, hover sutil)
 *  - danger:    destructiva (rojo outline)
 *  - success:   confirmaciones (verde sólido)
 *  - crypto:    pago cripto (btc outline)
 *  - ai:        features IA generativa (violeta sólido)
 *
 * Sizes:
 *  - sm (9×12 padding, font 11)
 *  - md (10×16 padding, font 12) [default]
 *  - lg (12×20 padding, font 13)
 *
 * Uso:
 *   <Button variant="primary" onClick={...}>Guardar</Button>
 *   <Button variant="danger" size="sm" icon="🗑">Eliminar</Button>
 *
 * Accesibilidad (S13):
 *  - `:focus-visible` outline visible para usuarios con teclado
 *  - IconButton acepta `ariaLabel` prop obligatorio para screen readers
 */

const VARIANTS = {
  primary: {
    bg: `linear-gradient(135deg, ${COLORS.brand}, ${COLORS.brandDim})`,
    color: '#080B12',
    border: 'none',
    shadow: SHADOW.button,
    hoverShadow: SHADOW.hover,
    hoverTransform: 'translateY(-1px)',
  },
  // 15/05/2026 — variant "accent" usa COLORS.accent (en retail = dorado #E8B547,
  // en partner = mismo dorado #D4A843). Util cuando se quiere CTA dorado en
  // retail sin tocar la paleta primary azul.
  accent: {
    bg: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accentDim})`,
    color: '#080B12',
    border: 'none',
    shadow: SHADOW.button,
    hoverShadow: SHADOW.hover,
    hoverTransform: 'translateY(-1px)',
  },
  secondary: {
    bg: 'transparent',
    color: COLORS.text,
    border: `1px solid ${COLORS.border}`,
    shadow: 'none',
    hoverBg: COLORS.surface,
    hoverBorder: COLORS.borderStrong,
  },
  ghost: {
    bg: 'transparent',
    color: COLORS.muted,
    border: '1px solid transparent',
    shadow: 'none',
    hoverBg: COLORS.surface,
    hoverColor: COLORS.text,
  },
  danger: {
    bg: 'transparent',
    color: COLORS.danger,
    border: `1px solid ${COLORS.danger}40`,
    shadow: 'none',
    hoverBg: COLORS.dangerSoft,
    hoverBorder: `${COLORS.danger}80`,
  },
  success: {
    bg: COLORS.success,
    color: '#062C13',
    border: 'none',
    shadow: `0 2px 8px ${COLORS.success}40`,
    hoverTransform: 'translateY(-1px)',
  },
  crypto: {
    bg: `${COLORS.crypto}10`,
    color: COLORS.crypto,
    border: `1px solid ${COLORS.crypto}40`,
    shadow: 'none',
    hoverBg: `${COLORS.crypto}22`,
    hoverBorder: `${COLORS.crypto}80`,
  },
  ai: {
    bg: `linear-gradient(135deg, ${COLORS.ai}, #7c3aed)`,
    color: '#ffffff',
    border: 'none',
    shadow: `0 2px 8px ${COLORS.ai}40`,
    hoverShadow: `0 4px 14px ${COLORS.ai}59`,
    hoverTransform: 'translateY(-1px)',
  },
}

const SIZES = {
  sm: { padding: '7px 12px', fontSize: FONT_SIZE.sm, iconSize: 12 },
  md: { padding: '9px 16px', fontSize: FONT_SIZE.md, iconSize: 14 },
  lg: { padding: '12px 20px', fontSize: FONT_SIZE.base, iconSize: 16 },
}

// ─── Inyección de keyframes / estilos a11y (1 sola vez) ──────────────
// Inyectamos los estilos de :focus-visible vía <style> en runtime para
// no depender de Tailwind ni CSS global. Esto da feedback visual claro
// a usuarios que navegan con teclado (Tab key).
const A11Y_STYLE_ID = 'ui-button-a11y'

function ensureA11yStyles() {
  if (typeof document === 'undefined') return
  if (document.getElementById(A11Y_STYLE_ID)) return
  const style = document.createElement('style')
  style.id = A11Y_STYLE_ID
  style.textContent = `
    .ui-btn:focus-visible,
    .ui-icon-btn:focus-visible {
      outline: 2px solid ${COLORS.primary};
      outline-offset: 2px;
    }
    .ui-btn:focus:not(:focus-visible),
    .ui-icon-btn:focus:not(:focus-visible) {
      outline: none;
    }
  `
  document.head.appendChild(style)
}

export default function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  disabled = false,
  loading = false,
  fullWidth = false,
  children,
  onClick,
  type = 'button',
  title,
  ariaLabel,
  style: extraStyle,
}) {
  ensureA11yStyles()

  const v = VARIANTS[variant] || VARIANTS.primary
  const s = SIZES[size] || SIZES.md

  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: s.padding,
    fontSize: s.fontSize,
    fontWeight: FONT_WEIGHT.bold,
    borderRadius: RADIUS.md,
    background: v.bg,
    color: v.color,
    border: v.border,
    boxShadow: v.shadow,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: `all ${TRANSITION.fast}`,
    whiteSpace: 'nowrap',
    width: fullWidth ? '100%' : 'auto',
    fontFamily: 'inherit',
    lineHeight: 1.2,
    ...extraStyle,
  }

  return (
    <button
      type={type}
      className="ui-btn"
      onClick={disabled || loading ? undefined : onClick}
      disabled={disabled || loading}
      title={title}
      aria-label={ariaLabel}
      aria-busy={loading || undefined}
      style={baseStyle}
      onMouseEnter={e => {
        if (disabled || loading) return
        if (v.hoverBg) e.currentTarget.style.background = v.hoverBg
        if (v.hoverBorder) e.currentTarget.style.border = `1px solid ${v.hoverBorder}`
        if (v.hoverColor) e.currentTarget.style.color = v.hoverColor
        if (v.hoverShadow) e.currentTarget.style.boxShadow = v.hoverShadow
        if (v.hoverTransform) e.currentTarget.style.transform = v.hoverTransform
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = v.bg
        e.currentTarget.style.border = v.border
        e.currentTarget.style.color = v.color
        e.currentTarget.style.boxShadow = v.shadow
        e.currentTarget.style.transform = 'none'
      }}
    >
      {loading && <span style={{ fontSize: s.iconSize }} aria-hidden="true">⏳</span>}
      {!loading && icon && <span style={{ fontSize: s.iconSize, lineHeight: 1 }} aria-hidden="true">{icon}</span>}
      {children}
      {!loading && iconRight && <span style={{ fontSize: s.iconSize, lineHeight: 1 }} aria-hidden="true">{iconRight}</span>}
    </button>
  )
}

/**
 * IconButton — botón cuadrado solo con icono.
 * Para acciones minimalistas (👁 preview, 🗑 eliminar, 📋 copiar).
 *
 * IMPORTANTE: `ariaLabel` es obligatorio para accesibilidad. El `title`
 * (tooltip nativo del browser) no es leído de manera confiable por
 * screen readers — solo `aria-label` garantiza que el usuario sepa qué
 * hace el botón.
 *
 * Si no se pasa `ariaLabel`, se usa `title` como fallback. Pasar al
 * menos uno de los dos siempre.
 */
export function IconButton({
  icon,
  variant = 'secondary',
  size = 36,
  onClick,
  disabled = false,
  title,
  ariaLabel,
  style: extraStyle,
}) {
  ensureA11yStyles()

  const v = VARIANTS[variant] || VARIANTS.secondary
  const accessibleName = ariaLabel || title

  // Warning útil en dev para detectar IconButtons sin label accesible.
  // En prod terser elimina el bloque (drop_console: true en vite.config.js).
  if (typeof console !== 'undefined' && !accessibleName) {
    console.warn('[IconButton] missing ariaLabel/title — provide one for a11y')
  }

  return (
    <button
      type="button"
      className="ui-icon-btn"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      title={title}
      aria-label={accessibleName}
      style={{
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: v.bg,
        color: v.color,
        border: v.border,
        borderRadius: RADIUS.md,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: `all ${TRANSITION.fast}`,
        fontSize: Math.floor(size * 0.45),
        padding: 0,
        ...extraStyle,
      }}
      onMouseEnter={e => {
        if (disabled) return
        if (v.hoverBg) e.currentTarget.style.background = v.hoverBg
        if (v.hoverBorder) e.currentTarget.style.border = `1px solid ${v.hoverBorder}`
        if (v.hoverColor) e.currentTarget.style.color = v.hoverColor
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = v.bg
        e.currentTarget.style.border = v.border
        e.currentTarget.style.color = v.color
      }}
    >
      <span aria-hidden="true">{icon}</span>
    </button>
  )
}
