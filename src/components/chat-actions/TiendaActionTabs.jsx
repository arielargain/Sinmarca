// ════════════════════════════════════════════════════════════════════
// TiendaActionTabs — Acciones del operador sobre una conversation
// para identity='tienda'.
//
// 11/05/2026: parte del sprint identity-actions junto con Profesional
// y Marketing.
//
// Tabs:
//   👤 Datos     — info del contacto + último pedido pendiente
//   💰 Venta     — form rápido (monto + notas) que llama
//                  retail_register_sale o sub_tenant_register_sale
//                  según scope. Pre-poblado con phone+name del chat.
//   📦 Pedidos   — lista de pedidos pendientes del scope filtrados
//                  client-side por el phone del contacto. Botones
//                  "Entregar" (mark_order_delivered) y "Cancelar"
//                  (mark_order_cancelled).
//
// onDone kinds nuevos:
//   - 'sale_registered'   → manda mensaje confirmando al cliente
//   - 'order_delivered'   → manda mensaje "Tu pedido fue despachado"
//   - 'order_cancelled'   → manda mensaje "Tu pedido fue cancelado"
//   - 'share'             → (compat)
// ════════════════════════════════════════════════════════════════════

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { COLORS, RADIUS, FONT_SIZE, FONT_WEIGHT, FONT } from '../../theme/tokens'

const C = COLORS

const fmtARS = (n) => '$' + Number(n || 0).toLocaleString('es-AR')
const fmtDateTime = (iso) => new Intl.DateTimeFormat('es-AR', {
  timeZone: 'America/Argentina/Buenos_Aires',
  day: '2-digit', month: '2-digit', year: 'numeric',
  hour: '2-digit', minute: '2-digit', hour12: false,
}).format(new Date(iso))

// Inputs comunes
const fi = {
  width: '100%', boxSizing: 'border-box',
  background: C.bg, border: `1px solid ${C.border}`,
  borderRadius: RADIUS.md, padding: '9px 11px',
  color: C.text, fontSize: FONT_SIZE.base, outline: 'none',
  fontFamily: 'inherit',
}

function MiniBtn({ children, onClick, variant = 'ghost', disabled, sx }) {
  const variants = {
    primary: { background: C.primary, color: '#fff', border: `1px solid ${C.primary}` },
    danger:  { background: `${C.danger}1A`, color: C.danger, border: `1px solid ${C.danger}55` },
    success: { background: `${C.success}1A`, color: C.success, border: `1px solid ${C.success}55` },
    ghost:   { background: C.surface2, color: C.text, border: `1px solid ${C.border}` },
  }
  return (
    <button onClick={disabled ? undefined : onClick} disabled={disabled}
      style={{
        padding: '7px 12px', borderRadius: RADIUS.sm,
        fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        fontFamily: 'inherit',
        transition: 'background .12s, border-color .12s',
        ...variants[variant],
        ...sx,
      }}>
      {children}
    </button>
  )
}

function StatusPill({ status }) {
  const palette = {
    pending:   { fg: C.warning, label: 'Pendiente'  },
    confirmed: { fg: C.success, label: 'Confirmado' },
    delivered: { fg: C.success, label: 'Entregado'  },
    cancelled: { fg: C.danger,  label: 'Cancelado'  },
    approved:  { fg: C.success, label: 'Pagado'     },
  }[status] || { fg: C.muted, label: status }

  return (
    <span style={{
      padding: '2px 8px', borderRadius: 999,
      background: `${palette.fg}22`, color: palette.fg,
      fontSize: 9, fontWeight: FONT_WEIGHT.bold,
      fontFamily: FONT.mono, textTransform: 'uppercase',
      letterSpacing: '.05em', whiteSpace: 'nowrap',
    }}>{palette.label}</span>
  )
}

// ────────────────────────────────────────────────────────────────────
// Tab 1: Datos
// ────────────────────────────────────────────────────────────────────
function TabInfo({ conv, lastPending }) {
  const items = [
    ['Nombre',    conv.contact_name || '—'],
    ['Teléfono',  conv.phone || '—'],
    ['Email',     conv.contact_email || '—'],
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {items.map(([label, val]) => (
        <div key={label} style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '10px 12px', background: C.surface,
          border: `1px solid ${C.border}`, borderRadius: RADIUS.sm, gap: 10,
        }}>
          <span style={{
            fontSize: FONT_SIZE.xs, color: C.muted,
            fontWeight: FONT_WEIGHT.semibold, fontFamily: FONT.mono,
            textTransform: 'uppercase', letterSpacing: '.06em',
          }}>{label}</span>
          <span style={{
            fontSize: FONT_SIZE.base, color: C.text, textAlign: 'right',
            wordBreak: 'break-word', flex: 1, marginLeft: 12,
          }}>{val}</span>
        </div>
      ))}

      {lastPending && (
        <div style={{
          marginTop: 4, padding: '12px 14px',
          background: `${C.warning}0F`,
          border: `1px solid ${C.warning}55`,
          borderRadius: RADIUS.md,
        }}>
          <div style={{
            fontSize: FONT_SIZE.xs, fontFamily: FONT.mono,
            color: C.warning, textTransform: 'uppercase',
            letterSpacing: '.08em', fontWeight: FONT_WEIGHT.semibold,
            marginBottom: 6,
          }}>📦 Pedido pendiente</div>
          <div style={{
            fontSize: FONT_SIZE.base, color: C.text,
            fontWeight: FONT_WEIGHT.semibold,
          }}>
            {fmtARS(lastPending.amount)} · {fmtDateTime(lastPending.created_at)}
          </div>
          {lastPending.notes && (
            <div style={{
              marginTop: 4, fontSize: FONT_SIZE.xs, color: C.muted, lineHeight: 1.4,
            }}>{lastPending.notes}</div>
          )}
        </div>
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────
// Tab 2: Registrar venta rápida
// ────────────────────────────────────────────────────────────────────
function TabVenta({ conv, isSubTenant, onCreated }) {
  const [amount, setAmount] = useState('')
  const [notes, setNotes]   = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState(null)

  const submit = async () => {
    const n = Number(amount)
    if (!n || n <= 0) { setError('Ingresá un monto válido'); return }
    setSaving(true); setError(null)
    try {
      const rpcName = isSubTenant ? 'sub_tenant_register_sale' : 'retail_register_sale'
      const { data, error } = await supabase.rpc(rpcName, {
        p_conversation_id: conv.id,
        p_amount:          n,
        p_currency:        'ARS',
        p_customer_phone:  conv.phone || null,
        p_customer_name:   conv.contact_name || null,
        p_notes:           notes.trim() || null,
      })
      if (error) throw error
      onCreated({ amount: n, sale: data })
    } catch (e) {
      setError(e.message || 'Error al registrar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{
        margin: 0, fontSize: FONT_SIZE.sm, color: C.muted, lineHeight: 1.5,
      }}>
        Registrá una venta manual para <strong style={{ color: C.text }}>{conv.contact_name || conv.phone}</strong>.
        Queda vinculada al chat y se dispara el evento Purchase a Meta si tenés Pixel configurado.
      </p>

      <Field label="Monto (ARS)">
        <input type="number" min="0" step="100" value={amount}
          onChange={e => setAmount(e.target.value)} style={fi}
          placeholder="5000" autoFocus />
      </Field>

      <Field label="Notas (opcional)">
        <textarea value={notes} onChange={e => setNotes(e.target.value)}
          style={{ ...fi, minHeight: 70, fontFamily: 'inherit', resize: 'vertical' }}
          placeholder="Detalle del pedido, producto, etc."
          maxLength={500} />
      </Field>

      {error && (
        <div style={{
          padding: '8px 12px', borderRadius: RADIUS.sm,
          background: C.dangerSoft, color: C.danger,
          fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold,
        }}>{error}</div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
        <MiniBtn variant="primary" onClick={submit} disabled={saving || !amount}>
          {saving ? 'Guardando…' : '💰 Registrar venta'}
        </MiniBtn>
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────
// Tab 3: Pedidos pendientes del cliente
// ────────────────────────────────────────────────────────────────────
function TabPedidos({ orders, onDeliver, onCancel, onShare }) {
  if (orders.length === 0) {
    return (
      <div style={{
        padding: '32px 20px', textAlign: 'center',
        color: C.muted, fontSize: FONT_SIZE.sm,
      }}>
        Este cliente no tiene pedidos pendientes.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {orders.map(o => (
        <div key={o.id} style={{
          padding: '12px 14px',
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: RADIUS.sm,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            justifyContent: 'space-between', flexWrap: 'wrap',
          }}>
            <div style={{ flex: '1 1 200px', minWidth: 0 }}>
              <div style={{
                fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.semibold,
                color: C.text, display: 'flex', alignItems: 'center', gap: 8,
                flexWrap: 'wrap',
              }}>
                {fmtARS(o.amount)}
                <StatusPill status={o.status} />
              </div>
              <div style={{
                fontSize: FONT_SIZE.xs, color: C.muted,
                fontFamily: FONT.mono, marginTop: 4,
              }}>
                {fmtDateTime(o.created_at)}
                {o.mp_payment_id && <span style={{ marginLeft: 8 }}>· MP #{String(o.mp_payment_id).slice(-6)}</span>}
              </div>
              {o.notes && (
                <div style={{
                  marginTop: 6, fontSize: FONT_SIZE.xs, color: C.muted,
                  fontStyle: 'italic', lineHeight: 1.4,
                }}>{o.notes}</div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <MiniBtn variant="ghost" onClick={() => onShare(o)}>📤</MiniBtn>
              <MiniBtn variant="success" onClick={() => onDeliver(o)}>Entregar</MiniBtn>
              <MiniBtn variant="danger" onClick={() => onCancel(o)}>Cancelar</MiniBtn>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────
// Componente raíz
// ────────────────────────────────────────────────────────────────────
export default function TiendaActionTabs({ conv, isSubTenant, onDone, onClose }) {
  const [tab, setTab] = useState('info')
  const [allOrders, setAllOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [flashMsg, setFlashMsg] = useState(null)

  // Normalización de phone para matchear (igual criterio que list_my_appointments_by_phone)
  const normPhone = (p) => String(p || '').replace(/[^0-9]/g, '')
  const myPhone = normPhone(conv?.phone)

  const reload = async () => {
    setLoading(true)
    try {
      const rpcName = isSubTenant ? 'list_my_sub_pending_orders' : 'list_my_pending_orders'
      const { data, error } = await supabase.rpc(rpcName)
      if (error) throw error
      setAllOrders(Array.isArray(data) ? data : (data?.orders || []))
    } catch (e) {
      console.error('[TiendaActionTabs] reload error:', e)
      setAllOrders([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { reload() /* eslint-disable-next-line */ }, [conv?.id, isSubTenant])

  // Pedidos solo de este cliente (filtrados por phone normalizado)
  const myOrders = useMemo(() => allOrders.filter(o =>
    normPhone(o.customer_phone || o.phone) === myPhone
  ), [allOrders, myPhone])

  const lastPending = myOrders[0] || null

  const handleCreated = async ({ amount }) => {
    setFlashMsg({ kind: 'success', text: '✓ Venta registrada' })
    onDone('sale_registered', { amount, conv })
    setTimeout(() => setFlashMsg(null), 2500)
  }

  const handleDeliver = async (o) => {
    if (!confirm(`¿Marcar el pedido de ${fmtARS(o.amount)} como entregado?`)) return
    try {
      const { error } = await supabase.rpc('mark_order_delivered', { p_sale_id: o.id })
      if (error) throw error
      setFlashMsg({ kind: 'success', text: '✓ Pedido marcado como entregado' })
      await reload()
      onDone('order_delivered', { sale_id: o.id, amount: o.amount })
      setTimeout(() => setFlashMsg(null), 2500)
    } catch (e) {
      setFlashMsg({ kind: 'error', text: e.message || 'Error al entregar' })
    }
  }

  const handleCancel = async (o) => {
    const reason = prompt('Motivo de cancelación (opcional):')
    if (reason === null) return  // user clicked Cancel del prompt
    try {
      const { error } = await supabase.rpc('mark_order_cancelled', {
        p_sale_id: o.id,
        p_reason:  reason || null,
      })
      if (error) throw error
      setFlashMsg({ kind: 'success', text: '✓ Pedido cancelado' })
      await reload()
      onDone('order_cancelled', { sale_id: o.id, amount: o.amount, reason })
      setTimeout(() => setFlashMsg(null), 2500)
    } catch (e) {
      setFlashMsg({ kind: 'error', text: e.message || 'Error al cancelar' })
    }
  }

  const handleShare = (o) => {
    const msg = `📦 Estado de tu pedido:\n\nMonto: ${fmtARS(o.amount)}\nFecha: ${fmtDateTime(o.created_at)}\n\n¡Cualquier duda, escribinos!`
    onDone('share', { msg })
    onClose && onClose()
  }

  const tabs = [
    { id: 'info',    label: '👤 Datos' },
    { id: 'venta',   label: '💰 Venta' },
    { id: 'pedidos', label: `📦 Pedidos${myOrders.length > 0 ? ` (${myOrders.length})` : ''}` },
  ]

  return (
    <div>
      <div style={{
        display: 'flex', borderBottom: `1px solid ${C.border}`,
        overflowX: 'auto', WebkitOverflowScrolling: 'touch',
      }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              flex: '1 0 auto', padding: '10px 14px',
              fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold,
              border: 'none', cursor: 'pointer', background: 'transparent',
              color: tab === t.id ? C.primaryLite : C.muted,
              borderBottom: `2px solid ${tab === t.id ? C.primary : 'transparent'}`,
              transition: 'all .12s', whiteSpace: 'nowrap',
              fontFamily: 'inherit',
            }}>{t.label}</button>
        ))}
      </div>

      <div style={{ padding: 16 }}>
        {flashMsg && (
          <div style={{
            marginBottom: 12, padding: '8px 12px', borderRadius: RADIUS.sm,
            background: flashMsg.kind === 'success' ? C.successSoft : C.dangerSoft,
            color: flashMsg.kind === 'success' ? C.success : C.danger,
            fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold,
          }}>{flashMsg.text}</div>
        )}

        {tab === 'info'    && <TabInfo conv={conv} lastPending={lastPending} />}
        {tab === 'venta'   && <TabVenta conv={conv} isSubTenant={isSubTenant} onCreated={handleCreated} />}
        {tab === 'pedidos' && (
          loading
            ? <div style={{ padding: 20, textAlign: 'center', color: C.muted, fontSize: FONT_SIZE.sm }}>Cargando…</div>
            : <TabPedidos orders={myOrders}
                onDeliver={handleDeliver} onCancel={handleCancel} onShare={handleShare} />
        )}
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label style={{
        fontSize: FONT_SIZE.xs, color: C.muted,
        textTransform: 'uppercase', letterSpacing: '.06em',
        display: 'block', marginBottom: 5,
        fontFamily: FONT.mono, fontWeight: FONT_WEIGHT.semibold,
      }}>{label}</label>
      {children}
    </div>
  )
}
