import NegocioTutorialLayout from './_NegocioTutorialLayout'
import { SUPPORT_EMAIL } from '../lib/constants'

const ACCENT = '#a78bfa'

const BODY_HTML = `
<div class="container">
  <header class="head">
    <div class="chip" style="background: rgba(167,139,250,0.08); border-color: rgba(167,139,250,0.3); color: ${ACCENT};">Tour guiado · Negocio Marketing</div>
    <h1>Conectá tu negocio de captación — <span style="color:${ACCENT};">setup mínimo, máxima atención</span></h1>
    <p>Esta guía es para negocios cuyo cierre se hace por humano: agencias, inmobiliarias, consultoras, ventas B2B, productos premium con asesor. El bot Marketing necesita muy poca configuración del lado del negocio: solo activarlo y empezar a recibir leads.</p>
    <div class="meta">
      <span>⏱ <strong>5–10 minutos</strong></span>
      <span>📣 <strong>Sin cobros</strong></span>
      <span>🎯 <strong>Filtro IA</strong></span>
      <span>📈 <strong>Pixel opcional</strong></span>
    </div>
  </header>

  <article class="step-card">
    <div class="step-head">
      <div class="step-num">1</div>
      <div class="step-meta">
        <div class="step-tag">¿Mi negocio encaja?</div>
        <h2 class="step-title">Cuándo conviene Marketing y cuándo no</h2>
      </div>
    </div>
    <div class="step-body">
      <p>El modo Marketing es el más simple de los 4 — porque no involucra cobros automáticos. El bot trabaja como un filtro de leads, vos cerrás la venta a mano.</p>

      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin: 16px 0;">
        <div style="padding: 14px; background: rgba(34,197,94,0.05); border: 1px solid rgba(34,197,94,0.25); border-radius: 10px;">
          <p style="font-size: 13px; color: #22c55e; font-weight: 700; margin: 0 0 6px;">✅ Encaja</p>
          <p style="font-size: 12.5px; color: var(--text); line-height: 1.6; margin: 0;">Inmobiliarias, concesionarias, consultoras, agencias de marketing, importadoras, B2B con cotización, ventas de alto ticket, productos premium, servicios con presupuesto a medida.</p>
        </div>
        <div style="padding: 14px; background: rgba(239,68,68,0.05); border: 1px solid rgba(239,68,68,0.25); border-radius: 10px;">
          <p style="font-size: 13px; color: #ef4444; font-weight: 700; margin: 0 0 6px;">❌ No encaja</p>
          <p style="font-size: 12.5px; color: var(--text); line-height: 1.6; margin: 0;">Negocios con catálogo y precio fijo (mejor Tienda), profesionales independientes con secreto profesional (mejor Profesional), atención de soporte post-venta (mejor crear sub-tenant dedicado).</p>
        </div>
      </div>

      <div class="tip"><strong>Test rápido:</strong> ¿el cliente puede comprarte sin hablar con una persona? Si la respuesta es <em>sí</em> → Tienda o Casino. Si la respuesta es <em>no, siempre se cierra hablando</em> → Marketing.</div>
    </div>
  </article>

  <article class="step-card">
    <div class="step-head">
      <div class="step-num">2</div>
      <div class="step-meta">
        <div class="step-tag">Configuración mínima</div>
        <h2 class="step-title">Lo único que necesitás cargar</h2>
      </div>
    </div>
    <div class="step-body">
      <p>Marketing es el setup más liviano de los 4 modos. Solo necesitás:</p>

      <ol style="margin: 14px 0 18px 22px; color: var(--text); line-height: 1.85;">
        <li><strong>Identidad = Marketing</strong> en <code>Configuración → Identidad del negocio</code>.</li>
        <li><strong>Nombre del negocio</strong> (lo usa el bot al saludar).</li>
        <li><strong>Personalidad del bot</strong> ajustada a tu rubro (ver paso siguiente).</li>
      </ol>

      <p style="margin-top: 14px;"><strong>Lo que NO necesitás:</strong></p>
      <ul style="margin: 10px 0 16px 22px; color: var(--muted); line-height: 1.8;">
        <li>Token de Mercado Pago (no se cobra automático)</li>
        <li>Catálogo de productos (no hay catálogo)</li>
        <li>Datos de envío</li>
        <li>API de plataforma externa</li>
      </ul>

      <div class="tip"><strong>Tiempo total de configuración:</strong> ~5 minutos. Es básicamente activar identidad + escribir 2 párrafos de personalidad. El primer mensaje útil que recibas ya pasa por el bot.</div>
    </div>
  </article>

  <article class="step-card">
    <div class="step-head">
      <div class="step-num">3</div>
      <div class="step-meta">
        <div class="step-tag">Personalidad del bot</div>
        <h2 class="step-title">Cómo definir las preguntas de filtro</h2>
      </div>
    </div>
    <div class="step-body">
      <p>El bot Marketing usa lo que cargues en <code>Agente IA → Personalidad del bot</code> para saber qué preguntarle al cliente antes de escalar. Cuanto más específico, mejor filtra.</p>

      <p style="margin-top: 14px;"><strong>Estructura recomendada de la personalidad:</strong></p>

      <div class="mockup web">
        <div class="browser-bar">
          <div class="browser-dots"><span></span><span></span><span></span></div>
          <div class="browser-url">app.innovate-ia.com/agente-ia</div>
        </div>
        <div class="ia-panel">
          <p class="ia-tag">Mensaje informativo del bot</p>
          <textarea readonly style="width: 100%; min-height: 140px; background: var(--bg); border: 1px solid var(--border); border-radius: 6px; padding: 10px; font-family: inherit; font-size: 12.5px; color: var(--text); resize: none; line-height: 1.55;">Sos del equipo comercial de Inmobiliaria Norte. Tu objetivo es captar interés y derivar a un asesor.

Antes de derivar, preguntá:
- Tipo de propiedad (depto/casa/local)
- Zona de interés
- Presupuesto aproximado
- Para alquilar o comprar

Si el cliente da al menos 2 de estos datos, ESCALAR.

Si está vago o solo saluda, pedirle un solo dato a la vez.

Tono cálido, profesional, NO empuje a la venta — el cierre lo hace el asesor humano.</textarea>
        </div>
      </div>

      <p style="margin-top: 14px;">El bot va a respetar esa lógica con flexibilidad. Si el cliente no tiene paciencia (responde 1-2 palabras), igual escala — preferimos sobre-escalar a perder leads por hacer demasiadas preguntas.</p>

      <div class="tip"><strong>Anti-patrón:</strong> NO le digas al bot que pida 5 datos antes de escalar. Eso espanta clientes en WhatsApp. 2 datos clave es suficiente para que el asesor humano arranque con contexto.</div>
    </div>
  </article>

  <article class="step-card">
    <div class="step-head">
      <div class="step-num">4</div>
      <div class="step-meta">
        <div class="step-tag">Pixel + CAPI (opcional pero útil)</div>
        <h2 class="step-title">Trackear leads en Meta para optimizar ads</h2>
      </div>
    </div>
    <div class="step-body">
      <p>Aunque Marketing no tenga cobro automático, podés mandarle a Meta un evento <code>Lead</code> cuando el bot escala. Esto sirve si hacés ads en Instagram/Facebook y querés que el algoritmo optimice a "leads que escalaron al humano" (que es una señal mucho más fuerte que un click).</p>

      <p style="margin-top: 14px;">El setup es el mismo que para Casino o Tienda: necesitás un <strong>Pixel ID</strong>, un <strong>Access Token de CAPI</strong>, y opcionalmente un <strong>Test Event Code</strong>. Los pasos detallados están en la guía de <em>Negocio · Casino</em>.</p>

      <p>La diferencia: en lugar de mandar <code>Purchase</code>, el bot manda <code>Lead</code> con un valor estimado que vos definís. Por ejemplo: si tu lead promedio te genera $50.000 de venta, ponés <code>value: 50000, currency: ARS</code> en la configuración.</p>

      <div class="tip"><strong>Cuándo te conviene:</strong> si invertís más de 100k/mes en ads. Por debajo de eso el algoritmo no junta suficientes señales para optimizar bien y el setup no compensa el esfuerzo. Si recién arrancás con ads, mejor primero medir manualmente.</div>
    </div>
  </article>

  <article class="step-card">
    <div class="step-head">
      <div class="step-num">5</div>
      <div class="step-meta">
        <div class="step-tag">Equipo</div>
        <h2 class="step-title">Múltiples asesores: usá sub-tenants</h2>
      </div>
    </div>
    <div class="step-body">
      <p>Si tu negocio tiene un equipo de varios asesores, conviene crear un <strong>sub-tenant</strong> por cada uno. Cada sub-tenant tiene:</p>

      <ul style="margin: 14px 0 18px 22px; color: var(--text); line-height: 1.8;">
        <li>Su propio número de WhatsApp (Phone ID independiente)</li>
        <li>Su propia personalidad del bot (cada asesor puede tener tono distinto)</li>
        <li>Su propio panel de chats (solo ve sus leads)</li>
        <li>Métricas separadas en Analytics</li>
      </ul>

      <p>Esto permite distribuir leads por zona, especialización o turno. Por ejemplo: un asesor maneja CABA, otro maneja Zona Norte. Cada uno tiene un WhatsApp distinto y los anuncios de Meta se rutean a uno u otro según el público.</p>

      <div class="tip"><strong>Distribución automática:</strong> si querés que TODOS los asesores reciban TODOS los leads y se "peleen" por tomarlos, dejá un solo tenant y agregá usuarios al panel — todos van a ver los chats nuevos en tiempo real.</div>
    </div>
  </article>

  <article class="step-card">
    <div class="step-head">
      <div class="step-num">6</div>
      <div class="step-meta">
        <div class="step-tag">Operación diaria</div>
        <h2 class="step-title">Cómo se ve un día con Marketing activo</h2>
      </div>
    </div>
    <div class="step-body">
      <p>El día típico con Marketing es muy distinto al de Casino o Tienda. Acá no hay pedidos preparándose ni saldos confirmándose: es 100% conversación.</p>

      <ol style="margin: 14px 0 18px 22px; color: var(--text); line-height: 1.85;">
        <li><strong>Push de "lead nuevo"</strong> en el panel cuando el bot escala.</li>
        <li><strong>Tu equipo abre el chat</strong> directamente desde el panel — el bot ya filtró + reúne contexto.</li>
        <li><strong>El asesor toma el chat</strong>, apaga el bot en esa conversación, y hace el cierre humano.</li>
        <li><strong>Si el cierre es exitoso</strong>, el asesor marca el chat con tag manual (ej: "vendido"). Esto se usa después en Analytics.</li>
        <li><strong>Si el lead se enfría</strong> (no responde más), pasa a "leads dormidos" y el bot puede mandarle un follow-up automático días después.</li>
      </ol>

      <div class="tip"><strong>Volumen esperado:</strong> Marketing escala mucho mejor que los otros modos porque cada lead no requiere stock ni preparación física. Negocios bien optimizados manejan 100-300 leads/día con un equipo de 3-5 asesores.</div>

      <p style="margin-top: 18px;">¿Querés ayuda para definir las preguntas de filtro de tu rubro? <a href="mailto:${SUPPORT_EMAIL}" style="color: ${ACCENT}; text-decoration: underline;">Escribinos a ${SUPPORT_EMAIL}</a> — armamos juntos la personalidad inicial.</p>
    </div>
  </article>
</div>
`

export default function InstruccionesNegocioMarketing() {
  return (
    <NegocioTutorialLayout
      accent={ACCENT}
      backTo="negocio"
      breadcrumb="Instrucciones / Negocio / Marketing"
      bodyHtml={BODY_HTML}
    />
  )
}
