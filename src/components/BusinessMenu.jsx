// ════════════════════════════════════════════════════════════════════
// BusinessMenu — Dropdown flotante "Negocio" v2 premium (12/05/2026)
//
// Rediseño completo con lenguaje visual consistente con el footer
// premium y el resto del panel:
//
//   • Glassmorphism: backdrop-filter blur + bg semitransparente
//   • Header dorado con label parametrizable (default "NEGOCIO")
//   • Iconos custom SVG dentro de cápsulas con accent color por item
//   • Hover: bg-shift + indicador lateral dorado (slide-in)
//   • Active state: background tinted brand + dot dorado + ring
//   • Entrada animada con scale + translateY (más sutil que solo fade)
//   • Border con gradient sutil (no plano)
//   • Shadow estratificado en 3 capas (depth real, no flat)
//
// 12/05/2026 — Agregado prop `label` (default "Negocio") para que cada
// identity use su propio nombre en el header del dropdown:
//   - tienda      → "Negocio"
//   - profesional → "Mi consultorio"
//   - marketing   → "Mi negocio"
// ════════════════════════════════════════════════════════════════════

import { useEffect, useRef } from 'react'
import { COLORS as C, RADIUS, FONT_SIZE, FONT_WEIGHT, FONT, Z } from '../theme/tokens'

// ── Iconos SVG por item (estilo Lucide, stroke 1.8) ────────────────
// Cada uno tiene su accent color para diferenciarse visualmente.
const ICONS = {
  catalogo: {
    accent: '#60a5fa',  // blue-400
    svg: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <path d="M16 10a4 4 0 0 1-8 0"/>
      </svg>
    ),
  },
  pedidos: {
    accent: '#fb923c',  // orange-400
    svg: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="m7.5 4.27 9 5.15"/>
        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
        <path d="m3.3 7 8.7 5 8.7-5"/>
        <path d="M12 22V12"/>
      </svg>
    ),
  },
  agenda: {
    accent: '#a78bfa',  // violet-400
    svg: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
        <path d="M8 14h.01"/>
        <path d="M12 14h.01"/>
        <path d="M16 14h.01"/>
        <path d="M8 18h.01"/>
        <path d="M12 18h.01"/>
      </svg>
    ),
  },
  contactos: {
    accent: '#4ade80',  // green-400
    svg: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
}

// Fallback para items con id desconocido — usa el emoji original
function getIconBundle(id, emojiFallback) {
  return ICONS[id] || {
    accent: C.brand,
    svg: <span style={{ fontSize: 14, lineHeight: 1 }}>{emojiFallback}</span>,
  }
}

export default function BusinessMenu({
  open,
  anchorRect,
  items = [],
  onSelect,
  onClose,
  currentPath = '',
  label = 'Negocio',  // 12/05/2026 — parametrizable por identity
}) {
  const menuRef = useRef(null)

  // Click outside cierra. pointerdown en captura para evitar el race
  // condition con el botón "Negocio" del nav (toggle off/on).
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose && onClose()
      }
    }
    document.addEventListener('pointerdown', handler)
    return () => document.removeEventListener('pointerdown', handler)
  }, [open, onClose])

  // ESC cierra
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose && onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  // Posicionar el dropdown debajo del botón "Negocio"
  const top   = (anchorRect?.top   != null) ? anchorRect.top + (anchorRect.height || 36) + 10 : 80
  const left  = (anchorRect?.left  != null) ? anchorRect.left : null
  const width = (anchorRect?.width != null) ? Math.max(240, anchorRect.width * 2.4) : 260

  // Safe area: no salirse del viewport
  let leftFinal = left
  if (leftFinal != null) {
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1024
    if (leftFinal + width > vw - 16) leftFinal = vw - width - 16
    if (leftFinal < 16) leftFinal = 16
  }

  return (
    <>
      {/* Backdrop invisible — el pointerdown del useEffect maneja close */}
      <div style={{
        position: 'fixed', inset: 0,
        zIndex: (Z?.modal || 1000) - 1,
        background: 'transparent',
      }} />

      <div
        ref={menuRef}
        role="menu"
        style={{
          position: 'fixed',
          top, left: leftFinal != null ? leftFinal : '50%',
          transform: leftFinal != null ? 'none' : 'translateX(-50%)',
          width,
          maxWidth: 'calc(100vw - 32px)',
          // Glassmorphism stack
          background: `linear-gradient(180deg,
            ${C.card}f5 0%,
            ${C.card}ee 100%)`,
          backdropFilter: 'blur(16px) saturate(140%)',
          WebkitBackdropFilter: 'blur(16px) saturate(140%)',
          border: `1px solid ${C.border}`,
          borderRadius: 12,
          // Shadow stratificado (3 capas = depth real)
          boxShadow: `
            0 20px 60px -10px rgba(0,0,0,0.55),
            0 8px 24px -8px rgba(0,0,0,0.40),
            0 1px 0 0 rgba(255,255,255,0.04) inset,
            0 0 0 1px rgba(255,255,255,0.02) inset
          `,
          padding: 6,
          zIndex: (Z?.modal || 1000),
          animation: 'businessMenuIn 0.18s cubic-bezier(.4,0,.2,1)',
          overflow: 'hidden',
        }}
      >
        {/* Línea decorativa superior con gradient dorado */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: 1,
          background: `linear-gradient(90deg,
            transparent 0%,
            ${C.brand}40 30%,
            ${C.brand}60 50%,
            ${C.brand}40 70%,
            transparent 100%)`,
          pointerEvents: 'none',
        }} />

        {/* Header con label dinámico (parametrizable por identity) */}
        <div style={{
          padding: '10px 14px 8px',
          fontSize: 9,
          fontFamily: FONT.mono,
          fontWeight: FONT_WEIGHT.bold,
          color: C.brand,
          letterSpacing: '.22em',
          textTransform: 'uppercase',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <span style={{
            display: 'inline-block',
            width: 4, height: 4,
            borderRadius: '50%',
            background: C.brand,
            boxShadow: `0 0 8px ${C.brand}80`,
          }} />
          {label}
        </div>

        {/* Divider sutil */}
        <div style={{
          height: 1,
          margin: '0 8px 4px',
          background: `linear-gradient(90deg, transparent, ${C.border}, transparent)`,
        }} />

        {/* Items del menú */}
        {items.map((item) => {
          const active = item.href === currentPath
          const { accent, svg: iconSvg } = getIconBundle(item.id, item.icon)

          return (
            <button
              key={item.id}
              role="menuitem"
              type="button"
              data-active={active}
              onClick={() => onSelect && onSelect(item)}
              style={{
                position: 'relative',
                display: 'flex', alignItems: 'center', gap: 12,
                width: '100%', textAlign: 'left',
                padding: '11px 12px',
                background: active ? `${C.brand}14` : 'transparent',
                border: 'none',
                borderRadius: 8,
                color: active ? C.text : C.text,
                fontSize: FONT_SIZE.sm,
                fontWeight: active ? FONT_WEIGHT.semibold : FONT_WEIGHT.medium,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'background 0.15s cubic-bezier(.4,0,.2,1)',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                }
                const indicator = e.currentTarget.querySelector('[data-indicator]')
                if (indicator) indicator.style.transform = 'scaleY(1)'
                const iconBox = e.currentTarget.querySelector('[data-iconbox]')
                if (iconBox) {
                  iconBox.style.background = `${accent}22`
                  iconBox.style.borderColor = `${accent}55`
                  iconBox.style.color = accent
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent'
                }
                const indicator = e.currentTarget.querySelector('[data-indicator]')
                if (indicator && !active) indicator.style.transform = 'scaleY(0)'
                const iconBox = e.currentTarget.querySelector('[data-iconbox]')
                if (iconBox && !active) {
                  iconBox.style.background = `${accent}12`
                  iconBox.style.borderColor = `${accent}28`
                  iconBox.style.color = accent
                }
              }}
            >
              {/* Indicador lateral animado (slide-in en hover) */}
              <span
                data-indicator
                style={{
                  position: 'absolute',
                  left: 2, top: '50%',
                  width: 3, height: 22,
                  marginTop: -11,
                  borderRadius: 2,
                  background: `linear-gradient(180deg, ${accent}, ${accent}80)`,
                  transform: active ? 'scaleY(1)' : 'scaleY(0)',
                  transformOrigin: 'center',
                  transition: 'transform 0.18s cubic-bezier(.4,0,.2,1)',
                  pointerEvents: 'none',
                }}
              />

              {/* Cápsula del icono con accent color */}
              <span
                data-iconbox
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 28, height: 28,
                  borderRadius: 7,
                  background: active ? `${accent}22` : `${accent}12`,
                  border: `1px solid ${active ? `${accent}55` : `${accent}28`}`,
                  color: accent,
                  flexShrink: 0,
                  transition: 'all 0.18s ease',
                }}
              >
                {iconSvg}
              </span>

              <span style={{ flex: 1, letterSpacing: '-0.005em' }}>{item.label}</span>

              {/* Chevron sutil a la derecha (estilo macOS) */}
              <svg
                width="12" height="12" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round"
                style={{
                  color: active ? accent : C.muted,
                  opacity: active ? 1 : 0.4,
                  transition: 'opacity 0.15s, color 0.15s',
                  flexShrink: 0,
                }}
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )
        })}
      </div>

      {/* Keyframes inyectados inline (sin CSS global) */}
      <style>{`
        @keyframes businessMenuIn {
          from {
            opacity: 0;
            transform: translateY(-6px) scale(0.97) ${leftFinal != null ? '' : 'translateX(-50%)'};
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1) ${leftFinal != null ? '' : 'translateX(-50%)'};
          }
        }
      `}</style>
    </>
  )
}
