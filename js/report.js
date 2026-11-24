/**
 * Adaptive SOC - Post-Incident AI Report Generator
 *
 * Strictly separates OBSERVED FACTS (produced by the deterministic engine)
 * from AI ANALYSIS (local Ollama or deterministic fallback interpretation)
 * and RECOMMENDATIONS. The AI/report generator never invents IPs,
 * timestamps, usernames, counts, actions, or verification results — it
 * only narrates data already computed by Engine/AI modules. Never
 * includes any plaintext credential.
 */
const Report = (() => {
  function narrativeSummary(ctx) {
    const { incident, cluster, fp, risk, ai, response, credential, verification } = ctx;
    const lines = [];
    lines.push(`On ${Utils.fmtTime(incident.created_at)}, the SOC pipeline detected a ${fp.attack_type.replace(/_/g, ' ').toLowerCase()} targeting account "${incident.target_account}" on host "${incident.target_hostname}".`);
    lines.push(`${cluster.failed_attempt_count} failed authentication attempts were observed from ${cluster.unique_source_ip_count} unique source IP address(es) within a ${cluster.window_seconds}-second correlation window (attempt rate ${cluster.attempt_rate}/min).`);
    lines.push(`The deterministic risk engine scored this incident at ${risk.risk_score}/100 (${risk.severity}).`);
    lines.push(`The local AI engine (${ai.provider === 'OLLAMA' ? 'Ollama, local' : 'Deterministic Fallback'}) classified the threat as ${ai.threat_type} with ${(ai.confidence * 100).toFixed(0)}% confidence and recommended ${ai.recommended_action}.`);
    lines.push(`The deterministic response policy approved and executed: ${response.approved_action} (mode: ${response.execution_mode}, status: ${response.status}).`);
    if (credential && credential.required) {
      lines.push(`Per credential security policy, a password reset action was ${credential.status === 'COMPLETED' ? 'completed' : 'simulated'} for the configured laboratory account "${credential.account}". No plaintext credential is stored or reported.`);
    } else {
      lines.push('No credential security action was required for this incident.');
    }
    lines.push(`Verification measured attack rate before (${verification.rate_before}/min) versus after (${verification.rate_after}/min) response, yielding ${verification.effectiveness}% containment effectiveness.`);
    lines.push(`Final incident status: ${incident.status}.`);
    return lines;
  }

  function recommendations(ctx) {
    const { incident, verification, fp } = ctx;
    const recs = [];
    if (incident.status === 'ESCALATED') {
      recs.push('Escalate to on-call security analyst for manual investigation.');
      recs.push('Consider expanding containment scope (e.g., account lockout, MFA enforcement) given continued attack activity.');
      recs.push('Review network egress/ingress control points for the rotating source IP ranges.');
    } else {
      recs.push('Continue routine monitoring; no further action required at this time.');
    }
    if (fp.attack_type === 'ROTATING_SOURCE_AUTH_ATTACK' || fp.attack_type === 'DISTRIBUTED_AUTH_ATTACK') {
      recs.push('Evaluate geo/ASN-based conditional access policies to reduce rotating-source attack surface.');
    }
    if (verification.effectiveness < 100) {
      recs.push('Re-verify containment after an extended observation window.');
    }
    recs.push('Enforce MFA on the affected account if not already enforced.');
    recs.push('Review Windows Event ID 4625 alerting thresholds for this host.');
    return recs;
  }

  function build(ctx) {
    const { incident, cluster, fp, risk, ai, response, credential, verification } = ctx;

    const observedFacts = {
      incident_id: incident.incident_code,
      attack_fingerprint: fp.attack_type,
      failed_attempts: cluster.failed_attempt_count,
      unique_source_ips: cluster.unique_source_ip_count,
      target_account: incident.target_account,
      target_hostname: incident.target_hostname,
      attempt_rate_per_min: cluster.attempt_rate,
      attack_duration_seconds: cluster.attack_duration,
      ip_rotation_rate: cluster.ip_rotation_rate,
      persistence_score: cluster.persistence_score,
      risk_score: risk.risk_score,
      severity: risk.severity,
      response_action: response.approved_action,
      execution_mode: response.execution_mode,
      execution_status: response.status,
      credential_action_performed: !!(credential && credential.required),
      verification_before: verification.rate_before,
      verification_after: verification.rate_after,
      containment_effectiveness: verification.effectiveness,
      final_status: incident.status,
    };

    const aiAnalysis = {
      threat_type: ai.threat_type,
      confidence: ai.confidence,
      provider: ai.provider,
      reasoning: ai.reasoning,
      recommended_action: ai.recommended_action,
      potential_impact: risk.severity === 'CRITICAL'
        ? 'Unauthorized access to a privileged account could lead to full system compromise, lateral movement, and data exfiltration.'
        : 'Limited impact if left unaddressed; potential precursor to a larger credential-based attack.',
    };

    const report = {
      generated_at: Utils.nowIso(),
      incident_summary: {
        incident_id: incident.incident_code,
        date: incident.created_at,
        start_time: incident.created_at,
        end_time: incident.resolved_at || null,
        final_status: incident.status,
        severity: risk.severity,
        attack_type: fp.attack_type,
      },
      observed_facts: observedFacts,
      attack_analysis: {
        fingerprint: fp.attack_type,
        confidence: fp.confidence,
        behavior_score: fp.behavior_score,
        evidence: fp.evidence,
      },
      risk_assessment: {
        risk_score: risk.risk_score,
        severity: risk.severity,
        factors: {
          attempt_frequency: risk.attempt_frequency_score,
          source_ip_rotation: risk.source_ip_rotation_score,
          target_sensitivity: risk.target_sensitivity_score,
          persistence: risk.persistence_score,
          fingerprint_confidence: risk.fingerprint_confidence_score,
        },
        explanation: risk.explanation,
      },
      ai_analysis: aiAnalysis,
      response: {
        recommended_action: ai.recommended_action,
        policy_decision: response.approved_action,
        actual_action: response.approved_action,
        execution_mode: response.execution_mode,
        execution_result: response.status,
        reason: response.reason,
      },
      credential_security: credential && credential.required ? {
        account: credential.account,
        action: 'PASSWORD_RESET',
        reason: 'Deterministic credential security policy required a reset for a CRITICAL rotating-source attack against the configured lab account.',
        timestamp: credential.timestamp,
        execution_mode: credential.execution_mode,
        status: credential.status,
        requires_password_change: true,
      } : null,
      verification: {
        rate_before: verification.rate_before,
        rate_after: verification.rate_after,
        containment_effectiveness: verification.effectiveness,
        status: verification.status,
      },
      narrative_summary: narrativeSummary(ctx),
      recommendations: recommendations(ctx),
    };

    return report;
  }

  return { build };
})();
