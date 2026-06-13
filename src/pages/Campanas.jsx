// ════════════════════════════════════════════════════════════════════
// Campanas.jsx — Marketing Campaigns v3.1 (28/05/2026)
// ════════════════════════════════════════════════════════════════════
// v2 (15/05): canales meta/wasender via get_my_campaign_channel.
// v3 (27/05): GATE de activación del módulo. Campañas se trata como
//   "segunda línea" que se activa con créditos (1cr/día, 1-7d). UI
//   navegable cuando OFF, pero envío bloqueado por backend
//   (create_campaign devuelve {error:'campaigns_not_active'}).
//   Plan Gold incluye 30d sin costo extra. Sub-tenants requieren
//   que el partner los active.
// v3.1 (28/05): bug fix para Wasender — el contador "elegibles" y la
//   selección ahora respetan que Wasender no tiene restricción de 24h.
//   Antes: aunque el filtro 24h estaba bypaseado en el query, los
//   contactos fuera de 24h aparecían deshabilitados y el botón
//   "Seleccionar todos" solo contaba los de 24h. Ahora todos los
//   contactos son elegibles cuando Wasender. Además nuevo botón
//   "Seleccionar todos (chats + importados)" cuando Wasender, que
//   crea campañas con source='combined' (chats + importados juntos).
// ════════════════════════════════════════════════════════════════════

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import {
  PageHeader, SectionHeader, Card,
  Button, Banner,
  StatCard, StatGrid,
  COLORS as C, RADIUS, FONT_SIZE, FONT_WEIGHT, FONT, TRANSITION, Z,
} from '../components/ui'

const SB_URL = import.meta.env.VITE_SUPABASE_URL || 'https://dvzxkortcvuakjhsidrr.supabase.co'

function relTime(date) {
  if (!date) return '—'
  const d = typeof date === 'string' ? new Date(date) : date
  const ms = Date.now() - d.getTime()
  const min = Math.floor(ms / 60000)
  if (min < 1)   return 'hace segundos'
  if (min < 60)  return `hace ${min}m`
  const h = Math.floor(min / 60)
  if (h < 24)    return `hace ${h}h`
  const days = Math.floor(h / 24)
  if (days < 7)  return `hace ${days}d`
  return d.toLocaleDateString('es-AR')
}

function formatAR(date) {
  if (!date) return '—'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

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

// ════════════════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════════════════
export default function Campanas() {
  const { isRetail, retail, subTenant, tenant } = useAuth()
  const actor = isRetail ? retail : (subTenant || tenant)

  const [channelInfo, setChannelInfo] = useState(null)
  // v3: estado de activación del módulo
  const [statusInfo, setStatusInfo] = useState(null)
  const [activationOpen, setActivationOpen] = useState(false)

  const isWaSender = channelInfo?.channel === 'wasender'
  const isActive = statusInfo?.active === true
  const canSelfActivate = statusInfo?.can_self_activate === true

  const [sourceTab, setSourceTab] = useState('conversations')

  const [search, setSearch] = useState('')
  const [deposited, setDeposited] = useState(null)
  const [createdFrom, setCreatedFrom] = useState('')
  const [createdTo, setCreatedTo] = useState('')
  const [lastDepositFrom, setLastDepositFrom] = useState('')
  const [lastDepositTo, setLastDepositTo] = useState('')
  const [within24hOnly, setWithin24hOnly] = useState(true)

  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState([])
  const [eligible, setEligible] = useState(0)
  const [usage, setUsage] = useState(null)
  const [error, setError] = useState(null)

  const [importedRows, setImportedRows] = useState([])
  const [importedLoading, setImportedLoading] = useState(false)
  const [importedEligible, setImportedEligible] = useState(0)

  const [selected, setSelected] = useState(new Set())
  const [composerOpen, setComposerOpen] = useState(false)
  const [importerOpen, setImporterOpen] = useState(false)

  // v3.1: si combinedMode=true, la selección abarca chats + importados.
  // Cuando es true, NO limpiar selected al cambiar de sourceTab.
  const [combinedMode, setCombinedMode] = useState(false)

  const [pastCampaigns, setPastCampaigns] = useState([])
  const [pastLoading, setPastLoading] = useState(true)

  // v3: cargar status separadamente y exponer reload
  const loadStatus = useCallback(async () => {
    try {
      const { data } = await supabase.rpc('get_my_campaigns_status')
      if (data && !data.error) setStatusInfo(data)
    } catch (e) {
      console.error('get_my_campaigns_status failed', e)
    }
  }, [])

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.rpc('get_my_campaign_channel')
        if (data && !data.error) setChannelInfo(data)
      } catch (e) {
        console.error('get_my_campaign_channel failed', e)
      }
    })()
    loadStatus()
  }, [loadStatus])

  const loadContacts = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const params = {
        p_search: search.trim() || null,
        p_limit: 1000,
        p_offset: 0,
        p_deposited: deposited,
        p_created_from: createdFrom ? new Date(createdFrom + 'T00:00:00').toISOString() : null,
        p_created_to:   createdTo   ? new Date(createdTo + 'T23:59:59').toISOString()   : null,
        p_last_deposit_from: lastDepositFrom ? new Date(lastDepositFrom + 'T00:00:00').toISOString() : null,
        p_last_deposit_to:   lastDepositTo   ? new Date(lastDepositTo + 'T23:59:59').toISOString()   : null,
        p_within_24h_only: isWaSender ? false : within24hOnly,
        p_exclude_optouts: true,
      }
      const { data, error: err } = await supabase.rpc('list_my_contacts_for_campaign', params)
      if (err) throw err
      if (data?.error) throw new Error(data.error)
      setRows(data?.rows || [])
      setEligible(data?.eligible || 0)
    } catch (e) {
      setError(e.message || 'Error cargando contactos')
      setRows([]); setEligible(0)
    } finally { setLoading(false) }
  }, [search, deposited, createdFrom, createdTo, lastDepositFrom, lastDepositTo, within24hOnly, isWaSender])

  const loadImported = useCallback(async () => {
    if (!isWaSender) return
    setImportedLoading(true)
    try {
      const { data, error: err } = await supabase.rpc('list_imported_contacts_for_campaign', {
        p_search: search.trim() || null,
        p_limit: 5000,
        p_offset: 0,
      })
      if (err) throw err
      if (data?.error) throw new Error(data.error)
      setImportedRows(data?.rows || [])
      setImportedEligible(data?.eligible || 0)
    } catch (e) {
      console.error('list_imported_contacts_for_campaign failed', e)
      setImportedRows([])
      setImportedEligible(0)
    } finally {
      setImportedLoading(false)
    }
  }, [isWaSender, search])

  const loadUsage = useCallback(async () => {
    try {
      const { data } = await supabase.rpc('get_my_campaign_daily_usage')
      if (data && !data.error) setUsage(data)
    } catch {}
  }, [])

  const loadPast = useCallback(async () => {
    setPastLoading(true)
    try {
      const { data } = await supabase.rpc('list_my_campaigns', { p_limit: 30, p_offset: 0 })
      if (data && !data.error) setPastCampaigns(data.rows || [])
    } catch {}
    finally { setPastLoading(false) }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => { loadContacts() }, 250)
    return () => clearTimeout(t)
  }, [loadContacts])

  useEffect(() => {
    if (isWaSender && sourceTab === 'imported') {
      const t = setTimeout(() => { loadImported() }, 250)
      return () => clearTimeout(t)
    }
  }, [isWaSender, sourceTab, loadImported])

  // v3.1: si Wasender, precargar también importados al inicio para que
  // el botón "Todos combinados" muestre el total correcto sin requerir
  // que el user cambie de tab primero.
  useEffect(() => {
    if (isWaSender) loadImported()
  }, [isWaSender, loadImported])

  useEffect(() => { loadUsage(); loadPast() }, [loadUsage, loadPast])

  useEffect(() => {
    const ch = supabase.channel('campaigns_changes_' + (actor?.id || 'x'))
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'marketing_campaigns',
      }, () => { loadPast(); loadUsage() })
      .subscribe()
    return () => { try { supabase.removeChannel(ch) } catch {} }
  }, [actor?.id, loadPast, loadUsage])

  // v3.1: al cambiar de tab, limpiar selección SOLO si no estamos
  // en modo combinado. Si combinedMode=true, mantener.
  useEffect(() => {
    if (!combinedMode) setSelected(new Set())
  }, [sourceTab, combinedMode])

  const togglePhone = (phone) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(phone) ? next.delete(phone) : next.add(phone)
      return next
    })
    // toggling manual sale del modo combinado (vuelve a ser selección manual)
    setCombinedMode(false)
  }

  const activeRows = (isWaSender && sourceTab === 'imported') ? importedRows : rows
  const activeLoading = (isWaSender && sourceTab === 'imported') ? importedLoading : loading

  // v3.1: count de elegibles del tab actual (sin filtrar por within_window
  // cuando es Wasender; el backend ya devuelve eligible correcto post-migration).
  const activeEligible = (isWaSender && sourceTab === 'imported') ? importedEligible : eligible

  // v3.1: count combinado para el botón Wasender (chats + importados, no opt-outs)
  const combinedEligibleCount = useMemo(() => {
    if (!isWaSender) return 0
    const phones = new Set()
    rows.forEach(r => { if (!r.opted_out) phones.add(r.phone) })
    importedRows.forEach(r => { if (!r.opted_out) phones.add(r.phone) })
    return phones.size
  }, [isWaSender, rows, importedRows])

  // v3.1: helpers de selección
  const selectAllFiltered = () => {
    // ⭐ Fix: cuando Wasender, no filtrar por within_window
    const eligibleR = activeRows.filter(r => (isWaSender || r.within_window) && !r.opted_out)
    setSelected(new Set(eligibleR.map(r => r.phone)))
    setCombinedMode(false)  // este botón es del tab actual
  }

  const selectAllCombined = () => {
    // Nuevo botón Wasender: une phones de ambas listas, no-optouts
    const phones = new Set()
    rows.forEach(r => { if (!r.opted_out) phones.add(r.phone) })
    importedRows.forEach(r => { if (!r.opted_out) phones.add(r.phone) })
    setSelected(phones)
    setCombinedMode(true)
  }

  const clearSelection = () => {
    setSelected(new Set())
    setCombinedMode(false)
  }

  const selectedCount = selected.size

  // v3.1: contar elegibles considerando AMBAS listas cuando combinedMode o Wasender
  const selectedAndEligibleCount = useMemo(() => {
    // Sources a considerar:
    // - Si combinedMode → ambas listas
    // - Si Wasender en tab específico → solo esa lista
    // - Si Meta → solo rows
    const sourceRows = combinedMode
      ? [...rows, ...importedRows]
      : activeRows
    const eligiblePhones = new Set(
      sourceRows
        .filter(r => (isWaSender || r.within_window) && !r.opted_out)
        .map(r => r.phone)
    )
    return Array.from(selected).filter(p => eligiblePhones.has(p)).length
  }, [selected, activeRows, isWaSender, combinedMode, rows, importedRows])

  const dailyRemaining = usage?.unlimited ? Infinity : (usage?.remaining ?? 0)

  // v3.1: detección automática del `source` que pasamos al composer.
  // - combinedMode → 'combined'
  // - sourceTab='imported' → 'imported'
  // - resto → 'conversations'
  const composerSourceInfo = useMemo(() => {
    if (combinedMode) {
      return { source: 'combined', rows: [...rows, ...importedRows] }
    }
    if (isWaSender && sourceTab === 'imported') {
      return { source: 'imported', rows: importedRows }
    }
    return { source: 'conversations', rows }
  }, [combinedMode, isWaSender, sourceTab, rows, importedRows])

  const resetFilters = () => {
    setSearch(''); setDeposited(null)
    setCreatedFrom(''); setCreatedTo('')
    setLastDepositFrom(''); setLastDepositTo('')
    setWithin24hOnly(true)
  }

  const hasActiveFilters = !!(
    search.trim() ||
    deposited !== null ||
    createdFrom || createdTo ||
    lastDepositFrom || lastDepositTo ||
    (!isWaSender && !within24hOnly)
  )

  if (!channelInfo) {
    return (
      <div>
        <PageHeader eyebrow="Marketing" title="Campañas" />
        <div style={{ color: C.muted, padding: 20 }}>Cargando canal de envío…</div>
      </div>
    )
  }
  if (channelInfo.error) {
    return (
      <div>
        <PageHeader eyebrow="Marketing" title="Campañas" />
        <Banner type="error">No autorizado para acceder a Campañas.</Banner>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        eyebrow="Marketing"
        title="Campañas"
        subtitle={isWaSender
          ? "Envíos masivos por WaSender. Sin restricción de 24h, pero WhatsApp puede bloquear el número si se considera spam."
          : "Mensajes promocionales a clientes que escribieron en las últimas 24 horas (regla Meta)."}
      />

      {/* v3: Banner de activación / vigencia */}
      <CampaignsGateBanner
        statusInfo={statusInfo}
        isActive={isActive}
        canSelfActivate={canSelfActivate}
        onActivate={() => setActivationOpen(true)}
      />

      <ChannelChip channel={channelInfo.channel} />

      {isWaSender ? (
        <div style={{
          background: 'rgba(251,191,36,0.08)',
          border: `1px solid rgba(251,191,36,0.30)`,
          borderRadius: 10,
          padding: '12px 14px',
          marginBottom: 18,
          fontSize: FONT_SIZE.sm,
          color: C.text,
          lineHeight: 1.55,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
        }}>
          <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>⚠️</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: '0 0 4px', fontWeight: FONT_WEIGHT.semibold, color: '#fbbf24' }}>
              WaSender no es oficial — el número puede ser baneado
            </p>
            <p style={{ margin: 0, color: C.muted, fontSize: FONT_SIZE.xs, lineHeight: 1.5 }}>
              No hay restricción de 24h porque usás WhatsApp personal (no API). Pero WhatsApp detecta patrones de spam y banea el número.
              Usá ritmos lentos (60s+ entre mensajes, bloques chicos). Vos sos responsable del contenido enviado.
            </p>
          </div>
        </div>
      ) : (
        <div style={{
          background: 'rgba(239,68,68,0.06)',
          border: `1px solid rgba(239,68,68,0.30)`,
          borderRadius: 10,
          padding: '12px 14px',
          marginBottom: 18,
          fontSize: FONT_SIZE.sm,
          color: C.text,
          lineHeight: 1.55,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
        }}>
          <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>⚠️</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: '0 0 4px', fontWeight: FONT_WEIGHT.semibold, color: '#ef4444' }}>
              Solo enviamos a clientes dentro de la ventana de 24 horas
            </p>
            <p style={{ margin: 0, color: C.muted, fontSize: FONT_SIZE.xs, lineHeight: 1.5 }}>
              Es regla de Meta — si pasaron más de 24h desde que el cliente te escribió, no se puede mandar texto libre.
              Cada mensaje incluye automáticamente la opción de baja (BAJA). Cumplí con la Ley 25.326 de Argentina.
            </p>
          </div>
        </div>
      )}

      <StatGrid minWidth={170} style={{ marginBottom: 18 }}>
        <StatCard
          icon={isWaSender ? "📋" : "💬"}
          label={isWaSender ? "Total disponibles" : "Dentro de ventana 24h"}
          value={isWaSender ? (rows.length + importedRows.length) : eligible}
          accent="success"
          hint={isWaSender ? `${rows.length} chats + ${importedRows.length} importados` : "Contactos que se pueden contactar ahora"}
        />
        <StatCard
          icon="📊"
          label="Envíos hoy"
          value={usage ? (usage.unlimited ? `${usage.used} / ∞` : `${usage.used} / ${usage.limit}`) : '— / —'}
          accent="brand"
          hint={usage?.unlimited ? 'Sin límite diario' : `${dailyRemaining} restantes hoy`}
        />
        <StatCard
          icon="📤"
          label="Seleccionados"
          value={selectedCount}
          accent={selectedCount > 0 ? 'warning' : 'info'}
          hint={selectedAndEligibleCount !== selectedCount ? `${selectedAndEligibleCount} elegibles` : ''}
        />
      </StatGrid>

      <Card padding={16} style={{ marginBottom: 14 }}>
        <SectionHeader title="🔎 Filtros" style={{ marginBottom: 12 }} />

        <FilterRow>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, teléfono o login…"
            style={fi}
          />
        </FilterRow>

        {!isWaSender && (
          <FilterRow>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              padding: '10px 14px',
              borderRadius: RADIUS.md,
              background: within24hOnly ? 'rgba(34,197,94,0.08)' : C.surface,
              border: `1px solid ${within24hOnly ? 'rgba(34,197,94,0.4)' : C.border}`,
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'all .15s',
              width: '100%',
              boxSizing: 'border-box',
            }}>
              <span style={{
                display: 'flex', alignItems: 'center', gap: 8,
                fontSize: FONT_SIZE.sm,
                color: within24hOnly ? '#22c55e' : C.muted,
                fontWeight: FONT_WEIGHT.semibold,
                minWidth: 0,
              }}>
                <input
                  type="checkbox"
                  checked={within24hOnly}
                  onChange={e => setWithin24hOnly(e.target.checked)}
                  style={{ accentColor: '#22c55e', cursor: 'pointer', flexShrink: 0 }}
                />
                Solo dentro de 24h
              </span>
              {!within24hOnly && (
                <span style={{ fontSize: FONT_SIZE.xs, color: '#fbbf24', flexShrink: 0 }}>
                  ⚠️ Modo amplio
                </span>
              )}
            </label>
          </FilterRow>
        )}

        {sourceTab === 'conversations' && (
          <FilterField label="Estado">
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[
                { v: null,  label: 'Todos' },
                { v: 'yes', label: '✓ Depositó' },
                { v: 'no',  label: '✗ Sin depositar' },
              ].map(opt => {
                const active = deposited === opt.v
                return (
                  <button
                    key={String(opt.v)}
                    type="button"
                    onClick={() => setDeposited(opt.v)}
                    style={{
                      background: active ? C.brand : C.surface,
                      color: active ? '#000' : C.text,
                      border: `1px solid ${active ? C.brand : C.border}`,
                      borderRadius: 999,
                      padding: '6px 14px',
                      fontSize: FONT_SIZE.sm,
                      fontWeight: FONT_WEIGHT.medium,
                      cursor: 'pointer',
                      transition: TRANSITION,
                      whiteSpace: 'nowrap',
                    }}
                  >{opt.label}</button>
                )
              })}
            </div>
          </FilterField>
        )}

        {sourceTab === 'conversations' && (
          <>
            <FilterField label="Creado">
              <DateRange from={createdFrom} onChangeFrom={setCreatedFrom} to={createdTo} onChangeTo={setCreatedTo} />
            </FilterField>
            <FilterField label="Depositó" lastRow>
              <DateRange from={lastDepositFrom} onChangeFrom={setLastDepositFrom} to={lastDepositTo} onChangeTo={setLastDepositTo} />
            </FilterField>
          </>
        )}

        {hasActiveFilters && (
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginTop: 12,
            paddingTop: 12,
            borderTop: `1px solid ${C.border}`,
          }}>
            <button
              type="button"
              onClick={resetFilters}
              style={{
                background: 'transparent',
                color: C.muted,
                border: 'none',
                fontSize: FONT_SIZE.sm,
                cursor: 'pointer',
                textDecoration: 'underline',
                padding: '4px 0',
                fontFamily: 'inherit',
              }}
            >Limpiar todos los filtros</button>
          </div>
        )}

        {!isWaSender && !within24hOnly && (
          <div style={{
            marginTop: 12,
            background: 'rgba(251,191,36,0.08)',
            border: `1px solid rgba(251,191,36,0.30)`,
            borderRadius: 8,
            padding: '8px 11px',
            fontSize: FONT_SIZE.xs, color: '#fbbf24', lineHeight: 1.5,
          }}>
            ⚠️ Estás viendo contactos fuera de la ventana de 24h. Esos NO se pueden seleccionar para envío (regla Meta).
          </div>
        )}
      </Card>

      {isWaSender && (
        <div style={{ display: 'flex', gap: 4, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setSourceTab('conversations')}
            style={{
              background: sourceTab === 'conversations' ? C.brand : C.surface,
              color:      sourceTab === 'conversations' ? '#000'  : C.text,
              border: `1px solid ${sourceTab === 'conversations' ? C.brand : C.border}`,
              borderRadius: 999,
              padding: '6px 14px',
              fontSize: FONT_SIZE.sm,
              fontWeight: FONT_WEIGHT.semibold,
              cursor: 'pointer',
            }}
          >💬 Mis chats ({rows.length})</button>
          <button
            type="button"
            onClick={() => setSourceTab('imported')}
            style={{
              background: sourceTab === 'imported' ? C.brand : C.surface,
              color:      sourceTab === 'imported' ? '#000'  : C.text,
              border: `1px solid ${sourceTab === 'imported' ? C.brand : C.border}`,
              borderRadius: 999,
              padding: '6px 14px',
              fontSize: FONT_SIZE.sm,
              fontWeight: FONT_WEIGHT.semibold,
              cursor: 'pointer',
            }}
          >📋 Importados ({importedRows.length})</button>
          <div style={{ flex: 1 }} />
          <Button variant="secondary" onClick={() => setImporterOpen(true)}>
            + Importar contactos
          </Button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: FONT_SIZE.sm, color: C.muted }}>
          Mostrando <b style={{ color: C.text }}>{activeRows.length}</b>
          {' '}{activeRows.length === 1 ? 'contacto' : 'contactos'}
          {selectedCount > 0 && (
            <> · <b style={{ color: C.brand }}>{selectedCount} seleccionados</b>
              {combinedMode && (
                <span style={{ color: C.muted, fontSize: FONT_SIZE.xs }}> (combinado)</span>
              )}
            </>
          )}
        </div>
        <div style={{ flex: 1 }} />
        {selectedCount === 0 ? (
          <>
            <Button variant="secondary" disabled={activeEligible === 0} onClick={selectAllFiltered}>
              ☑ Seleccionar todos ({activeEligible})
            </Button>
            {/* v3.1: botón nuevo para Wasender — combinar chats + importados.
                Solo se muestra si hay datos en al menos una de las listas */}
            {isWaSender && combinedEligibleCount > 0 && combinedEligibleCount !== activeEligible && (
              <Button
                variant="primary"
                onClick={selectAllCombined}
                title="Selecciona contactos de Mis chats Y Importados en una sola campaña"
              >
                📢 Todos: chats + importados ({combinedEligibleCount})
              </Button>
            )}
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={clearSelection}>Limpiar</Button>
            <Button
              variant="primary"
              disabled={selectedAndEligibleCount === 0}
              onClick={() => setComposerOpen(true)}
              title={!isActive ? 'Activá Campañas para enviar' : undefined}
            >
              📢 Crear campaña con {selectedAndEligibleCount}
              {combinedMode && <span style={{ opacity: 0.8, fontSize: '0.85em' }}> (combinado)</span>}
            </Button>
          </>
        )}
      </div>

      {error && <Banner type="error" style={{ marginBottom: 14 }}>{error}</Banner>}
      {activeLoading ? (
        <div style={{ color: C.muted, padding: 20 }}>Cargando contactos…</div>
      ) : activeRows.length === 0 ? (
        <Card padding={0} style={{ borderStyle: 'dashed', marginBottom: 24 }}>
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 42, marginBottom: 14, opacity: 0.7 }}>📭</div>
            <div style={{ fontSize: 16, color: C.text, fontWeight: FONT_WEIGHT.semibold }}>
              {isWaSender && sourceTab === 'imported'
                ? 'Todavía no importaste contactos'
                : 'No hay contactos que cumplan los filtros'}
            </div>
            <div style={{ fontSize: FONT_SIZE.sm, color: C.muted, marginTop: 6 }}>
              {isWaSender && sourceTab === 'imported'
                ? 'Hacé clic en "+ Importar contactos" para sumar números desde CSV o lista pegada.'
                : 'Probá quitar filtros' + (!isWaSender ? ' o desactivar "Solo dentro de 24h"' : '')}
            </div>
          </div>
        </Card>
      ) : (
        <ContactsTable
          rows={activeRows}
          selected={selected}
          onToggle={togglePhone}
          isImportedTab={isWaSender && sourceTab === 'imported'}
          isWaSender={isWaSender}
        />
      )}

      <SectionHeader title="📋 Campañas anteriores" style={{ marginBottom: 12 }} />
      {pastLoading ? (
        <div style={{ color: C.muted, padding: 20 }}>Cargando…</div>
      ) : pastCampaigns.length === 0 ? (
        <Card padding={20} style={{ borderStyle: 'dashed' }}>
          <div style={{ color: C.muted, textAlign: 'center', fontSize: FONT_SIZE.sm }}>
            Todavía no enviaste ninguna campaña.
          </div>
        </Card>
      ) : (
        <Card padding={0}>
          {pastCampaigns.map((c, i) => (
            <CampaignRow key={c.id} campaign={c} isLast={i === pastCampaigns.length - 1} />
          ))}
        </Card>
      )}

      {composerOpen && (
        <CampaignComposer
          selectedPhones={Array.from(selected)}
          rows={composerSourceInfo.rows}
          dailyRemaining={dailyRemaining}
          dailyLimit={usage?.unlimited ? Infinity : (usage?.limit || 200)}
          channelInfo={channelInfo}
          source={composerSourceInfo.source}
          isActive={isActive}
          canSelfActivate={canSelfActivate}
          onClose={() => setComposerOpen(false)}
          onRequestActivate={() => { setComposerOpen(false); setActivationOpen(true) }}
          onSent={() => {
            setComposerOpen(false)
            clearSelection()
            loadPast()
            loadUsage()
            loadContacts()
            if (isWaSender) loadImported()
          }}
        />
      )}

      {importerOpen && (
        <ImporterModal
          onClose={() => setImporterOpen(false)}
          onImported={() => {
            setImporterOpen(false)
            setSourceTab('imported')
            loadImported()
          }}
        />
      )}

      {/* v3: Modal de activación */}
      {activationOpen && (
        <ActivationModal
          statusInfo={statusInfo}
          onClose={() => setActivationOpen(false)}
          onActivated={async () => {
            setActivationOpen(false)
            await loadStatus()
          }}
        />
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════
// v3 — Banner del gate de activación
// ════════════════════════════════════════════════════════════════════
function CampaignsGateBanner({ statusInfo, isActive, canSelfActivate, onActivate }) {
  if (!statusInfo) return null

  // Caso 1: ACTIVO
  if (isActive) {
    const until = statusInfo.campaigns_until
    const days = statusInfo.days_remaining ?? 0
    const isLow = days <= 2
    return (
      <div style={{
        background: isLow ? 'rgba(251,191,36,0.08)' : 'rgba(34,197,94,0.08)',
        border: `1px solid ${isLow ? 'rgba(251,191,36,0.30)' : 'rgba(34,197,94,0.30)'}`,
        borderRadius: 10,
        padding: '12px 14px',
        marginBottom: 14,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
      }}>
        <div style={{ flex: '1 1 200px', minWidth: 0 }}>
          <div style={{
            fontSize: FONT_SIZE.sm,
            fontWeight: FONT_WEIGHT.semibold,
            color: isLow ? '#fbbf24' : '#22c55e',
            marginBottom: 2,
          }}>
            {isLow ? '⏰ Campañas vence pronto' : '✓ Campañas activo'}
          </div>
          <div style={{ fontSize: FONT_SIZE.xs, color: C.muted, lineHeight: 1.5 }}>
            Hasta el <strong style={{ color: C.text }}>{formatAR(until)}</strong>
            {' '}({days === 0 ? 'menos de un día' : `${days} día${days === 1 ? '' : 's'}`})
          </div>
        </div>
        {canSelfActivate && (
          <Button variant="ghost" onClick={onActivate}>
            + Extender días
          </Button>
        )}
      </div>
    )
  }

  // Caso 2: NO ACTIVO + puede autoactivarse (retail/partner)
  if (canSelfActivate) {
    return (
      <div style={{
        background: 'rgba(212,168,67,0.08)',
        border: `1px solid rgba(212,168,67,0.40)`,
        borderRadius: 10,
        padding: '14px 16px',
        marginBottom: 14,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>🔒</span>
        <div style={{ flex: '1 1 240px', minWidth: 0 }}>
          <div style={{
            fontSize: FONT_SIZE.base,
            fontWeight: FONT_WEIGHT.bold,
            color: C.brand,
            marginBottom: 4,
          }}>
            Activá Campañas para enviar mensajes
          </div>
          <div style={{ fontSize: FONT_SIZE.sm, color: C.text, lineHeight: 1.5, marginBottom: 4 }}>
            Podés ver cómo funciona el módulo, pero el envío está bloqueado hasta que actives.
          </div>
          <div style={{ fontSize: FONT_SIZE.xs, color: C.muted, lineHeight: 1.5 }}>
            <strong style={{ color: C.text }}>1 crédito ($5) por día</strong> ·
            {' '}saldo actual: <strong style={{ color: C.text }}>{statusInfo.balance ?? 0} cr</strong> ·
            {' '}Plan Gold lo incluye sin costo extra
          </div>
        </div>
        <Button variant="primary" onClick={onActivate}>
          Activar campañas
        </Button>
      </div>
    )
  }

  // Caso 3: NO ACTIVO + sub-tenant (necesita que partner active)
  return (
    <div style={{
      background: 'rgba(239,68,68,0.06)',
      border: `1px solid rgba(239,68,68,0.30)`,
      borderRadius: 10,
      padding: '14px 16px',
      marginBottom: 14,
      display: 'flex',
      alignItems: 'flex-start',
      gap: 12,
    }}>
      <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>🔒</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: FONT_SIZE.base,
          fontWeight: FONT_WEIGHT.bold,
          color: '#ef4444',
          marginBottom: 4,
        }}>
          Campañas no está activo
        </div>
        <div style={{ fontSize: FONT_SIZE.sm, color: C.text, lineHeight: 1.5 }}>
          Podés explorar el módulo, pero el envío está bloqueado.
          {' '}Pedile a tu operador que active Campañas en tu cuenta.
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════
// v3 — Modal de activación (1-7 días)
// ════════════════════════════════════════════════════════════════════
function ActivationModal({ statusInfo, onClose, onActivated }) {
  const [days, setDays] = useState(7)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const balance = statusInfo?.balance ?? 0
  const unlimited = statusInfo?.unlimited === true
  const hasEnough = unlimited || balance >= days
  const balanceAfter = unlimited ? balance : balance - days
  const costUsd = days * 5

  const submit = async () => {
    setSubmitting(true); setError('')
    try {
      const { data, error: err } = await supabase.rpc('retail_activate_campaigns_self', {
        p_days: days,
        p_reason: 'panel_self_activation',
      })
      if (err) throw err
      if (data?.error) throw new Error(data.error)
      onActivated()
    } catch (e) {
      const msg = e.message || ''
      if (msg.includes('insufficient_credits')) {
        setError('No tenés suficientes créditos. Comprá un pack en Saldo.')
      } else if (msg.includes('invalid days')) {
        setError('Cantidad de días inválida (debe ser entre 1 y 7).')
      } else {
        setError(msg || 'Error al activar Campañas')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.82)',
          zIndex: Z.modal,
        }}
      />
      <div
        style={{
          position: 'fixed',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(440px, calc(100vw - 24px))',
          maxHeight: 'calc(100vh - 48px)',
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: RADIUS.lg,
          zIndex: Z.modal + 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div style={{
          padding: '14px 16px',
          borderBottom: `1px solid ${C.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ fontSize: 16, fontWeight: FONT_WEIGHT.bold, color: C.text }}>
            📢 Activar Campañas
          </div>
          <button
            type="button" onClick={onClose}
            style={{
              background: 'transparent', border: 'none', color: C.text,
              fontSize: 22, lineHeight: 1, cursor: 'pointer', padding: '4px 10px',
            }}
            aria-label="Cerrar"
          >×</button>
        </div>

        <div style={{ padding: 16, overflowY: 'auto' }}>
          <div style={{
            fontSize: FONT_SIZE.sm,
            color: C.muted,
            lineHeight: 1.55,
            marginBottom: 16,
          }}>
            Activá el módulo Campañas para enviar mensajes masivos.
            {' '}Se descuenta <strong style={{ color: C.text }}>1 crédito por cada día</strong> activado.
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{
                fontSize: FONT_SIZE.xs,
                color: C.muted,
                fontFamily: FONT.mono,
                textTransform: 'uppercase',
                letterSpacing: '.06em',
                fontWeight: FONT_WEIGHT.semibold,
              }}>Días a activar</span>
              <span style={{
                fontSize: 22,
                fontWeight: FONT_WEIGHT.bold,
                color: C.brand,
                fontFamily: FONT.mono,
                lineHeight: 1,
              }}>{days}</span>
            </div>
            <input
              type="range"
              min={1} max={7} step={1}
              value={days}
              onChange={e => setDays(parseInt(e.target.value, 10))}
              style={{ width: '100%', accentColor: C.brand, cursor: 'pointer' }}
            />
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 4,
              fontSize: FONT_SIZE.xs,
              color: C.muted,
              fontFamily: FONT.mono,
            }}>
              <span>1d</span>
              <span>7d</span>
            </div>
          </div>

          <div style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            padding: 12,
            marginBottom: 14,
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: 8,
            fontSize: FONT_SIZE.sm,
          }}>
            <span style={{ color: C.muted }}>Costo</span>
            <span style={{ color: C.text, fontWeight: FONT_WEIGHT.semibold, fontFamily: FONT.mono }}>
              {days} cr · USD {costUsd}
            </span>
            <span style={{ color: C.muted }}>Saldo actual</span>
            <span style={{ color: C.text, fontFamily: FONT.mono }}>
              {unlimited ? '∞ ilimitado' : `${balance} cr`}
            </span>
            <span style={{ color: C.muted }}>Saldo después</span>
            <span style={{
              color: hasEnough ? '#22c55e' : '#ef4444',
              fontWeight: FONT_WEIGHT.semibold,
              fontFamily: FONT.mono,
            }}>
              {unlimited ? '∞ ilimitado' : `${balanceAfter} cr`}
            </span>
          </div>

          {!hasEnough && (
            <div style={{
              background: 'rgba(239,68,68,0.08)',
              border: `1px solid rgba(239,68,68,0.30)`,
              borderRadius: 8,
              padding: '10px 12px',
              fontSize: FONT_SIZE.sm,
              color: '#ef4444',
              marginBottom: 12,
              lineHeight: 1.5,
            }}>
              No tenés saldo suficiente. Necesitás <strong>{days} créditos</strong> y tenés <strong>{balance}</strong>.
              {' '}Comprá un pack desde la sección Saldo.
            </div>
          )}

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.10)',
              border: `1px solid rgba(239,68,68,0.30)`,
              borderRadius: 8,
              padding: '8px 11px',
              fontSize: FONT_SIZE.sm,
              color: '#ef4444',
              marginBottom: 12,
            }}>{error}</div>
          )}
        </div>

        <div style={{
          padding: 14,
          borderTop: `1px solid ${C.border}`,
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 8,
          flexWrap: 'wrap',
        }}>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button
            variant="primary"
            onClick={submit}
            disabled={!hasEnough || submitting}
            loading={submitting}
          >
            {submitting ? 'Activando…' : `Activar ${days}d`}
          </Button>
        </div>
      </div>
    </>
  )
}

function ChannelChip({ channel }) {
  const isWa = channel === 'wasender'
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      padding: '6px 12px',
      borderRadius: 999,
      background: isWa ? 'rgba(251,191,36,0.10)' : 'rgba(45,107,216,0.10)',
      border: `1px solid ${isWa ? 'rgba(251,191,36,0.40)' : 'rgba(45,107,216,0.40)'}`,
      marginBottom: 16,
      fontSize: FONT_SIZE.xs,
      fontFamily: FONT.mono,
      color: isWa ? '#fbbf24' : '#5589E8',
      fontWeight: FONT_WEIGHT.semibold,
      textTransform: 'uppercase',
      letterSpacing: '.05em',
    }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'currentColor' }} />
      Canal: {isWa ? 'WaSender (no oficial)' : 'WhatsApp Business API (Meta)'}
    </div>
  )
}

function FilterRow({ children, lastRow = false }) {
  return <div style={{ marginBottom: lastRow ? 0 : 10 }}>{children}</div>
}

function FilterField({ label, children, lastRow = false }) {
  return (
    <div style={{ marginBottom: lastRow ? 0 : 10 }}>
      <div style={{
        fontSize: FONT_SIZE.xs,
        color: C.muted,
        fontFamily: FONT.mono,
        textTransform: 'uppercase',
        letterSpacing: '.06em',
        fontWeight: FONT_WEIGHT.semibold,
        marginBottom: 6,
      }}>{label}</div>
      <div>{children}</div>
    </div>
  )
}

function DateRange({ from, onChangeFrom, to, onChangeTo }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr auto 1fr',
      gap: 8,
      alignItems: 'center',
    }}>
      <input
        type="date" value={from} onChange={e => onChangeFrom(e.target.value)}
        style={{ ...fi, fontFamily: FONT.mono, fontSize: FONT_SIZE.sm, padding: '8px 10px', minWidth: 0 }}
      />
      <span style={{ fontSize: FONT_SIZE.sm, color: C.muted, padding: '0 4px' }}>→</span>
      <input
        type="date" value={to} onChange={e => onChangeTo(e.target.value)}
        style={{ ...fi, fontFamily: FONT.mono, fontSize: FONT_SIZE.sm, padding: '8px 10px', minWidth: 0 }}
      />
    </div>
  )
}

function ContactsTable({ rows, selected, onToggle, isImportedTab, isWaSender }) {
  const cols = isImportedTab
    ? '40px 1fr 140px 130px 130px'
    : isWaSender
      ? '40px 1fr 140px 130px 110px'
      : '40px 1fr 140px 130px 130px 110px'

  return (
    <Card padding={0} style={{ marginBottom: 24, overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto', maxHeight: '60vh', overflowY: 'auto' }}>
        <div style={{ minWidth: 720 }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: cols,
            gap: 8,
            padding: '10px 14px',
            background: C.surface,
            borderBottom: `1px solid ${C.border}`,
            fontSize: FONT_SIZE.xs,
            color: C.muted,
            fontFamily: FONT.mono,
            textTransform: 'uppercase',
            letterSpacing: '.05em',
            fontWeight: FONT_WEIGHT.semibold,
          }}>
            <span></span>
            <span>{isImportedTab ? 'Nombre' : 'Contacto'}</span>
            <span>Teléfono</span>
            {isImportedTab ? (
              <>
                <span>Importado</span>
                <span>Origen</span>
              </>
            ) : (
              <>
                {!isWaSender && <span>Último msg</span>}
                <span>Depósitos</span>
                <span>Estado</span>
              </>
            )}
          </div>

          {rows.map((r, i) => {
            const isSelected = selected.has(r.phone)
            // ⭐ v3.1 fix: Wasender no aplica filtro within_window
            const isEligible = (isWaSender || r.within_window) && !r.opted_out
            return (
              <div
                key={r.id || r.conversation_id || r.phone || i}
                style={{
                  display: 'grid',
                  gridTemplateColumns: cols,
                  gap: 8,
                  padding: '12px 14px',
                  borderBottom: i < rows.length - 1 ? `1px solid ${C.border}` : 'none',
                  alignItems: 'center',
                  background: isSelected ? 'rgba(212,168,67,0.06)' : 'transparent',
                  cursor: isEligible ? 'pointer' : 'default',
                  opacity: isEligible ? 1 : 0.55,
                }}
                onClick={() => isEligible && onToggle(r.phone)}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  disabled={!isEligible}
                  onChange={() => isEligible && onToggle(r.phone)}
                  onClick={(e) => e.stopPropagation()}
                  style={{ cursor: isEligible ? 'pointer' : 'not-allowed', accentColor: C.brand }}
                />
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontSize: FONT_SIZE.base,
                    color: C.text,
                    fontWeight: FONT_WEIGHT.semibold,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {r.contact_name || '(Sin nombre)'}
                  </div>
                  {r.casino_login && (
                    <div style={{
                      fontSize: FONT_SIZE.xs, color: C.muted, fontFamily: FONT.mono,
                      marginTop: 2,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{r.casino_login}</div>
                  )}
                </div>
                <div style={{ fontSize: FONT_SIZE.sm, color: C.muted, fontFamily: FONT.mono }}>
                  {r.phone}
                </div>
                {isImportedTab ? (
                  <>
                    <div style={{ fontSize: FONT_SIZE.sm, color: C.muted }}>
                      {r.imported_at ? relTime(r.imported_at) : '—'}
                    </div>
                    <div style={{
                      fontSize: FONT_SIZE.xs, color: C.muted, fontFamily: FONT.mono,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {r.source_label || '—'}
                    </div>
                  </>
                ) : (
                  <>
                    {!isWaSender && (
                      <div style={{ fontSize: FONT_SIZE.sm, color: r.within_window ? '#22c55e' : C.muted }}>
                        {r.last_message_at ? relTime(r.last_message_at) : '—'}
                      </div>
                    )}
                    <div style={{ fontSize: FONT_SIZE.sm, color: C.text }}>
                      {r.orders_count > 0 ? (
                        <span style={{ color: '#22c55e', fontWeight: FONT_WEIGHT.semibold }}>
                          {r.orders_count} · ${Math.round(Number(r.total_amount || 0)).toLocaleString('es-AR')}
                        </span>
                      ) : (
                        <span style={{ color: C.muted }}>—</span>
                      )}
                    </div>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      fontSize: FONT_SIZE.xs,
                      color: r.opted_out ? '#ef4444' : (r.within_window ? '#22c55e' : '#fbbf24'),
                      fontWeight: FONT_WEIGHT.semibold,
                    }}>
                      <span style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: r.opted_out ? '#ef4444' : (r.within_window ? '#22c55e' : '#fbbf24'),
                      }} />
                      {r.opted_out ? 'Baja' : (isWaSender ? 'OK' : (r.within_window ? 'En 24h' : 'Fuera 24h'))}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}

function CampaignRow({ campaign, isLast }) {
  const [expanded, setExpanded] = useState(false)
  const [details, setDetails] = useState(null)
  const [loadingDetails, setLoadingDetails] = useState(false)

  const statusBadge = useMemo(() => {
    const map = {
      draft:     { bg: 'rgba(78,81,104,0.20)', color: C.muted,   label: 'Borrador' },
      sending:   { bg: 'rgba(251,191,36,0.15)', color: '#fbbf24', label: 'Enviando…' },
      sent:      { bg: 'rgba(34,197,94,0.15)',  color: '#22c55e', label: 'Enviada' },
      failed:    { bg: 'rgba(239,68,68,0.15)',  color: '#ef4444', label: 'Falló' },
      cancelled: { bg: 'rgba(78,81,104,0.20)',  color: C.muted,   label: 'Cancelada' },
    }
    return map[campaign.status] || map.draft
  }, [campaign.status])

  const channelChip = campaign.channel === 'wasender' ? 'WaSender' : 'Meta'

  const loadDetails = async () => {
    if (details) return
    setLoadingDetails(true)
    try {
      const { data } = await supabase.rpc('get_campaign_details', { p_campaign_id: campaign.id })
      if (data && !data.error) setDetails(data)
    } catch {}
    finally { setLoadingDetails(false) }
  }

  const toggle = () => {
    setExpanded(e => !e)
    if (!expanded) loadDetails()
  }

  const sent = campaign.sent_count || 0
  const failed = campaign.failed_count || 0
  const skipped = campaign.skipped_count || 0
  const total = campaign.total_count || 0

  return (
    <div style={{ borderBottom: isLast ? 'none' : `1px solid ${C.border}` }}>
      <div
        onClick={toggle}
        style={{
          padding: '14px 16px',
          display: 'grid',
          gridTemplateColumns: '1fr auto auto auto',
          gap: 10,
          alignItems: 'center',
          cursor: 'pointer',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontSize: FONT_SIZE.base,
            color: C.text,
            fontWeight: FONT_WEIGHT.semibold,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {campaign.name}
          </div>
          <div style={{ fontSize: FONT_SIZE.xs, color: C.muted, fontFamily: FONT.mono, marginTop: 3 }}>
            {campaign.created_at ? new Date(campaign.created_at).toLocaleString('es-AR') : ''}
          </div>
        </div>
        <span style={{
          fontSize: 10,
          padding: '2px 8px',
          borderRadius: 999,
          background: campaign.channel === 'wasender' ? 'rgba(251,191,36,0.15)' : 'rgba(45,107,216,0.15)',
          color:      campaign.channel === 'wasender' ? '#fbbf24'                : '#5589E8',
          fontFamily: FONT.mono,
          fontWeight: FONT_WEIGHT.semibold,
          textTransform: 'uppercase',
          letterSpacing: '.04em',
          whiteSpace: 'nowrap',
        }}>{channelChip}</span>
        <div style={{ display: 'flex', gap: 10, fontSize: FONT_SIZE.sm, alignItems: 'center' }}>
          <span style={{ color: '#22c55e', fontWeight: FONT_WEIGHT.semibold }}>{sent}✓</span>
          {failed > 0 && <span style={{ color: '#ef4444' }}>{failed}✗</span>}
          {skipped > 0 && <span style={{ color: C.muted }}>{skipped}⊘</span>}
          <span style={{ color: C.muted, fontSize: FONT_SIZE.xs }}>/ {total}</span>
        </div>
        <div style={{
          fontSize: FONT_SIZE.xs,
          padding: '4px 10px',
          borderRadius: 999,
          background: statusBadge.bg,
          color: statusBadge.color,
          fontWeight: FONT_WEIGHT.bold,
          textTransform: 'uppercase',
          letterSpacing: '.04em',
          whiteSpace: 'nowrap',
        }}>
          {statusBadge.label}
        </div>
      </div>

      {expanded && (
        <div style={{
          padding: '12px 16px 16px',
          background: 'rgba(0,0,0,0.15)',
          fontSize: FONT_SIZE.sm,
        }}>
          {loadingDetails ? (
            <div style={{ color: C.muted }}>Cargando detalle…</div>
          ) : !details ? (
            <div style={{ color: C.muted }}>Sin datos</div>
          ) : (
            <>
              <div style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                padding: 10,
                whiteSpace: 'pre-wrap',
                fontSize: FONT_SIZE.sm,
                color: C.text,
                marginBottom: 12,
                maxHeight: 140,
                overflowY: 'auto',
              }}>
                {details.campaign?.message_body || '(sin mensaje)'}
              </div>
              <div style={{ fontSize: FONT_SIZE.xs, color: C.muted, marginBottom: 6, fontFamily: FONT.mono }}>
                Destinatarios ({details.recipients?.length || 0}):
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 240, overflowY: 'auto' }}>
                {(details.recipients || []).slice(0, 50).map(r => (
                  <div key={r.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 8,
                    padding: '4px 8px',
                    background: C.bg,
                    border: `1px solid ${C.border}`,
                    borderRadius: 6,
                    fontSize: FONT_SIZE.xs,
                  }}>
                    <span style={{ color: C.text, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.contact_name || r.phone}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

const OPTOUT_FOOTER = '\n\nPara no recibir más mensajes respondé BAJA'

function CampaignComposer({
  selectedPhones, rows, dailyRemaining, dailyLimit, channelInfo, source,
  isActive, canSelfActivate,
  onClose, onRequestActivate, onSent,
}) {
  const isWaSender = channelInfo?.channel === 'wasender'
  const isCombined = source === 'combined'

  const [name, setName] = useState(() => {
    const today = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
    return `Campaña ${today}`
  })
  const [body, setBody] = useState('Hola {nombre}! ')
  const [acceptedRisk, setAcceptedRisk] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const [paceDelay, setPaceDelay] = useState(isWaSender ? 60 : 30)
  const [paceBlock, setPaceBlock] = useState(isWaSender ? 8  : 10)
  const [pacePause, setPacePause] = useState(isWaSender ? 600 : 300)

  const resetPace = () => {
    setPaceDelay(isWaSender ? 60 : 30)
    setPaceBlock(isWaSender ? 8  : 10)
    setPacePause(isWaSender ? 600 : 300)
  }

  const summary = useMemo(() => {
    const selectedSet = new Set(selectedPhones)
    const selectedRows = rows.filter(r => selectedSet.has(r.phone))
    let optouts = 0, windowOut = 0, eligible = 0
    selectedRows.forEach(r => {
      if (r.opted_out) optouts++
      else if (!isWaSender && !r.within_window) windowOut++
      else eligible++
    })
    return {
      total: selectedPhones.length,
      eligible,
      optouts,
      windowOut,
      toSend: Math.min(eligible, dailyRemaining),
      overLimit: Math.max(0, eligible - dailyRemaining),
    }
  }, [selectedPhones, rows, dailyRemaining, isWaSender])

  const previewRecipient = useMemo(() => {
    const sel = new Set(selectedPhones)
    return rows.find(r => sel.has(r.phone) && (isWaSender || r.within_window) && !r.opted_out)
  }, [selectedPhones, rows, isWaSender])

  const estimatedDuration = useMemo(() => {
    const N = summary.toSend
    if (N <= 1) return { label: 'Instantáneo' }
    const gaps = N - 1
    const longGaps = Math.floor(N / paceBlock) - (N % paceBlock === 0 ? 1 : 0)
    const normalGaps = gaps - Math.max(0, longGaps)
    const totalSec = (normalGaps * paceDelay) + (Math.max(0, longGaps) * pacePause)
    const h = Math.floor(totalSec / 3600)
    const m = Math.floor((totalSec % 3600) / 60)
    const s = totalSec % 60
    let label = ''
    if (h > 0) label = `~${h}h ${m}min`
    else if (m > 0) label = `~${m}min ${s > 0 ? `${s}s` : ''}`.trim()
    else label = `~${s}s`
    return { label }
  }, [summary.toSend, paceDelay, paceBlock, pacePause])

  const renderedPreview = useMemo(() => {
    const nm = previewRecipient?.contact_name || 'Cliente'
    let rendered = body.replace(/\{nombre\}/g, nm)
    if (!/baja|stop|no recibir|darse de baja/i.test(rendered)) {
      rendered += OPTOUT_FOOTER
    }
    return rendered
  }, [body, previewRecipient])

  // v3: gate UI — botón disabled si no está activo
  const canSubmit = !!name.trim()
    && body.trim().length >= 10
    && acceptedRisk
    && summary.toSend > 0
    && !sending
    && isActive

  const submit = async () => {
    if (!canSubmit) return
    setSending(true); setError('')
    try {
      const { data: createRes, error: createErr } = await supabase.rpc('create_campaign', {
        p_name: name.trim(),
        p_message_body: body.trim(),
        p_phones: selectedPhones,
        p_filters_json: { source, created_at: new Date().toISOString() },
        p_send_pace: { delay_seconds: paceDelay, block_size: paceBlock, block_pause_seconds: pacePause },
        p_source: source,
      })
      if (createErr) throw createErr
      if (createRes?.error) {
        // v3: error específico del gate
        if (createRes.error === 'campaigns_not_active') {
          throw new Error('Campañas no está activo. Activalo primero.')
        }
        throw new Error(createRes.error)
      }
      const campaignId = createRes.campaign_id
      if (!campaignId) throw new Error('No se obtuvo campaign_id')

      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${SB_URL}/functions/v1/send-campaign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token || ''}` },
        body: JSON.stringify({ campaign_id: campaignId }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.error) {
        console.warn('[send-campaign] error:', json)
        if (json?.error === 'n8n_trigger_failed') {
          throw new Error('La campaña se creó pero el envío no arrancó. Reintentá en unos segundos.')
        }
      }

      onSent()
    } catch (e) {
      setError(e.message || 'Error al crear la campaña')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.82)',
          zIndex: Z.modal,
        }}
      />
      <div
        style={{
          position: 'fixed', top: 8, left: 8, right: 8, bottom: 8,
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: RADIUS.lg,
          zIndex: Z.modal + 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div style={{
          padding: '12px 14px',
          borderBottom: `1px solid ${C.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          flexShrink: 0,
        }}>
          <div style={{
            color: C.text,
            fontSize: 16,
            fontWeight: FONT_WEIGHT.bold,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            minWidth: 0,
          }}>📢 Nueva campaña</div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: C.text,
              fontSize: 22,
              lineHeight: 1,
              cursor: 'pointer',
              padding: '4px 10px',
              flexShrink: 0,
            }}
            aria-label="Cerrar"
          >×</button>
        </div>

        <div style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: 14,
          wordBreak: 'break-word',
          overflowWrap: 'break-word',
        }}>
          {/* v3: aviso de gate dentro del composer */}
          {!isActive && (
            <div style={{
              background: 'rgba(212,168,67,0.08)',
              border: `1px solid rgba(212,168,67,0.40)`,
              borderRadius: 10,
              padding: '10px 12px',
              marginBottom: 12,
              fontSize: FONT_SIZE.sm,
              color: C.text,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              flexWrap: 'wrap',
            }}>
              <span style={{ fontSize: 16, lineHeight: 1, flexShrink: 0 }}>🔒</span>
              <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                <div style={{ fontWeight: FONT_WEIGHT.semibold, color: C.brand, marginBottom: 2 }}>
                  Campañas no está activo
                </div>
                <div style={{ fontSize: FONT_SIZE.xs, color: C.muted, lineHeight: 1.5 }}>
                  {canSelfActivate
                    ? 'Podés ver cómo armás la campaña, pero el envío está bloqueado hasta activar.'
                    : 'Podés ver cómo armás la campaña, pero el envío está bloqueado. Pedile a tu operador que active.'}
                </div>
              </div>
              {canSelfActivate && (
                <Button variant="primary" onClick={onRequestActivate}>
                  Activar
                </Button>
              )}
            </div>
          )}

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            borderRadius: 999,
            background: isWaSender ? 'rgba(251,191,36,0.10)' : 'rgba(45,107,216,0.10)',
            border: `1px solid ${isWaSender ? 'rgba(251,191,36,0.40)' : 'rgba(45,107,216,0.40)'}`,
            color: isWaSender ? '#fbbf24' : '#5589E8',
            fontSize: 10,
            fontFamily: FONT.mono,
            fontWeight: FONT_WEIGHT.semibold,
            textTransform: 'uppercase',
            letterSpacing: '.05em',
            marginBottom: 12,
          }}>
            {isWaSender ? 'WaSender · sin restricción 24h' : 'WA Business API · Meta'}
            {source === 'imported' && <span> · importados</span>}
            {isCombined && <span> · chats + importados</span>}
          </div>

          <div style={{
            background: isWaSender ? 'rgba(251,191,36,0.08)' : 'rgba(239,68,68,0.08)',
            border: `1px solid ${isWaSender ? 'rgba(251,191,36,0.35)' : 'rgba(239,68,68,0.35)'}`,
            borderRadius: 10,
            padding: '10px 12px',
            marginBottom: 14,
            fontSize: FONT_SIZE.sm,
            color: C.text,
            lineHeight: 1.5,
          }}>
            <div style={{
              fontWeight: FONT_WEIGHT.bold,
              color: isWaSender ? '#fbbf24' : '#ef4444',
              marginBottom: 4,
            }}>
              ⚠️ {isWaSender ? 'Riesgo de bloqueo del número' : 'Responsabilidad legal del envío'}
            </div>
            <div style={{ color: C.muted, fontSize: FONT_SIZE.xs, lineHeight: 1.5 }}>
              {isWaSender
                ? 'WhatsApp puede bloquear tu número si detecta patrones de spam. Usá ritmos lentos (60s+ entre msgs). Vos sos responsable del contenido.'
                : 'Sos responsable del contenido del mensaje y del cumplimiento de la Ley 25.326 y políticas de Meta. Solo se envía a contactos en la ventana de 24h.'}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
            <SimpleStat label="Seleccionados" value={summary.total} color={C.text} />
            <SimpleStat label="A enviar" value={summary.toSend} color="#22c55e" />
            {summary.windowOut > 0 && <SimpleStat label="Fuera 24h" value={summary.windowOut} color="#fbbf24" />}
            {summary.optouts > 0 && <SimpleStat label="Bajas" value={summary.optouts} color="#ef4444" />}
          </div>

          {summary.toSend === 0 && (
            <div style={{
              background: 'rgba(251,191,36,0.10)',
              border: `1px solid rgba(251,191,36,0.30)`,
              borderRadius: 8,
              padding: '8px 11px',
              fontSize: FONT_SIZE.sm,
              color: '#fbbf24',
              marginBottom: 12,
            }}>No hay destinatarios elegibles para enviar.</div>
          )}

          {summary.overLimit > 0 && (
            <div style={{
              background: 'rgba(212,168,67,0.08)',
              border: `1px solid rgba(212,168,67,0.30)`,
              borderRadius: 8,
              padding: '8px 11px',
              fontSize: FONT_SIZE.sm,
              color: C.text,
              marginBottom: 12,
            }}>
              Hoy ya enviaste {dailyLimit - dailyRemaining} mensajes. Se enviarán {summary.toSend} ahora y los {summary.overLimit} restantes quedan para mañana.
            </div>
          )}

          <div style={{ marginBottom: 12 }}>
            <Label>Nombre interno</Label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={80}
              style={fi}
              placeholder="Ej: Promo octubre"
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <Label>Mensaje · Usá {'{nombre}'} para personalizar</Label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={5}
              maxLength={4000}
              style={{ ...fi, fontFamily: 'inherit', resize: 'vertical', minHeight: 100, lineHeight: 1.5 }}
              placeholder={'Hola {nombre}! Tenemos una promo especial para vos…'}
            />
            <div style={{ fontSize: FONT_SIZE.xs, color: C.muted, marginTop: 4 }}>
              {body.length} / 4000 · Se agrega "BAJA" automáticamente al final.
            </div>
          </div>

          {previewRecipient && (
            <div style={{ marginBottom: 14 }}>
              <Label>Preview ({previewRecipient.contact_name || previewRecipient.phone})</Label>
              <div style={{
                background: '#0a4d2a',
                border: `1px solid rgba(34,197,94,0.4)`,
                borderRadius: 10,
                padding: '10px 12px',
                fontSize: FONT_SIZE.sm,
                color: '#e6ffe8',
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}>
                {renderedPreview}
              </div>
            </div>
          )}

          <div style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            padding: 12,
            marginBottom: 14,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ color: C.text, fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold }}>
                ⚙️ Ritmo de envío
              </div>
              <button
                type="button"
                onClick={resetPace}
                style={{
                  background: 'transparent', color: C.muted, border: 'none',
                  fontSize: FONT_SIZE.xs, cursor: 'pointer', textDecoration: 'underline',
                  fontFamily: 'inherit',
                }}
              >Reset</button>
            </div>

            <SimpleSlider
              label="Entre mensajes"
              value={paceDelay} onChange={setPaceDelay}
              min={5} max={300} step={5}
              format={(v) => v < 60 ? `${v}s` : `${Math.floor(v/60)}m${v%60 ? ` ${v%60}s` : ''}`}
            />
            <SimpleSlider
              label="Mensajes por bloque"
              value={paceBlock} onChange={setPaceBlock}
              min={1} max={50} step={1}
              format={(v) => `${v}`}
            />
            <SimpleSlider
              label="Pausa entre bloques"
              value={pacePause} onChange={setPacePause}
              min={0} max={3600} step={30}
              format={(v) => v === 0 ? 'sin pausa' : v < 60 ? `${v}s` : `${Math.floor(v/60)}m`}
            />

            {summary.toSend > 1 && (
              <div style={{
                marginTop: 8,
                padding: '8px 10px',
                background: 'rgba(212,168,67,0.08)',
                borderRadius: 6,
                fontSize: FONT_SIZE.xs,
                color: C.text,
              }}>
                Duración estimada: <strong style={{ color: C.brand }}>{estimatedDuration.label}</strong>
              </div>
            )}
          </div>

          <div
            onClick={() => setAcceptedRisk(!acceptedRisk)}
            style={{
              padding: 12,
              background: acceptedRisk ? 'rgba(34,197,94,0.06)' : C.surface,
              border: `1px solid ${acceptedRisk ? 'rgba(34,197,94,0.35)' : C.border}`,
              borderRadius: 10,
              cursor: 'pointer',
              marginBottom: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <input
                type="checkbox"
                checked={acceptedRisk}
                onChange={e => setAcceptedRisk(e.target.checked)}
                onClick={e => e.stopPropagation()}
                style={{ accentColor: '#22c55e', cursor: 'pointer' }}
              />
              <div style={{
                color: acceptedRisk ? '#22c55e' : C.text,
                fontSize: FONT_SIZE.sm,
                fontWeight: FONT_WEIGHT.semibold,
              }}>
                Confirmo y acepto la responsabilidad
              </div>
            </div>
            <div style={{
              fontSize: FONT_SIZE.xs,
              color: C.muted,
              lineHeight: 1.5,
              wordBreak: 'break-word',
            }}>
              {isWaSender
                ? 'Entiendo que WhatsApp puede bloquear el número si se considera spam. Soy responsable del contenido enviado.'
                : 'Soy responsable del contenido. Los destinatarios consintieron recibir comunicaciones. Cumplo con la Ley 25.326 y políticas de Meta.'}
            </div>
          </div>

          {error && (
            <div style={{
              padding: '8px 10px',
              background: 'rgba(239,68,68,0.10)',
              border: `1px solid rgba(239,68,68,0.30)`,
              borderRadius: 8,
              fontSize: FONT_SIZE.sm,
              color: '#ef4444',
              marginBottom: 8,
            }}>{error}</div>
          )}
        </div>

        <div style={{
          padding: 12,
          borderTop: `1px solid ${C.border}`,
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 8,
          flexShrink: 0,
          flexWrap: 'wrap',
        }}>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button
            variant="primary"
            onClick={submit}
            disabled={!canSubmit}
            loading={sending}
            title={!isActive ? 'Activá Campañas para poder enviar' : undefined}
          >
            {sending ? 'Creando…' : (!isActive ? '🔒 Inactivo' : `Enviar a ${summary.toSend}`)}
          </Button>
        </div>
      </div>
    </>
  )
}

function ImporterModal({ onClose, onImported }) {
  const [tab, setTab] = useState('paste')
  const [pasteText, setPasteText] = useState('')
  const [csvFileName, setCsvFileName] = useState('')
  const [csvRows, setCsvRows] = useState([])
  const [parsing, setParsing] = useState(false)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const fileInputRef = useRef(null)

  const parseLines = (text) => {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
    return lines.map(line => {
      const parts = line.split(/[,;\t]/).map(s => s.trim())
      const phone = parts[0]
      const name = parts.slice(1).filter(Boolean).join(' ') || null
      return { phone, name }
    }).filter(r => r.phone)
  }

  const pasteRows = useMemo(() => parseLines(pasteText), [pasteText])

  const validatedRows = useMemo(() => {
    const source = tab === 'paste' ? pasteRows : csvRows
    return source.map(r => {
      const cleaned = (r.phone || '').replace(/[^0-9]/g, '')
      return {
        phone: cleaned,
        name: r.name,
        valid: cleaned.length >= 10 && cleaned.length <= 16,
      }
    })
  }, [tab, pasteRows, csvRows])

  const validCount = validatedRows.filter(r => r.valid).length
  const invalidCount = validatedRows.length - validCount

  const handleCsvUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCsvFileName(file.name)
    setParsing(true)
    setError('')
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const text = ev.target.result
        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
        const firstLine = (lines[0] || '').toLowerCase()
        const hasHeader = /phone|tel[eé]fono|nombre|name/.test(firstLine)
        const dataLines = hasHeader ? lines.slice(1) : lines
        const parsed = parseLines(dataLines.join('\n'))
        setCsvRows(parsed)
      } catch (err) {
        setError('Error parseando CSV: ' + err.message)
      } finally {
        setParsing(false)
      }
    }
    reader.onerror = () => {
      setError('No se pudo leer el archivo')
      setParsing(false)
    }
    reader.readAsText(file)
  }

  const submit = async () => {
    if (validCount === 0) {
      setError('No hay teléfonos válidos para importar')
      return
    }
    setImporting(true); setError('')
    try {
      const sourceLabel = tab === 'csv' && csvFileName
        ? csvFileName
        : `Pegado ${new Date().toLocaleDateString('es-AR')}`
      const rowsToSend = validatedRows.filter(r => r.valid).map(r => ({
        phone: r.phone,
        name: r.name,
      }))
      const { data, error: err } = await supabase.rpc('import_campaign_contacts', {
        p_rows: rowsToSend,
        p_source_label: sourceLabel,
      })
      if (err) throw err
      if (data?.error) throw new Error(data.error)
      setResult(data)
    } catch (e) {
      setError(e.message || 'Error importando contactos')
    } finally {
      setImporting(false)
    }
  }

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.82)',
          zIndex: Z.modal,
        }}
      />
      <div
        style={{
          position: 'fixed', top: 8, left: 8, right: 8, bottom: 8,
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: RADIUS.lg,
          zIndex: Z.modal + 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div style={{
          padding: '12px 14px',
          borderBottom: `1px solid ${C.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          flexShrink: 0,
        }}>
          <div style={{
            color: C.text,
            fontSize: 16,
            fontWeight: FONT_WEIGHT.bold,
          }}>📋 Importar contactos</div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: C.text,
              fontSize: 22,
              lineHeight: 1,
              cursor: 'pointer',
              padding: '4px 10px',
            }}
            aria-label="Cerrar"
          >×</button>
        </div>

        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: 14,
          wordBreak: 'break-word',
        }}>
          {result ? (
            <div>
              <div style={{
                background: 'rgba(34,197,94,0.08)',
                border: `1px solid rgba(34,197,94,0.30)`,
                borderRadius: 10,
                padding: 14,
                marginBottom: 14,
              }}>
                <div style={{ color: '#22c55e', fontWeight: FONT_WEIGHT.bold, fontSize: 16, marginBottom: 8 }}>
                  ✓ Importación completada
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <SimpleStat label="Nuevos" value={result.inserted} color="#22c55e" />
                  <SimpleStat label="Duplicados" value={result.duplicates} color="#fbbf24" />
                  <SimpleStat label="Inválidos" value={result.invalid} color="#ef4444" />
                </div>
              </div>
              <div style={{ fontSize: FONT_SIZE.sm, color: C.muted, marginBottom: 12 }}>
                Los contactos importados aparecerán en la tab "Importados".
              </div>
              <Button variant="primary" onClick={onImported}>Ver contactos importados</Button>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
                <button
                  type="button"
                  onClick={() => setTab('paste')}
                  style={{
                    background: tab === 'paste' ? C.brand : C.surface,
                    color: tab === 'paste' ? '#000' : C.text,
                    border: `1px solid ${tab === 'paste' ? C.brand : C.border}`,
                    borderRadius: 999,
                    padding: '6px 14px',
                    fontSize: FONT_SIZE.sm,
                    fontWeight: FONT_WEIGHT.semibold,
                    cursor: 'pointer',
                  }}
                >Pegar lista</button>
                <button
                  type="button"
                  onClick={() => setTab('csv')}
                  style={{
                    background: tab === 'csv' ? C.brand : C.surface,
                    color: tab === 'csv' ? '#000' : C.text,
                    border: `1px solid ${tab === 'csv' ? C.brand : C.border}`,
                    borderRadius: 999,
                    padding: '6px 14px',
                    fontSize: FONT_SIZE.sm,
                    fontWeight: FONT_WEIGHT.semibold,
                    cursor: 'pointer',
                  }}
                >Subir CSV</button>
              </div>

              {tab === 'paste' ? (
                <>
                  <Label>Pegá una lista (uno por línea)</Label>
                  <textarea
                    value={pasteText}
                    onChange={e => setPasteText(e.target.value)}
                    rows={8}
                    style={{ ...fi, fontFamily: FONT.mono, fontSize: FONT_SIZE.sm, minHeight: 160, resize: 'vertical' }}
                    placeholder={'5491112345678\n5491198765432, Juan Perez\n5491155555555;Maria'}
                  />
                  <div style={{ fontSize: FONT_SIZE.xs, color: C.muted, marginTop: 4 }}>
                    Formatos: <code>+54 11 1234-5678</code>, <code>5491112345678</code>, <code>5491112345678, Nombre</code>
                  </div>
                </>
              ) : (
                <>
                  <Label>Archivo CSV</Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleCsvUpload}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      width: '100%',
                      padding: '20px',
                      background: C.surface,
                      border: `2px dashed ${C.border}`,
                      borderRadius: 10,
                      color: C.text,
                      fontSize: FONT_SIZE.sm,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    {parsing
                      ? 'Procesando…'
                      : csvFileName
                        ? `📎 ${csvFileName}`
                        : '📁 Hacé clic para elegir un CSV'}
                  </button>
                  <div style={{ fontSize: FONT_SIZE.xs, color: C.muted, marginTop: 6 }}>
                    Columnas esperadas: <code>phone,name</code> (header opcional). Si solo hay teléfonos, dejá una columna.
                  </div>
                </>
              )}

              {validatedRows.length > 0 && (
                <div style={{
                  marginTop: 14,
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 10,
                  padding: 10,
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 8,
                    fontSize: FONT_SIZE.sm,
                  }}>
                    <span style={{ color: C.text, fontWeight: FONT_WEIGHT.semibold }}>
                      Vista previa ({validatedRows.length})
                    </span>
                    <span>
                      <span style={{ color: '#22c55e', marginRight: 6 }}>{validCount} válidos</span>
                      {invalidCount > 0 && <span style={{ color: '#ef4444' }}>{invalidCount} inválidos</span>}
                    </span>
                  </div>
                  <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {validatedRows.slice(0, 30).map((r, i) => (
                      <div key={i} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '4px 8px',
                        background: C.bg,
                        borderRadius: 6,
                        fontSize: FONT_SIZE.xs,
                        fontFamily: FONT.mono,
                        color: r.valid ? C.text : '#ef4444',
                      }}>
                        <span>{r.phone || '(vacío)'}</span>
                        <span style={{ color: C.muted }}>{r.name || ''}</span>
                      </div>
                    ))}
                    {validatedRows.length > 30 && (
                      <div style={{ fontSize: FONT_SIZE.xs, color: C.muted, textAlign: 'center', padding: 4 }}>
                        … y {validatedRows.length - 30} más
                      </div>
                    )}
                  </div>
                </div>
              )}

              {error && (
                <div style={{
                  marginTop: 12,
                  padding: '8px 10px',
                  background: 'rgba(239,68,68,0.10)',
                  border: `1px solid rgba(239,68,68,0.30)`,
                  borderRadius: 8,
                  fontSize: FONT_SIZE.sm,
                  color: '#ef4444',
                }}>{error}</div>
              )}
            </>
          )}
        </div>

        {!result && (
          <div style={{
            padding: 12,
            borderTop: `1px solid ${C.border}`,
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
            flexShrink: 0,
            flexWrap: 'wrap',
          }}>
            <Button variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button
              variant="primary"
              onClick={submit}
              disabled={validCount === 0 || importing}
              loading={importing}
            >
              {importing ? 'Importando…' : `Importar ${validCount} contactos`}
            </Button>
          </div>
        )}
      </div>
    </>
  )
}

function Label({ children }) {
  return (
    <div style={{
      fontSize: FONT_SIZE.xs,
      color: C.muted,
      textTransform: 'uppercase',
      letterSpacing: '.06em',
      fontFamily: FONT.mono,
      fontWeight: FONT_WEIGHT.semibold,
      marginBottom: 5,
    }}>{children}</div>
  )
}

function SimpleStat({ label, value, color }) {
  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 8,
      padding: '6px 12px',
      textAlign: 'center',
      flex: '1 1 80px',
      minWidth: 0,
    }}>
      <div style={{ fontSize: 18, fontWeight: FONT_WEIGHT.black, color, lineHeight: 1.1 }}>{value}</div>
      <div style={{
        fontSize: FONT_SIZE.xs, color: C.muted,
        fontFamily: FONT.mono,
        textTransform: 'uppercase', letterSpacing: '.05em',
        marginTop: 2,
      }}>{label}</div>
    </div>
  )
}

function SimpleSlider({ label, value, onChange, min, max, step, format }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: FONT_SIZE.xs }}>
        <span style={{ color: C.muted, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '.05em' }}>{label}</span>
        <span style={{ color: C.brand, fontWeight: FONT_WEIGHT.bold, fontFamily: FONT.mono }}>{format(value)}</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={e => onChange(parseInt(e.target.value, 10))}
        style={{ width: '100%', accentColor: C.brand, cursor: 'pointer', boxSizing: 'border-box' }}
      />
    </div>
  )
}
