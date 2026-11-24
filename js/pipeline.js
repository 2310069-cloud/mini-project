/**
 * Adaptive SOC - Pipeline Orchestrator
 * Wires: [Simulator | Wazuh Ingestion] -> Correlation -> Fingerprint -> Risk
 * -> Local AI -> Policy -> Safety Validation -> Response -> Credential
 * Security -> Verification -> Report -> Notification -> persisted to local
 * Table API.
 *
 * IMPORTANT: There is exactly ONE detection/decision pipeline. Wazuh events
 * are just another telemetry source normalized into the same internal event
 * shape (see js/wazuh.js) and fed into the SAME continuePipeline() used by
 * the safe synthetic attack simulator. Wazuh never gets its own scoring
 * logic and never makes the final decision — the deterministic Engine does.
 *
 * Emits progress via onStage(stageName, payload) so the UI can render a
 * live SOC experience.
 */
const Pipeline = (() => {
  let incidentCounter = 1;

  function nextIncidentCode() {
    const year = new Date().getFullYear();
    const code = `INC-${year}-${String(incidentCounter).padStart(3, '0')}`;
    incidentCounter += 1;
    return code;
  }

  /**
   * Shared core: takes an already-created incident row plus a batch of
   * normalized events (and an optional follow-up batch for persistence
   * demos) and runs the full correlation -> ... -> notification pipeline.
   * Used identically by the Safe Attack Simulator path and the Wazuh
   * ingestion path — this is the single source of truth for detection logic.
   */
  async function continuePipeline(incident, events, followUp, emit) {
    // ---------------- STEP 2: CORRELATION ----------------
    incident = await Tables.update('incidents', incident.id, { status: 'ANALYZING', updated_at: Utils.nowIso() });
    emit('CORRELATING', { incident });
    const cluster = Engine.correlate(events, CONFIG.CORRELATION_WINDOW_SECONDS);
    const clusterRow = await Tables.create('behavior_clusters', { ...cluster, incident_id: incident.id, created_at: Utils.nowIso() });
    emit('CORRELATED', { cluster: clusterRow });

    // ---------------- STEP 3: FINGERPRINTING ----------------
    emit('FINGERPRINTING', {});
    const fp = Engine.fingerprint(cluster, incident.target_account);
    const fpRow = await Tables.create('attack_fingerprints', { ...fp, incident_id: incident.id, created_at: Utils.nowIso() });
    incident = await Tables.update('incidents', incident.id, {
      attack_type: fp.attack_type, source_ip_count: cluster.unique_source_ip_count,
      event_source: cluster.event_source_mix, updated_at: Utils.nowIso(),
    });
    emit('FINGERPRINTED', { fingerprint: fpRow, incident });

    // ---------------- STEP 4: RISK SCORING ----------------
    emit('RISK_ANALYSIS', {});
    const risk = Engine.riskScore({ cluster, fp, targetAccount: incident.target_account });
    const riskRow = await Tables.create('risk_assessments', { ...risk, incident_id: incident.id, created_at: Utils.nowIso() });
    incident = await Tables.update('incidents', incident.id, { risk_score: risk.risk_score, severity: risk.severity, updated_at: Utils.nowIso() });
    emit('RISK_SCORED', { risk: riskRow, incident });

    // ---------------- STEP 5: LOCAL AI ANALYSIS ----------------
    emit('AI_ANALYSIS', {});
    const { analysis: ai } = await AI.analyze({ fp, cluster, risk, targetAccount: incident.target_account });
    const aiRow = await Tables.create('ai_analyses', { ...ai, incident_id: incident.id, created_at: Utils.nowIso() });
    incident = await Tables.update('incidents', incident.id, { recommended_action: ai.recommended_action, updated_at: Utils.nowIso() });
    emit('ANALYZED', { ai: aiRow, incident });

    // ---------------- STEP 6: POLICY + SAFETY VALIDATION ----------------
    emit('POLICY', {});
    const policyAction = Engine.decidePolicy(risk.severity);
    const validated = Engine.safetyValidateAction(ai.recommended_action, policyAction);
    emit('POLICY_APPROVED', { policyAction, validated });

    // ---------------- STEP 7: RESPONSE EXECUTION ----------------
    incident = await Tables.update('incidents', incident.id, { status: 'CONTAINING', updated_at: Utils.nowIso() });
    emit('RESPONSE', { incident });
    const execResult = Engine.executeResponse(validated.approved, CONFIG.DRY_RUN);
    const responseRow = await Tables.create('response_actions', {
      incident_id: incident.id,
      recommended_action: ai.recommended_action,
      approved_action: validated.approved,
      execution_mode: execResult.mode,
      status: execResult.status,
      reason: validated.reason,
      created_at: Utils.nowIso(),
    });
    incident = await Tables.update('incidents', incident.id, { final_action: validated.approved, updated_at: Utils.nowIso() });
    emit('RESPONSE_EXECUTED', { response: responseRow, incident });

    const containmentActions = ['CONTAIN', 'CONTAIN_AND_ESCALATE'];
    const containmentExecuted = containmentActions.includes(validated.approved);

    // Simulate firewall failure safety net: if execution somehow reports FAILED -> escalate.
    if (execResult.status === 'FAILED') {
      incident = await Tables.update('incidents', incident.id, { status: 'ESCALATED', updated_at: Utils.nowIso() });
      await Tables.create('security_notifications', {
        incident_id: incident.id, type: 'FIREWALL_FAILURE', title: 'RESPONSE FAILURE',
        message: `Firewall containment failed for ${incident.incident_code}. Manual investigation required.`,
        severity: 'CRITICAL', read: false, created_at: Utils.nowIso(),
      });
      emit('RESPONSE_FAILED', { incident });
    }

    // ---------------- STEP 8: CREDENTIAL SECURITY ----------------
    let credentialCtx = { required: false };
    const credPolicy = Engine.credentialPolicy({ severity: risk.severity, targetAccount: incident.target_account });
    if (credPolicy.required && containmentExecuted) {
      incident = await Tables.update('incidents', incident.id, { status: 'CREDENTIAL_SECURITY', updated_at: Utils.nowIso() });
      emit('CREDENTIAL_SECURITY', { incident });
      const credExec = Engine.executeCredentialReset({ account: credPolicy.account, dryRun: CONFIG.DRY_RUN });
      const credRow = await Tables.create('credential_security_events', {
        incident_id: incident.id,
        account: credExec.account,
        action: credExec.action,
        execution_mode: credExec.mode,
        status: credExec.status,
        reason: 'CRITICAL rotating-source attack against configured lab account triggered mandatory credential security policy.',
        requires_password_change: credExec.requires_password_change,
        credential_exposed: credExec.credential_exposed,
        created_at: Utils.nowIso(),
      });
      // Temp password generated LOCALLY, held only in-memory for the one-time UI reveal. NEVER persisted.
      const tempPassword = credExec.mode === 'DRY_RUN'
        ? `SIMULATED-${Utils.generateTempPassword()}`
        : Utils.generateTempPassword();
      incident = await Tables.update('incidents', incident.id, { credential_action: 'PASSWORD_RESET', updated_at: Utils.nowIso() });
      credentialCtx = {
        required: true,
        account: credExec.account,
        execution_mode: credExec.mode,
        status: credExec.status,
        timestamp: Utils.nowIso(),
        row: credRow,
        tempPasswordOneTime: tempPassword, // consumed by UI then discarded
        simulated: credExec.mode === 'DRY_RUN',
      };
      emit('CREDENTIAL_SECURITY_DONE', { credential: credentialCtx });
      await Tables.create('security_notifications', {
        incident_id: incident.id, type: 'CREDENTIAL_RESET', title: 'CREDENTIAL SECURITY ACTION',
        message: `The password for the configured laboratory account "${credExec.account}" was ${credExec.status === 'COMPLETED' ? 'reset' : 'simulated for reset'} as part of incident response for ${incident.incident_code}.`,
        severity: 'HIGH', read: false, created_at: Utils.nowIso(),
      });
    }

    // ---------------- STEP 9: VERIFICATION ----------------
    incident = await Tables.update('incidents', incident.id, { status: 'VERIFYING', updated_at: Utils.nowIso() });
    emit('VERIFICATION', { incident });

    let followUpCluster = null;
    if (followUp && followUp.length) {
      // persist follow-up events too, tagged to same incident, for a persistent-attack demo
      for (const ev of followUp) {
        await Tables.create('security_events', { ...ev, incident_id: incident.id });
      }
      followUpCluster = Engine.correlate(followUp, CONFIG.CORRELATION_WINDOW_SECONDS);
    }

    const verification = Engine.verify({ rateBefore: cluster.attempt_rate, followUpCluster, containmentExecuted });
    const verRow = await Tables.create('verifications', {
      ...verification,
      incident_id: incident.id,
      credential_action_status: credentialCtx.required ? credentialCtx.status : 'NOT_REQUIRED',
      created_at: Utils.nowIso(),
    });

    const finalStatus = verification.status === 'RESOLVED' ? 'RESOLVED' : (verification.status === 'ESCALATED' || verification.status === 'ACTIVE' ? 'ESCALATED' : incident.status);
    incident = await Tables.update('incidents', incident.id, {
      status: finalStatus,
      verification_result: verification.status,
      containment_effectiveness: verification.effectiveness,
      updated_at: Utils.nowIso(),
      resolved_at: (finalStatus === 'RESOLVED' || finalStatus === 'ESCALATED') ? Utils.nowIso() : null,
    });
    emit('VERIFIED', { verification: verRow, incident });

    // If escalated due to persistent attack, run one adaptive reassessment pass (documented in report).
    if (finalStatus === 'ESCALATED') {
      emit('ESCALATED', { incident });
    }

    // ---------------- STEP 10: POST-INCIDENT REPORT ----------------
    emit('REPORT_GENERATION', {});
    let reportRow = null;
    try {
      const reportCtx = {
        incident, cluster, fp, risk, ai,
        response: { approved_action: validated.approved, execution_mode: execResult.mode, status: execResult.status, reason: validated.reason },
        credential: credentialCtx.required ? { required: true, account: credentialCtx.account, execution_mode: credentialCtx.execution_mode, status: credentialCtx.status, timestamp: credentialCtx.timestamp } : { required: false },
        verification,
      };
      const reportContent = Report.build(reportCtx);
      reportRow = await Tables.create('incident_reports', {
        incident_id: incident.id,
        generated_at: Utils.nowIso(),
        status: 'GENERATED',
        provider: ai.provider,
        content: JSON.stringify(reportContent),
      });
      emit('REPORT_GENERATED', { report: reportRow, content: reportContent });
    } catch (e) {
      await Tables.create('incident_reports', {
        incident_id: incident.id, generated_at: Utils.nowIso(), status: 'FAILED', provider: ai.provider, content: JSON.stringify({ error: String(e) }),
      });
      emit('REPORT_FAILED', { error: e });
    }

    // ---------------- STEP 11: NOTIFICATION ----------------
    if (finalStatus === 'RESOLVED') {
      await Tables.create('security_notifications', {
        incident_id: incident.id, type: 'INCIDENT_RESOLVED', title: '🟢 INCIDENT RESOLVED',
        message: `${fp.attack_type.replace(/_/g, ' ')} successfully contained. Risk ${risk.risk_score}/100 — ${risk.severity}. Containment ${verification.effectiveness}%.${credentialCtx.required ? ' Credential action: ' + credentialCtx.status + '.' : ''} Report generated.`,
        severity: risk.severity, read: false, created_at: Utils.nowIso(),
      });
    } else if (finalStatus === 'ESCALATED') {
      await Tables.create('security_notifications', {
        incident_id: incident.id, type: 'INCIDENT_ESCALATED', title: '🔴 INCIDENT ESCALATED',
        message: `${fp.attack_type.replace(/_/g, ' ')} could not be fully contained (effectiveness ${verification.effectiveness}%). Escalated for manual investigation.`,
        severity: 'CRITICAL', read: false, created_at: Utils.nowIso(),
      });
    }
    emit('DONE', { incident, credential: credentialCtx });

    return { incident, credential: credentialCtx };
  }

  /** Original entry point — safe synthetic attack simulator scenarios. Unchanged behavior. */
  async function run(scenario, { onStage } = {}) {
    const emit = (stage, payload) => { if (onStage) onStage(stage, payload); };

    // -- Create the incident shell first so we have an id to attach everything to.
    const incidentCode = nextIncidentCode();
    let incident = await Tables.create('incidents', {
      incident_code: incidentCode,
      scenario,
      attack_type: 'PENDING',
      status: 'DETECTED',
      severity: 'LOW',
      risk_score: 0,
      source_ip_count: 0,
      target_account: CONFIG.LAB_TARGET_ACCOUNT,
      target_hostname: 'WIN-LABHOST-01',
      recommended_action: '',
      final_action: '',
      credential_action: 'NONE',
      verification_result: 'PENDING',
      containment_effectiveness: 0,
      event_source: 'SYNTHETIC',
      created_at: Utils.nowIso(),
      updated_at: Utils.nowIso(),
      resolved_at: null,
    });

    emit('DETECTED', { incident });

    // ---------------- STEP 1: SIMULATE EVENTS ----------------
    const { events, followUp } = Simulator.generate(scenario);
    emit('EVENT_STREAM_START', { total: events.length });
    const persisted = [];
    for (let i = 0; i < events.length; i++) {
      const row = await Tables.create('security_events', { ...events[i], incident_id: incident.id });
      persisted.push(row);
      emit('EVENT_STREAM_PROGRESS', { index: i + 1, total: events.length, event: row });
    }
    emit('EVENT_STREAM_DONE', { count: persisted.length });

    return continuePipeline(incident, events, followUp, emit);
  }

  /**
   * NEW: Wazuh-telemetry entry point. Takes already-normalized events (see
   * js/wazuh.js Wazuh.normalize) — sourced from local Wazuh alert/log data,
   * never a REST API — and feeds them into the exact same continuePipeline
   * used above. No second detection pipeline is created.
   */
  async function runFromEvents({ events, followUp = [], scenarioLabel = 'WAZUH_INGESTED', targetAccount, targetHostname, onStage } = {}) {
    const emit = (stage, payload) => { if (onStage) onStage(stage, payload); };
    if (!events || events.length === 0) throw new Error('No normalized events supplied to Pipeline.runFromEvents.');

    const incidentCode = nextIncidentCode();
    const account = targetAccount || events.find((e) => e.username)?.username || CONFIG.LAB_TARGET_ACCOUNT;
    const hostname = targetHostname || events.find((e) => e.hostname)?.hostname || 'WIN-LABHOST-01';

    let incident = await Tables.create('incidents', {
      incident_code: incidentCode,
      scenario: scenarioLabel,
      attack_type: 'PENDING',
      status: 'DETECTED',
      severity: 'LOW',
      risk_score: 0,
      source_ip_count: 0,
      target_account: account,
      target_hostname: hostname,
      recommended_action: '',
      final_action: '',
      credential_action: 'NONE',
      verification_result: 'PENDING',
      containment_effectiveness: 0,
      event_source: 'WAZUH',
      created_at: Utils.nowIso(),
      updated_at: Utils.nowIso(),
      resolved_at: null,
    });

    emit('DETECTED', { incident });

    emit('EVENT_STREAM_START', { total: events.length });
    const persisted = [];
    for (let i = 0; i < events.length; i++) {
      const row = await Tables.create('security_events', { ...events[i], incident_id: incident.id });
      persisted.push(row);
      emit('EVENT_STREAM_PROGRESS', { index: i + 1, total: events.length, event: row });
    }
    emit('EVENT_STREAM_DONE', { count: persisted.length });

    return continuePipeline(incident, events, followUp, emit);
  }

  return { run, runFromEvents };
})();
