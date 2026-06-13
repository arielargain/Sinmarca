import { COLORS, RADIUS, FONT_SIZE, FONT_WEIGHT, FONT } from '../../theme/tokens'

export function PageHeader({ eyebrow, title, subtitle, actions, meta, style: extraStyle }) {
  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: 12,
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 24,
      ...extraStyle,
    }}>
      <div style={{ flex: '1 1 280px', minWidth: 0 }}>
        {eyebrow && (
          <p style={{
            fontSize: 11,
            fontFamily: FONT.mono,
            color: COLORS.muted,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            margin: '0 0 6px',
            fontWeight: FONT_WEIGHT.semibold,
          }}>
            {eyebrow}
          </p>
        )}
        <h1 style={{
          fontSize: 28,
          fontWeight: FONT_WEIGHT.bold,
          color: COLORS.text,
          letterSpacing: '-0.01em',
          margin: 0,
          lineHeight: 1.15,
        }}>{title}</h1>
        {subtitle && (
          <p style={{
            fontSize: 14,
            color: COLORS.muted,
            margin: '8px 0 0',
            lineHeight: 1.6,
            maxWidth: 720,
          }}>{subtitle}</p>
        )}
        {meta && (
          <div style={{ marginTop: 10 }}>{meta}</div>
        )}
      </div>
      {actions && (
        <div style={{
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
          alignItems: 'center',
          flexShrink: 0,
        }}>{actions}</div>
      )}
    </div>
  )
}

export function SectionHeader({ title, subtitle, right, style: extraStyle }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      marginBottom: 12,
      ...extraStyle,
    }}>
      <div style={{
        flex: 1,
        minWidth: 0,
        borderLeft: `3px solid ${COLORS.brand}`,
        paddingLeft: 10,
      }}>
        <div style={{
          fontSize: FONT_SIZE.lg,
          fontWeight: FONT_WEIGHT.bold,
          color: COLORS.text,
          lineHeight: 1.2,
        }}>{title}</div>
        {subtitle && (
          <div style={{
            fontSize: FONT_SIZE.sm,
            color: COLORS.muted,
            marginTop: 2,
            lineHeight: 1.4,
          }}>{subtitle}</div>
        )}
      </div>
      {right && <div style={{ flexShrink: 0 }}>{right}</div>}
    </div>
  )
}

export function Card({
  children,
  padding = 16,
  accent,
  hoverable = false,
  onClick,
  style: extraStyle,
}) {
  const accentColor = accent
    ? (accent.startsWith('#') ? accent : COLORS[accent])
    : null

  return (
    <div
      onClick={onClick}
      style={{
        background: COLORS.card,
        border: `1px solid ${accentColor ? accentColor + '30' : COLORS.border}`,
        borderRadius: RADIUS.lg,
        padding,
        position: 'relative',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 180ms ease',
        ...extraStyle,
      }}
      onMouseEnter={hoverable ? e => {
        e.currentTarget.style.borderColor = accentColor ? accentColor + '55' : COLORS.borderStrong
      } : undefined}
      onMouseLeave={hoverable ? e => {
        e.currentTarget.style.borderColor = accentColor ? accentColor + '30' : COLORS.border
      } : undefined}
    >
      {accentColor && (
        <div style={{
          position: 'absolute',
          top: -24,
          right: -24,
          width: 90,
          height: 90,
          borderRadius: '50%',
          background: `${accentColor}10`,
          filter: 'blur(24px)',
          pointerEvents: 'none',
        }}/>
      )}
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </div>
  )
}

export function PageContainer({ children, maxWidth = 1200, style: extraStyle }) {
  return (
    <div style={{
      width: '100%',
      maxWidth,
      margin: '0 auto',
      padding: '16px 20px 40px',
      ...extraStyle,
    }}>
      {children}
    </div>
  )
}
