/**
 * Adaptive SOC - Judge/Presentation Explainer Layer (ADDITIVE ONLY)
 *
 * Pure content module: plain-English narration for every pipeline stage,
 * plain-English attack briefings for every simulator scenario, and a
 * glossary of SOC terms. Nothing here changes any engine/pipeline logic —
 * it only supplies text + small render helpers consumed by app.js/pages.js
 * so judges/evaluators can follow exactly what is happening and why.
 */
const Explain = (() => {
  // ---- Plain-language narration per pipeline stage (keyed like STAGE_DEFS) ----
  const STAGE_NARRATION = {
    EVENT_STREAM: {
      title: 'Step 1 — Collecting Login Events',
      plain: 'The system is receiving login attempt records (who tried to log in, from which IP address, and whether it succeeded or failed) from Windows security events.',
    },
    CORRELATING: {
      title: 'Step 2 — Finding the Pattern',
      plain: 'The Correlation Engine groups all these login attempts inside a 60-second time window and asks: how many failed? from how many different IP addresses? how fast? This turns raw noise into one behavioral picture.',
    },
    FINGERPRINTING: {
      title: 'Step 3 — Naming the Attack',
      plain: 'Using fixed, explainable rules (not a black box), the system compares the pattern against known attack shapes — e.g. "many IPs + same account + fast" = Rotating-Source Attack — and gives it a name + confidence score.',
    },
    RISK_ANALYSIS: {
      title: 'Step 4 — Scoring the Danger (0-100)',
      plain: 'Five weighted factors (how fast attempts came in, how many IPs rotated, how sensitive the target account is, how long it persisted, and how confident the fingerprint is) are combined into one transparent Risk Score, so anyone can see exactly why the number is what it is.',
    },
    AI_ANALYSIS: {
      title: 'Step 5 — Local AI Double-Checks',
      plain: 'A locally-running AI model (Ollama on this machine — never a cloud API) reviews the evidence and gives its own opinion: what is this threat, how severe, and what should we do? If no local AI is available, a deterministic rule-based engine instantly takes over so nothing ever breaks.',
    },
    POLICY: {
      title: 'Step 6 — The Rulebook Decides, Not the AI',
      plain: 'This is the most important safety rule in the whole project: the AI can only ADVISE. A separate, fixed Policy Engine makes the actual decision (MONITOR / ALERT / CONTAIN / CONTAIN & ESCALATE) purely from the Risk Score. The AI can never take an action by itself.',
    },
    RESPONSE: {
      title: 'Step 7 — Responding Safely',
      plain: 'The approved action is carried out through a pre-written, allow-listed script (e.g. block the attacking IP on the Windows Firewall). In this demo it runs in DRY_RUN mode — it shows exactly what would happen without touching any real system.',
    },
    CREDENTIAL_SECURITY: {
      title: 'Step 8 — Locking Down the Account',
      plain: 'If the attack is CRITICAL and targets a sensitive account, the system resets that account\'s password using a strong password generated locally on this device. The password is shown to the admin exactly once and is never saved anywhere, never logged, and never shown to the AI.',
    },
    VERIFICATION: {
      title: 'Step 9 — Proving It Actually Worked',
      plain: 'The system compares the attack rate before the response to the attack rate after. If attempts drop to (near) zero, containment is verified as successful. If the attack keeps going, the system knows containment failed.',
    },
    REPORT_GENERATION: {
      title: 'Step 10 — Auto-Writing the Incident Report',
      plain: 'A full post-incident report is generated automatically — cleanly separating what was actually OBSERVED (facts) from what the AI INTERPRETED (analysis) from what we RECOMMEND next. No invented facts, no plaintext passwords.',
    },
    DONE: {
      title: 'Step 11 — Case Closed (or Escalated)',
      plain: 'Based on verification, the incident is marked RESOLVED (attack stopped) or ESCALATED (attack persisted, needs a human analyst). A notification is generated either way.',
    },
  };

  // ---- Plain-language briefing per attack scenario ----
  const ATTACK_INFO = {
    NORMAL: {
      title: 'Normal Scenario',
      tagline: 'No attack — this is what everyday traffic looks like.',
      plain: 'A handful of employees log in successfully from their usual computer. There are zero failed attempts. This is the baseline the system compares every other scenario against.',
      whyItMatters: 'A good SOC must stay quiet during normal activity — false alarms waste analyst time. This proves the system does NOT cry wolf.',
      expected: 'Severity: LOW → Action: MONITOR only. No containment, no report escalation.',
    },
    LOW_FREQUENCY_FAILURE: {
      title: 'Low-Frequency Failure',
      tagline: 'Someone probably just mistyped their password.',
      plain: 'A few failed logins from ONE IP address, spread out over time, followed by an eventual successful login. Classic "forgot my password" human behavior — not an attack pattern.',
      whyItMatters: 'The system must tell the difference between a clumsy human and a real adversary. Overreacting here would be annoying and would erode trust in the SOC.',
      expected: 'Severity: MEDIUM → Action: ALERT (log & watch), no automatic blocking.',
    },
    BRUTE_FORCE: {
      title: 'Brute Force Attack',
      tagline: 'One attacker, one IP, hammering the same account fast.',
      plain: '22 failed login attempts arrive very quickly from a SINGLE source IP address, all targeting the same account — the classic dictionary/password-guessing attack.',
      whyItMatters: 'This is the attack every basic firewall or "block after 5 failed attempts" rule is built to catch — because it all comes from one address, it is the easiest to block.',
      expected: 'Severity: HIGH → Action: CONTAIN (block that one source IP).',
    },
    ROTATING_SOURCE_ATTACK: {
      title: 'Rotating-Source Attack ⭐ (the project\'s core scenario)',
      tagline: 'The clever attack: same target, but the attacker keeps changing IP addresses to dodge simple defenses.',
      plain: '30 failed login attempts hit the SAME account, but they arrive from 10 DIFFERENT, constantly rotating source IP addresses in a short window. A simple "block this IP after N failures" rule is useless here because no single IP ever crosses the threshold alone.',
      whyItMatters: 'This is exactly the kind of attack real-world botnets and credential-stuffing tools use to evade traditional, single-IP-based defenses. Our system defeats it by correlating on the ACCOUNT and BEHAVIOR pattern, not just the IP — this is the flagship capability of this project.',
      expected: 'Severity: CRITICAL → Action: CONTAIN + mandatory CREDENTIAL SECURITY (password reset) → Verify → RESOLVED.',
    },
    PERSISTENT_ATTACK: {
      title: 'Persistent Attack',
      tagline: 'The attacker doesn\'t give up after the first block.',
      plain: 'Same rotating-source pattern as above, but after containment is applied, a second wave of failed attempts keeps arriving from new rotating IPs — meaning the first response did not fully stop the attacker.',
      whyItMatters: 'Real attackers adapt. A trustworthy SOC must be honest when its own response failed, and hand the case to a human analyst instead of silently declaring victory.',
      expected: 'Severity: CRITICAL → CONTAIN → Verify shows attack still active → ESCALATED for manual investigation (not falsely marked resolved).',
    },
  };

  // ---- Glossary for judges unfamiliar with SOC terminology ----
  const GLOSSARY = [
    { term: 'SOC (Security Operations Center)', def: 'A team/system that continuously monitors, detects, and responds to cybersecurity threats.' },
    { term: 'Correlation Engine', def: 'Groups many small events into one meaningful pattern (e.g. 30 logins in 60 seconds = one behavior cluster).' },
    { term: 'Attack Fingerprint', def: 'A named classification of an attack pattern (e.g. BRUTE_FORCE, ROTATING_SOURCE_AUTH_ATTACK), decided by fixed, explainable rules.' },
    { term: 'Risk Score (0-100)', def: 'A single transparent number combining 5 weighted factors that tells you how dangerous an incident is.' },
    { term: 'Local AI / Ollama', def: 'An AI model running entirely on this computer, with no data ever leaving the machine — as opposed to cloud APIs like ChatGPT or Gemini.' },
    { term: 'Deterministic Fallback', def: 'A rule-based backup "AI" that instantly takes over if the local AI model is not running, so the system never breaks.' },
    { term: 'Policy Engine', def: 'The fixed rulebook that makes the FINAL decision on what action to take — the AI can only recommend, never decide or execute.' },
    { term: 'DRY_RUN', def: 'A safety mode where the system shows exactly what action it WOULD take, without actually changing any real system — used for safe demos.' },
    { term: 'Containment', def: 'The defensive action taken to stop an attack — typically blocking the attacking IP address(es) at the firewall.' },
    { term: 'Verification Engine', def: 'Checks the attack rate before vs. after the response to PROVE whether containment actually worked.' },
    { term: 'Credential Security Action', def: 'Resetting a compromised/targeted account\'s password as an extra safety layer, using a locally-generated one-time password.' },
    { term: 'Escalation', def: 'When automated response fails to stop an attack, the incident is handed to a human analyst instead of being falsely closed.' },
    { term: 'Post-Incident Report', def: 'An automatically generated document explaining what happened, clearly separating observed facts from AI interpretation and recommendations.' },
  ];

  function stageNarration(key) {
    return STAGE_NARRATION[key] || null;
  }

  function attackInfo(scenarioId) {
    return ATTACK_INFO[scenarioId] || null;
  }

  function glossary() {
    return GLOSSARY;
  }

  return { stageNarration, attackInfo, glossary, STAGE_NARRATION, ATTACK_INFO, GLOSSARY };
})();
