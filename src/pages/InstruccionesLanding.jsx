// ════════════════════════════════════════════════════════════════════
// InstruccionesLanding — Guía paso a paso del Landing Builder
//
// 17/05/2026 — v2: REESCRITA con datos reales de LandingBuilder.jsx.
// Cubre los flujos verdaderos: 5 plantillas, 2 modos (Visual + HTML),
// bloque "Esenciales" siempre visible, configuración Pixel con 4
// providers (Meta/GA/GTM/TikTok), token CAPI, asignación a sub-tenant,
// chat IA en modo HTML, tab Productos con override por landing.
//
// Audiencia: partner final de Modo Ahorro. Le importa entender el
// builder real, no marketing genérico.
// ════════════════════════════════════════════════════════════════════

import { useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import { COLORS, FONT_WEIGHT } from '../theme/tokens'
import { getInstruccionesBase } from '../lib/instruccionesScope'

const C = COLORS

const TUTORIAL_HTML = `
<style>
  .lp-tutorial {
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
    background: var(--bg);
    color: var(--text);
    font-family: 'DM Sans', sans-serif;
    line-height: 1.6;
    padding: clamp(28px, 3vw, 56px) clamp(16px, 3vw, 64px) clamp(60px, 5vw, 120px);
  }
  .lp-tutorial * { box-sizing: border-box; margin: 0; padding: 0; }
  .lp-tutorial .container { max-width: clamp(920px, 75vw, 1400px); margin: 0 auto; }
  .lp-tutorial .head { text-align: center; margin-bottom: clamp(50px, 4vw, 80px); }
  .lp-tutorial .head .chip {
    display: inline-block; padding: 6px 14px; border-radius: 99px;
    background: rgba(212,168,67,.08); border: 1px solid rgba(212,168,67,.25);
    color: var(--gold); font-size: clamp(11px, 0.7vw, 14px); font-weight: 600;
    letter-spacing: .1em; text-transform: uppercase; margin-bottom: 18px;
  }
  .lp-tutorial .head h1 {
    font-size: clamp(26px, 3vw, 52px);
    font-weight: 800; letter-spacing: -.02em; margin-bottom: 14px; color: var(--text);
  }
  .lp-tutorial .head h1 .accent { color: var(--gold); }
  .lp-tutorial .head p { font-size: clamp(15px, 1vw, 19px); color: var(--muted); max-width: clamp(580px, 50vw, 880px); margin: 0 auto; }
  .lp-tutorial .head .meta { display: inline-flex; gap: 18px; margin-top: 22px; font-size: clamp(12px, 0.85vw, 15px); color: var(--muted2); flex-wrap: wrap; justify-content: center; }
  .lp-tutorial .head .meta span { display: inline-flex; align-items: center; gap: 6px; }
  .lp-tutorial .head .meta strong { color: var(--text); font-weight: 500; }

  .lp-tutorial .step-card {
    background: var(--surf); border: 1px solid var(--border); border-radius: 18px;
    padding: clamp(28px, 2.4vw, 44px) clamp(26px, 2.2vw, 40px); margin-bottom: clamp(24px, 2vw, 36px); position: relative; overflow: hidden;
  }
  .lp-tutorial .step-card::before {
    content: ''; position: absolute; top: 0; left: 0; width: 4px; height: 100%; background: var(--gold);
  }
  .lp-tutorial .step-head { display: flex; align-items: flex-start; gap: clamp(16px, 1.4vw, 24px); margin-bottom: clamp(22px, 1.8vw, 32px); }
  .lp-tutorial .step-num {
    flex-shrink: 0; width: clamp(44px, 3.6vw, 64px); height: clamp(44px, 3.6vw, 64px); border-radius: clamp(12px, 1vw, 16px);
    background: var(--gold); color: var(--bg); font-size: clamp(19px, 1.6vw, 26px); font-weight: 800;
    display: flex; align-items: center; justify-content: center;
  }
  .lp-tutorial .step-meta { flex: 1; min-width: 0; }
  .lp-tutorial .step-tag {
    display: inline-block; font-size: clamp(10px, 0.7vw, 13px); font-weight: 700; letter-spacing: .12em;
    text-transform: uppercase; color: var(--gold); margin-bottom: 4px;
  }
  .lp-tutorial .step-title { font-size: clamp(20px, 1.8vw, 32px); font-weight: 700; letter-spacing: -.01em; line-height: 1.25; color: var(--text); }
  .lp-tutorial .step-body { font-size: clamp(14px, 1vw, 17px); color: var(--muted); line-height: 1.65; }
  .lp-tutorial .step-body p { margin-bottom: 12px; }
  .lp-tutorial .step-body strong { color: var(--text); font-weight: 600; }
  .lp-tutorial .step-body code {
    background: var(--surf2); border: 1px solid var(--border2); border-radius: 5px;
    padding: 1px 7px; font-family: 'JetBrains Mono', monospace; font-size: 12px; color: var(--gold2);
  }
  .lp-tutorial .step-body ul, .lp-tutorial .step-body ol { margin: 8px 0 14px 22px; }
  .lp-tutorial .step-body li { margin-bottom: 6px; }

  .lp-tutorial .panel-mock {
    background: #080B12; border-radius: 12px; margin: 22px 0; overflow: hidden;
    box-shadow: 0 24px 64px rgba(0,0,0,.5); color: #E9E7E0;
    border: 1px solid var(--border);
  }
  .lp-tutorial .panel-mock .pm-topbar {
    background: #0D0F1A; padding: 9px 14px; border-bottom: 1px solid var(--border);
    display: flex; align-items: center; gap: 10px;
  }
  .lp-tutorial .panel-mock .pm-dots { display: flex; gap: 5px; }
  .lp-tutorial .panel-mock .pm-dots span { width: 10px; height: 10px; border-radius: 50%; background: #2a3142; }
  .lp-tutorial .panel-mock .pm-url { flex: 1; font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--muted2); padding: 4px 10px; background: #14181F; border-radius: 5px; border: 1px solid #1a1f2e; }
  .lp-tutorial .panel-mock .pm-body { padding: 22px; }

  .lp-tutorial .tpl-grid {
    display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 10px; margin-top: 8px;
  }
  .lp-tutorial .tpl {
    background: #0D0F1A; border: 1px solid var(--border); border-radius: 10px;
    padding: 12px 14px;
  }
  .lp-tutorial .tpl .tpl-ico { font-size: 22px; margin-bottom: 6px; }
  .lp-tutorial .tpl .tpl-name { font-size: 13px; font-weight: 700; color: #E9E7E0; margin-bottom: 3px; }
  .lp-tutorial .tpl .tpl-desc { font-size: 10px; color: var(--muted); line-height: 1.4; }
  .lp-tutorial .tpl.casino { border-top: 2px solid #D4A843; }
  .lp-tutorial .tpl.tienda { border-top: 2px solid #3b82f6; }
  .lp-tutorial .tpl.mk { border-top: 2px solid #a78bfa; }
  .lp-tutorial .tpl.pro { border-top: 2px solid #ec4899; }
  .lp-tutorial .tpl.curso { border-top: 2px solid #818cf8; }

  .lp-tutorial .toggle {
    display: inline-flex; padding: 3px; border-radius: 7px;
    background: #0D0F1A; border: 1px solid var(--border); gap: 2px;
    margin-bottom: 14px;
  }
  .lp-tutorial .toggle .opt {
    padding: 6px 12px; border-radius: 5px;
    font-size: 11px; color: var(--muted); font-family: 'JetBrains Mono', monospace;
  }
  .lp-tutorial .toggle .opt.active { background: var(--surf); color: var(--text); font-weight: 700; }

  .lp-tutorial .tabs-bar {
    display: flex; gap: 4px; border-bottom: 1px solid var(--border);
    margin: 14px 0 0; flex-wrap: wrap;
  }
  .lp-tutorial .tab {
    padding: 8px 12px; font-size: 11px; color: var(--muted);
    border-bottom: 2px solid transparent;
  }
  .lp-tutorial .tab.active { color: var(--gold); border-bottom-color: var(--gold); font-weight: 700; }

  .lp-tutorial .field-block {
    background: #0D0F1A; border: 1px solid var(--border); border-radius: 8px;
    padding: 10px 12px; margin-bottom: 8px;
  }
  .lp-tutorial .field-block .field-label {
    font-size: 9px; color: var(--muted); text-transform: uppercase;
    letter-spacing: 0.08em; margin-bottom: 4px;
    font-family: 'JetBrains Mono', monospace;
  }
  .lp-tutorial .field-block .field-value {
    font-size: 12px; color: var(--text); font-family: 'JetBrains Mono', monospace;
  }

  .lp-tutorial .pixel-providers {
    display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
    gap: 6px; margin: 10px 0;
  }
  .lp-tutorial .pp {
    background: #0D0F1A; border: 1px solid var(--border); border-radius: 6px;
    padding: 8px 10px; font-size: 11px; color: var(--muted);
    text-align: center;
  }
  .lp-tutorial .pp.featured { border-color: rgba(34,197,94,.4); color: #22c55e; background: rgba(34,197,94,.04); }

  .lp-tutorial .tip {
    background: rgba(212,168,67,.05); border-left: 3px solid var(--gold);
    border-radius: 0 7px 7px 0; padding: 12px 16px; margin: 14px 0;
    font-size: 13px; color: var(--text);
  }
  .lp-tutorial .tip strong { color: var(--gold); }

  .lp-tutorial .danger {
    background: rgba(239,68,68,.05); border-left: 3px solid #ef4444;
    color: var(--text); padding: 12px 16px; margin: 14px 0;
    font-size: 13px; border-radius: 0 7px 7px 0;
  }
  .lp-tutorial .danger strong { color: #ff7373; }

  .lp-tutorial .info {
    background: rgba(59,130,246,.05); border-left: 3px solid #3b82f6;
    color: var(--text); padding: 12px 16px; margin: 14px 0;
    font-size: 13px; border-radius: 0 7px 7px 0;
  }
  .lp-tutorial .info strong { color: #60a5fa; }

  .lp-tutorial .success {
    background: rgba(34,197,94,.05); border-left: 3px solid #22c55e;
    color: var(--text); padding: 12px 16px; margin: 14px 0;
    font-size: 13px; border-radius: 0 7px 7px 0;
  }
  .lp-tutorial .success strong { color: #22c55e; }

  .lp-tutorial .summary {
    background: linear-gradient(180deg, var(--surf) 0%, rgba(212,168,67,.05) 100%);
    border: 1px solid rgba(212,168,67,.3); border-radius: 18px;
    padding: 30px 26px; margin-top: 36px;
  }
  .lp-tutorial .summary h2 { font-size: 20px; font-weight: 800; margin-bottom: 6px; color: var(--text); }
  .lp-tutorial .summary h2 .accent { color: var(--gold); }
  .lp-tutorial .summary > p { font-size: 13px; color: var(--muted); margin-bottom: 18px; }
  .lp-tutorial .summary-grid { display: grid; gap: 10px; }
  .lp-tutorial .summary-item {
    background: var(--surf2); border: 1px solid var(--border2); border-radius: 9px;
    padding: 13px 15px; display: flex; align-items: flex-start; gap: 12px;
  }
  .lp-tutorial .summary-check {
    flex-shrink: 0; width: 22px; height: 22px; border-radius: 50%;
    background: var(--gold); color: var(--bg);
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: 13px; margin-top: 1px;
  }
  .lp-tutorial .summary-item-title {
    font-size: 13px; font-weight: 700; color: var(--text); margin-bottom: 2px;
    font-family: 'JetBrains Mono', monospace;
  }
  .lp-tutorial .summary-item-desc { font-size: 12px; color: var(--muted); }

  @media (max-width: 600px) {
    .lp-tutorial .step-card { padding: 22px 18px; }
    .lp-tutorial .step-head { flex-direction: column; gap: 14px; }
  }
</style>

<div class="lp-tutorial">
  <div class="container">
    <header class="head">
      <div class="chip">Tutorial</div>
      <h1>Cómo armar tu <span class="accent">Landing</span></h1>
      <p>El Landing Builder genera una página pública en <code>/l/:slug</code> que redirige al bot de WhatsApp. Tiene 5 plantillas, edición visual con 8 tabs, modo HTML con asistente IA, y trackeo Pixel + Conversions API integrado de fábrica.</p>
      <div class="meta">
        <span>📍 <strong>app.innovate-ia.com/landing-builder</strong></span>
        <span>♾ <strong>Landings ilimitadas</strong></span>
        <span>🌐 <strong>URL: /l/:slug</strong></span>
      </div>
    </header>

    <article class="step-card">
      <div class="step-head">
        <div class="step-num">1</div>
        <div class="step-meta">
          <div class="step-tag">Lo primero</div>
          <h2 class="step-title">Para qué sirve la landing</h2>
        </div>
      </div>
      <div class="step-body">
        <p>La landing es la página pública intermedia entre tu publicidad (Meta Ads, Google, TikTok, Instagram) y tu bot de WhatsApp. Sirve para 4 cosas concretas:</p>
        <ul>
          <li><strong>Profesionalizar la marca</strong> — una landing dedicada genera más confianza que un link directo de WhatsApp en un anuncio.</li>
          <li><strong>Disparar el Meta Pixel</strong> — cada visita queda registrada vía Pixel del navegador + Conversions API server-side. Sin landing, perdés esa info.</li>
          <li><strong>Pre-cargar el primer mensaje</strong> — el botón de WA abre el chat con un texto ya escrito ("¡Hola! Quiero crear mi cuenta") que el bot reconoce y usa para clasificar de dónde vino el lead.</li>
          <li><strong>Mostrar productos o información del negocio</strong> — features, precios, FAQs, testimonios, catálogo de productos. Cosas que en WhatsApp no se ven cómodas.</li>
        </ul>

        <p>Desde el 26/04/2026 las landings son <strong>ilimitadas</strong> y no consumen créditos al publicar. Podés tener una landing por campaña, por sub-tenant, por audiencia segmentada — todas en paralelo.</p>
      </div>
    </article>

    <article class="step-card">
      <div class="step-head">
        <div class="step-num">2</div>
        <div class="step-meta">
          <div class="step-tag">Crear una landing</div>
          <h2 class="step-title">5 plantillas según el rubro</h2>
        </div>
      </div>
      <div class="step-body">
        <p>Cuando entrás a <code>/landing-builder</code> y clickeás <strong>+ Nueva landing</strong>, te aparece el selector de plantillas. Cada una viene con colores, hero, features y CTAs pre-configurados para ese rubro:</p>

        <div class="tpl-grid">
          <div class="tpl casino">
            <div class="tpl-ico">🎰</div>
            <div class="tpl-name">Casino / Apuestas</div>
            <div class="tpl-desc">Casino online, apuestas, tragamonedas</div>
          </div>
          <div class="tpl tienda">
            <div class="tpl-ico">🛒</div>
            <div class="tpl-name">Tienda / E-commerce</div>
            <div class="tpl-desc">Productos físicos con envío</div>
          </div>
          <div class="tpl mk">
            <div class="tpl-ico">📣</div>
            <div class="tpl-name">Marketing / Captación</div>
            <div class="tpl-desc">Inmobiliarias, agencias, B2B premium</div>
          </div>
          <div class="tpl pro">
            <div class="tpl-ico">👔</div>
            <div class="tpl-name">Profesional / Servicios</div>
            <div class="tpl-desc">Médicos, abogados, contadores</div>
          </div>
          <div class="tpl curso">
            <div class="tpl-ico">🎓</div>
            <div class="tpl-name">Curso / Mentoría</div>
            <div class="tpl-desc">Educación, coaching, consultoría</div>
          </div>
        </div>

        <p style="margin-top: 14px;">El campo interno se llama <code>template_type</code>. Es independiente del <code>identity</code> de tu negocio — un partner con identidad "casino" puede tener una landing con plantilla "curso" si lanza un programa de capacitación.</p>

        <p>Como alternativa al selector, podés clickear <strong>✨ Diseñar con IA</strong>. Describís tu negocio en lenguaje natural (nombre, rubro, propuesta, colores, audiencia) y el sistema genera la primera versión de la landing usando Claude. Después la editás como cualquier otra.</p>

        <div class="tip"><strong>📌 Asignar a sub-tenant:</strong> si la landing va a usarla un cliente tuyo (sub-tenant), seteá el campo "Cliente asignado" en el bloque Esenciales. Con eso, el Pixel y el Token de Meta usados son los del sub-tenant, no los tuyos. Esto es clave si tus clientes tienen sus propias cuentas de Meta Ads.</div>
      </div>
    </article>

    <article class="step-card">
      <div class="step-head">
        <div class="step-num">3</div>
        <div class="step-meta">
          <div class="step-tag">El editor</div>
          <h2 class="step-title">2 modos: Visual y HTML</h2>
        </div>
      </div>
      <div class="step-body">
        <p>Cuando entrás a editar una landing, en la barra de acciones tenés un toggle entre dos modos:</p>

        <div class="toggle">
          <span class="opt active">🎨 Visual</span>
          <span class="opt">&lt;/&gt; HTML</span>
        </div>

        <p><strong>Modo Visual</strong> — editás con formularios. 8 tabs verticales, cada uno con sus campos. Ideal para el 95% de los casos.</p>

        <p><strong>Modo HTML</strong> — editás el código HTML directo. Para cuando querés algo muy específico que el editor visual no expone (animación custom, integración de terceros, embed de YouTube/Vimeo, etc).</p>

        <p>En modo HTML hay un <strong>botón flotante ✨ IA</strong> abajo a la derecha. Si lo abrís, te aparece un chat lateral donde le pedís cambios en lenguaje natural ("cambiá el color principal a azul", "agregá una sección de precios", "hacé el título más grande") y el modelo modifica el HTML en vivo.</p>

        <div class="info"><strong>🔄 Podés alternar entre modos:</strong> si arrancás visual y querés ajustar algo a mano, pasás a HTML, lo cambiás, y el preview se actualiza al instante. Pero si después volvés a Visual, los cambios manuales del HTML quedan congelados (la landing pública usa el HTML custom que ingresaste, no el visual).</div>
      </div>
    </article>

    <article class="step-card">
      <div class="step-head">
        <div class="step-num">4</div>
        <div class="step-meta">
          <div class="step-tag">Bloque "Esenciales"</div>
          <h2 class="step-title">Los 4 campos que SIEMPRE tenés que llenar</h2>
        </div>
      </div>
      <div class="step-body">
        <p>Arriba del editor (visible en ambos modos) hay un bloque destacado llamado <strong>⭐ Esenciales</strong>. Son los datos mínimos para que la landing funcione:</p>

        <div class="field-block">
          <div class="field-label">Slug *</div>
          <div class="field-value">mi-casino-pro</div>
        </div>
        <div class="field-block">
          <div class="field-label">Nombre del negocio *</div>
          <div class="field-value">Mi Casino Pro</div>
        </div>
        <div class="field-block">
          <div class="field-label">📱 Número de WhatsApp</div>
          <div class="field-value">5491112345678</div>
        </div>
        <div class="field-block">
          <div class="field-label">💬 Mensaje pre-cargado</div>
          <div class="field-value">¡Hola! Quiero crear mi cuenta</div>
        </div>

        <ul style="margin-top: 14px;">
          <li><strong>Slug</strong>: la palabra que va después de <code>/l/</code> en la URL pública. Sin tildes, sin espacios, solo letras/números/guión/punto. La URL pública queda <code>https://chat.innovate-ia.com/l/{tu-slug}</code>.</li>
          <li><strong>Nombre del negocio</strong>: lo que aparece como brand en la landing. Reemplaza la variable <code>{casino_name}</code> en el hero, el título y los CTAs.</li>
          <li><strong>Número WhatsApp</strong>: sin <code>+</code> ni espacios, formato internacional. Es el destino del CTA "Contactar".</li>
          <li><strong>Mensaje pre-cargado</strong>: lo que se autocompleta cuando el visitante toca el botón de WA. Es la primera línea del chat — usalo para identificar de dónde viene el lead.</li>
        </ul>

        <div class="tip"><strong>💡 Tip para múltiples landings:</strong> si tenés varias landings apuntando al mismo WhatsApp, hacé que cada una mande un mensaje distinto ("Hola, vengo de la landing del bono 100%", "Hola, vi el video de TikTok"). Te ayuda a medir qué fuente convierte mejor.</div>
      </div>
    </article>

    <article class="step-card">
      <div class="step-head">
        <div class="step-num">5</div>
        <div class="step-meta">
          <div class="step-tag">Pixel + CAPI</div>
          <h2 class="step-title">Tracking de Meta es feature central</h2>
        </div>
      </div>
      <div class="step-body">
        <p>El bloque <strong>📊 Pixel</strong> también está siempre visible debajo de "Esenciales". No es opcional — es central porque <strong>sin el token de Conversions API, las ventas que el bot procese no se reportan a Meta Ads</strong>.</p>

        <p>Soporta 4 proveedores de tracking:</p>

        <div class="pixel-providers">
          <div class="pp featured">Meta (Facebook)</div>
          <div class="pp">Google Analytics</div>
          <div class="pp">Google Tag Manager</div>
          <div class="pp">TikTok</div>
        </div>

        <p>Para Meta (el más usado), tenés 3 campos:</p>
        <ol>
          <li><strong>Pixel ID</strong> — ~15 dígitos numéricos. Lo encontrás en Events Manager → tu dataset.</li>
          <li><strong>Access Token CAPI</strong> 🔑 — token de Conversions API server-side. Lo generás en Events Manager → Configuración → "Configurar con Dataset Quality API". <strong>Sin este token, las ventas del bot NO se reportan</strong>. Se guarda cifrado en <code>tenant_secrets</code> (o <code>sub_tenant_secrets</code> si la landing tiene cliente asignado).</li>
          <li><strong>Test Event Code</strong> (opcional) — para validar la integración antes de salir a producción. Cuando lo seteás, los eventos llegan al panel "Probar eventos" de Meta en vez de a producción.</li>
        </ol>

        <p>Una vez configurado, la landing dispara estos eventos:</p>
        <ul>
          <li><code>PageView</code> al cargar la página (Pixel + CAPI).</li>
          <li><code>Lead</code> cuando alguien toca el CTA de WhatsApp.</li>
          <li><code>Purchase</code> cuando el bot procesa el cobro (server-side desde <code>mp-confirm-addon</code>). Por eso necesitás el token: este evento NO sale del navegador, sale de nuestro backend.</li>
        </ul>

        <div class="info"><strong>📌 Owner-only edit:</strong> el primer usuario que carga el Pixel/Token queda como dueño del registro. Si otro usuario del mismo tenant entra a editarlo, ve un candado con el mensaje <em>"Pixel configurado por &lt;email&gt;. Solo esa cuenta puede modificarlo."</em> Para reasignar, hay que crear una landing nueva con la cuenta que va a quedar como owner.</div>

        <div class="danger"><strong>⚠ Si no configurás CAPI:</strong> Meta no recibe el evento <code>Purchase</code> cuando el cliente paga. Tus campañas de Meta Ads van a optimizar contra <code>Lead</code> (clicks al WA), no contra ventas reales. Eso te deja optimizando con la métrica equivocada y vas a gastar más para conseguir menos ventas.</div>
      </div>
    </article>

    <article class="step-card">
      <div class="step-head">
        <div class="step-num">6</div>
        <div class="step-meta">
          <div class="step-tag">8 tabs visuales</div>
          <h2 class="step-title">El editor visual por dentro</h2>
        </div>
      </div>
      <div class="step-body">
        <p>En modo Visual, el editor te da 8 tabs (la etiqueta de algunos cambia según el rubro de la plantilla):</p>

        <div class="tabs-bar">
          <span class="tab active">🎨 Identidad</span>
          <span class="tab">🖌 Colores</span>
          <span class="tab">📣 Hero</span>
          <span class="tab">📋 Datos</span>
          <span class="tab">⭐ Cards</span>
          <span class="tab">🛒 Productos</span>
          <span class="tab">🔍 SEO</span>
          <span class="tab">🖼 Media</span>
        </div>

        <ul style="margin-top: 14px;">
          <li><strong>Identidad</strong> — URL del negocio (a dónde redirige el CTA "Ir al casino"), URL del logo.</li>
          <li><strong>Colores</strong> — primario, fondo, superficies y texto. Cada uno con color picker + input hex.</li>
          <li><strong>Hero</strong> — título principal, subtítulo, texto del botón CTA. El título acepta <code>{casino_name}</code> como variable.</li>
          <li><strong>Datos / Envíos / Servicio / Estudio</strong> — la etiqueta cambia según el rubro. Para casino son mín. carga/retiro/bono/horario. Para tienda son envíos+horario. Para marketing es la oferta inicial. Para profesional es horario+info extra.</li>
          <li><strong>Cards</strong> — los 4 features con icono + título + descripción. Editables, agregables, removibles.</li>
          <li><strong>Productos</strong> — override del catálogo: tildás qué productos del catálogo del tenant aparecen en ESTA landing y en qué orden. Si no tildás ninguno, la landing muestra todo el catálogo activo.</li>
          <li><strong>SEO</strong> — meta título y meta descripción para Google.</li>
          <li><strong>Media</strong> — uploader para imágenes/videos. La URL se copia al portapapeles para pegarla donde la necesites (logo, hero image, etc.).</li>
        </ul>

        <div class="tip"><strong>📝 Tip de copy:</strong> hablale al lector en segunda persona ("Cobrá en minutos", no "Los clientes cobran en minutos"). Y el CTA en imperativo ("Empezá ahora", no "Empezar ahora"). Suma conversión.</div>
      </div>
    </article>

    <article class="step-card">
      <div class="step-head">
        <div class="step-num">7</div>
        <div class="step-meta">
          <div class="step-tag">Publicar</div>
          <h2 class="step-title">Guardar vs Publicar son cosas distintas</h2>
        </div>
      </div>
      <div class="step-body">
        <p>En la barra superior hay dos botones:</p>
        <ul>
          <li><strong>Guardar</strong> — persiste los cambios en la DB pero la landing sigue como <em>borrador</em>. La URL pública no funciona todavía. Útil para guardar el trabajo antes de cerrar el navegador.</li>
          <li><strong>🚀 Publicar</strong> — marca la landing como pública. La URL <code>/l/:slug</code> empieza a responder. Hace toggle: si está publicada, el mismo botón muestra "✅ Publicada" y al clickearlo la despublicás.</li>
        </ul>

        <p>Cuando una landing está publicada, en su card del listado aparece el dot verde y dos botones rápidos: <strong>🔗 URL</strong> (copia el link al portapapeles) y <strong>📊 Meta</strong> (abre Events Manager directo en el dataset de esta landing).</p>

        <p><strong>Dónde usar la URL pública:</strong></p>
        <ul>
          <li>Como destino de tus campañas de Meta Ads, Google Ads, TikTok Ads.</li>
          <li>En la bio de Instagram, TikTok, X.</li>
          <li>En posts orgánicos cuando promocionás una oferta puntual.</li>
          <li>Como link en tu firma de email.</li>
        </ul>

        <div class="success"><strong>♾ Sin permanencia ni límites:</strong> podés publicar y despublicar la misma landing cuantas veces quieras, podés crear y borrar landings sin tope, podés editar después de publicar y los cambios se reflejan al instante en la URL pública. No hay flujo de "esperar a que se construya" — el panel sirve la landing on-demand.</div>
      </div>
    </article>

    <section class="summary">
      <h2>Qué tenés cuando termines: <span class="accent">una landing publicada con tracking completo.</span></h2>
      <p>Los 6 elementos clave del setup:</p>
      <div class="summary-grid">
        <div class="summary-item">
          <div class="summary-check">1</div>
          <div>
            <div class="summary-item-title">Plantilla del rubro elegido</div>
            <div class="summary-item-desc">Casino / Tienda / Marketing / Profesional / Curso. Con hero, features y CTAs pre-configurados.</div>
          </div>
        </div>
        <div class="summary-item">
          <div class="summary-check">2</div>
          <div>
            <div class="summary-item-title">URL pública /l/:slug</div>
            <div class="summary-item-desc">Configurada por vos, sin tildes, sin espacios. Lista para campañas, bio de redes y firmas.</div>
          </div>
        </div>
        <div class="summary-item">
          <div class="summary-check">3</div>
          <div>
            <div class="summary-item-title">CTA → WhatsApp con mensaje pre-cargado</div>
            <div class="summary-item-desc">El bot recibe el primer mensaje con un texto que vos elegís, útil para identificar fuente del lead.</div>
          </div>
        </div>
        <div class="summary-item">
          <div class="summary-check">4</div>
          <div>
            <div class="summary-item-title">Meta Pixel + CAPI configurados</div>
            <div class="summary-item-desc">PageView, Lead y Purchase llegando a Meta. Las ventas del bot se reportan a tus campañas.</div>
          </div>
        </div>
        <div class="summary-item">
          <div class="summary-check">5</div>
          <div>
            <div class="summary-item-title">Edición en 2 modos</div>
            <div class="summary-item-desc">Visual con 8 tabs para el día a día. HTML con asistente IA para cambios específicos.</div>
          </div>
        </div>
        <div class="summary-item">
          <div class="summary-check">6</div>
          <div>
            <div class="summary-item-title">Productos del catálogo opcionalmente sobreescritos</div>
            <div class="summary-item-desc">Por defecto muestra todo el catálogo activo. Si querés, tildás productos específicos para esta landing.</div>
          </div>
        </div>
      </div>
    </section>
  </div>
</div>
`

export default function InstruccionesLanding() {
  const navigate = useNavigate()
  const location = useLocation()
  const containerRef = useRef(null)

  const backTo = getInstruccionesBase(location.pathname)

  useEffect(() => {
    const id = 'lp-tutorial-fonts'
    if (document.getElementById(id)) return
    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap'
    document.head.appendChild(link)
  }, [])

  return (
    <div style={{ background: C.bg, minHeight: '100vh' }}>
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
          Instrucciones / Landing
        </span>
      </div>

      <div ref={containerRef} dangerouslySetInnerHTML={{ __html: TUTORIAL_HTML }} />
    </div>
  )
}
