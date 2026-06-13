import WalletTutorialLayout from './_WalletTutorialLayout'

const ACCENT = '#1d4ed8'

const BODY_HTML = `
<div class="container">
  <header class="head">
    <div class="chip" style="background: rgba(29,78,216,0.08); border-color: rgba(29,78,216,0.3); color: #4b78e8;">Tutorial paso a paso · MODO</div>
    <h1>Cómo conseguir tus credenciales de <span style="color:${ACCENT};">MODO</span></h1>
    <p>MODO es la billetera del consorcio de bancos argentinos. Tu cliente paga desde cualquier banco que tenga MODO activado (casi todos los bancos del país). Cuenta personal con DNI alcanza.</p>
    <div class="meta">
      <span>⏱ <strong>15–25 minutos</strong></span>
      <span>💵 <strong>Gratis</strong></span>
      <span>🔒 <strong>Tus datos, en tu panel</strong></span>
    </div>
  </header>

  <article class="step-card">
    <div class="step-head">
      <div class="step-num">1</div>
      <div class="step-meta">
        <div class="step-tag">Activar MODO Comercios</div>
        <h2 class="step-title">Activá MODO Comercios desde la app de tu banco</h2>
      </div>
    </div>
    <div class="step-body">
      <p>MODO no es una app aparte: vive dentro de la app de cualquier banco argentino que lo soporte (BBVA, Galicia, Macro, Santander, ICBC, Patagonia, Hipotecario, Supervielle, etc.).</p>
      <p>Buscá en la app de tu banco la sección <strong>MODO</strong> o <strong>Cobrar con MODO</strong>. Te va a pedir aceptar términos y validar que tu cuenta personal sea de la misma persona del DNI.</p>

      <div class="mockup app">
        <div class="phone-status" style="background: #0a0a0a;">
          <span>9:41</span>
          <span>● ● ● ●</span>
        </div>
        <div style="background: #0a0a0a;">
          <div class="app-topbar">
            <div class="app-back">←</div>
            <div class="app-title">MODO en tu banco</div>
          </div>
          <div class="phone-body">
            <div class="app-section-title">Para emprendedores</div>
            <div class="app-row active" style="background: rgba(29,78,216,0.18); border-color: rgba(29,78,216,0.4);">
              <div class="app-row-icon" style="background: rgba(29,78,216,0.25); color: #6b8eff;">⚡</div>
              <div class="app-row-text">
                <div class="app-row-title">Activar MODO Comercios</div>
                <div class="app-row-desc">Cobrá con QR, link y API REST</div>
              </div>
              <div class="app-row-arrow">→</div>
            </div>
            <div class="app-row">
              <div class="app-row-icon" style="background: rgba(255,255,255,0.1);">📊</div>
              <div class="app-row-text">
                <div class="app-row-title">Mis ventas</div>
                <div class="app-row-desc">Historial de cobros</div>
              </div>
              <div class="app-row-arrow">→</div>
            </div>
          </div>
        </div>
      </div>

      <div class="tip"><strong>Si tu banco no tiene MODO Comercios disponible:</strong> podés abrir una cuenta gratis en <a href="https://www.naranjax.com" target="_blank" rel="noopener noreferrer">Naranja X</a> o <a href="https://www.bbva.com.ar" target="_blank" rel="noopener noreferrer">BBVA</a> que sí lo soportan. La activación toma 5 minutos online.</div>
    </div>
  </article>

  <article class="step-card">
    <div class="step-head">
      <div class="step-num">2</div>
      <div class="step-meta">
        <div class="step-tag">Acceso al portal de developers</div>
        <h2 class="step-title">Entrá al portal de MODO Empresas</h2>
      </div>
    </div>
    <div class="step-body">
      <p>Las credenciales de API se gestionan desde el portal web. Abrí esta dirección y logueate con la cuenta que activaste MODO Comercios:</p>
      <p><a href="https://empresas.modo.com.ar/developers" target="_blank" rel="noopener noreferrer">https://empresas.modo.com.ar/developers</a></p>

      <div class="mockup web">
        <div class="browser-bar">
          <div class="browser-dots"><span></span><span></span><span></span></div>
          <div class="browser-url">empresas.modo.com.ar/developers</div>
        </div>
        <div class="mp-body" style="background: #fafafa;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; flex-wrap: wrap; gap: 12px;">
            <div>
              <div class="mp-h1">Mis aplicaciones</div>
              <div class="mp-sub">Creá una app para integrar MODO con tu sistema vía API.</div>
            </div>
            <button class="mp-btn">+ Nueva aplicación</button>
          </div>
          <div style="background: #fff; border: 1px dashed #d0d0d0; border-radius: 9px; padding: 32px; text-align: center; color: #999; font-size: 13px;">
            No hay aplicaciones todavía
          </div>
        </div>
      </div>
    </div>
  </article>

  <article class="step-card">
    <div class="step-head">
      <div class="step-num">3</div>
      <div class="step-meta">
        <div class="step-tag">Crear aplicación</div>
        <h2 class="step-title">Completá los datos de tu nueva aplicación</h2>
      </div>
    </div>
    <div class="step-body">
      <p>MODO te pide tres datos: nombre de la app, callback URL (donde recibirás los webhooks) y un IP whitelist opcional.</p>

      <div class="mockup web">
        <div class="browser-bar">
          <div class="browser-dots"><span></span><span></span><span></span></div>
          <div class="browser-url">empresas.modo.com.ar/developers/apps/new</div>
        </div>
        <div class="mp-body">
          <div class="mp-breadcrumb">Aplicaciones &nbsp;›&nbsp; <span>Nueva</span></div>
          <div class="mp-h1">Nueva aplicación</div>
          <div class="mp-sub">Estos datos definen cómo se autentica tu integración.</div>

          <div class="mp-form">
            <div class="mp-field">
              <label class="mp-label">Nombre de la aplicación <span class="req">*</span></label>
              <input class="mp-input filled-good" value="Cobros Mi Negocio" readonly />
            </div>

            <div class="mp-field">
              <label class="mp-label">Tipo de aplicación <span class="req">*</span></label>
              <input class="mp-input filled-good" value="Cobros con QR/Link" readonly />
            </div>

            <div class="mp-field">
              <label class="mp-label">Callback URL (webhook) <span class="req">*</span></label>
              <input class="mp-input filled-good" value="https://dvzxkortcvuakjhsidrr.supabase.co/functions/v1/modo-confirm" readonly />
              <div class="mp-help">📋 Esta URL la copiás del panel de Innovate.ia. MODO va a enviar acá la notificación cada vez que se acredite un pago.</div>
            </div>

            <div class="mp-field">
              <label class="mp-label">IP allowlist (opcional)</label>
              <input class="mp-input" value="" readonly placeholder="Dejalo vacío" />
              <div class="mp-help">Si lo completás, solo desde esas IPs se puede usar la API. Dejalo vacío si no sabés qué IP tiene Innovate.ia.</div>
            </div>

            <div style="display: flex; gap: 10px; margin-top: 10px;">
              <button class="mp-btn mp-btn-secondary">Cancelar</button>
              <button class="mp-btn">Crear aplicación</button>
            </div>
          </div>
        </div>
      </div>

      <div class="danger"><strong>Importante:</strong> elegí <code>Cobros con QR/Link</code> como tipo. <strong>NO</strong> elijas "Marketplace" ni "Plataforma" — esas opciones requieren documentación de empresa registrada.</div>
    </div>
  </article>

  <article class="step-card">
    <div class="step-head">
      <div class="step-num">4</div>
      <div class="step-meta">
        <div class="step-tag">Obtener credenciales OAuth</div>
        <h2 class="step-title">Copiá Client ID y Client Secret</h2>
      </div>
    </div>
    <div class="step-body">
      <p>Cuando MODO crea la app, te muestra el <strong>Client ID</strong> (público) y el <strong>Client Secret</strong> (privado). El Secret se muestra <strong>una sola vez</strong>.</p>

      <div class="mockup web">
        <div class="browser-bar">
          <div class="browser-dots"><span></span><span></span><span></span></div>
          <div class="browser-url">empresas.modo.com.ar/developers/apps/xyz789</div>
        </div>
        <div class="mp-app-layout">
          <aside class="mp-sidebar">
            <div class="mp-sidebar-title">Tu app</div>
            <div class="mp-nav-item">📋 Detalles</div>
            <div class="mp-nav-item active">🔑 Credenciales</div>
            <div class="mp-nav-item">🔔 Webhooks</div>
            <div class="mp-nav-item">📊 Logs</div>
          </aside>
          <main class="mp-content">
            <div class="mp-h1" style="font-size: 17px;"><span class="mp-pill mp-pill-prod">Producción</span>Credenciales OAuth</div>
            <div class="mp-sub">Estas credenciales firmán cada llamada a la API de MODO.</div>

            <div class="mp-cred-card">
              <div class="mp-cred-row">
                <div class="mp-cred-label">Client ID</div>
                <div class="mp-cred-actions"><button class="mp-icon-btn">📋</button></div>
              </div>
              <div class="mp-cred-value">modo_app_b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8</div>
            </div>

            <div class="mp-cred-card">
              <div class="mp-cred-row">
                <div class="mp-cred-label">Client Secret</div>
                <div class="mp-cred-actions"><button class="mp-icon-btn">👁</button><button class="mp-icon-btn">📋</button></div>
              </div>
              <div class="mp-cred-value">modo_sk_<span class="blur">7f8e9d0c1b2a3f4e5d6c7b8a9f0e1d2c</span>3b4a5d6e</div>
            </div>
          </main>
        </div>
      </div>

      <div class="tip"><strong>Lo que tenés que copiar:</strong> los 2 valores. El Client ID identifica a tu app públicamente; el Client Secret la autentica privadamente.</div>

      <div class="danger"><strong>Cuidado:</strong> el Client Secret nunca se comparte. Si lo perdés o se filtra, regenerá uno nuevo desde el mismo panel — el viejo deja de funcionar al instante.</div>
    </div>
  </article>

  <article class="step-card">
    <div class="step-head">
      <div class="step-num">5</div>
      <div class="step-meta">
        <div class="step-tag">Pegá las credenciales en tu panel</div>
        <h2 class="step-title">Cargá los 2 datos directamente en Innovate.ia</h2>
      </div>
    </div>
    <div class="step-body">
      <div class="danger" style="margin-top: 0;">
        <strong>⚠ NUNCA COMPARTAS ESTOS DATOS CON NADIE.</strong> Tu Client Secret de MODO permite operar a tu nombre — quien lo tenga puede generar cobros desde tu cuenta. Innovate.ia <strong>nunca</strong> te va a pedir que se los envíes.
      </div>

      <p>Andá a tu panel → <code>Configuración → Billetera Virtual</code>, elegí <strong>MODO</strong> en el selector de proveedor:</p>

      <div class="mockup web">
        <div class="browser-bar">
          <div class="browser-dots"><span></span><span></span><span></span></div>
          <div class="browser-url">app.innovate-ia.com/config</div>
        </div>
        <div class="ia-panel">
          <div class="ia-panel-h">
            <p class="ia-tag">Cobros · opcional</p>
            <h4 class="ia-h4">💳 Billetera Virtual</h4>
          </div>

          <div class="ia-field">
            <p class="ia-field-label" style="color: ${ACCENT};">Proveedor</p>
            <div class="ia-input-wrap">
              <input class="ia-input" value="MODO" readonly />
            </div>
          </div>

          <div class="ia-field">
            <p class="ia-field-label" style="color: ${ACCENT};">Client ID</p>
            <div class="ia-input-wrap">
              <input class="ia-input" value="modo_app_b3c4d5e6f7a8b9c0..." readonly />
              <span class="ia-pill-ok">Configurado</span>
            </div>
            <p class="ia-help">Identificador público de tu integración OAuth. Se cifra al guardarse.</p>
          </div>

          <div class="ia-field">
            <p class="ia-field-label" style="color: ${ACCENT};">Client Secret</p>
            <div class="ia-input-wrap">
              <input class="ia-input" value="modo_sk_7f8e9d0c1b2a..." readonly />
              <span class="ia-pill-ok">Configurado</span>
            </div>
            <p class="ia-help">Se usa para firmar las llamadas a la API. Se cifra al guardarse.</p>
          </div>

          <div>
            <p class="ia-tag" style="font-weight:600;">🔗 URL para configurar en MODO</p>
            <div class="ia-input-wrap" style="background: #111420;">
              <code style="font-size: 12px; font-family: 'JetBrains Mono', monospace; color: ${ACCENT}; word-break: break-all;">https://dvzxkortcvuakjhsidrr.supabase.co/functions/v1/modo-confirm</code>
              <button style="background: transparent; border: 1px solid #1e2130; color: #E9E7E0; font-size: 11px; padding: 4px 10px; border-radius: 6px;">Copiar</button>
            </div>
          </div>

          <button class="ia-btn-primary">Guardar configuración</button>
        </div>
      </div>

      <div class="tip"><strong>✅ Listo.</strong> Las credenciales se cifran con AES-256 antes de tocar la base. Solo se descifran en memoria al validar cada cobro.</div>
    </div>
  </article>

  <article class="step-card">
    <div class="step-head">
      <div class="step-num danger">!</div>
      <div class="step-meta">
        <div class="step-tag danger">Seguridad y privacidad</div>
        <h2 class="step-title">Cómo protegemos tus credenciales de MODO</h2>
      </div>
    </div>
    <div class="step-body">
      <div style="margin: 18px 0;">
        <div class="sec-card">
          <div class="sec-check">✓</div>
          <div>
            <p class="sec-title">Cifrado en reposo</p>
            <p class="sec-desc">Se encripta con AES-256-GCM antes de escribirse en la base. La columna en disco contiene solo el ciphertext.</p>
          </div>
        </div>
        <div class="sec-card">
          <div class="sec-check">✓</div>
          <div>
            <p class="sec-title">Aislado por tenant (RLS)</p>
            <p class="sec-desc">Solo tu cuenta puede tocar tus secrets. Otros tenants no pueden consultarlos ni con SQL directo.</p>
          </div>
        </div>
        <div class="sec-card">
          <div class="sec-check">✓</div>
          <div>
            <p class="sec-title">Nunca vuelve al frontend</p>
            <p class="sec-desc">Una vez cargado, el campo solo muestra "Configurado". Para cambiarlo tenés que pegar uno nuevo (lo que también pisa el viejo).</p>
          </div>
        </div>
        <div class="sec-card">
          <div class="sec-check">✓</div>
          <div>
            <p class="sec-title">Solo se descifra al cobrar</p>
            <p class="sec-desc">La función que procesa pagos lo descifra en memoria solo durante el milisegundo del cobro. No queda en logs.</p>
          </div>
        </div>
      </div>

      <div class="danger">
        <strong>⚠ Si sospechás que tu Client Secret se filtró:</strong>
        <ol style="margin: 8px 0 0 18px; padding: 0; font-size: 13px; line-height: 1.7;">
          <li>Andá al portal de MODO Empresas → Tu app → Credenciales</li>
          <li>Click en <code>Regenerar Client Secret</code></li>
          <li>Copiá el nuevo Secret y pegalo en Innovate.ia</li>
          <li>El viejo deja de funcionar al instante.</li>
        </ol>
      </div>

      <div class="danger">
        <strong>⚠ Innovate.ia NUNCA te va a pedir tus credenciales por:</strong>
        <ul style="margin: 8px 0 0 18px; padding: 0; font-size: 13px; line-height: 1.7;">
          <li>WhatsApp, Telegram, SMS, llamada o videollamada</li>
          <li>Email (ni de soporte, ni de ningún área)</li>
          <li>Formularios externos al panel</li>
        </ul>
        <p style="margin: 10px 0 0; font-size: 13px;">Si alguien te las pide diciendo ser de Innovate.ia, es una <strong>estafa</strong>. Reportala a <a href="mailto:abuse@innovate-ia.com">abuse@innovate-ia.com</a>.</p>
      </div>
    </div>
  </article>

  <section class="summary">
    <h2>¿Qué tenés al final del proceso? <span class="accent">2 datos cargados en tu panel.</span></h2>
    <p>Los 2 valores se cargan vos mismo en Innovate.ia. Nunca se comparten con nadie.</p>
    <div class="summary-grid">
      <div class="summary-item">
        <div class="summary-check">✓</div>
        <div>
          <div class="summary-item-title">Client ID</div>
          <div class="summary-item-desc">Empieza con <code style="font-family: 'JetBrains Mono', monospace; color: var(--gold2); background: var(--surf2); padding: 1px 5px; border-radius: 3px; font-size: 11px;">modo_app_...</code>. Es el identificador público de tu app OAuth.</div>
        </div>
      </div>
      <div class="summary-item">
        <div class="summary-check">✓</div>
        <div>
          <div class="summary-item-title">Client Secret</div>
          <div class="summary-item-desc">Empieza con <code style="font-family: 'JetBrains Mono', monospace; color: var(--gold2); background: var(--surf2); padding: 1px 5px; border-radius: 3px; font-size: 11px;">modo_sk_...</code>. Solo se muestra una vez. <strong style="color: var(--danger-soft);">Es secreto. No lo compartas.</strong></div>
        </div>
      </div>
    </div>
  </section>
</div>
`

export default function InstruccionesMODO() {
  return <WalletTutorialLayout walletName="MODO" accent={ACCENT} bodyHtml={BODY_HTML} />
}
