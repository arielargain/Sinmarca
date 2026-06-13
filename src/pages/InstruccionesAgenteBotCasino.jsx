import AgenteTutorialLayout from './_AgenteTutorialLayout'
import { SUPPORT_EMAIL } from '../lib/constants'

const ACCENT = '#D4A843' // Gold de marca

const BODY_HTML = `
<div class="container">
  <header class="head">
    <div class="chip" style="background: rgba(212,168,67,0.08); border-color: rgba(212,168,67,0.3); color: ${ACCENT};">Tour guiado · Agente IA</div>
    <h1>Tu agente, paso a paso — <span style="color:${ACCENT};">cómo configurarlo, qué puede hacer, dónde tiene límites</span></h1>
    <p>Una guía honesta de lo que vas a operar todos los días. Capturas reales del panel, números reales de conversión, y lo que el bot puede y no puede hacer. Antes de tocar el remarketing, leé las condiciones de garantía.</p>
    <div class="meta">
      <span>⏱ <strong>20–25 minutos</strong></span>
      <span>🤖 <strong>24/7 sin descansos</strong></span>
      <span>⚡ <strong>~3s por respuesta</strong></span>
      <span>💰 <strong>1 crédito = 1 día</strong></span>
    </div>
  </header>

  <!-- ═══════════════════════════════════════════════════════════════ -->
  <!-- PASO 1 — Conocé tu agente -->
  <!-- ═══════════════════════════════════════════════════════════════ -->
  <article class="step-card">
    <div class="step-head">
      <div class="step-num">1</div>
      <div class="step-meta">
        <div class="step-tag">Quién es tu agente</div>
        <h2 class="step-title">Conocé a tu agente IA antes de configurarlo</h2>
      </div>
    </div>
    <div class="step-body">
      <p>Tu agente es un asistente conversacional que atiende WhatsApp 24/7 en tu nombre. Toma órdenes de carga, crea cuentas en tu plataforma, genera links de cobro, acredita saldo cuando el cliente paga, y escala a un humano cuando no puede resolver algo solo.</p>

      <p style="margin-top: 16px;"><strong>Lo que hace bien (probado con clientes reales):</strong></p>
      <ul style="margin: 10px 0 16px 22px; color: var(--muted); line-height: 1.8;">
        <li>Atiende clientes en español argentino, sin pausas, sin errores de tipeo</li>
        <li>Crea usuarios en tu casino/negocio automáticamente (con DNI o email)</li>
        <li>Genera links de Mercado Pago / Ualá / MODO / Lemon / Belo en menos de 4 segundos</li>
        <li>Detecta el pago aprobado y acredita el saldo solo, sin que toques nada</li>
        <li>Si un cliente lleva 24h sin pagar, le manda un recordatorio (remarketing — ver paso 6)</li>
        <li>Cuando algo se sale del libreto, escala a un operador humano</li>
      </ul>

      <p><strong>Lo que NO hace (y conviene que lo sepas):</strong></p>
      <ul style="margin: 10px 0 16px 22px; color: var(--muted); line-height: 1.8;">
        <li>No procesa retiros — siempre escala a operador (esto es feature, protege contra fraude)</li>
        <li>No improvisa promociones que vos no le dijiste</li>
        <li>No promete plazos ni montos que no estén configurados</li>
        <li>No reemplaza atención humana cuando un cliente se queja fuerte — escala</li>
      </ul>

      <div class="tip"><strong>Costo:</strong> 1 crédito = 1 día de bot operativo (mensajes ilimitados ese día). Mientras tu balance tenga créditos, el bot está prendido. La activación la hace tu operador desde el panel admin.</div>
    </div>
  </article>

  <!-- ═══════════════════════════════════════════════════════════════ -->
  <!-- PASO 2 — Personalidad y voz -->
  <!-- ═══════════════════════════════════════════════════════════════ -->
  <article class="step-card">
    <div class="step-head">
      <div class="step-num">2</div>
      <div class="step-meta">
        <div class="step-tag">Personalidad y voz</div>
        <h2 class="step-title">Configurá cómo le habla el bot a tus clientes</h2>
      </div>
    </div>
    <div class="step-body">
      <p>El bot adapta su tono según lo que elijas. La idea es que suene como vos, no como un robot genérico. Andá a <code>Agente IA → Personalidad del bot</code>:</p>

      <div class="mockup web">
        <div class="browser-bar">
          <div class="browser-dots"><span></span><span></span><span></span></div>
          <div class="browser-url">app.innovate-ia.com/agente-ia</div>
        </div>
        <div class="ia-panel">
          <div class="ia-panel-h">
            <p class="ia-tag">Cómo le habla al cliente</p>
            <h4 class="ia-h4">🤖 Personalidad del bot</h4>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
            <div class="ia-field">
              <p class="ia-field-label">Tono</p>
              <div class="ia-input-wrap">
                <input class="ia-input" value="Amigable" readonly />
                <span style="color: #4E5168; font-size: 11px;">▼</span>
              </div>
              <p class="ia-help">Amigable / Profesional / Casual / Formal</p>
            </div>
            <div class="ia-field">
              <p class="ia-field-label">Idioma</p>
              <div class="ia-input-wrap">
                <input class="ia-input" value="es-AR" readonly />
              </div>
              <p class="ia-help">Castellano rioplatense por defecto</p>
            </div>
          </div>

          <div class="ia-field" style="margin-top: 6px;">
            <p class="ia-field-label">Bono de bienvenida (%)</p>
            <div class="ia-input-wrap" style="max-width: 140px;">
              <input class="ia-input" value="50" readonly />
            </div>
            <p class="ia-help">Lo menciona el bot cuando llega un cliente nuevo</p>
          </div>
        </div>
      </div>

      <p><strong>Cómo elegir el tono:</strong></p>
      <ul style="margin: 10px 0 16px 22px; color: var(--muted); line-height: 1.8;">
        <li><strong style="color: var(--text);">Amigable</strong> — el más usado. "¡Hola! Te paso los datos para que cargues..."</li>
        <li><strong style="color: var(--text);">Profesional</strong> — para públicos formales. "Buenas tardes. Le envío..."</li>
        <li><strong style="color: var(--text);">Casual</strong> — bien argentino. "Buena, te tiro los datos y arrancamos"</li>
        <li><strong style="color: var(--text);">Formal</strong> — para B2B o públicos mayores. Usa "usted"</li>
      </ul>

      <div class="tip"><strong>Probá los 4 tonos durante una semana cada uno</strong> y mirá las métricas. La diferencia de conversión entre "amigable" y "formal" puede ser de un 8-12% según tu rubro.</div>
    </div>
  </article>

  <!-- ═══════════════════════════════════════════════════════════════ -->
  <!-- PASO 3 — Mensaje de bienvenida -->
  <!-- ═══════════════════════════════════════════════════════════════ -->
  <article class="step-card">
    <div class="step-head">
      <div class="step-num">3</div>
      <div class="step-meta">
        <div class="step-tag">Mensaje de bienvenida</div>
        <h2 class="step-title">Lo primero que ven 200 personas por día</h2>
      </div>
    </div>
    <div class="step-body">
      <p>El mensaje de bienvenida es el primer texto que recibe un cliente nuevo cuando te escribe. Si está bien escrito, el cliente entiende qué hacés, cómo cobrás y para qué te sirve — todo en una pantalla.</p>

      <p>Andá a <code>Agente IA → Mensajes del bot → Mensaje de bienvenida</code>:</p>

      <div class="mockup web">
        <div class="browser-bar">
          <div class="browser-dots"><span></span><span></span><span></span></div>
          <div class="browser-url">app.innovate-ia.com/agente-ia</div>
        </div>
        <div class="ia-panel">
          <div class="ia-field">
            <p class="ia-field-label">Mensaje de bienvenida</p>
            <div style="background: #111420; border: 1px solid #1e2130; border-radius: 8px; padding: 12px; font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #E9E7E0; line-height: 1.6; white-space: pre-wrap;">¡Hola! 👋 Soy el bot de {casino_name}.

🎰 Cargás con MercadoPago en menos de 2 minutos
🎁 Bono del 50% en tu primera carga
✅ Retiros de 9 a 23hs sin demoras
💰 Mínimo de carga: $2.000

¿Cuánto querés cargar hoy?</div>
            <p class="ia-help">Tip: usá emojis para escanear rápido y placeholders {casino_name} para que se autocomplete</p>
          </div>
        </div>
      </div>

      <p style="margin-top: 18px;"><strong>Lo que ve el cliente en su WhatsApp:</strong></p>

      <!-- WhatsApp bubble preview -->
      <div style="background: #0b141a; padding: 24px 16px; border-radius: 12px; margin: 16px 0;">
        <div style="max-width: 340px; margin: 0 auto;">
          <div style="background: #202c33; border-radius: 8px 8px 8px 0; padding: 10px 12px 8px; color: #e9edef; font-size: 13.5px; line-height: 1.5; box-shadow: 0 1px 0.5px rgba(0,0,0,.13); position: relative;">
            <div style="white-space: pre-wrap;">¡Hola! 👋 Soy el bot de Modo Ahorro.

🎰 Cargás con MercadoPago en menos de 2 minutos
🎁 Bono del 50% en tu primera carga
✅ Retiros de 9 a 23hs sin demoras
💰 Mínimo de carga: $2.000

¿Cuánto querés cargar hoy?</div>
            <div style="text-align: right; font-size: 10.5px; color: #8696a0; margin-top: 4px;">14:23 ✓✓</div>
          </div>
        </div>
      </div>

      <div class="tip"><strong>Plantilla recomendada (probada):</strong> saludo + 1 línea de qué hacés + 3-4 bullets de info clave + pregunta abierta. La pregunta abierta al final aumenta la respuesta del cliente en 35-40%.</div>

      <p style="margin-top: 14px;"><strong>Lo que NO funciona:</strong> mensajes largos sin emojis (la gente los saltea), promesas que no podés cumplir ("retiros instantáneos las 24hs"), o pedir muchos datos al mismo tiempo (DNI + foto + email — el cliente se va).</p>
    </div>
  </article>

  <!-- ═══════════════════════════════════════════════════════════════ -->
  <!-- PASO 4 — Respuestas rápidas -->
  <!-- ═══════════════════════════════════════════════════════════════ -->
  <article class="step-card">
    <div class="step-head">
      <div class="step-num">4</div>
      <div class="step-meta">
        <div class="step-tag">Atajo del operador humano</div>
        <h2 class="step-title">Respuestas rápidas — datos pre-armados a un click</h2>
      </div>
    </div>
    <div class="step-body">
      <p>Cuando un cliente te pide algo que el bot no resuelve solo (mandar el CVU, pasar credenciales de una cuenta nueva, recordar el bono del mes), el operador humano puede mandárselo desde el botón <strong>📋 Datos</strong> del chat con un solo toque.</p>

      <p>Andá a <code>Agente IA → Respuestas rápidas</code> y configurá las que más uses:</p>

      <div class="mockup web">
        <div class="browser-bar">
          <div class="browser-dots"><span></span><span></span><span></span></div>
          <div class="browser-url">app.innovate-ia.com/agente-ia</div>
        </div>
        <div class="ia-panel">
          <div class="ia-field">
            <p class="ia-field-label">💰 Datos de cobranza (CVU / Alias)</p>
            <div style="background: #111420; border: 1px solid #1e2130; border-radius: 8px; padding: 10px 12px; font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #E9E7E0; line-height: 1.6; white-space: pre-wrap;">Banco: Galicia
Titular: Juan Perez
CVU: 0000003100010101010101
Alias: mi.alias.mp</div>
          </div>

          <div class="ia-field">
            <p class="ia-field-label">👤 Plantilla de credenciales</p>
            <div style="background: #111420; border: 1px solid #1e2130; border-radius: 8px; padding: 10px 12px; font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #E9E7E0; line-height: 1.6; white-space: pre-wrap;">👤 Usuario: {usuario}
🔑 Contraseña: {clave}
🔗 Link: {link}</div>
            <p class="ia-help">Los placeholders se llenan automáticamente con la cuenta nueva</p>
          </div>

          <div style="border-top: 1px solid #1e2130; padding-top: 14px; margin-top: 14px;">
            <p style="font-size: 13px; color: #E9E7E0; font-weight: 600; margin-bottom: 10px;">Respuestas libres <span style="color: #4E5168; font-weight: 400;">(2 / 4)</span></p>

            <div style="display: grid; grid-template-columns: 170px 1fr; gap: 8px; margin-bottom: 8px;">
              <div style="background: #111420; border: 1px solid #1e2130; border-radius: 6px; padding: 8px 10px; font-size: 12px; color: #E9E7E0;">Bono semanal</div>
              <div style="background: #111420; border: 1px solid #1e2130; border-radius: 6px; padding: 8px 10px; font-size: 11.5px; color: #4E5168; font-family: 'JetBrains Mono', monospace;">Esta semana: 75% en cargas mayores a $5000...</div>
            </div>
            <div style="display: grid; grid-template-columns: 170px 1fr; gap: 8px;">
              <div style="background: #111420; border: 1px solid #1e2130; border-radius: 6px; padding: 8px 10px; font-size: 12px; color: #E9E7E0;">Horarios</div>
              <div style="background: #111420; border: 1px solid #1e2130; border-radius: 6px; padding: 8px 10px; font-size: 11.5px; color: #4E5168; font-family: 'JetBrains Mono', monospace;">Cargas: 24/7 · Retiros: 9 a 23hs · Soporte: 24/7</div>
            </div>
          </div>
        </div>
      </div>

      <div class="tip"><strong>Por qué importa:</strong> un operador atiende 30-40 chats por hora con respuestas rápidas, contra 12-15 escribiendo a mano. Es el ahorro de tiempo más grande del panel.</div>

      <p style="margin-top: 14px;"><strong>Las que SIEMPRE conviene tener cargadas:</strong> CVU/alias, plantilla de credenciales, bono actual, horarios. Las 4 personalizables las usamos para "¿tienen X juego?", "¿cómo ingreso?", direcciones, info recurrente.</p>
    </div>
  </article>

  <!-- ═══════════════════════════════════════════════════════════════ -->
  <!-- PASO 5 — El flujo automático invisible (la VENTA) -->
  <!-- ═══════════════════════════════════════════════════════════════ -->
  <article class="step-card">
    <div class="step-head">
      <div class="step-num">5</div>
      <div class="step-meta">
        <div class="step-tag">Cómo trabaja el bot solo</div>
        <h2 class="step-title">El flujo automático que no tenés que tocar</h2>
      </div>
    </div>
    <div class="step-body">
      <p>Mientras configurás el resto de la app, el bot está corriendo este flujo solo, en cada conversación. Esto pasa en menos de 12 segundos desde que el cliente escribe el primer mensaje:</p>

      <!-- Flow diagram -->
      <div style="margin: 22px 0; background: var(--surf); border: 1px solid var(--border); border-radius: 14px; padding: 22px;">
        <div style="display: flex; flex-direction: column; gap: 14px;">

          <div style="display: flex; align-items: flex-start; gap: 14px;">
            <div style="flex-shrink: 0; width: 36px; height: 36px; border-radius: 10px; background: rgba(212,168,67,0.15); border: 1px solid rgba(212,168,67,0.4); display: flex; align-items: center; justify-content: center; font-size: 14px;">💬</div>
            <div style="flex: 1;">
              <p style="font-size: 13px; font-weight: 700; color: var(--text); margin-bottom: 3px;">Cliente escribe "hola, quiero cargar 5000"</p>
              <p style="font-size: 12.5px; color: var(--muted);">El bot recibe el mensaje vía WhatsApp Cloud API. Latencia: ~200ms.</p>
            </div>
          </div>

          <div style="margin-left: 17px; height: 14px; border-left: 2px dashed var(--border2);"></div>

          <div style="display: flex; align-items: flex-start; gap: 14px;">
            <div style="flex-shrink: 0; width: 36px; height: 36px; border-radius: 10px; background: rgba(56,189,248,0.15); border: 1px solid rgba(56,189,248,0.4); display: flex; align-items: center; justify-content: center; font-size: 14px;">🧠</div>
            <div style="flex: 1;">
              <p style="font-size: 13px; font-weight: 700; color: var(--text); margin-bottom: 3px;">El bot analiza la intención con Claude Haiku</p>
              <p style="font-size: 12.5px; color: var(--muted);">Detecta: cliente nuevo + intención de carga + monto $5000. Decide: crear cuenta + generar link.</p>
            </div>
          </div>

          <div style="margin-left: 17px; height: 14px; border-left: 2px dashed var(--border2);"></div>

          <div style="display: flex; align-items: flex-start; gap: 14px;">
            <div style="flex-shrink: 0; width: 36px; height: 36px; border-radius: 10px; background: rgba(34,197,94,0.15); border: 1px solid rgba(34,197,94,0.4); display: flex; align-items: center; justify-content: center; font-size: 14px;">🎰</div>
            <div style="flex: 1;">
              <p style="font-size: 13px; font-weight: 700; color: var(--text); margin-bottom: 3px;">Crea la cuenta en tu plataforma vía API</p>
              <p style="font-size: 12.5px; color: var(--muted);">POST a tu endpoint <code>create_user</code>. Recibe usuario + contraseña. Los guarda asociados al chat.</p>
            </div>
          </div>

          <div style="margin-left: 17px; height: 14px; border-left: 2px dashed var(--border2);"></div>

          <div style="display: flex; align-items: flex-start; gap: 14px;">
            <div style="flex-shrink: 0; width: 36px; height: 36px; border-radius: 10px; background: rgba(167,139,250,0.15); border: 1px solid rgba(167,139,250,0.4); display: flex; align-items: center; justify-content: center; font-size: 14px;">💳</div>
            <div style="flex: 1;">
              <p style="font-size: 13px; font-weight: 700; color: var(--text); margin-bottom: 3px;">Genera el link de pago en tu billetera</p>
              <p style="font-size: 12.5px; color: var(--muted);">Llamada a Mercado Pago / Ualá / MODO / Lemon / Belo. Recibe el link único de checkout.</p>
            </div>
          </div>

          <div style="margin-left: 17px; height: 14px; border-left: 2px dashed var(--border2);"></div>

          <div style="display: flex; align-items: flex-start; gap: 14px;">
            <div style="flex-shrink: 0; width: 36px; height: 36px; border-radius: 10px; background: rgba(251,146,60,0.15); border: 1px solid rgba(251,146,60,0.4); display: flex; align-items: center; justify-content: center; font-size: 14px;">📨</div>
            <div style="flex: 1;">
              <p style="font-size: 13px; font-weight: 700; color: var(--text); margin-bottom: 3px;">Manda al cliente: usuario + contraseña + link</p>
              <p style="font-size: 12.5px; color: var(--muted);">Mensaje estructurado, en menos de 4 segundos desde que el cliente escribió.</p>
            </div>
          </div>

          <div style="margin-left: 17px; height: 14px; border-left: 2px dashed var(--border2);"></div>

          <div style="display: flex; align-items: flex-start; gap: 14px;">
            <div style="flex-shrink: 0; width: 36px; height: 36px; border-radius: 10px; background: rgba(212,168,67,0.15); border: 1px solid rgba(212,168,67,0.4); display: flex; align-items: center; justify-content: center; font-size: 14px;">⏳</div>
            <div style="flex: 1;">
              <p style="font-size: 13px; font-weight: 700; color: var(--text); margin-bottom: 3px;">Espera el webhook del pago</p>
              <p style="font-size: 12.5px; color: var(--muted);">El cliente paga. La billetera nos avisa. El bot acredita el saldo en tu plataforma automáticamente.</p>
            </div>
          </div>

          <div style="margin-left: 17px; height: 14px; border-left: 2px dashed var(--border2);"></div>

          <div style="display: flex; align-items: flex-start; gap: 14px;">
            <div style="flex-shrink: 0; width: 36px; height: 36px; border-radius: 10px; background: rgba(34,197,94,0.2); border: 1px solid rgba(34,197,94,0.5); display: flex; align-items: center; justify-content: center; font-size: 14px;">✅</div>
            <div style="flex: 1;">
              <p style="font-size: 13px; font-weight: 700; color: var(--text); margin-bottom: 3px;">Confirma al cliente: "Saldo acreditado, jugá!"</p>
              <p style="font-size: 12.5px; color: var(--muted);">Mensaje final con bono aplicado y link de juego. <strong style="color: var(--success);">Total: 8-12 segundos desde el primer mensaje.</strong></p>
            </div>
          </div>

        </div>
      </div>

      <div class="tip"><strong>Lo que NO tocaste en este flujo:</strong> nada. El bot se ocupa solo desde el "hola" hasta el "saldo acreditado". Vos solo intervenís cuando el bot decide escalar (paso 7).</div>

      <p style="margin-top: 14px;"><strong>Números reales</strong> de un cliente activo (Modo Ahorro, abril 2026):</p>
      <ul style="margin: 10px 0 16px 22px; color: var(--muted); line-height: 1.8;">
        <li>~85% de los chats los resuelve el bot solo de punta a punta</li>
        <li>~12% requieren intervención puntual de un operador (1-2 mensajes)</li>
        <li>~3% son escalados completos (retiros, problemas, soporte)</li>
      </ul>
    </div>
  </article>

  <!-- ═══════════════════════════════════════════════════════════════ -->
  <!-- PASO 6 — Remarketing — el más importante -->
  <!-- ═══════════════════════════════════════════════════════════════ -->
  <article class="step-card">
    <div class="step-head">
      <div class="step-num">6</div>
      <div class="step-meta">
        <div class="step-tag">Recupera ventas perdidas</div>
        <h2 class="step-title">Remarketing — convertí los "casi clientes" en ventas</h2>
      </div>
    </div>
    <div class="step-body">
      <p>El remarketing es el feature que más plata te genera. Cuando un cliente recibió el link de pago pero no pagó, o creó cuenta pero no cargó, el bot le manda un recordatorio automático en los tiempos correctos. <strong>Recupera entre 12% y 18% de las ventas perdidas</strong> en disparo 1, y un 5-8% adicional en disparo 2.</p>

      <p>Pero mal usado, este sistema te tira la línea de WhatsApp en 24 horas. Por eso, antes de seguir leyendo:</p>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- BLOQUE ROJO DE GARANTÍA — Las 4 condiciones -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div style="background: rgba(239,68,68,0.06); border: 2px solid rgba(239,68,68,0.4); border-radius: 14px; padding: 24px 22px; margin: 24px 0;">
        <p style="font-size: 11px; font-family: 'JetBrains Mono', monospace; color: var(--danger); text-transform: uppercase; letter-spacing: 0.12em; font-weight: 700; margin-bottom: 8px;">⚠️ Lectura obligatoria</p>
        <h3 style="font-size: 22px; color: var(--danger-soft); font-weight: 800; margin-bottom: 14px; letter-spacing: -0.01em;">Condiciones de garantía</h3>

        <p style="color: var(--text); font-size: 14px; line-height: 1.7; margin-bottom: 18px;">
          El sistema de remarketing está diseñado para recuperar ventas <strong>respetando las reglas de WhatsApp Business</strong>. Si no se respetan, no podemos garantizar el funcionamiento del bot ni la salud de tu línea.
        </p>

        <p style="color: var(--text); font-size: 14px; line-height: 1.7; margin-bottom: 12px; font-weight: 700;">
          🔒 Cuatro cosas anulan la garantía automáticamente:
        </p>

        <!-- Punto 1 -->
        <div style="background: rgba(239,68,68,0.04); border-left: 3px solid var(--danger); padding: 14px 16px; margin-bottom: 12px; border-radius: 0 8px 8px 0;">
          <p style="font-size: 14px; font-weight: 700; color: var(--danger-soft); margin-bottom: 6px;">1. Modificar los mensajes o tiempos sin asesoría</p>
          <p style="font-size: 13px; color: var(--text); line-height: 1.65;">
            Los textos sugeridos y los intervalos (24h y 72h) están calibrados con datos reales de conversión y de tolerancia de Meta. Si los cambiás por tu cuenta sin pasar por nuestro equipo de soporte, <strong>la garantía de la línea queda sin efecto</strong>. ¿Querés ajustar algo? Escribinos antes.
          </p>
        </div>

        <!-- Punto 2 -->
        <div style="background: rgba(239,68,68,0.04); border-left: 3px solid var(--danger); padding: 14px 16px; margin-bottom: 12px; border-radius: 0 8px 8px 0;">
          <p style="font-size: 14px; font-weight: 700; color: var(--danger-soft); margin-bottom: 6px;">2. Spam o uso masivo no orgánico</p>
          <p style="font-size: 13px; color: var(--text); line-height: 1.65;">
            El bot solo envía remarketing a clientes que iniciaron conversación con vos en las últimas horas — esa es la ventana legal de WhatsApp. Cualquier intento de <strong>enviar mensajes a contactos que no escribieron primero, importar listas externas, o duplicar disparos manualmente desde el panel</strong>, anula la garantía y puede tirarte la línea en 24 horas.
          </p>
        </div>

        <!-- Punto 3 -->
        <div style="background: rgba(239,68,68,0.04); border-left: 3px solid var(--danger); padding: 14px 16px; margin-bottom: 12px; border-radius: 0 8px 8px 0;">
          <p style="font-size: 14px; font-weight: 700; color: var(--danger-soft); margin-bottom: 6px;">3. Denuncias de clientes a WhatsApp por estafa</p>
          <p style="font-size: 13px; color: var(--text); line-height: 1.65;">
            Si un cliente te denuncia por estafa, fraude o spam dentro de WhatsApp, Meta baja el rating de tu línea automáticamente. Acumular 2-3 denuncias en pocos días puede dejarte la línea bloqueada <strong>sin posibilidad de recuperación</strong>. La garantía no cubre líneas bloqueadas por reportes de usuarios — son acciones del cliente final, fuera de nuestro control.
          </p>
        </div>

        <!-- Punto 4 (corto) -->
        <div style="background: rgba(239,68,68,0.04); border-left: 3px solid var(--danger); padding: 14px 16px; margin-bottom: 16px; border-radius: 0 8px 8px 0;">
          <p style="font-size: 14px; font-weight: 700; color: var(--danger-soft); margin-bottom: 6px;">4. Alterar el prompt del bot con fines engañosos</p>
          <p style="font-size: 13px; color: var(--text); line-height: 1.65;">
            Configurar al bot para prometer premios, beneficios o garantías inexistentes anula la garantía y puede ocasionar la suspensión del servicio.
          </p>
        </div>

        <p style="color: var(--text); font-size: 13.5px; line-height: 1.7; padding: 14px 16px; background: rgba(34,197,94,0.06); border-left: 3px solid var(--success); border-radius: 0 8px 8px 0; margin-bottom: 16px;">
          <strong style="color: var(--success);">Nuestro compromiso:</strong> si seguís las recomendaciones de este tutorial, <strong>garantizamos el uptime y la salud de tu línea</strong>. Si tenés dudas sobre algún caso puntual, <strong>siempre preguntá antes de actuar</strong>.
        </p>

        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
          <a href="mailto:${SUPPORT_EMAIL}" style="background: rgba(34,197,94,0.12); border: 1px solid rgba(34,197,94,0.4); color: var(--success); padding: 9px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">✉️ Escribir a soporte (${SUPPORT_EMAIL})</a>
          <a href="/terminos-bot" target="_blank" rel="noopener noreferrer" style="background: transparent; border: 1px solid var(--border2); color: var(--text); padding: 9px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">📄 Ver términos completos</a>
        </div>
      </div>

      <!-- Sigue: cómo funciona el remarketing -->

      <h3 style="font-size: 18px; color: var(--text); font-weight: 700; margin: 28px 0 12px;">Cómo funciona el remarketing automático</h3>

      <p>El bot detecta dos situaciones y dispara mensajes en tiempos calibrados:</p>

      <!-- Segmento 1 -->
      <div style="background: var(--surf); border: 1px solid var(--border); border-radius: 12px; padding: 18px 20px; margin: 14px 0;">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
          <span style="background: rgba(56,189,248,0.15); color: #38bdf8; font-size: 11px; font-weight: 700; font-family: 'JetBrains Mono', monospace; padding: 3px 10px; border-radius: 99px; letter-spacing: 0.04em;">link_not_paid</span>
          <p style="font-size: 14px; color: var(--text); font-weight: 600;">Recibió el link, no pagó</p>
        </div>
        <p style="font-size: 13px; color: var(--muted); line-height: 1.65;">El cliente pidió cargar, le mandaste el link de pago, y nunca lo abrió o no lo terminó. El bot le manda recordatorio a las <strong>24h</strong> y, si sigue sin pagar, otro a las <strong>72h</strong>.</p>
      </div>

      <!-- Segmento 2 -->
      <div style="background: var(--surf); border: 1px solid var(--border); border-radius: 12px; padding: 18px 20px; margin: 14px 0;">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
          <span style="background: rgba(167,139,250,0.15); color: #a78bfa; font-size: 11px; font-weight: 700; font-family: 'JetBrains Mono', monospace; padding: 3px 10px; border-radius: 99px; letter-spacing: 0.04em;">account_no_deposit</span>
          <p style="font-size: 14px; color: var(--text); font-weight: 600;">Creó cuenta, no cargó</p>
        </div>
        <p style="font-size: 13px; color: var(--muted); line-height: 1.65;">El cliente creó la cuenta pero todavía no hizo ningún depósito. El bot le manda recordatorio a las <strong>24h</strong> y, si sigue sin cargar, otro a las <strong>72h</strong>.</p>
      </div>

      <!-- Captura del panel de remarketing -->
      <p style="margin-top: 18px;">Andá a <code>Agente IA → Mensajes de remarketing</code>. Vas a ver esto:</p>

      <div class="mockup web">
        <div class="browser-bar">
          <div class="browser-dots"><span></span><span></span><span></span></div>
          <div class="browser-url">app.innovate-ia.com/agente-ia</div>
        </div>
        <div class="ia-panel">
          <div class="ia-panel-h">
            <p class="ia-tag">Recuperación automática</p>
            <h4 class="ia-h4">📣 Remarketing</h4>
          </div>

          <div style="display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.25); border-radius: 8px; margin-bottom: 16px;">
            <span style="font-size: 14px;">●</span>
            <span style="font-size: 13px; color: var(--text); font-weight: 600;">Remarketing activo</span>
            <span style="margin-left: auto; background: var(--success); width: 36px; height: 20px; border-radius: 99px; position: relative;"><span style="position: absolute; right: 2px; top: 2px; width: 16px; height: 16px; background: #fff; border-radius: 50%;"></span></span>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
            <div class="ia-field">
              <p class="ia-field-label">Disparo 1 (horas)</p>
              <div class="ia-input-wrap"><input class="ia-input" value="24" readonly /></div>
              <p class="ia-help">Recomendado: 24h</p>
            </div>
            <div class="ia-field">
              <p class="ia-field-label">Disparo 2 (horas)</p>
              <div class="ia-input-wrap"><input class="ia-input" value="72" readonly /></div>
              <p class="ia-help">Recomendado: 72h</p>
            </div>
          </div>

          <div class="ia-field">
            <p class="ia-field-label" style="color: #38bdf8;">Mensaje 1 — link no pagado (24h)</p>
            <div style="background: #111420; border: 1px solid #1e2130; border-radius: 8px; padding: 10px 12px; font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #E9E7E0; line-height: 1.6; white-space: pre-wrap;">¡Hola! 👋 Te dejo de nuevo el link por si querés terminar la carga. El bono del 50% sigue disponible.

🔗 {link}</div>
          </div>

          <div class="ia-field">
            <p class="ia-field-label" style="color: #a78bfa;">Mensaje 1 — sin depósito (24h)</p>
            <div style="background: #111420; border: 1px solid #1e2130; border-radius: 8px; padding: 10px 12px; font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #E9E7E0; line-height: 1.6; white-space: pre-wrap;">¡Hola! 👋 Tu cuenta ya está lista. ¿Querés que te genere el link para hacer la primera carga? El bono te suma 50%.</div>
          </div>
        </div>
      </div>

      <h3 style="font-size: 18px; color: var(--text); font-weight: 700; margin: 28px 0 12px;">Datos reales de conversión</h3>

      <p>De cada 100 clientes que reciben remarketing:</p>
      <ul style="margin: 10px 0 16px 22px; color: var(--muted); line-height: 1.9;">
        <li><strong style="color: var(--text);">12-18 reactivan en disparo 1</strong> (24h post-evento) — la mayoría dentro de la primera hora</li>
        <li><strong style="color: var(--text);">5-8 adicionales en disparo 2</strong> (72h post-evento) — gente que se distrajo</li>
        <li>Después de las 72h la conversión cae a casi cero — por eso solo son 2 disparos</li>
      </ul>

      <div class="tip"><strong>Cuándo desactivarlo:</strong> si tu público es muy recurrente y ya conoce el producto, capaz solo necesitás disparo 1. Igual: <strong>preguntá antes de cambiar nada</strong>.</div>
    </div>
  </article>

  <!-- ═══════════════════════════════════════════════════════════════ -->
  <!-- PASO 7 — Cuándo escala a humano -->
  <!-- ═══════════════════════════════════════════════════════════════ -->
  <article class="step-card">
    <div class="step-head">
      <div class="step-num">7</div>
      <div class="step-meta">
        <div class="step-tag">El bot no es mago</div>
        <h2 class="step-title">Cuándo escala a un operador humano</h2>
      </div>
    </div>
    <div class="step-body">
      <p>El bot escala a humano en 4 situaciones. Que escale es <strong>feature, no bug</strong> — protege contra fraudes y contra la frustración del cliente cuando la IA se traba.</p>

      <ol style="margin: 14px 0 16px 22px; color: var(--muted); line-height: 1.9;">
        <li><strong style="color: var(--text);">Pedido de retiro</strong> — siempre, sin excepción. Lo procesa un operador.</li>
        <li><strong style="color: var(--text);">Cliente enojado o con queja fuerte</strong> — el bot detecta tono agresivo y escala antes de empeorar.</li>
        <li><strong style="color: var(--text);">Pregunta que no entiende</strong> — si el bot no sabe qué responder con confianza, prefiere pasar a humano antes que inventar.</li>
        <li><strong style="color: var(--text);">Cliente pide hablar con persona</strong> — frase tipo "quiero hablar con alguien", "agente humano", "operador".</li>
      </ol>

      <p>Cuando escala, vos lo ves en el panel de Chats marcado con un círculo rojo y notificación. Podés tomar el chat con un click y seguir desde donde el bot dejó.</p>

      <div class="mockup web">
        <div class="browser-bar">
          <div class="browser-dots"><span></span><span></span><span></span></div>
          <div class="browser-url">app.innovate-ia.com/chats</div>
        </div>
        <div class="ia-panel" style="padding: 14px 18px;">
          <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: rgba(239,68,68,0.06); border: 1px solid rgba(239,68,68,0.3); border-radius: 8px; margin-bottom: 8px;">
            <div style="width: 36px; height: 36px; border-radius: 50%; background: #4E5168; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 13px; font-weight: 700; flex-shrink: 0;">JC</div>
            <div style="flex: 1; min-width: 0;">
              <p style="font-size: 13px; font-weight: 600; color: var(--text);">Juan Carlos</p>
              <p style="font-size: 11.5px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">"quiero retirar 12000"</p>
            </div>
            <span style="background: var(--danger); color: #fff; font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 99px; letter-spacing: 0.04em;">ESCALADO</span>
          </div>
          <div style="display: flex; align-items: center; gap: 12px; padding: 12px;">
            <div style="width: 36px; height: 36px; border-radius: 50%; background: #4E5168; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 13px; font-weight: 700; flex-shrink: 0;">MA</div>
            <div style="flex: 1; min-width: 0;">
              <p style="font-size: 13px; font-weight: 600; color: var(--text);">María Alejandra</p>
              <p style="font-size: 11.5px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">"saldo acreditado, jugá!"</p>
            </div>
            <span style="background: rgba(34,197,94,0.15); color: var(--success); font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 99px; letter-spacing: 0.04em;">BOT OK</span>
          </div>
        </div>
      </div>

      <div class="tip"><strong>Tiempo objetivo de respuesta humana:</strong> 5 minutos en horario hábil. Si el escalado tarda más, perdés la conversión. El panel te avisa con sonido + push.</div>
    </div>
  </article>

  <!-- ═══════════════════════════════════════════════════════════════ -->
  <!-- PASO 8 — Métricas y costos -->
  <!-- ═══════════════════════════════════════════════════════════════ -->
  <article class="step-card">
    <div class="step-head">
      <div class="step-num">8</div>
      <div class="step-meta">
        <div class="step-tag">Cuánto te ahorra</div>
        <h2 class="step-title">Métricas y ROI — cómo leer los números</h2>
      </div>
    </div>
    <div class="step-body">
      <p>En el dashboard tenés métricas en tiempo real. Lo que conviene mirar todos los días:</p>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin: 18px 0;">
        <div style="background: var(--surf); border: 1px solid var(--border); border-radius: 10px; padding: 14px;">
          <p style="font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.06em; font-family: 'JetBrains Mono', monospace; margin-bottom: 6px;">Chats totales</p>
          <p style="font-size: 22px; color: var(--text); font-weight: 700;">128</p>
          <p style="font-size: 11px; color: var(--success); margin-top: 4px;">+18% vs ayer</p>
        </div>
        <div style="background: var(--surf); border: 1px solid var(--border); border-radius: 10px; padding: 14px;">
          <p style="font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.06em; font-family: 'JetBrains Mono', monospace; margin-bottom: 6px;">Conversión</p>
          <p style="font-size: 22px; color: var(--text); font-weight: 700;">42%</p>
          <p style="font-size: 11px; color: var(--success); margin-top: 4px;">chats → ventas</p>
        </div>
        <div style="background: var(--surf); border: 1px solid var(--border); border-radius: 10px; padding: 14px;">
          <p style="font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.06em; font-family: 'JetBrains Mono', monospace; margin-bottom: 6px;">Ventas hoy</p>
          <p style="font-size: 22px; color: var(--text); font-weight: 700;">$54.200</p>
          <p style="font-size: 11px; color: var(--success); margin-top: 4px;">53 pagos</p>
        </div>
        <div style="background: var(--surf); border: 1px solid var(--border); border-radius: 10px; padding: 14px;">
          <p style="font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.06em; font-family: 'JetBrains Mono', monospace; margin-bottom: 6px;">Costo bot</p>
          <p style="font-size: 22px; color: ${ACCENT}; font-weight: 700;">$5</p>
          <p style="font-size: 11px; color: var(--muted); margin-top: 4px;">1 cred = 1 día</p>
        </div>
      </div>

      <h3 style="font-size: 16px; color: var(--text); font-weight: 700; margin: 22px 0 10px;">Comparado con un operador humano</h3>

      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <thead>
            <tr style="background: var(--surf2);">
              <th style="text-align: left; padding: 10px 12px; color: var(--muted); font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; font-family: 'JetBrains Mono', monospace; font-weight: 600;">Concepto</th>
              <th style="text-align: right; padding: 10px 12px; color: var(--muted); font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; font-family: 'JetBrains Mono', monospace; font-weight: 600;">Operador humano</th>
              <th style="text-align: right; padding: 10px 12px; color: ${ACCENT}; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; font-family: 'JetBrains Mono', monospace; font-weight: 700;">Bot Innovate.ia</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid var(--border);">
              <td style="padding: 10px 12px; color: var(--text);">Costo mensual</td>
              <td style="padding: 10px 12px; text-align: right; color: var(--muted);">$300.000+ ARS</td>
              <td style="padding: 10px 12px; text-align: right; color: var(--text); font-weight: 600;">$150 ARS (30 cred)</td>
            </tr>
            <tr style="border-bottom: 1px solid var(--border);">
              <td style="padding: 10px 12px; color: var(--text);">Horario</td>
              <td style="padding: 10px 12px; text-align: right; color: var(--muted);">8 hs / día</td>
              <td style="padding: 10px 12px; text-align: right; color: var(--text); font-weight: 600;">24 / 7 / 365</td>
            </tr>
            <tr style="border-bottom: 1px solid var(--border);">
              <td style="padding: 10px 12px; color: var(--text);">Tiempo de respuesta</td>
              <td style="padding: 10px 12px; text-align: right; color: var(--muted);">2-15 min</td>
              <td style="padding: 10px 12px; text-align: right; color: var(--text); font-weight: 600;">~3 segundos</td>
            </tr>
            <tr style="border-bottom: 1px solid var(--border);">
              <td style="padding: 10px 12px; color: var(--text);">Capacidad simultánea</td>
              <td style="padding: 10px 12px; text-align: right; color: var(--muted);">1 chat a la vez</td>
              <td style="padding: 10px 12px; text-align: right; color: var(--text); font-weight: 600;">Ilimitada</td>
            </tr>
            <tr>
              <td style="padding: 10px 12px; color: var(--text);">Errores de tipeo</td>
              <td style="padding: 10px 12px; text-align: right; color: var(--muted);">Sí (humano se cansa)</td>
              <td style="padding: 10px 12px; text-align: right; color: var(--text); font-weight: 600;">Cero</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="tip" style="margin-top: 20px;"><strong>Cómo medir tu ROI:</strong> tomá tus ventas de la última semana, restá lo que te hubiera costado un operador (~$10.000 ARS/día) y restá los créditos del bot ($5/día). La diferencia es tu margen recuperado.</div>

      <p style="margin-top: 20px; padding-top: 18px; border-top: 1px solid var(--border); color: var(--muted); font-size: 13px;">
        ¿Dudas sobre cualquier paso? <a href="mailto:${SUPPORT_EMAIL}" style="color: var(--success); text-decoration: none; font-weight: 600;">✉️ Escribinos a ${SUPPORT_EMAIL}</a> o pegá un grito por el panel. Estamos para que esto te funcione.
      </p>
    </div>
  </article>
</div>
`

export default function InstruccionesAgenteBotCasino() {
  return (
    <AgenteTutorialLayout
      accent={ACCENT}
      backTo="agente"
      breadcrumb="Instrucciones / Agente / Casino"
      bodyHtml={BODY_HTML}
    />
  )
}
