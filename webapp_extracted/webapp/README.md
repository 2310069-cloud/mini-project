# AdaptiveSOC

**AI-Assisted Security Operations & Incident Response**

A high-fidelity, production-style Security Operations Center (SOC) / SIEM web application prototype. Built to demonstrate a realistic enterprise security product: event ingestion, alert correlation, incident management, MITRE ATT&CK mapping, host/auth/network monitoring, automated response simulation, and an integrated **offline AI Security Analyst**.

## Project Overview
- **Name**: AdaptiveSOC
- **Goal**: Academic/demo prototype of a real-world SIEM/SOC platform, styled and structured like professional security software (not a generic AI-generated dashboard).
- **Stack**: React + Vite + TypeScript + Tailwind CSS + Recharts + Lucide Icons
- **Data**: Fully deterministic, realistic mock cybersecurity telemetry (no external APIs, no backend required) — see `src/data/`

## Core Features Implemented
- **Overview Dashboard** — KPI cards, threat activity timeline (stacked area chart), critical incident banner, top alerts, live events, host risk snapshot, SOC architecture diagram
- **Security Events** — Filterable/paginated live event table (500+ synthetic events) with detail drawer + raw log fragment
- **Alerts** — Filterable alert table with risk scoring, detail drawer, and actions (Investigate / Assign / Suppress / Contain / Close)
- **Incident Management** — Full investigation workspace: Summary, Affected Assets, Indicators, Evidence, Timeline, MITRE Mapping, AI Analysis, Response Actions tabs
- **AI Security Analyst** — Structured "offline local intelligence engine" panel (Threat Assessment, MITRE mapping, recommended actions) + analyst chat console with quick actions and suggested questions
- **Threat Detection Engine** — Detection rule catalog with enable/disable toggles, trigger conditions, MITRE linkage
- **MITRE ATT&CK** — Tactic-column matrix with technique cards, drill-down detail (evidence, related alerts, affected hosts, recommended response)
- **Host Monitoring** — Asset grid with CPU/Memory/Network gauges, risk scoring, detail drawer with related events
- **Authentication Monitoring** — Success/failure chart, suspicious account highlight (brute-force demo account), geo-anomaly panel, live login feed
- **Network Monitoring** — Inbound/outbound/blocked traffic chart, suspicious IP reputation table, live connection feed
- **Response Actions** — Manual action console (Block IP, Isolate Host, Disable Account, Kill Process, etc.) with simulated async execution and status transitions
- **Reports** — Report catalog with simulated "Generate" + PDF/CSV export (downloads a demo file)
- **Settings** — General / Detection Policy / Notifications / Analysts & Roles / Integrations tabs
- **Global Search** (⌘K) — Cross-entity search across events, alerts, incidents, hosts, and MITRE techniques
- **Notification Center** — Unread badge, mark-as-read, deep links into related records

## Default Demo Scenario
On load, the dashboard highlights an active **CRITICAL** incident:
- **INC-2026-0042** — Brute Force Attack Against Domain Controller
- Source: `185.220.101.42` → Target: `WIN-DC01` (`10.0.10.25`)
- 187 failed attempts, Risk 92/100, MITRE **T1110 – Brute Force**, Status: Investigating

Clicking **Investigate** opens the full incident workspace; **Open in AI Analyst** hands off to the structured AI analysis + chat console.

## Data Architecture
- All mock data lives in `src/data/*.ts` (events, alerts, incidents, hosts, MITRE techniques, detection rules, AI analyses, time-series generators) — isolated from UI components so a real backend/API can later replace it without touching pages.
- Shared app state (notifications, response action status, incident updates, time range, navigation) lives in `src/context/SocContext.tsx`.
- No persistent storage is used in this prototype (no D1/KV/R2) — all state is in-memory/client-side, consistent with a frontend-only demo.

## Project Structure
```
src/
  components/        Shared UI (Sidebar, Topbar, charts, cards, badges, drawer...)
    ui/              Design-system primitives (Button, Badge, Card, Risk, Filters...)
    layout/          Sidebar, Topbar
  pages/             One component per sidebar route
  data/              Mock telemetry generators + static reference data
  context/           SocContext (global state)
  lib/                Formatting, severity/color mapping, deterministic RNG
```

## Running Locally
```
npm install
npm run build
npm run preview   # serves dist/ on port 3000
```
or for hot-reload dev:
```
npm run dev
```

## Not Yet Implemented / Next Steps
- Backend/API integration (Cloudflare D1/Workers) for persistence beyond the demo session
- Real authentication / RBAC (Settings → Analysts & Roles is illustrative only)
- URL-based deep linking for pages (navigation is currently in-memory via React context, not the browser address bar)
- Live streaming of new events (currently static generated datasets, not a real-time feed)
- Deployment: this project has not yet been deployed. Deploying to Cloudflare Pages requires choosing between the user's own Cloudflare account (BYOK) or a Genspark-hosted Cloudflare account — ask the user which path before proceeding.

## Deployment
- **Status**: Not deployed yet (local prototype only, verified via `npm run build` + `vite preview` on port 3000)
- **Target Platform**: Cloudflare Pages (static SPA — no server-side runtime required)
- **Tech Stack**: React 18 + Vite 5 + TypeScript + Tailwind CSS + Recharts + Lucide React
