# SuRaksha AI — Full Project Context (for redesign)

> **Purpose of this document:** a complete, design-oriented brief of what this product is, every screen it has, what each screen does, and why it matters. Written to be handed to a design agent as the sole source of truth for a full visual/UX redesign. It describes *intent and structure*, not implementation detail.

---

## 1. What this product is

**SuRaksha AI** — *"The Intelligent Operating System for City Gas Distribution (CGD)."*
Tagline used throughout: *"The AI layer that catches what humans miss."*

It is a demo/prototype platform built for **Torrent Gas** (an Indian piped natural gas distributor) for the **Spark Tank 2026** competition. It unifies AI agents that serve three completely different audiences across one CGD utility.

**The regulatory spine.** Everything is anchored to India's **PNGRB (Consumer Protection) Regulations, 2025**, in force from **24-Mar-2026**. Those regulations impose:
- Time-bound grievance deadlines: **24 hours / 7 days / 15 days** by complaint class
- **Compensation payouts** to customers when the utility misses a deadline
- **48-hour advance notice** for planned supply interruptions, with proof of delivery
- **Mandatory installation safety inspections**

This is the product's core argument: the need isn't hypothetical, it's a dated legal obligation. Nearly every screen ties back to safety, trust, or compliance money.

**Value triangle the product sells:** *safety (lives) + customer trust + hard money (compensation avoided, revenue recovered).*

**Locale.** Ahmedabad / Gujarat, India. Real area names (Maninagar, Naroda, Vastral, Odhav, Vatva, Ghatlodia, Bopal, Gota, Chandkheda, Naranpura). Currency ₹ (INR, lakh/crore formatting). Gas measured in **SCM** (standard cubic metres). Emergency numbers: **1906** (gas), **101** (fire), **108** (ambulance). Multilingual: **English / Hindi (हिन्दी) / Gujarati (ગુજરાતી)**.

---

## 2. Information architecture

The product is **four surfaces**: one public landing page and three role-specific consoles.

```
/                          Landing page (public, dark, cinematic) → routes into the 3 suites
│
├── /customer              CUSTOMER EXPERIENCE SUITE   (accent: emerald/green)
│     Persona: Riddhi Mehta, domestic PNG customer, acct GJ-559210, Maninagar Ahmedabad
│     8 nav items
│
├── /safety                SAFETY & OPERATIONS SUITE   (accent: amber)
│     Persona: Control Room operator
│     9 nav items
│
└── /intelligence          BUSINESS INTELLIGENCE SUITE (accent: indigo)
      Persona: Management / Intelligence Hub
      5 nav items
```

All three consoles share **one chrome component** (`components/Shell.tsx`): a fixed dark sidebar (256px, collapses to a drawer under `lg`) + a sticky translucent header. Only the accent colour, logo suffix colour, console name, breadcrumb root, avatar initials/gradient, and "Live" pill colour change per suite. The sidebar footer always carries a *"PNGRB-aligned — Consumer Protection Regulations, 2025"* card, a **"Switch suite"** link back to `/`, and the *"Torrent Gas • Spark Tank 2026"* line.

**Design implication:** the shell is the single strongest lever in a redesign — it is the frame for 22 of the 23 screens.

---

## 3. The landing page (`/`)

The only screen that breaks the shell. Client-rendered only (deliberately no SSR) to avoid a hydration double-paint.

**Character:** near-black (`#020617`), cinematic, "sci-fi command deck." It is the pitch, not the product.

**Layers stacked on it (roughly a dozen simultaneous effects):**
- Aurora gradient background, animated neural-network canvas, animated SVG circuit lines, film-grain noise overlay
- Four parallax blur orbs tracking the mouse; a faint 60px grid; a scanline sweeping top→bottom
- Scroll-progress bar, HUD corner overlay, **custom cursor with an 8-point trail** (native cursor hidden), click ripples
- Text effects: glitch text, character-scramble reveal, word-by-word reveal, cycling typewriter
- A radar sweep canvas with **five orbiting agent badges**: ExplainBill AI, SLA Sentinel, Smart Notify, Revenue Guard, GasCare SOS
- Animated counter stat cards with progress rings, magnetic buttons, a morphing blob, holographic tilt cards

**Content structure:** nav (logo + "Torrent Gas • Spark Tank 2026" + LIVE pill) → hero with cycling headline *"…catches what humans miss / the naked eye / manual checks / legacy alerts / every anomaly"* → three primary CTAs into the suites → stat cards → **three pillar cards** (Customer Experience / Safety & Operations / Business Intelligence) each linking to its console.

**Redesign note:** this page is *maximally* maximalist and is the biggest divergence from the calm, light product interior. A redesign must decide deliberately whether to keep that contrast or unify the two worlds.

---

## 4. Design system as it exists today

| Token | Current value |
|---|---|
| Font | **Inter** (300–800), loaded from Google Fonts |
| App background | `#f6f8fb` (very light blue-grey) |
| Text | `ink` slate ramp, `#1e293b` body |
| Brand / customer accent | `brand` = emerald ramp, primary `#10b981` |
| Safety accent | amber-500/600 |
| Intelligence accent | indigo-500/600 |
| Semantic | red = critical/SOS, amber = warning, brand = safe/good, sky = meter fault, violet/indigo = info |
| Radius | `rounded-2xl` cards, `rounded-xl` controls, pill badges |
| Elevation | one soft shadow token — `0 1px 2px rgba(15,23,42,.04), 0 8px 24px -8px rgba(15,23,42,.12)` |
| Glass | `rgba(255,255,255,0.7)` + 12px blur (header) |
| Motion | fade-up entrances, slide-in, a red "ring" pulse for emergencies, floaty blobs, count-ups, typewriters |

**Four shared UI primitives** (`components/ui.tsx`): `Card`, `Kpi` (label + big tabular number + coloured sub-line + icon), `Badge` (7 tones), `SectionTitle`.

**Recurring page skeleton — used by nearly every interior screen:**
1. **Dark gradient hero header** (`ink-900 → brand-900`, or amber/indigo per suite) with a blurred floating orb, a tiny uppercase eyebrow, an **animated typewriter H1**, and a one-line subtitle.
2. Optional **sticky pill tab bar** (Overview / Details / … ) — used on the deeper customer pages.
3. **KPI row** — 4 tiles, 2-col on mobile, 4-col on desktop.
4. **Content grid** — usually `lg:grid-cols-3` with a 2-col main card + 1-col side card.
5. Charts via **Recharts** (line, area, bar, pie/donut).
6. Icons via **lucide-react** throughout.

**Redesign note:** this skeleton is repeated ~20 times with heavy per-page variation crammed into single dense JSX lines. It is consistent but visually monotonous — every page looks like every other page. Differentiating page *types* (monitoring vs. explanatory vs. transactional) is a real opportunity.

---

## 5. CUSTOMER EXPERIENCE SUITE — `/customer`

**Who:** a domestic PNG household customer. Persona: Riddhi Mehta, acct **GJ-559210**, Maninagar Ahmedabad, avatar "RM".
**Emotional job:** turn an opaque, slightly scary utility relationship into something legible and reassuring. Tone should be plain-language, calm, non-technical.

### 5.1 Dashboard — `/customer`
The home base. Aggregates everything else into "what needs your attention."

- Personalised greeting + animated typewriter hero
- **"Needs your attention" cards** with three actionable states, each resolvable inline with an optimistic toast: *verify emergency contact*, *book inspection*, *clear bill*
- **Updates / notification feed** with All / Unread filter (site survey completed, feedback resolved, safety training done, inspection due in 45 days, TrustPoints +100)
- Quick-launch tiles into every other customer module; SOS entry point
- **State persists to `localStorage`** so the demo remembers what the visitor completed

**Why it matters:** it's the first impression of the customer product and the hub that gives the other seven pages a reason to be visited.

### 5.2 Why-My-Bill — `/customer/explainbill`
*The flagship customer feature.* Answers "why is my gas bill so high?" — and, critically, uses that same analysis to detect an **in-premise gas leak** or a **meter fault**.

- Server-rendered; reads from **Supabase when configured, falls back to local seed data** — a "Live · Supabase" vs "Demo data" badge shows which
- Bill selector across >1 year of history; animated amount count-up
- **Explanation engine** (`lib/billExplain.ts` — pure, deterministic) returns a verdict of `normal` | `leak` | `under` with a confidence %, a plain-language headline and narrative, and a **factor decomposition** of the rupee change vs. the previous cycle (usage effect / tariff effect / cycle-length effect / unexplained residual)
- **Leak-probability model**: ratio to personal baseline, z-score, same-season-last-year match, and an **"I was away this cycle"** toggle — usage while the premises are empty is the single strongest leak signal. Outputs `none` | `watch` | `high` plus human-readable reasons
- **Safety verdict card**: safe / investigate / meter-fault
- Consumption chart: your usage vs. **area average** vs. **previous year**
- Comparison chips: vs previous cycle / vs last year / vs area average
- **`BillIntelligence` panel** with five tabs — Overview, Explanation, Safety, Insights, Actions — containing: an itemised bill breakdown (gas charge, fixed, GST, arrears, late fee), an **appliance-mix estimator** (stove / water heater / PNG geyser + cooking frequency), a **usage-reduction simulator** with a projected saving, a "simple language" toggle, bill-increase alert opt-in, a saveable action plan, and a step-through timeline
- **`BillAssistant`** — a conversational "ask about my bill" panel
- **PDF export** of the explanation (`lib/pdf.ts`, jsPDF)

**Why it matters:** highest-emotion customer moment, and the cleverest idea in the product — one feature that simultaneously builds trust *and* saves lives. It should be the design centrepiece of the customer suite.

### 5.3 My PNG Status — `/customer/connection`
End-to-end tracker for a **new gas connection**, which in reality is a slow, opaque, multi-week process.

- Six-stage journey: application submitted → document verification → site survey & planning → meter installation → gas safety testing → final commissioning. Each stage carries a date, duration, owning team, contact number, description, and a "what happens next" list
- Progress ring / readiness %, and an explicit **"waiting on: Torrent Gas vs. waiting on: you"** signal — the emotional core of the page
- **Blocker resolution:** upload signed layout approval (PDF/JPG/PNG, ≤10 MB, validated) — clearing it moves the forecast
- Verify mobile, schedule a site-access slot, toggle push alerts, request a callback, raise a query
- Five tabs: Overview / Journey / Documents / Updates / Actions; update log with delivery channel (SMS sent, app notification sent)
- Persists to `localStorage`, and **feeds the Health Score page**

**Why it matters:** transparency during the wait is the #1 complaint driver for new CGD connections. Also the only real *document-upload / form-heavy* screen in the suite.

### 5.4 Health Score — `/customer/health`
*"Gas Safety & Service Health Index."* A credit-score-style 0–100 number for how safe and well-run a household's gas connection is.

- Four tabs: **Overview / Score details / Safety passport / Improve score**
- Score computed from **five weighted factors** — safety, payment reliability, equipment health, usage risk, readiness — each with its own sub-score, weight, evidence bullets, and a recommended action
- Six-month trend line; "score changes this month" with each ± movement explained in plain words
- **Household risk status** (Low/Med/High) with signal chips
- **"Safety passport"** — a verified record: emergency contact verified, safety training completed, inspection valid until date, GasGuard registration active, plus milestone badges
- **"Improve score"** — current → target (90) → points required, with a gamified task list (verify emergency contact +3, schedule inspection +3, safety refresher +2), each linking to the page that completes it
- **"Connected SuRaksha modules"** panel showing exactly how WhyMyBill / GasGuard / My PNG Status / TrustPoints each contribute points

**Why it matters:** this is the connective tissue of the whole customer suite — it reads state from the other pages and pushes users back into them. It is the page that makes the suite feel like one product instead of eight.

### 5.5 Voice of Customer — `/customer/voice`
Closing the feedback loop, visibly.

- Submit feedback by **typing or recording a voice note**; category + priority
- "What we understood" — an AI restatement of the submitted feedback before it's filed
- Status pipeline per item: **Received → Under Review → Assigned → Action Taken → Closed / Implemented**, with a dated timeline
- **"You said, we did"** — a showcase of customer-driven improvements actually shipped, each with an impact statement, the reason it was approved ("35% of customers raised similar concerns"), and a release month
- Post-resolution satisfaction capture (yes / partial / no)

**Why it matters:** proves feedback isn't a black hole. The "You said, we did" section is the trust payoff and deserves real design attention.

### 5.6 TrustPoints — `/customer/trustpoints`
Gamified loyalty, but for **safety behaviour** rather than spend.

- Points balance, monthly earnings, and a **four-tier reputation ladder**: Safe User → Safety Champion → Safety Guardian → Community Protector, with journey progress
- **Earning missions:** verify emergency contact, complete the leak-safety module, schedule a preventive inspection, enable bill-increase alerts, activate GasGuard
- **Reward catalogue:** free annual inspection, free leak testing, safety-awareness certificate, home emergency kit, ₹100 bill credit, waived reconnection fee, PNG appliance discount, smart-meter upgrade discount
- Ledger of how points were earned; a **before/after leak-risk comparison** justifying the whole scheme

**Why it matters:** the behaviour-change engine — it's how the utility gets customers to actually do the safety tasks. Most "fun" page in the suite; currently under-expressed visually.

### 5.7 Appointment Booking — `/customer/appointment`
Book and track an engineer visit.

- Guided **"What do you need help with?"** intent picker (annual safety check due, gas smell / suspected leak, low flame or pressure, high or unusual bill, meter display issue, regulator or pipeline concern, stove issue, geyser issue) mapping to eight service types
- Expected cost estimate, slot selection, **assigned engineer card** with photo/name and **safety certifications**
- **Live visit tracking:** engineer en route with live ETA, arrival window, live status
- Cancel / reschedule; a **"From complaint to confident resolution"** before/after narrative panel making the business-value case
- Deep-linkable via `?service=inspection` from the Health Score page

**Why it matters:** the only true transactional/booking flow in the product, and the destination of most calls-to-action elsewhere.

### 5.8 Gas-Guard — `/customer/gascare` `[SOS]`
**The life-safety screen.** Badged `SOS` in red in the sidebar. Two distinct modes.

*Preparedness mode (calm, before an emergency):* household readiness checklist, emergency equipment inventory, emergency contacts, a **practice emergency drill**, and a log of past emergencies.

*Emergency mode (live crisis):* confirmation gate ("Start emergency session?"), then:
- Symptom triage — strong gas smell / fire visible / hissing near pipe / feeling dizzy / not sure → a **risk assessment** per type
- Explicit **"Do not do this"** list alongside the do-list (do not touch switches, plugs, or the phone indoors; do not light anything)
- **Share your location**, household status roll-call, **safe meeting point**, **isolation-valve guide**, step-by-step "leave safely"
- **Silent emergency · tap-only guidance** — a no-audio, no-typing mode
- Live **crew journey & incident timeline**, then a **post-incident learning** debrief

*Powered by `components/EmergencyChat.tsx`* — a trilingual (EN/HI/GU) assistant with **speech recognition (mic) and speech synthesis (spoken replies, selectable voice, mute)**, intent matching over keyword sets, quick-reply chips ("I smell gas, no fire", "There's a flame / fire", "I'm panicking", "Call fire brigade", "Someone feels dizzy", "All safety steps"), and a one-tap **call bar for 1906 / 101 / 108** with a confirm dialog.

**Why it matters:** the highest-stakes screen in the entire product. Design constraints are unlike anything else here: a panicking user, possibly in the dark, possibly not literate in English, possibly unable to make noise, holding a phone they've just been told not to use indoors. **Huge touch targets, extreme contrast, ruthless hierarchy, zero decoration.** It should look and feel different from every other screen.

### 5.9 Customer Confidence — `/customer/confidence` *(orphaned)*
Confidence score 87/100, loyalty tier Platinum, 2,400 referral points, area average index 79, referral code. **Not linked from the sidebar nav** — an unreferenced leftover. Its ideas overlap heavily with Health Score and TrustPoints. *Redesign decision needed: fold in or delete.*

---

## 6. SAFETY & OPERATIONS SUITE — `/safety`

**Who:** control-room operators and field-ops supervisors. Avatar "OP", amber accent.
**Emotional job:** situational awareness and fast, auditable action. Denser, more technical, more monitoring-oriented than the customer suite. Assume large desktop screens and long dwell times.

### 6.1 Dashboard — `/safety`
Operations overview: aggregate alert/resolution trend, agent workload split (GasGuard, SLA Sentinel, RevGuard, AutoNotify, SafeZone), and entry points into the eight modules below.

### 6.2 Dashboard-Gas-Guard — `/safety/dashboard-gas-guard`
**The flagship ops screen.** Live CGD grid monitoring — the network equivalent of the customer's SOS page.

- **Zone list** with search + status filter across six real named assets (Bopal Distribution Hub, Satellite Pressure Reg. Station, Chandkheda CNG Compressor, Naranpura Inlet Line, Gota Feeder Main, Vastral Industrial Cluster), each **Safe / Warning / Critical / Isolated**
- Per-zone telemetry: **PPM, pressure, temperature, flow**, sensor connection state, last telemetry packet timestamp
- **Emergency isolation valve** control and "field action required" flag
- KPIs: zones monitored, critical zones, open incidents, average system PPM
- **Zone health overview** + **7-day incident trend** charts
- **Incident command queue** — acknowledge → dispatch a field crew → close, with an auditable status trail; a crew must respond before an incident can be closed
- **Operator handoff** panel (shift change)
- **Response rule settings** — configurable warning PPM threshold, critical PPM threshold, minimum line pressure, and an **auto-dispatch field crew** toggle, with restore-defaults; saved locally
- **CSV report export**

**Why it matters:** the most feature-dense screen in the product and the strongest "real SCADA-adjacent operations tool" claim. Deserves a genuine control-room design language.

### 6.3 Rev-Guard — `/safety/rev-guard`
Field-ops view of theft/tampering detection. KPIs: open alerts, estimated revenue loss this month, resolved this week, **97.3% detection accuracy**. Ranked investigate-first queue with per-account **normal vs. actual consumption** sparkline comparison. Detected patterns: *flatline (tamper), sudden drop, night spikes, bypass signature, reverse anomaly* — each with an area, an annualised ₹ risk, and a 0–100 score.

### 6.4 SLA Sentinel — `/safety/sla-sentinel`
Live PNGRB compliance clock. KPIs: SLA compliance score (target 95%+), breached (immediate action), at risk (within 2 hours of breach), met on time this week. Ticket queue bucketed by **24h / 7d / 15d** class with a live countdown and a breach-risk % per ticket. Ticket examples: gas leak — Maninagar, pressure low — Vastral, smell complaint — Odhav, billing dispute — Naroda.

**Why it matters:** every breach here is a legally mandated cash payout. The countdown is the emotional device — it should feel urgent.

### 6.5 Auto-Notify — `/safety/smartnotify`
PNGRB-compliant **48-hour supply-interruption notices**. Plan an interruption → pick the affected zone (e.g. Ward 7 Maninagar 1,284 customers; Sector 21 Gandhinagar 842; Vesu Ring Road Surat 2,109) → compose the message → send **over WhatsApp** → a **delivery log & proof** table for audit.

**This is the one feature with a real backend integration:** `app/api/notify/route.ts` + `lib/whatsapp.ts` support **GREEN-API, Twilio, and CallMeBot**, chosen by env vars, with a graceful simulated-send fallback and a UI badge showing whether it's configured.

### 6.6 Station Safety Score — `/safety/station-readiness`
"Station Readiness Index." KPIs: readiness index, operational stations, active alerts, daily inspections due. Framed around a **"Readiness Mandate."** Per-station scoring and inspection tracking.

### 6.7 Asset Maintenance Notify — `/safety/asset-health`
Predictive maintenance. **2,847 monitored assets**, 91% overall health rate, 23 maintenance warnings, 4 critical replacements, plus a **"Predictive Insight"** callout. Ranks assets by failure risk.

### 6.8 Contractor Safety Scorecard — `/safety/contractor-safety`
Contractor governance. KPIs: active contractors, average safety index, incidents month-to-date (7), **certifications expiring (framed as "Audit Regulatory Compliance")**. Per-contractor safety scoring.

### 6.9 Emergency Dashboard — `/safety/emergency` `[LIVE]`
Real-time incident response — the operator-side mirror of the customer SOS page. Badged `LIVE`.

- KPIs: active gas SOS, open CCTV alerts, **average AI pickup 1.2s**, crews dispatched
- **Gas emergency cases** — *"triaged via multilingual Customer App voice assistance"*, i.e. these arrive directly from `/customer/gascare`
- **Live triage feed**
- **CCTV Safety Violations (SafeZone AI)** with a pending-detections queue

**Companion:** a separate Python/YOLOv8 detector lives in `detector/` with a `models/hardhat.pt` weight file — real **PPE / hard-hat computer-vision detection** on site footage. This is the "AI eyes on site" story behind the CCTV panel.

---

## 7. BUSINESS INTELLIGENCE SUITE — `/intelligence`

**Who:** management. Avatar "MG", indigo accent.
**Emotional job:** money and forecasting, not operations. Boardroom-legible. Fewer, bigger, more confident numbers; more charts, fewer controls. Currently the **thinnest suite** (73–150 lines per page) and the one with the most redesign headroom.

### 7.1 Dashboard — `/intelligence`
Executive rollup across the platform.

### 7.2 Revenue Guard — `/intelligence/revenue-guard`
*"Finds hidden money in data you already have."* **2,41,860 accounts scanned**, 142 high-risk flagged, **₹27.3L estimated revenue at risk**, 91% model precision. The commercial/analytical framing of the same engine that `/safety/rev-guard` presents operationally.

### 7.3 SLA Sentinel — `/intelligence/sla`
*"Predict & prevent PNGRB compensation payouts."* Open complaints, at breach-risk, **63 breaches prevented MTD**, **₹4.8L compensation avoided**. The money framing of the same data `/safety/sla-sentinel` shows as a live queue.

### 7.4 Command Center — `/intelligence/command`
Network-wide operations posture: 8/8 monitored zones, active operations nominal, **99.97% supply uptime MTD**, atmospheric temperature.

### 7.5 Operational Insights — `/intelligence/insights`
AI-generated recommendations. **2.4M data points scanned**, 47 AI insights logged, 96.2% forecast accuracy, **₹18.6L downtime cost saved**, surfaced as **"Optimization Suggestion"** cards.

---

## 8. Cross-cutting notes a designer must know

**Deliberate duplication.** Rev-Guard and SLA Sentinel each appear **twice** — once in `/safety` (operational: queues, countdowns, actions) and once in `/intelligence` (financial: totals, precision, money saved). This is intentional audience framing, not an accident. A redesign should either sharpen the distinction hard or consciously merge them.

**Everything is client-side and stateful.** No auth, no roles, no server session. Interactivity persists to `localStorage` under `suraksha:*` keys, and **state flows between pages** — the connection status feeds the health score; the health score deep-links to appointment booking; TrustPoints missions complete on other pages. The demo is meant to be *walked through in a sequence*, not sampled at random. Design should reward that path.

**Data.** Mock/seed data throughout (`lib/data.ts`, `lib/seed.ts`), with an optional real Supabase backend for the bills feature only (two migrations exist). The WhatsApp notify route is the only other live integration. *All numbers are illustrative placeholders for the demo.*

**Deliverables the product generates:** bill-explanation PDF (`lib/pdf.ts`), service-report PDF (`lib/serviceReportPdf.ts`), and a CSV zone report from the Gas-Guard dashboard. These are printed/exported artefacts and need their own visual treatment.

**Stack (for feasibility, not prescription):** Next.js 15 App Router, React 19, TypeScript, Tailwind CSS 3, Recharts, lucide-react, jsPDF, Supabase JS. Deployed on Vercel.

**Accessibility gaps worth fixing in a redesign:**
- The landing page hides the native cursor entirely on pointer devices
- The SOS flow depends on speech APIs, is trilingual, and must work one-handed, in the dark, silently, and under panic — currently styled like the rest of the app
- Many interior pages compress an entire section into a single unbroken JSX line, and dense KPI/label text sits at 10–12px throughout
- Light theme only; no dark mode in the consoles despite a very dark landing page and a dark sidebar

**Legacy artefacts in the repo:** `index.html` (the original 61KB single-file static prototype), `public/prototype.html`, and a `README.md` that still describes that older six-agent version (GasGuard, InspectAI, WhyMyBill, AutoNotify, RevGuard, SLA Sentinel). The Next.js app has since grown to 23 screens across three suites — **treat this document, not the README, as current.**

---

## 9. Screen inventory (quick reference)

| # | Route | Suite | Type | Priority |
|---|---|---|---|---|
| 1 | `/` | — | Marketing / pitch | Flagship |
| 2 | `/customer` | Customer | Dashboard / hub | High |
| 3 | `/customer/explainbill` | Customer | Explanatory + analytical | **Flagship** |
| 4 | `/customer/connection` | Customer | Process tracker + forms | High |
| 5 | `/customer/health` | Customer | Score / index | High |
| 6 | `/customer/voice` | Customer | Feedback loop | Medium |
| 7 | `/customer/trustpoints` | Customer | Gamification | Medium |
| 8 | `/customer/appointment` | Customer | Transactional booking | High |
| 9 | `/customer/gascare` | Customer | **Life-safety / crisis** | **Flagship** |
| 10 | `/customer/confidence` | Customer | Orphaned — decide fate | Low |
| 11 | `/safety` | Safety | Dashboard / hub | High |
| 12 | `/safety/dashboard-gas-guard` | Safety | **Live monitoring + control** | **Flagship** |
| 13 | `/safety/rev-guard` | Safety | Investigation queue | Medium |
| 14 | `/safety/sla-sentinel` | Safety | Countdown / compliance queue | High |
| 15 | `/safety/smartnotify` | Safety | Compose + send + audit log | High |
| 16 | `/safety/station-readiness` | Safety | Scorecard | Medium |
| 17 | `/safety/asset-health` | Safety | Predictive maintenance | Medium |
| 18 | `/safety/contractor-safety` | Safety | Scorecard | Low |
| 19 | `/safety/emergency` | Safety | **Live incident response** | **Flagship** |
| 20 | `/intelligence` | Intelligence | Executive dashboard | High |
| 21 | `/intelligence/revenue-guard` | Intelligence | Financial analytics | Medium |
| 22 | `/intelligence/sla` | Intelligence | Financial analytics | Medium |
| 23 | `/intelligence/command` | Intelligence | Network posture | Medium |
| 24 | `/intelligence/insights` | Intelligence | AI recommendations | Medium |

Plus: `/not-found` (404).

---

## 10. If you redesign only five things

1. **`components/Shell.tsx`** — it frames 23 of 24 screens. Biggest leverage per unit of effort.
2. **`/customer/gascare` (SOS)** — highest stakes, most specific constraints, currently the least differentiated from ordinary pages.
3. **`/customer/explainbill`** — the smartest idea in the product; make the leak-detection insight impossible to miss.
4. **`/safety/dashboard-gas-guard`** — the densest screen; needs a real control-room language rather than the generic card grid.
5. **The shared page skeleton** (dark gradient hero → tabs → 4 KPIs → 2+1 grid) — repeated ~20× and the main reason the product reads as monotonous. Differentiate by page *type*: monitoring, explanatory, transactional, crisis.

---
---

# PART II — DESIGN GUIDE (binding instructions for the design agent)

> Part I described *what exists*. Part II is **direction**: what to keep, what to kill, and what to build instead. Where the two conflict, Part II wins.
>
> **The one-line brief:** keep the landing page's motion exactly as it is; rebuild everything else on a small palette of solid, premium colours with no gradients, no emoji, and no invented logo art. The product should feel *lightweight, human, and quiet* — not like generated AI design.

---

## 11. Non-negotiables

These are hard constraints. Do not creatively reinterpret them.

| # | Rule |
|---|---|
| **N1** | **The landing page animation set stays intact.** Same effects, same timing, same choreography. See §12 for the protected inventory. |
| **N2** | **No gradients in the product UI.** Solid fills only. The single scoped exception is landing-page atmosphere — see §13. |
| **N3** | **No emoji anywhere.** Replace every one with a real icon from the icon set in §16. ~48 instances exist today; §16 maps each one. |
| **N4** | **Do not generate a logo, mark, crest, or illustrative SVG.** Wordmark or blank placeholder only. See §15. |
| **N5** | **No decorative stripes, hatching, chevron patterns, "AI mesh" backgrounds, glows behind cards, or blur orbs** in the product UI. |
| **N6** | **Small palette.** The colours in §14 are the complete set. Do not add hues, do not invent tints, do not introduce a second accent per suite. |
| **N7** | **Preserve every feature and every route in Part I.** This is a visual and interaction redesign, not a scope change. The one open question is `/customer/confidence` (§9, orphaned). |

---

## 12. The landing page: protected animation inventory

The landing page (`/`, `app/landing-client.tsx`) is the pitch. Its motion is the single most-praised thing in the build and it **survives the redesign unchanged**. Treat this list as a spec to preserve, not a menu.

**Atmosphere layers (keep all):**
- `AuroraBackground` — slow drifting colour field over near-black
- `NeuralNetCanvas` — animated node/edge network on canvas, max 195 nodes, connects nearby points
- `CircuitLines` — animated SVG circuit traces with travelling light
- `NoiseOverlay` — fractal-noise film grain, desaturated
- **Four parallax blur orbs** tracking mouse position at differing depths (`orbFloat1/2/3`, 16–26s loops)
- **Grid pattern** at ~2.8% opacity, 60px cell
- **Scan sweep** — a 2px line travelling top→bottom on loop

**Interaction layers (keep all):**
- `CustomCursor` — custom cursor with an **8-point trail**, native cursor hidden
- `ClickRipple` — expanding ring on click
- `ScrollProgress` — top progress bar
- `HUDOverlay` — corner HUD framing

**Text effects (keep all):**
- `GlitchText`, `ScrambleText` (character scramble over a 68-char set), `WordReveal` (word-by-word), `TypewriterWord` cycling the phrases *"humans miss." / "the naked eye." / "manual checks." / "legacy alerts." / "every anomaly."*

**Composite pieces (keep all):**
- `RadarCanvas` — 400px sweeping radar
- `OrbitBadges` — five agent badges orbiting at 0°/72°/144°/216°/288°: **ExplainBill AI, SLA Sentinel, Smart Notify, Revenue Guard, GasCare SOS**
- `Counter` / `StatCard` — count-up statistics with progress rings
- `MagButton` — magnetic hover buttons
- `MorphBlob` — morphing blob behind the hero
- `HoloCard` — tilt-on-hover holographic cards
- Entrance keyframes: `fadeUp`, `fadeDown`, `popIn`; `logoPulse`

**What you *may* change on the landing page:** the colours those effects are tinted with (pull from §14), typography, spacing, copy hierarchy, and the logo treatment (§15). **What you may not change:** which effects exist, their motion character, or their timing.

**Accessibility addition (required):** wrap all of the above in `@media (prefers-reduced-motion: reduce)` so the page degrades to a static composition. Also **restore the native cursor** for keyboard and assistive-tech users, and ensure every `MagButton` is reachable and visibly focusable by keyboard — the custom cursor currently hides the native one globally on pointer devices.

---

## 13. The gradient rule (and its one exception)

There is a genuine conflict to resolve up front, so here is the ruling:

**The landing animation is partly *built* from gradients** — the aurora field, the four blur orbs, the circuit-line `linearGradient` strokes, the scan sweep's transparent→brand→transparent fade, and the `statRing` progress arcs. Removing gradients there would destroy the motion that rule N1 protects.

**The ruling:**

> **Gradients are permitted only as moving atmospheric light on the dark landing page.** They are banned in every static UI surface, in all three consoles, and in all shared components.

**Concretely banned — these all exist today and must go (60 usages across 24 files):**
- The **dark gradient page hero** (`from-ink-900 via-ink-900 to-brand-900`) repeated on ~20 interior pages → replace with a **flat ink surface** or, better, plain background with a strong type hierarchy and a hairline rule
- Gradient **avatar circles** in `Shell.tsx` (`from-brand-600 to-brand-800`) → solid fill
- The gradient **logo tile** in `Shell.tsx` and the landing nav → see §15
- Gradient **card backgrounds** (`from-brand-50 to-white`, `from-brand-50/60 to-white`) on Health Score, Bill Intelligence, TrustPoints, Connection → **solid tint or plain white with a coloured left border / border accent**
- The **floating blur orbs** inside interior page headers (`bg-brand-500/20 rounded-full blur-3xl`) → delete entirely
- Gradient buttons and progress bars → solid fills

**Why this matters to the brief:** soft multi-stop gradients on cards and headers are the single strongest "AI-generated design" tell. Killing them across the product is most of the work of making this feel human-made.

---

## 14. Colour system — solid, premium, small

Replace the current palette wholesale. The current `#f6f8fb` blue-grey surface with neon-emerald `#10b981` accents reads generic and synthetic; the following is warmer, quieter, and more confident.

**Rules of use:**
- **Solid fills only.** No gradient, no glow, no glass except the one header blur if you keep it.
- **Colour carries meaning, never decoration.** If a colour on screen doesn't encode state, ownership, or hierarchy, make it neutral.
- **Neutral-dominant.** Aim for roughly **90% neutral / 10% colour** on any given screen. Accent appears on: the active nav item, one primary action, and status indicators. That's it.
- Body text `ink-900` on surface; secondary text `ink-600`; never lighter than `ink-500` for anything a user must read.

### 14.1 Neutrals (the backbone)

| Token | Hex | Use |
|---|---|---|
| `surface` | `#FAFAF8` | App background — warm off-white, not blue-grey |
| `surface-raised` | `#FFFFFF` | Cards, panels, sheets |
| `surface-sunken` | `#F4F4F1` | Table stripes (as *fills*, not lines), inset wells, disabled |
| `border` | `#E6E5E1` | Hairlines, card borders, dividers |
| `border-strong` | `#D3D2CD` | Input borders, focus rings' outer edge |
| `ink-400` | `#9A9994` | Disabled text, axis labels |
| `ink-500` | `#6E6D68` | Tertiary text — **minimum readable** |
| `ink-600` | `#55544F` | Secondary text, labels |
| `ink-800` | `#2B2A27` | Body text |
| `ink-900` | `#171614` | Headings, primary numbers |
| `ink-950` | `#0D0C0B` | Sidebar, dark surfaces, landing base |

### 14.2 Suite accents (one solid colour each — this is the whole identity system)

| Suite | Token | Hex | Notes |
|---|---|---|---|
| Customer Experience | `accent-customer` | `#136F51` | Deep pine green. Calm, trustworthy, not neon. |
| Safety & Operations | `accent-safety` | `#9A5B0B` | Burnt ochre. Reads as attention without screaming. |
| Business Intelligence | `accent-intel` | `#33468C` | Muted indigo. Sober, boardroom. |

Each accent gets exactly **three** derived values — no full 50–900 ramp:
- **Base** (above) — text, icons, active states, primary buttons
- **Tint** — 8% opacity of base on white, for selected rows and active nav backgrounds
- **Deep** — ~12% darker, for hover on solid buttons only

### 14.3 Semantic (identical across all three suites — never re-tint per suite)

| Token | Hex | Meaning |
|---|---|---|
| `critical` | `#B42318` | SOS, breach, critical zone, leak-high |
| `warning` | `#B54708` | At-risk, warning zone, action needed |
| `success` | `#067647` | Safe, resolved, met on time, paid |
| `info` | `#175CD3` | Meter fault, neutral notice, informational |

**Contrast requirement:** every one of these passes **4.5:1 on `surface` and `surface-raised`**. Verify before shipping. Do not use them as light background fills with white text.

### 14.4 Do not

- Do not use more than **two** colours in a single card
- Do not colour-code chart series by suite accent — use a neutral-to-accent sequential ramp for one series, and for multi-series use `ink-800` + accent + one semantic colour, maximum three
- Do not use pure black `#000` or pure white on `surface`
- Do not add a fourth accent, a "premium gold", or a second green

---

## 15. Logo and imagery

**The current logo is out.** Today it is a gradient tile (`from-brand-400 to-brand-600`) holding a lucide `ShieldCheck`, wrapped in a pulsing ping ring, in both `Shell.tsx` and the landing nav. It reads as generated. Remove it.

**Replace with, in order of preference:**

1. **Wordmark only.** Set `SuRaksha AI` in the product typeface at a confident weight. In the sidebar, keep the existing two-line lockup — wordmark above, `CUSTOMER EXPERIENCE` / `SAFETY & OPERATIONS` / `BUSINESS INTELLIGENCE` in small uppercase tracked letterforms below. No container, no tile, no icon.
2. **Wordmark plus a blank placeholder.** If the layout genuinely needs a square mark, use an **empty solid `ink-900` (or accent) square with `rounded-lg`** and nothing inside it. Leave it empty. A real mark will be supplied later.

**Explicitly forbidden:** generated shields, flames, gas droplets, hexagons, orbital rings, monogram lettermarks, abstract swooshes, "AI" sparkles, or any decorative SVG standing in for brand identity. If you feel the urge to draw something, leave it blank instead.

**SVG — the distinction that matters:**
- **Allowed:** functional and animation SVG — Recharts output, the landing page's `CircuitLines` and `statRing` (protected under §12), progress arcs, sparklines.
- **Forbidden:** decorative SVG illustration, spot art, empty-state characters, background patterns, and anything logo-shaped.

**Photography/illustration:** none. Empty states use a single icon at `ink-400` plus one line of plain text. The engineer card on `/customer/appointment` uses initials in a solid circle, not a photo.

---

## 16. Icons — replacing every emoji

**Keep `lucide-react`.** It is already installed, already used across all 24 screens, MIT-licensed, tree-shakeable, ~1,600 icons, and stylistically consistent. Do not add a second icon library — mixing sets is another strong "generated" tell.

**Standard usage:**
- Sizes: **16px** inline with text, **18px** in nav, **20px** in KPI tiles and buttons, **24px** maximum. Never larger except a single empty-state icon at 32px.
- Stroke width **1.5** or **2** — pick one and never mix within a screen.
- Icons inherit text colour. Colour an icon only when it carries state.
- Every icon that isn't purely decorative needs an accessible label.

**Acceptable alternatives if lucide lacks something:** *Phosphor Icons* (MIT, multiple weights), *Radix Icons* (MIT, 15px grid), *Heroicons* (MIT, by the Tailwind team), *Tabler Icons* (MIT, 4,000+). All are free for commercial use. **Pick one fallback and document it — do not sample from several.**

### 16.1 Emoji → icon replacement map (complete; ~48 instances, 11 files)

| Emoji | Where | Replace with (lucide) |
|---|---|---|
| 🔥 | `dashboard-gas-guard` H1 | *delete* — the H1 needs no icon |
| 💨 | Gas-Guard, PPM reading | `Wind` |
| ⚡ | Gas-Guard, pressure | `Gauge` |
| 🌡️ | Gas-Guard, temperature | `Thermometer` |
| 🔄 | Gas-Guard, flow | `Repeat` or `Waves` |
| ⚠️ / ⚠ | Gas-Guard, rev-guard, smartnotify, customer home, health, connection, appointment | `AlertTriangle` |
| ✓ | smartnotify, customer home, health, connection, trustpoints | `Check` |
| ❌ | `connection`, delay impact | `X` (in `critical`) |
| 👋 | customer home greeting | *delete* — greetings don't need an icon |
| 😊 / 😐 / 😞 | `voice`, satisfaction capture | `Smile` / `Meh` / `Frown` |
| ★ | `appointment` engineer rating; `trustpoints` tier | `Star` |
| ✦ | `trustpoints`, Community Protector tier | `Sparkle` |
| 🛡️ / 🛡 | `appointment` safety inspection; `trustpoints` tier + reward | `ShieldCheck` |
| 🍳 | `appointment`, gas stove | `CookingPot` |
| 🚿 | `appointment`, PNG geyser | `ShowerHead` |
| 📊 | `appointment`, bill issue | `BarChart3` |
| ⚙️ | `appointment`, regulator servicing | `Settings2` |
| 🔗 | `appointment` new connection; `trustpoints` reconnection reward | `Link2` |
| 🔎 | `trustpoints`, free leak testing | `Search` |
| 📜 | `trustpoints`, safety certificate | `ScrollText` |
| 🧰 | `trustpoints`, emergency kit | `Briefcase` or `Wrench` |
| 💳 | `trustpoints`, bill credit | `CreditCard` |
| 🏷️ | `trustpoints`, appliance discount | `Tag` |
| 📡 | `trustpoints`, smart meter upgrade | `RadioTower` |
| 🔒 | `EmergencyChat`, mic-blocked message | `Lock` |

**Sweep instruction:** after applying the map, grep the codebase for any remaining emoji and eliminate them. None should survive, including in string literals, chart labels, toast messages, and PDF/CSV export content.

---

## 17. Typography

**Keep Inter** — it is well-drawn, free, already loaded, and neutral enough to read as designed rather than defaulted. If you want more character, **Geist** or **Söhne**-alikes are acceptable; do not use a display face for UI.

- Weights: **400 / 500 / 600** only. Drop 300 (too fragile at small sizes) and **drop 800** — the current `font-extrabold` headings are shouty. `600` is the ceiling.
- **Numbers:** always `tabular-nums` for KPIs, currency, countdowns, and table columns. Non-negotiable for anything that changes live.
- **Raise the floor:** the smallest text in the product today is 10px (`text-[10px]` in eyebrows, badges, sidebar meta). Minimum is now **12px**, and 12px only for genuinely secondary metadata.
- Suggested scale: `12 / 14 / 16 / 20 / 24 / 32`. Page H1 at 24–32; section headings at 16–20; body 14–16.
- **Uppercase tracked eyebrows** (`uppercase tracking-widest`) appear on nearly every page header today. Keep the device but use it **once per page maximum**, at 12px, `ink-500`.

---

## 18. Surface, depth, and shape

- **Borders over shadows.** Default card = `surface-raised` + `1px border` + `rounded-xl` (12px). No shadow.
- **One shadow token**, used only for genuinely floating things — modals, dropdowns, toasts, the mobile nav drawer: `0 4px 16px -4px rgba(23,22,20,0.10)`. The current double-layer `shadow-soft` on every card is over-elevated; cards should sit flat.
- **Radii:** `8px` controls / `12px` cards / `9999px` pills and status dots. Three values, no others. The current `rounded-2xl` (16px) everywhere is soft to the point of blandness.
- **Density:** the consoles are data tools. Tighten interior padding from the current 20–24px to **16–20px** on cards, and give tables real row density (36–40px rows).
- **Glass:** keep the sticky header's translucency if you like it, but retune it to the warm neutral (`rgba(250,250,248,0.85)`) and drop it everywhere else.

---

## 19. Motion in the product UI

Distinct from the landing page. Interior motion should be **functional and nearly invisible**.

- **Keep:** count-ups on KPI values (they communicate liveness), the SOS red pulse ring on `/customer/gascare` and `/safety/emergency` (it encodes urgency), chart draw-in on mount.
- **Cut:** the `Typewriter` H1 on every interior page header. It appears on ~15 screens; on a tool people use daily it delays reading the title for no benefit. Keep it on the landing page only.
- **Cut:** floaty blob animations inside page headers, and staggered card reveal on every navigation.
- **Timing:** 120–200ms for state changes, `ease-out`. Nothing in the product UI should animate longer than 300ms.
- Honour `prefers-reduced-motion` everywhere.

---

## 20. Differentiating the four page archetypes

The strongest structural criticism in Part I: ~20 screens share one skeleton (dark gradient hero → tabs → 4 KPIs → 2+1 grid), so everything looks the same. Give each archetype its own layout language.

**A. Crisis — `/customer/gascare`, `/safety/emergency`**
The most important redesign in the project. Assume: a panicking user, in the dark, possibly not reading English, possibly unable to make noise, holding a phone they were just told not to use indoors.
- Minimum **56px** touch targets; one primary action visible at a time
- Maximum contrast; `critical` red used *only* here and nowhere decorative
- No tabs, no KPIs, no charts, no card grid — a single vertical column of large sequential steps
- The **"Do not do this"** list must be as visually loud as the do-list
- **Silent / tap-only mode** must be reachable in one tap from the first screen
- The **1906 / 101 / 108** call bar is persistent and thumb-reachable at the bottom
- Language switch (EN / हिन्दी / ગુજરાતી) is visible without scrolling, at full size

**B. Monitoring — `/safety/dashboard-gas-guard`, `/safety/emergency`, `/intelligence/command`**
Control-room language. Dense tabular data, status as a colour-plus-shape indicator (never colour alone), persistent filter/search rail, high information density, comfortable on a 27" screen at long dwell times. Status colour should read at a glance from two metres away.

**C. Explanatory — `/customer/explainbill`, `/customer/health`, `/intelligence/insights`**
Editorial, generous, narrative. Wider measure, real prose typography, the conclusion stated **before** the evidence. On `/customer/explainbill` the leak/meter-fault verdict is the single most important element on the page and must be impossible to miss — it currently sits as one card among many.

**D. Transactional — `/customer/appointment`, `/customer/connection`, `/safety/smartnotify`**
Form-forward, single clear path, obvious progress, explicit "waiting on you vs. waiting on us" state, inline validation, and unambiguous confirmation. Fewer decorative panels, more whitespace around the actual controls.

---

## 21. Accessibility floor (treat as acceptance criteria)

1. **4.5:1** contrast for all text; **3:1** for UI boundaries and status indicators
2. **Never colour alone** for status — always pair with an icon or a text label. Critical for the Safe / Warning / Critical / Isolated zone states and the SLA countdown states
3. Visible focus ring on every interactive element — 2px, `accent` or `ink-900`, with a 2px offset
4. `prefers-reduced-motion` honoured on both the landing page and in the product
5. Full keyboard reachability, including the landing page's magnetic buttons and the custom-cursor region
6. 12px minimum type; 16px minimum for anything in the crisis archetype
7. Trilingual layouts (EN/HI/GU) must not break — **Devanagari and Gujarati need more line-height than Latin**; test the SOS flow in all three
8. Touch targets 44px minimum, 56px in crisis screens

---

## 22. Definition of done

- [ ] Zero gradients outside the landing page's protected atmosphere layers
- [ ] Zero emoji in the codebase — verified by grep, including strings, chart labels, toasts, and PDF/CSV exports
- [ ] Zero generated logo/illustration SVG; wordmark or blank placeholder in place
- [ ] Exactly the tokens in §14 in use — no stray hexes, no extra hues
- [ ] Landing page animation inventory (§12) fully intact, plus a reduced-motion fallback
- [ ] All 24 routes redesigned; all Part I functionality preserved
- [ ] Four page archetypes visually distinguishable at a glance
- [ ] `/customer/gascare` redesigned to the crisis spec — the single highest-value screen in the project
- [ ] Accessibility floor (§21) met
- [ ] Type weights limited to 400/500/600; nothing below 12px
- [ ] `/customer/confidence` either folded into Health Score / TrustPoints or removed — decide and note it

---

## 23. The taste test

Before shipping any screen, ask:

> *Would a careful human designer with good taste and a deadline have made this — or does it look like a machine reached for decoration because the space was empty?*

Empty space is fine. Quiet is fine. Neutral is fine. **Reach for hierarchy, not ornament.**
