// ═══════════════════════════════════════════════════════════════════
// RetailGrupo — Gestión de grupos de WhatsApp (wasender, SOLO retail)
// 20/05/2026 — Fase 2 + 3: enviar mensajes al grupo, ver el chat saliente
// y programar mensajes. Backend: EF wa-groups (list/send) + RPCs
// get_my_wa_groups / get_my_wa_group_messages / schedule_my_wa_group_message
// / get_my_scheduled_group_messages / cancel_my_scheduled_group_message.
// ═══════════════════════════════════════════════════════════════════
import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import {
  PageHeader, SectionHeader, Card, Button, Banner,
  COLORS as C, RADIUS, FONT_SIZE, FONT_WEIGHT, FONT, TRANSITION, Z,
} from '../../components/ui'

const SB_URL = import.meta.env.VITE_SUPABASE_URL || 'https://dvzxkortcvuakjhsidrr.supabase.co'

const fi = {
  width: '100%', background: C.bg,
  border: `1px solid ${C.border}`, borderRadius: RADIUS.md,
  padding: '10px 12px', color: C.text,
  fontSize: FONT_SIZE.base, outline: 'none',
  boxSizing: 'border-box', fontFamily: 'inherit',
}

function fmtDateTime(iso) {
  if (!iso) return ''
  try { return new Date(iso).toLocaleString('es-AR') } catch { return iso }
}

// Convierte un valor datetime-local (sin tz) a ISO en hora local AR
function localInputToISO(v) {
  if (!v) return null
  // v viene como "2026-05-21T15:30" (hora local del navegador)
  const d = new Date(v)
  if (isNaN(d.getTime())) return null
  return d.toISOString()
}

export default function RetailGrupo() {
  const { retail } = useAuth()
  const [groups, setGroups] = useState([])
  const [activeJid, setActiveJid] = useState('')
  const [messages, setMessages] = useState([])
  const [scheduled, setScheduled] = useState([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [sending, setSending] = useState(false)
  const [text, setText] = useState('')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  // Programar
  const [schedText, setSchedText] = useState('')
  const [schedWhen, setSchedWhen] = useState('')   // datetime-local (solo 'once')
  const [schedBusy, setSchedBusy] = useState(false)
  const [repeatType, setRepeatType] = useState('once')  // once | daily | weekly
  const [repeatTime, setRepeatTime] = useState('09:00') // HH:MM AR (daily/weekly)
  const [repeatDays, setRepeatDays] = useState([])      // dow 0..6 (0=domingo)

  const chatEndRef = useRef(null)

  const notWasender = retail && retail.wa_provider !== 'wasender'

  // ── Cargar grupos guardados ──
  const loadGroups = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_my_wa_groups')
      if (error) throw error
      const gs = data?.groups || []
      setGroups(gs)
      if (gs.length > 0 && !activeJid) setActiveJid(gs[0].group_jid)
    } catch (e) {
      setErr(e.message || 'Error cargando grupos')
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { loadGroups() }, [loadGroups])

  // ── Cargar mensajes + programados del grupo activo ──
  const loadMessages = useCallback(async (jid) => {
    if (!jid) return
    try {
      const { data, error } = await supabase.rpc('get_my_wa_group_messages', {
        p_group_jid: jid, p_limit: 200,
      })
      if (error) throw error
      setMessages(data?.messages || [])
    } catch (e) {
      console.error('loadMessages:', e)
    }
  }, [])

  const loadScheduled = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_my_scheduled_group_messages')
      if (error) throw error
      setScheduled(data?.scheduled || [])
    } catch (e) {
      console.error('loadScheduled:', e)
    }
  }, [])

  useEffect(() => {
    if (activeJid) { loadMessages(activeJid); loadScheduled() }
  }, [activeJid, loadMessages, loadScheduled])

  // Auto-refresh del chat cada 20s (los mensajes nuevos llegan por webhook a DB)
  useEffect(() => {
    if (!activeJid) return
    const t = setInterval(() => loadMessages(activeJid), 20000)
    return () => clearInterval(t)
  }, [activeJid, loadMessages])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Sincronizar grupos desde wasender (EF wa-groups action=list) ──
  const syncGroups = async () => {
    setSyncing(true); setErr(''); setMsg('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${SB_URL}/functions/v1/wa-groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify({ action: 'list' }),
      })
      const out = await res.json()
      if (!res.ok || !out.ok) throw new Error(out.error || 'Error sincronizando')
      await loadGroups()
      setMsg('✓ Grupos actualizados')
      setTimeout(() => setMsg(''), 2500)
    } catch (e) {
      setErr(e.message || 'Error sincronizando grupos')
    } finally {
      setSyncing(false)
    }
  }

  // ── Enviar mensaje al grupo (EF wa-groups action=send) ──
  const sendMessage = async () => {
    const t = text.trim()
    if (!t || !activeJid) return
    setSending(true); setErr(''); setMsg('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${SB_URL}/functions/v1/wa-groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify({ action: 'send', group_jid: activeJid, text: t }),
      })
      const out = await res.json()
      if (!res.ok || !out.ok) throw new Error(out.error || out.detail || 'Error enviando')
      setText('')
      // Recargar el chat para ver el mensaje recién enviado
      await loadMessages(activeJid)
    } catch (e) {
      setErr(e.message || 'Error enviando mensaje')
    } finally {
      setSending(false)
    }
  }

  const toggleDay = (d) => {
    setRepeatDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort())
  }

  // ── Programar mensaje (única o recurrente) ──
  const scheduleMessage = async () => {
    const t = schedText.trim()
    if (!t) { setErr('Escribí el mensaje a programar'); return }

    const params = { p_group_jid: activeJid, p_body: t, p_repeat_type: repeatType }
    if (repeatType === 'once') {
      const iso = localInputToISO(schedWhen)
      if (!iso) { setErr('Elegí fecha y hora válidas'); return }
      if (new Date(iso).getTime() <= Date.now()) { setErr('La fecha debe ser futura'); return }
      params.p_send_at = iso
    } else {
      if (!/^\d{1,2}:\d{2}$/.test(repeatTime)) { setErr('Hora inválida (HH:MM)'); return }
      params.p_repeat_time = repeatTime
      if (repeatType === 'weekly') {
        if (repeatDays.length === 0) { setErr('Elegí al menos un día'); return }
        params.p_repeat_days = repeatDays
      }
    }

    setSchedBusy(true); setErr(''); setMsg('')
    try {
      const { data, error } = await supabase.rpc('schedule_my_wa_group_message', params)
      if (error) throw error
      if (!data?.ok) throw new Error('No se pudo programar')
      setSchedText(''); setSchedWhen(''); setRepeatDays([])
      await loadScheduled()
      setMsg('✓ Mensaje programado')
      setTimeout(() => setMsg(''), 2500)
    } catch (e) {
      setErr(e.message || 'Error programando')
    } finally {
      setSchedBusy(false)
    }
  }

  // Pausar / reanudar un recurrente
  const toggleScheduled = async (id, active) => {
    try {
      const { error } = await supabase.rpc('toggle_my_scheduled_group_message', {
        p_id: id, p_active: active,
      })
      if (error) throw error
      await loadScheduled()
    } catch (e) {
      setErr(e.message || 'Error')
    }
  }

  const cancelScheduled = async (id) => {
    if (!confirm('¿Cancelar este mensaje programado?')) return
    try {
      const { error } = await supabase.rpc('cancel_my_scheduled_group_message', { p_id: id })
      if (error) throw error
      await loadScheduled()
    } catch (e) {
      setErr(e.message || 'Error cancelando')
    }
  }

  const activeGroup = groups.find(g => g.group_jid === activeJid)

  const DOW_LABEL = { 0:'Dom', 1:'Lun', 2:'Mar', 3:'Mié', 4:'Jue', 5:'Vie', 6:'Sáb' }
  const describeRepeat = (s) => {
    if (s.repeat_type === 'daily') return `Todos los días ${s.repeat_time}`
    if (s.repeat_type === 'weekly') {
      const days = (s.repeat_days || []).map(d => DOW_LABEL[d]).join(', ')
      return `${days} ${s.repeat_time}`
    }
    return fmtDateTime(s.send_at)
  }

  if (notWasender) {
    return (
      <div>
        <PageHeader eyebrow="WhatsApp" title="Grupo"
          subtitle="Administrá tu grupo de WhatsApp desde acá." />
        <Banner variant="tip" title="No disponible">
          La gestión de grupos requiere que tu línea de WhatsApp esté conectada vía Wasender.
          Tu cuenta actual usa otro proveedor.
        </Banner>
      </div>
    )
  }

  return (
    <div>
      <PageHeader eyebrow="WhatsApp" title="Grupo"
        subtitle="Enviá mensajes a tu grupo, mirá lo que se publicó y programá mensajes." />

      {err && <Banner variant="danger" style={{ marginBottom: 12 }}>{err}</Banner>}
      {msg && <Banner variant="success" style={{ marginBottom: 12 }}>{msg}</Banner>}

      {/* Selector de grupo + sync */}
      <Card padding={16} style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{
              fontSize: FONT_SIZE.xs, color: C.muted, textTransform: 'uppercase',
              letterSpacing: '.08em', display: 'block', marginBottom: 5,
              fontFamily: FONT.mono, fontWeight: FONT_WEIGHT.semibold,
            }}>Grupo</label>
            {loading ? (
              <div style={{ color: C.muted, fontSize: FONT_SIZE.sm }}>Cargando…</div>
            ) : groups.length === 0 ? (
              <div style={{ color: C.muted, fontSize: FONT_SIZE.sm }}>
                No hay grupos sincronizados. Tocá "Actualizar grupos".
              </div>
            ) : (
              <select value={activeJid} onChange={e => setActiveJid(e.target.value)}
                style={{ ...fi, cursor: 'pointer' }}>
                {groups.map(g => (
                  <option key={g.group_jid} value={g.group_jid}>{g.name || g.group_jid}</option>
                ))}
              </select>
            )}
          </div>
          <Button variant="secondary" onClick={syncGroups} disabled={syncing} loading={syncing}
            style={{ alignSelf: 'flex-end' }}>
            {syncing ? 'Actualizando…' : '🔄 Actualizar grupos'}
          </Button>
        </div>
      </Card>

      {activeJid && (
        <>
          {/* Chat del grupo (solo saliente) */}
          <Card padding={0} style={{ marginBottom: 14, overflow: 'hidden' }}>
            <div style={{
              padding: '12px 16px', borderBottom: `1px solid ${C.border}`,
              fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold, color: C.text,
            }}>
              💬 {activeGroup?.name || 'Grupo'}
              <span style={{ color: C.muted, fontWeight: 400, marginLeft: 8, fontSize: FONT_SIZE.xs }}>
                — mensajes publicados
              </span>
            </div>
            <div style={{
              maxHeight: 380, overflowY: 'auto', padding: 16,
              display: 'flex', flexDirection: 'column', gap: 8, background: C.bg,
            }}>
              {messages.length === 0 ? (
                <div style={{ color: C.muted, fontSize: FONT_SIZE.sm, textAlign: 'center', padding: 24 }}>
                  Todavía no hay mensajes. Los que envíes desde acá o desde tu teléfono aparecerán acá.
                </div>
              ) : messages.map(m => (
                <div key={m.id} style={{
                  alignSelf: 'flex-end', maxWidth: '78%',
                  background: C.primarySoft || 'rgba(45,107,216,0.12)',
                  border: `1px solid ${C.border}`,
                  borderRadius: '12px 12px 4px 12px', padding: '8px 12px',
                }}>
                  <div style={{ fontSize: FONT_SIZE.base, color: C.text, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {m.body || <em style={{ color: C.muted }}>(sin texto)</em>}
                  </div>
                  <div style={{
                    fontSize: 10, color: C.muted, marginTop: 4, textAlign: 'right',
                    fontFamily: FONT.mono,
                  }}>
                    {m.author === 'phone' ? '📱 teléfono' : m.author === 'scheduled' ? '⏰ programado' : '💻 app'}
                    {' · '}{fmtDateTime(m.sent_at)}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            {/* Caja de envío */}
            <div style={{
              padding: 12, borderTop: `1px solid ${C.border}`,
              display: 'flex', gap: 8, alignItems: 'flex-end',
            }}>
              <textarea value={text} onChange={e => setText(e.target.value)}
                placeholder="Escribí un mensaje para el grupo…"
                rows={2} maxLength={4000}
                style={{ ...fi, fontFamily: 'inherit', resize: 'vertical', minHeight: 44 }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) sendMessage()
                }}
              />
              <Button variant="primary" onClick={sendMessage} disabled={sending || !text.trim()} loading={sending}>
                {sending ? 'Enviando…' : 'Enviar'}
              </Button>
            </div>
          </Card>

          {/* Programar mensaje */}
          <Card padding={18} style={{ marginBottom: 14 }}>
            <SectionHeader title="⏰ Programar mensaje" style={{ marginBottom: 14 }} />
            <p style={{ fontSize: FONT_SIZE.sm, color: C.muted, margin: '0 0 14px', lineHeight: 1.5 }}>
              El mensaje se enviará automáticamente al grupo en la fecha y hora que elijas.
            </p>
            <textarea value={schedText} onChange={e => setSchedText(e.target.value)}
              placeholder="Mensaje a programar…" rows={3} maxLength={4000}
              style={{ ...fi, fontFamily: 'inherit', resize: 'vertical', minHeight: 70, marginBottom: 10 }}
            />
            {/* Tipo de repetición */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
              {[
                { v: 'once',   l: 'Una vez' },
                { v: 'daily',  l: 'Todos los días' },
                { v: 'weekly', l: 'Días de la semana' },
              ].map(opt => (
                <button key={opt.v} type="button" onClick={() => setRepeatType(opt.v)}
                  style={{
                    padding: '7px 14px', borderRadius: RADIUS.pill || 999, cursor: 'pointer',
                    fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.medium,
                    border: `1px solid ${repeatType === opt.v ? C.primary : C.border}`,
                    background: repeatType === opt.v ? (C.primarySoft || 'rgba(45,107,216,0.15)') : 'transparent',
                    color: repeatType === opt.v ? (C.primaryLite || C.primary) : C.muted,
                    transition: TRANSITION?.fast || 'all .15s',
                  }}>{opt.l}</button>
              ))}
            </div>

            {/* Config según tipo */}
            {repeatType === 'once' ? (
              <div style={{ marginBottom: 10 }}>
                <input type="datetime-local" value={schedWhen} onChange={e => setSchedWhen(e.target.value)}
                  style={{ ...fi, maxWidth: 240, fontFamily: FONT.mono }} />
              </div>
            ) : (
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: repeatType === 'weekly' ? 12 : 0 }}>
                  <span style={{ fontSize: FONT_SIZE.sm, color: C.muted }}>A las</span>
                  <input type="time" value={repeatTime} onChange={e => setRepeatTime(e.target.value)}
                    style={{ ...fi, maxWidth: 130, fontFamily: FONT.mono }} />
                  <span style={{ fontSize: FONT_SIZE.xs, color: C.dim || C.muted }}>(hora Argentina)</span>
                </div>
                {repeatType === 'weekly' && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {[
                      { d: 1, l: 'Lun' }, { d: 2, l: 'Mar' }, { d: 3, l: 'Mié' },
                      { d: 4, l: 'Jue' }, { d: 5, l: 'Vie' }, { d: 6, l: 'Sáb' }, { d: 0, l: 'Dom' },
                    ].map(({ d, l }) => (
                      <button key={d} type="button" onClick={() => toggleDay(d)}
                        style={{
                          width: 46, padding: '7px 0', borderRadius: RADIUS.md, cursor: 'pointer',
                          fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.semibold,
                          border: `1px solid ${repeatDays.includes(d) ? C.primary : C.border}`,
                          background: repeatDays.includes(d) ? (C.primarySoft || 'rgba(45,107,216,0.15)') : 'transparent',
                          color: repeatDays.includes(d) ? (C.primaryLite || C.primary) : C.muted,
                        }}>{l}</button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <Button variant="primary" onClick={scheduleMessage}
              disabled={schedBusy || !schedText.trim() || (repeatType === 'once' && !schedWhen) || (repeatType === 'weekly' && repeatDays.length === 0)}
              loading={schedBusy}>
              {schedBusy ? 'Programando…' : 'Programar →'}
            </Button>

            {/* Lista de programados */}
            {scheduled.length > 0 && (
              <div style={{ marginTop: 18 }}>
                <div style={{
                  fontSize: 11, color: C.muted, textTransform: 'uppercase',
                  letterSpacing: '.06em', marginBottom: 8, fontWeight: 600, fontFamily: FONT.mono,
                }}>Programados</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {scheduled.map(s => {
                    const stColor = s.status === 'sent' ? C.success
                      : s.status === 'failed' ? C.danger
                      : s.status === 'cancelled' ? C.muted : C.warning
                    return (
                      <div key={s.id} style={{
                        background: C.surface || C.card, border: `1px solid ${C.border}`,
                        borderRadius: RADIUS.md, padding: '10px 12px',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10,
                      }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: FONT_SIZE.sm, color: C.text, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {s.body}
                          </div>
                          <div style={{ fontSize: 11, color: C.muted, marginTop: 4, fontFamily: FONT.mono }}>
                            {s.repeat_type !== 'once' && <span style={{ marginRight: 6 }}>🔁</span>}
                            {describeRepeat(s)}
                            {s.repeat_type !== 'once' && s.is_active && s.next_run_at && (
                              <span style={{ color: C.dim || C.muted, marginLeft: 6 }}>· próx: {fmtDateTime(s.next_run_at)}</span>
                            )}
                            <span style={{
                              color: s.repeat_type !== 'once' && !s.is_active ? C.muted : stColor,
                              marginLeft: 8, textTransform: 'uppercase', fontWeight: 600,
                            }}>
                              {s.repeat_type !== 'once' ? (s.is_active ? 'activo' : 'pausado') : s.status}
                            </span>
                            {s.error_msg && <span style={{ color: C.danger, marginLeft: 8 }}>· {s.error_msg}</span>}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                          {s.repeat_type !== 'once' ? (
                            <Button variant="ghost" size="sm" onClick={() => toggleScheduled(s.id, !s.is_active)}>
                              {s.is_active ? 'Pausar' : 'Reanudar'}
                            </Button>
                          ) : s.status === 'pending' && (
                            <Button variant="ghost" size="sm" onClick={() => cancelScheduled(s.id)}
                              style={{ color: C.danger }}>Cancelar</Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </Card>

          <Banner variant="tip" size="sm">
            ⚠️ WhatsApp puede restringir tu número si el grupo recibe reportes de spam.
            Enviá solo contenido que tus miembros esperan recibir.
          </Banner>
        </>
      )}
    </div>
  )
}
