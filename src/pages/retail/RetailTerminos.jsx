// ═════════════════════════════════════════════════════════════════
// RetailTerminos.jsx — 13/05/2026
// ─────────────────────────────────────────────────────────────────
// Términos y condiciones genéricos SaaS B2B argentino.
// Ley aplicable: Argentina. Jurisdicción: tribunales ordinarios CABA.
//
// 13/05/2026 — Cláusula 3 (Créditos, pagos y reembolsos) actualizada
// para reflejar el modelo nuevo del retail:
//   • Activación manual de entre 1 y 30 días por vez (antes era 1-7).
//   • Aclaración explícita: una vez activado, NO se puede pausar ni
//     revertir — los créditos se consumen en el momento de la activación.
//   • Planes Base / Pro / Gold mencionados en lugar de "packs sueltos".
//   • Diferenciación WhatsApp por QR (Base/Pro, gratis) vs WhatsApp
//     API oficial (Gold incluido + add-on).
//   • Garantía Gold de 30 días corridos desde la compra documentada.
// ═════════════════════════════════════════════════════════════════

import {
  PageHeader, Card,
  COLORS as C, RADIUS, FONT_SIZE, FONT_WEIGHT, FONT,
} from '../../components/ui'

const INNOVATE_IA_NOMBRE   = 'Innovate IA'
const INNOVATE_IA_EMAIL    = 'soporte@innovate-ia.com'
const INNOVATE_IA_DOMINIO  = 'innovate-ia.com'
const LAST_UPDATED         = '13 de mayo de 2026'
const JURISDICCION         = 'tribunales ordinarios de la Ciudad Autónoma de Buenos Aires, República Argentina'

export default function RetailTerminos() {
  return (
    <div>
      <PageHeader
        eyebrow="Legales"
        title="Términos y condiciones"
        subtitle={`Última actualización: ${LAST_UPDATED}`}
      />

      <Card padding={28} style={{ marginBottom: 16 }}>
        <Intro>
          Estos términos rigen el uso del servicio prestado por{' '}
          <Strong>{INNOVATE_IA_NOMBRE}</Strong> (en adelante, “nosotros”, “la
          plataforma”). Al crear una cuenta o usar el servicio, aceptas estos
          términos. Si no estás de acuerdo, no usés el servicio.
        </Intro>

        <Section title="1. Descripción del servicio">
          <P>
            <Strong>{INNOVATE_IA_NOMBRE}</Strong> es una plataforma SaaS
            (software como servicio) que permite a negocios automatizar la
            atención y ventas por WhatsApp mediante un bot impulsado por
            inteligencia artificial. Incluímos:
          </P>
          <BulletList items={[
            'Bot conversacional para WhatsApp con IA generativa.',
            'Landing página pública autogenerada para tu negocio.',
            'Dashboard con métricas en tiempo real.',
            'Integración con billeteras virtuales (MP, Ualá, MODO, Lemon, Belo, etc.).',
            'Tracking de conversiones (Meta Pixel, Google Analytics).',
            'Sistema de créditos para activar días de servicio.',
          ]} />
          <P>
            El servicio se ofrece “tal cual” y se actualiza periódicamente.
            Podés suspender el uso en cualquier momento.
          </P>
        </Section>

        <Section title="2. Cuentas y registro">
          <P>
            Para usar el servicio tenés que crear una cuenta. Te comprometes a:
          </P>
          <BulletList items={[
            'Brindar información veraz, completa y actualizada.',
            'Mantener la confidencialidad de tu contraseña y tokens de acceso.',
            'Notificarnos inmediatamente sobre cualquier uso no autorizado de tu cuenta.',
            'Ser mayor de 18 años y tener capacidad legal para contratar.',
            'Si actuás en nombre de una empresa, declarar que tenés autoridad para hacerlo.',
          ]} />
          <P>
            Sos responsable de toda la actividad que ocurra en tu cuenta. Si
            detectás acceso indebido, escribinos a <Mono>{INNOVATE_IA_EMAIL}</Mono>.
          </P>
        </Section>

        <Section title="3. Créditos, pagos y reembolsos">
          <P>
            El servicio funciona por <Strong>créditos prepagos</Strong>:
          </P>
          <BulletList items={[
            <><Strong>1 crédito = 1 día</Strong> de servicio activo. Los créditos comprados <Strong>no vencen</Strong>: quedan en tu cuenta hasta que decidas activarlos.</>,
            <><Strong>Activación manual:</Strong> el usuario decide cuándo activar y cuántos días sumar. Cada activación permite sumar <Strong>entre 1 y 30 días</Strong> y consume tantos créditos como días se activen. Una vez confirmada la activación, los créditos se descuentan en ese momento y la activación no puede revertirse, pausarse ni cancelarse.</>,
            <>Tres planes operativos disponibles (<Strong>Base</Strong>, <Strong>Pro</Strong> y <Strong>Gold</Strong>), todos con el mismo modelo de créditos pero con distinta cantidad de días, sesiones simultáneas y servicios extra. La descripción detallada y precios actualizados están en la sección Saldo del panel.</>,
            'Los precios se muestran en USD y/o ARS. Los precios pueden variar; los cambios no afectan compras ya realizadas.',
            'Aceptamos Mercado Pago (ARS), tarjetas de crédito/débito vía MP, y criptomonedas (USDT TRC20) vía NOWPayments.',
            'Los créditos se acreditan automáticamente al confirmarse el pago.',
            <><Strong>WhatsApp por QR (Base y Pro):</Strong> incluido sin costo extra; vincula tu WhatsApp existente sin trámites con Meta.</>,
            <><Strong>WhatsApp API oficial (Gold):</Strong> incluye activación de línea oficial de Meta y <Strong>garantía de cambio de número por 30 días corridos desde la compra</Strong> en caso de bloqueo de Meta, error técnico o caída de la WhatsApp API (siempre que el incidente no haya sido causado por uso indebido). Esta garantía aplica hayas activado los días o no — el plazo corre desde la fecha de pago. También puede comprarse el add-on de línea API por separado, pero sin garantía.</>,
            <><Strong>Reembolsos:</Strong> los créditos <Strong>NO activados</Strong> pueden reembolsarse dentro de los <Strong>7 días corridos</Strong> de la compra. Pasado ese plazo no se aceptan reembolsos, pero los créditos no vencen y quedan disponibles indefinidamente.</>,
            'Los días ya activados (créditos consumidos en una activación) no son reembolsables bajo ningún concepto, incluso si el período activo todavía no se consumió.',
          ]} />
          <P>
            Para solicitar un reembolso, contactanos desde la sección Soporte
            o a <Mono>{INNOVATE_IA_EMAIL}</Mono> dentro del plazo establecido,
            indicando el motivo. Procesamos los reembolsos dentro de los 10
            días hábiles desde la confirmación.
          </P>
        </Section>

        <Section title="4. Uso aceptable">
          <P>Te comprometés a NO usar el servicio para:</P>
          <BulletList items={[
            'Enviar spam, mensajes no solicitados o masivos a personas que no consintieron recibirlos.',
            'Promocionar actividades ilícitas, fraudulentas o que vulneren derechos de terceros.',
            'Suplantar identidad de personas u organizaciones.',
            'Vender productos o servicios prohibidos por la ley argentina.',
            'Hostigar, amenazar, difamar o discriminar a terceros.',
            'Recopilar datos personales sin el consentimiento de los titulares.',
            'Eludir medidas de seguridad, hacer ingeniería inversa o copiar la plataforma.',
            'Sobrecargar deliberadamente nuestros servidores o los de nuestros proveedores.',
          ]} />
          <P>
            <Strong>También debes cumplir con las políticas de WhatsApp Business</Strong>
            (Política Comercial y Términos de WhatsApp Business API). Si Meta
            sanciona o suspende tu número por incumplir esas políticas, no nos
            hacemos responsables.
          </P>
        </Section>

        <Section title="5. Tus contenidos y datos">
          <P>
            Cuando usás el servicio, generás contenidos (mensajes, configuraciones,
            catálogos, landing). Esos contenidos son <Strong>tuyos</Strong>: vos
            sos el dueño de los datos que cargues y los mensajes que circulen por
            tu bot.
          </P>
          <P>
            Al usar el servicio, nos otorgás una licencia limitada para procesar
            esos contenidos con el único fin de prestarte el servicio (almacenarlos,
            transmitirlos, mostrarlos en tu panel y landing). No los usamos para
            otros fines y no los compartimos más allá de lo declarado en nuestra
            Política de privacidad.
          </P>
          <P>
            Sos responsable de la legalidad de los contenidos que generes y
            transmitas. Si terceros reclaman por contenidos cargados desde tu
            cuenta, sos responsable de responder.
          </P>
        </Section>

        <Section title="6. Propiedad intelectual">
          <P>
            El software, diseño, marca, código fuente, documentación y todo el
            material relacionado con <Strong>{INNOVATE_IA_NOMBRE}</Strong> son
            de nuestra propiedad exclusiva (o de los licenciantes con los que
            tenemos acuerdo) y están protegidos por la legislación argentina e
            internacional de propiedad intelectual.
          </P>
          <P>
            Te otorgamos una licencia limitada, no exclusiva, intransferible y
            revocable para usar el servicio mientras tu cuenta esté activa.
            No podés copiar, redistribuir, modificar, sublicenciar ni crear
            obras derivadas del servicio sin autorización por escrito.
          </P>
        </Section>

        <Section title="7. Disponibilidad del servicio">
          <P>
            Hacemos esfuerzos razonables para mantener el servicio disponible
            las 24 horas, los 7 días de la semana. Sin embargo, NO garantizamos
            disponibilidad ininterrumpida. Pueden ocurrir interrupciones por:
          </P>
          <BulletList items={[
            'Mantenimiento programado (te avisamos con al menos 24hs de anticipación cuando es posible).',
            'Fallas de proveedores externos (Supabase, Vercel, Meta, etc.).',
            'Causas de fuerza mayor (cortes de energía regionales, ataques DDoS, etc.).',
            'Actualizaciones de seguridad críticas.',
          ]} />
          <P>
            Las interrupciones razonables no generan derecho a reembolso. Si
            una interrupción imputable exclusivamente a nosotros supera las
            48 horas continuas, te compensamos con créditos equivalentes a los
            días afectados.
          </P>
        </Section>

        <Section title="8. Limitación de responsabilidad">
          <P>
            El servicio se presta “tal cual”. <Strong>{INNOVATE_IA_NOMBRE}</Strong>
            no garantiza que:
          </P>
          <BulletList items={[
            'El servicio cumpla con todas tus expectativas comerciales.',
            'El bot responda perfectamente en todos los escenarios (la IA puede equivocarse).',
            'Los pagos o cobros se procesen sin demora (depende de los proveedores externos).',
            'Los mensajes lleguen en todo momento (depende de la red y de Meta).',
          ]} />
          <P>
            En la medida máxima permitida por la ley argentina, nuestra
            responsabilidad total por cualquier reclamo derivado del uso del
            servicio se limita al monto pagado por vos en los <Strong>últimos 3
            meses</Strong>. No respondemos por daños indirectos, lucro cesante,
            pérdida de oportunidades comerciales o daño reputacional.
          </P>
        </Section>

        <Section title="9. Suspensión y terminación">
          <P>
            Podés dar de baja tu cuenta en cualquier momento desde el panel o
            escribiendo a <Mono>{INNOVATE_IA_EMAIL}</Mono>. Al darla de baja:
          </P>
          <BulletList items={[
            'Perdés el acceso al panel y al servicio.',
            'Los créditos no activados pueden reembolsarse si estás dentro del plazo de 7 días (ver punto 3).',
            'Tus datos se eliminan según lo que dice la Política de privacidad.',
          ]} />
          <P>
            Nosotros podemos suspender o cancelar tu cuenta, con previo aviso
            de 7 días (salvo casos urgentes), si:
          </P>
          <BulletList items={[
            'Incumplís estos términos de forma grave o reiterada.',
            'Usás el servicio para actividades ilícitas.',
            'Una autoridad competente lo solicita por orden judicial.',
            'Hay riesgo grave para la seguridad de la plataforma o de otros usuarios.',
          ]} />
          <P>
            En casos urgentes (fraude, riesgo de seguridad, denuncia judicial)
            podemos suspender inmediatamente sin previo aviso y notificarte
            después.
          </P>
        </Section>

        <Section title="10. Modificaciones de los términos">
          <P>
            Podemos actualizar estos términos por cambios legales, técnicos o
            del producto. Si los cambios son sustanciales, te avisamos por
            email o desde el panel con al menos 15 días de anticipación. Si
            no estás de acuerdo con los cambios, podés dar de baja tu cuenta
            antes de que entren en vigencia. El uso continuado del servicio
            después de la fecha de vigencia implica aceptación.
          </P>
        </Section>

        <Section title="11. Ley aplicable y jurisdicción">
          <P>
            Estos términos se rigen por las leyes de la <Strong>República
            Argentina</Strong>. Cualquier controversia derivada del uso del
            servicio se someterá a los <Strong>{JURISDICCION}</Strong>,
            renunciando expresamente a cualquier otro fuero o jurisdicción
            que pudiera corresponder.
          </P>
        </Section>

        <Section title="12. Contacto">
          <P>
            Para cualquier consulta sobre estos términos, escribinos a:
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

        <div style={{
          marginTop: 20,
          padding: 14,
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: RADIUS.md,
          fontSize: FONT_SIZE.sm,
          color: C.muted,
          lineHeight: 1.6,
        }}>
          <Strong>Al usar este servicio</Strong>, declarás haber leído,
          entendido y aceptado estos términos en su totalidad, así como la{' '}
          <Strong>Política de privacidad</Strong> que los complementa.
        </div>
      </Card>
    </div>
  )
}

// ─── Sub-componentes (mismos que en RetailPrivacidad para coherencia) ─────────
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
      <div>{children}</div>
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
