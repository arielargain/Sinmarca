import { COLORS, RADIUS, FONT_SIZE, FONT_WEIGHT, FONT } from '../../theme/tokens'

/**
 * Chip unificado — reemplaza los 4 estilos de chips/tags/badges de la app.
 *
 * Variants:
 *  - status:  pill con dot de color — estados (Activo, Suspendido, etc)
 *  - tag:     badge rectangular con texto uppercase — categorías (URL, Meta, MP)
 *  - count:   badge redondo pequeño — contadores (3 chats nuevos)
 *  - check:   pill con ✓/✗ — estados binarios (Configurado / No configurado)
 *
 * Colors: acepta cualquier color semántico ('success'|'warning'|'danger'|'info'|'brand'|'ai'|'muted')
 *         o un hex custom.
 */

function resolveColor(color) {
  if (!color) return COLORS.muted
  if (color.startsWith('#')) return color
  return COLORS[color] || COLORS.muted
}

export default function Chip({
  variant = 'status',
  color = 'muted',
  children,
  icon,
  size = 'md',
  style: extraStyle,
}) {
  const c = resolveColor(color)
  const compact = size === 'sm'
  const padding = compact ? '2px 7px' : '3px 9px'
  const fontSize = compact ? 10 : 11
  const dotSize = compact ? 5 : 6

  if (variant === 'status') {
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding,
        background: `${c}12`,
        border: `1px solid ${c}35`,
        color: c,
        fontSize,
        fontWeight: FONT_WEIGHT.semibold,
        borderRadius: RADIUS.pill,
        lineHeight: 1.3,
        whiteSpace: 'nowrap',
        ...extraStyle,
      }}>
        <span style={{
          width: dotSize,
          height: dotSize,
          borderRadius: '50%',
          background: c,
          flexShrink: 0,
        }}/>
        {children}
      </span>
    )
  }

  if (variant === 'count') {
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 18,
        height: 18,
        padding: '0 5px',
        background: c,
        color: '#080B12',
        fontSize: 10,
        fontWeight: FONT_WEIGHT.bold,
        borderRadius: RADIUS.pill,
        lineHeight: 1,
        ...extraStyle,
      }}>{children}</span>
    )
  }

  if (variant === 'check') {
    const isConfigured = color === 'success' || color === 'brand'
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding,
        background: `${c}10`,
        border: `1px solid ${c}30`,
        color: c,
        fontSize,
        fontWeight: FONT_WEIGHT.semibold,
        borderRadius: RADIUS.sm,
        fontFamily: FONT.mono,
        lineHeight: 1.3,
        ...extraStyle,
      }}>
        <span>{isConfigured ? '✓' : '○'}</span>
        {children}
      </span>
    )
  }

  // variant === 'tag'
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding,
      background: `${c}12`,
      border: `1px solid ${c}30`,
      color: c,
      fontSize,
      fontWeight: FONT_WEIGHT.bold,
      borderRadius: RADIUS.sm,
      textTransform: 'uppercase',
      letterSpacing: '.04em',
      fontFamily: FONT.mono,
      lineHeight: 1.3,
      whiteSpace: 'nowrap',
      ...extraStyle,
    }}>
      {icon && <span style={{ textTransform: 'none' }}>{icon}</span>}
      {children}
    </span>
  )
}
