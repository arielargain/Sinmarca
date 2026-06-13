import { useNavigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { COLORS, FONT_WEIGHT } from '../theme/tokens'
import { TUTORIAL_STYLES, WALLET_FONTS_LINK, safeAccent } from './_walletTutorialStyles'
import { getInstruccionesBase } from '../lib/instruccionesScope'

const C = COLORS

/**
 * NegocioTutorialLayout — header sticky con "Volver" + contenedor scopeado
 * .wallet-tutorial reutilizado.
 *
 * Análogo a AgenteTutorialLayout. Solo cambia el breadcrumb del header
 * a "Instrucciones / Negocio".
 *
 * 13/05/2026: el patrón viejo `isFromCliente` (booleano) solo discriminaba
 * /cliente vs todo lo demás, y rompía el retail (que vive en /mi-cuenta).
 * Ahora usa getInstruccionesBase() que detecta los 3 scopes correctamente.
 */
export default function NegocioTutorialLayout({
  accent = '#D4A843',
  bodyHtml,
  backTo: backToProp,
  breadcrumb = 'Instrucciones / Negocio',
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const accentSafe = safeAccent(accent)

  const root = getInstruccionesBase(location.pathname)
  const backTo = backToProp
    ? (backToProp.startsWith('/') ? backToProp : `${root}/${backToProp}`)
    : root

  useEffect(() => {
    const id = 'wallet-tutorial-fonts'
    if (document.getElementById(id)) return
    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href = WALLET_FONTS_LINK
    document.head.appendChild(link)
  }, [])

  return (
    <div style={{ background: C.bg, minHeight: '100vh' }}>
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: 'rgba(5,7,9,0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${C.border}`,
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
      }}>
        <button
          onClick={() => navigate(backTo)}
          style={{
            background: 'transparent',
            border: `1px solid ${C.border}`,
            color: C.text,
            padding: '8px 14px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: FONT_WEIGHT.semibold,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          ← Volver
        </button>
        <span style={{
          fontSize: 12,
          color: C.muted,
          fontFamily: 'monospace',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}>
          {breadcrumb}
        </span>
      </div>

      <div
        style={{ '--accent': accentSafe }}
        dangerouslySetInnerHTML={{
          __html: TUTORIAL_STYLES + `<div class="wallet-tutorial" style="--accent:${accentSafe}">${bodyHtml}</div>`,
        }}
      />
    </div>
  )
}
