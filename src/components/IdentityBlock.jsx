import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { IDENTITIES, DEFAULT_IDENTITY } from '../lib/identityConfig'
import {
  Button,
  Banner,
  COLORS as C,
  RADIUS,
  FONT_SIZE,
  FONT_WEIGHT,
  TRANSITION,
} from './ui'

/**
 * IdentityBlock — selector de identidad del tenant o sub-tenant.
 *
 * Recibe UNO de los dos: tenant (root) | subTenant.
 * Muestra 4 cards (casino / tienda / marketing / profesional) y, al
 * intentar cambiar a una distinta de la activa, abre un modal de
 * confirmación tipo GitHub: pide tipear el nombre exacto del tenant
 * para evitar cambios accidentales.
 *
 * Backend: change_my_tenant_identity(p_new_identity, p_confirm_name)
 *          change_my_sub_tenant_identity(p_sub_tenant_id, p_new_identity, p_confirm_name)
 *
 * Las definiciones de identidades (label/icon/accent/etc) vienen de
 * src/lib/identityConfig.js — fuente única de verdad. NO definir acá.
 */


const IDENTITY_DEFAULT_FALLBACK = DEFAULT_IDENTITY

export default function IdentityBlock({ tenant, subTenant, onChanged }) {
  const entity = tenant || subTenant
  if (!entity) return null

  const isRoot = !!tenant
  const currentIdentity = entity.identity || 'casino'
  const entityName = entity.name || ''

  const [pendingTarget, setPendingTarget] = useState(null) // identity key
  const [confirmText, setConfirmText] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)

  const activeIdentity =
    IDENTITIES.find((i) => i.key === currentIdentity) || IDENTITIES[0]

  // Autofocus + Escape para cerrar
  useEffect(() => {
    if (!pendingTarget) return
    const t = setTimeout(() => inputRef.current?.focus(), 30)
    const onKey = (e) => {
      if (e.key === 'Escape' && !loading) closeModal()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(t)
      window.removeEventListener('keydown', onKey)
    }
  }, [pendingTarget, loading])

  function closeModal() {
    setPendingTarget(null)
    setConfirmText('')
    setError(null)
  }

  function handleCardClick(key) {
    if (key === currentIdentity || loading) return
    setPendingTarget(key)
    setConfirmText('')
    setError(null)
  }

  async function handleConfirm() {
    if (loading) return
    if (confirmText.trim() !== entityName) {
      setError('El nombre no coincide.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const args = isRoot
        ? {
            p_new_identity: pendingTarget,
            p_confirm_name: confirmText.trim(),
          }
        : {
            p_sub_tenant_id: subTenant.id,
            p_new_identity: pendingTarget,
            p_confirm_name: confirmText.trim(),
          }
      const rpcName = isRoot
        ? 'change_my_tenant_identity'
        : 'change_my_sub_tenant_identity'
      const { data, error: rpcErr } = await supabase.rpc(rpcName, args)
      if (rpcErr) throw rpcErr
      closeModal()
      if (onChanged) await onChanged(data)
    } catch (e) {
      setError(e.message || 'No se pudo cambiar la identidad.')
    } finally {
      setLoading(false)
    }
  }

  const matches = confirmText.trim() === entityName && entityName.length > 0
  const targetIdentity =
    pendingTarget && IDENTITIES.find((i) => i.key === pendingTarget)

  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: RADIUS.lg,
        padding: 20,
        marginBottom: 18,
      }}
    >
      <div style={{ marginBottom: 14 }}>
        <h3
          style={{
            margin: 0,
            fontSize: FONT_SIZE.lg,
            fontWeight: FONT_WEIGHT.bold,
            color: C.text,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span>🧬</span>
          Identidad del {isRoot ? 'tenant' : 'sub-tenant'}
        </h3>
        <p
          style={{
            margin: '6px 0 0',
            fontSize: FONT_SIZE.sm,
            color: C.muted,
            lineHeight: 1.5,
          }}
        >
          Define cómo se comporta el bot y qué módulos del panel se activan.
          Podés cambiarla cuando quieras — pero hacerlo reescribe los prompts
          del bot.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 10,
          marginBottom: 14,
        }}
      >
        {IDENTITIES.map((id) => {
          const selected = id.key === currentIdentity
          return (
            <button
              key={id.key}
              type="button"
              onClick={() => handleCardClick(id.key)}
              disabled={loading}
              style={{
                background: selected ? `${id.accent}10` : C.bg,
                border: `1px solid ${
                  selected ? id.accent : C.border
                }`,
                borderRadius: RADIUS.md,
                padding: '14px 12px',
                cursor: selected ? 'default' : 'pointer',
                textAlign: 'left',
                color: C.text,
                fontFamily: 'inherit',
                position: 'relative',
                transition: `all ${TRANSITION.fast}`,
                opacity: loading ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (!selected && !loading) {
                  e.currentTarget.style.borderColor = id.accent
                  e.currentTarget.style.background = `${id.accent}08`
                }
              }}
              onMouseLeave={(e) => {
                if (!selected) {
                  e.currentTarget.style.borderColor = C.border
                  e.currentTarget.style.background = C.bg
                }
              }}
            >
              {selected && (
                <span
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    background: id.accent,
                    color: '#0b0d12',
                    fontSize: 10,
                    fontWeight: FONT_WEIGHT.bold,
                    padding: '2px 7px',
                    borderRadius: 999,
                    letterSpacing: 0.5,
                    textTransform: 'uppercase',
                  }}
                >
                  Activa
                </span>
              )}
              <div
                style={{
                  marginBottom: 6,
                  lineHeight: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: selected ? id.accent : C.text,
                }}
              >
                {id.Icon ? <id.Icon size={24} strokeWidth={1.8} /> : null}
              </div>
              <div
                style={{
                  fontSize: FONT_SIZE.md,
                  fontWeight: FONT_WEIGHT.bold,
                  color: selected ? id.accent : C.text,
                  marginBottom: 3,
                }}
              >
                {id.label}
              </div>
              <div
                style={{
                  fontSize: FONT_SIZE.sm,
                  color: C.muted,
                  lineHeight: 1.4,
                }}
              >
                {id.description}
              </div>
            </button>
          )
        })}
      </div>

      <div
        style={{
          fontSize: FONT_SIZE.sm,
          color: C.muted,
          paddingTop: 10,
          borderTop: `1px solid ${C.border}`,
        }}
      >
        <strong style={{ color: C.text, fontWeight: FONT_WEIGHT.bold }}>
          Ideal para:
        </strong>{' '}
        {activeIdentity.bestFor}
      </div>

      {/* ── MODAL DE CONFIRMACIÓN TIPO GITHUB ─────────── */}
      {pendingTarget && targetIdentity && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !loading) closeModal()
          }}
        >
          <div
            style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: RADIUS.lg,
              padding: 22,
              maxWidth: 520,
              width: '100%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            }}
          >
            <h3
              style={{
                margin: '0 0 6px',
                fontSize: FONT_SIZE.lg,
                fontWeight: FONT_WEIGHT.bold,
                color: C.text,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  color: targetIdentity.accent,
                }}
              >
                {targetIdentity.Icon ? <targetIdentity.Icon size={22} strokeWidth={1.8} /> : null}
              </span>
              Cambiar identidad a {targetIdentity.label}
            </h3>
            <p
              style={{
                margin: '0 0 14px',
                fontSize: FONT_SIZE.sm,
                color: C.muted,
                lineHeight: 1.5,
              }}
            >
              {targetIdentity.description}
            </p>

            <Banner
              variant="warning"
              title="Esta acción cambia el comportamiento del bot"
              size="sm"
            >
              Los prompts, el flujo de conversación y los módulos visibles del
              panel se van a adaptar a la identidad{' '}
              <strong>{targetIdentity.label}</strong>. Las conversaciones y los
              datos existentes se mantienen.
              {isRoot && (
                <>
                  {' '}
                  Los sub-tenants existentes mantienen su identidad propia (no
                  se modifican).
                </>
              )}
            </Banner>

            <div style={{ marginTop: 14 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: FONT_SIZE.sm,
                  color: C.text,
                  marginBottom: 6,
                  lineHeight: 1.5,
                }}
              >
                Para confirmar, escribí el nombre exacto del tenant:{' '}
                <code
                  style={{
                    background: C.bg,
                    padding: '2px 6px',
                    borderRadius: RADIUS.sm,
                    color: C.brand,
                    fontFamily:
                      'JetBrains Mono, ui-monospace, SFMono-Regular, monospace',
                    fontSize: FONT_SIZE.sm,
                  }}
                >
                  {entityName}
                </code>
              </label>
              <input
                ref={inputRef}
                type="text"
                value={confirmText}
                onChange={(e) => {
                  setConfirmText(e.target.value)
                  if (error) setError(null)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && matches && !loading) handleConfirm()
                }}
                disabled={loading}
                placeholder={entityName}
                style={{
                  width: '100%',
                  background: C.bg,
                  border: `1px solid ${error ? C.danger : C.border}`,
                  borderRadius: RADIUS.md,
                  padding: '10px 12px',
                  color: C.text,
                  fontSize: FONT_SIZE.md,
                  fontFamily:
                    'JetBrains Mono, ui-monospace, SFMono-Regular, monospace',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: `border-color ${TRANSITION.fast}`,
                }}
                onFocus={(e) => {
                  if (!error)
                    e.currentTarget.style.borderColor = targetIdentity.accent
                }}
                onBlur={(e) => {
                  if (!error) e.currentTarget.style.borderColor = C.border
                }}
              />
              {error && (
                <div
                  style={{
                    marginTop: 8,
                    fontSize: FONT_SIZE.sm,
                    color: C.danger,
                  }}
                >
                  {error}
                </div>
              )}
            </div>

            <div
              style={{
                marginTop: 18,
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 8,
              }}
            >
              <Button
                variant="ghost"
                onClick={closeModal}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                variant="success"
                onClick={handleConfirm}
                disabled={!matches || loading}
              >
                {loading ? 'Cambiando…' : 'Confirmar cambio'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
