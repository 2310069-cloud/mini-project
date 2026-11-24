/**
 * Adaptive SOC - Local AI Engine
 *
 * AIEngine tries OllamaProvider (localhost only) first; if unreachable,
 * times out, or returns invalid output, it automatically falls back to
 * DeterministicFallbackProvider. NEVER calls any cloud AI API.
 *
 * The AI NEVER receives: plaintext passwords, password hashes, tokens,
 * or PowerShell commands. It NEVER executes anything. It only returns a
 * structured, Pydantic-style-validated recommendation that the
 * deterministic Response Policy (js/engine.js) may or may not follow.
 */
const AI = (() => {
  const VALID_SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  const VALID_ACTIONS = ['MONITOR', 'ALERT', 'CONTAIN', 'CONTAIN_AND_ESCALATE'];

  function buildEvidence({ fp, cluster, risk, targetAccount }) {
    // Structured, sanitized evidence only — no secrets, no raw PII beyond lab-safe fields.
    return {
      fingerprint: fp.attack_type,
      failed_attempts: cluster.failed_attempt_count,
      unique_source_ips: cluster.unique_source_ip_count,
      target_account: targetAccount,
      behavior_score: fp.behavior_score,
      risk_score: risk.risk_score,
      attempt_rate_per_min: cluster.attempt_rate,
      ip_rotation_rate: cluster.ip_rotation_rate,
      persistence_score: cluster.persistence_score,
    };
  }

  function deterministicAnalysis(evidence) {
    const severity = CONFIG.SEVERITY_THRESHOLDS.find((t) => evidence.risk_score <= t.max).level;
    const actionMap = { LOW: 'MONITOR', MEDIUM: 'ALERT', HIGH: 'CONTAIN', CRITICAL: 'CONTAIN_AND_ESCALATE' };
    const reasoning = [
      `${evidence.failed_attempts} failed authentication attempts observed against account "${evidence.target_account}"`,
      `${evidence.unique_source_ips} unique source IP(s) involved (rotation rate ${(evidence.ip_rotation_rate * 100).toFixed(0)}%)`,
      `Behavior score ${evidence.behavior_score}/100 and deterministic risk score ${evidence.risk_score}/100`,
      `Fingerprint classification: ${evidence.fingerprint}`,
    ];
    if (evidence.persistence_score > 60) reasoning.push('Sustained attack activity indicates persistence, increasing confidence.');
    return {
      threat_type: evidence.fingerprint,
      risk_score: evidence.risk_score,
      confidence: Utils.clamp(0.6 + evidence.risk_score / 250, 0, 0.95),
      severity,
      reasoning,
      recommended_action: actionMap[severity],
      provider: 'DETERMINISTIC_FALLBACK',
    };
  }

  function validateAiOutput(obj) {
    if (!obj || typeof obj !== 'object') return null;
    const { threat_type, risk_score, confidence, severity, reasoning, recommended_action } = obj;
    if (typeof threat_type !== 'string') return null;
    if (typeof risk_score !== 'number' || risk_score < 0 || risk_score > 100) return null;
    if (typeof confidence !== 'number' || confidence < 0 || confidence > 1) return null;
    if (!VALID_SEVERITIES.includes(severity)) return null;
    if (!Array.isArray(reasoning)) return null;
    if (!VALID_ACTIONS.includes(recommended_action)) return null;
    return { threat_type, risk_score, confidence, severity, reasoning: reasoning.slice(0, 10).map(String), recommended_action };
  }

  async function callOllama(evidence) {
    // Local-only, opt-in. If disabled, never attempt any network call.
    if (!CONFIG.OLLAMA_ENABLED) return null;
    const prompt = `You are a SOC threat analyst. Analyze this structured authentication-attack evidence and respond with ONLY a JSON object with keys: threat_type (string), risk_score (0-100 number, echo the given value), confidence (0-1 number), severity (one of LOW, MEDIUM, HIGH, CRITICAL), reasoning (array of short strings), recommended_action (one of MONITOR, ALERT, CONTAIN, CONTAIN_AND_ESCALATE). Evidence: ${JSON.stringify(evidence)}. Respond with raw JSON only, no prose, no markdown fences.`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), CONFIG.OLLAMA_TIMEOUT_MS);
    try {
      const res = await fetch(CONFIG.OLLAMA_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: CONFIG.OLLAMA_MODEL, prompt, stream: false }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!res.ok) return null;
      const data = await res.json();
      const text = data && data.response ? data.response : '';
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) return null;
      const parsed = JSON.parse(match[0]);
      const valid = validateAiOutput(parsed);
      if (!valid) return null;
      return { ...valid, provider: 'OLLAMA' };
    } catch (e) {
      clearTimeout(timer);
      return null; // any failure -> caller falls back
    }
  }

  /** Main entry point used by the pipeline. Always returns a valid structured analysis. */
  async function analyze({ fp, cluster, risk, targetAccount }) {
    const evidence = buildEvidence({ fp, cluster, risk, targetAccount });
    let result = null;
    try {
      result = await callOllama(evidence);
    } catch (_) {
      result = null;
    }
    if (!result) {
      result = deterministicAnalysis(evidence);
    }
    return { evidence, analysis: result };
  }

  return { analyze, deterministicAnalysis, validateAiOutput, buildEvidence };
})();
