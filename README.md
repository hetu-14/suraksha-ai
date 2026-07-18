# SuRaksha AI — The Intelligent Operating System for City Gas Distribution

> **"The AI layer that catches what humans miss."**
> Built for **Torrent Gas · Spark Tank 2026**.

SuRaksha AI unifies three role-specific consoles on one shared operational data model, anchored to India's **PNGRB (Consumer Protection) Regulations, 2025** — time-bound grievance SLAs (24h / 7d / 15d), mandatory compensation on breach, 48-hour interruption notices, and mandatory safety inspections.

## The three consoles

| Route | Console | Persona |
|---|---|---|
| `/customer` | **Customer Experience** | Riddhi Mehta, domestic PNG customer (Maninagar, Ahmedabad) |
| `/safety` | **Safety & Operations** | Control-room operator |
| `/intelligence` | **Business Intelligence** | Management / executive |

All three consoles read the **same operational state** (`lib/ops.ts`): one PNGRB SLA queue, one revenue-protection case portfolio, one compliance posture. The safety console frames it operationally (countdowns, dispatch, escalation); the intelligence console frames the identical data financially (compensation exposure, recovery, model precision). The numbers can never disagree.

## Signature workflows

- **Live incident thread** — starting an SOS in `/customer/gascare` publishes incident `GG-2026-00125`, which appears live in the `/safety/emergency` control-room queue (tagged *Customer App*, cross-tab in real time) and resolves there when the household ends the session.
- **Why-My-Bill** (`/customer/explainbill`) — deterministic bill explanation that doubles as in-premise **leak / meter-fault detection**, with factor decomposition, area comparison, and PDF export. Reads Supabase when configured, seed data otherwise.
- **SLA Sentinel** (`/safety/sla-sentinel` + `/intelligence/sla`) — live breach countdowns, AI crew assignment, and priced compensation exposure over one shared ticket queue.
- **Rev-Guard** (`/safety/rev-guard` + `/intelligence/revenue-guard`) — tamper-pattern detection with evidence packs, case lifecycle to recovery, and portfolio analytics.
- **Auto-Notify** (`/safety/smartnotify`) — PNGRB 48-hour interruption notices over WhatsApp (GREEN-API / Twilio / CallMeBot via env vars, simulated fallback) with a delivery-proof audit log.
- **Operational Insights** (`/intelligence/insights`) — AI recommendations with an approve/defer decision workflow and a persisted governance log.

## Run it

```bash
npm install
npm run dev
# open http://localhost:3000
```

No environment variables are required for the demo — Supabase (bills) and WhatsApp (notify) integrations activate automatically when their env vars are present (see `.env.local.example`).

## Stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS · Recharts · lucide-react · jsPDF · Supabase JS. Demo state persists per-browser under `suraksha:*` localStorage keys.

A companion Python/YOLOv8 PPE detector lives in `detector/` — the computer-vision story behind the CCTV panel on `/safety/emergency`.
