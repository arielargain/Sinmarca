// ════════════════════════════════════════════════════════════════════
// MarketingActionTabs — Acciones del operador sobre una conversation
// para identity='marketing'.
//
// 11/05/2026: parte del sprint identity-actions junto con Profesional
// y Tienda. Marketing requirió migración nueva (columnas lead_* en
// conversations + RPCs set_conversation_lead_score y _status).
//
// Tabs:
//   👤 Datos          — info contacto + score actual + estado del funnel
//   🎯 Calificar      — chips frío/tibio/caliente que llama
//                       set_conversation_lead_score
//   📅 Agendar demo   — form de turno (reusa create_appointment con
//                       duración fija 30min) + marca lead_status='demo_agendado'
//   ➡  Derivar        — campo "a quién" + notas, llama
//                       set_conversation_lead_status('derivado',...)
//                       Después podés marcar perdido o cerrado.
//
// onDone kinds nuevos:
//   - 'lead_qualified'      → manda mensaje agradeciendo el interés
//   - 'demo_scheduled'      → manda mensaje confirmando la demo
//   - 'lead_derived'        → manda mensaje "te conectamos con un asesor"
//   - 'lead_status_changed' → sin mensaje, solo refresh
// ════════════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { COLORS, RADIUS, FONT_SIZE, FONT_WEIGHT, FONT } from '../../theme/tokens'

const C = COLORS

const TZ = 'America/Argentina/Buenos_Aires'

function toLocalIsoDate(date) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year:'numeric', month:'2-digit', day:'2-digit' })
    .format(date)
}
function fmtDateTime(iso) {
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: TZ,
    weekday: 'long', day: '2-digit', month: 'long',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date(iso))
}
function fmtRelativeDate(iso) {
  if (!iso) return null
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'hoy'
  if (days === 1) return 'hace 1 día'
  if (days < 30) return `hace ${days} días`
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
}

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
      }}>{children}</button>
  )
}

// Paleta de score
const SCORE_META = {
  frio:     { fg: '#5589E8', emoji: '🥶', label: 'Frío' },
  tibio:    { fg: C.warning, emoji: '🌤',  label: 'Tibio' },
  caliente: { fg: C.danger,  emoji: '🔥', label: 'Caliente' },
}

const STATUS_META = {
  nuevo:         { fg: C.muted,     label: 'Nuevo' },
  contactado:    { fg: '#5589E8',   label: 'Contactado' },
  calificado:    { fg: C.warning,   label: 'Calificado' },
  demo_agendado: { fg: C.primary,   label: 'Demo agendada' },
  derivado:      { fg: C.success,   label: 'Derivado' },
  perdido:       { fg: C.danger,    label: 'Perdido' },
  cerrado:       { fg: C.success,   label: 'Cerrado' },
}

// ────────────────────────────────────────────────────────────────────
// Tab 1: Datos + estado actual del lead
// ────────────────────────────────────────────────────────────────────
function TabInfo({ conv, leadData, onChangeStatus }) {
  const scoreMeta  = leadData.lead_score ? SCORE_META[leadData.lead_score] : null
  const statusMeta = leadData.lead_status ? STATUS_META[leadData.lead_status] : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {[
        ['Nombre',   conv.contact_name || '—'],
        ['Teléfono', conv.phone || '—'],
        ['Email',    conv.contact_email || '—'],
      ].map(([label, val]) => (
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

      {/* Card de score + status actuales */}
      <div style={{
        marginTop: 4, padding: '12px 14px',
        background: C.surface2, border: `1px solid ${C.border}`,
        borderRadius: RADIUS.md,
      }}>
        <div style={{
          fontSize: FONT_SIZE.xs, fontFamily: FONT.mono,
          color: C.muted, textTransform: 'uppercase',
          letterSpacing: '.08em', fontWeight: FONT_WEIGHT.semibold,
          marginBottom: 8,
        }}>📊 Estado del lead</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: FONT_SIZE.sm, color: C.muted }}>Calificación:</span>
            {scoreMeta ? (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '3px 10px', borderRadius: 999,
                background: `${scoreMeta.fg}22`, color: scoreMeta.fg,
                fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold,
              }}>
                <span>{scoreMeta.emoji}</span> {scoreMeta.label}
                <span style={{ fontSize: FONT_SIZE.xs, opacity: .8, marginLeft: 4 }}>
                  · {fmtRelativeDate(leadData.lead_score_updated_at)}
                </span>
              </span>
            ) : (
              <span style={{ fontSize: FONT_SIZE.sm, color: C.muted, fontStyle: 'italic' }}>Sin calificar</span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: FONT_SIZE.sm, color: C.muted }}>Estado:</span>
            {statusMeta ? (
              <span style={{
                padding: '3px 10px', borderRadius: 999,
                background: `${statusMeta.fg}22`, color: statusMeta.fg,
                fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold,
              }}>{statusMeta.label}</span>
            ) : (
              <span style={{ fontSize: FONT_SIZE.sm, color: C.muted, fontStyle: 'italic' }}>Sin estado</span>
            )}
          </div>

          {leadData.lead_derived_to && (
            <div style={{ fontSize: FONT_SIZE.xs, color: C.muted, lineHeight: 1.4 }}>
              Derivado a <strong style={{ color: C.text }}>{leadData.lead_derived_to}</strong>
              {leadData.lead_derived_at && (
                <span> · {fmtRelativeDate(leadData.lead_derived_at)}</span>
              )}
            </div>
          )}
        </div>

        {/* Quick-actions de estado avanzadas (cerrado/perdido) */}
        <div style={{ marginTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <MiniBtn variant="success" onClick={() => onChangeStatus('cerrado')}>✓ Cerrado</MiniBtn>
          <MiniBtn variant="danger" onClick={() => onChangeStatus('perdido')}>✖ Perdido</MiniBtn>
          {leadData.lead_status === 'nuevo' || !leadData.lead_status ? (
            <MiniBtn variant="ghost" onClick={() => onChangeStatus('contactado')}>📞 Contactado</MiniBtn>
          ) : null}
        </div>
      </div>

      {leadData.lead_notes && (
        <div style={{
          marginTop: 4, padding: '10px 12px',
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: RADIUS.sm,
        }}>
          <div style={{
            fontSize: FONT_SIZE.xs, fontFamily: FONT.mono,
            color: C.muted, textTransform: 'uppercase',
            letterSpacing: '.06em', fontWeight: FONT_WEIGHT.semibold,
            marginBottom: 6,
          }}>📝 Notas internas</div>
          <pre style={{
            margin: 0, fontSize: FONT_SIZE.sm, color: C.text,
            fontFamily: 'inherit', whiteSpace: 'pre-wrap',
            wordBreak: 'break-word', maxHeight: 200, overflowY: 'auto',
            lineHeight: 1.5,
          }}>{leadData.lead_notes}</pre>
        </div>
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────
// Tab 2: Calificar lead (score)
// ────────────────────────────────────────────────────────────────────
function TabCalificar({ conv, currentScore, onScored }) {
  const [saving, setSaving] = useState(false)
  const [notes, setNotes]   = useState('')

  const setScore = async (score) => {
    setSaving(true)
    try {
      const { error: e1 } = await supabase.rpc('set_conversation_lead_score', {
        p_conversation_id: conv.id,
        p_score: score,
      })
      if (e1) throw e1

      // Si hay nota, la appendeamos vía set_conversation_lead_status (no cambiamos
      // el status, solo agregamos la nota). Pasamos status=lead_status actual o
      // 'calificado' como default.
      if (notes.trim()) {
        const { error: e2 } = await supabase.rpc('set_conversation_lead_status', {
          p_conversation_id: conv.id,
          p_status: 'calificado',
          p_derived_to: null,
          p_notes: `Calificación ${score}: ${notes.trim()}`,
        })
        if (e2) throw e2
      } else {
        // Si no hay nota, igual avanzamos status a 'calificado' si todavía
        // estaba en 'nuevo' o NULL.
        await supabase.rpc('set_conversation_lead_status', {
          p_conversation_id: conv.id,
          p_status: 'calificado',
          p_derived_to: null,
          p_notes: null,
        }).catch(() => {})  // best-effort, no es crítico
      }

      onScored({ score, notes: notes.trim() })
      setNotes('')
    } catch (e) {
      alert(e.message || 'Error al calificar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{
        margin: 0, fontSize: FONT_SIZE.sm, color: C.muted, lineHeight: 1.5,
      }}>
        Calificá a este lead según tu interacción. La nota es opcional y se
        guarda en el historial del lead.
      </p>

      <Field label="Nota (opcional)">
        <textarea value={notes} onChange={e => setNotes(e.target.value)}
          style={{ ...fi, minHeight: 70, fontFamily: 'inherit', resize: 'vertical' }}
          placeholder="Ej: pidió presupuesto detallado, llamar después de las 18hs..." />
      </Field>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
        {Object.entries(SCORE_META).map(([key, m]) => {
          const isCurrent = currentScore === key
          return (
            <button key={key} onClick={() => setScore(key)} disabled={saving}
              style={{
                flex: '1 1 100px', padding: '12px 8px',
                background: isCurrent ? `${m.fg}22` : C.surface,
                border: `1.5px solid ${isCurrent ? m.fg : C.border}`,
                borderRadius: RADIUS.md, color: isCurrent ? m.fg : C.text,
                fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold,
                cursor: saving ? 'wait' : 'pointer',
                fontFamily: 'inherit',
                transition: 'background .12s, border-color .12s',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 6,
                opacity: saving ? 0.6 : 1,
              }}>
              <span style={{ fontSize: 22 }}>{m.emoji}</span>
              <span>{m.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────
// Tab 3: Agendar demo
// ────────────────────────────────────────────────────────────────────
function TabAgendarDemo({ conv, onScheduled }) {
  const [date, setDate]         = useState(toLocalIsoDate(new Date()))
  const [time, setTime]         = useState('15:00')
  const [duration, setDuration] = useState(30)
  const [notes, setNotes]       = useState('')
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState(null)

  const submit = async () => {
    setSaving(true); setError(null)
    try {
      if (!date || !time) throw new Error('Fecha y hora son obligatorias')
      const starts_at = new Date(`${date}T${time}:00-03:00`).toISOString()

      // 1) Crear el turno (es una demo agendada)
      const { error: e1 } = await supabase.rpc('create_appointment', {
        p_client_name:    conv.contact_name || conv.phone || 'Lead',
        p_starts_at:      starts_at,
        p_duration_min:   Number(duration),
        p_client_phone:   conv.phone || null,
        p_client_notes:   notes.trim() ? `Demo: ${notes.trim()}` : 'Demo agendada',
        p_conversation_id: conv.id,
        p_status:         'confirmed',
      })
      if (e1) throw e1

      // 2) Actualizar el status del lead a 'demo_agendado'
      await supabase.rpc('set_conversation_lead_status', {
        p_conversation_id: conv.id,
        p_status:          'demo_agendado',
        p_derived_to:      null,
        p_notes:           `Demo agendada para ${new Date(starts_at).toLocaleString('es-AR')}`,
      })

      onScheduled({ starts_at, duration_min: Number(duration) })
    } catch (e) {
      const m = String(e.message || e)
      let friendly = m
      if (m.includes('slot_conflict')) friendly = 'Ese horario ya está ocupado. Elegí otro.'
      setError(friendly)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{
        margin: 0, fontSize: FONT_SIZE.sm, color: C.muted, lineHeight: 1.5,
      }}>
        Agendá una demo con <strong style={{ color: C.text }}>{conv.contact_name || conv.phone}</strong>.
        Se crea un turno en tu agenda y se marca el lead como <code style={{
          background: C.surface2, padding: '1px 6px', borderRadius: 4,
          fontFamily: FONT.mono, color: C.primaryLite, fontSize: FONT_SIZE.xs,
        }}>demo_agendado</code>.
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
          <input type="number" min="15" max="180" step="15"
            value={duration} onChange={e => setDuration(e.target.value)} style={fi} />
        </Field>
      </div>

      <Field label="Notas para la demo (opcional)">
        <textarea value={notes} onChange={e => setNotes(e.target.value)}
          style={{ ...fi, minHeight: 70, fontFamily: 'inherit', resize: 'vertical' }}
          placeholder="Producto/servicio que les interesa, tamaño del negocio, etc." />
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
          {saving ? 'Agendando…' : '📅 Agendar demo'}
        </MiniBtn>
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────
// Tab 4: Derivar a comercial
// ────────────────────────────────────────────────────────────────────
function TabDerivar({ conv, onDerived }) {
  const [derivedTo, setDerivedTo] = useState('')
  const [notes, setNotes]         = useState('')
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState(null)

  const submit = async () => {
    setSaving(true); setError(null)
    try {
      if (!derivedTo.trim()) throw new Error('Indicá a quién derivás el lead')
      const { error } = await supabase.rpc('set_conversation_lead_status', {
        p_conversation_id: conv.id,
        p_status:          'derivado',
        p_derived_to:      derivedTo.trim(),
        p_notes:           notes.trim() || null,
      })
      if (error) throw error
      onDerived({ derived_to: derivedTo.trim(), notes: notes.trim() })
      setDerivedTo(''); setNotes('')
    } catch (e) {
      setError(e.message || 'Error al derivar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{
        margin: 0, fontSize: FONT_SIZE.sm, color: C.muted, lineHeight: 1.5,
      }}>
        Marcá este lead como derivado a un comercial o asesor. El estado pasa
        a <code style={{
          background: C.surface2, padding: '1px 6px', borderRadius: 4,
          fontFamily: FONT.mono, color: C.success, fontSize: FONT_SIZE.xs,
        }}>derivado</code> y queda registrado en el historial.
      </p>

      <Field label="Derivado a *">
        <input value={derivedTo} onChange={e => setDerivedTo(e.target.value)} style={fi}
          placeholder="Ej: Juan Pérez (Comercial)" maxLength={120} />
      </Field>

      <Field label="Notas para el comercial (opcional)">
        <textarea value={notes} onChange={e => setNotes(e.target.value)}
          style={{ ...fi, minHeight: 80, fontFamily: 'inherit', resize: 'vertical' }}
          placeholder="Contexto del lead, qué le interesa, próximos pasos sugeridos..." />
      </Field>

      {error && (
        <div style={{
          padding: '8px 12px', borderRadius: RADIUS.sm,
          background: C.dangerSoft, color: C.danger,
          fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold,
        }}>{error}</div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
        <MiniBtn variant="primary" onClick={submit} disabled={saving || !derivedTo.trim()}>
          {saving ? 'Derivando…' : '➡ Derivar lead'}
        </MiniBtn>
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────
// Componente raíz
// ────────────────────────────────────────────────────────────────────
export default function MarketingActionTabs({ conv, onDone, onClose }) {
  const [tab, setTab] = useState('info')
  const [leadData, setLeadData] = useState({
    lead_score: conv.lead_score || null,
    lead_score_updated_at: conv.lead_score_updated_at || null,
    lead_status: conv.lead_status || null,
    lead_derived_to: conv.lead_derived_to || null,
    lead_derived_at: conv.lead_derived_at || null,
    lead_notes: conv.lead_notes || null,
  })
  const [flashMsg, setFlashMsg] = useState(null)

  // Cargar lead_* desde DB en mount (por si el conv en memoria está stale)
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select('lead_score, lead_score_updated_at, lead_status, lead_derived_to, lead_derived_at, lead_notes')
        .eq('id', conv.id)
        .single()
      if (cancelled || error || !data) return
      setLeadData(data)
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conv?.id])

  const reload = async () => {
    const { data } = await supabase
      .from('conversations')
      .select('lead_score, lead_score_updated_at, lead_status, lead_derived_to, lead_derived_at, lead_notes')
      .eq('id', conv.id)
      .single()
    if (data) setLeadData(data)
  }

  const handleScored = async ({ score, notes }) => {
    setFlashMsg({ kind: 'success', text: `✓ Lead calificado como ${SCORE_META[score].label.toLowerCase()}` })
    await reload()
    onDone('lead_qualified', { score, notes, conv })
    setTimeout(() => setFlashMsg(null), 2500)
  }

  const handleScheduled = async ({ starts_at, duration_min }) => {
    setFlashMsg({ kind: 'success', text: '✓ Demo agendada y lead actualizado' })
    setTab('info')
    await reload()
    onDone('demo_scheduled', { starts_at, duration_min, conv })
    setTimeout(() => setFlashMsg(null), 2500)
  }

  const handleDerived = async ({ derived_to, notes }) => {
    setFlashMsg({ kind: 'success', text: `✓ Lead derivado a ${derived_to}` })
    setTab('info')
    await reload()
    onDone('lead_derived', { derived_to, notes, conv })
    setTimeout(() => setFlashMsg(null), 2500)
  }

  const handleChangeStatus = async (status) => {
    if (!confirm(`¿Marcar el lead como ${STATUS_META[status].label.toLowerCase()}?`)) return
    try {
      const { error } = await supabase.rpc('set_conversation_lead_status', {
        p_conversation_id: conv.id,
        p_status:          status,
        p_derived_to:      null,
        p_notes:           `Estado cambiado manualmente a ${status}`,
      })
      if (error) throw error
      setFlashMsg({ kind: 'success', text: `✓ Estado: ${STATUS_META[status].label}` })
      await reload()
      onDone('lead_status_changed', { status, conv })
      setTimeout(() => setFlashMsg(null), 2500)
    } catch (e) {
      setFlashMsg({ kind: 'error', text: e.message || 'Error al cambiar estado' })
    }
  }

  const tabs = [
    { id: 'info',      label: '👤 Datos' },
    { id: 'calificar', label: '🎯 Calificar' },
    { id: 'demo',      label: '📅 Demo' },
    { id: 'derivar',   label: '➡ Derivar' },
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

        {tab === 'info'      && <TabInfo conv={conv} leadData={leadData} onChangeStatus={handleChangeStatus} />}
        {tab === 'calificar' && <TabCalificar conv={conv} currentScore={leadData.lead_score} onScored={handleScored} />}
        {tab === 'demo'      && <TabAgendarDemo conv={conv} onScheduled={handleScheduled} />}
        {tab === 'derivar'   && <TabDerivar conv={conv} onDerived={handleDerived} />}
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
