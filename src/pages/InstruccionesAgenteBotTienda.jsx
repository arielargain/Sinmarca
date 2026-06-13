import AgenteTutorialLayout from './_AgenteTutorialLayout'
import { SUPPORT_EMAIL } from '../lib/constants'

const ACCENT = '#3b82f6'

const BODY_HTML = `
<div class="container">
  <header class="head">
    <div class="chip" style="background: rgba(59,130,246,0.08); border-color: rgba(59,130,246,0.3); color: ${ACCENT};">Tour guiado · Bot Tienda</div>
    <h1>Tu bot Tienda — <span style="color:${ACCENT};">cómo vender productos físicos por WhatsApp con cobro automático</span></h1>
    <p>Una guía completa del bot de tienda: cómo carga el catálogo, cómo conversa, cómo cobra con Mercado Pago y cómo termina cada venta en una sale lista para preparar el envío. Pensado para negocios que ya venden por WhatsApp pero todavía cobran a mano.</p>
    <div class="meta">
      <span>⏱ <strong>15–20 minutos</strong></span>
      <span>🛍️ <strong>Pedidos 24/7</strong></span>
      <span>⚡ <strong>~3s por respuesta</strong></span>
      <span>📦 <strong>Pedido → Envío en 1 panel</strong></span>
    </div>
  </header>

  <article class="step-card">
    <div class="step-head">
      <div class="step-num">1</div>
      <div class="step-meta">
        <div class="step-tag">Qué hace el bot tienda</div>
        <h2 class="step-title">Vendé desde WhatsApp como si tuvieras un e-commerce</h2>
      </div>
    </div>
    <div class="step-body">
      <p>El bot Tienda lee tu catálogo, conversa con el cliente, arma el pedido (productos + cantidades + dirección), genera un link de Mercado Pago, espera que pague, y cuando el pago se acredita carga la venta en tu panel de Pedidos lista para preparar el envío.</p>

      <p style="margin-top: 16px;"><strong>Lo que automatiza:</strong></p>
      <ul style="margin: 10px 0 16px 22px; color: var(--muted); line-height: 1.8;">
        <li>Lee productos activos del panel (alta de catálogo lo hacés vos)</li>
        <li>Recomienda productos según lo que pregunta el cliente</li>
        <li>Toma el pedido completo: ítems + cantidad + dirección + DNI si configurás</li>
        <li>Calcula total y genera link de pago al instante</li>
        <li>Cuando MP confirma el pago, descuenta stock y registra la venta</li>
        <li>Te notifica push al panel para que prepares el envío</li>
      </ul>

      <p><strong>Lo que NO hace:</strong></p>
      <ul style="margin: 10px 0 16px 22px; color: var(--muted); line-height: 1.8;">
        <li>No arma rutas de envío ni cotiza Correo Argentino — eso lo coordinás vos</li>
        <li>No emite factura A — el bot pasa el dato al panel y vos facturás aparte</li>
        <li>No vende productos sin stock — los esconde automáticamente del catálogo conversacional</li>
        <li>Si un cliente pide algo fuera del catálogo, escala a humano</li>
      </ul>

      <div class="tip"><strong>Cuándo elegir tienda:</strong> productos físicos con envío, stock limitado, precios fijos, y cobro <em>antes</em> de la entrega. Si cobrás contra entrega o tu producto es <em>servicios</em>, mirá las guías de Marketing o Profesional.</div>
    </div>
  </article>

  <article class="step-card">
    <div class="step-head">
      <div class="step-num">2</div>
      <div class="step-meta">
        <div class="step-tag">Cambiar identidad</div>
        <h2 class="step-title">Activá el modo Tienda en tu Configuración</h2>
      </div>
    </div>
    <div class="step-body">
      <p>El bot empieza siendo Casino por default. Para cambiarlo a Tienda andá a tu Configuración (o desde el panel del cliente si sos sub-tenant) y buscá el bloque <strong>Identidad del negocio</strong>:</p>

      <div class="mockup web">
        <div class="browser-bar">
          <div class="browser-dots"><span></span><span></span><span></span></div>
          <div class="browser-url">app.innovate-ia.com/configuracion</div>
        </div>
        <div class="ia-panel">
          <p class="ia-tag">Identidad del negocio</p>
          <h4 class="ia-h4">¿Qué tipo de negocio sos?</h4>
          <p style="color: var(--muted); font-size: 13px; margin: 4px 0 14px;">Esta elección define cómo se comporta el bot.</p>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
            <div style="padding: 14px; border: 1px solid var(--border); border-radius: 10px; opacity: 0.6;">
              <p style="font-weight: 700; margin: 0 0 4px;">🎰 Casino</p>
              <p style="font-size: 12px; color: var(--muted); margin: 0;">Plataforma con saldo</p>
            </div>
            <div style="padding: 14px; border: 2px solid ${ACCENT}; border-radius: 10px; background: rgba(59,130,246,0.05);">
              <p style="font-weight: 700; margin: 0 0 4px; color: ${ACCENT};">🛒 Tienda ✓</p>
              <p style="font-size: 12px; color: var(--muted); margin: 0;">Productos con envío</p>
            </div>
            <div style="padding: 14px; border: 1px solid var(--border); border-radius: 10px; opacity: 0.6;">
              <p style="font-weight: 700; margin: 0 0 4px;">📣 Marketing</p>
              <p style="font-size: 12px; color: var(--muted); margin: 0;">Captación leads</p>
            </div>
            <div style="padding: 14px; border: 1px solid var(--border); border-radius: 10px; opacity: 0.6;">
              <p style="font-weight: 700; margin: 0 0 4px;">👔 Profesional</p>
              <p style="font-size: 12px; color: var(--muted); margin: 0;">Servicios profesionales</p>
            </div>
          </div>
        </div>
      </div>

      <p style="margin-top: 14px;">Al confirmar te pide tipear el <strong>nombre exacto de tu negocio</strong> (estilo GitHub) — esto evita cambios accidentales que reemplacen el bot operativo de un cliente real.</p>

      <div class="tip"><strong>Cambio en caliente:</strong> el switch es inmediato. El próximo mensaje que llegue al WhatsApp ya entra al flujo Tienda. Tu Casino, Marketing o lo que tenías antes queda apagado para ese número.</div>
    </div>
  </article>

  <article class="step-card">
    <div class="step-head">
      <div class="step-num">3</div>
      <div class="step-meta">
        <div class="step-tag">Catálogo</div>
        <h2 class="step-title">Cargá tus productos en el panel</h2>
      </div>
    </div>
    <div class="step-body">
      <p>Una vez que cambiaste a Tienda, te aparece el bloque <strong>Productos</strong> en tu Configuración. Cada producto tiene 6 datos: nombre, descripción corta, precio en pesos, imagen, stock y orden.</p>

      <div class="mockup web">
        <div class="browser-bar">
          <div class="browser-dots"><span></span><span></span><span></span></div>
          <div class="browser-url">app.innovate-ia.com/configuracion</div>
        </div>
        <div class="ia-panel">
          <p class="ia-tag">Productos</p>
          <h4 class="ia-h4">🛒 Catálogo de tu tienda</h4>
          <div style="display: flex; gap: 10px; padding: 12px; border: 1px solid var(--border); border-radius: 10px; margin-top: 12px;">
            <div style="width: 60px; height: 60px; background: rgba(59,130,246,0.1); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 24px;">🧴</div>
            <div style="flex: 1;">
              <p style="font-weight: 700; margin: 0 0 2px;">Crema hidratante 250ml</p>
              <p style="font-size: 12px; color: var(--muted); margin: 0 0 4px;">Para piel sensible — base agua</p>
              <p style="font-size: 13px; color: ${ACCENT}; font-weight: 700; margin: 0;">$8.500 · Stock: 24</p>
            </div>
            <button style="background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.25); color: ${ACCENT}; padding: 4px 10px; border-radius: 6px; font-size: 11px; align-self: flex-start;">Editar</button>
          </div>
        </div>
      </div>

      <p style="margin-top: 14px;"><strong>Sobre el stock:</strong></p>
      <ul style="margin: 10px 0 16px 22px; color: var(--muted); line-height: 1.8;">
        <li><strong>Vacío</strong> = stock ilimitado (servicios, productos digitales). El bot nunca dice "agotado".</li>
        <li><strong>Número &gt; 0</strong> = stock real. Cada venta confirmada lo descuenta automáticamente.</li>
        <li><strong>0</strong> = agotado. El bot lo esconde del catálogo conversacional hasta que repongas.</li>
      </ul>

      <div class="tip"><strong>Imagen:</strong> se sube al storage de Supabase (bucket público <code>products</code>). Aparece tanto en tu landing pública como en algunos canales del bot. Mantenelas a 1080×1080 mínimo.</div>
    </div>
  </article>

  <article class="step-card">
    <div class="step-head">
      <div class="step-num">4</div>
      <div class="step-meta">
        <div class="step-tag">Conversación tipo</div>
        <h2 class="step-title">Cómo le habla el bot al cliente</h2>
      </div>
    </div>
    <div class="step-body">
      <p>El bot Tienda <em>nunca</em> dice "soy un bot". Habla en primera persona como si fuera un vendedor del local. Estos son ejemplos reales de cómo se comporta:</p>

      <div class="chat-mockup" style="max-width: 480px; margin: 16px auto;">
        <div style="background: #efe7dd; padding: 16px; border-radius: 12px;">
          <div style="background: white; padding: 8px 12px; border-radius: 10px 10px 10px 2px; max-width: 85%; margin-bottom: 8px; font-size: 13px;">Hola, tienen crema para piel sensible?</div>
          <div style="background: #d9fdd3; padding: 8px 12px; border-radius: 10px 10px 2px 10px; max-width: 85%; margin: 0 0 8px auto; font-size: 13px; text-align: right;">Hola! Sí, tenemos la <strong>Crema hidratante 250ml</strong> a $8.500. Es base agua, ideal para piel sensible 🙌</div>
          <div style="background: white; padding: 8px 12px; border-radius: 10px 10px 10px 2px; max-width: 85%; margin-bottom: 8px; font-size: 13px;">dale, quiero 2</div>
          <div style="background: #d9fdd3; padding: 8px 12px; border-radius: 10px 10px 2px 10px; max-width: 85%; margin: 0 0 8px auto; font-size: 13px; text-align: right;">Genial! Para coordinar el envío necesito tu nombre completo, dirección y ciudad 📦</div>
          <div style="background: white; padding: 8px 12px; border-radius: 10px 10px 10px 2px; max-width: 85%; margin-bottom: 8px; font-size: 13px;">María Pérez, Av. Corrientes 1234, CABA</div>
          <div style="background: #d9fdd3; padding: 8px 12px; border-radius: 10px 10px 2px 10px; max-width: 85%; margin: 0 0 8px auto; font-size: 13px; text-align: right;">Anotado!<br>• Crema hidratante 250ml x2 — $17.000<br><br>💰 Total: $17.000<br><br>🔗 Link de pago:<br>mpago.la/abc123<br><br>Una vez que veamos el pago acreditado te avisamos 🙌</div>
        </div>
      </div>

      <p style="margin-top: 14px;"><strong>Reglas que sigue el bot por default:</strong></p>
      <ul style="margin: 10px 0 16px 22px; color: var(--muted); line-height: 1.8;">
        <li>Máximo 4 líneas por mensaje (la gente no lee párrafos largos en WhatsApp)</li>
        <li>Solo recomienda productos que están en el catálogo activo (no inventa)</li>
        <li>Si pide algo que no tenés, escala a operador en lugar de inventar</li>
        <li>No genera el link hasta tener nombre + dirección + ciudad</li>
        <li>Después del link confirma "te avisamos cuando se acredite" y se queda esperando</li>
      </ul>

      <div class="tip"><strong>Multi-producto:</strong> el bot maneja pedidos con varios ítems. "quiero 2 cremas y 1 protector" funciona y arma un pedido único con el total sumado.</div>
    </div>
  </article>

  <article class="step-card">
    <div class="step-head">
      <div class="step-num">5</div>
      <div class="step-meta">
        <div class="step-tag">Flujo del cobro</div>
        <h2 class="step-title">De "quiero comprar" a "pago acreditado" — paso a paso</h2>
      </div>
    </div>
    <div class="step-body">
      <p>Lo que pasa por debajo cuando el cliente confirma la compra:</p>

      <ol style="margin: 14px 0 18px 22px; color: var(--text); line-height: 1.85;">
        <li><strong>El bot arma el pedido</strong> (ítems, cantidades, dirección) y lo guarda como <em>cart pendiente</em> en la base de datos.</li>
        <li><strong>Genera la preferencia de Mercado Pago</strong> con tu token de billetera. La referencia incluye el ID del cart para poder identificar la venta cuando MP confirme.</li>
        <li><strong>Manda el link al cliente</strong>. El cart vence en 2 horas — si no paga, queda como abandonado.</li>
        <li><strong>El cliente paga</strong>. MP llama a nuestro webhook con el pago aprobado.</li>
        <li><strong>El sistema reconoce que es identidad Tienda</strong> (no Casino) y registra la venta en tu panel <code>/pedidos</code> con todos los datos: productos, dirección, monto, ID de pago.</li>
        <li><strong>Descuenta stock</strong> de cada producto vendido (si tenían stock numérico).</li>
        <li><strong>Te llega un push en el panel</strong> con el pedido nuevo, listo para preparar el envío.</li>
        <li><strong>El bot le confirma al cliente</strong> por WhatsApp: "✅ ¡Pago recibido!" con el resumen del pedido.</li>
      </ol>

      <div class="tip"><strong>Lo que NO tocás:</strong> nada de esto requiere que vos intervengas. El bot trabaja punta a punta. Vos solo entrás al panel <code>/pedidos</code> cuando ves la notificación, marcás "entregado" cuando despachaste, y listo.</div>
    </div>
  </article>

  <article class="step-card">
    <div class="step-head">
      <div class="step-num">6</div>
      <div class="step-meta">
        <div class="step-tag">Panel de Pedidos</div>
        <h2 class="step-title">Cómo gestionar los pedidos del día</h2>
      </div>
    </div>
    <div class="step-body">
      <p>Cuando tenés identidad Tienda activa, te aparece <strong>📦 Pedidos</strong> en el menú lateral. Tres tabs:</p>

      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 16px 0;">
        <div style="padding: 14px; background: rgba(34,197,94,0.05); border: 1px solid rgba(34,197,94,0.2); border-radius: 10px;">
          <p style="font-weight: 700; color: #22c55e; margin: 0 0 4px;">Pagados</p>
          <p style="font-size: 12px; color: var(--muted); margin: 0;">Pedidos con el dinero acreditado, esperando que los despaches.</p>
        </div>
        <div style="padding: 14px; background: rgba(212,168,67,0.05); border: 1px solid rgba(212,168,67,0.2); border-radius: 10px;">
          <p style="font-weight: 700; color: #D4A843; margin: 0 0 4px;">Pendientes</p>
          <p style="font-size: 12px; color: var(--muted); margin: 0;">Cliente armó el pedido pero todavía no pagó. Pueden recuperarse.</p>
        </div>
        <div style="padding: 14px; background: rgba(78,81,104,0.08); border: 1px solid var(--border); border-radius: 10px;">
          <p style="font-weight: 700; color: var(--muted); margin: 0 0 4px;">Histórico</p>
          <p style="font-size: 12px; color: var(--muted); margin: 0;">Ya entregados o cancelados. Solo lectura.</p>
        </div>
      </div>

      <p style="margin-top: 14px;"><strong>Cada tarjeta de pedido te muestra:</strong></p>
      <ul style="margin: 10px 0 16px 22px; color: var(--muted); line-height: 1.8;">
        <li>Nombre + WhatsApp del cliente (botón directo para escribirle)</li>
        <li>Dirección completa, ciudad, código postal, notas</li>
        <li>Listado de productos con cantidades y subtotales</li>
        <li>Total, ID de pago de MP (verificable en tu cuenta), fecha del pago</li>
        <li>Botones <strong>Marcar entregado</strong> y <strong>Cancelar</strong> (con motivo)</li>
      </ul>

      <p style="margin-top: 14px;">El panel se actualiza en <strong>tiempo real</strong> vía Supabase Realtime — no hace falta refrescar. Mientras estés mirando esa página, los pedidos nuevos aparecen solos.</p>

      <div class="tip"><strong>Cancelar:</strong> si necesitás cancelar un pedido pagado (ej: te quedaste sin stock real), el panel guarda el motivo y queda registrado. La devolución de plata la hacés vos en MP — el sistema no toca el dinero del cliente.</div>
    </div>
  </article>

  <article class="step-card">
    <div class="step-head">
      <div class="step-num">7</div>
      <div class="step-meta">
        <div class="step-tag">Cuándo escala a humano</div>
        <h2 class="step-title">Lo que el bot Tienda NO resuelve solo</h2>
      </div>
    </div>
    <div class="step-body">
      <p>El bot está diseñado para escalar antes de inventar. Estos son los disparadores típicos:</p>

      <ul style="margin: 14px 0 18px 22px; color: var(--text); line-height: 1.8;">
        <li><strong>Pregunta por un producto que no está en catálogo</strong> — el bot dice "lo voy a consultar" y avisa al panel.</li>
        <li><strong>Pide envío a una zona rara</strong> (ej: "mandás a Tierra del Fuego?") — escala porque vos sabés mejor qué te conviene.</li>
        <li><strong>Reclamo o queja</strong> — palabras como "no me llegó", "está roto", "quiero devolver" siempre van a humano.</li>
        <li><strong>Cliente pregunta detalles técnicos profundos</strong> ("este producto tiene parabenos?") que no estén en la descripción.</li>
        <li><strong>Pago con error</strong> — si MP rechaza la tarjeta más de una vez, el bot escala para que vos lo asistas.</li>
      </ul>

      <p>Cuando escala, en el panel ves la conversación con un banner amarillo "🚨 escalado", y podés tomarla desde la pestaña <em>Chats</em>.</p>

      <div class="tip"><strong>Estadística real:</strong> en tiendas con catálogo bien cargado y descripciones claras, ~85% de las consultas las cierra el bot solo. El 15% restante son las que tienen valor humano.</div>
    </div>
  </article>

  <article class="step-card">
    <div class="step-head">
      <div class="step-num">8</div>
      <div class="step-meta">
        <div class="step-tag">Métricas y costos</div>
        <h2 class="step-title">Qué mirar y cuánto te cuesta</h2>
      </div>
    </div>
    <div class="step-body">
      <p><strong>Costos:</strong> 1 crédito = 1 día de bot. No importa cuántos pedidos haga ese día — el costo es por día activo. Mensajes ilimitados, productos ilimitados (dentro del plan).</p>

      <p style="margin-top: 14px;"><strong>Métricas que te conviene mirar todas las semanas (en Analytics):</strong></p>
      <ul style="margin: 10px 0 16px 22px; color: var(--muted); line-height: 1.8;">
        <li><strong>Conversión:</strong> de cada 100 conversaciones nuevas, ¿cuántas terminaron en venta?</li>
        <li><strong>Carts abandonados:</strong> pedidos que llegaron al link pero no pagaron — son tu mayor oportunidad de remarketing.</li>
        <li><strong>Producto más vendido:</strong> el catálogo se ordena solo por ventas, así sabés qué empujar.</li>
        <li><strong>Ticket promedio:</strong> útil para saber si los clientes compran de a 1 ítem o varios.</li>
      </ul>

      <div class="tip"><strong>Próximos pasos:</strong> una vez que esté funcionando, en la guía de <em>Negocio · Tienda</em> te explicamos cómo conectar Pixel + CAPI para mandarle a Meta los eventos de Compra y empezar a hacer ads optimizados a conversión real.</div>

      <p style="margin-top: 18px;">¿Algo no encaja con tu operación o te trabaste? <a href="mailto:${SUPPORT_EMAIL}" style="color: ${ACCENT}; text-decoration: underline;">Escribinos a ${SUPPORT_EMAIL}</a> y te ayudamos a configurarlo.</p>
    </div>
  </article>
</div>
`

export default function InstruccionesAgenteBotTienda() {
  return (
    <AgenteTutorialLayout
      accent={ACCENT}
      backTo="agente"
      breadcrumb="Instrucciones / Agente / Tienda"
      bodyHtml={BODY_HTML}
    />
  )
}
