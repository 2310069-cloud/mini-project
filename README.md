# ADAPTIVE SOC — AI-Driven Security Operations Center

**AI-Driven Adaptive SOC for Rotating-Source Authentication Attacks**

A professional, enterprise-styled Security Operations Center dashboard that
demonstrates a complete detection → correlation → fingerprinting → risk
scoring → local-AI analysis → adaptive response → credential security →
verification → post-incident reporting → notification pipeline, entirely
client-side, backed by a local Table API, with **zero external/cloud API
dependencies**.

> ⚠️ **Platform note**: this project is built on a static-website hosting
> platform (HTML/CSS/JS + a local Table API), not a Python/FastAPI server.
> See [`docs/LIMITATIONS.md`](docs/LIMITATIONS.md) for a full, transparent
> mapping of what runs for real here vs. what is provided as reference
> material (allowlisted PowerShell scripts) for a human operator to run in
> an authorized isolated Windows lab VM. The safety rules, absence of
> external APIs, and the credential-security guarantees are honored fully
> and for real — only the actual firewall/AD mutation calls are, by
// necessity of the platform, always DRY_RUN in this build.

---

## 1. Project Overview

The system simulates and manages the full lifecycle of a **rotating-source
authentication attack** (an attacker rotating across many source IPs to
avoid single-IP brute-force detection while hammering one target account),
using:

- A **safe synthetic attack simulator** (never touches a real account)
- A **deterministic, explainable** correlation / fingerprint / risk engine
- A **local AI layer** (Ollama-first, deterministic-fallback-always)
- A **deterministic response policy** that is the sole authority for action
  (AI is advisory only, never executes anything)
- A **credential security workflow** with a cryptographically-strong,
  locally-generated, one-time-only temporary password that is **never**
  persisted, logged, sent to AI, or shown twice
- A **verification engine** measuring before/after attack rate
- An **auto-generated post-incident report** that strictly separates
  Observed Facts / AI Analysis / Recommendations
- A **professional SOC dashboard** UI

## 2. Architecture

```
SAFE SYNTHETIC ATTACK SIMULATOR (js/simulator.js)
        ↓
SecurityEvent objects  →  Table API (security_events)
        ↓
CORRELATION ENGINE (js/engine.js: correlate)         — 60s window, explainable
        ↓
ATTACK FINGERPRINTING (js/engine.js: fingerprint)     — deterministic rules
        ↓
DETERMINISTIC RISK ENGINE (js/engine.js: riskScore)   — 5 weighted factors
        ↓
LOCAL AI ENGINE (js/ai.js)                            — Ollama → fallback
        ↓
ADAPTIVE RESPONSE POLICY (js/engine.js: decidePolicy) — final authority
        ↓
SAFETY VALIDATION (js/engine.js: safetyValidateAction)
        ↓
RESPONSE EXECUTION — DRY_RUN (js/engine.js: executeResponse)
        ↓
CREDENTIAL SECURITY ACTION — policy-gated, simulated (js/engine.js)
        ↓
VERIFICATION ENGINE (js/engine.js: verify)
        ↓
RESOLVED / ESCALATED
        ↓
POST-INCIDENT AI REPORT (js/report.js)
        ↓
SECURITY NOTIFICATION (security_notifications table)
        ↓
PROFESSIONAL SOC DASHBOARD (js/pages.js, js/app.js)
```

All of this runs **client-side in the browser**, orchestrated by
`js/pipeline.js`, and persists every step to the local Table API so the
dashboard can render the full audit trail.

## 3. Technology Stack

- **Frontend**: HTML5, vanilla JavaScript (ES2020+), Tailwind-free custom
  CSS design system, Chart.js (loaded, available for future chart use),
  Font Awesome icons, Inter + JetBrains Mono fonts
- **Data**: local Table API (`tables/...`) — see Data Models below
- **AI**: local Ollama (optional, `localhost:11434`) with a deterministic
  JavaScript fallback provider — no cloud AI SDK anywhere
- **"Backend" logic**: implemented as pure deterministic JS modules
  (`engine.js`, `ai.js`, `report.js`, `pipeline.js`) that mirror the
  Python `correlation_engine.py` / `fingerprint_engine.py` /
  `risk_engine.py` / `response_policy.py` / `verification_engine.py`
  design from the original spec, 1:1 in logic and weights
- **Windows integration reference**: `windows-response/*.ps1` — real,
  allowlisted, parameter-validated PowerShell scripts for a human
  operator to run in the authorized isolated lab VM

## 4. Project Structure

```
index.html
css/style.css                  Enterprise dark SOC design system
js/config.js                   Local configuration (no API keys)
js/utils.js                    UUIDs, formatting, local crypto temp-password gen
js/api.js                      Table API wrapper
js/state.js                    Client-side state cache
js/ui.js                       Reusable render helpers (badges, modals, toasts)
js/simulator.js                Safe synthetic attack simulator
js/engine.js                   Correlation / fingerprint / risk / policy /
                                response / credential / verification engines
js/ai.js                       Local AI engine (Ollama + deterministic fallback)
js/report.js                   Post-incident AI report generator
js/pipeline.js                 End-to-end pipeline orchestrator
js/pages.js                    All 11 dashboard page renderers
js/app.js                      App bootstrap, navigation, live pipeline UI
windows-response/*.ps1         Allowlisted reference PowerShell scripts
docs/sample_wazuh_alert.json   Sample Wazuh FILE-mode alert payload
docs/LIMITATIONS.md            Transparent platform limitations doc
README.md
```

## 5. Data Models (Table API)

| Table | Purpose |
|---|---|
| `incidents` | Incident lifecycle record (status, severity, risk, actions) |
| `security_events` | Normalized authentication events |
| `behavior_clusters` | Correlation engine output per incident |
| `attack_fingerprints` | Fingerprint classification + evidence |
| `risk_assessments` | Weighted risk score + factor breakdown |
| `ai_analyses` | Local AI structured output (provider, reasoning, action) |
| `response_actions` | Policy decision + execution result |
| `credential_security_events` | Credential action metadata (never the password) |
| `verifications` | Before/after attack rate + effectiveness |
| `incident_reports` | Full structured post-incident report (JSON) |
| `security_notifications` | Notification center entries |
| `employees` | Employee login/register credentials (SHA-256 hashed passwords, salted) |
| `wazuh_sources` | Configured authorized lab/demo Wazuh source IPs — identifiers only (name, IP, agent ID, hostname, alert count, status) |
| `wazuh_ingestion_log` | History of Wazuh DEMO/FILE ingestion runs (read/new/duplicate/malformed counts, status) |

`security_events` also carries Wazuh-only fields (`rule_id`, `wazuh_severity`, `agent_id`, `dedupe_key`) which stay blank for synthetic simulator events. `behavior_clusters`, `attack_fingerprints`, `risk_assessments`, and `incidents` each carry an `event_source`/`event_source_mix` field (`SYNTHETIC` | `WAZUH` | `MIXED`).

## 5b. Hackathon / Presentation Layer (NEW)

To make live demos and judge Q&A easier, an additive explanation layer was
added — **no existing engine/pipeline logic was changed**:

- **`js/explain.js`** — plain-English narration text for every pipeline
  stage, a plain-English briefing for every attack scenario, and a
  13-term SOC glossary. Pure content, no side effects.
- **"How It Works" page** (new sidebar entry, first item after Overview) —
  a one-stop explainer: the problem statement, an 11-step architecture
  diagram, a clickable 11-step pipeline walkthrough (click any step to
  jump straight to its dashboard page), a summary of all 5 attack
  scenarios, the glossary, and a "Safety & Ethics Guarantees" checklist.
- **Attack Briefing modal** — clicking any scenario button on Overview now
  first shows a plain-English briefing (what happens / why it matters /
  expected outcome) with Cancel/Launch buttons, instead of running instantly.
- **Live narration box** — the existing "Live Attack Pipeline" progress
  modal now shows a plain-English sentence explaining what the currently
  active stage is doing, updated in real time as the pipeline advances.
- **Inline explainer boxes** — every dashboard page (Attack Analysis, Risk,
  AI Analysis, Response, Verification, Reports, Notifications) now has a
  short "What is this?" box at the top, and the Incident Detail modal has
  a one-line plain-English note under each section (Fingerprint, Risk,
  AI, Response, Credential, Verification).

## 6. Functional Entry Points (client-side "routes")

The app is a single `index.html` with in-memory client-side routing via the
sidebar. No query parameters are required:

- `#/overview` (default) — SOC dashboard + scenario simulator buttons
- `#/how` — **How It Works**: plain-English walkthrough for presentations/judges
- `#/incidents` — full incident table, click a row for full lifecycle detail
- `#/events` — searchable/filterable event explorer
- `#/attack` — attack fingerprint panels
- `#/risk` — risk analysis panels with weighted factor bars
- `#/ai` — local AI analysis panels (provider, reasoning)
- `#/response` — response + credential security action tables
- `#/verification` — before/after containment effectiveness panels
- `#/reports` — post-incident report list → full report modal → print/export
- `#/notifications` — notification center, mark-as-read
- `#/settings` — read-only view of active local configuration

(Routing is implemented via `App.goTo(pageId)` rather than real URL
fragments, since the whole app is one static page talking to the Table API.)

## 7. Local AI Setup (optional)

By default the app tries `http://localhost:11434/api/generate` (Ollama) with
an ~1.8s timeout on every AI analysis step. If you want to see real local-LLM
output instead of the deterministic fallback:

```bash
# install Ollama: https://ollama.com
ollama pull llama3
ollama serve   # or it may already be running as a service
```

Then reload the dashboard — the topbar "AI:" pill will read **LOCAL (OLLAMA)**
instead of **LOCAL (FALLBACK)**. If Ollama is not running, the app is fully
functional using the deterministic fallback provider — this is by design,
not a degraded mode.

## 8. Wazuh Integration (Local Log Ingestion — NO REST API, NO API Key)

A dedicated **Wazuh Telemetry** dashboard page (sidebar entry, new
`js/wazuh.js` module) adds Wazuh as an **additional telemetry source** that
feeds into the exact same Correlation → Fingerprint → Risk → AI → Policy →
Response → Verification pipeline used by the Safe Attack Simulator. Wazuh is
never a second/independent detection pipeline and never the decision-maker.

**How it works without a REST API or API key**: a browser cannot open an
arbitrary OS filesystem path (`WAZUH_ALERT_LOG_PATH`) automatically, so two
local, network-call-free data paths are supported instead:

- **DEMO mode** — same-origin `fetch()` of the bundled
  `data/wazuh_demo/alerts.json` sample file (12 synthetic lab alerts,
  RFC5737/TEST-NET-2 documentation-only IPs). Always labeled **WAZUH DEMO
  DATA**, never presented as live telemetry.
- **FILE mode** — the operator picks their real local Wazuh `alerts.json`
  copy with a native `<input type="file">` picker; the browser reads the
  bytes directly via `FileReader` — zero network requests, zero API keys.

Both modes: parse (tolerant of whole-JSON-array or newline-delimited JSON,
never crash on malformed input) → normalize into the existing internal
`SecurityEvent` shape → deduplicate via
`hash(timestamp + agent_id + rule_id + source_ip + description)`
(SHA-256, first 12 bytes hex) → `Pipeline.runFromEvents()` (same core as the
simulator's `Pipeline.run()`).

**Configuration** (`js/config.js`): `WAZUH_ENABLED`, `WAZUH_ALERT_LOG_PATH`
(shown in the UI as the configured real-lab path), `WAZUH_POLL_INTERVAL`,
`WAZUH_DEMO_MODE`, `WAZUH_DEMO_PATH`, `WAZUH_SOURCES[]` (authorized lab
source IPs — identifiers only, never auto-attacked/scanned/blocked).

**Wazuh Status** is a purely local health check (`Wazuh.status()`) reading
only the `wazuh_sources`/`wazuh_ingestion_log` tables — no REST health call.
If Wazuh has never been ingested it reads `READY (not yet ingested)`; if
DEMO/FILE ingestion fails it reads `OFFLINE`; if `WAZUH_ENABLED=false` it
reads `NOT AVAILABLE`. In every case the Simulator, Correlation, Risk, AI,
and Response Policy remain fully `OPERATIONAL` — the app never crashes.

See `docs/sample_wazuh_alert.json` / `data/wazuh_demo/alerts.json` for the
expected alert payload shape and `docs/LIMITATIONS.md` for the full
platform-constraint explanation.

## 9. Windows Firewall & Credential Security

`windows-response/apply_containment.ps1`, `remove_containment.ps1`,
`verify_containment.ps1`, and `reset_credential.ps1` are complete,
parameter-validated, allowlisted scripts intended for an authorized
isolated Windows lab VM. They:

- Accept only typed, validated parameters (IP regex, incident-code regex,
  allowlisted account name) — never an arbitrary shell command
- Default to `-DryRun $true` (no real mutation)
- Write append-only audit logs, **never** the plaintext password
- Reject any account that isn't the exact configured lab account

In this hosted build, the dashboard always runs the equivalent logic in
`DRY_RUN` mode (`CONFIG.DRY_RUN = true`), matching the spec's mandatory
"DRY_RUN must never modify the system" rule exactly.

## 10. Password Reset Policy

- `CONFIG.PASSWORD_RESET_REQUIRED = true`
- `CONFIG.LAB_TARGET_ACCOUNT = 'admin'`
- A reset is only ever triggered when: severity is `CRITICAL` **and**
  containment was executed **and** the target account exactly matches
  `LAB_TARGET_ACCOUNT`. The AI cannot request or perform this — it is
  purely deterministic policy.
- The temporary password is generated **locally** with `crypto.getRandomValues`
  (see `Utils.generateTempPassword`), shown **exactly once** in a modal,
  never written to any table, never logged, never put in `localStorage`,
  and the in-memory reference is explicitly discarded when the modal closes.
- In `DRY_RUN` mode the password is prefixed `SIMULATED-` and is explicitly
  documented as unusable as a real credential.

## 11. Attack Simulator

Five scenarios, all 100% synthetic (see `js/simulator.js`):

| Scenario | Pattern | Expected outcome |
|---|---|---|
| `NORMAL` | Successful logons only | LOW → MONITOR |
| `LOW_FREQUENCY_FAILURE` | A few scattered failures, 1 IP | MEDIUM → ALERT |
| `BRUTE_FORCE` | 22 failures, 1 IP, high rate | HIGH → CONTAIN |
| `ROTATING_SOURCE_ATTACK` | 30 failures, 10 rotating IPs | CRITICAL → CONTAIN_AND_ESCALATE policy tier → CONTAIN + CREDENTIAL_SECURITY → VERIFY → RESOLVED |
| `PERSISTENT_ATTACK` | Rotating-source pattern + a follow-up wave after containment | CONTAIN → VERIFY → attack continues → ESCALATED |

## 12. Incident Reports

Every incident that reaches `RESOLVED` or `ESCALATED` automatically gets a
report (`js/report.js` + `incident_reports` table) with strictly separated
sections: Executive Summary, Attack Analysis (Observed Facts), Risk
Assessment (Observed Facts), AI Analysis (tagged `AI ANALYSIS`), Response,
Credential Security (never the password), Verification, Final Conclusion,
and Recommendations (tagged `RECOMMENDATIONS`). Reports/print export use the
browser print dialog (`window.print()`) with a dedicated print stylesheet
that hides the app shell.

## 13. Notifications

The Notification Center (`#/notifications`) shows `INCIDENT_RESOLVED`,
`INCIDENT_ESCALATED`, `CREDENTIAL_RESET`, and `FIREWALL_FAILURE` entries,
each generated automatically by the pipeline, with mark-as-read support.

## 14. Running the Project

This is a static site — open `index.html` via the platform's preview/hosted
URL (or any static file server). No build step, no `npm install`, no backend
process required. All state is stored via the Table API described above.

## 15. Demo Procedure (≈5 minutes)

1. Open the dashboard → **Overview**. Confirm topbar shows `AI: LOCAL`,
   `Wazuh: DEMO`, `System: ONLINE`.
2. Click **Rotating Source Attack**. Watch the live pipeline modal step
   through event ingestion (30/30), correlation, fingerprinting, risk
   scoring, local AI analysis, policy approval, response execution,
   credential security action, verification, and report generation.
3. When the credential modal appears, note the one-time temporary
   password, copy it if desired, then close — it cannot be retrieved again.
4. Go to **Incidents**, open the new `INC-2026-00X` row — see the full
   timeline, fingerprint evidence, risk factor bars, AI reasoning, response
   decision, credential action, and verification (should show ~100%
   effectiveness, status `RESOLVED`).
5. Go to **Reports**, open the generated report, and try **Export / Print**.
6. Go to **Notifications** — see the 🟢 INCIDENT RESOLVED entry.
7. Return to **Overview**, click **Persistent Attack** to see the
   escalation path end-to-end (`ESCALATED` status, report explains why
   containment did not fully succeed).

## 16. Security Guarantees (Final Audit Summary)

- ✅ **NO external APIs used** (no OpenAI/Gemini/Claude/OpenRouter/HF-cloud)
- ✅ **NO cloud AI used** — Ollama is local-only, with a deterministic
  fallback that keeps the app fully functional offline
- ✅ **NO Wazuh REST API or API key used** — DEMO (bundled sample file) and
  FILE (local file picker + FileReader) modes only, both 100% local
- ✅ **NO API keys required or present anywhere in the codebase**
- ✅ **NO arbitrary command execution** — only fixed, parameter-validated
  PowerShell scripts are documented, and only DRY_RUN logic runs in-app
- ✅ **Safe synthetic attack simulator only** — no real credential attack
  is ever attempted against any system
- ✅ **NO plaintext password persistence** — temporary credentials exist
  only in a local JS variable for the lifetime of one modal and are never
  written to the Table API, `localStorage`, application logs, or reports

## 17. Known Limitations

See [`docs/LIMITATIONS.md`](docs/LIMITATIONS.md) for the full, explicit list.
In short: real Windows Firewall/AD mutation and live Wazuh file-tailing
require a persistent backend + OS access that a static site cannot provide;
this build ships the complete, correct scripts/contracts for that layer as
reference material for an operator, while the entire detection → AI →
policy → verification → reporting pipeline runs for real, in-browser, today.

## 18. Recommended Next Steps

- If a self-hosted Node/Python backend becomes available, port
  `js/engine.js`/`js/ai.js`/`js/report.js` logic 1:1 into
  `correlation_engine.py`/`fingerprint_engine.py`/`risk_engine.py`/
  `response_policy.py`/`verification_engine.py`, and wire the existing
  `windows-response/*.ps1` scripts to real allowlisted subprocess calls.
- Add a real Wazuh FILE-mode filesystem watcher (auto-tailing, honoring
  `WAZUH_POLL_INTERVAL`) once a backend with OS filesystem access is
  available — today FILE mode requires a manual one-click file picker per
  ingestion run instead of continuous polling.
- Add Chart.js line/bar charts to the Risk/Verification pages for trend
  visualization (Chart.js is already loaded and ready to use).
- Document the Employee Login/Register system's known limitation: this is a
  **client-side-only** credential check (no real server-side session/auth)
  and must never be presented as production-grade security.

## 19. Employee Login / Register (Access Gate)

The dashboard is gated behind an **Employee Login/Register** screen
(`js/auth.js`, `AuthUI`), responsive across mobile/tablet/desktop
(off-canvas hamburger sidebar drawer on narrow screens):

- **Register**: Employee ID, full name, work email, phone, department,
  password (min 8 chars). Passwords are hashed client-side with
  `crypto.subtle.digest('SHA-256', salt + password)` — never stored or
  transmitted in plaintext.
- **Phone validation** (`Utils.validatePhoneNumber`) rejects known
  dummy/placeholder numbers (`9876543210`, `1234567890`, etc.), sequential
  digit runs (ascending/descending), repeated-digit numbers (`9999999999`),
  and low-digit-variety numbers — only genuine-looking 10-digit Indian
  mobile numbers (starting 6-9) are accepted.
- **Login**: by Employee ID or work email + password; session persisted via
  `localStorage` and re-validated against the `employees` table on load.
- **Logout**: available from the sidebar and topbar.
- ⚠️ This is a **static site with no real backend** — this is a
  best-effort, transparent client-side credential gate for demo/lab
  purposes, **not** production-grade authentication (see
  `docs/LIMITATIONS.md`).
