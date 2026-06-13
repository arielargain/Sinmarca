// ═════════════════════════════════════════════════════════════════
// RetailActivationWidget.jsx — 14/05/2026
// ─────────────────────────────────────────────────────────────────
// Widget self-service para que el RETAIL active 1-7 días consumiendo
// créditos del propio balance.
//
// 17/05 — a11y: agregados aria-label a los inputs sin <label> visible
// (selector de días y campo de motivo). Lighthouse marcaba
// "Form elements do not have associated labels".
//
// 14/05 — REWORK visual: ahora replica EXACTAMENTE el ActivationWidget
// del partner (src/pages/Dashboard.jsx) para mantener consistencia
// visual entre paneles. Solo cambian:
//   - Carga de balance: tabla credits directa (retail no la trae en AuthContext)
//   - RPC: retail_activate_self (no tenant_activate_entity)
//   - Link a /mi-cuenta/billing en lugar de /billing
//
// Modos retenidos para back-compat:
//   - "compact"/"full"  → mismo render unificado (el del partner)
//   - "overlay"         → mismo render + border/shadow elevado (para DaysLockedOverlay)
//
// Después de cada activación llama refreshRetail() para que las
// páginas con condición daysLeft <= 0 se re-rendericen sin overlay.
// ═════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react'
import { Link as NavLink } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import {
  Card, Button,
  COLORS as C, RADIUS, FONT_SIZE, FONT_WEIGHT, FONT,
} from './ui'
import Icon from './Icon'

export default function RetailActivationWidget({ mode = 'full' }) {
  const { retail, refreshRetail } = useAuth()
  const [days, setDays] = useState(1)
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [balance, setBalance] = useState(null)
  const [unlimited, setUnlimited] = useState(false)
  const [creditsLoaded, setCreditsLoaded] = useState(false)

  // Cargar balance directo de credits (retail no lo trae en AuthContext)
  useEffect(() => {
    let alive = true
    ;(async () => {
      const { data: cred, error } = await supabase
        .from('credits')
        .select('balance, unlimited')
        .maybeSingle()
      if (!alive) return
      if (!error && cred) {
        setBalance(cred.balance ?? 0)
        setUnlimited(cred.unlimited === true)
      } else {
        setBalance(0)
      }
      setCreditsLoaded(true)
    })()
    return () => { alive = false }
  }, [retail?.activated_until])

  if (!retail) return null

  const until = retail.activated_until ? new Date(retail.activated_until) : null
  const now = new Date()
  const ms = until ? until.getTime() - now.getTime() : 0
  const daysLeft = until ? Math.ceil(ms / 86400000) : 0
  const isActive = until && ms > 0
  const isExpired = until && ms <= 0

  const isUnlimited = unlimited === true
  const isLoadingBal = !creditsLoaded
  const bal = isUnlimited ? Infinity : (balance ?? 0)

  // ─ Badge config (idéntico al partner) ──────────────────
  let badgeBg, badgeColor, badgeIcon, badgeText
  if (isUnlimited) {
    badgeBg = 'rgba(52, 211, 153, 0.12)'
    badgeColor = '#34d399'
    badgeIcon = '∞'
    badgeText = 'Plan sin vencimiento'
  } else if (isActive) {
    badgeBg = 'rgba(52, 211, 153, 0.12)'
    badgeColor = '#34d399'
    badgeIcon = '🟢'
    badgeText = `Activo — ${daysLeft} día${daysLeft === 1 ? '' : 's'} restante${daysLeft === 1 ? '' : 's'}`
  } else if (isExpired) {
    const daysAgo = Math.ceil(-ms / 86400000)
    badgeBg = 'rgba(248, 113, 113, 0.12)'
    badgeColor = '#f87171'
    badgeIcon = '🔴'
    badgeText = `Expirado hace ${daysAgo} día${daysAgo === 1 ? '' : 's'}`
  } else {
    badgeBg = 'rgba(251, 191, 36, 0.12)'
    badgeColor = '#fbbf24'
    badgeIcon = '⚪'
    badgeText = 'Sin activar'
  }

  // ─ Activate handler ─────────────────────────────────
  const activate = async (n) => {
    const nn = Number(n)
    if (!Number.isFinite(nn) || nn < 1 || nn > 7) { setMsg('Elegí entre 1 y 7 días'); return }
    if (isLoadingBal) { setMsg('Cargando saldo, esperá un instante…'); return }
    if (!isUnlimited && bal < nn) { setMsg(`Faltan créditos (tenés ${bal}, necesitás ${nn})`); return }
    setSaving(true); setMsg('')
    const { data, error } = await supabase.rpc('retail_activate_self', {
      p_days: nn,
      p_reason: reason?.trim() || null,
    })
    if (error) { setMsg(`Error: ${error.message}`); setSaving(false); return }
    const newBal = data?.balance_after
    if (typeof newBal === 'number') {
      setBalance(newBal)
    }
    await refreshRetail?.()
    setMsg(`Activado +${nn} día${nn === 1 ? '' : 's'} ✓`)
    setDays(1); setReason('')
    setSaving(false)
    setTimeout(() => setMsg(''), 4000)
  }

  // ─ Estilo de Card según mode ─────────────────────────
  // overlay: card con border dorado + shadow elevado (DaysLockedOverlay)
  // full/compact: Card estándar (mismo render que el partner)
  const isOverlay = mode === 'overlay'

  // ── Early-return: sin créditos → CTA "Ver planes" ─────
  // (idéntico al partner pero con link a /mi-cuenta/billing)
  if (!isLoadingBal && !isUnlimited && bal === 0) {
    return (
      <Card padding={20} style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
          <div style={{
            width: 44, height: 44, borderRadius: 999,
            background: 'rgba(212,168,67,0.12)', border: '1px solid rgba(212,168,67,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, flexShrink: 0
          }}>
            <Icon e="💳"/>
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <p style={{ fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: C.text, margin: 0 }}>
              Activá tu cuenta comprando tu primer plan
            </p>
            <p style={{ fontSize: FONT_SIZE.sm, color: C.muted, margin: '6px 0 0', lineHeight: 1.5 }}>
              Tu cuenta está creada y configurada. Para empezar a operar, comprá un pack de
              créditos operativos. <strong style={{ color: C.text }}>1 crédito = 1 día de operación.</strong>
            </p>
            <p style={{ fontSize: FONT_SIZE.sm, color: C.muted, margin: '6px 0 14px', lineHeight: 1.5 }}>
              Una vez confirmado el pago vas a poder activar el bot desde acá.
            </p>
            <NavLink to="/mi-cuenta/billing" style={{ textDecoration: 'none' }}>
              <Button variant="primary" size="md">
                Ver planes →
              </Button>
            </NavLink>
          </div>
        </div>
      </Card>
    )
  }

  // ── Unlimited: solo badge informativo ─────────────────
  if (isUnlimited) {
    return (
      <Card padding={16} style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{
            padding: '6px 12px', borderRadius: 999,
            background: badgeBg, color: badgeColor,
            fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold,
            display: 'flex', alignItems: 'center', gap: 6
          }}>
            <span>{badgeIcon}</span>
            <span>{badgeText}</span>
          </div>
          <div style={{ fontSize: FONT_SIZE.sm, color: C.muted }}>
            Tu cuenta no consume créditos por día.
          </div>
        </div>
      </Card>
    )
  }

  // ── Render principal (idéntico al partner) ────────────
  const cardExtra = isOverlay
    ? { border: `2px solid ${C.brand || C.gold || '#D4A843'}`, boxShadow: `0 24px 80px rgba(0,0,0,0.6)`, maxWidth: 540, width: '100%' }
    : {}

  return (
    <Card padding={24} style={{ marginBottom: 16, ...cardExtra }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{
            padding: '6px 12px', borderRadius: 999,
            background: badgeBg, color: badgeColor,
            fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold,
            display: 'flex', alignItems: 'center', gap: 6
          }}>
            <span>{badgeIcon}</span>
            <span>{badgeText}</span>
          </div>
          {until && (
            <div style={{ fontSize: FONT_SIZE.xs, color: C.muted, fontFamily: FONT.mono }}>
              Vence: {until.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </div>
          )}
        </div>
        <div style={{ fontSize: FONT_SIZE.xs, color: C.muted, fontFamily: FONT.mono }}>
          Balance: <span style={{ color: isLoadingBal ? C.muted : (bal < 3 ? '#f87171' : bal < 10 ? '#fbbf24' : C.text), fontWeight: FONT_WEIGHT.semibold }}>{isLoadingBal ? '···' : bal}</span> créditos
        </div>
      </div>

      <div style={{ fontSize: FONT_SIZE.sm, color: C.muted, marginBottom: 10, lineHeight: 1.5 }}>
        <strong style={{ color: C.text }}>1 crédito = 1 día de operación.</strong> Activá con cuántos días quieras seguir operando. Reactivar suma días al saldo actual.
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
        {[1, 3, 7].map(n => (
          // 15/05/2026 — variant "accent" para usar el dorado del retail (#E8B547)
          // en lugar del primary azul. Replica visualmente al partner que tambien
          // es dorado, pero usando la paleta accent del retail.
          <Button key={n} size="sm" variant="accent"
            disabled={saving || bal < n}
            onClick={() => activate(n)}>
            +{n} {n === 1 ? 'día' : 'días'}
          </Button>
        ))}
        <div style={{ width: 1, height: 24, background: C.border, margin: '0 4px' }} />
        {/* 17/05/2026 a11y: aria-label para el input de días (sin <label> visible). */}
        <input type="number" min="1" max="7"
          value={days}
          onChange={e => setDays(e.target.value)}
          aria-label="Cantidad de días a activar (entre 1 y 7)"
          style={{
            width: 70, background: C.bg, border: `1px solid ${C.border}`,
            borderRadius: RADIUS.md, padding: '6px 10px', color: C.text,
            fontSize: FONT_SIZE.sm, fontFamily: FONT.mono, outline: 'none'
          }} />
        <Button size="sm" variant="secondary"
          disabled={saving || !days || Number(days) < 1 || Number(days) > 7 || bal < Number(days)}
          onClick={() => activate(days)}>
          Activar
        </Button>
      </div>

      {/* 17/05/2026 a11y: aria-label para el campo de motivo (placeholder no cuenta como label). */}
      <input type="text"
        value={reason}
        onChange={e => setReason(e.target.value)}
        placeholder="Motivo (opcional)"
        aria-label="Motivo de la activación (opcional)"
        style={{
          width: '100%', background: C.bg, border: `1px solid ${C.border}`,
          borderRadius: RADIUS.md, padding: '6px 10px', color: C.text,
          fontSize: FONT_SIZE.xs, fontFamily: FONT.mono, outline: 'none', boxSizing: 'border-box'
        }} />

      {msg && (
        <div style={{
          marginTop: 10, padding: '8px 12px', borderRadius: RADIUS.md,
          background: msg.startsWith('Error') || msg.startsWith('Faltan') || msg.startsWith('Elegí')
            ? 'rgba(248, 113, 113, 0.1)' : 'rgba(52, 211, 153, 0.1)',
          color: msg.startsWith('Error') || msg.startsWith('Faltan') || msg.startsWith('Elegí')
            ? '#f87171' : '#34d399',
          fontSize: FONT_SIZE.sm
        }}>{msg}</div>
      )}

      {/* 15/05/2026 — Grid CUENTA / WHATSAPP / VENCIMIENTO (replica del WalletHero del Inicio).
          Suma altura al bloque para que matchee visualmente con el de /mi-cuenta. */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: 0,
        marginTop: 18,
        paddingTop: 16,
        borderTop: `1px solid ${C.border}`,
      }}>
        <div style={{ padding: '0 16px' }}>
          <div style={{
            fontSize: 9, color: C.muted, fontFamily: FONT.mono,
            textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 4,
          }}>Cuenta</div>
          <div style={{
            fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold,
            color: C.text, fontFamily: FONT.mono,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{retail?.name || 'Retail'}</div>
        </div>
        <div style={{ padding: '0 16px', borderLeft: `1px solid ${C.border}` }}>
          <div style={{
            fontSize: 9, color: C.muted, fontFamily: FONT.mono,
            textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 4,
          }}>WhatsApp</div>
          <div style={{
            fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold,
            fontFamily: FONT.mono,
            color: retail?.wa_phone_first_inbound_at
              ? '#34d399'
              : (retail?.wa_phone_id ? '#fbbf24' : C.muted),
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{retail?.wa_phone_first_inbound_at
              ? 'Conectado'
              : (retail?.wa_phone_id ? 'Sin verificar' : 'No configurado')}</div>
        </div>
        <div style={{ padding: '0 16px', borderLeft: `1px solid ${C.border}` }}>
          <div style={{
            fontSize: 9, color: C.muted, fontFamily: FONT.mono,
            textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 4,
          }}>Vencimiento</div>
          <div style={{
            fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold,
            fontFamily: FONT.mono,
            color: isActive ? '#34d399' : isExpired ? '#f87171' : C.muted,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{!until ? 'No activada' : isExpired ? 'Vencido' : `en ${daysLeft}d`}</div>
        </div>
      </div>
    </Card>
  )
}
