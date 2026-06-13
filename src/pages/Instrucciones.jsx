// ════════════════════════════════════════════════════════════════════
// Instrucciones — Centro de instrucciones (sub-tenant y tenant root)
//
// 17/05/2026 v11: agregadas 4 guías nuevas al index:
//   • Landing page  → /instrucciones/landing
//   • Studio        → /instrucciones/studio
//   • Clientes      → /instrucciones/clientes  (solo tenant)
//   • Saldo y créditos → /instrucciones/saldo
// ════════════════════════════════════════════════════════════════════

import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  PageHeader, Card,
  COLORS as C, FONT, FONT_SIZE, FONT_WEIGHT, RADIUS,
} from '../components/ui'

const buildCards = (basePath, { isPartnerScope }) => {
  const cards = [
    {
      id: 'billeteras',
      title: 'Billeteras',
      icon: '💳',
      legend: 'Configurá Mercado Pago, Ualá, MODO, Lemon o Belo. SIN CUENTA DE EMPRESA NI CUIT — con tu DNI alcanza.',
      href: `${basePath}/billeteras`,
      enabled: true,
    },
    {
      id: 'negocio',
      title: 'Negocio',
      icon: '🏢',
      legend: 'Conectá tu Pixel y convertí tu bot en un agente de ventas que trabaja 24 horas.',
      href: `${basePath}/negocio`,
      enabled: true,
    },
    {
      id: 'lineas',
      title: 'Líneas',
      icon: '📞',
      legend: 'Cómo funciona tu línea de WhatsApp: activación, providers (Meta API o QR), pausa y reactivación, y qué hacer si Meta la bloquea.',
      href: `${basePath}/lineas`,
      enabled: true,
    },
    {
      id: 'agente',
      title: 'Agente IA',
      icon: '🤖',
      legend: 'Configurá tu bot: personalidad, mensajes, remarketing automático y datos reales de conversión.',
      href: `${basePath}/agente`,
      enabled: true,
    },
    {
      id: 'landing',
      title: 'Landing Page',
      icon: '🌐',
      legend: 'Armá la página pública donde llegan tus prospectos. Templates pre-optimizados + Meta Pixel + tracking real de conversión.',
      href: `${basePath}/landing`,
      enabled: true,
    },
    {
      id: 'saldo',
      title: 'Saldo y créditos',
      icon: '💰',
      legend: isPartnerScope
        ? 'Entendé cómo funcionan los dos saldos (operativo y multimedia), packs disponibles, métodos de pago y qué pasa si te quedás sin créditos.'
        : 'Entendé cómo funciona tu saldo, packs disponibles, métodos de pago y qué pasa si te quedás sin créditos.',
      href: `${basePath}/saldo`,
      enabled: true,
    },
  ]

  // Solo el panel tenant ve "Clientes" y "Studio IA". Sub-tenant no,
  // porque no administra otros clientes ni tiene acceso a Studio.
  if (isPartnerScope) {
    cards.push({
      id: 'studio',
      title: 'Studio IA',
      icon: '🎨',
      legend: 'Generá imágenes, videos y voces con IA para tus campañas, posts y reels. Pay-per-use, sin suscripción.',
      href: `${basePath}/studio`,
      enabled: true,
    })
    cards.push({
      id: 'clientes',
      title: 'Clientes',
      icon: '👥',
      legend: 'Cómo administrar tus clientes: alta, activación de línea WhatsApp, monitoreo y lifecycle.',
      href: `${basePath}/clientes`,
      enabled: true,
    })
  }

  return cards
}

export default function Instrucciones() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isPartner } = useAuth()

  const isFromCliente = location.pathname.startsWith('/cliente')
  const isFromMiCuenta = location.pathname.startsWith('/mi-cuenta')
  const basePath = isFromCliente  ? '/cliente/instrucciones'
                 : isFromMiCuenta ? '/mi-cuenta/instrucciones'
                 : '/instrucciones'

  const isPartnerScope = !isFromCliente && !isFromMiCuenta && !!isPartner

  const CARDS = buildCards(basePath, { isPartnerScope })

  return (
    <div>
      <PageHeader
        eyebrow="CENTRO DE INSTRUCCIONES"
        title="¿Cómo querés empezar?"
        subtitle="Elegí el camino que mejor se adapta a tu caso. Cada uno te lleva a una guía paso a paso para configurar tu cuenta y empezar a cobrar."
      />

      <Card padding={32} style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold, color: C.text, display: 'flex', alignItems: 'center', gap: 10, letterSpacing: '-0.005em' }}>
            <span style={{ fontSize: 22, lineHeight: 1 }}>🚀</span>
            Elegí por dónde empezar
          </h2>
          <p style={{ margin: '8px 0 0', fontSize: FONT_SIZE.sm, color: C.muted, lineHeight: 1.55 }}>
            Cada guía te lleva paso a paso a configurar una parte clave de tu cuenta. Podés hacerlas en cualquier orden y volver cuando quieras.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {CARDS.map(card => (
            <article
              key={card.id}
              onClick={() => card.enabled && navigate(card.href)}
              style={{
                background: C.surface, border: `1px solid ${C.border}`, borderRadius: RADIUS.md,
                padding: '20px 18px', cursor: card.enabled ? 'pointer' : 'not-allowed',
                transition: 'border-color .15s, transform .15s, background .15s',
                opacity: card.enabled ? 1 : 0.6, display: 'flex', flexDirection: 'column', gap: 10, minHeight: 180,
              }}
              onMouseEnter={e => { if (!card.enabled) return; e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { if (!card.enabled) return; e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>{card.icon}</span>
                <h3 style={{ margin: 0, fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: C.text, letterSpacing: '-0.005em', lineHeight: 1.25, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{card.title}</h3>
                {!card.enabled && (
                  <span style={{ marginLeft: 'auto', padding: '3px 9px', borderRadius: 999, background: C.surface2, border: `1px solid ${C.border}`, fontSize: FONT_SIZE.xs, fontFamily: FONT.mono, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: FONT_WEIGHT.semibold, whiteSpace: 'nowrap', flexShrink: 0 }}>Próximamente</span>
                )}
              </div>
              <p style={{ margin: 0, fontSize: FONT_SIZE.sm, color: C.muted, lineHeight: 1.55, flex: 1 }}>{card.legend}</p>
              {card.enabled && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: C.primaryLite || C.primary, fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.semibold, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 }}>
                  Ver guía <span aria-hidden="true">→</span>
                </div>
              )}
            </article>
          ))}
        </div>
      </Card>

      <Card padding={20}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 240px', minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.semibold, color: C.text }}>¿Necesitás ayuda?</p>
            <p style={{ margin: '4px 0 0', fontSize: FONT_SIZE.sm, color: C.muted, lineHeight: 1.5 }}>Si te trabás en cualquier paso, escribinos por WhatsApp y te ayudamos en minutos.</p>
          </div>
          <a href="https://wa.me/5493455527663?text=Hola%2C+necesito+ayuda+con+las+instrucciones+de+Innovate.ia" target="_blank" rel="noopener noreferrer" style={{ padding: '8px 14px', borderRadius: RADIUS.sm, background: `${C.wa}1A`, border: `1px solid ${C.wa}55`, color: C.wa, fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', flexShrink: 0, fontFamily: 'inherit' }}>
            <span aria-hidden="true">💬</span> Escribinos
          </a>
        </div>
      </Card>
    </div>
  )
}
