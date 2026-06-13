import WalletTutorialLayout from './_WalletTutorialLayout'

const ACCENT = '#0066ff'

const BODY_HTML = `
<div class="container">
  <header class="head">
    <div class="chip" style="background: rgba(0,102,255,0.08); border-color: rgba(0,102,255,0.3); color: #4d8cff;">Tutorial paso a paso · Belo</div>
    <h1>Cómo conseguir tus credenciales de <span style="color:${ACCENT};">Belo</span></h1>
    <p>Belo es la app cripto multi-moneda con la mejor API documentada del mercado argentino. Cobrás en USDT, USDC o pesos sin comisión, y operás con tarjeta prepaga internacional. DNI alcanza — sin CUIT.</p>
    <div class="meta">
      <span>⏱ <strong>10–20 minutos</strong></span>
      <span>💵 <strong>0% USDT/USDC</strong></span>
      <span>🔒 <strong>Tus datos, en tu panel</strong></span>
    </div>
  </header>

  <article class="step-card">
    <div class="step-head">
      <div class="step-num">1</div>
      <div class="step-meta">
        <div class="step-tag">Activar Belo Pay</div>
        <h2 class="step-title">Activá Belo Pay desde tu app</h2>
      </div>
    </div>
    <div class="step-body">
      <p>Belo Pay es la sección de cobros profesionales dentro de Belo. Si todavía no la activaste, abrí la app y andá a <strong>Más</strong> → <strong>Belo Pay</strong>.</p>
      <p>Si todavía no validaste tu identidad en Belo, te van a pedir foto del DNI. Es 100% online y se aprueba en minutos. Personas físicas con DNI alcanza — no hace falta abrir empresa.</p>

      <div class="mockup app">
        <div class="phone-status" style="background: #0a0a0a;">
          <span>9:41</span>
          <span>● ● ● ●</span>
        </div>
        <div style="background: #0a0a0a;">
          <div class="app-topbar">
            <div class="app-back">←</div>
            <div class="app-title">Belo</div>
          </div>
          <div class="phone-body">
            <div class="app-section-title">Para emprendedores</div>
            <div class="app-row active" style="background: rgba(0,102,255,0.18); border-color: rgba(0,102,255,0.4);">
              <div class="app-row-icon" style="background: rgba(0,102,255,0.25); color: #4d8cff;">⚡</div>
              <div class="app-row-text">
                <div class="app-row-title">Activar Belo Pay</div>
                <div class="app-row-desc">Cobrá en USDT/USDC/ARS por API</div>
              </div>
              <div class="app-row-arrow">→</div>
            </div>
            <div class="app-row">
              <div class="app-row-icon" style="background: rgba(255,255,255,0.1);">💼</div>
              <div class="app-row-text">
                <div class="app-row-title">Mis cuentas</div>
                <div class="app-row-desc">USDT · USDC · ARS</div>
              </div>
              <div class="app-row-arrow">→</div>
            </div>
          </div>
        </div>
      </div>

      <div class="tip"><strong>Multi-moneda:</strong> con Belo Pay podés decidir en qué moneda recibir cada cobro (USDT, USDC o ARS). Si elegís stablecoins, la conversión es 1:1 al dólar y la comisión efectiva es 0%.</div>
    </div>
  </article>

  <article class="step-card">
    <div class="step-head">
      <div class="step-num">2</div>
      <div class="step-meta">
        <div class="step-tag">Acceso al portal de developers</div>
        <h2 class="step-title">Entrá al portal de Belo Developers</h2>
      </div>
    </div>
    <div class="step-body">
      <p>Las credenciales de API se gestionan desde el portal web de Belo Pay. Abrí esta URL con la misma cuenta de tu app:</p>
      <p><a href="https://pay.belo.app/developers" target="_blank" rel="noopener noreferrer">https://pay.belo.app/developers</a></p>

      <div class="mockup web">
        <div class="browser-bar">
          <div class="browser-dots"><span></span><span></span><span></span></div>
          <div class="browser-url">pay.belo.app/developers</div>
        </div>
        <div class="mp-body" style="background: #fafafa;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; flex-wrap: wrap; gap: 12px;">
            <div>
              <div class="mp-h1">API Credentials</div>
              <div class="mp-sub">Generá API keys y configurá webhooks para integrar Belo Pay.</div>
            </div>
            <button class="mp-btn">+ New Credential</button>
          </div>
          <div style="background: #fff; border: 1px dashed #d0d0d0; border-radius: 9px; padding: 32px; text-align: center; color: #999; font-size: 13px;">
            No credentials yet
          </div>
        </div>
      </div>

      <div class="tip"><strong>Idioma:</strong> el panel de Belo está mayormente en inglés. Los conceptos son los mismos — "API Key" y "Webhook Secret".</div>
    </div>
  </article>

  <article class="step-card">
    <div class="step-head">
      <div class="step-num">3</div>
      <div class="step-meta">
        <div class="step-tag">Crear credencial</div>
        <h2 class="step-title">Configurá los permisos y la moneda por defecto</h2>
      </div>
    </div>
    <div class="step-body">
      <p>Belo te pide nombre, scopes (permisos), moneda por defecto y URL de webhook. Acá la diferencia con Lemon: Belo te deja elegir en qué moneda querés que se acrediten los pagos.</p>

      <div class="mockup web">
        <div class="browser-bar">
          <div class="browser-dots"><span></span><span></span><span></span></div>
          <div class="browser-url">pay.belo.app/developers/new</div>
        </div>
        <div class="mp-body">
          <div class="mp-breadcrumb">Credentials &nbsp;›&nbsp; <span>New</span></div>
          <div class="mp-h1">Create credential</div>
          <div class="mp-sub">Define name, scopes, default currency and webhook URL.</div>

          <div class="mp-form">
            <div class="mp-field">
              <label class="mp-label">Name <span class="req">*</span></label>
              <input class="mp-input filled-good" value="Cobros Mi Negocio" readonly />
            </div>

            <div class="mp-field">
              <label class="mp-label">Default currency <span class="req">*</span></label>
              <input class="mp-input filled-good" value="USDT (recomendado)" readonly />
              <div class="mp-help">Elegí en qué moneda querés recibir por defecto. Después podés cambiarla en cada cobro.</div>
            </div>

            <div class="mp-field">
              <label class="mp-label">Scopes <span class="req">*</span></label>
              <div style="display: flex; flex-direction: column; gap: 6px; margin-top: 4px;">
                <label style="display: flex; align-items: center; gap: 8px; font-size: 12.5px; color: #1a1a1a;">
                  <span style="display: inline-block; width: 16px; height: 16px; background: #0066ff; border-radius: 4px; color: #fff; text-align: center; font-size: 11px; line-height: 16px;">✓</span>
                  payments.write
                </label>
                <label style="display: flex; align-items: center; gap: 8px; font-size: 12.5px; color: #1a1a1a;">
                  <span style="display: inline-block; width: 16px; height: 16px; background: #0066ff; border-radius: 4px; color: #fff; text-align: center; font-size: 11px; line-height: 16px;">✓</span>
                  payments.read
                </label>
                <label style="display: flex; align-items: center; gap: 8px; font-size: 12.5px; color: #999;">
                  <span style="display: inline-block; width: 16px; height: 16px; background: #fff; border: 1px solid #ccc; border-radius: 4px;"></span>
                  withdrawals.write <span style="color: #d40000; font-size: 10px;">(no marcar)</span>
                </label>
                <label style="display: flex; align-items: center; gap: 8px; font-size: 12.5px; color: #999;">
                  <span style="display: inline-block; width: 16px; height: 16px; background: #fff; border: 1px solid #ccc; border-radius: 4px;"></span>
                  account.write <span style="color: #d40000; font-size: 10px;">(no marcar)</span>
                </label>
              </div>
            </div>

            <div class="mp-field">
              <label class="mp-label">Webhook URL <span class="req">*</span></label>
              <input class="mp-input filled-good" value="https://dvzxkortcvuakjhsidrr.supabase.co/functions/v1/belo-confirm" readonly />
              <div class="mp-help">📋 La URL la copiás del panel de Innovate.ia.</div>
            </div>

            <div style="display: flex; gap: 10px; margin-top: 10px;">
              <button class="mp-btn mp-btn-secondary">Cancel</button>
              <button class="mp-btn">Create credential</button>
            </div>
          </div>
        </div>
      </div>

      <div class="danger"><strong>Importante:</strong> NO marqués <code>withdrawals.write</code> ni <code>account.write</code>. Innovate.ia solo necesita <strong>recibir cobros</strong>, no retirar fondos ni modificar la configuración de tu cuenta. Mantener el principio de menor privilegio te protege si algo se filtrara.</div>
    </div>
  </article>

  <article class="step-card">
    <div class="step-head">
      <div class="step-num">4</div>
      <div class="step-meta">
        <div class="step-tag">Obtener API Key y Webhook Secret</div>
        <h2 class="step-title">Copiá los 2 valores que te genera Belo</h2>
      </div>
    </div>
    <div class="step-body">
      <p>Belo te muestra <strong>API Key</strong> y <strong>Webhook Secret</strong>. Ambos se muestran <strong>una sola vez</strong> — copialos en ese momento.</p>

      <div class="mockup web">
        <div class="browser-bar">
          <div class="browser-dots"><span></span><span></span><span></span></div>
          <div class="browser-url">pay.belo.app/developers/cred_xyz</div>
        </div>
        <div class="mp-app-layout">
          <aside class="mp-sidebar">
            <div class="mp-sidebar-title">Credential</div>
            <div class="mp-nav-item">📋 Overview</div>
            <div class="mp-nav-item active">🔑 Keys</div>
            <div class="mp-nav-item">🔔 Webhook</div>
            <div class="mp-nav-item">📊 Usage</div>
          </aside>
          <main class="mp-content">
            <div class="mp-h1" style="font-size: 17px;"><span class="mp-pill" style="background: #0066ff;">Live</span>Credentials generated</div>
            <div class="mp-sub">⚠ Save them now — both values are shown only once.</div>

            <div class="mp-cred-card">
              <div class="mp-cred-row">
                <div class="mp-cred-label">API Key</div>
                <div class="mp-cred-actions"><button class="mp-icon-btn">📋</button></div>
              </div>
              <div class="mp-cred-value">belo_live_pk_8a4b2c9d6e3f7a1b5c8d2e6f9a3b7c4d</div>
            </div>

            <div class="mp-cred-card">
              <div class="mp-cred-row">
                <div class="mp-cred-label">Webhook Secret</div>
                <div class="mp-cred-actions"><button class="mp-icon-btn">👁</button><button class="mp-icon-btn">📋</button></div>
              </div>
              <div class="mp-cred-value">belo_whsec_<span class="blur">2f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c</span>4d3e2f1a</div>
            </div>
          </main>
        </div>
      </div>

      <div class="tip"><strong>Lo que tenés que copiar:</strong> los 2 valores. La API Key autentica las llamadas; el Webhook Secret valida con HMAC que las notificaciones de Belo sean auténticas.</div>

      <div class="danger"><strong>Cuidado:</strong> ambos valores se muestran una sola vez. Si te olvidás de copiarlos, vas a tener que crear una credencial nueva (la actual queda inutilizable).</div>
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
        <strong>⚠ NUNCA COMPARTAS ESTOS DATOS CON NADIE.</strong> Tu API Key de Belo permite generar cobros a tu nombre — quien la tenga puede operar tu cuenta. Innovate.ia <strong>nunca</strong> te va a pedir que se los envíes.
      </div>

      <p>Andá a tu panel → <code>Configuración → Billetera Virtual</code>, elegí <strong>Belo</strong> en el selector:</p>

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
              <input class="ia-input" value="Belo" readonly />
            </div>
          </div>

          <div class="ia-field">
            <p class="ia-field-label" style="color: ${ACCENT};">API Key</p>
            <div class="ia-input-wrap">
              <input class="ia-input" value="belo_live_pk_8a4b2c9d6e3f7a1b..." readonly />
              <span class="ia-pill-ok">Configurado</span>
            </div>
            <p class="ia-help">Autentica las llamadas a la API de Belo. Se cifra al guardarse.</p>
          </div>

          <div class="ia-field">
            <p class="ia-field-label" style="color: ${ACCENT};">Webhook Secret</p>
            <div class="ia-input-wrap">
              <input class="ia-input" value="belo_whsec_2f9a8b7c6d5e..." readonly />
              <span class="ia-pill-ok">Configurado</span>
            </div>
            <p class="ia-help">Valida que las notificaciones de pago vienen de Belo (HMAC). Se cifra al guardarse.</p>
          </div>

          <div>
            <p class="ia-tag" style="font-weight:600;">🔗 URL para configurar en Belo Developers</p>
            <div class="ia-input-wrap" style="background: #111420;">
              <code style="font-size: 12px; font-family: 'JetBrains Mono', monospace; color: ${ACCENT}; word-break: break-all;">https://dvzxkortcvuakjhsidrr.supabase.co/functions/v1/belo-confirm</code>
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
        <h2 class="step-title">Cómo protegemos tus credenciales de Belo</h2>
      </div>
    </div>
    <div class="step-body">
      <div style="margin: 18px 0;">
        <div class="sec-card">
          <div class="sec-check">✓</div>
          <div>
            <p class="sec-title">Cifrado en reposo</p>
            <p class="sec-desc">API Key y Webhook Secret se encriptan con AES-256-GCM antes de escribirse en la base.</p>
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
            <p class="sec-title">Permisos mínimos</p>
            <p class="sec-desc">La API Key solo tiene scopes <code>payments.write</code> y <code>payments.read</code>. <strong>No</strong> puede retirar fondos ni modificar tu cuenta.</p>
          </div>
        </div>
        <div class="sec-card">
          <div class="sec-check">✓</div>
          <div>
            <p class="sec-title">Solo se descifran al cobrar</p>
            <p class="sec-desc">La función que procesa pagos las descifra en memoria solo durante el milisegundo del cobro. No quedan en logs.</p>
          </div>
        </div>
      </div>

      <div class="danger">
        <strong>⚠ Si sospechás que tu API Key se filtró:</strong>
        <ol style="margin: 8px 0 0 18px; padding: 0; font-size: 13px; line-height: 1.7;">
          <li>Andá a Belo Developers → Tu credential</li>
          <li>Click en <code>Revoke</code></li>
          <li>Creá una nueva credencial con los mismos scopes</li>
          <li>Pegala en Innovate.ia (Configuración → Billetera Virtual)</li>
          <li>La vieja deja de funcionar al instante.</li>
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
          <div class="summary-item-title">API Key</div>
          <div class="summary-item-desc">Empieza con <code style="font-family: 'JetBrains Mono', monospace; color: var(--gold2); background: var(--surf2); padding: 1px 5px; border-radius: 3px; font-size: 11px;">belo_live_pk_...</code>. Autentica cada llamada a Belo. <strong style="color: var(--danger-soft);">Es secreto.</strong></div>
        </div>
      </div>
      <div class="summary-item">
        <div class="summary-check">✓</div>
        <div>
          <div class="summary-item-title">Webhook Secret</div>
          <div class="summary-item-desc">Empieza con <code style="font-family: 'JetBrains Mono', monospace; color: var(--gold2); background: var(--surf2); padding: 1px 5px; border-radius: 3px; font-size: 11px;">belo_whsec_...</code>. Solo se muestra una vez. <strong style="color: var(--danger-soft);">No lo compartas.</strong></div>
        </div>
      </div>
    </div>
  </section>
</div>
`

export default function InstruccionesBelo() {
  return <WalletTutorialLayout walletName="Belo" accent={ACCENT} bodyHtml={BODY_HTML} />
}
