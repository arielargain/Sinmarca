import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import {
  Card, Button, Banner,
  COLORS as C, RADIUS, FONT_SIZE, FONT_WEIGHT, FONT, TRANSITION,
} from './ui'
import { getQuickReplyFields, QUICK_REPLY_DEFAULTS } from '../lib/quickReplies'

// ═══════════════════════════════════════════════════════════════════
// QuickRepliesEditor — Editor de respuestas rápidas filtrado por identity
//
// 11/05/2026 sprint quick-replies-per-identity:
// Muestra solo los fields relevantes a la identity del retail/sub-tenant
// (definidos en src/lib/quickReplies.js). Mantiene los qr_custom[]
// como sección aparte (siempre disponibles, hasta 4).
//
// Props:
//   entity       — retail | sub-tenant (debe traer identity y campos qr_*)
//   isSubTenant  — boolean, define qué RPC usar para guardar
//   onSaved      — callback (entity_actualizado_jsonb) tras grabar OK
// ═══════════════════════════════════════════════════════════════════

const labelStyle = {
  display: 'block',
  fontSize: FONT_SIZE.xs,
  color: C.muted,
  textTransform: 'uppercase',
  letterSpacing: '.08em',
  marginBottom: 5,
  fontFamily: FONT.mono,
  fontWeight: FONT_WEIGHT.semibold,
}

const textareaStyle = {
  width: '100%',
  background: C.bg,
  border: `1px solid ${C.border}`,
  borderRadius: RADIUS.md,
  padding: '10px 12px',
  color: C.text,
  fontSize: FONT_SIZE.sm,
  fontFamily: FONT.mono,
  outline: 'none',
  resize: 'vertical',
  boxSizing: 'border-box',
  minHeight: 70,
  lineHeight: 1.55,
  transition: `border-color ${TRANSITION.fast}`,
}

const inputStyle = {
  width: '100%',
  background: C.bg,
  border: `1px solid ${C.border}`,
  borderRadius: RADIUS.md,
  padding: '8px 12px',
  color: C.text,
  fontSize: FONT_SIZE.sm,
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
}

export default function QuickRepliesEditor({ entity, isSubTenant, onSaved }) {
  const identity = entity?.identity || 'casino'
  const fields = getQuickReplyFields(identity)

  const [form, setForm]       = useState({})
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [error, setError]     = useState('')

  // Init form desde entity
  useEffect(() => {
    if (!entity) return
    const initial = {}
    for (const f of fields) {
      initial[f.key] = entity[f.key] || ''
    }
    initial.qr_custom = Array.isArray(entity.qr_custom) ? entity.qr_custom : []
    setForm(initial)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entity?.id, identity])

  const handleChange = (key, value) => {
    setForm(f => ({ ...f, [key]: value }))
  }

  const addCustom = () => {
    setForm(f => {
      const next = [...(f.qr_custom || []), { label: '', text: '' }]
      return { ...f, qr_custom: next.slice(0, 4) }
    })
  }

  const removeCustom = (idx) => {
    setForm(f => ({ ...f, qr_custom: (f.qr_custom || []).filter((_, i) => i !== idx) }))
  }

  const updateCustom = (idx, key, value) => {
    setForm(f => ({
      ...f,
      qr_custom: (f.qr_custom || []).map((q, i) => i === idx ? { ...q, [key]: value } : q),
    }))
  }

  const handleSave = async () => {
    if (saving) return
    setSaving(true); setError(''); setSaved(false)
    try {
      // Construyo el patch: solo fields del schema vigente + qr_custom limpio.
      // Para fields no aplicables a esta identity, los enviamos como '' para
      // que el server los nullee (NULLIF '' → NULL). Eso limpia datos legacy.
      const patch = {}
      for (const f of fields) {
        patch[f.key] = String(form[f.key] || '').trim()
      }

      // Fields NO aplicables a esta identity: forzamos a NULL para limpiar
      // legacy data (ej: profesional con qr_credentials casino guardado).
      const allKeys = ['qr_cvu','qr_credentials','qr_access_link','qr_address','qr_pricing','qr_schedule','qr_catalog_link','qr_demo_info']
      const allowedKeys = new Set(fields.map(f => f.key))
      for (const k of allKeys) {
        if (!allowedKeys.has(k)) patch[k] = ''
      }

      // qr_custom: filtrar vacíos, limitar a 4
      patch.qr_custom = (form.qr_custom || [])
        .map(q => ({ label: String(q?.label || '').trim(), text: String(q?.text || '').trim() }))
        .filter(q => q.text)
        .slice(0, 4)

      const rpc = isSubTenant ? 'update_my_sub_tenant_settings' : 'update_my_retail_settings'
      const { data, error: err } = await supabase.rpc(rpc, { p_patch: patch })
      if (err) throw err

      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      onSaved?.(data)
    } catch (e) {
      setError(e.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card padding={20}>
      <div style={{ marginBottom: 14 }}>
        <p style={{
          fontSize: FONT_SIZE.base,
          fontWeight: FONT_WEIGHT.semibold,
          color: C.text,
          margin: 0,
        }}>💬 Respuestas rápidas</p>
        <p style={{
          fontSize: FONT_SIZE.sm,
          color: C.muted,
          margin: '4px 0 0',
          lineHeight: 1.5,
        }}>
          Plantillas que vas a usar desde el chat con el botón <strong style={{ color: C.brand }}>💬 Plantillas</strong>.
          Se adaptan al rubro de tu negocio.
        </p>
      </div>

      {saved && (
        <div style={{ marginBottom: 14 }}>
          <Banner variant="success">Respuestas rápidas guardadas ✓</Banner>
        </div>
      )}
      {error && (
        <div style={{ marginBottom: 14 }}>
          <Banner variant="danger">{error}</Banner>
        </div>
      )}

      {/* Fields del schema según identity */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {fields.map(f => (
          <div key={f.key}>
            <label style={labelStyle}>{f.icon} {f.label}</label>
            <textarea
              value={form[f.key] || ''}
              onChange={e => handleChange(f.key, e.target.value)}
              placeholder={QUICK_REPLY_DEFAULTS[f.key] || ''}
              rows={f.hasVars ? 4 : 3}
              maxLength={2000}
              style={textareaStyle}
              onFocus={e => { e.target.style.borderColor = `${C.brand}55` }}
              onBlur={e => { e.target.style.borderColor = C.border }}
            />
            <p style={{ fontSize: FONT_SIZE.sm, color: C.muted, margin: '4px 0 0', lineHeight: 1.45 }}>
              {f.hint}
              {f.hasVars && (
                <> Variables disponibles: <code style={{
                  background: C.surface, padding: '1px 6px', borderRadius: 4,
                  fontFamily: FONT.mono, color: C.brand, fontSize: FONT_SIZE.xs,
                }}>{'{usuario}'}</code> <code style={{
                  background: C.surface, padding: '1px 6px', borderRadius: 4,
                  fontFamily: FONT.mono, color: C.brand, fontSize: FONT_SIZE.xs,
                }}>{'{clave}'}</code> <code style={{
                  background: C.surface, padding: '1px 6px', borderRadius: 4,
                  fontFamily: FONT.mono, color: C.brand, fontSize: FONT_SIZE.xs,
                }}>{'{link}'}</code>.</>
              )}
            </p>
          </div>
        ))}
      </div>

      {/* qr_custom — siempre */}
      <div style={{
        marginTop: 22,
        paddingTop: 18,
        borderTop: `1px solid ${C.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <div>
            <p style={{
              fontSize: FONT_SIZE.base,
              fontWeight: FONT_WEIGHT.semibold,
              color: C.text,
              margin: 0,
            }}>📝 Respuestas libres</p>
            <p style={{
              fontSize: FONT_SIZE.sm,
              color: C.muted,
              margin: '4px 0 0',
              lineHeight: 1.45,
            }}>
              Plantillas adicionales para casos puntuales. Hasta 4.
            </p>
          </div>
          {(form.qr_custom || []).length < 4 && (
            <Button variant="ghost" size="sm" onClick={addCustom}>+ Agregar</Button>
          )}
        </div>

        {(form.qr_custom || []).length === 0 ? (
          <p style={{
            fontSize: FONT_SIZE.sm,
            color: C.muted,
            fontStyle: 'italic',
            margin: 0,
            padding: '12px 14px',
            background: C.surface,
            borderRadius: RADIUS.md,
            border: `1px dashed ${C.border}`,
          }}>
            No tenés respuestas libres todavía. Tocá <strong>+ Agregar</strong> para crear una.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(form.qr_custom || []).map((q, idx) => (
              <div key={idx} style={{
                padding: 12,
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: RADIUS.md,
              }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div>
                      <label style={labelStyle}>Título</label>
                      <input
                        value={q.label || ''}
                        onChange={e => updateCustom(idx, 'label', e.target.value)}
                        placeholder="Ej: Política de devoluciones"
                        maxLength={80}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Texto</label>
                      <textarea
                        value={q.text || ''}
                        onChange={e => updateCustom(idx, 'text', e.target.value)}
                        rows={3}
                        maxLength={2000}
                        placeholder="Escribí la respuesta completa que se enviará al cliente."
                        style={{ ...textareaStyle, minHeight: 60 }}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeCustom(idx)}
                    title="Eliminar"
                    style={{
                      background: 'transparent',
                      border: `1px solid ${C.border}`,
                      borderRadius: RADIUS.sm,
                      color: C.muted,
                      cursor: 'pointer',
                      width: 30, height: 30,
                      flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14,
                      fontFamily: 'inherit',
                    }}
                  >×</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save */}
      <div style={{ marginTop: 18 }}>
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={saving}
          loading={saving}
          style={{ width: '100%', justifyContent: 'center' }}
        >
          {saving ? 'Guardando…' : '💾 Guardar respuestas rápidas'}
        </Button>
      </div>
    </Card>
  )
}
