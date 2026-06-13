// ═════════════════════════════════════════════════════════════════════
// Contactos — Libreta de clientes (10/06/2026)
//
// Página única reutilizable por:
//   - /contactos           (tenant root partner)
//   - /mi-cuenta/contactos (retail, identity=tienda)
//   - /cliente/contactos   (sub-tenant, identity=tienda)
//
// Backend: list_my_contacts(p_search, p_limit, p_offset) → {total,contacts[]}.
// RPC SECURITY DEFINER que reusa _agenda_resolve_scope() para detectar
// tenant root vs retail vs sub-tenant desde auth.uid().
//
// 10/06/2026 — Filtros + scroll fix:
//   • Filtro estado: Todos / Creó usuario / Cargó saldo / No creó usuario
//   • Filtro fecha: Hoy / Ayer / 7d / 30d / 90d / Todo / Personalizado
//     (aplica a last_message_at, igual que Ventas)
//   • Listado dentro de Card scrollable (maxHeight 60vh) para no
//     hacer scroll infinito cuando hay cientos de contactos.
//   • KPIs y export reflejan el subset filtrado.
//
// 17/05/2026 — Wrapper de max-width 1280px.
// 15/05/2026 — Fix tenant root fallback.
// ═════════════════════════════════════════════════════════════════════

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import {
  PageHeader, SectionHeader, Card, Button, Banner,
  StatCard, StatGrid,
  COLORS as C, RADIUS, FONT_SIZE, FONT_WEIGHT, FONT, TRANSITION,
} from '../components/ui'

const fmtARS = (n) => '$' + Number(n || 0).toLocaleString('es-AR')

function relativeDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now - d
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'ahora'
  if (minutes < 60) return `hace ${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `hace ${hours}h`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'ayer'
  if (days < 7) return `hace ${days}d`
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
}

export default function Contactos() {
  // 15/05/2026 — acepta tenant root como fallback.
  const { tenant, retail, subTenant, isRetail, isSubTenant } = useAuth()
  const entity = isRetail ? retail : (isSubTenant ? subTenant : tenant)
  const nav = useNavigate()

  const chatPrefix = isRetail ? '/mi-cuenta/chats' : (isSubTenant ? '/cliente/chats' : '/chats')

  const [contacts, setContacts]   = useState([])
  const [total, setTotal]         = useState(0)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [search, setSearch]       = useState('')
  const [searchInput, setSearchInput] = useState('')

  // 10/06/2026 — Filtros
  const [statusFilter, setStatusFilter] = useState('all')   // 'all'|'created'|'with_orders'|'not_created'
  const [datePreset, setDatePreset]     = useState('all')   // 'today'|'yesterday'|'7d'|'30d'|'90d'|'all'|'custom'
  const [customFrom, setCustomFrom]     = useState('')
  const [customTo, setCustomTo]         = useState('')

  const [exportMenuOpen, setExportMenuOpen] = useState(false)
  const [exportMenuPos, setExportMenuPos] = useState(null)
  const exportBtnRef = useRef(null)
  const exportMenuRef = useRef(null)

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 300)
    return () => clearTimeout(t)
  }, [searchInput])

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const { data, error: err } = await supabase.rpc('list_my_contacts', {
        p_search: search || null,
        p_limit:  500,
        p_offset: 0,
      })
      if (err) throw err
      setContacts(data?.contacts || [])
      setTotal(data?.total || 0)
    } catch (e) {
      setError(e.message || 'Error al cargar contactos')
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => { load() }, [load])

  const updateMenuPos = useCallback(() => {
    if (!exportBtnRef.current) return
    const r = exportBtnRef.current.getBoundingClientRect()
    const MENU_WIDTH = 220
    const top = r.bottom + 6
    let left = r.right - MENU_WIDTH
    if (left < 8) left = 8
    if (left + MENU_WIDTH > window.innerWidth - 8) {
      left = window.innerWidth - MENU_WIDTH - 8
    }
    setExportMenuPos({ top, left, width: MENU_WIDTH })
  }, [])

  useEffect(() => {
    if (!exportMenuOpen) return
    updateMenuPos()
    const handler = () => updateMenuPos()
    window.addEventListener('resize', handler)
    window.addEventListener('scroll', handler, true)
    return () => {
      window.removeEventListener('resize', handler)
      window.removeEventListener('scroll', handler, true)
    }
  }, [exportMenuOpen, updateMenuPos])

  useEffect(() => {
    if (!exportMenuOpen) return
    const handler = (e) => {
      const inBtn  = exportBtnRef.current  && exportBtnRef.current.contains(e.target)
      const inMenu = exportMenuRef.current && exportMenuRef.current.contains(e.target)
      if (!inBtn && !inMenu) setExportMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('touchstart', handler, { passive: true })
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('touchstart', handler)
    }
  }, [exportMenuOpen])

  useEffect(() => {
    if (!exportMenuOpen) return
    const onKey = (e) => { if (e.key === 'Escape') setExportMenuOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [exportMenuOpen])

  // 10/06/2026 — Computar rango fecha activo (zona horaria AR igual que Ventas)
  const dateRange = useMemo(() => {
    const now = new Date()
    if (datePreset === 'all') return { from: null, to: null }
    if (datePreset === 'custom') {
      return {
        from: customFrom ? new Date(customFrom + 'T00:00:00') : null,
        to:   customTo   ? new Date(customTo   + 'T23:59:59') : null,
      }
    }
    if (datePreset === 'today' || datePreset === 'yesterday') {
      const AR_OFFSET_MIN = -180
      const arNow = new Date(now.getTime() + (AR_OFFSET_MIN - now.getTimezoneOffset()) * 60000)
      const y = arNow.getFullYear(), m = arNow.getMonth(), d = arNow.getDate()
      const todayStartUtcMs = Date.UTC(y, m, d, 0, 0, 0) - AR_OFFSET_MIN * 60000
      const dayMs = 24 * 60 * 60 * 1000
      if (datePreset === 'today') {
        return { from: new Date(todayStartUtcMs), to: null }
      }
      return {
        from: new Date(todayStartUtcMs - dayMs),
        to:   new Date(todayStartUtcMs),
      }
    }
    const map = { '7d': 7, '30d': 30, '90d': 90 }
    const days = map[datePreset]
    if (!days) return { from: null, to: null }
    return { from: new Date(now.getTime() - days * 24 * 60 * 60 * 1000), to: null }
  }, [datePreset, customFrom, customTo])

  // 10/06/2026 — Aplicar filtros client-side
  const filtered = useMemo(() => {
    return contacts.filter(c => {
      // Estado
      const hasCasinoUser = !!c.casino_user_id
      const hasOrders     = (c.orders_count || 0) > 0
      if (statusFilter === 'created'     && !hasCasinoUser) return false
      if (statusFilter === 'with_orders' && !hasOrders)     return false
      if (statusFilter === 'not_created' && hasCasinoUser)  return false
      // Fecha (last_message_at)
      if (dateRange.from || dateRange.to) {
        if (!c.last_message_at) return false
        const d = new Date(c.last_message_at)
        if (dateRange.from && d < dateRange.from) return false
        if (dateRange.to   && d > dateRange.to)   return false
      }
      return true
    })
  }, [contacts, statusFilter, dateRange])

  const kpis = useMemo(() => {
    let withOrders = 0
    let totalRevenue = 0
    for (const c of filtered) {
      if ((c.orders_count || 0) > 0) withOrders++
      totalRevenue += Number(c.total_amount || 0)
    }
    return { total: filtered.length, withOrders, totalRevenue }
  }, [filtered])

  const hasActiveFilters = statusFilter !== 'all' || datePreset !== 'all'

  const handleExport = (format) => {
    if (filtered.length === 0) {
      alert('No hay contactos para exportar')
      setExportMenuOpen(false)
      return
    }
    setExportMenuOpen(false)
    try {
      const ts = new Date().toISOString().slice(0, 10)
      const slug = entity?.slug || 'export'
      const filename = `contactos-${slug}-${ts}.${format}`
      const rows = filtered.map(c => ({
        id: c.id || '',
        nombre: c.contact_name || '',
        telefono: c.phone || '',
        email: c.email || '',
        dni: c.dni || c.customer_dni || '',
        casino_user_id: c.casino_user_id || '',
        casino_login: c.casino_login || '',
        es_cliente: (c.orders_count || 0) > 0 ? 'Sí' : 'No',
        compras_totales: Number(c.orders_count || 0),
        monto_total_ars: Number(c.total_amount || 0),
        ultima_compra: c.last_order_at || '',
        ultimo_mensaje: c.last_message_at || '',
        fecha_alta: c.created_at || '',
        bot_activo: c.bot_active === false ? 'No' : 'Sí',
        status: c.status || '',
        notas: c.notes || '',
      }))
      let blob
      if (format === 'json') {
        const payload = JSON.stringify({
          tenant: slug,
          generado_en: new Date().toISOString(),
          total_contactos: rows.length,
          filtros: {
            status: statusFilter,
            date_preset: datePreset,
            date_from: dateRange.from ? dateRange.from.toISOString() : null,
            date_to:   dateRange.to   ? dateRange.to.toISOString()   : null,
          },
          kpis: {
            contactos: kpis.total,
            clientes_con_compras: kpis.withOrders,
            facturacion_total_ars: kpis.totalRevenue,
          },
          contactos: rows,
        }, null, 2)
        blob = new Blob([payload], { type: 'application/json;charset=utf-8' })
      } else {
        const headers = Object.keys(rows[0])
        const escape = (v) => {
          if (v === null || v === undefined) return ''
          let s = typeof v === 'object' ? JSON.stringify(v) : String(v)
          s = s.replace(/"/g, '""')
          return /[",\n\r;]/.test(s) ? `"${s}"` : s
        }
        const lines = [headers.join(',')]
        for (const row of rows) {
          lines.push(headers.map(h => escape(row[h])).join(','))
        }
        const csv = '\uFEFF' + lines.join('\r\n')
        blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
      }
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (e) {
      console.error('Export error:', e)
      alert('Error al exportar: ' + (e.message || 'desconocido'))
    }
  }

  const handleToggleExport = () => {
    setExportMenuOpen(o => {
      const next = !o
      if (next) {
        if (exportBtnRef.current) {
          const r = exportBtnRef.current.getBoundingClientRect()
          const MENU_WIDTH = 220
          const top = r.bottom + 6
          let left = r.right - MENU_WIDTH
          if (left < 8) left = 8
          if (left + MENU_WIDTH > window.innerWidth - 8) {
            left = window.innerWidth - MENU_WIDTH - 8
          }
          setExportMenuPos({ top, left, width: MENU_WIDTH })
        }
      }
      return next
    })
  }

  const clearFilters = () => {
    setStatusFilter('all')
    setDatePreset('all')
    setCustomFrom('')
    setCustomTo('')
  }

  if (!entity) {
    return <div style={{ color: C.muted, padding: 20 }}>Cargando…</div>
  }

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', width: '100%' }}>
      <PageHeader
        eyebrow="Centro de contactos"
        title="Contactos"
        subtitle={`Libreta de clientes que escribieron al bot. ${total > 0 ? `${total} en total.` : ''}`}
      />

      {error && <Banner kind="error" style={{ marginBottom: 14 }}>{error}</Banner>}

      <StatGrid minWidth={150} style={{ marginBottom: 18 }}>
        <StatCard icon="👥" label="Contactos" value={kpis.total} accent="info" />
        <StatCard icon="🛍️" label="Clientes que compraron" value={kpis.withOrders} accent="success" />
        <StatCard icon="💰" label="Total facturado" value={fmtARS(kpis.totalRevenue)} accent="brand" />
      </StatGrid>

      {/* 10/06/2026 — Filtros: estado + fecha */}
      <Card style={{ marginBottom: 14, padding: 14 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: FONT_SIZE.sm, color: C.muted, marginRight: 4 }}>Estado:</span>
          {[
            { id: 'all',         label: 'Todos' },
            { id: 'created',     label: 'Creó usuario' },
            { id: 'with_orders', label: 'Cargó saldo' },
            { id: 'not_created', label: 'No creó usuario' },
          ].map(opt => (
            <button key={opt.id} onClick={() => setStatusFilter(opt.id)}
              style={{
                background: statusFilter === opt.id ? C.brand : C.surface,
                color: statusFilter === opt.id ? '#000' : C.text,
                border: `1px solid ${statusFilter === opt.id ? C.brand : C.border}`,
                borderRadius: RADIUS.md, padding: '6px 12px',
                fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.medium,
                cursor: 'pointer', transition: TRANSITION, fontFamily: 'inherit',
              }}
            >{opt.label}</button>
          ))}
        </div>
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center',
          marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}`,
        }}>
          <span style={{ fontSize: FONT_SIZE.sm, color: C.muted, marginRight: 4 }}>Último mensaje:</span>
          {[
            { id: 'today',     label: 'Hoy' },
            { id: 'yesterday', label: 'Ayer' },
            { id: '7d',        label: '7 días' },
            { id: '30d',       label: '30 días' },
            { id: '90d',       label: '90 días' },
            { id: 'all',       label: 'Todo' },
            { id: 'custom',    label: 'Personalizado' },
          ].map(opt => (
            <button key={opt.id} onClick={() => setDatePreset(opt.id)}
              style={{
                background: datePreset === opt.id ? C.brand : C.surface,
                color: datePreset === opt.id ? '#000' : C.text,
                border: `1px solid ${datePreset === opt.id ? C.brand : C.border}`,
                borderRadius: RADIUS.md, padding: '6px 12px',
                fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.medium,
                cursor: 'pointer', transition: TRANSITION, fontFamily: 'inherit',
              }}
            >{opt.label}</button>
          ))}
          {hasActiveFilters && (
            <button onClick={clearFilters}
              style={{
                background: 'transparent', color: C.muted, border: 'none',
                fontSize: FONT_SIZE.sm, cursor: 'pointer',
                textDecoration: 'underline', fontFamily: 'inherit',
                marginLeft: 'auto',
              }}
            >Limpiar filtros</button>
          )}
        </div>
        {datePreset === 'custom' && (
          <div style={{
            display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center',
            marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}`,
          }}>
            <label style={{ fontSize: FONT_SIZE.sm, color: C.muted }}>Desde:</label>
            <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
              style={{
                background: C.surface, border: `1px solid ${C.border}`,
                borderRadius: RADIUS.md, color: C.text, padding: '8px 10px',
                fontFamily: FONT.mono, fontSize: FONT_SIZE.sm, outline: 'none',
              }}
            />
            <label style={{ fontSize: FONT_SIZE.sm, color: C.muted }}>Hasta:</label>
            <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
              style={{
                background: C.surface, border: `1px solid ${C.border}`,
                borderRadius: RADIUS.md, color: C.text, padding: '8px 10px',
                fontFamily: FONT.mono, fontSize: FONT_SIZE.sm, outline: 'none',
              }}
            />
          </div>
        )}
      </Card>

      <Card style={{ marginBottom: 14, padding: 12 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="🔍 Buscar por nombre o teléfono…"
              style={{
                width: '100%', boxSizing: 'border-box',
                background: C.bg, border: `1px solid ${C.border}`,
                borderRadius: RADIUS.md,
                padding: '10px 14px',
                color: C.text, fontSize: FONT_SIZE.base,
                outline: 'none', fontFamily: 'inherit',
              }}
            />
          </div>
          <div ref={exportBtnRef}>
            <Button
              onClick={handleToggleExport}
              variant="secondary"
              disabled={filtered.length === 0}
            >
              📥 Exportar {exportMenuOpen ? '▲' : '▼'}
            </Button>
          </div>
        </div>
      </Card>

      {exportMenuOpen && exportMenuPos && typeof document !== 'undefined' && createPortal(
        <div
          ref={exportMenuRef}
          role="menu"
          style={{
            position: 'fixed',
            top: exportMenuPos.top,
            left: exportMenuPos.left,
            width: exportMenuPos.width,
            zIndex: 9999,
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: RADIUS.md,
            boxShadow: '0 12px 32px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.3)',
            overflow: 'hidden',
          }}
        >
          <div style={{
            padding: '8px 12px 6px',
            fontSize: 9, fontWeight: 600,
            color: C.muted, letterSpacing: '0.08em',
            textTransform: 'uppercase', fontFamily: FONT.mono,
            borderBottom: `1px solid ${C.border}`,
          }}>
            {filtered.length} contactos
          </div>
          <button
            onClick={() => handleExport('csv')}
            style={dropdownItem}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(120,120,120,0.08)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          >
            <span>📄</span><span>CSV (Excel)</span>
          </button>
          <button
            onClick={() => handleExport('json')}
            style={dropdownItem}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(120,120,120,0.08)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          >
            <span>{'{ }'}</span><span>JSON</span>
          </button>
        </div>,
        document.body
      )}

      {loading && (
        <div style={{ padding: 40, textAlign: 'center', color: C.muted, fontSize: FONT_SIZE.sm }}>
          Cargando contactos…
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <Card padding={0} style={{ borderStyle: 'dashed' }}>
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 42, marginBottom: 14, opacity: 0.7 }}>👥</div>
            <div style={{ fontSize: 16, color: C.text, fontWeight: FONT_WEIGHT.semibold }}>
              {hasActiveFilters || search ? 'No encontramos contactos' : 'Tu libreta está vacía'}
            </div>
            <div style={{ fontSize: FONT_SIZE.sm, color: C.muted, marginTop: 6, lineHeight: 1.5 }}>
              {hasActiveFilters
                ? 'Probá quitar algún filtro o ampliar el período.'
                : (search
                  ? 'Probá con otro nombre o teléfono.'
                  : 'Cuando un cliente le escriba a tu bot, va a aparecer acá automáticamente.')}
            </div>
          </div>
        </Card>
      )}

      {!loading && filtered.length > 0 && (
        <>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6,
            fontSize: FONT_SIZE.sm, color: C.muted,
          }}>
            <span>
              Mostrando <b style={{ color: C.text }}>{filtered.length}</b>
              {filtered.length !== contacts.length && (
                <> de <b style={{ color: C.text }}>{contacts.length}</b></>
              )}
              {' '}{filtered.length === 1 ? 'contacto' : 'contactos'}
            </span>
          </div>
          <Card padding={0} style={{ maxHeight: '60vh', overflowY: 'auto' }}>
            {filtered.map((c, i) => (
              <ContactRow
                key={c.id}
                contact={c}
                isLast={i === filtered.length - 1}
                onClick={() => nav(`${chatPrefix}/${encodeURIComponent(c.phone || '')}`)}
              />
            ))}
          </Card>
        </>
      )}
    </div>
  )
}

const dropdownItem = {
  display: 'flex', alignItems: 'center', gap: 10, width: '100%',
  padding: '10px 14px', background: 'transparent', border: 'none',
  color: '#E9E7E0', fontSize: 13, fontWeight: 500,
  cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
}

function ContactRow({ contact: c, isLast, onClick }) {
  const hasOrders = (c.orders_count || 0) > 0
  const displayName = c.contact_name || c.phone || 'Contacto sin nombre'
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        width: '100%', textAlign: 'left',
        padding: '13px 16px',
        borderBottom: isLast ? 'none' : `1px solid ${C.border}`,
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        color: C.text,
        fontFamily: 'inherit',
        transition: `background ${TRANSITION?.fast || '.15s'}`,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(120,120,120,0.04)' }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        background: hasOrders ? `${C.brand}22` : 'rgba(120,120,120,0.10)',
        color: hasOrders ? C.brand : C.muted,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14, fontWeight: FONT_WEIGHT.bold,
        flexShrink: 0,
      }}>
        {(displayName[0] || '?').toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.semibold,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
        }}>
          {displayName}
          {hasOrders && (
            <span style={{
              fontSize: 10, padding: '1px 7px', borderRadius: 999,
              background: 'rgba(34,197,94,0.15)', color: '#22c55e',
              fontWeight: FONT_WEIGHT.bold, fontFamily: FONT.mono,
              textTransform: 'uppercase', letterSpacing: '.04em',
            }}>Cliente</span>
          )}
          {c.bot_active === false && (
            <span style={{
              fontSize: 10, padding: '1px 7px', borderRadius: 999,
              background: 'rgba(251,146,60,0.15)', color: '#fb923c',
              fontWeight: FONT_WEIGHT.bold, fontFamily: FONT.mono,
              textTransform: 'uppercase', letterSpacing: '.04em',
            }}>Bot pausado</span>
          )}
        </div>
        <div style={{
          fontSize: FONT_SIZE.sm, color: C.muted, marginTop: 3,
          fontFamily: FONT.mono,
          display: 'flex', gap: 10, flexWrap: 'wrap',
        }}>
          {c.phone && <span>{c.phone}</span>}
          <span>•</span>
          <span>Último mensaje: {relativeDate(c.last_message_at)}</span>
        </div>
      </div>
      <div style={{
        textAlign: 'right', flexShrink: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2,
      }}>
        {hasOrders ? (
          <>
            <div style={{
              fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.bold,
              color: '#22c55e', fontFamily: FONT.mono,
            }}>{fmtARS(c.total_amount)}</div>
            <div style={{
              fontSize: 10, color: C.muted, fontFamily: FONT.mono,
            }}>
              {c.orders_count} {c.orders_count === 1 ? 'compra' : 'compras'}
            </div>
          </>
        ) : (
          <div style={{
            fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.bold,
            color: C.muted, fontStyle: 'italic',
          }}>Sin compras</div>
        )}
      </div>
    </button>
  )
}
