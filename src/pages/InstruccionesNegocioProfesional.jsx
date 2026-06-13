import NegocioTutorialLayout from './_NegocioTutorialLayout'
import { SUPPORT_EMAIL } from '../lib/constants'

const ACCENT = '#ec4899'

const BODY_HTML = `
<div class="container">
  <header class="head">
    <div class="chip" style="background: rgba(236,72,153,0.08); border-color: rgba(236,72,153,0.3); color: ${ACCENT};">Tour guiado · Negocio Profesional</div>
    <h1>Conectá tu estudio profesional — <span style="color:${ACCENT};">recepción digital con tono apropiado</span></h1>
    <p>Esta guía es para profesionales independientes y estudios: médicos, abogados, contadores, escribanos, psicólogos, kinesiólogos, arquitectos. El modo Profesional está diseñado con cuidado especial en privacidad, tono y compliance.</p>
    <div class="meta">
      <span>⏱ <strong>10 minutos</strong></span>
      <span>👔 <strong>Tono formal</strong></span>
      <span>🔒 <strong>Privacidad por default</strong></span>
      <span>📅 <strong>Coordina turnos</strong></span>
    </div>
  </header>

  <article class="step-card">
    <div class="step-head">
      <div class="step-num">1</div>
      <div class="step-meta">
        <div class="step-tag">¿Mi profesión encaja?</div>
        <h2 class="step-title">Para qué tipo de estudios funciona</h2>
      </div>
    </div>
    <div class="step-body">
      <p>El modo Profesional está pensado para servicios donde existe <strong>secreto profesional</strong> o <strong>relación de confianza</strong> con el cliente. El bot trabaja con cuidado en lo que pregunta y nunca toma el rol del especialista.</p>

      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin: 16px 0;">
        <div style="padding: 14px; background: rgba(34,197,94,0.05); border: 1px solid rgba(34,197,94,0.25); border-radius: 10px;">
          <p style="font-size: 13px; color: #22c55e; font-weight: 700; margin: 0 0 6px;">✅ Encaja</p>
          <p style="font-size: 12.5px; color: var(--text); line-height: 1.6; margin: 0;">Médicos, abogados, contadores, escribanos, psicólogos, kinesiólogos, nutricionistas, arquitectos, ingenieros consultores, despachantes, traductores oficiales.</p>
        </div>
        <div style="padding: 14px; background: rgba(239,68,68,0.05); border: 1px solid rgba(239,68,68,0.25); border-radius: 10px;">
          <p style="font-size: 13px; color: #ef4444; font-weight: 700; margin: 0 0 6px;">❌ No encaja</p>
          <p style="font-size: 12.5px; color: var(--text); line-height: 1.6; margin: 0;">Servicios técnicos rápidos (gasista, cerrajero — usar Marketing), academias o cursos online (mejor Tienda), entrenadores personales con planes mensuales (mejor Tienda con stock ilimitado).</p>
        </div>
      </div>

      <div class="tip"><strong>Diferencia clave con Marketing:</strong> Marketing está optimizado para <em>captar y vender</em>. Profesional está optimizado para <em>recepcionar y derivar con cuidado</em>. El tono y las preguntas son distintas.</div>
    </div>
  </article>

  <article class="step-card">
    <div class="step-head">
      <div class="step-num">2</div>
      <div class="step-meta">
        <div class="step-tag">Configuración inicial</div>
        <h2 class="step-title">Setup mínimo</h2>
      </div>
    </div>
    <div class="step-body">
      <p>Como Marketing, Profesional tiene un setup muy liviano:</p>

      <ol style="margin: 14px 0 18px 22px; color: var(--text); line-height: 1.85;">
        <li><strong>Identidad = Profesional</strong> en <code>Configuración → Identidad del negocio</code>.</li>
        <li><strong>Nombre del estudio o profesional</strong> (ej: "Estudio Pérez & Asociados" o "Dr. García — Cardiología"). Aparece en el saludo del bot.</li>
        <li><strong>Personalidad del bot</strong> con tono formal (ver paso 3).</li>
        <li><strong>Horarios de atención</strong> — para que el bot pueda decir "le respondemos en horario laboral".</li>
      </ol>

      <p style="margin-top: 14px;"><strong>Lo que NO necesitás:</strong> token de Mercado Pago, catálogo, datos de envío, integración con plataforma externa. La integración profesional es 100% conversacional.</p>

      <div class="tip"><strong>Tip importante:</strong> el nombre del estudio que cargás es el que aparece en el bot Y en el confirmador estilo GitHub al cambiar identidad. Si ponés un nombre largo, después tipearlo cuesta un poco más — usá un nombre operativo, no la razón social completa.</div>
    </div>
  </article>

  <article class="step-card">
    <div class="step-head">
      <div class="step-num">3</div>
      <div class="step-meta">
        <div class="step-tag">Personalidad</div>
        <h2 class="step-title">Cómo escribir el prompt del bot</h2>
      </div>
    </div>
    <div class="step-body">
      <p>El tono profesional es delicado. Estas son las reglas que recomendamos cargar en <code>Agente IA → Personalidad del bot</code>:</p>

      <div class="mockup web">
        <div class="browser-bar">
          <div class="browser-dots"><span></span><span></span><span></span></div>
          <div class="browser-url">app.innovate-ia.com/agente-ia</div>
        </div>
        <div class="ia-panel">
          <p class="ia-tag">Mensaje informativo del bot</p>
          <textarea readonly style="width: 100%; min-height: 180px; background: var(--bg); border: 1px solid var(--border); border-radius: 6px; padding: 10px; font-family: inherit; font-size: 12.5px; color: var(--text); resize: none; line-height: 1.55;">Sos del equipo del Dr. García, especialista en cardiología.

REGLAS:
- Saludá con "Buenas tardes/Buenos días" según el horario.
- Tono formal pero cálido. Tratamiento de "usted" si la persona se presenta de forma formal.
- NO des consejos médicos NUNCA. Si la consulta tiene contenido clínico, decir "el Dr. García le va a responder personalmente" y derivar.
- Solo preguntar el motivo general de la consulta (ej: "control de rutina", "consulta puntual", "segunda opinión"). NO pedir detalles del estado de salud.
- Si la persona dice "es urgente" o describe síntomas agudos: derivar inmediatamente con etiqueta "URGENTE" y mensaje "le sugerimos comunicarse al 107 si la situación es crítica mientras coordinamos".
- Después de derivar, sugerir traer estudios previos si los tiene.</textarea>
        </div>
      </div>

      <p style="margin-top: 14px;"><strong>Adaptaciones por rubro:</strong></p>
      <ul style="margin: 10px 0 16px 22px; color: var(--muted); line-height: 1.8;">
        <li><strong>Abogados:</strong> sumar "no aclarar plazos legales ni costos sin que primero consulte el Dr." y "siempre sugerir guardar documentación".</li>
        <li><strong>Contadores:</strong> sumar "para temas impositivos urgentes derivar inmediatamente, AFIP no espera".</li>
        <li><strong>Psicólogos:</strong> agregar "si la consulta menciona crisis emocional aguda, derivar de inmediato y sugerir línea 135 (Buenos Aires) o equivalente".</li>
        <li><strong>Médicos:</strong> agregar el número de emergencia local (107 / 911 / SAME).</li>
      </ul>

      <div class="tip"><strong>Test crítico:</strong> antes de activar, escribile al bot algo como "Tengo dolor en el pecho desde hace 2 horas" o "Mi marido tomó pastillas que no le corresponden". Verificá que el bot derive Y mencione la emergencia, sin dar ningún consejo. Si responde con consejos, ajustá la personalidad y volvé a probar.</div>
    </div>
  </article>

  <article class="step-card">
    <div class="step-head">
      <div class="step-num">4</div>
      <div class="step-meta">
        <div class="step-tag">Privacidad</div>
        <h2 class="step-title">Cómo se manejan los datos sensibles</h2>
      </div>
    </div>
    <div class="step-body">
      <p>El bot Profesional <strong>nunca pide</strong> datos sensibles. Pero si el cliente los <em>ofrece</em> espontáneamente, el bot los registra para que el profesional tenga el contexto al tomar el caso.</p>

      <p style="margin-top: 14px;"><strong>Lo que registramos:</strong></p>
      <ul style="margin: 10px 0 16px 22px; color: var(--muted); line-height: 1.8;">
        <li>El mensaje completo tal como lo mandó el cliente</li>
        <li>Tag de "consulta urgente" si el bot detectó urgencia</li>
        <li>Hora exacta del mensaje y del escalado</li>
      </ul>

      <p><strong>Lo que NO registramos por separado:</strong></p>
      <ul style="margin: 10px 0 16px 22px; color: var(--muted); line-height: 1.8;">
        <li>DNI, número de afiliado, datos de obra social en campos estructurados</li>
        <li>Diagnósticos previos en bases analizables</li>
        <li>Historial médico/legal/contable estructurado</li>
      </ul>

      <p>Esto es deliberado: queremos que el bot sea <em>una recepción de WhatsApp</em>, no una historia clínica electrónica. Las plataformas de gestión específicas de cada rubro (Doctoralia, MyExtra, etc.) son las que hacen eso.</p>

      <div class="tip"><strong>Compliance:</strong> si tu rubro requiere certificación específica (ej: HIPAA en EE.UU., habeas data en AR), Innovate.ia funciona como un canal de comunicación más — no es un repositorio de historia clínica. Lo importante: lo que el cliente te diga por WhatsApp queda en WhatsApp + en nuestro panel, igual que si lo recibieras en tu celular personal.</div>
    </div>
  </article>

  <article class="step-card">
    <div class="step-head">
      <div class="step-num">5</div>
      <div class="step-meta">
        <div class="step-tag">Multi-profesional</div>
        <h2 class="step-title">Estudio con varios profesionales</h2>
      </div>
    </div>
    <div class="step-body">
      <p>Si en tu estudio trabajan varios profesionales (ej: 3 abogados con especialidades distintas), te conviene crear un <strong>sub-tenant por cada uno</strong>:</p>

      <ul style="margin: 14px 0 18px 22px; color: var(--text); line-height: 1.8;">
        <li>Cada sub-tenant tiene su propio WhatsApp y su propio panel</li>
        <li>El bot puede tener una personalidad distinta por profesional (ej: tono más formal en uno, más cercano en otro)</li>
        <li>La tarifa de saldo operativo se descuenta del padre (no se duplica el costo)</li>
      </ul>

      <p style="margin-top: 14px;">Esto te permite, por ejemplo, mandar el WhatsApp del abogado laboralista a una landing distinta que el del abogado de familia. Los leads se ordenan por especialidad sin que vos tengas que clasificarlos a mano.</p>

      <div class="tip"><strong>Alternativa más simple:</strong> si todos los profesionales están al mismo nivel, dejá un solo tenant y agregá usuarios al panel. Todos ven todos los chats y se reparten los casos manualmente. Menos potente pero más rápido de configurar.</div>
    </div>
  </article>

  <article class="step-card">
    <div class="step-head">
      <div class="step-num">6</div>
      <div class="step-meta">
        <div class="step-tag">Operación diaria</div>
        <h2 class="step-title">Cómo se ve un día con Profesional activo</h2>
      </div>
    </div>
    <div class="step-body">
      <p>El día típico:</p>

      <ol style="margin: 14px 0 18px 22px; color: var(--text); line-height: 1.85;">
        <li><strong>El bot atiende todas las consultas que entran</strong>, fuera y dentro de horario.</li>
        <li><strong>Las que escala</strong> aparecen en tu panel <code>/chats</code> con tag <code>profesional_lead</code>.</li>
        <li><strong>Empezás tu día revisando los chats nuevos</strong> y respondiéndolos personalmente. Cuando arrancás un chat, apagás el bot para que no interfiera.</li>
        <li><strong>Coordinás los turnos</strong> manualmente desde la conversación (la fecha exacta no la maneja el bot — vos confirmás cuándo podés).</li>
        <li><strong>Las consultas urgentes que llegaron de noche</strong> el bot las marcó visualmente. Las priorizás al abrir el panel.</li>
      </ol>

      <div class="tip"><strong>Volumen esperado:</strong> profesionales individuales suelen recibir 5-20 consultas por día. Estudios medianos manejan 50-100. El bot reduce el "ruido" (gente preguntando por pavadas, horarios, ubicación) y deja solo las consultas reales — esto puede ahorrarte 1-2 horas diarias de gestión.</div>

      <p style="margin-top: 18px;">¿Tu rubro tiene alguna particularidad importante (ej: emergencias 24/7, multi-idioma, atención en obra social)? <a href="mailto:${SUPPORT_EMAIL}" style="color: ${ACCENT}; text-decoration: underline;">Escribinos a ${SUPPORT_EMAIL}</a> y armamos la personalidad pensando en eso.</p>
    </div>
  </article>
</div>
`

export default function InstruccionesNegocioProfesional() {
  return (
    <NegocioTutorialLayout
      accent={ACCENT}
      backTo="negocio"
      breadcrumb="Instrucciones / Negocio / Profesional"
      bodyHtml={BODY_HTML}
    />
  )
}
