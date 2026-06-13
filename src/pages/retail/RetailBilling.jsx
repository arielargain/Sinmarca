// ═════════════════════════════════════════════════════════════════
// RetailBilling.jsx — clonado de Billing.jsx (partner) el 08/05/2026.
//
// Mismo modelo de cobro que el partner:
//   - usePlans() lee plan_addons donde tier_target IN ('all','retail')
//   - handleSelect() llama a EF create-addon-checkout con addon_id
//   - MP devuelve init_point, redirige al checkout
//   - mp-confirm-addon (webhook de MP) acredita creditos via process_addon_purchase
//
// 13/05/2026 — UX cleanup billing retail:
//   - Eliminado el badge "ADD-ON" absoluto en WaAddonCard (top-right) que
//     se solapaba con la columna del precio en anchos típicos cortándolo
//     a "ADD-O". El add-on ya estaba bien señalizado por el eyebrow
//     "ACTIVACIÓN ADICIONAL" + el header de sección "¿Necesitás solo el
//     número?" + el dashed border, así que el badge era redundante.
//   - Base (pack_15d): agregada feature "WhatsApp por QR · gratis"
//     comunicando que se puede vincular WhatsApp escaneando un QR sin
//     trámites con Meta. Aplica desde el día 1.
//   - Pro (plan_base_30d): la feature × "Línea WhatsApp API" se reemplaza
//     por ✓ "WhatsApp por QR · gratis", y se agrega una nueva fila ×
//     "Línea WhatsApp API oficial" indicando que está disponible como
//     add-on o ya incluida en Gold (para que quede claro el upsell).
//
// 13/05/2026 — Créditos no vencen + garantía 30 días corridos:
//   - Pack Base (pack_15d): wording "No vencen" → "Créditos no vencen"
//     con desc clarificando que se consumen al activar.
//   - Plan Pro (plan_base_30d): se agrega feature "Créditos no vencen"
//     para alinear con el modelo de saldo persistente (los días no
//     consumidos quedan; el user elige cuándo activar y cuántos días).
//   - Plan Gold (plan_gold_30d):
//       · stat "SÍ GARANTÍA WA" → "30d GARANTÍA WA" (cuantifica).
//       · feature "Línea WhatsApp API + garantía" se desdobla en dos:
//           "Línea WhatsApp API" (activación oficial) y
//           "Garantía 30 días corridos" (con desc explícito).
//       · se agrega "Créditos no vencen" igual que Pro.
//   - Banner "Garantía Gold" debajo del grid: aclara que cubre 30 días
//     corridos desde la compra, hayas activado el plan o no.
//   - El usuario elige cuándo y cuántos días activar; NO puede pausar
//     o desactivar después de activar — al activar consume saldo.
//
// 13/05/2026 — Rename de planes + WA como add-on aparte + wording sesiones:
//   - Renombrado display (NO los addon.id de BD, que romperían pagos):
//       pack_15d         → "Base"  (era "15 créditos")
//       plan_base_30d    → "Pro"   (era "Base")
//       plan_gold_30d    → "Gold"  (sin cambios)
//   - WA (wa_line_only) ya NO va en el grid de planes. Se renderiza
//     en una sección aparte abajo con header "Activación adicional"
//     para dejar claro que es un add-on, no un plan.
//   - Wording de "sesiones con dev" → "sesiones abiertas" / dispositivos
//     simultáneos. Las stats numéricas (1/3/10) pasan a representar
//     cuántos dispositivos pueden abrir el panel al mismo tiempo.
//     Gold mantiene "dev dedicado" como diferencial cualitativo en
//     features detalladas (es un servicio adicional real del plan),
//     pero el número 10 ya no es "10 sesiones con dev".
//
// 11/05/2026 — Fix alineación header con resto del panel:
//   Antes envolvía todo el JSX en <PageContainer> (maxWidth:1200, margin:0
//   auto + padding 16/20/40). Eso centra el contenido en una columna
//   más angosta que el shell, y como resultado el header (eyebrow +
//   "Saldo" + subtitle) quedaba ~65px desplazado a la derecha respecto
//   de Configuración / Instrucciones, que NO usan PageContainer y
//   heredan el ancho completo del shell RetailLayout (clamp 1200-1600px).
//
// 11/05/2026 — Header unificado (PageHeader del DS, eyebrow "Centro de saldo").
//
// 11/05/2026 — Rediseño v3 (cards LARGAS + grid forzado 1/2/3 cols):
//   Tras sacar WA del grid principal pasamos de 4→3 columnas en desktop.
//
// 11/05/2026 — INTEGRACIÓN NOWPayments (pago cripto REAL automático):
//   Antes el flujo cripto abría un mailto a soporte@ — el equipo
//   coordinaba manual la wallet, recibía el pago a ojo, acreditaba a
//   mano. Ahora:
//
//   1. User click "Pagar con cripto" → modal con USDT TRC20 (única
//      opción activa por ahora; BTC/ETH se sumarán después)
//   2. handleCrypto() llama a EF `create-crypto-checkout` con
//      { addon_id, pay_currency: 'usdttrc20' }
//   3. EF crea invoice en NOWPayments, inserta crypto_payments pending
//      + tenant_addons pending (payment_provider='nowpayments'), devuelve
//      { invoice_url, np_order_id }
//   4. Frontend redirige al invoice_url de NP (hosted page con QR
//      + wallet address + countdown)
//   5. User paga desde su wallet → NP detecta on-chain → IPN llega a
//      EF `np-confirm` → valida HMAC SHA512 → llama RPC
//      `process_crypto_addon_purchase` → acredita créditos/línea
//   6. NP redirige user a /mi-cuenta/billing?purchase=success&addon=X
//      → useEffect muestra banner verde, refresca el saldo
// ═════════════════════════════════════════════════════════════════
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { usePlans } from '../../hooks/usePlans'
import { metaPixel } from '../../lib/metaPixel'
import {
  PageHeader, Card, Banner, Button, Chip,
  COLORS as C, RADIUS, FONT, FONT_SIZE, FONT_WEIGHT, TRANSITION,
} from '../../components/ui'
import Icon from '../../components/Icon'
import RetailActivationWidget from '../../components/RetailActivationWidget'

const LEGACY = {
  wa:     '#25d366',
  btc:    '#f7931a',
  eth:    '#627eea',
  usdt:   '#26a17b',
  orange: '#fb923c',
  amber:  '#fbbf24',
  gold:   '#D4A843',
}

// ═════════════════════════════════════════════════════════════════
// PLAN_DISPLAY — single source of truth para diseño de las 3 cards
// de plan + la card aparte de add-on WA.
//
// IMPORTANTE: los keys (pack_15d, plan_base_30d, plan_gold_30d,
// wa_line_only) DEBEN coincidir con los addon.id de la tabla plan_addons.
// El display.name es solo etiqueta visual — el backend sigue trabajando
// con los IDs originales. Renombrar el id rompería pagos pendientes,
// webhooks de MP, RPCs, integraciones, etc.
// ═════════════════════════════════════════════════════════════════
const PLAN_DISPLAY = {
  pack_15d: {
    order: 1,
    tier: 'base',
    icon: '⚡',
    eyebrow: 'PLAN BASE',
    name: 'Base',
    tagline: 'Empezá con 15 días de operación. Ideal para arrancar.',
    stats: [
      { value: '15',  label: 'DÍAS DE OPERACIÓN' },
      { value: '1',   label: 'SESIÓN ABIERTA' },
      { value: '∞',   label: 'SIN VENCIMIENTO' },
    ],
    featuresDetailed: [
      { check: true,  title: '15 días de operación',         desc: 'Bot 24/7 sin interrupciones, sin contratos.' },
      { check: true,  title: '1 sesión abierta',             desc: '1 dispositivo puede abrir el panel a la vez.' },
      { check: true,  title: 'Agente IA completo',           desc: 'Todas las funciones del asistente inteligente.' },
      { check: true,  title: 'WhatsApp por QR · gratis',     desc: 'Vinculá tu WhatsApp escaneando un QR. Sin trámites con Meta.' },
      { check: true,  title: 'Créditos no vencen',           desc: 'Activá cuando quieras. Al activar se consumen los días elegidos.' },
    ],
    color: C.brand,
    cta: 'Elegir Base',
  },
  plan_base_30d: {
    order: 2,
    tier: 'pro',
    icon: '🚀',
    eyebrow: 'PLAN PRO',
    name: 'Pro',
    tagline: 'Para equipos que necesitan operar desde varios dispositivos.',
    stats: [
      { value: '30',   label: 'DÍAS DE OPERACIÓN' },
      { value: '3',    label: 'SESIONES ABIERTAS' },
      { value: '24/7', label: 'BOT AUTOMÁTICO' },
    ],
    featuresDetailed: [
      { check: true,  title: '30 días de operación',         desc: 'Bot 24/7 sin interrupciones, sin contratos.' },
      { check: true,  title: '3 sesiones abiertas',          desc: 'Hasta 3 dispositivos pueden abrir el panel a la vez.' },
      { check: true,  title: 'Agente IA completo',           desc: 'Todas las funciones del asistente inteligente.' },
      { check: true,  title: 'WhatsApp por QR · gratis',     desc: 'Vinculá tu WhatsApp escaneando un QR. Sin trámites con Meta.' },
      { check: true,  title: 'Créditos no vencen',           desc: 'Vos elegís cuándo y cuántos días activar. Al activar se consumen.' },
      { check: false, title: 'Línea WhatsApp API oficial',   desc: 'Disponible como add-on aparte o incluida en Gold.' },
    ],
    color: C.brand,
    cta: 'Elegir Pro',
  },
  plan_gold_30d: {
    order: 3,
    tier: 'gold',
    icon: '👑',
    eyebrow: 'PLAN GOLD',
    name: 'Gold',
    tagline: 'Operación + WhatsApp oficial + dev dedicado para tu proyecto.',
    badge: 'MÁS ELEGIDO',
    stats: [
      { value: '30',  label: 'DÍAS DE OPERACIÓN' },
      { value: '10',  label: 'SESIONES ABIERTAS' },
      { value: '30d', label: 'GARANTÍA WA' },
    ],
    featuresDetailed: [
      { check: true, title: '10 sesiones abiertas',           desc: 'Hasta 10 dispositivos pueden abrir el panel a la vez.' },
      { check: true, title: 'Desarrollador web dedicado',     desc: 'Un dev asignado a tu cuenta durante todo el mes.' },
      { check: true, title: 'Proyecto personalizado',         desc: 'Adaptamos el bot y los flujos a tu negocio.' },
      { check: true, title: 'Línea WhatsApp API',             desc: 'Activación oficial Meta incluida en el plan.' },
      { check: true, title: 'Garantía 30 días corridos',      desc: 'Cambio inmediato de número si Meta bloquea, durante 30 días desde la compra.' },
      { check: true, title: 'Créditos no vencen',             desc: 'Vos elegís cuándo y cuántos días activar. Al activar se consumen.' },
      { check: true, title: 'Soporte prioritario',            desc: 'Atención dedicada sin colas, 09h a 00h.' },
    ],
    color: LEGACY.gold,
    cta: 'Elegir Gold',
  },
  // ─── WA — NO es un plan ───────────────────────────────────────
  // Se renderiza en sección aparte, no en el grid de planes.
  // Su `order` no se usa para grid, pero lo dejamos por si el día
  // de mañana hay más add-ons y se necesita un orden interno.
  wa_line_only: {
    order: 99,
    tier: 'wa',
    isAddon: true,
    icon: '📱',
    eyebrow: 'ACTIVACIÓN ADICIONAL',
    name: 'Línea de WhatsApp API',
    tagline: 'Solo la activación del número oficial. No es un plan — no incluye créditos ni operación.',
    features: [
      'Número en WhatsApp API · activación oficial Meta',
      'Pago único, sin renovación automática',
      'Sin sesiones abiertas ni créditos incluidos',
      'Sin garantía de cambio (si Meta bloquea hay que pagar de nuevo)',
    ],
    color: LEGACY.wa,
    cta: 'Activar línea',
  },
}

// ─────────────────────────────────────────────────────────────
function GlowDot({ color }) {
  return <span style={{
    width: 6, height: 6, borderRadius: '50%',
    background: color, boxShadow: `0 0 8px ${color}`,
    flexShrink: 0, display: 'inline-block',
  }}/>
}

// ─────────────────────────────────────────────────────────────
// PLAN CARD — solo para los 3 planes operativos (Base/Pro/Gold).
// WA usa <WaAddonCard> aparte, más abajo.
// ─────────────────────────────────────────────────────────────
function PlanCard({ addon, display, onSelect, onCrypto }) {
  const isPopular  = !!display.badge
  const isGold     = display.tier === 'gold'
  const isFeatured = isGold
  const color      = display.color

  const priceUnit = addon.days_corridos > 0
    ? `por ${addon.days_corridos} días`
    : 'pago único'

  return (
    <div
      className={`plan-card ${isGold ? 'plan-card-gold' : ''}`}
      style={{
        display: 'flex', flexDirection: 'column',
        background: isFeatured
          ? `linear-gradient(180deg, ${color}12 0%, ${C.card} 50%)`
          : C.card,
        border: `${isFeatured ? 2 : 1}px solid ${isFeatured ? color : C.border}`,
        borderRadius: 20,
        padding: '28px 24px 24px',
        position: 'relative',
        overflow: 'visible',
        minHeight: 580,
        boxShadow: isFeatured
          ? `0 16px 48px ${color}28, 0 0 0 1px ${color}33`
          : '0 4px 18px rgba(0,0,0,.18)',
        transition: `transform ${TRANSITION.base}, box-shadow ${TRANSITION.base}`,
      }}
    >
      {isPopular && (
        <div style={{
          position: 'absolute', top: -14, left: '50%',
          transform: 'translateX(-50%)',
          padding: '6px 16px', borderRadius: 99,
          background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
          color: '#0a0d18', fontSize: 10,
          fontFamily: FONT.mono, fontWeight: 800,
          letterSpacing: '.12em',
          boxShadow: `0 6px 20px ${color}66`,
          border: `1px solid ${color}`,
          whiteSpace: 'nowrap',
          zIndex: 2,
        }}>★ {display.badge}</div>
      )}

      {isFeatured && (
        <div aria-hidden style={{
          position: 'absolute', top: -60, right: -60,
          width: 200, height: 200,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${color}26 0%, transparent 65%)`,
          filter: 'blur(24px)',
          pointerEvents: 'none',
          animation: isGold ? 'goldPulse 3s ease-in-out infinite' : 'none',
        }}/>
      )}

      <div style={{ position: 'relative', zIndex: 1, marginBottom: 20 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: isFeatured
            ? `linear-gradient(135deg, ${color}40, ${color}15)`
            : `${color}18`,
          border: `1px solid ${color}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26, marginBottom: 16,
          boxShadow: isFeatured ? `0 6px 16px ${color}33` : 'none',
        }}>
          {display.icon}
        </div>
        <div style={{
          fontSize: 10, fontFamily: FONT.mono, color,
          textTransform: 'uppercase', letterSpacing: '.16em',
          fontWeight: FONT_WEIGHT.bold,
          marginBottom: 6,
        }}>{display.eyebrow}</div>
        <h3 style={{
          fontSize: 28, fontWeight: 800, color: C.text,
          margin: '0 0 8px', letterSpacing: '-.025em',
          lineHeight: 1.05,
        }}>{display.name}</h3>
        <p style={{
          fontSize: FONT_SIZE.sm, color: C.muted,
          margin: 0, lineHeight: 1.5,
          minHeight: 42,
        }}>{display.tagline}</p>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 4, marginBottom: 18,
        padding: '14px 0',
        borderTop: `1px solid ${C.border}`,
        borderBottom: `1px solid ${C.border}`,
        position: 'relative', zIndex: 1,
      }}>
        {display.stats.map((s, i) => (
          <div key={i} style={{
            textAlign: 'center',
            borderLeft: i > 0 ? `1px solid ${C.border}` : 'none',
            padding: '0 4px',
          }}>
            <div style={{
              fontSize: 18, fontWeight: 800,
              color: isFeatured ? color : C.text,
              fontFamily: FONT.mono, lineHeight: 1.1,
              letterSpacing: '-.01em',
              marginBottom: 4,
            }}>{s.value}</div>
            <div style={{
              fontSize: 8, color: C.muted,
              fontFamily: FONT.mono, letterSpacing: '.06em',
              textTransform: 'uppercase',
              lineHeight: 1.2,
            }}>{s.label}</div>
          </div>
        ))}
      </div>

      <ul style={{
        listStyle: 'none', padding: 0, margin: '0 0 22px',
        display: 'flex', flexDirection: 'column', gap: 14,
        position: 'relative', zIndex: 1,
        flex: 1,
      }}>
        {display.featuresDetailed.map((f, i) => (
          <li key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: 11,
          }}>
            <span style={{
              flexShrink: 0,
              width: 18, height: 18, borderRadius: '50%',
              background: f.check ? `${C.success}22` : `${C.muted}18`,
              color: f.check ? C.success : C.muted,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 800,
              marginTop: 1,
            }}>
              {f.check ? '✓' : '×'}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: FONT_SIZE.sm,
                fontWeight: FONT_WEIGHT.semibold,
                color: f.check ? C.text : C.muted,
                marginBottom: 2,
                lineHeight: 1.3,
              }}>{f.title}</div>
              <div style={{
                fontSize: 11.5,
                color: C.muted,
                lineHeight: 1.45,
              }}>{f.desc}</div>
            </div>
          </li>
        ))}
      </ul>

      <div style={{
        padding: '16px 0 18px',
        borderTop: `1px solid ${C.border}`,
        position: 'relative', zIndex: 1,
      }}>
        <div style={{
          display: 'flex', alignItems: 'baseline', gap: 8,
          marginBottom: 4,
        }}>
          <span style={{
            fontSize: 14, color: C.muted,
            fontFamily: FONT.mono, fontWeight: FONT_WEIGHT.bold,
          }}>USD</span>
          <span style={{
            fontSize: 48, fontWeight: 800,
            color: isFeatured ? color : C.text,
            fontFamily: FONT.mono, lineHeight: 1,
            letterSpacing: '-.025em',
          }}>${addon.price_usd}</span>
        </div>
        <div style={{
          fontSize: 11, fontFamily: FONT.mono, color: C.muted,
          letterSpacing: '.04em', textTransform: 'lowercase',
        }}>{priceUnit}</div>
      </div>

      <div style={{
        display: 'flex', flexDirection: 'column', gap: 8,
        position: 'relative', zIndex: 1,
      }}>
        <button
          onClick={onSelect}
          style={{
            width: '100%',
            padding: '13px 18px', borderRadius: 10,
            fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold,
            border: 'none',
            cursor: 'pointer', transition: `all ${TRANSITION.fast}`,
            fontFamily: 'inherit',
            background: isFeatured
              ? `linear-gradient(135deg, ${color}, ${color}dd)`
              : C.brand,
            color: '#0a0d18',
            boxShadow: isFeatured ? `0 8px 22px ${color}55` : `0 4px 12px ${C.brand}33`,
            letterSpacing: '.01em',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = isFeatured
              ? `0 12px 28px ${color}77`
              : `0 8px 20px ${C.brand}55`
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'none'
            e.currentTarget.style.boxShadow = isFeatured
              ? `0 8px 22px ${color}55`
              : `0 4px 12px ${C.brand}33`
          }}
        >
          {display.cta} · Pagar ARS
        </button>
        <button
          onClick={onCrypto}
          style={{
            width: '100%',
            padding: '10px 14px', borderRadius: 8,
            fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.bold,
            border: `1px solid ${LEGACY.btc}40`,
            background: 'transparent', color: LEGACY.btc,
            cursor: 'pointer', transition: `all ${TRANSITION.fast}`,
            fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = `${LEGACY.btc}12`
            e.currentTarget.style.borderColor = `${LEGACY.btc}80`
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.borderColor = `${LEGACY.btc}40`
          }}
        >
          <span style={{ fontSize: 14 }}>₿</span>
          <span>Pagar con cripto</span>
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// WA ADDON CARD — 13/05/2026
//
// Render aparte del grid de planes para dejar claro que es un
// add-on, NO un plan. Layout horizontal con badge "Add-on" visible
// y separación visual marcada (background distinto + label arriba).
// ─────────────────────────────────────────────────────────────
function WaAddonCard({ addon, display, onSelect, onCrypto }) {
  const color = display.color

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: `linear-gradient(180deg, ${color}08 0%, ${C.card} 60%)`,
        border: `1px dashed ${color}55`,
        borderRadius: 16,
        padding: '24px 26px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: `0 4px 18px ${color}10`,
      }}
    >
      {/* Badge "ADD-ON" eliminado 13/05/2026: colisionaba con la columna
          del precio en anchos típicos. El eyebrow "ACTIVACIÓN ADICIONAL"
          + el header de sección ("¿Necesitás solo el número?") + el
          dashed border ya comunican con claridad que esto NO es un plan. */}

      {/* Decorative blob */}
      <div aria-hidden style={{
        position: 'absolute', bottom: -40, left: -40,
        width: 180, height: 180,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${color}14 0%, transparent 65%)`,
        filter: 'blur(20px)',
        pointerEvents: 'none',
      }}/>

      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 18,
        flexWrap: 'wrap',
        position: 'relative', zIndex: 1,
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 14,
          background: `${color}1a`,
          border: `1px solid ${color}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, flexShrink: 0,
        }}>
          {display.icon}
        </div>

        <div style={{ flex: '1 1 280px', minWidth: 0 }}>
          <div style={{
            fontSize: 10, fontFamily: FONT.mono, color,
            textTransform: 'uppercase', letterSpacing: '.16em',
            fontWeight: FONT_WEIGHT.bold,
            marginBottom: 4,
          }}>{display.eyebrow}</div>
          <h3 style={{
            fontSize: 22, fontWeight: 800, color: C.text,
            margin: '0 0 6px', letterSpacing: '-.015em',
            lineHeight: 1.15,
          }}>{display.name}</h3>
          <p style={{
            fontSize: FONT_SIZE.sm, color: C.muted,
            margin: 0, lineHeight: 1.5,
          }}>{display.tagline}</p>

          {/* Features compactos, formato lista inline */}
          <ul style={{
            listStyle: 'none', padding: 0, margin: '14px 0 0',
            display: 'flex', flexDirection: 'column', gap: 6,
          }}>
            {display.features.map((f, i) => (
              <li key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 8,
                fontSize: 12.5, color: C.muted, lineHeight: 1.45,
              }}>
                <span style={{
                  color, fontSize: 13, lineHeight: 1.2,
                  flexShrink: 0, fontWeight: 800,
                }}>·</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Precio + CTAs columna derecha */}
        <div style={{
          flex: '0 0 200px',
          display: 'flex', flexDirection: 'column', gap: 10,
          alignItems: 'stretch',
        }}>
          <div style={{
            padding: '10px 14px',
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            textAlign: 'center',
          }}>
            <div style={{
              display: 'flex', alignItems: 'baseline', gap: 6,
              justifyContent: 'center',
            }}>
              <span style={{
                fontSize: 12, color: C.muted,
                fontFamily: FONT.mono, fontWeight: FONT_WEIGHT.bold,
              }}>USD</span>
              <span style={{
                fontSize: 32, fontWeight: 800,
                color,
                fontFamily: FONT.mono, lineHeight: 1,
                letterSpacing: '-.02em',
              }}>${addon.price_usd}</span>
            </div>
            <div style={{
              fontSize: 10, fontFamily: FONT.mono, color: C.muted,
              letterSpacing: '.04em', marginTop: 4,
            }}>pago único</div>
          </div>

          <button
            onClick={onSelect}
            style={{
              width: '100%',
              padding: '11px 14px', borderRadius: 10,
              fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold,
              border: 'none',
              cursor: 'pointer', transition: `all ${TRANSITION.fast}`,
              fontFamily: 'inherit',
              background: `linear-gradient(135deg, ${color}, ${color}dd)`,
              color: '#0a0d18',
              boxShadow: `0 4px 14px ${color}45`,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = `0 8px 22px ${color}66`
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'none'
              e.currentTarget.style.boxShadow = `0 4px 14px ${color}45`
            }}
          >
            {display.cta} · ARS
          </button>
          <button
            onClick={onCrypto}
            style={{
              width: '100%',
              padding: '8px 12px', borderRadius: 8,
              fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.bold,
              border: `1px solid ${LEGACY.btc}40`,
              background: 'transparent', color: LEGACY.btc,
              cursor: 'pointer', transition: `all ${TRANSITION.fast}`,
              fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = `${LEGACY.btc}12`
              e.currentTarget.style.borderColor = `${LEGACY.btc}80`
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.borderColor = `${LEGACY.btc}40`
            }}
          >
            <span style={{ fontSize: 13 }}>₿</span>
            <span>Cripto</span>
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// WALLET HERO — 14/05/2026: export named para reuso en RetailHome.
// Antes era local a RetailBilling. La tarjeta de billetera ahora se
// renderiza en /mi-cuenta (Inicio); /mi-cuenta/billing (Saldo) muestra
// en su lugar <RetailActivationWidget /> (la acción operativa principal).
// ─────────────────────────────────────────────────────────────
export function WalletHero({ retail }) {
  if (!retail) return null

  const hasPhoneId         = !!(retail.wa_phone_id && String(retail.wa_phone_id).length > 0)
  const hasFirstInbound    = !!retail.wa_phone_first_inbound_at
  // 22/05/2026 — wasender cuenta como linea conectada (no usa wa_phone_id de Meta).
  const hasWasenderLine    = retail.wa_provider === 'wasender' && !!retail.wasender_session_id
  const lineState          = hasWasenderLine
    ? 'ok'
    : !hasPhoneId
      ? 'none'
      : hasFirstInbound
        ? 'ok'
        : 'pending'

  const balance   = retail.balance ?? 0
  const isActive  = retail.status === 'active'
  const isPending = retail.status === 'pending'
  const isTrial   = retail.status === 'trial'

  const balanceColor = balance === 0
    ? C.danger
    : balance < 7
      ? LEGACY.orange
      : C.brand

  const operativeText = balance === 0
    ? 'Sin créditos · operación pausada'
    : balance === 1
      ? '1 día de operación restante'
      : balance < 7
        ? `${balance} días de operación restantes`
        : `${balance} días de operación`

  let venciValue, venciColor
  if (!retail.activated_until) {
    venciValue = 'No activada'
    venciColor = C.muted
  } else {
    const ms = new Date(retail.activated_until).getTime() - Date.now()
    if (ms <= 0) {
      venciValue = 'Vencido'
      venciColor = C.danger
    } else {
      venciValue = balance > 0 ? `en ${balance}d` : 'Vence hoy'
      venciColor = balanceColor
    }
  }

  const pulse = balance === 0 || (isActive && lineState !== 'ok')

  const lineBadge = lineState === 'ok'
    ? { bg: `${C.success}15`, border: `${C.success}40`, color: C.success, label: 'LÍNEA OK' }
    : lineState === 'pending'
      ? { bg: `${LEGACY.amber}15`, border: `${LEGACY.amber}40`, color: LEGACY.amber, label: 'LÍNEA PENDIENTE' }
      : { bg: `${C.muted}15`, border: C.border, color: C.muted, label: 'SIN LÍNEA' }

  return (
    <div style={{
      background: `radial-gradient(circle at 0% 0%, ${C.brand}18 0%, transparent 40%), radial-gradient(circle at 100% 100%, ${C.brand}10 0%, transparent 50%), linear-gradient(135deg, #0a0d18 0%, ${C.card} 100%)`,
      border: `1px solid ${C.border}`,
      borderRadius: 18,
      padding: 0,
      marginBottom: 20,
      position: 'relative',
      overflow: 'hidden',
      animation: 'bilFadeUp .4s ease both',
      boxShadow: '0 12px 40px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.04)',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 1,
        background: `linear-gradient(90deg, transparent, ${C.brand}aa 30%, ${C.brand}aa 70%, transparent)`,
      }}/>
      <div aria-hidden style={{
        position: 'absolute', top: -80, right: -80, width: 280, height: 280,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${C.brand}14 0%, transparent 65%)`,
        filter: 'blur(20px)', pointerEvents: 'none',
      }}/>

      <div style={{ position: 'relative', padding: '24px 28px' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 16, flexWrap: 'wrap', gap: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: `linear-gradient(135deg, ${C.brand} 0%, ${C.brand}88 100%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, boxShadow: `0 4px 12px ${C.brand}40`,
            }}>💎</div>
            <div>
              <div style={{
                fontSize: 9, color: C.muted, fontFamily: FONT.mono,
                textTransform: 'uppercase', letterSpacing: '.14em', lineHeight: 1,
              }}>Tu billetera</div>
              <div style={{
                fontSize: 12, color: C.text, marginTop: 3, fontWeight: FONT_WEIGHT.semibold,
              }}>Saldo operativo</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {isActive && (
              <div style={{
                padding: '4px 10px', borderRadius: 99,
                background: `${C.success}15`, border: `1px solid ${C.success}40`,
                fontSize: 10, fontFamily: FONT.mono, color: C.success,
                fontWeight: FONT_WEIGHT.bold, letterSpacing: '.04em',
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
                <GlowDot color={C.success}/>ACTIVO
              </div>
            )}
            {isPending && (
              <div style={{
                padding: '4px 10px', borderRadius: 99,
                background: `${LEGACY.amber}15`, border: `1px solid ${LEGACY.amber}40`,
                fontSize: 10, fontFamily: FONT.mono, color: LEGACY.amber,
                fontWeight: FONT_WEIGHT.bold, letterSpacing: '.04em',
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
                <GlowDot color={LEGACY.amber}/>PENDIENTE
              </div>
            )}
            {isTrial && (
              <div style={{
                padding: '4px 10px', borderRadius: 99,
                background: `${LEGACY.orange}15`, border: `1px solid ${LEGACY.orange}40`,
                fontSize: 10, fontFamily: FONT.mono, color: LEGACY.orange,
                fontWeight: FONT_WEIGHT.bold, letterSpacing: '.04em',
              }}>◐ TRIAL</div>
            )}
            <div style={{
              padding: '4px 10px', borderRadius: 99,
              background: lineBadge.bg, border: `1px solid ${lineBadge.border}`,
              fontSize: 10, fontFamily: FONT.mono,
              color: lineBadge.color,
              fontWeight: FONT_WEIGHT.bold, letterSpacing: '.04em',
              display: 'flex', alignItems: 'center', gap: 5,
            }}><Icon e="📱"/> {lineBadge.label}</div>
          </div>
        </div>

        <div style={{
          display: 'flex', alignItems: 'baseline', gap: 12,
          marginBottom: 8, flexWrap: 'wrap',
        }}>
          <div style={{
            fontSize: 'clamp(40px, 8vw, 56px)',
            fontWeight: 800, color: balanceColor,
            fontFamily: FONT.mono, lineHeight: 1,
            letterSpacing: '-.02em',
            textShadow: balance > 0 ? `0 4px 24px ${balanceColor}30` : 'none',
            transition: `color ${TRANSITION.base}`,
          }}>{balance.toLocaleString('es-AR')}</div>
          <div style={{
            fontSize: FONT_SIZE.sm, color: C.muted,
            fontFamily: FONT.mono, fontWeight: FONT_WEIGHT.bold,
            letterSpacing: '.08em', textTransform: 'uppercase',
          }}>créditos</div>
          {pulse && (
            <span style={{
              marginLeft: 'auto', fontSize: 10, color: C.danger,
              fontFamily: FONT.mono, fontWeight: FONT_WEIGHT.bold,
              letterSpacing: '.06em', padding: '4px 9px', borderRadius: 99,
              background: `${C.danger}15`, border: `1px solid ${C.danger}50`,
              animation: 'bilPulse 1.6s ease-in-out infinite',
            }}>● ACCIÓN REQUERIDA</span>
          )}
        </div>

        <div style={{
          fontSize: FONT_SIZE.xs, color: C.muted,
          fontFamily: FONT.mono, marginBottom: 18,
        }}>{operativeText} · 1 crédito = 1 día de línea WhatsApp activa</div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 0, paddingTop: 16,
          borderTop: `1px solid ${C.border}`,
        }}>
          <MiniStat label="Cuenta" value={retail.name || 'Retail'} color={C.text}/>
          <MiniStat
            label="WhatsApp"
            value={lineState === 'ok' ? 'Conectado' : lineState === 'pending' ? 'Sin verificar' : 'No configurado'}
            color={lineState === 'ok' ? C.success : lineState === 'pending' ? LEGACY.amber : C.muted}
            divider
          />
          <MiniStat label="Vencimiento" value={venciValue} color={venciColor} divider/>
        </div>
      </div>
    </div>
  )
}

function MiniStat({ label, value, color, divider }) {
  return (
    <div style={{
      padding: '0 16px',
      borderLeft: divider ? `1px solid ${C.border}` : 'none',
    }}>
      <div style={{
        fontSize: 9, color: C.muted, fontFamily: FONT.mono,
        textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 4,
      }}>{label}</div>
      <div style={{
        fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold,
        color, fontFamily: FONT.mono,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>{value}</div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
function SectionTabs({ value, onChange, hasHistory }) {
  const tabs = [
    { id: 'operativo',  label: '💬 Operativo',  desc: 'Créditos para WhatsApp' },
  ]
  if (hasHistory) tabs.push({ id: 'historial', label: '📜 Historial', desc: 'Tus pagos' })

  if (tabs.length === 1) return null

  return (
    <div style={{
      display: 'inline-flex',
      padding: 4, borderRadius: 12,
      background: C.card,
      border: `1px solid ${C.border}`,
      marginBottom: 20,
      gap: 2,
      width: 'fit-content',
      maxWidth: '100%',
      overflowX: 'auto',
    }}>
      {tabs.map(t => {
        const active = value === t.id
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            style={{
              padding: '9px 16px',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              background: active ? `${C.brand}18` : 'transparent',
              color: active ? C.brand : C.muted,
              fontSize: FONT_SIZE.sm,
              fontWeight: active ? FONT_WEIGHT.bold : FONT_WEIGHT.semibold,
              fontFamily: 'inherit',
              transition: `all ${TRANSITION.fast}`,
              whiteSpace: 'nowrap',
              boxShadow: active ? `inset 0 0 0 1px ${C.brand}50` : 'none',
            }}
            onMouseEnter={e => { if (!active) e.currentTarget.style.color = C.text }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.color = C.muted }}
          >
            {t.label}
          </button>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
function PaymentHistory({ subs }) {
  const statusConfig = {
    pending:   { label: 'Pendiente',  color: LEGACY.orange, icon: '⏳', chip: 'warning' },
    active:    { label: 'Acreditado', color: C.success,     icon: '✅', chip: 'success' },
    past_due:  { label: 'Vencido',    color: C.danger,      icon: '⚠️', chip: 'danger' },
    cancelled: { label: 'Cancelado',  color: C.muted,       icon: '❌', chip: 'muted' },
  }

  return (
    <Card padding={0} style={{ overflow: 'hidden', marginBottom: 24 }}>
      <div style={{
        padding: '13px 20px',
        borderBottom: `1px solid ${C.border}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{
          fontSize: FONT_SIZE.sm,
          fontWeight: FONT_WEIGHT.bold,
          color: C.text,
        }}>Historial de pagos</span>
        <span style={{
          fontSize: FONT_SIZE.xs,
          color: C.muted,
          fontFamily: FONT.mono,
        }}>{subs.length} registros</span>
      </div>
      {subs.map((sub, i) => {
        const st = statusConfig[sub.status] || { label: sub.status, color: C.muted, icon: '⏳', chip: 'muted' }
        return (
          <div
            key={sub.id}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '11px 20px',
              borderBottom: i < subs.length - 1 ? `1px solid ${C.border}` : 'none',
              transition: `background ${TRANSITION.fast}`,
            }}
            onMouseEnter={e => e.currentTarget.style.background = C.surface}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{
              width: 30, height: 30, borderRadius: RADIUS.sm,
              background: `${st.color}15`,
              border: `1px solid ${st.color}28`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, flexShrink: 0,
            }}>{st.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: FONT_SIZE.sm,
                fontWeight: FONT_WEIGHT.semibold,
                color: C.text,
                textTransform: 'capitalize',
              }}>{sub.plan_id}</div>
              <div style={{
                fontSize: 10, color: C.muted,
                fontFamily: FONT.mono, marginTop: 1,
              }}>
                {new Date(sub.created_at).toLocaleDateString('es-AR', {
                  day: '2-digit', month: 'short', year: 'numeric',
                })}
                {sub.mp_payment_id && ` · #${sub.mp_payment_id}`}
              </div>
            </div>
            <Chip variant="status" color={st.chip} size="sm">{st.label}</Chip>
          </div>
        )
      })}
    </Card>
  )
}

// ─────────────────────────────────────────────────────────────
// CRYPTO MODAL — 11/05/2026 integrado con NOWPayments
// ─────────────────────────────────────────────────────────────
function CryptoModal({ plan, onClose, onConfirm, loading }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,.82)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 20,
      }}
      onClick={loading ? undefined : onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: RADIUS.lg,
          padding: 28,
          maxWidth: 420, width: '100%',
          boxShadow: '0 24px 80px rgba(0,0,0,.6)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 22 }}>₿</span>
          <h3 style={{
            fontSize: FONT_SIZE.lg,
            fontWeight: FONT_WEIGHT.bold,
            color: C.text,
            margin: 0,
          }}>Pagar con cripto</h3>
        </div>
        <p style={{
          fontSize: FONT_SIZE.sm,
          color: C.muted,
          marginBottom: 20,
          lineHeight: 1.6,
        }}>
          Plan <strong style={{ color: C.brand }}>{plan.name}</strong> — USD ${plan.price}
        </p>

        {/* Opción USDT TRC20 (única activa por ahora) */}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '14px 16px',
            borderRadius: RADIUS.md,
            border: `1px solid ${LEGACY.usdt}50`,
            background: `${LEGACY.usdt}10`,
            marginBottom: 14,
          }}
        >
          <span style={{ fontSize: 26 }}>💵</span>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: FONT_SIZE.md,
              fontWeight: FONT_WEIGHT.bold,
              color: C.text,
            }}>USDT</div>
            <div style={{ fontSize: FONT_SIZE.xs, color: C.muted }}>
              Red TRC20 (Tron) · acreditación ~30 seg
            </div>
          </div>
          <span style={{
            fontSize: FONT_SIZE.xs,
            fontFamily: FONT.mono,
            color: LEGACY.usdt,
            background: `${LEGACY.usdt}20`,
            padding: '3px 8px',
            borderRadius: 999,
            fontWeight: FONT_WEIGHT.bold,
            letterSpacing: '.05em',
            textTransform: 'uppercase',
          }}>ACTIVO</span>
        </div>

        <div style={{
          padding: '12px 14px',
          background: `${C.brand}08`,
          border: `1px solid ${C.brand}26`,
          borderRadius: 8,
          marginBottom: 18,
        }}>
          <p style={{
            margin: 0,
            fontSize: FONT_SIZE.xs,
            color: C.muted,
            lineHeight: 1.55,
          }}>
            <strong style={{ color: C.brand }}>Cómo funciona:</strong> te vamos a
            redirigir a una página segura donde vas a ver la wallet exacta para
            depositar tus USDT. Apenas se confirme el pago en la red,{' '}
            <strong>tu saldo se acredita automático</strong>. Mantenete en la página
            o volvé cuando quieras a <em>/mi-cuenta/billing</em>.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            variant="ghost"
            size="md"
            fullWidth
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="md"
            fullWidth
            onClick={() => onConfirm('usdttrc20')}
            disabled={loading}
            loading={loading}
            style={{
              background: `linear-gradient(135deg, ${LEGACY.usdt}, ${LEGACY.usdt}dd)`,
              border: 'none',
            }}
          >
            {loading ? 'Generando…' : 'Continuar al pago →'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════
// MAIN — RetailBilling
// ═════════════════════════════════════════════════════════════════
export default function RetailBilling() {
  const { retail } = useAuth()
  const { addons: ADDONS, loading: plansLoading } = usePlans()
  const [subs, setSubs] = useState([])
  const [loadingSub, setLoadingSub] = useState(false)
  const [error, setError] = useState(null)
  const [cryptoModal, setCryptoModal] = useState(null)
  const [cryptoLoading, setCryptoLoading] = useState(false)
  const [notice, setNotice] = useState(null)
  const [section, setSection] = useState('operativo')

  useEffect(() => {
    if (!retail?.id) return
    supabase.from('processed_payments').select('*')
      .eq('tenant_id', retail.id)
      .order('processed_at', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (!data) return
        const mapped = data.map(p => ({
          id: p.id,
          plan_id: p.metadata?.addon_id || (p.metadata?.type === 'wa_line_activation' ? 'Activación línea' : 'Pack créditos'),
          status: 'active',
          created_at: p.processed_at,
          mp_payment_id: p.payment_id,
          amount: p.amount,
          metadata: p.metadata,
        }))
        setSubs(mapped)
      })
  }, [retail?.id])

  async function handleCrypto(plan, pay_currency) {
    if (!retail?.id) return
    setCryptoLoading(true); setError(null); setNotice(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        setError('Sesión expirada. Recargá la página.')
        setCryptoLoading(false)
        return
      }

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-crypto-checkout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            addon_id: plan.id,
            pay_currency: pay_currency || 'usdttrc20',
          }),
        }
      )
      const data = await res.json()

      if (!res.ok || !data.invoice_url) {
        const detail = data?.detail
        const detailStr = typeof detail === 'string'
          ? detail
          : (detail?.message || JSON.stringify(detail || {}))
        setError(
          data?.error === 'unsupported_currency'
            ? 'Moneda no soportada todavía.'
            : data?.error === 'addon_not_found_or_inactive'
              ? 'El plan no está disponible.'
              : data?.error === 'tenant_inactive'
                ? 'Tu cuenta está suspendida o cancelada. Contactá soporte.'
                : `No se pudo generar el link cripto${detailStr ? ': ' + detailStr : '.'}`
        )
        setCryptoLoading(false)
        return
      }

      setCryptoModal(null)
      window.location.href = data.invoice_url
    } catch (e) {
      setError('Error de conexión: ' + e.message)
      setCryptoLoading(false)
    }
  }

  async function handleSelect(addon) {
    if (!retail?.id) return
    setLoadingSub(true); setError(null); setNotice(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        setError('Sesión expirada. Recargá la página.')
        setLoadingSub(false)
        return
      }
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-addon-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ addon_id: addon.id }),
      })
      const data = await res.json()
      if (data.init_point) window.location.href = data.init_point
      else setError(data.error || 'No se pudo generar el link de pago.')
    } catch (e) {
      setError('Error de conexión: ' + e.message)
    }
    setLoadingSub(false)
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const purchase = params.get('purchase')
    const source = params.get('source')

    if (purchase === 'success') {
      const isCrypto = source === 'crypto'
      setNotice({
        type: 'success',
        text: isCrypto
          ? '¡Pago cripto confirmado en blockchain! En unos segundos se acredita el saldo.'
          : '¡Pago confirmado! En unos segundos se acredita el saldo de tu plan.',
      })

      const addonId = params.get('addon')
      const addon = ADDONS.find(a => a.id === addonId)
      const eventId = addonId
        ? `purchase_${addonId}_${source || 'mp'}_${Date.now().toString(36)}`
        : `purchase_${Date.now()}`
      const purchaseParams = {
        currency: 'USD',
        content_type: 'product',
        content_ids: addonId ? [addonId] : undefined,
        content_name: addon?.name,
        payment_method: isCrypto ? 'crypto_usdt' : 'mp',
      }
      if (addon?.price_usd) {
        purchaseParams.value = Number(addon.price_usd)
      }
      try {
        metaPixel.init()
        metaPixel.track('Purchase', purchaseParams, eventId)
        sessionStorage.setItem('meta_last_purchase_event_id', eventId)
      } catch {}

      window.history.replaceState({}, '', '/mi-cuenta/billing')
    } else if (purchase === 'pending') {
      setNotice({ type: 'warning', text: 'Tu pago está pendiente de acreditación. Lo procesamos automáticamente en cuanto se confirme.' })
      window.history.replaceState({}, '', '/mi-cuenta/billing')
    } else if (purchase === 'failure') {
      setNotice({ type: 'danger', text: 'El pago no pudo completarse. Podés volver a intentarlo.' })
      window.history.replaceState({}, '', '/mi-cuenta/billing')
    }
  }, [ADDONS])

  if (plansLoading || !retail) {
    return (
      <div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 18,
          marginTop: 24,
        }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{
              height: 580,
              background: C.card,
              borderRadius: 20,
              opacity: .4,
            }}/>
          ))}
        </div>
      </div>
    )
  }

  // ─── Separar planes vs add-ons ─────────────────────────────
  // Los planes operativos van al grid principal. El add-on de
  // línea WA (wa_line_only) va en una sección aparte abajo.
  const orderedPlans = ADDONS
    .filter(a => PLAN_DISPLAY[a.id] && !PLAN_DISPLAY[a.id].isAddon)
    .map(a => ({ addon: a, display: PLAN_DISPLAY[a.id] }))
    .sort((a, b) => a.display.order - b.display.order)

  const waAddon = ADDONS
    .filter(a => PLAN_DISPLAY[a.id]?.isAddon)
    .map(a => ({ addon: a, display: PLAN_DISPLAY[a.id] }))[0] || null

  return (
    <>
      <div>
        <style>{`
          @keyframes bilFadeUp {
            from { opacity: 0; transform: translateY(8px) }
            to   { opacity: 1; transform: none }
          }
          @keyframes bilPulse {
            0%, 100% { opacity: 1; transform: scale(1) }
            50%      { opacity: .7; transform: scale(1.02) }
          }
          @keyframes goldPulse {
            0%, 100% { opacity: 1 }
            50%      { opacity: .55 }
          }

          .plans-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 20px;
            max-width: 1400px;
            margin: 0 auto;
            padding: 16px 0;
            align-items: stretch;
          }
          @media (min-width: 700px) {
            .plans-grid {
              grid-template-columns: repeat(2, 1fr);
              gap: 20px;
            }
          }
          @media (min-width: 1100px) {
            .plans-grid {
              grid-template-columns: repeat(3, 1fr);
              gap: 22px;
            }
          }

          .plan-card:hover {
            transform: translateY(-4px);
          }
          .plan-card-gold {
            transform: scale(1.02);
          }
          .plan-card-gold:hover {
            transform: scale(1.04) translateY(-4px) !important;
          }
        `}</style>

        <PageHeader
          eyebrow="Centro de saldo"
          title="Saldo"
          subtitle="Elegí tu plan, gestioná tu línea WhatsApp y pagá con ARS o cripto."
        />

        {/* 14/05/2026 — Acción operativa principal del centro de saldo:
            activar días (chips +1/+3/+7 + input + motivo). Antes vivía en
            /mi-cuenta (Inicio); se movió acá porque es lo que el user busca
            cuando entra a "Saldo". El header de billetera (WalletHero) pasó
            a Inicio. */}
        <RetailActivationWidget />

        {notice && (
          <div style={{ marginBottom: 20 }}>
            <Banner
              variant={notice.type}
              onClose={() => setNotice(null)}
              icon={
                notice.type === 'success' ? '✅'
                  : notice.type === 'warning' ? '⏳'
                  : '⚠️'
              }
            >
              {notice.text}
            </Banner>
          </div>
        )}

        {error && (
          <div style={{ marginBottom: 20 }}>
            <Banner variant="danger" icon="⚠️" onClose={() => setError(null)}>{error}</Banner>
          </div>
        )}

        <SectionTabs
          value={section}
          onChange={setSection}
          hasHistory={subs.length > 0}
        />

        {section === 'operativo' && orderedPlans.length > 0 && (
          <div style={{
            marginBottom: 32,
            animation: 'bilFadeUp .3s ease both',
          }}>
            <div style={{ marginBottom: 24, textAlign: 'center' }}>
              <h2 style={{
                fontSize: 'clamp(22px, 3vw, 28px)',
                fontWeight: 800,
                color: C.text,
                margin: '0 0 8px',
                letterSpacing: '-.02em',
              }}>Elegí tu plan</h2>
              <p style={{
                fontSize: FONT_SIZE.sm,
                color: C.muted,
                margin: 0,
                lineHeight: 1.5,
              }}>
                Sin contratos · Activá y pausá cuando quieras · Los créditos no vencen
              </p>
            </div>

            <div className="plans-grid">
              {orderedPlans.map(({ addon, display }) => (
                <PlanCard
                  key={addon.id}
                  addon={addon}
                  display={display}
                  onSelect={() => handleSelect({
                    id: addon.id, name: display.name, price: addon.price_usd,
                  })}
                  onCrypto={() => setCryptoModal({
                    plan: { id: addon.id, name: display.name, price: addon.price_usd },
                  })}
                />
              ))}
            </div>

            {orderedPlans.some(p => p.display.tier === 'gold') && (
              <div style={{
                marginTop: 28,
                padding: '16px 20px',
                background: `${C.success}08`,
                border: `1px solid ${C.success}26`,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 14,
                maxWidth: 1400,
                marginLeft: 'auto',
                marginRight: 'auto',
              }}>
                <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>🛡️</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: FONT_SIZE.sm,
                    fontWeight: FONT_WEIGHT.bold,
                    color: C.success,
                    marginBottom: 4,
                  }}>Garantía Gold</div>
                  <p style={{
                    margin: 0,
                    fontSize: FONT_SIZE.xs,
                    color: C.text,
                    lineHeight: 1.6,
                  }}>
                    <strong>Cambio automático</strong> de número si Meta bloquea
                    la línea, hay un error técnico o la WhatsApp API deja de funcionar.
                    Cubre <strong>30 días corridos desde la compra</strong>, hayas activado el plan o no
                    (durante horario de atención: 09 a 00hs).{' '}
                    <Link
                      to="/legal/garantia"
                      style={{ color: C.success, textDecoration: 'underline' }}
                    >Ver alcances →</Link>
                  </p>
                </div>
              </div>
            )}

            {/* ─── SECCIÓN APARTE: Add-on de línea WhatsApp ───
                Separación visual marcada respecto del grid de planes,
                con título propio y card distinta (dashed border + badge
                "ADD-ON" en la esquina) para que quede claro que NO es
                un plan más. */}
            {waAddon && (
              <div style={{
                marginTop: 48,
                maxWidth: 1400,
                marginLeft: 'auto',
                marginRight: 'auto',
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  marginBottom: 18, paddingBottom: 12,
                  borderBottom: `1px solid ${C.border}`,
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: `${LEGACY.wa}15`,
                    border: `1px solid ${LEGACY.wa}40`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, flexShrink: 0,
                  }}>🧩</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 10, fontFamily: FONT.mono,
                      color: C.muted,
                      textTransform: 'uppercase', letterSpacing: '.14em',
                      fontWeight: FONT_WEIGHT.bold,
                      marginBottom: 2,
                    }}>Activación adicional</div>
                    <h3 style={{
                      fontSize: FONT_SIZE.md,
                      fontWeight: FONT_WEIGHT.bold,
                      color: C.text,
                      margin: 0,
                      letterSpacing: '-.01em',
                    }}>¿Necesitás solo el número de WhatsApp?</h3>
                  </div>
                </div>
                <p style={{
                  fontSize: FONT_SIZE.xs,
                  color: C.muted,
                  margin: '0 0 14px',
                  lineHeight: 1.55,
                }}>
                  Comprá solo la activación de la línea, sin créditos ni plan operativo.
                  Útil si ya operás el bot por otro lado y solo necesitás el número oficial.
                </p>

                <WaAddonCard
                  addon={waAddon.addon}
                  display={waAddon.display}
                  onSelect={() => handleSelect({
                    id: waAddon.addon.id, name: waAddon.display.name, price: waAddon.addon.price_usd,
                  })}
                  onCrypto={() => setCryptoModal({
                    plan: { id: waAddon.addon.id, name: waAddon.display.name, price: waAddon.addon.price_usd },
                  })}
                />

                <div style={{ marginTop: 12 }}>
                  <Banner variant="warning" icon="⚠️">
                    La activación de línea WhatsApp requiere una SIM sin cuenta de WhatsApp personal activa.
                  </Banner>
                </div>
              </div>
            )}
          </div>
        )}

        {section === 'historial' && subs.length > 0 && (
          <div style={{ animation: 'bilFadeUp .3s ease both' }}>
            <PaymentHistory subs={subs}/>
          </div>
        )}
      </div>

      {cryptoModal && (
        <CryptoModal
          plan={cryptoModal.plan}
          loading={cryptoLoading}
          onClose={() => setCryptoModal(null)}
          onConfirm={pay_currency => handleCrypto(cryptoModal.plan, pay_currency)}
        />
      )}
    </>
  )
}
