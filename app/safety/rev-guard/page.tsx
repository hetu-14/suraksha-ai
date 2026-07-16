"use client";

import { useState } from "react";
import { Card, Kpi, Badge } from "@/components/ui";
import Typewriter from "@/components/Typewriter";
import CountUp from "@/components/CountUp";
import { TrendChart, DonutChart } from "@/components/Charts";
import {
  ShieldAlert, AlertTriangle, TrendingDown, IndianRupee,
  MapPin, Search, Eye, Filter, Download, ChevronDown,
  Activity, Zap, Clock, CheckCircle,
} from "lucide-react";

const TREND = [
  { day: "Mon", alerts: 3, resolved: 2 },
  { day: "Tue", alerts: 5, resolved: 5 },
  { day: "Wed", alerts: 2, resolved: 2 },
  { day: "Thu", alerts: 7, resolved: 6 },
  { day: "Fri", alerts: 4, resolved: 4 },
  { day: "Sat", alerts: 8, resolved: 7 },
  { day: "Sun", alerts: 3, resolved: 3 },
];

const TAMPER_TYPES = [
  { name: "Meter Bypass", value: 34, color: "#ef4444" },
  { name: "Slow Meter", value: 28, color: "#f59e0b" },
  { name: "Seal Tampering", value: 22, color: "#8b5cf6" },
  { name: "Unauthorized Tap", value: 16, color: "#0ea5e9" },
];

type AlertStatus = "Open" | "Investigating" | "Resolved";

interface TamperAlert {
  id: string;
  consumer: string;
  area: string;
  type: string;
  loss: number;
  severity: "High" | "Medium" | "Low";
  status: AlertStatus;
  detectedAt: string;
}

const ALERTS: TamperAlert[] = [
  { id: "RG-0921", consumer: "C-1047 · Rajesh Shah", area: "Bopal", type: "Meter Bypass", loss: 18400, severity: "High", status: "Open", detectedAt: "Today 08:32 AM" },
  { id: "RG-0920", consumer: "C-2831 · Meenal Joshi", area: "Satellite", type: "Seal Tampering", loss: 7200, severity: "Medium", status: "Investigating", detectedAt: "Yesterday 4:15 PM" },
  { id: "RG-0918", consumer: "C-0556 · Farooq Ahmed", area: "Chandkheda", type: "Slow Meter", loss: 9850, severity: "Medium", status: "Investigating", detectedAt: "Jul 13 11:02 AM" },
  { id: "RG-0915", consumer: "C-3341 · Kiran Patel", area: "Naranpura", type: "Unauthorized Tap", loss: 23100, severity: "High", status: "Open", detectedAt: "Jul 12 06:50 AM" },
  { id: "RG-0912", consumer: "C-0812 · Geeta Nair", area: "Gota", type: "Meter Bypass", loss: 5600, severity: "Low", status: "Resolved", detectedAt: "Jul 10 09:20 AM" },
  { id: "RG-0908", consumer: "C-1922 · Dilip Mehta", area: "Vastral", type: "Slow Meter", loss: 11300, severity: "High", status: "Resolved", detectedAt: "Jul 08 03:45 PM" },
];

const SEVERITY_TONE: Record<string, "red" | "amber" | "sky"> = { High: "red", Medium: "amber", Low: "sky" };
const STATUS_TONE: Record<AlertStatus, "red" | "amber" | "brand"> = { Open: "red", Investigating: "amber", Resolved: "brand" };

export default function RevGuard() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"All" | AlertStatus>("All");

  const filtered = ALERTS.filter((a) => {
    const matchSearch = a.consumer.toLowerCase().includes(search.toLowerCase()) ||
      a.area.toLowerCase().includes(search.toLowerCase()) ||
      a.id.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "All" || a.status === filter;
    return matchSearch && matchFilter;
  });

  const totalLoss = ALERTS.reduce((s, a) => s + a.loss, 0);
  const openCount = ALERTS.filter((a) => a.status === "Open").length;
  const resolvedCount = ALERTS.filter((a) => a.status === "Resolved").length;

  return (
    <div className="space-y-6 reveal">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-ink-900 via-ink-900 to-red-950 text-white p-6 relative overflow-hidden shadow-soft">
        <div className="floaty absolute -right-10 -top-10 w-56 h-56 bg-red-500/20 rounded-full blur-3xl" />
        <div className="relative">
          <p className="text-red-300 text-xs font-semibold uppercase tracking-widest">CGD & Safety Suite</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">
            <Typewriter speed={40} segments={[{ text: "Rev-Guard " }, { text: "⚠️", cls: "" }]} />
          </h1>
          <p className="text-ink-300 mt-2 text-sm max-w-2xl">
            AI-driven revenue leakage detection system — identifies meter tampering, unauthorized connections, and billing anomalies in real time.
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 anim-fade-up">
        <Kpi label="Open Alerts" value={<CountUp to={openCount} />} sub="Requiring action" accent="text-red-600" icon={<ShieldAlert className="w-4 h-4 text-red-500 animate-pulse" />} />
        <Kpi label="Estimated Revenue Loss" value={`₹${(totalLoss / 1000).toFixed(1)}K`} sub="This month" accent="text-red-600" icon={<IndianRupee className="w-4 h-4" />} />
        <Kpi label="Resolved This Week" value={<CountUp to={resolvedCount} />} sub="Cases closed" icon={<CheckCircle className="w-4 h-4" />} />
        <Kpi label="Detection Accuracy" value="97.3%" sub="AI model confidence" accent="text-brand-600" icon={<Activity className="w-4 h-4" />} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 anim-fade-up">
        {/* Trend Chart */}
        <Card className="lg:col-span-2 p-5">
          <h3 className="font-bold text-ink-900 mb-3">Tamper Alerts — Last 7 Days</h3>
          <TrendChart data={TREND} />
        </Card>

        {/* Donut */}
        <Card className="p-5">
          <h3 className="font-bold text-ink-900 mb-3">Tamper Type Breakdown</h3>
          <DonutChart data={TAMPER_TYPES} />
        </Card>
      </div>

      {/* Alert Table */}
      <Card className="p-6 anim-fade-up">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <h3 className="font-bold text-ink-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" /> Revenue Leakage Alerts
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by ID, name, area..."
                className="pl-8 pr-3 py-2 text-xs border border-ink-200 rounded-xl focus:outline-none focus:border-red-400 bg-white w-52"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as "All" | AlertStatus)}
              className="text-xs border border-ink-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-red-400"
            >
              {["All", "Open", "Investigating", "Resolved"].map((v) => (
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
                {["Alert ID", "Consumer", "Area", "Type", "Est. Loss", "Severity", "Status", "Detected"].map((h) => (
                  <th key={h} className="pb-3 pr-4 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-50">
              {filtered.map((a) => (
                <tr key={a.id} className="hover:bg-ink-50/50 transition">
                  <td className="py-3 pr-4 font-mono text-xs text-ink-600 whitespace-nowrap">{a.id}</td>
                  <td className="py-3 pr-4 font-medium text-ink-800 whitespace-nowrap">{a.consumer}</td>
                  <td className="py-3 pr-4 text-ink-600 whitespace-nowrap">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {a.area}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-ink-700 whitespace-nowrap">{a.type}</td>
                  <td className="py-3 pr-4 font-bold text-red-600 tabular-nums whitespace-nowrap">
                    ₹{a.loss.toLocaleString("en-IN")}
                  </td>
                  <td className="py-3 pr-4 whitespace-nowrap">
                    <Badge tone={SEVERITY_TONE[a.severity]}>{a.severity}</Badge>
                  </td>
                  <td className="py-3 pr-4 whitespace-nowrap">
                    <Badge tone={STATUS_TONE[a.status]}>{a.status}</Badge>
                  </td>
                  <td className="py-3 pr-4 text-xs text-ink-400 whitespace-nowrap">{a.detectedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="text-center text-ink-400 py-8 text-sm">No alerts match your search.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
