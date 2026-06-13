// ═════════════════════════════════════════════════════════════════
// RetailPrivacidad.jsx — 12/05/2026
// ─────────────────────────────────────────────────────────────────
// Política de privacidad genérica SaaS argentina. Compatible con
// Ley 25.326 de Protección de Datos Personales.
//
// Texto neutro, listo para producción. Si en el futuro el negocio
// tiene CUIT/razón social/dirección específicas, se reemplazan los
// strings INNOVATE_IA_* abajo y listo.
// ═════════════════════════════════════════════════════════════════

import {
  PageHeader, Card,
  COLORS as C, RADIUS, FONT_SIZE, FONT_WEIGHT, FONT,
} from '../../components/ui'

const INNOVATE_IA_NOMBRE   = 'Innovate IA'
const INNOVATE_IA_EMAIL    = 'soporte@innovate-ia.com'
const INNOVATE_IA_DOMINIO  = 'innovate-ia.com'
const LAST_UPDATED         = '12 de mayo de 2026'

export default function RetailPrivacidad() {
  return (
    <div>
      <PageHeader
        eyebrow="Legales"
        title="Política de privacidad"
        subtitle={`Última actualización: ${LAST_UPDATED}`}
      />

      <Card padding={28} style={{ marginBottom: 16 }}>
        <Intro>
          En <Strong>{INNOVATE_IA_NOMBRE}</Strong> respetamos tu privacidad y nos comprometemos
          a proteger tus datos personales. Esta política explica qué información
          recopilamos, cómo la usamos, con quién la compartimos y qué derechos
          tenés sobre ella. Cumple con la <Strong>Ley 25.326</Strong> de Protección
          de Datos Personales de la República Argentina.
        </Intro>

        <Section title="1. Qué datos recopilamos">
          <P>Recopilamos las siguientes categorías de datos:</P>
          <BulletList items={[
            <><Strong>Datos de cuenta:</Strong> nombre, email, número de WhatsApp, contraseña cifrada, datos de tu negocio (nombre, URL, rubro).</>,
            <><Strong>Datos de uso:</Strong> mensajes que el bot intercambia con tus clientes, registros de actividad en el panel, métricas de tu cuenta.</>,
            <><Strong>Datos técnicos:</Strong> dirección IP, tipo de navegador, dispositivo, sistema operativo, cookies y tokens de autenticación.</>,
            <><Strong>Datos de pago:</Strong> historial de transacciones, pero <Strong>nunca</Strong> guardamos números completos de tarjeta — los procesa el proveedor de pagos (Mercado Pago, NOWPayments, etc.).</>,
            <><Strong>Comunicaciones:</Strong> tickets de soporte, emails que nos envíás, conversaciones con nuestro equipo.</>,
          ]} />
        </Section>

        <Section title="2. Para qué usamos tus datos">
          <P>Usamos los datos exclusivamente para:</P>
          <BulletList items={[
            'Prestar y mantener el servicio (autenticar tu cuenta, procesar mensajes, generar tu landing, registrar ventas).',
            'Procesar pagos y emitir comprobantes.',
            'Atender consultas de soporte y resolver problemas técnicos.',
            'Mejorar el servicio (analizar uso agregado, detectar errores, optimizar performance).',
            'Enviarte notificaciones operativas (ej. tu saldo se está acabando, hubo una falla, hay una actualización importante).',
            'Cumplir obligaciones legales, fiscales o judiciales cuando corresponda.',
          ]} />
          <P>
            <Strong>No vendemos tus datos.</Strong> Tampoco los usamos para hacer
            publicidad dirigida fuera de nuestro propio servicio.
          </P>
        </Section>

        <Section title="3. Con quién los compartimos">
          <P>
            Tus datos pueden ser compartidos únicamente con los siguientes
            proveedores que nos ayudan a operar el servicio:
          </P>
          <BulletList items={[
            <><Strong>Supabase:</Strong> nuestra base de datos y backend. Hostea tu cuenta y mensajes.</>,
            <><Strong>Vercel:</Strong> hosting del panel web.</>,
            <><Strong>Meta (WhatsApp Cloud API):</Strong> mensajes de WhatsApp se transmiten a través de la infraestructura oficial de Meta.</>,
            <><Strong>Anthropic (Claude):</Strong> modelo de IA que potencia al bot. Los mensajes se envían para generar respuestas.</>,
            <><Strong>Mercado Pago / NOWPayments:</Strong> procesadores de pagos.</>,
            <><Strong>Resend:</Strong> envío de emails transaccionales.</>,
            'Autoridades públicas: solo si lo exige una orden judicial o ley vigente.',
          ]} />
          <P>
            Todos estos proveedores tienen sus propias políticas de privacidad y están
            obligados contractualmente a proteger tus datos.
          </P>
        </Section>

        <Section title="4. Cookies y tecnologías similares">
          <P>Usamos cookies y almacenamiento local del navegador para:</P>
          <BulletList items={[
            'Mantener tu sesión iniciada (cookies de autenticación).',
            'Recordar preferencias del panel (períodos de métricas, vistas favoritas).',
            'Analizar uso agregado y mejorar el producto.',
          ]} />
          <P>
            No usamos cookies de terceros con fines publicitarios. Podés desactivar
            las cookies desde tu navegador, pero algunas funciones del panel
            (login, persistencia) pueden dejar de funcionar.
          </P>
        </Section>

        <Section title="5. Tus derechos">
          <P>
            Como titular de los datos, tenés los siguientes derechos
            reconocidos por la Ley 25.326 (“derechos ARCO”):
          </P>
          <BulletList items={[
            <><Strong>Acceso:</Strong> podés pedirnos una copia de toda la información que tenemos sobre vos.</>,
            <><Strong>Rectificación:</Strong> si algún dato es incorrecto, podés pedir que lo corrijamos.</>,
            <><Strong>Cancelación (eliminación):</Strong> podés pedir que borremos tu cuenta y datos asociados, siempre que no haya una obligación legal de conservarlos (ej. facturas por motivos fiscales).</>,
            <><Strong>Oposición:</Strong> podés oponerte a determinados usos específicos.</>,
          ]} />
          <P>
            Para ejercer cualquiera de estos derechos, escribinos a{' '}
            <Mono>{INNOVATE_IA_EMAIL}</Mono> desde el email asociado a tu cuenta.
            Respondemos en un plazo máximo de <Strong>10 días hábiles</Strong>.
          </P>
          <P>
            La autoridad de aplicación en Argentina es la <Strong>Agencia de Acceso
            a la Información Pública (AAIP)</Strong>. Podés presentar reclamos
            ante ese organismo si considerás que no cumplimos con lo declarado.
          </P>
        </Section>

        <Section title="6. Seguridad">
          <P>
            Aplicamos medidas técnicas y organizativas razonables para proteger
            tus datos: cifrado en tránsito (HTTPS / TLS), cifrado en reposo de
            campos sensibles (tokens, secretos), autenticación robusta, control
            de acceso por roles, auditorías internas y monitoreo continuo.
          </P>
          <P>
            Sin embargo, ningún sistema es 100% inviolable. Si detectás o sospechás
            un incidente de seguridad relacionado con tu cuenta, escribinos
            inmediatamente a <Mono>{INNOVATE_IA_EMAIL}</Mono>.
          </P>
        </Section>

        <Section title="7. Retención de datos">
          <P>
            Mantenemos tus datos mientras tu cuenta esté activa. Si decís dar
            de baja tu cuenta:
          </P>
          <BulletList items={[
            'Datos operativos (mensajes, ventas, configuraciones): se eliminan dentro de los 30 días.',
            'Datos administrativos (facturas, registros fiscales): se conservan por el plazo que exige la ley argentina (10 años).',
            'Logs técnicos y de seguridad: se conservan hasta 90 días.',
          ]} />
        </Section>

        <Section title="8. Datos de tus propios clientes">
          <P>
            Si usás nuestro servicio, vas a procesar datos personales de tus
            clientes (números de WhatsApp, mensajes, datos de venta). En ese
            caso, vos sos el responsable del tratamiento de esos datos y
            nosotros actuamos como <Strong>encargado de tratamiento</Strong>.
          </P>
          <P>
            Es tu responsabilidad obtener el consentimiento de tus clientes
            para procesar sus datos a través del bot, e informarles sobre el
            uso que se les dará. Nosotros no contactamos a tus clientes por
            ningún medio que no sea el flujo del bot que vos configures.
          </P>
        </Section>

        <Section title="9. Menores de edad">
          <P>
            El servicio está dirigido a personas mayores de 18 años con capacidad
            legal para contratar. No recopilamos intencionalmente datos de
            menores. Si te enterás de que un menor brindó datos sin
            consentimiento de sus padres o tutores, contactanos para eliminarlos.
          </P>
        </Section>

        <Section title="10. Transferencias internacionales">
          <P>
            Algunos de nuestros proveedores (Supabase, Vercel, Anthropic, Meta)
            pueden procesar datos en servidores ubicados fuera de Argentina,
            principalmente en Estados Unidos y la Unión Europea. Estas
            transferencias se realizan bajo cláusulas contractuales que
            garantizan un nivel de protección equivalente al exigido por la ley
            argentina.
          </P>
        </Section>

        <Section title="11. Cambios en esta política">
          <P>
            Podemos actualizar esta política para reflejar cambios legales,
            técnicos o del producto. Si los cambios son sustanciales, te
            avisaremos por email o desde el panel con al menos 15 días de
            anticipación. La fecha de “Última actualización” arriba indica
            cuándo se modificó por última vez.
          </P>
        </Section>

        <Section title="12. Contacto">
          <P>
            Para cualquier consulta sobre privacidad, ejercicio de derechos o
            inquietudes relacionadas, escribinos a:
          </P>
          <ContactBlock
            label="Email de soporte"
            value={INNOVATE_IA_EMAIL}
          />
          <ContactBlock
            label="Dominio del servicio"
            value={INNOVATE_IA_DOMINIO}
          />
        </Section>
      </Card>
    </div>
  )
}

// ─── Sub-componentes para legibilidad ────────────────────────
function Intro({ children }) {
  return (
    <p style={{
      margin: '0 0 24px',
      fontSize: FONT_SIZE.lg,
      color: C.text,
      lineHeight: 1.65,
    }}>{children}</p>
  )
}

function Section({ title, children }) {
  return (
    <section style={{ marginBottom: 28 }}>
      <h2 style={{
        margin: '0 0 12px',
        fontSize: 18,
        fontWeight: FONT_WEIGHT.bold,
        color: C.text,
        letterSpacing: '-0.01em',
      }}>{title}</h2>
      <div style={{ paddingLeft: 0 }}>{children}</div>
    </section>
  )
}

function P({ children }) {
  return (
    <p style={{
      margin: '0 0 12px',
      fontSize: FONT_SIZE.base,
      color: C.text,
      lineHeight: 1.65,
    }}>{children}</p>
  )
}

function Strong({ children }) {
  return (
    <strong style={{ color: C.brand, fontWeight: FONT_WEIGHT.semibold }}>
      {children}
    </strong>
  )
}

function Mono({ children }) {
  return (
    <code style={{
      fontFamily: FONT.mono,
      fontSize: FONT_SIZE.sm,
      color: C.brand,
      background: C.surface,
      padding: '2px 6px',
      borderRadius: 4,
    }}>{children}</code>
  )
}

function BulletList({ items }) {
  return (
    <ul style={{
      margin: '0 0 12px',
      paddingLeft: 22,
      fontSize: FONT_SIZE.base,
      color: C.text,
      lineHeight: 1.7,
    }}>
      {items.map((item, i) => (
        <li key={i} style={{ marginBottom: 6 }}>{item}</li>
      ))}
    </ul>
  )
}

function ContactBlock({ label, value }) {
  return (
    <div style={{
      padding: '10px 14px',
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: RADIUS.md,
      marginBottom: 8,
    }}>
      <div style={{
        fontSize: FONT_SIZE.xs,
        fontFamily: FONT.mono,
        color: C.muted,
        textTransform: 'uppercase',
        letterSpacing: '.08em',
        fontWeight: FONT_WEIGHT.semibold,
        marginBottom: 3,
      }}>{label}</div>
      <div style={{
        fontSize: FONT_SIZE.base,
        fontFamily: FONT.mono,
        color: C.brand,
        fontWeight: FONT_WEIGHT.semibold,
      }}>{value}</div>
    </div>
  )
}
