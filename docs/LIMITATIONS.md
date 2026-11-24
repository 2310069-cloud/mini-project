# Platform Limitations — Adaptive SOC (static-site build)

This document is a transparent, explicit account of where this build
necessarily diverges from a full on-prem deployment of the original
specification, and why — so it is never mistaken for silently-cut scope.

## Why these limitations exist

This project runs on a **static website hosting platform**. It can serve
HTML/CSS/JS and talk to a small REST "Table API" for data persistence, but
it **cannot run a persistent backend process** (no FastAPI/Python server,
no SQLAlchemy/PostgreSQL/real SQLite server process, no OS-level access).
That rules out anything that requires a server reaching into a Windows VM,
a firewall, or a real filesystem of Wazuh alert logs.

## What is fully implemented (real, working, in the browser + Table API)

- Synthetic authentication-event generation (safe attack simulator)
- Behavior correlation engine (60s configurable window)
- Attack fingerprinting (deterministic, explainable rules)
- Deterministic risk scoring engine (weighted, explainable)
- Local AI engine: attempts `localhost:11434` Ollama, automatically and
  transparently falls back to a deterministic local provider — **no cloud
  AI is ever called**
- Deterministic response policy + safety validation (AI is advisory only)
- Credential security policy + one-time, non-persisted temporary
  password workflow
- Verification engine (before/after attack-rate effectiveness)
- Auto-generated post-incident AI report with strict
  Observed-Facts / AI-Analysis / Recommendations separation
- Full professional SOC dashboard: Overview, Incidents, Events, Attack
  Analysis, Risk, AI Analysis, Response, Verification, Reports,
  Notifications, Settings
- Notification center (resolved / escalated / credential / firewall-failure)

## What is simulated / reference-only, and why

| Capability | Status here | Real-world equivalent |
|---|---|---|
| Windows Firewall containment | **Always DRY_RUN / simulated** in the web UI | `windows-response/apply_containment.ps1` is a complete, correct, allowlisted script an operator can run by hand against the authorized isolated lab VM |
| Credential reset (real AD/local account password change) | **Always simulated**, temp password shown is `SIMULATED-...` and unusable as a real Windows credential | `windows-response/reset_credential.ps1` implements the real, validated, allowlisted flow for a human operator to execute in the lab |
| Wazuh log ingestion | **Fully working**, two local/API-key-free modes: `DEMO` (same-origin `fetch()` of the bundled `data/wazuh_demo/alerts.json`, clearly labeled WAZUH DEMO DATA) and `FILE` (operator selects their real local `alerts.json` — e.g. copied off an authorized lab Wazuh manager at `WAZUH_ALERT_LOG_PATH` — via a native `<input type="file">` picker; the browser reads it directly with `FileReader`, no upload, no network call) | A static site's browser sandbox cannot open an arbitrary OS filesystem path (`WAZUH_ALERT_LOG_PATH`) automatically the way a backend `tail -f` process could, so FILE mode substitutes an explicit, one-click local file picker for that automatic poll. Both modes feed the exact same `WazuhLogIngestionService`-equivalent (`js/wazuh.js`) → parse → normalize → deduplicate → `Pipeline.runFromEvents()` flow used by the rest of this document. **No Wazuh REST API, API key, or external/cloud service is used by either mode.** |
| Backend Python services (FastAPI/SQLAlchemy) | Re-implemented as equivalent deterministic JavaScript modules (`js/engine.js`, `js/report.js`, `js/pipeline.js`) running client-side against the Table API | N/A — architecture adapted to the hosting platform, same logic/weights/rules |

## No-external-API guarantee (unchanged from the spec)

This build makes network calls to exactly two kinds of endpoints:
1. The same-origin local Table API (`tables/...`) — required by the hosting platform.
2. `http://localhost:11434` (Ollama), only if the user is running it locally, with an ~1.8s timeout and automatic fallback.

No OpenAI/Gemini/Claude/OpenRouter/HuggingFace-cloud/VirusTotal/AbuseIPDB/Wazuh-API/email/SMS
calls exist anywhere in this codebase. See the Final Security Audit section of the README.
