// ════════════════════════════════════════════════════════════════════
// AgendaConfig — Panel interno editor de servicios + horarios + pausas + excepciones
//
// Compartido entre retail (/mi-cuenta/agenda/configuracion) y sub-tenant
// (/cliente/agenda/configuracion). Las RPCs *_my_agenda_* resuelven scope
// internamente vía SECURITY DEFINER, así que el componente no necesita
// saber si está corriendo en retail o sub-tenant.
//
// 4 tabs:
//   1. 🛎️  Servicios   — CRUD de agenda_services
//   2. 🕐  Horarios    — set_my_working_hours (reutiliza RPC vieja)
//   3. ⏸️  Pausas      — CRUD de agenda_breaks
//   4. 📅  Excepciones — CRUD de agenda_exceptions (feriados, vacaciones)
//
// RPCs usadas (todas SECURITY DEFINER, scope auto-resuelto):
//   - list_my_agenda_services / upsert_my_agenda_service / delete_my_agenda_service
//   - get_my_working_hours / set_my_working_hours
//   - list_my_agenda_breaks / upsert_my_agenda_break / delete_my_agenda_break
//   - list_my_agenda_exceptions / upsert_my_agenda_exception / delete_my_agenda_exception
//
// 12/05/2026 - F4 de Agenda v2.
// ════════════════════════════════════════════════════════════════════

import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  PageHeader, Card, SectionHeader, Button, IconButton, TabBar, Banner,
  COLORS as C, RADIUS, FONT_SIZE, FONT_WEIGHT, FONT, Z,
} from './ui'

// ─── Constantes ──────────────────────────────────────────────────────
const DAYS_ES       = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
const DAYS_ES_SHORT = ['DOM','LUN','MAR','MIÉ','JUE','VIE','SÁB']
const COLOR_PRESETS = ['#D4A843', '#2D6BD8', '#22c55e', '#ef4444', '#a855f7', '#f97316', '#06b6d4', '#ec4899']
const fmtARS = (n) => '$' + Number(n || 0).toLocaleString('es-AR')

// ─── Estilos inputs ──────────────────────────────────────────────────
const fi = {
  width: '100%', boxSizing: 'border-box',
  background: C.bg, border: `1px solid ${C.border}`, borderRadius: RADIUS.md,
  padding: '9px 11px', color: C.text, fontSize: FONT_SIZE.base,
  outline: 'none', fontFamily: 'inherit',
}

function FieldMini({ label, hint, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{
        fontSize: FONT_SIZE.xs, color: C.muted,
        textTransform: 'uppercase', letterSpacing: '.08em',
        display: 'block', marginBottom: 5,
        fontFamily: FONT.mono, fontWeight: FONT_WEIGHT.semibold,
      }}>{label}</label>
      {children}
      {hint && (
        <p style={{
          fontSize: FONT_SIZE.sm, color: C.muted,
          margin: '4px 0 0', lineHeight: 1.45,
        }}>{hint}</p>
      )}
    </div>
  )
}

function Row({ children }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: 12,
    }}>{children}</div>
  )
}

// ─── Modal shell genérico ────────────────────────────────────────────
function ModalShell({ title, onClose, children, maxWidth = 520 }) {
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.78)',
      backdropFilter: 'blur(4px)',
      zIndex: Z.modal,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: C.card, border: `1px solid ${C.border}`,
        borderRadius: RADIUS.xl, width: '100%', maxWidth,
        maxHeight: '88vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
      }}>
        <div style={{
          padding: '14px 18px',
          borderBottom: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: 10, flexShrink: 0,
        }}>
          <h3 style={{
            margin: 0, color: C.text, fontSize: 15,
            fontWeight: FONT_WEIGHT.bold, lineHeight: 1.3,
          }}>{title}</h3>
          <IconButton icon="×" variant="ghost" size={30} onClick={onClose} title="Cerrar" />
        </div>
        <div style={{ padding: 16, overflowY: 'auto', flex: 1 }}>{children}</div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════
// TAB 1: SERVICIOS
// ════════════════════════════════════════════════════════════════════
function ServicesTab() {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const { data, error } = await supabase.rpc('list_my_agenda_services', { p_only_active: false })
      if (error) throw error
      setServices(data || [])
    } catch (e) {
      setError(e.message || 'Error cargando servicios')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este servicio? Las citas futuras pierden la asociación pero no se borran.')) return
    try {
      const { error } = await supabase.rpc('delete_my_agenda_service', { p_id: id })
      if (error) throw error
      await load()
    } catch (e) {
      alert('Error: ' + (e.message || 'desconocido'))
    }
  }

  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 10, marginBottom: 14, flexWrap: 'wrap',
      }}>
        <p style={{
          fontSize: FONT_SIZE.sm, color: C.muted,
          margin: 0, lineHeight: 1.5, flex: 1, minWidth: 240,
        }}>
          Definí los servicios que ofrecés. El cliente los elige antes de reservar
          y la duración del turno se ajusta al servicio. Si no cargás ninguno,
          la agenda funciona con duración default 30min.
        </p>
        <Button variant="primary" size="sm" onClick={() => setEditing({ mode: 'new' })}>
          + Nuevo servicio
        </Button>
      </div>

      {error && <Banner kind="error" style={{ marginBottom: 12 }}>{error}</Banner>}

      {loading && (
        <div style={{ padding: 30, textAlign: 'center', color: C.muted }}>
          Cargando…
        </div>
      )}

      {!loading && services.length === 0 && (
        <Card padding={0} style={{ borderStyle: 'dashed' }}>
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 38, marginBottom: 12, opacity: 0.7 }}>🛎️</div>
            <div style={{
              fontSize: FONT_SIZE.base, color: C.text,
              fontWeight: FONT_WEIGHT.semibold,
            }}>Todavía no tenés servicios cargados</div>
            <div style={{
              fontSize: FONT_SIZE.sm, color: C.muted, marginTop: 6,
              maxWidth: 360, margin: '6px auto 0', lineHeight: 1.5,
            }}>
              Cargá al menos uno (ej. "Consulta inicial 30min") para que tus
              clientes elijan al reservar.
            </div>
          </div>
        </Card>
      )}

      {!loading && services.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {services.map(svc => (
            <ServiceCard
              key={svc.id}
              service={svc}
              onEdit={() => setEditing({ mode: 'edit', service: svc })}
              onDelete={() => handleDelete(svc.id)}
            />
          ))}
        </div>
      )}

      {editing && (
        <ServiceModal
          mode={editing.mode}
          service={editing.service}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load() }}
        />
      )}
    </div>
  )
}

function ServiceCard({ service: s, onEdit, onDelete }) {
  return (
    <Card padding={14} style={{
      display: 'flex', alignItems: 'center', gap: 12,
      borderLeft: `4px solid ${s.color || '#D4A843'}`,
      opacity: s.active ? 1 : 0.55,
      flexWrap: 'wrap',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        background: (s.color || '#D4A843') + '22',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: s.color || '#D4A843', fontSize: 16, flexShrink: 0,
        fontWeight: FONT_WEIGHT.bold,
      }}>
        {s.duration_min}'
      </div>

      <div style={{ flex: 1, minWidth: 180 }}>
        <div style={{
          fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.semibold,
          color: C.text, display: 'flex', alignItems: 'center', gap: 8,
          flexWrap: 'wrap',
        }}>
          {s.name}
          {!s.active && (
            <span style={{
              padding: '1px 8px', borderRadius: 999,
              background: C.muted + '22', color: C.muted,
              fontSize: 9, fontFamily: FONT.mono,
              textTransform: 'uppercase', letterSpacing: '.05em',
              fontWeight: FONT_WEIGHT.bold,
            }}>OCULTO</span>
          )}
        </div>
        {s.description && (
          <div style={{
            fontSize: FONT_SIZE.sm, color: C.muted,
            marginTop: 2, lineHeight: 1.4,
          }}>{s.description}</div>
        )}
        <div style={{
          fontSize: FONT_SIZE.xs, color: C.muted, fontFamily: FONT.mono,
          marginTop: 4, display: 'flex', gap: 12, flexWrap: 'wrap',
        }}>
          <span>{s.duration_min} min</span>
          {s.price_ars > 0 && (
            <span>{s.show_price ? fmtARS(s.price_ars) : `${fmtARS(s.price_ars)} (oculto)`}</span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <Button size="sm" variant="ghost" onClick={onEdit}>Editar</Button>
        <Button size="sm" variant="ghost" onClick={onDelete} style={{ color: C.danger }}>Borrar</Button>
      </div>
    </Card>
  )
}

function ServiceModal({ mode, service, onClose, onSaved }) {
  const isEdit = mode === 'edit'
  const [form, setForm] = useState({
    name: service?.name || '',
    description: service?.description || '',
    duration_min: service?.duration_min || 30,
    price_ars: service?.price_ars || 0,
    show_price: service?.show_price !== false,
    color: service?.color || '#D4A843',
    active: service?.active !== false,
    sort_order: service?.sort_order ?? 100,
  })
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  const save = async () => {
    setSaving(true); setMsg(null)
    try {
      if (!form.name.trim()) throw new Error('El nombre es obligatorio')
      const dur = parseInt(form.duration_min, 10)
      if (!dur || dur < 5 || dur > 720) throw new Error('Duración entre 5 y 720 minutos')

      const { error } = await supabase.rpc('upsert_my_agenda_service', {
        p_id:          isEdit ? service.id : null,
        p_name:        form.name.trim(),
        p_duration:    dur,
        p_description: form.description?.trim() || null,
        p_price:       Number(form.price_ars) || 0,
        p_show_price:  !!form.show_price,
        p_color:       form.color,
        p_active:      !!form.active,
        p_sort_order:  parseInt(form.sort_order, 10) || 100,
      })
      if (error) throw error
      onSaved && onSaved()
    } catch (e) {
      setMsg({ kind: 'error', text: e.message || 'Error al guardar' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalShell title={isEdit ? 'Editar servicio' : 'Nuevo servicio'} onClose={onClose}>
      <FieldMini label="Nombre *" hint="Ej: Consulta inicial, Sesión de seguimiento">
        <input value={form.name} onChange={set('name')} style={fi} autoFocus
          placeholder="Consulta inicial" maxLength={120}
        />
      </FieldMini>

      <FieldMini label="Descripción" hint="Breve, lo ve el cliente al elegir">
        <textarea value={form.description} onChange={set('description')} style={{ ...fi, minHeight: 60, fontFamily: 'inherit', resize: 'vertical' }}
          placeholder="Primera consulta diagnóstico, dura 45 min." maxLength={500}
        />
      </FieldMini>

      <Row>
        <FieldMini label="Duración (min) *" hint="5 a 720">
          <input type="number" min="5" max="720" step="5"
            value={form.duration_min} onChange={set('duration_min')} style={fi}
          />
        </FieldMini>
        <FieldMini label="Precio (ARS)" hint="0 = gratuito">
          <input type="number" min="0" step="100"
            value={form.price_ars} onChange={set('price_ars')} style={fi}
          />
        </FieldMini>
      </Row>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 12px', background: C.surface,
        border: `1px solid ${C.border}`, borderRadius: RADIUS.md,
        marginBottom: 12, flexWrap: 'wrap',
      }}>
        <label style={{
          display: 'flex', alignItems: 'center', gap: 8,
          cursor: 'pointer', flex: 1, minWidth: 200,
        }}>
          <input type="checkbox" checked={form.show_price} onChange={set('show_price')} />
          <span style={{ fontSize: FONT_SIZE.sm, color: C.text }}>
            Mostrar precio en la página pública
          </span>
        </label>
        <label style={{
          display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
        }}>
          <input type="checkbox" checked={form.active} onChange={set('active')} />
          <span style={{ fontSize: FONT_SIZE.sm, color: C.text }}>Activo</span>
        </label>
      </div>

      <FieldMini label="Color" hint="Se usa como acento visual del servicio">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {COLOR_PRESETS.map(c => {
            const active = form.color.toUpperCase() === c.toUpperCase()
            return (
              <button key={c} type="button"
                onClick={() => setForm(f => ({ ...f, color: c }))}
                style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: c, cursor: 'pointer',
                  border: active ? `3px solid ${C.text}` : `2px solid ${C.border}`,
                  outline: 'none', padding: 0,
                  boxShadow: active ? `0 0 0 2px ${c}55` : 'none',
                  transition: 'transform .12s',
                }}
                title={c}
              />
            )
          })}
          <input type="color" value={form.color} onChange={set('color')}
            style={{ width: 32, height: 32, padding: 0, border: `1px solid ${C.border}`, borderRadius: '50%', cursor: 'pointer', background: 'transparent' }}
            title="Color custom"
          />
        </div>
      </FieldMini>

      <FieldMini label="Orden" hint="Más bajo = aparece primero. Default 100.">
        <input type="number" min="0" max="9999"
          value={form.sort_order} onChange={set('sort_order')} style={{ ...fi, maxWidth: 140 }}
        />
      </FieldMini>

      {msg && (
        <div style={{
          padding: '8px 12px', borderRadius: RADIUS.sm,
          background: C.dangerSoft, color: C.danger,
          fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold,
          marginBottom: 10,
        }}>{msg.text}</div>
      )}

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 10, flexWrap: 'wrap' }}>
        <Button variant="ghost" size="sm" onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button variant="primary" size="sm" onClick={save} disabled={saving} loading={saving}>
          {saving ? 'Guardando…' : (isEdit ? 'Guardar' : 'Crear servicio')}
        </Button>
      </div>
    </ModalShell>
  )
}

// ════════════════════════════════════════════════════════════════════
// TAB 2: HORARIOS
// ════════════════════════════════════════════════════════════════════
function HoursTab() {
  const [days, setDays] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const { data, error } = await supabase.rpc('get_my_working_hours')
      if (error) throw error
      const byDow = {}
      for (const d of (data || [])) byDow[d.day_of_week] = d
      // 7 rows L a D (orden visual: 1,2,3,4,5,6,0)
      setDays(Array.from({ length: 7 }, (_, i) => ({
        day_of_week: i,
        is_open:     byDow[i]?.is_open ?? (i === 0 || i === 6 ? false : true),
        open_time:   byDow[i]?.open_time?.slice(0, 5) || '09:00',
        close_time:  byDow[i]?.close_time?.slice(0, 5) || '18:00',
      })))
    } catch (e) {
      setError(e.message || 'Error cargando horarios')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const update = (idx, patch) => setDays(d => d.map((row, i) => i === idx ? { ...row, ...patch } : row))

  const save = async () => {
    setSaving(true); setMsg(null)
    try {
      for (const d of days) {
        if (d.is_open && d.open_time >= d.close_time) {
          throw new Error(`En ${DAYS_ES[d.day_of_week]}: la apertura debe ser anterior al cierre.`)
        }
      }
      const { error } = await supabase.rpc('set_my_working_hours', { p_days: days })
      if (error) throw error
      setMsg({ kind: 'success', text: '✓ Guardado' })
      setTimeout(() => setMsg(null), 2500)
    } catch (e) {
      setMsg({ kind: 'error', text: e.message || 'Error al guardar' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div style={{ padding: 30, textAlign: 'center', color: C.muted }}>Cargando…</div>
  if (error) return <Banner kind="error">{error}</Banner>
  if (!days) return null

  // Orden L a D (lunes primero)
  const orderedIdx = [1, 2, 3, 4, 5, 6, 0]

  return (
    <div>
      <p style={{
        fontSize: FONT_SIZE.sm, color: C.muted, margin: '0 0 16px',
        lineHeight: 1.5,
      }}>
        Definí los días y horarios en los que tomás turnos. Los slots libres
        que ven tus clientes en la página pública se calculan en base a esto.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {orderedIdx.map(idx => {
          const row = days[idx]
          return (
            <div key={idx} style={{
              display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center',
              padding: '12px 14px',
              background: row.is_open ? C.surface : 'transparent',
              borderRadius: RADIUS.md,
              border: `1px solid ${row.is_open ? C.border : C.border + '55'}`,
              opacity: row.is_open ? 1 : 0.65,
            }}>
              <div style={{
                width: 100, flexShrink: 0,
                fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.semibold,
                color: C.text,
              }}>{DAYS_ES[idx]}</div>

              <label style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: FONT_SIZE.sm, color: C.muted,
                cursor: 'pointer', flexShrink: 0,
              }}>
                <input
                  type="checkbox"
                  checked={row.is_open}
                  onChange={(e) => update(idx, { is_open: e.target.checked })}
                />
                Abierto
              </label>

              <div style={{
                display: 'flex', gap: 6, alignItems: 'center',
                flex: '1 1 220px', minWidth: 0,
              }}>
                <input
                  type="time"
                  value={row.open_time}
                  onChange={(e) => update(idx, { open_time: e.target.value })}
                  disabled={!row.is_open}
                  style={{ ...fi, opacity: row.is_open ? 1 : 0.4, flex: 1, minWidth: 0 }}
                />
                <span style={{ color: C.muted, fontSize: FONT_SIZE.xs, flexShrink: 0 }}>—</span>
                <input
                  type="time"
                  value={row.close_time}
                  onChange={(e) => update(idx, { close_time: e.target.value })}
                  disabled={!row.is_open}
                  style={{ ...fi, opacity: row.is_open ? 1 : 0.4, flex: 1, minWidth: 0 }}
                />
              </div>
            </div>
          )
        })}
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
        gap: 12, marginTop: 16, flexWrap: 'wrap',
      }}>
        {msg && (
          <span style={{
            fontSize: FONT_SIZE.sm,
            color: msg.kind === 'error' ? C.danger : C.success,
            fontWeight: FONT_WEIGHT.semibold,
          }}>{msg.text}</span>
        )}
        <Button variant="primary" size="md" onClick={save} disabled={saving} loading={saving}>
          {saving ? 'Guardando…' : 'Guardar horarios'}
        </Button>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════
// TAB 3: PAUSAS
// ════════════════════════════════════════════════════════════════════
function BreaksTab() {
  const [breaks, setBreaks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const { data, error } = await supabase.rpc('list_my_agenda_breaks')
      if (error) throw error
      setBreaks(data || [])
    } catch (e) {
      setError(e.message || 'Error cargando pausas')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta pausa?')) return
    try {
      const { error } = await supabase.rpc('delete_my_agenda_break', { p_id: id })
      if (error) throw error
      await load()
    } catch (e) {
      alert('Error: ' + (e.message || 'desconocido'))
    }
  }

  // Agrupar por DOW
  const byDow = {}
  for (const b of breaks) {
    if (!byDow[b.day_of_week]) byDow[b.day_of_week] = []
    byDow[b.day_of_week].push(b)
  }

  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 10, marginBottom: 14, flexWrap: 'wrap',
      }}>
        <p style={{
          fontSize: FONT_SIZE.sm, color: C.muted,
          margin: 0, lineHeight: 1.5, flex: 1, minWidth: 240,
        }}>
          Pausas recurrentes dentro del día (ej. almuerzo 12-13h). Los slots
          que solapan con una pausa no aparecen disponibles para reservar.
        </p>
        <Button variant="primary" size="sm" onClick={() => setEditing({ mode: 'new' })}>
          + Nueva pausa
        </Button>
      </div>

      {error && <Banner kind="error" style={{ marginBottom: 12 }}>{error}</Banner>}

      {loading && <div style={{ padding: 30, textAlign: 'center', color: C.muted }}>Cargando…</div>}

      {!loading && breaks.length === 0 && (
        <Card padding={0} style={{ borderStyle: 'dashed' }}>
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 38, marginBottom: 12, opacity: 0.7 }}>⏸️</div>
            <div style={{
              fontSize: FONT_SIZE.base, color: C.text,
              fontWeight: FONT_WEIGHT.semibold,
            }}>Sin pausas configuradas</div>
            <div style={{
              fontSize: FONT_SIZE.sm, color: C.muted, marginTop: 6,
              maxWidth: 360, margin: '6px auto 0', lineHeight: 1.5,
            }}>
              Agregá una pausa de almuerzo o cualquier intervalo libre del día
              para que no se reserven turnos en ese horario.
            </div>
          </div>
        </Card>
      )}

      {!loading && breaks.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3, 4, 5, 6, 0].map(dow => {
            const dayBreaks = byDow[dow] || []
            if (dayBreaks.length === 0) return null
            return (
              <Card key={dow} padding={14}>
                <div style={{
                  fontSize: FONT_SIZE.xs, fontFamily: FONT.mono,
                  color: C.muted, textTransform: 'uppercase', letterSpacing: '.08em',
                  fontWeight: FONT_WEIGHT.semibold, marginBottom: 10,
                }}>{DAYS_ES[dow]}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {dayBreaks.map(b => (
                    <BreakRow
                      key={b.id} brk={b}
                      onEdit={() => setEditing({ mode: 'edit', brk: b })}
                      onDelete={() => handleDelete(b.id)}
                    />
                  ))}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {editing && (
        <BreakModal
          mode={editing.mode}
          brk={editing.brk}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load() }}
        />
      )}
    </div>
  )
}

function BreakRow({ brk: b, onEdit, onDelete }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '8px 12px',
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderLeft: `3px solid ${C.warning}`,
      borderRadius: RADIUS.sm,
      flexWrap: 'wrap',
    }}>
      <div style={{
        fontFamily: FONT.mono, fontWeight: FONT_WEIGHT.bold,
        color: C.warning, fontSize: FONT_SIZE.sm,
        flexShrink: 0, minWidth: 110,
      }}>
        {b.break_start?.slice(0, 5)} – {b.break_end?.slice(0, 5)}
      </div>
      <div style={{ flex: 1, fontSize: FONT_SIZE.sm, color: C.text, minWidth: 100 }}>
        {b.label || 'Pausa'}
      </div>
      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        <Button size="sm" variant="ghost" onClick={onEdit}>Editar</Button>
        <Button size="sm" variant="ghost" onClick={onDelete} style={{ color: C.danger }}>Borrar</Button>
      </div>
    </div>
  )
}

function BreakModal({ mode, brk, onClose, onSaved }) {
  const isEdit = mode === 'edit'
  const [form, setForm] = useState({
    day_of_week: brk?.day_of_week ?? 1,
    break_start: brk?.break_start?.slice(0, 5) || '12:00',
    break_end:   brk?.break_end?.slice(0, 5)   || '13:00',
    label:       brk?.label || 'Almuerzo',
  })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  const save = async () => {
    setSaving(true); setMsg(null)
    try {
      if (form.break_start >= form.break_end) {
        throw new Error('La hora de inicio debe ser anterior a la de fin.')
      }
      const { error } = await supabase.rpc('upsert_my_agenda_break', {
        p_id:    isEdit ? brk.id : null,
        p_dow:   parseInt(form.day_of_week, 10),
        p_start: form.break_start,
        p_end:   form.break_end,
        p_label: form.label?.trim() || null,
      })
      if (error) throw error
      onSaved && onSaved()
    } catch (e) {
      setMsg({ kind: 'error', text: e.message || 'Error al guardar' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalShell title={isEdit ? 'Editar pausa' : 'Nueva pausa'} onClose={onClose}>
      <FieldMini label="Día de la semana *">
        <select value={form.day_of_week}
          onChange={(e) => setForm(f => ({ ...f, day_of_week: e.target.value }))}
          style={{ ...fi, cursor: 'pointer' }}
        >
          {[1, 2, 3, 4, 5, 6, 0].map(dow => (
            <option key={dow} value={dow}>{DAYS_ES[dow]}</option>
          ))}
        </select>
      </FieldMini>

      <Row>
        <FieldMini label="Desde *">
          <input type="time" value={form.break_start}
            onChange={(e) => setForm(f => ({ ...f, break_start: e.target.value }))}
            style={fi}
          />
        </FieldMini>
        <FieldMini label="Hasta *">
          <input type="time" value={form.break_end}
            onChange={(e) => setForm(f => ({ ...f, break_end: e.target.value }))}
            style={fi}
          />
        </FieldMini>
      </Row>

      <FieldMini label="Nombre (opcional)" hint="Ej: Almuerzo, Limpieza, Reunión interna">
        <input value={form.label}
          onChange={(e) => setForm(f => ({ ...f, label: e.target.value }))}
          style={fi} maxLength={120}
          placeholder="Almuerzo"
        />
      </FieldMini>

      {msg && (
        <div style={{
          padding: '8px 12px', borderRadius: RADIUS.sm,
          background: C.dangerSoft, color: C.danger,
          fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold,
          marginBottom: 10,
        }}>{msg.text}</div>
      )}

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 10, flexWrap: 'wrap' }}>
        <Button variant="ghost" size="sm" onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button variant="primary" size="sm" onClick={save} disabled={saving} loading={saving}>
          {saving ? 'Guardando…' : (isEdit ? 'Guardar' : 'Crear pausa')}
        </Button>
      </div>
    </ModalShell>
  )
}

// ════════════════════════════════════════════════════════════════════
// TAB 4: EXCEPCIONES (feriados, vacaciones, días especiales)
// ════════════════════════════════════════════════════════════════════
function ExceptionsTab() {
  const [exceptions, setExceptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      // Cargar desde hoy hasta 1 año adelante
      const today = new Date().toISOString().slice(0, 10)
      const oneYear = new Date(); oneYear.setFullYear(oneYear.getFullYear() + 1)
      const to = oneYear.toISOString().slice(0, 10)

      const { data, error } = await supabase.rpc('list_my_agenda_exceptions', {
        p_from: today, p_to: to,
      })
      if (error) throw error
      setExceptions(data || [])
    } catch (e) {
      setError(e.message || 'Error cargando excepciones')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta excepción?')) return
    try {
      const { error } = await supabase.rpc('delete_my_agenda_exception', { p_id: id })
      if (error) throw error
      await load()
    } catch (e) {
      alert('Error: ' + (e.message || 'desconocido'))
    }
  }

  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 10, marginBottom: 14, flexWrap: 'wrap',
      }}>
        <p style={{
          fontSize: FONT_SIZE.sm, color: C.muted,
          margin: 0, lineHeight: 1.5, flex: 1, minWidth: 240,
        }}>
          Días que rompen tu horario normal: feriados, vacaciones, días con
          horario reducido. Sobre-escriben el horario semanal para esa fecha.
        </p>
        <Button variant="primary" size="sm" onClick={() => setEditing({ mode: 'new' })}>
          + Nueva excepción
        </Button>
      </div>

      {error && <Banner kind="error" style={{ marginBottom: 12 }}>{error}</Banner>}

      {loading && <div style={{ padding: 30, textAlign: 'center', color: C.muted }}>Cargando…</div>}

      {!loading && exceptions.length === 0 && (
        <Card padding={0} style={{ borderStyle: 'dashed' }}>
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 38, marginBottom: 12, opacity: 0.7 }}>📅</div>
            <div style={{
              fontSize: FONT_SIZE.base, color: C.text,
              fontWeight: FONT_WEIGHT.semibold,
            }}>Sin excepciones cargadas</div>
            <div style={{
              fontSize: FONT_SIZE.sm, color: C.muted, marginTop: 6,
              maxWidth: 360, margin: '6px auto 0', lineHeight: 1.5,
            }}>
              Agregá feriados o vacaciones para que la página pública muestre
              "cerrado" en esas fechas.
            </div>
          </div>
        </Card>
      )}

      {!loading && exceptions.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {exceptions.map(ex => (
            <ExceptionRow
              key={ex.id} ex={ex}
              onEdit={() => setEditing({ mode: 'edit', ex })}
              onDelete={() => handleDelete(ex.id)}
            />
          ))}
        </div>
      )}

      {editing && (
        <ExceptionModal
          mode={editing.mode}
          ex={editing.ex}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load() }}
        />
      )}
    </div>
  )
}

function ExceptionRow({ ex, onEdit, onDelete }) {
  const d = new Date(ex.exception_date + 'T12:00:00')
  const dateStr = d.toLocaleDateString('es-AR', { weekday: 'long', day: '2-digit', month: 'long' })
  const isClosed = ex.is_closed

  return (
    <Card padding={12} style={{
      display: 'flex', alignItems: 'center', gap: 12,
      borderLeft: `3px solid ${isClosed ? C.danger : C.warning}`,
      flexWrap: 'wrap',
    }}>
      <div style={{ flexShrink: 0, minWidth: 130 }}>
        <div style={{
          fontFamily: FONT.mono, fontSize: FONT_SIZE.xs, color: C.muted,
          fontWeight: FONT_WEIGHT.semibold, textTransform: 'uppercase',
          letterSpacing: '.05em',
        }}>{ex.exception_date}</div>
        <div style={{
          fontSize: FONT_SIZE.sm, color: C.text,
          marginTop: 2, textTransform: 'capitalize',
        }}>{dateStr}</div>
      </div>
      <div style={{ flex: 1, minWidth: 140 }}>
        <div style={{
          fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.semibold,
          color: C.text,
        }}>
          {ex.label || (isClosed ? 'Día cerrado' : 'Horario especial')}
        </div>
        <div style={{
          fontSize: FONT_SIZE.xs, fontFamily: FONT.mono,
          color: isClosed ? C.danger : C.warning, marginTop: 2,
        }}>
          {isClosed
            ? '🚫 CERRADO'
            : `⏰ ${ex.open_time?.slice(0, 5) || '?'} – ${ex.close_time?.slice(0, 5) || '?'}`}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        <Button size="sm" variant="ghost" onClick={onEdit}>Editar</Button>
        <Button size="sm" variant="ghost" onClick={onDelete} style={{ color: C.danger }}>Borrar</Button>
      </div>
    </Card>
  )
}

function ExceptionModal({ mode, ex, onClose, onSaved }) {
  const isEdit = mode === 'edit'
  const todayStr = new Date().toISOString().slice(0, 10)

  const [form, setForm] = useState({
    exception_date: ex?.exception_date || todayStr,
    is_closed:      ex?.is_closed ?? true,
    open_time:      ex?.open_time?.slice(0, 5) || '09:00',
    close_time:     ex?.close_time?.slice(0, 5) || '18:00',
    label:          ex?.label || '',
  })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  const save = async () => {
    setSaving(true); setMsg(null)
    try {
      if (!form.exception_date) throw new Error('La fecha es obligatoria')
      if (!form.is_closed && form.open_time >= form.close_time) {
        throw new Error('La hora de apertura debe ser anterior al cierre.')
      }
      const { error } = await supabase.rpc('upsert_my_agenda_exception', {
        p_id:        isEdit ? ex.id : null,
        p_date:      form.exception_date,
        p_is_closed: !!form.is_closed,
        p_open:      form.is_closed ? null : form.open_time,
        p_close:     form.is_closed ? null : form.close_time,
        p_label:     form.label?.trim() || null,
      })
      if (error) throw error
      onSaved && onSaved()
    } catch (e) {
      setMsg({ kind: 'error', text: e.message || 'Error al guardar' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalShell title={isEdit ? 'Editar excepción' : 'Nueva excepción'} onClose={onClose}>
      <FieldMini label="Fecha *" hint="El día específico que rompe tu horario normal">
        <input type="date" value={form.exception_date}
          onChange={(e) => setForm(f => ({ ...f, exception_date: e.target.value }))}
          style={fi}
        />
      </FieldMini>

      <FieldMini label="Nombre (opcional)" hint="Ej: Feriado, Vacaciones, Capacitación">
        <input value={form.label}
          onChange={(e) => setForm(f => ({ ...f, label: e.target.value }))}
          style={fi} maxLength={120}
          placeholder="Feriado Día de la Patria"
        />
      </FieldMini>

      <div style={{
        display: 'flex', flexDirection: 'column', gap: 0,
        background: C.surface, borderRadius: RADIUS.md,
        border: `1px solid ${C.border}`, overflow: 'hidden',
        marginBottom: 12,
      }}>
        <label style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 14px', cursor: 'pointer',
          background: form.is_closed ? C.dangerSoft : 'transparent',
          borderBottom: `1px solid ${C.border}`,
        }}>
          <input type="radio" name="closed" checked={form.is_closed}
            onChange={() => setForm(f => ({ ...f, is_closed: true }))}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold, color: C.text }}>
              🚫 Día cerrado
            </div>
            <div style={{ fontSize: FONT_SIZE.xs, color: C.muted, marginTop: 2 }}>
              No tomás turnos ese día
            </div>
          </div>
        </label>
        <label style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 14px', cursor: 'pointer',
          background: !form.is_closed ? C.warningSoft : 'transparent',
        }}>
          <input type="radio" name="closed" checked={!form.is_closed}
            onChange={() => setForm(f => ({ ...f, is_closed: false }))}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold, color: C.text }}>
              ⏰ Horario especial
            </div>
            <div style={{ fontSize: FONT_SIZE.xs, color: C.muted, marginTop: 2 }}>
              Atendés con horario distinto al habitual
            </div>
          </div>
        </label>
      </div>

      {!form.is_closed && (
        <Row>
          <FieldMini label="Apertura *">
            <input type="time" value={form.open_time}
              onChange={(e) => setForm(f => ({ ...f, open_time: e.target.value }))}
              style={fi}
            />
          </FieldMini>
          <FieldMini label="Cierre *">
            <input type="time" value={form.close_time}
              onChange={(e) => setForm(f => ({ ...f, close_time: e.target.value }))}
              style={fi}
            />
          </FieldMini>
        </Row>
      )}

      {msg && (
        <div style={{
          padding: '8px 12px', borderRadius: RADIUS.sm,
          background: C.dangerSoft, color: C.danger,
          fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold,
          marginBottom: 10,
        }}>{msg.text}</div>
      )}

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 10, flexWrap: 'wrap' }}>
        <Button variant="ghost" size="sm" onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button variant="primary" size="sm" onClick={save} disabled={saving} loading={saving}>
          {saving ? 'Guardando…' : (isEdit ? 'Guardar' : 'Crear excepción')}
        </Button>
      </div>
    </ModalShell>
  )
}

// ════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════
export default function AgendaConfig() {
  const nav = useNavigate()
  const location = useLocation()

  // Detect parent path para "← Volver a Agenda"
  const isRetail = location.pathname.startsWith('/mi-cuenta')
  const backPath = isRetail ? '/mi-cuenta/agenda' : '/cliente/agenda'

  // Tab state via URL hash (#servicios | #horarios | #pausas | #excepciones)
  const validTabs = ['servicios', 'horarios', 'pausas', 'excepciones']
  const hashTab = location.hash.replace('#', '')
  const initialTab = validTabs.includes(hashTab) ? hashTab : 'servicios'
  const [tab, setTab] = useState(initialTab)

  useEffect(() => {
    // Sync hash when tab changes
    if (location.hash.replace('#', '') !== tab) {
      window.history.replaceState(null, '', `${location.pathname}#${tab}`)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  const tabs = [
    { id: 'servicios',   label: 'Servicios',   icon: '🛎️' },
    { id: 'horarios',    label: 'Horarios',    icon: '🕐' },
    { id: 'pausas',      label: 'Pausas',      icon: '⏸️' },
    { id: 'excepciones', label: 'Excepciones', icon: '📅' },
  ]

  return (
    <div>
      {/* Back button */}
      <button
        onClick={() => nav(backPath)}
        style={{
          background: 'transparent', border: 'none', color: C.muted,
          fontSize: FONT_SIZE.sm, cursor: 'pointer',
          padding: '4px 0', marginBottom: 8,
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontFamily: 'inherit',
        }}
      >
        ← Volver a Agenda
      </button>

      <PageHeader
        eyebrow="CONFIGURACIÓN"
        title="Configurá tu agenda"
        subtitle="Servicios, horarios de atención, pausas y excepciones. Estos datos definen qué slots ven tus clientes en la página pública."
      />

      <Card padding={0} style={{ marginBottom: 16, overflow: 'visible' }}>
        <div style={{ padding: '8px 8px 0', borderBottom: `1px solid ${C.border}` }}>
          <TabBar value={tab} onChange={setTab} tabs={tabs} />
        </div>
        <div style={{ padding: 18 }}>
          {tab === 'servicios'   && <ServicesTab />}
          {tab === 'horarios'    && <HoursTab />}
          {tab === 'pausas'      && <BreaksTab />}
          {tab === 'excepciones' && <ExceptionsTab />}
        </div>
      </Card>
    </div>
  )
}
