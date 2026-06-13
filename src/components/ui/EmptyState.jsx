import { COLORS, RADIUS, FONT_SIZE, FONT_WEIGHT, SPACING } from '../../theme/tokens'
import Button from './Button'

/**
 * EmptyState — placeholder consistente para listas/secciones sin datos.
 *
 * Reemplaza los múltiples "no hay clientes todavía" / "lista vacía" /
 * "sin resultados" custom que cada página armaba a mano. Tres tamaños:
 *
 *  - sm: inline en una card chica, sin icono prominente
 *  - md: default, para secciones del dashboard / listas estándar
 *  - lg: para páginas vacías (primera vez que entra el user)
 *
 * Estructura:
 *  ┌─────────────────────────────────────────┐
 *  │              ┌────┐                     │
 *  │              │ 📭 │                     │
 *  │              └────┘                     │
 *  │           Título principal              │
 *  │      Descripción de qué hacer ahora     │
 *  │            [CTA primario]               │
 *  └─────────────────────────────────────────┘
 *
 * Uso:
 *   <EmptyState
 *     icon="📭"
 *     title="Sin conversaciones todavía"
 *     description="Cuando un cliente te escriba va a aparecer acá."
 *     cta="Conectar WhatsApp"
 *     onCtaClick={() => navigate('/conectar-whatsapp')}
 *   />
 *
 *   <EmptyState size="sm" title="Sin resultados" description="Probá otro filtro." />
 *
 *   <EmptyState
 *     size="lg"
 *     icon="🎯"
 *     title="Empezá tu primera campaña"
 *     description="Las campañas te ayudan a reactivar leads automáticamente."
 *     cta="Nueva campaña"
 *     secondaryCta="Ver tutorial"
 *     onCtaClick={createCampaign}
 *     onSecondaryCtaClick={openTutorial}
 *   />
 */

const SIZES = {
  sm: {
    padding: '20px 16px',
    iconSize: 28,
    iconWrapSize: 48,
    titleSize: FONT_SIZE.base,
    descSize: FONT_SIZE.sm,
    gap: SPACING.sm,
    btnSize: 'sm',
  },
  md: {
    padding: '36px 24px',
    iconSize: 40,
    iconWrapSize: 72,
    titleSize: FONT_SIZE.lg,
    descSize: FONT_SIZE.md,
    gap: SPACING.md,
    btnSize: 'md',
  },
  lg: {
    padding: '60px 32px',
    iconSize: 56,
    iconWrapSize: 96,
    titleSize: FONT_SIZE.xl,
    descSize: FONT_SIZE.base,
    gap: SPACING.lg,
    btnSize: 'md',
  },
}

export default function EmptyState({
  icon = '📭',
  title,
  description,
  cta,
  onCtaClick,
  ctaVariant = 'primary',
  secondaryCta,
  onSecondaryCtaClick,
  size = 'md',
  style: extraStyle,
}) {
  const s = SIZES[size] || SIZES.md

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: s.padding,
        background: COLORS.surface,
        border: `1px dashed ${COLORS.border}`,
        borderRadius: RADIUS.lg,
        ...extraStyle,
      }}
    >
      {icon && (
        <div
          aria-hidden="true"
          style={{
            width: s.iconWrapSize,
            height: s.iconWrapSize,
            borderRadius: '50%',
            background: COLORS.surface2,
            border: `1px solid ${COLORS.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: s.iconSize,
            marginBottom: s.gap,
            opacity: 0.85,
          }}
        >
          {icon}
        </div>
      )}

      {title && (
        <div
          style={{
            fontSize: s.titleSize,
            fontWeight: FONT_WEIGHT.semibold,
            color: COLORS.text,
            marginBottom: description ? 6 : 0,
            lineHeight: 1.3,
            maxWidth: 420,
          }}
        >
          {title}
        </div>
      )}

      {description && (
        <div
          style={{
            fontSize: s.descSize,
            color: COLORS.muted,
            lineHeight: 1.5,
            maxWidth: 420,
            marginBottom: cta || secondaryCta ? s.gap + 4 : 0,
          }}
        >
          {description}
        </div>
      )}

      {(cta || secondaryCta) && (
        <div style={{ display: 'flex', gap: SPACING.sm, flexWrap: 'wrap', justifyContent: 'center' }}>
          {cta && onCtaClick && (
            <Button variant={ctaVariant} size={s.btnSize} onClick={onCtaClick}>
              {cta}
            </Button>
          )}
          {secondaryCta && onSecondaryCtaClick && (
            <Button variant="ghost" size={s.btnSize} onClick={onSecondaryCtaClick}>
              {secondaryCta}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
