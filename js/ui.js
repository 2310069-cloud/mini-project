/**
 * Adaptive SOC - UI rendering layer.
 * Pure render functions that take data and return HTML strings, plus
 * small helper widgets (toast, modal). No business logic here.
 */
const UI = (() => {
  function icon(name, extra = '') {
    return `<i class="fas ${name} ${extra}"></i>`;
  }

  function badge(text, cls) {
    return `<span class="badge ${cls}">${Utils.escapeHtml(text)}</span>`;
  }

  function sevBadge(sev) {
    return badge(sev, Utils.severityColor(sev));
  }

  function statusBadge(st) {
    return badge(st.replace(/_/g, ' '), Utils.statusColor(st));
  }

  function metricCard({ icon: ic, label, value, trend, trendDir, colorClass }) {
    return `
      <div class="card metric-card">
        <div class="metric-top">
          <div class="metric-icon" style="${colorClass ? `color:${colorClass}` : ''}">${icon(ic)}</div>
          ${trend ? `<span class="metric-trend trend-${trendDir}">${icon(trendDir === 'up' ? 'fa-arrow-up' : trendDir === 'down' ? 'fa-arrow-down' : 'fa-minus')} ${trend}</span>` : ''}
        </div>
        <div class="metric-value">${value}</div>
        <div class="metric-label">${label}</div>
      </div>`;
  }

  function emptyState(msg, ic = 'fa-inbox') {
    return `<div class="empty-state">${icon(ic)}<div>${Utils.escapeHtml(msg)}</div></div>`;
  }

  function loadingState(msg = 'Loading…') {
    return `<div class="loading-state"><div class="spinner"></div><div>${Utils.escapeHtml(msg)}</div></div>`;
  }

  function errorState(msg) {
    return `<div class="error-state">${icon('fa-triangle-exclamation')}<div>${Utils.escapeHtml(msg)}</div></div>`;
  }

  function progressBar(label, value, max = 100, color) {
    const pct = Utils.clamp((value / max) * 100, 0, 100);
    return `
      <div class="progress-row">
        <div class="progress-label"><span>${Utils.escapeHtml(label)}</span><span>${Utils.round(value, 1)}${max === 100 ? '%' : ''}</span></div>
        <div class="progress-bar-bg"><div class="progress-bar-fill" style="width:${pct}%;${color ? `background:${color}` : ''}"></div></div>
      </div>`;
  }

  function kv(label, value) {
    return `<div class="kv-row"><span class="kv-label">${Utils.escapeHtml(label)}</span><span class="kv-value">${value}</span></div>`;
  }

  // -------------------- Toast --------------------
  function toast(msg, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = msg;
    container.appendChild(el);
    setTimeout(() => el.remove(), 4500);
  }

  // -------------------- Modal --------------------
  function openModal(innerHtml, { className = '' } = {}) {
    closeModal();
    const overlay = document.createElement('div');
    overlay.className = `modal-overlay ${className}`;
    overlay.id = 'active-modal';
    overlay.innerHTML = innerHtml;
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
    document.body.appendChild(overlay);
    return overlay;
  }

  function closeModal() {
    const el = document.getElementById('active-modal');
    if (el) el.remove();
  }

  return {
    icon, badge, sevBadge, statusBadge, metricCard, emptyState, loadingState,
    errorState, progressBar, kv, toast, openModal, closeModal,
  };
})();
