import { useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import { COLORS, FONT_WEIGHT } from '../theme/tokens'
import { getInstruccionesBase } from '../lib/instruccionesScope'

const C = COLORS

const TUTORIAL_HTML = `
<style>
  .mp-tutorial {
    --gold: #D4A843;
    --gold2: #F0C96A;
    --bg: #050709;
    --surf: #0C0F14;
    --surf2: #14181F;
    --border: #1a1f2e;
    --border2: #2a3142;
    --text: #E8E4D9;
    --muted: #6a7180;
    --muted2: #8a909e;
    --mp-blue: #009ee3;
    --mp-yellow: #fff159;
    background: var(--bg);
    color: var(--text);
    font-family: 'DM Sans', sans-serif;
    line-height: 1.6;
    padding: clamp(28px, 3vw, 56px) clamp(16px, 3vw, 64px) clamp(60px, 5vw, 120px);
  }
  .mp-tutorial * { box-sizing: border-box; margin: 0; padding: 0; }
  .mp-tutorial .container { max-width: clamp(920px, 75vw, 1400px); margin: 0 auto; }
  .mp-tutorial .head { text-align: center; margin-bottom: clamp(50px, 4vw, 80px); }
  .mp-tutorial .head .chip {
    display: inline-block; padding: 6px 14px; border-radius: 99px;
    background: rgba(212,168,67,.08); border: 1px solid rgba(212,168,67,.25);
    color: var(--gold); font-size: clamp(11px, 0.7vw, 14px); font-weight: 600;
    letter-spacing: .1em; text-transform: uppercase; margin-bottom: 18px;
  }
  .mp-tutorial .head h1 {
    font-size: clamp(26px, 3vw, 52px);
    font-weight: 800; letter-spacing: -.02em; margin-bottom: 14px; color: var(--text);
  }
  .mp-tutorial .head h1 .accent { color: var(--gold); }
  .mp-tutorial .head p { font-size: clamp(15px, 1vw, 19px); color: var(--muted); max-width: clamp(580px, 50vw, 880px); margin: 0 auto; }
  .mp-tutorial .head .meta { display: inline-flex; gap: 18px; margin-top: 22px; font-size: clamp(12px, 0.85vw, 15px); color: var(--muted2); flex-wrap: wrap; justify-content: center; }
  .mp-tutorial .head .meta span { display: inline-flex; align-items: center; gap: 6px; }
  .mp-tutorial .head .meta strong { color: var(--text); font-weight: 500; }

  .mp-tutorial .step-card {
    background: var(--surf); border: 1px solid var(--border); border-radius: 18px;
    padding: clamp(28px, 2.4vw, 44px) clamp(26px, 2.2vw, 40px); margin-bottom: clamp(24px, 2vw, 36px); position: relative; overflow: hidden;
  }
  .mp-tutorial .step-card::before {
    content: ''; position: absolute; top: 0; left: 0; width: 4px; height: 100%; background: var(--gold);
  }
  .mp-tutorial .step-head { display: flex; align-items: flex-start; gap: clamp(16px, 1.4vw, 24px); margin-bottom: clamp(22px, 1.8vw, 32px); }
  .mp-tutorial .step-num {
    flex-shrink: 0; width: clamp(44px, 3.6vw, 64px); height: clamp(44px, 3.6vw, 64px); border-radius: clamp(12px, 1vw, 16px);
    background: var(--gold); color: var(--bg); font-size: clamp(19px, 1.6vw, 26px); font-weight: 800;
    display: flex; align-items: center; justify-content: center;
  }
  .mp-tutorial .step-meta { flex: 1; min-width: 0; }
  .mp-tutorial .step-tag {
    display: inline-block; font-size: clamp(10px, 0.7vw, 13px); font-weight: 700; letter-spacing: .12em;
    text-transform: uppercase; color: var(--gold); margin-bottom: 4px;
  }
  .mp-tutorial .step-title { font-size: clamp(20px, 1.8vw, 32px); font-weight: 700; letter-spacing: -.01em; line-height: 1.25; color: var(--text); }
  .mp-tutorial .step-body { font-size: clamp(14px, 1vw, 17px); color: var(--muted); line-height: 1.65; }
  .mp-tutorial .step-body p { margin-bottom: 12px; }
  .mp-tutorial .step-body strong { color: var(--text); font-weight: 600; }
  .mp-tutorial .step-body code {
    background: var(--surf2); border: 1px solid var(--border2); border-radius: 5px;
    padding: 1px 7px; font-family: 'JetBrains Mono', monospace; font-size: 12px; color: var(--gold2);
  }
  .mp-tutorial .step-body a { color: var(--gold); text-decoration: underline; text-decoration-color: rgba(212,168,67,.3); word-break: break-all; }

  .mp-tutorial .mockup {
    background: #fff; border-radius: 12px; margin: 22px 0; overflow: hidden;
    box-shadow: 0 24px 64px rgba(0,0,0,.5); color: #1a1a1a; font-family: 'DM Sans', sans-serif;
  }
  .mp-tutorial .browser-bar { background: #f5f5f5; border-bottom: 1px solid #e0e0e0; padding: 10px 14px; display: flex; align-items: center; gap: 8px; }
  .mp-tutorial .browser-dots { display: flex; gap: 6px; }
  .mp-tutorial .browser-dots span { width: 11px; height: 11px; border-radius: 50%; background: #e0e0e0; }
  .mp-tutorial .browser-dots span:nth-child(1) { background: #ff5f57; }
  .mp-tutorial .browser-dots span:nth-child(2) { background: #ffbd2e; }
  .mp-tutorial .browser-dots span:nth-child(3) { background: #28c941; }
  .mp-tutorial .browser-url { flex: 1; background: #fff; border: 1px solid #d8d8d8; border-radius: 5px; padding: 5px 10px; font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #555; word-break: break-all; }
  .mp-tutorial .browser-url::before { content: '🔒  '; }

  .mp-tutorial .mp-topbar { background: var(--mp-yellow); padding: 12px 20px; display: flex; align-items: center; justify-content: space-between; }
  .mp-tutorial .mp-logo { display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 14px; color: #2d3277; }
  .mp-tutorial .mp-logo-icon { width: 32px; height: 22px; background: var(--mp-blue); border-radius: 16px; position: relative; }
  .mp-tutorial .mp-logo-icon::after { content: ''; position: absolute; width: 18px; height: 10px; background: #fff; border-radius: 8px; top: 6px; left: 7px; }
  .mp-tutorial .mp-user { display: flex; align-items: center; gap: 10px; font-size: 12px; color: #2d3277; }
  .mp-tutorial .mp-avatar { width: 28px; height: 28px; border-radius: 50%; background: var(--mp-blue); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px; }

  .mp-tutorial .mp-body { padding: 22px 24px; background: #fff; min-height: 240px; }
  .mp-tutorial .mp-breadcrumb { font-size: 12px; color: #999; margin-bottom: 14px; }
  .mp-tutorial .mp-breadcrumb span { color: #555; }
  .mp-tutorial .mp-h1 { font-size: 20px; font-weight: 700; color: #1a1a1a; margin-bottom: 6px; }
  .mp-tutorial .mp-sub { font-size: 12px; color: #777; margin-bottom: 22px; }

  .mp-tutorial .mp-form { display: flex; flex-direction: column; gap: 16px; }
  .mp-tutorial .mp-field { display: flex; flex-direction: column; gap: 6px; }
  .mp-tutorial .mp-label { font-size: 13px; font-weight: 600; color: #333; }
  .mp-tutorial .mp-label .req { color: #d40000; margin-left: 2px; }
  .mp-tutorial .mp-help { font-size: 11px; color: #888; margin-top: 2px; }
  .mp-tutorial .mp-input { border: 1px solid #ccc; border-radius: 6px; padding: 9px 12px; font-size: 13px; background: #fff; color: #1a1a1a; font-family: inherit; width: 100%; }
  .mp-tutorial .mp-input.filled { border-color: var(--mp-blue); background: #f8fcff; }
  .mp-tutorial .mp-input.filled-good { border-color: #00a650; background: #f6fdf9; }
  .mp-tutorial .mp-input.placeholder { color: #aaa; }

  .mp-tutorial .mp-radio-group { display: flex; flex-direction: column; gap: 8px; }
  .mp-tutorial .mp-radio { border: 1px solid #d8d8d8; border-radius: 7px; padding: 11px 13px; display: flex; align-items: flex-start; gap: 10px; }
  .mp-tutorial .mp-radio.selected { border-color: var(--mp-blue); background: #f8fcff; }
  .mp-tutorial .mp-radio-dot { width: 17px; height: 17px; border-radius: 50%; border: 2px solid #ccc; flex-shrink: 0; margin-top: 1px; background: #fff; }
  .mp-tutorial .mp-radio.selected .mp-radio-dot { border-color: var(--mp-blue); background: var(--mp-blue); box-shadow: inset 0 0 0 3px #fff; }
  .mp-tutorial .mp-radio-text { flex: 1; }
  .mp-tutorial .mp-radio-title { font-size: 12.5px; font-weight: 600; color: #1a1a1a; margin-bottom: 2px; }
  .mp-tutorial .mp-radio-desc { font-size: 11.5px; color: #777; }

  .mp-tutorial .mp-select { border: 1px solid #ccc; border-radius: 6px; padding: 9px 12px; font-size: 13px; background: #fff; color: #1a1a1a; display: flex; align-items: center; justify-content: space-between; }
  .mp-tutorial .mp-select.filled { border-color: var(--mp-blue); background: #f8fcff; }
  .mp-tutorial .mp-select::after { content: '▾'; color: #888; margin-left: 8px; }

  .mp-tutorial .mp-btn { background: var(--mp-blue); color: #fff; padding: 10px 24px; border-radius: 6px; font-size: 13px; font-weight: 600; display: inline-block; border: none; cursor: pointer; }
  .mp-tutorial .mp-btn-secondary { background: #fff; color: var(--mp-blue); border: 1px solid var(--mp-blue); }

  .mp-tutorial .mp-app-layout { display: grid; grid-template-columns: 200px 1fr; min-height: 300px; }
  .mp-tutorial .mp-sidebar { background: #f7f7f9; border-right: 1px solid #e8e8e8; padding: 18px 0; }
  .mp-tutorial .mp-sidebar-title { font-size: 11px; font-weight: 700; color: #999; text-transform: uppercase; letter-spacing: .05em; padding: 0 18px; margin-bottom: 12px; }
  .mp-tutorial .mp-nav-item { padding: 9px 18px; font-size: 12.5px; color: #555; display: flex; align-items: center; gap: 8px; }
  .mp-tutorial .mp-nav-item.active { background: #e6f3fb; color: var(--mp-blue); font-weight: 600; border-left: 3px solid var(--mp-blue); padding-left: 15px; }
  .mp-tutorial .mp-content { padding: 22px 24px; background: #fff; }

  .mp-tutorial .mp-cred-card { background: #f7f7f9; border: 1px solid #e0e0e0; border-radius: 8px; padding: 14px; margin-bottom: 12px; }
  .mp-tutorial .mp-cred-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
  .mp-tutorial .mp-cred-label { font-size: 11px; font-weight: 700; color: #555; text-transform: uppercase; letter-spacing: .05em; }
  .mp-tutorial .mp-cred-actions { display: flex; gap: 8px; }
  .mp-tutorial .mp-icon-btn { width: 28px; height: 28px; border-radius: 5px; background: #fff; border: 1px solid #d0d0d0; display: flex; align-items: center; justify-content: center; font-size: 12px; cursor: pointer; }
  .mp-tutorial .mp-cred-value { font-family: 'JetBrains Mono', monospace; font-size: 11.5px; color: #1a1a1a; background: #fff; border: 1px solid #d8d8d8; border-radius: 5px; padding: 8px 11px; margin-top: 9px; word-break: break-all; }
  .mp-tutorial .mp-cred-value .blur { filter: blur(3.5px); user-select: none; }
  .mp-tutorial .mp-pill-prod { display: inline-block; background: #00a650; color: #fff; font-size: 9px; font-weight: 700; padding: 2px 8px; border-radius: 99px; letter-spacing: .04em; text-transform: uppercase; margin-right: 6px; }
  .mp-tutorial .mp-tabs { display: flex; border-bottom: 1px solid #e0e0e0; margin-bottom: 16px; }
  .mp-tutorial .mp-tab { padding: 9px 14px; font-size: 12.5px; color: #777; border-bottom: 2px solid transparent; }
  .mp-tutorial .mp-tab.active { color: var(--mp-blue); border-bottom-color: var(--mp-blue); font-weight: 600; }

  .mp-tutorial .mp-modal-overlay { background: rgba(0,0,0,.5); padding: 28px 18px; }
  .mp-tutorial .mp-modal { background: #fff; border-radius: 10px; max-width: 460px; margin: 0 auto; overflow: hidden; }
  .mp-tutorial .mp-modal-head { padding: 16px 18px 11px; border-bottom: 1px solid #f0f0f0; }
  .mp-tutorial .mp-modal-h { font-size: 16px; font-weight: 700; color: #1a1a1a; }
  .mp-tutorial .mp-modal-body { padding: 18px; }
  .mp-tutorial .mp-warn { background: #fff8e0; border: 1px solid #f5d97a; border-radius: 6px; padding: 11px; font-size: 12px; color: #6a4a00; display: flex; gap: 9px; margin-bottom: 14px; }
  .mp-tutorial .mp-warn-icon { flex-shrink: 0; width: 18px; height: 18px; border-radius: 50%; background: #f59e0b; color: #fff; font-weight: 700; font-size: 12px; display: flex; align-items: center; justify-content: center; }

  .mp-tutorial .tip { background: rgba(212,168,67,.05); border-left: 3px solid var(--gold); border-radius: 0 7px 7px 0; padding: 12px 16px; margin: 14px 0; font-size: 13px; color: var(--text); }
  .mp-tutorial .tip strong { color: var(--gold); }
  .mp-tutorial .danger { background: rgba(239,68,68,.05); border-left: 3px solid #ef4444; color: var(--text); padding: 12px 16px; margin: 14px 0; font-size: 13px; border-radius: 0 7px 7px 0; }
  .mp-tutorial .danger strong { color: #ff7373; }

  .mp-tutorial .summary { background: linear-gradient(180deg, var(--surf) 0%, rgba(212,168,67,.05) 100%); border: 1px solid rgba(212,168,67,.3); border-radius: 18px; padding: 30px 26px; margin-top: 36px; }
  .mp-tutorial .summary h2 { font-size: 20px; font-weight: 800; margin-bottom: 6px; color: var(--text); }
  .mp-tutorial .summary h2 .accent { color: var(--gold); }
  .mp-tutorial .summary > p { font-size: 13px; color: var(--muted); margin-bottom: 18px; }
  .mp-tutorial .summary-grid { display: grid; gap: 10px; }
  .mp-tutorial .summary-item { background: var(--surf2); border: 1px solid var(--border2); border-radius: 9px; padding: 13px 15px; display: flex; align-items: flex-start; gap: 12px; }
  .mp-tutorial .summary-check { flex-shrink: 0; width: 22px; height: 22px; border-radius: 50%; background: var(--gold); color: var(--bg); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; margin-top: 1px; }
  .mp-tutorial .summary-item-title { font-size: 13px; font-weight: 700; color: var(--text); margin-bottom: 2px; font-family: 'JetBrains Mono', monospace; }
  .mp-tutorial .summary-item-desc { font-size: 12px; color: var(--muted); }

  @media (max-width: 600px) {
    .mp-tutorial .step-card { padding: 22px 18px; }
    .mp-tutorial .step-head { flex-direction: column; gap: 14px; }
    .mp-tutorial .mp-app-layout { grid-template-columns: 1fr; }
    .mp-tutorial .mp-sidebar { display: none; }
    .mp-tutorial .mp-body { padding: 16px; }
    .mp-tutorial .mp-content { padding: 16px; }
  }
</style>

<div class="mp-tutorial">
  <div class="container">
    <header class="head">
      <div class="chip">Tutorial paso a paso</div>
      <h1>Cómo conseguir tus credenciales de <span class="accent">Mercado Pago</span></h1>
      <p>Necesitás 2 datos del panel de Mercado Pago para conectar tu cuenta a Innovate.ia: el Access Token y el Webhook Secret. Vos mismo los cargás en tu panel — nunca los compartas con nadie.</p>
      <div class="meta">
        <span>⏱ <strong>5–10 minutos</strong></span>
        <span>💵 <strong>Gratis</strong></span>
        <span>🔒 <strong>Tus datos, en tu panel</strong></span>
      </div>
    </header>

    <article class="step-card">
      <div class="step-head">
        <div class="step-num">1</div>
        <div class="step-meta">
          <div class="step-tag">Acceso al panel</div>
          <h2 class="step-title">Entrá al panel de developers de Mercado Pago</h2>
        </div>
      </div>
      <div class="step-body">
        <p>Abrí esta dirección con la cuenta de Mercado Pago que vas a usar para cobrar:</p>
        <p><a href="https://www.mercadopago.com.ar/developers/panel/app" target="_blank" rel="noopener noreferrer">https://www.mercadopago.com.ar/developers/panel/app</a></p>
        <p>Si te pide login, usá tu <strong>email y contraseña habituales</strong>. No necesitás crear cuenta nueva ni cambiar a "cuenta de empresa".</p>

        <div class="mockup">
          <div class="browser-bar">
            <div class="browser-dots"><span></span><span></span><span></span></div>
            <div class="browser-url">www.mercadopago.com.ar/developers/panel/app</div>
          </div>
          <div class="mp-topbar">
            <div class="mp-logo"><div class="mp-logo-icon"></div><span>Mercado Pago Developers</span></div>
            <div class="mp-user"><span>Hola, Juan</span><div class="mp-avatar">J</div></div>
          </div>
          <div class="mp-body" style="background: #f7f7f9;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; flex-wrap: wrap; gap: 12px;">
              <div>
                <div class="mp-h1">Tus aplicaciones</div>
                <div class="mp-sub">Creá una aplicación para empezar a integrar.</div>
              </div>
              <button class="mp-btn">+ Crear aplicación</button>
            </div>
            <div style="background: #fff; border: 1px dashed #d0d0d0; border-radius: 9px; padding: 32px; text-align: center; color: #999; font-size: 13px;">
              Todavía no tenés ninguna aplicación creada
            </div>
          </div>
        </div>

        <div class="tip"><strong>Atajo:</strong> hacé click en el botón <code>+ Crear aplicación</code> arriba a la derecha del panel.</div>
      </div>
    </article>

    <article class="step-card">
      <div class="step-head">
        <div class="step-num">2</div>
        <div class="step-meta">
          <div class="step-tag">Configuración inicial</div>
          <h2 class="step-title">Completá el formulario de creación</h2>
        </div>
      </div>
      <div class="step-body">
        <p>Vas a ver un formulario con varios campos. <strong>Completá exactamente así:</strong></p>

        <div class="mockup">
          <div class="browser-bar">
            <div class="browser-dots"><span></span><span></span><span></span></div>
            <div class="browser-url">www.mercadopago.com.ar/developers/panel/app/create</div>
          </div>
          <div class="mp-body">
            <div class="mp-breadcrumb">Tus aplicaciones &nbsp;›&nbsp; <span>Crear aplicación</span></div>
            <div class="mp-h1">Crear aplicación</div>
            <div class="mp-sub">Completá los datos para empezar a integrar Mercado Pago.</div>

            <div class="mp-form">
              <div class="mp-field">
                <label class="mp-label">Nombre de la aplicación <span class="req">*</span></label>
                <input class="mp-input filled-good" value="Cobros Mi Negocio" readonly />
                <div class="mp-help">Este nombre es interno, solo lo ves vos.</div>
              </div>

              <div class="mp-field">
                <label class="mp-label">¿Qué producto vas a integrar? <span class="req">*</span></label>
                <div class="mp-radio-group">
                  <div class="mp-radio selected">
                    <div class="mp-radio-dot"></div>
                    <div class="mp-radio-text">
                      <div class="mp-radio-title">Checkout Pro</div>
                      <div class="mp-radio-desc">Integración rápida con la pasarela de Mercado Pago.</div>
                    </div>
                  </div>
                  <div class="mp-radio">
                    <div class="mp-radio-dot"></div>
                    <div class="mp-radio-text">
                      <div class="mp-radio-title">Checkout API</div>
                      <div class="mp-radio-desc">Integración avanzada con tu propio formulario.</div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="mp-field">
                <label class="mp-label">Modelo de integración <span class="req">*</span></label>
                <div class="mp-select filled">Pagos online</div>
              </div>

              <div class="mp-field">
                <label class="mp-label">¿Qué solución de pagos vas a integrar? <span class="req">*</span></label>
                <div class="mp-select filled">Pagos a través de la pasarela del producto</div>
              </div>

              <div class="mp-field">
                <label class="mp-label">Categoría del producto <span class="req">*</span></label>
                <div class="mp-select filled">Servicios digitales</div>
                <div class="mp-help" style="color: #d40000;">⚠ No elijas categorías de "juegos de azar" ni "apuestas"</div>
              </div>

              <div class="mp-field">
                <label class="mp-label">Sitio web (opcional)</label>
                <input class="mp-input filled" value="https://mi-negocio.com" readonly />
              </div>

              <div style="display: flex; gap: 10px; margin-top: 10px;">
                <button class="mp-btn mp-btn-secondary">Cancelar</button>
                <button class="mp-btn">Crear aplicación</button>
              </div>
            </div>
          </div>
        </div>

        <div class="danger"><strong>Importante:</strong> en "Categoría del producto" elegí algo neutro como <code>Servicios digitales</code>, <code>Software</code> o <code>Productos digitales</code>. Nunca pongas categorías relacionadas con juegos de azar.</div>
      </div>
    </article>

    <article class="step-card">
      <div class="step-head">
        <div class="step-num">3</div>
        <div class="step-meta">
          <div class="step-tag">Credenciales de cobro</div>
          <h2 class="step-title">Copiá el Access Token de producción</h2>
        </div>
      </div>
      <div class="step-body">
        <p>Después de crear la aplicación, MP te lleva al detalle. En el menú izquierdo hacé click en <code>Credenciales de producción</code>.</p>
        <p><strong>La primera vez</strong> MP te puede pedir un código por SMS al teléfono de tu cuenta para activarlas. Es un control anti-fraude estándar.</p>

        <div class="mockup">
          <div class="browser-bar">
            <div class="browser-dots"><span></span><span></span><span></span></div>
            <div class="browser-url">www.mercadopago.com.ar/developers/panel/app/123456789</div>
          </div>
          <div class="mp-app-layout">
            <aside class="mp-sidebar">
              <div class="mp-sidebar-title">Tu aplicación</div>
              <div class="mp-nav-item">📋 Detalles</div>
              <div class="mp-nav-item active">🔑 Credenciales de producción</div>
              <div class="mp-nav-item">🧪 Credenciales de prueba</div>
              <div class="mp-nav-item">🔔 Notificaciones</div>
              <div class="mp-nav-item">🔐 OAuth</div>
              <div class="mp-nav-item">📊 Reportes</div>
            </aside>
            <main class="mp-content">
              <div class="mp-h1" style="font-size: 17px;"><span class="mp-pill-prod">Producción</span>Credenciales</div>
              <div class="mp-sub">Usá estas credenciales para procesar pagos reales.</div>

              <div class="mp-cred-card">
                <div class="mp-cred-row">
                  <div class="mp-cred-label">Access Token</div>
                  <div class="mp-cred-actions"><button class="mp-icon-btn">👁</button><button class="mp-icon-btn">📋</button></div>
                </div>
                <div class="mp-cred-value">APP_USR-1234567890123456-101010-<span class="blur">abcdef1234567890fedcba</span>-987654321</div>
              </div>
            </main>
          </div>
        </div>

        <div class="tip"><strong>Lo que tenés que copiar:</strong> el valor que empieza con <code>APP_USR-...</code> y mide ~80 caracteres. Es el Access Token de producción.</div>

        <div class="danger"><strong>Cuidado:</strong> el Access Token nunca se comparte. Es como una contraseña de tu cuenta. Si lo expones públicamente, un tercero puede crear cobros desde tu cuenta. Si pasa, regenerá inmediatamente desde el mismo panel.</div>
      </div>
    </article>

    <article class="step-card">
      <div class="step-head">
        <div class="step-num">4</div>
        <div class="step-meta">
          <div class="step-tag">Webhook</div>
          <h2 class="step-title">Configurá las notificaciones y obtené el Secret</h2>
        </div>
      </div>
      <div class="step-body">
        <p>En el menú lateral izquierdo, click en <code>Notificaciones</code>. Vas a ver un formulario donde tenés que pegar la <strong>URL de notificación</strong> que te pasamos desde Innovate.ia.</p>

        <div class="mockup">
          <div class="browser-bar">
            <div class="browser-dots"><span></span><span></span><span></span></div>
            <div class="browser-url">www.mercadopago.com.ar/developers/panel/app/123456789/webhooks</div>
          </div>
          <div class="mp-app-layout">
            <aside class="mp-sidebar">
              <div class="mp-sidebar-title">Tu aplicación</div>
              <div class="mp-nav-item">📋 Detalles</div>
              <div class="mp-nav-item">🔑 Credenciales de producción</div>
              <div class="mp-nav-item">🧪 Credenciales de prueba</div>
              <div class="mp-nav-item active">🔔 Notificaciones</div>
              <div class="mp-nav-item">🔐 OAuth</div>
              <div class="mp-nav-item">📊 Reportes</div>
            </aside>
            <main class="mp-content">
              <div class="mp-h1" style="font-size: 17px;">Notificaciones</div>
              <div class="mp-sub">Configurá dónde queremos avisarte cuando ocurre un pago.</div>

              <div class="mp-tabs">
                <div class="mp-tab active">Webhooks</div>
                <div class="mp-tab">IPN (legacy)</div>
              </div>

              <div class="mp-form">
                <div class="mp-field">
                  <label class="mp-label">URL de producción <span class="req">*</span></label>
                  <input class="mp-input filled-good" value="https://dvzxkortcvuakjhsidrr.supabase.co/functions/v1/mp-confirm" readonly />
                  <div class="mp-help">📋 Esta URL la copiás directo desde tu panel de Innovate.ia (Configuración → Billetera Virtual). Es la misma para todos.</div>
                </div>

                <div class="mp-field">
                  <label class="mp-label">URL de prueba (opcional)</label>
                  <input class="mp-input placeholder" value="https://..." readonly />
                </div>

                <div class="mp-field">
                  <label class="mp-label">Eventos <span class="req">*</span></label>
                  <div style="display: flex; flex-direction: column; gap: 4px;">
                    <label style="font-size: 13px; display: flex; align-items: center; gap: 8px; padding: 6px 0;">
                      <span style="display: inline-block; width: 16px; height: 16px; border: 2px solid var(--mp-blue); background: var(--mp-blue); border-radius: 3px; position: relative;"><span style="position: absolute; top: -2px; left: 2px; color: #fff; font-size: 12px;">✓</span></span>
                      Pagos
                    </label>
                    <label style="font-size: 13px; display: flex; align-items: center; gap: 8px; padding: 6px 0; color: #888;">
                      <span style="display: inline-block; width: 16px; height: 16px; border: 2px solid #ccc; border-radius: 3px;"></span>
                      Pagos por suscripción
                    </label>
                    <label style="font-size: 13px; display: flex; align-items: center; gap: 8px; padding: 6px 0; color: #888;">
                      <span style="display: inline-block; width: 16px; height: 16px; border: 2px solid #ccc; border-radius: 3px;"></span>
                      Reclamos
                    </label>
                  </div>
                </div>

                <div style="margin-top: 10px;"><button class="mp-btn">Guardar configuración</button></div>
              </div>
            </main>
          </div>
        </div>

        <p style="margin-top: 14px;">Cuando le des a <strong>Guardar</strong>, MP te muestra un <strong>secret único</strong> en una ventana emergente. <strong>Copialo en ese momento</strong> — no se vuelve a mostrar nunca.</p>

        <div class="mockup">
          <div class="mp-modal-overlay">
            <div class="mp-modal">
              <div class="mp-modal-head"><div class="mp-modal-h">Tu clave secreta de webhook</div></div>
              <div class="mp-modal-body">
                <div class="mp-warn">
                  <div class="mp-warn-icon">!</div>
                  <div><strong>Importante:</strong> esta es la única vez que vas a ver este secret. Copialo y guardalo en un lugar seguro antes de cerrar esta ventana.</div>
                </div>
                <label class="mp-label" style="display: block; margin-bottom: 6px;">Clave secreta</label>
                <div class="mp-cred-value" style="background: #f7f7f9;">ef9c2a8b5d4f1e3c7a6b9d8e2f4c1a5b7d9e3c6f1a4b7d2e5c8f1a4b7d</div>
                <div style="display: flex; gap: 8px; margin-top: 16px;">
                  <button class="mp-btn mp-btn-secondary" style="flex: 1;">📋 Copiar</button>
                  <button class="mp-btn">Listo</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="danger"><strong>Si te perdiste el secret:</strong> en el mismo panel de Notificaciones tenés un botón "Regenerar secret". Pero ojo — al regenerarlo, el viejo deja de funcionar al toque, así que si ya estaba conectado a un webhook activo, hay que actualizarlo en ambos lados al mismo tiempo.</div>
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
          <strong>⚠ NUNCA COMPARTAS ESTOS DATOS CON NADIE.</strong> Ni con nosotros, ni con soporte, ni con un asesor, ni por mail, WhatsApp, Telegram o cualquier canal. Tu Access Token es equivalente a la contraseña de tu cuenta de Mercado Pago — quien lo tenga puede generar cobros y operar a tu nombre. Innovate.ia <strong>nunca</strong> te va a pedir que se los envíes.
        </div>

        <p>Las credenciales se cargan vos mismo, directamente en tu panel. Andá a <code>Configuración → Billetera Virtual</code> y pegá los 2 valores en los campos correspondientes:</p>

        <div class="mockup">
          <div class="browser-bar">
            <div class="browser-dots"><span></span><span></span><span></span></div>
            <div class="browser-url">app.innovate-ia.com/config</div>
          </div>
          <div style="background: #080B12; padding: 24px 22px; color: #E9E7E0;">
            <div style="font-family: 'DM Sans', sans-serif; margin-bottom: 18px;">
              <p style="font-size: 11px; font-family: 'JetBrains Mono', monospace; color: #4E5168; text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 4px;">Cobros · opcional</p>
              <h4 style="font-size: 16px; font-weight: 700; color: #E9E7E0; margin: 0;">💳 Billetera Virtual</h4>
            </div>

            <div style="margin-bottom: 14px;">
              <p style="font-size: 11px; font-family: 'JetBrains Mono', monospace; color: #D4A843; text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 6px; font-weight: 600;">Access Token de la billetera</p>
              <div style="background: #111420; border: 1px solid #1e2130; border-radius: 8px; padding: 9px 12px; display: flex; align-items: center; gap: 8px;">
                <input style="flex: 1; background: transparent; border: 0; color: #E9E7E0; font-size: 13px; font-family: 'JetBrains Mono', monospace; outline: none;" value="APP_USR-1234567890123456-101010-abcdef..." readonly />
                <span style="background: rgba(34,197,94,0.15); border: 1px solid rgba(34,197,94,0.3); color: #22c55e; font-size: 10px; font-weight: 700; padding: 3px 9px; border-radius: 99px; letter-spacing: 0.04em; text-transform: uppercase;">Configurado</span>
              </div>
              <p style="font-size: 11px; color: #4E5168; margin: 5px 0 0;">Access Token de producción de tu cuenta Mercado Pago. Se cifra al guardarse.</p>
            </div>

            <div style="margin-bottom: 14px;">
              <p style="font-size: 11px; font-family: 'JetBrains Mono', monospace; color: #D4A843; text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 6px; font-weight: 600;">Webhook Secret de Mercado Pago</p>
              <div style="background: #111420; border: 1px solid #1e2130; border-radius: 8px; padding: 9px 12px; display: flex; align-items: center; gap: 8px;">
                <input style="flex: 1; background: transparent; border: 0; color: #E9E7E0; font-size: 13px; font-family: 'JetBrains Mono', monospace; outline: none;" value="ef9c2a8b5d4f1e3c7a6b9d8e2f4c1a5b..." readonly />
                <span style="background: rgba(34,197,94,0.15); border: 1px solid rgba(34,197,94,0.3); color: #22c55e; font-size: 10px; font-weight: 700; padding: 3px 9px; border-radius: 99px; letter-spacing: 0.04em; text-transform: uppercase;">Configurado</span>
              </div>
              <p style="font-size: 11px; color: #4E5168; margin: 5px 0 0;">Se usa para validar las notificaciones de MP. Lo generás una sola vez en el panel de MP. Se cifra al guardarse.</p>
            </div>

            <div>
              <p style="font-size: 11px; font-family: 'JetBrains Mono', monospace; color: #4E5168; text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 6px; font-weight: 600;">🔗 URL para configurar en Mercado Pago</p>
              <div style="background: #111420; border: 1px solid #1e2130; border-radius: 8px; padding: 9px 12px; display: flex; align-items: center; justify-content: space-between; gap: 10px;">
                <code style="font-size: 12px; font-family: 'JetBrains Mono', monospace; color: #D4A843; word-break: break-all;">https://dvzxkortcvuakjhsidrr.supabase.co/functions/v1/mp-confirm</code>
                <button style="background: transparent; border: 1px solid #1e2130; color: #E9E7E0; font-size: 11px; padding: 4px 10px; border-radius: 6px;">Copiar</button>
              </div>
            </div>

            <button style="margin-top: 18px; background: #D4A843; color: #080B12; padding: 10px 20px; border-radius: 8px; border: 0; font-size: 13px; font-weight: 700; cursor: pointer;">Guardar configuración</button>
          </div>
        </div>

        <div class="tip">
          <strong>✅ Listo.</strong> Cuando guardes, el token y el secret se cifran automáticamente con AES-256 antes de tocar la base de datos. La EF que recibe los webhooks de MP los desencripta solo en memoria al momento de validar cada pago entrante — nunca quedan en logs ni se exponen al frontend.
        </div>
      </div>
    </article>

    <article class="step-card">
      <div class="step-head">
        <div class="step-num" style="background: #ef4444;">!</div>
        <div class="step-meta">
          <div class="step-tag" style="color: #ef4444;">Seguridad y privacidad</div>
          <h2 class="step-title">Cómo protegemos tus credenciales</h2>
        </div>
      </div>
      <div class="step-body">
        <p style="font-size: 14px;">Tus credenciales son secretos críticos. Esto es exactamente lo que pasa con ellas:</p>

        <div style="display: flex; flex-direction: column; gap: 10px; margin: 18px 0;">
          <div style="background: rgba(34,197,94,0.05); border: 1px solid rgba(34,197,94,0.2); border-radius: 9px; padding: 13px 16px; display: flex; gap: 12px; align-items: flex-start;">
            <div style="flex-shrink: 0; width: 22px; height: 22px; border-radius: 50%; background: #22c55e; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px;">✓</div>
            <div>
              <p style="font-size: 13px; font-weight: 700; color: #E8E4D9; margin: 0 0 3px;">Cifradas en reposo</p>
              <p style="font-size: 12px; color: var(--muted); margin: 0;">Se encriptan con <code>encrypt_token()</code> (AES-256-GCM con clave en KMS) antes de escribirse en la base. La columna en disco contiene solo el ciphertext.</p>
            </div>
          </div>

          <div style="background: rgba(34,197,94,0.05); border: 1px solid rgba(34,197,94,0.2); border-radius: 9px; padding: 13px 16px; display: flex; gap: 12px; align-items: flex-start;">
            <div style="flex-shrink: 0; width: 22px; height: 22px; border-radius: 50%; background: #22c55e; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px;">✓</div>
            <div>
              <p style="font-size: 13px; font-weight: 700; color: #E8E4D9; margin: 0 0 3px;">Aisladas por tenant (RLS)</p>
              <p style="font-size: 12px; color: var(--muted); margin: 0;">Row-Level Security a nivel Postgres garantiza que solo tu cuenta puede tocar tus secrets. Otros tenants en la misma plataforma no pueden consultarlos ni con SQL directo.</p>
            </div>
          </div>

          <div style="background: rgba(34,197,94,0.05); border: 1px solid rgba(34,197,94,0.2); border-radius: 9px; padding: 13px 16px; display: flex; gap: 12px; align-items: flex-start;">
            <div style="flex-shrink: 0; width: 22px; height: 22px; border-radius: 50%; background: #22c55e; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px;">✓</div>
            <div>
              <p style="font-size: 13px; font-weight: 700; color: #E8E4D9; margin: 0 0 3px;">Nunca vuelven al frontend</p>
              <p style="font-size: 12px; color: var(--muted); margin: 0;">Una vez cargadas, los campos de tu panel solo muestran el badge "Configurado" — el valor real nunca se devuelve al navegador. Para cambiarlo tenés que pegarlo de nuevo (lo que también pisa el viejo).</p>
            </div>
          </div>

          <div style="background: rgba(34,197,94,0.05); border: 1px solid rgba(34,197,94,0.2); border-radius: 9px; padding: 13px 16px; display: flex; gap: 12px; align-items: flex-start;">
            <div style="flex-shrink: 0; width: 22px; height: 22px; border-radius: 50%; background: #22c55e; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px;">✓</div>
            <div>
              <p style="font-size: 13px; font-weight: 700; color: #E8E4D9; margin: 0 0 3px;">Solo se desencriptan al cobrar</p>
              <p style="font-size: 12px; color: var(--muted); margin: 0;">La función que procesa pagos (mp-confirm) las descifra en memoria solo durante el milisegundo que dura cada cobro. No quedan en logs, no se persisten en archivos, no se exponen a APIs externas.</p>
            </div>
          </div>
        </div>

        <div class="danger">
          <strong>⚠ Si sospechás que tu Access Token se filtró:</strong>
          <ol style="margin: 8px 0 0 18px; padding: 0; font-size: 13px; line-height: 1.7;">
            <li>Andá a tu panel de MP → Tu aplicación → Credenciales de producción</li>
            <li>Click en <code>Regenerar Access Token</code></li>
            <li>Copiá el nuevo token y pegalo en Innovate.ia (Configuración → Billetera Virtual)</li>
            <li>El viejo token deja de funcionar al instante. Cualquier cobro que se intente con el token comprometido va a fallar.</li>
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
          <p style="margin: 10px 0 0; font-size: 13px;">Si alguien te las pide diciendo ser de Innovate.ia, es una <strong>estafa</strong>. Reportala al instante a <a href="mailto:abuse@innovate-ia.com">abuse@innovate-ia.com</a>.</p>
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
            <div class="summary-item-title">Access Token</div>
            <div class="summary-item-desc">Empieza con <code style="font-family: 'JetBrains Mono', monospace; color: var(--gold2); background: var(--surf2); padding: 1px 5px; border-radius: 3px; font-size: 11px;">APP_USR-...</code>, ~80 caracteres. <strong style="color: #ff7373;">Es secreto. No lo compartas.</strong></div>
          </div>
        </div>
        <div class="summary-item">
          <div class="summary-check">✓</div>
          <div>
            <div class="summary-item-title">Webhook Secret</div>
            <div class="summary-item-desc">Cadena hexadecimal de ~50 caracteres. Solo se muestra una vez en MP. <strong style="color: #ff7373;">Es secreto. No lo compartas.</strong></div>
          </div>
        </div>
      </div>
    </section>
  </div>
</div>
`

export default function InstruccionesMP() {
  const navigate = useNavigate()
  const location = useLocation()
  const containerRef = useRef(null)

  // 13/05/2026: el patrón viejo (isFromCliente basado en window.location)
  // solo discriminaba /cliente vs todo lo demás y rompía el retail (que
  // vive en /mi-cuenta). getInstruccionesBase() reconoce los 3 scopes.
  const backTo = getInstruccionesBase(location.pathname)

  // Cargar Google Fonts una sola vez
  useEffect(() => {
    const id = 'mp-tutorial-fonts'
    if (document.getElementById(id)) return
    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap'
    document.head.appendChild(link)
  }, [])

  return (
    <div style={{ background: C.bg, minHeight: '100vh' }}>
      {/* Header con botón volver */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: 'rgba(5,7,9,0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${C.border}`,
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
      }}>
        <button
          onClick={() => navigate(backTo)}
          style={{
            background: 'transparent',
            border: `1px solid ${C.border}`,
            color: C.text,
            padding: '8px 14px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: FONT_WEIGHT.semibold,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          ← Volver
        </button>
        <span style={{
          fontSize: 12,
          color: C.muted,
          fontFamily: 'monospace',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}>
          Instrucciones / Mercado Pago
        </span>
      </div>

      {/* Contenido HTML del tutorial */}
      <div ref={containerRef} dangerouslySetInnerHTML={{ __html: TUTORIAL_HTML }} />
    </div>
  )
}
