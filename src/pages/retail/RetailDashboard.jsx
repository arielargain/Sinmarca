import { useEffect, useState, useMemo, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { COLORS as C, FONT, RADIUS } from '../../theme/tokens'
import { Card } from '../../components/ui'

const mono = { fontFamily: FONT.mono }

const PERIODS = [
  { id: 'today',     label: 'Hoy' },
  { id: 'yesterday', label: 'Ayer' },
  { id: '7d',        label: '7 días' },
  { id: '15d',       label: '15 días' },
  { id: '1m',        label: '1 mes' },
]

export default function RetailDashboard() {
  const [period, setPeriod]     = useState('7d')
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [kpis, setKpis]         = useState(null)
  const [series, setSeries]     = useState([])
  const [bucket, setBucket]     = useState('day')
  const [exportMenuOpen, setExportMenuOpen] = useState(false)
  const [exportLoading, setExportLoading]   = useState(false)
  const exportMenuRef = useRef(null)

  const reload = async (newPeriod = period) => {
    setLoading(true); setError(null)
    try {
      const [kRes, tRes] = await Promise.all([
        supabase.rpc('dashboard_get_kpis', { p_period: newPeriod }),
        supabase.rpc('dashboard_get_timeseries', { p_period: newPeriod }),
      ])
      if (kRes.error) throw kRes.error
      if (tRes.error) throw tRes.error
      setKpis(kRes.data)
      setSeries(tRes.data?.series || [])
      setBucket(tRes.data?.bucket || 'day')
    } catch (e) {
      setError(e.message || 'Error al cargar el dashboard')
    } finally { setLoading(false) }
  }

  useEffect(() => { reload() }, [])
  const handlePeriodChange = (p) => { setPeriod(p); reload(p) }

  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const notice = searchParams.get('notice')

  // Cerrar menu export al click fuera
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

  // Export Dashboard — 3 vistas (KPIs / Conversaciones / Series) x 2 formatos (CSV/JSON)
  const handleExport = async (view, format) => {
    setExportLoading(true)
    setExportMenuOpen(false)
    try {
      const now = new Date()
      const pad = (n) => String(n).padStart(2, '0')
      const stamp = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`
      const filename = `dashboard-${view}-${period}-${stamp}.${format}`

      let rows = []

      if (view === 'kpis') {
        const autoRes = (kpis?.whatsapp?.msg_out_bot && (kpis.whatsapp.msg_out_bot + kpis.whatsapp.msg_out_agent) > 0)
          ? Math.round((kpis.whatsapp.msg_out_bot / (kpis.whatsapp.msg_out_bot + kpis.whatsapp.msg_out_agent)) * 100)
          : 0
        rows = [{
          periodo: period,
          generado_en: now.toISOString(),
          // Landing
          landing_visitas:        kpis?.landing?.visits ?? 0,
          landing_clicks_wa:      kpis?.landing?.clicks_wa ?? 0,
          landing_conversiones:   kpis?.landing?.conversions ?? 0,
          landing_conv_rate_pct:  kpis?.landing?.conv_rate ?? 0,
          // WhatsApp
          mensajes_recibidos:     kpis?.whatsapp?.msg_in ?? 0,
          mensajes_bot:           kpis?.whatsapp?.msg_out_bot ?? 0,
          mensajes_agente:        kpis?.whatsapp?.msg_out_agent ?? 0,
          conversaciones_nuevas:  kpis?.whatsapp?.new_convs ?? 0,
          // Bot
          bot_conversaciones_activas: kpis?.bot?.active_convs ?? 0,
          bot_escalaciones_a_agente:  kpis?.bot?.escalations ?? 0,
          bot_auto_resolucion_pct:    autoRes,
          // Ventas
          ventas_count:           kpis?.sales?.count ?? 0,
          ventas_total_ars:       kpis?.sales?.total_ars ?? 0,
          ventas_ticket_promedio: kpis?.sales?.avg_ticket ?? 0,
        }]
      } else if (view === 'conversaciones') {
        // Cargar on-demand
        const { data, error } = await supabase.rpc('dashboard_get_conversations', { p_period: period })
        if (error) throw error
        rows = (data || []).map(c => ({
          id: c.id,
          contact_name: c.contact_name || '',
          phone: c.phone || '',
          status: c.status || '',
          bot_active: !!c.bot_active,
          casino_user_id: c.casino_user_id || '',
          casino_login: c.casino_login || '',
          first_message: c.first_message || '',
          created_at: c.created_at,
          last_message_at: c.last_message_at || '',
          link_sent_at: c.link_sent_at || '',
          first_deposit_at: c.first_deposit_at || '',
          msg_count_in: c.msg_count_in || 0,
          msg_count_out_bot: c.msg_count_out_bot || 0,
          msg_count_out_agent: c.msg_count_out_agent || 0,
          msg_last_at: c.msg_last_at || '',
          sales_confirmed_count: c.sales_confirmed_count || 0,
          sales_amount_total: c.sales_amount_total || 0,
          tiene_cuenta: !!c.casino_user_id,
          convirtio: !!c.first_deposit_at,
        }))
      } else if (view === 'series') {
        rows = (series || []).map((s, i) => ({
          bucket_idx: i,
          bucket_type: bucket,
          fecha: s.t || s.bucket || s.date || s.timestamp || '',
          visitas: s.visits ?? 0,
          mensajes: s.messages ?? s.msgs ?? 0,
          ventas_count: s.sales ?? 0,
          ventas_monto: s.sales_amount ?? s.amount ?? 0,
        }))
      }

      if (rows.length === 0) {
        alert('No hay datos para exportar en esta vista.')
        return
      }

      let blob
      if (format === 'json') {
        const payload = JSON.stringify({
          vista: view,
          periodo: period,
          generado_en: now.toISOString(),
          total_filas: rows.length,
          datos: rows,
        }, null, 2)
        blob = new Blob([payload], { type: 'application/json;charset=utf-8' })
      } else {
        const headers = Object.keys(rows[0])
        const escapeCsv = (val) => {
          if (val === null || val === undefined) return ''
          let s = typeof val === 'object' ? JSON.stringify(val) : String(val)
          if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
            s = '"' + s.replace(/"/g, '""') + '"'
          }
          return s
        }
        const lines = [headers.join(',')]
        for (const row of rows) {
          lines.push(headers.map(h => escapeCsv(row[h])).join(','))
        }
        const csv = '\uFEFF' + lines.join('\r\n')
        blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
      }

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (e) {
      console.error('Export error:', e)
      alert('Error al exportar: ' + (e.message || 'desconocido'))
    } finally {
      setExportLoading(false)
    }
  }

  return (
    <div>
      {notice === 'billing-by-partner' && (
        <div style={{
          marginBottom: 16,
          padding: '14px 18px',
          background: `${C.brand}10`,
          border: `1px solid ${C.brand}40`,
          borderRadius: RADIUS.md,
          color: C.text,
          fontSize: 13,
          lineHeight: 1.5,
        }}>
          <strong style={{ color: C.brand }}>Tu plan lo gestiona tu agencia.</strong>
          {' '}Para ampliar tu saldo o cambiar de plan, contactá directamente con tu operador.
        </div>
      )}

      {/* 15/05/2026 — PageHeader interno removido. Ahora el header
          "Centro de control / Dashboard" lo pone la página que embebe el dashboard
          (RetailHome) ARRIBA de las 4 SetupStatusCards. Acá quedan solo los selectores
          de período + Exportar + cards de KPIs. */}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, flexWrap:'wrap', marginBottom: 24 }}>
        <div style={{
          display: 'flex', gap: 4, flexWrap: 'wrap',
          padding: 4, background: C.surface, borderRadius: RADIUS.md,
          border: `1px solid ${C.border}`, width: 'fit-content',
        }}>
          {PERIODS.map(p => (
            <button key={p.id} onClick={() => handlePeriodChange(p.id)}
              style={{
                padding: '8px 16px', fontSize: 13, fontWeight: 600,
                background: period === p.id ? C.brand : 'transparent',
                color: period === p.id ? '#000' : C.muted,
                border: 'none', borderRadius: RADIUS.sm, cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}>{p.label}</button>
          ))}
        </div>

        {/* Botón Exportar — sub-menu KPIs / Conversaciones / Series */}
        <div ref={exportMenuRef} style={{ position:'relative' }}>
          <button
            onClick={() => setExportMenuOpen(o => !o)}
            disabled={exportLoading || loading || !kpis}
            title="Exportar datos del período"
            style={{
              background: exportMenuOpen ? `${C.brand}20` : C.surface,
              border: `1px solid ${exportMenuOpen ? C.brand : C.border}`,
              borderRadius: RADIUS.md, padding: '8px 14px',
              cursor: (exportLoading || loading || !kpis) ? 'wait' : 'pointer',
              display:'inline-flex', alignItems:'center', gap:8,
              color: exportMenuOpen ? C.brand : C.text,
              fontSize: 13, fontWeight: 600,
              fontFamily: FONT.mono,
              opacity: (exportLoading || loading || !kpis) ? 0.5 : 1,
              transition: 'all 0.15s ease',
            }}
          >
            <span>{exportLoading ? '⏳' : '📥'}</span>
            <span>Exportar</span>
          </button>
          {exportMenuOpen && (
            <div style={{
              position:'absolute',
              top:'calc(100% + 6px)',
              right:0,
              zIndex:50,
              background:C.surface,
              border:`1px solid ${C.border}`,
              borderRadius:RADIUS.md,
              minWidth:240,
              boxShadow:'0 8px 24px rgba(0,0,0,0.4)',
              overflow:'hidden',
            }}>
              {[
                { view:'kpis',           label:'KPIs (snapshot)',  desc:'1 fila con todos los números' },
                { view:'conversaciones', label:'Conversaciones',    desc:'Contactos del período + stats' },
                { view:'series',         label:'Series temporales', desc:`${(series||[]).length} buckets del chart` },
              ].map((opt, i) => (
                <div key={opt.view} style={{ borderTop: i > 0 ? `1px solid ${C.border}` : 'none' }}>
                  <div style={{
                    padding:'10px 14px 4px',
                    fontSize:9, fontWeight:600,
                    color:C.muted, letterSpacing:'0.08em',
                    textTransform:'uppercase', fontFamily:FONT.mono,
                  }}>
                    {opt.label}
                  </div>
                  <div style={{ padding:'0 14px 4px', fontSize:10, color:C.muted, fontFamily:FONT.mono }}>
                    {opt.desc}
                  </div>
                  <div style={{ display:'flex', gap:0 }}>
                    <button onClick={() => handleExport(opt.view, 'csv')}
                      style={{ flex:1, padding:'8px 14px', background:'transparent', border:'none',
                        color:C.text, fontSize:12, fontWeight:500, cursor:'pointer', textAlign:'left',
                        display:'flex', alignItems:'center', gap:6,
                      }}>
                      <span>📄</span><span>CSV</span>
                    </button>
                    <button onClick={() => handleExport(opt.view, 'json')}
                      style={{ flex:1, padding:'8px 14px', background:'transparent', border:'none',
                        borderLeft:`1px solid ${C.border}`,
                        color:C.text, fontSize:12, fontWeight:500, cursor:'pointer', textAlign:'left',
                        display:'flex', alignItems:'center', gap:6,
                      }}>
                      <span>{'{ }'}</span><span>JSON</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div style={{ padding: 16, background: `${C.danger}15`, color: C.danger, borderRadius: RADIUS.md, marginBottom: 16, border: `1px solid ${C.danger}40` }}>
          {error}
        </div>
      )}

      {loading && !kpis ? (
        <div style={{ color: C.muted, padding: 20 }}>Cargando métricas…</div>
      ) : kpis ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 24 }}>
            <CategoryCard
              title="Landing" icon="🌐"
              metrics={[
                { label: 'Visitas',         value: kpis.landing?.visits, fmt: 'num' },
                { label: 'Clicks WhatsApp', value: kpis.landing?.clicks_wa, fmt: 'num' },
                { label: 'Conversiones',    value: kpis.landing?.conversions, fmt: 'num' },
                { label: 'Conv. rate',      value: kpis.landing?.conv_rate, fmt: 'pct' },
              ]}
            />
            <CategoryCard
              title="WhatsApp" icon="💬"
              metrics={[
                { label: 'Mensajes recibidos',  value: kpis.whatsapp?.msg_in, fmt: 'num' },
                { label: 'Mensajes bot',        value: kpis.whatsapp?.msg_out_bot, fmt: 'num' },
                { label: 'Mensajes agente',     value: kpis.whatsapp?.msg_out_agent, fmt: 'num' },
                { label: 'Conversaciones nuevas', value: kpis.whatsapp?.new_convs, fmt: 'num' },
              ]}
            />
            <CategoryCard
              title="Bot IA" icon="🤖"
              metrics={[
                { label: 'Conversaciones activas', value: kpis.bot?.active_convs, fmt: 'num' },
                { label: 'Escalaciones a agente',  value: kpis.bot?.escalations, fmt: 'num' },
                { label: 'Auto-resolución',
                  value: (kpis.whatsapp?.msg_out_bot && kpis.whatsapp?.msg_out_bot + kpis.whatsapp?.msg_out_agent > 0)
                    ? Math.round((kpis.whatsapp.msg_out_bot / (kpis.whatsapp.msg_out_bot + kpis.whatsapp.msg_out_agent)) * 100)
                    : 0,
                  fmt: 'pct' },
              ]}
            />
            <CategoryCard
              title="Ventas" icon="💰"
              metrics={[
                { label: 'Ventas',          value: kpis.sales?.count, fmt: 'num' },
                { label: 'Total facturado', value: kpis.sales?.total_ars, fmt: 'ars' },
                { label: 'Ticket promedio', value: kpis.sales?.avg_ticket, fmt: 'ars' },
              ]}
            />
          </div>

          <Card padding={24} style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.text }}>
                  Tendencia ({bucket === 'hour' ? 'por hora' : 'por día'})
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: C.muted }}>
                  Visitas, mensajes recibidos y ventas en el período seleccionado
                </p>
              </div>
              <Legend />
            </div>
            <Chart series={series} bucket={bucket} />
          </Card>

          <Card padding={20}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', ...mono }}>
              Resumen del período
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, fontSize: 13, color: C.text }}>
              <SummaryItem label="Engagement bot"  value={
                kpis.whatsapp?.msg_in > 0
                  ? `${(kpis.whatsapp.msg_out_bot / kpis.whatsapp.msg_in).toFixed(1)}x`
                  : '—'
              } sub="msgs bot por msg cliente" />
              <SummaryItem label="Click-through"   value={
                kpis.landing?.visits > 0
                  ? `${((kpis.landing.clicks_wa / kpis.landing.visits) * 100).toFixed(1)}%`
                  : '—'
              } sub="clicks WA / visitas" />
              <SummaryItem label="Lead-to-sale"    value={
                kpis.landing?.clicks_wa > 0
                  ? `${((kpis.sales?.count / kpis.landing.clicks_wa) * 100).toFixed(1)}%`
                  : '—'
              } sub="ventas / clicks WA" />
              <SummaryItem label="Auto-resolución bot" value={
                (kpis.whatsapp?.msg_out_bot + kpis.whatsapp?.msg_out_agent > 0)
                  ? `${Math.round((kpis.whatsapp.msg_out_bot / (kpis.whatsapp.msg_out_bot + kpis.whatsapp.msg_out_agent)) * 100)}%`
                  : '—'
              } sub="bot / total respuestas" />
            </div>
          </Card>
        </>
      ) : null}
    </div>
  )
}

function CategoryCard({ title, icon, metrics }) {
  return (
    <Card padding={20}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', ...mono }}>
          {title}
        </h3>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {metrics.map((m, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 13, color: C.muted }}>{m.label}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.text, ...mono }}>
              {fmt(m.value, m.fmt)}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function fmt(value, kind) {
  if (value == null || value === 0) return kind === 'pct' ? '0%' : kind === 'ars' ? '$0' : '0'
  if (kind === 'num') return Number(value).toLocaleString('es-AR')
  if (kind === 'pct') return `${Number(value)}%`
  if (kind === 'ars') return `$${Number(value).toLocaleString('es-AR')}`
  return String(value)
}

function SummaryItem({ label, value, sub }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', ...mono, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: C.brand, ...mono }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

function Legend() {
  return (
    <div style={{ display: 'flex', gap: 14, fontSize: 11, color: C.muted, ...mono, flexWrap: 'wrap' }}>
      <LegendDot color="#0A84FF" label="Visitas" />
      <LegendDot color="#34C759" label="Mensajes" />
      <LegendDot color="#FF9F0A" label="Ventas" />
    </div>
  )
}
function LegendDot({ color, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <span style={{ width: 8, height: 8, borderRadius: 99, background: color, display: 'inline-block' }} />
      {label}
    </div>
  )
}

function Chart({ series, bucket }) {
  const W = 1000, H = 240, PAD_L = 40, PAD_R = 12, PAD_T = 12, PAD_B = 28
  const innerW = W - PAD_L - PAD_R, innerH = H - PAD_T - PAD_B

  const data = useMemo(() => series || [], [series])

  if (!data.length) {
    return <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, fontSize: 13 }}>Sin datos en este período</div>
  }

  const maxV = Math.max(1, ...data.map(d => Math.max(d.visits || 0, d.msgs_in || 0, d.sales_count || 0)))
  const xStep = data.length > 1 ? innerW / (data.length - 1) : 0

  const buildPath = (key) => {
    return data.map((d, i) => {
      const x = PAD_L + i * xStep
      const y = PAD_T + innerH - ((d[key] || 0) / maxV) * innerH
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
    }).join(' ')
  }

  const formatLabel = (b) => {
    const dt = new Date(b)
    if (bucket === 'hour') return `${String(dt.getHours()).padStart(2,'0')}h`
    return dt.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
  }

  const yTicks = 4
  const yLines = Array.from({ length: yTicks + 1 }, (_, i) => {
    const value = (maxV * (yTicks - i)) / yTicks
    const y = PAD_T + (innerH * i) / yTicks
    return { y, value: Math.round(value) }
  })

  const xLabelStep = Math.max(1, Math.ceil(data.length / 12))

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height: 240, display: 'block' }}>
        {yLines.map((t, i) => (
          <g key={i}>
            <line x1={PAD_L} x2={W - PAD_R} y1={t.y} y2={t.y} stroke={C.border} strokeDasharray="2,4" strokeWidth="1" />
            <text x={PAD_L - 6} y={t.y + 3} textAnchor="end" fill={C.muted} fontSize="10" fontFamily={FONT.mono}>{t.value}</text>
          </g>
        ))}
        {data.map((d, i) => i % xLabelStep === 0 ? (
          <text key={i} x={PAD_L + i * xStep} y={H - 10} textAnchor="middle" fill={C.muted} fontSize="10" fontFamily={FONT.mono}>
            {formatLabel(d.bucket)}
          </text>
        ) : null)}
        <path d={buildPath('visits')}      fill="none" stroke="#0A84FF" strokeWidth="2" />
        <path d={buildPath('msgs_in')}     fill="none" stroke="#34C759" strokeWidth="2" />
        <path d={buildPath('sales_count')} fill="none" stroke="#FF9F0A" strokeWidth="2" />
        {data.map((d, i) => {
          const x = PAD_L + i * xStep
          return (
            <g key={i}>
              <circle cx={x} cy={PAD_T + innerH - ((d.visits      || 0) / maxV) * innerH} r="3" fill="#0A84FF" />
              <circle cx={x} cy={PAD_T + innerH - ((d.msgs_in     || 0) / maxV) * innerH} r="3" fill="#34C759" />
              <circle cx={x} cy={PAD_T + innerH - ((d.sales_count || 0) / maxV) * innerH} r="3" fill="#FF9F0A" />
            </g>
          )
        })}
      </svg>
    </div>
  )
}
