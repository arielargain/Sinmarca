import NegocioTutorialLayout from './_NegocioTutorialLayout'
import { SUPPORT_EMAIL } from '../lib/constants'

const ACCENT = '#D4A843' // Gold de marca

const BODY_HTML = `
<div class="container">
  <header class="head">
    <div class="chip" style="background: rgba(212,168,67,0.08); border-color: rgba(212,168,67,0.3); color: ${ACCENT};">Tour guiado · Negocio</div>
    <h1>Configurá tu Pixel y convertí tu bot en un <span style="color:${ACCENT};">agente de ventas 24hs</span></h1>
    <div class="meta">
      <span>⏱ <strong>10–15 minutos</strong></span>
      <span>📊 <strong>Conversions API</strong></span>
      <span>🔒 <strong>Token cifrado</strong></span>
      <span>📈 <strong>+30% optimización del algoritmo</strong></span>
    </div>
  </header>

  <!-- ════════════════════════════════════════════════════════════════════ -->
  <!-- BLOQUE 1: ¿Qué tipo de negocios se pueden integrar? -->
  <!-- ════════════════════════════════════════════════════════════════════ -->

  <div style="background: rgba(34,197,94,0.04); border: 1px solid rgba(34,197,94,0.25); border-radius: 14px; padding: 22px 24px; margin: 18px 0 24px;">
    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
      <span style="font-size: 22px;">🔌</span>
      <h2 style="font-size: 19px; color: var(--text); font-weight: 800; margin: 0; letter-spacing: -0.01em;">¿Qué tipo de <span style="color: #22c55e;">negocios</span> se pueden integrar?</h2>
    </div>
    <p style="color: var(--text); font-size: 14.5px; line-height: 1.7; margin: 0 0 18px;">La plataforma se conecta con cualquier servicio que exponga una API REST con dos endpoints básicos: crear usuario y acreditar saldo. Si tu negocio maneja cuentas de usuario y movimientos de saldo, encaja.</p>

    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px;">
      <div style="background: rgba(34,197,94,0.04); border: 1px solid rgba(34,197,94,0.25); border-radius: 10px; padding: 14px 16px;">
        <p style="font-size: 13px; color: #22c55e; font-weight: 700; margin: 0 0 6px;">🎰 Casinos online</p>
        <p style="font-size: 13px; color: var(--text); line-height: 1.6; margin: 0;">Plataformas tipo ImperiumBet, Sportsbook, sistemas de iGaming con panel de admin y API para gestionar usuarios y depósitos.</p>
      </div>
      <div style="background: rgba(34,197,94,0.04); border: 1px solid rgba(34,197,94,0.25); border-radius: 10px; padding: 14px 16px;">
        <p style="font-size: 13px; color: #22c55e; font-weight: 700; margin: 0 0 6px;">💱 Billeteras y plataformas con saldo</p>
        <p style="font-size: 13px; color: var(--text); line-height: 1.6; margin: 0;">Sistemas de créditos prepagos, monederos digitales, plataformas de apuestas, recargas con trazabilidad de movimientos.</p>
      </div>
      <div style="background: rgba(34,197,94,0.04); border: 1px solid rgba(34,197,94,0.25); border-radius: 10px; padding: 14px 16px;">
        <p style="font-size: 13px; color: #22c55e; font-weight: 700; margin: 0 0 6px;">🛒 E-commerce digital con cuentas</p>
        <p style="font-size: 13px; color: var(--text); line-height: 1.6; margin: 0;">Plataformas SaaS, marketplaces con saldo interno, sistemas de suscripción, plataformas de tickets o créditos.</p>
      </div>
      <div style="background: rgba(34,197,94,0.04); border: 1px solid rgba(34,197,94,0.25); border-radius: 10px; padding: 14px 16px;">
        <p style="font-size: 13px; color: #22c55e; font-weight: 700; margin: 0 0 6px;">📦 Cualquier servicio con API REST</p>
        <p style="font-size: 13px; color: var(--text); line-height: 1.6; margin: 0;">Si tu plataforma tiene endpoints documentados para crear cuenta y procesar pagos, hacemos la integración.</p>
      </div>
    </div>
  </div>

  <!-- ════════════════════════════════════════════════════════════════════ -->
  <!-- BLOQUE 2: Tu bot trabaja como un agente comercial 24hs -->
  <!-- ════════════════════════════════════════════════════════════════════ -->

  <div style="background: rgba(34,197,94,0.04); border: 1px solid rgba(34,197,94,0.25); border-radius: 14px; padding: 22px 24px; margin: 0 0 36px;">
    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
      <span style="font-size: 22px;">🤖</span>
      <h2 style="font-size: 19px; color: var(--text); font-weight: 800; margin: 0; letter-spacing: -0.01em;">Tu bot trabaja como un <span style="color: #22c55e;">agente comercial</span> todo el día</h2>
    </div>
    <p style="color: var(--text); font-size: 14.5px; line-height: 1.7; margin: 0 0 18px;">La AI atiende cada conversación de WhatsApp con el mismo cuidado que pondrías vos: saluda con el nombre del cliente, entiende lo que necesita y lo guía hasta cerrar la venta. Al mismo tiempo le avisa a Meta cada paso importante para que tus campañas optimicen por ventas reales.</p>

    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px;">
      <div style="background: rgba(34,197,94,0.04); border: 1px solid rgba(34,197,94,0.25); border-radius: 10px; padding: 14px 16px;">
        <p style="font-size: 11px; color: #22c55e; font-weight: 700; margin: 0 0 6px; text-transform: uppercase; letter-spacing: 0.05em;">⚡ Atiende al instante</p>
        <p style="font-size: 13px; color: var(--text); line-height: 1.6; margin: 0;">Responde en segundos a las 3 AM o un domingo. Tu bot trabaja mientras vos descansás.</p>
      </div>
      <div style="background: rgba(34,197,94,0.04); border: 1px solid rgba(34,197,94,0.25); border-radius: 10px; padding: 14px 16px;">
        <p style="font-size: 11px; color: #22c55e; font-weight: 700; margin: 0 0 6px; text-transform: uppercase; letter-spacing: 0.05em;">💬 Conversa natural</p>
        <p style="font-size: 13px; color: var(--text); line-height: 1.6; margin: 0;">Habla en español argentino, entiende abreviaciones y se adapta al tono de cada cliente.</p>
      </div>
      <div style="background: rgba(34,197,94,0.04); border: 1px solid rgba(34,197,94,0.25); border-radius: 10px; padding: 14px 16px;">
        <p style="font-size: 11px; color: #22c55e; font-weight: 700; margin: 0 0 6px; text-transform: uppercase; letter-spacing: 0.05em;">🎯 Cierra ventas solo</p>
        <p style="font-size: 13px; color: var(--text); line-height: 1.6; margin: 0;">Genera la cuenta del cliente, manda el link de pago, confirma el depósito y acredita el saldo automáticamente.</p>
      </div>
      <div style="background: rgba(34,197,94,0.04); border: 1px solid rgba(34,197,94,0.25); border-radius: 10px; padding: 14px 16px;">
        <p style="font-size: 11px; color: #22c55e; font-weight: 700; margin: 0 0 6px; text-transform: uppercase; letter-spacing: 0.05em;">📊 Reporta a Meta</p>
        <p style="font-size: 13px; color: var(--text); line-height: 1.6; margin: 0;">Cada venta confirmada se manda al Pixel + CAPI con el monto exacto. Tus campañas optimizan por compradores reales.</p>
      </div>
      <div style="background: rgba(34,197,94,0.04); border: 1px solid rgba(34,197,94,0.25); border-radius: 10px; padding: 14px 16px;">
        <p style="font-size: 11px; color: #22c55e; font-weight: 700; margin: 0 0 6px; text-transform: uppercase; letter-spacing: 0.05em;">🔄 Hace seguimiento</p>
        <p style="font-size: 13px; color: var(--text); line-height: 1.6; margin: 0;">Vuelve a escribir a quien recibió un link de pago y no completó, y a quien creó cuenta pero no cargó saldo.</p>
      </div>
      <div style="background: rgba(34,197,94,0.04); border: 1px solid rgba(34,197,94,0.25); border-radius: 10px; padding: 14px 16px;">
        <p style="font-size: 11px; color: #22c55e; font-weight: 700; margin: 0 0 6px; text-transform: uppercase; letter-spacing: 0.05em;">👋 Pasa al humano</p>
        <p style="font-size: 13px; color: var(--text); line-height: 1.6; margin: 0;">Cuando una conversación necesita atención personal, deriva con todo el contexto al agente humano.</p>
      </div>
    </div>
  </div>

  <!-- ════════════════════════════════════════════════════════════════════ -->
  <!-- INTRO: qué son los eventos de venta de Meta -->
  <!-- ════════════════════════════════════════════════════════════════════ -->

  <!-- Intro: qué son los eventos de venta de Meta -->
  <div style="background: rgba(212,168,67,0.05); border: 1px solid rgba(212,168,67,0.25); border-radius: 14px; padding: 22px 24px; margin: 18px 0 36px;">
    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
      <span style="font-size: 22px;">📣</span>
      <h2 style="font-size: 19px; color: var(--text); font-weight: 800; margin: 0; letter-spacing: -0.01em;">¿Qué son los <span style="color: ${ACCENT};">eventos de venta</span> en Meta?</h2>
    </div>

    <p style="font-size: 14px; color: var(--text); line-height: 1.7; margin: 0 0 12px;">
      Cada vez que alguien hace algo importante en tu negocio (ve un producto, agrega al carrito, paga), eso es un <strong>"evento"</strong>. Meta tiene una lista de eventos estándar predefinidos que el algoritmo entiende solo, sin configurar nada extra:
    </p>

    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; margin-bottom: 14px;">
      <div style="background: var(--surf); border: 1px solid var(--border); border-radius: 8px; padding: 12px 14px;">
        <p style="font-size: 12px; font-family: 'JetBrains Mono', monospace; color: ${ACCENT}; font-weight: 700; margin: 0 0 4px;">PageView</p>
        <p style="font-size: 12.5px; color: var(--muted); margin: 0; line-height: 1.55;">Visitó tu landing</p>
      </div>
      <div style="background: var(--surf); border: 1px solid var(--border); border-radius: 8px; padding: 12px 14px;">
        <p style="font-size: 12px; font-family: 'JetBrains Mono', monospace; color: ${ACCENT}; font-weight: 700; margin: 0 0 4px;">Lead</p>
        <p style="font-size: 12.5px; color: var(--muted); margin: 0; line-height: 1.55;">Inició chat / dejó datos</p>
      </div>
      <div style="background: var(--surf); border: 1px solid var(--border); border-radius: 8px; padding: 12px 14px;">
        <p style="font-size: 12px; font-family: 'JetBrains Mono', monospace; color: ${ACCENT}; font-weight: 700; margin: 0 0 4px;">InitiateCheckout</p>
        <p style="font-size: 12.5px; color: var(--muted); margin: 0; line-height: 1.55;">Recibió link de pago</p>
      </div>
      <div style="background: var(--surf); border: 2px solid #22c55e; border-radius: 8px; padding: 12px 14px;">
        <p style="font-size: 12px; font-family: 'JetBrains Mono', monospace; color: #22c55e; font-weight: 700; margin: 0 0 4px;">Purchase ★</p>
        <p style="font-size: 12.5px; color: var(--text); margin: 0; line-height: 1.55; font-weight: 600;">Pagó (el más importante)</p>
      </div>
    </div>

    <p style="font-size: 14px; color: var(--text); line-height: 1.7; margin: 0 0 10px;">
      <strong style="color: var(--text);">No hay que configurarlos</strong> — Meta los reconoce automáticamente apenas el primero llega. Lo que sí tenés que hacer una sola vez es <strong>conectar tu Pixel + generar el Access Token</strong> (lo explicamos abajo paso a paso). Después de eso, el bot manda automáticamente el evento <code style="color: ${ACCENT}; background: rgba(212,168,67,0.1); padding: 2px 6px; border-radius: 4px; font-family: 'JetBrains Mono', monospace; font-size: 12.5px;">Purchase</code> cada vez que un cliente paga, con el monto y todo.
    </p>

    <p style="font-size: 13.5px; color: var(--muted); line-height: 1.65; margin: 0; padding-top: 10px; border-top: 1px dashed var(--border);">
      💡 <strong style="color: var(--text);">Tip:</strong> con solo el evento <code style="color: ${ACCENT};">Purchase</code> ya alcanza para crear campañas tipo <em>"Conversiones — Purchase"</em> en Meta Ads. El algoritmo aprende quién compra y busca más gente parecida.
    </p>
  </div>

  <article class="step-card">
    <div class="step-head">
      <div class="step-num">1</div>
      <div class="step-meta">
        <div class="step-tag">Por qué importa</div>
        <h2 class="step-title">Sin tracking, Meta no sabe a quién mostrarle tus anuncios</h2>
      </div>
    </div>
    <div class="step-body">
      <p>Cuando hacés una campaña en Facebook o Instagram Ads, el algoritmo necesita saber <strong>qué clicks generaron ventas reales</strong>. Si no le decís, optimiza por <em>clicks baratos</em> en vez de <em>clientes que pagan</em>.</p>

      <p>Hay 2 formas de mandarle esa info a Meta:</p>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 14px; margin: 18px 0;">
        <div style="background: var(--surf); border: 1px solid var(--border); border-radius: 12px; padding: 16px;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
            <span style="background: rgba(239,68,68,0.12); color: var(--danger); font-size: 11px; font-weight: 700; font-family: 'JetBrains Mono', monospace; padding: 3px 10px; border-radius: 99px;">A) Solo Pixel</span>
          </div>
          <p style="margin: 0; font-size: 13px; color: var(--muted); line-height: 1.65;">Trackeás solo lo que pasa en una página web. Si tu venta cierra en WhatsApp (como con este bot), <strong style="color: var(--text);">Meta nunca se entera</strong>.</p>
        </div>

        <div style="background: rgba(34,197,94,0.04); border: 1px solid rgba(34,197,94,0.3); border-radius: 12px; padding: 16px;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
            <span style="background: rgba(34,197,94,0.15); color: var(--success); font-size: 11px; font-weight: 700; font-family: 'JetBrains Mono', monospace; padding: 3px 10px; border-radius: 99px;">B) Pixel + CAPI ✓</span>
          </div>
          <p style="margin: 0; font-size: 13px; color: var(--text); line-height: 1.65;">El bot le manda directo a Meta el evento <code style="color: ${ACCENT};">Purchase</code> servidor-a-servidor cada vez que un cliente paga. <strong>Trackeo confiable, sin importar dónde cerró la venta.</strong></p>
        </div>
      </div>

      <div class="tip"><strong>CAPI = Conversions API.</strong> Es el endpoint oficial de Meta para enviar eventos desde tu servidor en lugar del navegador del usuario. Es lo que te permite trackear conversiones de WhatsApp, llamadas telefónicas, ventas presenciales o cualquier conversión fuera de la web.</div>
    </div>
  </article>

  <!-- PASO 1 — Crear o ubicar el Pixel (Conjunto de datos) -->
  <article class="step-card">
    <div class="step-head">
      <div class="step-num">2</div>
      <div class="step-meta">
        <div class="step-tag">Configuración del Portfolio comercial</div>
        <h2 class="step-title">Encontrá tu Pixel ID en Conjuntos de datos y píxeles</h2>
      </div>
    </div>
    <div class="step-body">
      <p>En Meta Business Suite, los Pixels viven dentro de tu <strong>Portfolio comercial</strong>, en la sección <strong>Orígenes de datos → Conjuntos de datos y píxeles</strong>. Si ya tenés uno creado para tu landing reusalo; si no, hay que crear uno desde el botón <strong>+ Agregar</strong>.</p>

      <div style="background: var(--surf); border: 1px solid var(--border); border-radius: 8px; padding: 14px 18px; margin: 14px 0; display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
        <span style="font-size: 18px;">🔗</span>
        <a href="https://business.facebook.com/latest/settings/events_dataset_and_pixel" target="_blank" rel="noopener noreferrer" style="color: ${ACCENT}; text-decoration: none; font-weight: 700; font-size: 14px;">business.facebook.com → Configuración → Orígenes de datos → Conjuntos de datos y píxeles</a>
        <span style="font-size: 12px; color: var(--muted); font-family: 'JetBrains Mono', monospace;">↗</span>
      </div>

      <!-- Mockup: Conjuntos de datos y píxeles (basado en captura real) -->
      <div class="mockup web">
        <div class="browser-bar">
          <div class="browser-dots"><span></span><span></span><span></span></div>
          <div class="browser-url">business.facebook.com/.../events_dataset_and_pixel</div>
        </div>
        <div style="background: #18191a; padding: 18px; color: #e4e6eb; font-family: 'Segoe UI', sans-serif;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; padding-bottom: 12px; border-bottom: 1px solid #3a3b3c; margin-bottom: 14px;">
            <p style="margin: 0; font-size: 14px; font-weight: 700; color: #e4e6eb;">Conjuntos de datos y píxeles</p>
            <button style="background: #1877f2; color: #fff; border: none; padding: 6px 14px; border-radius: 6px; font-size: 12px; font-weight: 600;">+ Agregar</button>
          </div>

          <div style="background: #242526; border-radius: 8px; padding: 12px 14px; margin-bottom: 8px; border-left: 3px solid #1877f2;">
            <p style="font-size: 13px; font-weight: 600; color: #e4e6eb; margin: 0 0 2px;">Tu-Pixel</p>
            <p style="font-size: 11px; color: #b0b3b8; margin: 0;">Meta Pixel · Conversions API</p>
          </div>

          <div style="background: rgba(34,197,94,0.06); border: 1px solid rgba(34,197,94,0.3); border-radius: 8px; padding: 10px 14px; margin-top: 10px;">
            <p style="font-size: 12.5px; color: #22c55e; font-weight: 700; margin: 0 0 2px;">El conjunto de datos está recibiendo eventos</p>
            <p style="font-size: 11px; color: #b0b3b8; margin: 0;">Identificador: <span style="color: ${ACCENT}; font-family: 'JetBrains Mono', monospace;">26635754306092129</span></p>
          </div>
        </div>
      </div>

      <p style="margin-top: 18px;">Hacé click en tu Pixel y vas a ver los datos del conjunto a la derecha. Lo que necesitás copiar es el <strong style="color: ${ACCENT};">Identificador</strong> — un número largo (15-16 dígitos). Ese es tu <strong>Pixel ID</strong>.</p>

      <div class="tip"><strong>Nomenclatura confusa de Meta:</strong> "Pixel", "Conjunto de datos" y "Dataset" son el mismo objeto. Meta unificó todo bajo "Conjunto de datos" pero internamente y en otras pantallas sigue apareciendo "Pixel ID". Es lo mismo.</div>
    </div>
  </article>

  <!-- PASO 2 — Generar Access Token de CAPI -->
  <article class="step-card">
    <div class="step-head">
      <div class="step-num">3</div>
      <div class="step-meta">
        <div class="step-tag">Integración directa con CAPI</div>
        <h2 class="step-title">Generá el token de acceso (con Dataset Quality API)</h2>
      </div>
    </div>
    <div class="step-body">
      <p>Una vez que tenés el Pixel ID, hay que generar el token. Andá al <strong>Administrador de eventos</strong> (eventsmanager), entrá al Pixel, y hacé click en la pestaña <strong>Configuración</strong>:</p>

      <div style="background: var(--surf); border: 1px solid var(--border); border-radius: 8px; padding: 14px 18px; margin: 14px 0; display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
        <span style="font-size: 18px;">🔗</span>
        <a href="https://www.facebook.com/events_manager2/list/dataset" target="_blank" rel="noopener noreferrer" style="color: ${ACCENT}; text-decoration: none; font-weight: 700; font-size: 14px;">eventsmanager.facebook.com → tu Pixel → Configuración</a>
      </div>

      <p>Vas a ver tres caminos para conectar la API de conversiones. <strong>Bajá hasta "Configurar integración directa"</strong> y elegí <strong style="color: ${ACCENT};">Configurar con Dataset Quality API</strong> (es la opción Recomendada):</p>

      <!-- Mockup: pestaña Configuración con los 3 caminos (basado en captura real) -->
      <div class="mockup web">
        <div class="browser-bar">
          <div class="browser-dots"><span></span><span></span><span></span></div>
          <div class="browser-url">eventsmanager.facebook.com/.../settings</div>
        </div>
        <div style="background: #18191a; padding: 18px; color: #e4e6eb; font-family: 'Segoe UI', sans-serif;">
          <div style="display: flex; gap: 8px; margin-bottom: 18px; padding-bottom: 10px; border-bottom: 1px solid #3a3b3c;">
            <span style="background: transparent; color: #b0b3b8; font-size: 13px; padding: 6px 12px;">Resumen</span>
            <span style="background: transparent; color: #b0b3b8; font-size: 13px; padding: 6px 12px;">Probar eventos</span>
            <span style="background: transparent; color: #b0b3b8; font-size: 13px; padding: 6px 12px;">Diagnóstico</span>
            <span style="background: #242526; color: #1877f2; font-size: 13px; padding: 6px 12px; border-radius: 4px; font-weight: 700;">Configuración</span>
          </div>

          <p style="font-size: 13px; color: #b0b3b8; margin: 0 0 10px; opacity: 0.7;">Configurar con una conexión basada en la nube</p>

          <div style="background: #242526; border-radius: 8px; padding: 12px 14px; margin-bottom: 16px; opacity: 0.5;">
            <p style="font-size: 13px; font-weight: 600; color: #e4e6eb; margin: 0 0 4px;">⊙ Gateway de la API de conversiones <span style="font-size: 11px; color: #1877f2; font-weight: 400;">— code-less, requiere infra extra</span></p>
            <p style="font-size: 11.5px; color: #b0b3b8; margin: 0;">Usado por agencias grandes con stack Cloud propio. <strong style="color: #ef4444;">No lo necesitás</strong>.</p>
          </div>

          <p style="font-size: 13px; color: #e4e6eb; font-weight: 700; margin: 0 0 10px;">Configurar integración directa <span style="font-size: 11px; color: #b0b3b8; font-weight: 400;">— este es el camino para Innovate.ia</span></p>

          <div style="background: #242526; border-radius: 8px; padding: 12px 14px; margin-bottom: 8px; border-left: 3px solid #22c55e;">
            <p style="font-size: 13px; font-weight: 700; color: #e4e6eb; margin: 0 0 4px;">⊙ Configurar con Dataset Quality API <span style="background: rgba(34,197,94,0.15); color: #22c55e; font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 99px; margin-left: 6px;">Recommended</span></p>
            <p style="font-size: 11.5px; color: #b0b3b8; margin: 0;">Te da métricas de coincidencias de eventos para optimizar.</p>
          </div>

          <div style="background: #242526; border-radius: 8px; padding: 12px 14px; margin-bottom: 16px; opacity: 0.65;">
            <p style="font-size: 13px; font-weight: 600; color: #e4e6eb; margin: 0 0 4px;">⊙ Configurar sin Dataset Quality API</p>
            <p style="font-size: 11.5px; color: #b0b3b8; margin: 0;">Funciona igual pero sin las métricas de calidad.</p>
          </div>

          <button style="background: #1877f2; color: #fff; border: none; padding: 10px 18px; border-radius: 6px; font-size: 13px; font-weight: 700; cursor: pointer;">Generar token de acceso</button>
        </div>
      </div>

      <p style="margin-top: 18px;">Apretá <strong>"Generar token de acceso"</strong>. Meta te va a abrir un modal con un token largo de unos 200+ caracteres que empieza con <code style="color: ${ACCENT}; font-family: 'JetBrains Mono', monospace;">EAA...</code>. <strong style="color: var(--danger);">Copialo a un editor de texto antes de cerrar el modal — Meta no te lo va a volver a mostrar.</strong></p>

      <div class="danger" style="background: rgba(239,68,68,0.06); border-left: 3px solid var(--danger); padding: 12px 14px; border-radius: 0 8px 8px 0; margin: 14px 0;">
        <strong style="color: var(--danger-soft);">⚠️ Tratá este token como una contraseña.</strong> Quien lo tenga puede mandar eventos a tu Pixel y manipular tu data de marketing. No lo pegues en chats públicos, no lo subas a repos de código. En Innovate.ia se guarda <strong>cifrado en la base de datos</strong>.
      </div>

      <div class="tip"><strong>¿Cuál es la diferencia entre los 3 caminos?</strong>
        <ul style="margin: 8px 0 0 18px; padding: 0; color: var(--muted); line-height: 1.7;">
          <li><strong style="color: var(--text);">Gateway de la API:</strong> es para empresas con stack Cloud que quieren un proxy intermedio entre su servidor y Meta. Innovate.ia ya hace ese trabajo, así que no lo necesitás.</li>
          <li><strong style="color: var(--text);">Con Dataset Quality API ✓ recomendado:</strong> el bot te incluye además del envío de eventos, lectura de métricas de calidad. Es el camino que usamos.</li>
          <li><strong style="color: var(--text);">Sin Dataset Quality API:</strong> mismo envío de eventos, pero ciego — no podés ver el match quality desde el Innovate.ia. Funciona igual pero perdés visibilidad.</li>
        </ul>
      </div>
    </div>
  </article>

  <!-- PASO 3 — Test Event Code (desde "Probar eventos") -->
  <article class="step-card">
    <div class="step-head">
      <div class="step-num">4</div>
      <div class="step-meta">
        <div class="step-tag">Probar eventos (opcional)</div>
        <h2 class="step-title">Generá un Test Event Code antes de mandar eventos reales</h2>
      </div>
    </div>
    <div class="step-body">
      <p>Antes de empezar a mandar <code style="color: ${ACCENT};">Purchase</code> reales (que entrenan al algoritmo), conviene mandar primero unos eventos de <strong>prueba</strong> para verificar que la integración funciona. Meta separa los eventos de test de los reales para no contaminar tu data.</p>

      <p>En el Pixel, hacé click en la pestaña <strong>Probar eventos</strong>. Vas a tener que <strong>seleccionar un canal</strong>; elegí <strong>Sitio web</strong>:</p>

      <!-- Mockup: Probar eventos → Seleccionar canal (basado en captura) -->
      <div class="mockup web">
        <div class="browser-bar">
          <div class="browser-dots"><span></span><span></span><span></span></div>
          <div class="browser-url">eventsmanager.facebook.com/.../test_events</div>
        </div>
        <div style="background: #18191a; padding: 18px; color: #e4e6eb; font-family: 'Segoe UI', sans-serif;">
          <div style="display: flex; gap: 8px; margin-bottom: 18px; padding-bottom: 10px; border-bottom: 1px solid #3a3b3c;">
            <span style="background: transparent; color: #b0b3b8; font-size: 13px; padding: 6px 12px;">Resumen</span>
            <span style="background: #242526; color: #1877f2; font-size: 13px; padding: 6px 12px; border-radius: 4px; font-weight: 700;">Probar eventos</span>
            <span style="background: transparent; color: #b0b3b8; font-size: 13px; padding: 6px 12px;">Configuración</span>
          </div>

          <p style="font-size: 14px; font-weight: 700; color: #e4e6eb; margin: 0 0 6px;">Probar los eventos</p>
          <p style="font-size: 12.5px; color: #b0b3b8; line-height: 1.55; margin: 0 0 16px;">Usa los eventos de prueba para verificar que los eventos de tu sitio web, app, CRM y servidor estén bien configurados.</p>

          <p style="font-size: 12px; color: #b0b3b8; margin: 0 0 6px;">Selecciona un canal de marketing:</p>
          <div style="background: #242526; border: 1px solid #3a3b3c; border-radius: 6px; padding: 8px 12px; margin-bottom: 10px; max-width: 220px;">
            <p style="font-size: 13px; color: #e4e6eb; margin: 0;"><strong style="color: #1877f2;">Sitio web</strong> ▼</p>
          </div>

          <div style="background: #242526; border-radius: 8px; padding: 12px 14px; margin-bottom: 10px; border-left: 3px solid ${ACCENT};">
            <p style="font-size: 11px; color: #b0b3b8; text-transform: uppercase; letter-spacing: 0.06em; margin: 0 0 4px;">test_event_code</p>
            <p style="font-size: 16px; color: ${ACCENT}; font-family: 'JetBrains Mono', monospace; font-weight: 700; margin: 0;">TEST75 <span style="font-size: 11px; color: #b0b3b8; font-weight: 400; margin-left: 8px;">[Copiar]</span></p>
          </div>

          <p style="font-size: 11px; color: #b0b3b8; line-height: 1.55; margin: 0;">Copia este código. Cuando esté en el panel de Innovate, los eventos van a llegar a esta pestaña en lugar de ir como reales.</p>
        </div>
      </div>

      <p style="margin-top: 18px;">Copiá el código (algo como <code style="color: ${ACCENT};">TEST75</code>) — son 6-8 caracteres. Lo vas a pegar en el panel de Innovate en el próximo paso. <strong>Mantené esta pestaña de "Probar eventos" abierta</strong> mientras hacés el test, porque ahí van a aparecer los eventos cuando lleguen.</p>

      <div class="tip"><strong>¿Por qué seleccionar "Sitio web" si el evento no viene de un sitio?</strong> Meta usa esa selección solo para mostrar las instrucciones correctas; los eventos que mandamos por CAPI llevan el <code style="color: ${ACCENT};">test_event_code</code> en el payload, así que igual van a aparecer en este dashboard sin importar qué canal seleccionaste.</div>

      <div class="tip" style="margin-top: 10px;"><strong>Cuándo desactivarlo:</strong> el Test Event Code es solo para validar la integración. Una vez que probaste y verificaste que llegan los eventos, <strong>borralo del panel de Innovate</strong> y dejá ese campo vacío. Si lo dejás puesto, todos los eventos van a ir como "test" y no van a entrenar al algoritmo.</div>
    </div>
  </article>

  <!-- PASO 4 — Pegar todo en Innovate.ia -->
  <article class="step-card">
    <div class="step-head">
      <div class="step-num">5</div>
      <div class="step-meta">
        <div class="step-tag">Panel de Innovate.ia</div>
        <h2 class="step-title">Pegá los 3 valores en tu panel de configuración</h2>
      </div>
    </div>
    <div class="step-body">
      <p>Ahora con el <strong>Pixel ID</strong>, el <strong>Access Token</strong> y opcionalmente el <strong>Test Event Code</strong> en mano, andá a tu panel de Innovate.ia → <strong>Configuración</strong> → bloque <strong>📊 Tracking Meta Pixel + CAPI</strong>:</p>

      <div class="tip" style="margin-bottom: 14px;"><strong>Dato útil:</strong> también podés cargar estos mismos valores desde el <strong>Creador de Landing Pages</strong>, dentro de la sección "Pixel". El sistema sincroniza automáticamente los datos entre la landing y el bot — no hace falta cargarlos dos veces. Si ya configuraste el pixel en una landing, podés saltearte este paso.</div>

      <!-- Mockup: panel Innovate sección Meta -->
      <div class="mockup web">
        <div class="browser-bar">
          <div class="browser-dots"><span></span><span></span><span></span></div>
          <div class="browser-url">app.innovate-ia.com/config</div>
        </div>
        <div class="ia-panel">
          <div class="ia-panel-h">
            <p class="ia-tag">Anuncios de Facebook/Instagram — opcional</p>
            <h4 class="ia-h4">📊 Tracking Meta Pixel + CAPI</h4>
          </div>

          <div class="ia-field">
            <p class="ia-field-label">Pixel ID</p>
            <div class="ia-input-wrap">
              <input class="ia-input" value="1234567890123456" readonly />
            </div>
            <p class="ia-help">Solo dígitos. Lo encontrás en Meta Events Manager → Data Sources</p>
          </div>

          <div class="ia-field">
            <p class="ia-field-label">Access Token (CAPI)</p>
            <div class="ia-input-wrap">
              <input class="ia-input" value="EAAxxxxxxxxx•••••••••" readonly type="password" />
              <span style="background: rgba(34,197,94,0.15); color: #22c55e; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 99px;">✓ CONFIGURADO</span>
            </div>
            <p class="ia-help">Generalo en Events Manager → Settings → Conversions API → Generate Access Token</p>
          </div>

          <div class="ia-field">
            <p class="ia-field-label">Test Event Code (opcional)</p>
            <div class="ia-input-wrap" style="max-width: 200px;">
              <input class="ia-input" value="TEST75" readonly />
            </div>
            <p class="ia-help">Solo para pruebas. Cuando esté en producción, dejalo vacío.</p>
          </div>

          <div style="border-top: 1px solid #1e2130; padding-top: 14px; margin-top: 14px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
            <button style="background: rgba(212,168,67,0.1); border: 1px solid rgba(212,168,67,0.4); color: ${ACCENT}; padding: 8px 14px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer;">🧪 Enviar evento de prueba (Lead)</button>
            <span style="font-size: 12px; color: #4E5168;">Verificá en Test Events ↗</span>
          </div>
        </div>
      </div>

      <p style="margin-top: 18px;">Apretá <strong>Guardar configuración</strong> abajo de todo. El Access Token se cifra en tránsito y reposo. <strong>No se vuelve a mostrar nunca</strong> — si después necesitás cambiarlo, generás uno nuevo en Meta y lo pegás de nuevo (el viejo queda invalidado).</p>
    </div>
  </article>

  <!-- PASO 5 — Probar evento -->
  <article class="step-card">
    <div class="step-head">
      <div class="step-num">6</div>
      <div class="step-meta">
        <div class="step-tag">Verificación</div>
        <h2 class="step-title">Probá que el evento llega a Meta</h2>
      </div>
    </div>
    <div class="step-body">
      <p>Una vez guardada la configuración, te aparece el botón <strong>🧪 Enviar evento de prueba (Lead)</strong>. Apretalo. El bot va a mandar un evento <code style="color: ${ACCENT};">Lead</code> de prueba directo a tu Pixel.</p>

      <p>Inmediatamente después, andá a la pestaña <strong>Test Events</strong> de tu Pixel en Meta. En menos de 30 segundos vas a ver el evento aparecer:</p>

      <!-- Mockup: Test Events recibe evento -->
      <div class="mockup web">
        <div class="browser-bar">
          <div class="browser-dots"><span></span><span></span><span></span></div>
          <div class="browser-url">facebook.com/events_manager2/.../test_events</div>
        </div>
        <div style="background: #18191a; padding: 18px; color: #e4e6eb; font-family: 'Segoe UI', sans-serif;">
          <p style="font-size: 13px; color: #b0b3b8; margin-bottom: 14px;">Test events received with code <code style="color: ${ACCENT};">TEST75</code> — last 30 minutes</p>

          <div style="background: #242526; border-radius: 8px; padding: 14px; border-left: 4px solid #22c55e;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
              <span style="font-size: 16px;">✓</span>
              <p style="margin: 0; font-size: 14px; font-weight: 700; color: #e4e6eb;">Lead</p>
              <span style="margin-left: auto; font-size: 11px; color: #b0b3b8;">just now</span>
            </div>
            <p style="font-size: 12px; color: #b0b3b8; line-height: 1.6; margin-bottom: 6px;">Source: Server (Conversions API) · Match Quality: Good</p>
            <p style="font-size: 11.5px; color: #b0b3b8; font-family: 'JetBrains Mono', monospace;">event_id: lead_xxx_1714338000000</p>
          </div>
        </div>
      </div>

      <div class="tip"><strong>Si NO aparece:</strong> verificá que el Pixel ID y el Access Token estén bien copiados (sin espacios al inicio o final). Si seguís sin verlo, <a href="mailto:${SUPPORT_EMAIL}" style="color: var(--success); text-decoration: underline;">escribinos a ${SUPPORT_EMAIL}</a> con un screenshot del error.</div>
    </div>
  </article>

  <!-- PASO 6 — Producción: borrar Test Event Code -->
  <article class="step-card">
    <div class="step-head">
      <div class="step-num">7</div>
      <div class="step-meta">
        <div class="step-tag">Pase a producción</div>
        <h2 class="step-title">Sacá el Test Event Code y empezá a recibir Purchases reales</h2>
      </div>
    </div>
    <div class="step-body">
      <p>Una vez que verificaste que el evento de prueba llega bien, volvé al panel de Innovate y <strong>vaciá el campo Test Event Code</strong>. Apretá Guardar.</p>

      <p>Desde ese momento, cada vez que un cliente pague una carga (vía Mercado Pago o cualquier otra billetera), el bot va a mandar automáticamente a Meta un evento <code style="color: ${ACCENT};">Purchase</code> con:</p>

      <ul style="margin: 14px 0 16px 22px; color: var(--muted); line-height: 1.85;">
        <li><strong style="color: var(--text);">El monto de la venta</strong> (en ARS)</li>
        <li><strong style="color: var(--text);">El teléfono del cliente</strong> hasheado con SHA-256 (privacidad)</li>
        <li><strong style="color: var(--text);">El ID único de la venta</strong> (para deduplicar si Meta también lo recibe del Pixel web)</li>
        <li><strong style="color: var(--text);">El timestamp exacto</strong> del pago</li>
      </ul>

      <p>Vas a poder ver los eventos <code style="color: ${ACCENT};">Purchase</code> en el dashboard del Pixel, ya no en Test Events sino en <strong>Overview</strong> bajo "Events received".</p>

      <h3 style="font-size: 17px; color: var(--text); font-weight: 700; margin: 28px 0 12px;">Dataset Quality — el dashboard que mirás todas las semanas</h3>

      <p>Después de 24-48 horas con eventos reales, Meta empieza a calcular tu <strong>Event Match Quality</strong> y a mostrarte el dashboard de <strong>Dataset Quality</strong>. Te dice cuántos de tus eventos están "bien armados" (con suficiente info para matchearse a un usuario real de Facebook/Instagram).</p>

      <!-- Mockup: Dataset Quality -->
      <div class="mockup web">
        <div class="browser-bar">
          <div class="browser-dots"><span></span><span></span><span></span></div>
          <div class="browser-url">facebook.com/events_manager2/.../overview</div>
        </div>
        <div style="background: #18191a; padding: 18px; color: #e4e6eb; font-family: 'Segoe UI', sans-serif;">
          <p style="font-size: 11px; color: #b0b3b8; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 12px;">Dataset Quality</p>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px;">
            <div style="background: #242526; border-radius: 8px; padding: 12px;">
              <p style="font-size: 11px; color: #b0b3b8; margin-bottom: 4px;">Events received (7d)</p>
              <p style="font-size: 22px; font-weight: 700; color: #e4e6eb;">418</p>
              <p style="font-size: 11px; color: #22c55e; margin-top: 2px;">+12% vs last week</p>
            </div>
            <div style="background: #242526; border-radius: 8px; padding: 12px;">
              <p style="font-size: 11px; color: #b0b3b8; margin-bottom: 4px;">Match quality</p>
              <p style="font-size: 22px; font-weight: 700; color: #22c55e;">8.2 / 10</p>
              <p style="font-size: 11px; color: #b0b3b8; margin-top: 2px;">Good</p>
            </div>
            <div style="background: #242526; border-radius: 8px; padding: 12px;">
              <p style="font-size: 11px; color: #b0b3b8; margin-bottom: 4px;">Coverage</p>
              <p style="font-size: 22px; font-weight: 700; color: #e4e6eb;">94%</p>
              <p style="font-size: 11px; color: #22c55e; margin-top: 2px;">Excellent</p>
            </div>
          </div>
        </div>
      </div>

      <p style="margin-top: 18px;"><strong>Match Quality 8.0+ es saludable.</strong> El bot manda automáticamente teléfono hasheado, IP y user-agent — los 3 que más pesan en el match. Si tu score baja, escribinos y revisamos qué pasa.</p>

      <div class="tip" style="margin-top: 22px;"><strong>Resultado real esperado:</strong> luego de 14 días con eventos reales, Meta tiene suficiente data para optimizar campañas tipo "Conversiones — Purchase" o "Sales — Catalog". Vas a notar mejor calidad de leads y costo por venta más bajo (típicamente -20% a -40% vs campañas optimizadas solo por click).</div>
    </div>
  </article>

  <!-- ════════════════════════════════════════════════════════════════════ -->
  <!-- CIERRE -->
  <!-- ════════════════════════════════════════════════════════════════════ -->

  <div style="background: rgba(212,168,67,0.05); border: 1px solid rgba(212,168,67,0.2); border-radius: 14px; padding: 22px 24px; margin: 36px 0 18px;">
    <h3 style="font-size: 17px; color: var(--text); font-weight: 800; margin: 0 0 10px;">¿Te trabaste en algún paso?</h3>
    <p style="font-size: 14px; color: var(--text); line-height: 1.65; margin-bottom: 14px;">
      La parte de Meta tiene su complejidad — Events Manager cambia su UI cada tanto, y a veces pide verificación de dominio o permisos extra. Si algo no carga, no perdés nada en escribirnos.
    </p>
    <a href="mailto:${SUPPORT_EMAIL}" style="background: rgba(34,197,94,0.12); border: 1px solid rgba(34,197,94,0.4); color: var(--success); padding: 10px 18px; border-radius: 8px; font-size: 14px; font-weight: 700; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">✉️ Escribinos a ${SUPPORT_EMAIL}</a>
  </div>
</div>
`

export default function InstruccionesNegocioCasino() {
  return (
    <NegocioTutorialLayout
      accent={ACCENT}
      backTo="negocio"
      breadcrumb="Instrucciones / Negocio / Casino"
      bodyHtml={BODY_HTML}
    />
  )
}
