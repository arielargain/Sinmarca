import { useEffect, useState, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import {
  PageContainer, PageHeader, Card, Button, Banner, Chip, TabBar,
  StatCard, StatGrid,
  COLORS as C, RADIUS, FONT_SIZE, FONT_WEIGHT,
} from '../components/ui'

const fmtARS = (n) =>
  '$' + Number(n || 0).toLocaleString('es-AR', { minimumFractionDigits: 0 })
const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleString('es-AR', {
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
      })
    : '—'

const TABS = [
  { id: 'paid',      label: 'Pendientes', icon: '⏳' },
  { id: 'pending',   label: 'Por enviar', icon: '📦' },
  { id: 'history',   label: 'Historial',  icon: '📚' },
]

/**
 * Pedidos — panel para tenant root con identity='tienda'.
 * Si la identity no es 'tienda', muestra mensaje informativo.
 *
 * Tabs:
 *  - paid:    pedidos pagados, esperando preparación
 *  - pending: pedidos creados sin pago confirmado (raros, pero existen)
 *  - history: delivered + cancelled de los últimos 30 días
 */
export default function Pedidos() {
  return <PedidosPanel mode="tenant" />
}

// Exportamos el panel para reusar en sub-tenant (ClientePanel.jsx) y retail (RetailPanel.jsx).
// 12/05/2026: agregado mode='retail' + PageHeader premium consistente con
// RetailCatalogo. La diferencia clave entre los modos es el WRAPPER:
//
//   - tenant  → <PageContainer> (el panel partner no tiene padding propio en main)
//   - sub     → <div>           (ClientePanel ya wrapea con padding en el main del panel)
//   - retail  → <div>           (RetailPanel ya wrapea con padding clamp(16px,3vw,24px))
//
// Usar PageContainer en retail metía DOBLE padding y el header quedaba alineado
// MÁS A LA DERECHA (~32px) que el resto de las páginas del retail.
// Match exacto con RetailCatalogo, que renderiza <PageHeader/> + <ProductsBlock/>
// como hijos directos del <main> del RetailLayout sin wrapper extra.
export function PedidosPanel({ mode = 'tenant' }) {
  const isSub = mode === 'sub'
  const isRetail = mode === 'retail'
  // Tenant es el ÚNICO que usa PageContainer; sub y retail vienen wrapped
  // por su layout padre con padding propio.
  const usesPageContainer = !isSub && !isRetail

  const { tenant, subTenant, retail } = useAuth()
  // entity: la entidad activa según el mode. Para retail también es row de tenants
  // (tier=retail), así que la query filtra por tenant_id igual que el modo tenant.
  const entity = isSub ? subTenant : (isRetail ? retail : tenant)

  const [orders, setOrders] = useState([])
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [error, setError] = useState(null)
  const [tab, setTab] = useState('paid')

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      // Retail usa la misma RPC que tenant root (es un tenant tier=retail).
      const rpcName = isSub ? 'list_my_sub_pending_orders' : 'list_my_pending_orders'
      const { data, error: e } = await supabase.rpc(rpcName)
      if (e) throw e
      setOrders(data || [])
    } catch (e) {
      setError(e.message || 'No se pudieron cargar los pedidos.')
    } finally {
      setLoading(false)
    }
  }, [isSub])

  const fetchHistory = useCallback(async () => {
    if (!entity?.id) return
    try {
      setHistoryLoading(true)
      const cutoff = new Date(Date.now() - 30 * 86400000).toISOString()
      let q = supabase
        .from('sales')
        .select('*')
        .eq('order_type', 'tienda')
        .in('ship_status', ['delivered', 'cancelled'])
        .gte('created_at', cutoff)
        .order('ship_status_at', { ascending: false, nullsFirst: false })
        .limit(200)
      q = isSub ? q.eq('sub_tenant_id', entity.id) : q.eq('tenant_id', entity.id).is('sub_tenant_id', null)
      const { data, error: e } = await q
      if (e) throw e
      setHistory(data || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setHistoryLoading(false)
    }
  }, [entity?.id, isSub])

  useEffect(() => { fetchOrders() }, [fetchOrders])
  useEffect(() => {
    if (tab === 'history') fetchHistory()
  }, [tab, fetchHistory])

  // Realtime: refrescar al insertarse o actualizarse un pedido tienda.
  useEffect(() => {
    if (!entity?.id) return
    const filterCol = isSub ? 'sub_tenant_id' : 'tenant_id'
    const channelName = `orders:${filterCol}:${entity.id}`
    const sub = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sales',
          filter: `${filterCol}=eq.${entity.id}`,
        },
        (payload) => {
          // Sólo nos interesan los de tipo 'tienda'
          const row = payload.new || payload.old
          if (row?.order_type !== 'tienda') return
          fetchOrders()
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(sub) }
  }, [entity?.id, isSub, fetchOrders])

  const filtered = useMemo(() => {
    if (tab === 'history') return history
    return orders.filter((o) => o.ship_status === tab)
  }, [orders, history, tab])

  const stats = useMemo(() => {
    const paidCount = orders.filter((o) => o.ship_status === 'paid').length
    const totalAmount = orders
      .filter((o) => o.ship_status === 'paid')
      .reduce((s, o) => s + Number(o.amount || 0), 0)
    return { paidCount, totalAmount }
  }, [orders])

  // Loading state — el initial loading bloquea el render. Para history, sólo
  // mostramos el spinner dentro de la tab.
  const showLoading = loading || (tab === 'history' && historyLoading)

  const identity = entity?.identity || 'casino'
  const isTienda = identity === 'tienda'

  // ── Header unificado (eyebrow + título + subtítulo) ──────────────
  // Mismo lenguaje visual que RetailCatalogo / RetailHome / RetailConfig.
  const HEADER = (
    <PageHeader
      eyebrow="Centro de pedidos"
      title="Pedidos"
      subtitle={
        isTienda
          ? 'Pedidos de tienda generados por el bot, listos para preparar y enviar.'
          : 'Esta sección se activa cuando tu identidad es Tienda.'
      }
    />
  )

  // Wrapper: PageContainer SOLO para tenant root. sub/retail usan div plano
  // porque su layout padre ya provee el padding lateral.
  const Wrapper = usesPageContainer ? PageContainer : 'div'

  if (!isTienda) {
    return (
      <Wrapper>
        {/* Header consistente para todas las identidades (incluso no-tienda) */}
        {!isSub && HEADER}
        <Card padding={28} style={{ borderStyle: 'dashed' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 38, marginBottom: 14, opacity: 0.6 }}>🛒</div>
            <div style={{
              fontSize: FONT_SIZE.md,
              fontWeight: FONT_WEIGHT.bold,
              color: C.text,
              marginBottom: 6,
            }}>
              Pedidos está disponible para identidad <em style={{ color: C.brand, fontStyle: 'normal' }}>Tienda</em>
            </div>
            <div style={{
              fontSize: FONT_SIZE.sm,
              color: C.muted,
              maxWidth: 460,
              margin: '0 auto',
              lineHeight: 1.55,
            }}>
              Tu identidad actual es <strong style={{ color: C.text }}>{identity}</strong>.
              Cambiala desde <strong style={{ color: C.text }}>Configuración → Identidad del negocio</strong>{' '}
              si vendés productos físicos o digitales. Cuando un cliente compre
              por WhatsApp, el pedido aparece acá automáticamente.
            </div>
          </div>
        </Card>
      </Wrapper>
    )
  }

  return (
    <Wrapper>
      {/* Header consistente: tenant root, retail Y sub-tenant ahora muestran el
          mismo PageHeader. En sub-tenant antes se omitía porque ClientePanel ya
          tenía su propio header arriba — si vuelve a duplicarse, sacarlo de
          ClientePanel en vez de acá (la fuente de verdad para "Pedidos" es esta
          página). */}
      {!isSub && HEADER}

      <StatGrid minWidth={150} style={{ marginBottom: 16 }}>
        <StatCard
          icon="⏳"
          label="Pendientes"
          value={stats.paidCount}
          accent="warning"
        />
        <StatCard
          icon="💰"
          label="Por cobrar / preparar"
          value={fmtARS(stats.totalAmount)}
          accent="success"
        />
      </StatGrid>

      <TabBar
        value={tab}
        onChange={setTab}
        tabs={TABS}
        style={{ marginBottom: 14 }}
      />

      {error && (
        <div style={{ marginBottom: 12 }}>
          <Banner variant="danger" size="sm">{error}</Banner>
        </div>
      )}

      {showLoading && (
        <Card>
          <div style={{ color: C.muted, padding: 20, textAlign: 'center' }}>
            Cargando pedidos…
          </div>
        </Card>
      )}

      {!showLoading && filtered.length === 0 && (
        <Card padding={0} style={{ borderStyle: 'dashed' }}>
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 42, marginBottom: 14, opacity: 0.6 }}>📭</div>
            <div style={{
              fontSize: FONT_SIZE.md,
              color: C.text,
              fontWeight: FONT_WEIGHT.semibold,
            }}>
              {tab === 'paid' && 'No hay pedidos pendientes'}
              {tab === 'pending' && 'No hay pedidos por enviar'}
              {tab === 'history' && 'Historial vacío'}
            </div>
            <div style={{ fontSize: FONT_SIZE.sm, color: C.muted, marginTop: 6 }}>
              Los pedidos aparecen acá automáticamente cuando el cliente paga.
            </div>
          </div>
        </Card>
      )}

      {!showLoading && filtered.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((o) => (
            <OrderCard
              key={o.id}
              order={o}
              onChange={async () => { await fetchOrders(); if (tab === 'history') await fetchHistory() }}
            />
          ))}
        </div>
      )}
    </Wrapper>
  )
}

// ────────────────────────────────────────────────────────────
// OrderCard
// ────────────────────────────────────────────────────────────
function OrderCard({ order, onChange }) {
  const [busy, setBusy] = useState(null) // 'deliver' | 'cancel' | null
  const [error, setError] = useState(null)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [reason, setReason] = useState('')

  const items = Array.isArray(order.product_items) ? order.product_items : []

  async function deliver() {
    setBusy('deliver')
    setError(null)
    try {
      const { error: e } = await supabase.rpc('mark_order_delivered', {
        p_sale_id: order.id,
      })
      if (e) throw e
      await onChange()
    } catch (e) {
      setError(e.message)
      setBusy(null)
    }
  }

  async function cancel() {
    setBusy('cancel')
    setError(null)
    try {
      const { error: e } = await supabase.rpc('mark_order_cancelled', {
        p_sale_id: order.id,
        p_reason: reason.trim() || null,
      })
      if (e) throw e
      setConfirmCancel(false)
      await onChange()
    } catch (e) {
      setError(e.message)
      setBusy(null)
    }
  }

  const statusBadge = STATUS_BADGES[order.ship_status] || STATUS_BADGES.pending
  const canAct = order.ship_status === 'paid' || order.ship_status === 'pending'

  return (
    <Card padding={0}>
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 10,
          flexWrap: 'wrap',
        }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold, color: C.text }}>
              {order.customer_name || 'Cliente sin nombre'}
              {order.customer_dni && (
                <span style={{ fontSize: FONT_SIZE.sm, color: C.muted, fontWeight: 400, marginLeft: 8 }}>
                  DNI {order.customer_dni}
                </span>
              )}
            </div>
            <div style={{ fontSize: FONT_SIZE.sm, color: C.muted, marginTop: 2 }}>
              {order.customer_phone || '—'} · {fmtDate(order.created_at)}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span style={{
              fontSize: 11,
              fontWeight: FONT_WEIGHT.bold,
              padding: '4px 9px',
              borderRadius: 999,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              background: statusBadge.bg,
              color: statusBadge.color,
              border: `1px solid ${statusBadge.color}40`,
            }}>
              {statusBadge.label}
            </span>
            <span style={{ fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: C.brand }}>
              {fmtARS(order.amount)}
            </span>
          </div>
        </div>

        {/* Dirección */}
        {(order.shipping_address || order.shipping_city) && (
          <div style={{
            background: C.bg,
            border: `1px solid ${C.border}`,
            borderRadius: RADIUS.sm,
            padding: '8px 10px',
            fontSize: FONT_SIZE.sm,
            color: C.text,
            lineHeight: 1.5,
          }}>
            <div style={{
              fontSize: 10,
              fontWeight: FONT_WEIGHT.bold,
              color: C.muted,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 3,
            }}>
              📍 Dirección
            </div>
            {order.shipping_address}
            {order.shipping_city && `, ${order.shipping_city}`}
            {order.shipping_zip && ` (${order.shipping_zip})`}
            {order.shipping_notes && (
              <div style={{ color: C.muted, fontSize: FONT_SIZE.xs, marginTop: 4, fontStyle: 'italic' }}>
                Nota: {order.shipping_notes}
              </div>
            )}
          </div>
        )}

        {/* Items */}
        {items.length > 0 && (
          <div style={{
            background: C.bg,
            border: `1px solid ${C.border}`,
            borderRadius: RADIUS.sm,
            padding: '8px 10px',
          }}>
            <div style={{
              fontSize: 10,
              fontWeight: FONT_WEIGHT.bold,
              color: C.muted,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 6,
            }}>
              🛒 Productos ({items.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {items.map((it, idx) => {
                const qty = Number(it.qty || it.quantity || 1)
                const unit = Number(it.price_ars || it.unit_price || 0)
                const sub = unit * qty
                return (
                  <div key={it.id ?? idx} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: FONT_SIZE.sm,
                    color: C.text,
                  }}>
                    <span>
                      {qty}× {it.name || it.product_name || 'Producto'}
                    </span>
                    <span style={{ color: C.muted }}>
                      {fmtARS(sub)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Cancel reason si fue cancelado */}
        {order.ship_status === 'cancelled' && order.ship_cancel_reason && (
          <div style={{
            fontSize: FONT_SIZE.sm,
            color: C.danger,
            background: `${C.danger}10`,
            border: `1px solid ${C.danger}30`,
            borderRadius: RADIUS.sm,
            padding: '6px 10px',
          }}>
            ✗ Motivo: {order.ship_cancel_reason}
          </div>
        )}

        {error && (
          <Banner variant="danger" size="sm">{error}</Banner>
        )}

        {/* Actions */}
        {canAct && !confirmCancel && (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmCancel(true)}
              disabled={!!busy}
            >
              ✗ Cancelar
            </Button>
            <Button
              variant="success"
              size="sm"
              onClick={deliver}
              disabled={!!busy}
            >
              {busy === 'deliver' ? 'Marcando…' : '✓ Marcar entregado'}
            </Button>
          </div>
        )}

        {confirmCancel && (
          <div style={{
            background: `${C.danger}08`,
            border: `1px solid ${C.danger}30`,
            borderRadius: RADIUS.sm,
            padding: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}>
            <div style={{ fontSize: FONT_SIZE.sm, color: C.text }}>
              ¿Cancelar este pedido? Indicá el motivo (opcional):
            </div>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Sin stock, cliente arrepentido…"
              style={{
                background: C.bg,
                border: `1px solid ${C.border}`,
                borderRadius: RADIUS.sm,
                padding: '8px 10px',
                color: C.text,
                fontSize: FONT_SIZE.sm,
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setConfirmCancel(false); setReason('') }}
                disabled={!!busy}
              >
                Volver
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={cancel}
                disabled={!!busy}
              >
                {busy === 'cancel' ? 'Cancelando…' : 'Confirmar cancelación'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

const STATUS_BADGES = {
  pending:   { label: 'pending',   bg: '#451a03', color: '#fb923c' },
  paid:      { label: 'paid',      bg: '#052e16', color: '#4ade80' },
  delivered: { label: 'delivered', bg: '#0c4a6e', color: '#38bdf8' },
  cancelled: { label: 'cancelled', bg: '#450a0a', color: '#f87171' },
}
