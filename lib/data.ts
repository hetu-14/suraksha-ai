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
