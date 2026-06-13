import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { META_CONVERSION_URL, CASINO_ACTION_URL, SEND_WA_MANUAL_URL, SEND_WA_MEDIA_URL } from '../lib/constants'
import { usePushNotifications } from '../hooks/usePushNotifications'
import PendingOrdersPanel, { PendingOrdersBadge } from '../components/PendingOrdersPanel'

import { COLORS, RADIUS, FONT_SIZE } from '../theme/tokens'
import { Button, Chip, Banner } from '../components/ui'
import { callEdgeFunction } from '../lib/callEdgeFunction'
import { getIdentityConfig } from '../lib/identityConfig'
import { getActiveQuickReplies } from '../lib/quickReplies'

// 11/05/2026 sprint identity-actions (commit 4/4): acciones por identity.
// ActionModal ahora es un router: profesional/tienda/marketing renderean
// componentes especializados; casino mantiene el flow histórico.
import ProfesionalActionTabs from '../components/chat-actions/ProfesionalActionTabs'
import TiendaActionTabs from '../components/chat-actions/TiendaActionTabs'
import MarketingActionTabs from '../components/chat-actions/MarketingActionTabs'

// sessionStorage keys
const SS_VIEW_KEY = 'chats:mobileView'
const SS_CONV_KEY = 'chats:activeConvId'

// 11/05/2026: bucket migrado de wa-attachments → wa-media
// El bucket viejo wa-attachments tenía RLS policies rotas que rechazaban
// todos los uploads (referenciaban st.name en lugar de storage.objects.name).
// Bucket nuevo wa-media con policies correctas. EF send-wa-media v2 ya
// apunta al bucket nuevo. Path convention idéntica.
const MEDIA_BUCKET = 'wa-media'

const exportMenuItemStyle = {
  display: 'flex', alignItems: 'center', gap: 10, width: '100%',
  padding: '9px 14px', background: 'transparent', border: 'none',
  color: '#E9E7E0', fontSize: 12, fontWeight: 500, cursor: 'pointer',
  textAlign: 'left', transition: 'background 0.12s', fontFamily: 'inherit',
}

const C = {
  ...COLORS,
  textDim: COLORS.muted,
  gold: COLORS.brand,
  goldDim: COLORS.brandDim,
  green: COLORS.success,
  red: COLORS.danger,
  blue: COLORS.info,
}

const fmt = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const diff = now - d
  if (diff < 60000) return 'ahora'
  if (diff < 3600000) return `${Math.floor(diff/60000)}m`
  if (diff < 86400000) return `${Math.floor(diff/3600000)}h`
  return d.toLocaleDateString('es-AR', { day:'2-digit', month:'2-digit' })
}

const timeStr = (iso) => iso ? new Date(iso).toLocaleTimeString('es-AR', { hour:'2-digit', minute:'2-digit' }) : ''

function Avatar({ name, size = 36 }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()
  const hue = (name || '').split('').reduce((a,c) => a + c.charCodeAt(0), 0) % 360
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `hsl(${hue},40%,25%)`, border: `1.5px solid hsl(${hue},40%,35%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: 700, color: `hsl(${hue},60%,75%)`,
      fontFamily: 'monospace', letterSpacing: '-0.5px'
    }}>{initials}</div>
  )
}

function Badge({ children, color = C.gold }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
      padding: '2px 7px', borderRadius: 99,
      background: `${color}18`, border: `1px solid ${color}40`, color
    }}>{children}</span>
  )
}

function Btn({ children, onClick, variant = 'ghost', size = 'sm', disabled, style: sx }) {
  const base = {
    border: 'none', cursor: disabled ? 'not-allowed' : 'pointer', borderRadius: 8,
    fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6,
    transition: 'all .15s', opacity: disabled ? 0.45 : 1,
    fontSize: size === 'sm' ? 12 : 13, padding: size === 'sm' ? '6px 12px' : '9px 16px',
  }
  const variants = {
    primary: { background: C.gold, color: C.bg },
    danger:  { background: `${C.red}20`, border: `1px solid ${C.red}40`, color: C.red },
    success: { background: `${C.green}20`, border: `1px solid ${C.green}40`, color: C.green },
    blue:    { background: `${C.blue}20`, border: `1px solid ${C.blue}40`, color: C.blue },
    ghost:   { background: `${C.border}80`, border: `1px solid ${C.border}`, color: C.textDim },
  }
  return (
    <button onClick={disabled ? undefined : onClick} style={{ ...base, ...variants[variant], ...sx }}>
      {children}
    </button>
  )
}

// ════════════════════════════════════════════════════════════════════
// ActionModal — Router por identity
//
// 11/05/2026 sprint identity-actions (commit 4/4):
//   identity = profesional → ProfesionalActionTabs
//   identity = tienda      → TiendaActionTabs
//   identity = marketing   → MarketingActionTabs
//   identity = casino      → CasinoActionTabs (lo que vivía inline)
//
// Caso edge: casino sin token configurado → placeholder explicativo.
// ════════════════════════════════════════════════════════════════════
function ActionModal({ conv, casinoCfg, isSubTenant, onClose, onDone }) {
  const identity     = casinoCfg?.identity || 'casino'
  const hasCasinoApi = !!casinoCfg?.has_casino_api
  const identityCfg  = getIdentityConfig(identity)

  // Header común para todas las identities
  const Header = () => (
    <div style={{
      padding: '20px 24px 16px',
      borderBottom: `1px solid ${C.border}`,
      display: 'flex', gap: 12, alignItems: 'center',
    }}>
      <Avatar name={conv.contact_name} size={44} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontWeight: 700, color: C.text, fontSize: 15 }}>{conv.contact_name}</p>
        <p style={{ margin: 0, fontSize: 12, color: C.muted }}>{conv.phone}</p>
      </div>
      <button onClick={onClose}
        style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 20, lineHeight: 1 }}>
        ×
      </button>
    </div>
  )

  // Shell del modal
  const Shell = ({ children }) => (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', zIndex: 999,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }} onClick={onClose}>
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16,
        width: '100%', maxWidth: 480, maxHeight: '85vh', overflow: 'auto',
      }} onClick={e => e.stopPropagation()}>
        <Header />
        {children}
      </div>
    </div>
  )

  // Router por identity
  if (identity === 'profesional') {
    return <Shell><ProfesionalActionTabs conv={conv} onDone={onDone} onClose={onClose} /></Shell>
  }
  if (identity === 'tienda') {
    return <Shell><TiendaActionTabs conv={conv} isSubTenant={isSubTenant} onDone={onDone} onClose={onClose} /></Shell>
  }
  if (identity === 'marketing') {
    return <Shell><MarketingActionTabs conv={conv} onDone={onDone} onClose={onClose} /></Shell>
  }

  // identity === 'casino' (o fallback)
  if (!hasCasinoApi) {
    return (
      <Shell>
        <div style={{
          padding: '40px 24px',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 14, textAlign: 'center',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: `${identityCfg.accent || C.gold}15`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: identityCfg.accent || C.gold,
          }}>
            {identityCfg.Icon ? <identityCfg.Icon size={28} strokeWidth={1.8} /> : null}
          </div>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.text }}>
            Falta configurar la API del casino
          </p>
          <p style={{ margin: 0, fontSize: 13, color: C.muted, maxWidth: 380, lineHeight: 1.55 }}>
            Las acciones automatizadas (crear cuenta, acreditar saldo, cambiar
            contraseña) requieren tener configurada la API del casino. Cargá
            las credenciales desde <strong style={{ color: C.gold }}>Configuración → API del negocio</strong> para habilitarlas.
          </p>
          <Btn variant="primary" size="md" onClick={onClose}>Volver al chat</Btn>
        </div>
      </Shell>
    )
  }

  return (
    <Shell>
      <CasinoActionTabs conv={conv} casinoCfg={casinoCfg} onDone={onDone} onClose={onClose} />
    </Shell>
  )
}

// ════════════════════════════════════════════════════════════════════
// CasinoActionTabs — lo que vivía inline en el ActionModal histórico.
// Sin cambios funcionales; solo extraído para que el router quede limpio.
// ════════════════════════════════════════════════════════════════════
function CasinoActionTabs({ conv, casinoCfg, onDone, onClose }) {
  const [tab, setTab]         = useState('info')
  const [amount, setAmount]   = useState('')
  const [newPass, setNewPass] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState(null)

  const callCasino = async (area, extraParams = {}) => {
    setLoading(true); setResult(null)
    try {
      const action = area === 'createuser' ? 'createuser'
        : extraParams.operation === 'in' ? 'balance_in' : 'balance_out'
      const { ok, data } = await callEdgeFunction(CASINO_ACTION_URL, {
        action,
        user_id: conv.casino_user_id,
        conversation_id: conv.id,
        amount: extraParams.amount ? Math.abs(Number(extraParams.amount)) : undefined,
        currency: extraParams.balance_currency || 'ARS',
      })
      const casinoBody = data?.data || {}
      const success = ok && !!casinoBody.successMessage
      setResult({ ok: success, data: success ? casinoBody : data })
      if (success) onDone(area, casinoBody)
    } catch (e) {
      setResult({ ok: false, data: { error: e.message } })
    }
    setLoading(false)
  }

  const handleResetPassword = async () => {
    const password = newPass.trim() || String(Math.floor(1000 + Math.random() * 9000))
    setLoading(true); setResult(null)
    try {
      let casinoOk = false
      try {
        const { ok, data } = await callEdgeFunction(CASINO_ACTION_URL, {
          action: 'changepassword',
          user_id: conv.casino_user_id,
          conversation_id: conv.id,
          new_password: password,
        })
        casinoOk = ok && !!data?.data?.successMessage
      } catch(_) {}

      const { error } = await supabase
        .from('conversations')
        .update({ casino_password: password })
        .eq('id', conv.id)

      if (error) throw new Error('Error guardando en base de datos')

      setResult({
        ok: true, data: { password, casinoOk },
        msg: `✅ Contraseña actualizada: ${password}${casinoOk ? '' : '\n⚠️ Actualizá también en el panel del negocio'}`
      })
      onDone('resetpassword', { password, casinoOk })
    } catch(e) {
      setResult({ ok: false, data: { error: e.message } })
    }
    setLoading(false)
  }

  const tabs = [
    { id:'info',     label:'👤 Datos' },
    { id:'credit',   label:'💰 Créditos' },
    { id:'password', label:'🔑 Contraseña' },
    { id:'create',   label:'✨ Crear cuenta' },
  ]

  return (
    <>
      <div style={{ display:'flex', borderBottom:`1px solid ${C.border}` }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex:1, padding:'10px 0', fontSize:12, fontWeight:600, border:'none', cursor:'pointer',
            background:'none', color: tab===t.id ? C.gold : C.muted,
            borderBottom: `2px solid ${tab===t.id ? C.gold : 'transparent'}`,
            transition:'all .15s'
          }}>{t.label}</button>
        ))}
      </div>
      <div style={{ padding:24 }}>
        {tab === 'info' && (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {[
              ['Casino User ID', conv.casino_user_id],
              ['Login', conv.casino_login],
              ['Contraseña', conv.casino_password],
              ['Teléfono', conv.phone],
              ['Lead ID', conv.lead_id],
            ].map(([label, value]) => (
              <div key={label} style={{
                display:'flex', justifyContent:'space-between', alignItems:'center',
                padding:'10px 14px', background:`${C.border}60`, borderRadius:10
              }}>
                <span style={{ fontSize:11, color:C.muted, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>{label}</span>
                <span style={{ fontSize:13, color:C.text, fontFamily:'monospace' }}>{value || '—'}</span>
              </div>
            ))}
            <Btn variant="primary" size="md" onClick={() => {
              const msg = `👤 Usuario: ${conv.casino_login}\n🔑 Contraseña: ${conv.casino_password}\n\n🌐 Ingresá al casino: ${casinoCfg?.casino_info?.url || '#'}`
              onDone('share', { msg }); onClose()
            }}>
              📤 Compartir datos al cliente
            </Btn>
          </div>
        )}
        {tab === 'credit' && (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <p style={{ margin:0, fontSize:13, color:C.textDim }}>Acreditar o descontar saldo del cliente.</p>
            <input
              type="number" value={amount} onChange={e => setAmount(e.target.value)}
              placeholder="Monto en ARS (ej: 5000)"
              style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:10, padding:'11px 14px', color:C.text, fontSize:14, outline:'none', width:'100%', boxSizing:'border-box' }}
            />
            <div style={{ display:'flex', gap:10 }}>
              <Btn variant="success" size="md" disabled={!amount || loading} style={{ flex:1 }} onClick={() =>
                callCasino('balance', { operation:'in', send:'true', amount: `-${amount}`, balance_currency:'ARS' })
              }>
                {loading ? '…' : '➕ Acreditar'}
              </Btn>
              <Btn variant="danger" size="md" disabled={!amount || loading} style={{ flex:1 }} onClick={() =>
                callCasino('balance', { operation:'out', send:'true', amount, balance_currency:'ARS' })
              }>
                {loading ? '…' : '➖ Descontar'}
              </Btn>
            </div>
            {result && (
              <div style={{
                padding:'12px 14px', borderRadius:10,
                background: result.ok ? `${C.green}15` : `${C.red}15`,
                border: `1px solid ${result.ok ? C.green : C.red}40`,
                fontSize:13, color: result.ok ? C.green : C.red
              }}>
                {result.ok
                  ? `✅ ${result.data.successMessage || 'Operación exitosa'}`
                  : `❌ ${result.data.errorMessage?.[0] || result.data.error || 'Error'}`}
              </div>
            )}
          </div>
        )}
        {tab === 'password' && (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {!conv.casino_user_id ? (
              <div style={{ padding:14, background:`${C.border}60`, borderRadius:10, textAlign:'center' }}>
                <p style={{ margin:0, fontSize:13, color:C.muted }}>Este contacto no tiene cuenta creada.</p>
              </div>
            ) : (
              <>
                <div style={{ padding:'12px 14px', background:`${C.border}40`, borderRadius:10 }}>
                  <p style={{ margin:0, fontSize:11, color:C.muted, marginBottom:4 }}>Contraseña actual</p>
                  <p style={{ margin:0, fontSize:15, fontFamily:'monospace', color:C.gold, fontWeight:700 }}>
                    {conv.casino_password || '—'}
                  </p>
                </div>
                <div>
                  <p style={{ margin:'0 0 8px', fontSize:12, color:C.muted }}>
                    Nueva contraseña (dejá vacío para generar una automáticamente)
                  </p>
                  <input
                    type="text" value={newPass}
                    onChange={e => setNewPass(e.target.value)}
                    placeholder="Ej: 4821 (o dejá vacío)"
                    maxLength={20}
                    style={{
                      background:C.bg, border:`1px solid ${C.border}`, borderRadius:10,
                      padding:'11px 14px', color:C.text, fontSize:14, outline:'none',
                      width:'100%', boxSizing:'border-box', fontFamily:'monospace'
                    }}
                  />
                </div>
                <Btn variant="primary" size="md" disabled={loading} onClick={handleResetPassword}>
                  {loading ? 'Cambiando…' : '🔑 Resetear contraseña'}
                </Btn>
                {result && (
                  <div style={{
                    padding:'12px 14px', borderRadius:10, whiteSpace:'pre-line',
                    background: result.ok ? `${C.green}15` : `${C.red}15`,
                    border: `1px solid ${result.ok ? C.green : C.red}40`,
                    fontSize:13, color: result.ok ? C.green : C.red, lineHeight:1.6
                  }}>
                    {result.ok ? result.msg : `❌ ${result.data?.error || 'Error'}`}
                  </div>
                )}
                {result?.ok && (
                  <Btn variant="ghost" size="md" onClick={() => {
                    onDone('share', {
                      msg: `🔑 Tu contraseña fue actualizada:\n\n👤 Usuario: ${conv.casino_login}\n🔑 Nueva contraseña: ${result.data.password}\n\n🌐 ${casinoCfg?.casino_info?.url || '#'}`
                    })
                    onClose()
                  }}>
                    📤 Enviar nueva contraseña al cliente
                  </Btn>
                )}
              </>
            )}
          </div>
        )}
        {tab === 'create' && (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {conv.casino_user_id ? (
              <div style={{ padding:'14px', background:`${C.border}60`, borderRadius:10, textAlign:'center' }}>
                <p style={{ margin:0, fontSize:13, color:C.textDim }}>Este contacto ya tiene cuenta</p>
                <p style={{ margin:'4px 0 0', fontFamily:'monospace', color:C.gold }}>{conv.casino_login}</p>
              </div>
            ) : (
              <>
                <p style={{ margin:0, fontSize:13, color:C.textDim }}>Crear una cuenta nueva para este contacto.</p>
                <Btn variant="primary" size="md" disabled={loading} onClick={() =>
                  callCasino('createuser', { group:'5', sended:'true' })
                }>
                  {loading ? 'Creando…' : '✨ Crear usuario ahora'}
                </Btn>
              </>
            )}
            {result && (
              <div style={{
                padding:'12px 14px', borderRadius:10,
                background: result.ok ? `${C.green}15` : `${C.red}15`,
                border: `1px solid ${result.ok ? C.green : C.red}40`,
                fontSize:13, color: result.ok ? C.green : C.red
              }}>
                {result.ok
                  ? `✅ Usuario creado: ${result.data.login} / ${result.data.password}`
                  : `❌ ${result.data.error || 'Error al crear usuario'}`}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}

function QuickRepliesModal({ entity, conv, onPick, onClose }) {
  // 11/05/2026 sprint quick-replies-per-identity:
  // Antes este modal mostraba qr_cvu/qr_credentials/qr_access_link/qr_custom
  // siempre, con labels casino-flavored. Para profesional/marketing/tienda eso
  // mostraba el field "Credenciales del usuario" con variables {usuario}/{clave}
  // que no tenían sentido para esos rubros.
  //
  // Ahora el helper getActiveQuickReplies() filtra por entity.identity y
  // solo devuelve los fields del schema relevante + qr_custom[].
  // Definido en src/lib/quickReplies.js — fuente única de verdad.
  const templates = getActiveQuickReplies(entity)

  const [vars, setVars] = useState({
    usuario: conv?.casino_login || '',
    clave:   conv?.casino_password || '',
    link:    entity?.qr_access_link || entity?.casino_url || '',
  })

  const resolve = (text) => text
    .replace(/\{usuario\}/g, vars.usuario || '_____')
    .replace(/\{clave\}/g,   vars.clave   || '_____')
    .replace(/\{link\}/g,    vars.link    || '_____')

  const handlePick = (t) => {
    onPick(t.hasVars ? resolve(t.text) : t.text)
  }

  const fi = {
    width: '100%', background: C.bg, border: `1px solid ${C.border}`,
    borderRadius: 8, padding: '8px 12px', color: C.text, fontSize: 13,
    outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  }

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }} style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,.75)', zIndex:999,
      display:'flex', alignItems:'center', justifyContent:'center', padding:16,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: C.surface, border:`1px solid ${C.border}`, borderRadius:16,
        width:'100%', maxWidth:520, maxHeight:'85vh',
        display:'flex', flexDirection:'column',
      }}>
        <div style={{
          padding:'14px 20px', borderBottom:`1px solid ${C.border}`,
          display:'flex', alignItems:'center', justifyContent:'space-between',
          gap:10, flexShrink:0,
        }}>
          <h3 style={{ margin:0, fontSize:14, fontWeight:700, color:C.text }}>
            💬 Enviar respuesta rápida
          </h3>
          <button onClick={onClose} style={{ background:'none', border:'none', color:C.muted, cursor:'pointer', fontSize:20, lineHeight:1 }}>×</button>
        </div>
        <div style={{ padding:18, overflowY:'auto', flex:1 }}>
          {templates.length === 0 ? (
            <div style={{
              padding:'14px 16px', background:'rgba(212,168,67,0.06)',
              border:`1px solid rgba(212,168,67,0.25)`, borderRadius:10,
              color:C.text, fontSize:13, lineHeight:1.55,
            }}>
              Todavía no configuraste respuestas rápidas. Andá a{' '}
              <strong style={{ color: C.gold }}>Agente IA → Respuestas rápidas</strong>{' '}
              para crearlas. Las plantillas disponibles se adaptan al rubro de tu negocio.
            </div>
          ) : (
            <>
              {templates.some(t => t.hasVars) && (
                <div style={{
                  display:'grid', gridTemplateColumns:'1fr 1fr', gap:8,
                  marginBottom:14, padding:10,
                  background:`${C.border}40`, border:`1px solid ${C.border}`, borderRadius:10,
                }}>
                  <div>
                    <label style={{
                      fontSize:10, color:C.muted, fontWeight:700,
                      textTransform:'uppercase', letterSpacing:'.06em',
                      display:'block', marginBottom:4, fontFamily:'monospace',
                    }}>Usuario</label>
                    <input
                      value={vars.usuario}
                      onChange={e => setVars(v => ({ ...v, usuario: e.target.value }))}
                      placeholder="Ej: juan123" style={fi}
                    />
                  </div>
                  <div>
                    <label style={{
                      fontSize:10, color:C.muted, fontWeight:700,
                      textTransform:'uppercase', letterSpacing:'.06em',
                      display:'block', marginBottom:4, fontFamily:'monospace',
                    }}>Contraseña</label>
                    <input
                      value={vars.clave}
                      onChange={e => setVars(v => ({ ...v, clave: e.target.value }))}
                      placeholder="Ej: 4821" style={fi}
                    />
                  </div>
                </div>
              )}
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {templates.map(t => {
                  const preview = t.hasVars ? resolve(t.text) : t.text
                  return (
                    <div key={t.key} style={{
                      background:`${C.border}40`, border:`1px solid ${C.border}`,
                      borderRadius:10, padding:12,
                    }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                        <span style={{ fontSize:17 }}>{t.icon}</span>
                        <span style={{ flex:1, fontSize:13, fontWeight:600, color:C.text }}>{t.label}</span>
                        <Btn variant="primary" size="sm" onClick={() => handlePick(t)}>
                          Insertar →
                        </Btn>
                      </div>
                      <pre style={{
                        background:C.bg, border:`1px dashed ${C.border}`,
                        borderRadius:8, padding:10, margin:0,
                        fontSize:12, color:C.text,
                        whiteSpace:'pre-wrap', wordBreak:'break-word',
                        fontFamily:'monospace', maxHeight:120, overflowY:'auto', lineHeight:1.5,
                      }}>{preview}</pre>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768)
  React.useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return isMobile
}

export default function Chats() {
  const { tenant, retail, subTenant, isSubTenant, isRetail, config: cfg } = useAuth()
  const effectiveTenant = tenant || retail
  const entityForReplies = subTenant || retail || null
  const params = useParams()
  const navigate = useNavigate()

  const chatBasePath = (() => {
    const p = window.location.pathname
    if (p.startsWith('/mi-cuenta')) return '/mi-cuenta/chats'
    if (p.startsWith('/cliente'))   return '/cliente/chats'
    return '/chats'
  })()

  const entityId       = isSubTenant ? subTenant?.id : effectiveTenant?.id
  const entityKind     = isSubTenant ? 'sub_tenant' : 'tenant'
  const parentTenantId = isSubTenant ? subTenant?.tenant_id : effectiveTenant?.id
  // Identity efectiva — usada por ActionModal para mostrar acciones según el tipo de negocio
  const effectiveIdentity = isSubTenant
    ? (subTenant?.identity || 'casino')
    : (effectiveTenant?.identity || 'casino')
  const hasCasinoApi = isSubTenant
    ? !!subTenant?.has_casino_token
    : !!effectiveTenant?.has_casino_token
  const cfgEffective = isSubTenant
    ? {
        tenant_id: parentTenantId,
        sub_tenant_id: subTenant?.id,
        wa_phone_id: subTenant?.wa_phone_id,
        identity: effectiveIdentity,
        has_casino_api: hasCasinoApi,
        casino_info: { url: subTenant?.casino_url || '#' },
      }
    : (cfg ? { ...cfg, tenant_id: effectiveTenant?.id, identity: effectiveIdentity, has_casino_api: hasCasinoApi } : { tenant_id: effectiveTenant?.id, identity: effectiveIdentity, has_casino_api: hasCasinoApi, casino_info: { url: effectiveTenant?.casino_url || '#' } })
  const cfgWithTenant = cfgEffective
  const isMobile = useIsMobile()

  // ════════════════════════════════════════════════════════════════
  // BUG FIX 13/05/2026 — viewport mobile cuando se abre por deep-link
  // de notificación push. visualViewport reporta el viewport REAL
  // considerando barra URL/teclado virtual. En navegadores que no lo
  // soportan, hace fallback a window.innerHeight.
  //
  // El valor se setea en la CSS variable --chat-viewport-h que el
  // contenedor root del Chats usa como height fija. Esto soluciona
  // el bug donde 100dvh del layout padre daba un valor más grande
  // que el viewport real (al abrir desde notificación con barra URL
  // visible), dejando el textarea + flecha back debajo del fold.
  // ════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!isMobile) return
    const setVH = () => {
      const vv = window.visualViewport
      const h = vv ? Math.round(vv.height) : window.innerHeight
      document.documentElement.style.setProperty('--chat-viewport-h', `${h}px`)
    }
    setVH()
    const vv = window.visualViewport
    if (vv) {
      vv.addEventListener('resize', setVH)
      vv.addEventListener('scroll', setVH)
    }
    window.addEventListener('resize', setVH)
    window.addEventListener('orientationchange', setVH)
    return () => {
      if (vv) {
        vv.removeEventListener('resize', setVH)
        vv.removeEventListener('scroll', setVH)
      }
      window.removeEventListener('resize', setVH)
      window.removeEventListener('orientationchange', setVH)
      document.documentElement.style.removeProperty('--chat-viewport-h')
    }
  }, [isMobile])

  const [mobileView, setMobileViewState] = useState(() => {
    try {
      const saved = sessionStorage.getItem(SS_VIEW_KEY)
      return saved === 'chat' ? 'chat' : 'list'
    } catch { return 'list' }
  })
  const setMobileView = useCallback((v) => {
    setMobileViewState(v)
    try {
      if (v === 'chat') sessionStorage.setItem(SS_VIEW_KEY, 'chat')
      else sessionStorage.removeItem(SS_VIEW_KEY)
    } catch {}
  }, [])

  const [conversations, setConversations] = useState([])
  const [activeConv, setActiveConvState]  = useState(null)
  const setActiveConv = useCallback((convOrUpdater) => {
    setActiveConvState(prev => {
      const next = typeof convOrUpdater === 'function' ? convOrUpdater(prev) : convOrUpdater
      try {
        if (next?.id) sessionStorage.setItem(SS_CONV_KEY, next.id)
        else sessionStorage.removeItem(SS_CONV_KEY)
      } catch {}
      return next
    })
  }, [])

  // ════════════════════════════════════════════════════════════════
  // BUG FIX 13/05/2026 — flecha back atrapa al usuario cuando se
  // entra al chat por deep-link de notificación push.
  //
  // El problema: el useEffect de params.phone (más abajo) re-hidrata
  // automáticamente activeConv cuando ve la phone en la URL. Click
  // en "←" → setActiveConv(null) → ese effect detecta phone+null y
  // vuelve a abrir el mismo chat. Loop infinito visual.
  //
  // closeChat encapsula el flow correcto: limpiar activeConv, volver
  // a la lista en mobile, y navegar fuera de la URL deep-link para
  // que el effect de params.phone no nos vuelva a hidratar.
  // ════════════════════════════════════════════════════════════════
  const closeChat = useCallback(() => {
    setActiveConv(null)
    if (isMobile) setMobileView('list')
    if (params.phone) {
      navigate(chatBasePath, { replace: true })
    }
  }, [isMobile, setActiveConv, setMobileView, params.phone, navigate, chatBasePath])

  const [messages, setMessages]           = useState([])
  const [input, setInput]                 = useState('')
  const [sending, setSending]             = useState(false)
  const [showAction, setShowAction]       = useState(false)
  const [showQuickReplies, setShowQuickReplies] = useState(false)
  const [showSaleModal, setShowSaleModal] = useState(false)
  const [saleAmount, setSaleAmount]       = useState('')
  const [saleSaving, setSaleSaving]       = useState(false)
  const [saleFlash, setSaleFlash]         = useState('')
  const [filter, setFilter]               = useState('all')
  const [search, setSearch]               = useState('')
  const [exportMenuOpen, setExportMenuOpen] = useState(false)
  const [exportLoading, setExportLoading]   = useState(false)
  const exportMenuRef = useRef(null)
  const [subTenants, setSubTenants]       = useState([])
  const [subFilter, setSubFilter]         = useState(isSubTenant ? 'all' : 'none')

  const [attachStatus, setAttachStatus]   = useState(null)
  const [attachStatusMsg, setAttachStatusMsg] = useState('')
  const attachInFlightRef = useRef(false)
  const [pendingFile, setPendingFile]     = useState(null)
  const [pendingCaption, setPendingCaption] = useState('')
  const [pendingError, setPendingError]   = useState(null)

  const messagesEndRef = useRef(null)
  const inputRef       = useRef(null)
  const activeConvRef  = useRef(null)
  const isMobileRef    = useRef(isMobile)
  useEffect(() => { isMobileRef.current = isMobile }, [isMobile])

  const [notifications, setNotifications] = useState([])
  const notifId = useRef(0)
  const [waitingCount, setWaitingCount] = useState(0)
  const [showOrdersPanel, setShowOrdersPanel] = useState(false)
  const { supported: pushSupported, permission: pushPermission, subscribed: pushSubscribed, loading: pushLoading, subscribe: pushSubscribe } = usePushNotifications()

  const loadConversations = useCallback(async () => {
    if (!entityId) return
    let q = supabase.from('conversations').select('*')
    if (isSubTenant) q = q.eq('sub_tenant_id', entityId)
    else             q = q.eq('tenant_id', entityId)
    const { data } = await q
      .order('last_message_at', { ascending: false })
      .limit(100)
    const convs = data || []
    setConversations(convs)
    const wc = convs.filter(c => c.status === 'waiting').length
    setWaitingCount(wc)
    window.__ia_waiting = wc
    window.dispatchEvent(new CustomEvent('ia-waiting', { detail: wc }))
  }, [entityId, isSubTenant])

  useEffect(() => { loadConversations() }, [loadConversations])

  useEffect(() => {
    if (activeConv) return
    if (!conversations.length) return
    let savedId = null
    try { savedId = sessionStorage.getItem(SS_CONV_KEY) } catch {}
    if (!savedId) return
    const conv = conversations.find(c => c.id === savedId)
    if (conv) {
      setActiveConvState(conv)
    } else {
      try { sessionStorage.removeItem(SS_CONV_KEY) } catch {}
    }
  }, [conversations, activeConv])

  useEffect(() => {
    if (!params.phone || !conversations.length) return
    if (activeConv) return
    const targetDigits = String(params.phone).replace(/\D/g, '')
    if (!targetDigits) return
    const conv = conversations.find(c =>
      String(c.phone || '').replace(/\D/g, '') === targetDigits
    )
    if (conv) {
      setActiveConv(conv)
      if (isMobile) setMobileView('chat')
    }
  }, [params.phone, conversations, activeConv, isMobile, setActiveConv, setMobileView])

  useEffect(() => {
    if (!tenant?.id || isSubTenant) return
    let cancelled = false
    ;(async () => {
      try {
        const { data, error } = await supabase.rpc('list_my_sub_tenants')
        if (cancelled) return
        if (error) { setSubTenants([]); return }
        setSubTenants((data || []).filter(s => s.status !== 'cancelled'))
      } catch { setSubTenants([]) }
    })()
    return () => { cancelled = true }
  }, [tenant?.id, isSubTenant])

  const loadMessages = useCallback(async (convId) => {
    if (!convId) return
    const { data, error } = await supabase
      .from('messages').select('*')
      .eq('conversation_id', convId)
      .order('sent_at', { ascending: true })
      .limit(500)
    if (!error) setMessages(data || [])
  }, [])

  useEffect(() => {
    activeConvRef.current = activeConv
    if (activeConv?.id) {
      setMessages([])
      loadMessages(activeConv.id)
    } else {
      setMessages([])
    }
  }, [activeConv?.id])

  useEffect(() => {
    if (!entityId) return
    const filterStr = isSubTenant ? `sub_tenant_id=eq.${entityId}` : `tenant_id=eq.${entityId}`
    const convSub = supabase.channel('conversations-rt-' + entityId)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'conversations',
        filter: filterStr
      }, () => loadConversations())
      .subscribe()
    return () => supabase.removeChannel(convSub)
  }, [entityId, isSubTenant, loadConversations])

  useEffect(() => {
    if (!activeConv?.id) return
    const channelName = `messages-${activeConv.id}`
    const msgSub = supabase.channel(channelName)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `conversation_id=eq.${activeConv.id}`
      }, (payload) => {
        if (!payload.new?.id) return
        setMessages(prev => {
          if (prev.find(m => m.id === payload.new.id)) return prev
          return [...prev, payload.new]
        })
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'messages',
        filter: `conversation_id=eq.${activeConv.id}`
      }, (payload) => {
        if (!payload.new?.id) return
        setMessages(prev => prev.map(m =>
          m.id === payload.new.id ? { ...m, ...payload.new } : m
        ))
      })
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') loadMessages(activeConv.id)
      })
    return () => { supabase.removeChannel(msgSub) }
  }, [activeConv?.id, loadMessages])

  useEffect(() => {
    if (!entityId) return
    const notifSub = supabase.channel('notif-inbound-' + entityId)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages'
      }, async (payload) => {
        const msg = payload.new
        const isInbound  = msg.direction === 'inbound'
        const isAdminNote = msg.author === 'admin_note'
        if (!isInbound && !isAdminNote) return
        if (msg.conversation_id === activeConvRef.current?.id) return
        let q = supabase
          .from('conversations')
          .select('phone, contact_name, tenant_id, sub_tenant_id')
          .eq('id', msg.conversation_id)
        if (isSubTenant) q = q.eq('sub_tenant_id', entityId)
        else             q = q.eq('tenant_id', entityId)
        const { data: conv } = await q.single()
        if (!conv) return
        const id = ++notifId.current
        const titleBase = conv.contact_name || conv.phone || 'Conversación'
        const notifTitle = isAdminNote ? `📌 Innovate.ia · ${titleBase}` : titleBase
        const notifBody = isAdminNote
          ? `Nota del equipo: ${String(msg.body || '').slice(0, 100)}`
          : msg.body
        setNotifications(prev => [...prev, { id, convId: msg.conversation_id, phone: notifTitle, body: notifBody }])
        setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000)

        if ('serviceWorker' in navigator && Notification.permission === 'granted') {
          const phoneDigits = String(conv.phone || '').replace(/\D/g, '')
          const targetUrl = phoneDigits ? `${chatBasePath}/${phoneDigits}` : chatBasePath
          navigator.serviceWorker.ready.then(reg => {
            reg.showNotification(notifTitle, {
              body: String(notifBody || '').slice(0, 120),
              icon: '/icon-192.svg', badge: '/icon-192.svg',
              tag: `chat-${msg.conversation_id}`, renotify: true,
              requireInteraction: false,
              data: { url: targetUrl }, vibrate: [200, 100, 200],
            })
          }).catch(() => {})
        }
      })
      .subscribe()
    return () => supabase.removeChannel(notifSub)
  }, [entityId, isSubTenant, activeConv?.id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const registrarVenta = async () => {
    if (!saleAmount || !activeConv || saleSaving) return
    setSaleSaving(true)
    setSaleFlash('')
    try {
      if (isSubTenant) {
        const { data: rpcData, error: rpcErr } = await supabase.rpc('sub_tenant_register_sale', {
          p_conversation_id: activeConv.id || null,
          p_amount: Number(saleAmount), p_currency: 'ARS',
          p_customer_phone: activeConv.phone || null,
          p_customer_name: activeConv.contact_name || null,
          p_notes: null,
        })
        if (rpcErr) throw rpcErr
        if (rpcData?.sale_id && rpcData?.has_meta_token) {
          callEdgeFunction(META_CONVERSION_URL, { sale_id: rpcData.sale_id }).catch(() => {})
        }
        setSaleFlash('✅ Venta registrada')
        setShowSaleModal(false)
        setSaleAmount('')
        setTimeout(() => setSaleFlash(''), 2500)
        setSaleSaving(false)
        return
      }
      const { data, error } = await supabase.from('sales').insert({
        tenant_id: effectiveTenant.id, conversation_id: activeConv.id || null,
        amount: Number(saleAmount), currency: 'ARS',
        customer_phone: activeConv.phone || null,
        customer_name: activeConv.contact_name || null,
        notes: `Casino ID: ${activeConv.casino_user_id || '—'} | Registrado desde chat`,
        status: 'confirmed', source: 'agent', registered_by: 'agent',
      }).select().single()
      if (error) throw error

      let metaOk = false
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const metaRes = await fetch(META_CONVERSION_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
          body: JSON.stringify({ sale_id: data.id }),
        })
        const metaData = await metaRes.json()
        metaOk = metaData.success === true
      } catch(e) {}

      setSaleFlash(metaOk ? '✅ Venta registrada · Meta ✓' : '✅ Venta registrada')
      setSaleAmount('')
      setTimeout(() => { setShowSaleModal(false); setSaleFlash('') }, 2000)
    } catch(e) {
      setSaleFlash('❌ ' + e.message)
    } finally {
      setSaleSaving(false)
    }
  }

  const uploadAndSendMedia = async (file, conv, caption = '') => {
    console.log('[uploadAndSendMedia] start', { name: file.name, size: file.size, type: file.type, convId: conv?.id })
    if (!file || !conv) {
      return { ok: false, error: 'missing_file_or_conv' }
    }

    const mime = file.type
    const isImage = ['image/jpeg', 'image/png', 'image/webp'].includes(mime)
    const isPdf   = mime === 'application/pdf'
    if (!isImage && !isPdf) {
      return { ok: false, error: 'Solo se permiten imágenes (JPG/PNG/WebP) o PDFs.' }
    }
    const maxBytes = isImage ? 5 * 1024 * 1024 : 16 * 1024 * 1024
    if (file.size > maxBytes) {
      return { ok: false, error: `Archivo muy grande. Máximo ${isImage ? '5 MB' : '16 MB'}.` }
    }

    try {
      const tenantId = conv.tenant_id
      const subId    = conv.sub_tenant_id
      const yyyymm   = new Date().toISOString().slice(0, 7)
      const ext      = (file.name.split('.').pop() || (isImage ? 'jpg' : 'pdf')).toLowerCase()
      const uuid     = crypto.randomUUID()
      const subPath  = subId || 'self'
      const path     = `${tenantId}/${subPath}/${yyyymm}/${uuid}.${ext}`

      console.log('[uploadAndSendMedia] uploading to bucket', MEDIA_BUCKET, path)
      const { error: upErr } = await supabase.storage
        .from(MEDIA_BUCKET)
        .upload(path, file, { contentType: mime, upsert: false })
      if (upErr) {
        console.error('[uploadAndSendMedia] upload error:', upErr)
        return { ok: false, error: `No se pudo subir: ${upErr.message}` }
      }

      console.log('[uploadAndSendMedia] calling EF send-wa-media')
      const { ok, status, data } = await callEdgeFunction(SEND_WA_MEDIA_URL, {
        conversation_id: conv.id,
        storage_path:    path,
        media_kind:      isImage ? 'image' : 'document',
        media_mime:      mime,
        filename:        file.name,
        caption:         caption.trim() || undefined,
      })
      if (!ok) {
        const errMsg = data?.error === 'whatsapp_not_configured'
          ? 'WhatsApp no está configurado.'
          : data?.error === 'meta_upload_failed'
            ? `Meta rechazó el archivo: ${data?.meta_response?.error?.message || 'ver consola'}`
            : data?.error || `http_${status}`
        console.error('[uploadAndSendMedia] EF error:', status, data)
        return { ok: false, error: errMsg }
      }
      console.log('[uploadAndSendMedia] success')
      return { ok: true, error: null }
    } catch (e) {
      console.error('[uploadAndSendMedia] exception:', e)
      return { ok: false, error: e?.message || 'Error inesperado' }
    }
  }

  const waitForActiveConv = useCallback(async (maxAttempts = 30, intervalMs = 100) => {
    for (let i = 0; i < maxAttempts; i++) {
      if (activeConvRef.current) return activeConvRef.current
      await new Promise(r => setTimeout(r, intervalMs))
    }
    return null
  }, [])

  const handleAttachFile = useCallback(async (f) => {
    if (!f) return
    if (attachInFlightRef.current) {
      console.log('[Chats] handleAttachFile already in flight, ignoring duplicate')
      return
    }
    attachInFlightRef.current = true
    console.log('[Chats] handleAttachFile', { name: f.name, size: f.size, isMobile: isMobileRef.current })

    try {
      if (!activeConvRef.current) {
        if (isMobileRef.current) {
          setAttachStatus('uploading')
          setAttachStatusMsg(`Preparando ${f.name}…`)
        }
        console.log('[Chats] waiting for activeConv to hydrate...')
      }
      const conv = await waitForActiveConv(30, 100)
      if (!conv) {
        console.warn('[Chats] activeConv never hydrated')
        setAttachStatus('error')
        setAttachStatusMsg('No se pudo recuperar la conversación. Recargá la página.')
        return
      }

      if (isMobileRef.current) {
        setMobileView('chat')
        setAttachStatus('uploading')
        setAttachStatusMsg(`Enviando ${f.name}…`)
        const { ok, error } = await uploadAndSendMedia(f, conv, '')
        if (ok) {
          setAttachStatus('done')
          setAttachStatusMsg('✅ Archivo enviado')
          setTimeout(() => { setAttachStatus(null); setAttachStatusMsg('') }, 2500)
        } else {
          setAttachStatus('error')
          setAttachStatusMsg(error || 'Error al enviar')
        }
        return
      }

      setPendingFile(f)
      setPendingCaption('')
      setPendingError(null)
    } finally {
      attachInFlightRef.current = false
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waitForActiveConv])

  useEffect(() => {
    try {
      const pending = window.__attachInput?.consumePending?.()
      if (pending) {
        console.log('[Chats] consuming pending attach file from window')
        handleAttachFile(pending)
      }
    } catch (e) {
      console.error('[Chats] consumePending error', e)
    }

    const onAttachReady = (e) => {
      const f = e?.detail?.file
      if (f) handleAttachFile(f)
    }
    window.addEventListener('attach-file-ready', onAttachReady)
    return () => window.removeEventListener('attach-file-ready', onAttachReady)
  }, [handleAttachFile])

  const sendMediaFromModal = async () => {
    if (!pendingFile) return
    const conv = activeConvRef.current
    if (!conv) {
      setPendingError('No hay conversación activa.')
      return
    }
    setAttachStatus('uploading')
    setAttachStatusMsg('Enviando…')
    setPendingError(null)
    const { ok, error } = await uploadAndSendMedia(pendingFile, conv, pendingCaption)
    if (ok) {
      setPendingFile(null)
      setPendingCaption('')
      setPendingError(null)
      setAttachStatus('done')
      setAttachStatusMsg('✅ Archivo enviado')
      setTimeout(() => { setAttachStatus(null); setAttachStatusMsg('') }, 2000)
    } else {
      setPendingError(error)
      setAttachStatus('error')
      setAttachStatusMsg('')
    }
  }

  const sendMessage = async (body) => {
    if (!body.trim() || !activeConv || sending) return
    setSending(true)

    let efOk = false
    let efErr = null
    try {
      const { ok, status, data } = await callEdgeFunction(SEND_WA_MANUAL_URL, {
        conversation_id: activeConv.id, text: body,
      })
      efOk = ok
      if (!ok) {
        efErr = data?.error || `http_${status}`
        console.error('[Chats] send-wa-manual error:', status, data)
        if (typeof window !== 'undefined' && window.alert) {
          const msg = data?.error === 'whatsapp_not_configured'
            ? 'No se pudo enviar: WhatsApp no está configurado.'
            : data?.error === 'whatsapp_api_error'
              ? `No se pudo enviar: error de Meta (${data?.meta_response?.error?.message || 'ver consola'}).`
              : `No se pudo enviar el mensaje (${efErr}).`
          alert(msg)
        }
      }
    } catch (e) {
      efErr = e?.message || 'network_error'
      console.error('[Chats] send-wa-manual exception:', e)
      if (typeof window !== 'undefined' && window.alert) {
        alert('No se pudo enviar el mensaje (error de red).')
      }
    }

    if (!efOk) { setSending(false); return }

    const botWasActive = activeConv.bot_active
    if (botWasActive) {
      setActiveConv(c => ({ ...c, bot_active: false }))
      setConversations(prev => prev.map(c =>
        c.id === activeConv.id ? { ...c, bot_active: false } : c
      ))
      await supabase.from('conversations').update({ bot_active: false }).eq('id', activeConv.id)
    }

    await loadMessages(activeConv.id)

    if (activeConv.status === 'waiting') {
      await supabase.from('conversations').update({ status: 'open' }).eq('id', activeConv.id)
      setActiveConv(c => ({ ...c, status: 'open' }))
      setConversations(prev => {
        const updated = prev.map(c => c.id === activeConv.id ? { ...c, status: 'open' } : c)
        const wc = updated.filter(c => c.status === 'waiting').length
        setWaitingCount(wc)
        window.__ia_waiting = wc
        window.dispatchEvent(new CustomEvent('ia-waiting', { detail: wc }))
        return updated
      })
    }
    setNotifications(prev => prev.filter(n => n.convId !== activeConv.id))
    setInput('')
    inputRef.current?.focus()
    setSending(false)
  }

  const toggleBot = async (conv, active) => {
    await supabase.rpc('toggle_bot', { p_conversation_id: conv.id, p_active: active })
    setConversations(prev => prev.map(c =>
      c.id === conv.id ? { ...c, bot_active: active } : c
    ))
    if (activeConv?.id === conv.id) {
      setActiveConv(c => ({ ...c, bot_active: active }))
    }
  }

  // ════════════════════════════════════════════════════════════════
  // handleActionDone — Callback unificado del ActionModal y los 3
  // sub-components nuevos (Profesional/Tienda/Marketing).
  //
  // 11/05/2026 sprint identity-actions (commit 4/4): extendido con
  // kinds nuevos para postear mensajes al WA cuando una acción completa.
  // ════════════════════════════════════════════════════════════════
  const handleActionDone = async (action, data) => {
    // Casino: share (compat con todos)
    if (action === 'share') {
      await sendMessage(data.msg)
      return
    }

    // Casino: createuser
    if (action === 'createuser' && data.id) {
      await supabase.from('conversations').update({
        casino_user_id: String(data.id),
        casino_login: String(data.login),
        casino_password: String(data.password)
      }).eq('id', activeConv.id)
      setActiveConv(c => ({ ...c, casino_user_id: String(data.id), casino_login: String(data.login), casino_password: String(data.password) }))
      const msg = `🎰 ¡Tu cuenta fue creada!\n\n👤 Usuario: ${data.login}\n🔑 Contraseña: ${data.password}\n\n🌐 ${cfg?.casino_info?.url || '#'}`
      await sendMessage(msg)
      return
    }

    // Casino: balance
    if (action === 'balance') {
      const bal = data.balanceHistory?.balances?.ARS
      if (bal) await sendMessage(`✅ Saldo actualizado: $${bal} ARS`)
      return
    }

    // Profesional: appointment created
    if (action === 'appointment_created') {
      const when = new Date(data.starts_at).toLocaleString('es-AR', {
        timeZone: 'America/Argentina/Buenos_Aires',
        weekday: 'long', day: '2-digit', month: 'long',
        hour: '2-digit', minute: '2-digit', hour12: false,
      })
      await sendMessage(`✅ ¡Turno confirmado!\n\n📅 ${when}\n⏱ Duración: ${data.duration_min} min\n\nTe esperamos. Cualquier cambio, escribinos.`)
      return
    }

    // Profesional: appointment cancelled
    if (action === 'appointment_cancelled') {
      const when = new Date(data.starts_at).toLocaleString('es-AR', {
        timeZone: 'America/Argentina/Buenos_Aires',
        day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit', hour12: false,
      })
      await sendMessage(`❌ Tu turno del ${when} fue cancelado.\n\nSi querés reprogramar, escribinos cuando quieras.`)
      return
    }

    // Tienda: sale registered
    if (action === 'sale_registered') {
      const amt = '$' + Number(data.amount || 0).toLocaleString('es-AR')
      await sendMessage(`✅ Tu pedido fue registrado por ${amt}.\n\n¡Gracias por tu compra!`)
      return
    }

    // Tienda: order delivered
    if (action === 'order_delivered') {
      await sendMessage(`📦 ¡Tu pedido fue despachado!\n\nGracias por tu compra. Cualquier consulta, escribinos.`)
      return
    }

    // Tienda: order cancelled
    if (action === 'order_cancelled') {
      const reasonTxt = data.reason ? `\n\nMotivo: ${data.reason}` : ''
      await sendMessage(`❌ Tu pedido fue cancelado.${reasonTxt}\n\nSi querés más info, escribinos.`)
      return
    }

    // Marketing: demo scheduled
    if (action === 'demo_scheduled') {
      const when = new Date(data.starts_at).toLocaleString('es-AR', {
        timeZone: 'America/Argentina/Buenos_Aires',
        weekday: 'long', day: '2-digit', month: 'long',
        hour: '2-digit', minute: '2-digit', hour12: false,
      })
      await sendMessage(`📅 ¡Te confirmamos la demo!\n\n${when}\nDuración: ${data.duration_min} min\n\nTe pasaremos los detalles más cerca de la fecha.`)
      return
    }

    // Marketing: lead derived
    if (action === 'lead_derived') {
      const to = data.derived_to ? ` con ${data.derived_to}` : ''
      await sendMessage(`👋 Te vamos a conectar${to} para que te dé la mejor atención.\n\nEn breve te van a contactar. ¡Gracias!`)
      return
    }

    // Kinds que NO requieren mensaje al cliente (refresh-only):
    // lead_qualified, lead_status_changed, appointment_updated, resetpassword
  }

  const filtered = conversations.filter(c => {
    if (filter === 'bot'   && !c.bot_active)  return false
    if (filter === 'human' && c.bot_active)   return false
    if (subFilter !== 'all') {
      if (subFilter === 'none' && c.sub_tenant_id != null) return false
      if (subFilter !== 'none' && c.sub_tenant_id !== subFilter) return false
    }
    if (search && !(c.contact_name?.toLowerCase().includes(search.toLowerCase()) ||
                    c.phone?.includes(search))) return false
    return true
  })

  useEffect(() => {
    if (!exportMenuOpen) return
    const handler = (e) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) {
        setExportMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [exportMenuOpen])

  const handleExport = async (scope, format) => {
    setExportLoading(true)
    setExportMenuOpen(false)
    try {
      const { data: rows, error } = await supabase.rpc('export_my_contacts')
      if (error) throw error
      let exportRows = rows || []
      if (scope === 'filtered') {
        const allowedIds = new Set(filtered.map(c => c.id))
        exportRows = exportRows.filter(r => allowedIds.has(r.id))
      }
      if (exportRows.length === 0) { alert('No hay contactos para exportar.'); return }
      const now = new Date()
      const pad = (n) => String(n).padStart(2, '0')
      const stamp = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`
      const scopeStr = scope === 'filtered' ? 'filtrados' : 'todos'
      const filename = `contactos-${scopeStr}-${stamp}.${format}`
      let blob
      if (format === 'json') {
        const payload = JSON.stringify(exportRows, null, 2)
        blob = new Blob([payload], { type: 'application/json;charset=utf-8' })
      } else {
        const headers = Object.keys(exportRows[0])
        const escapeCsv = (val) => {
          if (val === null || val === undefined) return ''
          let s = typeof val === 'object' ? JSON.stringify(val) : String(val)
          if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
            s = '"' + s.replace(/"/g, '""') + '"'
          }
          return s
        }
        const lines = [headers.join(',')]
        for (const row of exportRows) {
          lines.push(headers.map(h => escapeCsv(row[h])).join(','))
        }
        const csv = '\uFEFF' + lines.join('\r\n')
        blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
      }
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = filename
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (e) {
      console.error('Export error:', e)
      alert('Error al exportar: ' + (e.message || 'desconocido'))
    } finally {
      setExportLoading(false)
    }
  }

  const openAttachPicker = useCallback(() => {
    if (sending || attachStatus === 'uploading') return
    if (!activeConvRef.current) return
    console.log('[Chats] openAttachPicker')
    if (window.__attachInput && typeof window.__attachInput.open === 'function') {
      window.__attachInput.open(handleAttachFile)
    } else {
      console.warn('[Chats] window.__attachInput not available — fallback')
      alert('No se puede adjuntar archivos en este momento. Recargá la página.')
    }
  }, [sending, attachStatus, handleAttachFile])

  if (!entityId) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', flex:1, background:'#080B12' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:28, marginBottom:12 }}>💬</div>
        <p style={{ fontSize:13, color:'#4E5168' }}>Cargando conversaciones...</p>
      </div>
    </div>
  )

  // 13/05/2026 — Root height fix mobile: usar la CSS var --chat-viewport-h
  // que se actualiza con visualViewport (ver useEffect arriba). En desktop
  // o si no hay var disponible, fallback a height:100%.
  const rootHeight = isMobile ? 'var(--chat-viewport-h, 100%)' : '100%'

  return (
    <div style={{ display:'flex', height: rootHeight, flex:1, background:C.bg, overflow:'hidden', minHeight:0, maxWidth:'2560px', margin:'0 auto', width:'100%' }}>

      <div data-tour="chats-list" style={{
        flex: isMobile ? '1 1 auto' : '0 0 auto',
        width: isMobile ? '100%' : (activeConv ? 'clamp(280px, 22vw, 400px)' : '100%'),
        maxWidth: isMobile ? '100%' : 'clamp(280px, 22vw, 400px)',
        minWidth: 0,
        borderRight: isMobile ? 'none' : `1px solid ${C.border}`,
        display: isMobile && activeConv && mobileView === 'chat' ? 'none' : 'flex',
        flexDirection:'column', background:C.surface,
        transition: 'width 0.2s', overflow: 'hidden',
      }}>
        <div style={{ padding:'16px 16px 12px', borderBottom:`1px solid ${C.border}` }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12, gap:8, flexWrap:'wrap' }}>
            <h2 style={{ margin:0, fontSize:15, fontWeight:700, color:C.text, flexShrink:0 }}>Conversaciones</h2>
            <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', justifyContent:'flex-end', minWidth:0 }}>
              <span style={{ fontSize:11, color:C.muted, fontFamily:'monospace', flexShrink:0 }}>{filtered.length}</span>
              <PendingOrdersBadge onOpen={() => setShowOrdersPanel(true)} />
              <div ref={exportMenuRef} style={{ position:'relative', flexShrink:0 }}>
                <button
                  onClick={() => setExportMenuOpen(o => !o)}
                  disabled={exportLoading}
                  title="Exportar contactos"
                  style={{
                    background: exportMenuOpen ? `${C.gold}20` : C.bg,
                    border: `1px solid ${exportMenuOpen ? C.gold : C.border}`,
                    borderRadius: 7, padding: '5px 8px',
                    cursor: exportLoading ? 'wait' : 'pointer',
                    display:'flex', alignItems:'center', gap:5,
                    color: exportMenuOpen ? C.gold : C.muted,
                    fontSize:11, fontWeight:500,
                    opacity: exportLoading ? 0.5 : 1, transition: 'all 0.2s',
                  }}
                >
                  <span style={{ fontSize:14 }}>{exportLoading ? '⏳' : '📥'}</span>
                  <span style={{ display: window.innerWidth < 500 ? 'none' : 'inline' }}>Exportar</span>
                </button>
                {exportMenuOpen && (
                  <div style={{
                    position:'absolute', top:'calc(100% + 4px)', right:0, zIndex:50,
                    background:C.surface || C.bg, border:`1px solid ${C.border}`, borderRadius:8,
                    minWidth:220, boxShadow:'0 8px 24px rgba(0,0,0,0.4)', overflow:'hidden',
                  }}>
                    <div style={{
                      padding:'8px 12px 6px', fontSize:9, fontWeight:600, color:C.muted,
                      letterSpacing:'0.08em', textTransform:'uppercase', fontFamily:'monospace',
                      borderBottom:`1px solid ${C.border}`,
                    }}>Filtrados ({filtered.length})</div>
                    <button onClick={() => handleExport('filtered','csv')} style={exportMenuItemStyle}>
                      <span>📄</span><span>CSV (Excel)</span>
                    </button>
                    <button onClick={() => handleExport('filtered','json')} style={exportMenuItemStyle}>
                      <span>{'{ }'}</span><span>JSON</span>
                    </button>
                    <div style={{
                      padding:'8px 12px 6px', fontSize:9, fontWeight:600, color:C.muted,
                      letterSpacing:'0.08em', textTransform:'uppercase', fontFamily:'monospace',
                      borderTop:`1px solid ${C.border}`, borderBottom:`1px solid ${C.border}`,
                    }}>Todos los contactos</div>
                    <button onClick={() => handleExport('all','csv')} style={exportMenuItemStyle}>
                      <span>📄</span><span>CSV (Excel)</span>
                    </button>
                    <button onClick={() => handleExport('all','json')} style={exportMenuItemStyle}>
                      <span>{'{ }'}</span><span>JSON</span>
                    </button>
                  </div>
                )}
              </div>
              {pushSupported && pushPermission !== 'denied' && (
                <button
                  onClick={pushSubscribed ? undefined : pushSubscribe}
                  disabled={pushLoading}
                  title={pushSubscribed ? 'Notificaciones activas' : 'Activar notificaciones push'}
                  style={{
                    background: pushSubscribed ? `${C.gold}20` : C.bg,
                    border: `1px solid ${pushSubscribed ? C.gold : C.border}`,
                    borderRadius: 7, padding: '5px 8px', cursor: 'pointer',
                    display:'flex', alignItems:'center', gap:5, flexShrink:0,
                    color: pushSubscribed ? C.gold : C.muted,
                    fontSize:11, fontWeight:500,
                    opacity: pushLoading ? 0.5 : 1, transition: 'all 0.2s',
                  }}
                >
                  <span style={{ fontSize:14 }}>{pushSubscribed ? '🔔' : '🔕'}</span>
                  <span style={{ display: window.innerWidth < 500 ? 'none' : 'inline' }}>
                    {pushSubscribed ? 'Activo' : pushLoading ? '...' : 'Activar'}
                  </span>
                </button>
              )}
              {pushSubscribed && (
                <button
                  onClick={async () => {
                    const reg = await navigator.serviceWorker.ready
                    reg.showNotification('🔔 Test Innovate.ia', {
                      body: 'Las notificaciones están funcionando correctamente.',
                      icon: '/icon-192.svg', tag: 'test-manual', renotify: true,
                      vibrate: [200, 100, 200],
                    })
                  }}
                  title="Probar notificación"
                  style={{
                    background: C.bg, border: `1px solid ${C.border}`,
                    borderRadius: 7, padding: '5px 8px', cursor: 'pointer',
                    display:'flex', alignItems:'center', flexShrink:0,
                    color: C.muted, fontSize:11,
                  }}
                >🧪</button>
              )}
            </div>
          </div>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar contacto…"
            style={{
              width:'100%', boxSizing:'border-box', background:C.bg, border:`1px solid ${C.border}`,
              borderRadius:8, padding:'7px 12px', color:C.text, fontSize:12, outline:'none'
            }}
          />
          {!isSubTenant && subTenants.length > 0 && (
            <select
              value={subFilter}
              onChange={e => setSubFilter(e.target.value)}
              style={{
                width:'100%', marginTop:8, boxSizing:'border-box',
                background:C.bg, border:`1px solid ${C.border}`,
                borderRadius:8, padding:'7px 10px', color:C.text, fontSize:12, outline:'none',
                cursor:'pointer',
              }}
            >
              <option value="none">📱 Mi chat</option>
              <option value="all">🏢 Todos los clientes</option>
              {subTenants.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}{s.status === 'suspended' ? ' (suspendido)' : ''}
                </option>
              ))}
            </select>
          )}
          <div style={{ display:'flex', gap:4, marginTop:10 }}>
            {[['all','Todos'],['bot','🤖 Bot'],['human','👤 Humano']].map(([val,label]) => (
              <button key={val} onClick={() => setFilter(val)} style={{
                flex:1, padding:'5px 4px', fontSize:10, fontWeight:700, border:'none', cursor:'pointer',
                borderRadius:6, background: filter===val ? `${C.gold}20` : 'transparent',
                color: filter===val ? C.gold : C.muted, transition:'all .15s'
              }}>{label}</button>
            ))}
          </div>
        </div>

        <div style={{ flex:1, overflowY:'auto' }}>
          {filtered.length === 0 && (
            <div style={{ padding:32, textAlign:'center' }}>
              <p style={{ fontSize:28, margin:'0 0 8px' }}>💬</p>
              <p style={{ fontSize:12, color:C.muted, margin:0 }}>Sin conversaciones aún</p>
            </div>
          )}
          {filtered.map(conv => {
            const isActive  = activeConv?.id === conv.id
            const isWaiting = conv.status === 'waiting'
            return (
              <div key={conv.id} onClick={() => {
                setActiveConv(conv)
                if(isMobile) setMobileView('chat')
                setNotifications(prev => prev.filter(n => n.convId !== conv.id))
              }} style={{
                padding:'12px 16px', cursor:'pointer', borderBottom:`1px solid ${C.border}`,
                background: isActive ? `${C.gold}08` : isWaiting ? '#ff000008' : 'transparent',
                borderLeft: isActive ? `2px solid ${C.gold}` : isWaiting ? '2px solid #ef4444' : '2px solid transparent',
                transition:'all .15s'
              }}>
                <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                  <div style={{ position:'relative' }}>
                    <Avatar name={conv.contact_name} size={38} />
                    <span style={{
                      position:'absolute', bottom:-1, right:-1, width:10, height:10,
                      borderRadius:'50%', border:`2px solid ${C.surface}`,
                      background: isWaiting ? '#ef4444' : conv.bot_active ? C.blue : C.green
                    }} />
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <span style={{ fontSize:13, fontWeight:600, color: isActive ? C.gold : isWaiting ? '#ef4444' : C.text, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:130 }}>
                        {conv.contact_name || conv.phone}
                      </span>
                      <span style={{ fontSize:10, color:C.muted, flexShrink:0 }}>{fmt(conv.last_message_at)}</span>
                    </div>
                    <div style={{ display:'flex', gap:6, alignItems:'center', marginTop:3 }}>
                      {isWaiting ? (
                        <span style={{ fontSize:10, color:'#ef4444', fontWeight:700, display:'flex', alignItems:'center', gap:3 }}>
                          🚨 Esperando agente
                        </span>
                      ) : (
                        <span style={{ fontSize:10, color: conv.bot_active ? C.blue : C.green }}>
                          {conv.bot_active ? '🤖 bot' : '👤 agente'}
                        </span>
                      )}
                      {conv.casino_login && (
                        <span style={{ fontSize:10, color:C.muted, fontFamily:'monospace' }}>
                          #{conv.casino_login}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {!activeConv ? (
        !isMobile && (
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12 }}>
            <div style={{ fontSize:56 }}>💬</div>
            <p style={{ color:C.muted, fontSize:14, margin:0 }}>Seleccioná una conversación</p>
          </div>
        )
      ) : (
        <div data-tour="chats-thread" style={{ flex:1, display: isMobile && mobileView === 'list' ? 'none' : 'flex', flexDirection:'column', minWidth:0, minHeight:0, width: isMobile ? '100%' : 'auto', overflow:'hidden' }}>

          <div style={{
            padding: isMobile ? '10px 12px' : '12px 20px', borderBottom:`1px solid ${C.border}`,
            display:'flex', alignItems:'center', gap: isMobile ? 8 : 12, background:C.surface, flexShrink:0,
            minWidth: 0,
          }}>
            <button onClick={closeChat} style={{
              display: isMobile ? 'flex' : 'none',
              background:'none', border:'none', color:C.textDim, cursor:'pointer',
              fontSize:22, padding:0, alignItems:'center', flexShrink:0, lineHeight:1,
            }}>←</button>
            <Avatar name={activeConv.contact_name} size={isMobile ? 34 : 38} />
            <div style={{ flex:1, minWidth:0, overflow:'hidden' }}>
              <p style={{ margin:0, fontWeight:700, color:C.text, fontSize:14,
                overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {activeConv.contact_name}
              </p>
              <p style={{ margin:0, fontSize:11, color:C.muted,
                overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {activeConv.phone}
              </p>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
              {!isMobile && <span style={{ fontSize:11, color:C.textDim }}>Bot</span>}
              <div
                onClick={() => toggleBot(activeConv, !activeConv.bot_active)}
                title={activeConv.bot_active ? 'Bot activo (tocá para pausar)' : 'Bot pausado (tocá para activar)'}
                style={{
                  width:36, height:20, borderRadius:99, cursor:'pointer', position:'relative',
                  background: activeConv.bot_active ? C.blue : C.muted,
                  transition:'background .2s', flexShrink:0,
                }}
              >
                <div style={{
                  position:'absolute', top:3, left: activeConv.bot_active ? 19 : 3,
                  width:14, height:14, borderRadius:'50%', background:'white',
                  transition:'left .2s', boxShadow:'0 1px 3px rgba(0,0,0,.3)'
                }} />
              </div>
              {!isMobile && (
                <span style={{ fontSize:11, fontWeight:700, color: activeConv.bot_active ? C.blue : C.green }}>
                  {activeConv.bot_active ? 'Activo' : 'Pausado'}
                </span>
              )}
            </div>
            {!isMobile && (
              <Btn onClick={() => setShowAction(true)} variant="ghost">
                ⚡ Acciones
              </Btn>
            )}
          </div>

          <div style={{ flex:1, minHeight:0, overflowY:'auto', padding: isMobile ? '14px 12px' : '20px 24px', display:'flex', flexDirection:'column', gap:12, background:C.bg }}>
            {messages.length === 0 && (
              <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:8, opacity:.5 }}>
                <span style={{ fontSize:32 }}>💬</span>
                <span style={{ fontSize:13, color:C.muted }}>Sin mensajes aún</span>
              </div>
            )}
            {messages.map(msg => {
              if (msg.author === 'admin_note') {
                return (
                  <div key={msg.id} style={{
                    margin:'6px 0', padding:'10px 14px',
                    background:'rgba(168,85,247,0.10)',
                    border:'1px dashed #a855f766',
                    borderRadius:10, color:C.text,
                    fontSize:13, lineHeight:1.55,
                  }}>
                    <div style={{
                      display:'flex', alignItems:'center', gap:6,
                      fontSize:11, color:'#a855f7',
                      textTransform:'uppercase', letterSpacing:'.06em',
                      marginBottom:6,
                    }}>
                      <span>📌</span>
                      <span>Equipo Innovate.ia · El usuario no ve este mensaje · No responder</span>
                    </div>
                    <div style={{ whiteSpace:'pre-wrap', wordBreak:'break-word' }}>{msg.body}</div>
                    <div style={{ marginTop:6, fontSize:10, color:C.muted, fontFamily:'monospace' }}>
                      {timeStr(msg.sent_at)}
                    </div>
                  </div>
                )
              }
              const isOut = msg.direction === 'outbound'
              const isBot = msg.author === 'bot'
              const isRem = msg.author === 'remarketing'
              return (
                <div key={msg.id} style={{
                  display:'flex', flexDirection:'column',
                  alignItems: isOut ? 'flex-end' : 'flex-start', gap:4
                }}>
                  <span style={{ fontSize:10, color:C.muted, paddingLeft:2, paddingRight:2 }}>
                    {isOut ? (isRem ? '📣 Remarketing' : isBot ? '🤖 Bot' : '👤 Agente') : '📱 Cliente'}
                    {' · '}{timeStr(msg.sent_at)}
                  </span>
                  <div style={{
                    maxWidth: isMobile ? '85%' : 'clamp(300px, 60%, 700px)',
                    padding:'10px 14px', borderRadius: isOut ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    background: C.card,
                    border: `1px solid ${C.border}`,
                    fontSize:13, color:C.text, lineHeight:1.55, whiteSpace:'pre-wrap',
                    wordBreak:'break-word', overflowWrap:'anywhere',
                  }}>
                    {msg.media_url ? <MessageMedia msg={msg} /> : null}
                    {msg.body && (msg.body !== '[imagen]' && !msg.body.startsWith('[archivo:')) ? msg.body : null}
                  </div>
                  {isOut && (
                    <div style={{ display:'flex', alignItems:'center', gap:3, paddingRight:2 }}>
                      {msg.status === 'read' ? (
                        <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
                          <path d="M1 5L4.5 8.5L10.5 1" stroke="#53BDEB" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M5 5L8.5 8.5L14.5 1" stroke="#53BDEB" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : msg.status === 'delivered' ? (
                        <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
                          <path d="M1 5L4.5 8.5L10.5 1" stroke="#8696A0" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M5 5L8.5 8.5L14.5 1" stroke="#8696A0" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : (
                        <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
                          <path d="M1 5L4.5 8.5L10.5 1" stroke="#8696A0" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                  )}
                  {!isOut && msg.ai_suggestion && (
                    <div onClick={() => setInput(msg.ai_suggestion)} style={{
                      maxWidth: isMobile ? '85%' : 'clamp(300px, 60%, 700px)',
                      padding:'8px 12px', borderRadius:10, cursor:'pointer',
                      background:`${C.gold}10`, border:`1px dashed ${C.gold}50`,
                      fontSize:11, color:C.gold, lineHeight:1.5, whiteSpace:'pre-wrap',
                      wordBreak:'break-word', overflowWrap:'anywhere',
                      display:'flex', gap:6, alignItems:'flex-start'
                    }} title="Clic para usar como respuesta">
                      <span style={{ flexShrink:0 }}>✨</span>
                      <span>{msg.ai_suggestion}</span>
                    </div>
                  )}
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>

          <div style={{
            padding: isMobile ? '10px 12px' : '12px 20px', borderTop:`1px solid ${C.border}`,
            background:C.surface, flexShrink:0, zIndex:2,
          }}>
            {attachStatus && attachStatusMsg && (
              <div style={{
                padding:'8px 12px', marginBottom:10, borderRadius:8,
                background: attachStatus === 'error' ? 'rgba(239,68,68,0.15)' : `${C.gold}15`,
                border: attachStatus === 'error' ? '1px solid rgba(239,68,68,0.4)' : `1px solid ${C.gold}40`,
                fontSize:12, color: attachStatus === 'error' ? '#ef4444' : C.gold,
                display:'flex', alignItems:'center', gap:8,
              }}>
                {attachStatus === 'uploading' && <span>📤</span>}
                {attachStatus === 'done' && <span>✅</span>}
                {attachStatus === 'error' && <span>❌</span>}
                <span style={{ flex:1 }}>{attachStatusMsg}</span>
                {attachStatus === 'error' && (
                  <button onClick={() => { setAttachStatus(null); setAttachStatusMsg('') }}
                    style={{ background:'none', border:'none', color:'#ef4444', cursor:'pointer', fontSize:14 }}>×</button>
                )}
              </div>
            )}

            {activeConv.bot_active && (
              <div style={{
                padding:'6px 12px', marginBottom:10, borderRadius:8,
                background:`${C.blue}15`, border:`1px solid ${C.blue}30`,
                fontSize:11, color:C.blue, display:'flex',
                justifyContent:'space-between', alignItems:'center',
                gap:8, flexWrap:'wrap',
              }}>
                <span style={{ flex:1, minWidth:0 }}>🤖 El bot está activo. Tu mensaje también se enviará.</span>
                <button onClick={() => toggleBot(activeConv, false)} style={{
                  background:'none', border:'none', color:C.blue, cursor:'pointer',
                  fontSize:11, fontWeight:700, padding:0, whiteSpace:'nowrap', flexShrink:0,
                }}>Pausar bot →</button>
              </div>
            )}

            <div style={{ display:'flex', gap:8, marginBottom:10, flexWrap:'wrap' }}>
              <button
                onClick={() => setShowAction(true)}
                style={{
                  flex:'1 1 120px', minWidth:0, padding:'7px 10px', borderRadius:8, border:`1px solid ${C.gold}50`,
                  background:`${C.gold}12`, color:C.gold, fontSize:12, fontWeight:600,
                  cursor:'pointer', transition:'all .15s', display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                  whiteSpace:'nowrap',
                }}
              >⚡ Acciones</button>
              {entityForReplies && (
                <button
                  onClick={() => setShowQuickReplies(true)}
                  style={{
                    flex:'1 1 110px', minWidth:0, padding:'7px 10px', borderRadius:8,
                    border:`1px solid ${C.blue}50`,
                    background:`${C.blue}10`, color:C.blue, fontSize:12, fontWeight:600,
                    cursor:'pointer', transition:'all .15s', display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                    whiteSpace:'nowrap',
                  }}
                >💬 Plantillas</button>
              )}
              {activeConv.casino_login && (
                <button
                  onClick={() => sendMessage(`👤 Usuario: ${activeConv.casino_login}\n🔑 Contraseña: ${activeConv.casino_password}\n\n🌐 ${cfgWithTenant?.casino_info?.url || '#'}`)}
                  style={{
                    flex:'1 1 100px', minWidth:0, padding:'7px 10px', borderRadius:8, border:`1px solid ${C.border}`,
                    background:'transparent', color:C.muted, fontSize:12, fontWeight:600,
                    cursor:'pointer', transition:'all .15s', display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                    whiteSpace:'nowrap',
                  }}
                >📤 Datos</button>
              )}
              {activeConv.casino_user_id && (
                <button
                  onClick={() => { setSaleAmount(''); setSaleFlash(''); setShowSaleModal(true) }}
                  style={{
                    flex:'1 1 100px', minWidth:0, padding:'7px 10px', borderRadius:8,
                    border:`1px solid ${C.green}50`,
                    background:`${C.green}10`, color:C.green, fontSize:12, fontWeight:700,
                    cursor:'pointer', transition:'all .15s', display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                    whiteSpace:'nowrap',
                  }}
                >💰 Venta</button>
              )}
            </div>

            <div style={{ display:'flex', gap:10, alignItems:'flex-end' }}>
              <button
                type="button"
                onClick={openAttachPicker}
                disabled={sending || attachStatus === 'uploading'}
                title="Adjuntar imagen o PDF"
                style={{
                  background: C.bg, border:`1px solid ${C.border}`, borderRadius:10,
                  padding:'10px 12px', color: C.muted, fontSize:18,
                  cursor: (sending || attachStatus === 'uploading') ? 'not-allowed' : 'pointer',
                  flexShrink:0, height:44, boxSizing:'border-box',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  opacity: (sending || attachStatus === 'uploading') ? 0.5 : 1,
                  WebkitTapHighlightColor: 'transparent',
                }}
              >📎</button>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) }
                }}
                placeholder="Escribí tu mensaje… (Enter para enviar)"
                rows={2}
                style={{
                  flex:1, background:C.bg, border:`1px solid ${C.border}`, borderRadius:10,
                  padding:'10px 14px', color:C.text, fontSize:13, resize:'none', outline:'none',
                  fontFamily:'inherit', lineHeight:1.5
                }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || sending}
                style={{
                  background: input.trim() ? C.gold : C.border,
                  border:'none', borderRadius:10, padding:'10px 16px',
                  color: input.trim() ? C.bg : C.muted,
                  fontWeight:700, cursor: input.trim() ? 'pointer' : 'default',
                  fontSize:13, transition:'all .15s', flexShrink:0, height:44
                }}
              >
                {sending ? '…' : '↑ Enviar'}
              </button>
            </div>
          </div>

          {pendingFile && createPortal(
            <div
              onClick={e => { if (e.target === e.currentTarget && attachStatus !== 'uploading') { setPendingFile(null); setPendingCaption(''); setPendingError(null) } }}
              style={{
                position:'fixed', inset:0, background:'rgba(0,0,0,0.7)',
                display:'flex', alignItems:'center', justifyContent:'center',
                zIndex:9999, padding:16,
              }}
            >
              <div style={{
                background: C.surface, border:`1px solid ${C.border}`,
                borderRadius:12, padding:20, maxWidth:480, width:'100%',
                maxHeight:'90vh', overflowY:'auto',
                display:'flex', flexDirection:'column', gap:14,
              }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ fontSize:14, fontWeight:700, color:C.text }}>
                    {pendingFile.type.startsWith('image/') ? '📷 Enviar imagen' : '📄 Enviar PDF'}
                  </div>
                  <button
                    onClick={() => { if (attachStatus !== 'uploading') { setPendingFile(null); setPendingCaption(''); setPendingError(null) } }}
                    disabled={attachStatus === 'uploading'}
                    style={{ background:'none', border:'none', color:C.muted, fontSize:18, cursor: attachStatus === 'uploading' ? 'default' : 'pointer' }}
                  >✕</button>
                </div>

                {pendingFile.type.startsWith('image/') ? (
                  <div style={{ background:C.bg, borderRadius:8, padding:8, display:'flex', justifyContent:'center' }}>
                    <img
                      src={URL.createObjectURL(pendingFile)}
                      alt="preview"
                      style={{ maxWidth:'100%', maxHeight:280, borderRadius:6, objectFit:'contain' }}
                    />
                  </div>
                ) : (
                  <div style={{
                    display:'flex', alignItems:'center', gap:12,
                    padding:'14px 16px', background:C.bg,
                    border:`1px solid ${C.border}`, borderRadius:8,
                  }}>
                    <span style={{ fontSize:32 }}>📄</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:C.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {pendingFile.name}
                      </div>
                      <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>
                        {(pendingFile.size / 1024).toFixed(0)} KB
                      </div>
                    </div>
                  </div>
                )}

                <textarea
                  value={pendingCaption}
                  onChange={e => setPendingCaption(e.target.value)}
                  placeholder="Mensaje opcional…"
                  rows={2}
                  maxLength={1024}
                  disabled={attachStatus === 'uploading'}
                  style={{
                    width:'100%', boxSizing:'border-box',
                    background:C.bg, border:`1px solid ${C.border}`,
                    borderRadius:8, padding:'10px 12px', color:C.text,
                    fontSize:13, resize:'none', outline:'none',
                    fontFamily:'inherit',
                  }}
                />

                {pendingError && (
                  <div style={{
                    padding:'8px 12px', background:'rgba(239,68,68,0.1)',
                    border:'1px solid rgba(239,68,68,0.3)', borderRadius:8,
                    fontSize:12, color:'#ef4444',
                  }}>
                    {pendingError}
                  </div>
                )}

                <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
                  <button
                    onClick={() => { if (attachStatus !== 'uploading') { setPendingFile(null); setPendingCaption(''); setPendingError(null) } }}
                    disabled={attachStatus === 'uploading'}
                    style={{
                      background:'transparent', border:`1px solid ${C.border}`,
                      borderRadius:8, padding:'8px 14px', color:C.muted,
                      fontSize:13, cursor: attachStatus === 'uploading' ? 'default' : 'pointer',
                    }}
                  >Cancelar</button>
                  <button
                    onClick={sendMediaFromModal}
                    disabled={attachStatus === 'uploading'}
                    style={{
                      background: attachStatus === 'uploading' ? C.border : C.gold,
                      border:'none', borderRadius:8, padding:'8px 16px',
                      color: attachStatus === 'uploading' ? C.muted : C.bg,
                      fontWeight:700, fontSize:13,
                      cursor: attachStatus === 'uploading' ? 'default' : 'pointer',
                    }}
                  >
                    {attachStatus === 'uploading' ? 'Enviando…' : '↑ Enviar'}
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}
        </div>
      )}

      {activeConv && !isMobile && (
        <div style={{
          width: 'clamp(220px, 18vw, 320px)', flexShrink:0, borderLeft:`1px solid ${C.border}`,
          background:C.surface, overflowY:'auto', display:'flex', flexDirection:'column', gap:0
        }}>
          <div style={{ padding:'16px 16px 12px', borderBottom:`1px solid ${C.border}` }}>
            <p style={{ margin:0, fontSize:11, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:'0.08em' }}>Contacto</p>
          </div>
          <div style={{ padding:16, display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ textAlign:'center', marginBottom:4 }}>
              <Avatar name={activeConv.contact_name} size={52} />
              <p style={{ margin:'10px 0 2px', fontWeight:700, color:C.text, fontSize:14 }}>{activeConv.contact_name}</p>
              <p style={{ margin:0, fontSize:11, color:C.muted }}>{activeConv.phone}</p>
            </div>
            {[
              ['🎰 Casino ID', activeConv.casino_user_id],
              ['👤 Login', activeConv.casino_login],
              ['🔑 Pass', activeConv.casino_password],
              ['🔗 Lead', activeConv.lead_id],
            ].map(([label, val]) => val ? (
              <div key={label} style={{ padding:'8px 10px', background:`${C.border}60`, borderRadius:8 }}>
                <p style={{ margin:0, fontSize:10, color:C.muted, marginBottom:2 }}>{label}</p>
                <p style={{ margin:0, fontSize:12, color:C.text, fontFamily:'monospace', wordBreak:'break-all' }}>{val}</p>
              </div>
            ) : null)}
            <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:8 }}>
              <Btn variant="primary" size="sm" onClick={() => setShowAction(true)} sx={{ justifyContent:'center' }}>
                ⚡ Acciones rápidas
              </Btn>
              {entityForReplies && (
                <Btn variant="blue" size="sm" onClick={() => setShowQuickReplies(true)} sx={{ justifyContent:'center' }}>
                  💬 Plantillas
                </Btn>
              )}
              <Btn
                variant={activeConv.bot_active ? 'danger' : 'success'}
                size="sm"
                onClick={() => toggleBot(activeConv, !activeConv.bot_active)}
                sx={{ justifyContent:'center' }}
              >
                {activeConv.bot_active ? '⏸ Pausar bot' : '▶ Activar bot'}
              </Btn>
              <Btn variant="ghost" size="sm" onClick={() => sendMessage(
                `👤 Usuario: ${activeConv.casino_login}\n🔑 Contraseña: ${activeConv.casino_password}\n\n🌐 ${cfgWithTenant?.casino_info?.url || '#'}`
              )} sx={{ justifyContent:'center' }}>
                📤 Compartir datos
              </Btn>
            </div>
          </div>
        </div>
      )}

      {showAction && activeConv && (
        <ActionModal
          conv={activeConv}
          casinoCfg={cfgWithTenant}
          isSubTenant={isSubTenant}
          onClose={() => setShowAction(false)}
          onDone={handleActionDone}
        />
      )}

      {showQuickReplies && activeConv && (
        <QuickRepliesModal
          entity={entityForReplies}
          conv={activeConv}
          onClose={() => setShowQuickReplies(false)}
          onPick={(text) => {
            setInput(text)
            setShowQuickReplies(false)
            setTimeout(() => inputRef.current?.focus(), 50)
          }}
        />
      )}

      {showSaleModal && activeConv && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setShowSaleModal(false) }}
          style={{
            position:'fixed', inset:0, zIndex:200,
            background:'rgba(0,0,0,0.7)', backdropFilter:'blur(4px)',
            display:'flex', alignItems:'center', justifyContent:'center', padding:16
          }}
        >
          <div style={{
            background:'#111420', border:'1px solid #1e2130',
            borderRadius:18, padding:'28px 28px 24px', width:'100%', maxWidth:380,
            boxShadow:'0 24px 60px rgba(0,0,0,0.6)'
          }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
              <div>
                <p style={{ margin:0, fontSize:16, fontWeight:700, color:'#E9E7E0' }}>💰 Registrar venta</p>
                <p style={{ margin:'3px 0 0', fontSize:12, color:'#4E5168' }}>
                  {activeConv.contact_name || activeConv.phone}
                </p>
              </div>
              <button onClick={() => setShowSaleModal(false)} style={{ background:'none', border:'none', color:'#4E5168', cursor:'pointer', fontSize:20, lineHeight:1, padding:4 }}>×</button>
            </div>
            <div style={{ background:'#080B12', border:'1px solid #1e2130', borderRadius:10, padding:'12px 14px', marginBottom:16 }}>
              <p style={{ margin:'0 0 8px', fontSize:11, fontWeight:700, color:'#4E5168', textTransform:'uppercase', letterSpacing:'0.08em' }}>Cliente</p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                {[
                  ['📱 Teléfono', activeConv.phone],
                  ['🎰 Casino ID', activeConv.casino_user_id],
                  ['👤 Login',    activeConv.casino_login],
                  ['📛 Nombre',   activeConv.contact_name],
                ].filter(([,v]) => v).map(([label, val]) => (
                  <div key={label}>
                    <p style={{ margin:0, fontSize:10, color:'#4E5168' }}>{label}</p>
                    <p style={{ margin:0, fontSize:12, color:'#E9E7E0', fontFamily:'monospace', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{val}</p>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ marginBottom:20 }}>
              <label style={{ fontSize:12, fontWeight:700, color:'#8B8E9F', textTransform:'uppercase', letterSpacing:'0.08em', display:'block', marginBottom:8 }}>
                Monto (ARS)
              </label>
              <div style={{ display:'flex', alignItems:'center', gap:0 }}>
                <span style={{ background:'#1e2130', border:'1px solid #1e2130', borderRight:'none', borderRadius:'10px 0 0 10px', padding:'11px 14px', fontSize:14, color:'#4E5168', fontFamily:'monospace' }}>$</span>
                <input
                  autoFocus type="number" min="0" placeholder="5000"
                  value={saleAmount}
                  onChange={e => setSaleAmount(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') registrarVenta() }}
                  style={{
                    flex:1, background:'#080B12', border:'1px solid #1e2130',
                    borderLeft:'none', borderRadius:'0 10px 10px 0',
                    padding:'11px 14px', color:'#E9E7E0', fontSize:16,
                    fontWeight:700, fontFamily:'monospace', outline:'none',
                    boxSizing:'border-box'
                  }}
                />
              </div>
            </div>
            {saleFlash && (
              <div style={{ marginBottom:14, padding:'10px 14px', borderRadius:9, fontSize:13, fontWeight:500,
                background: saleFlash.startsWith('✅') ? 'rgba(74,222,128,0.08)' : 'rgba(248,113,113,0.08)',
                border: `1px solid ${saleFlash.startsWith('✅') ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.2)'}`,
                color: saleFlash.startsWith('✅') ? '#4ade80' : '#f87171'
              }}>{saleFlash}</div>
            )}
            <div style={{ display:'flex', gap:10 }}>
              <button
                onClick={() => setShowSaleModal(false)}
                style={{ flex:1, padding:'12px', borderRadius:10, border:'1px solid #1e2130', background:'transparent', color:'#8B8E9F', fontSize:14, cursor:'pointer' }}
              >Cancelar</button>
              <button
                onClick={registrarVenta}
                disabled={!saleAmount || saleSaving}
                style={{
                  flex:2, padding:'12px', borderRadius:10, border:'none',
                  background: !saleAmount || saleSaving ? '#2a2d3a' : 'linear-gradient(135deg,#D4A843,#B8901F)',
                  color: !saleAmount || saleSaving ? '#4E5168' : '#080B12',
                  fontSize:14, fontWeight:700, cursor: !saleAmount || saleSaving ? 'not-allowed' : 'pointer',
                  boxShadow: !saleAmount || saleSaving ? 'none' : '0 4px 16px rgba(212,168,67,0.3)',
                  transition:'all .15s'
                }}
              >
                {saleSaving ? 'Guardando…' : '💰 Confirmar venta'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{
        position:'fixed', bottom:24, right:24, zIndex:9999,
        display:'flex', flexDirection:'column', gap:10, pointerEvents:'none'
      }}>
        {notifications.map(n => (
          <div
            key={n.id}
            onClick={() => {
              const conv = conversations.find(c => c.id === n.convId)
              if (conv) { setActiveConv(conv); if (isMobile) setMobileView('chat') }
              setNotifications(prev => prev.filter(x => x.id !== n.id))
            }}
            style={{
              pointerEvents:'all', cursor:'pointer',
              background:'#1a1d2e', border:'1px solid #D4A843',
              borderRadius:12, padding:'12px 16px', maxWidth:280, minWidth:220,
              boxShadow:'0 8px 24px rgba(0,0,0,.6)',
              animation:'slideIn .2s ease',
              display:'flex', alignItems:'flex-start', gap:10
            }}
          >
            <span style={{ fontSize:18, flexShrink:0 }}>📱</span>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ margin:0, fontSize:12, fontWeight:700, color:'#D4A843', marginBottom:3 }}>
                Nuevo mensaje
              </p>
              <p style={{ margin:0, fontSize:11, color:'#8b92b8', marginBottom:4, fontFamily:'monospace' }}>
                {n.phone}
              </p>
              <p style={{ margin:0, fontSize:12, color:'#E9E7E0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {n.body}
              </p>
            </div>
            <button
              onClick={e => { e.stopPropagation(); setNotifications(prev => prev.filter(x => x.id !== n.id)) }}
              style={{ background:'none', border:'none', color:'#4E5168', cursor:'pointer', fontSize:14, padding:0, flexShrink:0 }}
            >×</button>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes slideIn {
          from { opacity:0; transform:translateX(20px); }
          to   { opacity:1; transform:translateX(0); }
        }
      `}</style>

      {showOrdersPanel && (
        <PendingOrdersPanel
          onClose={() => setShowOrdersPanel(false)}
          onOpenChat={(phone) => {
            const conv = conversations.find(c => c.phone === phone)
            if (conv) { setActiveConv(conv); if (isMobile) setMobileView('chat') }
          }}
        />
      )}
    </div>
  )
}


function MessageMedia({ msg }) {
  const [url, setUrl] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    if (!msg.media_url) return
    ;(async () => {
      const { data, error } = await supabase.storage
        .from(MEDIA_BUCKET)
        .createSignedUrl(msg.media_url, 3600)
      if (cancelled) return
      if (error || !data?.signedUrl) { setError(true); return }
      setUrl(data.signedUrl)
    })()
    return () => { cancelled = true }
  }, [msg.media_url])

  if (error) {
    return (
      <div style={{
        padding:'8px 12px', background:'rgba(239,68,68,0.1)',
        border:'1px solid rgba(239,68,68,0.3)', borderRadius:8,
        fontSize:11, color:'#ef4444', marginBottom:6,
      }}>
        ⚠️ No se pudo cargar el archivo
      </div>
    )
  }

  if (msg.media_kind === 'image') {
    return (
      <div style={{ marginBottom: msg.body && !msg.body.startsWith('[') ? 6 : 0 }}>
        {url ? (
          <a href={url} target="_blank" rel="noopener noreferrer">
            <img
              src={url}
              alt={msg.media_filename || 'imagen'}
              style={{
                maxWidth:'100%', maxHeight:300, borderRadius:8,
                display:'block', cursor:'pointer',
              }}
            />
          </a>
        ) : (
          <div style={{
            width:200, height:150, background:'rgba(255,255,255,0.05)',
            borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:24,
          }}>📷</div>
        )}
      </div>
    )
  }

  return (
    <div style={{ marginBottom: msg.body && !msg.body.startsWith('[') ? 6 : 0 }}>
      <a
        href={url || '#'}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display:'flex', alignItems:'center', gap:10,
          padding:'10px 12px',
          background:'rgba(255,255,255,0.04)',
          border:'1px solid rgba(255,255,255,0.08)',
          borderRadius:8, textDecoration:'none', color:'inherit',
          cursor: url ? 'pointer' : 'default',
          opacity: url ? 1 : 0.6,
        }}
      >
        <span style={{ fontSize:24 }}>📄</span>
        <div style={{ flex:1, minWidth:0, overflow:'hidden' }}>
          <div style={{
            fontSize:13, fontWeight:600,
            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
          }}>
            {msg.media_filename || 'documento.pdf'}
          </div>
          <div style={{ fontSize:10.5, opacity:.6 }}>
            PDF · click para abrir
          </div>
        </div>
      </a>
    </div>
  )
}
