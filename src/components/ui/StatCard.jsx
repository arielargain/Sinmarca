import { COLORS, RADIUS, FONT_SIZE, FONT_WEIGHT, FONT, TRANSITION, IS_ADMIN_SKIN } from '../../theme/tokens'

/**
 * StatCard — Apple Wallet inspired (skin admin)
 * Card flotante con sombra suave, numero GIGANTE arriba, label uppercase pequeño abajo
 */

function Sparkline({ data, color, height = 28 }) {
  if (!data || data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const width = 100
  const stepX = width / (data.length - 1)
  const points = data.map((v, i) => {
    const x = i * stepX
    const y = height - ((v - min) / range) * height * 0.85 - height * 0.075
    return `${x},${y}`
  }).join(' ')
  const areaPoints = `0,${height} ${points} ${width},${height}`
  const gradId = `spark-${color.replace(/[^a-z0-9]/gi, '')}`
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none"
      style={{ display: 'block', marginTop: 6 }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#${gradId})`}/>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function resolveAccent(accent) {
  if (!accent) return COLORS.text
  if (accent.startsWith('#')) return accent
  return COLORS[accent] || COLORS.text
}

export default function StatCard({
  icon,
  label,
  value,
  sub,
  accent = 'text',
  trend,
  trendColor,
  onClick,
  locked = false,
  ctaText,
  onCta,
  style: extraStyle,
}) {
  const accentColor = resolveAccent(accent)
  const sparkColor = trendColor ? resolveAccent(trendColor) : accentColor
  const clickable = !!onClick && !locked

  // ── ADMIN SKIN: Apple Wallet style ────────────────────────────
  if (IS_ADMIN_SKIN) {
    return (
      <div
        onClick={clickable ? onClick : undefined}
        style={{
          background: `linear-gradient(180deg, #16181D 0%, #0E0F12 100%)`,
          border: `1px solid ${COLORS.border}`,
          borderRadius: RADIUS.lg,
          padding: '20px 22px',
          cursor: clickable ? 'pointer' : 'default',
          transition: `all ${TRANSITION.base}`,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          containerType: 'inline-size',
          minHeight: trend ? 140 : 110,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,.4), 0 8px 24px rgba(0,0,0,.3)',
          ...extraStyle,
        }}
        onMouseEnter={clickable ? e => {
          e.currentTarget.style.borderColor = COLORS.borderStrong
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,.5), 0 16px 40px rgba(0,0,0,.4)'
        } : undefined}
        onMouseLeave={clickable ? e => {
          e.currentTarget.style.borderColor = COLORS.border
          e.currentTarget.style.transform = 'none'
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,.4), 0 8px 24px rgba(0,0,0,.3)'
        } : undefined}
      >
        {locked ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '8px 0' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={COLORS.muted} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <div style={{ fontSize: FONT_SIZE.sm, color: COLORS.muted, lineHeight: 1.4 }}>
              {sub || 'Requiere plan activo'}
            </div>
            {ctaText && onCta && (
              <button onClick={e => { e.stopPropagation(); onCta() }} style={{
                background: 'transparent', border: 'none',
                color: COLORS.primary, fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold,
                cursor: 'pointer', padding: 0, fontFamily: 'inherit', textAlign: 'left',
              }}>{ctaText} →</button>
            )}
          </div>
        ) : (
          <>
            {/* VALOR GIGANTE arriba */}
            <div style={{
              fontSize: 'clamp(20px, 14cqw, 38px)',
              fontWeight: FONT_WEIGHT.bold,
              color: accentColor,
              fontFamily: FONT.body,
              lineHeight: 1.05,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              letterSpacing: '-0.025em',
              fontFeatureSettings: '"tnum"',
            }}>
              {value ?? '—'}
            </div>
            {/* LABEL pequeño abajo, uppercase mono */}
            <div style={{
              fontSize: 10,
              fontFamily: FONT.mono,
              color: COLORS.muted,
              textTransform: 'uppercase',
              letterSpacing: '.12em',
              fontWeight: FONT_WEIGHT.medium,
            }}>{label}</div>
            {sub && (
              <div style={{
                fontSize: FONT_SIZE.sm,
                color: COLORS.muted,
                lineHeight: 1.4,
                marginTop: -4,
              }}>{sub}</div>
            )}
          </>
        )}

        {trend && trend.length >= 2 && !locked && (
          <div style={{ marginTop: 'auto' }}>
            <Sparkline data={trend} color={sparkColor}/>
          </div>
        )}
      </div>
    )
  }

  // ── TENANT SKIN: layout original ──────────────────────────────
  return (
    <div
      onClick={clickable ? onClick : undefined}
      style={{
        background: COLORS.card,
        border: `1px solid ${COLORS.border}`,
        borderRadius: RADIUS.lg,
        padding: '14px 16px',
        cursor: clickable ? 'pointer' : 'default',
        transition: `all ${TRANSITION.fast}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        minHeight: trend ? 120 : 90,
        position: 'relative',
        overflow: 'hidden',
        ...extraStyle,
      }}
      onMouseEnter={clickable ? e => {
        e.currentTarget.style.borderColor = COLORS.borderStrong
        e.currentTarget.style.transform = 'translateY(-1px)'
      } : undefined}
      onMouseLeave={clickable ? e => {
        e.currentTarget.style.borderColor = COLORS.border
        e.currentTarget.style.transform = 'none'
      } : undefined}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {icon && (
          <span style={{ fontSize: 15, lineHeight: 1, opacity: 0.9 }}>{icon}</span>
        )}
        <span style={{
          fontSize: FONT_SIZE.xs,
          fontFamily: FONT.mono,
          color: COLORS.muted,
          textTransform: 'uppercase',
          letterSpacing: '.06em',
          fontWeight: FONT_WEIGHT.medium,
        }}>{label}</span>
      </div>

      {locked ? (
        <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 22, opacity: 0.6, textAlign: 'center', padding: '4px 0' }}>🔒</div>
          <div style={{ fontSize: FONT_SIZE.sm, color: COLORS.muted, lineHeight: 1.4, textAlign: 'center' }}>
            {sub || 'Requiere plan activo'}
          </div>
          {ctaText && onCta && (
            <button onClick={e => { e.stopPropagation(); onCta() }} style={{
              background: 'transparent', border: 'none',
              color: COLORS.brand, fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold,
              cursor: 'pointer', padding: '4px 0', fontFamily: 'inherit',
            }}>{ctaText} →</button>
          )}
        </div>
      ) : (
        <>
          <div style={{
            fontSize: 26,
            fontWeight: FONT_WEIGHT.black,
            color: accentColor,
            fontFamily: FONT.mono,
            lineHeight: 1.1,
            marginTop: 2,
          }}>
            {value ?? '—'}
          </div>
          {sub && (
            <div style={{
              fontSize: FONT_SIZE.sm,
              color: COLORS.muted,
              lineHeight: 1.3,
            }}>{sub}</div>
          )}
        </>
      )}

      {trend && trend.length >= 2 && !locked && (
        <div style={{ marginTop: 'auto' }}>
          <Sparkline data={trend} color={sparkColor}/>
        </div>
      )}
    </div>
  )
}

export function StatGrid({ children, minWidth = 150, gap = 12, style: extraStyle }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${minWidth}px), 1fr))`,
      gap,
      ...extraStyle,
    }}>{children}</div>
  )
}
