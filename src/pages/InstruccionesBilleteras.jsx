import { useNavigate, useLocation } from 'react-router-dom'
import { COLORS, FONT, FONT_SIZE, FONT_WEIGHT, RADIUS } from '../theme/tokens'
import { getInstruccionesBase, getInstruccionesScope } from '../lib/instruccionesScope'

const C = COLORS

const buildWallets = (basePath) => [
  {
    id: 'mercado-pago',
    title: 'Mercado Pago',
    short: 'MP',
    legend: 'La más usada en Argentina. Cuenta personal con DNI.',
    fee: '~5%',
    speed: 'Instantáneo',
    accent: '#009ee3',
    accentBg: 'rgba(0,158,227,0.08)',
    accentBorder: 'rgba(0,158,227,0.25)',
    href: `${basePath}/mercado-pago`,
    badge: 'Más popular',
  },
  {
    id: 'uala',
    title: 'Ualá Bis',
    short: 'Ualá',
    legend: 'Comisiones más bajas que MP. Acreditación instantánea por API.',
    fee: '~3.5%',
    speed: 'Instantáneo',
    accent: '#5a4fff',
    accentBg: 'rgba(90,79,255,0.08)',
    accentBorder: 'rgba(90,79,255,0.25)',
    href: `${basePath}/uala`,
    badge: null,
  },
  {
    id: 'modo',
    title: 'MODO',
    short: 'MODO',
    legend: 'Conecta cualquier banco argentino. Sin comisión por transferencia.',
    fee: '0% – 2.5%',
    speed: 'Instantáneo',
    accent: '#1d4ed8',
    accentBg: 'rgba(29,78,216,0.08)',
    accentBorder: 'rgba(29,78,216,0.25)',
    href: `${basePath}/modo`,
    badge: null,
  },
  {
    id: 'lemon',
    title: 'Lemon Cash',
    short: 'Lemon',
    legend: 'Cobrá en USDT con tasa 0%. Convertís a pesos cuando querés.',
    fee: '0% USDT',
    speed: 'Instantáneo',
    accent: '#00d672',
    accentBg: 'rgba(0,214,114,0.08)',
    accentBorder: 'rgba(0,214,114,0.25)',
    href: `${basePath}/lemon`,
    badge: null,
  },
  {
    id: 'belo',
    title: 'Belo',
    short: 'Belo',
    legend: 'Stablecoins (USDT, USDC) sin comisión. Multi-moneda.',
    fee: '0% USDT',
    speed: 'Instantáneo',
    accent: '#0066ff',
    accentBg: 'rgba(0,102,255,0.08)',
    accentBorder: 'rgba(0,102,255,0.25)',
    href: `${basePath}/belo`,
    badge: null,
  },
]

export default function InstruccionesBilleteras() {
  const navigate = useNavigate()
  const location = useLocation()

  // 13/05/2026: getInstruccionesBase ahora reconoce 3 scopes
  // (/cliente, /mi-cuenta, /). El patrón viejo isFromCliente booleano
  // rompía el retail mandándolo a /instrucciones/* (ruta inexistente
  // en chat host) → catch-all → /mi-cuenta. Síntoma reportado: "abro
  // mercadopago y me lleva a inicio".
  const base = getInstruccionesBase(location.pathname)
  const backTo = base
  const walletsBase = `${base}/billeteras`
  const wallets = buildWallets(walletsBase)
  const scope = getInstruccionesScope(location.pathname)
  const hasOwnShell = scope === 'subTenant' || scope === 'retail'  // antes era solo subTenant

  return (
    <div style={{ background: C.bg, minHeight: '100vh' }}>
      {/* Header sticky */}
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
          Instrucciones / Billeteras
        </span>
      </div>

      <div style={{
        // Sub-tenant + retail viven dentro de un shell propio que ya provee
        // padding/centering. Partner (tenant root) usa sidebar — el contenedor
        // se centra dentro del main con maxWidth.
        maxWidth: hasOwnShell ? '100%' : 'clamp(1080px, 90vw, 2400px)',
        margin: hasOwnShell ? '0' : '0 auto',
        padding: 'clamp(32px, 3vw, 64px) clamp(20px, 3vw, 64px) clamp(60px, 5vw, 120px)',
      }}>
        {/* Header de sección */}
        <header style={{ marginBottom: 'clamp(36px, 3vw, 64px)' }}>
          <p style={{
            fontSize: 'clamp(11px, 0.7vw, 14px)',
            fontFamily: FONT.mono,
            color: '#D4A843',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: 8,
            fontWeight: 600,
          }}>
            5 opciones · Sin cuenta empresa · Sin CUIT
          </p>
          <h1 style={{
            fontSize: 'clamp(26px, 3vw, 56px)',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: C.text,
            marginBottom: 12,
          }}>
            Elegí qué billetera querés conectar
          </h1>
          <p style={{
            fontSize: 'clamp(15px, 1vw, 20px)',
            color: C.muted,
            lineHeight: 1.6,
            maxWidth: 'clamp(680px, 50vw, 1100px)',
          }}>
            Todas se configuran con tu cuenta personal — DNI alcanza, no hace falta CUIT ni cuenta de empresa.
            Cada una tiene un tutorial paso a paso con capturas. Podés conectar más de una al mismo tiempo.
          </p>
        </header>

        {/* Tip de comparación rápida */}
        <div style={{
          background: 'rgba(212,168,67,0.05)',
          border: '1px solid rgba(212,168,67,0.2)',
          borderRadius: 12,
          padding: 'clamp(14px, 1.2vw, 22px) clamp(18px, 1.5vw, 28px)',
          marginBottom: 'clamp(28px, 2.4vw, 48px)',
          fontSize: 'clamp(13px, 1vw, 18px)',
          color: C.text,
          lineHeight: 1.6,
        }}>
          <strong style={{ color: '#D4A843' }}>💡 ¿Cuál elegir?</strong> Si recién empezás → <strong>Mercado Pago</strong> (la conoce todo el mundo).
          Si querés bajar comisiones → <strong>Ualá Bis</strong> o <strong>MODO</strong>.
          Si tu público maneja cripto → <strong>Lemon</strong> o <strong>Belo</strong> (0% comisión real).
        </div>

        {/* Grid de billeteras */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(260px, 18vw, 420px), 1fr))',
          gap: 'clamp(14px, 1.4vw, 26px)',
        }}>
          {wallets.map(w => (
            <article
              key={w.id}
              onClick={() => navigate(w.href)}
              style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: RADIUS?.lg || 14,
                padding: 'clamp(24px, 2vw, 40px) clamp(22px, 1.8vw, 36px) clamp(20px, 1.6vw, 32px)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                minHeight: 220,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = w.accentBorder.replace('0.25', '0.6')
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = `0 12px 32px ${w.accentBg}`
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = C.border
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              {/* Accent bar */}
              <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0,
                height: 3,
                background: w.accent,
              }} />

              {/* Badge */}
              {w.badge && (
                <div style={{
                  position: 'absolute',
                  top: 14, right: 14,
                  padding: '3px 10px',
                  borderRadius: 99,
                  background: w.accentBg,
                  border: `1px solid ${w.accentBorder}`,
                  fontSize: 10,
                  fontFamily: FONT.mono,
                  color: w.accent,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  fontWeight: 700,
                }}>
                  {w.badge}
                </div>
              )}

              {/* Logo / inicial */}
              <div style={{
                width: 'clamp(52px, 4vw, 84px)',
                height: 'clamp(52px, 4vw, 84px)',
                borderRadius: 'clamp(12px, 1vw, 18px)',
                background: w.accentBg,
                border: `1px solid ${w.accentBorder}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'clamp(18px, 1.5vw, 28px)',
                fontWeight: 800,
                color: w.accent,
                fontFamily: FONT.mono,
                marginBottom: 'clamp(16px, 1.3vw, 26px)',
                letterSpacing: '-0.02em',
              }}>
                {w.short}
              </div>

              {/* Título */}
              <h3 style={{
                fontSize: 'clamp(18px, 1.5vw, 28px)',
                fontWeight: FONT_WEIGHT.bold,
                color: C.text,
                marginBottom: 8,
                letterSpacing: '-0.005em',
              }}>
                {w.title}
              </h3>

              {/* Legend */}
              <p style={{
                fontSize: 'clamp(12.5px, 0.95vw, 17px)',
                color: C.muted,
                lineHeight: 1.55,
                flex: 1,
                marginBottom: 'clamp(16px, 1.3vw, 26px)',
              }}>
                {w.legend}
              </p>

              {/* Stats */}
              <div style={{
                display: 'flex',
                gap: 'clamp(14px, 1.2vw, 24px)',
                paddingTop: 'clamp(12px, 1vw, 20px)',
                borderTop: `1px solid ${C.border}`,
                marginBottom: 'clamp(12px, 1vw, 20px)',
              }}>
                <div>
                  <p style={{ fontSize: 'clamp(9.5px, 0.7vw, 13px)', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 2px', fontFamily: FONT.mono }}>Comisión</p>
                  <p style={{ fontSize: 'clamp(13px, 1vw, 18px)', fontWeight: 700, color: w.accent, margin: 0, fontFamily: FONT.mono }}>{w.fee}</p>
                </div>
                <div>
                  <p style={{ fontSize: 'clamp(9.5px, 0.7vw, 13px)', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 2px', fontFamily: FONT.mono }}>Velocidad</p>
                  <p style={{ fontSize: 'clamp(13px, 1vw, 18px)', fontWeight: 700, color: C.text, margin: 0, fontFamily: FONT.mono }}>{w.speed}</p>
                </div>
              </div>

              {/* CTA footer */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <span style={{
                  fontSize: 'clamp(11.5px, 0.85vw, 16px)',
                  fontWeight: FONT_WEIGHT.semibold,
                  color: w.accent,
                  fontFamily: FONT.mono,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}>
                  Ver guía
                </span>
                <span style={{ fontSize: 16, color: w.accent, fontWeight: 700 }}>→</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}
