// ═══════════════════════════════════════════════════════════════════
// SecretField
// ───────────────────────────────────────────────────────────────────
// Input para secrets write-only (tokens de API, passwords).
// El valor NUNCA vuelve del backend — el componente solo sabe si existe
// (hasValue=true) y muestra "✓ Configurado" con botón "Cambiar".
//
// Props:
//   label, hasValue, value, onChange, placeholder, hint, mono (default true)
//   readOnly — si true, muestra modo locked (🔒, lo modifica el sub_tenant)
//   readOnlyHint — texto opcional del hint cuando readOnly
//   helpUrl — URL a doc oficial del provider para obtener el token
//   helpText — texto del link (default "¿Cómo obtener este token?")
//   provider — 'mercadopago' | 'modo' | 'uala' | 'casino'. Si está seteado,
//              muestra botón "Probar conexión"
//   validateExtra — objeto extra para la validación (ej. {casino_host,
//                   casino_hall_id} para provider=casino)
//   updatedAt — ISO timestamp opcional. Si está presente y hasValue=true,
//               muestra "Última actualización: hace X" debajo del campo
//               para feedback visual de que se guardó (09/05/2026).
// ═══════════════════════════════════════════════════════════════════
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import IAHelper from './IAHelper'
import {
  Button,
  COLORS as C, RADIUS, FONT_SIZE, FONT_WEIGHT, FONT,
} from './ui'
import Icon from './Icon'

const fi = {
  width: '100%',
  background: C.bg,
  border: `1px solid ${C.border}`,
  borderRadius: RADIUS.md,
  padding: '10px 12px',
  color: C.text,
  fontSize: FONT_SIZE.base,
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
}

// Formato relativo: "hace 5 min", "hace 2 horas", "hace 3 días"
// Sin librerías para no inflar el bundle. Usa locale es-AR.
function formatRelative(iso) {
  if (!iso) return null
  const d = new Date(iso)
  if (isNaN(d.getTime())) return null
  const diffMs = Date.now() - d.getTime()
  const diffSec = Math.floor(diffMs / 1000)

  if (diffSec < 0) return 'recién'                                // tolerancia clock skew
  if (diffSec < 30) return 'hace unos segundos'
  if (diffSec < 60) return `hace ${diffSec} seg`

  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `hace ${diffMin} min`

  const diffHs = Math.floor(diffMin / 60)
  if (diffHs < 24) return `hace ${diffHs} ${diffHs === 1 ? 'hora' : 'horas'}`

  const diffDays = Math.floor(diffHs / 24)
  if (diffDays < 30) return `hace ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`

  const diffMonths = Math.floor(diffDays / 30)
  if (diffMonths < 12) return `hace ${diffMonths} ${diffMonths === 1 ? 'mes' : 'meses'}`

  const diffYears = Math.floor(diffMonths / 12)
  return `hace ${diffYears} ${diffYears === 1 ? 'año' : 'años'}`
}

// HelpButton: botón que abre el drawer de ayuda IA.
// Si hay `provider` → abre IAHelper (mini-chat con IA + sugerencias).
// Si no hay provider pero hay url → muestra link externo (modo legacy compat).
function HelpButton({ url, text, provider }) {
  const [open, setOpen] = useState(false)
  // Sin provider ni url: no mostrar nada
  if (!provider && !url) return null

  const label = text || '¿Cómo obtener este token?'
  const btnStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    fontSize: FONT_SIZE.sm,
    color: C.brand,
    background: 'transparent',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontWeight: FONT_WEIGHT.normal,
    textTransform: 'none',
    letterSpacing: 0,
  }

  // Si hay provider → abre IA drawer
  if (provider) {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={btnStyle}
          onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline' }}
          onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none' }}
        >
          <span>💡</span>
          <span>{label}</span>
        </button>
        <IAHelper
          open={open}
          provider={provider}
          onClose={() => setOpen(false)}
        />
      </>
    )
  }

  // Fallback: link externo simple
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{ ...btnStyle, textDecoration: 'none' }}
      onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline' }}
      onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none' }}
    >
      {label} ↗
    </a>
  )
}

// Banner de resultado de validación
function ValidationResult({ state, result }) {
  if (state === 'idle') return null
  if (state === 'loading') {
    return (
      <div style={{
        marginTop: 8,
        padding: '8px 10px',
        background: C.bg,
        border: `1px solid ${C.border}`,
        borderRadius: RADIUS.sm,
        fontSize: FONT_SIZE.sm,
        color: C.muted,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <span style={{ fontSize: 12 }}>⏳</span>
        Validando con el proveedor…
      </div>
    )
  }
  if (state === 'ok') {
    const info = result?.info || {}
    return (
      <div style={{
        marginTop: 8,
        padding: '10px 12px',
        background: `${C.success}15`,
        border: `1px solid ${C.success}`,
        borderRadius: RADIUS.sm,
        fontSize: FONT_SIZE.sm,
        color: C.text,
        lineHeight: 1.5,
      }}>
        <div style={{ fontWeight: FONT_WEIGHT.semibold, color: C.success, marginBottom: 4 }}>
          <Icon e="✓"/> Conexión válida
        </div>
        {info.email && (
          <div style={{ fontFamily: FONT.mono, fontSize: FONT_SIZE.sm }}>
            Cuenta: <strong>{info.email}</strong>
            {info.nickname && <> ({info.nickname})</>}
          </div>
        )}
        {info.country && (
          <div style={{ fontFamily: FONT.mono, fontSize: FONT_SIZE.sm, color: C.muted }}>
            País: {info.country}
          </div>
        )}
        {info.note && (
          <div style={{ fontSize: FONT_SIZE.sm, color: C.muted, marginTop: 4, fontStyle: 'italic' }}>
            {info.note}
          </div>
        )}
        {Array.isArray(info.warnings) && info.warnings.length > 0 && (
          <ul style={{ margin: '6px 0 0', paddingLeft: 18, fontSize: FONT_SIZE.sm, color: C.warning }}>
            {info.warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        )}
      </div>
    )
  }
  // error
  return (
    <div style={{
      marginTop: 8,
      padding: '10px 12px',
      background: `${C.danger}15`,
      border: `1px solid ${C.danger}`,
      borderRadius: RADIUS.sm,
      fontSize: FONT_SIZE.sm,
      color: C.text,
      lineHeight: 1.5,
    }}>
      <div style={{ fontWeight: FONT_WEIGHT.semibold, color: C.danger, marginBottom: 4 }}>
        <Icon e="✗"/> No se pudo validar
      </div>
      <div>{result?.error || 'Error desconocido'}</div>
    </div>
  )
}

export default function SecretField({
  label, hasValue, value, onChange, placeholder, hint, mono = true,
  readOnly = false, readOnlyHint = null,
  helpUrl = null, helpText = null,
  provider = null, validateExtra = null,
  updatedAt = null,
}) {
  const [show, setShow] = useState(false)
  const [visible, setVisible] = useState(false)

  // Estado de validación
  const [valState, setValState] = useState('idle') // 'idle' | 'loading' | 'ok' | 'error'
  const [valResult, setValResult] = useState(null)

  useEffect(() => {
    if (!hasValue) setShow(true)
    else setShow(false)
  }, [hasValue])

  // Reset validación cuando cambia el input
  useEffect(() => {
    if (valState !== 'idle') {
      setValState('idle')
      setValResult(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const canValidate = !!provider && !readOnly && !!value && value.length >= 4

  const handleValidate = async () => {
    if (!canValidate) return
    setValState('loading')
    setValResult(null)
    try {
      const { data: session } = await supabase.auth.getSession()
      const token = session?.session?.access_token
      if (!token) throw new Error('Sesión expirada. Reingresá al panel.')

      const url = `${import.meta.env.VITE_SUPABASE_URL || 'https://dvzxkortcvuakjhsidrr.supabase.co'}/functions/v1/validate-provider-token`
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ provider, token: value, extra: validateExtra || undefined }),
      })
      const data = await res.json()
      if (res.ok && data.ok) {
        setValState('ok')
        setValResult(data)
      } else {
        setValState('error')
        setValResult({ error: data.error || `HTTP ${res.status}` })
      }
    } catch (e) {
      setValState('error')
      setValResult({ error: e.message || 'Error de red' })
    }
  }

  const updatedAtRel = formatRelative(updatedAt)
  const updatedAtAbs = updatedAt ? new Date(updatedAt).toLocaleString('es-AR') : null

  // MODO READ-ONLY ═════════════════════════════════════════════════════
  if (readOnly) {
    return (
      <div>
        <label style={{
          fontSize: FONT_SIZE.xs,
          color: C.muted,
          textTransform: 'uppercase',
          letterSpacing: '.08em',
          display: 'block',
          marginBottom: 5,
          fontFamily: FONT.mono,
          fontWeight: FONT_WEIGHT.semibold,
        }}>{label}</label>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: C.bg,
          border: `1px dashed ${C.border}`,
          borderRadius: RADIUS.md,
          padding: '9px 12px',
          opacity: 0.75,
        }}>
          <span style={{ fontSize: 14 }} title="Gestionado por el cliente">🔒</span>
          <span style={{
            flex: 1,
            fontSize: FONT_SIZE.md,
            color: C.muted,
            fontFamily: FONT.mono,
          }}>
            {hasValue ? 'Configurado por el cliente' : 'Pendiente de configurar por el cliente'}
          </span>
        </div>
        <p style={{ fontSize: FONT_SIZE.sm, color: C.muted, margin: '4px 0 0', lineHeight: 1.45, fontStyle: 'italic' }}>
          {readOnlyHint || 'Este dato es privado del cliente. Desde que lo configuró en su panel, solo él puede modificarlo.'}
        </p>
      </div>
    )
  }

  // MODO COMPACTO "✓ Configurado" ══════════════════════════════════════
  if (!show) {
    return (
      <div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 5,
          gap: 8,
        }}>
          <label style={{
            fontSize: FONT_SIZE.xs,
            color: C.muted,
            textTransform: 'uppercase',
            letterSpacing: '.08em',
            fontFamily: FONT.mono,
            fontWeight: FONT_WEIGHT.semibold,
          }}>{label}</label>
          <HelpButton url={helpUrl} text={helpText} provider={provider} />
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: C.bg,
          border: `1px solid ${C.border}`,
          borderRadius: RADIUS.md,
          padding: '9px 12px',
        }}>
          <span style={{
            fontSize: FONT_SIZE.base,
            color: C.success,
            fontWeight: FONT_WEIGHT.semibold,
          }}><Icon e="✓"/> Configurado</span>
          <span style={{
            flex: 1,
            fontSize: FONT_SIZE.md,
            color: C.muted,
            fontFamily: FONT.mono,
          }}>•••••••••••••</span>
          <Button variant="ghost" size="sm" onClick={() => setShow(true)}>Cambiar</Button>
        </div>
        {/* Timestamp de última actualización (09/05/2026) — feedback visual */}
        {updatedAtRel && (
          <p
            style={{
              fontSize: FONT_SIZE.sm,
              color: C.success,
              margin: '4px 0 0',
              lineHeight: 1.45,
              fontFamily: FONT.mono,
              fontWeight: FONT_WEIGHT.medium,
            }}
            title={updatedAtAbs}
          >
            <Icon e="🕒"/> Última actualización: {updatedAtRel}
          </p>
        )}
        {hint && <p style={{ fontSize: FONT_SIZE.sm, color: C.muted, margin: '4px 0 0', lineHeight: 1.45 }}>{hint}</p>}
      </div>
    )
  }

  // MODO INPUT ═════════════════════════════════════════════════════════
  return (
    <div>
      <label style={{
        fontSize: FONT_SIZE.xs,
        color: C.muted,
        textTransform: 'uppercase',
        letterSpacing: '.08em',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5,
        fontFamily: FONT.mono,
        fontWeight: FONT_WEIGHT.semibold,
        gap: 8,
      }}>
        <span>{label}</span>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {(helpUrl || provider) && <HelpButton url={helpUrl} text={helpText} provider={provider} />}
          {hasValue && (
            <button
              type="button"
              onClick={() => { setShow(false); onChange({ target: { value: null } }); setValState('idle'); setValResult(null) }}
              style={{
                background: 'transparent',
                border: 'none',
                color: C.muted,
                fontSize: FONT_SIZE.sm,
                cursor: 'pointer',
                textTransform: 'none',
                fontFamily: 'inherit',
                fontWeight: FONT_WEIGHT.normal,
                padding: 0,
              }}
            >cancelar</button>
          )}
        </div>
      </label>
      <div style={{ position: 'relative' }}>
        <input
          type={visible ? 'text' : 'password'}
          value={value || ''}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete="off"
          style={{
            ...fi,
            padding: '10px 42px 10px 12px',
            fontFamily: mono ? FONT.mono : 'inherit',
          }}
          onFocus={e => { e.target.style.borderColor = `${C.brand}55` }}
          onBlur={e => { e.target.style.borderColor = C.border }}
        />
        <button
          type="button"
          onClick={() => setVisible(v => !v)}
          style={{
            position: 'absolute',
            right: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'transparent',
            border: 'none',
            color: C.muted,
            cursor: 'pointer',
            fontSize: 14,
            padding: 4,
          }}
          title={visible ? 'Ocultar' : 'Mostrar'}
        >{visible ? '🙈' : '👁'}</button>
      </div>
      {hint && <p style={{ fontSize: FONT_SIZE.sm, color: C.muted, margin: '4px 0 0', lineHeight: 1.45 }}>{hint}</p>}

      {/* Botón Probar conexión + feedback */}
      {provider && (
        <div style={{ marginTop: 8 }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleValidate}
            disabled={!canValidate || valState === 'loading'}
            loading={valState === 'loading'}
          >
            {valState === 'loading' ? 'Validando…' : '🔌 Probar conexión'}
          </Button>
          <ValidationResult state={valState} result={valResult} />
        </div>
      )}
    </div>
  )
}
