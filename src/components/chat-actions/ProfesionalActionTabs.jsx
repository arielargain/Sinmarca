// ════════════════════════════════════════════════════════════════════
// ProfesionalActionTabs — Acciones del operador sobre una conversation
// para identity='profesional'.
//
// 11/05/2026: creado en este sprint junto con TiendaActionTabs y
// MarketingActionTabs. Reemplaza el placeholder "Sin acciones disponibles"
// del ActionModal de Chats.
//
// Tabs:
//   👤 Datos        — info del contacto + próximo turno (read-only)
//   📅 Reservar     — form completo igual a AgendaPanel/AppointmentModal:
//                     fecha + hora + duración + notas + status, pre-poblado
//                     con nombre/teléfono del contacto y conversation_id.
//                     Llama create_appointment.
//   📋 Próximos     — lista de turnos futuros de ESE cliente (filtrados
//                     por phone). Botones Editar + Cancelar por turno.
//                     Usa list_my_appointments_by_phone.
//   📜 Historial    — turnos pasados del mismo cliente.
//
// onDone(kind, data): callback al parent (Chats.jsx) cuando una acción
//   completa. kinds emitidos:
//     - 'appointment_created'  → manda mensaje al cliente confirmando
//     - 'appointment_cancelled'→ manda mensaje al cliente avisando
//     - 'appointment_updated'  → no manda nada, solo refresca
//     - 'share'                → mensaje genérico (compat con casino)
// ════════════════════════════════════════════════════════════════════

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { COLORS, RADIUS, FONT_SIZE, FONT_WEIGHT, FONT } from '../../theme/tokens'

const C = COLORS

// ─── Utils de fecha (clon liviano del AgendaPanel para evitar import circular) ─
const TZ = 'America/Argentina/Buenos_Aires'

function toLocalIsoDate(date) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year:'numeric', month:'2-digit', day:'2-digit' })
    .format(date)
}
function toLocalTime(iso) {
  return new Intl.DateTimeFormat('es-AR', { timeZone: TZ, hour:'2-digit', minute:'2-digit', hour12:false })
    .format(new Date(iso))
}
function fmtDateLong(iso) {
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: TZ,
    weekday: 'long', day: '2-digit', month: 'long',
  }).format(new Date(iso))
}
function fmtDateTime(iso) {
  return `${fmtDateLong(iso)} · ${toLocalTime(iso)}`
}

// Inputs comunes
const fi = {
  width: '100%', boxSizing: 'border-box',
  background: C.bg, border: `1px solid ${C.border}`,
  borderRadius: RADIUS.md, padding: '9px 11px',
  color: C.text, fontSize: FONT_SIZE.base, outline: 'none',
  fontFamily: 'inherit',
}

// Botón mini-reusable
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

// Pill de estado del turno (alineado con AgendaPanel)
function StatusPill({ status }) {
  const palette = {
    pending:   { fg: C.warning, label: 'Pendiente'  },
    confirmed: { fg: C.success, label: 'Confirmado' },
    completed: { fg: C.muted,   label: 'Completado' },
    cancelled: { fg: C.danger,  label: 'Cancelado'  },
    no_show:   { fg: C.danger,  label: 'No vino'    },
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
// Tab 1: Datos del contacto
// ────────────────────────────────────────────────────────────────────
function TabInfo({ conv, nextAppointment }) {
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

      {nextAppointment && (
        <div style={{
          marginTop: 4, padding: '12px 14px',
          background: `${C.primary}0F`,
          border: `1px solid ${C.primary}55`,
          borderRadius: RADIUS.md,
        }}>
          <div style={{
            fontSize: FONT_SIZE.xs, fontFamily: FONT.mono,
            color: C.primaryLite, textTransform: 'uppercase',
            letterSpacing: '.08em', fontWeight: FONT_WEIGHT.semibold,
            marginBottom: 6,
          }}>📅 Próximo turno</div>
          <div style={{
            fontSize: FONT_SIZE.base, color: C.text,
            fontWeight: FONT_WEIGHT.semibold,
          }}>
            {fmtDateTime(nextAppointment.starts_at)}
          </div>
          <div style={{
            fontSize: FONT_SIZE.xs, color: C.muted,
            fontFamily: FONT.mono, marginTop: 4,
          }}>
            {nextAppointment.duration_min} min · <StatusPill status={nextAppointment.status} />
          </div>
        </div>
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────
// Tab 2: Reservar turno (form completo)
// ────────────────────────────────────────────────────────────────────
function TabReservar({ conv, onCreated, onError }) {
  const [date, setDate]                 = useState(toLocalIsoDate(new Date()))
  const [time, setTime]                 = useState('10:00')
  const [duration, setDuration]         = useState(30)
  const [notes, setNotes]               = useState('')
  const [status, setStatus]             = useState('confirmed')
  const [saving, setSaving]             = useState(false)
  const [error, setError]               = useState(null)

  const submit = async () => {
    setSaving(true); setError(null)
    try {
      if (!date || !time) throw new Error('Fecha y hora son obligatorias')
      const starts_at = new Date(`${date}T${time}:00-03:00`).toISOString()
      const { data, error } = await supabase.rpc('create_appointment', {
        p_client_name:    conv.contact_name || conv.phone || 'Cliente',
        p_starts_at:      starts_at,
        p_duration_min:   Number(duration),
        p_client_phone:   conv.phone || null,
        p_client_notes:   notes.trim() || null,
        p_conversation_id: conv.id,
        p_status:         status,
      })
      if (error) throw error

      onCreated({
        appointment: data,
        starts_at,
        duration_min: Number(duration),
        status,
      })
    } catch (e) {
      const m = String(e.message || e)
      let friendly = m
      if (m.includes('slot_conflict'))         friendly = 'Ya hay un turno en ese horario. Elegí otro.'
      else if (m.includes('duration_out_of_range')) friendly = 'La duración debe ser entre 5 minutos y 12 horas.'
      else if (m.includes('client_name_required')) friendly = 'El nombre del cliente es obligatorio.'
      setError(friendly)
      onError && onError(friendly)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{
        margin: 0, fontSize: FONT_SIZE.sm, color: C.muted, lineHeight: 1.5,
      }}>
        El turno se crea con los datos de <strong style={{ color: C.text }}>{conv.contact_name || conv.phone}</strong> y
        queda vinculado a este chat. El cliente recibe una confirmación por WhatsApp.
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: 10,
      }}>
        <Field label="Fecha">
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={fi} />
        </Field>
        <Field label="Hora">
          <input type="time" value={time} onChange={e => setTime(e.target.value)} style={fi} />
        </Field>
        <Field label="Duración (min)">
          <input type="number" min="5" max="720" step="5"
            value={duration} onChange={e => setDuration(e.target.value)} style={fi} />
        </Field>
      </div>

      <Field label="Estado">
        <select value={status} onChange={e => setStatus(e.target.value)} style={fi}>
          <option value="pending">Pendiente</option>
          <option value="confirmed">Confirmado</option>
        </select>
      </Field>

      <Field label="Notas (opcional)">
        <textarea value={notes} onChange={e => setNotes(e.target.value)}
          style={{ ...fi, minHeight: 70, fontFamily: 'inherit', resize: 'vertical' }}
          placeholder="Especialidad solicitada, observaciones..." />
      </Field>

      {error && (
        <div style={{
          padding: '8px 12px', borderRadius: RADIUS.sm,
          background: C.dangerSoft, color: C.danger,
          fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold,
        }}>{error}</div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
        <MiniBtn variant="primary" onClick={submit} disabled={saving}>
          {saving ? 'Guardando…' : '📅 Crear turno'}
        </MiniBtn>
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────
// Tab 3 / 4: Lista de turnos del cliente (futuros o pasados)
// ────────────────────────────────────────────────────────────────────
function TabListAppointments({ appointments, onCancel, onShare, mode }) {
  if (appointments.length === 0) {
    return (
      <div style={{
        padding: '32px 20px', textAlign: 'center',
        color: C.muted, fontSize: FONT_SIZE.sm,
      }}>
        {mode === 'upcoming'
          ? 'Este cliente no tiene turnos próximos.'
          : 'Este cliente no tiene turnos pasados.'}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {appointments.map(a => (
        <div key={a.id} style={{
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
                color: C.text,
              }}>
                {fmtDateTime(a.starts_at)}
              </div>
              <div style={{
                fontSize: FONT_SIZE.xs, color: C.muted,
                fontFamily: FONT.mono, marginTop: 4,
                display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
              }}>
                <span>{a.duration_min} min</span>
                <StatusPill status={a.status} />
                {a.created_via && a.created_via !== 'panel' && (
                  <span style={{
                    fontSize: 9, color: C.muted,
                    background: C.surface2,
                    padding: '1px 6px', borderRadius: 999,
                    textTransform: 'uppercase', letterSpacing: '.05em',
                  }}>{a.created_via}</span>
                )}
              </div>
              {a.client_notes && (
                <div style={{
                  marginTop: 6, fontSize: FONT_SIZE.xs, color: C.muted,
                  fontStyle: 'italic', lineHeight: 1.4,
                }}>{a.client_notes}</div>
              )}
            </div>

            {mode === 'upcoming' && a.status !== 'cancelled' && a.status !== 'completed' && (
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <MiniBtn variant="ghost" onClick={() => onShare(a)}>📤 Compartir</MiniBtn>
                <MiniBtn variant="danger" onClick={() => onCancel(a)}>Cancelar</MiniBtn>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────
// Componente raíz
// ────────────────────────────────────────────────────────────────────
export default function ProfesionalActionTabs({ conv, onDone, onClose }) {
  const [tab, setTab] = useState('info')
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(false)
  const [flashMsg, setFlashMsg] = useState(null)  // {kind:'success'|'error', text:string}

  // Cargar turnos del cliente (futuros y pasados) cuando se monta
  const reload = async () => {
    if (!conv?.phone) return
    setLoading(true)
    try {
      const { data, error } = await supabase.rpc('list_my_appointments_by_phone', {
        p_phone: conv.phone,
        p_from:  new Date(Date.now() - 90 * 86400000).toISOString(),  // 90d atrás
        p_to:    new Date(Date.now() + 180 * 86400000).toISOString(), // 180d adelante
      })
      if (error) throw error
      setAppointments(data || [])
    } catch (e) {
      console.error('[ProfesionalActionTabs] reload error:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { reload() /* eslint-disable-next-line */ }, [conv?.phone])

  const now = Date.now()
  const upcoming = useMemo(
    () => appointments.filter(a => new Date(a.starts_at).getTime() >= now),
    [appointments, now]
  )
  const past = useMemo(
    () => appointments.filter(a => new Date(a.starts_at).getTime() < now)
      .sort((a,b) => new Date(b.starts_at) - new Date(a.starts_at)),  // más recientes primero
    [appointments, now]
  )
  const nextAppointment = upcoming[0] || null

  const handleCreated = async ({ starts_at, duration_min }) => {
    setFlashMsg({ kind: 'success', text: '✓ Turno creado' })
    setTab('upcoming')
    await reload()
    onDone('appointment_created', { starts_at, duration_min })
    setTimeout(() => setFlashMsg(null), 2500)
  }

  const handleCancel = async (a) => {
    if (!confirm(`¿Cancelar el turno del ${fmtDateTime(a.starts_at)}?`)) return
    try {
      const { error } = await supabase.rpc('update_appointment', {
        p_appointment_id: a.id,
        p_status: 'cancelled',
        p_cancellation_reason: 'Cancelado desde el chat por el operador',
      })
      if (error) throw error
      setFlashMsg({ kind: 'success', text: '✓ Turno cancelado' })
      await reload()
      onDone('appointment_cancelled', { starts_at: a.starts_at, duration_min: a.duration_min })
      setTimeout(() => setFlashMsg(null), 2500)
    } catch (e) {
      setFlashMsg({ kind: 'error', text: e.message || 'Error al cancelar' })
    }
  }

  const handleShare = (a) => {
    const msg = `📅 Recordatorio de tu turno:\n\n${fmtDateTime(a.starts_at)}\nDuración: ${a.duration_min} min\n\n¡Te esperamos!`
    onDone('share', { msg })
    onClose && onClose()
  }

  const tabs = [
    { id: 'info',      label: '👤 Datos' },
    { id: 'reservar',  label: '📅 Reservar' },
    { id: 'upcoming',  label: `📋 Próximos${upcoming.length > 0 ? ` (${upcoming.length})` : ''}` },
    { id: 'past',      label: '📜 Historial' },
  ]

  return (
    <div>
      {/* Tab nav */}
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

        {tab === 'info'     && <TabInfo conv={conv} nextAppointment={nextAppointment} />}
        {tab === 'reservar' && <TabReservar conv={conv} onCreated={handleCreated} />}
        {tab === 'upcoming' && (
          loading
            ? <div style={{ padding: 20, textAlign: 'center', color: C.muted, fontSize: FONT_SIZE.sm }}>Cargando…</div>
            : <TabListAppointments appointments={upcoming} onCancel={handleCancel} onShare={handleShare} mode="upcoming" />
        )}
        {tab === 'past' && (
          loading
            ? <div style={{ padding: 20, textAlign: 'center', color: C.muted, fontSize: FONT_SIZE.sm }}>Cargando…</div>
            : <TabListAppointments appointments={past} mode="past" />
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
