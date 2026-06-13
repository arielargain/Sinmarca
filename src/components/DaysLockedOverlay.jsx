// ═════════════════════════════════════════════════════════════════
// DaysLockedOverlay.jsx — 12/05/2026
// ─────────────────────────────────────────────────────────────────
// Wrapper que detecta si el retail tiene days_left <= 0. Si es así:
//   - Oscurece la página detrás (children) con backdrop blur + opacity
//   - Renderiza un <RetailActivationWidget mode="overlay"/> centrado tipo modal
//   - Bloquea pointer-events sobre los children para evitar interacciones
// Si days_left > 0, simplemente renderiza children pasthrough.
//
// Cuando el user activa días:
//   - RetailActivationWidget llama refreshRetail()
//   - retail.activated_until se actualiza en el AuthContext
//   - este componente se re-renderiza y el overlay desaparece
//
// Uso:
//   <DaysLockedOverlay featureName="Líneas de WhatsApp">
//     <RetailLineas />
//   </DaysLockedOverlay>
// ═════════════════════════════════════════════════════════════════

import { useAuth } from '../contexts/AuthContext'
import RetailActivationWidget from './RetailActivationWidget'
import { COLORS as C, FONT_SIZE, FONT_WEIGHT, FONT } from './ui'

export default function DaysLockedOverlay({ children, featureName = 'Esta función' }) {
  const { retail } = useAuth()

  // Calcular daysLeft del retail actual
  const until = retail?.activated_until ? new Date(retail.activated_until) : null
  const now = new Date()
  const ms = until ? until.getTime() - now.getTime() : 0
  const daysLeft = until ? Math.ceil(ms / 86400000) : 0
  const isLocked = !until || daysLeft <= 0

  if (!isLocked) {
    return children
  }

  return (
    <div style={{ position: 'relative', minHeight: 400 }}>
      {/* Página debajo (oscurecida + sin interacción) */}
      <div
        aria-hidden="true"
        style={{
          opacity: 0.25,
          pointerEvents: 'none',
          filter: 'blur(2px)',
          userSelect: 'none',
          transition: 'all 0.3s ease',
        }}
      >
        {children}
      </div>

      {/* Overlay backdrop — click no cierra (no hay opción de cerrar sin activar) */}
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        animation: 'lockOverlayFadeIn 0.25s ease both',
      }}>
        <style>{`
          @keyframes lockOverlayFadeIn {
            from { opacity: 0; }
            to   { opacity: 1; }
          }
          @keyframes lockOverlaySlideUp {
            from { opacity: 0; transform: translateY(20px) scale(0.96); }
            to   { opacity: 1; transform: none; }
          }
        `}</style>

        <div style={{
          maxWidth: 600,
          width: '100%',
          animation: 'lockOverlaySlideUp 0.35s ease both',
        }}>
          {/* Heading explicativo arriba del widget */}
          <div style={{
            textAlign: 'center',
            marginBottom: 18,
          }}>
            <div style={{ fontSize: 42, marginBottom: 10 }}>🔒</div>
            <h2 style={{
              fontSize: 22,
              fontWeight: FONT_WEIGHT.bold,
              color: C.text,
              margin: '0 0 6px',
              letterSpacing: '-0.01em',
            }}>
              {featureName} bloqueado
            </h2>
            <p style={{
              fontSize: FONT_SIZE.base,
              color: C.muted,
              margin: 0,
              lineHeight: 1.5,
            }}>
              Activá días de servicio para desbloquear esta sección y empezar a operar.
            </p>
          </div>

          <RetailActivationWidget mode="overlay" />

          {/* Footer hint */}
          <p style={{
            fontSize: FONT_SIZE.xs,
            color: C.muted,
            textAlign: 'center',
            marginTop: 14,
            fontFamily: FONT.mono,
            letterSpacing: '.04em',
          }}>
            💡 Activá al menos 1 día para acceder a esta pantalla
          </p>
        </div>
      </div>
    </div>
  )
}
