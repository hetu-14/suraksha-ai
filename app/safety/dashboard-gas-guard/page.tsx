"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, Kpi, Badge } from "@/components/ui";
import CountUp from "@/components/CountUp";
import { DonutChart, TrendChart } from "@/components/Charts";
import { useLocalWorkspaceState } from "@/lib/useLocalWorkspaceState";
import { recordActivity } from "@/lib/activity";
import OperatorHandoff, { type HandoffEntry } from "@/components/OperatorHandoff";
import {
  Activity, AlertTriangle, CheckCircle2, Clock3, Download,
  MapPin, Navigation, Pause, Play, Search, Settings2,
  ShieldCheck, Siren, Truck, Wind, X, Zap, Gauge as GaugeIcon, Thermometer, Repeat,
} from "lucide-react";

type ZoneStatus = "Safe" | "Warning" | "Critical" | "Isolated";
type IncidentStatus = "New" | "Acknowledged" | "Dispatched" | "Resolved";

type Zone = {
  id: string;
  name: string;
  area: string;
  ppm: number;
  pressure: number;
  temperature: number;
  flow: number;
  lastPingSeconds: number;
  sensor: string;
  isolated: boolean;
};

type Incident = {
  id: string;
  zoneId: string;
  title: string;
  severity: "Warning" | "Critical";
  createdAt: string;
  status: IncidentStatus;
  crew?: string;
};

type Rules = {
  warningPpm: number;
  criticalPpm: number;
  minimumPressure: number;
  autoDispatch: boolean;
};

const INITIAL_ZONES: Zone[] = [
  { id: "Z-01", name: "Bopal Distribution Hub", area: "West Zone", ppm: 5, pressure: 4.2, temperature: 29, flow: 142, lastPingSeconds: 12, sensor: "GS-1047", isolated: false },
  { id: "Z-02", name: "Satellite Pressure Reg. Station", area: "Central", ppm: 18, pressure: 4.0, temperature: 31, flow: 198, lastPingSeconds: 8, sensor: "GS-2231", isolated: false },
  { id: "Z-03", name: "Chandkheda CNG Compressor", area: "North Zone", ppm: 7, pressure: 4.3, temperature: 28, flow: 85, lastPingSeconds: 5, sensor: "GS-0831", isolated: false },
  { id: "Z-04", name: "Naranpura Inlet Line", area: "Central", ppm: 42, pressure: 3.8, temperature: 34, flow: 56, lastPingSeconds: 3, sensor: "GS-1742", isolated: false },
  { id: "Z-05", name: "Gota Feeder Main", area: "North Zone", ppm: 3, pressure: 4.4, temperature: 27, flow: 211, lastPingSeconds: 18, sensor: "GS-0512", isolated: false },
  { id: "Z-06", name: "Vastral Industrial Cluster", area: "East Zone", ppm: 9, pressure: 4.1, temperature: 30, flow: 324, lastPingSeconds: 7, sensor: "GS-2944", isolated: false },
];

const INITIAL_INCIDENTS: Incident[] = [
  { id: "GG-2408", zoneId: "Z-04", title: "Elevated methane concentration", severity: "Critical", createdAt: "3 min ago", status: "New" },
  { id: "GG-2407", zoneId: "Z-02", title: "PPM above observation threshold", severity: "Warning", createdAt: "11 min ago", status: "Acknowledged" },
];

const INCIDENT_HISTORY = [
  { day: "Mon", alerts: 1, resolved: 1 }, { day: "Tue", alerts: 3, resolved: 3 },
  { day: "Wed", alerts: 0, resolved: 0 }, { day: "Thu", alerts: 4, resolved: 3 },
  { day: "Fri", alerts: 2, resolved: 2 }, { day: "Sat", alerts: 5, resolved: 4 },
  { day: "Sun", alerts: 1, resolved: 1 },
];

const DEFAULT_RULES: Rules = { warningPpm: 15, criticalPpm: 35, minimumPressure: 3.9, autoDispatch: true };
const crews = ["GA-2", "GA-4", "GA-6", "GA-7"];

const statusTone: Record<ZoneStatus, "brand" | "amber" | "red" | "sky"> = { Safe: "brand", Warning: "amber", Critical: "red", Isolated: "sky" };
const statusStyle: Record<ZoneStatus, { border: string; bg: string; dot: string }> = {
  Safe: { border: "border-brand-200", bg: "bg-brand-50", dot: "bg-brand-500" },
  Warning: { border: "border-amber-200", bg: "bg-amber-50", dot: "bg-amber-500" },
  Critical: { border: "border-red-200", bg: "bg-red-50", dot: "bg-red-500" },
  Isolated: { border: "border-sky-200", bg: "bg-sky-50", dot: "bg-sky-500" },
};

function zoneStatus(zone: Zone, rules: Rules): ZoneStatus {
  if (zone.isolated) return "Isolated";
  if (zone.ppm >= rules.criticalPpm || zone.pressure < rules.minimumPressure - 0.3) return "Critical";
  if (zone.ppm >= rules.warningPpm || zone.pressure < rules.minimumPressure) return "Warning";
  return "Safe";
}

function Gauge({ value, max, label, unit, color }: { value: number; max: number; label: string; unit: string; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return <div>
    <div className="flex justify-between text-[11px] mb-1"><span className="text-ink-500">{label}</span><span className="font-bold" style={{ color }}>{value} {unit}</span></div>
    <div className="h-1.5 bg-ink-100 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} /></div>
  </div>;
}

type Workspace = { rules: Rules; handoffLog: HandoffEntry[] };
const DEFAULT_WORKSPACE: Workspace = { rules: DEFAULT_RULES, handoffLog: [] };

export default function DashboardGasGuard() {
  const [zones, setZones] = useState<Zone[]>(INITIAL_ZONES);
  const [incidents, setIncidents] = useState<Incident[]>(INITIAL_INCIDENTS);
  const [workspace, setWorkspace] = useLocalWorkspaceState<Workspace>("suraksha:gas-guard-workspace", DEFAULT_WORKSPACE);
  const rules = workspace.rules;
  const [selectedId, setSelectedId] = useState<string | null>("Z-04");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"All" | ZoneStatus>("All");
  const [live, setLive] = useState(true);
  const [showRules, setShowRules] = useState(false);
  const [notice, setNotice] = useState("");

  function setRules(update: Rules | ((previous: Rules) => Rules)) {
    setWorkspace((current) => ({ ...current, rules: typeof update === "function" ? (update as (previous: Rules) => Rules)(current.rules) : update }));
  }

  function completeHandoff(entry: HandoffEntry) {
    setWorkspace((current) => ({ ...current, handoffLog: [entry, ...current.handoffLog].slice(0, 20) }));
    setNotice(`Handoff logged for the ${entry.shift.split(" · ")[0]} shift.`);
  }

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(""), 3500);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  useEffect(() => {
    if (!live) return;
    const timer = window.setInterval(() => {
      setZones((previous) => previous.map((zone) => {
        if (zone.isolated) return { ...zone, lastPingSeconds: 0, flow: 0 };
        const ppmDelta = Math.floor(Math.random() * 5) - 2;
        const pressureDelta = (Math.floor(Math.random() * 7) - 3) / 100;
        return {
          ...zone,
          ppm: Math.max(0, Math.min(65, zone.ppm + ppmDelta)),
          pressure: Math.max(3.1, Math.min(4.8, Number((zone.pressure + pressureDelta).toFixed(2)))),
          temperature: Math.max(20, Math.min(46, zone.temperature + (Math.random() > .7 ? 1 : Math.random() < .3 ? -1 : 0))),
          flow: Math.max(0, Math.min(450, zone.flow + Math.floor(Math.random() * 15) - 7)),
          lastPingSeconds: 0,
        };
      }));
    }, 3500);
    return () => window.clearInterval(timer);
  }, [live]);

  const statusByZone = useMemo(() => Object.fromEntries(zones.map((zone) => [zone.id, zoneStatus(zone, rules)])), [zones, rules]);
  const visibleZones = useMemo(() => zones.filter((zone) => {
    const status = statusByZone[zone.id];
    const matchingText = `${zone.name} ${zone.id} ${zone.area} ${zone.sensor}`.toLowerCase().includes(query.toLowerCase());
    return matchingText && (filter === "All" || status === filter);
  }), [zones, statusByZone, query, filter]);
  const criticalZones = zones.filter((zone) => statusByZone[zone.id] === "Critical");
  const warningZones = zones.filter((zone) => statusByZone[zone.id] === "Warning");
  const openIncidents = incidents.filter((incident) => incident.status !== "Resolved");
  const selected = zones.find((zone) => zone.id === selectedId) ?? null;
  const statusData = [
    { name: "Safe", value: zones.filter((z) => statusByZone[z.id] === "Safe").length, color: "#10b981" },
    { name: "Warning", value: warningZones.length, color: "#f59e0b" },
    { name: "Critical", value: criticalZones.length, color: "#ef4444" },
    { name: "Isolated", value: zones.filter((z) => statusByZone[z.id] === "Isolated").length, color: "#0ea5e9" },
  ].filter((item) => item.value > 0);
  const avgPpm = Math.round(zones.reduce((sum, zone) => sum + zone.ppm, 0) / zones.length);

  function updateIncident(id: string, status: IncidentStatus) {
    setIncidents((previous) => previous.map((incident) => incident.id === id ? {
      ...incident, status, ...(status === "Dispatched" ? { crew: crews[Math.floor(Math.random() * crews.length)] } : {}),
    } : incident));
    if (status === "Dispatched") recordActivity("safety", { module: "Gas-Guard", title: `Field crew dispatched · ${id}`, detail: "Crew en route to the affected zone; incident remains open until closure.", href: "/safety/dashboard-gas-guard", tone: "amber", priority: "high" });
    if (status === "Resolved") recordActivity("safety", { module: "Gas-Guard", title: `Incident ${id} resolved`, detail: "Zone telemetry back in range; closure recorded in the incident history.", href: "/safety/dashboard-gas-guard", tone: "brand" });
    setNotice(status === "Acknowledged" ? "Alert acknowledged and recorded." : status === "Dispatched" ? "Field crew dispatched to the zone." : "Incident marked resolved and added to history.");
  }

  function toggleIsolation(zone: Zone) {
    const goingOffline = !zone.isolated;
    setZones((previous) => previous.map((item) => item.id === zone.id ? { ...item, isolated: goingOffline, flow: goingOffline ? 0 : Math.max(60, item.flow) } : item));
    recordActivity("safety", { module: "Gas-Guard", title: goingOffline ? `${zone.name} isolated` : `${zone.name} restored`, detail: goingOffline ? "Emergency isolation valve closed — gas flow stopped and field action flagged." : "Isolation lifted; the zone has returned to monitored operation.", href: "/safety/dashboard-gas-guard", tone: goingOffline ? "red" : "brand", priority: goingOffline ? "critical" : "normal" });
    setNotice(goingOffline ? `${zone.name} has been isolated; flow has been stopped.` : `${zone.name} has been restored to monitored operation.`);
  }

  function createTestAlert() {
    const safe = zones.find((zone) => statusByZone[zone.id] === "Safe") ?? zones[0];
    const id = `GG-${2410 + incidents.length}`;
    const crew = rules.autoDispatch ? crews[Math.floor(Math.random() * crews.length)] : undefined;
    setZones((previous) => previous.map((zone) => zone.id === safe.id ? { ...zone, ppm: rules.criticalPpm + 3 } : zone));
    setIncidents((previous) => [{ id, zoneId: safe.id, title: "Test methane threshold breach", severity: "Critical", createdAt: "just now", status: rules.autoDispatch ? "Dispatched" : "New", crew }, ...previous]);
    setSelectedId(safe.id);
    setNotice(rules.autoDispatch ? `Test alert ${id} created and ${crew} was auto-dispatched.` : `Test alert ${id} created for ${safe.name}.`);
  }

  function downloadReport() {
    const rows = zones.map((zone) => ({
      zone_id: zone.id, zone: zone.name, area: zone.area, status: statusByZone[zone.id], ppm: zone.ppm,
      pressure_bar: zone.pressure, temperature_c: zone.temperature, flow_m3_hr: zone.flow, sensor: zone.sensor,
    }));
    const header = Object.keys(rows[0]).join(",");
    const csv = [header, ...rows.map((row) => Object.values(row).map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url; link.download = "gas-guard-live-report.csv"; link.click(); URL.revokeObjectURL(url);
    setNotice("Live zone report downloaded as CSV.");
  }

  return <div className="space-y-6 reveal">
    {notice && <div className="fixed z-50 bottom-5 right-5 max-w-sm rounded-xl bg-ink-900 text-white shadow-xl px-4 py-3 text-sm flex gap-2 items-start"><CheckCircle2 className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />{notice}<button onClick={() => setNotice("")} aria-label="Close notification"><X className="w-4 h-4 text-ink-300" /></button></div>}

    {criticalZones.length > 0 && <div className="rounded-xl bg-red-600 text-white p-4 flex flex-wrap items-center justify-between gap-3 shadow-lg shadow-red-600/30">
      <div className="flex items-center gap-3"><AlertTriangle className="w-6 h-6 animate-pulse shrink-0" /><div><p className="font-bold">{criticalZones.length} CRITICAL ZONE{criticalZones.length > 1 ? "S" : ""} DETECTED</p><p className="text-red-100 text-xs">Field response is required before the incident can be closed.</p></div></div>
      <button onClick={() => { setFilter("Critical"); setSelectedId(criticalZones[0].id); }} className="text-xs font-bold rounded-lg bg-white text-red-700 px-3 py-2 hover:bg-red-50">Review critical zone</button>
    </div>}

    <div className="rounded-xl bg-ink-950 text-white p-6 relative overflow-hidden ">
      <div className="relative flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div><p className="text-red-300 text-xs font-semibold uppercase tracking-widest">CGD Grid Monitoring</p><h1 className="text-2xl sm:text-3xl font-bold mt-1">Gas-Guard Dashboard</h1><p className="text-ink-300 mt-2 text-sm max-w-2xl">Real-time gas safety monitoring, incident triage, isolation control, and field-response coordination across the distribution grid.</p></div>
        <div className="flex flex-wrap gap-2 lg:justify-end"><button onClick={() => setLive((value) => !value)} className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/20">{live ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}{live ? "Pause feed" : "Resume feed"}</button><button onClick={downloadReport} className="inline-flex items-center gap-2 rounded-lg bg-white text-ink-800 px-3 py-2 text-xs font-semibold hover:bg-ink-100"><Download className="w-3.5 h-3.5" />Export report</button></div>
      </div>
      <div className="relative mt-5 inline-flex items-center gap-2 text-xs text-ink-200"><span className={`w-2 h-2 rounded-full ${live ? "bg-brand-400 animate-pulse" : "bg-amber-400"}`} />{live ? "Live telemetry updates every 3.5 seconds" : "Telemetry feed paused"}<span className="text-ink-500">•</span><span>{openIncidents.length} active incident{openIncidents.length === 1 ? "" : "s"}</span></div>
    </div>

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 anim-fade-up">
      <Kpi label="Zones Monitored" value={<CountUp to={zones.length} />} sub={live ? "Telemetry connected" : "Feed paused"} icon={<Navigation className="w-4 h-4" />} />
      <Kpi label="Critical Zones" value={<CountUp to={criticalZones.length} />} sub="Immediate action" accent="text-red-600" icon={<AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />} />
      <Kpi label="Open Incidents" value={<CountUp to={openIncidents.length} />} sub="Awaiting closure" accent="text-amber-600" icon={<Siren className="w-4 h-4" />} />
      <Kpi label="Avg System PPM" value={<CountUp to={avgPpm} suffix=" ppm" />} sub={`Warning at ${rules.warningPpm} ppm`} icon={<Wind className="w-4 h-4" />} />
    </div>

    <div className="grid xl:grid-cols-3 gap-6 anim-fade-up">
      <div className="xl:col-span-2 space-y-4">
        <Card className="p-4">
          <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between"><div><h2 className="font-bold text-ink-900">Live Zone Status</h2><p className="text-xs text-ink-500 mt-0.5">Select a zone to inspect readings and take control actions.</p></div><div className="flex flex-col sm:flex-row gap-2"><label className="relative"><Search className="w-4 h-4 text-ink-400 absolute left-3 top-2.5" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search zone or sensor" className="w-full sm:w-48 rounded-lg border border-ink-200 py-2 pl-9 pr-3 text-xs outline-none focus:ring-2 focus:ring-brand-400" /></label><select value={filter} onChange={(event) => setFilter(event.target.value as "All" | ZoneStatus)} className="rounded-lg border border-ink-200 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-brand-400">{["All", "Safe", "Warning", "Critical", "Isolated"].map((option) => <option key={option}>{option}</option>)}</select></div></div>
        </Card>
        <div className="space-y-3">
          {visibleZones.map((zone) => {
            const status = statusByZone[zone.id]; const config = statusStyle[status]; const isSelected = selectedId === zone.id;
            return <button key={zone.id} onClick={() => setSelectedId(isSelected ? null : zone.id)} className={`w-full text-left rounded-xl p-4 border transition ${config.border} ${config.bg} ${isSelected ? "ring-2 ring-offset-1 ring-ink-400" : "hover:shadow-md"}`}>
              <div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3 min-w-0"><div className={`h-9 w-9 rounded-xl grid place-items-center shrink-0 ${status === "Critical" ? "bg-red-100" : status === "Warning" ? "bg-amber-100" : status === "Isolated" ? "bg-sky-100" : "bg-brand-100"}`}><MapPin className={`w-4 h-4 ${status === "Critical" ? "text-red-600" : status === "Warning" ? "text-amber-600" : status === "Isolated" ? "text-sky-600" : "text-brand-600"}`} /></div><div className="min-w-0"><p className="font-semibold text-ink-800 text-sm truncate">{zone.name}</p><p className="text-[11px] text-ink-500">{zone.area} · {zone.sensor} · ping {zone.lastPingSeconds}s ago</p></div></div><div className="flex items-center gap-2 shrink-0"><Badge tone={statusTone[status]}>{status}</Badge><span className={`h-2 w-2 rounded-full ${config.dot} ${status !== "Safe" ? "animate-pulse" : ""}`} /></div></div>
              <div className="mt-3 grid grid-cols-4 gap-2 text-[11px]">{[{ label: "PPM", value: `${zone.ppm}`, icon: Wind }, { label: "Pressure", value: `${zone.pressure} bar`, icon: GaugeIcon }, { label: "Temp", value: `${zone.temperature}°C`, icon: Thermometer }, { label: "Flow", value: `${zone.flow} m³/h`, icon: Repeat }].map((reading) => <div key={reading.label} className="text-center bg-white/60 rounded-lg px-2 py-1.5"><reading.icon className="w-4 h-4 mx-auto text-ink-500" /><div className="font-bold text-ink-700 mt-1">{reading.value}</div><div className="text-ink-400">{reading.label}</div></div>)}</div>
            </button>;
          })}
          {!visibleZones.length && <Card className="p-8 text-center text-sm text-ink-500">No zones match the current search and filter.</Card>}
        </div>
      </div>

      <div className="space-y-4">
        <Card className="p-5"><h3 className="font-bold text-ink-900 mb-3">Zone Health Overview</h3><DonutChart data={statusData} /></Card>
        <Card className="p-5"><h3 className="font-bold text-ink-900 mb-3">Incident Trend — 7 Days</h3><TrendChart data={INCIDENT_HISTORY} /></Card>
        <Card className="p-5 border-red-100 bg-red-50"><div className="flex items-center justify-between gap-2 mb-2"><div className="flex items-center gap-2"><Zap className="w-4 h-4 text-red-600" /><p className="font-bold text-red-800 text-sm">Response rules</p></div><button onClick={() => setShowRules((value) => !value)} className="text-xs text-red-700 font-semibold hover:underline"><Settings2 className="w-4 h-4" /></button></div><ul className="text-xs text-red-700/80 space-y-1.5"><li>• PPM ≥ {rules.warningPpm} → create warning alert</li><li>• PPM ≥ {rules.criticalPpm} → critical field response</li><li>• Pressure &lt; {rules.minimumPressure} bar → pressure warning</li><li>• Auto-dispatch: {rules.autoDispatch ? "enabled" : "manual approval"}</li></ul></Card>
      </div>
    </div>

    {selected && <Card className="overflow-hidden anim-fade-up"><div className="p-5 border-b border-ink-100 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"><div><div className="flex items-center gap-2"><h2 className="font-bold text-ink-900">{selected.name}</h2><Badge tone={statusTone[statusByZone[selected.id]]}>{statusByZone[selected.id]}</Badge></div><p className="text-xs text-ink-500 mt-1">{selected.id} · Sensor {selected.sensor} · {selected.area}</p></div><button onClick={() => toggleIsolation(selected)} className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-bold ${selected.isolated ? "bg-brand-600 text-white hover:bg-brand-700" : "bg-red-600 text-white hover:bg-red-700"}`}>{selected.isolated ? <Play className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}{selected.isolated ? "Restore zone" : "Isolate zone"}</button></div><div className="grid md:grid-cols-2 gap-5 p-5"><div className="space-y-4"><Gauge value={selected.ppm} max={Math.max(rules.criticalPpm + 15, 50)} label="Methane concentration" unit="ppm" color={selected.ppm >= rules.criticalPpm ? "#ef4444" : selected.ppm >= rules.warningPpm ? "#f59e0b" : "#10b981"} /><Gauge value={selected.pressure} max={6} label="Line pressure" unit="bar" color={selected.pressure < rules.minimumPressure ? "#f59e0b" : "#6366f1"} /><Gauge value={selected.flow} max={400} label="Gas flow rate" unit="m³/hr" color="#0ea5e9" /><Gauge value={selected.temperature} max={50} label="Ambient temperature" unit="°C" color="#f59e0b" /></div><div className="rounded-xl bg-ink-50 border border-ink-100 p-4 text-xs"><div className="flex items-center gap-2 text-ink-800 font-bold"><Activity className="w-4 h-4 text-brand-600" />Operational checklist</div><div className="mt-3 space-y-2.5 text-ink-600"><p className="flex justify-between gap-3"><span>Sensor connection</span><span className="font-semibold text-brand-700">Connected</span></p><p className="flex justify-between gap-3"><span>Last telemetry packet</span><span className="font-semibold text-ink-800">{selected.lastPingSeconds}s ago</span></p><p className="flex justify-between gap-3"><span>Emergency isolation valve</span><span className={`font-semibold ${selected.isolated ? "text-sky-700" : "text-brand-700"}`}>{selected.isolated ? "Closed" : "Open"}</span></p><p className="flex justify-between gap-3"><span>Field action required</span><span className={`font-semibold ${statusByZone[selected.id] === "Critical" ? "text-red-700" : "text-ink-700"}`}>{statusByZone[selected.id] === "Critical" ? "Yes" : "No"}</span></p></div></div></div></Card>}

    <div className="grid lg:grid-cols-3 gap-6 anim-fade-up"><Card className="lg:col-span-2 overflow-hidden"><div className="p-5 border-b border-ink-100 flex items-center justify-between gap-4"><div><h2 className="font-bold text-ink-900">Incident command queue</h2><p className="text-xs text-ink-500 mt-0.5">Acknowledge, dispatch a field crew, and close incidents with an auditable status trail.</p></div><button onClick={createTestAlert} className="shrink-0 inline-flex items-center gap-2 bg-ink-900 hover:bg-ink-800 text-white text-xs font-semibold px-3 py-2 rounded-lg"><Siren className="w-3.5 h-3.5" />Test alert</button></div><div className="divide-y divide-ink-100">{incidents.map((incident) => { const zone = zones.find((item) => item.id === incident.zoneId); return <div key={incident.id} className="p-4 flex flex-col md:flex-row md:items-center gap-3 justify-between"><div className="min-w-0"><div className="flex items-center gap-2 flex-wrap"><span className="font-bold text-sm text-ink-800">{incident.id}</span><Badge tone={incident.severity === "Critical" ? "red" : "amber"}>{incident.severity}</Badge><span className={`text-xs font-semibold ${incident.status === "Resolved" ? "text-brand-700" : incident.status === "Dispatched" ? "text-sky-700" : "text-ink-600"}`}>{incident.status}{incident.crew ? ` · ${incident.crew}` : ""}</span></div><p className="text-xs text-ink-500 mt-1">{incident.title} · {zone?.name ?? incident.zoneId} · {incident.createdAt}</p></div><div className="flex flex-wrap gap-2 shrink-0">{incident.status === "New" && <button onClick={() => updateIncident(incident.id, "Acknowledged")} className="text-xs font-semibold border border-ink-200 hover:bg-ink-50 rounded-lg px-3 py-1.5">Acknowledge</button>}{(incident.status === "New" || incident.status === "Acknowledged") && <button onClick={() => updateIncident(incident.id, "Dispatched")} className="inline-flex items-center gap-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg px-3 py-1.5"><Truck className="w-3.5 h-3.5" />Dispatch</button>}{incident.status === "Dispatched" && <button onClick={() => updateIncident(incident.id, "Resolved")} className="inline-flex items-center gap-1.5 text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-lg px-3 py-1.5"><CheckCircle2 className="w-3.5 h-3.5" />Resolve</button>}{incident.status === "Resolved" && <span className="text-xs text-ink-400 py-1.5">Archived</span>}</div></div>; })}</div></Card><div className="space-y-4"><OperatorHandoff log={workspace.handoffLog} onComplete={completeHandoff} /><div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800"><Clock3 className="w-4 h-4 float-left mr-2 mt-0.5" />Demo telemetry is generated locally in this browser. Connect the dashboard to protected sensor and dispatch APIs before using it for live operations.</div></div></div>

    {showRules && <div className="fixed inset-0 z-40 bg-ink-950/40 p-4 grid place-items-center" role="dialog" aria-modal="true" aria-label="Response rule settings"><Card className="w-full max-w-md p-5 shadow-2xl"><div className="flex items-center justify-between"><div><h2 className="font-bold text-ink-900">Response rule settings</h2><p className="text-xs text-ink-500 mt-1">Settings are saved locally for this browser.</p></div><button onClick={() => setShowRules(false)} aria-label="Close settings"><X className="w-5 h-5 text-ink-500" /></button></div><div className="mt-5 space-y-4"><label className="block text-xs font-semibold text-ink-600">Warning threshold (PPM)<input type="number" min="1" max={rules.criticalPpm - 1} value={rules.warningPpm} onChange={(event) => setRules((previous) => ({ ...previous, warningPpm: Math.max(1, Number(event.target.value)) }))} className="mt-1 w-full rounded-lg border border-ink-200 px-3 py-2 text-sm" /></label><label className="block text-xs font-semibold text-ink-600">Critical threshold (PPM)<input type="number" min={rules.warningPpm + 1} max="100" value={rules.criticalPpm} onChange={(event) => setRules((previous) => ({ ...previous, criticalPpm: Math.max(previous.warningPpm + 1, Number(event.target.value)) }))} className="mt-1 w-full rounded-lg border border-ink-200 px-3 py-2 text-sm" /></label><label className="block text-xs font-semibold text-ink-600">Minimum line pressure (bar)<input type="number" min="2" max="5" step="0.1" value={rules.minimumPressure} onChange={(event) => setRules((previous) => ({ ...previous, minimumPressure: Number(event.target.value) }))} className="mt-1 w-full rounded-lg border border-ink-200 px-3 py-2 text-sm" /></label><label className="flex items-center justify-between gap-4 rounded-lg border border-ink-200 p-3 text-xs font-semibold text-ink-700">Auto-dispatch field crew<button role="switch" aria-checked={rules.autoDispatch} onClick={() => setRules((previous) => ({ ...previous, autoDispatch: !previous.autoDispatch }))} className={`w-10 h-6 rounded-full p-0.5 transition ${rules.autoDispatch ? "bg-brand-600" : "bg-ink-300"}`}><span className={`block h-5 w-5 rounded-full bg-white transition ${rules.autoDispatch ? "translate-x-4" : "translate-x-0"}`} /></button></label></div><div className="flex justify-end gap-2 mt-6"><button onClick={() => setRules(DEFAULT_RULES)} className="text-xs font-semibold text-ink-600 px-3 py-2">Restore defaults</button><button onClick={() => { setShowRules(false); setNotice("Response rules saved."); }} className="text-xs font-semibold bg-ink-900 text-white rounded-lg px-4 py-2">Save rules</button></div></Card></div>}
  </div>;
}
