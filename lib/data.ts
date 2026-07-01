// ---- Shared mock data for the SuRaksha AI prototype ----

export type Bill = {
  cycle: string;
  period: string;
  units: number;
  amount: number;
  status: "Paid" | "Due";
  paidOn?: string;
};

export type Customer = {
  id: string;
  name: string;
  type: "Domestic" | "Commercial";
  area: string;
  verdict: "normal" | "leak" | "under";
  reason: string;
  bills: Bill[];
};

export const currentCustomer: Customer = {
  id: "GJ-559210",
  name: "Riddhi Mehta",
  type: "Domestic",
  area: "Maninagar, Ahmedabad",
  verdict: "normal",
  reason:
    "Your latest bill is higher mainly because of winter heating — water-heater usage typically rises 70–90% in Dec–Jan. Your readings are consistent with previous winters and there is no sign of a leak. This is expected seasonal usage.",
  bills: [
    { cycle: "Jan–Feb 2026", period: "Now", units: 815, amount: 1980, status: "Due" },
    { cycle: "Nov–Dec 2025", period: "C5", units: 402, amount: 1010, status: "Paid", paidOn: "12 Dec 2025" },
    { cycle: "Sep–Oct 2025", period: "C4", units: 408, amount: 1025, status: "Paid", paidOn: "10 Oct 2025" },
    { cycle: "Jul–Aug 2025", period: "C3", units: 430, amount: 1080, status: "Paid", paidOn: "09 Aug 2025" },
    { cycle: "May–Jun 2025", period: "C2", units: 395, amount: 995, status: "Paid", paidOn: "11 Jun 2025" },
    { cycle: "Mar–Apr 2025", period: "C1", units: 412, amount: 1035, status: "Paid", paidOn: "08 Apr 2025" },
  ],
};

export const usageSeries = currentCustomer.bills
  .slice()
  .reverse()
  .map((b) => ({ name: b.period, units: b.units }));

// ---- SafeZone AI (user premises safety) ----
export type SafetyAlert = {
  time: string;
  level: "info" | "warn" | "critical";
  text: string;
};

export const safetyAlerts: SafetyAlert[] = [
  { time: "just now", level: "info", text: "All sensors nominal — no gas signature detected." },
  { time: "2h ago", level: "warn", text: "Brief ventilation drop detected in kitchen — auto-cleared." },
  { time: "Yesterday", level: "info", text: "Monthly self-test completed — detector healthy." },
  { time: "3 days ago", level: "critical", text: "Elevated methane reading — you were alerted, resolved in 4m." },
];

// ---- Admin: RevGuard ----
export type Anomaly = {
  id: string;
  area: string;
  pattern: string;
  risk: string;
  score: number;
  normal: number[];
  actual: number[];
};

export const anomalies: Anomaly[] = [
  { id: "GJ-118402", area: "Naroda", pattern: "Flatline (tamper)", risk: "₹18k/yr", score: 97, normal: [210, 205, 212, 208, 209, 211], actual: [210, 205, 90, 40, 38, 39] },
  { id: "GJ-880142", area: "Vastral", pattern: "Sudden drop", risk: "₹42k/yr", score: 93, normal: [2100, 2050, 2080, 2120, 2090, 2080], actual: [2100, 2050, 2080, 2120, 1380, 1360] },
  { id: "GJ-220915", area: "Odhav", pattern: "Night spikes", risk: "₹11k/yr", score: 88, normal: [180, 176, 182, 179, 181, 178], actual: [180, 176, 182, 260, 255, 268] },
  { id: "GJ-501277", area: "Vatva", pattern: "Bypass signature", risk: "₹26k/yr", score: 84, normal: [420, 415, 418, 421, 419, 417], actual: [420, 415, 418, 210, 205, 208] },
  { id: "GJ-339810", area: "Ghatlodia", pattern: "Reverse anomaly", risk: "₹9k/yr", score: 79, normal: [150, 148, 152, 149, 151, 150], actual: [150, 148, 152, 149, 95, 92] },
];

// ---- Admin: SLA Sentinel ----
export type Ticket = {
  id: string;
  cat: "24h" | "7d" | "15d";
  label: string;
  left: number; // seconds
  risk: number;
};

export const tickets: Ticket[] = [
  { id: "T-7741", cat: "24h", label: "Gas leak — Maninagar", left: 2 * 3600 + 540, risk: 78 },
  { id: "T-7738", cat: "7d", label: "Pressure low — Vastral", left: 9 * 3600, risk: 64 },
  { id: "T-7720", cat: "24h", label: "Smell complaint — Odhav", left: 55 * 60, risk: 91 },
  { id: "T-7702", cat: "15d", label: "Billing dispute — Naroda", left: 3 * 24 * 3600, risk: 22 },
  { id: "T-7699", cat: "7d", label: "Meter relocation — Vatva", left: 31 * 3600, risk: 48 },
  { id: "T-7681", cat: "24h", label: "Regulator fault — Ghatlodia", left: 3 * 3600 + 1200, risk: 70 },
];

// ---- Admin: AutoNotify ----
export const zones = [
  { n: 1284, name: "Ward 7 — Maninagar" },
  { n: 842, name: "Sector 21 — Gandhinagar" },
  { n: 2109, name: "Vesu Ring Road — Surat" },
];

// ---- Admin: dashboard trend ----
export const trend = [
  { day: "Mon", alerts: 42, resolved: 40 },
  { day: "Tue", alerts: 38, resolved: 37 },
  { day: "Wed", alerts: 55, resolved: 53 },
  { day: "Thu", alerts: 47, resolved: 46 },
  { day: "Fri", alerts: 61, resolved: 60 },
  { day: "Sat", alerts: 58, resolved: 57 },
  { day: "Sun", alerts: 49, resolved: 49 },
];

export const workload = [
  { name: "GasGuard", value: 24, color: "#ef4444" },
  { name: "SLA Sentinel", value: 31, color: "#6366f1" },
  { name: "RevGuard", value: 18, color: "#f59e0b" },
  { name: "AutoNotify", value: 15, color: "#0ea5e9" },
  { name: "SafeZone", value: 12, color: "#8b5cf6" },
];

export const inr = (n: number) => "₹" + n.toLocaleString("en-IN");
