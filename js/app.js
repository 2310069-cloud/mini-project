/**
 * Adaptive SOC - App bootstrap, navigation, and page renderers.
 */
const App = (() => {
  const NAV = [
    { id: 'overview', label: 'Overview', icon: 'fa-gauge-high' },
    { id: 'how', label: 'How It Works', icon: 'fa-graduation-cap' },
    { id: 'incidents', label: 'Incidents', icon: 'fa-fire' },
    { id: 'events', label: 'Events', icon: 'fa-list' },
    { id: 'attack', label: 'Attack Analysis', icon: 'fa-crosshairs' },
    { id: 'risk', label: 'Risk', icon: 'fa-gauge' },
    { id: 'response', label: 'Response', icon: 'fa-shield-halved' },
    { id: 'verification', label: 'Verification', icon: 'fa-circle-check' },
    { id: 'notifications', label: 'Notifications', icon: 'fa-bell' },
    { id: 'settings', label: 'Settings', icon: 'fa-gear' },
  ];

  let ollamaOnline = false;

  async function checkOllama() {
    // Never probe the network unless the operator has explicitly opted in
    // via CONFIG.OLLAMA_ENABLED (see Settings page). This keeps the app
    // 100% functional and safe with zero local-network calls by default.
    if (!CONFIG.OLLAMA_ENABLED) { ollamaOnline = false; return; }
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 900);
      const res = await fetch(CONFIG.OLLAMA_TAGS_URL, { signal: controller.signal });
      clearTimeout(t);
      ollamaOnline = res.ok;
    } catch (_) {
      ollamaOnline = false;
    }
  }

  function employeeInitials(name) {
    if (!name) return 'SA';
    const parts = name.trim().split(/\s+/);
    const initials = parts.slice(0, 2).map((p) => p[0]).join('').toUpperCase();
    return initials || 'SA';
  }

  function renderShell() {
    const user = Auth.getCurrentUser();
    const displayName = user ? user.full_name : 'soc-analyst';
    const initials = user ? employeeInitials(user.full_name) : 'SA';
    document.getElementById('app-root').innerHTML = `
      <div id="app-shell">
        <div class="mobile-topbar">
          <button class="nav-toggle-btn" id="nav-toggle-btn" aria-label="Open menu">${UI.icon('fa-bars')}</button>
          <div class="brand">
            <div class="brand-mark">SOC</div>
            <div class="brand-text">
              <div class="brand-title">${CONFIG.APP_NAME}</div>
            </div>
          </div>
        </div>
        <div class="sidebar-backdrop" id="sidebar-backdrop"></div>
        <aside id="sidebar">
          <div class="brand">
            <div class="brand-mark">SOC</div>
            <div class="brand-text">
              <div class="brand-title">${CONFIG.APP_NAME}</div>
              <div class="brand-sub">${CONFIG.APP_SUBTITLE}</div>
            </div>
            <button class="nav-close-btn" id="nav-close-btn" aria-label="Close menu">${UI.icon('fa-xmark')}</button>
          </div>
          <nav id="main-nav"></nav>
          <div class="sidebar-employee">
            <div class="avatar">${initials}</div>
            <div class="sidebar-employee-info">
              <div class="sidebar-employee-name">${Utils.escapeHtml(displayName)}</div>
              <div class="sidebar-employee-role">${Utils.escapeHtml(user ? (user.department || 'SOC Analyst') : '')}</div>
            </div>
            <button class="btn btn-sm btn-ghost" id="logout-btn" title="Logout">${UI.icon('fa-right-from-bracket')}</button>
          </div>
          <div class="sidebar-footer">
            No external APIs · Local AI only<br>Isolated lab environment
          </div>
        </aside>
        <div id="content-area">
          <header id="topbar">
            <div class="topbar-left">
              <span class="page-title" id="page-title-text">Overview</span>
              <span class="env-chip">${CONFIG.ENVIRONMENT}</span>
            </div>
            <div class="topbar-right">
              <span class="status-pill" id="ai-status-pill"><span class="dot warn"></span> AI: checking…</span>
              <span class="status-pill"><span class="dot"></span> System: ONLINE</span>
              <div class="admin-chip" id="logout-chip" title="Click to logout"><div class="avatar">${initials}</div> ${Utils.escapeHtml(displayName)} ${UI.icon('fa-right-from-bracket')}</div>
            </div>
          </header>
          <main id="page-content"></main>
        </div>
      </div>
      <div class="toast-container" id="toast-container"></div>
    `;
    renderNav();
    wireShellChrome();
  }

  function wireShellChrome() {
    const toggleBtn = document.getElementById('nav-toggle-btn');
    const closeBtn = document.getElementById('nav-close-btn');
    const backdrop = document.getElementById('sidebar-backdrop');
    const sidebar = document.getElementById('sidebar');
    function openSidebar() { sidebar.classList.add('open'); backdrop.classList.add('show'); }
    function closeSidebar() { sidebar.classList.remove('open'); backdrop.classList.remove('show'); }
    if (toggleBtn) toggleBtn.addEventListener('click', openSidebar);
    if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
    if (backdrop) backdrop.addEventListener('click', closeSidebar);
    const logoutBtn = document.getElementById('logout-btn');
    const logoutChip = document.getElementById('logout-chip');
    if (logoutBtn) logoutBtn.addEventListener('click', doLogout);
    if (logoutChip) logoutChip.addEventListener('click', doLogout);
  }

  function doLogout() {
    Auth.logout();
    UI.toast('Logged out.', 'info');
    AuthUI.renderLogin();
  }

  function renderNav() {
    const nav = document.getElementById('main-nav');
    const unread = State.data.notifications.filter((n) => !n.read).length;
    nav.innerHTML = NAV.map((item) => `
      <div class="nav-item ${State.data.page === item.id ? 'active' : ''}" data-nav="${item.id}">
        ${UI.icon(item.icon)}<span>${item.label}</span>
        ${item.id === 'notifications' && unread ? `<span class="nav-badge alert">${unread}</span>` : ''}
        ${item.id === 'incidents' ? `<span class="nav-badge">${State.data.incidents.length}</span>` : ''}
      </div>`).join('');
    nav.querySelectorAll('.nav-item').forEach((el) => {
      el.addEventListener('click', () => {
        goTo(el.dataset.nav);
        const sidebar = document.getElementById('sidebar');
        const backdrop = document.getElementById('sidebar-backdrop');
        if (sidebar) sidebar.classList.remove('open');
        if (backdrop) backdrop.classList.remove('show');
      });
    });
  }

  async function goTo(page, params = {}) {
    State.data.page = page;
    State.data.params = params;
    document.getElementById('page-title-text').textContent = NAV.find((n) => n.id === page)?.label || page;
    renderNav();
    await renderPage();
  }

  async function renderPage() {
    const main = document.getElementById('page-content');
    main.innerHTML = UI.loadingState();
    try {
      switch (State.data.page) {
        case 'overview': await Pages.mountOverview(); break;
        case 'how': Pages.mountHowItWorks(); break;
        case 'incidents': Pages.mountIncidents(); break;
        case 'events': Pages.mountEvents(); break;
        case 'attack': Pages.mountAttack(); break;
        case 'risk': Pages.mountRisks(); break;
        case 'response': Pages.mountResponses(); break;
        case 'verification': Pages.mountVerifications(); break;
        case 'notifications': Pages.mountNotifications(); break;
        case 'settings': Pages.mountSettings(); break;
        default: main.innerHTML = UI.emptyState('Unknown page');
      }
    } catch (e) {
      console.error(e);
      main.innerHTML = UI.errorState(`Failed to render page: ${e.message}`);
    }
  }

  function updateStatusPill() {
    const pill = document.getElementById('ai-status-pill');
    if (!pill) return;
    pill.innerHTML = ollamaOnline
      ? `<span class="dot"></span> AI: LOCAL (OLLAMA)`
      : `<span class="dot warn"></span> AI: LOCAL (FALLBACK)`;
  }

  function toggleOllama(enabled) {
    CONFIG.OLLAMA_ENABLED = enabled;
    checkOllama().then(updateStatusPill);
  }

  async function refresh() {
    await State.refreshAll();
    renderNav();
    await renderPage();
  }

  // -------------------- Scenario runner with live pipeline UI --------------------
  const STAGE_DEFS = [
    { key: 'EVENT_STREAM', label: 'Ingesting synthetic security events' },
    { key: 'CORRELATING', label: 'Behavior correlation (60s window)' },
    { key: 'FINGERPRINTING', label: 'Attack fingerprinting' },
    { key: 'RISK_ANALYSIS', label: 'Deterministic risk scoring' },
    { key: 'AI_ANALYSIS', label: 'Local AI threat analysis' },
    { key: 'POLICY', label: 'Adaptive response policy' },
    { key: 'RESPONSE', label: 'Response execution' },
    { key: 'CREDENTIAL_SECURITY', label: 'Credential security action' },
    { key: 'VERIFICATION', label: 'Verification engine' },
    { key: 'REPORT_GENERATION', label: 'Post-incident AI report' },
    { key: 'DONE', label: 'Resolution & notification' },
  ];

  function liveModalHtml(scenario) {
    const info = Explain.attackInfo(scenario);
    return `
      <div class="modal-box" style="max-width:700px;">
        <div class="modal-header">
          <h3>${UI.icon('fa-satellite-dish')} Live Attack Pipeline${info ? ' — ' + info.title.replace(/ ⭐.*/, '') : ''}</h3>
          <button class="modal-close" id="live-close" disabled>${UI.icon('fa-xmark')}</button>
        </div>
        <div class="modal-body">
          <div id="live-event-counter" class="card-sub" style="margin-bottom:10px;"></div>
          <div class="narration-box" id="live-narration">
            <div class="narration-title">${UI.icon('fa-comment-dots')} What's happening right now</div>
            <div class="narration-text" id="live-narration-text">Preparing the safe synthetic attack simulator…</div>
          </div>
          <div class="stage-list" id="live-stage-list">
            ${STAGE_DEFS.map((s) => `<div class="stage-item" data-stage="${s.key}"><span class="stage-icon">${UI.icon('fa-circle-notch')}</span><span>${s.label}</span></div>`).join('')}
          </div>
        </div>
      </div>`;
  }

  function setStage(key, status) {
    const el = document.querySelector(`#live-stage-list [data-stage="${key}"]`);
    if (!el) return;
    el.classList.remove('active', 'done', 'fail');
    const iconEl = el.querySelector('.stage-icon');
    if (status === 'active') {
      el.classList.add('active'); iconEl.innerHTML = UI.icon('fa-spinner fa-spin');
      const narr = Explain.stageNarration(key);
      const box = document.getElementById('live-narration-text');
      if (box && narr) box.innerHTML = `<strong>${narr.title}</strong><br>${narr.plain}`;
    }
    if (status === 'done') { el.classList.add('done'); iconEl.innerHTML = UI.icon('fa-check'); }
    if (status === 'fail') { el.classList.add('fail'); iconEl.innerHTML = UI.icon('fa-xmark'); }
  }

  function briefingModalHtml(scenario) {
    const info = Explain.attackInfo(scenario);
    if (!info) return null;
    return `
      <div class="modal-box" style="max-width:600px;">
        <div class="modal-header">
          <h3>${UI.icon('fa-crosshairs')} Attack Briefing</h3>
          <button class="modal-close" id="brief-close">${UI.icon('fa-xmark')}</button>
        </div>
        <div class="modal-body">
          <h4 style="margin:0 0 4px;font-size:16px;">${info.title}</h4>
          <p style="color:var(--accent);font-weight:600;font-size:13px;margin:0 0 14px;">${info.tagline}</p>
          <div class="report-section">
            <h4>What happens in this scenario</h4>
            <p>${info.plain}</p>
          </div>
          <div class="report-section">
            <h4>Why it matters</h4>
            <p>${info.whyItMatters}</p>
          </div>
          <div class="report-section">
            <h4>Expected outcome</h4>
            <p>${info.expected}</p>
          </div>
          <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:10px;">
            <button class="btn" id="brief-cancel">Cancel</button>
            <button class="btn btn-primary" id="brief-launch">${UI.icon('fa-play')} Launch This Scenario</button>
          </div>
        </div>
      </div>`;
  }

  function confirmAndRun(scenario) {
    const html = briefingModalHtml(scenario);
    if (!html) { runScenario(scenario); return; }
    const overlay = UI.openModal(html);
    overlay.querySelector('#brief-close').addEventListener('click', UI.closeModal);
    overlay.querySelector('#brief-cancel').addEventListener('click', UI.closeModal);
    overlay.querySelector('#brief-launch').addEventListener('click', () => {
      UI.closeModal();
      runScenario(scenario);
    });
  }

  /** Shared stage handler for the synthetic simulator pipeline. */
  function makeStageHandler() {
    return (stage, payload) => {
      const counterEl = document.getElementById('live-event-counter');
      switch (stage) {
        case 'EVENT_STREAM_START':
          setStage('EVENT_STREAM', 'active');
          break;
        case 'EVENT_STREAM_PROGRESS':
          if (counterEl) counterEl.textContent = `Event ${payload.index}/${payload.total} — ${payload.event.source_ip} → ${payload.event.username} (${payload.event.authentication_result})`;
          break;
        case 'EVENT_STREAM_DONE':
          setStage('EVENT_STREAM', 'done');
          if (counterEl) counterEl.textContent = `${payload.count} events ingested.`;
          break;
        case 'CORRELATING': setStage('CORRELATING', 'active'); break;
        case 'CORRELATED': setStage('CORRELATING', 'done'); break;
        case 'FINGERPRINTING': setStage('FINGERPRINTING', 'active'); break;
        case 'FINGERPRINTED': setStage('FINGERPRINTING', 'done'); break;
        case 'RISK_ANALYSIS': setStage('RISK_ANALYSIS', 'active'); break;
        case 'RISK_SCORED': setStage('RISK_ANALYSIS', 'done'); break;
        case 'AI_ANALYSIS': setStage('AI_ANALYSIS', 'active'); break;
        case 'ANALYZED': setStage('AI_ANALYSIS', 'done'); break;
        case 'POLICY': setStage('POLICY', 'active'); break;
        case 'POLICY_APPROVED': setStage('POLICY', 'done'); break;
        case 'RESPONSE': setStage('RESPONSE', 'active'); break;
        case 'RESPONSE_EXECUTED': setStage('RESPONSE', 'done'); break;
        case 'RESPONSE_FAILED': setStage('RESPONSE', 'fail'); break;
        case 'CREDENTIAL_SECURITY': setStage('CREDENTIAL_SECURITY', 'active'); break;
        case 'CREDENTIAL_SECURITY_DONE': setStage('CREDENTIAL_SECURITY', 'done'); break;
        case 'VERIFICATION': setStage('VERIFICATION', 'active'); break;
        case 'VERIFIED': setStage('VERIFICATION', 'done'); break;
        case 'REPORT_GENERATION': setStage('REPORT_GENERATION', 'active'); break;
        case 'REPORT_GENERATED': setStage('REPORT_GENERATION', 'done'); break;
        case 'REPORT_FAILED': setStage('REPORT_GENERATION', 'fail'); break;
        case 'DONE': setStage('DONE', 'done'); break;
        default: break;
      }
    };
  }

  async function finishPipelineRun(incident, credential) {
    // mark stages not used (e.g. no credential action) as done/skipped
    STAGE_DEFS.forEach((s) => {
      const el = document.querySelector(`#live-stage-list [data-stage="${s.key}"]`);
      if (el && !el.classList.contains('done') && !el.classList.contains('fail')) setStage(s.key, 'done');
    });

    await Utils.sleep(500);
    UI.closeModal();

    await refresh();

    if (credential && credential.required) {
      showCredentialModal(incident, credential);
    }

    if (incident.status === 'RESOLVED') {
      UI.toast(`${incident.incident_code} RESOLVED — containment effective`, 'success');
    } else if (incident.status === 'ESCALATED') {
      UI.toast(`${incident.incident_code} ESCALATED — manual review required`, 'error');
    } else {
      UI.toast(`${incident.incident_code} processed`, 'info');
    }

    if (['incidents', 'overview'].includes(State.data.page)) {
      goTo(State.data.page);
    }
  }

  async function runScenario(scenario) {
    if (State.data.running) { UI.toast('A scenario is already running', 'error'); return; }
    State.data.running = true;
    UI.openModal(liveModalHtml(scenario));

    try {
      const { incident, credential } = await Pipeline.run(scenario, { onStage: makeStageHandler() });
      await finishPipelineRun(incident, credential);
    } catch (e) {
      console.error(e);
      UI.closeModal();
      UI.toast(`Scenario failed: ${e.message}`, 'error');
    } finally {
      State.data.running = false;
    }
  }

  function showCredentialModal(incident, credential) {
    const simulatedTag = credential.simulated ? `<span class="chip">SIMULATED CREDENTIAL — DRY_RUN</span>` : '';
    const html = `
      <div class="modal-box">
        <div class="modal-header">
          <h3>${UI.icon('fa-key')} SECURITY ACTION COMPLETED</h3>
          <button class="modal-close" id="cred-close">${UI.icon('fa-xmark')}</button>
        </div>
        <div class="modal-body">
          ${UI.kv('Account', `<span class="mono">${Utils.escapeHtml(credential.account)}</span>`)}
          ${UI.kv('Reason', 'Authentication attack response')}
          ${UI.kv('Incident', incident.incident_code)}
          ${UI.kv('Action', 'PASSWORD RESET')}
          ${UI.kv('Status', credential.status)}
          <div style="margin:14px 0 6px;font-size:12px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.04em;">Temporary Password ${simulatedTag}</div>
          <div class="password-box">
            <span class="password-value mono" id="temp-pw-value">${Utils.escapeHtml(credential.tempPasswordOneTime)}</span>
            <button class="btn btn-sm" id="copy-pw-btn">${UI.icon('fa-copy')} Copy</button>
          </div>
          <div class="warning-box">${UI.icon('fa-triangle-exclamation')} This temporary password will be displayed only once. It is not stored anywhere and cannot be retrieved after you close this window.</div>
          <div style="margin-top:16px;display:flex;justify-content:flex-end;">
            <button class="btn btn-primary" id="cred-done-btn">Close</button>
          </div>
        </div>
      </div>`;
    const overlay = UI.openModal(html, { className: 'credential-modal' });

    function discard() {
      // Wipe the DOM reference and the closure variable. Nothing is persisted anywhere.
      credential.tempPasswordOneTime = null;
      const valEl = document.getElementById('temp-pw-value');
      if (valEl) valEl.textContent = '••••••••••••';
      UI.closeModal();
    }
    overlay.querySelector('#copy-pw-btn').addEventListener('click', () => {
      navigator.clipboard.writeText(credential.tempPasswordOneTime || '').then(() => UI.toast('Password copied to clipboard', 'success'));
    });
    overlay.querySelector('#cred-close').addEventListener('click', discard);
    overlay.querySelector('#cred-done-btn').addEventListener('click', discard);
  }

  async function startAuthenticatedApp() {
    renderShell();
    await State.refreshAll();
    renderNav();
    await goTo('overview');
    checkOllama().then(updateStatusPill);
    setInterval(() => checkOllama().then(updateStatusPill), 20000);
  }

  async function init() {
    const employee = await Auth.restoreSession();
    if (employee) {
      await startAuthenticatedApp();
    } else {
      AuthUI.renderLogin();
    }
  }

  return { init, goTo, refresh, runScenario, confirmAndRun, toggleOllama, startAuthenticatedApp, NAV };
})();

document.addEventListener('DOMContentLoaded', () => App.init());
