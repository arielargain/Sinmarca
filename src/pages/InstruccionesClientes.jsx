// ════════════════════════════════════════════════════════════════════
// InstruccionesClientes — Guía de gestión de sub-tenants (clientes del partner)
//
// 17/05/2026 — v2: REESCRITA con datos reales de Clientes.jsx.
// Cubre el flujo verdadero: alta con 4 identities, dashboard con métricas,
// status derivado, provision de acceso vía EF, 5 chips de config, eliminación
// con confirmación por nombre.
//
// Audiencia: partner final de Modo Ahorro. Esta guía SÍ es solo-partner —
// los sub-tenants no administran a sus propios sub-tenants.
// ════════════════════════════════════════════════════════════════════

import { useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import { COLORS, FONT_WEIGHT } from '../theme/tokens'
import { getInstruccionesBase } from '../lib/instruccionesScope'

const C = COLORS

const TUTORIAL_HTML = `
<style>
  .cl-tutorial {
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
  .cl-tutorial * { box-sizing: border-box; margin: 0; padding: 0; }
  .cl-tutorial .container { max-width: clamp(920px, 75vw, 1400px); margin: 0 auto; }

  .cl-tutorial .head { text-align: center; margin-bottom: clamp(50px, 4vw, 80px); }
  .cl-tutorial .head .chip {
    display: inline-block; padding: 6px 14px; border-radius: 99px;
    background: rgba(212,168,67,.08); border: 1px solid rgba(212,168,67,.25);
    color: var(--gold); font-size: clamp(11px, 0.7vw, 14px); font-weight: 600;
    letter-spacing: .1em; text-transform: uppercase; margin-bottom: 18px;
  }
  .cl-tutorial .head h1 { font-size: clamp(26px, 3vw, 52px); font-weight: 800; letter-spacing: -.02em; margin-bottom: 14px; color: var(--text); }
  .cl-tutorial .head h1 .accent { color: var(--gold); }
  .cl-tutorial .head p { font-size: clamp(15px, 1vw, 19px); color: var(--muted); max-width: clamp(580px, 50vw, 880px); margin: 0 auto; }
  .cl-tutorial .head .meta { display: inline-flex; gap: 18px; margin-top: 22px; font-size: clamp(12px, 0.85vw, 15px); color: var(--muted2); flex-wrap: wrap; justify-content: center; }
  .cl-tutorial .head .meta span { display: inline-flex; align-items: center; gap: 6px; }
  .cl-tutorial .head .meta strong { color: var(--text); font-weight: 500; }

  .cl-tutorial .step-card {
    background: var(--surf); border: 1px solid var(--border); border-radius: 18px;
    padding: clamp(28px, 2.4vw, 44px) clamp(26px, 2.2vw, 40px); margin-bottom: clamp(24px, 2vw, 36px); position: relative; overflow: hidden;
  }
  .cl-tutorial .step-card::before { content: ''; position: absolute; top: 0; left: 0; width: 4px; height: 100%; background: var(--gold); }
  .cl-tutorial .step-head { display: flex; align-items: flex-start; gap: clamp(16px, 1.4vw, 24px); margin-bottom: clamp(22px, 1.8vw, 32px); }
  .cl-tutorial .step-num {
    flex-shrink: 0; width: clamp(44px, 3.6vw, 64px); height: clamp(44px, 3.6vw, 64px); border-radius: clamp(12px, 1vw, 16px);
    background: var(--gold); color: var(--bg); font-size: clamp(19px, 1.6vw, 26px); font-weight: 800;
    display: flex; align-items: center; justify-content: center;
  }
  .cl-tutorial .step-meta { flex: 1; min-width: 0; }
  .cl-tutorial .step-tag { display: inline-block; font-size: clamp(10px, 0.7vw, 13px); font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: var(--gold); margin-bottom: 4px; }
  .cl-tutorial .step-title { font-size: clamp(20px, 1.8vw, 32px); font-weight: 700; letter-spacing: -.01em; line-height: 1.25; color: var(--text); }
  .cl-tutorial .step-body { font-size: clamp(14px, 1vw, 17px); color: var(--muted); line-height: 1.65; }
  .cl-tutorial .step-body p { margin-bottom: 12px; }
  .cl-tutorial .step-body strong { color: var(--text); font-weight: 600; }
  .cl-tutorial .step-body code { background: var(--surf2); border: 1px solid var(--border2); border-radius: 5px; padding: 1px 7px; font-family: 'JetBrains Mono', monospace; font-size: 12px; color: var(--gold2); }
  .cl-tutorial .step-body ul, .cl-tutorial .step-body ol { margin: 8px 0 14px 22px; }
  .cl-tutorial .step-body li { margin-bottom: 6px; }

  .cl-tutorial .panel-mock {
    background: #080B12; border-radius: 12px; margin: 22px 0; overflow: hidden;
    box-shadow: 0 24px 64px rgba(0,0,0,.5); color: #E9E7E0; border: 1px solid var(--border);
  }
  .cl-tutorial .panel-mock .pm-topbar { background: #0D0F1A; padding: 9px 14px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 10px; }
  .cl-tutorial .panel-mock .pm-dots { display: flex; gap: 5px; }
  .cl-tutorial .panel-mock .pm-dots span { width: 10px; height: 10px; border-radius: 50%; background: #2a3142; }
  .cl-tutorial .panel-mock .pm-url { flex: 1; font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--muted2); padding: 4px 10px; background: #14181F; border-radius: 5px; border: 1px solid #1a1f2e; }
  .cl-tutorial .panel-mock .pm-body { padding: 18px; }

  .cl-tutorial .identity-grid {
    display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
    gap: 8px;
  }
  .cl-tutorial .id-card {
    background: #0D0F1A; border: 1px solid var(--border); border-radius: 9px;
    padding: 10px 12px;
  }
  .cl-tutorial .id-card.casino { border-color: rgba(212,168,67,.4); }
  .cl-tutorial .id-card.tienda { border-color: rgba(59,130,246,.4); }
  .cl-tutorial .id-card.marketing { border-color: rgba(167,139,250,.4); }
  .cl-tutorial .id-card.profesional { border-color: rgba(236,72,153,.4); }
  .cl-tutorial .id-card .id-label { font-size: 13px; font-weight: 700; margin-bottom: 3px; color: #E9E7E0; }
  .cl-tutorial .id-card .id-desc { font-size: 11px; color: var(--muted); line-height: 1.4; }
  .cl-tutorial .id-card.casino .id-label { color: #D4A843; }
  .cl-tutorial .id-card.tienda .id-label { color: #60a5fa; }
  .cl-tutorial .id-card.marketing .id-label { color: #c4b5fd; }
  .cl-tutorial .id-card.profesional .id-label { color: #f9a8d4; }

  .cl-tutorial .client-card-mock {
    background: var(--surf); border: 1px solid var(--border); border-radius: 12px;
    padding: 14px; margin-top: 8px;
  }
  .cl-tutorial .ccm-header {
    display: flex; justify-content: space-between; align-items: flex-start;
    margin-bottom: 10px;
  }
  .cl-tutorial .ccm-name { font-size: 14px; font-weight: 700; color: #E9E7E0; }
  .cl-tutorial .ccm-business { font-size: 11px; color: var(--muted); margin-top: 2px; }
  .cl-tutorial .ccm-badge {
    font-size: 9px; padding: 2px 8px; border-radius: 999px;
    font-family: 'JetBrains Mono', monospace; font-weight: 700;
    text-transform: uppercase; letter-spacing: .05em;
    background: rgba(34,197,94,.15); color: #22c55e; border: 1px solid rgba(34,197,94,.4);
  }
  .cl-tutorial .ccm-metrics {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px; margin-bottom: 10px;
  }
  .cl-tutorial .ccm-metric {
    background: var(--bg); padding: 7px 9px; border-radius: 6px; border: 1px solid var(--border);
  }
  .cl-tutorial .ccm-mlabel { font-size: 8px; color: var(--muted); text-transform: uppercase; letter-spacing: .06em; font-family: 'JetBrains Mono', monospace; }
  .cl-tutorial .ccm-mvalue { font-size: 13px; font-weight: 700; font-family: 'JetBrains Mono', monospace; margin-top: 1px; }
  .cl-tutorial .ccm-mvalue.green { color: #22c55e; }
  .cl-tutorial .ccm-mvalue.blue { color: #60a5fa; }
  .cl-tutorial .ccm-config { display: flex; flex-wrap: wrap; gap: 4px; }
  .cl-tutorial .ccm-chip {
    font-size: 9px; padding: 2px 7px; border-radius: 999px;
    font-family: 'JetBrains Mono', monospace; font-weight: 600;
    background: rgba(34,197,94,.1); color: #22c55e; border: 1px solid rgba(34,197,94,.25);
  }
  .cl-tutorial .ccm-chip.off { background: rgba(107,114,128,.08); color: var(--muted); border-color: var(--border); }

  .cl-tutorial .status-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 8px; margin: 12px 0; }
  .cl-tutorial .status-pill {
    background: #0D0F1A; border: 1px solid var(--border); border-radius: 7px;
    padding: 9px 12px;
  }
  .cl-tutorial .status-pill .status-name { font-size: 11px; font-weight: 700; font-family: 'JetBrains Mono', monospace; text-transform: uppercase; letter-spacing: .05em; margin-bottom: 2px; }
  .cl-tutorial .status-pill .status-desc { font-size: 11px; color: var(--muted); }
  .cl-tutorial .status-pill.active .status-name { color: #22c55e; }
  .cl-tutorial .status-pill.pending .status-name { color: #f59e0b; }
  .cl-tutorial .status-pill.expired .status-name { color: #ef4444; }
  .cl-tutorial .status-pill.inactive .status-name { color: var(--muted); }

  .cl-tutorial .tip {
    background: rgba(212,168,67,.05); border-left: 3px solid var(--gold);
    border-radius: 0 7px 7px 0; padding: 12px 16px; margin: 14px 0;
    font-size: 13px; color: var(--text);
  }
  .cl-tutorial .tip strong { color: var(--gold); }

  .cl-tutorial .info {
    background: rgba(59,130,246,.05); border-left: 3px solid #3b82f6;
    color: var(--text); padding: 12px 16px; margin: 14px 0;
    font-size: 13px; border-radius: 0 7px 7px 0;
  }
  .cl-tutorial .info strong { color: #60a5fa; }

  .cl-tutorial .danger {
    background: rgba(239,68,68,.05); border-left: 3px solid #ef4444;
    color: var(--text); padding: 12px 16px; margin: 14px 0;
    font-size: 13px; border-radius: 0 7px 7px 0;
  }
  .cl-tutorial .danger strong { color: #ff7373; }

  .cl-tutorial .success {
    background: rgba(34,197,94,.05); border-left: 3px solid #22c55e;
    color: var(--text); padding: 12px 16px; margin: 14px 0;
    font-size: 13px; border-radius: 0 7px 7px 0;
  }
  .cl-tutorial .success strong { color: #22c55e; }

  .cl-tutorial .summary {
    background: linear-gradient(180deg, var(--surf) 0%, rgba(212,168,67,.05) 100%);
    border: 1px solid rgba(212,168,67,.3); border-radius: 18px;
    padding: 30px 26px; margin-top: 36px;
  }
  .cl-tutorial .summary h2 { font-size: 20px; font-weight: 800; margin-bottom: 6px; color: var(--text); }
  .cl-tutorial .summary h2 .accent { color: var(--gold); }
  .cl-tutorial .summary > p { font-size: 13px; color: var(--muted); margin-bottom: 18px; }
  .cl-tutorial .summary-grid { display: grid; gap: 10px; }
  .cl-tutorial .summary-item { background: var(--surf2); border: 1px solid var(--border2); border-radius: 9px; padding: 13px 15px; display: flex; align-items: flex-start; gap: 12px; }
  .cl-tutorial .summary-check { flex-shrink: 0; width: 22px; height: 22px; border-radius: 50%; background: var(--gold); color: var(--bg); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; margin-top: 1px; }
  .cl-tutorial .summary-item-title { font-size: 13px; font-weight: 700; color: var(--text); margin-bottom: 2px; font-family: 'JetBrains Mono', monospace; }
  .cl-tutorial .summary-item-desc { font-size: 12px; color: var(--muted); }

  @media (max-width: 600px) {
    .cl-tutorial .step-card { padding: 22px 18px; }
    .cl-tutorial .step-head { flex-direction: column; gap: 14px; }
  }
</style>

<div class="cl-tutorial">
  <div class="container">
    <header class="head">
      <div class="chip">Tutorial · Solo partners</div>
      <h1>Gestionar tus <span class="accent">Clientes</span></h1>
      <p>Como partner de Modo Ahorro, cada uno de tus clientes (sub-tenants) tiene su propio panel, su línea de WhatsApp, su billetera y sus métricas. Esta guía explica cómo darlos de alta, monitorearlos y gestionarlos desde tu cuenta master.</p>
      <div class="meta">
        <span>📍 <strong>app.innovate-ia.com/clientes</strong></span>
        <span>🏢 <strong>Multi-tenant</strong></span>
        <span>♾ <strong>Sub-tenants ilimitados</strong></span>
      </div>
    </header>

    <article class="step-card">
      <div class="step-head">
        <div class="step-num">1</div>
        <div class="step-meta">
          <div class="step-tag">El modelo</div>
          <h2 class="step-title">¿Qué es un sub-tenant?</h2>
        </div>
      </div>
      <div class="step-body">
        <p>Tu cuenta de Modo Ahorro es el <strong>tenant master</strong>. Cada cliente que sumás se llama <strong>sub-tenant</strong>: una cuenta operativamente independiente dentro de tu panel.</p>

        <p>Lo que un sub-tenant tiene como propio:</p>
        <ul>
          <li>Su <strong>línea de WhatsApp</strong> (número distinto al tuyo).</li>
          <li>Su <strong>billetera</strong> de cobros (Mercado Pago, Ualá, MODO, Lemon o Belo) — separada de la tuya, los cobros van a su cuenta.</li>
          <li>Sus <strong>chats, contactos, ventas y pedidos</strong> — el bot del sub-tenant atiende solo sus propios clientes.</li>
          <li>Sus <strong>credenciales de plataforma</strong> (casino, tienda, agenda) si las tiene.</li>
          <li>Su propio <strong>panel de acceso</strong> en <code>chat.innovate-ia.com/cliente</code> donde él entra a ver SUS chats y ventas.</li>
          <li>Su <strong>Pixel de Meta</strong> propio para sus campañas (no comparte el tuyo).</li>
        </ul>

        <p>Lo que vos seguís controlando como partner:</p>
        <ul>
          <li><strong>Métricas consolidadas</strong> de todos tus sub-tenants en el dashboard <code>/clientes</code>.</li>
          <li><strong>Alta, baja y modificaciones</strong> de cada uno.</li>
          <li><strong>Plazo de activación</strong> de cada sub-tenant (hasta 7 días con tu RPC, más con la del admin).</li>
          <li><strong>Configuración inicial</strong> si querés ayudarlos a setearla (después podés delegar).</li>
        </ul>

        <div class="info"><strong>💡 Independencia operativa:</strong> los datos del sub-tenant son privados — vos podés ver métricas agregadas (chats totales, ventas totales) y configuración, pero el contenido de los chats es del sub-tenant. El sub-tenant tampoco puede ver el panel master ni acceder a tus otros clientes.</div>
      </div>
    </article>

    <article class="step-card">
      <div class="step-head">
        <div class="step-num">2</div>
        <div class="step-meta">
          <div class="step-tag">Alta de cliente</div>
          <h2 class="step-title">Crear un sub-tenant en 30 segundos</h2>
        </div>
      </div>
      <div class="step-body">
        <p>Desde <code>/clientes</code> hacé click en <strong>+ Nuevo cliente</strong>. Se abre un modal con 3 campos:</p>

        <ol>
          <li><strong>Tipo de actividad</strong> (identity): elegís uno de los 4 abajo. Esto define qué herramientas tiene el bot y qué campos se muestran en el panel.</li>
          <li><strong>Nombre del negocio</strong>: cómo se llama el cliente (ej: "Casino Royale", "Ferretería Pérez").</li>
          <li><strong>Slug</strong>: identificador único en URLs, en minúsculas con guiones (ej: <code>casino-royale</code>). Se autocompleta desde el nombre — podés editarlo. Mín 2 chars, solo a-z/0-9/guión.</li>
        </ol>

        <div class="identity-grid">
          <div class="id-card casino">
            <div class="id-label">🎰 Casino</div>
            <div class="id-desc">Crea cuentas y acredita saldo automáticamente.</div>
          </div>
          <div class="id-card tienda">
            <div class="id-label">🛒 Tienda</div>
            <div class="id-desc">Pedidos por WhatsApp, catálogo y envíos.</div>
          </div>
          <div class="id-card marketing">
            <div class="id-label">📣 Marketing</div>
            <div class="id-desc">Captación de leads y agendado de reuniones.</div>
          </div>
          <div class="id-card profesional">
            <div class="id-label">👔 Profesional</div>
            <div class="id-desc">Turnos, consultas y atención por WhatsApp.</div>
          </div>
        </div>

        <p style="margin-top: 14px;">Al confirmar, el sub-tenant queda creado con <strong>status: active</strong> y abre el drawer de edición para que termines de configurarle todos los datos (negocio, billetera, WhatsApp, etc).</p>

        <div class="tip"><strong>📌 El identity define el panel:</strong> un sub-tenant casino ve botones para crear cuentas y acreditar saldo. Uno tienda ve catálogo y pedidos. Uno profesional ve agenda y turnos. No podés cambiar mucho una vez creado sin re-confirmar el cambio con el nombre del negocio (RPC <code>change_my_sub_tenant_identity</code>).</div>
      </div>
    </article>

    <article class="step-card">
      <div class="step-head">
        <div class="step-num">3</div>
        <div class="step-meta">
          <div class="step-tag">Dashboard</div>
          <h2 class="step-title">El dashboard muestra el estado de cada cliente</h2>
        </div>
      </div>
      <div class="step-body">
        <p>La vista por defecto de <code>/clientes</code> es un dashboard con una card por sub-tenant. Cada card te muestra todo el estado del cliente sin tener que entrar a él:</p>

        <div class="panel-mock">
          <div class="pm-topbar">
            <div class="pm-dots"><span></span><span></span><span></span></div>
            <div class="pm-url">app.innovate-ia.com/clientes</div>
          </div>
          <div class="pm-body">
            <div class="client-card-mock">
              <div class="ccm-header">
                <div>
                  <div class="ccm-name">Casino Royale</div>
                  <div class="ccm-business">🏢 Casino Royale Online · Argentina</div>
                </div>
                <span class="ccm-badge">ACTIVO</span>
              </div>
              <div class="ccm-metrics">
                <div class="ccm-metric"><div class="ccm-mlabel">CHATS HOY</div><div class="ccm-mvalue blue">47</div></div>
                <div class="ccm-metric"><div class="ccm-mlabel">CHATS PER.</div><div class="ccm-mvalue blue">312</div></div>
                <div class="ccm-metric"><div class="ccm-mlabel">CHATS TOTAL</div><div class="ccm-mvalue blue">2.451</div></div>
                <div class="ccm-metric"><div class="ccm-mlabel">VENTAS HOY</div><div class="ccm-mvalue green">$35k</div></div>
                <div class="ccm-metric"><div class="ccm-mlabel">VENTAS PER.</div><div class="ccm-mvalue green">$245k</div></div>
                <div class="ccm-metric"><div class="ccm-mlabel">VENTAS TOT.</div><div class="ccm-mvalue green">$1.8M</div></div>
              </div>
              <div class="ccm-config">
                <span class="ccm-chip">✓ WA</span>
                <span class="ccm-chip">✓ Negocio</span>
                <span class="ccm-chip">✓ Billetera</span>
                <span class="ccm-chip">✓ Landing</span>
                <span class="ccm-chip off">○ Acceso</span>
              </div>
            </div>
          </div>
        </div>

        <p style="margin-top: 14px;"><strong>Lo que ves en cada card:</strong></p>
        <ul>
          <li><strong>Status</strong> (Activo / Pendiente / Vencido / Inactivo).</li>
          <li><strong>Métricas de chats</strong>: hoy, en el período seleccionado, y acumulado total.</li>
          <li><strong>Métricas de ventas</strong>: hoy, período, total — con monto + cantidad de operaciones.</li>
          <li><strong>Ticket promedio</strong> y <strong>tasa de conversión</strong> (% de chats que terminan en venta).</li>
          <li><strong>Sparkline</strong> de ventas de los últimos días del período.</li>
          <li><strong>Última actividad</strong> (hace cuánto fue el último mensaje).</li>
          <li><strong>5 chips de configuración</strong>: ✓/○ para WA, Negocio, Billetera, Landing, Acceso al panel.</li>
        </ul>

        <p>Arriba del grid tenés un <strong>DateRangePicker</strong> para cambiar el período del análisis y un <strong>multi-select</strong> para filtrar a un grupo específico de clientes. La vista tiene un toggle entre <strong>📊 Dashboard</strong> (grid de cards) y <strong>📋 Lista</strong> (tabla compacta).</p>

        <div class="tip"><strong>📥 Exportar:</strong> el botón de exportar genera un CSV o JSON con todos los datos visibles (filtrados por rango + selección). Útil para reconciliar comisiones, reportes a clientes, o backups.</div>
      </div>
    </article>

    <article class="step-card">
      <div class="step-head">
        <div class="step-num">4</div>
        <div class="step-meta">
          <div class="step-tag">Status</div>
          <h2 class="step-title">Los 4 estados de un sub-tenant</h2>
        </div>
      </div>
      <div class="step-body">
        <p>Cada sub-tenant tiene un status derivado del campo <code>status</code> y de <code>activated_until</code> (fecha hasta la cuál está activo):</p>

        <div class="status-grid">
          <div class="status-pill active">
            <div class="status-name">● Activo</div>
            <div class="status-desc">Operando normalmente. activated_until vigente.</div>
          </div>
          <div class="status-pill pending">
            <div class="status-name">◐ Pendiente</div>
            <div class="status-desc">Creado pero sin activated_until seteado. No opera todavía.</div>
          </div>
          <div class="status-pill expired">
            <div class="status-name">⚠ Vencido</div>
            <div class="status-desc">activated_until pasó. El bot dejó de responder.</div>
          </div>
          <div class="status-pill inactive">
            <div class="status-name">○ Inactivo</div>
            <div class="status-desc">Suspendido o cancelado manualmente.</div>
          </div>
        </div>

        <p style="margin-top: 14px;"><strong>Cómo se cambia el status:</strong></p>
        <ul>
          <li><strong>De pending a active</strong>: vos clickeás "Activar" y la RPC <code>tenant_activate_entity</code> setea <code>activated_until</code> con hasta 7 días.</li>
          <li><strong>De active a vencido</strong>: pasa solo cuando <code>activated_until</code> se cumple sin renovación.</li>
          <li><strong>Renovar antes de vencer</strong>: volvés a activar (consume tus créditos master).</li>
          <li><strong>Suspender</strong>: pausa la operación manualmente sin perder datos.</li>
          <li><strong>Cancelar</strong>: archivado. Los datos quedan, pero el sub-tenant pasa al estado inactivo.</li>
        </ul>

        <div class="info"><strong>📅 Límite de plazo:</strong> con tu RPC de partner podés activar hasta 7 días por vez. Si necesitás activar por más tiempo (ej: 30 días, 6 meses, 1 año), avisanos para que lo hagamos desde el admin (RPC <code>admin_activate_entity</code> permite hasta 3650 días).</div>
      </div>
    </article>

    <article class="step-card">
      <div class="step-head">
        <div class="step-num">5</div>
        <div class="step-meta">
          <div class="step-tag">Configuración del cliente</div>
          <h2 class="step-title">Los 5 chips de configuración</h2>
        </div>
      </div>
      <div class="step-body">
        <p>Cada card muestra 5 chips abajo con ✓ (configurado) o ○ (sin configurar):</p>

        <ul>
          <li><strong>WA</strong> — el sub-tenant tiene un token de Meta + número de WhatsApp vinculado. Sin esto el bot no responde mensajes.</li>
          <li><strong>Negocio</strong> — credenciales de la plataforma operativa (casino, tienda, agenda) cargadas. Sin esto, las acciones del bot relacionadas con la plataforma no funcionan.</li>
          <li><strong>Billetera</strong> — el sub-tenant configuró su Mercado Pago (o Ualá / MODO / Lemon / Belo) para recibir los pagos en SU cuenta, no la tuya.</li>
          <li><strong>Landing</strong> — tiene al menos una landing publicada en <code>/l/:slug</code>.</li>
          <li><strong>Acceso</strong> — vos le diste un usuario en <code>chat.innovate-ia.com/cliente</code> para que pueda entrar él mismo a ver sus chats.</li>
        </ul>

        <p>Los 4 primeros chips (WA / Negocio / Billetera / Landing) los podés configurar vos editando el sub-tenant. El chip "Acceso" se activa cuando le creás cuenta de usuario (paso siguiente).</p>

        <div class="tip"><strong>🎯 Setup recomendado para un cliente nuevo:</strong> 1) Cargás sus credenciales de plataforma. 2) Conectás su billetera. 3) Vinculás su WhatsApp (Meta Business API). 4) Le armás 1 landing inicial. 5) Le das acceso al panel para que él haga el resto. Tiempo total: ~15-20 minutos por cliente.</div>
      </div>
    </article>

    <article class="step-card">
      <div class="step-head">
        <div class="step-num">6</div>
        <div class="step-meta">
          <div class="step-tag">Dar acceso</div>
          <h2 class="step-title">El cliente entra a su propio panel</h2>
        </div>
      </div>
      <div class="step-body">
        <p>Cada sub-tenant puede tener su propio usuario para entrar a <code>chat.innovate-ia.com/cliente</code>. Allí ve SUS chats, SUS ventas, SUS productos — pero no ve los del resto de tus clientes ni el panel master.</p>

        <p>Para darle acceso:</p>
        <ol>
          <li>En el dashboard, clickeás el botón <strong>🔑 Dar acceso</strong> en la card del cliente.</li>
          <li>Ingresás el email del cliente.</li>
          <li>El sistema crea un usuario con contraseña temporal aleatoria y lo invoca a vía Edge Function <code>provision-sub-tenant</code>.</li>
          <li>Si Resend está configurado, le manda automáticamente un email con sus credenciales. Si no, te muestra la contraseña en pantalla para que se la pases vos por otro medio.</li>
          <li>El cliente entra, cambia la contraseña al primer ingreso, y desde ahí maneja su propio panel.</li>
        </ol>

        <p>Si el cliente ya tiene acceso y querés reenviárselo (olvidó la contraseña, querés rotarla):</p>
        <ul>
          <li>El botón cambia a <strong>🔑 Reenviar</strong>.</li>
          <li>Al clickearlo se genera una nueva contraseña temporal y se le manda por email.</li>
        </ul>

        <div class="success"><strong>📩 Tip de comunicación:</strong> antes de dar acceso, mandale un WhatsApp al cliente avisándole "te mandé los datos a tu mail, fijate spam y ponete la contraseña nueva". Reduce mucho el "no me llegó nada" y los reenvíos innecesarios.</div>

        <div class="info"><strong>🔐 Importante:</strong> el cliente, una vez con acceso, puede modificar TODO su panel: sus mensajes del bot, su billetera, sus productos. Si querés mantener vos el control de algo (ej: las credenciales de plataforma), no se las pases o usá la opción de "owner-only edit" donde aplica (ej: Meta Pixel).</div>
      </div>
    </article>

    <article class="step-card">
      <div class="step-head">
        <div class="step-num">7</div>
        <div class="step-meta">
          <div class="step-tag">Lifecycle</div>
          <h2 class="step-title">Pausar, reactivar o eliminar un cliente</h2>
        </div>
      </div>
      <div class="step-body">
        <p>Las acciones del lifecycle:</p>

        <p><strong>Suspender (pausar)</strong> — temporariamente parás la operación sin perder datos.</p>
        <ul>
          <li>El bot deja de responder.</li>
          <li>El cliente pierde el acceso a su panel (lo intenta entrar y ve "Cuenta suspendida — contactá soporte").</li>
          <li>Sus chats, ventas, contactos, productos y landings quedan intactos.</li>
          <li>Cuando reactivás, el sistema retoma todo desde donde quedó.</li>
        </ul>

        <p><strong>Reactivar</strong> — volvés a poner el sub-tenant activo. Requiere que tengas créditos master disponibles para extender el plazo.</p>

        <p><strong>Eliminar (cancelar permanentemente)</strong> — irreversible. Datos archivados, sub-tenant inactivo de forma definitiva.</p>

        <ul>
          <li>El botón <strong>Eliminar</strong> abre un modal que pide tipear el <strong>nombre exacto del cliente</strong> para confirmar (lowercase). Es para evitar borrar el cliente equivocado por accidente.</li>
          <li>Hace <code>delete_sub_tenant</code> en backend.</li>
          <li>Los datos asociados (chats, ventas) quedan en histórico pero el sub-tenant no se puede reactivar después.</li>
        </ul>

        <div class="danger"><strong>⚠ Cuándo eliminar vs suspender:</strong> si no estás seguro de que el cliente no va a volver, mejor <strong>suspendé</strong>. Eliminar es permanente y si después aparece, vas a tener que crear todo de nuevo. Suspender no consume créditos y es reversible al instante.</div>
      </div>
    </article>

    <section class="summary">
      <h2>Resumen — gestionar <span class="accent">tu cartera de clientes.</span></h2>
      <p>Los puntos clave del flujo:</p>
      <div class="summary-grid">
        <div class="summary-item">
          <div class="summary-check">1</div>
          <div>
            <div class="summary-item-title">Cada cliente es un sub-tenant independiente</div>
            <div class="summary-item-desc">Su WhatsApp, su billetera, sus chats, sus ventas. Vos ves agregado, él ve solo lo suyo.</div>
          </div>
        </div>
        <div class="summary-item">
          <div class="summary-check">2</div>
          <div>
            <div class="summary-item-title">Alta en 30 segundos</div>
            <div class="summary-item-desc">3 campos: identity (casino/tienda/marketing/profesional), nombre, slug. Después configurás todo lo demás.</div>
          </div>
        </div>
        <div class="summary-item">
          <div class="summary-check">3</div>
          <div>
            <div class="summary-item-title">Dashboard consolidado</div>
            <div class="summary-item-desc">Chats, ventas, ticket, conversión y sparkline de cada cliente en una card. Filtrás por rango de fecha + selección de clientes.</div>
          </div>
        </div>
        <div class="summary-item">
          <div class="summary-check">4</div>
          <div>
            <div class="summary-item-title">5 chips de configuración</div>
            <div class="summary-item-desc">WA / Negocio / Billetera / Landing / Acceso. Te dicen de un vistazo qué le falta a cada cliente.</div>
          </div>
        </div>
        <div class="summary-item">
          <div class="summary-check">5</div>
          <div>
            <div class="summary-item-title">Acceso delegado al cliente</div>
            <div class="summary-item-desc">Un click para crear su usuario y mandarle email con credenciales. Después gestiona él, no vos.</div>
          </div>
        </div>
        <div class="summary-item">
          <div class="summary-check">6</div>
          <div>
            <div class="summary-item-title">Lifecycle reversible</div>
            <div class="summary-item-desc">Suspendé en lugar de eliminar si dudás. Eliminar requiere tipear el nombre exacto.</div>
          </div>
        </div>
      </div>
    </section>
  </div>
</div>
`

export default function InstruccionesClientes() {
  const navigate = useNavigate()
  const location = useLocation()
  const containerRef = useRef(null)

  const backTo = getInstruccionesBase(location.pathname)

  useEffect(() => {
    const id = 'cl-tutorial-fonts'
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
          Instrucciones / Clientes
        </span>
      </div>

      <div ref={containerRef} dangerouslySetInnerHTML={{ __html: TUTORIAL_HTML }} />
    </div>
  )
}
