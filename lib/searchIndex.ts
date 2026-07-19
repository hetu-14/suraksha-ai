// ---- Global search: the platform's central index ----
// Every meaningful entity — pages, customers, bills, tickets, cases, zones,
// stations, assets, engineers, documents, procedures, live appointments,
// feedback, and timeline events — is indexed with identity, status,
// relationships, and a navigation route. The scorer understands prefixes,
// substrings, typos (edit distance), abbreviations, and intent phrases, so
// "high bill", "leek", or "sla" all land somewhere useful.

import { slaTickets, revCases } from "@/lib/ops";
import { currentCustomer } from "@/lib/data";

export type SearchEntry = {
  id: string;
  title: string;
  description: string;
  group: string;          // result section — never mixes unrelated entities
  href: string;
  keywords?: string;      // synonyms and abbreviations
  status?: string;
  priority?: "Low" | "Medium" | "High" | "Critical";
  updated?: string;
  summary?: string;       // one-line AI summary for the preview pane
  related?: string[];     // ids of connected entries
  actions?: Array<{ label: string; href: string }>;
  isAction?: boolean;
};

// ══════════════════════════════════════════════════════════════
// Actions — results that start a workflow, not just navigate
// ══════════════════════════════════════════════════════════════

const actions: SearchEntry[] = [
  { id: "action:sos", title: "Start emergency SOS", description: "Launch the GasGuard emergency workflow — triage, safety steps, crew dispatch.", group: "Actions", href: "/customer/gascare", keywords: "report leak gas smell emergency help fire hissing sos panic", priority: "Critical", isAction: true, summary: "Opens the life-safety flow. Location capture and crew dispatch begin after one confirmation tap.", related: ["page:safety-emergency", "doc:smell-gas"] },
  { id: "action:book-inspection", title: "Book a safety inspection", description: "Open appointment booking with the annual inspection pre-selected.", group: "Actions", href: "/customer/appointment?service=inspection", keywords: "schedule inspection annual safety check visit engineer", isAction: true, summary: "Booking completes in three steps; the inspection also raises your equipment health score.", related: ["page:health", "page:trustpoints", "engineer:ramesh"] },
  { id: "action:explain-bill", title: "Explain my bill", description: "Open the latest bill with AI explanation, leak probability, and simulation.", group: "Actions", href: "/customer/explainbill", keywords: "why my bill high unusual expensive increase billing doctor", isAction: true, summary: "Jan–Feb 2026 bill of ₹1,980 is due — the AI decomposition explains the winter increase.", related: ["bill:now", "page:health"] },
  { id: "action:create-complaint", title: "Create a complaint or feedback", description: "Open the Voice of Customer form — typed or voice note, with AI triage.", group: "Actions", href: "/customer/voice?tab=share", keywords: "complain feedback grievance issue report problem voc", isAction: true, summary: "Safety-related wording is escalated immediately; everything else is triaged in 24–48 hours.", related: ["page:voice"] },
  { id: "action:send-notice", title: "Send 48-hour interruption notice", description: "Plan a supply interruption and notify affected customers over WhatsApp.", group: "Actions", href: "/safety/smartnotify", keywords: "outage notice whatsapp interruption pngrb notify zone", isAction: true, summary: "PNGRB requires 48-hour advance notice with proof of delivery — the log stores the audit trail.", related: ["doc:notice-rule"] },
  { id: "action:handoff", title: "Log operator shift handoff", description: "Record open items and watch zones for the incoming control-room shift.", group: "Actions", href: "/safety/dashboard-gas-guard", keywords: "shift change operator handover control room", isAction: true, summary: "Handoffs are logged on the Gas-Guard dashboard next to the incident queue.", related: ["page:gas-guard"] },
];

// ══════════════════════════════════════════════════════════════
// Pages
// ══════════════════════════════════════════════════════════════

const pages: SearchEntry[] = [
  { id: "page:customer", title: "Customer Dashboard", description: "Household overview, next best action, live timeline.", group: "Pages", href: "/customer", keywords: "home overview hub" },
  { id: "page:explainbill", title: "WhyMyBill", description: "Bill explanation, leak probability, usage simulation, PDF export.", group: "Pages", href: "/customer/explainbill", keywords: "bill explain billing leak wmb", related: ["bill:now", "action:explain-bill"] },
  { id: "page:connection", title: "My PNG Status", description: "New-connection journey, documents, forecast, blockers.", group: "Pages", href: "/customer/connection", keywords: "connection installation tracker png status", related: ["doc:layout"] },
  { id: "page:health", title: "Health Score", description: "Gas Safety & Service Health Index with weighted factors.", group: "Pages", href: "/customer/health", keywords: "safety passport score index hs", related: ["action:book-inspection", "page:trustpoints"] },
  { id: "page:voice", title: "Voice of Customer", description: "Feedback lifecycle, community impact, you-said-we-did.", group: "Pages", href: "/customer/voice", keywords: "feedback complaint voc tickets" },
  { id: "page:trustpoints", title: "TrustPoints", description: "Safety missions, reward catalogue, points ledger.", group: "Pages", href: "/customer/trustpoints", keywords: "rewards loyalty points tp missions", related: ["page:health"] },
  { id: "page:appointment", title: "Appointment Booking", description: "Book and track engineer visits with live status.", group: "Pages", href: "/customer/appointment", keywords: "engineer visit schedule booking apt", related: ["engineer:ramesh", "engineer:sunil", "engineer:manoj"] },
  { id: "page:gascare", title: "Gas-Guard SOS", description: "Emergency guidance, readiness checklist, practice drill.", group: "Pages", href: "/customer/gascare", keywords: "emergency sos leak fire drill gg", priority: "Critical", related: ["action:sos", "doc:smell-gas", "doc:valve"] },
  { id: "page:safety", title: "Safety Operations Dashboard", description: "Control-room overview across all eight safety modules.", group: "Pages", href: "/safety", keywords: "operations control room ops" },
  { id: "page:gas-guard", title: "Dashboard Gas-Guard", description: "Live CGD grid monitoring, isolation control, incident queue.", group: "Pages", href: "/safety/dashboard-gas-guard", keywords: "zones ppm telemetry scada grid monitoring", related: ["zone:naranpura", "zone:bopal"] },
  { id: "page:rev-guard-ops", title: "Rev-Guard (Operations)", description: "Theft and tamper investigation queue with case lifecycle.", group: "Pages", href: "/safety/rev-guard", keywords: "revenue theft tamper fraud rg investigation", related: ["case:RG-0921", "page:rev-guard-intel"] },
  { id: "page:sla-ops", title: "SLA Sentinel (Operations)", description: "PNGRB compliance countdown queue with escalation.", group: "Pages", href: "/safety/sla-sentinel", keywords: "sla breach pngrb compliance countdown deadline", related: ["ticket:T-7720", "page:sla-intel"] },
  { id: "page:smartnotify", title: "Auto-Notify", description: "48-hour interruption notices over WhatsApp with delivery proof.", group: "Pages", href: "/safety/smartnotify", keywords: "whatsapp notice outage interruption an", related: ["action:send-notice"] },
  { id: "page:stations", title: "Station Safety Score", description: "Station readiness index, inspections, mandate tracking.", group: "Pages", href: "/safety/station-readiness", keywords: "station readiness cng mother", related: ["station:naroda-mother"] },
  { id: "page:assets", title: "Asset Maintenance Notify", description: "Predictive maintenance ranked by failure risk.", group: "Pages", href: "/safety/asset-health", keywords: "asset maintenance predictive pipeline compressor", related: ["asset:odhav-pipeline"] },
  { id: "page:contractors", title: "Contractor Safety Scorecard", description: "Contractor governance, certifications, incident tracking.", group: "Pages", href: "/safety/contractor-safety", keywords: "contractor vendor audit third party" },
  { id: "page:safety-emergency", title: "Emergency Dashboard", description: "Live SOS triage, CCTV violations, crew dispatch.", group: "Pages", href: "/safety/emergency", keywords: "sos cctv incident live triage", priority: "Critical", related: ["page:gascare"] },
  { id: "page:intel", title: "Intelligence Dashboard", description: "Executive rollup with overnight AI briefing.", group: "Pages", href: "/intelligence", keywords: "executive management briefing bi" },
  { id: "page:rev-guard-intel", title: "Revenue Guard (Intelligence)", description: "₹27.3L revenue-at-risk analytics and model precision.", group: "Pages", href: "/intelligence/revenue-guard", keywords: "revenue recovery analytics fraud money", related: ["page:rev-guard-ops"] },
  { id: "page:sla-intel", title: "SLA Sentinel (Intelligence)", description: "Compensation avoided, breach forecast, compliance posture.", group: "Pages", href: "/intelligence/sla", keywords: "compensation payout forecast money", related: ["page:sla-ops"] },
  { id: "page:command", title: "Command Center", description: "Network posture, supply uptime, atmospheric conditions.", group: "Pages", href: "/intelligence/command", keywords: "network uptime posture grid" },
  { id: "page:insights", title: "Operational Insights", description: "AI recommendations, forecasts, optimization suggestions.", group: "Pages", href: "/intelligence/insights", keywords: "insights ai optimization suggestions forecast" },
];

// ══════════════════════════════════════════════════════════════
// Entities from the shared operational model
// ══════════════════════════════════════════════════════════════

const customers: SearchEntry[] = [
  {
    id: "customer:riddhi", title: `${currentCustomer.name} · ${currentCustomer.id}`,
    description: `${currentCustomer.type} PNG customer · ${currentCustomer.area}.`,
    group: "Customers", href: "/customer", keywords: "riddhi mehta account holder",
    status: "Active", updated: "Today",
    summary: "Health score healthy, one bill due (₹1,980), inspection due in 45 days, TrustPoints tier: Safety Champion.",
    related: ["bill:now", "page:health", "page:trustpoints"],
    actions: [{ label: "Open dashboard", href: "/customer" }, { label: "Health score", href: "/customer/health" }],
  },
  ...slaTickets.map((t) => ({
    id: `consumer:${t.id}`, title: t.consumer.split(" · ")[0],
    description: `${t.consumer.split(" · ")[1] ?? ""} · ${t.area} · linked to ticket ${t.id} (${t.type}).`,
    group: "Customers", href: "/safety/sla-sentinel", keywords: "consumer account",
    status: t.status, updated: t.raised,
    summary: `Open ${t.cat} ticket "${t.type}" at ${t.risk}% breach risk · assigned: ${t.assigned}.`,
    related: [`ticket:${t.id}`],
  })),
];

const bills: SearchEntry[] = currentCustomer.bills.map((bill, index) => ({
  id: index === 0 ? "bill:now" : `bill:${bill.period}`,
  title: `Bill · ${bill.cycle}`,
  description: `${bill.units} SCM · ₹${bill.amount.toLocaleString("en-IN")} · ${bill.status}${bill.paidOn ? ` on ${bill.paidOn}` : ""}.`,
  group: "Bills", href: "/customer/explainbill",
  keywords: "bill invoice billing statement",
  status: bill.status, priority: bill.status === "Due" ? "High" as const : undefined,
  updated: bill.paidOn ?? "Due Jul 22",
  summary: index === 0 ? "Winter heating drove the increase — leak probability low, seasonal pattern matches last year." : "Settled on time · contributes to your 12-bill on-time payment streak.",
  related: ["page:explainbill", "action:explain-bill"],
  actions: [{ label: "Explain this bill", href: "/customer/explainbill" }],
}));

const tickets: SearchEntry[] = slaTickets.map((t) => ({
  id: `ticket:${t.id}`, title: `${t.id} · ${t.type}`,
  description: `${t.consumer} · ${t.area} · ${t.cat} SLA class · ${t.priority}.`,
  group: "SLA tickets", href: "/safety/sla-sentinel",
  keywords: "sla ticket pngrb deadline breach complaint",
  status: t.status, updated: t.raised,
  priority: t.priority === "P1" ? "Critical" as const : t.priority === "P2" ? "High" as const : "Medium" as const,
  summary: `${t.risk}% breach risk · ${t.reasons[0] ?? ""} · assigned: ${t.assigned}.`,
  related: [`consumer:${t.id}`, "page:sla-ops", "page:sla-intel"],
  actions: [{ label: "Open in SLA Sentinel", href: "/safety/sla-sentinel" }],
}));

const cases: SearchEntry[] = revCases.map((c) => ({
  id: `case:${c.id}`, title: `${c.id} · ${c.type}`,
  description: `${c.consumer} (${c.account}) · ${c.area} · risk score ${c.score}/100.`,
  group: "Revenue cases", href: "/safety/rev-guard",
  keywords: "revenue theft tamper fraud bypass investigation",
  status: c.stage, updated: c.detectedAt,
  priority: c.severity === "High" ? "High" as const : c.severity === "Medium" ? "Medium" as const : "Low" as const,
  summary: `Consumption dropped ${c.drop}% vs a neighbourhood average of ${c.neighbourhood} SCM · exposure ₹${c.loss.toLocaleString("en-IN")}/month · confidence ${c.confidence}%.`,
  related: ["page:rev-guard-ops", "page:rev-guard-intel"],
  actions: [{ label: "Open investigation", href: "/safety/rev-guard" }],
}));

const zoneData: Array<[string, string, string, string]> = [
  ["naranpura", "Naranpura Inlet Line", "Critical", "PPM above critical threshold — field response required"],
  ["bopal", "Bopal Distribution Hub", "Safe", "All telemetry nominal"],
  ["satellite", "Satellite Pressure Reg. Station", "Safe", "All telemetry nominal"],
  ["chandkheda", "Chandkheda CNG Compressor", "Warning", "Pressure trending low"],
  ["gota", "Gota Feeder Main", "Safe", "All telemetry nominal"],
  ["vastral", "Vastral Industrial Cluster", "Warning", "Flow variance under observation"],
];

const zones: SearchEntry[] = zoneData.map(([id, name, status, note]) => ({
  id: `zone:${id}`, title: name,
  description: `Monitored grid zone · live PPM, pressure, temperature, and flow telemetry.`,
  group: "Zones & stations", href: "/safety/dashboard-gas-guard",
  keywords: "zone grid ppm pressure telemetry pipeline",
  status, updated: "Live",
  priority: status === "Critical" ? "Critical" as const : status === "Warning" ? "High" as const : undefined,
  summary: note + ".",
  related: ["page:gas-guard"],
  actions: [{ label: "Open live monitoring", href: "/safety/dashboard-gas-guard" }],
}));

const stations: SearchEntry[] = [
  ["naroda-mother", "Mother Station · Naroda"], ["bopal-cng", "CNG Station · Bopal"], ["vastral-cng", "CNG Station · Vastral"],
  ["odhav-cgs", "CGS · Odhav"], ["naroda-compressor", "Compressor Room · Naroda"], ["vatva-gate", "Gate Entry · Vatva"],
].map(([id, name]) => ({
  id: `station:${id}`, title: name,
  description: "Station readiness scorecard · inspections, telemetry health, staff readiness.",
  group: "Zones & stations", href: "/safety/station-readiness",
  keywords: "station readiness cng cgs compressor", updated: "Today",
  related: ["page:stations"],
}));

const assets: SearchEntry[] = [
  ["odhav-pipeline", "High-Pressure Carbon Pipeline · Odhav CGS", "Critical replacement window"],
  ["naroda-compressor", "Reciprocating Compressor · Naroda", "Maintenance warning"],
  ["vastral-valve", "Active Pressure Regulator Valve · Vastral", "Healthy"],
  ["naroda-meter", "Commercial Meter Assembly · Naroda Zone 2", "Healthy"],
  ["vatva-valve", "Emergency Isolation Gate Valve · Vatva", "Maintenance warning"],
].map(([id, name, status]) => ({
  id: `asset:${id}`, title: name,
  description: "Monitored asset ranked by predicted failure risk.",
  group: "Assets & contractors", href: "/safety/asset-health",
  keywords: "asset maintenance predictive pipeline valve meter compressor",
  status, priority: status === "Critical replacement window" ? "Critical" as const : status === "Maintenance warning" ? "High" as const : undefined,
  updated: "Today", related: ["page:assets"],
}));

const contractors: SearchEntry[] = ["SafeGas Solutions", "PipeWeld Corp", "MeterTech India", "GreenLine Services", "SecurePipe Ltd"].map((name) => ({
  id: `contractor:${name.toLowerCase().replaceAll(/\s+/g, "-")}`, title: name,
  description: "Third-party contractor · safety index, certifications, incident record.",
  group: "Assets & contractors", href: "/safety/contractor-safety",
  keywords: "contractor vendor audit certification", updated: "This week",
  related: ["page:contractors"],
}));

const engineers: SearchEntry[] = [
  ["ramesh", "Ramesh Kumar", "Safety Specialist", "324 visits · 4.8★ · Gas Safety Certified"],
  ["sunil", "Sunil Sharma", "Meter Specialist", "287 visits · 4.7★ · Meter Calibration Certified"],
  ["manoj", "Manoj Patel", "Appliance Technician", "241 visits · 4.9★ · Gas Appliance Certified"],
].map(([id, name, role, record]) => ({
  id: `engineer:${id}`, title: name,
  description: `${role} · ${record}.`,
  group: "Engineers", href: "/customer/appointment",
  keywords: "engineer technician specialist field visit",
  status: "Available", updated: "Today",
  summary: `${role} covering Ahmedabad zone · assigned automatically when a matching service is booked.`,
  related: ["page:appointment", "action:book-inspection"],
  actions: [{ label: "Book a visit", href: "/customer/appointment" }],
}));

// ══════════════════════════════════════════════════════════════
// Documentation — procedures, rules, knowledge articles
// ══════════════════════════════════════════════════════════════

const docs: SearchEntry[] = [
  { id: "doc:smell-gas", title: "If you smell gas — do and don't", description: "Leave the area, ventilate as you go, no switches, no phones indoors, no flames. Call 1906 from outside.", group: "Documentation", href: "/customer/gascare", keywords: "procedure safety leak smell emergency steps evacuation", priority: "Critical", summary: "The full guided version, including the tap-only silent mode, lives in Gas-Guard SOS.", related: ["action:sos", "doc:valve"] },
  { id: "doc:valve", title: "Isolation valve guide", description: "Where the valve is, when to close it, and when to skip it and evacuate.", group: "Documentation", href: "/customer/gascare", keywords: "valve isolation shut off meter procedure", summary: "Close clockwise only if it is safe and on your way out — never go back inside to reach it.", related: ["doc:smell-gas"] },
  { id: "doc:sla-classes", title: "PNGRB SLA classes · 24h / 7d / 15d", description: "Grievance deadlines by complaint class under the Consumer Protection Regulations, 2025.", group: "Documentation", href: "/safety/sla-sentinel", keywords: "pngrb regulation deadline compensation grievance rule", summary: "Missing a deadline triggers a mandatory compensation payout — SLA Sentinel tracks the live countdowns.", related: ["page:sla-ops", "page:sla-intel"] },
  { id: "doc:notice-rule", title: "48-hour interruption notice rule", description: "Planned supply interruptions require 48-hour advance notice with proof of delivery.", group: "Documentation", href: "/safety/smartnotify", keywords: "pngrb notice outage rule whatsapp proof audit", summary: "Auto-Notify sends the notice over WhatsApp and stores the delivery log as audit evidence.", related: ["action:send-notice"] },
  { id: "doc:emergency-numbers", title: "Emergency numbers · 1906 / 101 / 108", description: "Gas emergency 1906 · Fire 101 · Ambulance 108 — call from a safe outdoor location.", group: "Documentation", href: "/customer/gascare", keywords: "phone numbers helpline fire ambulance call", priority: "Critical", related: ["action:sos"] },
  { id: "doc:layout", title: "Signed layout approval (connection document)", description: "The document that unblocks meter installation for a new PNG connection.", group: "Documentation", href: "/customer/connection", keywords: "document upload layout approval installation blocker pdf", summary: "Uploading it clears the installation blocker and pulls the completion forecast forward.", related: ["page:connection"] },
];

export const staticIndex: SearchEntry[] = [...actions, ...pages, ...customers, ...bills, ...tickets, ...cases, ...zones, ...stations, ...assets, ...contractors, ...engineers, ...docs];

const byId = new Map(staticIndex.map((entry) => [entry.id, entry]));
export function entryById(id: string): SearchEntry | undefined { return byId.get(id); }

// ══════════════════════════════════════════════════════════════
// Live entities — appointments, feedback, and timeline events
// created in this browser profile
// ══════════════════════════════════════════════════════════════

export function dynamicEntries(): SearchEntry[] {
  if (typeof window === "undefined") return [];
  const entries: SearchEntry[] = [];
  try {
    const appointments = JSON.parse(window.localStorage.getItem("suraksha:appointments:GJ-559210") ?? "null");
    if (Array.isArray(appointments)) {
      for (const a of appointments) {
        if (a && typeof a.id === "string") entries.push({
          id: `appointment:${a.id}`, title: `${a.id} · ${a.service ?? "Appointment"}`,
          description: `${a.date ?? ""} · ${a.slot ?? ""} · ${a.engineer ?? ""}`.replace(/^ · | · $/g, ""),
          group: "Appointments", href: "/customer/appointment",
          keywords: "appointment visit booking apt", status: a.status, updated: a.createdAt,
          summary: a.status === "Cancelled" ? `Cancelled — ${a.cancellationReason ?? "no reason recorded"}.` : `Reason: ${a.reason ?? "service visit"} · cost ${a.cost ?? "—"}.`,
          related: ["page:appointment"],
          actions: [{ label: "Track visit", href: "/customer/appointment" }],
        });
      }
    }
  } catch { /* index stays usable without stored appointments */ }
  try {
    const voice = JSON.parse(window.localStorage.getItem("suraksha:voice-feedback:GJ-559210") ?? "null");
    if (Array.isArray(voice?.feedback)) {
      for (const f of voice.feedback) {
        if (f && typeof f.id === "string") entries.push({
          id: `feedback:${f.id}`, title: `${f.id} · ${f.category ?? "Feedback"}`,
          description: String(f.text ?? "").slice(0, 90),
          group: "Feedback", href: "/customer/voice",
          keywords: "feedback ticket complaint voc", status: f.status, updated: f.submitted,
          priority: f.priority === "High" ? "High" : undefined,
          summary: `Owner: ${f.owner ?? "Customer Experience"} · ${(f.timeline ?? []).length} lifecycle updates recorded.`,
          related: ["page:voice"],
        });
      }
    }
  } catch { /* index stays usable without stored feedback */ }
  try {
    for (const role of ["customer", "safety", "intelligence"] as const) {
      const feed = JSON.parse(window.localStorage.getItem(`suraksha:feed:${role}`) ?? "null");
      if (Array.isArray(feed)) {
        for (const e of feed.slice(0, 12)) {
          if (e && typeof e.id === "string" && typeof e.title === "string") entries.push({
            id: `event:${role}:${e.id}`, title: e.title,
            description: String(e.detail ?? ""),
            group: "Timeline", href: e.href ?? "/",
            keywords: `event notification update ${e.module ?? ""}`,
            status: e.read ? "Read" : "Unread",
            priority: e.priority === "critical" ? "Critical" : e.priority === "high" ? "High" : undefined,
            updated: typeof e.at === "number" ? new Date(e.at).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : undefined,
          });
        }
      }
    }
  } catch { /* index stays usable without the activity feeds */ }
  return entries;
}

// ══════════════════════════════════════════════════════════════
// Intent understanding — natural-language phrases boost curated
// destinations above plain text matches
// ══════════════════════════════════════════════════════════════

const INTENTS: Array<{ pattern: RegExp; ids: string[] }> = [
  { pattern: /(high|unusual|expensive|why|increase|costly|jyada|zyada).*(bill)|bill.*(high|increase|unusual|expensive|why)/i, ids: ["action:explain-bill", "bill:now", "page:explainbill", "page:health", "action:book-inspection"] },
  { pattern: /leak|gas smell|smell gas|hissing|gas nikal/i, ids: ["action:sos", "page:gascare", "page:safety-emergency", "doc:smell-gas", "zone:naranpura", "engineer:ramesh"] },
  { pattern: /emergen|sos|urgent help|fire|dizzy/i, ids: ["action:sos", "page:gascare", "page:safety-emergency", "doc:emergency-numbers"] },
  { pattern: /inspect/i, ids: ["action:book-inspection", "page:appointment", "page:health", "page:trustpoints", "engineer:ramesh"] },
  { pattern: /revenue|fraud|theft|tamper|bypass|recovery/i, ids: ["page:rev-guard-intel", "page:rev-guard-ops", "case:RG-0921", "case:RG-0915", "page:insights"] },
  { pattern: /complain|grievance|feedback|unhappy|issue/i, ids: ["action:create-complaint", "page:voice", "doc:sla-classes"] },
  { pattern: /breach|deadline|compensation|sla/i, ids: ["page:sla-ops", "page:sla-intel", "ticket:T-7714", "ticket:T-7720", "doc:sla-classes"] },
  { pattern: /outage|interruption|shutdown notice|planned/i, ids: ["action:send-notice", "page:smartnotify", "doc:notice-rule"] },
  { pattern: /points|reward|redeem|tier/i, ids: ["page:trustpoints", "page:health"] },
  { pattern: /new connection|png status|installation|meter install/i, ids: ["page:connection", "doc:layout"] },
];

export function detectIntent(query: string): string[] {
  for (const intent of INTENTS) if (intent.pattern.test(query)) return intent.ids;
  return [];
}

// ══════════════════════════════════════════════════════════════
// Scoring — prefix, substring, fuzzy (typo-tolerant), AND across terms
// ══════════════════════════════════════════════════════════════

function levenshtein(a: string, b: string, cap: number): number {
  if (Math.abs(a.length - b.length) > cap) return cap + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const value = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + cost);
      row.push(value);
      if (value < best) best = value;
    }
    if (best > cap) return cap + 1;
    prev = row;
  }
  return prev[b.length];
}

function termScore(term: string, tokens: string[], titleTokens: Set<string>): number {
  let best = 0;
  for (const token of tokens) {
    let score = 0;
    if (token === term) score = 5;
    else if (token.startsWith(term)) score = 4;
    else if (token.includes(term)) score = 3;
    else if (term.length >= 4) {
      const cap = term.length >= 6 ? 2 : 1;
      if (levenshtein(term, token, cap) <= cap) score = 2;
    }
    if (score > 0 && titleTokens.has(token)) score += 2;
    if (score > best) best = score;
  }
  return best;
}

const tokenCache = new Map<string, { tokens: string[]; title: Set<string> }>();

function tokensFor(entry: SearchEntry) {
  let cached = tokenCache.get(entry.id);
  if (!cached) {
    const title = entry.title.toLowerCase().split(/[^a-z0-9₹]+/).filter(Boolean);
    const rest = `${entry.description} ${entry.keywords ?? ""} ${entry.group} ${entry.status ?? ""}`.toLowerCase().split(/[^a-z0-9₹]+/).filter(Boolean);
    cached = { tokens: [...title, ...rest], title: new Set(title) };
    tokenCache.set(entry.id, cached);
  }
  return cached;
}

export function searchEverything(query: string, extra: SearchEntry[] = [], group?: string): SearchEntry[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const terms = q.split(/\s+/).filter(Boolean);
  const boosted = detectIntent(q);
  const pool = [...staticIndex, ...extra];

  const scored: Array<{ entry: SearchEntry; score: number }> = [];
  for (const entry of pool) {
    if (group && entry.group !== group) continue;
    const { tokens, title } = tokensFor(entry);
    let total = 0;
    let matchedAll = true;
    for (const term of terms) {
      const s = termScore(term, tokens, title);
      if (s === 0) { matchedAll = false; break; }
      total += s;
    }
    const boostIndex = boosted.indexOf(entry.id);
    if (boostIndex >= 0) total = Math.max(total, 1) + 40 - boostIndex * 2;
    else if (!matchedAll) continue;
    if (entry.isAction) total += 1;
    scored.push({ entry, score: total });
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, 18).map((item) => item.entry);
}

/** Closest indexed title for a query with no results — powers "did you mean". */
export function didYouMean(query: string): string | null {
  const q = query.trim().toLowerCase();
  if (q.length < 3) return null;
  let best: { label: string; distance: number } | null = null;
  for (const entry of staticIndex) {
    const { tokens } = tokensFor(entry);
    for (const token of tokens) {
      if (token.length < 4) continue;
      const distance = levenshtein(q, token, 3);
      if (distance <= 3 && (!best || distance < best.distance)) best = { label: token, distance };
    }
  }
  return best && best.distance <= Math.max(1, Math.floor(q.length / 3)) ? best.label : null;
}

export const popularSearches = ["gas leak", "high bill", "book inspection", "T-7720", "revenue recovered", "Naranpura", "48-hour notice"];

// ══════════════════════════════════════════════════════════════
// Search history — recents, frequency, pins
// ══════════════════════════════════════════════════════════════

export type HistoryItem = { id: string; title: string; group: string; href: string; count: number; at: number; pinned?: boolean };

const historyKey = "suraksha:search:history";

export function readHistory(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(historyKey) ?? "null");
    if (Array.isArray(parsed)) return parsed.filter((h): h is HistoryItem => h && typeof h.id === "string" && typeof h.title === "string");
  } catch { /* history is a convenience only */ }
  return [];
}

export function recordVisit(entry: SearchEntry) {
  try {
    const history = readHistory();
    const existing = history.find((h) => h.id === entry.id);
    const next: HistoryItem[] = existing
      ? history.map((h) => (h.id === entry.id ? { ...h, count: h.count + 1, at: Date.now() } : h))
      : [{ id: entry.id, title: entry.title, group: entry.group, href: entry.href, count: 1, at: Date.now() }, ...history];
    window.localStorage.setItem(historyKey, JSON.stringify(next.sort((a, b) => b.at - a.at).slice(0, 30)));
  } catch { /* history is a convenience only */ }
}

export function togglePin(id: string): HistoryItem[] {
  const next = readHistory().map((h) => (h.id === id ? { ...h, pinned: !h.pinned } : h));
  try { window.localStorage.setItem(historyKey, JSON.stringify(next)); } catch { /* ignore */ }
  return next;
}
