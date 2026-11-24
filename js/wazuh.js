/**
 * Adaptive SOC - Wazuh Local Log Ingestion Service (ADDITIVE, no REST API)
 *
 * Responsibilities (per spec):
 *   1. Read Wazuh local alert/log data (JSON alert records).
 *   2. Parse records, tolerating malformed/partial input.
 *   3. Normalize Wazuh alerts into the existing internal SecurityEvent shape
 *      used by js/simulator.js, so they enter the SAME Correlation Engine.
 *   4. Deduplicate so the same alert never creates two events/incidents.
 *   5. Attach source metadata (agent id, hostname, rule id, severity).
 *   6. Track known Wazuh sources (lab-authorized IPs) for the dashboard.
 *   7. Provide a local, file/config-based health/status check.
 *
 * HOW THIS WORKS WITHOUT A WAZUH REST API OR API KEY
 * ---------------------------------------------------
 * A static site cannot open an arbitrary OS filesystem path
 * (WAZUH_ALERT_LOG_PATH, e.g. /var/ossec/logs/alerts/alerts.json) directly —
 * browsers are sandboxed from the local filesystem for security reasons.
 * Instead this module supports exactly two LOCAL, API-key-free data paths:
 *
 *   DEMO mode -> fetch() the bundled same-origin sample file at
 *                CONFIG.WAZUH_DEMO_PATH (data/wazuh_demo/alerts.json).
 *                Clearly labeled WAZUH DEMO DATA everywhere in the UI.
 *   FILE mode -> the operator uses a native <input type="file"> picker to
 *                select their real local alerts.json (e.g. copied off the
 *                authorized lab Wazuh manager). The browser reads the file
 *                bytes directly with FileReader — no network request, no
 *                Wazuh REST API, no API key, ever.
 *
 * Both paths funnel into the exact same parse -> normalize -> dedupe ->
 * Pipeline.runFromEvents() flow, so Wazuh is a telemetry source only, never
 * a second/independent detection pipeline.
 */
const Wazuh = (() => {
  const seenDedupeKeys = new Set();
  let lastIngestion = null; // { mode, sourceLabel, alertsRead, alertsNew, alertsDuplicate, alertsMalformed, status, at }
  let lastNormalizedEvents = [];

  // -------------------- Deterministic deduplication --------------------
  // hash(timestamp + agent_id + rule_id + source_ip + description)
  async function dedupeKey(alert, sourceIp, ruleId, agentId, description) {
    const basis = `${alert.timestamp || ''}::${agentId || ''}::${ruleId || ''}::${sourceIp || ''}::${description || ''}`;
    const enc = new TextEncoder().encode(basis);
    const digest = await crypto.subtle.digest('SHA-256', enc);
    return Array.from(new Uint8Array(digest)).slice(0, 12).map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  // -------------------- Parsing --------------------
  /** Accepts a JSON string (whole array, or newline-delimited JSON objects — the two common Wazuh alerts.json shapes). Never throws; returns { records, malformed }. */
  function parseAlertText(text) {
    const trimmed = (text || '').trim();
    if (!trimmed) return { records: [], malformed: 0 };
    // Try whole-document JSON array first.
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return { records: parsed, malformed: 0 };
      if (parsed && typeof parsed === 'object') return { records: [parsed], malformed: 0 };
    } catch (_) { /* fall through to line-delimited parsing */ }

    // Fall back to newline-delimited JSON (one alert object per line) — the
    // real-world alerts.json format Wazuh appends to continuously.
    const lines = trimmed.split('\n').map((l) => l.trim()).filter(Boolean);
    const records = [];
    let malformed = 0;
    for (const line of lines) {
      try {
        records.push(JSON.parse(line));
      } catch (_) {
        malformed += 1;
      }
    }
    return { records, malformed };
  }

  // -------------------- Normalization --------------------
  function safeGet(obj, path, fallback = null) {
    try {
      return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj) ?? fallback;
    } catch (_) {
      return fallback;
    }
  }

  /**
   * Converts ONE raw Wazuh alert object into the existing internal
   * SecurityEvent shape (same fields js/simulator.js produces), so it can
   * be handed straight to Engine.correlate/Engine.fingerprint unmodified.
   * Returns null if the alert is too malformed to use (missing timestamp).
   */
  async function normalizeAlert(alert, sourceMode) {
    if (!alert || typeof alert !== 'object') return null;
    const timestamp = alert.timestamp || alert['@timestamp'] || null;
    if (!timestamp) return null;

    const ruleId = String(safeGet(alert, 'rule.id', '') || '');
    const level = Number(safeGet(alert, 'rule.level', 0)) || 0;
    const description = String(safeGet(alert, 'rule.description', 'Wazuh alert') || 'Wazuh alert');
    const agentId = String(safeGet(alert, 'agent.id', '') || '');
    const hostname = String(safeGet(alert, 'agent.name', '') || safeGet(alert, 'manager.name', '') || 'UNKNOWN-HOST');
    const sourceIp = String(
      safeGet(alert, 'data.win.eventdata.ipAddress', '')
      || safeGet(alert, 'data.srcip', '')
      || safeGet(alert, 'srcip', '')
      || '0.0.0.0',
    );
    const username = String(
      safeGet(alert, 'data.win.eventdata.targetUserName', '')
      || safeGet(alert, 'data.dstuser', '')
      || safeGet(alert, 'data.user', '')
      || CONFIG.LAB_TARGET_ACCOUNT,
    );
    const eventCode = String(safeGet(alert, 'data.win.system.eventID', '') || safeGet(alert, 'rule.id', '') || '');
    const logonType = String(safeGet(alert, 'data.win.eventdata.logonType', '') || '3');

    // Classify authentication result deterministically from the well-known
    // Windows event IDs / rule id ranges Wazuh uses for logon failures.
    const FAILURE_EVENT_CODES = new Set(['4625']);
    const isFailure = FAILURE_EVENT_CODES.has(eventCode) || /fail|invalid|denied/i.test(description) || level >= 7;
    const authResult = isFailure ? 'FAILURE' : 'SUCCESS';

    const source = sourceMode === 'FILE' ? 'WAZUH_FILE' : 'WAZUH_DEMO';
    const dedupe_key = await dedupeKey(alert, sourceIp, ruleId, agentId, description);

    return {
      timestamp: new Date(timestamp).toISOString(),
      event_type: authResult === 'SUCCESS' ? 'AUTH_SUCCESS' : 'AUTH_FAILURE',
      source_ip: sourceIp,
      target_ip: safeGet(alert, 'data.dstip', '10.10.10.5') || '10.10.10.5',
      username,
      authentication_result: authResult,
      event_code: eventCode || 'WAZUH',
      logon_type: logonType,
      hostname,
      source,
      rule_id: ruleId,
      wazuh_severity: level,
      agent_id: agentId,
      dedupe_key,
      // Safe-reference only — never store secrets/credentials from Wazuh data.
      raw_data: JSON.stringify({ wazuh: true, rule_id: ruleId, description, note: 'Normalized from local Wazuh alert/log data. No Wazuh REST API or API key used.' }),
    };
  }

  /** Normalizes a batch of raw alerts, applying in-memory + persisted deduplication. */
  async function normalizeAndDedupe(rawAlerts, sourceMode, existingDedupeKeys = new Set()) {
    const events = [];
    let duplicate = 0;
    let malformed = 0;
    for (const alert of rawAlerts) {
      const ev = await normalizeAlert(alert, sourceMode);
      if (!ev) { malformed += 1; continue; }
      if (seenDedupeKeys.has(ev.dedupe_key) || existingDedupeKeys.has(ev.dedupe_key)) {
        duplicate += 1;
        continue;
      }
      seenDedupeKeys.add(ev.dedupe_key);
      events.push(ev);
    }
    return { events, duplicate, malformed };
  }

  // -------------------- Ingestion entry points --------------------
  /** DEMO mode: fetch the bundled same-origin sample alert file. Never a live Wazuh feed — always labeled WAZUH DEMO DATA. */
  async function ingestDemo() {
    let text = null;
    let status = 'OK';
    try {
      const res = await fetch(CONFIG.WAZUH_DEMO_PATH, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      text = await res.text();
    } catch (e) {
      status = 'FILE_NOT_FOUND';
      lastIngestion = { mode: 'DEMO', sourceLabel: CONFIG.WAZUH_DEMO_PATH, alertsRead: 0, alertsNew: 0, alertsDuplicate: 0, alertsMalformed: 0, status, at: Utils.nowIso() };
      await Tables.create('wazuh_ingestion_log', { mode: 'DEMO', source_label: CONFIG.WAZUH_DEMO_PATH, alerts_read: 0, alerts_new: 0, alerts_duplicate: 0, alerts_malformed: 0, status, created_at: Utils.nowIso() }).catch(() => {});
      return { events: [], status };
    }

    const { records, malformed: parseMalformed } = parseAlertText(text);
    if (records.length === 0) {
      status = parseMalformed > 0 ? 'MALFORMED_JSON' : 'EMPTY';
    }
    const existingKeys = await loadExistingDedupeKeys();
    const { events, duplicate, malformed } = await normalizeAndDedupe(records, 'DEMO', existingKeys);
    lastNormalizedEvents = events;
    lastIngestion = {
      mode: 'DEMO', sourceLabel: CONFIG.WAZUH_DEMO_PATH, alertsRead: records.length,
      alertsNew: events.length, alertsDuplicate: duplicate, alertsMalformed: malformed + parseMalformed, status, at: Utils.nowIso(),
    };
    await Tables.create('wazuh_ingestion_log', {
      mode: 'DEMO', source_label: CONFIG.WAZUH_DEMO_PATH, alerts_read: records.length,
      alerts_new: events.length, alerts_duplicate: duplicate, alerts_malformed: malformed + parseMalformed, status, created_at: Utils.nowIso(),
    }).catch(() => {});
    await updateSourcesFromEvents(events);
    return { events, status, raw: records };
  }

  /**
   * FILE mode: the operator supplies a browser File object (selected via a
   * native <input type="file"> picker pointed at their real local
   * WAZUH_ALERT_LOG_PATH copy, e.g. alerts.json). Read directly with
   * FileReader — no network call, no REST API, no API key.
   */
  function readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  async function ingestFile(file) {
    if (!file) return { events: [], status: 'FILE_NOT_FOUND' };
    let text = '';
    try {
      text = await readFileAsText(file);
    } catch (e) {
      const status = 'FILE_NOT_FOUND';
      lastIngestion = { mode: 'FILE', sourceLabel: file.name, alertsRead: 0, alertsNew: 0, alertsDuplicate: 0, alertsMalformed: 0, status, at: Utils.nowIso() };
      await Tables.create('wazuh_ingestion_log', { mode: 'FILE', source_label: file.name, alerts_read: 0, alerts_new: 0, alerts_duplicate: 0, alerts_malformed: 0, status, created_at: Utils.nowIso() }).catch(() => {});
      return { events: [], status };
    }

    const { records, malformed: parseMalformed } = parseAlertText(text);
    let status = 'OK';
    if (records.length === 0) status = parseMalformed > 0 ? 'MALFORMED_JSON' : 'EMPTY';

    const existingKeys = await loadExistingDedupeKeys();
    const { events, duplicate, malformed } = await normalizeAndDedupe(records, 'FILE', existingKeys);
    lastNormalizedEvents = events;
    lastIngestion = {
      mode: 'FILE', sourceLabel: file.name, alertsRead: records.length,
      alertsNew: events.length, alertsDuplicate: duplicate, alertsMalformed: malformed + parseMalformed, status, at: Utils.nowIso(),
    };
    await Tables.create('wazuh_ingestion_log', {
      mode: 'FILE', source_label: file.name, alerts_read: records.length,
      alerts_new: events.length, alerts_duplicate: duplicate, alerts_malformed: malformed + parseMalformed, status, created_at: Utils.nowIso(),
    }).catch(() => {});
    await updateSourcesFromEvents(events);
    return { events, status, raw: records };
  }

  // -------------------- Dedup persistence bootstrap --------------------
  // On first use in a session, seed the in-memory dedupe set from
  // already-persisted Wazuh-sourced security_events so a page refresh does
  // not re-create incidents for alerts already ingested earlier.
  let dedupeBootstrapped = false;
  async function loadExistingDedupeKeys() {
    if (dedupeBootstrapped) return seenDedupeKeys;
    try {
      const existing = await Tables.list('security_events', { limit: 500 });
      existing.forEach((e) => { if (e.dedupe_key) seenDedupeKeys.add(e.dedupe_key); });
    } catch (_) { /* ignore — safe default: no pre-existing keys known */ }
    dedupeBootstrapped = true;
    return seenDedupeKeys;
  }

  // -------------------- Source registry (lab IPs, identifiers only) --------------------
  async function ensureSourcesSeeded() {
    const existing = await Tables.list('wazuh_sources');
    if (existing.length > 0) return existing;
    const created = [];
    for (const src of CONFIG.WAZUH_SOURCES) {
      const row = await Tables.create('wazuh_sources', {
        name: src.name, ip: src.ip, agent_id: src.agent_id, hostname: src.hostname,
        enabled: src.enabled, alert_count: 0, last_alert_at: null, status: 'UNKNOWN',
      });
      created.push(row);
    }
    return created;
  }

  async function updateSourcesFromEvents(events) {
    if (!events || events.length === 0) return;
    const sources = await ensureSourcesSeeded();
    const byIp = new Map(sources.map((s) => [s.ip, s]));
    const now = Utils.nowIso();
    const counts = new Map();
    events.forEach((e) => counts.set(e.source_ip, (counts.get(e.source_ip) || 0) + 1));
    for (const [ip, count] of counts.entries()) {
      const src = byIp.get(ip);
      if (!src) continue; // only track configured/authorized lab sources, never arbitrary IPs
      await Tables.update('wazuh_sources', src.id, {
        alert_count: (src.alert_count || 0) + count,
        last_alert_at: now,
        status: 'ACTIVE',
      }).catch(() => {});
    }
  }

  // -------------------- Local health/status check (no Wazuh REST API) --------------------
  async function status() {
    const sources = await Tables.list('wazuh_sources').catch(() => []);
    const seeded = sources.length > 0 ? sources : await ensureSourcesSeeded();
    const ingestionLog = await Tables.list('wazuh_ingestion_log', { limit: 50 }).catch(() => []);
    const totalAlertsRead = ingestionLog.reduce((sum, l) => sum + (l.alerts_read || 0), 0);
    const lastLog = ingestionLog.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0] || null;

    let integrationStatus = 'NOT AVAILABLE';
    if (CONFIG.WAZUH_ENABLED) {
      if (lastLog && lastLog.status === 'OK') integrationStatus = 'ACTIVE';
      else if (lastLog) integrationStatus = 'OFFLINE';
      else integrationStatus = 'READY (not yet ingested)';
    }

    return {
      enabled: CONFIG.WAZUH_ENABLED,
      mode: CONFIG.WAZUH_MODE,
      integration_status: integrationStatus,
      api_key_used: false,
      alert_log_path: CONFIG.WAZUH_ALERT_LOG_PATH,
      demo_path: CONFIG.WAZUH_DEMO_PATH,
      poll_interval: CONFIG.WAZUH_POLL_INTERVAL,
      sources: seeded,
      total_alerts_read: totalAlertsRead,
      last_ingestion: lastLog,
      agents: seeded.length,
    };
  }

  function getLastIngestion() { return lastIngestion; }
  function getLastNormalizedEvents() { return lastNormalizedEvents; }

  return {
    parseAlertText, normalizeAlert, normalizeAndDedupe, dedupeKey,
    ingestDemo, ingestFile, status, ensureSourcesSeeded,
    getLastIngestion, getLastNormalizedEvents,
  };
})();
