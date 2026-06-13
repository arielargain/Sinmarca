// ═════════════════════════════════════════════════════════════════
// RetailFooter.jsx — 12/05/2026 v7 (soporte + instrucciones movidos al footer)
// ─────────────────────────────────────────────────────────────────
// Footer global del panel retail. Diseño limpio:
//   • Brand mark "iA" + tagline
//   • 2 columnas organizadas (Recursos / Legal)
//   • Línea top con gradient dorado sutil (única separación visual)
//   • Hover: underline gradient + color shift
//   • Sticky al bottom: marginTop:auto + buffer interno
//
// 12/05/2026 v7 — Decisión owner: mover Soporte e Instrucciones DESDE el
// menú principal AL footer (junto a "¿Cómo funcionan los créditos?").
// El menú top queda más limpio (solo las secciones operativas del día
// a día) y Soporte/Instrucciones quedan accesibles desde cualquier
// página por estar siempre presentes en el pie.
//
// Aparece al pie de TODAS las páginas EXCEPTO /chats.
// ═════════════════════════════════════════════════════════════════

import { Link as NavLink } from 'react-router-dom'
import {
  COLORS as C, FONT_SIZE, FONT_WEIGHT, FONT, TRANSITION,
} from './ui'

// ── Link con underline gradient en hover ──────────────────
function FooterLink({ to, children }) {
  return (
    <NavLink
      to={to}
      style={{
        position: 'relative',
        color: C.muted,
        textDecoration: 'none',
        fontSize: FONT_SIZE.sm,
        fontWeight: FONT_WEIGHT.medium,
        letterSpacing: '.01em',
        padding: '4px 0',
        transition: TRANSITION,
        display: 'inline-block',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = C.text
        const underline = e.currentTarget.querySelector('[data-underline]')
        if (underline) underline.style.transform = 'scaleX(1)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = C.muted
        const underline = e.currentTarget.querySelector('[data-underline]')
        if (underline) underline.style.transform = 'scaleX(0)'
      }}
    >
      {children}
      <span
        data-underline
        style={{
          position: 'absolute',
          left: 0, right: 0, bottom: 0,
          height: 1,
          background: `linear-gradient(90deg, ${C.brand}, ${C.brand}80)`,
          transform: 'scaleX(0)',
          transformOrigin: 'left center',
          transition: 'transform .25s cubic-bezier(.4,0,.2,1)',
        }}
      />
    </NavLink>
  )
}

function ColumnHeading({ children }) {
  return (
    <h4 style={{
      margin: '0 0 14px',
      fontSize: 10,
      fontFamily: FONT.mono,
      fontWeight: FONT_WEIGHT.bold,
      color: C.brand,
      textTransform: 'uppercase',
      letterSpacing: '.18em',
    }}>{children}</h4>
  )
}

export default function RetailFooter() {
  return (
    <footer style={{
      // Sticky bottom via flex: marginTop:auto + padre flex column con flex:1.
      // PaddingTop generoso como buffer respiratorio para páginas con contenido.
      marginTop: 'auto',
      paddingTop: 56,
      position: 'relative',
      flexShrink: 0,
    }}>
      {/* Línea top con gradient dorado sutil — única separación visual */}
      <div style={{
        height: 1,
        background: `linear-gradient(90deg,
          transparent 0%,
          ${C.border} 20%,
          ${C.brand}50 50%,
          ${C.border} 80%,
          transparent 100%)`,
      }} />

      {/* Bloque principal — brand + columnas */}
      <div style={{
        padding: '32px 4px 28px',
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.4fr) repeat(2, minmax(0, 1fr))',
        gap: 32,
      }}>
        {/* Brand zone */}
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 12,
          }}>
            <div style={{
              width: 32, height: 32,
              borderRadius: 8,
              background: `linear-gradient(135deg, ${C.brand} 0%, ${C.brand}cc 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: FONT.mono,
              fontWeight: FONT_WEIGHT.black,
              fontSize: 14,
              color: '#000',
              letterSpacing: '-0.04em',
              boxShadow: `0 4px 14px ${C.brand}30`,
            }}>iA</div>
            <div>
              <div style={{
                fontSize: FONT_SIZE.base,
                fontWeight: FONT_WEIGHT.bold,
                color: C.text,
                letterSpacing: '-0.01em',
                lineHeight: 1.1,
              }}>Innovate IA</div>
              <div style={{
                fontSize: 10,
                fontFamily: FONT.mono,
                color: C.muted,
                letterSpacing: '.12em',
                textTransform: 'uppercase',
                marginTop: 2,
              }}>WhatsApp Automation</div>
            </div>
          </div>
          <p style={{
            margin: 0,
            fontSize: FONT_SIZE.sm,
            color: C.muted,
            lineHeight: 1.55,
            maxWidth: 320,
          }}>
            Tu negocio atendido 24/7 por un agente IA que vende, cobra y
            registra ventas automáticamente desde WhatsApp.
          </p>
        </div>

        {/* Columna: Recursos — créditos + soporte + instrucciones */}
        <div>
          <ColumnHeading>Recursos</ColumnHeading>
          <ul style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 9,
          }}>
            <li><FooterLink to="/mi-cuenta/creditos">¿Cómo funcionan los créditos?</FooterLink></li>
            <li><FooterLink to="/mi-cuenta/soporte">Soporte</FooterLink></li>
            <li><FooterLink to="/mi-cuenta/instrucciones">Instrucciones</FooterLink></li>
          </ul>
        </div>

        {/* Columna: Legal */}
        <div>
          <ColumnHeading>Legal</ColumnHeading>
          <ul style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 9,
          }}>
            <li><FooterLink to="/mi-cuenta/privacidad">Política de privacidad</FooterLink></li>
            <li><FooterLink to="/mi-cuenta/terminos">Términos y condiciones</FooterLink></li>
          </ul>
        </div>
      </div>

      {/* Responsive: en mobile las columnas se apilan */}
      <style>{`
        @media (max-width: 720px) {
          footer[data-retail-footer] > div[data-cols] {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
        }
      `}</style>
    </footer>
  )
}
