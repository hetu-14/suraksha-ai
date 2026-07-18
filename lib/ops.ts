// ---- Canonical operational state for SuRaksha AI ----
// Single source of truth shared by the Safety & Operations suite and the
// Business Intelligence suite. Every KPI shown to an operator or an executive
// derives from the entities and metrics below so the two consoles can never
// contradict each other.

// ══════════════════════════════════════════════════════════════
// PNGRB SLA tickets — one queue, two framings
// (operational countdown in /safety, financial exposure in /intelligence)
// ══════════════════════════════════════════════════════════════

export type SlaStatus = "Met" | "At Risk" | "Breached" | "Resolved";

export type SlaTicket = {
  id: string;
  cat: "24h" | "7d" | "15d";
  type: string;
  area: string;
  consumer: string;
  priority: "P1" | "P2" | "P3";
  slaHours: number;
  elapsedHours: number;
  risk: number; // breach probability %
  status: SlaStatus;
  assigned: string;
  reasons: string[];
  sentiment: "Negative" | "Neutral";
  raised: string;
};

export const slaTickets: SlaTicket[] = [
  { id: "T-7720", cat: "24h", type: "Smell complaint", area: "Odhav", consumer: "Geeta Nair · C-0812", priority: "P1", slaHours: 24, elapsedHours: 23.08, risk: 91, status: "At Risk", assigned: "Unassigned", reasons: ["No engineer assigned", "Raised 23 hours ago", "Engineer workload high in Odhav"], sentiment: "Negative", raised: "Yesterday · 10:05 AM" },
  { id: "T-7741", cat: "24h", type: "Gas leak", area: "Maninagar", consumer: "Rajesh Shah · C-1047", priority: "P1", slaHours: 24, elapsedHours: 21.85, risk: 78, status: "At Risk", assigned: "Ramesh Kumar", reasons: ["Emergency protocol active", "Field team en route", "Access confirmation pending"], sentiment: "Neutral", raised: "Yesterday · 11:20 AM" },
  { id: "T-7681", cat: "24h", type: "Regulator fault", area: "Ghatlodia", consumer: "Farooq Ahmed · C-0556", priority: "P2", slaHours: 24, elapsedHours: 20.67, risk: 70, status: "At Risk", assigned: "Unassigned", reasons: ["No engineer assigned", "Spare regulator stock check pending"], sentiment: "Neutral", raised: "Yesterday · 12:30 PM" },
  { id: "T-7714", cat: "24h", type: "Meter fault", area: "Satellite", consumer: "Meenal Joshi · C-2831", priority: "P2", slaHours: 24, elapsedHours: 26, risk: 96, status: "Breached", assigned: "Unassigned", reasons: ["No engineer assigned", "Average resolution time exceeds SLA", "Meter test pending"], sentiment: "Negative", raised: "2 days ago · 08:30 AM" },
  { id: "T-7738", cat: "7d", type: "Pressure low", area: "Vastral", consumer: "Dilip Mehta · C-1922", priority: "P2", slaHours: 168, elapsedHours: 159, risk: 64, status: "At Risk", assigned: "Sunil Sharma", reasons: ["Zone regulator inspection scheduled", "Customer reschedule requested"], sentiment: "Neutral", raised: "Jul 11 · 10:00 AM" },
  { id: "T-7699", cat: "7d", type: "Meter relocation", area: "Vatva", consumer: "Kiran Patel · C-3341", priority: "P3", slaHours: 168, elapsedHours: 137, risk: 48, status: "Met", assigned: "Manoj Patel", reasons: ["Appointment confirmed", "Materials allocated"], sentiment: "Neutral", raised: "Jul 12 · 02:00 PM" },
  { id: "T-7702", cat: "15d", type: "Billing dispute", area: "Naroda", consumer: "Priya Mehta · C-4451", priority: "P3", slaHours: 360, elapsedHours: 288, risk: 22, status: "Met", assigned: "Billing desk · R. Iyer", reasons: ["Consumption audit in progress"], sentiment: "Neutral", raised: "Jul 06 · 09:15 AM" },
];

/** Seconds remaining before the PNGRB deadline (0 when already breached). */
export function ticketSecondsLeft(t: SlaTicket): number {
  return Math.max(0, Math.round((t.slaHours - t.elapsedHours) * 3600));
}

/** Crew or desk recommended for priority routing, per ticket. */
export const escalationCrew: Record<string, string> = {
  "T-7741": "Unit GA-4 · S. Patel",
  "T-7720": "Unit GA-2 · M. Qureshi",
  "T-7681": "Unit GA-4 · S. Patel",
  "T-7714": "Meter cell · Field Team 4",
  "T-7738": "Zone crew VS-1 · K. Raval",
  "T-7699": "Zone crew VT-2 · D. Chauhan",
  "T-7702": "Billing desk · R. Iyer",
};

// Month-to-date compliance posture (same number in every console).
export const slaMetrics = {
  complianceMTD: 94.2,
  complianceTarget: 95,
  breachesPreventedMTD: 63,
  compensationAvoidedMTD: 480_000, // ₹4.8L
  meanResolutionHours: 17,
  firstTimeResolution: 82,
  breachForecast24h: 5,
};

// ══════════════════════════════════════════════════════════════
// Revenue Guard — one investigation portfolio, two framings
// ══════════════════════════════════════════════════════════════

export const revLifecycle = ["Detected", "Assigned", "Field Visit", "Evidence Collected", "Action Taken", "Recovered"] as const;
export type RevLifecycle = (typeof revLifecycle)[number];
export type RevSeverity = "High" | "Medium" | "Low";

export type RevCase = {
  id: string;
  consumer: string;
  account: string;
  area: string;
  type: string;
  loss: number; // ₹ exposure this month
  severity: RevSeverity;
  stage: RevLifecycle;
  detectedAt: string;
  score: number;
  consumption: number;
  neighbourhood: number;
  drop: number;
  confidence: number;
  pastAlerts: number;
  previousVerification: string;
  timeline: string[];
  inspections: string[];
  complaints: string[];
  evidence: string[];
  /** Six-point expected vs actual consumption fingerprint (SCM). */
  normal: number[];
  actual: number[];
};

export const revCases: RevCase[] = [
  { id: "RG-0921", consumer: "Rajesh Shah", account: "C-1047", area: "Naranpura", type: "Meter Bypass", loss: 18400, severity: "High", stage: "Detected", detectedAt: "Today · 08:32 AM", score: 92, consumption: 12, neighbourhood: 48, drop: 62, confidence: 94, pastAlerts: 3, previousVerification: "Yes · Nov 2025", timeline: ["Jul 2025 · Consumption began declining", "Jan 2026 · Below expected seasonal range", "Today · AI anomaly alert generated"], inspections: ["Nov 2025 · Meter verification completed", "Aug 2024 · Safety inspection passed"], complaints: ["No supply complaints in last 12 months"], evidence: ["Consumption anomaly detected", "Previous 12-month pattern broken", "Meter inspection pending", "Neighbourhood variance high"], normal: [48, 47, 49, 48, 47, 48], actual: [48, 47, 46, 24, 14, 12] },
  { id: "RG-0915", consumer: "Kiran Patel", account: "C-3341", area: "Naranpura", type: "Unauthorized Tap", loss: 23100, severity: "High", stage: "Field Visit", detectedAt: "Jul 12 · 06:50 AM", score: 96, consumption: 9, neighbourhood: 51, drop: 75, confidence: 97, pastAlerts: 2, previousVerification: "Yes · Sep 2025", timeline: ["Sep 2025 · Prior field verification", "Jul 12 · Repeated anomaly detected", "Today · Inspector visit scheduled"], inspections: ["Sep 2025 · Connection verification completed"], complaints: ["No supply complaints in last 12 months"], evidence: ["Repeat pattern detected", "Neighbourhood variance high", "Potential unauthorized tap route"], normal: [51, 50, 52, 51, 50, 51], actual: [51, 50, 38, 20, 11, 9] },
  { id: "RG-0920", consumer: "Meenal Joshi", account: "C-2831", area: "Satellite", type: "Seal Tampering", loss: 7200, severity: "Medium", stage: "Evidence Collected", detectedAt: "Yesterday · 04:15 PM", score: 81, consumption: 21, neighbourhood: 46, drop: 44, confidence: 89, pastAlerts: 1, previousVerification: "Yes · Feb 2026", timeline: ["Feb 2026 · Meter verified", "Yesterday · Seal variance flagged", "Today · Photo evidence reviewed"], inspections: ["Feb 2026 · Meter verification completed"], complaints: ["Mar 2026 · Billing query resolved"], evidence: ["Seal mismatch observed", "Consumption anomaly detected", "Field image verification complete"], normal: [46, 45, 47, 46, 45, 46], actual: [46, 45, 44, 33, 24, 21] },
  { id: "RG-0918", consumer: "Farooq Ahmed", account: "C-0556", area: "Chandkheda", type: "Slow Meter", loss: 9850, severity: "Medium", stage: "Assigned", detectedAt: "Jul 13 · 11:02 AM", score: 78, consumption: 28, neighbourhood: 53, drop: 39, confidence: 86, pastAlerts: 0, previousVerification: "No", timeline: ["Apr 2026 · Meter variance detected", "Jul 13 · Case assigned to field team"], inspections: ["No inspection in previous 18 months"], complaints: ["No complaint history"], evidence: ["Meter reading variance detected", "Consumption trend below cohort"], normal: [53, 52, 54, 53, 52, 53], actual: [53, 52, 50, 41, 32, 28] },
  { id: "RG-0912", consumer: "Geeta Nair", account: "C-0812", area: "Gota", type: "Meter Bypass", loss: 5600, severity: "Low", stage: "Recovered", detectedAt: "Jul 10 · 09:20 AM", score: 62, consumption: 37, neighbourhood: 49, drop: 21, confidence: 78, pastAlerts: 0, previousVerification: "No", timeline: ["Jul 10 · Alert generated", "Jul 12 · Meter replaced", "Jul 14 · Recovery recorded"], inspections: ["Jul 12 · Meter test failed and replacement completed"], complaints: ["No complaint history"], evidence: ["Meter reading variance detected", "Recovery payment recorded"], normal: [49, 48, 50, 49, 48, 49], actual: [49, 48, 47, 43, 39, 37] },
  { id: "RG-0908", consumer: "Dilip Mehta", account: "C-1922", area: "Vastral", type: "Slow Meter", loss: 11350, severity: "High", stage: "Recovered", detectedAt: "Jul 08 · 03:45 PM", score: 88, consumption: 18, neighbourhood: 45, drop: 58, confidence: 92, pastAlerts: 1, previousVerification: "Yes · Dec 2025", timeline: ["Jul 08 · Alert generated", "Jul 09 · Meter tested", "Jul 11 · Recovery recorded"], inspections: ["Jul 09 · Slow meter confirmed and replaced"], complaints: ["No complaint history"], evidence: ["Meter test failure confirmed", "Consumption pattern restored after replacement"], normal: [45, 44, 46, 45, 44, 45], actual: [45, 44, 42, 31, 22, 18] },
];

// Portfolio-level posture. The six cases above are the highest-score subset
// of the 142 flagged accounts; the ₹27.3L figure is the annualized exposure
// across the full flagged portfolio.
export const revMetrics = {
  accountsScanned: 241_860,
  flaggedHighRisk: 142,
  atRiskAnnualized: "₹27.3L",
  modelPrecision: 91,
  alertsGenerated: 100,
  alertsValidated: 91,
  falsePositives: 9,
  detectedMTD: 75_500,
  recoveredMTD: 48_200,
};

// ══════════════════════════════════════════════════════════════
// Live incident bridge — Customer App SOS → Safety control room
// ══════════════════════════════════════════════════════════════

export type LiveIncident = {
  id: string;
  source: "customer-app";
  area: string;
  address: string;
  type: string;
  risk: "Critical" | "High";
  startedAt: number;
  status: "active" | "resolved";
};

export const liveIncidentKey = "suraksha:incident:live";

export function readLiveIncident(): LiveIncident | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(liveIncidentKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LiveIncident;
    return parsed && typeof parsed.id === "string" ? parsed : null;
  } catch {
    return null;
  }
}

export function writeLiveIncident(incident: LiveIncident | null) {
  if (typeof window === "undefined") return;
  try {
    if (incident) window.localStorage.setItem(liveIncidentKey, JSON.stringify(incident));
    else window.localStorage.removeItem(liveIncidentKey);
  } catch {
    // Browser storage is optional; the customer flow stays usable without the bridge.
  }
}

// ══════════════════════════════════════════════════════════════
// Shared formatting
// ══════════════════════════════════════════════════════════════

export const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

export const inrLakh = (n: number) => `₹${(n / 100_000).toLocaleString("en-IN", { maximumFractionDigits: 1 })}L`;
