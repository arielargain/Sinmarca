import { COLORS, RADIUS, FONT_SIZE, FONT_WEIGHT, TRANSITION } from '../../theme/tokens'

/**
 * Banner unificado — reemplaza los 4 estilos de banners/avisos que había.
 *
 * Variants:
 *  - info:    azul — info neutra
 *  - success: verde — confirmaciones
 *  - warning: naranja — advertencias (ej: "Meta Pixel no configurado")
 *  - danger:  rojo — errores críticos, acciones destructivas
 *  - tip:     gold — consejos / cómo usar esta función
 *
 * Estructura:
 *  ┌─────────────────────────────────────────┐
 *  │ ⚠️  Title                               │
 *  │     Description texto explicativo       │
 *  │                                   [CTA] │
 *  └─────────────────────────────────────────┘
 */

const VARIANTS = {
  info: {
    icon: 'ℹ️',
    color: COLORS.info,
    bg: COLORS.infoSoft,
    border: `${COLORS.info}30`,
  },
  success: {
    icon: '✓',
    color: COLORS.success,
    bg: COLORS.successSoft,
    border: `${COLORS.success}30`,
  },
  warning: {
    icon: '⚠️',
    color: COLORS.warning,
    bg: COLORS.warningSoft,
    border: `${COLORS.warning}30`,
  },
  danger: {
    icon: '⚠️',
    color: COLORS.danger,
    bg: COLORS.dangerSoft,
    border: `${COLORS.danger}30`,
  },
  tip: {
    icon: '💡',
    color: COLORS.brand,
    bg: COLORS.brandSoft,
    border: `${COLORS.brand}30`,
  },
}

export default function Banner({
  variant = 'info',
  icon,
  title,
  children,
  cta,
  onCtaClick,
  onDismiss,
  size = 'md',
  style: extraStyle,
}) {
  const v = VARIANTS[variant] || VARIANTS.info
  const displayIcon = icon !== undefined ? icon : v.icon

  const compact = size === 'sm'
  const padding = compact ? '10px 14px' : '14px 18px'
  const titleSize = compact ? FONT_SIZE.md : FONT_SIZE.base
  const bodySize = compact ? FONT_SIZE.sm : FONT_SIZE.md

  return (
    <div style={{
      background: v.bg,
      border: `1px solid ${v.border}`,
      borderRadius: RADIUS.md,
      padding,
      display: 'flex',
      gap: 10,
      alignItems: title ? 'flex-start' : 'center',
      ...extraStyle,
    }}>
      {displayIcon && (
        <span style={{
          fontSize: compact ? 14 : 16,
          lineHeight: 1.2,
          flexShrink: 0,
          color: v.color,
          marginTop: title ? 1 : 0,
        }}>{displayIcon}</span>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        {title && (
          <div style={{
            fontSize: titleSize,
            fontWeight: FONT_WEIGHT.bold,
            color: v.color,
            marginBottom: children ? 3 : 0,
            lineHeight: 1.3,
          }}>{title}</div>
        )}
        {children && (
          <div style={{
            fontSize: bodySize,
            color: title ? COLORS.muted : v.color,
            lineHeight: 1.45,
          }}>{children}</div>
        )}
      </div>
      {cta && onCtaClick && (
        <button
          onClick={onCtaClick}
          style={{
            background: 'transparent',
            border: 'none',
            color: v.color,
            fontSize: FONT_SIZE.md,
            fontWeight: FONT_WEIGHT.bold,
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: RADIUS.sm,
            flexShrink: 0,
            transition: `all ${TRANSITION.fast}`,
            fontFamily: 'inherit',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = `${v.color}18` }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
        >
          {cta} →
        </button>
      )}
      {onDismiss && (
        <button
          onClick={onDismiss}
          style={{
            background: 'transparent',
            border: 'none',
            color: COLORS.muted,
            cursor: 'pointer',
            fontSize: 16,
            padding: '0 4px',
            lineHeight: 1,
            flexShrink: 0,
          }}
          title="Cerrar"
        >×</button>
      )}
    </div>
  )
}
