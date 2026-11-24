/**
 * Adaptive SOC - local configuration
 * NO external API keys. NO cloud services. Everything here is either
 * a local constant or an optional localhost Ollama endpoint that the
 * user runs themselves. If Ollama is unreachable the app automatically
 * falls back to the deterministic local engine — the app never
 * switches to any cloud AI provider.
 */
const CONFIG = {
  APP_NAME: 'ADAPTIVE SOC',
  APP_SUBTITLE: 'AI-Driven Security Operations Center',
  ENVIRONMENT: 'ISOLATED LAB',

  // AI
  // Ollama is OPT-IN and OFF by default. When false, the app goes straight
  // to the DeterministicFallbackProvider (the app is fully functional this
  // way, per spec). Flip this to true (or toggle it in Settings) ONLY if
  // you are running Ollama locally at OLLAMA_URL — attempting to reach a
  // localhost port that nothing is listening on can behave unpredictably
  // in some locked-down/sandboxed browser environments, so we never probe
  // it automatically.
  OLLAMA_ENABLED: false,
  OLLAMA_URL: 'http://localhost:11434/api/generate',
  OLLAMA_TAGS_URL: 'http://localhost:11434/api/tags',
  OLLAMA_MODEL: 'llama3',
  OLLAMA_TIMEOUT_MS: 1800,

  // Wazuh integration mode: DEMO (bundled sample alert file, same-origin
  // fetch) | FILE (operator picks a real local Wazuh alerts.json from disk
  // via a native browser file picker — read directly in the browser, zero
  // network calls, zero API keys). This mirrors the intent of the
  // environment-variable-driven config a real backend would use, adapted
  // to what a static site can actually do (see docs/LIMITATIONS.md).
  WAZUH_MODE: 'DEMO',
  WAZUH_ENABLED: true,
  // Equivalent of WAZUH_ALERT_LOG_PATH env var — shown in the UI as the
  // configured path. A static site cannot read an arbitrary OS filesystem
  // path at runtime, so FILE mode asks the operator to select this exact
  // file with a local file picker instead of polling it automatically.
  WAZUH_ALERT_LOG_PATH: '/var/ossec/logs/alerts/alerts.json',
  WAZUH_POLL_INTERVAL: 2,
  WAZUH_DEMO_MODE: true,
  // Bundled same-origin demo alert file (WAZUH DEMO DATA, never presented as live telemetry).
  WAZUH_DEMO_PATH: 'data/wazuh_demo/alerts.json',
  // Authorized lab/demo Wazuh telemetry sources — identifiers only, never
  // auto-attacked/scanned/blocked/modified.
  WAZUH_SOURCES: [
    { name: 'Wazuh Lab Agent 01', ip: '203.0.113.14', agent_id: '003', hostname: 'WIN-LABHOST-01', enabled: true },
    { name: 'Wazuh Lab Agent 02', ip: '198.51.100.42', agent_id: '007', hostname: 'WIN-LABHOST-02', enabled: true },
  ],

  // Response execution — this build ships ONLY safety-validated DRY_RUN
  // execution. Real PowerShell / firewall / AD execution requires a local
  // backend + authorized isolated Windows VM, which a static site cannot
  // reach; the allowlisted .ps1 scripts are provided under
  // windows-response/ for an operator to run in that lab manually.
  DRY_RUN: true,

  // Correlation window (seconds), configurable
  CORRELATION_WINDOW_SECONDS: 60,

  // Credential security policy
  PASSWORD_RESET_REQUIRED: true,
  LAB_TARGET_ACCOUNT: 'admin',

  // Risk weights (must sum to 1.0)
  RISK_WEIGHTS: {
    attemptFrequency: 0.25,
    sourceIpRotation: 0.20,
    targetSensitivity: 0.20,
    persistence: 0.15,
    fingerprintConfidence: 0.20,
  },

  SEVERITY_THRESHOLDS: [
    { max: 29, level: 'LOW' },
    { max: 59, level: 'MEDIUM' },
    { max: 79, level: 'HIGH' },
    { max: 100, level: 'CRITICAL' },
  ],
};
