"use client";

import { useState } from "react";
import { Card, Kpi, Badge } from "@/components/ui";
import Typewriter from "@/components/Typewriter";
import CountUp from "@/components/CountUp";
import { DonutChart, TrendChart } from "@/components/Charts";
import {
  Flame, MapPin, AlertTriangle, ShieldCheck, Activity,
  TrendingUp, Wind, Thermometer, Eye, Bell, Zap, Navigation,
} from "lucide-react";

type ZoneStatus = "Safe" | "Warning" | "Critical";

interface Zone {
  id: string;
  name: string;
  area: string;
  ppm: number;
  pressure: number; // bar
  temperature: number;
  flow: number; // m³/hr
  status: ZoneStatus;
  lastPing: string;
  sensor: string;
}

const ZONES: Zone[] = [
  { id: "Z-01", name: "Bopal Distribution Hub", area: "West Zone", ppm: 5, pressure: 4.2, temperature: 29, flow: 142, status: "Safe", lastPing: "12 sec ago", sensor: "GS-1047" },
  { id: "Z-02", name: "Satellite Pressure Reg. Station", area: "Central", ppm: 18, pressure: 4.0, temperature: 31, flow: 198, status: "Warning", lastPing: "8 sec ago", sensor: "GS-2231" },
  { id: "Z-03", name: "Chandkheda CNG Compressor", area: "North Zone", ppm: 7, pressure: 4.3, temperature: 28, flow: 85, status: "Safe", lastPing: "5 sec ago", sensor: "GS-0831" },
  { id: "Z-04", name: "Naranpura Inlet Line", area: "Central", ppm: 42, pressure: 3.8, temperature: 34, flow: 56, status: "Critical", lastPing: "3 sec ago", sensor: "GS-1742" },
  { id: "Z-05", name: "Gota Feeder Main", area: "North Zone", ppm: 3, pressure: 4.4, temperature: 27, flow: 211, status: "Safe", lastPing: "18 sec ago", sensor: "GS-0512" },
  { id: "Z-06", name: "Vastral Industrial Cluster", area: "East Zone", ppm: 9, pressure: 4.1, temperature: 30, flow: 324, status: "Safe", lastPing: "7 sec ago", sensor: "GS-2944" },
];

const INCIDENT_HISTORY = [
  { day: "Mon", alerts: 1, resolved: 1 },
  { day: "Tue", alerts: 3, resolved: 3 },
  { day: "Wed", alerts: 0, resolved: 0 },
  { day: "Thu", alerts: 4, resolved: 3 },
  { day: "Fri", alerts: 2, resolved: 2 },
  { day: "Sat", alerts: 5, resolved: 4 },
  { day: "Sun", alerts: 1, resolved: 1 },
];

const ZONE_STATUS_DATA = [
  { name: "Safe", value: 4, color: "#10b981" },
  { name: "Warning", value: 1, color: "#f59e0b" },
  { name: "Critical", value: 1, color: "#ef4444" },
];

const STATUS_CONFIG: Record<ZoneStatus, { border: string; bg: string; dot: string; badge: "brand" | "amber" | "red" }> = {
  Safe: { border: "border-brand-200", bg: "bg-brand-50", dot: "bg-brand-500", badge: "brand" },
  Warning: { border: "border-amber-200", bg: "bg-amber-50", dot: "bg-amber-500", badge: "amber" },
  Critical: { border: "border-red-200", bg: "bg-red-50", dot: "bg-red-500", badge: "red" },
};

function Gauge({ value, max, label, unit, color }: { value: number; max: number; label: string; unit: string; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div>
      <div className="flex justify-between text-[11px] mb-1">
        <span className="text-ink-500">{label}</span>
        <span className="font-bold text-ink-700" style={{ color }}>{value} {unit}</span>
      </div>
      <div className="h-1.5 bg-ink-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export default function DashboardGasGuard() {
  const [selected, setSelected] = useState<Zone | null>(null);
  const criticalCount = ZONES.filter((z) => z.status === "Critical").length;
  const warningCount = ZONES.filter((z) => z.status === "Warning").length;

  return (
    <div className="space-y-6 reveal">
      {/* Critical Alert Banner */}
      {criticalCount > 0 && (
        <div className="rounded-2xl bg-red-600 text-white p-4 flex items-center justify-between gap-4 anim-fade-up shadow-lg shadow-red-600/30">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 animate-pulse shrink-0" />
            <div>
              <p className="font-bold">{criticalCount} CRITICAL ZONE{criticalCount > 1 ? "S" : ""} DETECTED</p>
              <p className="text-red-200 text-xs">Immediate inspection required · Auto-dispatch initiated</p>
            </div>
          </div>
          <span className="text-xs font-mono bg-red-700 px-3 py-1.5 rounded-lg">LIVE</span>
        </div>
      )}

      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-ink-900 via-ink-900 to-red-950 text-white p-6 relative overflow-hidden shadow-soft">
        <div className="floaty absolute -right-10 -top-10 w-56 h-56 bg-red-500/20 rounded-full blur-3xl" />
        <div className="relative">
          <p className="text-red-300 text-xs font-semibold uppercase tracking-widest">CGD Grid Monitoring</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">
            <Typewriter speed={40} segments={[{ text: "Gas-Guard Dashboard " }, { text: "🔥", cls: "" }]} />
          </h1>
          <p className="text-ink-300 mt-2 text-sm max-w-2xl">
            Centralized real-time gas safety monitoring across all distribution zones — pressure, flow, temperature, and leak PPM tracking.
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 anim-fade-up">
        <Kpi label="Total Zones Monitored" value={<CountUp to={ZONES.length} />} sub="All zones live" icon={<Navigation className="w-4 h-4" />} />
        <Kpi label="Critical Zones" value={<CountUp to={criticalCount} />} sub="Immediate action" accent="text-red-600" icon={<AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />} />
        <Kpi label="Warning Zones" value={<CountUp to={warningCount} />} sub="Monitor closely" accent="text-amber-600" icon={<Bell className="w-4 h-4" />} />
        <Kpi label="Avg System PPM" value="14 ppm" sub="Below 25 ppm threshold" icon={<Wind className="w-4 h-4" />} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 anim-fade-up">
        {/* Zone Status Cards */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-ink-900">Live Zone Status</h3>
            <span className="flex items-center gap-1.5 text-xs text-brand-600 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" /> Real-time feed
            </span>
          </div>
          {ZONES.map((z) => {
            const cfg = STATUS_CONFIG[z.status];
            return (
              <button
                key={z.id}
                onClick={() => setSelected(selected?.id === z.id ? null : z)}
                className={`w-full text-left rounded-xl p-4 border transition ${cfg.border} ${cfg.bg} ${selected?.id === z.id ? "ring-2 ring-offset-1 ring-ink-400" : "hover:shadow-md"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`h-9 w-9 rounded-xl grid place-items-center shrink-0 ${z.status === "Critical" ? "bg-red-100" : z.status === "Warning" ? "bg-amber-100" : "bg-brand-100"}`}>
                      <MapPin className={`w-4 h-4 ${z.status === "Critical" ? "text-red-600" : z.status === "Warning" ? "text-amber-600" : "text-brand-600"}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-ink-800 text-sm truncate">{z.name}</p>
                      <p className="text-[11px] text-ink-500">{z.area} · {z.sensor} · {z.lastPing}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge tone={cfg.badge}>{z.status}</Badge>
                    <span className={`h-2 w-2 rounded-full ${cfg.dot} ${z.status !== "Safe" ? "animate-pulse" : ""}`} />
                  </div>
                </div>

                {/* Quick readings */}
                <div className="mt-3 grid grid-cols-4 gap-2 text-[11px]">
                  {[
                    { label: "PPM", value: `${z.ppm}`, icon: "💨" },
                    { label: "Pressure", value: `${z.pressure} bar`, icon: "⚡" },
                    { label: "Temp", value: `${z.temperature}°C`, icon: "🌡️" },
                    { label: "Flow", value: `${z.flow} m³`, icon: "🔄" },
                  ].map((r) => (
                    <div key={r.label} className="text-center bg-white/60 rounded-lg px-2 py-1.5">
                      <div className="text-base leading-none">{r.icon}</div>
                      <div className="font-bold text-ink-700 mt-1">{r.value}</div>
                      <div className="text-ink-400">{r.label}</div>
                    </div>
                  ))}
                </div>

                {/* Expanded gauges */}
                {selected?.id === z.id && (
                  <div className="mt-4 pt-4 border-t border-ink-200 space-y-3">
                    <Gauge value={z.ppm} max={50} label="Gas PPM" unit="ppm" color={z.ppm < 10 ? "#10b981" : z.ppm < 25 ? "#f59e0b" : "#ef4444"} />
                    <Gauge value={z.pressure} max={6} label="Line Pressure" unit="bar" color="#6366f1" />
                    <Gauge value={z.flow} max={400} label="Gas Flow Rate" unit="m³/hr" color="#0ea5e9" />
                    <Gauge value={z.temperature} max={50} label="Ambient Temperature" unit="°C" color="#f59e0b" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="font-bold text-ink-900 mb-3">Zone Health Overview</h3>
            <DonutChart data={ZONE_STATUS_DATA} />
          </Card>

          <Card className="p-5">
            <h3 className="font-bold text-ink-900 mb-3">Incident Trend — 7 Days</h3>
            <TrendChart data={INCIDENT_HISTORY} />
          </Card>

          <Card className="p-5 border-red-100 bg-red-50">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-red-600" />
              <p className="font-bold text-red-800 text-sm">Auto-Response Rules</p>
            </div>
            <ul className="text-xs text-red-700/80 space-y-1.5">
              <li>• PPM &gt; 25 → Auto-alert field team</li>
              <li>• PPM &gt; 50 → Emergency dispatch + SMS blast</li>
              <li>• Pressure drop &gt; 0.5 bar → Isolate zone</li>
              <li>• No ping &gt; 60 sec → Sensor offline alert</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
