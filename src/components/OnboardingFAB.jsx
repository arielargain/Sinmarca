// ═══════════════════════════════════════════════════════════════════
// OnboardingFAB — FAB con botón de cerrar persistente
// ═══════════════════════════════════════════════════════════════════
// Botón flotante abajo a la derecha que lleva a /mi-cuenta/bienvenida.
// El usuario puede cerrarlo con la "×" y queda dismissed (localStorage).
// Si visita /mi-cuenta/bienvenida manualmente, se limpia el flag y
// el FAB vuelve a aparecer en otras paginas.
// ═══════════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { COLORS as C, FONT_WEIGHT, TRANSITION } from './ui'

const FAB_DISMISSED_KEY = 'innovate_onboarding_fab_dismissed_v1'

export default function OnboardingFAB() {
  const location = useLocation()
  const nav = useNavigate()

  // Estado: dismissed leido de localStorage al montar
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(FAB_DISMISSED_KEY) === '1' }
    catch { return false }
  })

  // Si el user navega a /bienvenida, limpiar el flag para que el FAB
  // vuelva a aparecer cuando salga de esa pagina.
  useEffect(() => {
    if (location.pathname.startsWith('/mi-cuenta/bienvenida')) {
      try { localStorage.removeItem(FAB_DISMISSED_KEY) } catch {}
      if (dismissed) setDismissed(false)
    }
  }, [location.pathname, dismissed])

  // No mostrar en la pagina del onboarding (evita ruido)
  if (location.pathname.startsWith('/mi-cuenta/bienvenida')) return null
  // No mostrar si el user lo cerro
  if (dismissed) return null

  const handleDismiss = (e) => {
    e.stopPropagation()
    try { localStorage.setItem(FAB_DISMISSED_KEY, '1') } catch {}
    setDismissed(true)
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        gap: 0,
        background: `linear-gradient(135deg, ${C.brand}, ${C.brand}cc)`,
        borderRadius: 999,
        boxShadow: '0 8px 24px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.3)',
        transition: TRANSITION,
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
    >
      <button
        type="button"
        onClick={() => nav('/mi-cuenta/bienvenida')}
        title="Volver a la guia de bienvenida"
        style={{
          background: 'transparent',
          color: '#000',
          border: 'none',
          borderRadius: '999px 0 0 999px',
          padding: '12px 6px 12px 18px',
          fontSize: 14,
          fontWeight: FONT_WEIGHT.bold,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontFamily: 'inherit',
        }}
      >
        <span style={{ fontSize: 18 }}>✨</span>
        <span>Guía de inicio</span>
      </button>
      <button
        type="button"
        onClick={handleDismiss}
        title="Cerrar (no volver a mostrar)"
        aria-label="Cerrar acceso a guia de inicio"
        style={{
          background: 'transparent',
          color: '#000',
          border: 'none',
          borderLeft: '1px solid rgba(0,0,0,0.18)',
          borderRadius: '0 999px 999px 0',
          padding: '12px 14px',
          fontSize: 18,
          fontWeight: FONT_WEIGHT.bold,
          lineHeight: 1,
          cursor: 'pointer',
          opacity: 0.75,
          transition: 'opacity .15s',
          fontFamily: 'inherit',
        }}
        onMouseEnter={e => { e.currentTarget.style.opacity = '1' }}
        onMouseLeave={e => { e.currentTarget.style.opacity = '0.75' }}
      >
        ×
      </button>
    </div>
  )
}
