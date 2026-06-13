// Estilos compartidos para todos los tutoriales de billeteras (Ualá, MODO, Lemon, Belo).
// El CSS está scopeado bajo .wallet-tutorial — no afecta al resto de la app.
// Se reutiliza el lenguaje visual del tutorial de Mercado Pago (oro, dark surfaces, monospace).

// Defensa contra inyección si algún `accent` viene de DB/usuario en el futuro.
// Hoy todos los call sites pasan literales, pero el valor se interpola dentro
// de un dangerouslySetInnerHTML — un valor con `</style>` o comillas rompería
// el sandbox del CSS scoped.
export function safeAccent(value, fallback = '#D4A843') {
  return typeof value === 'string' && /^#[0-9A-Fa-f]{3,8}$/.test(value) ? value : fallback
}

export const TUTORIAL_STYLES = `
<style>
  .wallet-tutorial {
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
    --danger: #ef4444;
    --danger-soft: #ff7373;
    --success: #22c55e;
    background: var(--bg);
    color: var(--text);
    font-family: 'DM Sans', sans-serif;
    line-height: 1.6;
    padding: clamp(28px, 3vw, 56px) clamp(16px, 3vw, 64px) clamp(60px, 5vw, 120px);
  }
  .wallet-tutorial * { box-sizing: border-box; margin: 0; padding: 0; }
  .wallet-tutorial .container { max-width: clamp(920px, 75vw, 1400px); margin: 0 auto; }
  .wallet-tutorial .head { text-align: center; margin-bottom: clamp(50px, 4vw, 80px); }
  .wallet-tutorial .head .chip {
    display: inline-block; padding: 6px 14px; border-radius: 99px;
    border: 1px solid; font-size: clamp(11px, 0.7vw, 14px); font-weight: 600;
    letter-spacing: .1em; text-transform: uppercase; margin-bottom: 18px;
  }
  .wallet-tutorial .head h1 {
    font-size: clamp(26px, 3vw, 52px);
    font-weight: 800; letter-spacing: -.02em; margin-bottom: 14px; color: var(--text);
  }
  .wallet-tutorial .head p { font-size: clamp(15px, 1vw, 19px); color: var(--muted); max-width: clamp(580px, 50vw, 880px); margin: 0 auto; }
  .wallet-tutorial .head .meta {
    display: inline-flex; gap: 18px; margin-top: 22px; font-size: clamp(12px, 0.85vw, 15px);
    color: var(--muted2); flex-wrap: wrap; justify-content: center;
  }
  .wallet-tutorial .head .meta span { display: inline-flex; align-items: center; gap: 6px; }
  .wallet-tutorial .head .meta strong { color: var(--text); font-weight: 500; }

  .wallet-tutorial .step-card {
    background: var(--surf); border: 1px solid var(--border); border-radius: 18px;
    padding: clamp(28px, 2.4vw, 44px) clamp(26px, 2.2vw, 40px); margin-bottom: clamp(24px, 2vw, 36px); position: relative; overflow: hidden;
  }
  .wallet-tutorial .step-card::before {
    content: ''; position: absolute; top: 0; left: 0; width: 4px; height: 100%;
    background: var(--accent, var(--gold));
  }
  .wallet-tutorial .step-head { display: flex; align-items: flex-start; gap: clamp(16px, 1.4vw, 24px); margin-bottom: clamp(22px, 1.8vw, 32px); }
  .wallet-tutorial .step-num {
    flex-shrink: 0; width: clamp(44px, 3.6vw, 64px); height: clamp(44px, 3.6vw, 64px); border-radius: clamp(12px, 1vw, 16px);
    background: var(--accent, var(--gold)); color: var(--bg); font-size: clamp(19px, 1.6vw, 26px); font-weight: 800;
    display: flex; align-items: center; justify-content: center;
  }
  .wallet-tutorial .step-num.danger { background: var(--danger); color: #fff; }
  .wallet-tutorial .step-meta { flex: 1; min-width: 0; }
  .wallet-tutorial .step-tag {
    display: inline-block; font-size: clamp(10px, 0.7vw, 13px); font-weight: 700; letter-spacing: .12em;
    text-transform: uppercase; color: var(--accent, var(--gold)); margin-bottom: 4px;
  }
  .wallet-tutorial .step-tag.danger { color: var(--danger); }
  .wallet-tutorial .step-title {
    font-size: clamp(20px, 1.8vw, 32px); font-weight: 700; letter-spacing: -.01em; line-height: 1.25; color: var(--text);
  }
  .wallet-tutorial .step-body { font-size: clamp(14px, 1vw, 17px); color: var(--muted); line-height: 1.65; }
  .wallet-tutorial .step-body p { margin-bottom: 12px; }
  .wallet-tutorial .step-body strong { color: var(--text); font-weight: 600; }
  .wallet-tutorial .step-body code {
    background: var(--surf2); border: 1px solid var(--border2); border-radius: 5px;
    padding: 1px 7px; font-family: 'JetBrains Mono', monospace; font-size: 12px; color: var(--gold2);
  }
  .wallet-tutorial .step-body a {
    color: var(--accent, var(--gold)); text-decoration: underline;
    text-decoration-color: rgba(212,168,67,.3); word-break: break-all;
  }

  /* Mockup de panel/app */
  .wallet-tutorial .mockup {
    border-radius: 12px; margin: 22px 0; overflow: hidden;
    box-shadow: 0 24px 64px rgba(0,0,0,.5); font-family: 'DM Sans', sans-serif;
  }
  .wallet-tutorial .mockup.web { background: #fff; color: #1a1a1a; }
  .wallet-tutorial .mockup.app {
    background: #1a1a1a; color: #fff; max-width: 360px; margin: 22px auto;
    border-radius: 28px; border: 8px solid #2a2a2a;
  }

  /* Browser bar (web) */
  .wallet-tutorial .browser-bar {
    background: #f5f5f5; border-bottom: 1px solid #e0e0e0;
    padding: 10px 14px; display: flex; align-items: center; gap: 8px;
  }
  .wallet-tutorial .browser-dots { display: flex; gap: 6px; }
  .wallet-tutorial .browser-dots span {
    width: 11px; height: 11px; border-radius: 50%; background: #e0e0e0;
  }
  .wallet-tutorial .browser-dots span:nth-child(1) { background: #ff5f57; }
  .wallet-tutorial .browser-dots span:nth-child(2) { background: #ffbd2e; }
  .wallet-tutorial .browser-dots span:nth-child(3) { background: #28c941; }
  .wallet-tutorial .browser-url {
    flex: 1; background: #fff; border: 1px solid #d8d8d8; border-radius: 5px;
    padding: 5px 10px; font-family: 'JetBrains Mono', monospace; font-size: 11px;
    color: #555; word-break: break-all;
  }
  .wallet-tutorial .browser-url::before { content: '🔒  '; }

  /* App status bar (mobile mockup) */
  .wallet-tutorial .phone-status {
    padding: 10px 18px; display: flex; justify-content: space-between;
    font-size: 11px; font-weight: 600; color: #fff;
  }
  .wallet-tutorial .phone-body { padding: 16px 20px 24px; }

  /* Topbar app */
  .wallet-tutorial .app-topbar {
    padding: 14px 20px; display: flex; align-items: center; gap: 12px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
  }
  .wallet-tutorial .app-back {
    color: #fff; font-size: 18px; opacity: 0.8;
  }
  .wallet-tutorial .app-title {
    font-size: 16px; font-weight: 600; color: #fff;
  }

  /* Generic h1/sub inside mockup */
  .wallet-tutorial .mp-body, .wallet-tutorial .mp-content {
    padding: 22px 24px; min-height: 240px; background: #fff;
  }
  .wallet-tutorial .mp-breadcrumb { font-size: 12px; color: #999; margin-bottom: 14px; }
  .wallet-tutorial .mp-breadcrumb span { color: #555; }
  .wallet-tutorial .mp-h1 {
    font-size: 20px; font-weight: 700; color: #1a1a1a; margin-bottom: 6px;
  }
  .wallet-tutorial .mp-sub { font-size: 12px; color: #777; margin-bottom: 22px; }

  /* Form fields (web mockup) */
  .wallet-tutorial .mp-form { display: flex; flex-direction: column; gap: 16px; }
  .wallet-tutorial .mp-field { display: flex; flex-direction: column; gap: 6px; }
  .wallet-tutorial .mp-label { font-size: 13px; font-weight: 600; color: #333; }
  .wallet-tutorial .mp-label .req { color: #d40000; margin-left: 2px; }
  .wallet-tutorial .mp-help { font-size: 11px; color: #888; margin-top: 2px; }
  .wallet-tutorial .mp-input {
    border: 1px solid #ccc; border-radius: 6px; padding: 9px 12px;
    font-size: 13px; background: #fff; color: #1a1a1a; font-family: inherit; width: 100%;
  }
  .wallet-tutorial .mp-input.filled-good {
    border-color: #00a650; background: #f6fdf9;
  }

  /* App fields (mobile mockup) */
  .wallet-tutorial .app-section-title {
    font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.45);
    text-transform: uppercase; letter-spacing: 0.1em; margin: 16px 0 10px;
  }
  .wallet-tutorial .app-row {
    background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px; padding: 14px; margin-bottom: 10px;
    display: flex; align-items: center; gap: 12px;
    cursor: pointer;
  }
  .wallet-tutorial .app-row.active { border-color: rgba(255,255,255,0.3); background: rgba(255,255,255,0.08); }
  .wallet-tutorial .app-row-icon {
    width: 36px; height: 36px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; flex-shrink: 0;
  }
  .wallet-tutorial .app-row-text { flex: 1; }
  .wallet-tutorial .app-row-title { font-size: 13.5px; font-weight: 600; color: #fff; }
  .wallet-tutorial .app-row-desc { font-size: 11.5px; color: rgba(255,255,255,0.5); margin-top: 2px; }
  .wallet-tutorial .app-row-arrow { color: rgba(255,255,255,0.4); font-size: 14px; }

  /* Side nav for web mockup */
  .wallet-tutorial .mp-app-layout { display: grid; grid-template-columns: 200px 1fr; min-height: 300px; }
  .wallet-tutorial .mp-sidebar { background: #f7f7f9; border-right: 1px solid #e8e8e8; padding: 18px 0; }
  .wallet-tutorial .mp-sidebar-title {
    font-size: 11px; font-weight: 700; color: #999; text-transform: uppercase;
    letter-spacing: .05em; padding: 0 18px; margin-bottom: 12px;
  }
  .wallet-tutorial .mp-nav-item {
    padding: 9px 18px; font-size: 12.5px; color: #555;
    display: flex; align-items: center; gap: 8px;
  }
  .wallet-tutorial .mp-nav-item.active {
    background: #e6f3fb; color: var(--accent, #009ee3); font-weight: 600;
    border-left: 3px solid var(--accent, #009ee3); padding-left: 15px;
  }

  /* Credential cards inside mockup */
  .wallet-tutorial .mp-cred-card {
    background: #f7f7f9; border: 1px solid #e0e0e0; border-radius: 8px;
    padding: 14px; margin-bottom: 12px;
  }
  .wallet-tutorial .mp-cred-row {
    display: flex; align-items: center; justify-content: space-between; gap: 10px;
  }
  .wallet-tutorial .mp-cred-label {
    font-size: 11px; font-weight: 700; color: #555;
    text-transform: uppercase; letter-spacing: .05em;
  }
  .wallet-tutorial .mp-cred-actions { display: flex; gap: 8px; }
  .wallet-tutorial .mp-icon-btn {
    width: 28px; height: 28px; border-radius: 5px; background: #fff;
    border: 1px solid #d0d0d0; display: flex; align-items: center; justify-content: center;
    font-size: 12px;
  }
  .wallet-tutorial .mp-cred-value {
    font-family: 'JetBrains Mono', monospace; font-size: 11.5px; color: #1a1a1a;
    background: #fff; border: 1px solid #d8d8d8; border-radius: 5px;
    padding: 8px 11px; margin-top: 9px; word-break: break-all;
  }
  .wallet-tutorial .mp-cred-value .blur {
    filter: blur(3.5px); user-select: none;
  }
  .wallet-tutorial .mp-pill {
    display: inline-block; color: #fff; font-size: 9px; font-weight: 700;
    padding: 2px 8px; border-radius: 99px; letter-spacing: .04em;
    text-transform: uppercase; margin-right: 6px;
  }
  .wallet-tutorial .mp-pill-prod { background: #00a650; }

  .wallet-tutorial .mp-btn {
    color: #fff; padding: 10px 24px; border-radius: 6px;
    font-size: 13px; font-weight: 600; display: inline-block; border: none; cursor: pointer;
    background: var(--accent, #009ee3);
  }
  .wallet-tutorial .mp-btn-secondary {
    background: #fff; color: var(--accent, #009ee3); border: 1px solid var(--accent, #009ee3);
  }

  /* Tip / Danger boxes */
  .wallet-tutorial .tip {
    background: rgba(212,168,67,.05); border-left: 3px solid var(--gold);
    border-radius: 0 7px 7px 0; padding: 12px 16px; margin: 14px 0;
    font-size: 13px; color: var(--text);
  }
  .wallet-tutorial .tip strong { color: var(--gold); }
  .wallet-tutorial .danger {
    background: rgba(239,68,68,.05); border-left: 3px solid var(--danger);
    color: var(--text); padding: 12px 16px; margin: 14px 0;
    font-size: 13px; border-radius: 0 7px 7px 0;
  }
  .wallet-tutorial .danger strong { color: var(--danger-soft); }

  /* Innovate panel preview (paso 5) */
  .wallet-tutorial .ia-panel {
    background: #080B12; padding: 24px 22px; color: #E9E7E0;
  }
  .wallet-tutorial .ia-panel-h {
    font-family: 'DM Sans', sans-serif; margin-bottom: 18px;
  }
  .wallet-tutorial .ia-tag {
    font-size: 11px; font-family: 'JetBrains Mono', monospace; color: #4E5168;
    text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 4px;
  }
  .wallet-tutorial .ia-h4 {
    font-size: 16px; font-weight: 700; color: #E9E7E0; margin: 0;
  }
  .wallet-tutorial .ia-field { margin-bottom: 14px; }
  .wallet-tutorial .ia-field-label {
    font-size: 11px; font-family: 'JetBrains Mono', monospace; color: #D4A843;
    text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 6px; font-weight: 600;
  }
  .wallet-tutorial .ia-input-wrap {
    background: #111420; border: 1px solid #1e2130; border-radius: 8px;
    padding: 9px 12px; display: flex; align-items: center; gap: 8px;
  }
  .wallet-tutorial .ia-input {
    flex: 1; background: transparent; border: 0; color: #E9E7E0; font-size: 13px;
    font-family: 'JetBrains Mono', monospace; outline: none;
  }
  .wallet-tutorial .ia-pill-ok {
    background: rgba(34,197,94,0.15); border: 1px solid rgba(34,197,94,0.3);
    color: #22c55e; font-size: 10px; font-weight: 700; padding: 3px 9px;
    border-radius: 99px; letter-spacing: 0.04em; text-transform: uppercase;
  }
  .wallet-tutorial .ia-help {
    font-size: 11px; color: #4E5168; margin: 5px 0 0;
  }
  .wallet-tutorial .ia-btn-primary {
    background: #D4A843; color: #080B12; padding: 10px 20px; border-radius: 8px;
    border: 0; font-size: 13px; font-weight: 700; margin-top: 18px;
  }

  /* Security cards */
  .wallet-tutorial .sec-card {
    background: rgba(34,197,94,0.05); border: 1px solid rgba(34,197,94,0.2);
    border-radius: 9px; padding: 13px 16px;
    display: flex; gap: 12px; align-items: flex-start;
    margin-bottom: 10px;
  }
  .wallet-tutorial .sec-check {
    flex-shrink: 0; width: 22px; height: 22px; border-radius: 50%;
    background: var(--success); color: #fff;
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: 13px;
  }
  .wallet-tutorial .sec-title {
    font-size: 13px; font-weight: 700; color: var(--text); margin: 0 0 3px;
  }
  .wallet-tutorial .sec-desc {
    font-size: 12px; color: var(--muted); margin: 0;
  }

  /* Summary final */
  .wallet-tutorial .summary {
    background: linear-gradient(180deg, var(--surf) 0%, rgba(212,168,67,.05) 100%);
    border: 1px solid rgba(212,168,67,.3);
    border-radius: 18px; padding: 30px 26px; margin-top: 36px;
  }
  .wallet-tutorial .summary h2 {
    font-size: 20px; font-weight: 800; margin-bottom: 6px; color: var(--text);
  }
  .wallet-tutorial .summary h2 .accent { color: var(--gold); }
  .wallet-tutorial .summary > p {
    font-size: 13px; color: var(--muted); margin-bottom: 18px;
  }
  .wallet-tutorial .summary-grid { display: grid; gap: 10px; }
  .wallet-tutorial .summary-item {
    background: var(--surf2); border: 1px solid var(--border2);
    border-radius: 9px; padding: 13px 15px;
    display: flex; align-items: flex-start; gap: 12px;
  }
  .wallet-tutorial .summary-check {
    flex-shrink: 0; width: 22px; height: 22px; border-radius: 50%;
    background: var(--gold); color: var(--bg);
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: 13px; margin-top: 1px;
  }
  .wallet-tutorial .summary-item-title {
    font-size: 13px; font-weight: 700; color: var(--text);
    margin-bottom: 2px; font-family: 'JetBrains Mono', monospace;
  }
  .wallet-tutorial .summary-item-desc {
    font-size: 12px; color: var(--muted);
  }

  @media (max-width: 600px) {
    .wallet-tutorial .step-card { padding: 22px 18px; }
    .wallet-tutorial .step-head { flex-direction: column; gap: 14px; }
    .wallet-tutorial .mp-app-layout { grid-template-columns: 1fr; }
    .wallet-tutorial .mp-sidebar { display: none; }
    .wallet-tutorial .mp-body, .wallet-tutorial .mp-content { padding: 16px; }
  }
</style>
`

export const WALLET_FONTS_LINK = 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap'
