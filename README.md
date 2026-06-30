# SuRaksha AI — CGD Safety, Trust & Compliance Intelligence

> **"The AI layer that catches what humans miss."**
> A single platform that unifies six AI agents for City Gas Distribution — built for Torrent Gas, Spark Tank 2026.

---

## 🚀 Run it (zero setup)

Just **double-click `index.html`** — it opens in any modern browser. No install, no build step.

> Needs an internet connection on first load (it pulls Tailwind, Chart.js, Lucide & the Inter font from CDNs). For an offline demo venue, open it once while online so the browser caches the assets, or tell me and I'll bundle the libraries locally.

For a cleaner local server (optional):
```bash
# from this folder
python -m http.server 8080
# then open http://localhost:8080
```

---

## 🧩 The six agents (all in one console)

| Agent | Pillar | What it does |
|---|---|---|
| **GasGuard** | Safety | 24/7 AI **voice agent** for the leak hotline — answers instantly, talks the caller through life-saving steps, auto-captures location/severity, auto-dispatches the nearest crew, generates a responder brief. |
| **InspectAI** | Safety | **Photo-verified** consumer-installation safety checks (ventilation, clearance, routing) → time-stamped compliance record. Operationalizes PNGRB's mandatory inspection. |
| **WhyMyBill** | Customer | Explains a high bill in **plain language** *and* flags abnormal patterns that signal an **in-premise leak** or a **meter fault**. |
| **AutoNotify** | Customer | Sends **PNGRB-compliant 48-hour** supply-interruption notices to exactly the affected zone, with delivery proof for audit. |
| **RevGuard** | Business | Learns each account's consumption "fingerprint" and ranks an **investigate-first** queue for tampering / under-registration — finds hidden money. |
| **SLA Sentinel** | Compliance | Tracks every complaint's **24h / 7-day / 15-day** clock, predicts breaches, and escalates **before** a compensation payout is triggered. |

---

## ⚖️ Why this wins (the pitch)

- **Real, dated problem:** PNGRB **(Consumer Protection) Regulations, 2025** — in force **24-Mar-2026** — now impose time-bound grievance deadlines (24h/7d/15d), **compensation for lapses**, 48-hour interruption notice, and mandatory installation inspections. SuRaksha AI is built *directly* on those obligations, so the need is guaranteed, not hypothetical.
- **Triple value:** safety (lives) + customer trust + hard money (compensation avoided, revenue recovered).
- **Not a feature pile — a philosophy:** every module is "AI catching what a busy human misses."
- **Distinct from last year's winner (SmartCGD):** that was field patrolling / complaint registration / GIS. This is live emergency response, proactive trust, anomaly intelligence, and compliance prediction — different moments entirely.

---

## 🛣️ Website → App roadmap

This prototype is intentionally a **single static file** so it demos anywhere. Production path:

1. **Frontend → React + Vite + Tailwind** (the current layout/components port 1:1).
2. **Mobile app → React Native / Capacitor** wrapper sharing the same component logic.
3. **Backend → FastAPI / Node** services per agent; Postgres + a time-series store for consumption data.
4. **AI services:**
   - GasGuard → speech-to-text + LLM dialog + text-to-speech (multilingual).
   - WhyMyBill / RevGuard / SLA → lightweight ML on existing billing/complaint data.
   - InspectAI → a vision model fine-tuned on installation photos.
5. **Integrations:** existing CRM/billing, SMS/WhatsApp gateway, GIS pipeline layer, PNGRB IGMS portal.

---

## 📁 Files
- `index.html` — the full working prototype (UI + interactive demos, mock data).
- `README.md` — this file.

*All numbers in the prototype are illustrative placeholders for the demo.*
