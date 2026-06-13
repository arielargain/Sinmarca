// ═══════════════════════════════════════════════════════════════════
// IAHelper — Drawer lateral de ayuda contextual para campos de secrets
// ───────────────────────────────────────────────────────────────────
// Muestra un mini-chat con preguntas sugeridas + input libre. Llama a la
// EF ia-helper que responde con Claude Haiku. Historial efímero (se
// borra al cerrar el drawer).
//
// Uso:
//   const [helper, setHelper] = useState({ open: false, provider: null })
//   <IAHelper open={helper.open} provider={helper.provider} onClose={() => setHelper({open:false})} />
//
// Providers soportados: 'casino', 'mercadopago', 'modo', 'uala'
// ═══════════════════════════════════════════════════════════════════
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../lib/supabase'
import { COLORS as C, RADIUS, FONT_SIZE, FONT_WEIGHT, TRANSITION, Z } from './ui'

// Config visual/contextual por provider
const PROVIDER_META = {
  casino: {
    title: 'Token del casino',
    subtitle: 'Cómo configurar la plataforma',
    emoji: '🎰',
    suggestions: [
      { id: 'api-token',  label: '¿Cómo obtengo el API token?' },
      { id: 'hall-id',    label: '¿Dónde está mi hall_id?' },
      { id: 'permisos',   label: '¿Qué permisos necesita el token?' },
      { id: 'probar',     label: '¿Cómo pruebo que funciona?' },
    ],
  },
  mercadopago: {
    title: 'Token de Mercado Pago',
    subtitle: 'Cómo configurar la billetera',
    emoji: '💳',
    suggestions: [
      { id: 'access-token',  label: '¿Dónde está el Access Token?' },
      { id: 'prod-vs-test',  label: '¿Producción vs Test?' },
      { id: 'webhook',       label: '¿Necesito configurar webhook?' },
      { id: 'renovar',       label: '¿Cómo renuevo el token?' },
    ],
  },
  modo: {
    title: 'Token de Modo',
    subtitle: 'Cómo configurar Modo Partners',
    emoji: '💳',
    suggestions: [
      { id: 'cuenta',  label: '¿Cómo doy de alta mi cuenta?' },
      { id: 'token',   label: '¿Dónde obtengo el token?' },
    ],
  },
  uala: {
    title: 'Token de Ualá',
    subtitle: 'Cómo configurar Ualá BIS',
    emoji: '💳',
    suggestions: [
      { id: 'bis',           label: '¿Qué es Ualá BIS?' },
      { id: 'credenciales',  label: '¿Dónde obtengo las credenciales?' },
    ],
  },
}

// Renderer simple de markdown (negritas, código inline, links, listas)
function renderMarkdown(text) {
  if (!text) return null
  const lines = text.split('\n')
  return lines.map((line, i) => {
    if (!line.trim()) return <div key={i} style={{ height: 6 }} />
    // Render inline: **bold**, `code`, [text](url)
    const parts = []
    let remaining = line
    let partKey = 0
    while (remaining.length > 0) {
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/)
      const codeMatch = remaining.match(/`([^`]+?)`/)
      const linkMatch = remaining.match(/\[(.+?)\]\(([^)]+?)\)/)
      // Elegir el primero que aparezca
      const candidates = [
        boldMatch && { type: 'bold',  match: boldMatch, idx: remaining.indexOf(boldMatch[0]) },
        codeMatch && { type: 'code',  match: codeMatch, idx: remaining.indexOf(codeMatch[0]) },
        linkMatch && { type: 'link',  match: linkMatch, idx: remaining.indexOf(linkMatch[0]) },
      ].filter(Boolean).sort((a, b) => a.idx - b.idx)
      if (!candidates.length) {
        parts.push(<span key={partKey++}>{remaining}</span>)
        break
      }
      const first = candidates[0]
      if (first.idx > 0) parts.push(<span key={partKey++}>{remaining.slice(0, first.idx)}</span>)
      if (first.type === 'bold') {
        parts.push(<strong key={partKey++} style={{ fontWeight: FONT_WEIGHT.semibold, color: C.text }}>{first.match[1]}</strong>)
      } else if (first.type === 'code') {
        parts.push(<code key={partKey++} style={{
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSize: FONT_SIZE.xs, background: C.bg, padding: '1px 6px',
          borderRadius: 3, border: `1px solid ${C.border}`, color: C.text,
        }}>{first.match[1]}</code>)
      } else if (first.type === 'link') {
        parts.push(
          <a key={partKey++} href={first.match[2]} target="_blank" rel="noopener noreferrer"
             style={{ color: C.brand, textDecoration: 'underline' }}>
            {first.match[1]}
          </a>
        )
      }
      remaining = remaining.slice(first.idx + first.match[0].length)
    }
    // Detectar bullets / listas numeradas
    const trimmed = line.trim()
    const isNumbered = /^\d+\./.test(trimmed)
    const isBullet = /^-\s/.test(trimmed)
    const indent = isNumbered ? 4 : isBullet ? 10 : 0
    return (
      <div key={i} style={{ paddingLeft: indent, lineHeight: 1.55 }}>
        {parts}
      </div>
    )
  })
}

function Bubble({ role, children }) {
  const isUser = role === 'user'
  return (
    <div style={{
      alignSelf: isUser ? 'flex-end' : 'flex-start',
      maxWidth: '90%',
      background: isUser ? C.brand : C.bg,
      color: isUser ? '#fff' : C.text,
      padding: '8px 12px',
      borderRadius: RADIUS.md,
      fontSize: FONT_SIZE.sm,
      lineHeight: 1.55,
      border: isUser ? 'none' : `1px solid ${C.border}`,
      wordBreak: 'break-word',
    }}>
      {children}
    </div>
  )
}

export default function IAHelper({ open, provider, onClose }) {
  const meta = PROVIDER_META[provider] || null
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const bodyRef = useRef(null)

  // Reset al abrir/cambiar provider
  useEffect(() => {
    if (open && meta) {
      setMessages([{
        role: 'assistant',
        content: `Hola 👋 Te ayudo con el **${meta.title.toLowerCase()}**. Tocá una pregunta o escribí la tuya.`,
      }])
      setInput('')
      setError('')
    }
  }, [open, provider, meta])

  // Autoscroll del chat
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight
  }, [messages])

  // Cerrar con ESC
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const callIaHelper = async (body) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('No hay sesión activa')
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ia-helper`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    )
    if (!res.ok) {
      if (res.status === 429) throw new Error('Muchas consultas seguidas — esperá un momento.')
      throw new Error('No pude consultar el asistente.')
    }
    return res.json()
  }

  const handleSuggestion = async (sug) => {
    if (!provider || loading) return
    setError('')
    setMessages((prev) => [...prev, { role: 'user', content: sug.label }])
    setLoading(true)
    try {
      const data = await callIaHelper({
        provider, action: 'suggested', suggestion_id: sug.id,
      })
      setMessages((prev) => [...prev, { role: 'assistant', content: data.answer }])
    } catch (e) {
      setError(e.message || 'Error consultando')
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async () => {
    const q = input.trim()
    if (!q || !provider || loading) return
    if (q.length > 500) { setError('La pregunta es demasiado larga'); return }
    setInput('')
    setError('')
    setMessages((prev) => [...prev, { role: 'user', content: q }])
    setLoading(true)
    try {
      const data = await callIaHelper({ provider, action: 'ask', question: q })
      setMessages((prev) => [...prev, { role: 'assistant', content: data.answer }])
    } catch (e) {
      setError(e.message || 'Error consultando')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  if (!meta) return null

  // Portal: render DIRECTO en document.body para escapar cualquier stacking context
  // del layout padre (ej. SubTenantLayout con overflow:hidden que atrapa position:fixed)
  if (typeof document === 'undefined') return null

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: open ? 'rgba(0, 0, 0, 0.55)' : 'transparent',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 220ms',
          zIndex: 9998,
        }}
      />
      {/* Drawer */}
      <aside
        style={{
          position: 'fixed',
          top: 0, right: 0, bottom: 0,
          width: 'min(380px, 100vw)',
          // backgroundColor hardcoded opaque — fix para sub_tenant donde background:C.card no renderóa opaco
          backgroundColor: '#111420',
          background: '#111420',
          borderLeft: `1px solid ${C.border}`,
          boxShadow: open ? '-8px 0 24px rgba(0,0,0,0.5)' : 'none',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 260ms cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
        }}
        role="dialog"
        aria-label="Asistente de ayuda"
      >
        {/* Header */}
        <div style={{
          padding: '12px 16px',
          borderBottom: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: `${C.brand}22`, color: C.brand,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold,
          }}>{meta.emoji || 'IA'}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold, margin: 0, color: C.text }}>
              Asistente Innovate
            </p>
            <p style={{ fontSize: FONT_SIZE.xs, color: C.muted, margin: 0 }}>
              {meta.subtitle}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 22, color: C.muted, padding: '0 4px', lineHeight: 1,
            }}
            aria-label="Cerrar"
          >×</button>
        </div>

        {/* Body */}
        <div
          ref={bodyRef}
          style={{
            flex: 1, overflowY: 'auto',
            padding: '12px 16px',
            display: 'flex', flexDirection: 'column', gap: 8,
          }}
        >
          {messages.map((m, i) => (
            <Bubble key={i} role={m.role}>
              {renderMarkdown(m.content)}
            </Bubble>
          ))}
          {loading && (
            <Bubble role="assistant">
              <span style={{ color: C.muted, fontStyle: 'italic' }}>Pensando…</span>
            </Bubble>
          )}
          {error && (
            <div style={{
              padding: '6px 10px', background: `${C.danger}15`,
              border: `1px solid ${C.danger}40`, borderRadius: RADIUS.sm,
              color: C.danger, fontSize: FONT_SIZE.xs,
            }}>{error}</div>
          )}
        </div>

        {/* Suggestions */}
        <div style={{
          padding: '8px 16px',
          borderTop: `1px solid ${C.border}`,
          display: 'flex', flexDirection: 'column', gap: 5,
        }}>
          <p style={{
            fontSize: 10, color: C.muted, margin: '2px 0 4px',
            textTransform: 'uppercase', letterSpacing: '.08em',
          }}>Preguntas frecuentes</p>
          {meta.suggestions.map((s) => (
            <button
              key={s.id}
              onClick={() => handleSuggestion(s)}
              disabled={loading}
              style={{
                textAlign: 'left', padding: '6px 10px',
                background: 'transparent',
                border: `1px solid ${C.border}`,
                borderRadius: RADIUS.sm,
                cursor: loading ? 'default' : 'pointer',
                fontSize: FONT_SIZE.xs, color: C.text,
                opacity: loading ? 0.5 : 1,
                lineHeight: 1.3,
                transition: TRANSITION?.fast || 'all 120ms',
              }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = C.bg }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            >{s.label}</button>
          ))}
        </div>

        {/* Input */}
        <div style={{
          padding: '10px 16px 14px',
          borderTop: `1px solid ${C.border}`,
          display: 'flex', gap: 6,
        }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Preguntá lo que necesites…"
            disabled={loading}
            maxLength={500}
            style={{
              flex: 1, padding: '8px 10px',
              background: C.bg, color: C.text,
              border: `1px solid ${C.border}`,
              borderRadius: RADIUS.sm,
              fontSize: FONT_SIZE.sm, fontFamily: 'inherit',
              outline: 'none',
            }}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            style={{
              padding: '0 14px',
              background: input.trim() && !loading ? C.brand : C.bg,
              color: input.trim() && !loading ? '#fff' : C.muted,
              border: `1px solid ${input.trim() && !loading ? C.brand : C.border}`,
              borderRadius: RADIUS.sm,
              cursor: loading || !input.trim() ? 'default' : 'pointer',
              fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold,
              fontFamily: 'inherit',
            }}
            aria-label="Enviar pregunta"
          >↑</button>
        </div>
      </aside>
    </>,
    document.body
  )
}
