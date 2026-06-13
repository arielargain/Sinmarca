// ════════════════════════════════════════════════════════════════════
// InstruccionesSaldo — Guía sobre Saldo y créditos
//
// 17/05/2026 — v2: REESCRITA con datos reales de Billing.jsx.
// Quita los precios USD inventados y las equivalencias falsas.
// Explica el MODELO (sin duplicar la tabla de packs, que vive en /billing).
//
// Audiencia: partner final de Modo Ahorro. Le importa entender CÓMO
// funciona el saldo, no memorizar precios (los ve en la página real).
//
// 12/06/2026 — v3: scope-aware. SOLO el panel retail (/mi-cuenta) usa
// TUTORIAL_HTML_RETAIL (importado de ./instruccionesSaldoRetailHtml):
// un solo saldo (créditos = días), línea/bot + campañas, sin multimedia.
// Partner y sub-tenant siguen con el TUTORIAL_HTML original.
// ════════════════════════════════════════════════════════════════════

import { useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import { COLORS, FONT_WEIGHT } from '../theme/tokens'
import { getInstruccionesBase, getInstruccionesScope } from '../lib/instruccionesScope'
import { TUTORIAL_HTML_RETAIL } from './instruccionesSaldoRetailHtml'

const C = COLORS

const TUTORIAL_HTML = `
<style>
  .sd-tutorial {
    --gold: #D4A843;
    --gold2: #F0C96A;
    --bg: #050709;
    --surf: #0C0F14;
    --surf2: #14181F;
    --border: #1a1f2e;
    --border2: #2a3142;
    --text: #E8E4D9;
    --muted: #6a7180;
    --muted2: #8a909e;
    background: var(--bg);
    color: var(--text);
    font-family: 'DM Sans', sans-serif;
    line-height: 1.6;
    padding: clamp(28px, 3vw, 56px) clamp(16px, 3vw, 64px) clamp(60px, 5vw, 120px);
  }
  .sd-tutorial * { box-sizing: border-box; margin: 0; padding: 0; }
  .sd-tutorial .container { max-width: clamp(920px, 75vw, 1400px); margin: 0 auto; }

  .sd-tutorial .head { text-align: center; margin-bottom: clamp(50px, 4vw, 80px); }
  .sd-tutorial .head .chip {
    display: inline-block; padding: 6px 14px; border-radius: 99px;
    background: rgba(212,168,67,.08); border: 1px solid rgba(212,168,67,.25);
    color: var(--gold); font-size: clamp(11px, 0.7vw, 14px); font-weight: 600;
    letter-spacing: .1em; text-transform: uppercase; margin-bottom: 18px;
  }
  .sd-tutorial .head h1 { font-size: clamp(26px, 3vw, 52px); font-weight: 800; letter-spacing: -.02em; margin-bottom: 14px; color: var(--text); }
  .sd-tutorial .head h1 .accent { color: var(--gold); }
  .sd-tutorial .head p { font-size: clamp(15px, 1vw, 19px); color: var(--muted); max-width: clamp(580px, 50vw, 880px); margin: 0 auto; }
  .sd-tutorial .head .meta { display: inline-flex; gap: 18px; margin-top: 22px; font-size: clamp(12px, 0.85vw, 15px); color: var(--muted2); flex-wrap: wrap; justify-content: center; }
  .sd-tutorial .head .meta span { display: inline-flex; align-items: center; gap: 6px; }
  .sd-tutorial .head .meta strong { color: var(--text); font-weight: 500; }

  .sd-tutorial .step-card {
    background: var(--surf); border: 1px solid var(--border); border-radius: 18px;
    padding: clamp(28px, 2.4vw, 44px) clamp(26px, 2.2vw, 40px); margin-bottom: clamp(24px, 2vw, 36px); position: relative; overflow: hidden;
  }
  .sd-tutorial .step-card::before { content: ''; position: absolute; top: 0; left: 0; width: 4px; height: 100%; background: var(--gold); }
  .sd-tutorial .step-head { display: flex; align-items: flex-start; gap: clamp(16px, 1.4vw, 24px); margin-bottom: clamp(22px, 1.8vw, 32px); }
  .sd-tutorial .step-num {
    flex-shrink: 0; width: clamp(44px, 3.6vw, 64px); height: clamp(44px, 3.6vw, 64px); border-radius: clamp(12px, 1vw, 16px);
    background: var(--gold); color: var(--bg); font-size: clamp(19px, 1.6vw, 26px); font-weight: 800;
    display: flex; align-items: center; justify-content: center;
  }
  .sd-tutorial .step-meta { flex: 1; min-width: 0; }
  .sd-tutorial .step-tag { display: inline-block; font-size: clamp(10px, 0.7vw, 13px); font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: var(--gold); margin-bottom: 4px; }
  .sd-tutorial .step-title { font-size: clamp(20px, 1.8vw, 32px); font-weight: 700; letter-spacing: -.01em; line-height: 1.25; color: var(--text); }
  .sd-tutorial .step-body { font-size: clamp(14px, 1vw, 17px); color: var(--muted); line-height: 1.65; }
  .sd-tutorial .step-body p { margin-bottom: 12px; }
  .sd-tutorial .step-body strong { color: var(--text); font-weight: 600; }
  .sd-tutorial .step-body code { background: var(--surf2); border: 1px solid var(--border2); border-radius: 5px; padding: 1px 7px; font-family: 'JetBrains Mono', monospace; font-size: 12px; color: var(--gold2); }
  .sd-tutorial .step-body ul, .sd-tutorial .step-body ol { margin: 8px 0 14px 22px; }
  .sd-tutorial .step-body li { margin-bottom: 6px; }

  .sd-tutorial .two-wallets {
    display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin: 18px 0;
  }
  .sd-tutorial .wallet-box {
    background: #0D0F1A; border: 1px solid var(--border); border-radius: 12px;
    padding: 18px 20px;
  }
  .sd-tutorial .wallet-box.operational { border-color: rgba(34,197,94,.3); background: rgba(34,197,94,.02); }
  .sd-tutorial .wallet-box.multimedia  { border-color: rgba(167,139,250,.3); background: rgba(167,139,250,.02); }
  .sd-tutorial .wallet-emoji { font-size: 28px; margin-bottom: 8px; }
  .sd-tutorial .wallet-title { font-size: 15px; font-weight: 700; color: #E9E7E0; margin-bottom: 4px; }
  .sd-tutorial .wallet-subtitle { font-size: 11px; color: var(--muted); font-family: 'JetBrains Mono', monospace; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 10px; }
  .sd-tutorial .wallet-desc { font-size: 12px; color: var(--text); line-height: 1.55; }

  .sd-tutorial .equiv-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 9px 14px; background: #0D0F1A; border: 1px solid var(--border);
    border-radius: 7px; margin-bottom: 6px;
  }
  .sd-tutorial .equiv-row .label { font-size: 12px; color: var(--text); }
  .sd-tutorial .equiv-row .ratio { font-size: 12px; color: var(--gold); font-weight: 700; font-family: 'JetBrains Mono', monospace; }

  .sd-tutorial .panel-mock {
    background: #080B12; border-radius: 12px; margin: 22px 0; overflow: hidden;
    box-shadow: 0 24px 64px rgba(0,0,0,.5); color: #E9E7E0; border: 1px solid var(--border);
  }
  .sd-tutorial .panel-mock .pm-topbar { background: #0D0F1A; padding: 9px 14px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 10px; }
  .sd-tutorial .panel-mock .pm-dots { display: flex; gap: 5px; }
  .sd-tutorial .panel-mock .pm-dots span { width: 10px; height: 10px; border-radius: 50%; background: #2a3142; }
  .sd-tutorial .panel-mock .pm-url { flex: 1; font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--muted2); padding: 4px 10px; background: #14181F; border-radius: 5px; border: 1px solid #1a1f2e; }
  .sd-tutorial .panel-mock .pm-body { padding: 22px; }

  .sd-tutorial .saldo-card {
    background: linear-gradient(135deg, #1a1408 0%, #0d0b04 100%);
    border: 1px solid rgba(212,168,67,.3); border-radius: 12px;
    padding: 16px 18px; margin-bottom: 10px;
  }
  .sd-tutorial .saldo-label { font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.08em; font-family: 'JetBrains Mono', monospace; margin-bottom: 4px; }
  .sd-tutorial .saldo-value { font-size: 28px; font-weight: 800; color: var(--gold); font-family: 'JetBrains Mono', monospace; }
  .sd-tutorial .saldo-meta { font-size: 11px; color: var(--muted); margin-top: 4px; }

  .sd-tutorial .pay-method {
    display: flex; gap: 12px; align-items: flex-start;
    padding: 12px 14px; background: #0D0F1A; border: 1px solid var(--border);
    border-radius: 8px; margin-bottom: 8px;
  }
  .sd-tutorial .pay-method .icon {
    width: 36px; height: 36px; border-radius: 8px;
    background: rgba(212,168,67,.08); border: 1px solid rgba(212,168,67,.2);
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; flex-shrink: 0;
  }
  .sd-tutorial .pay-method .name { font-size: 13px; font-weight: 700; color: #E9E7E0; margin-bottom: 2px; }
  .sd-tutorial .pay-method .desc { font-size: 11px; color: var(--muted); line-height: 1.5; }

  .sd-tutorial .tip {
    background: rgba(212,168,67,.05); border-left: 3px solid var(--gold);
    border-radius: 0 7px 7px 0; padding: 12px 16px; margin: 14px 0;
    font-size: 13px; color: var(--text);
  }
  .sd-tutorial .tip strong { color: var(--gold); }

  .sd-tutorial .info {
    background: rgba(59,130,246,.05); border-left: 3px solid #3b82f6;
    color: var(--text); padding: 12px 16px; margin: 14px 0;
    font-size: 13px; border-radius: 0 7px 7px 0;
  }
  .sd-tutorial .info strong { color: #60a5fa; }

  .sd-tutorial .danger {
    background: rgba(239,68,68,.05); border-left: 3px solid #ef4444;
    color: var(--text); padding: 12px 16px; margin: 14px 0;
    font-size: 13px; border-radius: 0 7px 7px 0;
  }
  .sd-tutorial .danger strong { color: #ff7373; }

  .sd-tutorial .success {
    background: rgba(34,197,94,.05); border-left: 3px solid #22c55e;
    color: var(--text); padding: 12px 16px; margin: 14px 0;
    font-size: 13px; border-radius: 0 7px 7px 0;
  }
  .sd-tutorial .success strong { color: #22c55e; }

  .sd-tutorial .summary {
    background: linear-gradient(180deg, var(--surf) 0%, rgba(212,168,67,.05) 100%);
    border: 1px solid rgba(212,168,67,.3); border-radius: 18px;
    padding: 30px 26px; margin-top: 36px;
  }
  .sd-tutorial .summary h2 { font-size: 20px; font-weight: 800; margin-bottom: 6px; color: var(--text); }
  .sd-tutorial .summary h2 .accent { color: var(--gold); }
  .sd-tutorial .summary > p { font-size: 13px; color: var(--muted); margin-bottom: 18px; }
  .sd-tutorial .summary-grid { display: grid; gap: 10px; }
  .sd-tutorial .summary-item { background: var(--surf2); border: 1px solid var(--border2); border-radius: 9px; padding: 13px 15px; display: flex; align-items: flex-start; gap: 12px; }
  .sd-tutorial .summary-check { flex-shrink: 0; width: 22px; height: 22px; border-radius: 50%; background: var(--gold); color: var(--bg); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; margin-top: 1px; }
  .sd-tutorial .summary-item-title { font-size: 13px; font-weight: 700; color: var(--text); margin-bottom: 2px; font-family: 'JetBrains Mono', monospace; }
  .sd-tutorial .summary-item-desc { font-size: 12px; color: var(--muted); }

  @media (max-width: 600px) {
    .sd-tutorial .step-card { padding: 22px 18px; }
    .sd-tutorial .step-head { flex-direction: column; gap: 14px; }
    .sd-tutorial .two-wallets { grid-template-columns: 1fr; }
  }
</style>

<div class="sd-tutorial">
  <div class="container">
    <header class="head">
      <div class="chip">Tutorial</div>
      <h1>Cómo funciona el <span class="accent">Saldo</span></h1>
      <p>Tu cuenta tiene <strong>dos saldos separados</strong>: uno para mantener tu línea WhatsApp operando día a día, y otro para generar contenido con IA en Studio. Esta guía explica el modelo. Los precios y packs concretos los ves en tu página de <code>Saldo</code>.</p>
      <div class="meta">
        <span>💵 <strong>Pagás por uso</strong></span>
        <span>♾ <strong>Los créditos no vencen</strong></span>
        <span>💳 <strong>MP en ARS o cripto en USD</strong></span>
      </div>
    </header>

    <article class="step-card">
      <div class="step-head">
        <div class="step-num">1</div>
        <div class="step-meta">
          <div class="step-tag">Lo primero</div>
          <h2 class="step-title">Hay dos saldos separados</h2>
        </div>
      </div>
      <div class="step-body">
        <p>El sistema divide tu gasto en dos saldos independientes que se manejan en la misma página (<code>/billing</code>), cada uno en su propio tab:</p>

        <div class="two-wallets">
          <div class="wallet-box operational">
            <div class="wallet-emoji">💬</div>
            <div class="wallet-title">Saldo operativo</div>
            <div class="wallet-subtitle">Créditos diarios</div>
            <div class="wallet-desc"><strong>1 crédito = 1 día de línea WhatsApp activa.</strong> Si pausás la línea, no se descuenta. Si nunca activás una línea, no consumís créditos operativos.</div>
          </div>
          <div class="wallet-box multimedia">
            <div class="wallet-emoji">🎨</div>
            <div class="wallet-title">Saldo multimedia</div>
            <div class="wallet-subtitle">Créditos CC</div>
            <div class="wallet-desc"><strong>Para generar imágenes, videos y voces en Studio.</strong> Se descuenta solo cuando generás algo. Si no usás Studio, no consumís CC.</div>
          </div>
        </div>

        <p>La gran ventaja de separarlos:</p>
        <ul>
          <li><strong>Generar contenido no toca tu operación.</strong> Podés gastar 1.000 CC en un día probando avatares sin perder días de línea activa.</li>
          <li><strong>Pagás solo lo que usás.</strong> Si solo querés WhatsApp y nunca Studio, comprás un pack operativo y listo.</li>
          <li><strong>Los precios son transparentes.</strong> No estás pagando una bolsa única donde no sabés qué consume cada cosa.</li>
        </ul>

        <div class="info"><strong>📍 Dónde verlos:</strong> en <code>Saldo</code> hay un segmented control arriba con tres tabs: 💬 Operativo · 🎨 Multimedia · 📜 Historial. Cada tab muestra el balance correspondiente y los packs disponibles para esa categoría.</div>
      </div>
    </article>

    <article class="step-card">
      <div class="step-head">
        <div class="step-num">2</div>
        <div class="step-meta">
          <div class="step-tag">Saldo operativo</div>
          <h2 class="step-title">$5 USD por día de línea activa</h2>
        </div>
      </div>
      <div class="step-body">
        <p>El modelo es simple:</p>
        <ul>
          <li>Tu línea está activa → se descuenta <strong>1 crédito por día</strong>.</li>
          <li>Equivalente a <strong>$5 USD por día activo</strong> (≈ $150 USD/mes si operás todos los días).</li>
          <li>Pausás la línea → <strong>no se descuenta nada</strong>.</li>
          <li><strong>Los créditos no vencen</strong>: si comprás 90 días y operás solo 30 ese trimestre, los otros 60 te esperan.</li>
        </ul>

        <p>Los packs disponibles van desde una semana hasta 6 meses, con descuento progresivo a mayor pack. Los ves todos en tu página <code>Saldo</code> tab Operativo — el precio se actualiza desde la base de datos, así que esta guía no los duplica para evitar quedar desactualizada.</p>

        <div class="success"><strong>💡 Por qué es bueno:</strong> a diferencia de las plataformas con suscripción mensual fija, acá pagás lo que operás. Vacaciones, temporada baja o pausa estratégica → no se descuenta nada. Volvés y seguís donde quedaste.</div>

        <p>Cuando comprás un pack desde la página, se abre Mercado Pago, pagás, y los créditos quedan acreditados en menos de 5 minutos vía webhook automático.</p>
      </div>
    </article>

    <article class="step-card">
      <div class="step-head">
        <div class="step-num">3</div>
        <div class="step-meta">
          <div class="step-tag">Saldo multimedia</div>
          <h2 class="step-title">Créditos CC para Studio</h2>
        </div>
      </div>
      <div class="step-body">
        <p>Los créditos CC se consumen solo cuando generás contenido en Studio. Cada tipo de generación tiene un costo distinto que el panel te muestra antes de generar.</p>

        <p>Para que tengas una idea aproximada del rendimiento de tu balance, la página te muestra estas equivalencias:</p>

        <div class="equiv-row">
          <span class="label">🖼 1 imagen IA</span>
          <span class="ratio">≈ 5 CC</span>
        </div>
        <div class="equiv-row">
          <span class="label">🎬 1 video Turbo</span>
          <span class="ratio">≈ 55 CC</span>
        </div>
        <div class="equiv-row">
          <span class="label">🎤 1 min de voz</span>
          <span class="ratio">≈ 25 CC</span>
        </div>

        <p>Los costos exactos por modelo (avatares con MultiTalk / Fabric / OmniHuman, videos HQ vs Turbo, etc) los explica la guía de <strong>Studio</strong>. Acá lo importante es que estos costos se descuentan automáticamente del saldo multimedia, no del operativo.</p>

        <p>Cuando tu balance baja de 20 CC el panel te muestra una alerta de "poco saldo". Comprás un pack del tab Multimedia, MP procesa el pago, y los CC se acreditan al instante.</p>

        <div class="tip"><strong>📊 Movimientos visibles:</strong> en la página podés ver el historial de los últimos movimientos con su razón: compra, consumo imagen, consumo video Turbo, consumo video HQ, consumo voz, ajuste admin, reembolso, bonus. Cada uno indica el delta y el saldo después de la operación.</div>
      </div>
    </article>

    <article class="step-card">
      <div class="step-head">
        <div class="step-num">4</div>
        <div class="step-meta">
          <div class="step-tag">Activación de línea</div>
          <h2 class="step-title">Es un pago aparte, no un crédito</h2>
        </div>
      </div>
      <div class="step-body">
        <p>Hay un tercer concepto que <strong>NO es un crédito</strong>: la activación de la línea WhatsApp.</p>

        <p>La activación es un <strong>pago único por línea</strong> que cubre la vinculación del número a la API oficial de Meta y la configuración inicial. El precio lo ves en tu página de Saldo, debajo de los packs operativos, como un addon destacado con su propia tarjeta.</p>

        <p>Lo importante de la activación:</p>
        <ul>
          <li>Se paga <strong>una sola vez por número</strong>. Una vez activa, la línea queda tuya — solo pagás los créditos diarios para operarla.</li>
          <li>Incluye <strong>15 días de garantía</strong> con cambio automático de número si Meta bloquea, hay error técnico nuestro o la WhatsApp API deja de funcionar. La garantía aplica durante horario de atención de 09 a 00hs. Detalles en <code>/legal/garantia</code>.</li>
          <li>Requiere una <strong>SIM sin cuenta de WhatsApp personal activa</strong>. Si el número ya tiene WhatsApp instalado, primero hay que desinstalar la app de ese teléfono o usar otro número.</li>
        </ul>

        <div class="danger"><strong>⚠ Antes de pagar:</strong> verificá que el número cumple los requisitos. Si la falla en la activación viene por haber usado un número con WhatsApp ya activo, el pago no se reembolsa porque el problema no es nuestro. La garantía cubre fallas de Meta / técnicas del sistema, no errores del lado del usuario al elegir el número.</div>
      </div>
    </article>

    <article class="step-card">
      <div class="step-head">
        <div class="step-num">5</div>
        <div class="step-meta">
          <div class="step-tag">Métodos de pago</div>
          <h2 class="step-title">Mercado Pago (ARS) o cripto (USD)</h2>
        </div>
      </div>
      <div class="step-body">
        <p>Cada pack tiene dos botones de compra: <strong>Pagar ARS</strong> y <strong>₿ Cripto</strong>.</p>

        <div class="pay-method">
          <div class="icon">💳</div>
          <div>
            <div class="name">Mercado Pago — botón "Pagar ARS"</div>
            <div class="desc">Click → se abre un checkout de Mercado Pago. Pagás con tarjeta, transferencia, dinero en cuenta o billetera digital. El cobro se hace en pesos al tipo de cambio del día (cotización MP). El monto exacto en ARS aparece <strong>antes</strong> de confirmar — no hay sorpresas. Los créditos se acreditan automáticamente en menos de 5 minutos vía webhook.</div>
          </div>
        </div>

        <div class="pay-method">
          <div class="icon">₿</div>
          <div>
            <div class="name">Cripto — botón "₿ Cripto"</div>
            <div class="desc">Click → elegís moneda (USDT TRC20, ETH o BTC) → se crea un <strong>ticket en soporte</strong> con prioridad urgente y te redirige a <code>/soporte</code>. Un operador te envía la dirección de la wallet para hacer la transferencia. Esto no es un checkout automático — es asistido por un humano para evitar fraudes y problemas con direcciones equivocadas.</div>
          </div>
        </div>

        <div class="info"><strong>💡 Sobre el cobro en pesos:</strong> todos los precios se muestran en USD como referencia. El cobro real en ARS se calcula al momento del pago. Si pagás con cripto, no aplica conversión — pagás los USD exactos.</div>

        <p>El historial de pagos lo ves en el tab "📜 Historial" del mismo /billing. Trae los últimos 10 movimientos desde la tabla <code>processed_payments</code> (estado, fecha, monto, ID de MP). Lo usás para reconciliar gastos o conseguir comprobantes.</p>
      </div>
    </article>

    <article class="step-card">
      <div class="step-head">
        <div class="step-num">6</div>
        <div class="step-meta">
          <div class="step-tag">Quedarte sin saldo</div>
          <h2 class="step-title">Qué pasa si tu balance llega a cero</h2>
        </div>
      </div>
      <div class="step-body">
        <p><strong>Si te quedás sin saldo operativo:</strong></p>
        <ul>
          <li>La línea se <strong>pausa automáticamente</strong>.</li>
          <li>El bot deja de responder mensajes nuevos hasta que recargues.</li>
          <li><strong>Tus datos, configuración, chats, contactos y ventas se preservan intactos</strong>. Nada se pierde.</li>
          <li>Cuando recargás, la línea se reactiva al instante.</li>
          <li>El indicador "ACCIÓN REQUERIDA" aparece en pulso rojo en la página de Saldo.</li>
        </ul>

        <p><strong>Si te quedás sin saldo multimedia:</strong></p>
        <ul>
          <li>No podés generar contenido nuevo en Studio.</li>
          <li>El contenido ya generado en tu biblioteca sigue disponible.</li>
          <li>El resto del panel funciona normal — la línea sigue operando porque depende del otro saldo.</li>
        </ul>

        <div class="tip"><strong>📌 Importante:</strong> tu billetera (MP, Ualá, etc.) <strong>NO depende del saldo operativo del bot</strong>. Si alguien paga un link de Mercado Pago mientras tu bot está sin créditos, el cobro entra a tu cuenta MP igual — lo único pausado es el bot que envía mensajes.</div>

        <p>Si querés pausar voluntariamente (vacaciones, temporada baja):</p>
        <ul>
          <li>Andá a <code>Líneas</code> y pausá manualmente. No se descuentan créditos mientras esté pausada.</li>
          <li>Cuando volvés, activás otra vez y seguís donde quedaste.</li>
        </ul>
      </div>
    </article>

    <section class="summary">
      <h2>Resumen del modelo de <span class="accent">Saldo.</span></h2>
      <p>Lo que tenés que recordar:</p>
      <div class="summary-grid">
        <div class="summary-item">
          <div class="summary-check">1</div>
          <div>
            <div class="summary-item-title">Dos saldos separados</div>
            <div class="summary-item-desc">Operativo (días de línea) y multimedia (CC de Studio). Independientes. Se manejan desde el mismo /billing con tabs.</div>
          </div>
        </div>
        <div class="summary-item">
          <div class="summary-check">2</div>
          <div>
            <div class="summary-item-title">$5 USD por día activo · sin suscripción</div>
            <div class="summary-item-desc">No hay débito automático. Comprás packs y los usás cuando querés. Si pausás, no se descuenta.</div>
          </div>
        </div>
        <div class="summary-item">
          <div class="summary-check">3</div>
          <div>
            <div class="summary-item-title">Los créditos no vencen</div>
            <div class="summary-item-desc">Comprás un pack semestral, operás solo 2 meses ese semestre → los otros 4 te esperan.</div>
          </div>
        </div>
        <div class="summary-item">
          <div class="summary-check">4</div>
          <div>
            <div class="summary-item-title">Activación de línea = pago único</div>
            <div class="summary-item-desc">No es crédito recurrente. Una sola vez por número. Incluye 15 días de garantía con cambio automático.</div>
          </div>
        </div>
        <div class="summary-item">
          <div class="summary-check">5</div>
          <div>
            <div class="summary-item-title">MP (ARS automático) o cripto (USD asistido)</div>
            <div class="summary-item-desc">Mercado Pago es checkout instantáneo. Cripto se procesa por ticket en soporte.</div>
          </div>
        </div>
        <div class="summary-item">
          <div class="summary-check">6</div>
          <div>
            <div class="summary-item-title">Sin saldo no se pierde nada</div>
            <div class="summary-item-desc">Datos intactos. La línea se reactiva al instante cuando recargás. Tu billetera (MP) sigue cobrando.</div>
          </div>
        </div>
      </div>
    </section>
  </div>
</div>
`

export default function InstruccionesSaldo() {
  const navigate = useNavigate()
  const location = useLocation()
  const containerRef = useRef(null)

  const backTo = getInstruccionesBase(location.pathname)
  // Solo el panel retail (/mi-cuenta) usa la guia nueva de un solo saldo
  // (creditos = dias, sin multimedia). Partner y sub-tenant siguen con el
  // TUTORIAL_HTML original. (El sub-tenant no tiene guia de saldo propia.)
  const scope = getInstruccionesScope(location.pathname)
  const tutorialHtml = scope === 'retail' ? TUTORIAL_HTML_RETAIL : TUTORIAL_HTML

  useEffect(() => {
    const id = 'sd-tutorial-fonts'
    if (document.getElementById(id)) return
    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap'
    document.head.appendChild(link)
  }, [])

  return (
    <div style={{ background: C.bg, minHeight: '100vh' }}>
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: 'rgba(5,7,9,0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${C.border}`,
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
      }}>
        <button
          onClick={() => navigate(backTo)}
          style={{
            background: 'transparent',
            border: `1px solid ${C.border}`,
            color: C.text,
            padding: '8px 14px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: FONT_WEIGHT.semibold,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          ← Volver
        </button>
        <span style={{
          fontSize: 12,
          color: C.muted,
          fontFamily: 'monospace',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}>
          Instrucciones / Saldo
        </span>
      </div>

      <div ref={containerRef} dangerouslySetInnerHTML={{ __html: tutorialHtml }} />
    </div>
  )
}
