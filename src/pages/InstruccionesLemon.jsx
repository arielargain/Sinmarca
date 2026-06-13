import WalletTutorialLayout from './_WalletTutorialLayout'

const ACCENT = '#00d672'

const BODY_HTML = `
<div class="container">
  <header class="head">
    <div class="chip" style="background: rgba(0,214,114,0.08); border-color: rgba(0,214,114,0.3); color: #00d672;">Tutorial paso a paso · Lemon Cash</div>
    <h1>Cómo conseguir tus credenciales de <span style="color:${ACCENT};">Lemon Cash</span></h1>
    <p>Lemon es la app de cripto más usada en Argentina. Cobrás en USDT (estable, atado al dólar) sin comisión real, y convertís a pesos cuando vos quieras. DNI alcanza — no hay verificación de empresa ni CUIT.</p>
    <div class="meta">
      <span>⏱ <strong>10–15 minutos</strong></span>
      <span>💵 <strong>0% comisión USDT</strong></span>
      <span>🔒 <strong>Tus datos, en tu panel</strong></span>
    </div>
  </header>

  <article class="step-card">
    <div class="step-head">
      <div class="step-num">1</div>
      <div class="step-meta">
        <div class="step-tag">Activar Lemon Pay</div>
        <h2 class="step-title">Activá Lemon Pay desde tu app</h2>
      </div>
    </div>
    <div class="step-body">
      <p>Lemon Pay es la sección de cobros profesionales dentro de Lemon. Si todavía no la tenés activa, abrí la app, andá a <strong>Más</strong> → <strong>Lemon Pay</strong> y aceptá los términos.</p>
      <p>Lemon te puede pedir verificar tu identidad subiendo foto del DNI (si todavía no lo hiciste). El proceso es 100% online y suele aprobarse en minutos.</p>

      <div class="mockup app">
        <div class="phone-status" style="background: #0a0a0a;">
          <span>9:41</span>
          <span>● ● ● ●</span>
        </div>
        <div style="background: #0a0a0a;">
          <div class="app-topbar">
            <div class="app-back">←</div>
            <div class="app-title">Lemon</div>
          </div>
          <div class="phone-body">
            <div class="app-section-title">Para emprendedores</div>
            <div class="app-row active" style="background: rgba(0,214,114,0.18); border-color: rgba(0,214,114,0.4);">
              <div class="app-row-icon" style="background: rgba(0,214,114,0.25); color: #00d672;">🍋</div>
              <div class="app-row-text">
                <div class="app-row-title">Activar Lemon Pay</div>
                <div class="app-row-desc">Cobrá en USDT con link y API</div>
              </div>
              <div class="app-row-arrow">→</div>
            </div>
            <div class="app-row">
              <div class="app-row-icon" style="background: rgba(255,255,255,0.1);">📊</div>
              <div class="app-row-text">
                <div class="app-row-title">Mis cobros</div>
                <div class="app-row-desc">Historial y conversiones</div>
              </div>
              <div class="app-row-arrow">→</div>
            </div>
          </div>
        </div>
      </div>

      <div class="tip"><strong>¿Por qué USDT?</strong> 0% comisión real (Lemon no cobra fee), instantáneo, y vos elegís cuándo convertir a pesos al tipo de cambio del momento. Ideal si tu público maneja cripto o querés dolarizar tus ingresos.</div>
    </div>
  </article>

  <article class="step-card">
    <div class="step-head">
      <div class="step-num">2</div>
      <div class="step-meta">
        <div class="step-tag">Acceso al portal de developers</div>
        <h2 class="step-title">Entrá a Lemon Business</h2>
      </div>
    </div>
    <div class="step-body">
      <p>Las credenciales de API se generan desde el portal web de Lemon Business. Abrí esta URL con la misma cuenta de tu app:</p>
      <p><a href="https://business.lemon.me/developers" target="_blank" rel="noopener noreferrer">https://business.lemon.me/developers</a></p>

      <div class="mockup web">
        <div class="browser-bar">
          <div class="browser-dots"><span></span><span></span><span></span></div>
          <div class="browser-url">business.lemon.me/developers</div>
        </div>
        <div class="mp-body" style="background: #fafafa;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; flex-wrap: wrap; gap: 12px;">
            <div>
              <div class="mp-h1">API Keys</div>
              <div class="mp-sub">Generá API keys para integrar Lemon Pay con tu sistema.</div>
            </div>
            <button class="mp-btn">+ Nueva API Key</button>
          </div>
          <div style="background: #fff; border: 1px dashed #d0d0d0; border-radius: 9px; padding: 32px; text-align: center; color: #999; font-size: 13px;">
            No hay API keys creadas todavía
          </div>
        </div>
      </div>

      <div class="tip"><strong>Atajo:</strong> click en <code>+ Nueva API Key</code> arriba a la derecha.</div>
    </div>
  </article>

  <article class="step-card">
    <div class="step-head">
      <div class="step-num">3</div>
      <div class="step-meta">
        <div class="step-tag">Crear API Key</div>
        <h2 class="step-title">Configurá los permisos de tu API Key</h2>
      </div>
    </div>
    <div class="step-body">
      <p>Lemon te pide nombre de la key, permisos y URL de webhook. Para Innovate.ia necesitás permisos de <strong>cobros</strong> (crear, leer, recibir notificaciones).</p>

      <div class="mockup web">
        <div class="browser-bar">
          <div class="browser-dots"><span></span><span></span><span></span></div>
          <div class="browser-url">business.lemon.me/developers/keys/new</div>
        </div>
        <div class="mp-body">
          <div class="mp-breadcrumb">API Keys &nbsp;›&nbsp; <span>Nueva</span></div>
          <div class="mp-h1">Nueva API Key</div>
          <div class="mp-sub">Definí permisos y dónde recibir las notificaciones.</div>

          <div class="mp-form">
            <div class="mp-field">
              <label class="mp-label">Nombre <span class="req">*</span></label>
              <input class="mp-input filled-good" value="Cobros Mi Negocio" readonly />
            </div>

            <div class="mp-field">
              <label class="mp-label">Permisos <span class="req">*</span></label>
              <div style="display: flex; flex-direction: column; gap: 6px; margin-top: 4px;">
                <label style="display: flex; align-items: center; gap: 8px; font-size: 12.5px; color: #1a1a1a;">
                  <span style="display: inline-block; width: 16px; height: 16px; background: #00d672; border-radius: 4px; color: #fff; text-align: center; font-size: 11px; line-height: 16px;">✓</span>
                  payments:create
                </label>
                <label style="display: flex; align-items: center; gap: 8px; font-size: 12.5px; color: #1a1a1a;">
                  <span style="display: inline-block; width: 16px; height: 16px; background: #00d672; border-radius: 4px; color: #fff; text-align: center; font-size: 11px; line-height: 16px;">✓</span>
                  payments:read
                </label>
                <label style="display: flex; align-items: center; gap: 8px; font-size: 12.5px; color: #1a1a1a;">
                  <span style="display: inline-block; width: 16px; height: 16px; background: #00d672; border-radius: 4px; color: #fff; text-align: center; font-size: 11px; line-height: 16px;">✓</span>
                  webhooks:receive
                </label>
                <label style="display: flex; align-items: center; gap: 8px; font-size: 12.5px; color: #999;">
                  <span style="display: inline-block; width: 16px; height: 16px; background: #fff; border: 1px solid #ccc; border-radius: 4px;"></span>
                  withdrawals:create <span style="color: #d40000; font-size: 10px;">(no marcar)</span>
                </label>
              </div>
            </div>

            <div class="mp-field">
              <label class="mp-label">Webhook URL <span class="req">*</span></label>
              <input class="mp-input filled-good" value="https://dvzxkortcvuakjhsidrr.supabase.co/functions/v1/lemon-confirm" readonly />
              <div class="mp-help">📋 La URL la copiás del panel de Innovate.ia.</div>
            </div>

            <div style="display: flex; gap: 10px; margin-top: 10px;">
              <button class="mp-btn mp-btn-secondary">Cancelar</button>
              <button class="mp-btn">Generar API Key</button>
            </div>
          </div>
        </div>
      </div>

      <div class="danger"><strong>Importante:</strong> NO marqués <code>withdrawals:create</code>. Innovate.ia solo necesita <strong>recibir cobros</strong> a tu nombre, nunca tiene que poder retirar fondos de tu cuenta. Mantener el principio de menor privilegio te protege si algo se filtrara.</div>
    </div>
  </article>

  <article class="step-card">
    <div class="step-head">
      <div class="step-num">4</div>
      <div class="step-meta">
        <div class="step-tag">Obtener API Key y Secret</div>
        <h2 class="step-title">Copiá API Key y Webhook Secret</h2>
      </div>
    </div>
    <div class="step-body">
      <p>Lemon te genera 2 valores: una <strong>API Key</strong> (visible siempre) y un <strong>Webhook Secret</strong> (privado, se muestra <strong>una sola vez</strong>).</p>

      <div class="mockup web">
        <div class="browser-bar">
          <div class="browser-dots"><span></span><span></span><span></span></div>
          <div class="browser-url">business.lemon.me/developers/keys/lk_abc</div>
        </div>
        <div class="mp-app-layout">
          <aside class="mp-sidebar">
            <div class="mp-sidebar-title">Tu API Key</div>
            <div class="mp-nav-item">📋 Detalles</div>
            <div class="mp-nav-item active">🔑 Credenciales</div>
            <div class="mp-nav-item">🔔 Webhook</div>
            <div class="mp-nav-item">📊 Logs</div>
          </aside>
          <main class="mp-content">
            <div class="mp-h1" style="font-size: 17px;"><span class="mp-pill" style="background: #00d672;">Producción</span>API Key generada</div>
            <div class="mp-sub">Copiá ahora — el Webhook Secret no se vuelve a mostrar.</div>

            <div class="mp-cred-card">
              <div class="mp-cred-row">
                <div class="mp-cred-label">API Key</div>
                <div class="mp-cred-actions"><button class="mp-icon-btn">📋</button></div>
              </div>
              <div class="mp-cred-value">lk_live_5f8a2b9c4d6e1f3a7b8c9d0e2f4a5b6c</div>
            </div>

            <div class="mp-cred-card">
              <div class="mp-cred-row">
                <div class="mp-cred-label">Webhook Secret</div>
                <div class="mp-cred-actions"><button class="mp-icon-btn">👁</button><button class="mp-icon-btn">📋</button></div>
              </div>
              <div class="mp-cred-value">whsec_<span class="blur">3c7d2e8f1a5b9c4d6e0f3a7b2c5d8e1f</span>4a6b8c2d</div>
            </div>
          </main>
        </div>
      </div>

      <div class="tip"><strong>Lo que tenés que copiar:</strong> los 2 valores. La API Key autentica las llamadas; el Webhook Secret valida que las notificaciones que llegan son realmente de Lemon (HMAC).</div>

      <div class="danger"><strong>Cuidado:</strong> el Webhook Secret se muestra una sola vez. Si te olvidás de copiarlo, vas a tener que regenerar uno nuevo desde el mismo panel.</div>
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
        <strong>⚠ NUNCA COMPARTAS ESTOS DATOS CON NADIE.</strong> Tu API Key de Lemon permite generar cobros a tu nombre — quien la tenga puede operar tu cuenta. Innovate.ia <strong>nunca</strong> te va a pedir que se los envíes.
      </div>

      <p>Andá a tu panel → <code>Configuración → Billetera Virtual</code>, elegí <strong>Lemon Cash</strong> en el selector:</p>

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
              <input class="ia-input" value="Lemon Cash" readonly />
            </div>
          </div>

          <div class="ia-field">
            <p class="ia-field-label" style="color: ${ACCENT};">API Key</p>
            <div class="ia-input-wrap">
              <input class="ia-input" value="lk_live_5f8a2b9c4d6e1f3a7b8c9d0e2f4a5b6c" readonly />
              <span class="ia-pill-ok">Configurado</span>
            </div>
            <p class="ia-help">Autentica las llamadas a la API de Lemon. Se cifra al guardarse.</p>
          </div>

          <div class="ia-field">
            <p class="ia-field-label" style="color: ${ACCENT};">Webhook Secret</p>
            <div class="ia-input-wrap">
              <input class="ia-input" value="whsec_3c7d2e8f1a5b..." readonly />
              <span class="ia-pill-ok">Configurado</span>
            </div>
            <p class="ia-help">Valida que las notificaciones de pago vienen de Lemon (HMAC). Se cifra al guardarse.</p>
          </div>

          <div>
            <p class="ia-tag" style="font-weight:600;">🔗 URL para configurar en Lemon Business</p>
            <div class="ia-input-wrap" style="background: #111420;">
              <code style="font-size: 12px; font-family: 'JetBrains Mono', monospace; color: ${ACCENT}; word-break: break-all;">https://dvzxkortcvuakjhsidrr.supabase.co/functions/v1/lemon-confirm</code>
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
        <h2 class="step-title">Cómo protegemos tus credenciales de Lemon</h2>
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
            <p class="sec-desc">La API Key solo tiene permisos de <code>payments:create</code>, <code>payments:read</code> y <code>webhooks:receive</code>. <strong>No</strong> puede retirar fondos ni cambiar configuración de tu cuenta.</p>
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
          <li>Andá a Lemon Business → API Keys → Tu key</li>
          <li>Click en <code>Revocar</code></li>
          <li>Generá una nueva con los mismos permisos</li>
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
          <div class="summary-item-desc">Empieza con <code style="font-family: 'JetBrains Mono', monospace; color: var(--gold2); background: var(--surf2); padding: 1px 5px; border-radius: 3px; font-size: 11px;">lk_live_...</code>. Autentica cada llamada a Lemon. <strong style="color: var(--danger-soft);">Es secreto.</strong></div>
        </div>
      </div>
      <div class="summary-item">
        <div class="summary-check">✓</div>
        <div>
          <div class="summary-item-title">Webhook Secret</div>
          <div class="summary-item-desc">Empieza con <code style="font-family: 'JetBrains Mono', monospace; color: var(--gold2); background: var(--surf2); padding: 1px 5px; border-radius: 3px; font-size: 11px;">whsec_...</code>. Solo se muestra una vez. <strong style="color: var(--danger-soft);">No lo compartas.</strong></div>
        </div>
      </div>
    </div>
  </section>
</div>
`

export default function InstruccionesLemon() {
  return <WalletTutorialLayout walletName="Lemon Cash" accent={ACCENT} bodyHtml={BODY_HTML} />
}
