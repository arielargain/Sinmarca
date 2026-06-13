import { useEffect, useState, useCallback, useRef, lazy, Suspense } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate, Link as NavLink } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import {
  PageContainer, PageHeader, SectionHeader, Card,
  Button, IconButton, TabBar, SegmentedControl, Banner, Chip,
  StatCard, StatGrid,
  COLORS as C, RADIUS, FONT_SIZE, FONT_WEIGHT, FONT, TRANSITION, Z,
} from '../../components/ui'
import SecretField from '../../components/SecretField'
import IdentityBlock from '../../components/IdentityBlock'
import IntegrationsBlock from '../../components/IntegrationsBlock'
import ProductsBlock from '../../components/ProductsBlock'
import UsuariosCasinoPanel from '../../components/UsuariosCasinoPanel'
import RetailLanding from './RetailLanding'
import RetailBilling, { WalletHero } from './RetailBilling'
import RetailDashboard from './RetailDashboard'
import RetailLineas from './RetailLineas'
import RetailOnboarding from './RetailOnboarding'
import RetailCreditos from './RetailCreditos'
import RetailPrivacidad from './RetailPrivacidad'
import RetailTerminos from './RetailTerminos'
import RetailGrupo from './RetailGrupo'
import { callEdgeFunction } from '../../lib/callEdgeFunction'
import { CASINO_ACTION_URL } from '../../lib/constants'
import { getIdentityConfig, hasBotAction, shouldShowField } from '../../lib/identityConfig'
import Icon from '../../components/Icon'
import BusinessMenu from '../../components/BusinessMenu'
import RetailFooter from '../../components/RetailFooter'
import QuickRepliesEditor from '../../components/QuickRepliesEditor'
import OnboardingFAB from '../../components/OnboardingFAB'
// 14/05/2026 — RetailActivationWidget se movió a /mi-cuenta/billing (RetailBilling).
// El panel Inicio ahora muestra <WalletHero /> importado desde RetailBilling.

// ═══════════════════════════════════════════════════════════════════
// LAZY-LOADED — sub-rutas no críticas (14/05/2026, perf Sesión 2-A)
// ═══════════════════════════════════════════════════════════════════
// Estos componentes NO se cargan al entrar al panel: solo cuando el
// usuario navega a su ruta. Reduce ~600 KB del bundle inicial del
// panel retail después del login.
//
// Sub-rutas pesadas (~285 KB fuente):
const Chats         = lazy(() => import('../Chats'))
const Soporte       = lazy(() => import('../Soporte'))
const Contactos     = lazy(() => import('../Contactos'))
const AgendaPanel   = lazy(() => import('../../components/AgendaPanel'))
const AgendaConfig  = lazy(() => import('../../components/AgendaConfig'))
// PedidosPanel es export nombrado, no default — necesita un wrapper
const PedidosPanel  = lazy(() => import('../Pedidos').then(m => ({ default: m.PedidosPanel })))
const Campanas     = lazy(() => import('../Campanas'))

// Tutoriales / Instrucciones (~329 KB fuente, 16+4 archivos):
const Instrucciones                       = lazy(() => import('../Instrucciones'))
const InstruccionesBilleteras             = lazy(() => import('../InstruccionesBilleteras'))
const InstruccionesMP                     = lazy(() => import('../InstruccionesMP'))
const InstruccionesUala                   = lazy(() => import('../InstruccionesUala'))
const InstruccionesMODO                   = lazy(() => import('../InstruccionesMODO'))
const InstruccionesLemon                  = lazy(() => import('../InstruccionesLemon'))
const InstruccionesBelo                   = lazy(() => import('../InstruccionesBelo'))
const InstruccionesAgenteBot              = lazy(() => import('../InstruccionesAgenteBot'))
const InstruccionesAgenteBotCasino        = lazy(() => import('../InstruccionesAgenteBotCasino'))
const InstruccionesAgenteBotTienda        = lazy(() => import('../InstruccionesAgenteBotTienda'))
const InstruccionesAgenteBotMarketing     = lazy(() => import('../InstruccionesAgenteBotMarketing'))
const InstruccionesAgenteBotProfesional   = lazy(() => import('../InstruccionesAgenteBotProfesional'))
const InstruccionesNegocio                = lazy(() => import('../InstruccionesNegocio'))
const InstruccionesNegocioCasino          = lazy(() => import('../InstruccionesNegocioCasino'))
const InstruccionesNegocioTienda          = lazy(() => import('../InstruccionesNegocioTienda'))
const InstruccionesNegocioMarketing       = lazy(() => import('../InstruccionesNegocioMarketing'))
const InstruccionesNegocioProfesional     = lazy(() => import('../InstruccionesNegocioProfesional'))
// 17/05/2026 — 4 guías nuevas (sin sub-páginas por identity):
const InstruccionesLanding                = lazy(() => import('../InstruccionesLanding'))
// 18/05/2026 — Studio IA removido del panel retail (solo para tenants partner).
const InstruccionesClientes               = lazy(() => import('../InstruccionesClientes'))
const InstruccionesLineas                 = lazy(() => import('../InstruccionesLineas'))
const InstruccionesSaldo                  = lazy(() => import('../InstruccionesSaldo'))

// Fallback minimalista para Suspense — los tutoriales son páginas
// estáticas que descargan en milisegundos, no necesitan splash visible.
function RouteFallback() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '60px 20px', color: '#4E5168', fontSize: 13,
    }}>
      Cargando…
    </div>
  )
}

const fmtARS = (n) => '$' + Number(n || 0).toLocaleString('es-AR')
const SB_URL = import.meta.env.VITE_SUPABASE_URL || 'https://dvzxkortcvuakjhsidrr.supabase.co'

// ═══════════════════════════════════════════════════════════════════
// LAYOUT — header + nav tabs
// ═══════════════════════════════════════════════════════════════════
function RetailLayout({ children }) {
  const { retail, signOut } = useAuth()
  const nav = useNavigate()
  const location = useLocation()

  const identityConfig = getIdentityConfig(retail?.identity)

  // 12/05/2026 — Identities con dropdown 'Negocio': tienda + profesional + marketing.
  // Cada una con su propio label (BusinessMenu acepta prop label).
  // 15/05/2026 — Casino tambien tiene dropdown propio ("Mi casino") con Usuarios + Contactos + Catalogo.
  const isTienda      = retail?.identity === 'tienda'
  const isProfesional = retail?.identity === 'profesional'
  const isMarketing   = retail?.identity === 'marketing'
  const isCasino      = retail?.identity === 'casino'
  const hasBusinessMenu = isTienda || isProfesional || isMarketing || isCasino

  const businessMenuLabel =
    isTienda      ? 'Negocio'        :
    isProfesional ? 'Mi consultorio' :
    isMarketing   ? 'Mi negocio'     :
    isCasino      ? 'Mi casino'      :
                    'Negocio'

  const businessMenuIcon =
    isTienda      ? '🏪' :
    isProfesional ? '👔' :
    isMarketing   ? '📣' :
    isCasino      ? '🎰' :
                    '🏪'

  const tabs = [
    { id: '/mi-cuenta',              label: 'Inicio',        icon: '🏠' },
    // 15/05/2026 — El acceso al onboarding ahora es un boton flotante (FAB) abajo a la derecha,
    // no un tab del menu principal. Ver <OnboardingFAB /> mas abajo en este Layout.
    { id: '/mi-cuenta/chats',        label: 'Chats',         icon: '💬' },
    { id: '/mi-cuenta/ventas',       label: 'Ventas',        icon: '💰' },
    ...(hasBusinessMenu
      ? [{ id: '__business__', label: businessMenuLabel, icon: businessMenuIcon }]
      : []),
    { id: '/mi-cuenta/landing',      label: 'Landing',       icon: '🌐' },
    { id: '/mi-cuenta/agente-ia',    label: 'Agente IA',     icon: '🤖' },
    ...(!hasBusinessMenu
      ? [{ id: '/mi-cuenta/campanas', label: 'Campañas', icon: '📢' }]
      : []),
    ...(!hasBusinessMenu
      ? [{
          id: '/mi-cuenta/catalogo',
          label: 'Catálogo',
          LucideIcon: identityConfig.Icon,
          icon: '📋',
        }]
      : []),
    ...(!hasBusinessMenu
      ? [{ id: '/mi-cuenta/contactos', label: 'Contactos', icon: '👥' }]
      : []),
    { id: '/mi-cuenta/lineas',       label: 'Líneas',        icon: '📱' },
    { id: '/mi-cuenta/config',       label: 'Configuración', icon: '⚙️' },
    { id: '/mi-cuenta/billing',      label: 'Saldo',         icon: '💳' },
  ]

  const [businessOpen, setBusinessOpen] = useState(false)
  const [anchorRect, setAnchorRect]     = useState(null)

  const BUSINESS_PATHS = ['/mi-cuenta/catalogo', '/mi-cuenta/pedidos', '/mi-cuenta/agenda', '/mi-cuenta/contactos', '/mi-cuenta/usuarios-casino', '/mi-cuenta/campanas', '/mi-cuenta/grupo']

  const rawPath = location.pathname.replace(/\/$/, '') || '/mi-cuenta'
  const currentPath = (hasBusinessMenu && BUSINESS_PATHS.includes(rawPath)) ? '__business__' : rawPath

  const isChats = currentPath === '/mi-cuenta/chats'

  return (
    <div style={{
      height: isChats ? '100dvh' : 'auto',
      minHeight: isChats ? undefined : '100vh',
      overflow: isChats ? 'hidden' : 'visible',
      background: C.bg, color: C.text,
      display: 'flex', flexDirection: 'column',
    }}>
      <header style={{
        background: C.card,
        borderBottom: `1px solid ${C.border}`,
        padding: '14px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 12, flexShrink: 0,
      }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            fontSize: 12, fontFamily: FONT.mono, color: C.primaryLite,
            textTransform: 'uppercase', letterSpacing: '.18em', fontWeight: FONT_WEIGHT.bold,
          }}>Mi cuenta</div>
          <div style={{
            fontSize: 26, fontWeight: FONT_WEIGHT.black, color: C.text,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            marginTop: 6, letterSpacing: '-0.02em', lineHeight: 1.1,
          }}>{retail?.name || 'Cliente'}</div>
        </div>
        <Button variant='ghost' size='md' onClick={() => window.location.reload()} title='Actualizar'
          style={{ marginRight: 8, padding: '10px 14px', fontSize: 16, lineHeight: 1 }}>
          <svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.2' strokeLinecap='round' strokeLinejoin='round' style={{ display: 'block' }}>
            <path d='M21 12a9 9 0 0 1-9 9c-2.5 0-4.8-1-6.4-2.7L3 21' />
            <path d='M3 12a9 9 0 0 1 9-9c2.5 0 4.8 1 6.4 2.7L21 3' />
            <path d='M21 3v6h-6' />
            <path d='M3 21v-6h6' />
          </svg>
        </Button>
        <Button variant='ghost' size='md' onClick={signOut} style={{ padding: '10px 18px', fontSize: 14, fontWeight: 600 }}>Salir</Button>
      </header>

      <div style={{
        padding: '10px 16px', background: C.bg,
        borderBottom: `1px solid ${C.border}`,
        position: isChats ? 'static' : 'sticky',
        top: 0, zIndex: Z.sticky, flexShrink: 0,
        display: 'flex', justifyContent: 'center',
      }}>
        <TabBar value={currentPath}
          onChange={(id) => {
            if (id === '__business__') {
              const btn = Array.from(document.querySelectorAll('nav button, [role="tablist"] button, button'))
                .find(b => b && b.textContent && b.textContent.trim() === businessMenuLabel)
              if (btn) {
                const r = btn.getBoundingClientRect()
                setAnchorRect({ top: r.top, left: r.left, width: r.width, height: r.height })
              } else { setAnchorRect(null) }
              setBusinessOpen(o => !o)
              return
            }
            nav(id)
          }}
          tabs={tabs}
        />
        <BusinessMenu open={businessOpen} anchorRect={anchorRect}
          currentPath={rawPath} label={businessMenuLabel}
          items={isCasino ? [
            { id: 'usuarios',  label: 'Usuarios',  icon: '👤', href: '/mi-cuenta/usuarios-casino' },
            { id: 'contactos', label: 'Contactos', icon: '👥', href: '/mi-cuenta/contactos' },
            { id: 'catalogo',  label: 'Catálogo',  icon: '🛍️', href: '/mi-cuenta/catalogo'  },
            { id: 'campanas',  label: 'Campañas',  icon: '📢', href: '/mi-cuenta/campanas'  },
            // 22/05/2026 — Grupo (gestion grupos WhatsApp) vive dentro de 'Mi casino',
            // solo para arielargain3 (unico retail con esta funcion).
            ...(retail?.slug === 'arielargain3'
              ? [{ id: 'grupo', label: 'Grupo', icon: '👥', href: '/mi-cuenta/grupo' }]
              : []),
          ] : [
            { id: 'catalogo',  label: 'Catálogo',  icon: '🛍️', href: '/mi-cuenta/catalogo'  },
            { id: 'pedidos',   label: 'Pedidos',   icon: '📦', href: '/mi-cuenta/pedidos'   },
            { id: 'agenda',    label: 'Agenda',    icon: '🗓️', href: '/mi-cuenta/agenda'    },
            { id: 'contactos', label: 'Contactos', icon: '👥', href: '/mi-cuenta/contactos' },
            { id: 'campanas',  label: 'Campañas',  icon: '📢', href: '/mi-cuenta/campanas'  },
          ]}
          onSelect={(item) => { nav(item.href); setBusinessOpen(false) }}
          onClose={() => setBusinessOpen(false)}
        />
      </div>

      <main style={{
        flex: 1,
        padding: currentPath === '/mi-cuenta/chats' ? 0 : 'clamp(16px, 3vw, 24px)',
        maxWidth: currentPath === '/mi-cuenta/chats' ? 'none' : 'clamp(1200px, 90vw, 1600px)',
        width: '100%', margin: '0 auto', boxSizing: 'border-box',
        display: 'flex', flexDirection: 'column', minHeight: 0,
      }}>
        {children}
        {!isChats && <RetailFooter />}
      </main>
      {/* 15/05/2026 — FAB acceso al onboarding (en lugar de tab del menu).
          Componente movido a /components/OnboardingFAB.jsx con botón × para cerrar. */}
      <OnboardingFAB />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// HOME — Dashboard
// ═══════════════════════════════════════════════════════════════════
const PERIOD_OPTIONS = [
  { id: 24,  label: '24h',   labelCard: '24h'      },
  { id: 168, label: '7 días', labelCard: '7 días'  },
  { id: 720, label: '30 días', labelCard: '30 días' },
]
const PERIOD_DEFAULT = 24
const PERIOD_LS_KEY = 'cliente_dash_period_v1'

// ═══════════════════════════════════════════════════════════════════
// 15/05/2026 — INICIO: 4 cards de estado de configuracion
// (WhatsApp, Billetera, Bot, Negocio). CTA abre la pagina correspondiente.
// ═══════════════════════════════════════════════════════════════════
function SetupStatusCards() {
  const nav = useNavigate()
  const [state, setState] = useState(null)
  const [campaignsStatus, setCampaignsStatus] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const [obRes, campRes] = await Promise.all([
        supabase.rpc('get_my_retail_onboarding'),
        supabase.rpc('get_my_campaigns_status'),
      ])
      if (obRes.data && !obRes.data.error) setState(obRes.data.retail || null)
      if (campRes.data && !campRes.data.error) setCampaignsStatus(campRes.data)
    } catch (e) { console.error('SetupStatusCards load:', e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) {
    return <div style={{ height: 110, marginBottom: 22, color: C.muted, fontSize: FONT_SIZE.xs }}>Cargando estado…</div>
  }
  if (!state) return null

  const items = [
    {
      key: 'wa', icon: '💬', label: 'WhatsApp',
      ok: !!state.wa_phone_id || !!state.has_wasender_session,
      okLabel: 'Conectado', warnLabel: 'No conectado',
      ctaLabel: 'Conectar',
      onClick: () => nav('/mi-cuenta/lineas'),
    },
    {
      key: 'wallet', icon: '💳', label: 'Billetera',
      ok: !!state.wallet_provider_set,
      okLabel: state.wallet_provider ? `${state.wallet_provider}` : 'Configurada',
      warnLabel: 'Sin configurar',
      ctaLabel: 'Configurar',
      onClick: () => nav('/mi-cuenta/config'),
    },
    {
      key: 'bot', icon: '🤖', label: 'Bot',
      ok: !!state.bot_welcome_message || !!state.bot_prompt_set,
      okLabel: 'Personalizado', warnLabel: 'Sin personalizar',
      ctaLabel: 'Personalizar',
      onClick: () => nav('/mi-cuenta/agente-ia'),
    },
    {
      key: 'business', icon: '🏢', label: 'Negocio',
      ok: !!state.business_configured,
      okLabel: 'Configurado', warnLabel: 'Datos incompletos',
      ctaLabel: 'Completar',
      onClick: () => nav('/mi-cuenta/config'),
    },
    ...(campaignsStatus ? [{
      key: 'campaigns', icon: '📢', label: 'Campañas',
      ok: !!campaignsStatus.active,
      okLabel: campaignsStatus.active
        ? `${campaignsStatus.days_remaining || 0} días restantes`
        : 'Configurar',
      warnLabel: campaignsStatus.campaigns_until ? 'Vencidas' : 'No activadas',
      ctaLabel: campaignsStatus.campaigns_until ? 'Renovar' : 'Activar',
      onClick: () => nav('/mi-cuenta/campanas'),
    }] : []),
  ]

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: 12,
      marginBottom: 22,
    }}>
      {items.map(it => {
        const stateColor = it.ok ? '#34d399' : '#fbbf24'
        const stateLabel = it.ok ? it.okLabel : it.warnLabel
        return (
          <button
            key={it.key}
            type="button"
            onClick={it.onClick}
            style={{
              background: C.card,
              border: `1px solid ${it.ok ? C.border : '#fbbf2440'}`,
              borderRadius: RADIUS?.lg || 12,
              padding: 16,
              textAlign: 'left',
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: TRANSITION || 'all 0.15s ease',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              minHeight: 110,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = it.ok ? C.brand : '#fbbf24'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = it.ok ? C.border : '#fbbf2440'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 22 }}>{it.icon}</span>
              <span style={{
                fontSize: 10,
                fontFamily: FONT.mono,
                color: stateColor,
                fontWeight: FONT_WEIGHT.bold,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: stateColor, display: 'inline-block',
                }} />
                {it.ok ? 'OK' : 'PENDIENTE'}
              </span>
            </div>
            <div style={{
              fontSize: FONT_SIZE.sm, color: C.muted,
              fontFamily: FONT.mono, textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}>{it.label}</div>
            <div style={{
              fontSize: FONT_SIZE.base, color: C.text,
              fontWeight: FONT_WEIGHT.semibold,
            }}>{stateLabel}</div>
            <div style={{
              fontSize: FONT_SIZE.xs,
              color: it.ok ? C.muted : C.brand,
              marginTop: 'auto',
            }}>
              {it.ok ? 'Editar →' : `${it.ctaLabel} →`}
            </div>
          </button>
        )
      })}
    </div>
  )
}

function RetailHome() {
  const { retail, refreshRetail } = useAuth()
  const [period, setPeriod] = useState(() => {
    try {
      const saved = parseInt(localStorage.getItem(PERIOD_LS_KEY), 10)
      return [24, 168, 720].includes(saved) ? saved : PERIOD_DEFAULT
    } catch { return PERIOD_DEFAULT }
  })
  const [metrics, setMetrics] = useState(null)
  const [loadingMetrics, setLoadingMetrics] = useState(false)

  useEffect(() => { refreshRetail() }, [])

  useEffect(() => {
    let cancel = false
    async function load() {
      setLoadingMetrics(true)
      try {
        const { data, error } = await supabase.rpc('get_my_dashboard_metrics', {
          p_window_hours: period,
        })
        if (cancel) return
        if (!error && data?.ok) setMetrics(data)
        else if (error) console.error('[RetailHome] metrics error:', error)
      } catch (e) {
        if (!cancel) console.error('[RetailHome] metrics fetch:', e)
      } finally {
        if (!cancel) setLoadingMetrics(false)
      }
    }
    load()
    return () => { cancel = true }
  }, [period])

  useEffect(() => {
    try { localStorage.setItem(PERIOD_LS_KEY, String(period)) } catch {}
  }, [period])

  if (!retail) return <div style={{ color: C.muted, padding: 20 }}>Cargando…</div>

  const currentPeriod = PERIOD_OPTIONS.find(p => p.id === period) || PERIOD_OPTIONS[0]
  const periodChats = metrics?.kpis?.conversations ?? retail.conversations_today ?? 0
  const periodSales = metrics?.kpis?.sales_amount ?? retail.sales_today ?? 0
  const totalChats  = metrics?.totals_all?.conversations ?? retail.conversations_count ?? 0
  const totalSales  = metrics?.totals_all?.sales_amount ?? retail.sales_total ?? 0

  return (
    <div>
      <PageHeader
        eyebrow="Centro de control"
        title="Dashboard"
        subtitle="Métricas en tiempo real de tu landing, WhatsApp, bot y ventas."
      />

      <WalletHero retail={retail} />

      <SetupStatusCards />

      <RetailDashboard />

      <Card padding={18}>
        <SectionHeader title="Tu negocio" />
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 14, paddingLeft: 13,
        }}>
          <MetaItem
            label={retail.identity === 'profesional' ? 'Profesional' :
                   retail.identity === 'marketing'   ? 'Marca'       :
                   retail.identity === 'tienda'      ? 'Tienda'      :
                                                       'Nombre'}
            value={retail.casino_name || '—'}
          />
          <MetaItem
            label={retail.identity === 'marketing' || retail.identity === 'profesional' ? 'Sitio web' :
                   retail.identity === 'tienda' ? 'Link tienda' :
                                                  'URL'}
            value={retail.casino_url || '—'}
            mono
          />
          {shouldShowField('min_deposit', retail.identity) && (
            <MetaItem label="Mín. depósito" value={fmtARS(retail.min_deposit)} />
          )}
          {shouldShowField('min_withdrawal', retail.identity) && (
            <MetaItem label="Mín. retiro" value={fmtARS(retail.min_withdrawal)} />
          )}
          {shouldShowField('welcome_bonus_pct', retail.identity) && (
            <MetaItem label="Bono bienvenida"
              value={retail.welcome_bonus_pct ? `${retail.welcome_bonus_pct}%` : '—'}
            />
          )}
          {shouldShowField('schedule', retail.identity) && (
            <MetaItem label="Horario" value={retail.schedule || '—'} />
          )}
        </div>
      </Card>

      {!retail.wa_phone_id && retail.wa_provider !== 'wasender' && (
        <div style={{ marginTop: 14 }}>
          <Banner variant="warning" title="WhatsApp no configurado">
            Tu línea de WhatsApp todavía no está vinculada. Configurala desde{' '}
            <NavLink to="/mi-cuenta/lineas" style={{ color: C.brand, fontWeight: FONT_WEIGHT.semibold }}>Líneas</NavLink>{' '}
            para que los chats empiecen a aparecer acá.
          </Banner>
        </div>
      )}
    </div>
  )
}

function MetaItem({ label, value, mono }) {
  return (
    <div>
      <div style={{
        fontSize: FONT_SIZE.xs, fontFamily: FONT.mono, color: C.muted,
        textTransform: 'uppercase', letterSpacing: '.07em',
        fontWeight: FONT_WEIGHT.semibold, marginBottom: 3,
      }}>{label}</div>
      <div style={{
        fontSize: FONT_SIZE.base, color: C.text,
        fontFamily: mono ? FONT.mono : 'inherit', wordBreak: 'break-word',
      }}>{value}</div>
    </div>
  )
}

function RetailChats() { return <Chats /> }

// ═══════════════════════════════════════════════════════════════════
// MODAL: Registrar venta
// ═══════════════════════════════════════════════════════════════════
function RegisterSaleModal({ retail, activeConv, onClose, onDone }) {
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const save = async () => {
    const n = Number(amount)
    if (!n || n <= 0) { setError('Ingresá un monto válido'); return }
    setSaving(true); setError('')
    try {
      const { data: rpcData, error: rpcErr } = await supabase.rpc('retail_register_sale', {
        p_conversation_id: activeConv.id,
        p_amount: n, p_currency: 'ARS',
        p_customer_phone: activeConv.phone || null,
        p_customer_name:  activeConv.contact_name || null,
        p_notes:          notes.trim() || null,
      })
      if (rpcErr) throw rpcErr

      const saleId = rpcData?.sale_id
      const hasMetaToken = !!rpcData?.has_meta_token
      let metaOk = null

      if (saleId && hasMetaToken) {
        try {
          const { data: { session } } = await supabase.auth.getSession()
          const res = await fetch(`${SB_URL}/functions/v1/meta-conversion`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session?.access_token || ''}`,
            },
            body: JSON.stringify({ sale_id: saleId }),
          })
          const out = await res.json()
          metaOk = !!out.success
        } catch { metaOk = false }
      }

      let finalMsg = '✓ Venta registrada'
      if (hasMetaToken && metaOk === true)  finalMsg = '✓ Venta registrada + enviada a Meta'
      if (hasMetaToken && metaOk === false) finalMsg = '✓ Venta registrada (Meta falló)'
      if (!hasMetaToken)                    finalMsg = '✓ Venta registrada (Meta no configurado)'

      onDone(finalMsg)
    } catch (e) {
      setError(e.message || 'Error al guardar')
    } finally { setSaving(false) }
  }

  return (
    <ModalShell title="💰 Registrar venta" onClose={onClose}>
      <div style={{ fontSize: FONT_SIZE.md, color: C.muted, marginBottom: 14 }}>
        Cliente: <strong style={{ color: C.text }}>{activeConv.contact_name || activeConv.phone}</strong>
      </div>
      <FieldMini label="Monto (ARS)">
        <input type="number" value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="5000" autoFocus style={fi}
        />
      </FieldMini>
      <FieldMini label="Nota (opcional)" hint="Descripción interna de la venta">
        <input value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Primer depósito, promo bienvenida..."
          style={fi} maxLength={120}
        />
      </FieldMini>
      {retail?.has_meta_token ? (
        <Banner variant="success" size="sm">
          <strong>Meta conectado</strong> — se disparará el evento <code>Purchase</code> al Pixel{' '}
          <code>{retail?.meta_pixel_id?.slice(-6)}</code>.
        </Banner>
      ) : (
        <Banner variant="tip" size="sm">
          <strong>Meta no configurado</strong> — la venta se registra pero no se envía a Meta Ads.
        </Banner>
      )}
      {error && (
        <div style={{
          color: C.danger, fontSize: FONT_SIZE.md, marginTop: 10,
          textAlign: 'center', fontWeight: FONT_WEIGHT.semibold,
        }}>{error}</div>
      )}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button variant="success" onClick={save} disabled={saving || !amount} loading={saving}>
          {saving ? 'Guardando…' : 'Registrar →'}
        </Button>
      </div>
    </ModalShell>
  )
}

// ═══════════════════════════════════════════════════════════════════
// MODAL: Acciones del casino
// ═══════════════════════════════════════════════════════════════════
function ActionModal({ conv, casinoCfg, onClose, onDone }) {
  const [tab, setTab] = useState('info')
  const [amount, setAmount] = useState('')
  const [newPass, setNewPass] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const hasCasino = !!casinoCfg?.has_casino
  const identity = casinoCfg?.identity || 'casino'
  const isCasino = identity === 'casino'
  const identityCfg = getIdentityConfig(identity)
  const IdentityIcon = identityCfg.Icon

  const callCasino = async (area, extraParams = {}) => {
    if (!hasCasino) {
      setResult({ ok: false, data: { error: 'Casino no configurado. Cargá tus credenciales desde Configuración.' } })
      return
    }
    setLoading(true); setResult(null)
    let payload
    if (area === 'createuser') { payload = { action: 'createuser' } }
    else if (area === 'balance') {
      const action = extraParams.operation === 'in' ? 'balance_in' : 'balance_out'
      const rawAmount = String(extraParams.amount || '').replace(/^-/, '')
      payload = {
        action, user_id: conv.casino_user_id,
        amount: Number(rawAmount),
        currency: extraParams.balance_currency || 'ARS',
        conversation_id: conv.id,
      }
    } else {
      setResult({ ok: false, data: { error: `Acción desconocida: ${area}` } })
      setLoading(false); return
    }
    try {
      const { ok, data, status } = await callEdgeFunction(CASINO_ACTION_URL, payload)
      if (!ok) {
        setResult({ ok: false, data: { error: data?.error || data?.detail || `HTTP ${status}` } })
        setLoading(false); return
      }
      const inner = data?.data || {}
      const innerOk = !!inner.successMessage
      setResult({ ok: innerOk, data: inner })
      if (innerOk) {
        if (area === 'createuser') onDone('createuser', inner)
        else if (area === 'balance') onDone('balance', inner)
      }
    } catch (e) {
      setResult({ ok: false, data: { error: e.message } })
    }
    setLoading(false)
  }

  const handleResetPassword = async () => {
    if (!hasCasino) {
      setResult({ ok: false, data: { error: 'Casino no configurado para tu cuenta.' } })
      return
    }
    if (!newPass || newPass.length < 4) {
      setResult({ ok: false, data: { error: 'La contraseña debe tener al menos 4 caracteres.' } })
      return
    }
    setLoading(true); setResult(null)
    try {
      const { ok, data, status } = await callEdgeFunction(CASINO_ACTION_URL, {
        action: 'changepassword',
        user_id: conv.casino_user_id,
        new_password: newPass,
        conversation_id: conv.id,
      })
      if (!ok) {
        setResult({ ok: false, data: { error: data?.error || data?.detail || `HTTP ${status}` } })
        setLoading(false); return
      }
      const inner = data?.data || {}
      const innerOk = !!inner.successMessage
      setResult({
        ok: innerOk,
        msg: innerOk ? `Contraseña actualizada a: ${newPass}` : '',
        data: { ...inner, password: newPass },
      })
    } catch (e) {
      setResult({ ok: false, data: { error: e.message } })
    }
    setLoading(false)
  }

  const tabs = [
    { id: 'info',     label: 'Datos',     icon: '👤' },
    { id: 'credit',   label: 'Créditos',  icon: '💰' },
    { id: 'password', label: 'Password',  icon: '🔑' },
    { id: 'create',   label: 'Alta',      icon: '✨' },
  ]

  return (
    <ModalShell title={`⚡ Acciones — ${conv.contact_name || conv.phone}`} onClose={onClose}>
      {!isCasino && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 14, padding: '32px 24px', textAlign: 'center',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: `${identityCfg.accent}15`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: identityCfg.accent,
          }}>
            {IdentityIcon ? <IdentityIcon size={28} strokeWidth={1.8} /> : null}
          </div>
          <div style={{ fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: C.text }}>
            Acciones para {identityCfg.label.toLowerCase()}
          </div>
          <div style={{ fontSize: FONT_SIZE.sm, color: C.muted, maxWidth: 460, lineHeight: 1.55 }}>
            Las acciones de <strong>crear cuenta + acreditar saldo + cambiar contraseña</strong> son específicas
            del identity Casino. Tu bot <strong>({identityCfg.label})</strong> ya atiende consultas, captura leads
            y deriva al equipo según tus reglas de escalación configuradas en{' '}
            <strong>Agente IA → Razonamiento del agente</strong>.
            <br/><br/>
            Las acciones manuales sobre el chat (registrar venta, exportar, etc.) están en el panel de Chats.
            Si necesitás un workflow específico para tu negocio, escribinos a <strong style={{ color: C.brand }}>soporte@innovate-ia.com</strong>.
          </div>
          <Button variant="primary" onClick={onClose}>Volver al chat</Button>
        </div>
      )}

      {isCasino && !hasCasino && (
        <Banner variant="warning" title="Casino no configurado">
          Tu cuenta todavía no tiene credenciales de casino propias.
          Las acciones abajo no funcionarán hasta que las cargues desde Configuración.
        </Banner>
      )}

      {isCasino && (
        <div style={{ marginTop: hasCasino ? 0 : 12, marginBottom: 16 }}>
          <TabBar value={tab} onChange={setTab} tabs={tabs} size="sm" />
        </div>
      )}

      {isCasino && tab === 'info' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            ['Casino User ID', conv.casino_user_id],
            ['Login', conv.casino_login],
            ['Contraseña', conv.casino_password],
            ['Teléfono', conv.phone],
          ].map(([label, value]) => (
            <div key={label} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 14px', background: C.surface,
              border: `1px solid ${C.border}`, borderRadius: RADIUS.md, gap: 10,
            }}>
              <span style={{
                fontSize: FONT_SIZE.sm, color: C.muted,
                fontWeight: FONT_WEIGHT.semibold, textTransform: 'uppercase',
                letterSpacing: '.06em', fontFamily: FONT.mono,
              }}>{label}</span>
              <span style={{
                fontSize: FONT_SIZE.base, color: C.text, fontFamily: FONT.mono,
                textAlign: 'right', wordBreak: 'break-all',
              }}>{value || '—'}</span>
            </div>
          ))}
          {conv.casino_login && (
            <Button variant="primary"
              onClick={() => {
                const msg = `👤 Usuario: ${conv.casino_login}\n🔑 Contraseña: ${conv.casino_password}\n\n🌐 Ingresá al casino: ${casinoCfg?.casino_url || ''}`
                onDone('share', { msg })
                onClose()
              }}
            ><Icon e="📤"/> Compartir datos al cliente</Button>
          )}
        </div>
      )}

      {isCasino && tab === 'credit' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ margin: 0, fontSize: FONT_SIZE.base, color: C.muted }}>Acreditar o descontar saldo del cliente en el casino.</p>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Monto en ARS (ej: 5000)" style={fi} />
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="success" disabled={!amount || loading || !hasCasino} loading={loading}
              onClick={() => callCasino('balance', { operation: 'in', send: 'true', amount: `-${amount}`, balance_currency: 'ARS' })}
              style={{ flex: 1 }}
            ><Icon e="➕"/> Acreditar</Button>
            <Button variant="danger" disabled={!amount || loading || !hasCasino} loading={loading}
              onClick={() => callCasino('balance', { operation: 'out', send: 'true', amount, balance_currency: 'ARS' })}
              style={{ flex: 1 }}
            ><Icon e="➖"/> Descontar</Button>
          </div>
          {result && (
            <Banner variant={result.ok ? 'success' : 'danger'}>
              {result.ok ? result.data.successMessage || 'Operación exitosa' : result.data.errorMessage?.[0] || result.data.error || 'Error'}
            </Banner>
          )}
        </div>
      )}

      {isCasino && tab === 'password' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {!conv.casino_user_id ? (
            <Banner variant="tip">Este contacto todavía no tiene cuenta creada. Usá la tab "Alta" primero.</Banner>
          ) : (
            <>
              <div style={{ padding: '10px 14px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: RADIUS.md }}>
                <div style={{
                  fontSize: FONT_SIZE.xs, color: C.muted, textTransform: 'uppercase',
                  letterSpacing: '.06em', fontFamily: FONT.mono,
                  fontWeight: FONT_WEIGHT.semibold, marginBottom: 3,
                }}>Contraseña actual</div>
                <div style={{ fontSize: 15, fontFamily: FONT.mono, color: C.brand, fontWeight: FONT_WEIGHT.bold }}>{conv.casino_password || '—'}</div>
              </div>
              <FieldMini label="Nueva contraseña (opcional)" hint="Dejá vacío para que el casino genere una automáticamente">
                <input type="text" value={newPass}
                  onChange={e => setNewPass(e.target.value)}
                  placeholder="Ej: 4821" maxLength={20}
                  style={{ ...fi, fontFamily: FONT.mono }}
                />
              </FieldMini>
              <Button variant="primary" disabled={loading || !hasCasino} loading={loading} onClick={handleResetPassword}>
                <Icon e="🔑"/> Resetear contraseña
              </Button>
              {result && (
                <Banner variant={result.ok ? 'success' : 'danger'}>
                  {result.ok ? result.msg : result.data?.error || 'Error'}
                </Banner>
              )}
              {result?.ok && (
                <Button variant="secondary"
                  onClick={() => {
                    onDone('share', {
                      msg: `🔑 Tu contraseña fue actualizada:\n\n👤 Usuario: ${conv.casino_login}\n🔑 Nueva contraseña: ${result.data.password || newPass}\n\n🌐 ${casinoCfg?.casino_url || ''}`
                    })
                    onClose()
                  }}
                ><Icon e="📤"/> Enviar nueva contraseña al cliente</Button>
              )}
            </>
          )}
        </div>
      )}

      {isCasino && tab === 'create' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {conv.casino_user_id ? (
            <Banner variant="tip">
              Este contacto ya tiene cuenta: <strong style={{ color: C.brand, fontFamily: FONT.mono }}>{conv.casino_login}</strong>
            </Banner>
          ) : (
            <>
              <p style={{ margin: 0, fontSize: FONT_SIZE.base, color: C.muted }}>Crear una cuenta nueva en el casino para este contacto.</p>
              <Button variant="primary" disabled={loading || !hasCasino} loading={loading}
                onClick={() => callCasino('createuser', { group: '5', sended: 'true' })}
              ><Icon e="✨"/> Crear usuario ahora</Button>
            </>
          )}
          {result && (
            <Banner variant={result.ok ? 'success' : 'danger'}>
              {result.ok ? `Usuario ${result.data.login} creado. Contraseña: ${result.data.password}` : result.data?.error || 'Error al crear'}
            </Banner>
          )}
        </div>
      )}
    </ModalShell>
  )
}

// ═══════════════════════════════════════════════════════════════════
// VENTAS
// ═══════════════════════════════════════════════════════════════════
function RetailVentas() {
  const { retail } = useAuth()
  const [data, setData] = useState({ sales: [], kpis: { count_confirmed: 0, total_confirmed: 0, avg_ticket: 0 }, breakdown: {} })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [preset, setPreset] = useState('30d')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [statusFilter, setStatusFilter] = useState([])
  const [exportMenuOpen, setExportMenuOpen] = useState(false)
  const exportMenuRef = useRef(null)

  const computeRange = useCallback(() => {
    const now = new Date()
    if (preset === 'custom') {
      return {
        from: customFrom ? new Date(customFrom + 'T00:00:00').toISOString() : null,
        to: customTo ? new Date(customTo + 'T23:59:59').toISOString() : now.toISOString(),
      }
    }
    if (preset === 'today' || preset === 'yesterday') {
      const AR_OFFSET_MIN = -180
      const arNow = new Date(now.getTime() + (AR_OFFSET_MIN - now.getTimezoneOffset()) * 60000)
      const y = arNow.getFullYear(), m = arNow.getMonth(), d = arNow.getDate()
      const todayStartUtcMs = Date.UTC(y, m, d, 0, 0, 0) - AR_OFFSET_MIN * 60000
      const dayMs = 24 * 60 * 60 * 1000
      if (preset === 'today') {
        return { from: new Date(todayStartUtcMs).toISOString(), to: now.toISOString() }
      }
      return {
        from: new Date(todayStartUtcMs - dayMs).toISOString(),
        to:   new Date(todayStartUtcMs).toISOString(),
      }
    }
    const map = { '7d': 7, '30d': 30, '90d': 90, 'all': null }
    const days = map[preset]
    if (days === null) return { from: null, to: now.toISOString() }
    const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    return { from: from.toISOString(), to: now.toISOString() }
  }, [preset, customFrom, customTo])

  const load = useCallback(async () => {
    if (!retail?.id) return
    setLoading(true); setError(null)
    try {
      const { from, to } = computeRange()
      const { data: r, error: err } = await supabase.rpc('get_my_retail_sales_filtered', {
        p_from: from, p_to: to,
        p_status: statusFilter.length > 0 ? statusFilter : null,
        p_limit: 1000,
      })
      if (err) throw err
      setData({
        sales: r?.sales || [],
        kpis: r?.kpis || { count_confirmed: 0, total_confirmed: 0, avg_ticket: 0 },
        breakdown: r?.breakdown || {},
      })
    } catch (e) {
      setError(e.message || 'Error cargando ventas')
    } finally { setLoading(false) }
  }, [retail?.id, computeRange, statusFilter])

  useEffect(() => { load() }, [load])

  const toggleStatus = (s) => {
    setStatusFilter(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }

  useEffect(() => {
    if (!exportMenuOpen) return
    const handler = (e) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) setExportMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [exportMenuOpen])

  const handleExport = (format) => {
    if (data.sales.length === 0) { alert('No hay ventas para exportar'); setExportMenuOpen(false); return }
    setExportMenuOpen(false)
    try {
      const ts = new Date().toISOString().slice(0, 10)
      const filename = `ventas-${retail?.slug || 'export'}-${ts}.${format}`
      const rows = data.sales.map(s => ({
        id: s.id, fecha: s.created_at,
        cliente: s.customer_name || '',
        telefono: s.customer_phone || '',
        dni: s.customer_dni || '',
        monto: Number(s.amount || 0),
        moneda: s.currency || 'ARS',
        status: s.status || '', origen: s.source || '',
        tipo: s.order_type || '',
        mp_payment_id: s.mp_payment_id || '',
        notas: s.notes || '',
        cancelado_en: s.cancelled_at || '',
        razon_cancelacion: s.cancel_reason || '',
      }))
      let blob
      if (format === 'json') {
        const payload = JSON.stringify({
          sub_tenant: retail?.slug,
          generado_en: new Date().toISOString(),
          total_filas: rows.length,
          kpis: data.kpis, ventas: rows,
        }, null, 2)
        blob = new Blob([payload], { type: 'application/json;charset=utf-8' })
      } else {
        const headers = Object.keys(rows[0])
        const escape = (v) => {
          if (v === null || v === undefined) return ''
          let s = typeof v === 'object' ? JSON.stringify(v) : String(v)
          s = s.replace(/"/g, '""')
          return /[",\n\r;]/.test(s) ? `"${s}"` : s
        }
        const lines = [headers.join(',')]
        for (const row of rows) lines.push(headers.map(h => escape(row[h])).join(','))
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
    }
  }

  const inputStyle = {
    background: C.surface, border: `1px solid ${C.border}`,
    borderRadius: RADIUS.md, color: C.text, padding: '8px 10px',
    fontFamily: FONT.mono, fontSize: FONT_SIZE.sm, outline: 'none',
  }

  const allStatusKeys = Object.keys(data.breakdown || {})
  const statusColor = (s) => ({
    confirmed: C.success, cancelled: C.danger, approved: C.success,
    paid: C.success, pending: C.warning,
  }[s] || C.muted)

  return (
    <div>
      <PageHeader eyebrow="Centro de ventas" title="Ventas"
        subtitle="Todas las ventas que el bot generó automáticamente desde WhatsApp."
      />

      <Card style={{ marginBottom: 14, padding: 14 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: preset === 'custom' ? 10 : 0 }}>
          <span style={{ fontSize: FONT_SIZE.sm, color: C.muted, marginRight: 4 }}>Período:</span>
          {[
            { id: 'today',     label: 'Hoy' },
            { id: 'yesterday', label: 'Ayer' },
            { id: '7d',        label: '7 días' },
            { id: '30d',       label: '30 días' },
            { id: '90d',       label: '90 días' },
            { id: 'all',       label: 'Todo' },
            { id: 'custom',    label: 'Personalizado' },
          ].map(opt => (
            <button key={opt.id} onClick={() => setPreset(opt.id)}
              style={{
                background: preset === opt.id ? C.brand : C.surface,
                color: preset === opt.id ? '#000' : C.text,
                border: `1px solid ${preset === opt.id ? C.brand : C.border}`,
                borderRadius: RADIUS.md, padding: '6px 12px',
                fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.medium,
                cursor: 'pointer', transition: TRANSITION,
              }}
            >{opt.label}</button>
          ))}
        </div>
        {preset === 'custom' && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <label style={{ fontSize: FONT_SIZE.sm, color: C.muted }}>Desde:</label>
            <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} style={inputStyle} />
            <label style={{ fontSize: FONT_SIZE.sm, color: C.muted }}>Hasta:</label>
            <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} style={inputStyle} />
          </div>
        )}
      </Card>

      {allStatusKeys.length > 0 && (
        <Card style={{ marginBottom: 14, padding: 14 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: FONT_SIZE.sm, color: C.muted, marginRight: 4 }}>Status:</span>
            {allStatusKeys.map(s => {
              const active = statusFilter.includes(s)
              const stat = data.breakdown[s] || { count: 0 }
              return (
                <button key={s} onClick={() => toggleStatus(s)}
                  style={{
                    background: active ? statusColor(s) : C.surface,
                    color: active ? '#000' : C.text,
                    border: `1px solid ${active ? statusColor(s) : C.border}`,
                    borderRadius: 999, padding: '5px 11px',
                    fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.medium,
                    cursor: 'pointer', transition: TRANSITION,
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                  }}
                >
                  {s}
                  <span style={{
                    background: active ? 'rgba(0,0,0,.2)' : C.bg,
                    padding: '1px 7px', borderRadius: 999,
                    fontSize: 11, fontFamily: FONT.mono,
                  }}>{stat.count}</span>
                </button>
              )
            })}
            {statusFilter.length > 0 && (
              <button onClick={() => setStatusFilter([])}
                style={{
                  background: 'transparent', color: C.muted, border: 'none',
                  fontSize: FONT_SIZE.sm, cursor: 'pointer', textDecoration: 'underline',
                }}
              >Limpiar filtros</button>
            )}
          </div>
        </Card>
      )}

      {error && <Banner type="error" style={{ marginBottom: 14 }}>{error}</Banner>}

      {loading ? (
        <div style={{ color: C.muted, padding: 20 }}>Cargando ventas…</div>
      ) : (<>
        <StatGrid minWidth={150} style={{ marginBottom: 18 }}>
          <StatCard icon="💰" label="Total acumulado" value={fmtARS(data.kpis.total_confirmed)} accent="success" hint="Confirmadas en el rango" />
          <StatCard icon="📊" label="Ventas confirmadas" value={data.kpis.count_confirmed} accent="info" />
          <StatCard icon="🎟️" label="Ticket promedio" value={fmtARS(data.kpis.avg_ticket)} accent="info" />
        </StatGrid>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ fontSize: FONT_SIZE.sm, color: C.muted }}>
            Mostrando <b style={{ color: C.text }}>{data.sales.length}</b> {data.sales.length === 1 ? 'venta' : 'ventas'}
          </div>
          <div ref={exportMenuRef} style={{ position:'relative' }}>
            <Button onClick={() => setExportMenuOpen(o => !o)} variant="secondary" disabled={data.sales.length === 0}>
              📥 Exportar {exportMenuOpen ? '▲' : '▼'}
            </Button>
            {exportMenuOpen && (
              <div style={{
                position:'absolute', top:'calc(100% + 6px)', right:0,
                zIndex:50, background:C.surface,
                border:`1px solid ${C.border}`, borderRadius:RADIUS.md,
                minWidth:180, boxShadow:'0 8px 24px rgba(0,0,0,0.4)', overflow:'hidden',
              }}>
                <div style={{
                  padding:'8px 12px 6px', fontSize:9, fontWeight:600,
                  color:C.muted, letterSpacing:'0.08em',
                  textTransform:'uppercase', fontFamily:FONT.mono,
                  borderBottom:`1px solid ${C.border}`,
                }}>{data.sales.length} ventas</div>
                <button onClick={() => handleExport('csv')}
                  style={{ display:'flex', alignItems:'center', gap:10, width:'100%',
                    padding:'10px 14px', background:'transparent', border:'none',
                    color:C.text, fontSize:FONT_SIZE.sm, fontWeight:500, cursor:'pointer', textAlign:'left',
                  }}>
                  <span>📄</span><span>CSV (Excel)</span>
                </button>
                <button onClick={() => handleExport('json')}
                  style={{ display:'flex', alignItems:'center', gap:10, width:'100%',
                    padding:'10px 14px', background:'transparent', border:'none',
                    color:C.text, fontSize:FONT_SIZE.sm, fontWeight:500, cursor:'pointer', textAlign:'left',
                  }}>
                  <span>{'{ }'}</span><span>JSON</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {data.sales.length === 0 ? (
          <Card padding={0} style={{ borderStyle: 'dashed' }}>
            <div style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ fontSize: 42, marginBottom: 14, opacity: 0.7 }}>💰</div>
              <div style={{ fontSize: 16, color: C.text, fontWeight: FONT_WEIGHT.semibold }}>No hay ventas en este rango</div>
              <div style={{ fontSize: FONT_SIZE.sm, color: C.muted, marginTop: 6 }}>Probá ampliar el período o quitar filtros de status</div>
            </div>
          </Card>
        ) : (
          <Card padding={0}>
            {data.sales.map((s, i) => (
              <div key={s.id} style={{
                padding: '13px 16px',
                borderBottom: i < data.sales.length - 1 ? `1px solid ${C.border}` : 'none',
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', gap: 12,
              }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{
                    fontSize: FONT_SIZE.base, color: C.text,
                    fontWeight: FONT_WEIGHT.semibold,
                    display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
                  }}>
                    {s.customer_name || s.customer_phone || 'Cliente'}
                    {s.status !== 'confirmed' && (
                      <span style={{
                        fontSize: 10, padding: '1px 7px', borderRadius: 999,
                        background: statusColor(s.status) + '22',
                        color: statusColor(s.status),
                        fontWeight: FONT_WEIGHT.bold, textTransform: 'uppercase',
                        letterSpacing: 0.5,
                      }}>{s.status}</span>
                    )}
                  </div>
                  <div style={{
                    fontSize: FONT_SIZE.sm, color: C.muted,
                    fontFamily: FONT.mono, marginTop: 2,
                  }}>
                    {s.created_at ? new Date(s.created_at).toLocaleString('es-AR') : ''}
                    {s.customer_phone && s.customer_name ? ` • ${s.customer_phone}` : ''}
                  </div>
                </div>
                <div style={{
                  fontSize: 15,
                  color: s.status === 'cancelled' ? C.muted : C.success,
                  fontWeight: FONT_WEIGHT.bold, fontFamily: FONT.mono,
                  whiteSpace: 'nowrap',
                  textDecoration: s.status === 'cancelled' ? 'line-through' : 'none',
                }}>{fmtARS(s.amount)}</div>
              </div>
            ))}
          </Card>
        )}
      </>)}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════════
const SUB_WALLET_PROVIDER_META = {
  mercadopago: { slug: 'mp-confirm',    label: '🔗 URL para Mercado Pago → Notificaciones' },
  uala:        { slug: 'uala-confirm',  label: '🔗 URL para Ualá Bis → Webhooks' },
  modo:        { slug: 'modo-confirm',  label: '🔗 Callback URL para MODO' },
  lemon:       { slug: 'lemon-confirm', label: '🔗 Webhook URL para Lemon Business' },
  belo:        { slug: 'belo-confirm',  label: '🔗 Webhook URL para Belo Developers' },
}

function WalletWebhookUrlBoxCliente({ provider }) {
  const SB_URL_INNER = import.meta.env.VITE_SUPABASE_URL || 'https://dvzxkortcvuakjhsidrr.supabase.co'
  const meta = SUB_WALLET_PROVIDER_META[provider]
  const [copied, setCopied] = useState(false)

  if (!meta) return null
  const url = `${SB_URL_INNER}/functions/v1/${meta.slug}`

  const copy = () => {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div>
      <p style={{
        fontSize: FONT_SIZE.xs, fontFamily: FONT.mono, color: C.muted,
        textTransform: 'uppercase', letterSpacing: '.08em',
        margin: '0 0 6px', fontWeight: FONT_WEIGHT.semibold,
      }}>{meta.label}</p>
      <div style={{
        background: C.surface || C.card,
        border: `1px solid ${C.border}`,
        borderRadius: RADIUS.md, padding: '9px 12px',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: 10,
      }}>
        <code style={{
          fontSize: FONT_SIZE.sm, fontFamily: FONT.mono,
          wordBreak: 'break-all', color: C.brand, userSelect: 'all',
        }}>{url}</code>
        <Button variant="ghost" size="sm" onClick={copy}>{copied ? '✓' : 'Copiar'}</Button>
      </div>
      <p style={{
        fontSize: FONT_SIZE.xs, color: C.muted,
        margin: '6px 0 0', lineHeight: 1.5,
      }}>Pegá esta URL en el portal del proveedor como webhook/callback de notificaciones.</p>
    </div>
  )
}

function SubTenantMetaPixelSection({ form, setForm, retail, set }) {
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const hasPixel = !!form.meta_pixel_id
  const hasToken = !!retail?.has_meta_token
  const ownerEmail = retail?.meta_pixel_owner_email
  const ownerUserId = retail?.meta_pixel_owner_user_id
  const isOwner = !!retail?.is_meta_pixel_owner
  const isLockedByOther = !!ownerUserId && !isOwner

  const handleTest = async () => {
    setTesting(true); setTestResult(null)
    try {
      const { data, error } = await supabase.functions.invoke('meta-conversion', {
        body: { event_name: 'Lead', phone: '5493400000000', amount: 1 },
      })
      if (error) throw error
      setTestResult({ ok: !!data?.success, eventId: data?.event_id, reason: data?.reason })
    } catch (e) {
      setTestResult({ ok: false, error: e.message || String(e) })
    } finally { setTesting(false) }
  }

  return (
    <Card padding={18} style={{ marginBottom: 14 }}>
      <SectionHeader title="📊 Tracking Meta Pixel + CAPI" style={{ marginBottom: 6 }} />
      <p style={{ fontSize: FONT_SIZE.sm, color: C.muted, margin: '0 0 14px', lineHeight: 1.55 }}>
        Conectá tu Pixel de Meta para que el bot envíe automáticamente el evento{' '}
        <code style={{ color: C.brand, fontFamily: FONT.mono }}>Purchase</code> a tus campañas de Facebook/Instagram Ads cada vez que un cliente paga.
      </p>

      {isLockedByOther && (
        <div style={{
          background: 'rgba(212,168,67,0.10)',
          border: `1px solid ${C.brand}`,
          borderRadius: 10, padding: '12px 14px',
          fontSize: FONT_SIZE.sm, color: C.text, lineHeight: 1.55,
          display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14,
        }}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>🔒</span>
          <div style={{ flex: 1 }}>
            <p style={{ margin: '0 0 3px', fontWeight: FONT_WEIGHT.semibold, color: C.brand }}>
              Configurado por {ownerEmail || 'otro usuario'}
            </p>
            <p style={{ margin: 0, color: C.muted, fontSize: FONT_SIZE.xs }}>
              Solo {ownerEmail || 'ese usuario'} puede modificar el Pixel ID, Access Token y Test Event Code.
            </p>
          </div>
        </div>
      )}

      {!isLockedByOther && (
        <div style={{
          background: 'rgba(212,168,67,0.06)',
          border: `1px solid rgba(212,168,67,0.25)`,
          borderRadius: 8, padding: '10px 14px',
          fontSize: FONT_SIZE.sm, color: C.text, lineHeight: 1.55, marginBottom: 14,
        }}>
          ¿No sabés cómo conseguir estos datos?{' '}
          <NavLink to="/mi-cuenta/instrucciones/negocio"
            style={{ color: C.brand, textDecoration: 'underline', fontWeight: FONT_WEIGHT.semibold }}
          >Tutorial paso a paso →</NavLink>
        </div>
      )}

      <FieldMini label="Pixel ID" hint={isLockedByOther ? 'Solo el dueño del registro puede modificarlo.' : 'Solo dígitos. Lo encontrás en Meta Events Manager → Data Sources'}>
        <input value={form.meta_pixel_id || ''} onChange={set('meta_pixel_id')} disabled={isLockedByOther}
          style={{
            ...fi, fontFamily: FONT.mono,
            ...(isLockedByOther ? { opacity: 0.55, cursor: 'not-allowed', background: 'rgba(78,81,104,0.08)' } : {}),
          }}
          placeholder="1234567890123456"
        />
      </FieldMini>

      <FieldMini label="Access Token (CAPI)" hint={isLockedByOther ? 'Solo el dueño del registro puede modificarlo.' : 'Generalo en Events Manager → Settings → Conversions API → Generate Access Token'}>
        <SecretField label="" hasValue={hasToken}
          value={form.meta_access_token || ''}
          onChange={(e) => setForm(f => ({ ...f, meta_access_token: e.target.value }))}
          placeholder="EAAxxxxxxxxxxx..."
          provider="meta" readOnly={isLockedByOther}
          readOnlyHint={isLockedByOther ? `Configurado por ${ownerEmail || 'otro usuario'}.` : null}
        />
      </FieldMini>

      <FieldMini label="Test Event Code (opcional)" hint={isLockedByOther ? 'Solo el dueño del registro puede modificarlo.' : 'Solo para pruebas.'}>
        <input value={form.meta_test_event_code || ''} onChange={set('meta_test_event_code')} disabled={isLockedByOther}
          style={{
            ...fi, fontFamily: FONT.mono,
            ...(isLockedByOther ? { opacity: 0.55, cursor: 'not-allowed', background: 'rgba(78,81,104,0.08)' } : {}),
          }}
          placeholder="TEST75"
        />
      </FieldMini>

      {hasPixel && hasToken && (
        <div style={{ marginTop: 4, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <Button variant="ghost" type="button" onClick={handleTest} disabled={testing} loading={testing}>
              {testing ? 'Enviando…' : '🧪 Enviar evento de prueba (Lead)'}
            </Button>
            <p style={{ fontSize: FONT_SIZE.sm, color: C.muted, margin: 0, flex: 1, minWidth: 180 }}>
              Verificá en{' '}
              <a href="https://www.facebook.com/events_manager2/list/dataset/test_events"
                target="_blank" rel="noopener noreferrer"
                style={{ color: C.brand, textDecoration: 'underline' }}
              >Test Events ↗</a>
            </p>
          </div>

          {testResult && (
            <div style={{
              marginTop: 12,
              background: testResult.ok ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)',
              border: `1px solid ${testResult.ok ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
              borderRadius: 8, padding: '10px 14px',
              fontSize: FONT_SIZE.sm, color: C.text, lineHeight: 1.55,
            }}>
              {testResult.ok ? (
                <><strong style={{ color: '#22c55e' }}>✓ Evento enviado correctamente.</strong>{' '}
                Event ID: <code style={{ fontFamily: FONT.mono, color: C.brand }}>{testResult.eventId}</code>.</>
              ) : (
                <><strong style={{ color: '#ef4444' }}>✗ Falló el envío.</strong>{' '}
                {testResult.reason === 'pixel_not_configured'
                  ? 'Guardá primero el Pixel ID y el Access Token.'
                  : (testResult.error || 'Revisá las credenciales en Meta.')}</>
              )}
            </div>
          )}
        </div>
      )}

      {(!hasPixel || !hasToken) && (
        <p style={{
          fontSize: FONT_SIZE.xs, color: C.muted,
          margin: '8px 0 0', fontStyle: 'italic',
        }}>
          💡 Cargá el Pixel ID y el Access Token, guardá los cambios, y después vas a poder probar el envío de eventos.
        </p>
      )}
    </Card>
  )
}

function RetailConfig() {
  const { retail, refreshRetail } = useAuth()
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  // 21/05: colapsable del módulo Plataforma de casino (mismo patrón que Agenda nativa)
  const [casinoOpen, setCasinoOpen] = useState(false)
  const initedRef = useRef(false)

  useEffect(() => {
    if (retail && !initedRef.current) {
      initedRef.current = true
      setForm({
        casino_name:         retail.casino_name || '',
        casino_url:          retail.casino_url || '',
        min_deposit:         retail.min_deposit ?? '',
        min_withdrawal:      retail.min_withdrawal ?? '',
        welcome_bonus_pct:   retail.welcome_bonus_pct ?? '',
        schedule:            retail.schedule || '',
        wa_phone_id:         retail.wa_phone_id || '',
        bot_welcome_message: retail.bot_welcome_message || '',
        bot_info_message:    retail.bot_info_message || '',
        contact_email:       retail.contact_email || '',
        contact_phone:       retail.contact_phone || '',
        qr_cvu:              retail.qr_cvu || '',
        qr_credentials:      retail.qr_credentials || '👤 Usuario: {usuario}\n🔑 Contraseña: {clave}\n🔗 Link: {link}',
        qr_access_link:      retail.qr_access_link || '',
        qr_custom:           Array.isArray(retail.qr_custom) ? retail.qr_custom : [],
        bot_personality:     retail.bot_personality || 'amigable',
        bot_language:        retail.bot_language || 'es-AR',
        remarketing_enabled:        !!retail.remarketing_enabled,
        remarketing_link_msg1:      retail.remarketing_link_msg1 || '',
        remarketing_link_msg2:      retail.remarketing_link_msg2 || '',
        remarketing_cuenta_msg1:    retail.remarketing_cuenta_msg1 || '',
        remarketing_cuenta_msg2:    retail.remarketing_cuenta_msg2 || '',
        remarketing_step1_hours:    retail.remarketing_step1_hours ?? 24,
        remarketing_step2_hours:    retail.remarketing_step2_hours ?? 72,
        google_analytics_id:        retail.google_analytics_id || '',
        google_tag_manager:         retail.google_tag_manager || '',
        tiktok_pixel_id:            retail.tiktok_pixel_id || '',
        meta_tag:                   retail.meta_tag || '',
        custom_head_code:           retail.custom_head_code || '',
        meta_pixel_id:              retail.meta_pixel_id || '',
        meta_test_event_code:       retail.meta_test_event_code || '',
        casino_host:         retail.casino_host || '',
        casino_hall_id:      retail.casino_hall_id || '',
        casino_token:        '',
        wallet_provider:     retail.wallet_provider || '',
        wallet_token:        '',
        wallet_secret:       '',
        mp_webhook_secret:   '',
        wa_token:                  '',
        meta_app_secret:           '',
        meta_access_token_landing: '',
        meta_access_token:         '',
      })
    }
  }, [retail])

  if (!form) return <div style={{ color: C.muted, padding: 20 }}>Cargando…</div>

  const set = (k) => (e) => {
    const v = e?.target?.type === 'checkbox' ? e.target.checked : (e?.target?.value ?? e)
    setForm(f => ({ ...f, [k]: v }))
  }

  const save = async () => {
    setSaving(true); setMsg('')
    try {
      const cleanCustom = (form.qr_custom || [])
        .map(q => ({ label: String(q?.label || '').trim(), text: String(q?.text || '').trim() }))
        .filter(q => q.label && q.text)
        .slice(0, 4)

      const patch = {
        casino_name:         form.casino_name || null,
        casino_url:          form.casino_url || null,
        min_deposit:         Number(form.min_deposit) || null,
        min_withdrawal:      Number(form.min_withdrawal) || null,
        welcome_bonus_pct:   Number(form.welcome_bonus_pct) || null,
        schedule:            form.schedule || null,
        wa_phone_id:         form.wa_phone_id || null,
        bot_welcome_message: form.bot_welcome_message || null,
        bot_info_message:    form.bot_info_message || null,
        bot_personality:     form.bot_personality || null,
        bot_language:        form.bot_language || null,
        contact_email:       form.contact_email || null,
        contact_phone:       form.contact_phone || null,
        qr_cvu:              form.qr_cvu || null,
        qr_credentials:      form.qr_credentials || null,
        qr_access_link:      form.qr_access_link || null,
        qr_custom:           cleanCustom,
        remarketing_enabled:     !!form.remarketing_enabled,
        remarketing_link_msg1:   form.remarketing_link_msg1 || null,
        remarketing_link_msg2:   form.remarketing_link_msg2 || null,
        remarketing_cuenta_msg1: form.remarketing_cuenta_msg1 || null,
        remarketing_cuenta_msg2: form.remarketing_cuenta_msg2 || null,
        remarketing_step1_hours: Number(form.remarketing_step1_hours) || null,
        remarketing_step2_hours: Number(form.remarketing_step2_hours) || null,
        google_analytics_id: form.google_analytics_id || null,
        google_tag_manager:  form.google_tag_manager || null,
        tiktok_pixel_id:     form.tiktok_pixel_id || null,
        meta_tag:            form.meta_tag || null,
        custom_head_code:    form.custom_head_code || null,
        meta_pixel_id:        form.meta_pixel_id || null,
        meta_test_event_code: form.meta_test_event_code || null,
      }
      const { error: errSettings } = await supabase.rpc('update_my_retail_settings', { p_patch: patch })
      if (errSettings) throw errSettings

      const casinoLocked = !!(retail?.has_casino_token && !retail?.casino_token_owned_by_sub)
      if (!casinoLocked) {
        const { error: errCasino } = await supabase.rpc('set_my_retail_casino_creds', {
          p_casino_host:    form.casino_host ?? null,
          p_casino_hall_id: form.casino_hall_id ?? null,
          p_casino_token:   form.casino_token ? form.casino_token : null,
        })
        if (errCasino) throw errCasino
      }

      const walletLocked = !!(retail?.has_wallet_token && !retail?.wallet_token_owned_by_sub)
      if (!walletLocked) {
        const { error: errWallet } = await supabase.rpc('set_my_retail_wallet_creds', {
          p_wallet_provider:   form.wallet_provider ?? null,
          p_wallet_token:      form.wallet_token ? form.wallet_token : null,
          p_mp_webhook_secret: form.mp_webhook_secret ? form.mp_webhook_secret : null,
          p_wallet_secret:     form.wallet_secret ? form.wallet_secret : null,
        })
        if (errWallet) throw errWallet
      }

      const platformParams = {}
      if (form.wa_token)                    platformParams.p_wa_token                    = form.wa_token
      if (form.meta_app_secret)             platformParams.p_meta_app_secret             = form.meta_app_secret
      if (form.meta_access_token_landing)   platformParams.p_meta_access_token_landing   = form.meta_access_token_landing
      if (form.meta_access_token)           platformParams.p_meta_access_token           = form.meta_access_token
      if (Object.keys(platformParams).length > 0) {
        const { error: errPlatform } = await supabase.rpc('set_my_retail_platform_secrets', platformParams)
        if (errPlatform) throw errPlatform
      }

      await refreshRetail()
      setForm(f => ({
        ...f,
        casino_token: '', wallet_token: '', wallet_secret: '', mp_webhook_secret: '',
        wa_token: '', meta_access_token: '', meta_access_token_landing: '',
        meta_app_secret: '',
      }))
      setMsg('✓ Guardado')
      setTimeout(() => setMsg(''), 2500)
    } catch (e) {
      const msg = e.message || 'Error'
      if (msg.includes('meta_pixel_owner_locked')) {
        const ownerEmail = retail?.meta_pixel_owner_email || 'otro usuario'
        setMsg(`🔒 No podés modificar el Pixel/Token: configurados por ${ownerEmail}.`)
      } else {
        setMsg('⚠ ' + msg)
      }
    } finally { setSaving(false) }
  }

  const businessNameLabel =
    retail?.identity === 'tienda'      ? 'Nombre de la tienda'    :
    retail?.identity === 'marketing'   ? 'Nombre de la marca'     :
    retail?.identity === 'profesional' ? 'Nombre profesional'     :
                                         'Nombre del negocio'
  const businessUrlLabel =
    retail?.identity === 'tienda'                                              ? 'Link de la tienda' :
    retail?.identity === 'marketing' || retail?.identity === 'profesional'     ? 'Sitio web'         :
                                                                                 'URL del negocio'

  return (
    <div>
      <PageHeader eyebrow="Centro de configuración" title="Configuración"
        subtitle="Los datos de tu negocio, los mensajes del bot y las credenciales de tu plataforma y billetera."
      />

      <IdentityBlock tenant={retail} onChanged={refreshRetail} />
      <IntegrationsBlock tenant={retail} />

      {/* 21/05/2026 — Plataforma de casino. Mismo diseño que "Agenda nativa"
          (módulo dentro de "Conectar mi negocio vía API"): contenedor con
          fondo oscuro (C.bg), header con badge de estado y cuerpo colapsable
          que se despliega al clickear. Solo identity casino. */}
      {(retail?.identity || 'casino') === 'casino' && (() => {
        const configured = !!retail?.has_casino_token
        const badge = configured
          ? { bg: 'rgba(34,197,94,0.10)', fg: '#22c55e', label: '● Activa' }
          : { bg: 'rgba(120,120,120,0.06)', fg: C.muted, label: '○ No configurado' }
        const acciones = ['Crear usuario', 'Acreditar saldo', 'Consultar balance']
        return (
        <Card padding={18} style={{ marginBottom: 14 }}>
          <SectionHeader title="🎰 Plataforma de casino" style={{ marginBottom: 6 }}/>
          <p style={{ fontSize: FONT_SIZE.sm, color: C.muted, margin: '0 0 14px', lineHeight: 1.5 }}>
            Las credenciales de tu motor de casino. El bot las usa para
            crear usuarios y acreditar saldo automáticamente.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{
              border: `1px solid ${C.border}`,
              borderRadius: RADIUS.md,
              background: C.bg,
              overflow: 'hidden',
            }}>
              {/* Header del módulo (clickeable para expandir) */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', cursor: 'pointer',
              }}
                   onClick={() => setCasinoOpen(o => !o)}>
                <span style={{ fontSize: 20 }}>🎰</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.semibold, color: C.text }}>
                    Motor de casino
                  </div>
                  <div style={{ fontSize: FONT_SIZE.xs, color: C.muted, marginTop: 2, lineHeight: 1.4 }}>
                    Crear usuarios, acreditar saldo y consultar balances automáticamente.
                  </div>
                </div>
                <span style={{
                  padding: '4px 10px', borderRadius: 999,
                  background: badge.bg, color: badge.fg,
                  fontSize: 10, fontWeight: FONT_WEIGHT.bold,
                  textTransform: 'uppercase', letterSpacing: '.05em',
                  fontFamily: FONT.mono, whiteSpace: 'nowrap',
                }}>{badge.label}</span>
                <span style={{ fontSize: FONT_SIZE.sm, color: C.muted, marginLeft: 4 }}>
                  {casinoOpen ? '▲' : '▼'}
                </span>
              </div>

              {/* Chips de acciones */}
              <div style={{ padding: '0 14px 12px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {acciones.map(a => (
                  <span key={a} style={{
                    padding: '3px 9px',
                    background: 'rgba(120,120,120,0.08)',
                    border: `1px solid ${C.border}`,
                    borderRadius: 999, fontSize: 10, color: C.muted, fontFamily: FONT.mono,
                  }}>{a}</span>
                ))}
              </div>

              {/* Cuerpo expandible — credenciales */}
              {casinoOpen && (
                <div style={{ padding: '4px 14px 16px', borderTop: `1px solid ${C.border}` }}>
                  <div style={{ marginTop: 14 }}>
                    <Row>
                      <FieldMini label="Host del panel de casino" hint="Ej: admin.tucasino.bet (sin https://)">
                        <input value={form.casino_host || ''} onChange={set('casino_host')} style={fi} placeholder="admin.tucasino.bet" />
                      </FieldMini>
                      <FieldMini label="Hall ID" hint="El ID de tu sala en la plataforma">
                        <input value={form.casino_hall_id || ''} onChange={set('casino_hall_id')} style={fi} placeholder="0000000" />
                      </FieldMini>
                    </Row>
                    <div style={{ marginTop: 12 }}>
                      <SecretField
                        label="API Token del casino"
                        hasValue={!!retail?.has_casino_token}
                        value={form.casino_token}
                        onChange={(e) => setForm(f => ({ ...f, casino_token: e.target.value }))}
                        placeholder="Token de la API de tu casino"
                        hint="Token de admin de tu plataforma de casino. Se cifra al guardarse. Dejá vacío para conservar el actual."
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
        )
      })()}

      <div data-tour="cliente-billetera">
      <Card padding={18} style={{ marginBottom: 14 }}>
        <SectionHeader title="💳 Billetera virtual" style={{ marginBottom: 6 }} />
        <p style={{ fontSize: FONT_SIZE.sm, color: C.muted, margin: '0 0 14px', lineHeight: 1.5 }}>
          Con qué billetera cobrás los depósitos de tus clientes. Si no configurás una,
          el bot no puede generar links de pago automáticos y <strong>cada carga se escala a un operador</strong>.
        </p>
        {!form.wallet_provider && (
          <div style={{
            background: 'rgba(251, 191, 36, 0.08)',
            border: `1px solid rgba(251, 191, 36, 0.35)`,
            borderRadius: 8, padding: '10px 12px',
            marginBottom: 14, fontSize: FONT_SIZE.sm,
            color: '#fbbf24', lineHeight: 1.5,
          }}>
            <Icon e="⚠️"/> Sin billetera configurada: cuando un cliente pida cargar, el bot le dirá
            que un operador lo va a contactar y te notificará. No se generan links automáticos.
          </div>
        )}
        <FieldMini label="Proveedor">
          <select value={form.wallet_provider || ''} onChange={set('wallet_provider')} style={{ ...fi, cursor: 'pointer' }}>
            <option value="">— Sin billetera (cada carga se escala al operador) —</option>
            <option value="mercadopago">Mercado Pago</option>
            <option value="uala">Ualá Bis</option>
            <option value="modo">MODO</option>
            <option value="lemon">Lemon Cash</option>
            <option value="belo">Belo</option>
          </select>
        </FieldMini>
        {form.wallet_provider && (
          <>
            <SecretField
              label={
                form.wallet_provider === 'mercadopago' ? 'Access Token de Mercado Pago' :
                form.wallet_provider === 'uala'        ? 'Client ID de Ualá Bis' :
                form.wallet_provider === 'modo'        ? 'Client ID de MODO' :
                form.wallet_provider === 'lemon'       ? 'API Key de Lemon Cash' :
                form.wallet_provider === 'belo'        ? 'API Key de Belo' :
                'Access token'
              }
              hasValue={!!retail?.has_wallet_token}
              value={form.wallet_token}
              onChange={(e) => setForm(f => ({ ...f, wallet_token: e.target.value }))}
              placeholder={
                form.wallet_provider === 'mercadopago' ? 'APP_USR-...' :
                form.wallet_provider === 'uala'        ? 'uala_live_...' :
                form.wallet_provider === 'modo'        ? 'modo_app_...' :
                form.wallet_provider === 'lemon'       ? 'lk_live_...' :
                form.wallet_provider === 'belo'        ? 'belo_live_pk_...' :
                'Access token'
              }
              hint={
                form.wallet_provider === 'mercadopago' ? 'Access token de producción de tu cuenta Mercado Pago. Se cifra al guardarse.' :
                form.wallet_provider === 'uala'        ? 'Client ID de tu integración en uala-bis.com.ar/developers. Se cifra al guardarse.' :
                form.wallet_provider === 'modo'        ? 'Client ID de tu app en empresas.modo.com.ar. Se cifra al guardarse.' :
                form.wallet_provider === 'lemon'       ? 'API Key de Lemon Business. Permisos mínimos: payments + webhooks. Se cifra al guardarse.' :
                form.wallet_provider === 'belo'        ? 'API Key de Belo Developers. Scopes mínimos: payments. Se cifra al guardarse.' :
                'Se cifra al guardarse.'
              }
              helpUrl={
                form.wallet_provider === 'mercadopago' ? 'https://www.mercadopago.com.ar/developers/panel/app' :
                form.wallet_provider === 'uala'        ? 'https://uala-bis.com.ar/developers' :
                form.wallet_provider === 'modo'        ? 'https://empresas.modo.com.ar/developers' :
                form.wallet_provider === 'lemon'       ? 'https://business.lemon.me/developers' :
                form.wallet_provider === 'belo'        ? 'https://pay.belo.app/developers' :
                null
              }
              helpText="Ir al portal del proveedor"
              provider={form.wallet_provider}
            />

            {form.wallet_provider === 'mercadopago' && (
              <div style={{ marginTop: 12 }}>
                <SecretField
                  label="Webhook Secret de Mercado Pago"
                  hasValue={!!retail?.has_mp_webhook_secret}
                  value={form.mp_webhook_secret}
                  onChange={(e) => setForm(f => ({ ...f, mp_webhook_secret: e.target.value }))}
                  placeholder="Secret del webhook"
                  hint="Se usa para validar las notificaciones de MP. Lo generás en el panel de MP. Se cifra al guardarse."
                />
              </div>
            )}

            {(form.wallet_provider === 'uala' ||
              form.wallet_provider === 'modo' ||
              form.wallet_provider === 'lemon' ||
              form.wallet_provider === 'belo') && (
              <div style={{ marginTop: 12 }}>
                <SecretField
                  label={
                    form.wallet_provider === 'uala'  ? 'Client Secret de Ualá Bis' :
                    form.wallet_provider === 'modo'  ? 'Client Secret de MODO' :
                    form.wallet_provider === 'lemon' ? 'Webhook Secret de Lemon' :
                    form.wallet_provider === 'belo'  ? 'Webhook Secret de Belo' :
                    'Secret'
                  }
                  hasValue={!!retail?.has_wallet_secret}
                  value={form.wallet_secret}
                  onChange={(e) => setForm(f => ({ ...f, wallet_secret: e.target.value }))}
                  placeholder={
                    form.wallet_provider === 'uala'  ? 'uala_secret_...' :
                    form.wallet_provider === 'modo'  ? 'modo_sk_...' :
                    form.wallet_provider === 'lemon' ? 'whsec_...' :
                    form.wallet_provider === 'belo'  ? 'belo_whsec_...' :
                    'Secret'
                  }
                  hint="Solo se muestra una vez en el portal del proveedor. Se cifra al guardarse."
                />
              </div>
            )}

            <div style={{ marginTop: 12 }}>
              <WalletWebhookUrlBoxCliente provider={form.wallet_provider} />
            </div>
            <NavLink
              to={`/mi-cuenta/instrucciones/billeteras/${
                form.wallet_provider === 'mercadopago' ? 'mercado-pago' :
                form.wallet_provider === 'uala'        ? 'uala' :
                form.wallet_provider === 'modo'        ? 'modo' :
                form.wallet_provider === 'lemon'       ? 'lemon' :
                form.wallet_provider === 'belo'        ? 'belo' : ''
              }`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: FONT_SIZE.xs,
                color: C.brand,
                textDecoration: 'underline',
                textDecorationColor: 'rgba(212,168,67,0.3)',
                marginTop: 10,
              }}
            >
              📖 Ver guía paso a paso para conseguir las credenciales →
            </NavLink>
          </>
        )}
      </Card>
      </div>

      <SubTenantMetaPixelSection form={form} setForm={setForm} retail={retail} set={set} />

      {/* 15/05/2026 — Bloque unificado "Tu negocio y contacto" movido al final de la página.
          Combina los 2 cards anteriores ("🏢 Tu negocio" + "👤 Tus datos de contacto") en uno solo. */}
      <Card padding={18} style={{ marginBottom: 14 }}>
        <SectionHeader title="🏢 Tu negocio y contacto" style={{ marginBottom: 14 }}/>
        <Row>
          <FieldMini label={businessNameLabel}>
            <input value={form.casino_name} onChange={set('casino_name')} style={fi} />
          </FieldMini>
          <FieldMini label={businessUrlLabel} hint="https://...">
            <input value={form.casino_url} onChange={set('casino_url')} style={fi} />
          </FieldMini>
        </Row>
        {shouldShowField('min_deposit', retail?.identity) && (
          <Row>
            <FieldMini label="Depósito mínimo (ARS)">
              <input type="number" value={form.min_deposit||''} onChange={set('min_deposit')} style={fi} />
            </FieldMini>
            <FieldMini label="Retiro mínimo (ARS)">
              <input type="number" value={form.min_withdrawal||''} onChange={set('min_withdrawal')} style={fi} />
            </FieldMini>
          </Row>
        )}
        {shouldShowField('welcome_bonus_pct', retail?.identity) && (
          <Row>
            <FieldMini label="Bono de bienvenida (%)">
              <input type="number" value={form.welcome_bonus_pct||''} onChange={set('welcome_bonus_pct')} style={fi} />
            </FieldMini>
            <FieldMini label="Horario de retiros">
              <input value={form.schedule||''} onChange={set('schedule')} style={fi} />
            </FieldMini>
          </Row>
        )}
        {['tienda','marketing','profesional'].includes(retail?.identity) && (
          <Row>
            <FieldMini label={
              retail.identity === 'tienda' ? 'Horario de atención'
              : retail.identity === 'marketing' ? 'Horario laboral'
              : 'Horario del estudio'
            } hint="Ej: Lun a Vie 9 a 18hs">
              <input value={form.schedule||''} onChange={set('schedule')} style={fi} />
            </FieldMini>
            <div />
          </Row>
        )}
        {/* Separador visual sutil entre datos del negocio y datos de contacto */}
        <div style={{
          margin: '18px 0 14px',
          borderTop: `1px solid ${C.border}`,
        }} />
        <Row>
          <FieldMini label="Email de contacto">
            <input type="email" value={form.contact_email} onChange={set('contact_email')} style={fi} />
          </FieldMini>
          <FieldMini label="Teléfono de contacto">
            <input value={form.contact_phone} onChange={set('contact_phone')} style={fi} />
          </FieldMini>
        </Row>
      </Card>

      <div style={{
        position: 'sticky', bottom: 0,
        background: `linear-gradient(to bottom, transparent, ${C.bg} 40%)`,
        padding: '16px 0 8px', display: 'flex',
        justifyContent: 'flex-end', alignItems: 'center',
        gap: 12, marginTop: 8, zIndex: Z.sticky,
      }}>
        {msg && (
          <span style={{
            fontSize: FONT_SIZE.md,
            color: msg.startsWith('✓') ? C.success : C.warning,
            fontWeight: FONT_WEIGHT.semibold,
          }}>{msg}</span>
        )}
        <Button variant="primary" size="lg" onClick={save} disabled={saving} loading={saving}>
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════
const fi = {
  width: '100%', background: C.bg,
  border: `1px solid ${C.border}`, borderRadius: RADIUS.md,
  padding: '10px 12px', color: C.text,
  fontSize: FONT_SIZE.base, outline: 'none',
  boxSizing: 'border-box', fontFamily: 'inherit',
}

function FieldMini({ label, hint, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{
        fontSize: FONT_SIZE.xs, color: C.muted,
        textTransform: 'uppercase', letterSpacing: '.08em',
        display: 'block', marginBottom: 5,
        fontFamily: FONT.mono, fontWeight: FONT_WEIGHT.semibold,
      }}>{label}</label>
      {children}
      {hint && (
        <p style={{
          fontSize: FONT_SIZE.sm, color: C.muted,
          margin: '4px 0 0', lineHeight: 1.45,
        }}>{hint}</p>
      )}
    </div>
  )
}

function Row({ children }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: 12,
    }}>{children}</div>
  )
}

function ModalShell({ title, onClose, children }) {
  return (
    <div onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.78)',
        backdropFilter: 'blur(4px)',
        zIndex: Z.modal,
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: 16,
      }}
    >
      <div onClick={e => e.stopPropagation()}
        style={{
          background: C.card, border: `1px solid ${C.border}`,
          borderRadius: RADIUS.xl, width: '100%', maxWidth: 520,
          maxHeight: '88vh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        }}
      >
        <div style={{
          padding: '14px 18px',
          borderBottom: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: 10, flexShrink: 0,
        }}>
          <h3 style={{
            margin: 0, color: C.text, fontSize: 15,
            fontWeight: FONT_WEIGHT.bold, lineHeight: 1.3,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{title}</h3>
          <IconButton icon="×" variant="ghost" size={30} onClick={onClose} title="Cerrar" />
        </div>
        <div style={{ padding: 16, overflowY: 'auto', flex: 1 }}>{children}</div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// CATÁLOGO
// ═══════════════════════════════════════════════════════════════════
function RetailCatalogo() {
  const { retail, refreshRetail } = useAuth()
  const identity = retail?.identity || 'casino'
  const sellsServices = identity === 'marketing' || identity === 'profesional'
  const noun        = sellsServices ? 'servicios' : 'productos'
  const nounCap     = sellsServices ? 'Servicios' : 'Productos'

  return (
    <div>
      <PageHeader
        eyebrow="Centro de catálogo"
        title={nounCap}
        subtitle={`Cargá tus ${noun}. El bot los muestra, genera el link de pago y entrega activos digitales automáticamente.`}
      />
      <ProductsBlock tenant={retail} onChanged={refreshRetail} />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// AGENTE IA — full UI (razonamiento profundo + remarketing + recursos)
// ═══════════════════════════════════════════════════════════════════
// PROMPT_EJEMPLOS_RETAIL — chips contextuales por identity para el editor de bot_prompt
const PROMPT_EJEMPLOS_RETAIL = {
  casino: [
    'Siempre mencioná el bono de bienvenida al saludar.',
    'Si el cliente pregunta por bonos VIP, decile que escriba "VIP".',
    'No dar información sobre otros casinos.',
    'Aclará que los retiros tienen un plazo de hasta 24hs.',
    'Si pregunta por promos, decí que están en nuestras redes.',
  ],
  tienda: [
    'Aclará que los envíos son por OCA o Andreani.',
    'Si pregunta por stock, derivá al catálogo web.',
    'Ofrecé descuento por compra de 3 o más unidades.',
    'No vendemos por mayor sin acuerdo previo.',
    'Tiempo de entrega: 3-5 días hábiles en CABA y GBA.',
  ],
  marketing: [
    'Empezá pidiendo nombre y rubro del cliente.',
    'Si el presupuesto del cliente es menor a $100k, derivá igual.',
    'No menciones precios concretos sin antes calificar al lead.',
    'Ofrecé siempre una reunión de diagnóstico gratuita.',
    'Si pregunta por casos de éxito, mencioná 2-3 clientes anónimos.',
  ],
  profesional: [
    'Para reservar turno necesito nombre, motivo y obra social.',
    'Las consultas son de 45 minutos.',
    'No atendemos los sábados ni domingos.',
    'Si es urgencia, derivá a la guardia.',
    'Aclará que la consulta tiene costo, no es gratuita.',
  ],
}

function RetailAgenteIA() {
  const { retail, refreshRetail } = useAuth()
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const initedRef = useRef(false)

  useEffect(() => {
    if (retail && !initedRef.current) {
      initedRef.current = true
      setForm({
        bot_welcome_message:  retail.bot_welcome_message || '',
        bot_info_message:     retail.bot_info_message || '',
        bot_personality:      retail.bot_personality || 'amigable',
        bot_language:         retail.bot_language || 'es-AR',
        welcome_bonus_pct:    retail.welcome_bonus_pct ?? '',
        bot_use_extended_thinking: retail.bot_use_extended_thinking !== false,
        bot_thinking_budget:       retail.bot_thinking_budget ?? 3000,
        bot_response_style:        retail.bot_response_style || 'breve',
        bot_response_max_lines:    retail.bot_response_max_lines ?? 4,
        bot_escalation_rules:      retail.bot_escalation_rules || '',
        bot_topics_avoid:          retail.bot_topics_avoid || '',
        bot_prompt:                retail.bot_prompt || '',
        wa_group:                retail.wa_group || '',
        default_password:        '',
        remarketing_enabled:     !!retail.remarketing_enabled,
        remarketing_link_msg1:   retail.remarketing_link_msg1 || '',
        remarketing_link_msg2:   retail.remarketing_link_msg2 || '',
        remarketing_cuenta_msg1: retail.remarketing_cuenta_msg1 || '',
        remarketing_cuenta_msg2: retail.remarketing_cuenta_msg2 || '',
        remarketing_step1_hours: retail.remarketing_step1_hours ?? 24,
        remarketing_step2_hours: retail.remarketing_step2_hours ?? 72,
      })
    }
  }, [retail])

  if (!form) return <div style={{ color: C.muted, padding: 20 }}>Cargando…</div>

  const set = (k) => (e) => {
    const v = e?.target?.type === 'checkbox' ? e.target.checked : (e?.target?.value ?? e)
    setForm(f => ({ ...f, [k]: v }))
  }

  const save = async () => {
    setSaving(true); setMsg('')
    try {
      const patch = {
        bot_welcome_message:  form.bot_welcome_message || null,
        bot_info_message:     form.bot_info_message || null,
        bot_personality:      form.bot_personality || null,
        bot_language:         form.bot_language || null,
        welcome_bonus_pct:    Number(form.welcome_bonus_pct) || null,
        bot_use_extended_thinking: form.bot_use_extended_thinking !== false,
        bot_thinking_budget:       [1024, 3000, 5000, 8000].includes(Number(form.bot_thinking_budget)) ? Number(form.bot_thinking_budget) : 3000,
        bot_response_style:        ['breve','medio','detallado'].includes(form.bot_response_style) ? form.bot_response_style : 'breve',
        bot_response_max_lines:    Math.max(1, Math.min(10, Number(form.bot_response_max_lines) || 4)),
        bot_escalation_rules:      form.bot_escalation_rules?.slice(0, 2000) || null,
        bot_topics_avoid:          form.bot_topics_avoid?.slice(0, 2000) || null,
        bot_prompt:                form.bot_prompt?.slice(0, 8000) || null,
        remarketing_enabled:     !!form.remarketing_enabled,
        remarketing_link_msg1:   form.remarketing_link_msg1 || null,
        remarketing_link_msg2:   form.remarketing_link_msg2 || null,
        remarketing_cuenta_msg1: form.remarketing_cuenta_msg1 || null,
        remarketing_cuenta_msg2: form.remarketing_cuenta_msg2 || null,
        remarketing_step1_hours: Number(form.remarketing_step1_hours) || null,
        remarketing_step2_hours: Number(form.remarketing_step2_hours) || null,
        wa_group:                form.wa_group || null,
      }
      const { error } = await supabase.rpc('update_my_retail_settings', { p_patch: patch })
      if (error) throw error

      if (form.default_password) {
        const { error: errSec } = await supabase.rpc('set_my_retail_platform_secrets', {
          p_default_password: form.default_password,
        })
        if (errSec) throw errSec
      }

      await refreshRetail()
      setForm(f => ({ ...f, default_password: '' }))
      setMsg('✓ Guardado')
      setTimeout(() => setMsg(''), 2500)
    } catch (e) {
      setMsg('⚠ ' + (e.message || 'Error'))
    } finally { setSaving(false) }
  }

  return (
    <div>
      <PageHeader eyebrow="Inteligencia artificial" title="Agente IA"
        subtitle="Personalidad del bot, mensajes automáticos y remarketing."
      />

      <Card padding={18} style={{ marginBottom: 14 }}>
        <SectionHeader title="🤖 Personalidad del bot" style={{ marginBottom: 14 }}/>
        <div style={{
          background: 'rgba(212,168,67,0.06)',
          border: `1px solid rgba(212,168,67,0.25)`,
          borderRadius: 8, padding: '10px 12px', marginBottom: 14,
          fontSize: FONT_SIZE.sm, color: C.text, lineHeight: 1.5,
        }}>
          {(retail?.identity || 'casino') === 'casino' && <>🎰 <strong>Identidad: Casino.</strong> El bot crea cuentas de jugador, genera links de carga y acredita saldo automáticamente.</>}
          {retail?.identity === 'tienda' && <>🛒 <strong>Identidad: Tienda.</strong> El bot atiende consultas sobre productos, toma pedidos por WhatsApp y genera links de pago.</>}
          {retail?.identity === 'marketing' && <>📣 <strong>Identidad: Marketing.</strong> El bot califica leads, agenda demos y deriva a un comercial.</>}
          {retail?.identity === 'profesional' && <>👔 <strong>Identidad: Profesional.</strong> El bot agenda turnos, responde dudas frecuentes y filtra a quién derivar.</>}
        </div>
        <p style={{ fontSize: FONT_SIZE.xs, color: C.muted, margin: '0 0 14px', fontStyle: 'italic' }}>
          ¿Querés cambiar la identidad del negocio? Andá a <strong style={{ color: C.text }}>Configuración → Identidad</strong>. El cambio aplica acá y en la landing automáticamente.
        </p>
        <Row>
          <FieldMini label="Tono" hint="Cómo le habla al cliente">
            <select value={form.bot_personality} onChange={set('bot_personality')} style={{ ...fi, cursor: 'pointer' }}>
              <option value="amigable">Amigable</option>
              <option value="profesional">Profesional</option>
              <option value="casual">Casual</option>
              <option value="formal">Formal</option>
            </select>
          </FieldMini>
          <FieldMini label="Idioma" hint="es-AR / es / en">
            <input value={form.bot_language} onChange={set('bot_language')} style={fi} placeholder="es-AR" />
          </FieldMini>
        </Row>
        {(retail?.identity || 'casino') === 'casino' && (
          <FieldMini label="Bono de bienvenida (%)" hint="Lo menciona el bot al recibir nuevos clientes">
            <input type="number" value={form.welcome_bonus_pct||''} onChange={set('welcome_bonus_pct')} style={fi} />
          </FieldMini>
        )}
      </Card>

      {/* Razonamiento del agente */}
      <Card padding={18} style={{ marginBottom: 14 }}>
        <SectionHeader title="🧠 Razonamiento del agente" style={{ marginBottom: 14 }}/>
        <p style={{ fontSize: FONT_SIZE.sm, color: C.muted, margin: '0 0 16px', lineHeight: 1.5 }}>
          Cómo piensa, qué tan extenso responde y cuándo deriva a un humano.
        </p>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '12px 0',
          borderBottom: `1px solid ${C.border}`,
          marginBottom: 14,
          flexWrap: 'wrap',
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.semibold, color: C.text, margin: 0 }}>🔬 Razonamiento profundo</p>
            <p style={{ fontSize: FONT_SIZE.sm, color: C.muted, margin: '4px 0 0', lineHeight: 1.45 }}>
              El bot piensa antes de responder. Mejora la calidad pero suma 1-3 segundos por mensaje.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setForm(f => ({ ...f, bot_use_extended_thinking: !f.bot_use_extended_thinking }))}
            style={{
              position: 'relative',
              width: 46, height: 26,
              borderRadius: 99,
              border: 'none',
              cursor: 'pointer',
              flexShrink: 0,
              background: form.bot_use_extended_thinking !== false ? C.success : C.border,
              transition: 'background .15s',
            }}
            aria-label={form.bot_use_extended_thinking !== false ? 'Desactivar razonamiento profundo' : 'Activar razonamiento profundo'}
          >
            <span style={{
              position: 'absolute', top: 3,
              borderRadius: '50%',
              width: 20, height: 20,
              background: '#fff',
              transition: 'left .15s',
              left: form.bot_use_extended_thinking !== false ? 23 : 3,
            }} />
          </button>
        </div>

        {form.bot_use_extended_thinking !== false && (
          <FieldMini label="Profundidad de pensamiento" hint="Más profundidad = mejores respuestas pero más caro. Estándar es lo recomendado.">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { v: 1024, label: 'Liviano' },
                { v: 3000, label: 'Estándar' },
                { v: 5000, label: 'Profundo' },
                { v: 8000, label: 'Máximo' },
              ].map(opt => {
                const active = Number(form.bot_thinking_budget) === opt.v
                return (
                  <button
                    key={opt.v}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, bot_thinking_budget: opt.v }))}
                    style={{
                      padding: '6px 14px',
                      borderRadius: RADIUS.sm,
                      border: `1px solid ${active ? C.brand : C.border}`,
                      background: active ? `${C.brand}18` : C.surface,
                      color: active ? C.brand : C.muted,
                      fontSize: FONT_SIZE.md,
                      fontWeight: FONT_WEIGHT.semibold,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >{opt.label}</button>
                )
              })}
            </div>
          </FieldMini>
        )}

        <FieldMini label="Estilo de respuesta" hint="Define cuánto se extiende el bot.">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { v: 'breve',     label: 'Breve' },
              { v: 'medio',     label: 'Medio' },
              { v: 'detallado', label: 'Detallado' },
            ].map(opt => {
              const active = form.bot_response_style === opt.v
              return (
                <button
                  key={opt.v}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, bot_response_style: opt.v }))}
                  style={{
                    padding: '6px 14px',
                    borderRadius: RADIUS.sm,
                    border: `1px solid ${active ? C.brand : C.border}`,
                    background: active ? `${C.brand}18` : C.surface,
                    color: active ? C.brand : C.muted,
                    fontSize: FONT_SIZE.md,
                    fontWeight: FONT_WEIGHT.semibold,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >{opt.label}</button>
              )
            })}
          </div>
        </FieldMini>

        <FieldMini label="Largo máximo (líneas)" hint="WhatsApp se lee mejor con respuestas cortas.">
          <input
            type="number"
            min={1}
            max={10}
            value={form.bot_response_max_lines || 4}
            onChange={set('bot_response_max_lines')}
            style={{ ...fi, maxWidth: 140 }}
          />
        </FieldMini>

        <FieldMini label="Reglas para derivar a humano" hint="Casos en los que el bot debe escalar siempre. Una regla por línea.">
          <textarea
            value={form.bot_escalation_rules || ''}
            onChange={set('bot_escalation_rules')}
            rows={4}
            maxLength={2000}
            style={{ ...fi, fontFamily: 'inherit', resize: 'vertical', minHeight: 80 }}
            placeholder={'Si pide reembolso, derivá a humano.\nSi pregunta por facturación, derivá.\nSi dice que el bot lo está atendiendo mal, derivá.'}
          />
        </FieldMini>

        <FieldMini label="Temas a evitar" hint="Temas que el bot redirige amablemente.">
          <textarea
            value={form.bot_topics_avoid || ''}
            onChange={set('bot_topics_avoid')}
            rows={3}
            maxLength={2000}
            style={{ ...fi, fontFamily: 'inherit', resize: 'vertical', minHeight: 70 }}
            placeholder={'No hables de competidores.\nNo des opiniones políticas.\nNo prometas cosas que requieran aprobación humana.'}
          />
        </FieldMini>
      </Card>

      {/* Instrucciones personalizadas del bot */}
      <Card padding={18} style={{ marginBottom: 14 }}>
        <SectionHeader title="🎯 Instrucciones personalizadas" style={{ marginBottom: 14 }}/>
        <FieldMini
          label="Reglas y conocimiento específicos de tu negocio"
          hint="Lo que escribas acá se agrega al prompt del bot. Aplica en todas las respuestas."
        >
          <textarea
            value={form.bot_prompt || ''}
            onChange={set('bot_prompt')}
            rows={6}
            maxLength={8000}
            style={{ ...fi, fontFamily: 'inherit', resize: 'vertical', minHeight: 140, lineHeight: 1.6 }}
            placeholder={'Escribí instrucciones específicas para tu bot. Por ejemplo:\n\n• Siempre mencioná el bono de bienvenida al saludar.\n• Si el cliente pregunta por VIP, decile que escriba "VIP".\n• No dar información sobre otros casinos.'}
          />
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 6,
            fontSize: 12,
            color: C.muted,
          }}>
            <span>💡 Se aplican en cada respuesta sin reemplazar el comportamiento base del bot.</span>
            <span style={{ fontFamily: 'monospace' }}>
              {(form.bot_prompt || '').length} / 8000
            </span>
          </div>
        </FieldMini>

        <div style={{ marginTop: 14 }}>
          <p style={{
            fontSize: 11,
            color: C.muted,
            textTransform: 'uppercase',
            letterSpacing: '.06em',
            marginBottom: 8,
            fontWeight: 600,
          }}>
            Ejemplos rápidos — click para agregar:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {(PROMPT_EJEMPLOS_RETAIL[retail?.identity] || PROMPT_EJEMPLOS_RETAIL.casino).map((ej, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setForm(f => ({
                  ...f,
                  bot_prompt: f.bot_prompt ? f.bot_prompt + '\n• ' + ej : '• ' + ej,
                }))}
                style={{
                  padding: '5px 11px',
                  borderRadius: 99,
                  border: `1px solid ${C.border}`,
                  background: 'transparent',
                  color: C.muted,
                  fontSize: 12,
                  cursor: 'pointer',
                  transition: 'all .15s',
                }}
                onMouseEnter={e => {
                  e.target.style.borderColor = C.brand
                  e.target.style.color = C.text
                }}
                onMouseLeave={e => {
                  e.target.style.borderColor = C.border
                  e.target.style.color = C.muted
                }}
              >
                + {ej}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Mensajes del bot */}
      <Card padding={18} style={{ marginBottom: 14 }}>
        <SectionHeader title="💬 Mensajes del bot" style={{ marginBottom: 14 }}/>
        <FieldMini label="Mensaje de bienvenida" hint="Lo envía cuando un cliente nuevo le escribe">
          <textarea value={form.bot_welcome_message} onChange={set('bot_welcome_message')} rows={6}
            style={{ ...fi, fontFamily: 'inherit', resize: 'vertical', minHeight: 120 }}
            placeholder={
              retail?.identity === 'tienda' ? '¡Hola! Bienvenido/a a [tu negocio]. ¿Qué producto te interesa?'
              : retail?.identity === 'marketing' ? '¡Hola! Gracias por escribirnos. ¿En qué podemos ayudarte?'
              : retail?.identity === 'profesional' ? 'Buenas tardes. ¿En qué podemos asistirle?'
              : '¡Hola! Soy el asistente de...'
            }
          />
        </FieldMini>
        <FieldMini label="Mensaje de información" hint={
          (retail?.identity || 'casino') === 'casino' ? 'Cuando preguntan por horarios / bonos / etc.'
          : retail?.identity === 'tienda' ? 'Cuando preguntan por envíos, formas de pago, horarios.'
          : retail?.identity === 'marketing' ? 'Cuando piden info sobre el servicio, precios, etc.'
          : 'Cuando piden info sobre horarios, ubicación, modalidades.'
        }>
          <textarea value={form.bot_info_message} onChange={set('bot_info_message')} rows={4}
            style={{ ...fi, fontFamily: 'inherit', resize: 'vertical', minHeight: 80 }}
            placeholder={
              retail?.identity === 'tienda' ? '📦 Envíos a todo el país por OCA\n💳 Pago con MP, tarjetas\n⏰ Lun a Sáb 9 a 18hs'
              : retail?.identity === 'marketing' ? '📞 Asesoría sin costo\n⚡ Respuesta en menos de 1 hora\n🎯 Sin compromiso'
              : retail?.identity === 'profesional' ? '⏰ Lun a Vie 9 a 18hs\n📍 Consultorio + atención online\n📅 Coordinamos por WhatsApp'
              : '💰 Mínimo de carga: $2000...'
            }
          />
        </FieldMini>
      </Card>

      {/* Recursos del bot — wa_group + default_password */}
      <Card padding={18} style={{ marginBottom: 14 }}>
        <SectionHeader title="🔗 Recursos del bot" style={{ marginBottom: 14 }}/>
        <p style={{ fontSize: FONT_SIZE.sm, color: C.muted, margin: '0 0 14px', lineHeight: 1.5 }}>
          Datos opcionales que el bot usa cuando interactúa con tus clientes.
        </p>

        <FieldMini
          label="Grupo de WhatsApp (opcional)"
          hint="Link de invitación a tu grupo. El bot lo comparte cuando el cliente lo pide."
        >
          <input
            value={form.wa_group || ''}
            onChange={set('wa_group')}
            style={fi}
            placeholder="https://chat.whatsapp.com/..."
          />
        </FieldMini>

        {(retail?.identity || 'casino') === 'casino' && (
          <div style={{ marginTop: 12 }}>
            <SecretField
              label="Contraseña default para nuevos usuarios (opcional)"
              hasValue={!!retail?.has_default_password}
              value={form.default_password}
              onChange={(e) => setForm(f => ({ ...f, default_password: e.target.value }))}
              placeholder="(opcional)"
              hint="Si se define, todos los usuarios que el bot cree en tu plataforma usarán esta contraseña. Si queda vacía, se genera una aleatoria por usuario. Se guarda tal cual, sin cifrar (la necesitamos para autenticar en tu casino)."
              updatedAt={retail?.default_password_updated_at}
            />
          </div>
        )}
      </Card>

      {/* Remarketing — solo casino */}
      {(retail?.identity || 'casino') === 'casino' && (
        <Card padding={18} style={{ marginBottom: 14 }}>
          <SectionHeader title="📬 Remarketing automático" style={{ marginBottom: 14 }}/>
          <p style={{ fontSize: FONT_SIZE.sm, color: C.muted, margin: '0 0 14px', lineHeight: 1.5 }}>
            El bot puede mandar mensajes de seguimiento a clientes que generaron un link de pago y no pagaron,
            o que crearon cuenta pero no cargaron saldo.
          </p>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '12px 0',
            borderBottom: `1px solid ${C.border}`,
            marginBottom: 14,
            flexWrap: 'wrap',
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.semibold, color: C.text, margin: 0 }}>Activar remarketing</p>
              <p style={{ fontSize: FONT_SIZE.sm, color: C.muted, margin: '4px 0 0', lineHeight: 1.45 }}>
                Cuando está activado, n8n envía los mensajes en las horas configuradas.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, remarketing_enabled: !f.remarketing_enabled }))}
              style={{
                position: 'relative',
                width: 46, height: 26,
                borderRadius: 99,
                border: 'none',
                cursor: 'pointer',
                flexShrink: 0,
                background: form.remarketing_enabled ? C.success : C.border,
                transition: 'background .15s',
              }}
              aria-label={form.remarketing_enabled ? 'Desactivar remarketing' : 'Activar remarketing'}
            >
              <span style={{
                position: 'absolute', top: 3,
                borderRadius: '50%',
                width: 20, height: 20,
                background: '#fff',
                transition: 'left .15s',
                left: form.remarketing_enabled ? 23 : 3,
              }} />
            </button>
          </div>

          {form.remarketing_enabled && (
            <>
              <div style={{ fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold, color: C.brand, marginTop: 6, marginBottom: 8 }}>
                📩 Link generado sin pago
              </div>
              <FieldMini label="Mensaje 1" hint="Primer recordatorio al cliente que no pagó">
                <textarea
                  value={form.remarketing_link_msg1 || ''}
                  onChange={set('remarketing_link_msg1')}
                  rows={3}
                  style={{ ...fi, fontFamily: 'inherit', resize: 'vertical' }}
                  placeholder="Hola! Te dejamos el link de pago acá: {link}. ¿Necesitás ayuda con la carga?"
                />
              </FieldMini>
              <FieldMini label="Mensaje 2" hint="Segundo intento si todavía no pagó">
                <textarea
                  value={form.remarketing_link_msg2 || ''}
                  onChange={set('remarketing_link_msg2')}
                  rows={3}
                  style={{ ...fi, fontFamily: 'inherit', resize: 'vertical' }}
                  placeholder="Recordá que tu link de pago sigue vigente: {link}. Aprovechá el bono de bienvenida!"
                />
              </FieldMini>

              <div style={{ fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold, color: C.brand, marginTop: 14, marginBottom: 8 }}>
                👤 Cuenta sin carga
              </div>
              <FieldMini label="Mensaje 1" hint="Recordatorio al cliente que creó cuenta pero no cargó saldo">
                <textarea
                  value={form.remarketing_cuenta_msg1 || ''}
                  onChange={set('remarketing_cuenta_msg1')}
                  rows={3}
                  style={{ ...fi, fontFamily: 'inherit', resize: 'vertical' }}
                  placeholder="Hola {nombre}! Ya tenés tu cuenta lista. ¿Querés que te envíe el link para tu primera carga con bono?"
                />
              </FieldMini>
              <FieldMini label="Mensaje 2" hint="Segundo intento">
                <textarea
                  value={form.remarketing_cuenta_msg2 || ''}
                  onChange={set('remarketing_cuenta_msg2')}
                  rows={3}
                  style={{ ...fi, fontFamily: 'inherit', resize: 'vertical' }}
                  placeholder="No te olvides que tu bono de bienvenida sigue disponible. Cargá hoy y duplicá tu saldo!"
                />
              </FieldMini>

              <Row>
                <FieldMini label="Paso 1 — horas después del evento" hint="Cuando enviar el primer mensaje">
                  <input
                    type="number"
                    value={form.remarketing_step1_hours || ''}
                    onChange={set('remarketing_step1_hours')}
                    placeholder="24"
                    min={1}
                    max={168}
                    style={fi}
                  />
                </FieldMini>
                <FieldMini label="Paso 2 — horas después del evento" hint="Cuando enviar el segundo mensaje">
                  <input
                    type="number"
                    value={form.remarketing_step2_hours || ''}
                    onChange={set('remarketing_step2_hours')}
                    placeholder="72"
                    min={1}
                    max={168}
                    style={fi}
                  />
                </FieldMini>
              </Row>
            </>
          )}
        </Card>
      )}

      <div style={{ marginBottom: 14 }}>
        <QuickRepliesEditor entity={retail} isSubTenant={false} onSaved={refreshRetail} />
      </div>

      <div style={{
        position: 'sticky', bottom: 0,
        background: `linear-gradient(to bottom, transparent, ${C.bg} 40%)`,
        padding: '16px 0 8px', display: 'flex',
        justifyContent: 'flex-end', alignItems: 'center',
        gap: 12, marginTop: 8, zIndex: Z.sticky,
      }}>
        {msg && (
          <span style={{
            fontSize: FONT_SIZE.md,
            color: msg.startsWith('✓') ? C.success : C.warning,
            fontWeight: FONT_WEIGHT.semibold,
          }}>{msg}</span>
        )}
        <Button variant="primary" size="lg" onClick={save} disabled={saving} loading={saving}>
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════
// 15/05/2026 — Guard que redirige a /mi-cuenta/bienvenida si el onboarding sigue activo.
function OnboardingRedirectGuard({ children }) {
  const location = useLocation()
  const nav = useNavigate()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    let alive = true
    if (location.pathname.startsWith('/mi-cuenta/bienvenida')) {
      setChecked(true)
      return
    }
    const ONBOARDING_TARGET_PATHS = ['/mi-cuenta/lineas', '/mi-cuenta/config', '/mi-cuenta/agente-ia', '/mi-cuenta/billing']
    if (ONBOARDING_TARGET_PATHS.some(p => location.pathname.startsWith(p))) {
      sessionStorage.setItem('innovate_onboarding_redirected_v1', '1')
      setChecked(true)
      return
    }
    if (sessionStorage.getItem('innovate_onboarding_redirected_v1')) {
      setChecked(true)
      return
    }
    ;(async () => {
      try {
        const { data } = await supabase.rpc('get_my_retail_onboarding')
        if (!alive) return
        if (data && !data.error && data.is_active) {
          sessionStorage.setItem('innovate_onboarding_redirected_v1', '1')
          nav('/mi-cuenta/bienvenida', { replace: true })
          return
        }
      } catch {}
      if (alive) setChecked(true)
    })()
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!checked) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: C.bg,
      }}>
        <div style={{ color: C.muted, fontSize: FONT_SIZE.base }}>Cargando…</div>
      </div>
    )
  }
  return children
}

export default function RetailPanel() {
  const { isRetail, retail, loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: C.bg,
      }}>
        <div style={{ color: C.muted, fontSize: FONT_SIZE.base }}>Cargando tu panel…</div>
      </div>
    )
  }

  if (!isRetail) return <Navigate to="/login" replace />
  if (!retail)   return <Navigate to="/login" replace />

  if (retail.status === 'suspended') {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: C.bg, padding: 24,
      }}>
        <div style={{ maxWidth: 420, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⏸</div>
          <h1 style={{
            fontSize: 22, color: C.text, margin: '0 0 8px',
            fontWeight: FONT_WEIGHT.bold,
          }}>Cuenta suspendida</h1>
          <p style={{ fontSize: FONT_SIZE.base, color: C.muted, lineHeight: 1.55 }}>
            Tu cuenta está temporalmente pausada. Contactá a soporte en{' '}
            <strong style={{ color: C.text }}>soporte@innovate-ia.com</strong> para más info.
          </p>
        </div>
      </div>
    )
  }

  return (
    <OnboardingRedirectGuard>
      <RetailLayout>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route index          element={<RetailHome />} />
          <Route path="chats"   element={<RetailChats />} />
          <Route path="chats/:phone"   element={<RetailChats />} />
          <Route path="ventas"    element={<RetailVentas />} />
          <Route path="pedidos"   element={<PedidosPanel mode="retail" />} />
          <Route path="catalogo"  element={<RetailCatalogo />} />
          <Route path="agenda"    element={<AgendaPanel />} />
          <Route path="agenda/configuracion" element={<AgendaConfig />} />
          <Route path="contactos" element={<Contactos />} />
          <Route path="landing"   element={<RetailLanding />} />
          <Route path="lineas"    element={<RetailLineas />} />
          <Route path="grupo"     element={<RetailGrupo />} />
          <Route path="bienvenida" element={<RetailOnboarding />} />
          <Route path="usuarios-casino" element={<UsuariosCasinoPanel />} />
          <Route path="billing"   element={<RetailBilling />} />
          <Route path="agente-ia" element={<RetailAgenteIA />} />
          <Route path="campanas"  element={<Campanas />} />
          <Route path="instrucciones"                           element={<Instrucciones />} />
          <Route path="instrucciones/billeteras"                 element={<InstruccionesBilleteras />} />
          <Route path="instrucciones/billeteras/mercado-pago"    element={<InstruccionesMP />} />
          <Route path="instrucciones/billeteras/uala"            element={<InstruccionesUala />} />
          <Route path="instrucciones/billeteras/modo"            element={<InstruccionesMODO />} />
          <Route path="instrucciones/billeteras/lemon"           element={<InstruccionesLemon />} />
          <Route path="instrucciones/billeteras/belo"            element={<InstruccionesBelo />} />
          <Route path="instrucciones/agente"                     element={<InstruccionesAgenteBot />} />
          <Route path="instrucciones/agente/casino"              element={<InstruccionesAgenteBotCasino />} />
          <Route path="instrucciones/agente/tienda"              element={<InstruccionesAgenteBotTienda />} />
          <Route path="instrucciones/agente/marketing"           element={<InstruccionesAgenteBotMarketing />} />
          <Route path="instrucciones/agente/profesional"         element={<InstruccionesAgenteBotProfesional />} />
          <Route path="instrucciones/negocio"                    element={<InstruccionesNegocio />} />
          <Route path="instrucciones/negocio/casino"             element={<InstruccionesNegocioCasino />} />
          <Route path="instrucciones/negocio/tienda"             element={<InstruccionesNegocioTienda />} />
          <Route path="instrucciones/negocio/marketing"          element={<InstruccionesNegocioMarketing />} />
          <Route path="instrucciones/negocio/profesional"        element={<InstruccionesNegocioProfesional />} />
          {/* 17/05/2026 — 4 guías nuevas (sin sub-páginas por identity). */}
          {/* 18/05/2026 — Studio IA removido (solo tenants partner, no retail). */}
          <Route path="instrucciones/landing"                    element={<InstruccionesLanding />} />
          <Route path="instrucciones/clientes"                   element={<InstruccionesClientes />} />
          <Route path="instrucciones/lineas"                     element={<InstruccionesLineas />} />
          <Route path="instrucciones/saldo"                      element={<InstruccionesSaldo />} />
          <Route path="instrucciones/mercado-pago"               element={<InstruccionesMP />} />
          <Route path="config"    element={<RetailConfig />} />
          <Route path="soporte"    element={<Soporte />} />
          <Route path="creditos"   element={<RetailCreditos />} />
          <Route path="privacidad" element={<RetailPrivacidad />} />
          <Route path="terminos"   element={<RetailTerminos />} />
          <Route path="*"       element={<Navigate to="/mi-cuenta" replace />} />
        </Routes>
      </Suspense>
    </RetailLayout>
    </OnboardingRedirectGuard>
  )
}
