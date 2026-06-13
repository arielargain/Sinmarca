// ═════════════════════════════════════════════════════════════════════
// ConectarWhatsApp.jsx — página/componente de vinculación con QR
// ═════════════════════════════════════════════════════════════════════
// Funciona como página top-level (/conectar-whatsapp) Y como
// componente embebido (tab "QR Wasender" en /lineas).
//
// Props:
//   - embedded?: boolean (default false)
//        Si true: NO renderiza PageHeader propio (lo controla el padre).
//        Si false: renderiza el header completo como página standalone.
//   - role?: 'bot' | 'campaigns' (default 'bot')   ⭐ 28/05/2026
//        'bot' = línea principal del bot (default, comportamiento previo).
//        'campaigns' = 2da línea dedicada a envío de campañas (solo envío,
//        el bot NO procesa los entrantes en esa línea).
//
// El RPC get_my_wa_link_status resuelve el scope automáticamente
// desde el JWT del user (tenant/sub-tenant/retail) y devuelve TANTO
// el estado de la línea bot (en la raíz) como el de campañas
// (en el sub-objeto campaign_line).
//
// Estados del flujo:
//   - loading           → primera carga
//   - not_initialized   → no hay sesión, mostramos botón "Vincular ahora"
//   - need_scan         → mostramos QR + tip "abrí WhatsApp y escaneá"
//   - connecting / created → estado intermedio
//   - connected         → "✅ Tu WhatsApp +XXX está vinculado"
//   - disconnected      → mostramos botón "Volver a vincular"
//
// Gates de visibilidad (sub-tenant, SOLO aplican a role='bot') — 27/05/2026:
//   - has_wa_token=true        → bloqueado: ya tiene WA Cloud API
//   - wasender_allowed=false   → bloqueado: el partner no habilitó (sub_tenant only)
//   - platform_enabled=false   → bloqueado: Wasender off a nivel plataforma
// Para role='campaigns' los gates NO aplican (la 2da línea es independiente
// del flag wasender_allowed del bot y de WA Cloud).
//
// 15/05/2026 — Refactor: agregar prop `embedded` para reuso desde Lineas.jsx.
// 27/05/2026 — Gates per-sub_tenant (Wasender allowed, WA Cloud, platform off).
// 28/05/2026 — Prop `role` para soportar 2da línea de campañas.
// ═════════════════════════════════════════════════════════════════════
import { useEffect, useState, useRef, useCallback } from 'react'
import QRCode from 'qrcode'
import { supabase } from '../lib/supabase'
import { COLORS as C, FONT, FONT_SIZE, FONT_WEIGHT, RADIUS } from '../theme/tokens'
import { PageHeader, Card, Button, Banner } from '../components/ui'
import { WA_LINK_SESSION_URL } from '../lib/constants'
import { callEdgeFunction } from '../lib/callEdgeFunction'

const POLL_INTERVAL_MS = 3000
const QR_REFRESH_THRESHOLD_SEC = 45

function humanizeError(code) {
  if (!code) return null
  const map = {
    wasender_connect_failed:   'No se pudo conectar con el servicio de WhatsApp. Probá de nuevo en unos segundos.',
    wasender_session_error:    'Hubo un problema con la sesión. Intentá de nuevo.',
    wasender_status_check_failed: 'No pudimos verificar el estado actual. Probá de nuevo en unos segundos.',
    qr_generation_failed:      'No pudimos generar el código QR. Probá refrescar.',
    qr_expired:                'El código QR expiró. Generá uno nuevo.',
    session_not_found:         'La sesión no está activa. Vinculá tu WhatsApp de nuevo.',
    session_limit_reached:     'Llegaste al límite de líneas activas del plan. Liberá una sesión vieja antes de vincular esta línea, o contactanos para ampliar el plan.',
    phone_number_required:     'Ingresá tu número de WhatsApp en formato internacional (ej: +5493455527610).',
    phone_invalid:             'El número no es válido. Verificá que tenga código de país y de área (ej: +5493455527610).',
    rate_limited:              'Demasiados intentos seguidos. Esperá un momento y volvé a intentar.',
    not_authorized:            'No tenés permisos para esta acción.',
    init_failed:               'No se pudo iniciar la conexión. Probá de nuevo.',
    load_failed:               'No se pudo cargar el estado. Refrescá la página.',
    disconnect_failed:         'No se pudo desconectar. Probá de nuevo.',
    reset_failed:              'No se pudo resetear la conexión. Probá de nuevo.',
    status_failed:             'No se pudo consultar el estado. Probá de nuevo.',
    refresh_failed:            'No se pudo actualizar el QR. Probá de nuevo.',
    no_data:                   'No recibimos respuesta del servidor. Refrescá la página.',
  }
  if (map[code]) return map[code]
  if (/^http_5\d\d$/.test(code)) return 'El servicio no está respondiendo. Probá de nuevo en unos minutos.'
  if (/^http_4\d\d$/.test(code)) return 'No pudimos procesar la solicitud. Si persiste, contactá a soporte.'
  return 'Algo no funcionó como esperábamos. Probá de nuevo.'
}

export default function ConectarWhatsApp({ embedded = false, role = 'bot' }) {
  const isCampaigns = role === 'campaigns'

  // ⭐ Copy contextual según rol
  const COPY = isCampaigns ? {
    pageTitle: 'Vincular línea de campañas',
    pageSubtitle: 'Conectá una 2da línea de WhatsApp dedicada a enviar campañas. El bot NO va a contestar los mensajes que lleguen a este número.',
    sectionVincular: 'Vincular tu 2da línea',
    sectionConectado: '2da línea vinculada',
    sectionDesvinculado: '2da línea desvinculada',
    descIntro: 'Ingresá el número de WhatsApp que vas a usar SOLO para mandar campañas. Este número no va a recibir respuestas del bot — todo lo que entre se ignora.',
    descConectado: phone => phone
      ? <>Tu línea de campañas <strong style={{ fontFamily: FONT.mono, color: C.brand }}>+{phone}</strong> está conectada. Las campañas que mandes saldrán por este número.</>
      : 'Tu línea de campañas está conectada y lista para enviar.',
    warningDisconnect: '⚠️ Desvincular cierra la sesión (podés volver a conectar fácil escaneando un QR). Eliminar borra todo en el proveedor — vas a tener que empezar desde 0.',
    btnVincular: '🚀 Vincular línea de campañas',
    btnVolverVincular: '🔁 Volver a vincular',
    inputLabel: 'Número de la línea de campañas',
    inputHint: 'Tiene que ser un número distinto al de tu línea bot. Las campañas saldrán por este número.',
  } : {
    pageTitle: 'Vincular WhatsApp',
    pageSubtitle: 'Conectá tu WhatsApp escaneando un código QR. La conexión queda guardada y no necesitás reescanear hasta que cierres sesión.',
    sectionVincular: 'Vincular tu WhatsApp',
    sectionConectado: 'WhatsApp vinculado',
    sectionDesvinculado: 'WhatsApp desvinculado',
    descIntro: 'Ingresá el número de WhatsApp que querés conectar al bot. Después vas a escanear un código QR desde ese mismo número.',
    descConectado: phone => phone
      ? <>Tu número <strong style={{ fontFamily: FONT.mono, color: C.brand }}>+{phone}</strong> está conectado y listo para recibir mensajes.</>
      : 'Tu cuenta está conectada y lista para recibir mensajes.',
    warningDisconnect: '⚠️ Desvincular cierra la sesión (podés volver a conectar fácil escaneando un QR). Eliminar borra todo en el proveedor — vas a tener que empezar desde 0.',
    btnVincular: '🚀 Vincular WhatsApp',
    btnVolverVincular: '🔁 Volver a vincular',
    inputLabel: 'Tu número de WhatsApp',
    inputHint: 'Formato internacional con código de país (Argentina: +54 9 ...). Tiene que ser el mismo número que vas a escanear.',
  }

  const [state, setState] = useState({ loading: true })
  const [qrDataUrl, setQrDataUrl] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [connectingMsg, setConnectingMsg] = useState(null)
  const [phoneInput, setPhoneInput] = useState('+54')
  const [phonePrefilled, setPhonePrefilled] = useState(false)
  const pollRef = useRef(null)

  function validatePhone(raw) {
    if (typeof raw !== 'string') return { ok: false, reason: 'phone_must_be_string' }
    let cleaned = raw.replace(/[^\d+]/g, '')
    if (cleaned.includes('+')) {
      if (cleaned.indexOf('+') !== 0 || cleaned.lastIndexOf('+') !== 0) {
        return { ok: false, reason: 'phone_invalid_format' }
      }
    } else {
      cleaned = '+' + cleaned
    }
    const digits = cleaned.slice(1)
    if (!/^\d{8,15}$/.test(digits)) {
      return { ok: false, reason: 'phone_invalid_length' }
    }
    return { ok: true, normalized: cleaned }
  }

  const renderQR = useCallback(async (qrString) => {
    if (!qrString) { setQrDataUrl(null); return }
    try {
      const url = await QRCode.toDataURL(qrString, {
        width: 320,
        margin: 2,
        errorCorrectionLevel: 'M',
        color: { dark: '#000000', light: '#FFFFFF' },
      })
      setQrDataUrl(url)
    } catch (e) {
      console.error('[ConectarWhatsApp] QR render error:', e)
      setQrDataUrl(null)
    }
  }, [])

  const loadStatus = useCallback(async (silent = false) => {
    if (!silent) setState(s => ({ ...s, loading: true }))
    try {
      const { data, error: err } = await supabase.rpc('get_my_wa_link_status')
      if (err) throw err
      if (!data || data.error) {
        setError(data?.error || 'no_data')
        setState({ loading: false })
        return
      }

      // ⭐ Si role='campaigns', leemos del sub-objeto campaign_line.
      // Si role='bot', leemos de la raíz (comportamiento previo).
      const src = isCampaigns ? (data.campaign_line || {}) : data

      setState({
        loading: false,
        scope: data.scope,
        scopeId: data.scope_id,
        sessionStatus: String(src.status || 'not_initialized').toLowerCase(),
        phone: src.phone,
        sessionId: src.session_id,
        hasSession: !!src.has_session,
        qr: src.qr,
        qrAgeSec: src.qr_age_sec,
        // Flags de gating (solo se evalúan para role='bot' — ver más abajo)
        wasenderAllowed: data.wasender_allowed !== false,
        waProvider: src.wa_provider || 'meta',
        hasWaToken: !!src.has_wa_token,
        platformEnabled: data.platform_enabled !== false,
      })
      if (src.qr) renderQR(src.qr)
      else setQrDataUrl(null)
    } catch (e) {
      setError(e.message || 'load_failed')
      setState({ loading: false })
    }
  }, [renderQR, isCampaigns])

  useEffect(() => {
    if (!phonePrefilled && state.phone && !state.loading) {
      const prefill = state.phone.startsWith('+') ? state.phone : `+${state.phone}`
      setPhoneInput(prefill)
      setPhonePrefilled(true)
    }
  }, [state.phone, state.loading, phonePrefilled])

  const startLinking = useCallback(async () => {
    const v = validatePhone(phoneInput)
    if (!v.ok) {
      setError('phone_invalid')
      return
    }
    const phoneToSend = v.normalized

    setBusy(true); setError(null); setConnectingMsg('Creando sesión y solicitando QR…')
    try {
      // ⭐ Pasamos `role` para que la EF v13 escriba en las columnas correctas
      const body = { action: 'init', phone_number: phoneToSend, role }
      const { ok, status, data } = await callEdgeFunction(WA_LINK_SESSION_URL, body)
      if (!ok) {
        setError(data?.error || `http_${status}`)
        setConnectingMsg(null)
        return
      }
      if (data?.qr) renderQR(data.qr)
      await loadStatus(true)
      setConnectingMsg(null)
    } catch (e) {
      setError(e.message || 'init_failed')
      setConnectingMsg(null)
    } finally {
      setBusy(false)
    }
  }, [renderQR, loadStatus, phoneInput, role])

  const refreshQR = useCallback(async () => {
    setBusy(true); setError(null)
    try {
      const { ok, data } = await callEdgeFunction(WA_LINK_SESSION_URL, { action: 'refresh_qr', role })
      if (ok && data?.qr) {
        renderQR(data.qr)
      }
      await loadStatus(true)
    } catch (e) {
      console.error('[ConectarWhatsApp] refresh_qr error:', e)
    } finally {
      setBusy(false)
    }
  }, [renderQR, loadStatus, role])

  const disconnect = useCallback(async () => {
    const confirmMsg = isCampaigns
      ? '¿Seguro que querés desvincular tu línea de campañas? Las campañas no van a poder enviarse hasta que vuelvas a vincular.'
      : '¿Seguro que querés desvincular tu WhatsApp? Vas a tener que escanear el QR de nuevo para reconectar.'
    if (!confirm(confirmMsg)) return
    setBusy(true); setError(null)
    try {
      await callEdgeFunction(WA_LINK_SESSION_URL, { action: 'disconnect', role })
      setQrDataUrl(null)
      await loadStatus(true)
    } catch (e) {
      setError(e.message || 'disconnect_failed')
    } finally {
      setBusy(false)
    }
  }, [loadStatus, role, isCampaigns])

  const resetSession = useCallback(async () => {
    if (!confirm('Esto va a borrar la sesión actual completamente. La próxima vez que vincules vas a tener que escanear un QR nuevo. ¿Continuar?')) return
    setBusy(true); setError(null)
    try {
      await callEdgeFunction(WA_LINK_SESSION_URL, { action: 'reset', role })
      setQrDataUrl(null)
      await loadStatus(true)
    } catch (e) {
      setError(e.message || 'reset_failed')
    } finally {
      setBusy(false)
    }
  }, [loadStatus, role])

  const checkRemote = useCallback(async () => {
    setBusy(true); setError(null)
    try {
      await callEdgeFunction(WA_LINK_SESSION_URL, { action: 'status', role })
      await loadStatus(true)
    } catch (e) {
      setError(e.message || 'status_failed')
    } finally {
      setBusy(false)
    }
  }, [loadStatus, role])

  useEffect(() => { loadStatus() }, [loadStatus])

  useEffect(() => {
    const s = state.sessionStatus
    const shouldPoll = s === 'need_scan' || s === 'connecting' || s === 'created'
    if (!shouldPoll) {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
      return
    }
    pollRef.current = setInterval(() => { loadStatus(true) }, POLL_INTERVAL_MS)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [state.sessionStatus, loadStatus])

  useEffect(() => {
    if (state.sessionStatus !== 'need_scan') return
    const age = state.qrAgeSec || 0
    if (age >= QR_REFRESH_THRESHOLD_SEC) {
      refreshQR()
    }
  }, [state.qrAgeSec, state.sessionStatus, refreshQR])

  // ═══ Header opcional (oculto si embedded) ═══
  const Header = embedded ? null : (
    <PageHeader
      eyebrow={isCampaigns ? '2da línea (campañas)' : 'Configuración'}
      title={COPY.pageTitle}
      subtitle={COPY.pageSubtitle}
    />
  )

  if (state.loading) {
    return (
      <div>
        {Header}
        <Card padding={32}>
          <div style={{ color: C.muted, textAlign: 'center' }}>Cargando estado…</div>
        </Card>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════
  // GATES (27/05/2026) — bloqueos antes del flujo normal
  // ═══════════════════════════════════════════════════════════════
  // Solo aplican a role='bot'. Para role='campaigns' la 2da línea es
  // independiente: el partner la gestiona directamente, no necesita
  // wasender_allowed (que es el toggle de la línea bot), y la línea
  // de campañas y WA Cloud pueden coexistir (campañas siempre es Wasender
  // o Meta dedicado, no es alternativa a WA Cloud del bot).
  if (!isCampaigns) {
    const hasLiveSession = state.sessionStatus === 'connected'
      || state.sessionStatus === 'need_scan'
      || state.sessionStatus === 'connecting'
      || state.sessionStatus === 'created'

    // Gate 1: el sub-tenant ya tiene WhatsApp Cloud API configurado.
    if (state.scope === 'sub_tenant' && state.hasWaToken && !hasLiveSession) {
      return (
        <div>
          {Header}
          <Card padding={32}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', textAlign: 'center' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'rgba(34,197,94,0.12)',
                border: `2px solid #22c55e`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28,
              }}>✓</div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: FONT_WEIGHT.bold, color: C.text }}>
                Ya tenés WhatsApp configurado
              </h3>
              <p style={{ margin: 0, fontSize: FONT_SIZE.base, color: C.muted, lineHeight: 1.55, maxWidth: 480 }}>
                Tu cuenta usa <strong style={{ color: C.text }}>WhatsApp Cloud API</strong> (la API oficial de Meta).
                No es necesario vincular un número por QR — Wasender es una alternativa al Cloud API,
                no algo complementario.
              </p>
              <p style={{ margin: 0, fontSize: FONT_SIZE.sm, color: C.muted, lineHeight: 1.5, maxWidth: 480 }}>
                Si querés cambiar de WhatsApp Cloud API a Wasender, contactá a tu partner para que
                haga el cambio.
              </p>
            </div>
          </Card>
        </div>
      )
    }

    // Gate 2: el partner no habilitó Wasender para este sub-tenant.
    if (state.scope === 'sub_tenant' && !state.wasenderAllowed && !hasLiveSession) {
      return (
        <div>
          {Header}
          <Card padding={32}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', textAlign: 'center' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'rgba(56, 189, 248, 0.12)',
                border: `2px solid #38bdf8`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 30,
              }}>📞</div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: FONT_WEIGHT.bold, color: C.text }}>
                Conectá WhatsApp con un código QR
              </h3>
              <p style={{ margin: 0, fontSize: FONT_SIZE.base, color: C.muted, lineHeight: 1.55, maxWidth: 480 }}>
                Para vincular tu WhatsApp escaneando un QR (más cómodo que la API oficial de Meta),
                necesitás que <strong style={{ color: C.text }}>tu partner active esta función</strong>{' '}
                en tu cuenta.
              </p>
              <div style={{
                padding: '14px 16px',
                background: 'rgba(56, 189, 248, 0.06)',
                border: `1px solid rgba(56, 189, 248, 0.25)`,
                borderRadius: RADIUS.md,
                maxWidth: 520,
                textAlign: 'left',
              }}>
                <p style={{ margin: '0 0 8px', fontSize: FONT_SIZE.sm, color: '#5589E8', fontWeight: FONT_WEIGHT.semibold }}>
                  💡 ¿Qué hago?
                </p>
                <p style={{ margin: 0, fontSize: FONT_SIZE.sm, color: C.text, lineHeight: 1.6 }}>
                  Pedile a tu partner que active <strong>"WhatsApp por QR (Wasender)"</strong> en
                  el panel de tu cuenta. Una vez que lo active, esta página te va a mostrar el botón
                  para escanear el código.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )
    }

    // Gate 3: Wasender está deshabilitado a nivel plataforma (capacity / outage).
    if (!state.platformEnabled && !hasLiveSession) {
      return (
        <div>
          {Header}
          <Card padding={32}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', textAlign: 'center' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'rgba(244, 183, 64, 0.12)',
                border: `2px solid #F4B740`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 30,
              }}>⏸</div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: FONT_WEIGHT.bold, color: C.text }}>
                Vinculación por QR pausada
              </h3>
              <p style={{ margin: 0, fontSize: FONT_SIZE.base, color: C.muted, lineHeight: 1.55, maxWidth: 480 }}>
                El servicio de vinculación por QR (Wasender) está temporalmente deshabilitado.
                Volvé a intentarlo en unos minutos o contactá a soporte si necesitás vincular urgente.
              </p>
            </div>
          </Card>
        </div>
      )
    }
  }

  const s = state.sessionStatus
  const isConnected   = s === 'connected'
  const isNeedScan    = s === 'need_scan'
  const isConnecting  = s === 'connecting' || s === 'created'
  const isDisconnected = s === 'disconnected'
  const isNotInit     = s === 'not_initialized' || (!state.hasSession && !isNeedScan)

  return (
    <div>
      {Header}

      {error && (
        <Banner kind="error" style={{ marginBottom: 14 }}>
          {humanizeError(error)}
        </Banner>
      )}

      {/* ⭐ Etiqueta visual de modo CAMPAÑAS para no confundir con la línea bot */}
      {isCampaigns && (
        <div style={{
          marginBottom: 14,
          padding: '10px 14px',
          background: 'rgba(232, 181, 71, 0.08)',
          border: `1px solid rgba(232, 181, 71, 0.35)`,
          borderRadius: RADIUS.md,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <span style={{ fontSize: 18 }}>📢</span>
          <p style={{ margin: 0, fontSize: FONT_SIZE.sm, color: C.text, lineHeight: 1.5 }}>
            <strong style={{ color: '#E8B547' }}>Línea de campañas (envío únicamente).</strong>{' '}
            El bot no va a contestar mensajes que lleguen a este número.
          </p>
        </div>
      )}

      {isConnected && (
        <Card padding={28}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'rgba(34,197,94,0.15)',
              border: `2px solid #22c55e`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28,
            }}>✓</div>
            <div style={{ flex: 1, minWidth: 240 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: FONT_WEIGHT.bold, color: '#22c55e' }}>
                {COPY.sectionConectado}
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: FONT_SIZE.base, color: C.text }}>
                {COPY.descConectado(state.phone)}
              </p>
            </div>
          </div>
          <div style={{
            marginTop: 20, paddingTop: 20, borderTop: `1px solid ${C.border}`,
            display: 'flex', gap: 10, flexWrap: 'wrap',
          }}>
            <Button variant="ghost" onClick={checkRemote} disabled={busy}>
              {busy ? 'Verificando…' : '↻ Verificar conexión'}
            </Button>
            <Button variant="danger" onClick={disconnect} disabled={busy}>
              Desvincular
            </Button>
            <Button variant="danger" onClick={resetSession} disabled={busy}>
              🗑️ Eliminar sesión
            </Button>
          </div>
          <p style={{ margin: '14px 0 0', fontSize: FONT_SIZE.xs, color: C.muted, lineHeight: 1.5 }}>
            {COPY.warningDisconnect}
          </p>
        </Card>
      )}

      {(isNotInit || isDisconnected) && (
        <Card padding={28}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', textAlign: 'center' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: `${C.brand}18`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 30,
            }}>{isCampaigns ? '📢' : '📱'}</div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: FONT_WEIGHT.bold, color: C.text }}>
              {isDisconnected ? COPY.sectionDesvinculado : COPY.sectionVincular}
            </h3>
            <p style={{ margin: 0, fontSize: FONT_SIZE.base, color: C.muted, lineHeight: 1.55, maxWidth: 480 }}>
              {isDisconnected
                ? 'La sesión anterior se cerró. Confirmá el número y tocá el botón para volver a generar un QR.'
                : COPY.descIntro}
            </p>

            <div style={{ width: '100%', maxWidth: 360, textAlign: 'left' }}>
              <label style={{
                display: 'block',
                fontSize: FONT_SIZE.xs,
                fontWeight: FONT_WEIGHT.medium,
                color: C.muted,
                marginBottom: 6,
                letterSpacing: '0.02em',
                textTransform: 'uppercase',
              }}>
                {COPY.inputLabel}
              </label>
              <input
                type="tel"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="+54 9 3455 527610"
                disabled={busy}
                inputMode="tel"
                autoComplete="tel"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  fontSize: FONT_SIZE.base,
                  fontFamily: FONT.mono,
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${C.border}`,
                  borderRadius: RADIUS.md,
                  color: C.text,
                  outline: 'none',
                }}
                onFocus={(e) => { e.target.style.borderColor = C.brand }}
                onBlur={(e) => { e.target.style.borderColor = C.border }}
              />
              <p style={{
                margin: '6px 0 0',
                fontSize: FONT_SIZE.xs,
                color: C.muted,
                lineHeight: 1.4,
              }}>
                {COPY.inputHint}
              </p>
            </div>

            <Button variant="primary" size="lg" onClick={startLinking} disabled={busy}>
              {busy ? (connectingMsg || 'Iniciando…') : (isDisconnected ? COPY.btnVolverVincular : COPY.btnVincular)}
            </Button>
            {isDisconnected && (
              <button
                type="button"
                onClick={resetSession}
                disabled={busy}
                style={{
                  background: 'none',
                  border: 'none',
                  color: C.muted,
                  fontSize: FONT_SIZE.xs,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: '4px 8px',
                  fontFamily: 'inherit',
                  opacity: busy ? 0.5 : 1,
                }}
              >
                ¿Querés empezar desde cero con otro número? Resetear sesión
              </button>
            )}
          </div>
        </Card>
      )}

      {isNeedScan && (
        <Card padding={28}>
          <style>{`
            .wa-link-grid {
              display: grid;
              grid-template-columns: minmax(0, 1fr);
              gap: 28px;
              align-items: flex-start;
              justify-items: center;
            }
            .wa-link-qr-wrap {
              padding: 14px;
              background: #fff;
              border-radius: ${RADIUS.lg}px;
              border: 2px solid ${C.brand};
              box-shadow: 0 12px 48px rgba(0,0,0,0.4);
              width: 320px;
              max-width: 100%;
              height: 320px;
              display: flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
              box-sizing: border-box;
            }
            .wa-link-qr-wrap img {
              display: block;
              max-width: 100%;
              max-height: 100%;
              width: 100%;
              height: 100%;
              object-fit: contain;
            }
            .wa-link-instructions {
              width: 100%;
              min-width: 0;
              max-width: 520px;
              text-align: left;
              justify-self: center;
            }
            @media (min-width: 720px) {
              .wa-link-grid {
                grid-template-columns: 320px minmax(0, 1fr);
                justify-items: stretch;
              }
              .wa-link-instructions {
                max-width: none;
                justify-self: start;
              }
            }
          `}</style>
          <div className="wa-link-grid">
            <div className="wa-link-qr-wrap">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="WhatsApp QR" />
              ) : (
                <div style={{ color: '#666', fontSize: 13, textAlign: 'center' }}>
                  Generando QR…
                </div>
              )}
            </div>

            <div className="wa-link-instructions">
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: FONT_WEIGHT.bold, color: C.text }}>
                📲 Escaneá este código
              </h3>
              <ol style={{
                margin: '14px 0 0',
                paddingLeft: 20,
                fontSize: FONT_SIZE.base, color: C.text, lineHeight: 1.7,
              }}>
                <li>Abrí <strong>WhatsApp</strong> en tu celular.</li>
                <li>Tocá el menú <strong>⋮</strong> (Android) o <strong>Configuración</strong> (iPhone).</li>
                <li>Andá a <strong>Dispositivos vinculados</strong>.</li>
                <li>Tocá <strong>"Vincular un dispositivo"</strong>.</li>
                <li>Escaneá el QR de arriba.</li>
              </ol>
              <div style={{
                marginTop: 16, padding: '10px 12px',
                background: 'rgba(45, 107, 216, 0.08)',
                border: `1px solid rgba(45, 107, 216, 0.35)`,
                borderRadius: RADIUS.md,
                fontSize: FONT_SIZE.sm, color: C.text, lineHeight: 1.5,
              }}>
                <strong style={{ color: '#5589E8' }}>Tip:</strong> el QR se renueva automáticamente cada ~30s.
                Cuando escanees, esta página detecta la conexión y cambia sola — no hace falta recargar.
              </div>
              <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Button variant="ghost" onClick={refreshQR} disabled={busy}>
                  ↻ Generar QR nuevo
                </Button>
                <Button variant="ghost" onClick={checkRemote} disabled={busy}>
                  Verificar ahora
                </Button>
                <Button variant="danger" onClick={resetSession} disabled={busy}>
                  Cancelar
                </Button>
              </div>
              {state.qrAgeSec != null && (
                <p style={{ margin: '12px 0 0', fontSize: FONT_SIZE.xs, color: C.muted, fontFamily: FONT.mono }}>
                  QR generado hace {state.qrAgeSec}s
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      {isConnecting && (
        <Card padding={28}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', textAlign: 'center' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: `${C.brand}18`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 30, animation: 'pulse 1.4s ease-in-out infinite',
            }}>⚙️</div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: FONT_WEIGHT.bold, color: C.text }}>
              Estableciendo conexión…
            </h3>
            <p style={{ margin: 0, fontSize: FONT_SIZE.base, color: C.muted, lineHeight: 1.55 }}>
              Conectando con WhatsApp. Esto puede tardar unos segundos.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <Button variant="ghost" onClick={checkRemote} disabled={busy}>
                Verificar ahora
              </Button>
              <Button variant="ghost" onClick={() => loadStatus()}>
                Recargar
              </Button>
            </div>
          </div>
          <style>{`@keyframes pulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.06);opacity:.7} }`}</style>
        </Card>
      )}

      {!isConnected && !isNeedScan && !isConnecting && !isNotInit && !isDisconnected && (
        <Card padding={28}>
          <Banner kind="warning">
            Estado desconocido: <code style={{ fontFamily: FONT.mono }}>{state.sessionStatus || '—'}</code>.
            <div style={{ marginTop: 12 }}>
              <Button variant="ghost" onClick={checkRemote} disabled={busy}>
                Sincronizar estado
              </Button>
            </div>
          </Banner>
        </Card>
      )}
    </div>
  )
}
