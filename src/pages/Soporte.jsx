import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import {
  PageContainer, PageHeader, Card,
  Button, Chip, Banner,
  COLORS as C, RADIUS, FONT_SIZE, FONT_WEIGHT, FONT, TRANSITION,
} from '../components/ui'

// ═══════════════════════════════════════════════════════════════════
// MAPPINGS
// ═══════════════════════════════════════════════════════════════════
const STATUS_MAP = {
  open:        { label: 'Abierto',     color: C.warning, semantic: 'warning' },
  in_progress: { label: 'En progreso', color: C.info,    semantic: 'info'    },
  resolved:    { label: 'Resuelto',    color: C.success, semantic: 'success' },
  closed:      { label: 'Cerrado',     color: C.muted,   semantic: 'muted'   },
}

const PRIORITY_MAP = {
  low:    { label: 'Baja',    color: C.muted   },
  normal: { label: 'Normal',  color: '#8B8E9F' },
  high:   { label: 'Alta',    color: C.warning },
  urgent: { label: 'Urgente', color: C.danger  },
}

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })

const fmtDateTime = (d) =>
  new Date(d).toLocaleString('es-AR', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })

// ═══════════════════════════════════════════════════════════════════
// TICKET CHAT — modal bottom-sheet
// ═══════════════════════════════════════════════════════════════════
function TicketChat({ ticket, onClose }) {
  const [replies, setReplies] = useState([])
  const [msg, setMsg]         = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  useEffect(() => {
    supabase.from('ticket_replies').select('*')
      .eq('ticket_id', ticket.id)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setReplies(data || [])
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'auto' }), 50)
      })
  }, [ticket.id])

  useEffect(() => {
    const channel = supabase.channel(`ticket-${ticket.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'ticket_replies',
        filter: `ticket_id=eq.${ticket.id}`,
      }, (payload) => {
        setReplies(prev => [...prev, payload.new])
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [ticket.id])

  const sendMsg = async () => {
    if (!msg.trim() || sending) return
    setSending(true)
    const text = msg.trim()
    setMsg('')
    // SECURITY (audit H4 19/05/2026): el `author` lo manda el cliente y un
    // atacante puede setear 'admin' para impersonar staff. La defensa real
    // vive en DB: RLS policy WITH CHECK (author='client') para role
    // authenticated, o RPC support_post_reply(p_ticket_id, p_message) que
    // hardcodea author server-side desde auth.uid(). Hasta que se aplique
    // esa migración, dejamos esto como hint del cliente — pero el server
    // DEBE validar/sobrescribir.
    await supabase.from('ticket_replies').insert({
      ticket_id: ticket.id, author: 'client', message: text,
    })
    setSending(false)
    inputRef.current?.focus()
  }

  const st = STATUS_MAP[ticket.status] || STATUS_MAP.open
  const isClosed = ticket.status === 'resolved' || ticket.status === 'closed'

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        width: '100%',
        height: '90vh',
        maxHeight: 720,
        background: C.surface,
        borderRadius: `${RADIUS.xl} ${RADIUS.xl} 0 0`,
        border: `1px solid ${C.border}`,
        borderBottom: 'none',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '14px 20px',
          borderBottom: `1px solid ${C.border}`,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexShrink: 0,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontSize: FONT_SIZE.base,
              fontWeight: FONT_WEIGHT.semibold,
              color: C.text,
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>{ticket.subject}</p>
            <p style={{
              fontSize: FONT_SIZE.sm,
              color: C.muted,
              marginTop: 2,
              marginBottom: 0,
              fontFamily: FONT.mono,
            }}>
              #{ticket.id.slice(0, 8)} ·{' '}
              <span style={{ color: st.color, fontWeight: FONT_WEIGHT.semibold }}>{st.label}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: C.border,
              border: 'none',
              borderRadius: RADIUS.md,
              width: 32,
              height: 32,
              cursor: 'pointer',
              color: C.muted,
              fontSize: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: `background ${TRANSITION.fast}`,
            }}
            aria-label="Cerrar"
          >✕</button>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}>
          {/* Primer mensaje (ticket.message) */}
          <Bubble
            isAdmin={false}
            author="Vos"
            date={ticket.created_at}
            message={ticket.message}
          />
          {/* Respuestas */}
          {replies.map(r => (
            <Bubble
              key={r.id}
              isAdmin={r.author === 'admin'}
              author={r.author === 'admin' ? '🛡 Innovate.ia' : 'Vos'}
              date={r.created_at}
              message={r.message}
            />
          ))}
          {isClosed && (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <Chip variant="tag" color={st.semantic} size="sm">
                Ticket {st.label.toLowerCase()}
              </Chip>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Composer */}
        {!isClosed ? (
          <div style={{
            padding: '12px 16px',
            borderTop: `1px solid ${C.border}`,
            display: 'flex',
            gap: 8,
            flexShrink: 0,
            background: C.bg,
          }}>
            <input
              ref={inputRef}
              value={msg}
              onChange={e => setMsg(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMsg()}
              placeholder="Escribí tu mensaje..."
              style={{
                flex: 1,
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: RADIUS.md,
                padding: '10px 14px',
                color: C.text,
                fontSize: FONT_SIZE.base,
                outline: 'none',
                fontFamily: 'inherit',
                transition: `border-color ${TRANSITION.fast}`,
              }}
              onFocus={e => { e.target.style.borderColor = `${C.brand}55` }}
              onBlur={e => { e.target.style.borderColor = C.border }}
            />
            <Button
              variant="primary"
              onClick={sendMsg}
              disabled={sending || !msg.trim()}
              loading={sending}
              style={{ minWidth: 56 }}
            >→</Button>
          </div>
        ) : (
          <div style={{
            padding: '12px 16px',
            borderTop: `1px solid ${C.border}`,
            background: C.bg,
            textAlign: 'center',
          }}>
            <span style={{ fontSize: FONT_SIZE.md, color: C.muted }}>
              Este ticket está {st.label.toLowerCase()}. Para más ayuda, abrí uno nuevo.
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

function Bubble({ isAdmin, author, date, message }) {
  return (
    <div style={{
      alignSelf: isAdmin ? 'flex-start' : 'flex-end',
      maxWidth: '95%',
      background: isAdmin ? `${C.brand}0C` : '#1a2035',
      border: isAdmin ? `1px solid ${C.brand}26` : '1px solid #253050',
      borderRadius: isAdmin
        ? `${RADIUS.sm} ${RADIUS.md} ${RADIUS.md} ${RADIUS.md}`
        : `${RADIUS.md} ${RADIUS.sm} ${RADIUS.md} ${RADIUS.md}`,
      padding: '10px 14px',
    }}>
      <p style={{
        fontSize: 10,
        margin: '0 0 6px',
        fontFamily: FONT.mono,
        color: isAdmin ? C.brand : C.muted,
        fontWeight: FONT_WEIGHT.semibold,
      }}>
        {author} · {fmtDateTime(date)}
      </p>
      <p style={{
        fontSize: FONT_SIZE.base,
        color: C.text,
        lineHeight: 1.6,
        whiteSpace: 'pre-wrap',
        margin: 0,
      }}>{message}</p>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════
export default function Soporte() {
  // 12/05/2026 FIX: el componente se usa desde el panel partner (tenant)
  // Y también desde el panel retail (/mi-cuenta/soporte) donde useAuth()
  // devuelve `retail` y no `tenant`. Soportamos ambos contextos: la
  // entidad efectiva es la primera que esté definida. Ambas son rows
  // de `tenants` (el retail es un tenant tier=retail), así que la query
  // por tenant_id funciona idéntico para ambos.
  const { tenant, retail } = useAuth()
  const entity = tenant || retail
  // Identificamos si estamos en contexto retail para decidir el wrapper:
  // - retail: el <main> del RetailLayout YA tiene padding lateral
  //   clamp(16px, 3vw, 24px). Si encima usamos PageContainer, se duplica
  //   y el header queda desalineado vs Productos/Pedidos/Ventas.
  // - partner (tenant): usa PageContainer normal porque su layout no
  //   provee padding lateral propio.
  const isRetailContext = !tenant && !!retail
  const Wrapper = isRetailContext ? 'div' : PageContainer

  const [tickets,    setTickets]    = useState([])
  const [loading,    setLoading]    = useState(true)
  const [showForm,   setShowForm]   = useState(false)
  const [activeChat, setActiveChat] = useState(null)
  const [form,       setForm]       = useState({ subject: '', message: '', priority: 'normal' })
  const [sending,    setSending]    = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  const load = () => {
    if (!entity) return
    setLoading(true)
    supabase.from('support_tickets')
      .select('*, ticket_replies(count)')
      .eq('tenant_id', entity.id)
      .order('updated_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error('[Soporte] load error:', error)
        setTickets(data || [])
        setLoading(false)
      })
  }

  useEffect(() => { load() }, [entity?.id])

  useEffect(() => {
    if (!entity) return
    const ch = supabase.channel(`soporte-${entity.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'support_tickets',
        filter: `tenant_id=eq.${entity.id}`,
      }, () => load())
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'ticket_replies',
      }, () => load())
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [entity?.id])

  const submitTicket = async () => {
    if (!form.subject.trim() || !form.message.trim() || sending) return
    setSending(true)
    const { data, error } = await supabase.from('support_tickets').insert({
      tenant_id: entity.id,
      subject: form.subject.trim(),
      message: form.message.trim(),
      priority: form.priority,
    }).select().single()
    if (!error && data) {
      setSuccessMsg('Ticket enviado. El equipo de Innovate.ia te responde pronto.')
      setForm({ subject: '', message: '', priority: 'normal' })
      setShowForm(false)
      setTimeout(() => setSuccessMsg(''), 5000)
      load()
      setActiveChat(data)
    } else if (error) {
      console.error('[Soporte] submit error:', error)
      setSuccessMsg('⚠ No se pudo enviar el ticket. Reintentá en unos minutos.')
      setTimeout(() => setSuccessMsg(''), 5000)
    }
    setSending(false)
  }

  const submitDisabled = sending || !form.subject.trim() || !form.message.trim()

  // Si todavía no se cargó la entidad (auth en flight), mostramos un
  // estado "cargando" en lugar del header con botón "+ Nuevo ticket"
  // habilitado contra entity=undefined que crashearía al click.
  if (!entity) {
    return (
      <Wrapper>
        <div style={{ color: C.muted, padding: 20 }}>Cargando…</div>
      </Wrapper>
    )
  }

  return (
    <Wrapper>
      {/* 12/05/2026: header unificado usando PageHeader (eyebrow + título
          grande + subtítulo), mismo lenguaje visual que RetailCatalogo /
          Pedidos / Ventas. El botón "+ Nuevo ticket" se renderiza como
          acción a la derecha en una fila al lado del header. */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 16,
        marginBottom: 24,
        flexWrap: 'wrap',
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <PageHeader
            eyebrow="Centro de soporte"
            title="Soporte"
            subtitle="Preguntas, reclamos o consultas al equipo Innovate IA. Respondemos en horario laboral."
            style={{ marginBottom: 0 }}
          />
        </div>
        <Button variant="primary" onClick={() => setShowForm(s => !s)}>
          {showForm ? '✕ Cancelar' : '+ Nuevo ticket'}
        </Button>
      </div>

      {successMsg && (
        <div style={{ marginBottom: 14 }}>
          <Banner variant={successMsg.startsWith('⚠') ? 'warning' : 'success'}>
            {successMsg}
          </Banner>
        </div>
      )}

      {showForm && (
        <div style={{ marginBottom: 18 }}>
          <Card padding={20}>
            <p style={{
              fontSize: FONT_SIZE.base,
              fontWeight: FONT_WEIGHT.semibold,
              color: C.text,
              marginTop: 0,
              marginBottom: 16,
            }}>Nuevo ticket</p>

            <FormField label="Asunto">
              <input
                value={form.subject}
                onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                placeholder="Describí tu consulta"
                style={inputStyle()}
                onFocus={e => { e.target.style.borderColor = `${C.brand}55` }}
                onBlur={e => { e.target.style.borderColor = C.border }}
              />
            </FormField>

            <FormField label="Mensaje">
              <textarea
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                placeholder="Contanos en detalle qué necesitás..."
                rows={4}
                style={{
                  ...inputStyle(),
                  resize: 'vertical',
                  lineHeight: 1.6,
                }}
                onFocus={e => { e.target.style.borderColor = `${C.brand}55` }}
                onBlur={e => { e.target.style.borderColor = C.border }}
              />
            </FormField>

            <FormField label="Prioridad">
              <select
                value={form.priority}
                onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                style={{ ...inputStyle(), cursor: 'pointer' }}
                onFocus={e => { e.target.style.borderColor = `${C.brand}55` }}
                onBlur={e => { e.target.style.borderColor = C.border }}
              >
                <option value="low">Baja — consulta general</option>
                <option value="normal">Normal — necesito ayuda</option>
                <option value="high">Alta — afecta mi operación</option>
                <option value="urgent">Urgente — el servicio está caído</option>
              </select>
            </FormField>

            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <Button
                variant="primary"
                onClick={submitTicket}
                disabled={submitDisabled}
                loading={sending}
              >{sending ? 'Enviando…' : 'Enviar ticket'}</Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
            </div>
          </Card>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1, 2].map(i => (
            <div key={i} style={{
              height: 72,
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: RADIUS.lg,
              opacity: 0.5,
              animation: 'soporte-skeleton-pulse 1.6s ease-in-out infinite',
            }} />
          ))}
          <style>{`
            @keyframes soporte-skeleton-pulse {
              0%, 100% { opacity: 0.4; }
              50%      { opacity: 0.65; }
            }
          `}</style>
        </div>
      ) : tickets.length === 0 ? (
        <Card padding={48}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🎫</div>
            <p style={{
              fontSize: FONT_SIZE.base,
              color: C.muted,
              margin: 0,
            }}>No tenés tickets todavía.</p>
            <p style={{
              fontSize: FONT_SIZE.md,
              color: C.muted,
              marginTop: 6,
              marginBottom: 0,
            }}>
              Usá "+ Nuevo ticket" para contactar al equipo.
            </p>
          </div>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {tickets.map(tk => (
            <TicketRow
              key={tk.id}
              ticket={tk}
              onOpen={() => setActiveChat(tk)}
            />
          ))}
        </div>
      )}

      {activeChat && (
        <TicketChat
          ticket={activeChat}
          onClose={() => { setActiveChat(null); load() }}
        />
      )}
    </Wrapper>
  )
}

// ═══════════════════════════════════════════════════════════════════
// FORM FIELD + INPUT STYLE
// ═══════════════════════════════════════════════════════════════════
function FormField({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{
        display: 'block',
        fontSize: FONT_SIZE.xs,
        color: C.muted,
        textTransform: 'uppercase',
        letterSpacing: '.08em',
        marginBottom: 6,
        fontFamily: FONT.mono,
        fontWeight: FONT_WEIGHT.semibold,
      }}>{label}</label>
      {children}
    </div>
  )
}

const inputStyle = () => ({
  width: '100%',
  background: C.surface,
  border: `1px solid ${C.border}`,
  borderRadius: RADIUS.md,
  padding: '10px 12px',
  color: C.text,
  fontSize: FONT_SIZE.base,
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
  transition: `border-color ${TRANSITION.fast}`,
})

// ═══════════════════════════════════════════════════════════════════
// TICKET ROW
// ═══════════════════════════════════════════════════════════════════
function TicketRow({ ticket, onOpen }) {
  const st = STATUS_MAP[ticket.status] || STATUS_MAP.open
  const pr = PRIORITY_MAP[ticket.priority] || PRIORITY_MAP.normal
  const replyCount = ticket.ticket_replies?.[0]?.count || 0
  const hasNew = ticket.status === 'in_progress' && replyCount > 0

  return (
    <button
      onClick={onOpen}
      style={{
        width: '100%',
        textAlign: 'left',
        cursor: 'pointer',
        background: hasNew ? `${C.brand}0A` : C.card,
        border: hasNew ? `1px solid ${C.brand}33` : `1px solid ${C.border}`,
        borderRadius: RADIUS.lg,
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        transition: `all ${TRANSITION.fast}`,
        fontFamily: 'inherit',
      }}
      onMouseEnter={e => {
        if (!hasNew) e.currentTarget.style.borderColor = `${C.brand}44`
      }}
      onMouseLeave={e => {
        if (!hasNew) e.currentTarget.style.borderColor = C.border
      }}
    >
      <div style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: st.color,
        flexShrink: 0,
        boxShadow: hasNew ? `0 0 6px ${st.color}` : 'none',
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 4,
        }}>
          <p style={{
            fontSize: FONT_SIZE.base,
            fontWeight: FONT_WEIGHT.semibold,
            color: C.text,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
            margin: 0,
          }}>{ticket.subject}</p>
          {hasNew && (
            <Chip variant="tag" color="brand" size="sm">Nueva respuesta</Chip>
          )}
        </div>
        <div style={{
          display: 'flex',
          gap: 10,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}>
          <span style={{
            fontSize: FONT_SIZE.sm,
            color: C.muted,
            fontFamily: FONT.mono,
          }}>{fmtDate(ticket.created_at)}</span>
          {replyCount > 0 && (
            <span style={{
              fontSize: FONT_SIZE.sm,
              color: C.muted,
            }}>
              · {replyCount} mensaje{replyCount !== 1 ? 's' : ''}
            </span>
          )}
          <span style={{
            fontSize: FONT_SIZE.xs,
            fontFamily: FONT.mono,
            marginLeft: 'auto',
            color: pr.color,
            fontWeight: FONT_WEIGHT.semibold,
            textTransform: 'uppercase',
            letterSpacing: '.05em',
          }}>{pr.label}</span>
        </div>
      </div>
      <Chip variant="tag" color={st.semantic} size="sm">{st.label}</Chip>
      <span style={{
        color: C.muted,
        fontSize: FONT_SIZE.base,
        flexShrink: 0,
      }}>›</span>
    </button>
  )
}
