import AgenteTutorialLayout from './_AgenteTutorialLayout'
import { SUPPORT_EMAIL } from '../lib/constants'

const ACCENT = '#ec4899'

const BODY_HTML = `
<div class="container">
  <header class="head">
    <div class="chip" style="background: rgba(236,72,153,0.08); border-color: rgba(236,72,153,0.3); color: ${ACCENT};">Tour guiado · Bot Profesional</div>
    <h1>Tu bot Profesional — <span style="color:${ACCENT};">recepción 24/7 con tono formal y derivación al especialista</span></h1>
    <p>Una guía pensada para profesionales independientes y estudios: médicos, abogados, contadores, psicólogos, kinesiólogos, escribanos, arquitectos. El bot trabaja como una recepcionista digital: atiende con tono profesional, recopila el motivo de consulta, y deriva al profesional disponible.</p>
    <div class="meta">
      <span>⏱ <strong>10 minutos</strong></span>
      <span>👔 <strong>Tono formal</strong></span>
      <span>📅 <strong>Coordinación de turnos</strong></span>
      <span>🔒 <strong>Discreción por default</strong></span>
    </div>
  </header>

  <article class="step-card">
    <div class="step-head">
      <div class="step-num">1</div>
      <div class="step-meta">
        <div class="step-tag">Qué hace el bot profesional</div>
        <h2 class="step-title">Recepción digital, sin recepcionista</h2>
      </div>
    </div>
    <div class="step-body">
      <p>El bot Profesional es un primer punto de contacto educado y discreto. Atiende a quien escribe, identifica si es un caso urgente o si puede esperar, recopila el motivo de la consulta sin pedir detalles sensibles, y deriva al profesional o al estudio.</p>

      <p style="margin-top: 16px;"><strong>Lo que automatiza:</strong></p>
      <ul style="margin: 10px 0 16px 22px; color: var(--muted); line-height: 1.8;">
        <li>Saludo formal con identificación del estudio</li>
        <li>Pregunta por el motivo de consulta de forma genérica</li>
        <li>Diferencia consulta urgente vs. consulta general</li>
        <li>Deriva al panel con tag <code>profesional_lead</code></li>
        <li>Avisa al cliente que un profesional lo contacta en X horas</li>
      </ul>

      <p><strong>Lo que NO hace:</strong></p>
      <ul style="margin: 10px 0 16px 22px; color: var(--muted); line-height: 1.8;">
        <li>No da consejos médicos, legales ni financieros — siempre escala</li>
        <li>No pide datos sensibles (DNI, número de cliente, historial)</li>
        <li>No agenda fechas concretas — eso lo confirma el profesional</li>
        <li>No promete plazos ni soluciones</li>
      </ul>

      <div class="tip"><strong>Diseño explícito:</strong> el bot Profesional es <em>conservador</em> a propósito. Preferimos que escale de más antes que dar una respuesta que pueda generar un problema legal o de mala praxis. Cuando un cliente pregunta "¿es urgente operar?" → el bot escala. Sin excepciones.</div>
    </div>
  </article>

  <article class="step-card">
    <div class="step-head">
      <div class="step-num">2</div>
      <div class="step-meta">
        <div class="step-tag">Activación</div>
        <h2 class="step-title">Cambiá la identidad a Profesional</h2>
      </div>
    </div>
    <div class="step-body">
      <p>En <code>Configuración → Identidad del negocio</code> elegí <strong>Profesional</strong>. La confirmación tipo GitHub te pide tipear el nombre exacto (ej: <em>"Estudio Jurídico García"</em> o <em>"Dr. Pérez — Cardiología"</em>) para que no haya cambios accidentales.</p>

      <div class="tip"><strong>Tip de naming:</strong> el nombre que cargues en tu Configuración aparece en el saludo del bot. Si tu marca es "Dr. García", el bot saluda con "Hola, soy del equipo del Dr. García". Cuanto más exacto sea, más profesional se ve.</div>

      <p style="margin-top: 14px;">Después de cambiar la identidad, andá a <code>Agente IA → Personalidad del bot</code> y ajustá el tono. Recomendaciones para Profesional:</p>

      <ul style="margin: 10px 0 16px 22px; color: var(--muted); line-height: 1.8;">
        <li><strong>Tono:</strong> formal pero cálido. "Buenas tardes" + "Sí, claro" funciona mejor que "Hola!" + "Dale".</li>
        <li><strong>Emojis:</strong> mínimos. Como mucho 👋 al saludar y 🙌 al cerrar. Nada de 🔥 ni 😎.</li>
        <li><strong>Voseo:</strong> opcional. Si tu clientela es mayor de 50, conviene tutear; si es joven, voseo argentino.</li>
        <li><strong>Frases prohibidas:</strong> "no te preocupes", "tranqui", "todo bien". Suenan livianas en contexto de salud o legal.</li>
      </ul>
    </div>
  </article>

  <article class="step-card">
    <div class="step-head">
      <div class="step-num">3</div>
      <div class="step-meta">
        <div class="step-tag">Conversación tipo</div>
        <h2 class="step-title">Cómo conversa el bot Profesional</h2>
      </div>
    </div>
    <div class="step-body">
      <p>El tono cambia notoriamente respecto a Casino o Tienda. Más cuidado con las palabras, frases más completas, sin jerga.</p>

      <div class="chat-mockup" style="max-width: 480px; margin: 16px auto;">
        <div style="background: #efe7dd; padding: 16px; border-radius: 12px;">
          <div style="background: white; padding: 8px 12px; border-radius: 10px 10px 10px 2px; max-width: 85%; margin-bottom: 8px; font-size: 13px;">Hola, necesito un turno</div>
          <div style="background: #d9fdd3; padding: 8px 12px; border-radius: 10px 10px 2px 10px; max-width: 85%; margin: 0 0 8px auto; font-size: 13px; text-align: right;">Buenas tardes 👋 Soy del equipo del Estudio García. Para coordinar le pedimos que nos cuente brevemente el motivo de la consulta.</div>
          <div style="background: white; padding: 8px 12px; border-radius: 10px 10px 10px 2px; max-width: 85%; margin-bottom: 8px; font-size: 13px;">Tema laboral, me despidieron sin causa la semana pasada</div>
          <div style="background: #d9fdd3; padding: 8px 12px; border-radius: 10px 10px 2px 10px; max-width: 85%; margin: 0 0 8px auto; font-size: 13px; text-align: right;">Anotado. Un especialista del estudio se pone en contacto en las próximas horas para coordinar la consulta. Mientras tanto le sugerimos guardar toda la documentación que tenga (contrato, recibos, comunicaciones).</div>
          <div style="font-size: 11px; color: #888; text-align: center; margin: 8px 0; font-style: italic;">— escalado al panel —</div>
        </div>
      </div>

      <p style="margin-top: 14px;"><strong>Diferencias clave con Marketing:</strong></p>
      <ul style="margin: 10px 0 16px 22px; color: var(--muted); line-height: 1.8;">
        <li>Usa "le" en lugar de "te" si tu personalidad está configurada en formal</li>
        <li>Identifica el estudio/profesional explícitamente desde el primer mensaje</li>
        <li>Después de escalar, agrega un consejo accionable básico (ej: "guarde documentación")</li>
        <li>No promete plazos exactos ("en breve", "en las próximas horas", nunca "mañana a las 10")</li>
      </ul>
    </div>
  </article>

  <article class="step-card">
    <div class="step-head">
      <div class="step-num">4</div>
      <div class="step-meta">
        <div class="step-tag">Privacidad</div>
        <h2 class="step-title">Lo que el bot NUNCA va a preguntar</h2>
      </div>
    </div>
    <div class="step-body">
      <p>Por diseño, el bot Profesional <strong>nunca</strong> pide:</p>

      <ul style="margin: 14px 0 18px 22px; color: var(--text); line-height: 1.85;">
        <li>DNI, CUIT, número de afiliado o de matrícula</li>
        <li>Fecha de nacimiento, domicilio, dirección de email</li>
        <li>Detalles del diagnóstico o caso (ej: "qué medicamento tomás")</li>
        <li>Historial clínico, financiero, judicial</li>
        <li>Datos de cobro o tarjeta</li>
      </ul>

      <p>Si el cliente <em>ofrece</em> esos datos espontáneamente, el bot los registra en el chat (queda visible al profesional cuando toma el caso) pero NO los confirma ni los re-procesa. La idea es que el profesional reciba el contexto pero el bot no opere sobre datos sensibles.</p>

      <div class="tip"><strong>Cumplimiento:</strong> esto es importante en rubros con secreto profesional (medicina, abogacía, salud mental). El bot está diseñado para que la conversación sea apropiada legalmente, sin tomar el rol del profesional.</div>
    </div>
  </article>

  <article class="step-card">
    <div class="step-head">
      <div class="step-num">5</div>
      <div class="step-meta">
        <div class="step-tag">Notificaciones y derivación</div>
        <h2 class="step-title">Cómo te llega cada consulta</h2>
      </div>
    </div>
    <div class="step-body">
      <p>Cuando el bot detecta una consulta válida, hace exactamente lo mismo que en Marketing pero con tag distinto:</p>

      <ol style="margin: 14px 0 18px 22px; color: var(--text); line-height: 1.85;">
        <li><strong>Push al panel</strong> con preview de la consulta + tag <code>profesional_lead</code>.</li>
        <li><strong>Banner rosa en /chats</strong> con prioridad visual (igual que Marketing pero color distinto para diferenciar).</li>
        <li><strong>Badge en el menú</strong> con contador de consultas sin atender.</li>
      </ol>

      <p style="margin-top: 14px;"><strong>Multi-profesional:</strong> si en tu estudio trabajan varios profesionales, podés crear un <strong>sub-tenant</strong> por cada uno. Cada sub-tenant tiene su propio número de WhatsApp y su propio panel. Eso te permite que cada profesional reciba solo sus consultas.</p>

      <div class="tip"><strong>Sugerencia operativa:</strong> definí un SLA interno tipo "consultas de hasta las 18hs se contestan ese mismo día, las posteriores al día siguiente antes de las 12hs". El bot puede comunicarle eso al cliente automáticamente — ajustá el "mensaje informativo" en Personalidad del bot.</div>
    </div>
  </article>

  <article class="step-card">
    <div class="step-head">
      <div class="step-num">6</div>
      <div class="step-meta">
        <div class="step-tag">Métricas y costos</div>
        <h2 class="step-title">Qué medir y qué te cuesta</h2>
      </div>
    </div>
    <div class="step-body">
      <p><strong>Costo:</strong> 1 crédito = 1 día activo. Sin importar la cantidad de consultas. El plan estándar suele ser suficiente para un profesional individual; estudios con más volumen pueden subir al plan superior.</p>

      <p style="margin-top: 14px;"><strong>Métricas relevantes:</strong></p>

      <ul style="margin: 10px 0 16px 22px; color: var(--muted); line-height: 1.8;">
        <li><strong>Consultas totales por día</strong> — útil para calcular cuánto te ahorró el bot en atención manual.</li>
        <li><strong>% que requiere derivación inmediata</strong> — los casos urgentes te muestran si tu rubro necesita guardia.</li>
        <li><strong>Tiempo medio de respuesta humana</strong> — desde que el bot escala hasta que un profesional toma el chat.</li>
        <li><strong>Conversaciones que el bot resolvió solo</strong> — bajo (~10%) por diseño. Si es alto, revisá el filtro porque puede estar dando demasiada info.</li>
      </ul>

      <div class="tip"><strong>Lo que NO está pensado para Profesional:</strong> ventas con cobro automático, atención de alto volumen anónimo (call center), respuestas técnicas profundas. Si encaja más con esos casos, mirá las guías de Casino o Tienda.</div>

      <p style="margin-top: 18px;">¿Tu rubro tiene particularidades especiales (ej: salud mental, urgencias 24/7)? <a href="mailto:${SUPPORT_EMAIL}" style="color: ${ACCENT}; text-decoration: underline;">Escribinos a ${SUPPORT_EMAIL}</a> y armamos juntos la personalidad del bot.</p>
    </div>
  </article>
</div>
`

export default function InstruccionesAgenteBotProfesional() {
  return (
    <AgenteTutorialLayout
      accent={ACCENT}
      backTo="agente"
      breadcrumb="Instrucciones / Agente / Profesional"
      bodyHtml={BODY_HTML}
    />
  )
}
