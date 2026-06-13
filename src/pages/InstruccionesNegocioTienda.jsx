import NegocioTutorialLayout from './_NegocioTutorialLayout'
import { SUPPORT_EMAIL } from '../lib/constants'

const ACCENT = '#3b82f6'

const BODY_HTML = `
<div class="container">
  <header class="head">
    <div class="chip" style="background: rgba(59,130,246,0.08); border-color: rgba(59,130,246,0.3); color: ${ACCENT};">Tour guiado · Negocio Tienda</div>
    <h1>Conectá tu tienda — <span style="color:${ACCENT};">qué necesitás cargar para que el bot venda solo</span></h1>
    <p>Esta guía te explica todo lo que hay que configurar del lado del <em>negocio</em> para que el bot Tienda funcione: catálogo, billetera, datos de envío, Pixel para anuncios. Si querés saber cómo conversa el bot, mirá la guía de <em>Agente · Tienda</em>.</p>
    <div class="meta">
      <span>⏱ <strong>15–25 minutos</strong></span>
      <span>📦 <strong>Productos físicos</strong></span>
      <span>💳 <strong>Cobro con MP</strong></span>
      <span>📊 <strong>Pixel + CAPI</strong></span>
    </div>
  </header>

  <article class="step-card">
    <div class="step-head">
      <div class="step-num">1</div>
      <div class="step-meta">
        <div class="step-tag">¿Mi negocio encaja?</div>
        <h2 class="step-title">Para qué tipo de tienda funciona</h2>
      </div>
    </div>
    <div class="step-body">
      <p>El modo Tienda está pensado para negocios que venden <strong>productos físicos con envío</strong> y donde el cobro va <em>antes</em> del envío. La integración no requiere un e-commerce previo: el catálogo lo cargás directo en nuestro panel.</p>

      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin: 16px 0;">
        <div style="padding: 14px; background: rgba(34,197,94,0.05); border: 1px solid rgba(34,197,94,0.25); border-radius: 10px;">
          <p style="font-size: 13px; color: #22c55e; font-weight: 700; margin: 0 0 6px;">✅ Encaja</p>
          <p style="font-size: 12.5px; color: var(--text); line-height: 1.6; margin: 0;">Indumentaria, cosmética, productos para mascotas, suplementos, accesorios, electrónica chica, deco, productos artesanales, bazar, mercería, librería.</p>
        </div>
        <div style="padding: 14px; background: rgba(239,68,68,0.05); border: 1px solid rgba(239,68,68,0.25); border-radius: 10px;">
          <p style="font-size: 13px; color: #ef4444; font-weight: 700; margin: 0 0 6px;">❌ No encaja</p>
          <p style="font-size: 12.5px; color: var(--text); line-height: 1.6; margin: 0;">Servicios profesionales (mirá Profesional), cobros recurrentes con suscripción, productos B2B con cotización, ventas con financiación a meses.</p>
        </div>
      </div>

      <div class="tip"><strong>Casos límite:</strong> si vendés productos digitales (cursos, e-books) — encaja, pero seteá el stock como ilimitado y la dirección como opcional. Si vendés con contra-reembolso — el modo Tienda no fuerza cobro previo, pero las stats están pensadas para "pago confirmado", así que vas a tener que medir distinto.</div>
    </div>
  </article>

  <article class="step-card">
    <div class="step-head">
      <div class="step-num">2</div>
      <div class="step-meta">
        <div class="step-tag">Configuración inicial</div>
        <h2 class="step-title">Los 3 datos imprescindibles del negocio</h2>
      </div>
    </div>
    <div class="step-body">
      <p>Para empezar a vender, necesitás cargar 3 cosas en <code>Configuración → Identidad del negocio</code>:</p>

      <ol style="margin: 14px 0 18px 22px; color: var(--text); line-height: 1.85;">
        <li><strong>Identidad = Tienda.</strong> Activación con confirmación tipo GitHub.</li>
        <li><strong>Nombre del negocio</strong> + <strong>URL pública</strong> (si tenés una landing — la podés generar con nuestro builder).</li>
        <li><strong>Token de Mercado Pago</strong> (Access Token de tu cuenta — andá a la guía de <em>Billeteras → Mercado Pago</em> para conseguirlo).</li>
      </ol>

      <p>Con esos 3 datos el bot ya puede vender. El resto (productos, Pixel, datos de envío) los cargás después.</p>

      <div class="tip"><strong>Sin CUIT ni cuenta de empresa:</strong> el token de MP que usás es el de tu cuenta personal. Lo único que recomendamos es no mezclarlo con tu cuenta personal real — abrí una segunda cuenta MP con el DNI dedicada al negocio si vas a manejar volumen.</div>
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
      <p>Una vez activada la identidad Tienda, te aparece el bloque <strong>Productos</strong>. Cada producto tiene 6 datos:</p>

      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin: 16px 0;">
        <div style="padding: 12px; border: 1px solid var(--border); border-radius: 8px;">
          <p style="font-weight: 700; font-size: 13px; margin: 0 0 4px;">Nombre</p>
          <p style="font-size: 12px; color: var(--muted); margin: 0;">Como aparece en la conversación. Cortito y claro.</p>
        </div>
        <div style="padding: 12px; border: 1px solid var(--border); border-radius: 8px;">
          <p style="font-weight: 700; font-size: 13px; margin: 0 0 4px;">Descripción</p>
          <p style="font-size: 12px; color: var(--muted); margin: 0;">1-2 líneas. El bot la usa para responder "contame más".</p>
        </div>
        <div style="padding: 12px; border: 1px solid var(--border); border-radius: 8px;">
          <p style="font-weight: 700; font-size: 13px; margin: 0 0 4px;">Precio (ARS)</p>
          <p style="font-size: 12px; color: var(--muted); margin: 0;">Solo número entero. El bot lo formatea con punto de miles.</p>
        </div>
        <div style="padding: 12px; border: 1px solid var(--border); border-radius: 8px;">
          <p style="font-weight: 700; font-size: 13px; margin: 0 0 4px;">Imagen</p>
          <p style="font-size: 12px; color: var(--muted); margin: 0;">Aparece en tu landing pública. 1080×1080 recomendado.</p>
        </div>
        <div style="padding: 12px; border: 1px solid var(--border); border-radius: 8px;">
          <p style="font-weight: 700; font-size: 13px; margin: 0 0 4px;">Stock</p>
          <p style="font-size: 12px; color: var(--muted); margin: 0;">Vacío = ilimitado. 0 = agotado. N = stock real, descuenta solo.</p>
        </div>
        <div style="padding: 12px; border: 1px solid var(--border); border-radius: 8px;">
          <p style="font-weight: 700; font-size: 13px; margin: 0 0 4px;">Orden (sort)</p>
          <p style="font-size: 12px; color: var(--muted); margin: 0;">Cómo se priorizan en la landing. Más bajo aparece primero.</p>
        </div>
      </div>

      <div class="tip"><strong>Recomendación:</strong> empezá con 5–10 productos bien cargados (descripción real, foto buena) antes de subir todo el catálogo. Es más fácil refinar lo que ya funciona que cargar 200 SKUs apurados.</div>
    </div>
  </article>

  <article class="step-card">
    <div class="step-head">
      <div class="step-num">4</div>
      <div class="step-meta">
        <div class="step-tag">Datos de envío</div>
        <h2 class="step-title">Configurá tu zona de cobertura</h2>
      </div>
    </div>
    <div class="step-body">
      <p>El bot pide al cliente <strong>nombre + dirección + ciudad</strong>. La gestión del envío en sí queda por tu cuenta (cotización, embalaje, etiquetado), pero el bot puede negociar el escalado si el pedido cae fuera de tu zona habitual.</p>

      <p style="margin-top: 14px;">En <code>Configuración → Información del negocio</code> podés cargar tu zona de cobertura como texto libre. El bot lo usa como contexto cuando el cliente pregunta "¿hacen envíos a X?":</p>

      <div class="mockup web">
        <div class="browser-bar">
          <div class="browser-dots"><span></span><span></span><span></span></div>
          <div class="browser-url">app.innovate-ia.com/configuracion</div>
        </div>
        <div class="ia-panel">
          <p class="ia-tag">Zona de cobertura</p>
          <textarea readonly style="width: 100%; min-height: 80px; background: var(--bg); border: 1px solid var(--border); border-radius: 6px; padding: 10px; font-family: inherit; font-size: 13px; color: var(--text); resize: none;">Hacemos envíos a CABA y GBA por moto (24-48hs). Al interior por OCA o Correo Argentino (3-7 días hábiles). El costo lo coordinamos según destino y peso.</textarea>
        </div>
      </div>

      <p style="margin-top: 14px;">El bot <strong>no calcula el costo de envío automáticamente</strong> — eso lo coordinás vos por chat con cada cliente, porque depende mucho de cada caso. Si querés que el cobro incluya un envío fijo, podés sumarlo al precio del producto.</p>

      <div class="tip"><strong>Hack útil:</strong> creá un "producto" llamado "Costo de envío" sin imagen, sin stock, con precio variable según zona. El bot lo puede sumar al pedido cuando el cliente confirma destino. Roadmap: en una próxima versión vamos a tener tabla de envíos por código postal nativa.</div>
    </div>
  </article>

  <article class="step-card">
    <div class="step-head">
      <div class="step-num">5</div>
      <div class="step-meta">
        <div class="step-tag">Por qué importa</div>
        <h2 class="step-title">Sin Pixel, Meta no sabe quién compra</h2>
      </div>
    </div>
    <div class="step-body">
      <p>Una vez que tengas la tienda funcionando, el siguiente paso es conectar el <strong>Pixel de Meta + CAPI</strong> para que cuando hagas anuncios en Instagram/Facebook, Meta sepa exactamente quién compró. Sin esto, los anuncios optimizan a "click" en vez de a "venta real".</p>

      <p style="margin-top: 14px;"><strong>Eventos que el bot manda automáticamente a Meta:</strong></p>

      <ul style="margin: 10px 0 16px 22px; color: var(--muted); line-height: 1.8;">
        <li><code>InitiateCheckout</code> — cuando el cliente recibe el link de pago.</li>
        <li><code>Purchase</code> — cuando MP confirma el pago. Incluye el monto exacto y los productos.</li>
      </ul>

      <p>Estos eventos son los que Meta usa para entrenar el algoritmo de tus campañas. Con 30+ Purchases por semana, el algoritmo empieza a optimizar bien.</p>

      <div class="tip"><strong>Setup detallado:</strong> los pasos para conseguir tu Pixel ID, Access Token y Test Event Code están en la guía de <em>Negocio · Casino</em> (los pasos son idénticos para Tienda — el tipo de evento es lo único que cambia, y eso lo manejamos nosotros).</div>
    </div>
  </article>

  <article class="step-card">
    <div class="step-head">
      <div class="step-num">6</div>
      <div class="step-meta">
        <div class="step-tag">Landing pública</div>
        <h2 class="step-title">Generá una landing con tu catálogo</h2>
      </div>
    </div>
    <div class="step-body">
      <p>Si querés tener una página pública para mostrar tu catálogo (útil para mandar el link a Instagram, Google, etc.), tenemos un <strong>Landing Builder</strong> que genera una página con tus productos automáticamente.</p>

      <p style="margin-top: 14px;">Andá a <code>Landing Pages → Crear nueva</code>, elegí la opción <em>Tienda con catálogo</em>, y la página se arma sola con los productos activos. Cada vez que agregás o sacás productos del catálogo, la landing se actualiza automáticamente.</p>

      <div class="tip"><strong>SEO básico:</strong> la landing usa el nombre y la descripción de tu negocio para los meta tags. Cuanto más descriptivo sea tu nombre y tagline, mejor te indexa Google.</div>

      <p style="margin-top: 14px;">El URL de la landing es <code>https://app.innovate-ia.com/landing/&lt;tu-slug&gt;</code> — y desde ahí cada producto tiene un botón "Comprar por WhatsApp" que abre tu chat con un mensaje pre-armado tipo "Hola, quiero comprar X".</p>
    </div>
  </article>

  <article class="step-card">
    <div class="step-head">
      <div class="step-num">7</div>
      <div class="step-meta">
        <div class="step-tag">Operación diaria</div>
        <h2 class="step-title">Cómo se ve tu día con la tienda activa</h2>
      </div>
    </div>
    <div class="step-body">
      <p>Una vez que está todo configurado, tu día típico es así:</p>

      <ol style="margin: 14px 0 18px 22px; color: var(--text); line-height: 1.85;">
        <li><strong>Abrís el panel a la mañana</strong> y revisás <code>/pedidos</code> en el tab "Pagados". Cada pedido nuevo es uno listo para preparar.</li>
        <li><strong>Preparás los envíos</strong>, marcás "Entregado" en cada pedido apenas lo despachás. El cliente queda registrado.</li>
        <li><strong>Si tenés algún error en stock</strong> (pedido con producto que no podés mandar), cancelás con motivo y devolvés la plata desde tu cuenta MP.</li>
        <li><strong>Mientras tanto el bot vende solo</strong>. Vos solo entrás a <code>/chats</code> si te llega notificación de escalado (cliente pidiendo algo raro o queja).</li>
      </ol>

      <div class="tip"><strong>Volumen esperado:</strong> tiendas chicas con catálogo bien armado cierran ~10–30 ventas por día con el bot. La tasa de conversión bot → venta suele estar entre 12% y 25% de las consultas que entran. Si tu producto requiere mucha persuasión humana, esos números bajan.</div>

      <p style="margin-top: 18px;">¿Listo para probar? Activá la identidad Tienda y cargá los primeros 5 productos. Si te trabás, <a href="mailto:${SUPPORT_EMAIL}" style="color: ${ACCENT}; text-decoration: underline;">escribinos a ${SUPPORT_EMAIL}</a>.</p>
    </div>
  </article>
</div>
`

export default function InstruccionesNegocioTienda() {
  return (
    <NegocioTutorialLayout
      accent={ACCENT}
      backTo="negocio"
      breadcrumb="Instrucciones / Negocio / Tienda"
      bodyHtml={BODY_HTML}
    />
  )
}
