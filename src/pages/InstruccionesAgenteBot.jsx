import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { COLORS, FONT, FONT_SIZE, FONT_WEIGHT, RADIUS } from '../theme/tokens'
import { getInstruccionesBase, getInstruccionesScope } from '../lib/instruccionesScope'

const C = COLORS

const buildIdentities = (basePath) => [
  {
    id: 'casino',
    title: 'Bot Casino',
    short: 'CSN',
    legend: 'Crea cuentas, genera links de carga y acredita saldo automáticamente. Atiende WhatsApp 24/7 y escala retiros a operador.',
    fee: 'Carga 24/7',
    speed: '~3s respuesta',
    accent: '#22c55e',
    accentBg: 'rgba(34,197,94,0.08)',
    accentBorder: 'rgba(34,197,94,0.25)',
    href: `${basePath}/casino`,
    badge: 'Más usado',
  },
  {
    id: 'tienda',
    title: 'Bot Tienda',
    short: 'TND',
    legend: 'Catálogo conversacional. Cobra con MP y registra pedidos con dirección. El cliente compra desde WhatsApp, vos mirás /pedidos.',
    fee: 'Pedidos 24/7',
    speed: 'Realtime',
    accent: '#3b82f6',
    accentBg: 'rgba(59,130,246,0.08)',
    accentBorder: 'rgba(59,130,246,0.25)',
    href: `${basePath}/tienda`,
    badge: 'Nuevo',
  },
  {
    id: 'marketing',
    title: 'Bot Marketing',
    short: 'MKT',
    legend: 'Captura leads y los deriva al humano que cierra. Útil cuando el producto se vende por WhatsApp pero el cierre es manual.',
    fee: 'Captura 24/7',
    speed: 'Lead < 1min',
    accent: '#a78bfa',
    accentBg: 'rgba(167,139,250,0.08)',
    accentBorder: 'rgba(167,139,250,0.25)',
    href: `${basePath}/marketing`,
    badge: null,
  },
  {
    id: 'profesional',
    title: 'Bot Profesional',
    short: 'PRF',
    legend: 'Atención de consultas y coordinación de turnos. Pensado para profesionales independientes (médicos, abogados, estudios).',
    fee: 'Turnos 24/7',
    speed: 'Tono formal',
    accent: '#ec4899',
    accentBg: 'rgba(236,72,153,0.08)',
    accentBorder: 'rgba(236,72,153,0.25)',
    href: `${basePath}/profesional`,
    badge: null,
  },
]

export default function InstruccionesAgenteBot() {
  const navigate = useNavigate()
  const location = useLocation()
  const { retail, subTenant, isRetail, isSubTenant } = useAuth()

  // 13/05/2026: helper reemplaza el patrón isFromCliente que rompía retail.
  const basePath = getInstruccionesBase(location.pathname)
  const backTo = basePath
  const identitiesBase = `${basePath}/agente`
  const scope = getInstruccionesScope(location.pathname)
  const hasOwnShell = scope === 'subTenant' || scope === 'retail'

  // 10/06/2026 — Revertido el filtro por identity. El centro de instrucciones
  // es EDUCATIVO: mostramos las 4 opciones para que el user pueda comparar
  // qué hace cada bot. Marcamos visualmente cuál es su identidad actual.
  const myIdentity = isSubTenant ? subTenant?.identity
                   : isRetail    ? retail?.identity
                   : null
  const identities = buildIdentities(identitiesBase)

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
            color: C.muted,
            padding: '6px 14px',
            borderRadius: 8,
            fontSize: 13,
            cursor: 'pointer',
            fontFamily: FONT.body,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          ← Volver
        </button>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 11, fontFamily: FONT.mono, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
            Centro de instrucciones · Agente
          </p>
          <p style={{ fontSize: 14, fontWeight: FONT_WEIGHT.semibold, color: C.text, margin: '2px 0 0' }}>
            🎯 Configurá tu bot según tu negocio
          </p>
        </div>
      </div>

      <div style={{
        maxWidth: hasOwnShell ? '100%' : 'clamp(1080px, 90vw, 2400px)',
        margin: hasOwnShell ? '0' : '0 auto',
        padding: 'clamp(24px, 3vw, 56px) clamp(20px, 3vw, 64px) clamp(40px, 4vw, 96px)',
      }}>
        {/* Header */}
        <header style={{ marginBottom: 'clamp(28px, 2.5vw, 48px)' }}>
          <p style={{
            fontSize: 'clamp(11px, 0.7vw, 14px)',
            fontFamily: FONT.mono,
            color: C.muted,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: 6,
          }}>
            Identidades del bot
          </p>
          <h1 style={{
            fontSize: 'clamp(22px, 2.6vw, 48px)',
            fontWeight: FONT_WEIGHT.bold,
            letterSpacing: '-0.01em',
            color: C.text,
            marginBottom: 12,
          }}>
            ¿Qué tipo de bot necesitás?
          </h1>
          <p style={{
            fontSize: 'clamp(14px, 1vw, 20px)',
            color: C.muted,
            lineHeight: 1.6,
            maxWidth: 'clamp(640px, 50vw, 1100px)',
          }}>
            El mismo motor IA, distintos comportamientos según tu rubro. Elegí el que se parece a lo tuyo y andá a la guía completa: cómo configurarlo, qué automatiza, dónde escala a humano.
          </p>
        </header>

        {/* Tip orientativo */}
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
          <strong style={{ color: '#D4A843' }}>💡 ¿Cuál elegir?</strong> Si vendés acceso a una plataforma con saldo → <strong>Casino</strong>.
          Si vendés productos físicos con envío → <strong>Tienda</strong>.
          Si solo querés capturar interesados y cerrar a mano → <strong>Marketing</strong>.
          Si sos profesional y agendás turnos → <strong>Profesional</strong>.
        </div>

        {/* Grid de identities */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(260px, 18vw, 420px), 1fr))',
          gap: 'clamp(14px, 1.4vw, 26px)',
        }}>
          {identities.map(w => (
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
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: w.accent }} />

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

              <h3 style={{
                fontSize: 'clamp(18px, 1.5vw, 28px)',
                fontWeight: FONT_WEIGHT.bold,
                color: C.text,
                marginBottom: 8,
                letterSpacing: '-0.005em',
              }}>
                {w.title}
              </h3>

              {w.id === myIdentity && (
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
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
                  alignSelf: 'flex-start',
                  marginBottom: 10,
                }}>
                  📍 Tu identidad
                </div>
              )}

              <p style={{
                fontSize: 'clamp(12.5px, 0.95vw, 17px)',
                color: C.muted,
                lineHeight: 1.55,
                flex: 1,
                marginBottom: 'clamp(16px, 1.3vw, 26px)',
              }}>
                {w.legend}
              </p>

              <div style={{
                display: 'flex',
                gap: 'clamp(14px, 1.2vw, 24px)',
                paddingTop: 'clamp(12px, 1vw, 20px)',
                borderTop: `1px solid ${C.border}`,
                marginBottom: 'clamp(12px, 1vw, 20px)',
              }}>
                <div>
                  <p style={{ fontSize: 'clamp(9.5px, 0.7vw, 13px)', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 2px', fontFamily: FONT.mono }}>Operación</p>
                  <p style={{ fontSize: 'clamp(13px, 1vw, 18px)', fontWeight: 700, color: w.accent, margin: 0, fontFamily: FONT.mono }}>{w.fee}</p>
                </div>
                <div>
                  <p style={{ fontSize: 'clamp(9.5px, 0.7vw, 13px)', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 2px', fontFamily: FONT.mono }}>Velocidad</p>
                  <p style={{ fontSize: 'clamp(13px, 1vw, 18px)', fontWeight: 700, color: C.text, margin: 0, fontFamily: FONT.mono }}>{w.speed}</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
