/**
 * Adaptive SOC - Deterministic Engine
 * correlation_engine / fingerprint_engine / risk_engine / response_policy /
 * response_engine / credential policy / verification_engine / report generator
 *
 * Every calculation here is deterministic and explainable. The AI layer
 * (js/ai.js) only ever ANALYZES the output of this engine — it never
 * produces facts and never executes anything.
 */
const Engine = (() => {
  const W = () => CONFIG.RISK_WEIGHTS;

  // ---------------------------------------------------------------------
  // 1) CORRELATION ENGINE
  // ---------------------------------------------------------------------
  function correlate(events, windowSeconds = CONFIG.CORRELATION_WINDOW_SECONDS) {
    const failures = events.filter((e) => e.authentication_result === 'FAILURE');
    const sorted = [...failures].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const uniqueIps = new Set(sorted.map((e) => e.source_ip));

    let durationSec = 0;
    let avgInterval = 0;
    if (sorted.length > 1) {
      const first = new Date(sorted[0].timestamp).getTime();
      const last = new Date(sorted[sorted.length - 1].timestamp).getTime();
      durationSec = Math.max(1, (last - first) / 1000);
      avgInterval = durationSec / (sorted.length - 1);
    }

    const attemptRate = durationSec > 0 ? (sorted.length / durationSec) * 60 : sorted.length * 60; // per minute
    const ipRotationRate = sorted.length > 0 ? Utils.round(uniqueIps.size / sorted.length, 3) : 0;
    // persistence: how much of the window has continuous failure activity
    const persistenceScore = Utils.clamp(Utils.round((durationSec / windowSeconds) * 100, 1), 0, 100);

    // ---- Source-mix evidence (ADDITIVE) ----
    // Every event already carries a `source` tag (SIMULATOR | WAZUH_DEMO | WAZUH_FILE).
    // Pure-synthetic scenarios (the original simulator path) always yield
    // event_source_mix = 'SYNTHETIC', so existing behavior is unchanged.
    const isWazuhSource = (s) => s === 'WAZUH_DEMO' || s === 'WAZUH_FILE';
    const syntheticCount = sorted.filter((e) => !isWazuhSource(e.source)).length;
    const wazuhCount = sorted.filter((e) => isWazuhSource(e.source)).length;
    let eventSourceMix = 'SYNTHETIC';
    if (syntheticCount > 0 && wazuhCount > 0) eventSourceMix = 'MIXED';
    else if (wazuhCount > 0 && syntheticCount === 0) eventSourceMix = 'WAZUH';

    return {
      window_seconds: windowSeconds,
      failed_attempt_count: sorted.length,
      unique_source_ip_count: uniqueIps.size,
      attempt_rate: Utils.round(attemptRate, 1),
      average_interval: Utils.round(avgInterval, 2),
      attack_duration: Utils.round(durationSec, 1),
      ip_rotation_rate: ipRotationRate,
      persistence_score: persistenceScore,
      event_source_mix: eventSourceMix,
      synthetic_event_count: syntheticCount,
      wazuh_event_count: wazuhCount,
    };
  }

  // ---------------------------------------------------------------------
  // 2) ATTACK FINGERPRINTING (deterministic explainable rules)
  // ---------------------------------------------------------------------
  function fingerprint(cluster, targetAccount) {
    const evidence = [];
    let attackType = 'NORMAL_AUTH';
    let confidence = 0.55;
    let behaviorScore = 5;

    const { failed_attempt_count: fc, unique_source_ip_count: ipc, attempt_rate: rate, ip_rotation_rate: rot, persistence_score: persist } = cluster;
    const wazuhCount = cluster.wazuh_event_count || 0;
    const sourceMix = cluster.event_source_mix || 'SYNTHETIC';

    if (fc === 0) {
      attackType = 'NORMAL_AUTH';
      confidence = 0.98;
      behaviorScore = 2;
      evidence.push('No failed authentication attempts observed');
    } else if (fc <= 5 && ipc <= 1 && rate < 10) {
      attackType = 'LOW_FREQUENCY_FAILURE';
      confidence = 0.85;
      behaviorScore = 20;
      evidence.push(`${fc} failed attempts from a single source IP`, 'Low attempt frequency, consistent with user error');
    } else if (ipc >= 8 && rot >= 0.5) {
      attackType = 'ROTATING_SOURCE_AUTH_ATTACK';
      confidence = Utils.clamp(0.75 + rot * 0.2 + Math.min(fc, 40) / 200, 0, 0.97);
      behaviorScore = Utils.clamp(60 + Math.min(fc, 40) + ipc, 0, 100);
      evidence.push(
        `${fc} failed authentication attempts`,
        `${ipc} unique source IPs targeting the same account`,
        `IP rotation rate ${(rot * 100).toFixed(0)}%`,
        `Same target account: ${targetAccount}`,
        `High attempt frequency: ${rate.toFixed(1)} attempts/min`,
      );
    } else if (ipc >= 4 && ipc < 8 && rot >= 0.3) {
      attackType = 'DISTRIBUTED_AUTH_ATTACK';
      confidence = 0.8;
      behaviorScore = Utils.clamp(50 + fc, 0, 100);
      evidence.push(`${fc} failed attempts distributed across ${ipc} source IPs`, `Attempt rate ${rate.toFixed(1)}/min`);
    } else if (ipc === 1 && fc >= 10) {
      attackType = 'BRUTE_FORCE';
      confidence = Utils.clamp(0.7 + Math.min(fc, 40) / 100, 0, 0.96);
      behaviorScore = Utils.clamp(45 + Math.min(fc, 50), 0, 100);
      evidence.push(`${fc} failed attempts from a single source IP`, `Same target account: ${targetAccount}`, `Attempt rate ${rate.toFixed(1)}/min`);
    } else if (ipc >= 2 && ipc <= 5 && fc >= 8) {
      attackType = 'PASSWORD_SPRAY';
      confidence = 0.78;
      behaviorScore = Utils.clamp(40 + fc, 0, 100);
      evidence.push(`${fc} failed attempts across ${ipc} source IPs`, 'Pattern consistent with password spraying');
    } else if (wazuhCount > 0 && ipc <= 3 && fc < 8) {
      // Wazuh reported authentication-failure alerts but volume/rotation is
      // too low to confidently call it any specific attack shape yet —
      // surfaced honestly as its own explainable classification rather than
      // forced into NORMAL_AUTH or LOW_FREQUENCY_FAILURE.
      attackType = 'WAZUH_AUTHENTICATION_ALERT';
      confidence = 0.65;
      behaviorScore = Utils.clamp(25 + fc, 0, 100);
      evidence.push(`${wazuhCount} Wazuh authentication-failure alert(s) received`, `${fc} total failed attempts, ${ipc} unique source IP(s) — below high-confidence attack thresholds`);
    } else {
      attackType = 'LOW_FREQUENCY_FAILURE';
      confidence = 0.6;
      behaviorScore = 15;
      evidence.push(`${fc} failed attempts observed, below high-confidence attack thresholds`);
    }

    if (persist > 60) evidence.push(`Sustained activity across ${persist.toFixed(0)}% of the analysis window (persistence)`);
    if (wazuhCount > 0 && attackType !== 'WAZUH_AUTHENTICATION_ALERT') {
      evidence.push(`${wazuhCount} Wazuh authentication-failure alert(s) correlated into this cluster (event source: ${sourceMix})`);
    }

    return {
      attack_type: attackType,
      confidence: Utils.round(confidence, 2),
      behavior_score: Utils.round(behaviorScore, 1),
      evidence,
      event_source_mix: sourceMix,
    };
  }

  // ---------------------------------------------------------------------
  // 3) RISK ENGINE
  // ---------------------------------------------------------------------
  const SENSITIVE_ACCOUNTS = ['admin', 'administrator', 'root', 'domainadmin'];

  function riskScore({ cluster, fp, targetAccount }) {
    const w = W();
    // Attempt frequency: scale 0-60 attempts/min -> 0-100
    const freqScore = Utils.clamp((cluster.attempt_rate / 60) * 100, 0, 100);
    // Source IP rotation: rotation rate 0-1 -> 0-100, weighted also by count
    const rotationScore = Utils.clamp(cluster.ip_rotation_rate * 100 * Utils.clamp(cluster.unique_source_ip_count / 10, 0.3, 1), 0, 100);
    // Target sensitivity
    const sensitivityScore = SENSITIVE_ACCOUNTS.includes((targetAccount || '').toLowerCase()) ? 100 : 40;
    // Persistence
    const persistenceScore = cluster.persistence_score;
    // Fingerprint confidence
    const confidenceScore = fp.confidence * 100;

    const weighted =
      freqScore * w.attemptFrequency +
      rotationScore * w.sourceIpRotation +
      sensitivityScore * w.targetSensitivity +
      persistenceScore * w.persistence +
      confidenceScore * w.fingerprintConfidence;

    const score = Utils.round(Utils.clamp(weighted, 0, 100), 1);
    const severity = CONFIG.SEVERITY_THRESHOLDS.find((t) => score <= t.max).level;

    const explanation =
      `Risk score ${score}/100 computed from: ` +
      `Attempt Frequency ${freqScore.toFixed(0)} × ${(w.attemptFrequency * 100).toFixed(0)}% + ` +
      `Source IP Rotation ${rotationScore.toFixed(0)} × ${(w.sourceIpRotation * 100).toFixed(0)}% + ` +
      `Target Sensitivity ${sensitivityScore.toFixed(0)} × ${(w.targetSensitivity * 100).toFixed(0)}% + ` +
      `Persistence ${persistenceScore.toFixed(0)} × ${(w.persistence * 100).toFixed(0)}% + ` +
      `Fingerprint Confidence ${confidenceScore.toFixed(0)} × ${(w.fingerprintConfidence * 100).toFixed(0)}%.`;

    return {
      risk_score: score,
      severity,
      attempt_frequency_score: Utils.round(freqScore, 1),
      source_ip_rotation_score: Utils.round(rotationScore, 1),
      target_sensitivity_score: Utils.round(sensitivityScore, 1),
      persistence_score: Utils.round(persistenceScore, 1),
      fingerprint_confidence_score: Utils.round(confidenceScore, 1),
      explanation,
      // Evidence provenance only — Wazuh never influences the score itself,
      // it only tells the UI where the underlying events came from.
      evidence_source_mix: cluster.event_source_mix || 'SYNTHETIC',
      synthetic_event_count: cluster.synthetic_event_count || 0,
      wazuh_event_count: cluster.wazuh_event_count || 0,
    };
  }

  // ---------------------------------------------------------------------
  // 4) RESPONSE POLICY (deterministic - final authority, never the AI)
  // ---------------------------------------------------------------------
  const ALLOWED_ACTIONS = ['MONITOR', 'ALERT', 'CONTAIN', 'CONTAIN_AND_ESCALATE'];

  function decidePolicy(severity) {
    const map = { LOW: 'MONITOR', MEDIUM: 'ALERT', HIGH: 'CONTAIN', CRITICAL: 'CONTAIN_AND_ESCALATE' };
    return map[severity] || 'MONITOR';
  }

  /** Safety validation: AI output can only ever narrow/confirm, never invent a new action. */
  function safetyValidateAction(aiRecommendedAction, policyAction) {
    if (!ALLOWED_ACTIONS.includes(policyAction)) {
      return { approved: 'MONITOR', reason: 'Unrecognized policy action rejected by safety validator; defaulted to MONITOR.' };
    }
    // The deterministic policy is the final authority. AI recommendation is advisory only.
    return { approved: policyAction, reason: `Deterministic policy for this severity mandates ${policyAction}. AI recommendation (${aiRecommendedAction}) was advisory only and did not alter the final action.` };
  }

  function executeResponse(approvedAction, dryRun = CONFIG.DRY_RUN) {
    // Simulated allowlisted-script execution — see windows-response/*.ps1 for
    // the real scripts an operator would run against the authorized lab VM.
    const containmentActions = ['CONTAIN', 'CONTAIN_AND_ESCALATE'];
    if (!containmentActions.includes(approvedAction)) {
      return { action: approvedAction, mode: dryRun ? 'DRY_RUN' : 'LIVE', status: 'SIMULATED', script: null };
    }
    return {
      action: 'CONTAIN',
      mode: dryRun ? 'DRY_RUN' : 'LIVE',
      status: dryRun ? 'SIMULATED' : 'EXECUTED',
      script: 'apply_containment.ps1',
    };
  }

  // ---------------------------------------------------------------------
  // 5) CREDENTIAL SECURITY POLICY
  // ---------------------------------------------------------------------
  function credentialPolicy({ severity, targetAccount }) {
    const requiresReset =
      CONFIG.PASSWORD_RESET_REQUIRED &&
      severity === 'CRITICAL' &&
      (targetAccount || '').toLowerCase() === CONFIG.LAB_TARGET_ACCOUNT.toLowerCase();
    return { required: requiresReset, account: CONFIG.LAB_TARGET_ACCOUNT };
  }

  /** Executes reset_credential.ps1 (allowlisted, simulated in this build). Returns NO password in DRY_RUN result object. */
  function executeCredentialReset({ account, dryRun = CONFIG.DRY_RUN }) {
    if (account.toLowerCase() !== CONFIG.LAB_TARGET_ACCOUNT.toLowerCase()) {
      throw new Error('Rejected: target account does not match the configured authorized laboratory account.');
    }
    return {
      action: 'PASSWORD_RESET',
      mode: dryRun ? 'DRY_RUN' : 'LIVE',
      status: dryRun ? 'SIMULATED' : 'COMPLETED',
      account,
      requires_password_change: true,
      credential_exposed: true, // a one-time temp credential was generated & shown
      script: 'reset_credential.ps1',
    };
  }

  // ---------------------------------------------------------------------
  // 6) VERIFICATION ENGINE
  // ---------------------------------------------------------------------
  function verify({ rateBefore, followUpCluster, containmentExecuted }) {
    let rateAfter;
    if (!containmentExecuted) {
      rateAfter = rateBefore;
    } else if (followUpCluster && followUpCluster.failed_attempt_count > 0) {
      rateAfter = followUpCluster.attempt_rate;
    } else {
      rateAfter = 0;
    }
    const effectiveness = rateBefore > 0 ? Utils.clamp(Utils.round(((rateBefore - rateAfter) / rateBefore) * 100, 1), 0, 100) : 100;
    let status;
    if (!containmentExecuted) status = 'PENDING';
    else if (effectiveness >= 90) status = 'RESOLVED';
    else if (effectiveness > 0) status = 'ESCALATED';
    else status = 'ACTIVE';
    return { rate_before: Utils.round(rateBefore, 1), rate_after: Utils.round(rateAfter, 1), effectiveness, status };
  }

  return {
    correlate, fingerprint, riskScore, decidePolicy, safetyValidateAction,
    executeResponse, credentialPolicy, executeCredentialReset, verify,
    SENSITIVE_ACCOUNTS, ALLOWED_ACTIONS,
  };
})();
