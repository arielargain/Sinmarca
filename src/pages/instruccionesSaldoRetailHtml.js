// ════════════════════════════════════════════════════════════════════
// instruccionesSaldoRetailHtml.js — 12/06/2026
// HTML de la guía de Saldo para RETAIL y SUB-TENANT (un solo saldo:
// créditos = días, línea/bot + campañas; sin multimedia/Studio).
// Lo consume InstruccionesSaldo.jsx según el scope. El partner sigue
// usando el TUTORIAL_HTML que vive inline en InstruccionesSaldo.jsx.
// ════════════════════════════════════════════════════════════════════

export const TUTORIAL_HTML_RETAIL = `
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

  .sd-tutorial .wallet-box {
    background: #0D0F1A; border: 1px solid var(--border); border-radius: 12px;
    padding: 18px 20px; margin: 18px 0;
  }
  .sd-tutorial .wallet-box.operational { border-color: rgba(34,197,94,.3); background: rgba(34,197,94,.02); }
  .sd-tutorial .wallet-emoji { font-size: 28px; margin-bottom: 8px; }
  .sd-tutorial .wallet-title { font-size: 15px; font-weight: 700; color: #E9E7E0; margin-bottom: 4px; }
  .sd-tutorial .wallet-subtitle { font-size: 11px; color: var(--muted); font-family: 'JetBrains Mono', monospace; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 10px; }
  .sd-tutorial .wallet-desc { font-size: 12px; color: var(--text); line-height: 1.55; }

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
  }
</style>

<div class="sd-tutorial">
  <div class="container">
    <header class="head">
      <div class="chip">Tutorial</div>
      <h1>Cómo funciona el <span class="accent">Saldo</span></h1>
      <p>En tu cuenta tenés <strong>un solo saldo</strong>: créditos que se convierten en días de servicio activo para tu línea, tu bot y tus campañas. Esta guía explica el modelo. Los precios y planes concretos los ves en tu sección de <code>Saldo</code>.</p>
      <div class="meta">
        <span>💵 <strong>Pagás por uso</strong></span>
        <span>♾ <strong>Los créditos no vencen</strong></span>
        <span>💳 <strong>Mercado Pago o cripto</strong></span>
      </div>
    </header>

    <article class="step-card">
      <div class="step-head">
        <div class="step-num">1</div>
        <div class="step-meta">
          <div class="step-tag">La regla principal</div>
          <h2 class="step-title">1 crédito = 1 día de servicio activo</h2>
        </div>
      </div>
      <div class="step-body">
        <p>Todo tu saldo es <strong>una sola bolsa de créditos</strong>. No hay saldos separados ni créditos especiales para distintas cosas: es un único número que ves arriba en tu panel.</p>

        <div class="wallet-box operational">
          <div class="wallet-emoji">💬</div>
          <div class="wallet-title">Tu saldo de créditos</div>
          <div class="wallet-subtitle">Créditos = días</div>
          <div class="wallet-desc"><strong>1 crédito equivale a 1 día de servicio activo.</strong> Vos decidís cuándo y cuántos días activar desde el panel: cada día que sumás descuenta 1 crédito.</div>
        </div>

        <p>Cómo funciona el consumo:</p>
        <ul>
          <li>Activás días desde tu panel: podés activar <strong>entre 1 y 30 días por vez</strong>.</li>
          <li>Se descuenta <strong>1 crédito por cada día</strong> que actives.</li>
          <li>Mientras no actives, los créditos quedan en tu cuenta. <strong>No vencen</strong>: podés recargar hoy y usarlos dentro de meses.</li>
        </ul>

        <div class="info"><strong>📍 Dónde verlo:</strong> tu saldo actual y los días activos restantes aparecen en la sección <code>Saldo</code> de tu panel, junto con el botón para recargar y para activar días.</div>
      </div>
    </article>

    <article class="step-card">
      <div class="step-head">
        <div class="step-num">2</div>
        <div class="step-meta">
          <div class="step-tag">Qué pagás</div>
          <h2 class="step-title">Qué incluye un día activo</h2>
        </div>
      </div>
      <div class="step-body">
        <p>Cada día que activás te da acceso completo a todo el servicio, no a una función suelta. Un día activo incluye:</p>
        <ul>
          <li><strong>Chats ilimitados:</strong> el bot atiende todos los mensajes de WhatsApp que entren, sin tope.</li>
          <li><strong>Agente IA:</strong> responde, vende y deriva a un humano cuando hace falta.</li>
          <li><strong>WhatsApp por QR:</strong> vinculás tu WhatsApp existente escaneando un código, sin trámites con Meta.</li>
          <li><strong>Landing pública:</strong> tu página online 24/7, optimizada para convertir.</li>
          <li><strong>Dashboard y ventas:</strong> métricas en tiempo real, registro de ventas y exportación.</li>
          <li><strong>Integraciones y remarketing:</strong> Meta Pixel, Google Analytics, billeteras (MP, Ualá, MODO) y recontacto automático de clientes.</li>
        </ul>

        <div class="tip"><strong>👑 WhatsApp por QR vs API oficial:</strong> el QR viene gratis en todos los planes. La línea oficial de Meta (con la tilde verde de empresa y garantía de cambio si Meta la bloquea) viene incluida en el plan <strong>Gold</strong> o se compra como add-on aparte. El detalle de cómo activar cada una está en la guía de <strong>Líneas</strong>.</div>
      </div>
    </article>

    <article class="step-card">
      <div class="step-head">
        <div class="step-num">3</div>
        <div class="step-meta">
          <div class="step-tag">Importante</div>
          <h2 class="step-title">Activar consume el saldo y no se revierte</h2>
        </div>
      </div>
      <div class="step-body">
        <p>Este es el punto más importante para no llevarte sorpresas:</p>
        <ul>
          <li>Cuando activás días, <strong>los créditos se consumen en ese momento</strong> y la activación corre hasta vencerse.</li>
          <li><strong>No se puede pausar ni revertir</strong> una activación ya hecha: esos días corren aunque no los uses, y el saldo no vuelve.</li>
          <li>Si activás días <strong>teniendo ya días corriendo</strong>, los nuevos se <strong>suman</strong> al período. Si te quedan 3 días y activás 5, te quedan 8.</li>
        </ul>

        <div class="danger"><strong>⚠ Activá solo lo que vas a usar:</strong> como la activación no se revierte, conviene activar la cantidad de días que realmente vas a operar en ese período, en lugar de activar de más "por las dudas".</div>

        <div class="success"><strong>💡 La ventaja:</strong> no hay suscripción ni débito automático. Si parás (vacaciones, temporada baja), simplemente no activás días y no se descuenta nada. Volvés cuando quieras y seguís donde quedaste.</div>
      </div>
    </article>

    <article class="step-card">
      <div class="step-head">
        <div class="step-num">4</div>
        <div class="step-meta">
          <div class="step-tag">Planes</div>
          <h2 class="step-title">Base, Pro y Gold — el mismo modelo</h2>
        </div>
      </div>
      <div class="step-body">
        <p>Hay tres planes operativos y los tres usan el mismo modelo de créditos (1 crédito = 1 día). Lo que cambia entre ellos es:</p>
        <ul>
          <li>La <strong>cantidad de días</strong> que incluye el plan.</li>
          <li>Las <strong>sesiones simultáneas</strong> (cuántas líneas podés tener abiertas a la vez).</li>
          <li>El <strong>precio por día</strong>: a mayor plan, mejor precio por día.</li>
          <li>Servicios extra: <strong>Gold</strong> incluye la línea WhatsApp API oficial, garantía de cambio de número si Meta bloquea, y soporte prioritario.</li>
        </ul>

        <p>Los precios y el detalle de cada plan los ves en tu sección de <code>Saldo</code> — se actualizan desde ahí, así que esta guía no los repite para no quedar desactualizada.</p>
      </div>
    </article>

    <article class="step-card">
      <div class="step-head">
        <div class="step-num">5</div>
        <div class="step-meta">
          <div class="step-tag">Campañas</div>
          <h2 class="step-title">La segunda línea, con el mismo saldo</h2>
        </div>
      </div>
      <div class="step-body">
        <p>Las <strong>Campañas</strong> (envíos masivos a tus contactos) funcionan como una "segunda línea" que se activa con <strong>los mismos créditos</strong> de tu saldo:</p>
        <ul>
          <li>Se descuenta <strong>1 crédito por cada día</strong> de campañas activado.</li>
          <li>Podés activar <strong>entre 1 y 7 días por vez</strong>.</li>
          <li>El plan <strong>Gold</strong> incluye 30 días de campañas sin costo extra.</li>
          <li>Mientras no actives Campañas, podés ver el módulo pero el <strong>envío queda bloqueado</strong> hasta activar.</li>
        </ul>

        <p>Las campañas tienen dos canales posibles, y conviene saber la diferencia:</p>
        <ul>
          <li><strong>Meta (API oficial):</strong> solo podés escribirle a clientes que te escribieron en las <strong>últimas 24 horas</strong> (es regla de Meta). Es la opción segura para la línea oficial.</li>
          <li><strong>WaSender:</strong> <strong>no</strong> tiene la restricción de 24h, pero usa WhatsApp personal y <strong>WhatsApp puede banear el número</strong> si detecta patrones de spam.</li>
        </ul>

        <div class="info"><strong>📍 Más detalle:</strong> el armado de campañas, la selección de contactos y los límites de envío están en la sección <code>Campañas</code>. Acá lo importante es que <strong>consumen el mismo saldo</strong> que tu operación.</div>
      </div>
    </article>

    <article class="step-card">
      <div class="step-head">
        <div class="step-num">6</div>
        <div class="step-meta">
          <div class="step-tag">Recargar</div>
          <h2 class="step-title">Mercado Pago o cripto</h2>
        </div>
      </div>
      <div class="step-body">
        <p>Para sumar créditos, comprás un plan o pack desde la sección <code>Saldo</code>. Hay dos formas de pago:</p>

        <div class="pay-method">
          <div class="icon">💵</div>
          <div>
            <div class="name">Mercado Pago</div>
            <div class="desc">Acreditación inmediata. Pagás con tarjeta, transferencia o dinero en cuenta. Los créditos quedan disponibles apenas se confirma el pago.</div>
          </div>
        </div>

        <div class="pay-method">
          <div class="icon">₿</div>
          <div>
            <div class="name">Cripto — USDT (red TRC20)</div>
            <div class="desc">Pagás desde cualquier wallet enviando USDT por la red TRC20. El sistema confirma de forma automática al detectar el depósito y acredita los créditos.</div>
          </div>
        </div>

        <p>El historial de tus pagos lo encontrás en la misma sección <code>Saldo</code>, para reconciliar gastos o conseguir comprobantes.</p>
      </div>
    </article>

    <article class="step-card">
      <div class="step-head">
        <div class="step-num">7</div>
        <div class="step-meta">
          <div class="step-tag">Quedarte sin saldo</div>
          <h2 class="step-title">Qué pasa si tu balance llega a cero</h2>
        </div>
      </div>
      <div class="step-body">
        <p>Si te quedás sin créditos y sin días activos:</p>
        <ul>
          <li>El servicio se <strong>pausa</strong>: el bot deja de responder mensajes nuevos.</li>
          <li>Tu landing puede mostrar un cartel de <strong>"inactiva"</strong>.</li>
          <li>No vas a poder entrar a las secciones de <strong>Líneas</strong> y <strong>Landing</strong> hasta recargar.</li>
          <li><strong>Tus datos se preservan intactos</strong>: chats, contactos, ventas y configuración no se pierden.</li>
          <li>Apenas recargás y activás días, <strong>vuelve todo a la normalidad</strong>.</li>
        </ul>

        <div class="tip"><strong>📌 Tu billetera de cobros sigue funcionando:</strong> el saldo del bot <strong>no</strong> tiene nada que ver con tu billetera de pagos (Mercado Pago, Ualá, etc.). Si un cliente paga un link mientras tu bot está sin créditos, ese cobro entra igual a tu cuenta — lo único pausado es el bot que envía y responde mensajes.</div>
      </div>
    </article>

    <section class="summary">
      <h2>Resumen del modelo de <span class="accent">Saldo.</span></h2>
      <p>Lo que tenés que recordar:</p>
      <div class="summary-grid">
        <div class="summary-item">
          <div class="summary-check">1</div>
          <div>
            <div class="summary-item-title">Un solo saldo: créditos = días</div>
            <div class="summary-item-desc">1 crédito = 1 día de servicio activo. Vos activás entre 1 y 30 días por vez desde el panel.</div>
          </div>
        </div>
        <div class="summary-item">
          <div class="summary-check">2</div>
          <div>
            <div class="summary-item-title">Sin suscripción · los créditos no vencen</div>
            <div class="summary-item-desc">No hay débito automático. Si no activás días, no se descuenta nada. Los créditos te esperan.</div>
          </div>
        </div>
        <div class="summary-item">
          <div class="summary-check">3</div>
          <div>
            <div class="summary-item-title">Activar no se revierte</div>
            <div class="summary-item-desc">Una vez activado, el saldo se consume y los días corren. Activá solo los que vas a usar; si ya tenés días, se suman.</div>
          </div>
        </div>
        <div class="summary-item">
          <div class="summary-check">4</div>
          <div>
            <div class="summary-item-title">Campañas usan el mismo saldo</div>
            <div class="summary-item-desc">Segunda línea: 1 crédito por día, de 1 a 7 días por activación. Gold incluye 30 días sin costo extra.</div>
          </div>
        </div>
        <div class="summary-item">
          <div class="summary-check">5</div>
          <div>
            <div class="summary-item-title">Recargás con Mercado Pago o cripto</div>
            <div class="summary-item-desc">MP acredita al instante. Cripto es USDT por red TRC20, con confirmación automática.</div>
          </div>
        </div>
        <div class="summary-item">
          <div class="summary-check">6</div>
          <div>
            <div class="summary-item-title">Sin saldo no se pierde nada</div>
            <div class="summary-item-desc">El servicio se pausa pero tus datos quedan intactos. Recargás, activás y vuelve todo. Tu billetera de cobros sigue cobrando.</div>
          </div>
        </div>
      </div>
    </section>
  </div>
</div>
`
