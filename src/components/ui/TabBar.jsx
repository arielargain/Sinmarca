import { COLORS, RADIUS, FONT_SIZE, FONT_WEIGHT, TRANSITION, FONT, IS_ADMIN_SKIN } from '../../theme/tokens'

/**
 * TabBar — dual-skin
 * - Tenant: pills doradas con iconos
 * - Admin (Apple Wallet): underline minimal sin iconos
 */

const SIZES = {
  sm: { padding: '7px 12px', fontSize: FONT_SIZE.sm, gap: 4, iconSize: 12 },
  md: { padding: '9px 14px', fontSize: FONT_SIZE.md, gap: 6, iconSize: 14 },
}

export default function TabBar({
  value,
  onChange,
  tabs = [],
  scrollable = true,
  size = 'md',
  style: extraStyle,
}) {
  const s = SIZES[size] || SIZES.md

  // ── ADMIN SKIN: underline minimal ────────────────────────────
  if (IS_ADMIN_SKIN) {
    return (
      <div style={{
        display: 'flex',
        gap: 4,
        padding: 0,
        background: 'transparent',
        borderBottom: `1px solid ${COLORS.border}`,
        overflowX: scrollable ? 'auto' : 'visible',
        overscrollBehaviorX: 'contain',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        marginBottom: 0,
        ...extraStyle,
      }}
        className="scroll-x-safe"
      >
        {tabs.map(tab => {
          const active = tab.id === value
          const disabled = !!tab.disabled
          return (
            <button
              key={tab.id}
              type="button"
              onClick={disabled ? undefined : () => onChange?.(tab.id)}
              disabled={disabled}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '12px 14px',
                fontSize: 14,
                fontWeight: active ? FONT_WEIGHT.semibold : FONT_WEIGHT.medium,
                background: 'transparent',
                color: active ? COLORS.text : COLORS.muted,
                border: 'none',
                borderBottom: active ? `2px solid ${COLORS.primary}` : '2px solid transparent',
                marginBottom: -1,
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.4 : 1,
                transition: `all ${TRANSITION.fast}`,
                whiteSpace: 'nowrap',
                fontFamily: 'inherit',
                flexShrink: 0,
                lineHeight: 1.2,
                letterSpacing: '-0.005em',
              }}
              onMouseEnter={e => {
                if (active || disabled) return
                e.currentTarget.style.color = COLORS.text
              }}
              onMouseLeave={e => {
                if (active || disabled) return
                e.currentTarget.style.color = COLORS.muted
              }}
            >
              {/* NO renderizar emoji icon en skin admin */}
              <span>{tab.label}</span>
              {tab.badge != null && (
                <span style={{
                  minWidth: 18, height: 18, padding: '0 5px',
                  background: active ? COLORS.primary : COLORS.surface2,
                  color: active ? '#FFFFFF' : COLORS.muted,
                  fontSize: 10, fontWeight: FONT_WEIGHT.semibold,
                  borderRadius: RADIUS.pill,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'inherit',
                }}>{tab.badge}</span>
              )}
            </button>
          )
        })}
      </div>
    )
  }

  // ── TENANT SKIN: pills doradas (original) ───────────────────
  return (
    <div style={{
      display: 'flex',
      gap: 6,
      padding: 4,
      background: COLORS.surface,
      border: `1px solid ${COLORS.border}`,
      borderRadius: RADIUS.md,
      overflowX: scrollable ? 'auto' : 'visible',
      overscrollBehaviorX: 'contain',
      WebkitOverflowScrolling: 'touch',
      scrollbarWidth: 'none',
      msOverflowStyle: 'none',
      ...extraStyle,
    }}
      className="scroll-x-safe"
    >
      {tabs.map(tab => {
        const active = tab.id === value
        const disabled = !!tab.disabled
        return (
          <button
            key={tab.id}
            type="button"
            onClick={disabled ? undefined : () => onChange?.(tab.id)}
            disabled={disabled}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: s.gap,
              padding: s.padding,
              fontSize: s.fontSize,
              fontWeight: active ? FONT_WEIGHT.bold : FONT_WEIGHT.medium,
              background: active ? COLORS.brandSoft : 'transparent',
              color: active ? COLORS.brand : COLORS.muted,
              border: `1px solid ${active ? `${COLORS.brand}55` : 'transparent'}`,
              borderRadius: RADIUS.sm,
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.4 : 1,
              transition: `all ${TRANSITION.fast}`,
              whiteSpace: 'nowrap',
              fontFamily: 'inherit',
              flexShrink: 0,
              lineHeight: 1.2,
            }}
            onMouseEnter={e => {
              if (active || disabled) return
              e.currentTarget.style.background = COLORS.card
              e.currentTarget.style.color = COLORS.text
            }}
            onMouseLeave={e => {
              if (active || disabled) return
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = COLORS.muted
            }}
          >
            {tab.LucideIcon ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', color: 'inherit' }}>
                <tab.LucideIcon size={s.iconSize + 2} strokeWidth={1.8} />
              </span>
            ) : tab.icon && (
              <span style={{ fontSize: s.iconSize, lineHeight: 1 }}>{tab.icon}</span>
            )}
            <span>{tab.label}</span>
            {tab.badge != null && (
              <span style={{
                minWidth: 18, height: 18, padding: '0 5px',
                background: active ? COLORS.brand : COLORS.borderStrong,
                color: active ? '#080B12' : COLORS.text,
                fontSize: 10, fontWeight: FONT_WEIGHT.bold,
                borderRadius: RADIUS.pill,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'inherit',
              }}>{tab.badge}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export function SegmentedControl({ value, onChange, options = [], style: extraStyle }) {
  if (IS_ADMIN_SKIN) {
    return (
      <div style={{
        display: 'inline-flex',
        gap: 0,
        padding: 3,
        background: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: RADIUS.sm,
        ...extraStyle,
      }}>
        {options.map(opt => {
          const active = opt.id === value
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange?.(opt.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 14px',
                fontSize: 13,
                fontWeight: active ? FONT_WEIGHT.semibold : FONT_WEIGHT.medium,
                background: active ? COLORS.surface2 : 'transparent',
                color: active ? COLORS.text : COLORS.muted,
                border: 'none',
                borderRadius: 5,
                cursor: 'pointer',
                transition: `all ${TRANSITION.fast}`,
                fontFamily: 'inherit',
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
              }}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div style={{
      display: 'inline-flex',
      gap: 2,
      padding: 3,
      background: COLORS.surface,
      border: `1px solid ${COLORS.border}`,
      borderRadius: RADIUS.md,
      ...extraStyle,
    }}>
      {options.map(opt => {
        const active = opt.id === value
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange?.(opt.id)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '6px 12px',
              fontSize: FONT_SIZE.md,
              fontWeight: active ? FONT_WEIGHT.bold : FONT_WEIGHT.medium,
              background: active ? COLORS.brand : 'transparent',
              color: active ? '#080B12' : COLORS.muted,
              border: 'none',
              borderRadius: 7,
              cursor: 'pointer',
              transition: `all ${TRANSITION.fast}`,
              fontFamily: 'inherit',
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
            }}
          >
            {opt.icon && <span style={{ fontSize: 13, lineHeight: 1 }}>{opt.icon}</span>}
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
