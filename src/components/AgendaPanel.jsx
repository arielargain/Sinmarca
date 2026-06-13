// ════════════════════════════════════════════════════════════════════
// AgendaPanel v3 — Rediseño completo (13/05/2026)
//
// Cambios desde v2:
//   - 3 vistas: Día / Semana (timeline real) / Mes (estilo Google Cal)
//   - Estados visuales con colores: pending|confirmed|completed|cancelled|no_show
//   - KPIs arriba: turnos hoy / semana / confirmados / tasa no-show
//   - Búsqueda live por nombre/teléfono
//   - Filtros de estado (multi-select chips)
//   - Acciones rápidas en turno: confirmar / completar / cancelar / recordatorio WA
//   - Bloqueo de horarios (sin migration, usa appointments con prefix [BLOQUEADO])
//   - Layout responsive: timeline en desktop+tablet, lista en mobile
//
// Backend: sin cambios. Usa las mismas 6 RPCs:
//   list_my_appointments, create_appointment, update_appointment,
//   delete_appointment, get_my_working_hours, set_my_working_hours
// ════════════════════════════════════════════════════════════════════

import { useEffect, useMemo, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  Card, Banner, Button, PageHeader,
  COLORS as C, RADIUS, FONT_SIZE, FONT_WEIGHT, FONT,
} from './ui'

// ─── Constantes ─────────────────────────────────────────────────────
const TZ = 'America/Argentina/Buenos_Aires'
const DAYS_ES       = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
const DAYS_ES_SHORT = ['DOM','LUN','MAR','MIÉ','JUE','VIE','SÁB']
const DAYS_ES_MED   = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']
const MONTHS_ES     = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
const MONTHS_ES_SHORT = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']

const BLOCK_PREFIX = '[BLOQUEADO]'

const STATUS_META = {
  pending:   { label: 'Pendiente',   color: '#F4B740', soft: 'rgba(244,183,64,.14)',  border: 'rgba(244,183,64,.40)' },
  confirmed: { label: 'Confirmado',  color: '#3DD68C', soft: 'rgba(61,214,140,.16)',  border: 'rgba(61,214,140,.45)' },
  completed: { label: 'Completado',  color: '#5589E8', soft: 'rgba(85,137,232,.14)',  border: 'rgba(85,137,232,.35)' },
  cancelled: { label: 'Cancelado',   color: '#E84545', soft: 'rgba(232,69,69,.12)',   border: 'rgba(232,69,69,.30)' },
  no_show:   { label: 'No vino',     color: '#E84545', soft: 'rgba(232,69,69,.12)',   border: 'rgba(232,69,69,.30)' },
}
const BLOCK_META = {
  label: 'Bloqueado', color: '#8595B5', soft: 'rgba(133,149,181,.10)', border: 'rgba(133,149,181,.30)',
}

// ─── Utils de fecha ─────────────────────────────────────────────────
function toLocalIsoDate(date) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year:'numeric', month:'2-digit', day:'2-digit' })
    .format(date)
}
function toLocalTime(iso) {
  return new Intl.DateTimeFormat('es-AR', { timeZone: TZ, hour:'2-digit', minute:'2-digit', hour12:false })
    .format(new Date(iso))
}
function minutesSinceMidnight(iso) {
  const d = new Date(iso)
  const parts = new Intl.DateTimeFormat('es-AR', { timeZone: TZ, hour:'2-digit', minute:'2-digit', hour12:false })
    .formatToParts(d)
  const h = Number(parts.find(p => p.type === 'hour').value)
  const m = Number(parts.find(p => p.type === 'minute').value)
  return h * 60 + m
}
function dayStart(date) {
  const yyyy = date.getFullYear()
  const mm   = String(date.getMonth()+1).padStart(2,'0')
  const dd   = String(date.getDate()).padStart(2,'0')
  return new Date(`${yyyy}-${mm}-${dd}T00:00:00-03:00`)
}
function addDays(date, n) {
  const d = new Date(date); d.setDate(d.getDate() + n); return d
}
function addMonths(date, n) {
  const d = new Date(date); d.setMonth(d.getMonth() + n); return d
}
function startOfWeek(date) {
  const d = new Date(date)
  const dow = d.getDay()
  const diff = (dow === 0 ? -6 : 1 - dow)
  return addDays(d, diff)
}
function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}
function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}
function sameDay(a, b) {
  return toLocalIsoDate(a) === toLocalIsoDate(b)
}

// Detecta si un appointment es un bloqueo (sin migration de schema)
function isBlock(a) {
  return typeof a?.client_name === 'string' && a.client_name.startsWith(BLOCK_PREFIX)
}
function blockReason(a) {
  if (!isBlock(a)) return null
  const after = a.client_name.slice(BLOCK_PREFIX.length).trim()
  return after.startsWith(':') ? after.slice(1).trim() : (after || 'Bloqueado')
}

// ─── Hook: layout responsive ────────────────────────────────────────
function useLayout() {
  const [layout, setLayout] = useState(() => {
    if (typeof window === 'undefined') return 'desktop'
    const w = window.innerWidth
    if (w < 640) return 'mobile'
    if (w < 1024) return 'tablet'
    return 'desktop'
  })
  useEffect(() => {
    if (typeof window === 'undefined') return
    const handler = () => {
      const w = window.innerWidth
      if (w < 640) setLayout('mobile')
      else if (w < 1024) setLayout('tablet')
      else setLayout('desktop')
    }
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return layout
}

// ─── Botón toolbar ──────────────────────────────────────────────────
function TBtn({ children, onClick, active = false, title, icon }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        padding: '7px 12px', minHeight: 34,
        background: active ? C.primary : C.surface2,
        border: `1px solid ${active ? C.primary : C.border}`,
        borderRadius: RADIUS.sm,
        color: active ? '#fff' : C.text,
        fontSize: FONT_SIZE.sm,
        fontWeight: FONT_WEIGHT.semibold,
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'background .12s, border-color .12s',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.borderColor = C.borderStrong }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.borderColor = C.border }}
    >{icon && <span aria-hidden>{icon}</span>}{children}</button>
  )
}

// ─── Stat card ──────────────────────────────────────────────────────
function StatTile({ label, value, sub, accent }) {
  return (
    <div style={{
      background: C.card,
      border: `1px solid ${C.border}`,
      borderRadius: RADIUS.md,
      padding: '12px 14px',
      minWidth: 0,
    }}>
      <div style={{
        fontSize: 10, color: C.muted, fontFamily: FONT.mono,
        textTransform: 'uppercase', letterSpacing: '.07em',
        fontWeight: FONT_WEIGHT.semibold,
      }}>{label}</div>
      <div style={{
        fontSize: 22, fontWeight: FONT_WEIGHT.bold,
        color: accent || C.text, marginTop: 4, lineHeight: 1.1,
      }}>{value}</div>
      {sub && (
        <div style={{
          fontSize: 11, color: C.muted, marginTop: 2,
          fontFamily: FONT.mono,
        }}>{sub}</div>
      )}
    </div>
  )
}

// ─── Componente raíz ────────────────────────────────────────────────
export default function AgendaPanel() {
  const nav = useNavigate()
  const layout = useLayout()

  const [loading, setLoading]               = useState(true)
  const [error, setError]                   = useState(null)
  const [appointments, setAppointments]     = useState([])
  const [workingHours, setWorkingHours]     = useState([])

  // Vista actual: 'day' | 'week' | 'month'
  // En mobile forzamos 'day' por espacio.
  const [viewMode, setViewMode]             = useState(layout === 'mobile' ? 'day' : 'week')
  useEffect(() => {
    if (layout === 'mobile' && viewMode === 'week') setViewMode('day')
  }, [layout])

  // Cursor de fecha (día actual seleccionado)
  const [cursor, setCursor]                 = useState(() => new Date())

  // Búsqueda y filtros
  const [search, setSearch]                 = useState('')
  const [statusFilter, setStatusFilter]     = useState([]) // [] = todos

  // Modales
  const [editing, setEditing]               = useState(null)
  const [blocking, setBlocking]             = useState(false)
  const [hoursOpen, setHoursOpen]           = useState(false)
  const [actionMenu, setActionMenu]         = useState(null) // { appointment, x, y }

  // Cálculo de rango a cargar según vista
  const dataRange = useMemo(() => {
    if (viewMode === 'day') {
      return { from: dayStart(cursor), to: dayStart(addDays(cursor, 1)) }
    }
    if (viewMode === 'week') {
      const ws = startOfWeek(cursor)
      return { from: dayStart(ws), to: dayStart(addDays(ws, 7)) }
    }
    // month: cargamos el mes con padding para mostrar bordes
    const monthStart = startOfMonth(cursor)
    const monthEnd = endOfMonth(cursor)
    return { from: dayStart(addDays(monthStart, -7)), to: dayStart(addDays(monthEnd, 8)) }
  }, [viewMode, cursor])

  const reload = async () => {
    setLoading(true); setError(null)
    try {
      const [{ data: apps, error: aErr }, { data: wh, error: whErr }] = await Promise.all([
        supabase.rpc('list_my_appointments', {
          p_from: dataRange.from.toISOString(),
          p_to:   dataRange.to.toISOString(),
        }),
        supabase.rpc('get_my_working_hours'),
      ])
      if (aErr)  throw aErr
      if (whErr) throw whErr
      setAppointments(apps || [])
      setWorkingHours(wh || [])
    } catch (e) {
      setError(e.message || 'Error al cargar la agenda')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { reload() /* eslint-disable-next-line */ }, [viewMode, cursor.getFullYear(), cursor.getMonth(), cursor.getDate()])

  // Filtrado client-side
  const filteredAppointments = useMemo(() => {
    const q = search.trim().toLowerCase()
    return appointments.filter(a => {
      if (statusFilter.length > 0 && !isBlock(a) && !statusFilter.includes(a.status)) return false
      if (!q) return true
      const haystack = [
        a.client_name, a.client_phone, a.client_notes,
      ].filter(Boolean).join(' ').toLowerCase()
      return haystack.includes(q)
    })
  }, [appointments, search, statusFilter])

  // Agrupar por día (sobre filtered, para vistas)
  const appsByDay = useMemo(() => {
    const map = {}
    for (const a of filteredAppointments) {
      const key = toLocalIsoDate(new Date(a.starts_at))
      if (!map[key]) map[key] = []
      map[key].push(a)
    }
    for (const k of Object.keys(map)) {
      map[k].sort((a,b) => new Date(a.starts_at) - new Date(b.starts_at))
    }
    return map
  }, [filteredAppointments])

  // KPIs (calculados sobre TODOS los appointments del rango, no los filtrados)
  const kpis = useMemo(() => {
    const todayKey = toLocalIsoDate(new Date())
    const wsKey = toLocalIsoDate(startOfWeek(new Date()))
    const weKey = toLocalIsoDate(addDays(startOfWeek(new Date()), 6))
    let today = 0, week = 0, confirmed = 0, total = 0, noShow = 0
    for (const a of appointments) {
      if (isBlock(a)) continue
      const k = toLocalIsoDate(new Date(a.starts_at))
      if (k === todayKey) today++
      if (k >= wsKey && k <= weKey) week++
      if (a.status === 'confirmed') confirmed++
      if (a.status === 'no_show') noShow++
      total++
    }
    const noShowRate = total > 0 ? Math.round((noShow / total) * 100) : 0
    return { today, week, confirmed, noShowRate }
  }, [appointments])

  // Counts por estado (para los chips)
  const statusCounts = useMemo(() => {
    const c = { pending:0, confirmed:0, completed:0, cancelled:0, no_show:0 }
    for (const a of appointments) {
      if (isBlock(a)) continue
      if (c[a.status] !== undefined) c[a.status]++
    }
    return c
  }, [appointments])

  // Toggle estado en filtro
  const toggleStatus = (s) => {
    setStatusFilter(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }

  // Navegación temporal
  const navPrev = () => {
    if (viewMode === 'day')   setCursor(addDays(cursor, -1))
    if (viewMode === 'week')  setCursor(addDays(cursor, -7))
    if (viewMode === 'month') setCursor(addMonths(cursor, -1))
  }
  const navNext = () => {
    if (viewMode === 'day')   setCursor(addDays(cursor, 1))
    if (viewMode === 'week')  setCursor(addDays(cursor, 7))
    if (viewMode === 'month') setCursor(addMonths(cursor, 1))
  }
  const navToday = () => setCursor(new Date())

  // Label de rango (top right)
  const rangeLabel = useMemo(() => {
    if (viewMode === 'day') {
      return `${DAYS_ES_MED[cursor.getDay()]}, ${cursor.getDate()} ${MONTHS_ES_SHORT[cursor.getMonth()]}`
    }
    if (viewMode === 'week') {
      const ws = startOfWeek(cursor)
      const we = addDays(ws, 6)
      return `${ws.getDate()} ${MONTHS_ES_SHORT[ws.getMonth()]} — ${we.getDate()} ${MONTHS_ES_SHORT[we.getMonth()]}`
    }
    return `${MONTHS_ES[cursor.getMonth()]} ${cursor.getFullYear()}`
  }, [viewMode, cursor])

  return (
    <div style={{ width: '100%' }}>
      <PageHeader
        eyebrow="AGENDA"
        title="Agenda"
        subtitle="Gestioná tus turnos, configurá horarios y bloqueá tiempo personal."
      />

      {error && <Banner kind="error" style={{ marginBottom: 12 }}>{error}</Banner>}

      {/* KPIs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: 10, marginBottom: 16,
      }}>
        <StatTile label="Hoy"          value={kpis.today}     sub={kpis.today === 1 ? 'turno' : 'turnos'} />
        <StatTile label="En vista"     value={kpis.week}      sub="turnos cargados" />
        <StatTile label="Confirmados"  value={kpis.confirmed} accent="#3DD68C" />
        <StatTile label="Tasa no-show" value={`${kpis.noShowRate}%`} accent={kpis.noShowRate > 10 ? '#F4B740' : '#3DD68C'} />
      </div>

      {/* Toolbar fila 1: navegación + vistas */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        flexWrap: 'wrap', marginBottom: 12,
      }}>
        <div style={{ display: 'flex', gap: 4 }}>
          <TBtn onClick={navPrev}  title="Anterior">←</TBtn>
          <TBtn onClick={navToday} title="Volver a hoy">Hoy</TBtn>
          <TBtn onClick={navNext}  title="Siguiente">→</TBtn>
        </div>

        {/* Switcher de vistas */}
        <div style={{
          display: 'flex',
          background: C.surface2,
          border: `1px solid ${C.border}`,
          borderRadius: RADIUS.sm,
          padding: 2,
        }}>
          {layout !== 'mobile' && (
            <>
              <ViewBtn active={viewMode === 'day'}   onClick={() => setViewMode('day')}>Día</ViewBtn>
              <ViewBtn active={viewMode === 'week'}  onClick={() => setViewMode('week')}>Semana</ViewBtn>
              <ViewBtn active={viewMode === 'month'} onClick={() => setViewMode('month')}>Mes</ViewBtn>
            </>
          )}
          {layout === 'mobile' && (
            <>
              <ViewBtn active={viewMode === 'day'}   onClick={() => setViewMode('day')}>Día</ViewBtn>
              <ViewBtn active={viewMode === 'month'} onClick={() => setViewMode('month')}>Mes</ViewBtn>
            </>
          )}
        </div>

        <div style={{
          flex: 1, fontSize: FONT_SIZE.sm, color: C.muted,
          fontFamily: FONT.mono, textAlign: 'right',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{rangeLabel}</div>
      </div>

      {/* Toolbar fila 2: búsqueda + acciones */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        flexWrap: 'wrap', marginBottom: 12,
      }}>
        <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 320 }}>
          <span aria-hidden style={{
            position: 'absolute', left: 10, top: '50%',
            transform: 'translateY(-50%)', color: C.muted, fontSize: 14,
          }}>🔍</span>
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o teléfono..."
            style={{
              width: '100%', boxSizing: 'border-box',
              background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: RADIUS.sm, padding: '7px 10px 7px 32px',
              color: C.text, fontSize: FONT_SIZE.sm, outline: 'none',
              fontFamily: 'inherit',
            }}
          />
        </div>
        <div style={{ flex: 1 }} />
        <TBtn onClick={() => setHoursOpen(true)} icon="⚙" title="Horarios de atención">Horarios</TBtn>
        <TBtn onClick={() => nav('configuracion')} icon="⚙" title="Configuración completa">Configurar</TBtn>
        <TBtn onClick={() => setBlocking(true)} icon="🔒" title="Bloquear tiempo (vacaciones, almuerzo)">Bloquear</TBtn>
        <Button size="sm" variant="primary" onClick={() => setEditing({ mode:'new' })}>
          + Nuevo turno
        </Button>
      </div>

      {/* Toolbar fila 3: chips de filtro de estado */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        flexWrap: 'wrap', marginBottom: 16,
      }}>
        <span style={{
          fontSize: 10, color: C.dim, fontFamily: FONT.mono,
          textTransform: 'uppercase', letterSpacing: '.06em',
          fontWeight: FONT_WEIGHT.semibold,
        }}>Estado:</span>
        {Object.entries(STATUS_META).map(([key, meta]) => {
          const active = statusFilter.includes(key)
          const count = statusCounts[key] ?? 0
          return (
            <button
              key={key} onClick={() => toggleStatus(key)}
              style={{
                background: active ? meta.soft : 'transparent',
                border: `1px solid ${active ? meta.border : C.border}`,
                color: active ? meta.color : C.muted,
                padding: '3px 10px', borderRadius: 999,
                fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
                fontWeight: active ? FONT_WEIGHT.semibold : FONT_WEIGHT.medium,
                display: 'inline-flex', alignItems: 'center', gap: 5,
              }}
            >
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: meta.color, display: 'inline-block',
              }} />
              {meta.label}
              <span style={{ opacity: 0.7, fontFamily: FONT.mono }}>{count}</span>
            </button>
          )
        })}
        {statusFilter.length > 0 && (
          <button
            onClick={() => setStatusFilter([])}
            style={{
              background: 'transparent', border: 'none',
              color: C.muted, fontSize: 11, cursor: 'pointer',
              textDecoration: 'underline', fontFamily: 'inherit',
              marginLeft: 4,
            }}
          >Limpiar</button>
        )}
      </div>

      {loading && (
        <div style={{
          padding: 40, textAlign: 'center',
          color: C.muted, fontSize: FONT_SIZE.sm,
        }}>Cargando agenda…</div>
      )}

      {!loading && viewMode === 'day' && (
        <DayView
          date={cursor}
          appsByDay={appsByDay}
          workingHours={workingHours}
          onAppointmentClick={(a, evt) => setActionMenu({ appointment: a, x: evt.clientX, y: evt.clientY })}
          onEmptySlotClick={(date) => setEditing({ mode:'new', defaultStart: date })}
        />
      )}
      {!loading && viewMode === 'week' && (
        <WeekView
          cursor={cursor}
          appsByDay={appsByDay}
          workingHours={workingHours}
          layout={layout}
          onAppointmentClick={(a, evt) => setActionMenu({ appointment: a, x: evt.clientX, y: evt.clientY })}
          onDayClick={(d) => { setCursor(d); setViewMode('day') }}
          onNewInDay={(d) => setEditing({ mode:'new', defaultStart: d })}
        />
      )}
      {!loading && viewMode === 'month' && (
        <MonthView
          cursor={cursor}
          appsByDay={appsByDay}
          workingHours={workingHours}
          onDayClick={(d) => { setCursor(d); setViewMode('day') }}
        />
      )}

      {editing && (
        <AppointmentModal
          mode={editing.mode}
          appointment={editing.appointment}
          defaultStart={editing.defaultStart}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); reload() }}
        />
      )}

      {blocking && (
        <BlockTimeModal
          defaultDate={cursor}
          onClose={() => setBlocking(false)}
          onSaved={() => { setBlocking(false); reload() }}
        />
      )}

      {hoursOpen && (
        <WorkingHoursDrawer
          current={workingHours}
          onClose={() => setHoursOpen(false)}
          onSaved={() => { setHoursOpen(false); reload() }}
        />
      )}

      {actionMenu && (
        <AppointmentActionMenu
          appointment={actionMenu.appointment}
          x={actionMenu.x} y={actionMenu.y}
          onClose={() => setActionMenu(null)}
          onAction={async (kind) => {
            const a = actionMenu.appointment
            setActionMenu(null)
            if (kind === 'edit') {
              setEditing({ mode:'edit', appointment: a })
              return
            }
            if (kind === 'remind') {
              // Abre WhatsApp con mensaje prellenado
              const phone = (a.client_phone || '').replace(/\D/g, '')
              if (!phone) { alert('Este turno no tiene teléfono.'); return }
              const dt = new Date(a.starts_at)
              const when = `${DAYS_ES_MED[dt.getDay()]} ${dt.getDate()}/${dt.getMonth()+1} a las ${toLocalTime(a.starts_at)}`
              const msg = `Hola ${a.client_name}! Te recuerdo tu turno: ${when}. ¡Te esperamos!`
              window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank')
              return
            }
            // Cambio de estado
            try {
              const newStatus = kind  // 'confirmed'|'completed'|'cancelled'|'no_show'
              const startsAt = new Date(a.starts_at).toISOString()
              const { error } = await supabase.rpc('update_appointment', {
                p_appointment_id: a.id,
                p_client_name:    a.client_name,
                p_client_phone:   a.client_phone || null,
                p_client_notes:   a.client_notes || null,
                p_starts_at:      startsAt,
                p_duration_min:   a.duration_min,
                p_status:         newStatus,
                p_cancellation_reason: newStatus === 'cancelled' ? 'Cancelado desde acción rápida' : null,
              })
              if (error) throw error
              await reload()
            } catch (e) {
              alert('Error: ' + (e.message || 'No se pudo actualizar'))
            }
          }}
          onDelete={async () => {
            const a = actionMenu.appointment
            setActionMenu(null)
            if (!confirm('¿Eliminar este turno definitivamente?')) return
            try {
              const { error } = await supabase.rpc('delete_appointment', { p_appointment_id: a.id })
              if (error) throw error
              await reload()
            } catch (e) {
              alert('Error: ' + (e.message || 'No se pudo eliminar'))
            }
          }}
        />
      )}
    </div>
  )
}

function ViewBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? C.primary : 'transparent',
        border: 'none',
        color: active ? '#fff' : C.muted,
        padding: '5px 14px',
        fontSize: 12, cursor: 'pointer',
        borderRadius: 6,
        fontWeight: active ? FONT_WEIGHT.semibold : FONT_WEIGHT.medium,
        fontFamily: 'inherit',
      }}
    >{children}</button>
  )
}

// ─── Vista DÍA: timeline vertical con horas ─────────────────────────
function DayView({ date, appsByDay, workingHours, onAppointmentClick, onEmptySlotClick }) {
  const dow = date.getDay()
  const wh = workingHours.find(w => w.day_of_week === dow)
  const isOpen = wh?.is_open !== false
  const key = toLocalIsoDate(date)
  const dayApps = appsByDay[key] || []
  const isToday = sameDay(date, new Date())

  // Rango de horas a mostrar: 6 a 23 si no hay horario, sino el horario
  const startHour = isOpen && wh?.open_time ? Math.max(0, parseInt(wh.open_time.slice(0,2)) - 1) : 7
  const endHour   = isOpen && wh?.close_time ? Math.min(23, parseInt(wh.close_time.slice(0,2)) + 2) : 22
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i)
  const HOUR_HEIGHT = 60

  // Hora actual (línea roja "now")
  const now = new Date()
  const showNowLine = isToday
  const nowMinutes = minutesSinceMidnight(now.toISOString())
  const nowTop = ((nowMinutes - startHour * 60) / 60) * HOUR_HEIGHT

  const handleSlotClick = (h, mm) => {
    if (!isOpen) return
    const d = new Date(date)
    d.setHours(h, mm, 0, 0)
    onEmptySlotClick(d)
  }

  return (
    <div style={{
      background: C.card,
      border: `1px solid ${isToday ? C.primary : C.border}`,
      borderRadius: RADIUS.lg,
      overflow: 'hidden',
    }}>
      {/* Header del día */}
      <div style={{
        padding: '12px 16px',
        borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'baseline', gap: 10,
        background: isToday ? `${C.primary}11` : 'transparent',
      }}>
        <span style={{
          fontSize: 11, color: isToday ? C.primary : C.muted,
          fontFamily: FONT.mono, textTransform: 'uppercase',
          letterSpacing: '.07em', fontWeight: FONT_WEIGHT.bold,
        }}>{DAYS_ES_SHORT[dow]}</span>
        <span style={{
          fontSize: 20, fontWeight: FONT_WEIGHT.bold,
          color: isToday ? C.primary : C.text,
        }}>{date.getDate()}</span>
        <span style={{ fontSize: FONT_SIZE.sm, color: C.muted }}>
          de {MONTHS_ES[date.getMonth()]}
        </span>
        {isToday && (
          <span style={{
            padding: '2px 8px', borderRadius: 999,
            background: C.primary, color: '#fff',
            fontSize: 9, fontWeight: FONT_WEIGHT.bold,
            textTransform: 'uppercase', letterSpacing: '.05em',
            fontFamily: FONT.mono,
          }}>HOY</span>
        )}
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: FONT_SIZE.xs, color: C.muted, fontFamily: FONT.mono }}>
          {isOpen && wh ? `${wh.open_time}–${wh.close_time}` : 'Cerrado'}
          {dayApps.length > 0 && ` · ${dayApps.length} ${dayApps.length === 1 ? 'turno' : 'turnos'}`}
        </span>
      </div>

      {/* Timeline */}
      <div style={{ position: 'relative', display: 'flex' }}>
        {/* Columna horas */}
        <div style={{ flexShrink: 0, width: 60, borderRight: `1px solid ${C.border}` }}>
          {hours.map(h => (
            <div key={h} style={{
              height: HOUR_HEIGHT,
              padding: '4px 8px',
              fontSize: 10, color: C.dim,
              fontFamily: FONT.mono, textAlign: 'right',
              borderBottom: `0.5px solid ${C.border}`,
            }}>{String(h).padStart(2,'0')}:00</div>
          ))}
        </div>

        {/* Área de turnos */}
        <div style={{
          flex: 1, position: 'relative',
          minHeight: hours.length * HOUR_HEIGHT,
        }}>
          {/* Líneas de hora background */}
          {hours.map((h, i) => (
            <div key={h}
              onClick={() => handleSlotClick(h, 0)}
              style={{
                position: 'absolute', left: 0, right: 0,
                top: i * HOUR_HEIGHT, height: HOUR_HEIGHT,
                borderBottom: `0.5px solid ${C.border}`,
                cursor: isOpen ? 'pointer' : 'default',
                transition: 'background .12s',
              }}
              onMouseEnter={(e) => { if (isOpen) e.currentTarget.style.background = `${C.primary}08` }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            />
          ))}

          {/* Día cerrado: overlay diagonal */}
          {!isOpen && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(133,149,181,.06) 10px, rgba(133,149,181,.06) 20px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: C.muted, fontSize: FONT_SIZE.sm, fontStyle: 'italic',
              pointerEvents: 'none',
            }}>Día cerrado</div>
          )}

          {/* Turnos */}
          {dayApps.map(a => {
            const start = minutesSinceMidnight(a.starts_at)
            const end = start + (a.duration_min || 30)
            const top    = ((start - startHour * 60) / 60) * HOUR_HEIGHT
            const height = ((end - start) / 60) * HOUR_HEIGHT
            return (
              <AppointmentBlock
                key={a.id} appointment={a}
                style={{
                  position: 'absolute', top, height: Math.max(height - 2, 22),
                  left: 6, right: 6,
                }}
                onClick={(e) => onAppointmentClick(a, e)}
                expanded
              />
            )
          })}

          {/* Línea "ahora" */}
          {showNowLine && nowTop >= 0 && nowTop <= hours.length * HOUR_HEIGHT && (
            <div style={{
              position: 'absolute', left: 0, right: 0, top: nowTop,
              height: 2, background: '#E84545', zIndex: 5,
              pointerEvents: 'none',
            }}>
              <div style={{
                position: 'absolute', left: -5, top: -4,
                width: 10, height: 10, borderRadius: '50%',
                background: '#E84545',
              }} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Vista SEMANA: timeline horizontal con 7 columnas ───────────────
function WeekView({ cursor, appsByDay, workingHours, layout, onAppointmentClick, onDayClick, onNewInDay }) {
  const ws = startOfWeek(cursor)
  const days = Array.from({ length: 7 }, (_, i) => addDays(ws, i))
  const todayKey = toLocalIsoDate(new Date())

  // En tablet, lista vertical. En desktop, grid horizontal con timeline.
  if (layout === 'tablet') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {days.map(d => (
          <DayCardCompact
            key={toLocalIsoDate(d)} date={d}
            appsByDay={appsByDay} workingHours={workingHours}
            onAppointmentClick={onAppointmentClick}
            onNewInDay={onNewInDay}
          />
        ))}
      </div>
    )
  }

  // Desktop: timeline horizontal estilo Google Cal
  // Horas mostradas: rango de min/max apertura+cierre, con padding
  const allOpens = workingHours.filter(w => w.is_open).map(w => parseInt(w.open_time.slice(0,2)))
  const allCloses = workingHours.filter(w => w.is_open).map(w => parseInt(w.close_time.slice(0,2)))
  const startHour = allOpens.length ? Math.max(0, Math.min(...allOpens) - 1) : 7
  const endHour   = allCloses.length ? Math.min(23, Math.max(...allCloses) + 1) : 21
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i)
  const HOUR_HEIGHT = 50

  return (
    <div style={{
      background: C.card,
      border: `1px solid ${C.border}`,
      borderRadius: RADIUS.lg,
      overflow: 'hidden',
    }}>
      {/* Headers de días */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `60px repeat(7, 1fr)`,
        borderBottom: `1px solid ${C.border}`,
      }}>
        <div />
        {days.map(d => {
          const isToday = toLocalIsoDate(d) === todayKey
          const dow = d.getDay()
          const dayApps = appsByDay[toLocalIsoDate(d)] || []
          return (
            <button key={d.getDate()}
              onClick={() => onDayClick(d)}
              style={{
                padding: '10px 6px', textAlign: 'center',
                borderLeft: `1px solid ${C.border}`,
                background: isToday ? `${C.primary}11` : 'transparent',
                cursor: 'pointer', border: 'none',
                borderLeftWidth: 1, borderLeftStyle: 'solid', borderLeftColor: C.border,
                color: C.text, fontFamily: 'inherit',
                transition: 'background .12s',
              }}
              onMouseEnter={(e) => { if (!isToday) e.currentTarget.style.background = `${C.primary}06` }}
              onMouseLeave={(e) => { if (!isToday) e.currentTarget.style.background = 'transparent' }}
              title="Click para vista día"
            >
              <div style={{
                fontSize: 10, color: isToday ? C.primary : C.muted,
                fontFamily: FONT.mono, textTransform: 'uppercase',
                letterSpacing: '.06em', fontWeight: FONT_WEIGHT.semibold,
              }}>{DAYS_ES_SHORT[dow]}</div>
              <div style={{
                fontSize: 17, fontWeight: FONT_WEIGHT.bold,
                color: isToday ? C.primary : C.text, marginTop: 2,
              }}>{d.getDate()}</div>
              {dayApps.length > 0 && (
                <div style={{
                  display: 'inline-block', marginTop: 4,
                  padding: '1px 6px', borderRadius: 999,
                  fontSize: 9, fontFamily: FONT.mono,
                  background: isToday ? C.primary : C.surface2,
                  color: isToday ? '#fff' : C.muted,
                  fontWeight: FONT_WEIGHT.semibold,
                }}>{dayApps.length}</div>
              )}
            </button>
          )
        })}
      </div>

      {/* Timeline body */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `60px repeat(7, 1fr)`,
        position: 'relative',
        minHeight: hours.length * HOUR_HEIGHT,
      }}>
        {/* Columna horas */}
        <div>
          {hours.map(h => (
            <div key={h} style={{
              height: HOUR_HEIGHT, padding: '3px 8px',
              fontSize: 10, color: C.dim,
              fontFamily: FONT.mono, textAlign: 'right',
              borderBottom: `0.5px solid ${C.border}`,
            }}>{String(h).padStart(2,'0')}:00</div>
          ))}
        </div>

        {/* Columnas de días */}
        {days.map(d => {
          const dow = d.getDay()
          const wh = workingHours.find(w => w.day_of_week === dow)
          const isOpen = wh?.is_open !== false
          const isToday = toLocalIsoDate(d) === todayKey
          const dayApps = appsByDay[toLocalIsoDate(d)] || []

          return (
            <div key={d.getDate()} style={{
              position: 'relative',
              borderLeft: `1px solid ${C.border}`,
              background: isToday ? `${C.primary}06` : 'transparent',
            }}>
              {/* Líneas hora */}
              {hours.map((h, i) => (
                <div key={h} style={{
                  position: 'absolute', left: 0, right: 0,
                  top: i * HOUR_HEIGHT, height: HOUR_HEIGHT,
                  borderBottom: `0.5px solid ${C.border}`,
                }} />
              ))}

              {/* Día cerrado overlay */}
              {!isOpen && (
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(133,149,181,.06) 8px, rgba(133,149,181,.06) 16px)',
                  pointerEvents: 'none',
                }} />
              )}

              {/* Botón + nuevo en día (top centro) */}
              {isOpen && (
                <button
                  onClick={() => onNewInDay(d)}
                  style={{
                    position: 'absolute', top: 4, left: '50%',
                    transform: 'translateX(-50%)',
                    padding: '2px 8px', fontSize: 10,
                    background: `${C.primary}22`,
                    border: `1px solid ${C.primary}55`,
                    color: C.primaryLite, borderRadius: RADIUS.sm,
                    cursor: 'pointer', fontFamily: 'inherit',
                    fontWeight: FONT_WEIGHT.semibold,
                    opacity: 0, transition: 'opacity .12s',
                    zIndex: 4,
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                  className="week-add-btn"
                >+ turno</button>
              )}

              {/* Turnos del día */}
              {dayApps.map(a => {
                const start = minutesSinceMidnight(a.starts_at)
                const end = start + (a.duration_min || 30)
                const top    = ((start - startHour * 60) / 60) * HOUR_HEIGHT
                const height = ((end - start) / 60) * HOUR_HEIGHT
                if (top + height < 0 || top > hours.length * HOUR_HEIGHT) return null
                return (
                  <AppointmentBlock
                    key={a.id} appointment={a}
                    style={{
                      position: 'absolute', top, height: Math.max(height - 2, 18),
                      left: 2, right: 2,
                    }}
                    onClick={(e) => onAppointmentClick(a, e)}
                    compact
                  />
                )
              })}
            </div>
          )
        })}
      </div>
      <style>{`
        .week-add-btn { opacity: 0 }
        [class*="week-add-btn"]:hover { opacity: 1 !important }
        div:hover > .week-add-btn { opacity: 0.5 }
      `}</style>
    </div>
  )
}

// Card compacta para tablet/mobile
function DayCardCompact({ date, appsByDay, workingHours, onAppointmentClick, onNewInDay }) {
  const dow = date.getDay()
  const wh = workingHours.find(w => w.day_of_week === dow)
  const isOpen = wh?.is_open !== false
  const key = toLocalIsoDate(date)
  const dayApps = appsByDay[key] || []
  const isToday = sameDay(date, new Date())

  return (
    <div style={{
      background: C.card,
      border: `1px solid ${isToday ? C.primary : C.border}`,
      borderRadius: RADIUS.md, overflow: 'hidden',
    }}>
      <div style={{
        padding: '10px 14px',
        display: 'flex', alignItems: 'center', gap: 10,
        borderBottom: dayApps.length > 0 ? `1px solid ${C.border}` : 'none',
        background: isToday ? `${C.primary}11` : 'transparent',
      }}>
        <div style={{ flexShrink: 0, minWidth: 50 }}>
          <div style={{
            fontSize: 10, fontFamily: FONT.mono, textTransform: 'uppercase',
            color: isToday ? C.primary : C.muted, fontWeight: FONT_WEIGHT.bold,
          }}>{DAYS_ES_SHORT[dow]}</div>
          <div style={{
            fontSize: 18, fontWeight: FONT_WEIGHT.bold,
            color: isToday ? C.primary : C.text,
          }}>{date.getDate()}</div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: FONT_SIZE.sm, color: C.text, fontWeight: FONT_WEIGHT.semibold }}>
            {DAYS_ES[dow]} {date.getDate()}/{date.getMonth()+1}
            {isToday && <span style={{ marginLeft: 8, fontSize: 9, padding: '1px 6px', borderRadius: 999, background: C.primary, color: '#fff', fontFamily: FONT.mono }}>HOY</span>}
          </div>
          <div style={{ fontSize: FONT_SIZE.xs, color: C.muted, fontFamily: FONT.mono, marginTop: 2 }}>
            {isOpen && wh ? `${wh.open_time}–${wh.close_time}` : 'Cerrado'}
            {dayApps.length > 0 && ` · ${dayApps.length} ${dayApps.length === 1 ? 'turno' : 'turnos'}`}
          </div>
        </div>
        {isOpen && (
          <button onClick={() => onNewInDay(date)}
            style={{
              padding: '4px 10px', borderRadius: RADIUS.sm,
              background: `${C.primary}22`, border: `1px solid ${C.primary}55`,
              color: C.primaryLite, fontSize: 11, fontWeight: FONT_WEIGHT.semibold,
              cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
            }}>+ Turno</button>
        )}
      </div>

      {dayApps.length > 0 && (
        <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 5 }}>
          {dayApps.map(a => (
            <AppointmentBlock
              key={a.id} appointment={a}
              onClick={(e) => onAppointmentClick(a, e)}
              inline
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Vista MES: grilla 7x6 estilo Google Calendar ───────────────────
function MonthView({ cursor, appsByDay, workingHours, onDayClick }) {
  const monthStart = startOfMonth(cursor)
  // Empezar la grilla en lunes
  const gridStart = startOfWeek(monthStart)
  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))
  const todayKey = toLocalIsoDate(new Date())
  const monthIdx = cursor.getMonth()

  return (
    <div style={{
      background: C.card,
      border: `1px solid ${C.border}`,
      borderRadius: RADIUS.lg, overflow: 'hidden',
    }}>
      {/* Header días */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
        borderBottom: `1px solid ${C.border}`,
      }}>
        {['LUN','MAR','MIÉ','JUE','VIE','SÁB','DOM'].map((d, i) => (
          <div key={d} style={{
            padding: '8px 6px', textAlign: 'center',
            fontSize: 10, color: C.muted,
            fontFamily: FONT.mono, fontWeight: FONT_WEIGHT.semibold,
            letterSpacing: '.07em',
            borderLeft: i > 0 ? `1px solid ${C.border}` : 'none',
          }}>{d}</div>
        ))}
      </div>

      {/* Grilla */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gridAutoRows: 'minmax(90px, auto)',
      }}>
        {days.map((d, i) => {
          const inMonth = d.getMonth() === monthIdx
          const isToday = toLocalIsoDate(d) === todayKey
          const dow = d.getDay()
          const wh = workingHours.find(w => w.day_of_week === dow)
          const isOpen = wh?.is_open !== false
          const dayApps = appsByDay[toLocalIsoDate(d)] || []
          const rowIdx = Math.floor(i / 7)

          return (
            <button key={i}
              onClick={() => onDayClick(d)}
              style={{
                padding: 6, textAlign: 'left',
                border: 'none',
                borderLeft: (i % 7 > 0) ? `0.5px solid ${C.border}` : 'none',
                borderTop: rowIdx > 0 ? `0.5px solid ${C.border}` : 'none',
                background: isToday ? `${C.primary}13` : 'transparent',
                opacity: inMonth ? 1 : 0.35,
                cursor: 'pointer', color: C.text,
                fontFamily: 'inherit',
                display: 'flex', flexDirection: 'column', gap: 2,
                minHeight: 0, overflow: 'hidden',
                transition: 'background .12s',
              }}
              onMouseEnter={(e) => { if (!isToday) e.currentTarget.style.background = `${C.primary}08` }}
              onMouseLeave={(e) => { if (!isToday) e.currentTarget.style.background = 'transparent' }}
            >
              <div style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', marginBottom: 2,
              }}>
                <span style={{
                  fontSize: 13, fontWeight: isToday ? FONT_WEIGHT.bold : FONT_WEIGHT.semibold,
                  color: isToday ? C.primary : (inMonth ? C.text : C.dim),
                  fontFamily: FONT.mono,
                  ...(isToday ? {
                    background: C.primary, color: '#fff',
                    width: 22, height: 22, borderRadius: '50%',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11,
                  } : {}),
                }}>{d.getDate()}</span>
                {!isOpen && inMonth && (
                  <span style={{ fontSize: 8, color: C.dim }} aria-hidden>×</span>
                )}
              </div>
              {/* Hasta 3 turnos visibles + "+N más" */}
              {dayApps.slice(0, 3).map(a => (
                <MonthAppointmentChip key={a.id} appointment={a} />
              ))}
              {dayApps.length > 3 && (
                <span style={{
                  fontSize: 10, color: C.muted, fontFamily: FONT.mono,
                  paddingLeft: 4,
                }}>+{dayApps.length - 3} más</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function MonthAppointmentChip({ appointment: a }) {
  const block = isBlock(a)
  const meta = block ? BLOCK_META : (STATUS_META[a.status] || STATUS_META.pending)
  const text = block ? blockReason(a) : a.client_name
  return (
    <div style={{
      fontSize: 10, lineHeight: 1.3,
      padding: '1px 5px',
      background: meta.soft,
      borderLeft: `2px solid ${meta.color}`,
      borderRadius: 3,
      color: meta.color,
      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      fontFamily: FONT.mono, fontWeight: FONT_WEIGHT.semibold,
    }}>
      {!block && <span style={{ opacity: 0.7, marginRight: 4 }}>{toLocalTime(a.starts_at)}</span>}
      {text}
    </div>
  )
}

// ─── Bloque visual de turno (compact / expanded / inline) ───────────
function AppointmentBlock({ appointment: a, onClick, style, compact, inline, expanded }) {
  const block = isBlock(a)
  const meta = block ? BLOCK_META : (STATUS_META[a.status] || STATUS_META.pending)
  const cancelled = a.status === 'cancelled' || a.status === 'no_show'

  const displayName = block ? (blockReason(a) || 'Bloqueado') : a.client_name

  return (
    <button
      onClick={onClick}
      style={{
        ...(style || {}),
        background: meta.soft,
        border: `1px solid ${meta.border}`,
        borderLeft: `3px solid ${meta.color}`,
        borderRadius: RADIUS.sm,
        padding: compact ? '3px 6px' : (inline ? '6px 10px' : '6px 10px'),
        cursor: 'pointer',
        textAlign: 'left', color: C.text, fontFamily: 'inherit',
        opacity: cancelled ? 0.6 : 1,
        textDecoration: cancelled ? 'line-through' : 'none',
        overflow: 'hidden',
        boxSizing: 'border-box',
        transition: 'transform .1s, box-shadow .12s',
        ...(block ? {
          background: 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(133,149,181,.10) 4px, rgba(133,149,181,.10) 8px)',
          borderStyle: 'dashed',
        } : {}),
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 0 0 1px ${meta.color}` }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none' }}
    >
      <div style={{
        fontSize: compact ? 10 : 11,
        color: meta.color,
        fontFamily: FONT.mono, fontWeight: FONT_WEIGHT.bold,
        display: 'flex', alignItems: 'center', gap: 4,
        whiteSpace: 'nowrap', overflow: 'hidden',
      }}>
        {block && <span aria-hidden>🔒</span>}
        {!block && (
          <>
            {toLocalTime(a.starts_at)}
            {!compact && a.duration_min && (
              <span style={{ opacity: 0.7, fontSize: compact ? 9 : 10 }}>
                · {a.duration_min}m
              </span>
            )}
          </>
        )}
      </div>
      <div style={{
        fontSize: compact ? 11 : (inline ? FONT_SIZE.sm : FONT_SIZE.sm),
        fontWeight: FONT_WEIGHT.semibold,
        color: C.text, marginTop: 1,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {displayName}
      </div>
      {!compact && !block && a.client_phone && (
        <div style={{
          fontSize: 10, color: C.muted, fontFamily: FONT.mono,
          marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{a.client_phone}</div>
      )}
      {expanded && !block && (
        <div style={{
          marginTop: 4, fontSize: 10, color: meta.color,
          fontFamily: FONT.mono, opacity: 0.85,
        }}>{meta.label}</div>
      )}
    </button>
  )
}

// ─── Menú de acciones rápidas (popover) ─────────────────────────────
function AppointmentActionMenu({ appointment: a, x, y, onClose, onAction, onDelete }) {
  const menuRef = useRef(null)
  const [pos, setPos] = useState(null)

  // Reposiciona el menú dentro del viewport
  useEffect(() => {
    if (!menuRef.current) return
    const rect = menuRef.current.getBoundingClientRect()
    let nx = x, ny = y
    if (x + rect.width > window.innerWidth - 8) nx = window.innerWidth - rect.width - 8
    if (y + rect.height > window.innerHeight - 8) ny = window.innerHeight - rect.height - 8
    if (nx < 8) nx = 8
    if (ny < 8) ny = 8
    setPos({ x: nx, y: ny })
  }, [x, y])

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose()
    }
    const escHandler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', escHandler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('keydown', escHandler)
    }
  }, [onClose])

  const block = isBlock(a)
  const meta = block ? BLOCK_META : (STATUS_META[a.status] || STATUS_META.pending)

  const itemStyle = {
    display: 'flex', alignItems: 'center', gap: 10,
    width: '100%', padding: '9px 14px',
    background: 'transparent', border: 'none',
    color: C.text, fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    cursor: 'pointer', textAlign: 'left',
    fontFamily: 'inherit',
    transition: 'background .12s',
  }

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        left: pos ? pos.x : x, top: pos ? pos.y : y,
        background: C.card, border: `1px solid ${C.borderStrong}`,
        borderRadius: RADIUS.md,
        boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
        minWidth: 240, zIndex: 1000,
        visibility: pos ? 'visible' : 'hidden',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '10px 14px', borderBottom: `1px solid ${C.border}`,
        background: meta.soft,
      }}>
        <div style={{
          fontSize: 10, color: meta.color, fontFamily: FONT.mono,
          textTransform: 'uppercase', fontWeight: FONT_WEIGHT.bold,
          letterSpacing: '.06em',
        }}>{meta.label}</div>
        <div style={{
          fontSize: FONT_SIZE.sm, color: C.text,
          fontWeight: FONT_WEIGHT.semibold, marginTop: 2,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {block ? (blockReason(a) || 'Bloqueado') : a.client_name}
        </div>
        <div style={{ fontSize: FONT_SIZE.xs, color: C.muted, fontFamily: FONT.mono, marginTop: 2 }}>
          {toLocalTime(a.starts_at)} · {a.duration_min}m
        </div>
      </div>

      {!block && (
        <>
          {a.status !== 'confirmed' && a.status !== 'completed' && (
            <button style={itemStyle}
              onClick={() => onAction('confirmed')}
              onMouseEnter={(e) => e.currentTarget.style.background = `${C.primary}11`}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <span aria-hidden style={{ color: '#3DD68C' }}>✓</span>
              Confirmar turno
            </button>
          )}
          {a.status !== 'completed' && (
            <button style={itemStyle}
              onClick={() => onAction('completed')}
              onMouseEnter={(e) => e.currentTarget.style.background = `${C.primary}11`}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <span aria-hidden style={{ color: '#5589E8' }}>✓✓</span>
              Marcar completado
            </button>
          )}
          {a.client_phone && (
            <button style={itemStyle}
              onClick={() => onAction('remind')}
              onMouseEnter={(e) => e.currentTarget.style.background = `${C.primary}11`}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <span aria-hidden>📲</span>
              Enviar recordatorio por WhatsApp
            </button>
          )}
          <button style={itemStyle}
            onClick={() => onAction('edit')}
            onMouseEnter={(e) => e.currentTarget.style.background = `${C.primary}11`}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <span aria-hidden>✏️</span>
            Editar / Reprogramar
          </button>
          {a.status !== 'cancelled' && a.status !== 'no_show' && (
            <>
              <div style={{ height: 1, background: C.border, margin: '4px 0' }} />
              <button style={itemStyle}
                onClick={() => onAction('cancelled')}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(232,69,69,.10)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <span aria-hidden style={{ color: '#E84545' }}>✕</span>
                <span style={{ color: '#E84545' }}>Cancelar turno</span>
              </button>
              <button style={itemStyle}
                onClick={() => onAction('no_show')}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(232,69,69,.10)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <span aria-hidden style={{ color: '#E84545' }}>!</span>
                <span style={{ color: '#E84545' }}>No se presentó</span>
              </button>
            </>
          )}
        </>
      )}

      <div style={{ height: 1, background: C.border }} />
      <button style={itemStyle}
        onClick={onDelete}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(232,69,69,.10)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
      >
        <span aria-hidden style={{ color: '#E84545' }}>🗑</span>
        <span style={{ color: '#E84545' }}>Eliminar permanentemente</span>
      </button>
    </div>
  )
}

// ─── Modal: Nuevo / Editar turno ─────────────────────────────────────
function AppointmentModal({ mode, appointment, defaultStart, onClose, onSaved }) {
  const isEdit = mode === 'edit'

  const initialDate = isEdit
    ? toLocalIsoDate(new Date(appointment.starts_at))
    : toLocalIsoDate(defaultStart || new Date())
  const initialTime = isEdit
    ? toLocalTime(appointment.starts_at)
    : (defaultStart ? toLocalTime(defaultStart.toISOString()) : '10:00')

  const [form, setForm] = useState({
    client_name:  appointment?.client_name  || '',
    client_phone: appointment?.client_phone || '',
    client_notes: appointment?.client_notes || '',
    date:         initialDate,
    time:         initialTime,
    duration_min: appointment?.duration_min || 30,
    status:       appointment?.status || 'pending',
    cancellation_reason: appointment?.cancellation_reason || '',
  })
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const [saving, setSaving] = useState(false)
  const [msg, setMsg]       = useState(null)

  const save = async () => {
    setSaving(true); setMsg(null)
    try {
      if (!form.client_name.trim()) throw new Error('El nombre del cliente es obligatorio')
      if (!form.date || !form.time) throw new Error('Fecha y hora son obligatorias')
      const startsAt = new Date(`${form.date}T${form.time}:00-03:00`).toISOString()

      if (isEdit) {
        const { error } = await supabase.rpc('update_appointment', {
          p_appointment_id: appointment.id,
          p_client_name:    form.client_name,
          p_client_phone:   form.client_phone || null,
          p_client_notes:   form.client_notes || null,
          p_starts_at:      startsAt,
          p_duration_min:   Number(form.duration_min),
          p_status:         form.status,
          p_cancellation_reason: form.status === 'cancelled' ? (form.cancellation_reason || null) : null,
        })
        if (error) throw error
      } else {
        const { error } = await supabase.rpc('create_appointment', {
          p_client_name:    form.client_name,
          p_starts_at:      startsAt,
          p_duration_min:   Number(form.duration_min),
          p_client_phone:   form.client_phone || null,
          p_client_notes:   form.client_notes || null,
        })
        if (error) throw error
      }
      onSaved && onSaved()
    } catch (e) {
      const m = String(e.message || e)
      let friendly = m
      if (m.includes('slot_conflict')) friendly = 'Ya hay un turno o bloqueo en ese horario.'
      else if (m.includes('duration_out_of_range')) friendly = 'La duración debe ser entre 5 minutos y 12 horas.'
      else if (m.includes('client_name_required')) friendly = 'El nombre del cliente es obligatorio.'
      setMsg({ kind: 'error', text: friendly })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={modalHeader}>
          <h3 style={{ margin:0, fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: C.text }}>
            {isEdit ? 'Editar turno' : 'Nuevo turno'}
          </h3>
          <button onClick={onClose} style={closeBtn}>×</button>
        </div>

        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field label="Nombre del cliente *">
            <input value={form.client_name} onChange={set('client_name')} style={fi} placeholder="Ej: Juan Pérez" autoFocus />
          </Field>

          <Field label="Teléfono" hint="Opcional, con código de país (para recordatorios WA)">
            <input value={form.client_phone} onChange={set('client_phone')} style={fi} placeholder="+5491141414141" />
          </Field>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: 10,
          }}>
            <Field label="Fecha *">
              <input type="date" value={form.date} onChange={set('date')} style={fi} />
            </Field>
            <Field label="Hora *">
              <input type="time" value={form.time} onChange={set('time')} style={fi} />
            </Field>
            <Field label="Duración (min) *">
              <input type="number" min="5" max="720" step="5" value={form.duration_min} onChange={set('duration_min')} style={fi} />
            </Field>
          </div>

          {isEdit && (
            <Field label="Estado">
              <select value={form.status} onChange={set('status')} style={fi}>
                <option value="pending">Pendiente</option>
                <option value="confirmed">Confirmado</option>
                <option value="completed">Completado</option>
                <option value="cancelled">Cancelado</option>
                <option value="no_show">No se presentó</option>
              </select>
            </Field>
          )}

          {isEdit && form.status === 'cancelled' && (
            <Field label="Motivo de cancelación">
              <input value={form.cancellation_reason} onChange={set('cancellation_reason')} style={fi} placeholder="Opcional" />
            </Field>
          )}

          <Field label="Notas">
            <textarea value={form.client_notes} onChange={set('client_notes')} style={{...fi, minHeight: 70, fontFamily: 'inherit'}} placeholder="Servicio solicitado, comentarios..." />
          </Field>

          {msg && (
            <div style={{
              padding: '8px 12px', borderRadius: RADIUS.sm,
              background: msg.kind === 'error' ? C.dangerSoft : C.successSoft,
              color:      msg.kind === 'error' ? C.danger     : C.success,
              fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold,
            }}>{msg.text}</div>
          )}

          <div style={{
            display: 'flex', gap: 8,
            justifyContent: 'flex-end', marginTop: 4,
            flexWrap: 'wrap',
          }}>
            <Button variant="ghost" size="sm" onClick={onClose} disabled={saving}>Cancelar</Button>
            <Button variant="primary" size="sm" onClick={save} disabled={saving} loading={saving}>
              {saving ? 'Guardando…' : (isEdit ? 'Guardar' : 'Crear turno')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Modal: Bloquear tiempo ─────────────────────────────────────────
function BlockTimeModal({ defaultDate, onClose, onSaved }) {
  const today = toLocalIsoDate(defaultDate || new Date())
  const [form, setForm] = useState({
    reason: 'Almuerzo',
    date: today,
    end_date: today,
    time: '12:00',
    duration_min: 60,
    repeat: 'once', // once | daily
  })
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const [saving, setSaving] = useState(false)
  const [msg, setMsg]       = useState(null)

  const presetReasons = ['Almuerzo', 'Vacaciones', 'Personal', 'Reunión interna', 'Capacitación']

  const save = async () => {
    setSaving(true); setMsg(null)
    try {
      if (!form.reason.trim()) throw new Error('El motivo es obligatorio')
      if (!form.date || !form.time) throw new Error('Fecha y hora son obligatorias')

      // Construir lista de fechas a bloquear
      const dates = []
      if (form.repeat === 'once') {
        dates.push(form.date)
      } else {
        // daily: desde date hasta end_date
        const start = new Date(`${form.date}T00:00:00-03:00`)
        const end   = new Date(`${form.end_date}T00:00:00-03:00`)
        if (end < start) throw new Error('La fecha "hasta" debe ser mayor o igual')
        let cur = new Date(start)
        let safety = 0
        while (cur <= end && safety < 90) {
          dates.push(toLocalIsoDate(cur))
          cur = addDays(cur, 1)
          safety++
        }
      }

      // Crear un appointment por fecha con prefix [BLOQUEADO]
      const errors = []
      for (const dStr of dates) {
        const startsAt = new Date(`${dStr}T${form.time}:00-03:00`).toISOString()
        const { error } = await supabase.rpc('create_appointment', {
          p_client_name:    `${BLOCK_PREFIX}: ${form.reason}`,
          p_starts_at:      startsAt,
          p_duration_min:   Number(form.duration_min),
          p_client_phone:   null,
          p_client_notes:   `Bloqueo automático: ${form.reason}`,
        })
        if (error) errors.push(`${dStr}: ${error.message}`)
      }

      if (errors.length === dates.length) {
        throw new Error('No se pudo crear ningún bloqueo:\n' + errors.join('\n'))
      }
      if (errors.length > 0) {
        setMsg({ kind: 'warn', text: `Se crearon ${dates.length - errors.length} de ${dates.length} bloqueos. ${errors.length} fallaron por conflicto con turnos existentes.` })
        setTimeout(() => { onSaved && onSaved() }, 1800)
        return
      }
      onSaved && onSaved()
    } catch (e) {
      setMsg({ kind: 'error', text: e.message || 'Error al bloquear' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={modalHeader}>
          <h3 style={{ margin:0, fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: C.text }}>
            🔒 Bloquear tiempo
          </h3>
          <button onClick={onClose} style={closeBtn}>×</button>
        </div>

        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ margin: 0, fontSize: FONT_SIZE.sm, color: C.muted, lineHeight: 1.5 }}>
            Reservá un horario para tu tiempo personal. Los clientes no podrán reservar
            turnos en este rango.
          </p>

          <Field label="Motivo">
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
              {presetReasons.map(r => (
                <button key={r}
                  onClick={() => setForm(f => ({ ...f, reason: r }))}
                  style={{
                    padding: '4px 10px',
                    background: form.reason === r ? C.primarySoft : C.surface2,
                    border: `1px solid ${form.reason === r ? C.primary : C.border}`,
                    color: form.reason === r ? C.primaryLite : C.muted,
                    borderRadius: 999, fontSize: 11, cursor: 'pointer',
                    fontFamily: 'inherit', fontWeight: FONT_WEIGHT.medium,
                  }}>{r}</button>
              ))}
            </div>
            <input value={form.reason} onChange={set('reason')} style={fi} placeholder="O escribilo libre" />
          </Field>

          <Field label="¿Repetir?">
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => setForm(f => ({ ...f, repeat: 'once' }))}
                style={{
                  flex: 1, padding: '8px 12px',
                  background: form.repeat === 'once' ? C.primarySoft : C.surface2,
                  border: `1px solid ${form.repeat === 'once' ? C.primary : C.border}`,
                  color: form.repeat === 'once' ? C.primaryLite : C.muted,
                  borderRadius: RADIUS.sm, fontSize: FONT_SIZE.sm,
                  cursor: 'pointer', fontFamily: 'inherit',
                  fontWeight: FONT_WEIGHT.medium,
                }}>Solo este día</button>
              <button
                onClick={() => setForm(f => ({ ...f, repeat: 'daily' }))}
                style={{
                  flex: 1, padding: '8px 12px',
                  background: form.repeat === 'daily' ? C.primarySoft : C.surface2,
                  border: `1px solid ${form.repeat === 'daily' ? C.primary : C.border}`,
                  color: form.repeat === 'daily' ? C.primaryLite : C.muted,
                  borderRadius: RADIUS.sm, fontSize: FONT_SIZE.sm,
                  cursor: 'pointer', fontFamily: 'inherit',
                  fontWeight: FONT_WEIGHT.medium,
                }}>Rango de días (vacaciones)</button>
            </div>
          </Field>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: 10,
          }}>
            <Field label={form.repeat === 'once' ? 'Fecha *' : 'Desde *'}>
              <input type="date" value={form.date} onChange={set('date')} style={fi} />
            </Field>
            {form.repeat === 'daily' && (
              <Field label="Hasta *">
                <input type="date" value={form.end_date} onChange={set('end_date')} style={fi} />
              </Field>
            )}
            <Field label="Hora *">
              <input type="time" value={form.time} onChange={set('time')} style={fi} />
            </Field>
            <Field label="Duración (min) *">
              <input type="number" min="15" max="720" step="15" value={form.duration_min} onChange={set('duration_min')} style={fi} />
            </Field>
          </div>

          {msg && (
            <div style={{
              padding: '8px 12px', borderRadius: RADIUS.sm,
              background: msg.kind === 'error' ? C.dangerSoft : (msg.kind === 'warn' ? 'rgba(244,183,64,.10)' : C.successSoft),
              color:      msg.kind === 'error' ? C.danger     : (msg.kind === 'warn' ? '#F4B740' : C.success),
              fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold,
              whiteSpace: 'pre-line',
            }}>{msg.text}</div>
          )}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <Button variant="ghost" size="sm" onClick={onClose} disabled={saving}>Cancelar</Button>
            <Button variant="primary" size="sm" onClick={save} disabled={saving} loading={saving}>
              {saving ? 'Bloqueando…' : '🔒 Bloquear horario'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Drawer: Horarios de atención ───────────────────────────────────
function WorkingHoursDrawer({ current, onClose, onSaved }) {
  const [days, setDays] = useState(() => {
    const map = {}
    for (const d of current) map[d.day_of_week] = d
    return Array.from({ length: 7 }, (_, i) => ({
      day_of_week: i,
      is_open:     map[i]?.is_open ?? (i === 0 || i === 6 ? false : true),
      open_time:   map[i]?.open_time  || '09:00',
      close_time:  map[i]?.close_time || '18:00',
    }))
  })

  const update = (i, patch) => setDays(d => d.map((row, idx) => idx === i ? { ...row, ...patch } : row))

  const [saving, setSaving] = useState(false)
  const [msg, setMsg]       = useState(null)

  const save = async () => {
    setSaving(true); setMsg(null)
    try {
      for (const d of days) {
        if (d.is_open && d.open_time >= d.close_time) {
          throw new Error(`En ${DAYS_ES[d.day_of_week]}, la hora de apertura debe ser anterior al cierre.`)
        }
      }
      const { error } = await supabase.rpc('set_my_working_hours', { p_days: days })
      if (error) throw error
      onSaved && onSaved()
    } catch (e) {
      setMsg({ kind:'error', text: e.message || 'Error al guardar horarios' })
    } finally {
      setSaving(false)
    }
  }

  const ordered = [1,2,3,4,5,6,0].map(i => ({ idx: i, row: days[i] }))

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={modalHeader}>
          <h3 style={{ margin:0, fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: C.text }}>
            ⚙ Horario de atención
          </h3>
          <button onClick={onClose} style={closeBtn}>×</button>
        </div>

        <div style={{ padding: 18 }}>
          <p style={{ margin: '0 0 14px', fontSize: FONT_SIZE.sm, color: C.muted, lineHeight: 1.5 }}>
            Definí los días y horarios en los que tomás turnos. Los slots libres
            del calendario se calculan en base a esto.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ordered.map(({ idx, row }) => (
              <div key={idx} style={{
                display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center',
                padding: '8px 10px',
                background: C.surface,
                borderRadius: RADIUS.sm,
                border: `1px solid ${C.border}`,
              }}>
                <div style={{
                  fontWeight: FONT_WEIGHT.semibold,
                  fontSize: FONT_SIZE.sm, color: C.text,
                  width: 90, flexShrink: 0,
                }}>{DAYS_ES[idx]}</div>
                <label style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: FONT_SIZE.xs, color: C.muted, cursor: 'pointer',
                  flexShrink: 0,
                }}>
                  <input type="checkbox" checked={row.is_open}
                    onChange={(e) => update(idx, { is_open: e.target.checked })}
                  />
                  Abierto
                </label>
                <div style={{ display: 'flex', gap: 6, flex: '1 1 200px', minWidth: 0 }}>
                  <input type="time" value={row.open_time}
                    onChange={(e) => update(idx, { open_time: e.target.value })}
                    disabled={!row.is_open}
                    style={{ ...fi, opacity: row.is_open ? 1 : 0.4, flex: 1, minWidth: 0 }}
                  />
                  <input type="time" value={row.close_time}
                    onChange={(e) => update(idx, { close_time: e.target.value })}
                    disabled={!row.is_open}
                    style={{ ...fi, opacity: row.is_open ? 1 : 0.4, flex: 1, minWidth: 0 }}
                  />
                </div>
              </div>
            ))}
          </div>

          {msg && (
            <div style={{
              marginTop: 14, padding: '8px 12px', borderRadius: RADIUS.sm,
              background: C.dangerSoft, color: C.danger,
              fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold,
            }}>{msg.text}</div>
          )}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 18, flexWrap: 'wrap' }}>
            <Button variant="ghost" size="sm" onClick={onClose} disabled={saving}>Cancelar</Button>
            <Button variant="primary" size="sm" onClick={save} disabled={saving} loading={saving}>
              {saving ? 'Guardando…' : 'Guardar horarios'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────
function Field({ label, hint, children }) {
  return (
    <div>
      <label style={{
        fontSize: FONT_SIZE.xs, color: C.muted, textTransform: 'uppercase',
        letterSpacing: '.06em', display: 'block', marginBottom: 5,
        fontFamily: FONT.mono, fontWeight: FONT_WEIGHT.semibold,
      }}>{label}</label>
      {children}
      {hint && (
        <div style={{ fontSize: FONT_SIZE.xs, color: C.muted, marginTop: 4, lineHeight: 1.45 }}>{hint}</div>
      )}
    </div>
  )
}

const fi = {
  width: '100%', boxSizing: 'border-box',
  background: C.bg, border: `1px solid ${C.border}`, borderRadius: RADIUS.md,
  padding: '9px 11px', color: C.text, fontSize: FONT_SIZE.base,
  outline: 'none', fontFamily: 'inherit',
}

const overlayStyle = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
  display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
  padding: '40px 16px', zIndex: 1000, overflowY: 'auto',
}
const modalStyle = {
  background: C.card, border: `1px solid ${C.border}`,
  borderRadius: RADIUS.lg, width: '100%', maxWidth: 560,
  boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
}
const modalHeader = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '14px 18px', borderBottom: `1px solid ${C.border}`,
}
const closeBtn = {
  background: 'none', border: 'none', color: C.muted,
  fontSize: 24, lineHeight: 1, cursor: 'pointer', padding: '0 6px',
}
