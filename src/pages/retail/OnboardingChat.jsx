import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import {
  COLORS as C, RADIUS, FONT_SIZE, FONT_WEIGHT, FONT, TRANSITION,
} from '../../components/ui'

// v1.0 (15/05/2026) — Chat IA lateral del onboarding retail
// Persistencia: sessionStorage (no BD, ahorra costo)
// Backend: EF onboarding-assistant (Claude Haiku 4.5)
// Mantiene contexto entre cambios de step

const SS_KEY = 'innovate_onboarding_chat_v1'
const ONBOARDING_ASSISTANT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/onboarding-assistant`

const INITIAL_MESSAGE = {
  role: 'assistant',
  content: 'Hola! Soy tu guía durante el setup. Si tenés cualquier duda sobre un paso o sobre la plataforma, escribíme acá. Estoy para ayudarte a configurar todo en minutos.',
  ts: Date.now(),
}

export default function OnboardingChat({ currentStep, stepTitle }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const scrollRef = useRef(null)

  // Load inicial desde sessionStorage
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SS_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed)
          return
        }
      }
    } catch {}
    setMessages([INITIAL_MESSAGE])
  }, [])

  // Persistir
  useEffect(() => {
    if (messages.length === 0) return
    try { sessionStorage.setItem(SS_KEY, JSON.stringify(messages.slice(-30))) } catch {}
  }, [messages])

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, sending])

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || sending) return

    const userMsg = { role: 'user', content: text, ts: Date.now() }
    const next = [...messages, userMsg]
    setMessages(next)
    setInput('')
    setSending(true)
    setError(null)

    try {
      // Obtener JWT actual
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) throw new Error('Sesión expirada')

      // Solo mandar últimos 14 (7 turns) al backend para minimizar costo
      const recentForApi = next
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .slice(-14)
        .map(m => ({ role: m.role, content: m.content }))

      const res = await fetch(ONBOARDING_ASSISTANT_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: recentForApi,
          current_step: currentStep,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        if (data?.error === 'rate_limit_exceeded') {
          throw new Error('Demasiados mensajes. Esperá un minuto.')
        }
        throw new Error(data?.error || `HTTP ${res.status}`)
      }

      const reply = data.reply || 'No pude responder. Probá otra vez.'
      setMessages(prev => [...prev, { role: 'assistant', content: reply, ts: Date.now() }])
    } catch (e) {
      setError(e.message || 'Error')
      // Quitamos el mensaje user para que pueda reintentar
      setMessages(prev => prev.slice(0, -1))
      setInput(text) // restaurar
    } finally {
      setSending(false)
    }
  }, [input, sending, messages, currentStep])

  function clearChat() {
    if (!window.confirm('¿Limpiar la conversación?')) return
    setMessages([INITIAL_MESSAGE])
    try { sessionStorage.removeItem(SS_KEY) } catch {}
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Sugerencias rápidas según step
  const suggestions = (() => {
    switch (currentStep) {
      case 0: return ['¿Qué hace Innovate IA?', '¿Es complicado?']
      case 1: return ['¿Qué diferencia hay entre QR y API oficial?', '¿Cuánto tarda en activarse?']
      case 2: return ['No estoy seguro de mi identidad', '¿Puedo cambiarla después?']
      // 15/05 — pasos 3 (billetera) y 4 (negocio) NUEVOS
      case 3: return ['¿Qué billetera me conviene?', '¿Cuánto cobra Mercado Pago de comisión?']
      case 4: return ['¿Qué pongo en horarios?', '¿Puedo editarlo después?']
      case 5: return ['Dame un ejemplo de prompt para mi negocio', '¿Qué tono recomendás?']
      case 6: return ['¿Cuántos créditos necesito al mes?', '¿Qué plan me conviene?']
      case 7: return ['¿Cómo pruebo mi bot ahora?', '¿Por dónde sigo?']
      default: return []
    }
  })()

  return (
    <div style={{
      background: C.card,
      border: `1px solid ${C.border}`,
      borderRadius: RADIUS.xl,
      display: 'flex',
      flexDirection: 'column',
      // 15/05/2026 — misma altura que el card del paso (col izq) para simetria visual
      height: 'min(720px, 75vh)',
      minHeight: 580,
      position: 'sticky',
      top: 20,
      overflow: 'hidden',
    }}>
      {/* Header chat */}
      <div style={{
        padding: '14px 16px',
        borderBottom: `1px solid ${C.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 999,
            background: `linear-gradient(135deg, ${C.brand}, ${C.brand}aa)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16,
            flexShrink: 0,
          }}>🤖</div>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: FONT_SIZE.sm,
              fontWeight: FONT_WEIGHT.bold,
              color: C.text,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>Guía de bienvenida</div>
            <div style={{
              fontSize: FONT_SIZE.xs,
              color: C.muted,
              fontFamily: FONT.mono,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>{stepTitle}</div>
          </div>
        </div>
        <button
          type="button"
          onClick={clearChat}
          title="Limpiar chat"
          style={{
            background: 'transparent',
            color: C.muted,
            border: 'none',
            cursor: 'pointer',
            fontSize: 14,
            padding: 4,
          }}
        >🗑️</button>
      </div>

      {/* Mensajes */}
      <div ref={scrollRef} style={{
        flex: 1,
        overflowY: 'auto',
        padding: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}>
        {messages.map((m, i) => {
          const isUser = m.role === 'user'
          return (
            <div key={i} style={{
              alignSelf: isUser ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              background: isUser ? `${C.brand}20` : C.surface,
              color: C.text,
              padding: '8px 12px',
              borderRadius: RADIUS.md,
              fontSize: FONT_SIZE.sm,
              lineHeight: 1.5,
              border: `1px solid ${isUser ? C.brand + '40' : C.border}`,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}>
              {m.content}
            </div>
          )
        })}
        {sending && (
          <div style={{
            alignSelf: 'flex-start',
            background: C.surface,
            color: C.muted,
            padding: '8px 14px',
            borderRadius: RADIUS.md,
            fontSize: FONT_SIZE.sm,
            border: `1px solid ${C.border}`,
            display: 'flex',
            gap: 4,
          }}>
            <span className="onb-dot" style={{ animation: 'onbBlink 1.4s infinite 0s' }}>·</span>
            <span className="onb-dot" style={{ animation: 'onbBlink 1.4s infinite .2s' }}>·</span>
            <span className="onb-dot" style={{ animation: 'onbBlink 1.4s infinite .4s' }}>·</span>
          </div>
        )}
        {error && (
          <div style={{
            alignSelf: 'flex-start',
            background: 'rgba(248,113,113,0.1)',
            color: '#f87171',
            padding: '8px 12px',
            borderRadius: RADIUS.md,
            fontSize: FONT_SIZE.xs,
            border: '1px solid rgba(248,113,113,0.3)',
          }}>
            {error}
          </div>
        )}
      </div>

      {/* Sugerencias rápidas */}
      {!sending && messages.filter(m => m.role === 'user').length < 2 && suggestions.length > 0 && (
        <div style={{
          padding: '0 12px 8px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
        }}>
          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => { setInput(s); setTimeout(() => sendMessage(), 50) }}
              style={{
                background: C.surface,
                color: C.muted,
                border: `1px solid ${C.border}`,
                borderRadius: 999,
                padding: '5px 10px',
                fontSize: 11,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: TRANSITION,
              }}
              onMouseEnter={e => { e.currentTarget.style.color = C.text; e.currentTarget.style.borderColor = C.brand }}
              onMouseLeave={e => { e.currentTarget.style.color = C.muted; e.currentTarget.style.borderColor = C.border }}
            >{s}</button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{
        padding: 12,
        borderTop: `1px solid ${C.border}`,
        display: 'flex',
        gap: 8,
      }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribí tu pregunta..."
          disabled={sending}
          rows={1}
          style={{
            flex: 1,
            background: C.bg,
            border: `1px solid ${C.border}`,
            borderRadius: RADIUS.md,
            color: C.text,
            padding: '8px 10px',
            fontSize: FONT_SIZE.sm,
            fontFamily: 'inherit',
            resize: 'none',
            outline: 'none',
            minHeight: 36,
            maxHeight: 100,
          }}
        />
        <button
          type="button"
          onClick={sendMessage}
          disabled={!input.trim() || sending}
          style={{
            background: input.trim() && !sending ? C.brand : C.surface,
            color: input.trim() && !sending ? '#000' : C.muted,
            border: 'none',
            borderRadius: RADIUS.md,
            padding: '0 14px',
            fontSize: 16,
            cursor: input.trim() && !sending ? 'pointer' : 'not-allowed',
            fontFamily: 'inherit',
            transition: TRANSITION,
          }}
        >→</button>
      </div>

      <style>{`
        @keyframes onbBlink {
          0%, 80%, 100% { opacity: 0.2; }
          40% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
