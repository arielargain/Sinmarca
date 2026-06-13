// ═════════════════════════════════════════════════════════════════
// RetailCreditos.jsx — 13/05/2026
// ─────────────────────────────────────────────────────────────────
// Página explicativa de cómo funcionan los créditos para retail.
// Pura información estática + CTAs hacia /mi-cuenta/billing.
//
// 13/05/2026 — Reescritura completa con el modelo nuevo:
//   - Planes renombrados: Base / Pro / Gold (antes "Base o Gold")
//   - Rango de activación: 1 a 30 días por activación (antes era 1-7)
//   - WhatsApp por QR · gratis incluido desde Base y Pro
//   - Línea WhatsApp API oficial incluida en Gold + garantía 30 días
//     corridos desde la compra
//   - Modelo de saldo: el user elige cuándo y cuántos días activar;
//     una vez que activa, el saldo se consume y NO se puede pausar
//     ni revertir esa activación (la FAQ vieja decía "podés pausar
//     sin perder créditos" — eso ya no aplica).
//   - Créditos sin vencimiento (sigue igual)
// ═════════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react'
import { Link as NavLink } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import {
  PageHeader, SectionHeader, Card, Button,
  COLORS as C, RADIUS, FONT_SIZE, FONT_WEIGHT, FONT,
} from '../../components/ui'

export default function RetailCreditos() {
  const { retail } = useAuth()
  const [balance, setBalance] = useState(null)
  const [unlimited, setUnlimited] = useState(false)

  useEffect(() => {
    let alive = true
    ;(async () => {
      const { data: cred, error } = await supabase
        .from('credits')
        .select('balance, unlimited')
        .maybeSingle()
      if (!alive) return
      if (!error && cred) {
        setBalance(cred.balance ?? 0)
        setUnlimited(cred.unlimited === true)
      }
    })()
    return () => { alive = false }
  }, [retail?.id])

  // ── Días activos calculados ──────────────────────────────
  const until = retail?.activated_until ? new Date(retail.activated_until) : null
  const ms = until ? until.getTime() - Date.now() : 0
  const daysLeft = until && ms > 0 ? Math.ceil(ms / 86400000) : 0

  return (
    <div>
      <PageHeader
        eyebrow="Centro de saldo"
        title="¿Cómo funcionan los créditos?"
        subtitle="Lo que tenés que saber sobre tu saldo, cómo se consume y cómo recargarlo."
      />

      {/* ─── RESUMEN ACTUAL ───────────────────────────────────── */}
      <Card padding={20} style={{ marginBottom: 16 }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
        }}>
          <div>
            <div style={{
              fontSize: FONT_SIZE.xs,
              fontFamily: FONT.mono,
              color: C.muted,
              textTransform: 'uppercase',
              letterSpacing: '.08em',
              fontWeight: FONT_WEIGHT.semibold,
              marginBottom: 6,
            }}>Tu saldo actual</div>
            <div style={{
              fontSize: 32,
              fontWeight: FONT_WEIGHT.bold,
              color: unlimited ? C.success : (balance < 5 ? C.danger : balance < 15 ? C.brand : C.text),
              fontFamily: FONT.mono,
              lineHeight: 1,
            }}>
              {unlimited ? '∞' : (balance ?? '…')}
            </div>
            <div style={{
              fontSize: FONT_SIZE.sm,
              color: C.muted,
              marginTop: 4,
            }}>créditos disponibles</div>
          </div>

          <div>
            <div style={{
              fontSize: FONT_SIZE.xs,
              fontFamily: FONT.mono,
              color: C.muted,
              textTransform: 'uppercase',
              letterSpacing: '.08em',
              fontWeight: FONT_WEIGHT.semibold,
              marginBottom: 6,
            }}>Días activos restantes</div>
            <div style={{
              fontSize: 32,
              fontWeight: FONT_WEIGHT.bold,
              color: daysLeft > 0 ? C.success : C.danger,
              fontFamily: FONT.mono,
              lineHeight: 1,
            }}>
              {daysLeft}
            </div>
            <div style={{
              fontSize: FONT_SIZE.sm,
              color: C.muted,
              marginTop: 4,
            }}>{daysLeft === 1 ? 'día' : 'días'} de servicio activo</div>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-start',
            gap: 8,
          }}>
            <NavLink to="/mi-cuenta/billing" style={{ textDecoration: 'none' }}>
              <Button variant="primary" size="md">💳 Recargar saldo</Button>
            </NavLink>
            <NavLink to="/mi-cuenta" style={{ textDecoration: 'none' }}>
              <Button variant="ghost" size="sm">Activar días →</Button>
            </NavLink>
          </div>
        </div>
      </Card>

      {/* ─── REGLA DE ORO ─────────────────────────────────────── */}
      <Card padding={24} style={{
        marginBottom: 16,
        background: `linear-gradient(135deg, ${C.brand}15, ${C.brand}05)`,
        border: `1px solid ${C.brand}40`,
      }}>
        <div style={{
          fontSize: FONT_SIZE.xs,
          fontFamily: FONT.mono,
          color: C.brand,
          textTransform: 'uppercase',
          letterSpacing: '.10em',
          fontWeight: FONT_WEIGHT.bold,
          marginBottom: 8,
        }}>La regla principal</div>
        <h2 style={{
          margin: '0 0 10px',
          fontSize: 28,
          fontWeight: FONT_WEIGHT.bold,
          color: C.text,
          letterSpacing: '-0.01em',
          lineHeight: 1.2,
        }}>
          1 crédito = 1 día de servicio activo
        </h2>
        <p style={{
          margin: 0,
          fontSize: FONT_SIZE.base,
          color: C.text,
          lineHeight: 1.6,
        }}>
          Cuando activás días desde tu panel, se descuenta <strong style={{ color: C.brand }}>1 crédito
          por cada día</strong> que sumes. Podés activar entre 1 y 30 días por vez.
          Mientras no actives, los créditos quedan en tu cuenta sin vencimiento —
          son tuyos hasta que decidas usarlos.
        </p>
      </Card>

      {/* ─── QUÉ INCLUYE UN DÍA ──────────────────────────────── */}
      <Card padding={24} style={{ marginBottom: 16 }}>
        <SectionHeader title="✅ ¿Qué incluye un día activo?" style={{ marginBottom: 14 }} />
        <p style={{
          fontSize: FONT_SIZE.base,
          color: C.muted,
          margin: '0 0 16px',
          lineHeight: 1.55,
        }}>
          Con cada día activado, tenés acceso completo a:
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 14,
        }}>
          <IncludedItem
            icon="💬"
            title="Chats ilimitados"
            desc="El bot atiende todos los mensajes de WhatsApp que entren, sin tope."
          />
          <IncludedItem
            icon="🤖"
            title="Agente IA activo"
            desc="Responde, vende, deriva a humano cuando hace falta."
          />
          <IncludedItem
            icon="📱"
            title="WhatsApp por QR"
            desc="Vinculá tu WhatsApp existente escaneando un QR. Sin trámites con Meta."
          />
          <IncludedItem
            icon="🌐"
            title="Landing online"
            desc="Tu landing pública accesible 24/7, optimizada para conversión."
          />
          <IncludedItem
            icon="📊"
            title="Dashboard + ventas"
            desc="Métricas en tiempo real, registro de ventas, exportación CSV/JSON."
          />
          <IncludedItem
            icon="🔗"
            title="Integraciones"
            desc="Meta Pixel, Google Analytics, billeteras (MP, Ualá, MODO, etc.)."
          />
          <IncludedItem
            icon="📈"
            title="Remarketing automático"
            desc="El bot recontacta clientes que no completaron compra/registro."
          />
        </div>

        {/* Aclaración sobre WA API oficial (diferenciador Gold) */}
        <div style={{
          marginTop: 18,
          padding: 14,
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: RADIUS.md,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
        }}>
          <span style={{ fontSize: 22, flexShrink: 0 }}>👑</span>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: FONT_SIZE.base,
              fontWeight: FONT_WEIGHT.bold,
              color: C.text,
              marginBottom: 4,
            }}>¿Querés WhatsApp API oficial?</div>
            <div style={{
              fontSize: FONT_SIZE.sm,
              color: C.muted,
              lineHeight: 1.5,
            }}>
              La línea oficial de Meta (con tilde verde de empresa y garantía
              de cambio si Meta bloquea) viene incluida solo en el plan{' '}
              <strong style={{ color: C.text }}>Gold</strong>, o se puede comprar
              como add-on aparte. Base y Pro usan la modalidad QR, que es
              gratis y se vincula con tu número de WhatsApp existente.
            </div>
          </div>
        </div>
      </Card>

      {/* ─── PLANES (overview) ──────────────────────────────── */}
      <Card padding={24} style={{ marginBottom: 16 }}>
        <SectionHeader title="🎯 ¿Qué plan me conviene?" style={{ marginBottom: 14 }} />
        <p style={{
          fontSize: FONT_SIZE.base,
          color: C.muted,
          margin: '0 0 16px',
          lineHeight: 1.55,
        }}>
          Tenemos tres planes operativos, todos con el mismo modelo de créditos
          (1 crédito = 1 día). Cambian la cantidad de días, sesiones simultáneas
          y servicios extra:
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 14,
        }}>
          <PlanOverview
            icon="⚡"
            name="Base"
            days="15 días"
            extras={[
              '1 sesión abierta',
              'WhatsApp por QR · gratis',
              'Agente IA completo',
            ]}
          />
          <PlanOverview
            icon="🚀"
            name="Pro"
            days="30 días"
            extras={[
              '3 sesiones abiertas',
              'WhatsApp por QR · gratis',
              'Agente IA completo',
            ]}
          />
          <PlanOverview
            icon="👑"
            name="Gold"
            days="30 días"
            extras={[
              '10 sesiones abiertas',
              'WhatsApp API oficial incluido',
              'Garantía 30 días corridos',
              'Dev dedicado + soporte prioritario',
            ]}
            highlighted
          />
        </div>
        <div style={{
          marginTop: 16,
          textAlign: 'center',
        }}>
          <NavLink to="/mi-cuenta/billing" style={{ textDecoration: 'none' }}>
            <Button variant="primary" size="md">Ver precios y comprar →</Button>
          </NavLink>
        </div>
      </Card>

      {/* ─── CÓMO CONSEGUIR MÁS ─────────────────────────────── */}
      <Card padding={24} style={{ marginBottom: 16 }}>
        <SectionHeader title="💳 ¿Cómo consigo más créditos?" style={{ marginBottom: 14 }} />
        <p style={{
          fontSize: FONT_SIZE.base,
          color: C.muted,
          margin: '0 0 16px',
          lineHeight: 1.55,
        }}>
          Comprá un plan o pack desde la sección{' '}
          <strong style={{ color: C.text }}>Saldo</strong>. Aceptamos:
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 14,
        }}>
          <PaymentMethod
            icon="💵"
            title="Mercado Pago"
            desc="Acreditación inmediata. Tarjetas, transferencia, dinero en cuenta."
          />
          <PaymentMethod
            icon="₿"
            title="Cripto (USDT TRC20)"
            desc="Pago desde cualquier wallet. Confirma automático al detectar el depósito."
          />
        </div>

        <div style={{
          marginTop: 18,
          padding: 14,
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: RADIUS.md,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: 24, flexShrink: 0 }}>💡</span>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{
              fontSize: FONT_SIZE.base,
              fontWeight: FONT_WEIGHT.bold,
              color: C.text,
              marginBottom: 2,
            }}>Más días por plan, mejor precio por día</div>
            <div style={{ fontSize: FONT_SIZE.sm, color: C.muted, lineHeight: 1.4 }}>
              Pro y Gold tienen mejor precio por día que Base. Si pensás operar
              todos los días, conviene un plan más grande; si solo necesitás unos
              días sueltos, el plan Base alcanza.
            </div>
          </div>
          <NavLink to="/mi-cuenta/billing" style={{ textDecoration: 'none', flexShrink: 0 }}>
            <Button variant="primary" size="md">Ver planes →</Button>
          </NavLink>
        </div>
      </Card>

      {/* ─── FAQ ─────────────────────────────────────────────────── */}
      <Card padding={24} style={{ marginBottom: 16 }}>
        <SectionHeader title="❓ Preguntas frecuentes" style={{ marginBottom: 14 }} />
        <Faq
          q="¿Qué pasa si me quedo sin créditos?"
          a="Tu servicio se pausa: el bot deja de responder, tu landing puede mostrar un cartel de “inactiva” y no podés acceder a las secciones de Líneas y Landing. Los datos (chats, ventas, configuraciones) se mantienen — al recargar y activar días, vuelve todo a la normalidad."
        />
        <Faq
          q="¿Cuándo se descuentan los créditos?"
          a="Cuando vos activás días manualmente desde tu panel. Mientras los créditos están en tu saldo sin activar, no se consume nada — son tuyos hasta que decidas usarlos."
        />
        <Faq
          q="¿Cuántos días puedo activar de una vez?"
          a="Entre 1 y 30 días por activación. Podés hacer todas las activaciones que quieras hasta agotar tu saldo; cada activación consume tantos créditos como días sumes."
        />
        <Faq
          q="¿Puedo cancelar o pausar una activación después de hacerla?"
          a="No. Una vez que activás días, los créditos correspondientes se consumen en ese momento y la activación corre hasta vencerse — no se puede revertir ni recuperar el saldo. Por eso, activá solo la cantidad de días que realmente vayas a usar en ese período."
        />
        <Faq
          q="¿Qué pasa si activo días teniendo ya días activos?"
          a="Los nuevos días se SUMAN al período activo. Si tenés 3 días restantes y activás 5 más, te quedan 8 días corriendo. Nunca se pierde tiempo."
        />
        <Faq
          q="¿Los créditos vencen?"
          a="No. Una vez que los compraste, son tuyos hasta que los actives. Podés recargar hoy y usarlos dentro de 3 meses sin problema."
        />
        <Faq
          q="¿Cuál es la diferencia entre WhatsApp por QR y WhatsApp API oficial?"
          a="QR: vinculás tu WhatsApp existente escaneando un código, sin trámites con Meta. Viene gratis en todos los planes (Base, Pro y Gold). API oficial: línea con tilde verde de empresa y verificación oficial, gestionada por Meta. Está incluida solo en Gold (con garantía de cambio si Meta la bloquea durante 30 días corridos desde la compra), o se puede comprar como add-on aparte."
        />
        <Faq
          q="¿Qué cubre la garantía Gold de 30 días?"
          a="Cubre el cambio inmediato de número de WhatsApp API en caso de bloqueo por parte de Meta, error técnico o caída de la WhatsApp API. La garantía dura 30 días corridos desde la compra del plan Gold, hayas activado los días o no — empieza a correr desde el momento del pago. Después de esos 30 días, si Meta bloquea la línea, hay que pagar la activación de un número nuevo."
        />
        <Faq
          q="¿Puedo pedir reembolso?"
          a="Los créditos NO consumidos (los que están en tu saldo sin activar) pueden reembolsarse dentro de los 7 días corridos de la compra. Los días ya activados no son reembolsables. Para reembolso, contactanos desde Soporte."
        />
      </Card>

      {/* ─── CTA FINAL ────────────────────────────────────────── */}
      <Card padding={28} style={{
        textAlign: 'center',
        background: `linear-gradient(135deg, ${C.brand}10, transparent)`,
        border: `1px solid ${C.brand}30`,
      }}>
        <h3 style={{
          margin: '0 0 8px',
          fontSize: 20,
          fontWeight: FONT_WEIGHT.bold,
          color: C.text,
        }}>¿Todavía tenés dudas?</h3>
        <p style={{
          margin: '0 0 16px',
          fontSize: FONT_SIZE.base,
          color: C.muted,
          lineHeight: 1.55,
        }}>
          Escribinos a soporte y te respondemos en menos de 24hs hábiles.
        </p>
        <NavLink to="/mi-cuenta/soporte" style={{ textDecoration: 'none' }}>
          <Button variant="primary" size="md">🛠️ Contactar soporte</Button>
        </NavLink>
      </Card>
    </div>
  )
}

// ─── Sub-componentes ───────────────────────────────────────
function IncludedItem({ icon, title, desc }) {
  return (
    <div style={{
      padding: 14,
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: RADIUS.md,
      display: 'flex',
      gap: 12,
      alignItems: 'flex-start',
    }}>
      <span style={{ fontSize: 22, flexShrink: 0 }}>{icon}</span>
      <div>
        <div style={{
          fontSize: FONT_SIZE.base,
          fontWeight: FONT_WEIGHT.bold,
          color: C.text,
          marginBottom: 4,
        }}>{title}</div>
        <div style={{
          fontSize: FONT_SIZE.sm,
          color: C.muted,
          lineHeight: 1.5,
        }}>{desc}</div>
      </div>
    </div>
  )
}

function PaymentMethod({ icon, title, desc }) {
  return (
    <div style={{
      padding: 16,
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: RADIUS.md,
    }}>
      <div style={{
        fontSize: 28,
        marginBottom: 6,
      }}>{icon}</div>
      <div style={{
        fontSize: FONT_SIZE.base,
        fontWeight: FONT_WEIGHT.bold,
        color: C.text,
        marginBottom: 4,
      }}>{title}</div>
      <div style={{
        fontSize: FONT_SIZE.sm,
        color: C.muted,
        lineHeight: 1.5,
      }}>{desc}</div>
    </div>
  )
}

function PlanOverview({ icon, name, days, extras, highlighted }) {
  return (
    <div style={{
      padding: 16,
      background: highlighted
        ? `linear-gradient(180deg, ${C.brand}10, ${C.surface})`
        : C.surface,
      border: `1px solid ${highlighted ? C.brand + '40' : C.border}`,
      borderRadius: RADIUS.md,
      position: 'relative',
    }}>
      {highlighted && (
        <div style={{
          position: 'absolute', top: -10, right: 12,
          padding: '2px 8px', borderRadius: 99,
          background: C.brand, color: '#0a0d18',
          fontSize: 9, fontFamily: FONT.mono, fontWeight: FONT_WEIGHT.bold,
          letterSpacing: '.08em', textTransform: 'uppercase',
        }}>Premium</div>
      )}
      <div style={{ fontSize: 24, marginBottom: 4 }}>{icon}</div>
      <div style={{
        fontSize: FONT_SIZE.lg,
        fontWeight: FONT_WEIGHT.bold,
        color: C.text,
        marginBottom: 2,
      }}>{name}</div>
      <div style={{
        fontSize: FONT_SIZE.sm,
        fontFamily: FONT.mono,
        color: highlighted ? C.brand : C.muted,
        fontWeight: FONT_WEIGHT.semibold,
        marginBottom: 10,
        letterSpacing: '.02em',
      }}>{days}</div>
      <ul style={{
        listStyle: 'none', padding: 0, margin: 0,
        fontSize: FONT_SIZE.sm,
        color: C.muted,
        lineHeight: 1.55,
      }}>
        {extras.map((e, i) => (
          <li key={i} style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 6,
            marginBottom: 4,
          }}>
            <span style={{ color: C.success, flexShrink: 0 }}>✓</span>
            <span>{e}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Faq({ q, a }) {
  return (
    <details style={{
      padding: '12px 14px',
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: RADIUS.md,
      marginBottom: 8,
      cursor: 'pointer',
    }}>
      <summary style={{
        fontSize: FONT_SIZE.base,
        fontWeight: FONT_WEIGHT.semibold,
        color: C.text,
        listStyle: 'none',
        outline: 'none',
        userSelect: 'none',
      }}>▸ {q}</summary>
      <p style={{
        margin: '10px 0 2px',
        paddingLeft: 16,
        fontSize: FONT_SIZE.sm,
        color: C.muted,
        lineHeight: 1.6,
      }}>{a}</p>
    </details>
  )
}
