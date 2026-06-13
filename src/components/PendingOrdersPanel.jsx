import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import Icon from './Icon'

// ── Panel "Pendientes" ──────────────────────────────────────────
// Muestra escalaciones recientes (última 48h) que requieren acción del operador:
// retiros, CVU, acreditaciones, pagos manuales, altas manuales, etc.
//
// Usa RPC: list_pending_manual_orders(limit)
//
// Soporta tenant Y sub_tenant. Cada uno ve solo lo suyo (filtrado en RPC).

const C = {
  bg: '#080B12', surface: '#0D0F1A', border: '#1A1D2E',
  gold: '#D4A843', green: '#2ECC71', red: '#E74C3C', blue: '#3B82F6',
  muted: '#4E5168', text: '#E9E7E0', textDim: '#8B8E9F',
}

// Metadata por reason: qué icono/color/etiqueta mostrar
const REASON_META = {
  // ── Casino — escalaciones del agente IA ────────────────────
  casino_retiro: {
    icon: '💸', label: 'RETIRO',
    color: '#E74C3C',
    description: 'Cliente quiere retirar saldo.',
    group: 'casino',
  },
  casino_cvu: {
    icon: '🏦', label: 'CVU / CBU',
    color: '#3B82F6',
    description: 'Cliente pide datos para transferir.',
    group: 'casino',
  },
  casino_acreditacion: {
    icon: '⚠️', label: 'ACREDITACIÓN',
    color: '#F39C12',
    description: 'Cliente reclama una carga no acreditada.',
    group: 'casino',
  },
  casino_queja: {
    icon: '😠', label: 'QUEJA',
    color: '#E74C3C',
    description: 'Cliente con queja o problema.',
    group: 'casino',
  },
  casino_general: {
    icon: '💬', label: 'OTROS',
    color: '#8B8E9F',
    description: 'Escalación sin clasificar.',
    group: 'casino',
  },
  general: {
    icon: '💬', label: 'OTROS',
    color: '#8B8E9F',
    description: 'Escalación sin clasificar.',
    group: 'casino',
  },
  // ── Pagos / Altas manuales (config faltante) ───────────────
  pago_manual_sin_billetera: {
    icon: '💰', label: 'ORDEN DE PAGO',
    color: '#D4A843',
    description: 'Cliente quiere cargar saldo. Billetera virtual no configurada.',
    group: 'manual',
  },
  alta_manual_sin_casino: {
    icon: '🆕', label: 'ALTA MANUAL',
    color: '#3B82F6',
    description: 'Cliente quiere crear cuenta. API del negocio no configurada.',
    group: 'manual',
  },
  // ── Tienda / producto ──────────────────────────────────────
  tienda_sin_billetera:       { icon: '🛍️', label: 'PEDIDO TIENDA',     color: '#D4A843', description: 'Pedido pendiente sin pago configurado.', group: 'tienda' },
  tienda_cart_insert_failed:  { icon: '🛍️', label: 'ERROR CARRITO',     color: '#E74C3C', description: 'Falló registrar el carrito.', group: 'tienda' },
  tienda_mp_link_failed:      { icon: '🛍️', label: 'ERROR LINK PAGO',   color: '#E74C3C', description: 'Falló generar link de pago.', group: 'tienda' },
  tienda_sin_catalogo:        { icon: '🛍️', label: 'SIN CATÁLOGO',      color: '#8B8E9F', description: 'Cliente preguntó pero no hay catálogo cargado.', group: 'tienda' },
  tienda_general:             { icon: '🛍️', label: 'CONSULTA TIENDA',   color: '#8B8E9F', description: 'Consulta general de tienda.', group: 'tienda' },
  tienda_consulta:            { icon: '🛍️', label: 'CONSULTA TIENDA',   color: '#8B8E9F', description: 'Consulta general de tienda.', group: 'tienda' },
  producto_sin_billetera:     { icon: '📦', label: 'PEDIDO PRODUCTO',   color: '#D4A843', description: 'Pedido sin pago configurado.', group: 'tienda' },
  producto_mp_link_failed:    { icon: '📦', label: 'ERROR LINK PAGO',   color: '#E74C3C', description: 'Falló generar link de pago.', group: 'tienda' },
  // ── Profesional / marketing ────────────────────────────────
  profesional_general:        { icon: '📅', label: 'CONSULTA',          color: '#3B82F6', description: 'Consulta profesional.', group: 'lead' },
  profesional_consulta:       { icon: '📅', label: 'CONSULTA',          color: '#3B82F6', description: 'Consulta profesional.', group: 'lead' },
  marketing_general:          { icon: '📣', label: 'LEAD',              color: '#3B82F6', description: 'Lead de marketing.', group: 'lead' },
  marketing_consulta:         { icon: '📣', label: 'LEAD',              color: '#3B82F6', description: 'Lead de marketing.', group: 'lead' },
}

function tiempoRelativo(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  if (diff < 60000) return 'ahora'
  if (diff < 3600000) return `hace ${Math.floor(diff / 60000)}m`
  if (diff < 86400000) return `hace ${Math.floor(diff / 3600000)}h`
  return d.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function formatPhone(ph) {
  if (!ph) return ''
  const digits = String(ph).replace(/\D/g, '')
  if (digits.length >= 10) {
    return `+${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 9)}-${digits.slice(9)}`
  }
  return ph
}

export default function PendingOrdersPanel({ onClose, onOpenChat }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all | casino | manual | tienda | lead
  const [dismissing, setDismissing] = useState({})
  const [dismissingAll, setDismissingAll] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.rpc('list_pending_manual_orders', { p_limit: 50 })
      if (!error) setOrders(data || [])
    } finally {
      setLoading(false)
    }
  }, [])

  const handleDismiss = async (orderId) => {
    setDismissing(d => ({ ...d, [orderId]: true }))
    const prev = orders
    setOrders(o => o.filter(x => x.id !== orderId))
    const { data, error } = await supabase.rpc('dismiss_manual_order', { p_order_id: orderId })
    if (error || !data?.ok) {
      setOrders(prev)
      alert('No se pudo descartar. ' + (data?.error || error?.message || ''))
    }
    setDismissing(d => { const n = { ...d }; delete n[orderId]; return n })
  }

  const handleDismissAll = async () => {
    if (orders.length === 0) return
    if (!confirm(`¿Descartar las ${orders.length} pendientes? El historial se conserva, sólo se ocultan del panel.`)) return
    setDismissingAll(true)
    const prev = orders
    setOrders([])
    const { data, error } = await supabase.rpc('dismiss_all_manual_orders')
    if (error || !data?.ok) {
      setOrders(prev)
      alert('No se pudieron descartar. ' + (data?.error || error?.message || ''))
    }
    setDismissingAll(false)
  }

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const t = setInterval(load, 30000)
    return () => clearInterval(t)
  }, [load])

  const groupOf = (reason) => REASON_META[reason]?.group || 'other'

  const filtered = orders.filter(o => {
    if (filter === 'all') return true
    return groupOf(o.reason) === filter
  })

  const countCasino = orders.filter(o => groupOf(o.reason) === 'casino').length
  const countManual = orders.filter(o => groupOf(o.reason) === 'manual').length
  const countTienda = orders.filter(o => groupOf(o.reason) === 'tienda').length
  const countLead   = orders.filter(o => groupOf(o.reason) === 'lead').length

  // Tabs visibles: solo los grupos con conteo > 0 (además del 'Todas')
  const visibleTabs = [
    ['all', `Todas (${orders.length})`, C.gold, true],
    ['casino', `🎰 Casino (${countCasino})`, '#E74C3C', countCasino > 0],
    ['manual', `💰 Manuales (${countManual})`, '#D4A843', countManual > 0],
    ['tienda', `🛍️ Tienda (${countTienda})`, '#3B82F6', countTienda > 0],
    ['lead',   `📣 Leads (${countLead})`, '#3B82F6', countLead > 0],
  ].filter(([, , , show]) => show)

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
        zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, backdropFilter: 'blur(4px)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14,
          width: '100%', maxWidth: 680, maxHeight: '85vh',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{
          padding: '18px 22px', borderBottom: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <h2 style={{ margin: 0, color: C.text, fontSize: 17, fontWeight: 700 }}>
              <Icon e="📋"/> Pendientes
            </h2>
            <p style={{ margin: '4px 0 0', color: C.textDim, fontSize: 12 }}>
              Escalaciones del bot que requieren tu atención (últimas 48h)
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: `1px solid ${C.border}`,
              borderRadius: 8, width: 32, height: 32, color: C.textDim,
              cursor: 'pointer', fontSize: 16,
            }}
          >×</button>
        </div>

        <div style={{ padding: '12px 22px', borderBottom: `1px solid ${C.border}20`, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 8, flex: 1, minWidth: 200, flexWrap: 'wrap' }}>
            {visibleTabs.map(([val, label, color]) => (
              <button
                key={val}
                onClick={() => setFilter(val)}
                style={{
                  padding: '7px 10px', fontSize: 12, fontWeight: 600,
                  border: `1px solid ${filter === val ? color : C.border}`,
                  borderRadius: 8,
                  background: filter === val ? `${color}18` : 'transparent',
                  color: filter === val ? color : C.textDim,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >{label}</button>
            ))}
          </div>
          {orders.length > 0 && (
            <button
              onClick={handleDismissAll}
              disabled={dismissingAll}
              title="Descartar todas las pendientes"
              style={{
                padding: '7px 12px', fontSize: 11, fontWeight: 600,
                border: `1px solid ${C.red}40`, borderRadius: 8,
                background: 'transparent', color: C.red,
                cursor: dismissingAll ? 'wait' : 'pointer',
                opacity: dismissingAll ? 0.5 : 1, whiteSpace: 'nowrap',
              }}
            >{dismissingAll ? 'Descartando…' : '✕ Descartar todas'}</button>
          )}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {loading && orders.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: C.muted, fontSize: 13 }}>
              Cargando…
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
              <p style={{ margin: 0, color: C.text, fontSize: 14, fontWeight: 600 }}>Sin pendientes</p>
              <p style={{ margin: '6px 0 0', color: C.muted, fontSize: 12 }}>
                Cuando el bot derive una solicitud al operador aparecerá acá.
              </p>
            </div>
          )}
          {filtered.map(o => {
            const meta = REASON_META[o.reason] || { icon: '❓', label: o.reason || 'OTROS', color: C.muted, description: '' }
            const isPago = o.reason === 'pago_manual_sin_billetera'
            const isAlta = o.reason === 'alta_manual_sin_casino'
            const monto = Number(o.extra?.monto || 0)
            const currency = o.extra?.currency || 'ARS'
            const nombreSolicitado = o.extra?.nombre_solicitado || ''
            const nombreContacto = o.extra?.nombre_contacto || ''

            return (
              <div key={o.id} style={{
                padding: '14px 22px', borderBottom: `1px solid ${C.border}20`,
                transition: 'opacity 0.15s, background 0.15s',
                opacity: dismissing[o.id] ? 0.4 : 1,
                position: 'relative',
              }}>
                <button
                  onClick={() => handleDismiss(o.id)}
                  disabled={dismissing[o.id]}
                  title="Descartar"
                  style={{
                    position: 'absolute', top: 10, right: 14,
                    width: 26, height: 26, borderRadius: 6,
                    background: 'transparent', border: `1px solid ${C.border}`,
                    color: C.textDim, fontSize: 14, lineHeight: 1,
                    cursor: dismissing[o.id] ? 'wait' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.12s',
                  }}
                  onMouseEnter={e => {
                    if (dismissing[o.id]) return
                    e.currentTarget.style.borderColor = C.red
                    e.currentTarget.style.color = C.red
                    e.currentTarget.style.background = `${C.red}10`
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = C.border
                    e.currentTarget.style.color = C.textDim
                    e.currentTarget.style.background = 'transparent'
                  }}
                >×</button>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, paddingRight: 28 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                    background: `${meta.color}20`, border: `1px solid ${meta.color}40`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20,
                  }}>{meta.icon}</div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                        padding: '3px 8px', borderRadius: 99,
                        background: `${meta.color}18`, border: `1px solid ${meta.color}40`,
                        color: meta.color,
                      }}>{meta.label}</span>
                      <span style={{ fontSize: 11, color: C.muted }}>{tiempoRelativo(o.created_at)}</span>
                    </div>

                    <div style={{ marginTop: 8 }}>
                      {isPago && monto > 0 && (
                        <div style={{ color: C.text, fontSize: 16, fontWeight: 700 }}>
                          ${monto.toLocaleString('es-AR')} {currency}
                        </div>
                      )}
                      {isAlta && nombreSolicitado && (
                        <div style={{ color: C.text, fontSize: 15, fontWeight: 600 }}>
                          {nombreSolicitado}
                        </div>
                      )}
                      <div style={{ color: C.textDim, fontSize: 12, marginTop: 3 }}>
                        <Icon e="📱"/> {formatPhone(o.phone)}
                        {nombreContacto && (
                          <span style={{ marginLeft: 8 }}>• {nombreContacto}</span>
                        )}
                      </div>
                    </div>

                    {o.customer_message && (
                      <div style={{
                        marginTop: 8, padding: '6px 10px',
                        background: `${C.bg}80`, borderLeft: `2px solid ${meta.color}`,
                        borderRadius: 4, fontSize: 12, color: C.textDim,
                        fontStyle: 'italic',
                      }}>
                        "{o.customer_message.slice(0, 140)}{o.customer_message.length > 140 ? '…' : ''}"
                      </div>
                    )}

                    <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button
                        onClick={() => {
                          if (onOpenChat) onOpenChat(o.phone)
                          onClose?.()
                        }}
                        style={{
                          background: `${C.gold}20`, border: `1px solid ${C.gold}40`,
                          color: C.gold, fontSize: 11, fontWeight: 600,
                          padding: '5px 10px', borderRadius: 6, cursor: 'pointer',
                        }}
                      ><Icon e="💬"/> Abrir chat</button>
                      <a
                        href={`https://wa.me/${String(o.phone).replace(/\D/g, '')}`}
                        target="_blank" rel="noreferrer"
                        style={{
                          background: `${C.green}20`, border: `1px solid ${C.green}40`,
                          color: C.green, fontSize: 11, fontWeight: 600,
                          padding: '5px 10px', borderRadius: 6, textDecoration: 'none',
                          display: 'inline-block',
                        }}
                      ><Icon e="📲"/> WhatsApp</a>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div style={{
          padding: '10px 22px', borderTop: `1px solid ${C.border}20`,
          fontSize: 11, color: C.muted, textAlign: 'center',
        }}>
          <Icon e="💡"/> Estas son solicitudes que el bot derivó al operador. Atendelas y descartalas con ✕.
        </div>
      </div>
    </div>
  )
}

export function PendingOrdersBadge({ onOpen }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    const refresh = async () => {
      try {
        const { data } = await supabase.rpc('list_pending_manual_orders', { p_limit: 50 })
        if (cancelled) return
        setCount((data || []).length)
      } catch {}
    }
    refresh()
    const t = setInterval(refresh, 30000)
    return () => { cancelled = true; clearInterval(t) }
  }, [])

  if (count === 0) {
    return (
      <button
        onClick={onOpen}
        title="Pendientes"
        style={{
          background: C.bg, border: `1px solid ${C.border}`, borderRadius: 7,
          padding: '5px 8px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 5,
          color: C.muted, fontSize: 11, fontWeight: 500,
        }}
      >
        <span style={{ fontSize: 13 }}>📋</span>
        <span style={{ display: window.innerWidth < 500 ? 'none' : 'inline' }}>Pendientes</span>
      </button>
    )
  }

  return (
    <button
      onClick={onOpen}
      title={`${count} pendientes`}
      style={{
        background: `${C.gold}18`, border: `1px solid ${C.gold}`, borderRadius: 7,
        padding: '5px 8px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 5,
        color: C.gold, fontSize: 11, fontWeight: 700,
        animation: 'orderPulse 2s ease-in-out infinite',
      }}
    >
      <span style={{ fontSize: 13 }}>📋</span>
      <span>{count}</span>
      <style>{`
        @keyframes orderPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(212, 168, 67, 0.4); }
          50%      { box-shadow: 0 0 0 6px rgba(212, 168, 67, 0); }
        }
      `}</style>
    </button>
  )
}
