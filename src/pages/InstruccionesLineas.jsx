// ════════════════════════════════════════════════════════════════════
// InstruccionesLineas — Guía sobre la línea WhatsApp
//
// 01/06/2026 — v1: creada en respuesta a pedido del owner. La línea WA
// es lo central del producto y no tenía página propia de instrucciones.
//
// Cubre los 3 scopes:
//   - Partner self-service (gestiona su propia línea desde /lineas)
//   - Sub-tenant (gestionada por su partner; ve su estado en /cliente/lineas)
//   - Retail (autogestión completa desde /mi-cuenta/lineas)
//
// Mismo patrón visual que InstruccionesSaldo.jsx (clase prefijo `ln-tutorial`).
// ════════════════════════════════════════════════════════════════════

import { useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import { COLORS, FONT_WEIGHT } from '../theme/tokens'
import { getInstruccionesBase } from '../lib/instruccionesScope'

const C = COLORS

const TUTORIAL_HTML = `
<style>
  .ln-tutorial {
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
  .ln-tutorial * { box-sizing: border-box; margin: 0; padding: 0; }
  .ln-tutorial .container { max-width: clamp(920px, 75vw, 1400px); margin: 0 auto; }

  .ln-tutorial .head { text-align: center; margin-bottom: clamp(50px, 4vw, 80px); }
  .ln-tutorial .head .chip {
    display: inline-block; padding: 6px 14px; border-radius: 99px;
    background: rgba(212,168,67,.08); border: 1px solid rgba(212,168,67,.25);
    color: var(--gold); font-size: clamp(11px, 0.7vw, 14px); font-weight: 600;
    letter-spacing: .1em; text-transform: uppercase; margin-bottom: 18px;
  }
  .ln-tutorial .head h1 { font-size: clamp(26px, 3vw, 52px); font-weight: 800; letter-spacing: -.02em; margin-bottom: 14px; color: var(--text); }
  .ln-tutorial .head h1 .accent { color: var(--gold); }
  .ln-tutorial .head p { font-size: clamp(15px, 1vw, 19px); color: var(--muted); max-width: clamp(580px, 50vw, 880px); margin: 0 auto; }
  .ln-tutorial .head .meta { display: inline-flex; gap: 18px; margin-top: 22px; font-size: clamp(12px, 0.85vw, 15px); color: var(--muted2); flex-wrap: wrap; justify-content: center; }
  .ln-tutorial .head .meta span { display: inline-flex; align-items: center; gap: 6px; }
  .ln-tutorial .head .meta strong { color: var(--text); font-weight: 500; }

  .ln-tutorial .step-card {
    background: var(--surf); border: 1px solid var(--border); border-radius: 18px;
    padding: clamp(28px, 2.4vw, 44px) clamp(26px, 2.2vw, 40px); margin-bottom: clamp(24px, 2vw, 36px); position: relative; overflow: hidden;
  }
  .ln-tutorial .step-card::before { content: ''; position: absolute; top: 0; left: 0; width: 4px; height: 100%; background: var(--gold); }
  .ln-tutorial .step-head { display: flex; align-items: flex-start; gap: clamp(16px, 1.4vw, 24px); margin-bottom: clamp(22px, 1.8vw, 32px); }
  .ln-tutorial .step-num {
    flex-shrink: 0; width: clamp(44px, 3.6vw, 64px); height: clamp(44px, 3.6vw, 64px); border-radius: clamp(12px, 1vw, 16px);
    background: var(--gold); color: var(--bg); font-size: clamp(19px, 1.6vw, 26px); font-weight: 800;
    display: flex; align-items: center; justify-content: center;
  }
  .ln-tutorial .step-meta { flex: 1; min-width: 0; }
  .ln-tutorial .step-tag { display: inline-block; font-size: clamp(10px, 0.7vw, 13px); font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: var(--gold); margin-bottom: 4px; }
  .ln-tutorial .step-title { font-size: clamp(20px, 1.8vw, 32px); font-weight: 700; letter-spacing: -.01em; line-height: 1.25; color: var(--text); }
  .ln-tutorial .step-body { font-size: clamp(14px, 1vw, 17px); color: var(--muted); line-height: 1.65; }
  .ln-tutorial .step-body p { margin-bottom: 12px; }
  .ln-tutorial .step-body strong { color: var(--text); font-weight: 600; }
  .ln-tutorial .step-body code { background: var(--surf2); border: 1px solid var(--border2); border-radius: 5px; padding: 1px 7px; font-family: 'JetBrains Mono', monospace; font-size: 12px; color: var(--gold2); }
  .ln-tutorial .step-body ul, .ln-tutorial .step-body ol { margin: 8px 0 14px 22px; }
  .ln-tutorial .step-body li { margin-bottom: 6px; }

  .ln-tutorial .two-providers {
    display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin: 18px 0;
  }
  .ln-tutorial .prov-box {
    background: #0D0F1A; border: 1px solid var(--border); border-radius: 12px;
    padding: 18px 20px;
  }
  .ln-tutorial .prov-box.meta { border-color: rgba(37,211,102,.3); background: rgba(37,211,102,.02); }
  .ln-tutorial .prov-box.wasender { border-color: rgba(167,139,250,.3); background: rgba(167,139,250,.02); }
  .ln-tutorial .prov-emoji { font-size: 28px; margin-bottom: 8px; }
  .ln-tutorial .prov-title { font-size: 15px; font-weight: 700; color: #E9E7E0; margin-bottom: 4px; }
  .ln-tutorial .prov-subtitle { font-size: 11px; color: var(--muted); font-family: 'JetBrains Mono', monospace; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 10px; }
  .ln-tutorial .prov-desc { font-size: 12px; color: var(--text); line-height: 1.55; }
  .ln-tutorial .prov-desc ul { margin: 6px 0 0 18px; }
  .ln-tutorial .prov-desc li { margin-bottom: 3px; font-size: 12px; color: var(--muted); }

  .ln-tutorial .compare-table {
    width: 100%; border-collapse: separate; border-spacing: 0;
    background: #0D0F1A; border: 1px solid var(--border); border-radius: 12px;
    overflow: hidden; margin: 18px 0; font-size: 13px;
  }
  .ln-tutorial .compare-table th,
  .ln-tutorial .compare-table td {
    padding: 11px 14px; text-align: left; border-bottom: 1px solid var(--border);
  }
  .ln-tutorial .compare-table th { background: #14181F; color: var(--gold); font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; font-family: 'JetBrains Mono', monospace; }
  .ln-tutorial .compare-table tr:last-child td { border-bottom: none; }
  .ln-tutorial .compare-table td:first-child { color: var(--text); font-weight: 600; }
  .ln-tutorial .compare-table .yes { color: #22c55e; font-weight: 600; }
  .ln-tutorial .compare-table .no  { color: #ef4444; font-weight: 600; }
  .ln-tutorial .compare-table .neutral { color: var(--muted); }

  .ln-tutorial .role-box {
    display: grid; grid-template-columns: auto 1fr; gap: 14px; align-items: flex-start;
    padding: 14px 16px; background: #0D0F1A; border: 1px solid var(--border);
    border-radius: 10px; margin-bottom: 10px;
  }
  .ln-tutorial .role-icon {
    width: 38px; height: 38px; border-radius: 9px;
    background: rgba(212,168,67,.08); border: 1px solid rgba(212,168,67,.2);
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; flex-shrink: 0;
  }
  .ln-tutorial .role-name { font-size: 13px; font-weight: 700; color: #E9E7E0; margin-bottom: 4px; }
  .ln-tutorial .role-desc { font-size: 12px; color: var(--muted); line-height: 1.55; }

  .ln-tutorial .tip {
    background: rgba(212,168,67,.05); border-left: 3px solid var(--gold);
    border-radius: 0 7px 7px 0; padding: 12px 16px; margin: 14px 0;
    font-size: 13px; color: var(--text);
  }
  .ln-tutorial .tip strong { color: var(--gold); }

  .ln-tutorial .info {
    background: rgba(59,130,246,.05); border-left: 3px solid #3b82f6;
    color: var(--text); padding: 12px 16px; margin: 14px 0;
    font-size: 13px; border-radius: 0 7px 7px 0;
  }
  .ln-tutorial .info strong { color: #60a5fa; }

  .ln-tutorial .danger {
    background: rgba(239,68,68,.05); border-left: 3px solid #ef4444;
    color: var(--text); padding: 12px 16px; margin: 14px 0;
    font-size: 13px; border-radius: 0 7px 7px 0;
  }
  .ln-tutorial .danger strong { color: #ff7373; }

  .ln-tutorial .success {
    background: rgba(34,197,94,.05); border-left: 3px solid #22c55e;
    color: var(--text); padding: 12px 16px; margin: 14px 0;
    font-size: 13px; border-radius: 0 7px 7px 0;
  }
  .ln-tutorial .success strong { color: #22c55e; }

  .ln-tutorial .summary {
    background: linear-gradient(180deg, var(--surf) 0%, rgba(212,168,67,.05) 100%);
    border: 1px solid rgba(212,168,67,.3); border-radius: 18px;
    padding: 30px 26px; margin-top: 36px;
  }
  .ln-tutorial .summary h2 { font-size: 20px; font-weight: 800; margin-bottom: 6px; color: var(--text); }
  .ln-tutorial .summary h2 .accent { color: var(--gold); }
  .ln-tutorial .summary > p { font-size: 13px; color: var(--muted); margin-bottom: 18px; }
  .ln-tutorial .summary-grid { display: grid; gap: 10px; }
  .ln-tutorial .summary-item { background: var(--surf2); border: 1px solid var(--border2); border-radius: 9px; padding: 13px 15px; display: flex; align-items: flex-start; gap: 12px; }
  .ln-tutorial .summary-check { flex-shrink: 0; width: 22px; height: 22px; border-radius: 50%; background: var(--gold); color: var(--bg); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; margin-top: 1px; }
  .ln-tutorial .summary-item-title { font-size: 13px; font-weight: 700; color: var(--text); margin-bottom: 2px; font-family: 'JetBrains Mono', monospace; }
  .ln-tutorial .summary-item-desc { font-size: 12px; color: var(--muted); }

  @media (max-width: 600px) {
    .ln-tutorial .step-card { padding: 22px 18px; }
    .ln-tutorial .step-head { flex-direction: column; gap: 14px; }
    .ln-tutorial .two-providers { grid-template-columns: 1fr; }
    .ln-tutorial .compare-table { font-size: 11px; }
    .ln-tutorial .compare-table th,
    .ln-tutorial .compare-table td { padding: 8px 10px; }
  }
</style>

<div class="ln-tutorial">
  <div class="container">
    <header class="head">
      <div class="chip">Tutorial</div>
      <h1>Cómo funciona tu <span class="accent">línea de WhatsApp</span></h1>
      <p>La línea es el canal por donde tu bot conversa con tus clientes. Esta guía explica cómo se activa, qué provider elegir, cómo se pausa y qué hacer si algo falla.</p>
      <div class="meta">
        <span>📱 <strong>2 providers</strong></span>
        <span>🟢 <strong>Pausá cuando quieras</strong></span>
        <span>🛡 <strong>Garantía de cambio</strong></span>
      </div>
    </header>

    <article class="step-card">
      <div class="step-head">
        <div class="step-num">1</div>
        <div class="step-meta">
          <div class="step-tag">Lo primero</div>
          <h2 class="step-title">¿Qué es una línea?</h2>
        </div>
      </div>
      <div class="step-body">
        <p>En Innovate.ia, una <strong>línea</strong> es un número de WhatsApp conectado a tu cuenta que el bot usa para responder mensajes, enviar links de pago y mantener conversaciones con tus clientes.</p>

        <p>Cada cuenta tiene <strong>al menos una línea activa</strong> (la línea del bot, que opera 24/7 atendiendo conversaciones entrantes). Algunas cuentas con plan extendido pueden tener una <strong>segunda línea de campañas</strong> para envíos masivos salientes.</p>

        <div class="info"><strong>📍 Dónde la ves:</strong> tu línea aparece en el menú lateral como <code>Líneas</code>. Ahí ves el estado actual (conectada/desconectada), el provider, el número, y el botón para conectar/desconectar.</div>
      </div>
    </article>

    <article class="step-card">
      <div class="step-head">
        <div class="step-num">2</div>
        <div class="step-meta">
          <div class="step-tag">Decisión clave</div>
          <h2 class="step-title">Hay dos providers de línea</h2>
        </div>
      </div>
      <div class="step-body">
        <p>Cuando vas a activar una línea, podés elegir uno de dos providers. La diferencia es importante: cada uno tiene sus reglas, sus ventajas y sus costos asociados.</p>

        <div class="two-providers">
          <div class="prov-box meta">
            <div class="prov-emoji">🟢</div>
            <div class="prov-title">Meta API oficial</div>
            <div class="prov-subtitle">WhatsApp Cloud API</div>
            <div class="prov-desc">
              <strong>La API oficial de Meta.</strong> Tu número queda registrado contra el sistema oficial de WhatsApp Business. Recomendada para operación profesional.
              <ul>
                <li>Número estable y verificado</li>
                <li>Templates de Meta aprobados</li>
                <li>Sin riesgo de baneo si seguís las reglas</li>
                <li>Requiere SIM sin WhatsApp activo</li>
                <li>Activación con pago único</li>
              </ul>
            </div>
          </div>
          <div class="prov-box wasender">
            <div class="prov-emoji">📷</div>
            <div class="prov-title">Wasender (QR)</div>
            <div class="prov-subtitle">WhatsApp Web vinculado</div>
            <div class="prov-desc">
              <strong>Conectás escaneando un QR</strong> desde tu celular, como WhatsApp Web. Más rápido de poner en marcha, ideal para empezar o probar.
              <ul>
                <li>Setup en minutos, sin SIM extra</li>
                <li>Usa tu número personal o uno nuevo</li>
                <li>Sin restricción de 24h en mensajes</li>
                <li>Si reiniciás el teléfono se puede cortar</li>
                <li>Riesgo de baneo si se usa para spam</li>
              </ul>
            </div>
          </div>
        </div>

        <p>Si arrancás y querés simplicidad → <strong>Wasender</strong>. Si querés algo profesional y estable a largo plazo → <strong>Meta API</strong>. Podés cambiar más adelante si querés.</p>
      </div>
    </article>

    <article class="step-card">
      <div class="step-head">
        <div class="step-num">3</div>
        <div class="step-meta">
          <div class="step-tag">Diferencias técnicas</div>
          <h2 class="step-title">Meta vs Wasender en detalle</h2>
        </div>
      </div>
      <div class="step-body">
        <p>Para que la decisión sea clara, esta tabla resume las diferencias prácticas que afectan el día a día:</p>

        <table class="compare-table">
          <thead>
            <tr>
              <th>Aspecto</th>
              <th>Meta API</th>
              <th>Wasender (QR)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Estabilidad</td>
              <td class="yes">Alta — número fijo</td>
              <td class="neutral">Media — depende del cel</td>
            </tr>
            <tr>
              <td>Setup inicial</td>
              <td class="neutral">SIM nueva + pago activación</td>
              <td class="yes">QR desde el celular</td>
            </tr>
            <tr>
              <td>Mensajes &gt; 24h</td>
              <td class="no">Solo con templates aprobados</td>
              <td class="yes">Libre, sin restricción</td>
            </tr>
            <tr>
              <td>Riesgo de baneo</td>
              <td class="yes">Bajo si cumplís reglas</td>
              <td class="neutral">Medio — depende del uso</td>
            </tr>
            <tr>
              <td>Recomendado para</td>
              <td class="neutral">Operación profesional</td>
              <td class="neutral">Pruebas y arranque rápido</td>
            </tr>
          </tbody>
        </table>

        <div class="tip"><strong>📌 La "ventana de 24h" de Meta:</strong> en la API oficial, solo podés escribir libremente a un cliente dentro de las 24h desde su último mensaje hacia vos. Pasadas las 24h, solo podés enviar templates pre-aprobados por Meta. Wasender no tiene esta restricción — podés escribir cuando quieras.</div>
      </div>
    </article>

    <article class="step-card">
      <div class="step-head">
        <div class="step-num">4</div>
        <div class="step-meta">
          <div class="step-tag">Cómo se conecta</div>
          <h2 class="step-title">Activación paso a paso</h2>
        </div>
      </div>
      <div class="step-body">
        <p>El flujo depende del provider que elijas:</p>

        <p><strong>Si elegís Meta API:</strong></p>
        <ol>
          <li>Andá a <code>Saldo</code> y comprá el pack <strong>Línea WhatsApp</strong> ($75 USD, pago único).</li>
          <li>Conseguí una SIM <strong>sin WhatsApp instalado</strong>. Si el número ya tiene WhatsApp, no funciona — Meta no permite migrar números que ya estén en uso personal.</li>
          <li>Una vez procesado el pago, te contactamos para hacer la verificación con código de Meta.</li>
          <li>Cuando termina, tu número queda conectado a la API y el bot empieza a responder automáticamente.</li>
        </ol>

        <p><strong>Si elegís Wasender:</strong></p>
        <ol>
          <li>Andá a <code>Líneas</code> y elegí el provider Wasender.</li>
          <li>Aparece un QR en pantalla — duración limitada (~30 segundos), refrescá si vence.</li>
          <li>Abrí WhatsApp en tu celular → ⚙ Configuración → Dispositivos vinculados → Vincular dispositivo.</li>
          <li>Escaneá el QR. Listo: la línea queda conectada.</li>
        </ol>

        <div class="success"><strong>💡 Tip Wasender:</strong> usá un número que NO sea tu WhatsApp personal del día a día. Si más adelante necesitás cambiarlo, podés desvincular el dispositivo y conectar otro.</div>

        <div class="danger"><strong>⚠ Meta API — requisito crítico:</strong> el número TIENE que ser una SIM virgen sin WhatsApp instalado. Si pagás la activación y el número ya tiene WhatsApp en uso, no se puede migrar. La garantía no cubre este caso — es responsabilidad del usuario elegir el número correcto antes de pagar.</div>
      </div>
    </article>

    <article class="step-card">
      <div class="step-head">
        <div class="step-num">5</div>
        <div class="step-meta">
          <div class="step-tag">Línea 1 vs línea 2</div>
          <h2 class="step-title">Bot conversacional + Línea de campañas</h2>
        </div>
      </div>
      <div class="step-body">
        <p>Algunas cuentas pueden tener <strong>dos líneas separadas</strong>:</p>

        <div class="role-box">
          <div class="role-icon">💬</div>
          <div>
            <div class="role-name">Línea 1 — Bot conversacional (siempre presente)</div>
            <div class="role-desc">La línea principal donde llegan los mensajes entrantes. El bot responde 24/7. Es la línea "main" que casi todos los usuarios usan. Provider configurable: Meta o Wasender.</div>
          </div>
        </div>

        <div class="role-box">
          <div class="role-icon">📢</div>
          <div>
            <div class="role-name">Línea 2 — Campañas (opcional)</div>
            <div class="role-desc">Una segunda línea, separada de la del bot, pensada exclusivamente para envíos masivos y campañas salientes. Tiene su propio número y su propio provider — podés tener Meta para el bot y Wasender para campañas, o cualquier otra combinación. Se activa por separado.</div>
          </div>
        </div>

        <div class="info"><strong>💡 Por qué tenerlas separadas:</strong> usar la misma línea para conversaciones entrantes Y envíos masivos aumenta el riesgo de baneo. Separarlas protege la línea principal del bot — si la línea de campañas se cae o es bloqueada, el bot sigue funcionando normal.</div>

        <p>La línea de campañas no viene activa por defecto. Si te interesa, escribinos desde soporte y la activamos para tu cuenta.</p>
      </div>
    </article>

    <article class="step-card">
      <div class="step-head">
        <div class="step-num">6</div>
        <div class="step-meta">
          <div class="step-tag">Operación diaria</div>
          <h2 class="step-title">Pausar, reactivar, monitorear</h2>
        </div>
      </div>
      <div class="step-body">
        <p>Tu línea consume <strong>1 crédito por día activo</strong> (saldo operativo). Mientras no haya saldo o esté pausada, no se descuenta.</p>

        <p><strong>Pausar manualmente:</strong></p>
        <ul>
          <li>Andá a <code>Líneas</code> → botón "Desactivar".</li>
          <li>Mientras esté pausada, el bot deja de responder mensajes entrantes.</li>
          <li><strong>Tus datos, contactos, chats y ventas se preservan intactos.</strong> Nada se pierde.</li>
          <li>No se descuenta ningún crédito mientras esté pausada.</li>
        </ul>

        <p><strong>Reactivar:</strong></p>
        <ul>
          <li>Mismo botón → "Activar". Funciona al instante.</li>
          <li>Si te quedaste sin saldo operativo, primero comprá un pack en <code>Saldo</code> y después se reactiva sola.</li>
        </ul>

        <p><strong>Monitoreo:</strong></p>
        <ul>
          <li>El indicador "🟢 ACTIVO" / "🔴 SIN LÍNEA" arriba del panel te muestra el estado.</li>
          <li>En la página de <code>Saldo</code> ves el header con días restantes de operación.</li>
          <li>Si se desconecta sola (Wasender por reinicio del celular, por ejemplo), te llega notificación.</li>
        </ul>

        <div class="tip"><strong>📌 Vacaciones / temporada baja:</strong> pausá manualmente desde <code>Líneas</code>. No se descuentan créditos. Al volver, activás y seguís donde quedaste.</div>
      </div>
    </article>

    <article class="step-card">
      <div class="step-head">
        <div class="step-num">7</div>
        <div class="step-meta">
          <div class="step-tag">Garantía y soporte</div>
          <h2 class="step-title">Qué pasa si Meta bloquea tu línea</h2>
        </div>
      </div>
      <div class="step-body">
        <p>Las activaciones de línea con <strong>Meta API</strong> incluyen <strong>15 días de garantía</strong> de cambio automático de número.</p>

        <p>La garantía cubre:</p>
        <ul>
          <li>Bloqueo de Meta por motivos de la API (no por uso indebido del usuario).</li>
          <li>Errores técnicos del sistema de Innovate.ia que dejen la línea inoperable.</li>
          <li>Caídas prolongadas de la WhatsApp Cloud API.</li>
        </ul>

        <p>La garantía <strong>NO cubre</strong>:</p>
        <ul>
          <li>Uso indebido de la línea (spam, mensajes prohibidos, etc.).</li>
          <li>Haber pagado activación con un número que ya tenía WhatsApp instalado.</li>
          <li>Reportes masivos de usuarios que generan baneo legítimo.</li>
        </ul>

        <p>Horario de atención de la garantía: <strong>09 a 00hs</strong>. Detalles completos en la página <code>/legal/garantia</code>.</p>

        <div class="info"><strong>💬 Cómo reportar un problema:</strong> escribí desde <code>Soporte</code> en tu panel. Incluí el número de línea y una captura del error si la tenés. Respondemos dentro del horario de atención y, si aplica garantía, gestionamos el cambio automático.</div>
      </div>
    </article>

    <section class="summary">
      <h2>Resumen de <span class="accent">Líneas.</span></h2>
      <p>Lo esencial:</p>
      <div class="summary-grid">
        <div class="summary-item">
          <div class="summary-check">1</div>
          <div>
            <div class="summary-item-title">Dos providers a elegir</div>
            <div class="summary-item-desc">Meta API oficial (estable, profesional, requiere SIM virgen) o Wasender (QR rápido, ideal para arranque y pruebas).</div>
          </div>
        </div>
        <div class="summary-item">
          <div class="summary-check">2</div>
          <div>
            <div class="summary-item-title">1 crédito = 1 día de línea activa</div>
            <div class="summary-item-desc">Se consume solo cuando la línea está activa. Pausala y no se descuenta nada.</div>
          </div>
        </div>
        <div class="summary-item">
          <div class="summary-check">3</div>
          <div>
            <div class="summary-item-title">Wasender no tiene ventana de 24h</div>
            <div class="summary-item-desc">Meta solo permite escribir libremente dentro de 24h; afuera necesitás templates. Wasender no tiene esta restricción.</div>
          </div>
        </div>
        <div class="summary-item">
          <div class="summary-check">4</div>
          <div>
            <div class="summary-item-title">Línea 1 = bot · Línea 2 = campañas</div>
            <div class="summary-item-desc">Si tu cuenta lo permite, la línea de campañas vive separada de la del bot para no comprometer la principal.</div>
          </div>
        </div>
        <div class="summary-item">
          <div class="summary-check">5</div>
          <div>
            <div class="summary-item-title">Pausa sin pérdida de datos</div>
            <div class="summary-item-desc">Desactivar la línea preserva contactos, chats y ventas. Reactivás cuando quieras.</div>
          </div>
        </div>
        <div class="summary-item">
          <div class="summary-check">6</div>
          <div>
            <div class="summary-item-title">15 días de garantía Meta</div>
            <div class="summary-item-desc">Cambio automático si Meta bloquea por motivos no atribuibles a uso indebido. Detalles en /legal/garantia.</div>
          </div>
        </div>
      </div>
    </section>
  </div>
</div>
`

export default function InstruccionesLineas() {
  const navigate = useNavigate()
  const location = useLocation()
  const containerRef = useRef(null)

  const backTo = getInstruccionesBase(location.pathname)

  useEffect(() => {
    const id = 'ln-tutorial-fonts'
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
          Instrucciones / Líneas
        </span>
      </div>

      <div ref={containerRef} dangerouslySetInnerHTML={{ __html: TUTORIAL_HTML }} />
    </div>
  )
}
