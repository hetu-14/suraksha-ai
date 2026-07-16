"use client";

import { useState } from "react";
import { Card, Kpi, Badge } from "@/components/ui";
import Typewriter from "@/components/Typewriter";
import CountUp from "@/components/CountUp";
import { TrendChart } from "@/components/Charts";
import {
  Timer, CheckCircle, AlertTriangle, Clock, TrendingUp,
  Filter, Download, Search, ChevronDown, Activity,
  ShieldCheck, Bell, Zap, User, MapPin, Sparkles,
} from "lucide-react";

type SLAStatus = "Met" | "At Risk" | "Breached";
type Priority = "P1" | "P2" | "P3";

interface SLAItem {
  id: string;
  type: string;
  consumer: string;
  area: string;
  priority: Priority;
  slaHrs: number;
  elapsedHrs: number;
  status: SLAStatus;
  assignedTo: string;
  raisedAt: string;
}

const SLA_ITEMS: SLAItem[] = [
  { id: "SLA-1142", type: "Gas Leak Complaint", consumer: "C-1047 · Rajesh Shah", area: "Bopal", priority: "P1", slaHrs: 2, elapsedHrs: 1.2, status: "Met", assignedTo: "Ramesh Kumar", raisedAt: "Today 09:10 AM" },
  { id: "SLA-1140", type: "New Connection Install", consumer: "C-4451 · Priya Mehta", area: "Gota", priority: "P2", slaHrs: 48, elapsedHrs: 47.5, status: "At Risk", assignedTo: "Sunil Sharma", raisedAt: "Jul 13 10:00 AM" },
  { id: "SLA-1139", type: "Meter Fault Complaint", consumer: "C-2831 · Meenal Joshi", area: "Satellite", priority: "P2", slaHrs: 24, elapsedHrs: 26.2, status: "Breached", assignedTo: "Unassigned", raisedAt: "Jul 13 08:30 AM" },
  { id: "SLA-1137", type: "Safety Inspection Visit", consumer: "C-3341 · Kiran Patel", area: "Naranpura", priority: "P3", slaHrs: 72, elapsedHrs: 14, status: "Met", assignedTo: "Manoj Patel", raisedAt: "Jul 14 02:00 PM" },
  { id: "SLA-1136", type: "Pressure Irregularity", consumer: "C-0812 · Geeta Nair", area: "Gota", priority: "P1", slaHrs: 4, elapsedHrs: 4.8, status: "Breached", assignedTo: "Unassigned", raisedAt: "Jul 13 04:30 PM" },
  { id: "SLA-1135", type: "Billing Dispute Callback", consumer: "C-0556 · Farooq Ahmed", area: "Chandkheda", priority: "P3", slaHrs: 48, elapsedHrs: 10, status: "Met", assignedTo: "Support Team", raisedAt: "Jul 14 12:00 PM" },
  { id: "SLA-1132", type: "Appliance Safety Check", consumer: "C-1922 · Dilip Mehta", area: "Vastral", priority: "P2", slaHrs: 48, elapsedHrs: 22, status: "Met", assignedTo: "Ramesh Kumar", raisedAt: "Jul 13 01:00 PM" },
];

const TREND = [
  { day: "Mon", alerts: 12, resolved: 11 },
  { day: "Tue", alerts: 8, resolved: 8 },
  { day: "Wed", alerts: 15, resolved: 13 },
  { day: "Thu", alerts: 10, resolved: 10 },
  { day: "Fri", alerts: 7, resolved: 7 },
  { day: "Sat", alerts: 9, resolved: 8 },
  { day: "Sun", alerts: 5, resolved: 5 },
];

const PRIORITY_RULES = [
  { priority: "P1", sla: "2 hours", type: "Gas Leak / Emergency", color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
  { priority: "P2", sla: "24–48 hours", type: "Connection / Meter", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
  { priority: "P3", sla: "72 hours", type: "Routine / Admin", color: "text-sky-600", bg: "bg-sky-50", border: "border-sky-200" },
];

const STATUS_TONE: Record<SLAStatus, "brand" | "amber" | "red"> = { Met: "brand", "At Risk": "amber", Breached: "red" };
const PRIORITY_TONE: Record<Priority, "red" | "amber" | "sky"> = { P1: "red", P2: "amber", P3: "sky" };

function SLABar({ elapsed, total, status }: { elapsed: number; total: number; status: SLAStatus }) {
  const pct = Math.min((elapsed / total) * 100, 100);
  const color = status === "Met" ? "#10b981" : status === "At Risk" ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-ink-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[10px] font-mono text-ink-500 shrink-0">{elapsed.toFixed(1)}h / {total}h</span>
    </div>
  );
}

export default function SLASentinel() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | SLAStatus>("All");

  const filtered = SLA_ITEMS.filter((s) => {
    const matchSearch = s.consumer.toLowerCase().includes(search.toLowerCase()) ||
      s.id.toLowerCase().includes(search.toLowerCase()) ||
      s.area.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const metCount = SLA_ITEMS.filter((s) => s.status === "Met").length;
  const atRiskCount = SLA_ITEMS.filter((s) => s.status === "At Risk").length;
  const breachedCount = SLA_ITEMS.filter((s) => s.status === "Breached").length;
  const slaScore = Math.round((metCount / SLA_ITEMS.length) * 100);

  return (
    <div className="space-y-6 reveal">
      {/* Breach Alert */}
      {breachedCount > 0 && (
        <div className="rounded-2xl bg-red-600 text-white p-4 flex items-center justify-between gap-4 anim-fade-up shadow-lg shadow-red-600/30">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 animate-pulse shrink-0" />
            <div>
              <p className="font-bold">{breachedCount} SLA BREACH{breachedCount > 1 ? "ES" : ""} DETECTED</p>
              <p className="text-red-200 text-xs">Action required to prevent PNGRB non-compliance</p>
            </div>
          </div>
          <Badge tone="red">BREACH</Badge>
        </div>
      )}

      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-ink-900 via-ink-900 to-violet-950 text-white p-6 relative overflow-hidden shadow-soft">
        <div className="floaty absolute -right-10 -top-10 w-56 h-56 bg-violet-500/20 rounded-full blur-3xl" />
        <div className="relative">
          <p className="text-violet-300 text-xs font-semibold uppercase tracking-widest">CGD Compliance & SLA</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">
            <Typewriter speed={40} segments={[{ text: "SLA Sentinel " }, { text: "⏱️", cls: "" }]} />
          </h1>
          <p className="text-ink-300 mt-2 text-sm max-w-2xl">
            Real-time SLA tracking for all consumer complaints and service requests. Ensures PNGRB compliance with intelligent breach alerts and priority routing.
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 anim-fade-up">
        <Kpi label="SLA Compliance Score" value={`${slaScore}%`} sub="Target: 95%+" accent="text-brand-600" icon={<ShieldCheck className="w-4 h-4" />} />
        <Kpi label="SLA Breached" value={<CountUp to={breachedCount} />} sub="Immediate action" accent="text-red-600" icon={<AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />} />
        <Kpi label="At Risk" value={<CountUp to={atRiskCount} />} sub="Within 2 hours of breach" accent="text-amber-600" icon={<Timer className="w-4 h-4" />} />
        <Kpi label="Met on Time" value={<CountUp to={metCount} />} sub="This week" icon={<CheckCircle className="w-4 h-4" />} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 anim-fade-up">
        {/* Trend Chart */}
        <Card className="lg:col-span-2 p-5">
          <h3 className="font-bold text-ink-900 mb-3">Service Requests — Last 7 Days</h3>
          <TrendChart data={TREND} />
        </Card>

        {/* SLA Priority Rules */}
        <Card className="p-5">
          <h3 className="font-bold text-ink-900 mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-500" /> Priority SLA Matrix
          </h3>
          <div className="space-y-3">
            {PRIORITY_RULES.map((r) => (
              <div key={r.priority} className={`rounded-xl p-3 border ${r.border} ${r.bg}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-bold ${r.color}`}>{r.priority} — {r.sla}</span>
                  <Badge tone={PRIORITY_TONE[r.priority as Priority]}>{r.priority}</Badge>
                </div>
                <p className="text-[11px] text-ink-600">{r.type}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-ink-100">
            <p className="text-xs font-semibold text-ink-800 mb-2">AI Auto-Escalation Rules</p>
            <ul className="text-[11px] text-ink-500 space-y-1.5">
              <li className="flex gap-1.5"><Bell className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" /> 80% SLA elapsed → Supervisor alert</li>
              <li className="flex gap-1.5"><Bell className="w-3 h-3 text-red-500 shrink-0 mt-0.5" /> 100% elapsed → Auto-breach + PNGRB log</li>
              <li className="flex gap-1.5"><Zap className="w-3 h-3 text-violet-500 shrink-0 mt-0.5" /> Unassigned P1 → SMS to field manager</li>
            </ul>
          </div>
        </Card>
      </div>

      {/* SLA Table */}
      <Card className="p-6 anim-fade-up">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <h3 className="font-bold text-ink-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-violet-500" /> Active SLA Tickets
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search ID, consumer, area..."
                className="pl-8 pr-3 py-2 text-xs border border-ink-200 rounded-xl focus:outline-none focus:border-violet-400 bg-white w-52"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "All" | SLAStatus)}
              className="text-xs border border-ink-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-violet-400"
            >
              {["All", "Met", "At Risk", "Breached"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
            <button className="flex items-center gap-1.5 text-xs border border-ink-200 rounded-xl px-3 py-2 hover:bg-ink-50 transition text-ink-600">
              <Download className="w-3 h-3" /> Export
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-ink-500 font-semibold uppercase tracking-wider border-b border-ink-100">
                {["Ticket", "Type", "Consumer", "Priority", "SLA Progress", "Status", "Assigned", "Raised"].map((h) => (
                  <th key={h} className="pb-3 pr-4 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-50">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-ink-50/50 transition">
                  <td className="py-3 pr-4 font-mono text-xs text-ink-600 whitespace-nowrap">{s.id}</td>
                  <td className="py-3 pr-4 font-medium text-ink-800 whitespace-nowrap max-w-[160px] truncate">{s.type}</td>
                  <td className="py-3 pr-4 text-ink-600 whitespace-nowrap">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate max-w-[120px]">{s.consumer}</span>
                    </span>
                  </td>
                  <td className="py-3 pr-4 whitespace-nowrap">
                    <Badge tone={PRIORITY_TONE[s.priority]}>{s.priority}</Badge>
                  </td>
                  <td className="py-3 pr-4 min-w-[140px]">
                    <SLABar elapsed={s.elapsedHrs} total={s.slaHrs} status={s.status} />
                  </td>
                  <td className="py-3 pr-4 whitespace-nowrap">
                    <Badge tone={STATUS_TONE[s.status]}>{s.status}</Badge>
                  </td>
                  <td className="py-3 pr-4 text-xs text-ink-600 whitespace-nowrap">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3 shrink-0" /> {s.assignedTo}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-xs text-ink-400 whitespace-nowrap">{s.raisedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="text-center text-ink-400 py-8 text-sm">No tickets match your search.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
