import AgenteTutorialLayout from './_AgenteTutorialLayout'
import { SUPPORT_EMAIL } from '../lib/constants'

const ACCENT = '#a78bfa'

const BODY_HTML = `
<div class="container">
  <header class="head">
    <div class="chip" style="background: rgba(167,139,250,0.08); border-color: rgba(167,139,250,0.3); color: ${ACCENT};">Tour guiado · Bot Marketing</div>
    <h1>Tu bot Marketing — <span style="color:${ACCENT};">capturá leads 24/7 y derivalos al humano que cierra</span></h1>
    <p>Una guía del bot pensado para negocios donde el cierre lo hace una persona, no una API. Sirve para inmobiliarias, agencias, consultoras, distribuidoras, productos premium, B2B, o cualquier rubro donde el "sí, dame los datos" es solo el primer paso.</p>
    <div class="meta">
      <span>⏱ <strong>10–15 minutos</strong></span>
      <span>📣 <strong>Captura 24/7</strong></span>
      <span>⚡ <strong>~2s por respuesta</strong></span>
      <span>🎯 <strong>Lead → Humano en &lt; 1min</strong></span>
    </div>
  </header>

  <article class="step-card">
    <div class="step-head">
      <div class="step-num">1</div>
      <div class="step-meta">
        <div class="step-tag">Qué hace el bot marketing</div>
        <h2 class="step-title">Trabaja como un BDR junior — pero sin descansos</h2>
      </div>
    </div>
    <div class="step-body">
      <p>El bot Marketing es un capturador de leads conversacional. Cuando alguien escribe a tu WhatsApp, el bot lo recibe, le hace preguntas para entender qué busca, y cuando tiene contexto suficiente <strong>escala al panel</strong> con una notificación al equipo de ventas. El cierre lo hacés vos.</p>

      <p style="margin-top: 16px;"><strong>Lo que automatiza:</strong></p>
      <ul style="margin: 10px 0 16px 22px; color: var(--muted); line-height: 1.8;">
        <li>Atender saludos genéricos y romper el hielo (24/7)</li>
        <li>Preguntar lo que vos definas: rubro, presupuesto, urgencia, ubicación</li>
        <li>Notificar al panel apenas el lead da una señal real de interés</li>
        <li>Etiquetar al lead con un tag tipo <code>marketing_lead</code> que vas a ver en el panel</li>
      </ul>

      <p><strong>Lo que NO hace:</strong></p>
      <ul style="margin: 10px 0 16px 22px; color: var(--muted); line-height: 1.8;">
        <li>No cierra ventas — siempre escala</li>
        <li>No genera links de pago automáticos</li>
        <li>No promete precios o plazos sin contexto humano</li>
        <li>No envía propuestas comerciales por sí solo</li>
      </ul>

      <div class="tip"><strong>Caso típico:</strong> una inmobiliaria que recibe 80 mensajes al día de gente preguntando por propiedades. El bot filtra: separa al curioso del que tiene plata para comprar. Solo los que pasan el filtro llegan al asesor humano. El asesor cierra, el bot trabaja gratis (1 crédito = 1 día).</div>
    </div>
  </article>

  <article class="step-card">
    <div class="step-head">
      <div class="step-num">2</div>
      <div class="step-meta">
        <div class="step-tag">Activación</div>
        <h2 class="step-title">Cambiá la identidad a Marketing</h2>
      </div>
    </div>
    <div class="step-body">
      <p>Andá a <code>Configuración → Identidad del negocio</code> y elegí <strong>Marketing</strong>. Te va a pedir tipear el nombre exacto de tu negocio (es la confirmación tipo GitHub para evitar accidentes).</p>

      <div class="mockup web">
        <div class="browser-bar">
          <div class="browser-dots"><span></span><span></span><span></span></div>
          <div class="browser-url">app.innovate-ia.com/configuracion</div>
        </div>
        <div class="ia-panel">
          <p class="ia-tag">Identidad del negocio</p>
          <h4 class="ia-h4">Confirmación de cambio</h4>
          <p style="color: var(--muted); font-size: 13px; margin: 4px 0 14px;">Para confirmar, escribí "Mi Inmobiliaria SA" abajo:</p>
          <div style="background: var(--bg); border: 1px solid var(--border); border-radius: 6px; padding: 10px; font-family: monospace; font-size: 12px; color: var(--muted);">Mi Inmobiliaria SA|</div>
          <button style="background: ${ACCENT}; color: white; padding: 8px 16px; border-radius: 6px; border: 0; margin-top: 10px; font-weight: 700;">Cambiar a Marketing</button>
        </div>
      </div>

      <div class="tip"><strong>Personalización del bot:</strong> en <code>Agente IA → Personalidad del bot</code> podés ajustar el tono. Para Marketing recomendamos: tono cálido pero profesional, oraciones cortas, evitar emojis exagerados (clientes B2B no los aprecian).</div>
    </div>
  </article>

  <article class="step-card">
    <div class="step-head">
      <div class="step-num">3</div>
      <div class="step-meta">
        <div class="step-tag">Conversación tipo</div>
        <h2 class="step-title">Cómo conversa el bot Marketing</h2>
      </div>
    </div>
    <div class="step-body">
      <p>El bot Marketing es <strong>breve por diseño</strong>. La idea es no pelearle al cierre humano: ningún mensaje pasa de 3 líneas, y apenas hay señal de interés concreto, escala.</p>

      <div class="chat-mockup" style="max-width: 480px; margin: 16px auto;">
        <div style="background: #efe7dd; padding: 16px; border-radius: 12px;">
          <div style="background: white; padding: 8px 12px; border-radius: 10px 10px 10px 2px; max-width: 85%; margin-bottom: 8px; font-size: 13px;">Hola, vi su anuncio del 2 ambientes en Palermo</div>
          <div style="background: #d9fdd3; padding: 8px 12px; border-radius: 10px 10px 2px 10px; max-width: 85%; margin: 0 0 8px auto; font-size: 13px; text-align: right;">Hola! Gracias por escribirnos 🙌 Contame brevemente qué buscás y un asesor te contacta enseguida.</div>
          <div style="background: white; padding: 8px 12px; border-radius: 10px 10px 10px 2px; max-width: 85%; margin-bottom: 8px; font-size: 13px;">Estoy buscando para mudarme con mi pareja, presupuesto 200k</div>
          <div style="background: #d9fdd3; padding: 8px 12px; border-radius: 10px 10px 2px 10px; max-width: 85%; margin: 0 0 8px auto; font-size: 13px; text-align: right;">Genial, anotado. Te contacta un asesor en los próximos minutos para coordinar visita 👋</div>
          <div style="font-size: 11px; color: #888; text-align: center; margin: 8px 0; font-style: italic;">— escalado al panel —</div>
        </div>
      </div>

      <p style="margin-top: 14px;"><strong>Lo que el bot detecta para escalar:</strong></p>
      <ul style="margin: 10px 0 16px 22px; color: var(--muted); line-height: 1.8;">
        <li>Cuando el cliente menciona un producto/servicio específico</li>
        <li>Cuando da contexto cuantitativo (presupuesto, fecha, cantidad)</li>
        <li>Cuando pregunta por disponibilidad o stock</li>
        <li>Cuando pide hablar con alguien</li>
        <li>Si insiste 2 veces sin moverse → escala igual (mejor sobre-escalar que perder)</li>
      </ul>

      <div class="tip"><strong>Anti-spam:</strong> si el cliente solo manda "hola" sin más contexto, el bot pregunta qué busca, pero no escala todavía. Solo escala cuando hay <em>algo concreto</em> para que el humano arranque la conversación con datos.</div>
    </div>
  </article>

  <article class="step-card">
    <div class="step-head">
      <div class="step-num">4</div>
      <div class="step-meta">
        <div class="step-tag">Notificaciones</div>
        <h2 class="step-title">Cómo te llega el lead</h2>
      </div>
    </div>
    <div class="step-body">
      <p>Cuando el bot escala, dispara <strong>3 notificaciones</strong> en paralelo:</p>

      <ol style="margin: 14px 0 18px 22px; color: var(--text); line-height: 1.85;">
        <li><strong>Push del navegador</strong> al panel agente — con el preview del mensaje y un botón "Abrir chat".</li>
        <li><strong>Banner amarillo en /chats</strong> con el tag <code>marketing_lead</code> destacado.</li>
        <li><strong>Notificación en el badge del menú</strong> con el contador de leads sin atender.</li>
      </ol>

      <div class="mockup web">
        <div class="browser-bar">
          <div class="browser-dots"><span></span><span></span><span></span></div>
          <div class="browser-url">app.innovate-ia.com/chats</div>
        </div>
        <div style="padding: 14px;">
          <div style="background: rgba(167,139,250,0.08); border: 1px solid rgba(167,139,250,0.3); border-radius: 10px; padding: 12px; display: flex; gap: 12px; align-items: center;">
            <div style="width: 8px; height: 8px; border-radius: 50%; background: ${ACCENT};"></div>
            <div style="flex: 1;">
              <p style="margin: 0; font-weight: 700; font-size: 13px;">📣 LEAD: María González</p>
              <p style="margin: 2px 0 0; font-size: 12px; color: var(--muted);">"Estoy buscando para mudarme con mi pareja, presupuesto 200k"</p>
            </div>
            <span style="font-size: 10px; padding: 3px 8px; border-radius: 4px; background: rgba(167,139,250,0.12); color: ${ACCENT}; font-family: monospace; text-transform: uppercase;">marketing_lead</span>
          </div>
        </div>
      </div>

      <div class="tip"><strong>Tiempo de respuesta:</strong> los leads de WhatsApp se "enfrían" rápido. Conviene definir un SLA interno tipo "menos de 5 minutos" para que tu equipo sepa que cuando suena, hay que ir.</div>
    </div>
  </article>

  <article class="step-card">
    <div class="step-head">
      <div class="step-num">5</div>
      <div class="step-meta">
        <div class="step-tag">Toma manual de chat</div>
        <h2 class="step-title">Apagá el bot cuando arranca el humano</h2>
      </div>
    </div>
    <div class="step-body">
      <p>En cada conversación tenés un toggle para <strong>apagar el bot</strong> en ese chat puntual. Apenas el asesor humano se mete, conviene apagarlo para que no respondan dos al mismo tiempo.</p>

      <div class="mockup web">
        <div class="browser-bar">
          <div class="browser-dots"><span></span><span></span><span></span></div>
          <div class="browser-url">app.innovate-ia.com/chats/abc123</div>
        </div>
        <div style="padding: 12px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border);">
          <div>
            <p style="margin: 0; font-weight: 700; font-size: 14px;">María González</p>
            <p style="margin: 2px 0 0; font-size: 12px; color: var(--muted);">+54 9 11 5555-1234</p>
          </div>
          <button style="background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); color: #ef4444; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 700;">🤖 Apagar bot</button>
        </div>
      </div>

      <p style="margin-top: 14px;">Si en algún momento querés volver a dejar al bot atendiendo (ej: el cliente vuelve después de 3 días), hay un botón para reactivarlo. El historial completo queda guardado y el bot lo lee antes de responder.</p>

      <div class="tip"><strong>Comportamiento default:</strong> el bot vuelve a activarse automáticamente si pasan más de 24h sin actividad humana en el chat — para que no se queden chats colgados con el bot apagado.</div>
    </div>
  </article>

  <article class="step-card">
    <div class="step-head">
      <div class="step-num">6</div>
      <div class="step-meta">
        <div class="step-tag">Métricas que importan</div>
        <h2 class="step-title">Cómo medir si vale la pena</h2>
      </div>
    </div>
    <div class="step-body">
      <p>Marketing es el modo más fácil de evaluar — no hay cobros automáticos, solo leads. Las 4 métricas clave en Analytics:</p>

      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin: 16px 0;">
        <div style="padding: 14px; background: rgba(167,139,250,0.05); border: 1px solid rgba(167,139,250,0.2); border-radius: 10px;">
          <p style="font-weight: 700; color: ${ACCENT}; margin: 0 0 4px; font-size: 13px;">Conversaciones nuevas</p>
          <p style="font-size: 12px; color: var(--muted); margin: 0;">Total de WhatsApps únicos que entraron a tu número.</p>
        </div>
        <div style="padding: 14px; background: rgba(167,139,250,0.05); border: 1px solid rgba(167,139,250,0.2); border-radius: 10px;">
          <p style="font-weight: 700; color: ${ACCENT}; margin: 0 0 4px; font-size: 13px;">Leads escalados</p>
          <p style="font-size: 12px; color: var(--muted); margin: 0;">Cuántos pasaron el filtro y llegaron al humano.</p>
        </div>
        <div style="padding: 14px; background: rgba(167,139,250,0.05); border: 1px solid rgba(167,139,250,0.2); border-radius: 10px;">
          <p style="font-weight: 700; color: ${ACCENT}; margin: 0 0 4px; font-size: 13px;">% conversión bot → lead</p>
          <p style="font-size: 12px; color: var(--muted); margin: 0;">Cuán filtrante es el bot. Sano: 30–50%.</p>
        </div>
        <div style="padding: 14px; background: rgba(167,139,250,0.05); border: 1px solid rgba(167,139,250,0.2); border-radius: 10px;">
          <p style="font-weight: 700; color: ${ACCENT}; margin: 0 0 4px; font-size: 13px;">Tiempo bot → humano</p>
          <p style="font-size: 12px; color: var(--muted); margin: 0;">Mediana del tiempo que tardás en tomar el chat.</p>
        </div>
      </div>

      <p style="margin-top: 14px;"><strong>Costo:</strong> 1 crédito = 1 día activo. Como Marketing no tiene cobros automáticos, no hay comisiones extras. Es básicamente filtrado IA + atención humana.</p>

      <div class="tip"><strong>Optimización:</strong> si tu % de leads escalados es muy bajo (&lt; 20%), el bot está siendo demasiado restrictivo. Si es muy alto (&gt; 70%), no está filtrando casi nada. Lo ajustamos en la personalidad del bot.</div>

      <p style="margin-top: 18px;">¿Necesitás ayuda para tunear el filtro? <a href="mailto:${SUPPORT_EMAIL}" style="color: ${ACCENT}; text-decoration: underline;">Escribinos a ${SUPPORT_EMAIL}</a> y lo armamos junto con vos.</p>
    </div>
  </article>
</div>
`

export default function InstruccionesAgenteBotMarketing() {
  return (
    <AgenteTutorialLayout
      accent={ACCENT}
      backTo="agente"
      breadcrumb="Instrucciones / Agente / Marketing"
      bodyHtml={BODY_HTML}
    />
  )
}
