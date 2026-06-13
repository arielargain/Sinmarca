import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { COLORS, FONT, FONT_SIZE, FONT_WEIGHT, RADIUS } from '../theme/tokens'
import { getInstruccionesBase, getInstruccionesScope } from '../lib/instruccionesScope'

const C = COLORS

const buildIdentities = (basePath) => [
  {
    id: 'casino',
    title: 'Casino online',
    short: 'CSN',
    legend: 'Plataforma con saldo, login y movimientos. La integración hace alta de cuenta + acreditación automática vía API ImperiumBet.',
    fee: 'Pixel + CAPI',
    speed: 'API directa',
    accent: '#22c55e',
    accentBg: 'rgba(34,197,94,0.08)',
    accentBorder: 'rgba(34,197,94,0.25)',
    href: `${basePath}/casino`,
    badge: 'Más usado',
  },
  {
    id: 'tienda',
    title: 'Tienda online',
    short: 'TND',
    legend: 'Productos físicos con envío. Alta de catálogo en el panel, cobro automático con MP, panel de pedidos para preparar el envío.',
    fee: 'Catálogo + MP',
    speed: 'Sin integración',
    accent: '#3b82f6',
    accentBg: 'rgba(59,130,246,0.08)',
    accentBorder: 'rgba(59,130,246,0.25)',
    href: `${basePath}/tienda`,
    badge: 'Nuevo',
  },
  {
    id: 'marketing',
    title: 'Captación / Marketing',
    short: 'MKT',
    legend: 'Negocios donde el cierre lo hace un humano. El bot capta el lead, reúne contexto, y notifica al equipo en tiempo real.',
    fee: 'Lead capture',
    speed: 'Sin cobros',
    accent: '#a78bfa',
    accentBg: 'rgba(167,139,250,0.08)',
    accentBorder: 'rgba(167,139,250,0.25)',
    href: `${basePath}/marketing`,
    badge: null,
  },
  {
    id: 'profesional',
    title: 'Profesional / Servicios',
    short: 'PRF',
    legend: 'Médicos, abogados, contadores, estudios. Tono formal, agenda de turnos, derivación al profesional disponible.',
    fee: 'Turnos',
    speed: 'Tono formal',
    accent: '#ec4899',
    accentBg: 'rgba(236,72,153,0.08)',
    accentBorder: 'rgba(236,72,153,0.25)',
    href: `${basePath}/profesional`,
    badge: null,
  },
]

export default function InstruccionesNegocio() {
  const navigate = useNavigate()
  const location = useLocation()
  const { retail, subTenant, isRetail, isSubTenant } = useAuth()

  // 13/05/2026: helper reemplaza el patrón isFromCliente que rompía retail.
  const basePath = getInstruccionesBase(location.pathname)
  const backTo = basePath
  const identitiesBase = `${basePath}/negocio`
  const scope = getInstruccionesScope(location.pathname)
  const hasOwnShell = scope === 'subTenant' || scope === 'retail'

  // Identity efectiva del usuario actual.
  //   - Si es retail (panel /mi-cuenta): retail.identity
  //   - Si es sub-tenant (panel /cliente): subTenant.identity
  //   - Otros casos: null → no filtramos, mostramos todas
  const myIdentity = isSubTenant ? subTenant?.identity
                   : isRetail    ? retail?.identity
                   : null

  // 10/06/2026 — Revertido el filtro: el centro de instrucciones es
  // EDUCATIVO. Mostramos los 4 tipos de negocio para que el user pueda
  // comparar qué automatiza cada uno y entender el modelo. Marcamos
  // visualmente cuál es la identidad actual del user con un sub-badge.
  const identities = buildIdentities(identitiesBase)

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
            Centro de instrucciones · Negocio
          </p>
          <p style={{ fontSize: 14, fontWeight: FONT_WEIGHT.semibold, color: C.text, margin: '2px 0 0' }}>
            🏢 Conectá tu negocio según su tipo
          </p>
        </div>
      </div>

      <div style={{
        maxWidth: hasOwnShell ? '100%' : 'clamp(1080px, 90vw, 2400px)',
        margin: hasOwnShell ? '0' : '0 auto',
        padding: 'clamp(24px, 3vw, 56px) clamp(20px, 3vw, 64px) clamp(40px, 4vw, 96px)',
      }}>
        <header style={{ marginBottom: 'clamp(28px, 2.5vw, 48px)' }}>
          <p style={{
            fontSize: 'clamp(11px, 0.7vw, 14px)',
            fontFamily: FONT.mono,
            color: C.muted,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: 6,
          }}>
            Tipos de negocio soportados
          </p>
          <h1 style={{
            fontSize: 'clamp(22px, 2.6vw, 48px)',
            fontWeight: FONT_WEIGHT.bold,
            letterSpacing: '-0.01em',
            color: C.text,
            marginBottom: 12,
          }}>
            ¿Cómo es tu operación?
          </h1>
          <p style={{
            fontSize: 'clamp(14px, 1vw, 20px)',
            color: C.muted,
            lineHeight: 1.6,
            maxWidth: 'clamp(640px, 50vw, 1100px)',
          }}>
            La plataforma se adapta a 4 tipos de negocio. Lo que cambia: qué automatiza el bot, qué eventos manda a Meta, y qué configuración inicial pedimos. Elegí el que se parece a lo tuyo.
          </p>
        </header>

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
          <strong style={{ color: '#D4A843' }}>💡 ¿Qué cambia entre cada uno?</strong> Casino y Tienda automatizan el cobro de punta a punta.
          Marketing y Profesional son <em>lead capture</em>: el bot reúne contexto, el humano cierra. La identidad la cambiás desde tu Configuración → Identidad del negocio.
        </div>

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
                  <p style={{ fontSize: 'clamp(9.5px, 0.7vw, 13px)', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 2px', fontFamily: FONT.mono }}>Stack</p>
                  <p style={{ fontSize: 'clamp(13px, 1vw, 18px)', fontWeight: 700, color: w.accent, margin: 0, fontFamily: FONT.mono }}>{w.fee}</p>
                </div>
                <div>
                  <p style={{ fontSize: 'clamp(9.5px, 0.7vw, 13px)', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 2px', fontFamily: FONT.mono }}>Setup</p>
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
