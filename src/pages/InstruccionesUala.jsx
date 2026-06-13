import WalletTutorialLayout from './_WalletTutorialLayout'

const ACCENT = '#5a4fff'

const BODY_HTML = `
<div class="container">
  <header class="head">
    <div class="chip" style="background: rgba(90,79,255,0.08); border-color: rgba(90,79,255,0.3); color: #8278ff;">Tutorial paso a paso · Ualá Bis</div>
    <h1>Cómo conseguir tus credenciales de <span style="color:${ACCENT};">Ualá Bis</span></h1>
    <p>Ualá Bis es la solución de cobros de Ualá. Te da CVU, link de pago y API REST con webhook firmado. Cuenta personal con DNI alcanza — no necesitás CUIT ni cuenta de empresa.</p>
    <div class="meta">
      <span>⏱ <strong>10–15 minutos</strong></span>
      <span>💵 <strong>Gratis</strong></span>
      <span>🔒 <strong>Tus datos, en tu panel</strong></span>
    </div>
  </header>

  <article class="step-card">
    <div class="step-head">
      <div class="step-num">1</div>
      <div class="step-meta">
        <div class="step-tag">Activar Ualá Bis</div>
        <h2 class="step-title">Activá Ualá Bis desde tu app</h2>
      </div>
    </div>
    <div class="step-body">
      <p>Si todavía no tenés Ualá Bis activado, abrí la app de Ualá y andá a la sección <strong>Cobros</strong> en la home. Si no la ves, buscá en el menú el ícono de Ualá Bis.</p>
      <p>Ualá te puede pedir aceptar términos comerciales y validar identidad si nunca cobraste antes. El proceso es 100% online y suele aprobarse en minutos.</p>

      <div class="mockup app">
        <div class="phone-status" style="background: #0a0a0a;">
          <span>9:41</span>
          <span>● ● ● ●</span>
        </div>
        <div style="background: #0a0a0a;">
          <div class="app-topbar">
            <div class="app-back">←</div>
            <div class="app-title">Ualá Bis</div>
          </div>
          <div class="phone-body">
            <div class="app-section-title">Cobrar</div>
            <div class="app-row active" style="background: rgba(90,79,255,0.15); border-color: rgba(90,79,255,0.4);">
              <div class="app-row-icon" style="background: rgba(90,79,255,0.2); color: #8278ff;">⚡</div>
              <div class="app-row-text">
                <div class="app-row-title">Activar Ualá Bis</div>
                <div class="app-row-desc">Cobrá con QR, link y API</div>
              </div>
              <div class="app-row-arrow">→</div>
            </div>
            <div class="app-row">
              <div class="app-row-icon" style="background: rgba(255,255,255,0.1);">📊</div>
              <div class="app-row-text">
                <div class="app-row-title">Mis cobros</div>
                <div class="app-row-desc">Historial y reportes</div>
              </div>
              <div class="app-row-arrow">→</div>
            </div>
          </div>
        </div>
      </div>

      <div class="tip"><strong>Si Ualá Bis ya está activado:</strong> saltá directo al paso 2. Si te pide CUIT en algún paso, podés usar tu CUIL (al final también es CUIT para personas físicas) — andá tranquilo, no hay que abrir empresa.</div>
    </div>
  </article>

  <article class="step-card">
    <div class="step-head">
      <div class="step-num">2</div>
      <div class="step-meta">
        <div class="step-tag">Acceso al portal de developers</div>
        <h2 class="step-title">Entrá al portal de Ualá Developers</h2>
      </div>
    </div>
    <div class="step-body">
      <p>Las credenciales de API se obtienen desde el portal web de Ualá Bis (no la app móvil). Abrí esta dirección con la misma cuenta de tu app:</p>
      <p><a href="https://uala-bis.com.ar/developers" target="_blank" rel="noopener noreferrer">https://uala-bis.com.ar/developers</a></p>

      <div class="mockup web">
        <div class="browser-bar">
          <div class="browser-dots"><span></span><span></span><span></span></div>
          <div class="browser-url">uala-bis.com.ar/developers</div>
        </div>
        <div class="mp-body" style="background: #fafafa;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; flex-wrap: wrap; gap: 12px;">
            <div>
              <div class="mp-h1">Tus integraciones</div>
              <div class="mp-sub">Generá credenciales de API para conectar Ualá Bis a tu sistema.</div>
            </div>
            <button class="mp-btn">+ Crear integración</button>
          </div>
          <div style="background: #fff; border: 1px dashed #d0d0d0; border-radius: 9px; padding: 32px; text-align: center; color: #999; font-size: 13px;">
            No tenés integraciones creadas todavía
          </div>
        </div>
      </div>

      <div class="tip"><strong>Atajo:</strong> click en el botón <code>+ Crear integración</code> arriba a la derecha.</div>
    </div>
  </article>

  <article class="step-card">
    <div class="step-head">
      <div class="step-num">3</div>
      <div class="step-meta">
        <div class="step-tag">Crear integración</div>
        <h2 class="step-title">Completá los datos de tu integración</h2>
      </div>
    </div>
    <div class="step-body">
      <p>Ualá te pide un nombre de integración y la URL donde recibís los webhooks de pago.</p>

      <div class="mockup web">
        <div class="browser-bar">
          <div class="browser-dots"><span></span><span></span><span></span></div>
          <div class="browser-url">uala-bis.com.ar/developers/integrations/new</div>
        </div>
        <div class="mp-body">
          <div class="mp-breadcrumb">Tus integraciones &nbsp;›&nbsp; <span>Nueva</span></div>
          <div class="mp-h1">Nueva integración</div>
          <div class="mp-sub">Configurá los datos básicos para conectar tu sistema.</div>

          <div class="mp-form">
            <div class="mp-field">
              <label class="mp-label">Nombre de la integración <span class="req">*</span></label>
              <input class="mp-input filled-good" value="Cobros Mi Negocio" readonly />
              <div class="mp-help">Solo es un identificador interno.</div>
            </div>

            <div class="mp-field">
              <label class="mp-label">Tipo de uso <span class="req">*</span></label>
              <input class="mp-input filled-good" value="Cobros con link de pago" readonly />
            </div>

            <div class="mp-field">
              <label class="mp-label">URL de notificaciones (webhook) <span class="req">*</span></label>
              <input class="mp-input filled-good" value="https://dvzxkortcvuakjhsidrr.supabase.co/functions/v1/uala-confirm" readonly />
              <div class="mp-help">📋 Esta URL la copiás directo de tu panel de Innovate.ia.</div>
            </div>

            <div style="display: flex; gap: 10px; margin-top: 10px;">
              <button class="mp-btn mp-btn-secondary">Cancelar</button>
              <button class="mp-btn">Crear integración</button>
            </div>
          </div>
        </div>
      </div>

      <div class="danger"><strong>Importante:</strong> en "Tipo de uso" elegí siempre <code>Cobros con link de pago</code>. No elijas opciones de <em>marketplace</em> o <em>plataforma</em>: requieren documentación comercial extra.</div>
    </div>
  </article>

  <article class="step-card">
    <div class="step-head">
      <div class="step-num">4</div>
      <div class="step-meta">
        <div class="step-tag">Obtener Client ID y Client Secret</div>
        <h2 class="step-title">Copiá las 2 credenciales que te genera Ualá</h2>
      </div>
    </div>
    <div class="step-body">
      <p>Cuando guardás la integración, Ualá te muestra el <strong>Client ID</strong> y el <strong>Client Secret</strong>. El Secret se muestra <strong>una sola vez</strong> — copialo en ese momento o vas a tener que regenerarlo.</p>

      <div class="mockup web">
        <div class="browser-bar">
          <div class="browser-dots"><span></span><span></span><span></span></div>
          <div class="browser-url">uala-bis.com.ar/developers/integrations/abc123</div>
        </div>
        <div class="mp-app-layout">
          <aside class="mp-sidebar">
            <div class="mp-sidebar-title">Tu integración</div>
            <div class="mp-nav-item">📋 General</div>
            <div class="mp-nav-item active">🔑 Credenciales</div>
            <div class="mp-nav-item">🔔 Webhooks</div>
            <div class="mp-nav-item">📊 Logs</div>
          </aside>
          <main class="mp-content">
            <div class="mp-h1" style="font-size: 17px;"><span class="mp-pill mp-pill-prod">Producción</span>Credenciales de API</div>
            <div class="mp-sub">Usá estas credenciales para autenticar tus llamadas.</div>

            <div class="mp-cred-card">
              <div class="mp-cred-row">
                <div class="mp-cred-label">Client ID</div>
                <div class="mp-cred-actions"><button class="mp-icon-btn">📋</button></div>
              </div>
              <div class="mp-cred-value">uala_live_a1b2c3d4e5f6789012345678</div>
            </div>

            <div class="mp-cred-card">
              <div class="mp-cred-row">
                <div class="mp-cred-label">Client Secret</div>
                <div class="mp-cred-actions"><button class="mp-icon-btn">👁</button><button class="mp-icon-btn">📋</button></div>
              </div>
              <div class="mp-cred-value">uala_secret_<span class="blur">9f8e7d6c5b4a3210fedcba9876543210</span>1234abcd</div>
            </div>
          </main>
        </div>
      </div>

      <div class="tip"><strong>Lo que tenés que copiar:</strong> los 2 valores. El Client ID es visible siempre; el Client Secret es la clave privada (cuidalo como una contraseña).</div>

      <div class="danger"><strong>Cuidado:</strong> el Client Secret nunca se comparte. Es como una contraseña. Si lo expones, regenerá uno nuevo desde el mismo panel y actualizá Innovate.ia con el nuevo.</div>
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
        <strong>⚠ NUNCA COMPARTAS ESTOS DATOS CON NADIE.</strong> Ni con nosotros, ni con soporte, ni por mail/WhatsApp/Telegram. Tu Client Secret de Ualá es equivalente a una contraseña de tu cuenta — quien lo tenga puede generar cobros a tu nombre. Innovate.ia <strong>nunca</strong> te va a pedir que se los envíes.
      </div>

      <p>Andá a tu panel de Innovate.ia → <code>Configuración → Billetera Virtual</code>, elegí <strong>Ualá Bis</strong> en el selector de proveedor y pegá los 2 valores:</p>

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
              <input class="ia-input" value="Ualá Bis" readonly />
            </div>
          </div>

          <div class="ia-field">
            <p class="ia-field-label" style="color: ${ACCENT};">Client ID</p>
            <div class="ia-input-wrap">
              <input class="ia-input" value="uala_live_a1b2c3d4e5f6789012345678" readonly />
              <span class="ia-pill-ok">Configurado</span>
            </div>
            <p class="ia-help">Identificador público de tu integración. Se cifra al guardarse.</p>
          </div>

          <div class="ia-field">
            <p class="ia-field-label" style="color: ${ACCENT};">Client Secret</p>
            <div class="ia-input-wrap">
              <input class="ia-input" value="uala_secret_9f8e7d6c5b4a..." readonly />
              <span class="ia-pill-ok">Configurado</span>
            </div>
            <p class="ia-help">Se usa para autenticar y firmar las llamadas. Se cifra al guardarse.</p>
          </div>

          <div>
            <p class="ia-tag" style="font-weight:600;">🔗 URL para configurar en Ualá Bis</p>
            <div class="ia-input-wrap" style="background: #111420;">
              <code style="font-size: 12px; font-family: 'JetBrains Mono', monospace; color: ${ACCENT}; word-break: break-all;">https://dvzxkortcvuakjhsidrr.supabase.co/functions/v1/uala-confirm</code>
              <button style="background: transparent; border: 1px solid #1e2130; color: #E9E7E0; font-size: 11px; padding: 4px 10px; border-radius: 6px;">Copiar</button>
            </div>
          </div>

          <button class="ia-btn-primary">Guardar configuración</button>
        </div>
      </div>

      <div class="tip"><strong>✅ Listo.</strong> El Client ID y el Secret se cifran con AES-256 antes de tocar la base. Innovate.ia los desencripta solo en memoria al validar cada cobro.</div>
    </div>
  </article>

  <article class="step-card">
    <div class="step-head">
      <div class="step-num danger">!</div>
      <div class="step-meta">
        <div class="step-tag danger">Seguridad y privacidad</div>
        <h2 class="step-title">Cómo protegemos tus credenciales de Ualá</h2>
      </div>
    </div>
    <div class="step-body">
      <p style="font-size: 14px;">Tu Client Secret es un secreto crítico. Esto es exactamente lo que pasa con él:</p>

      <div style="margin: 18px 0;">
        <div class="sec-card">
          <div class="sec-check">✓</div>
          <div>
            <p class="sec-title">Cifrado en reposo</p>
            <p class="sec-desc">Se encripta con AES-256-GCM (clave en KMS) antes de escribirse en la base. La columna en disco contiene solo el ciphertext.</p>
          </div>
        </div>
        <div class="sec-card">
          <div class="sec-check">✓</div>
          <div>
            <p class="sec-title">Aislado por tenant (RLS)</p>
            <p class="sec-desc">Row-Level Security a nivel Postgres garantiza que solo tu cuenta puede tocar tus secrets. Otros tenants no pueden consultarlos ni con SQL directo.</p>
          </div>
        </div>
        <div class="sec-card">
          <div class="sec-check">✓</div>
          <div>
            <p class="sec-title">Nunca vuelve al frontend</p>
            <p class="sec-desc">Una vez cargado, el campo solo muestra "Configurado" — el valor real nunca se devuelve al navegador. Para cambiarlo tenés que pegar uno nuevo.</p>
          </div>
        </div>
        <div class="sec-card">
          <div class="sec-check">✓</div>
          <div>
            <p class="sec-title">Solo se descifra al cobrar</p>
            <p class="sec-desc">La función que procesa pagos lo descifra en memoria solo durante el milisegundo que dura cada cobro. No queda en logs ni se expone a APIs externas.</p>
          </div>
        </div>
      </div>

      <div class="danger">
        <strong>⚠ Si sospechás que tu Client Secret se filtró:</strong>
        <ol style="margin: 8px 0 0 18px; padding: 0; font-size: 13px; line-height: 1.7;">
          <li>Andá al portal de Ualá Developers → Tu integración → Credenciales</li>
          <li>Click en <code>Regenerar Secret</code></li>
          <li>Copiá el nuevo Secret y pegalo en Innovate.ia (Configuración → Billetera Virtual)</li>
          <li>El viejo Secret deja de funcionar al instante.</li>
        </ol>
      </div>

      <div class="danger">
        <strong>⚠ Innovate.ia NUNCA te va a pedir tus credenciales por:</strong>
        <ul style="margin: 8px 0 0 18px; padding: 0; font-size: 13px; line-height: 1.7;">
          <li>WhatsApp, Telegram, SMS, llamada o videollamada</li>
          <li>Email (ni de soporte, ni de ningún área)</li>
          <li>Formularios externos al panel</li>
          <li>Capturas de pantalla, fotos o documentos</li>
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
          <div class="summary-item-desc">Empieza con <code style="font-family: 'JetBrains Mono', monospace; color: var(--gold2); background: var(--surf2); padding: 1px 5px; border-radius: 3px; font-size: 11px;">uala_live_...</code>. Es el identificador público de tu integración.</div>
        </div>
      </div>
      <div class="summary-item">
        <div class="summary-check">✓</div>
        <div>
          <div class="summary-item-title">Client Secret</div>
          <div class="summary-item-desc">Empieza con <code style="font-family: 'JetBrains Mono', monospace; color: var(--gold2); background: var(--surf2); padding: 1px 5px; border-radius: 3px; font-size: 11px;">uala_secret_...</code>, ~50 caracteres. Solo se muestra una vez. <strong style="color: var(--danger-soft);">Es secreto. No lo compartas.</strong></div>
        </div>
      </div>
    </div>
  </section>
</div>
`

export default function InstruccionesUala() {
  return <WalletTutorialLayout walletName="Ualá Bis" accent={ACCENT} bodyHtml={BODY_HTML} />
}
