import { COLORS, RADIUS, SPACING } from '../../theme/tokens'

/**
 * Loading primitives — Skeleton + Spinner.
 *
 * Reemplaza:
 *   - El "⏳" emoji-as-spinner que estaba en Button.loading
 *   - Las múltiples implementaciones custom de skeleton (divs gris pulsantes
 *     hechos a mano en cada lista de la app)
 *   - Los <Splash /> a media página cuando solo hace falta indicar carga
 *     parcial dentro de una sección.
 *
 * Las animaciones se inyectan UNA SOLA VEZ via <style> al primer mount. No
 * dependen de Tailwind ni de CSS global — funcionan aunque el componente
 * se use en una page sin clases tailwind.
 */

// ─── Inyección de keyframes (1 sola vez) ─────────────────────────────
const STYLE_ID = 'ui-loading-keyframes'

function ensureKeyframes() {
  if (typeof document === 'undefined') return
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    @keyframes ui-skeleton-pulse {
      0%, 100% { opacity: 0.6 }
      50%      { opacity: 0.3 }
    }
    @keyframes ui-spinner-rotate {
      to { transform: rotate(360deg) }
    }
  `
  document.head.appendChild(style)
}

// ─── Skeleton ────────────────────────────────────────────────────────
/**
 * Skeleton — placeholder pulsante para contenido que está cargando.
 *
 * Uso:
 *   <Skeleton width="100%" height={20} />
 *   <Skeleton width={120} height={36} radius="md" />
 *   <Skeleton circle size={48} />
 *
 *   {loading ? (
 *     <Skeleton width="60%" height={16} />
 *   ) : (
 *     <span>{tenant.name}</span>
 *   )}
 */
export function Skeleton({
  width = '100%',
  height = 16,
  radius = 'sm',
  circle = false,
  size,                      // shortcut para circle: width = height = size
  style: extraStyle,
}) {
  ensureKeyframes()

  const w = circle ? (size || height) : width
  const h = circle ? (size || height) : height
  const r = circle ? '50%' : (RADIUS[radius] || RADIUS.sm)

  return (
    <div
      aria-hidden="true"
      style={{
        width: w,
        height: h,
        borderRadius: r,
        background: COLORS.surface2,
        animation: 'ui-skeleton-pulse 1.4s ease-in-out infinite',
        ...extraStyle,
      }}
    />
  )
}

// ─── SkeletonText ────────────────────────────────────────────────────
/**
 * SkeletonText — N líneas de skeleton apiladas. La última siempre es
 * más corta que las anteriores (mimicking texto real).
 *
 *   <SkeletonText lines={3} />
 */
export function SkeletonText({ lines = 3, lineHeight = 14, gap = 8, style: extraStyle }) {
  return (
    <div
      role="status"
      aria-label="Cargando contenido"
      style={{ display: 'flex', flexDirection: 'column', gap, ...extraStyle }}
    >
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={lineHeight}
          width={i === lines - 1 ? '60%' : '100%'}
        />
      ))}
    </div>
  )
}

// ─── SkeletonCard ────────────────────────────────────────────────────
/**
 * SkeletonCard — placeholder para una card típica (avatar + título + 2 lineas).
 *
 *   {loading
 *     ? [...Array(5)].map((_, i) => <SkeletonCard key={i} />)
 *     : items.map(item => <Card>...</Card>)
 *   }
 */
export function SkeletonCard({ avatar = true, lines = 2, style: extraStyle }) {
  return (
    <div
      role="status"
      aria-label="Cargando ítem"
      style={{
        display: 'flex',
        gap: SPACING.md,
        padding: SPACING.md,
        background: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: RADIUS.md,
        alignItems: 'flex-start',
        ...extraStyle,
      }}
    >
      {avatar && <Skeleton circle size={40} />}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Skeleton width="40%" height={14} />
        <SkeletonText lines={lines} lineHeight={12} gap={6} />
      </div>
    </div>
  )
}

// ─── Spinner ─────────────────────────────────────────────────────────
/**
 * Spinner — ring rotatorio. Reemplaza el "⏳" emoji en estados de carga.
 *
 *   <Spinner size={16} />
 *   <Spinner size={32} color={COLORS.brand} />
 *
 *   <Button loading>...</Button>  // el Button todavía usa ⏳, migración manual
 */
export function Spinner({
  size = 16,
  color,
  thickness = 2,
  label = 'Cargando',
  style: extraStyle,
}) {
  ensureKeyframes()
  const c = color || COLORS.brand

  return (
    <span
      role="status"
      aria-label={label}
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        border: `${thickness}px solid ${c}33`,
        borderTopColor: c,
        borderRadius: '50%',
        animation: 'ui-spinner-rotate 0.8s linear infinite',
        flexShrink: 0,
        ...extraStyle,
      }}
    />
  )
}

export default Skeleton
