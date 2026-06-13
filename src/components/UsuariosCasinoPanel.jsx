import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import {
  PageContainer, PageHeader, SectionHeader, Card,
  Button, IconButton, Banner, Chip,
  StatCard, StatGrid,
  COLORS as C, RADIUS, FONT_SIZE, FONT_WEIGHT, FONT, TRANSITION, Z,
} from './ui'
import { callEdgeFunction } from '../lib/callEdgeFunction'
import { CASINO_ACTION_URL } from '../lib/constants'

// ════════════════════════════════════════════════════════════════
// v3.1 (20/05/2026) — Panel pro de usuarios casino
// ────────────────────────────────────────────────────────────────
// + v3.1: lista responsive en mobile (cards apiladas <768px) + toolbars
//         full-width en mobile. Sin cambios de lógica, solo CSS.
// + Tabla con scroll horizontal en mobile (legacy), anchos pro en desktop
// + Headers ordenables (cliente, login, saldo, actualizado, creado)
// + Filtros: saldo (zero/low/mid/high), estado (active/blocked)
// + Crear usuario manual (nombre + teléfono → bot crea cuenta + manda creds)
// + Bloquear / desbloquear usuario casino (con razón opcional)
// + Historial de operaciones (últimos 30 eventos)
// + Export CSV de la página actual
// + Conserva v2: iconos SVG, auto-refresh silent, Realtime, indicador live
// ════════════════════════════════════════════════════════════════

const fmtARS = (n) => '$' + Number(n || 0).toLocaleString('es-AR', {
  minimumFractionDigits: 0, maximumFractionDigits: 2,
})

const PAGE_SIZE = 50

const SORT_OPTIONS = [
  { id: 'created_desc',  label: 'Más nuevos primero' },
  { id: 'created_asc',   label: 'Más antiguos primero' },
  { id: 'balance_desc',  label: 'Mayor saldo primero' },
  { id: 'balance_asc',   label: 'Menor saldo primero' },
  { id: 'name_asc',      label: 'Nombre A→Z' },
  { id: 'updated_desc',  label: 'Recién actualizados' },
]

const BALANCE_FILTER_OPTIONS = [
  { id: '',     label: 'Todos los saldos' },
  { id: 'zero', label: 'Sin saldo ($0)' },
  { id: 'low',  label: 'Bajo ($1 – $1k)' },
  { id: 'mid',  label: 'Medio ($1k – $10k)' },
  { id: 'high', label: 'Alto (>$10k)' },
]

const STATUS_FILTER_OPTIONS = [
  { id: '',        label: 'Todos los estados' },
  { id: 'active',  label: 'Activos' },
  { id: 'blocked', label: 'Bloqueados' },
]

// ────────────────────────────────────────────────────────────────
// SVG icons
// ────────────────────────────────────────────────────────────────
const IconRefresh = ({ size = 14, spinning = false }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
    style={spinning ? { animation: 'cuc-spin 1s linear infinite' } : undefined}>
    <path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
    <path d="M21 3v5h-5" />
  </svg>
)

const IconSettings = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
)

const IconLive = ({ size = 10 }) => (
  <svg width={size} height={size} viewBox="0 0 10 10">
    <circle cx="5" cy="5" r="4" fill="currentColor">
      <animate attributeName="opacity" values="1;0.3;1" dur="1.8s" repeatCount="indefinite" />
    </circle>
  </svg>
)

const IconPlus = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

const IconDownload = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
)

const IconLock = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)

const IconUnlock = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 9.9-1" />
  </svg>
)

const IconHistory = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 4v6h6" />
    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    <line x1="12" y1="7" x2="12" y2="12" />
    <line x1="12" y1="12" x2="15" y2="14" />
  </svg>
)

const IconSortAsc = ({ size = 10 }) => (
  <svg width={size} height={size} viewBox="0 0 10 10" fill="currentColor">
    <path d="M5 2 L9 8 L1 8 Z" />
  </svg>
)

const IconSortDesc = ({ size = 10 }) => (
  <svg width={size} height={size} viewBox="0 0 10 10" fill="currentColor">
    <path d="M5 8 L9 2 L1 2 Z" />
  </svg>
)

const IconSortNone = ({ size = 10 }) => (
  <svg width={size} height={size} viewBox="0 0 10 10" fill="currentColor" opacity="0.35">
    <path d="M5 2 L9 5 L1 5 Z" />
    <path d="M5 8 L9 5 L1 5 Z" />
  </svg>
)

// ────────────────────────────────────────────────────────────────
// helpers
// ────────────────────────────────────────────────────────────────
function timeAgo(iso) {
  if (!iso) return '—'
  try {
    const ms = Date.now() - new Date(iso).getTime()
    const m = Math.floor(ms / 60000)
    if (m < 1) return 'ahora'
    if (m < 60) return `${m}m`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h`
    const d = Math.floor(h / 24)
    if (d < 30) return `${d}d`
    const mo = Math.floor(d / 30)
    if (mo < 12) return `${mo}mes`
    return `${Math.floor(mo / 12)}a`
  } catch { return '—' }
}

function fmtFullDate(iso) {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    return d.toLocaleString('es-AR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch { return '—' }
}

// Limpia teléfono a formato 549XXXXXXXXXX (sin +, espacios, guiones)
function normalizePhoneAR(input) {
  const digits = String(input || '').replace(/\D/g, '')
  // Si arranca con 549, mantener; si arranca con 54, agregar 9 después del 54
  if (digits.startsWith('549')) return digits
  if (digits.startsWith('54')) return '549' + digits.slice(2)
  if (digits.startsWith('9') && digits.length >= 10) return '54' + digits
  if (digits.length === 10) return '549' + digits // móvil sin código
  return digits // dejar como vino si no matchea
}

function csvEscape(v) {
  if (v == null) return ''
  const s = String(v)
  if (s.includes('"') || s.includes(',') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"'
  }
  return s
}

function downloadCSV(rows, filename) {
  const headers = [
    'contact_name', 'phone', 'casino_user_id', 'casino_login',
    'casino_last_known_balance', 'casino_balance_updated_at',
    'casino_blocked', 'created_at',
  ]
  const lines = [headers.join(',')]
  for (const r of rows) {
    lines.push(headers.map(h => csvEscape(r[h])).join(','))
  }
  const csv = '\uFEFF' + lines.join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ════════════════════════════════════════════════════════════════
// MODAL: Crear usuario manual
// ════════════════════════════════════════════════════════════════
function CreateUserModal({ onClose, onCreated }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleCreate = async () => {
    const cleanName = name.trim()
    const cleanPhone = normalizePhoneAR(phone)
    if (cleanName.length < 2) {
      setResult({ ok: false, error: 'Nombre muy corto (mínimo 2 caracteres)' })
      return
    }
    if (cleanPhone.length < 11 || cleanPhone.length > 15) {
      setResult({ ok: false, error: 'Teléfono inválido. Usá formato +54 9 XXX XXX XXXX' })
      return
    }

    setLoading(true)
    setResult(null)
    try {
      // 1) Crear/asegurar conversation con ese phone (para el scope)
      //    Lo hace una RPC dedicada que veremos abajo (ensure_conversation_for_phone)
      const { data: convData, error: convErr } = await supabase.rpc('ensure_conversation_for_phone', {
        p_phone:        cleanPhone,
        p_contact_name: cleanName,
      })
      if (convErr) throw convErr
      if (convData?.error) throw new Error(convData.error)
      const conversationId = convData?.conversation_id
      if (!conversationId) throw new Error('No se pudo crear la conversación')

      // 2) Llamar a casino-action.createuser
      const { ok, data, status } = await callEdgeFunction(CASINO_ACTION_URL, {
        action: 'createuser',
        conversation_id: conversationId,
      })
      if (!ok) {
        setResult({ ok: false, error: data?.error || `HTTP ${status}` })
        setLoading(false)
        return
      }
      const inner = data?.data || {}
      if (inner?.errorMessage?.length) {
        setResult({ ok: false, error: inner.errorMessage[0] })
        setLoading(false)
        return
      }
      setResult({
        ok: true,
        msg: `Usuario creado: ${inner.login || inner.id || '?'} · pwd ${inner.password || '?'}`,
        casino_user_id: String(inner.id || ''),
      })
      onCreated({ conversationId, casinoUserId: String(inner.id || '') })
    } catch (e) {
      setResult({ ok: false, error: e.message || 'Error inesperado' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div onClick={onClose} style={modalBackdrop}>
      <div onClick={e => e.stopPropagation()} style={modalCard()}>
        <div style={modalHeader}>
          <h3 style={modalTitle}>Crear usuario casino</h3>
          <IconButton icon="×" variant="ghost" size={30} onClick={onClose} title="Cerrar" />
        </div>
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: FONT_SIZE.sm, color: C.muted, lineHeight: 1.5 }}>
            Vamos a crear una cuenta en el casino y enviarle por WhatsApp las credenciales al número que indiques.
          </div>
          <label style={fieldLabel}>Nombre del cliente</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ej. Juan Pérez"
            autoFocus
            disabled={result?.ok || loading}
            style={textInput()}
          />
          <label style={fieldLabel}>Teléfono (con código de país)</label>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="+54 9 11 1234 5678"
            disabled={result?.ok || loading}
            style={textInput()}
          />
          {phone && (
            <div style={{
              fontSize: FONT_SIZE.xs, color: C.muted,
              fontFamily: FONT.mono, marginTop: -4,
            }}>
              Se enviará a: {normalizePhoneAR(phone) || '—'}
            </div>
          )}

          {!result?.ok && (
            <Button
              variant="primary"
              disabled={!name || !phone || loading}
              loading={loading}
              onClick={handleCreate}
            >Crear y enviar credenciales</Button>
          )}

          {result && (
            <Banner variant={result.ok ? 'success' : 'danger'}>
              {result.ok ? (result.msg || 'OK') : (result.error || 'Error')}
            </Banner>
          )}

          {result?.ok && (
            <Button variant="secondary" onClick={onClose}>Cerrar</Button>
          )}
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// MODAL: Bloquear / Desbloquear
// ════════════════════════════════════════════════════════════════
function BlockUserModal({ user, onClose, onBlocked }) {
  const [reason, setReason] = useState(user.casino_blocked_reason || '')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const isBlocked = !!user.casino_blocked

  const submit = async () => {
    setLoading(true)
    setResult(null)
    try {
      const { data, error: rpcErr } = await supabase.rpc('set_casino_user_blocked', {
        p_conversation_id: user.id,
        p_blocked:         !isBlocked,
        p_reason:          isBlocked ? null : (reason.trim() || null),
      })
      if (rpcErr) throw rpcErr
      if (data?.error) throw new Error(data.error)
      onBlocked({ userId: user.id, blocked: !isBlocked, reason: isBlocked ? null : reason.trim() })
      onClose()
    } catch (e) {
      setResult({ ok: false, error: e.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div onClick={onClose} style={modalBackdrop}>
      <div onClick={e => e.stopPropagation()} style={modalCard()}>
        <div style={modalHeader}>
          <h3 style={modalTitle}>
            {isBlocked ? 'Desbloquear cuenta' : 'Bloquear cuenta casino'}
          </h3>
          <IconButton icon="×" variant="ghost" size={30} onClick={onClose} title="Cerrar" />
        </div>
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: FONT_SIZE.sm, color: C.muted, lineHeight: 1.5 }}>
            {isBlocked ? (
              <>El usuario <strong style={{ color: C.text }}>{user.contact_name || user.casino_login}</strong> volverá a poder operar a través del bot.</>
            ) : (
              <>El bot rechazará automáticamente las solicitudes de carga/retiro de este cliente. Vos podés seguir operando manualmente desde el panel.</>
            )}
          </div>
          {!isBlocked && (
            <>
              <label style={fieldLabel}>Motivo (opcional, queda en historial)</label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Ej. Sospecha de fraude, abuso del bono, etc."
                rows={3}
                maxLength={200}
                style={{ ...textInput(), resize: 'vertical', fontFamily: 'inherit' }}
              />
            </>
          )}
          <Button
            variant={isBlocked ? 'success' : 'danger'}
            loading={loading}
            disabled={loading}
            onClick={submit}
          >{isBlocked ? 'Desbloquear' : 'Bloquear cuenta'}</Button>
          {result && (
            <Banner variant="danger">{result.error || 'Error'}</Banner>
          )}
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// MODAL: Historial
// ════════════════════════════════════════════════════════════════
function HistoryModal({ user, onClose }) {
  const [events, setEvents] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { data, error: rpcErr } = await supabase.rpc('get_casino_user_history', {
          p_conversation_id: user.id,
          p_limit:           30,
        })
        if (cancelled) return
        if (rpcErr) throw rpcErr
        if (data?.error) throw new Error(data.error)
        setEvents(data?.events || [])
      } catch (e) {
        if (!cancelled) setError(e.message)
      }
    })()
    return () => { cancelled = true }
  }, [user.id])

  const EVENT_LABELS = {
    casino_action_balance_get:    { label: 'Consulta de saldo',     color: C.muted },
    casino_action_balance_in:     { label: 'Acreditación',          color: C.success },
    casino_action_balance_out:    { label: 'Retiro',                color: C.warning },
    casino_action_changepassword: { label: 'Cambio de contraseña',  color: C.info || C.brand },
    casino_action_createuser:     { label: 'Usuario creado',        color: C.info || C.brand },
    casino_user_blocked:          { label: 'Cuenta bloqueada',      color: C.danger },
    casino_user_unblocked:        { label: 'Cuenta desbloqueada',   color: C.success },
  }

  return (
    <div onClick={onClose} style={modalBackdrop}>
      <div onClick={e => e.stopPropagation()} style={modalCard(560)}>
        <div style={modalHeader}>
          <h3 style={modalTitle}>Historial · {user.contact_name || user.casino_login}</h3>
          <IconButton icon="×" variant="ghost" size={30} onClick={onClose} title="Cerrar" />
        </div>
        <div style={{ padding: 16, overflowY: 'auto', flex: 1, maxHeight: '70vh' }}>
          {error && <Banner variant="danger">{error}</Banner>}
          {!error && events == null && (
            <div style={{ color: C.muted, textAlign: 'center', padding: 20 }}>Cargando…</div>
          )}
          {events != null && events.length === 0 && (
            <div style={{ color: C.muted, textAlign: 'center', padding: 20 }}>
              Sin eventos registrados todavía
            </div>
          )}
          {events != null && events.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {events.map((ev, i) => {
                const meta = EVENT_LABELS[ev.event_type] || { label: ev.event_type, color: C.muted }
                return (
                  <div key={i} style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto',
                    gap: 8,
                    padding: '10px 12px',
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    borderRadius: RADIUS.md,
                    alignItems: 'center',
                  }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{
                        fontSize: FONT_SIZE.sm,
                        fontWeight: FONT_WEIGHT.semibold,
                        color: meta.color,
                      }}>
                        {meta.label}
                      </div>
                      <div style={{
                        fontSize: FONT_SIZE.xs,
                        color: C.muted,
                        fontFamily: FONT.mono,
                        marginTop: 2,
                      }}>
                        {fmtFullDate(ev.created_at)} · {ev.actor_type === 'sub_tenant' ? 'sub-cuenta' : 'tenant'}
                      </div>
                    </div>
                    {ev.amount != null && (
                      <div style={{
                        fontSize: FONT_SIZE.sm,
                        color: C.text,
                        fontFamily: FONT.mono,
                        fontWeight: FONT_WEIGHT.bold,
                      }}>
                        {fmtARS(ev.amount)} {ev.currency || 'ARS'}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// MODAL DE ACCIONES (acreditar, descontar, cambiar password, bloquear, historial)
// ════════════════════════════════════════════════════════════════
function UserCasinoActionModal({ user, onClose, onActionDone, onOpenBlock, onOpenHistory }) {
  const [tab, setTab] = useState('credit')
  const [amount, setAmount] = useState('')
  const [newPass, setNewPass] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const isBlocked = !!user.casino_blocked

  const handleBalance = async (op) => {
    const n = Number(amount)
    if (!n || n <= 0) {
      setResult({ ok: false, error: 'Ingresá un monto válido' })
      return
    }
    setLoading(true)
    setResult(null)
    try {
      const action = op === 'in' ? 'balance_in' : 'balance_out'
      const { ok, data, status } = await callEdgeFunction(CASINO_ACTION_URL, {
        action,
        user_id: user.casino_user_id,
        amount: n,
        currency: 'ARS',
        conversation_id: user.id,
      })
      if (!ok) {
        setResult({ ok: false, error: data?.error || `HTTP ${status}` })
        setLoading(false)
        return
      }
      const inner = data?.data || {}
      const innerOk = !!inner.successMessage
      setResult({
        ok: innerOk,
        msg: innerOk ? inner.successMessage : (inner.errorMessage?.[0] || 'Error'),
      })
      if (innerOk) {
        onActionDone({ kind: 'balance', userId: user.id })
        setAmount('')
      }
    } catch (e) {
      setResult({ ok: false, error: e.message })
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (!newPass || newPass.length < 4) {
      setResult({ ok: false, error: 'Mínimo 4 caracteres' })
      return
    }
    setLoading(true)
    setResult(null)
    try {
      const { ok, data, status } = await callEdgeFunction(CASINO_ACTION_URL, {
        action: 'changepassword',
        user_id: user.casino_user_id,
        new_password: newPass,
        conversation_id: user.id,
      })
      if (!ok) {
        setResult({ ok: false, error: data?.error || `HTTP ${status}` })
        setLoading(false)
        return
      }
      const inner = data?.data || {}
      const innerOk = !!inner.successMessage
      setResult({
        ok: innerOk,
        msg: innerOk ? `Contraseña actualizada a: ${newPass}` : (inner.errorMessage?.[0] || 'Error'),
        password: newPass,
      })
      if (innerOk) onActionDone({ kind: 'password', userId: user.id, newPassword: newPass })
    } catch (e) {
      setResult({ ok: false, error: e.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div onClick={onClose} style={modalBackdrop}>
      <div onClick={e => e.stopPropagation()} style={modalCard()}>
        <div style={modalHeader}>
          <h3 style={modalTitle}>
            ⚡ {user.contact_name || user.phone || user.casino_login}
          </h3>
          <IconButton icon="×" variant="ghost" size={30} onClick={onClose} title="Cerrar" />
        </div>

        <div style={{ padding: 16, overflowY: 'auto', flex: 1 }}>
          {isBlocked && (
            <Banner variant="warning" style={{ marginBottom: 14 }}>
              ⚠ Esta cuenta está bloqueada. El bot no procesa operaciones de este cliente.
              {user.casino_blocked_reason && (
                <div style={{ marginTop: 4, fontSize: FONT_SIZE.xs }}>
                  Motivo: {user.casino_blocked_reason}
                </div>
              )}
            </Banner>
          )}

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
            {[
              { id: 'credit', label: '💰 Saldo' },
              { id: 'password', label: '🔑 Password' },
            ].map(t => {
              const active = tab === t.id
              return (
                <button key={t.id} type="button"
                  onClick={() => { setTab(t.id); setResult(null); }}
                  style={tabButton(active)}
                >{t.label}</button>
              )
            })}
          </div>

          {/* Info usuario */}
          <div style={infoBlock}>
            <span style={{ color: C.muted }}>ID:</span>
            <span style={{ color: C.text }}>{user.casino_user_id}</span>
            <span style={{ color: C.muted }}>Login:</span>
            <span style={{ color: C.text }}>{user.casino_login || '—'}</span>
            <span style={{ color: C.muted }}>Saldo conocido:</span>
            <span style={{ color: user.casino_last_known_balance != null ? C.success : C.muted }}>
              {user.casino_last_known_balance != null ? fmtARS(user.casino_last_known_balance) : 'sin datos'}
            </span>
            <span style={{ color: C.muted }}>Creado:</span>
            <span style={{ color: C.text }}>{fmtFullDate(user.created_at)}</span>
          </div>

          {tab === 'credit' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input type="number" value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="Monto en ARS" autoFocus style={textInput()} />
              <div style={{ display: 'flex', gap: 10 }}>
                <Button variant="success" disabled={!amount || loading} loading={loading}
                  onClick={() => handleBalance('in')} style={{ flex: 1 }}>➕ Acreditar</Button>
                <Button variant="danger" disabled={!amount || loading} loading={loading}
                  onClick={() => handleBalance('out')} style={{ flex: 1 }}>➖ Descontar</Button>
              </div>
            </div>
          )}

          {tab === 'password' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input type="text" value={newPass}
                onChange={e => setNewPass(e.target.value)}
                placeholder="Nueva contraseña (mín 4)" maxLength={20}
                style={{ ...textInput(), fontFamily: FONT.mono }} />
              <Button variant="primary" disabled={!newPass || loading} loading={loading}
                onClick={handleChangePassword}>🔑 Resetear contraseña</Button>
            </div>
          )}

          {result && (
            <div style={{ marginTop: 14 }}>
              <Banner variant={result.ok ? 'success' : 'danger'}>
                {result.ok ? (result.msg || 'OK') : (result.error || result.msg || 'Error')}
              </Banner>
            </div>
          )}

          {/* Secciones extra: historial + bloqueo */}
          <div style={{
            marginTop: 18,
            paddingTop: 14,
            borderTop: `1px solid ${C.border}`,
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
          }}>
            <button type="button" onClick={() => { onClose(); onOpenHistory(user) }}
              style={secondaryActionBtn()}>
              <IconHistory size={13} /> <span>Ver historial</span>
            </button>
            <button type="button" onClick={() => { onClose(); onOpenBlock(user) }}
              style={secondaryActionBtn(isBlocked ? C.success : C.danger)}>
              {isBlocked ? <IconUnlock size={13} /> : <IconLock size={13} />}
              <span>{isBlocked ? 'Desbloquear' : 'Bloquear'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// Componente: SortableHeader (header de columna clickeable)
// ════════════════════════════════════════════════════════════════
function SortableHeader({ label, currentSort, sortAsc, sortDesc, onClick, align = 'left' }) {
  let icon = <IconSortNone />
  if (currentSort === sortAsc) icon = <IconSortAsc />
  else if (currentSort === sortDesc) icon = <IconSortDesc />
  return (
    <button type="button" onClick={onClick} style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
      width: '100%',
      background: 'transparent',
      border: 'none',
      color: 'inherit',
      font: 'inherit',
      cursor: 'pointer',
      padding: 0,
      letterSpacing: 'inherit',
      textTransform: 'inherit',
      fontFamily: 'inherit',
    }}>
      <span>{label}</span>
      {icon}
    </button>
  )
}

// ════════════════════════════════════════════════════════════════
// PANEL PRINCIPAL
// ════════════════════════════════════════════════════════════════
export default function UsuariosCasinoPanel() {
  const [search, setSearch] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')
  const [onlyWithBalance, setOnlyWithBalance] = useState(false)
  const [balanceRange, setBalanceRange] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortBy, setSortBy] = useState('created_desc')
  const [page, setPage] = useState(0)
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [actorKind, setActorKind] = useState(null)
  const [isCrossSub, setIsCrossSub] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [refreshingId, setRefreshingId] = useState(null)
  const [bulkRefreshing, setBulkRefreshing] = useState(false)
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0, errors: 0 })
  const [actionUser, setActionUser] = useState(null)
  const [historyUser, setHistoryUser] = useState(null)
  const [blockUser, setBlockUser] = useState(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [toast, setToast] = useState(null)
  const [realtimeConnected, setRealtimeConnected] = useState(false)

  const rowsRef = useRef(rows)
  useEffect(() => { rowsRef.current = rows }, [rows])

  const autoRefreshDoneRef = useRef(new Set())
  const autoRefreshAbortRef = useRef(null)

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search.trim()), 300)
    return () => clearTimeout(t)
  }, [search])

  // reset page on filter/sort change
  useEffect(() => {
    setPage(0)
  }, [searchDebounced, onlyWithBalance, balanceRange, statusFilter, sortBy])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: rpcErr } = await supabase.rpc('list_my_casino_users', {
        p_search:            searchDebounced || null,
        p_limit:             PAGE_SIZE,
        p_offset:            page * PAGE_SIZE,
        p_only_with_balance: onlyWithBalance,
        p_sort_by:           sortBy,
        p_balance_range:     balanceRange || null,
        p_status:            statusFilter || null,
      })
      if (rpcErr) throw rpcErr
      if (data?.error) throw new Error(data.error)
      setRows(data?.rows || [])
      setTotal(data?.total || 0)
      setActorKind(data?.actor_kind || null)
      setIsCrossSub(!!data?.is_cross_sub)
    } catch (e) {
      setError(e.message || 'Error cargando usuarios')
      setRows([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [searchDebounced, onlyWithBalance, balanceRange, statusFilter, sortBy, page])

  useEffect(() => { load() }, [load])

  const showToast = (msg, kind = 'success') => {
    setToast({ msg, kind })
    setTimeout(() => setToast(null), 3000)
  }

  const patchRow = useCallback((rowId, patch) => {
    setRows(prev => prev.map(r => r.id === rowId ? { ...r, ...patch } : r))
  }, [])

  // Toggle sort on column header click
  const toggleSort = (ascId, descId) => {
    setSortBy(prev => prev === descId ? ascId : descId)
  }

  // ────────────────────────────────────────────────────────────
  // Refresh saldo (1 usuario)
  // ────────────────────────────────────────────────────────────
  const refreshBalance = async (user) => {
    setRefreshingId(user.id)
    try {
      const { ok, data, status } = await callEdgeFunction(CASINO_ACTION_URL, {
        action: 'balance_get',
        user_id: user.casino_user_id,
        conversation_id: user.id,
      })
      if (!ok) {
        showToast(`Error: ${data?.error || `HTTP ${status}`}`, 'danger')
        return
      }
      const { data: convData } = await supabase
        .from('conversations')
        .select('casino_last_known_balance, casino_balance_updated_at')
        .eq('id', user.id)
        .maybeSingle()
      if (convData) patchRow(user.id, convData)
    } catch (e) {
      showToast(`Error: ${e.message}`, 'danger')
    } finally {
      setRefreshingId(null)
    }
  }

  // ────────────────────────────────────────────────────────────
  // Refresh saldo bulk
  // ────────────────────────────────────────────────────────────
  const refreshAllVisible = async () => {
    if (bulkRefreshing) return
    const targets = rowsRef.current.filter(r => r.casino_user_id)
    if (targets.length === 0) return
    if (!window.confirm(`¿Actualizar saldo de ${targets.length} usuarios? Puede tardar ~${Math.ceil(targets.length * 0.4)}s.`)) return

    setBulkRefreshing(true)
    setBulkProgress({ done: 0, total: targets.length, errors: 0 })

    let done = 0
    let errors = 0
    for (const user of targets) {
      try {
        const { ok } = await callEdgeFunction(CASINO_ACTION_URL, {
          action: 'balance_get',
          user_id: user.casino_user_id,
          conversation_id: user.id,
        })
        if (!ok) errors++
      } catch { errors++ }
      done++
      setBulkProgress({ done, total: targets.length, errors })
      await new Promise(r => setTimeout(r, 250))
    }

    setBulkRefreshing(false)
    showToast(`✓ ${done - errors}/${targets.length} actualizados${errors ? ` (${errors} con error)` : ''}`, errors ? 'warning' : 'success')
    load()
  }

  // ────────────────────────────────────────────────────────────
  // Auto-refresh silent + Realtime (idéntico a v2)
  // ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (loading || rows.length === 0) return
    const pageKey = `${page}|${searchDebounced}|${onlyWithBalance}|${balanceRange}|${statusFilter}|${sortBy}`
    if (autoRefreshDoneRef.current.has(pageKey)) return

    const STALE_THRESHOLD_MS = 5 * 60 * 1000
    const now = Date.now()
    const stale = rows.filter(r => {
      if (!r.casino_user_id) return false
      if (!r.casino_balance_updated_at) return true
      const age = now - new Date(r.casino_balance_updated_at).getTime()
      return age > STALE_THRESHOLD_MS
    })

    if (stale.length === 0) {
      autoRefreshDoneRef.current.add(pageKey)
      return
    }

    autoRefreshDoneRef.current.add(pageKey)
    const ac = new AbortController()
    autoRefreshAbortRef.current = ac

    ;(async () => {
      for (const user of stale) {
        if (ac.signal.aborted) break
        try {
          await callEdgeFunction(CASINO_ACTION_URL, {
            action: 'balance_get',
            user_id: user.casino_user_id,
            conversation_id: user.id,
          })
        } catch (_) { /* silent */ }
        await new Promise(r => setTimeout(r, 350))
      }
    })().catch(() => {})

    return () => { ac.abort() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchDebounced, onlyWithBalance, balanceRange, statusFilter, sortBy, loading, rows.length])

  useEffect(() => {
    if (rows.length === 0) return
    const rowIds = rows.map(r => r.id)
    const filter = `id=in.(${rowIds.join(',')})`

    const channel = supabase
      .channel('cuc-conversations-' + Date.now())
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'conversations', filter,
      }, (payload) => {
        const newRow = payload.new
        if (!newRow?.id) return
        const updates = {}
        const trackedFields = [
          'casino_last_known_balance', 'casino_balance_updated_at',
          'casino_login', 'contact_name',
          'casino_blocked', 'casino_blocked_at', 'casino_blocked_reason',
        ]
        for (const f of trackedFields) {
          if (f in newRow) updates[f] = newRow[f]
        }
        if (Object.keys(updates).length > 0) patchRow(newRow.id, updates)
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setRealtimeConnected(true)
        else if (status === 'CHANNEL_ERROR' || status === 'CLOSED' || status === 'TIMED_OUT') {
          setRealtimeConnected(false)
        }
      })

    return () => {
      supabase.removeChannel(channel)
      setRealtimeConnected(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows.length, page, sortBy, balanceRange, statusFilter, searchDebounced])

  const onModalAction = ({ kind, userId }) => {
    if (kind === 'balance') {
      supabase.from('conversations')
        .select('casino_last_known_balance, casino_balance_updated_at')
        .eq('id', userId)
        .maybeSingle()
        .then(({ data }) => { if (data) patchRow(userId, data) })
      showToast('✓ Operación exitosa, mensaje enviado al cliente', 'success')
    } else if (kind === 'password') {
      showToast('✓ Contraseña actualizada, mensaje enviado al cliente', 'success')
    }
  }

  const onUserCreated = ({ conversationId, casinoUserId }) => {
    showToast(`✓ Usuario casino ${casinoUserId} creado y credenciales enviadas`, 'success')
    // reload para que aparezca en la lista
    setTimeout(() => load(), 800)
  }

  const onUserBlocked = ({ userId, blocked, reason }) => {
    patchRow(userId, {
      casino_blocked: blocked,
      casino_blocked_at: blocked ? new Date().toISOString() : null,
      casino_blocked_reason: blocked ? reason : null,
    })
    showToast(blocked ? '✓ Cuenta bloqueada' : '✓ Cuenta desbloqueada', 'success')
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const totalWithBalance = useMemo(
    () => rows.filter(r => r.casino_last_known_balance > 0).length,
    [rows]
  )
  const sumVisibleBalance = useMemo(
    () => rows.reduce((acc, r) => acc + (Number(r.casino_last_known_balance) || 0), 0),
    [rows]
  )
  const totalBlocked = useMemo(
    () => rows.filter(r => r.casino_blocked).length,
    [rows]
  )

  const handleExportCSV = () => {
    if (rows.length === 0) return
    const ts = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')
    downloadCSV(rows, `usuarios-casino-${ts}.csv`)
    showToast(`✓ Exportados ${rows.length} usuarios a CSV`, 'success')
  }

  return (
    <div>
      <PageHeader
        eyebrow="Centro de usuarios casino"
        title="Usuarios del casino"
        subtitle={
          isCrossSub
            ? "Todos los usuarios de tus sub-cuentas, listos para operar."
            : "Todos los usuarios que el bot creó en tu plataforma, con saldo y acciones."
        }
      />

      {realtimeConnected && (
        <div style={liveBadge}>
          <IconLive size={8} />
          Tiempo real activo
        </div>
      )}

      {/* KPIs */}
      <StatGrid minWidth={140} style={{ marginBottom: 18 }}>
        <StatCard icon="👥" label="Total usuarios" value={total} accent="info" />
        <StatCard icon="💰" label="Con saldo cacheado" value={totalWithBalance}
          accent="success" hint={`En esta página (${rows.length})`} />
        <StatCard icon="📊" label="Suma saldos visibles" value={fmtARS(sumVisibleBalance)}
          accent="brand" hint="Solo saldos conocidos" />
        <StatCard icon="🔒" label="Bloqueados (visible)" value={totalBlocked}
          accent={totalBlocked > 0 ? 'warning' : 'muted'} />
      </StatGrid>

      {/* Toolbar — fila 1: búsqueda + acciones */}
      <Card style={{ marginBottom: 10, padding: 12 }}>
        <div className="cuc-tools-row" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, teléfono, login o ID..."
            style={{
              flex: 1, minWidth: 220,
              background: C.bg, border: `1px solid ${C.border}`,
              borderRadius: RADIUS.md, padding: '8px 12px',
              color: C.text, fontSize: FONT_SIZE.sm,
              outline: 'none', boxSizing: 'border-box',
            }}
          />
          <button type="button" onClick={() => setCreateOpen(true)}
            style={primaryButton}
            onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'}
            onMouseLeave={e => e.currentTarget.style.filter = 'none'}>
            <IconPlus size={14} /> <span>Nuevo usuario</span>
          </button>
          <button type="button" onClick={handleExportCSV}
            disabled={rows.length === 0}
            style={ghostButton(rows.length === 0)}
            onMouseEnter={e => { if (rows.length) { e.currentTarget.style.borderColor = C.brand; e.currentTarget.style.color = C.brand } }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.text }}>
            <IconDownload size={14} /> <span>Export CSV</span>
          </button>
          <button type="button" onClick={refreshAllVisible}
            disabled={bulkRefreshing || loading || rows.length === 0}
            style={ghostButton(bulkRefreshing || loading || rows.length === 0)}
            onMouseEnter={e => { if (!bulkRefreshing && rows.length) { e.currentTarget.style.borderColor = C.brand; e.currentTarget.style.color = C.brand } }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.text }}>
            <IconRefresh size={14} spinning={bulkRefreshing} />
            <span>{bulkRefreshing ? `Actualizando ${bulkProgress.done}/${bulkProgress.total}…` : 'Actualizar todos'}</span>
          </button>
        </div>
      </Card>

      {/* Toolbar — fila 2: filtros */}
      <Card style={{ marginBottom: 14, padding: 12 }}>
        <div className="cuc-tools-row cuc-tools-filters" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="cuc-tools-label" style={{ fontSize: FONT_SIZE.xs, color: C.muted, textTransform: 'uppercase', letterSpacing: '.06em', fontFamily: FONT.mono }}>
            Filtrar:
          </span>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            style={selectInput()}>
            {SORT_OPTIONS.map(o => (
              <option key={o.id} value={o.id}>Orden: {o.label}</option>
            ))}
          </select>
          <select value={balanceRange} onChange={e => setBalanceRange(e.target.value)}
            style={selectInput()}>
            {BALANCE_FILTER_OPTIONS.map(o => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            style={selectInput()}>
            {STATUS_FILTER_OPTIONS.map(o => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
          <label className="cuc-only-balance" style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: FONT_SIZE.sm, color: C.muted,
            cursor: 'pointer', userSelect: 'none',
          }}>
            <input type="checkbox" checked={onlyWithBalance}
              onChange={e => setOnlyWithBalance(e.target.checked)}
              style={{ cursor: 'pointer' }} />
            <span>Solo con saldo</span>
          </label>
        </div>
      </Card>

      {error && <Banner variant="danger" style={{ marginBottom: 14 }}>{error}</Banner>}

      {loading && rows.length === 0 ? (
        <div style={{ color: C.muted, padding: 20 }}>Cargando…</div>
      ) : rows.length === 0 ? (
        <Card padding={0} style={{ borderStyle: 'dashed' }}>
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 42, marginBottom: 14, opacity: 0.7 }}>👥</div>
            <div style={{ fontSize: 16, color: C.text, fontWeight: FONT_WEIGHT.semibold }}>
              {searchDebounced
                ? `Sin resultados para "${searchDebounced}"`
                : (balanceRange || statusFilter)
                  ? 'Sin resultados con esos filtros'
                  : 'Todavía no hay usuarios casino'}
            </div>
            <div style={{ fontSize: FONT_SIZE.sm, color: C.muted, marginTop: 6 }}>
              {searchDebounced ? 'Probá con otro término'
                : (balanceRange || statusFilter) ? 'Probá cambiar los filtros'
                : 'Cuando el bot cree usuarios en tu plataforma aparecerán acá'}
            </div>
          </div>
        </Card>
      ) : (
        <>
          {/* Tabla con scroll horizontal — ancho mínimo profesional en desktop;
              en mobile (<768px) el CSS al final del componente convierte cada
              fila en una card apilada y oculta el header. */}
          <Card padding={0} style={{ overflow: 'hidden' }}>
            <div className="cuc-scroll" style={{ overflowX: 'auto', width: '100%' }}>
              <div className="cuc-table-inner" style={{ minWidth: 920 }}>
                {/* Header */}
                <div className="cuc-table-header" style={{
                  display: 'grid',
                  gridTemplateColumns: '220px 150px 140px 110px 130px 220px',
                  gap: 12,
                  padding: '10px 14px',
                  fontSize: FONT_SIZE.xs,
                  color: C.muted,
                  textTransform: 'uppercase',
                  letterSpacing: '.06em',
                  fontFamily: FONT.mono,
                  fontWeight: FONT_WEIGHT.semibold,
                  borderBottom: `1px solid ${C.border}`,
                  background: C.surface || C.card,
                }}>
                  <SortableHeader label="Cliente"
                    currentSort={sortBy} sortAsc="name_asc" sortDesc="name_asc"
                    onClick={() => setSortBy('name_asc')} />
                  <span>Login casino</span>
                  <SortableHeader label="Saldo" align="right"
                    currentSort={sortBy} sortAsc="balance_asc" sortDesc="balance_desc"
                    onClick={() => toggleSort('balance_asc', 'balance_desc')} />
                  <SortableHeader label="Actualizado"
                    currentSort={sortBy} sortAsc="updated_desc" sortDesc="updated_desc"
                    onClick={() => setSortBy('updated_desc')} />
                  <SortableHeader label="Creado"
                    currentSort={sortBy} sortAsc="created_asc" sortDesc="created_desc"
                    onClick={() => toggleSort('created_asc', 'created_desc')} />
                  <span style={{ textAlign: 'right' }}>Acciones</span>
                </div>

                {/* Rows */}
                {rows.map((row, i) => {
                  const isLast = i === rows.length - 1
                  const balance = row.casino_last_known_balance
                  const hasBalance = balance != null
                  const isRefreshing = refreshingId === row.id
                  const blocked = !!row.casino_blocked
                  return (
                    <div key={row.id} className="cuc-row" style={{
                      padding: '12px 14px',
                      borderBottom: isLast ? 'none' : `1px solid ${C.border}`,
                      display: 'grid',
                      gridTemplateColumns: '220px 150px 140px 110px 130px 220px',
                      gap: 12,
                      alignItems: 'center',
                      opacity: blocked ? 0.7 : 1,
                    }}>
                      {/* Cliente */}
                      <div className="cuc-cell cuc-cell-client" style={{ minWidth: 0 }}>
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          fontSize: FONT_SIZE.base,
                          color: C.text,
                          fontWeight: FONT_WEIGHT.semibold,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }} title={row.contact_name || '—'}>
                          {blocked && <IconLock size={11} />}
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {row.contact_name || '—'}
                          </span>
                        </div>
                        <div style={{
                          fontSize: FONT_SIZE.xs,
                          color: C.muted,
                          fontFamily: FONT.mono,
                          marginTop: 2,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }} title={`${row.phone} · ID ${row.casino_user_id}`}>
                          {row.phone} · ID {row.casino_user_id}
                        </div>
                      </div>

                      {/* Login */}
                      <div className="cuc-cell cuc-cell-login" data-label="Login" style={{
                        fontSize: FONT_SIZE.sm,
                        color: C.text,
                        fontFamily: FONT.mono,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }} title={row.casino_login || '—'}>
                        {row.casino_login || '—'}
                      </div>

                      {/* Saldo */}
                      <div className="cuc-cell cuc-cell-balance" data-label="Saldo" style={{
                        fontSize: FONT_SIZE.base,
                        color: hasBalance ? (balance > 0 ? C.success : C.muted) : C.muted,
                        fontWeight: hasBalance ? FONT_WEIGHT.bold : FONT_WEIGHT.normal,
                        fontFamily: FONT.mono,
                        textAlign: 'right',
                        whiteSpace: 'nowrap',
                      }}>
                        {hasBalance ? fmtARS(balance) : '—'}
                      </div>

                      {/* Actualizado */}
                      <div className="cuc-cell cuc-cell-updated" data-label="Actualizado" style={{
                        fontSize: FONT_SIZE.xs,
                        color: C.muted,
                        fontFamily: FONT.mono,
                      }} title={fmtFullDate(row.casino_balance_updated_at)}>
                        {timeAgo(row.casino_balance_updated_at)}
                      </div>

                      {/* Creado */}
                      <div className="cuc-cell cuc-cell-created" data-label="Creado" style={{
                        fontSize: FONT_SIZE.xs,
                        color: C.muted,
                        fontFamily: FONT.mono,
                      }} title={fmtFullDate(row.created_at)}>
                        {timeAgo(row.created_at)}
                      </div>

                      {/* Acciones */}
                      <div className="cuc-actions" style={{
                        display: 'flex', gap: 6, justifyContent: 'flex-end',
                      }}>
                        <button type="button"
                          onClick={() => refreshBalance(row)}
                          disabled={isRefreshing || bulkRefreshing}
                          title="Actualizar saldo desde el casino"
                          style={rowActionBtn(isRefreshing || bulkRefreshing, isRefreshing ? C.muted : C.text)}
                          onMouseEnter={e => {
                            if (isRefreshing || bulkRefreshing) return
                            e.currentTarget.style.borderColor = C.brand
                            e.currentTarget.style.color = C.brand
                          }}
                          onMouseLeave={e => {
                            if (isRefreshing || bulkRefreshing) return
                            e.currentTarget.style.borderColor = C.border
                            e.currentTarget.style.color = C.text
                          }}>
                          <IconRefresh size={13} spinning={isRefreshing} />
                          <span>{isRefreshing ? '...' : 'Actualizar'}</span>
                        </button>
                        <button type="button"
                          onClick={() => setActionUser(row)}
                          title="Acciones: acreditar / descontar / contraseña / bloquear / historial"
                          style={rowActionBtnPrimary}
                          onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'}
                          onMouseLeave={e => e.currentTarget.style.filter = 'none'}>
                          <IconSettings size={13} />
                          <span>Acciones</span>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </Card>

          {/* Paginación */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginTop: 14, gap: 12, flexWrap: 'wrap',
            }}>
              <span style={{ fontSize: FONT_SIZE.sm, color: C.muted }}>
                Página {page + 1} de {totalPages} · {total} usuarios
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button variant="ghost" size="sm" disabled={page === 0 || loading}
                  onClick={() => setPage(p => Math.max(0, p - 1))}>← Anterior</Button>
                <Button variant="ghost" size="sm" disabled={page >= totalPages - 1 || loading}
                  onClick={() => setPage(p => p + 1)}>Siguiente →</Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {actionUser && (
        <UserCasinoActionModal
          user={actionUser}
          onClose={() => setActionUser(null)}
          onActionDone={onModalAction}
          onOpenBlock={setBlockUser}
          onOpenHistory={setHistoryUser}
        />
      )}
      {historyUser && (
        <HistoryModal user={historyUser} onClose={() => setHistoryUser(null)} />
      )}
      {blockUser && (
        <BlockUserModal user={blockUser} onClose={() => setBlockUser(null)} onBlocked={onUserBlocked} />
      )}
      {createOpen && (
        <CreateUserModal onClose={() => setCreateOpen(false)} onCreated={onUserCreated} />
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 20, left: '50%',
          transform: 'translateX(-50%)',
          background: toast.kind === 'danger' ? C.danger : toast.kind === 'warning' ? C.warning : C.success,
          color: '#000', padding: '10px 18px',
          borderRadius: 999,
          fontWeight: FONT_WEIGHT.semibold,
          fontSize: FONT_SIZE.sm,
          boxShadow: '0 6px 20px rgba(0,0,0,0.4)',
          zIndex: Z.toast || 9999,
          maxWidth: '90vw',
        }}>{toast.msg}</div>
      )}

      <style>{`
        @keyframes cuc-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .cuc-scroll::-webkit-scrollbar { height: 8px; }
        .cuc-scroll::-webkit-scrollbar-track { background: transparent; }
        .cuc-scroll::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 4px;
        }
        .cuc-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }

        /* ──────────────────────────────────────────────────────
           v3.1 — Responsive: < 768px convierte la tabla en cards
           apiladas (1 col), oculta el header, anula el minWidth
           del wrapper (no más scroll horizontal) y pone los
           controles del toolbar a ancho completo.
           ────────────────────────────────────────────────────── */
        @media (max-width: 767px) {
          /* Wrapper interno: anular minWidth para que no haya scroll horizontal */
          .cuc-table-inner { min-width: 0 !important; }
          .cuc-scroll { overflow-x: visible !important; }

          /* Header de tabla: oculto en mobile (las cards no usan grid de columnas) */
          .cuc-table-header { display: none !important; }

          /* Filas: una sola columna, gap menor, padding card-like */
          .cuc-row {
            grid-template-columns: 1fr !important;
            gap: 6px !important;
            padding: 14px !important;
          }

          /* Celdas con etiqueta visible (Login / Saldo / Actualizado / Creado) */
          .cuc-cell[data-label] {
            display: flex !important;
            justify-content: space-between !important;
            align-items: baseline !important;
            text-align: left !important;
            white-space: normal !important;
            overflow: visible !important;
            text-overflow: clip !important;
            gap: 12px;
          }
          .cuc-cell[data-label]::before {
            content: attr(data-label);
            font-size: 11px;
            color: var(--cuc-muted, currentColor);
            opacity: 0.65;
            text-transform: uppercase;
            letter-spacing: .06em;
            font-family: inherit;
            font-weight: 600;
            flex-shrink: 0;
          }

          /* Acciones: full-width 2 columnas */
          .cuc-actions {
            justify-content: stretch !important;
            margin-top: 4px;
          }
          .cuc-actions > button {
            flex: 1;
            justify-content: center;
          }

          /* Toolbars: cada control toma ancho completo (1 por fila) */
          .cuc-tools-row > input[type="text"],
          .cuc-tools-row > select,
          .cuc-tools-row > button {
            flex: 1 1 100% !important;
            min-width: 0 !important;
            justify-content: center;
          }
          /* La etiqueta "Filtrar:" se oculta en mobile (ocupa espacio sin valor) */
          .cuc-tools-filters .cuc-tools-label { display: none; }
          /* Checkbox "Solo con saldo" full-width */
          .cuc-tools-row > .cuc-only-balance {
            flex: 1 1 100% !important;
            padding: 6px 0;
          }
        }
      `}</style>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// Style helpers
// ════════════════════════════════════════════════════════════════
const modalBackdrop = {
  position: 'fixed', inset: 0,
  background: 'rgba(0,0,0,0.78)',
  backdropFilter: 'blur(4px)',
  zIndex: Z.modal,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: 16,
}

const modalCard = (maxW = 480) => ({
  background: C.card, border: `1px solid ${C.border}`,
  borderRadius: RADIUS.xl, width: '100%', maxWidth: maxW,
  maxHeight: '88vh', display: 'flex', flexDirection: 'column',
  boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
})

const modalHeader = {
  padding: '14px 18px',
  borderBottom: `1px solid ${C.border}`,
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  gap: 10, flexShrink: 0,
}

const modalTitle = {
  margin: 0, color: C.text, fontSize: 15,
  fontWeight: FONT_WEIGHT.bold, lineHeight: 1.3,
  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
}

const fieldLabel = {
  fontSize: FONT_SIZE.xs,
  color: C.muted,
  textTransform: 'uppercase',
  letterSpacing: '.06em',
  fontFamily: FONT.mono,
  fontWeight: FONT_WEIGHT.semibold,
  marginBottom: -6,
}

const textInput = () => ({
  width: '100%',
  background: C.bg,
  border: `1px solid ${C.border}`,
  borderRadius: RADIUS.md,
  padding: '10px 12px',
  color: C.text,
  fontSize: FONT_SIZE.base,
  outline: 'none',
  boxSizing: 'border-box',
})

const selectInput = () => ({
  background: C.bg,
  border: `1px solid ${C.border}`,
  borderRadius: RADIUS.md,
  padding: '8px 12px',
  color: C.text,
  fontSize: FONT_SIZE.sm,
  outline: 'none',
  cursor: 'pointer',
  minWidth: 150,
})

const tabButton = (active) => ({
  padding: '8px 14px',
  background: active ? C.brand : C.surface,
  color: active ? '#000' : C.text,
  border: `1px solid ${active ? C.brand : C.border}`,
  borderRadius: RADIUS.md,
  fontSize: FONT_SIZE.sm,
  fontWeight: FONT_WEIGHT.semibold,
  cursor: 'pointer',
  transition: TRANSITION,
})

const infoBlock = {
  background: C.surface,
  border: `1px solid ${C.border}`,
  borderRadius: RADIUS.md,
  padding: 12, marginBottom: 14,
  fontSize: FONT_SIZE.sm,
  fontFamily: FONT.mono,
  display: 'grid',
  gridTemplateColumns: 'auto 1fr',
  gap: '6px 12px',
}

const liveBadge = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '4px 10px',
  marginBottom: 14,
  background: 'rgba(34,197,94,0.10)',
  border: '1px solid rgba(34,197,94,0.25)',
  borderRadius: 99,
  fontSize: 11,
  color: C.success,
  fontWeight: FONT_WEIGHT.semibold,
  fontFamily: FONT.mono,
  textTransform: 'uppercase',
  letterSpacing: '.04em',
}

const primaryButton = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '8px 14px',
  background: C.brand,
  border: `1px solid ${C.brand}`,
  borderRadius: RADIUS.md,
  color: '#000',
  fontSize: FONT_SIZE.sm,
  fontWeight: FONT_WEIGHT.bold,
  cursor: 'pointer',
  transition: TRANSITION,
  whiteSpace: 'nowrap',
  fontFamily: 'inherit',
}

const ghostButton = (disabled) => ({
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '8px 14px',
  background: 'transparent',
  border: `1px solid ${C.border}`,
  borderRadius: RADIUS.md,
  color: disabled ? C.muted : C.text,
  fontSize: FONT_SIZE.sm,
  fontWeight: FONT_WEIGHT.semibold,
  cursor: disabled ? 'not-allowed' : 'pointer',
  opacity: disabled ? 0.55 : 1,
  transition: TRANSITION,
  whiteSpace: 'nowrap',
  fontFamily: 'inherit',
})

const rowActionBtn = (disabled, color) => ({
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '6px 11px',
  background: 'transparent',
  border: `1px solid ${C.border}`,
  borderRadius: RADIUS.md,
  color,
  fontSize: 12,
  fontWeight: FONT_WEIGHT.semibold,
  cursor: disabled ? 'not-allowed' : 'pointer',
  opacity: disabled ? 0.55 : 1,
  transition: TRANSITION,
  whiteSpace: 'nowrap',
  fontFamily: 'inherit',
})

const rowActionBtnPrimary = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '6px 11px',
  background: C.brand,
  border: `1px solid ${C.brand}`,
  borderRadius: RADIUS.md,
  color: '#000',
  fontSize: 12,
  fontWeight: FONT_WEIGHT.bold,
  cursor: 'pointer',
  transition: TRANSITION,
  whiteSpace: 'nowrap',
  fontFamily: 'inherit',
}

const secondaryActionBtn = (color = C.text) => ({
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '8px 12px',
  background: 'transparent',
  border: `1px solid ${C.border}`,
  borderRadius: RADIUS.md,
  color,
  fontSize: FONT_SIZE.sm,
  fontWeight: FONT_WEIGHT.semibold,
  cursor: 'pointer',
  transition: TRANSITION,
  fontFamily: 'inherit',
  flex: 1, justifyContent: 'center',
})
