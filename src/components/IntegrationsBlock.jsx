// ════════════════════════════════════════════════════════════════════
// IntegrationsBlock — Conectar mi negocio vía API
//
// Contenedor universal para que retail/sub-tenant conecten sistemas
// externos. Providers disponibles:
//   - tienda nativa (tienda)            ─ módulo SaaS (sin conexión externa)
//   - agenda nativa (marketing/profesional) ─ módulo SaaS (sin conexión externa)
//
// 20/05/2026 — imperiumbet (casino) removido de este bloque. Era un duplicado
//   decorativo: escribía en tenant_integrations vía set_my_integration_creds,
//   pero el bot (casino-action) lee las credenciales del casino desde
//   tenant_config + tenant_secrets (RPC set_my_retail_casino_creds /
//   upsert_my_tenant_secrets), NUNCA desde tenant_integrations. La config real
//   del casino vive en el bloque "API del negocio" de Config.jsx / RetailPanel.
//   La tabla tenant_integrations y su CHECK ('imperiumbet') quedan intactos.
//
// 18/05/2026 — Cleanup OAuth: removidos hubspot, calendly y tiendanube.
//   Sus EFs (integrations-*-init/callback/dispatch) devuelven 410 Gone
//   y el CHECK constraint de tenant_integrations solo acepta
//   'imperiumbet'. Si en el futuro se quiere reactivar alguna, hay que
//   agregar el slug al CHECK + redeploy de las 3 EFs OAuth.
// 16/05/2026 — Notion removido del proyecto.
// 14/05/2026 — Shopify removido del catálogo.
// ════════════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Card, Banner, Button, SectionHeader,
  COLORS as C, RADIUS, FONT_SIZE, FONT_WEIGHT, FONT } from './ui'

// ─── Catálogo de providers ──────────────────────────────────────────
// Cada provider declara:
//  - slug (igual al CHECK constraint en DB)
//  - label (UI)
//  - identities[] (qué identities lo pueden usar)
//  - status (available | native_active)
//  - description (qué hace cuando se conecte)
//  - fields[] (campos del form: solo se renderizan si available)
//  - actions[] (chips informativos: qué acciones automatizadas habilita
//    el provider en el chat)
//
// kind: 'native' vs 'integration' (default).
//   - 'integration': sistema externo, requiere conectar via token.
//   - 'native': módulo del propio SaaS (ya está activo).
//
// nativeButtons[] (solo kind='native'):
//   Botones de navegación interna a las pantallas del módulo nativo.
const PROVIDERS = [
  {
    slug: 'tienda',
    label: 'Tienda nativa',
    icon: '🛍️',
    identities: ['tienda'],
    kind: 'native',
    status: 'native_active',
    description: 'Catálogo, carrito multi-producto y pedidos por WhatsApp. El bot toma pedidos, cobra por Mercado Pago y notifica al operador.',
    fields: [],
    actions: ['Tomar pedido', 'Cobrar por MP', 'Gestionar stock', 'Marcar entregado'],
    nativeButtons: [
      { label: 'Catálogo', routeRetail: '/mi-cuenta/catalogo', routeSub: '/cliente/catalogo' },
      { label: 'Pedidos',  routeRetail: '/mi-cuenta/pedidos',  routeSub: '/cliente/pedidos'  },
    ],
  },
  {
    slug: 'agenda',
    label: 'Agenda nativa',
    icon: '🗓️',
    identities: ['marketing', 'profesional'],
    kind: 'native',
    status: 'native_active',
    description: 'Tomá turnos desde el panel y desde el bot por WhatsApp. Configurá tu horario semanal y gestioná reservas.',
    fields: [],
    actions: ['Configurar horarios', 'Crear turno', 'Cancelar / Reagendar', 'Ver semana'],
    nativeButtons: [
      { label: 'Ir a Agenda', routeRetail: '/mi-cuenta/agenda', routeSub: '/cliente/agenda' },
    ],
  },
]

function badgeStyle(status) {
  switch (status) {
    case 'connected':     return { bg: 'rgba(34,197,94,0.10)',  fg: '#22c55e', label: '● Conectado' }
    case 'native_active': return { bg: 'rgba(34,197,94,0.10)',  fg: '#22c55e', label: '● Activa' }
    case 'error':         return { bg: 'rgba(239,68,68,0.10)',  fg: '#ef4444', label: '● Con error' }
    case 'expired':       return { bg: 'rgba(251,146,60,0.10)', fg: '#fb923c', label: '● Expirado' }
    default:              return { bg: 'rgba(120,120,120,0.06)', fg: C.muted,   label: '○ No conectado' }
  }
}

export default function IntegrationsBlock({ tenant, subTenant }) {
  const entity = tenant || subTenant
  const identity = entity?.identity || 'casino'

  // Providers visibles para esta identity (filtrados del catálogo)
  const visibleProviders = PROVIDERS.filter(p => p.identities.includes(identity))

  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState(null)
  const [connections, setConnections] = useState([])
  const [openProvider, setOpenProvider] = useState(null) // slug del provider con form abierto

  const reload = async () => {
    setLoading(true); setError(null)
    try {
      const { data, error: err } = await supabase.rpc('list_my_integrations')
      if (err) throw err
      setConnections(data?.connections || [])
    } catch (e) {
      setError(e.message || 'Error al cargar integraciones')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { reload() }, [])

  const findConnection = (slug) => connections.find(c => c.provider === slug) || null

  // ─── Partition: primary (1 card destacada) vs secondary (resto) ───
  // Casos por identity (con el catálogo actual):
  //   - tienda:      primary=Tienda nativa,  secondary=[]
  //   - marketing:   primary=Agenda nativa,  secondary=[]
  //   - profesional: primary=Agenda nativa,  secondary=[]
  // Como no hay más providers, el toggle "Ver más" no se renderiza.
  const isReal = (p) => p.kind === 'native' || p.status === 'available'
  const primaryIdx = visibleProviders.findIndex(isReal)
  const primary    = primaryIdx >= 0 ? visibleProviders[primaryIdx] : null
  const secondary  = visibleProviders.filter((_, i) => i !== primaryIdx)
  const [showAll, setShowAll] = useState(primary === null)
  const renderList = primary
    ? (showAll ? [primary, ...secondary] : [primary])
    : visibleProviders

  // 20/05/2026 — Si no hay ningún provider para esta identity (ej: casino, que
  // ya no tiene integración en este bloque), no renderizamos el card para no
  // mostrar una sección vacía. El casino configura su API en el bloque
  // "API del negocio" de Config.jsx / RetailPanel. Va DESPUÉS de todos los
  // hooks (el último es useState(showAll)) para respetar las reglas de hooks.
  if (visibleProviders.length === 0) return null

  return (
    <Card padding={18} style={{ marginBottom: 14 }}>
      <SectionHeader title="🔌 Conectar mi negocio vía API" style={{ marginBottom: 6 }}/>
      <p style={{
        fontSize: FONT_SIZE.sm, color: C.muted, margin: '0 0 14px', lineHeight: 1.5,
      }}>
        Conectá tu sistema externo (tienda o agenda) para que el bot pueda ejecutar
        acciones automatizadas desde el chat. Cada integración habilita su propio set de acciones.
      </p>

      {loading && <div style={{ color: C.muted, fontSize: FONT_SIZE.sm }}>Cargando integraciones…</div>}
      {error && <Banner kind="error" style={{ marginBottom: 12 }}>{error}</Banner>}

      {!loading && visibleProviders.length === 0 && (
        <div style={{ color: C.muted, fontSize: FONT_SIZE.sm, fontStyle: 'italic' }}>
          No hay integraciones disponibles para esta identidad todavía.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {renderList.map(p => {
          const conn = findConnection(p.slug)
          const effectiveStatus = p.kind === 'native'
            ? 'native_active'
            : (conn?.status || 'disconnected')
          const badge = badgeStyle(effectiveStatus)
          const isOpen = openProvider === p.slug

          return (
            <div key={p.slug} style={{
              border: `1px solid ${C.border}`,
              borderRadius: RADIUS.md,
              background: C.bg,
              overflow: 'hidden',
            }}>
              {/* Header del provider */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px',
                cursor: p.status === 'available' ? 'pointer' : 'default',
              }}
                   onClick={() => {
                     if (p.kind === 'native') return
                     if (p.status === 'available') setOpenProvider(isOpen ? null : p.slug)
                   }}>
                <span style={{ fontSize: 20 }}>{p.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.semibold, color: C.text,
                  }}>{p.label}</div>
                  <div style={{
                    fontSize: FONT_SIZE.xs, color: C.muted, marginTop: 2, lineHeight: 1.4,
                  }}>{p.description}</div>
                </div>
                <span style={{
                  padding: '4px 10px', borderRadius: 999,
                  background: badge.bg, color: badge.fg,
                  fontSize: 10, fontWeight: FONT_WEIGHT.bold,
                  textTransform: 'uppercase', letterSpacing: '.05em',
                  fontFamily: FONT.mono, whiteSpace: 'nowrap',
                }}>{badge.label}</span>
              </div>

              {/* Acciones que habilita (chip row) */}
              {p.actions.length > 0 && (
                <div style={{
                  padding: '0 14px 12px',
                  display: 'flex', gap: 6, flexWrap: 'wrap',
                }}>
                  {p.actions.map(action => (
                    <span key={action} style={{
                      padding: '3px 9px',
                      background: 'rgba(120,120,120,0.08)',
                      border: `1px solid ${C.border}`,
                      borderRadius: 999,
                      fontSize: 10, color: C.muted,
                      fontFamily: FONT.mono,
                    }}>{action}</span>
                  ))}
                </div>
              )}

              {/* Cuerpo expandido — form para providers con token directo */}
              {p.status === 'available' && isOpen && (
                <ProviderForm
                  provider={p}
                  connection={conn}
                  onSaved={() => { setOpenProvider(null); reload() }}
                  onDisconnect={() => { setOpenProvider(null); reload() }}
                />
              )}

              {/* Footer "Ir a {módulo}" para nativos — itera nativeButtons[] */}
              {p.kind === 'native' && Array.isArray(p.nativeButtons) && p.nativeButtons.length > 0 && (
                <div style={{
                  padding: '10px 14px',
                  background: 'rgba(34,197,94,0.04)',
                  borderTop: `1px solid ${C.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  gap: 10, flexWrap: 'wrap',
                }}>
                  <div style={{ fontSize: FONT_SIZE.xs, color: C.muted, lineHeight: 1.5, flex: '1 1 220px', minWidth: 0 }}>
                    💚 Este módulo es parte de Innovate IA — ya está activo, no requiere conexión externa.
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {p.nativeButtons.map((btn, idx) => (
                      <button
                        key={`${p.slug}-btn-${idx}`}
                        onClick={() => {
                          const isRetailHost = window.location.pathname.startsWith('/mi-cuenta')
                          const target = isRetailHost ? btn.routeRetail : btn.routeSub
                          if (target) window.location.href = target
                        }}
                        style={{
                          padding: '7px 14px',
                          background: '#22c55e',
                          color: '#0a1a0e',
                          border: 'none',
                          borderRadius: RADIUS.sm,
                          fontSize: FONT_SIZE.sm,
                          fontWeight: FONT_WEIGHT.bold,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {btn.label} →
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {/* Toggle Ver más / Ver menos — solo aparece si hay secondary */}
        {primary && secondary.length > 0 && (
          <button
            type="button"
            onClick={() => setShowAll(v => !v)}
            style={{
              marginTop: 4,
              padding: '10px 14px',
              background: 'transparent',
              border: `1px dashed ${C.border}`,
              borderRadius: RADIUS.md,
              color: C.muted,
              fontSize: FONT_SIZE.sm,
              fontWeight: FONT_WEIGHT.semibold,
              cursor: 'pointer',
              textAlign: 'center',
              fontFamily: FONT.body,
              transition: 'background 0.15s ease, color 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(120,120,120,0.04)'; e.currentTarget.style.color = C.text }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.muted }}
          >
            {showAll
              ? '▴  Ver menos'
              : `▾  Ver más integraciones (${secondary.length})`}
          </button>
        )}
      </div>
    </Card>
  )
}

// ─── Sub-componente: form para un provider concreto ──────────────────
function ProviderForm({ provider, connection, onSaved, onDisconnect }) {
  const [values, setValues] = useState(() => {
    const initial = {}
    for (const f of provider.fields) {
      if (f.kind === 'config') {
        initial[f.key] = connection?.config?.[f.key] || ''
      } else {
        initial[f.key] = ''
      }
    }
    return initial
  })
  const [saving, setSaving]   = useState(false)
  const [msg, setMsg]         = useState(null)

  const set = (key) => (e) => setValues(v => ({ ...v, [key]: e.target.value }))

  const save = async () => {
    setSaving(true); setMsg(null)
    try {
      const config = {}
      let accessToken = null
      for (const f of provider.fields) {
        const raw = String(values[f.key] || '').trim()
        if (!raw) continue
        if (f.kind === 'config')      config[f.key]   = raw
        else if (f.kind === 'secret') accessToken     = raw
      }

      const { error } = await supabase.rpc('set_my_integration_creds', {
        p_provider:     provider.slug,
        p_access_token: accessToken,
        p_config:       config,
      })
      if (error) throw error
      setMsg({ kind: 'success', text: '✓ Guardado' })
      setValues(v => {
        const next = { ...v }
        for (const f of provider.fields) {
          if (f.kind === 'secret') next[f.key] = ''
        }
        return next
      })
      setTimeout(() => onSaved && onSaved(), 800)
    } catch (e) {
      setMsg({ kind: 'error', text: e.message || 'Error al guardar' })
    } finally {
      setSaving(false)
    }
  }

  const disconnect = async () => {
    if (!confirm(`¿Desconectar ${provider.label}? Las acciones automatizadas dejarán de funcionar.`)) return
    setSaving(true); setMsg(null)
    try {
      const { error } = await supabase.rpc('delete_my_integration', { p_provider: provider.slug })
      if (error) throw error
      setMsg({ kind: 'success', text: '✓ Desconectado' })
      setTimeout(() => onDisconnect && onDisconnect(), 800)
    } catch (e) {
      setMsg({ kind: 'error', text: e.message || 'Error al desconectar' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      padding: 14, borderTop: `1px solid ${C.border}`,
      background: C.card,
    }}>
      {provider.fields.map(f => (
        <div key={f.key} style={{ marginBottom: 12 }}>
          <label style={{
            fontSize: FONT_SIZE.xs, color: C.muted, textTransform: 'uppercase',
            letterSpacing: '.06em', display: 'block', marginBottom: 5,
            fontFamily: FONT.mono, fontWeight: FONT_WEIGHT.semibold,
          }}>
            {f.label}
            {f.kind === 'secret' && connection?.has_token && (
              <span style={{ color: '#22c55e', marginLeft: 6, textTransform: 'none', fontFamily: FONT.body }}>
                — ✓ ya configurado (dejá vacío para no cambiarlo)
              </span>
            )}
          </label>
          <input
            type={f.kind === 'secret' ? 'password' : 'text'}
            value={values[f.key]}
            onChange={set(f.key)}
            placeholder={f.placeholder}
            style={{
              width: '100%', boxSizing: 'border-box',
              background: C.bg, border: `1px solid ${C.border}`, borderRadius: RADIUS.md,
              padding: '10px 12px', color: C.text, fontSize: FONT_SIZE.base,
              outline: 'none', fontFamily: f.kind === 'secret' ? FONT.mono : 'inherit',
            }}
          />
          {f.hint && (
            <p style={{ fontSize: FONT_SIZE.xs, color: C.muted, margin: '4px 0 0', lineHeight: 1.45 }}>
              {f.hint}
            </p>
          )}
        </div>
      ))}

      {msg && (
        <div style={{
          padding: '8px 12px', borderRadius: RADIUS.sm, marginBottom: 10,
          background: msg.kind === 'success' ? 'rgba(34,197,94,.10)' : 'rgba(239,68,68,.10)',
          color:      msg.kind === 'success' ? '#22c55e'             : '#ef4444',
          fontSize:   FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold,
        }}>{msg.text}</div>
      )}

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        {connection?.has_token && (
          <Button variant="ghost" size="sm" onClick={disconnect} disabled={saving} style={{ color: '#ef4444' }}>
            Desconectar
          </Button>
        )}
        <Button variant="primary" size="sm" onClick={save} disabled={saving} loading={saving}>
          {saving ? 'Guardando…' : connection?.has_token ? 'Actualizar' : 'Conectar'}
        </Button>
      </div>
    </div>
  )
}
