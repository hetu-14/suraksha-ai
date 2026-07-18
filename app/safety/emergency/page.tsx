"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card, Kpi, Badge } from "@/components/ui";
import Typewriter from "@/components/Typewriter";
import CountUp from "@/components/CountUp";
import { DonutChart, TrendChart } from "@/components/Charts";
import { useLocalWorkspaceState } from "@/lib/useLocalWorkspaceState";
import { readLiveIncident, liveIncidentKey } from "@/lib/ops";
import OperatorHandoff, { type HandoffEntry } from "@/components/OperatorHandoff";
import {
  Siren, Timer, Truck, CheckCircle2, MapPin, Video, ShieldAlert,
  Search, Settings2, Download, X, Camera, Zap,
} from "lucide-react";

type CaseStatus = "AI guiding" | "Acknowledged" | "Dispatched" | "Resolved";
type EmergencyCase = { id: string; area: string; severity: "High" | "Medium"; age: number; status: CaseStatus; crew?: string; source?: "customer-app" };
type CCTVAle = { id: string; cam: string; type: string; ts: string; status: "Open" | "Resolved"; severity: "Critical" | "Warning" };
type Rules = { sosThresholdSec: number; autoDispatch: boolean };
type Workspace = {
  cases: EmergencyCase[];
  cctvAlerts: CCTVAle[];
  feed: string[];
  activeCam: number;
  rules: Rules;
  handoffLog: HandoffEntry[];
};

const initialCases: EmergencyCase[] = [
  { id: "EMG-2231", area: "Maninagar · Sec 12", severity: "High", age: 42, status: "AI guiding" },
  { id: "EMG-2229", area: "Vastral · Ward 4", severity: "Medium", age: 315, status: "Dispatched", crew: "GA-2" },
  { id: "EMG-2225", area: "Odhav · Ring Rd", severity: "High", age: 548, status: "Dispatched", crew: "GA-4" },
];

const initialCctv: CCTVAle[] = [
  { id: "CTV-402", cam: "Mother Station · Naroda", type: "No Helmet Detected", ts: "2m ago", status: "Open", severity: "Warning" },
  { id: "CTV-401", cam: "Compressor Room · Naroda", type: "Ignition Source Flagged", ts: "5m ago", status: "Open", severity: "Critical" },
  { id: "CTV-399", cam: "CNG Station · Vastral", type: "Restricted Area Entry", ts: "12m ago", status: "Resolved", severity: "Critical" },
];

const newAreas = ["Bopal · Sec 2", "Nikol · Ward 9", "Chandkheda · Zone 1", "Ghatlodia · Sec 5"];
const crews = ["GA-3", "GA-5", "GA-6", "GA-7"];
const cameras = ["Naroda Station Compressor Room", "Vastral Station Dispenser 4"];
const SOS_HISTORY = [
  { day: "Mon", alerts: 4, resolved: 4 }, { day: "Tue", alerts: 6, resolved: 5 },
  { day: "Wed", alerts: 3, resolved: 3 }, { day: "Thu", alerts: 8, resolved: 7 },
  { day: "Fri", alerts: 5, resolved: 5 }, { day: "Sat", alerts: 9, resolved: 8 },
  { day: "Sun", alerts: 4, resolved: 4 },
];

const DEFAULT_RULES: Rules = { sosThresholdSec: 15, autoDispatch: true };
const storageKey = "suraksha:emergency:workspace";
const DEFAULT_WORKSPACE: Workspace = {
  cases: initialCases,
  cctvAlerts: initialCctv,
  feed: [
    "System Alert · Pressure drop in Naroda CGS (Auto-resolved)",
    "New SOS · EMG-2231 · Maninagar — AI answering",
    "CCTV Alert · Ignition Source in Compressor Room",
  ],
  activeCam: 0,
  rules: DEFAULT_RULES,
  handoffLog: [],
};

const statusText: Record<CaseStatus, string> = {
  "AI guiding": "text-red-600",
  Acknowledged: "text-amber-600",
  Dispatched: "text-sky-600",
  Resolved: "text-brand-600",
};

export default function EmergencyDashboard() {
  const [workspace, setWorkspace] = useLocalWorkspaceState<Workspace>(storageKey, DEFAULT_WORKSPACE);
  const [timeStr, setTimeStr] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"All" | CaseStatus>("All");
  const [cctvFilter, setCctvFilter] = useState<"All" | "Open" | "Resolved">("All");
  const [showRules, setShowRules] = useState(false);
  const tick = useRef(0);

  useEffect(() => {
    setTimeStr(new Date().toISOString());
    const interval = setInterval(() => setTimeStr(new Date().toISOString()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(""), 3500);
    return () => window.clearTimeout(t);
  }, [notice]);

  // Bridge: SOS sessions started in the Customer App (GasGuard) surface here live.
  useEffect(() => {
    function syncLiveIncident() {
      const live = readLiveIncident();
      if (!live) return;
      setWorkspace((w) => {
        const existing = w.cases.find((c) => c.id === live.id);
        if (live.status === "active" && !existing) {
          const incoming: EmergencyCase = {
            id: live.id,
            area: `${live.area} · ${live.address}`,
            severity: "High",
            age: Math.max(0, Math.round((Date.now() - live.startedAt) / 1000)),
            status: "AI guiding",
            source: "customer-app",
          };
          return {
            ...w,
            cases: [incoming, ...w.cases].slice(0, 6),
            feed: [`New SOS · ${live.id} · ${live.area} — Customer App voice assistant guiding household`, ...w.feed].slice(0, 6),
          };
        }
        if (live.status === "resolved" && existing && existing.status !== "Resolved") {
          return {
            ...w,
            cases: w.cases.map((c) => (c.id === live.id ? { ...c, status: "Resolved" as CaseStatus } : c)),
            feed: [`Case ${live.id} closed — household reported safe`, ...w.feed].slice(0, 6),
          };
        }
        return w;
      });
    }
    syncLiveIncident();
    const onStorage = (event: StorageEvent) => {
      if (event.key === liveIncidentKey) syncLiveIncident();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [setWorkspace]);

  useEffect(() => {
    const t = setInterval(() => {
      tick.current += 1;
      setWorkspace((w) => {
        let cases = w.cases.map((c) => ({ ...c, age: c.age + 1 }));
        let feed = w.feed;

        // Spawn a new SOS emergency every 24 seconds
        if (tick.current % 24 === 0) {
          const id = "EMG-" + (2232 + Math.floor(tick.current / 24));
          const area = newAreas[Math.floor(Math.random() * newAreas.length)];
          const nc: EmergencyCase = { id, area, severity: Math.random() > 0.5 ? "High" : "Medium", age: 0, status: "AI guiding" };
          cases = [nc, ...cases].slice(0, 6);
          feed = [`New SOS · ${id} · ${area} — AI answering`, ...feed].slice(0, 6);
        }

        // Auto-dispatch a crew once a case crosses the configured response threshold
        if (w.rules.autoDispatch) {
          const idx = cases.findIndex((c) => (c.status === "AI guiding" || c.status === "Acknowledged") && c.age >= w.rules.sosThresholdSec);
          if (idx !== -1) {
            const crew = crews[Math.floor(Math.random() * crews.length)];
            feed = [`Crew ${crew} auto-dispatched to ${cases[idx].id}`, ...feed].slice(0, 6);
            cases = cases.map((c, i) => (i === idx ? { ...c, status: "Dispatched" as CaseStatus, crew } : c));
          }
        }

        return { ...w, cases, feed };
      });
    }, 1000);
    return () => clearInterval(t);
  }, [setWorkspace]);

  function acknowledgeCase(id: string) {
    setWorkspace((w) => ({
      ...w,
      cases: w.cases.map((c) => (c.id === id ? { ...c, status: "Acknowledged" as CaseStatus } : c)),
      feed: [`Case ${id} acknowledged by operator`, ...w.feed].slice(0, 6),
    }));
  }

  function dispatchCrew(id: string) {
    const crew = crews[Math.floor(Math.random() * crews.length)];
    setWorkspace((w) => ({
      ...w,
      cases: w.cases.map((c) => (c.id === id ? { ...c, status: "Dispatched" as CaseStatus, crew } : c)),
      feed: [`Crew ${crew} dispatched manually to ${id}`, ...w.feed].slice(0, 6),
    }));
  }

  function resolveCase(id: string) {
    setWorkspace((w) => ({
      ...w,
      cases: w.cases.map((c) => (c.id === id ? { ...c, status: "Resolved" as CaseStatus } : c)),
      feed: [`Case ${id} resolved`, ...w.feed].slice(0, 6),
    }));
  }

  function acknowledgeCctv(id: string) {
    setWorkspace((w) => ({
      ...w,
      cctvAlerts: w.cctvAlerts.map((a) => (a.id === id ? { ...a, status: "Resolved" as const } : a)),
      feed: [`CCTV alert ${id} resolved`, ...w.feed].slice(0, 6),
    }));
  }

  function completeHandoff(entry: HandoffEntry) {
    setWorkspace((w) => ({ ...w, handoffLog: [entry, ...w.handoffLog].slice(0, 20) }));
    setNotice(`Handoff logged for the ${entry.shift.split(" · ")[0]} shift.`);
  }

  function setRules(update: Rules) {
    setWorkspace((w) => ({ ...w, rules: update }));
  }

  function downloadCasesReport() {
    if (!workspace.cases.length) return;
    const rows = workspace.cases.map((c) => ({
      case_id: c.id, area: c.area, severity: c.severity, status: c.status, age_seconds: c.age, crew: c.crew ?? "",
    }));
    const header = Object.keys(rows[0]).join(",");
    const csv = [header, ...rows.map((row) => Object.values(row).map((v) => `"${String(v).replaceAll('"', '""')}"`).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url; link.download = "emergency-dashboard-cases.csv"; link.click(); URL.revokeObjectURL(url);
    setNotice("Emergency case list downloaded as CSV.");
  }

  const visibleCases = useMemo(() => workspace.cases.filter((c) => {
    const matchesText = `${c.id} ${c.area}`.toLowerCase().includes(query.toLowerCase());
    return matchesText && (filter === "All" || c.status === filter);
  }), [workspace.cases, query, filter]);

  const visibleCctv = useMemo(
    () => workspace.cctvAlerts.filter((a) => cctvFilter === "All" || a.status === cctvFilter),
    [workspace.cctvAlerts, cctvFilter],
  );

  const activeSOS = workspace.cases.filter((c) => c.status !== "Resolved").length;
  const activeCctv = workspace.cctvAlerts.filter((a) => a.status === "Open").length;
  const dispatchedCount = workspace.cases.filter((c) => c.status === "Dispatched").length;
  const severityMix = [
    { name: "High", value: workspace.cases.filter((c) => c.status !== "Resolved" && c.severity === "High").length, color: "#ef4444" },
    { name: "Medium", value: workspace.cases.filter((c) => c.status !== "Resolved" && c.severity === "Medium").length, color: "#f59e0b" },
  ].filter((item) => item.value > 0);

  return (
    <div className="space-y-6 reveal">
      {notice && (
        <div className="fixed z-50 bottom-5 right-5 max-w-sm rounded-xl bg-ink-900 text-white shadow-xl px-4 py-3 text-sm flex gap-2 items-start">
          <CheckCircle2 className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />{notice}
          <button onClick={() => setNotice("")} aria-label="Close notification"><X className="w-4 h-4 text-ink-300" /></button>
        </div>
      )}

      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-ink-900 via-ink-900 to-amber-900 text-white p-6 relative overflow-hidden shadow-soft">
        <div className="floaty absolute -right-10 -top-10 w-56 h-56 bg-amber-500/20 rounded-full blur-3xl" />
        <div className="relative flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <p className="text-amber-300 text-xs font-semibold uppercase tracking-widest">Safety &amp; Operations Console</p>
            <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">
              <Typewriter speed={40} segments={[{ text: "Emergency Dashboard" }]} />
            </h1>
            <p className="text-ink-300 mt-2 text-sm max-w-2xl">
              Unified control center: real-time customer SOS triggers, automated AI dispatcher, and live CCTV incident triage.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <button onClick={downloadCasesReport} className="inline-flex items-center gap-2 rounded-lg bg-white text-ink-800 px-3 py-2 text-xs font-semibold hover:bg-ink-100">
              <Download className="w-3.5 h-3.5" />Export report
            </button>
            <button onClick={() => setShowRules(true)} className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/20">
              <Settings2 className="w-3.5 h-3.5" />Response rules
            </button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Active Gas SOS" value={<CountUp to={activeSOS} />} accent="text-red-500" icon={<Siren className="w-4 h-4 text-red-500 animate-pulse" />} />
        <Kpi label="Open CCTV Alerts" value={<CountUp to={activeCctv} />} accent="text-amber-500" icon={<Video className="w-4 h-4" />} />
        <Kpi label="Avg AI Pickup" value="1.2s" icon={<Timer className="w-4 h-4" />} />
        <Kpi label="Crews Dispatched" value={<CountUp to={dispatchedCount} />} icon={<Truck className="w-4 h-4" />} />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Active SOS section */}
        <Card className="lg:col-span-2 overflow-hidden">
          <div className="p-5 border-b border-ink-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-ink-900">Gas Emergency Cases</h3>
              <p className="text-xs text-ink-500 mt-0.5">Triaged via multilingual Customer App voice assistance</p>
            </div>
            <div className="flex items-center gap-2">
              <label className="relative">
                <Search className="w-3.5 h-3.5 text-ink-400 absolute left-2.5 top-2.5" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search case or area"
                  className="w-40 rounded-lg border border-ink-200 py-1.5 pl-8 pr-2 text-xs outline-none focus:ring-2 focus:ring-amber-400"
                />
              </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as "All" | CaseStatus)}
                className="rounded-lg border border-ink-200 px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-amber-400"
              >
                {(["All", "AI guiding", "Acknowledged", "Dispatched", "Resolved"] as const).map((option) => <option key={option}>{option}</option>)}
              </select>
              <span className="flex items-center gap-1.5 text-xs text-red-600 font-semibold whitespace-nowrap">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" /> Live
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-ink-50 text-ink-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left font-semibold px-5 py-3">Case ID</th>
                  <th className="text-left font-semibold px-3 py-3">Severity</th>
                  <th className="text-left font-semibold px-3 py-3">Status</th>
                  <th className="text-right font-semibold px-5 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {visibleCases.map((c) => (
                  <tr key={c.id} className={c.status === "AI guiding" ? "bg-red-50/50" : ""}>
                    <td className="px-5 py-3">
                      <div className="font-semibold text-ink-800 flex items-center gap-2">
                        {c.id}
                        {c.source === "customer-app" && (
                          <span className="text-[10px] font-bold uppercase tracking-wide text-red-700 bg-red-100 border border-red-200 rounded-full px-2 py-0.5">
                            Customer App
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-ink-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-ink-400" /> {c.area} · {c.age}s ago
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <Badge tone={c.severity === "High" ? "red" : "amber"}>{c.severity}</Badge>
                    </td>
                    <td className="px-3 py-3 font-medium">
                      <span className={`inline-flex items-center gap-1.5 ${statusText[c.status]}`}>
                        {c.status} {c.crew && `(${c.crew})`}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        {c.status === "AI guiding" && (
                          <button onClick={() => acknowledgeCase(c.id)} className="text-xs font-semibold border border-ink-200 hover:bg-ink-50 rounded-lg px-3 py-1.5">
                            Acknowledge
                          </button>
                        )}
                        {(c.status === "AI guiding" || c.status === "Acknowledged") && (
                          <button onClick={() => dispatchCrew(c.id)} className="text-xs font-semibold text-white bg-red-600 px-3 py-1.5 rounded-lg hover:bg-red-700">
                            Dispatch Crew
                          </button>
                        )}
                        {c.status === "Dispatched" && (
                          <button onClick={() => resolveCase(c.id)} className="text-xs font-semibold text-ink-700 border border-ink-200 px-3 py-1.5 rounded-lg hover:bg-ink-100">
                            Mark Resolved
                          </button>
                        )}
                        {c.status === "Resolved" && <span className="text-xs text-ink-400">Archived</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!visibleCases.length && <p className="p-8 text-center text-sm text-ink-500">No cases match the current search and filter.</p>}
          </div>
        </Card>

        {/* Live notification feed */}
        <Card className="p-5">
          <h3 className="font-bold text-ink-900 mb-3">Live Triage Feed</h3>
          <div className="space-y-3">
            {workspace.feed.map((f, i) => (
              <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-ink-50 border border-ink-100 text-xs text-ink-700">
                <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-ink-900">{f.split(" · ")[0]}</div>
                  <div className="mt-0.5">{f.split(" · ").slice(1).join(" · ")}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-5 anim-fade-up">
        <Card className="p-5"><h3 className="font-bold text-ink-900 mb-3">Active Case Severity</h3><DonutChart data={severityMix} /></Card>
        <Card className="p-5"><h3 className="font-bold text-ink-900 mb-3">SOS Volume — 7 Days</h3><TrendChart data={SOS_HISTORY} /></Card>
        <OperatorHandoff log={workspace.handoffLog} onComplete={completeHandoff} />
      </div>

      {/* CCTV Alerts Section */}
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h3 className="font-bold text-ink-900">CCTV Safety Violations (SafeZone AI)</h3>
          <select
            value={cctvFilter}
            onChange={(e) => setCctvFilter(e.target.value as "All" | "Open" | "Resolved")}
            className="rounded-lg border border-ink-200 px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-amber-400"
          >
            {(["All", "Open", "Resolved"] as const).map((option) => <option key={option}>{option}</option>)}
          </select>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          <div className="md:col-span-2 overflow-hidden border border-ink-200 rounded-xl bg-ink-950 aspect-video relative flex flex-col justify-between p-4">
            <div className="flex items-center justify-between text-white/80 text-xs font-mono">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-600 animate-pulse" /> LIVE CAMERA FEED
              </span>
              <span>1080p · 25 FPS · ZONE A</span>
            </div>
            <div className="my-auto text-center text-white/40 text-sm font-mono tracking-widest uppercase">
              {cameras[workspace.activeCam]}
              <div className="text-xs text-white/20 mt-1">[Mock video placeholder - Active Detection Mode]</div>
            </div>
            <div className="flex items-center justify-between text-white/60 text-[10px] font-mono">
              <span>CONF: 94.6%</span>
              <span>UTC: {timeStr}</span>
            </div>
            <div className="absolute top-4 right-4 flex gap-1.5">
              {cameras.map((cam, index) => (
                <button
                  key={cam}
                  onClick={() => setWorkspace((w) => ({ ...w, activeCam: index }))}
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                    workspace.activeCam === index ? "bg-white text-ink-900" : "bg-white/10 text-white/70 hover:bg-white/20"
                  }`}
                >
                  <Camera className="w-3 h-3" />Cam {index + 1}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-ink-500 uppercase tracking-wide">Pending Detections</h4>
            <div className="space-y-2">
              {visibleCctv.map((a) => (
                <div key={a.id} className={`p-3 rounded-xl border transition ${a.status === "Open" ? "border-amber-200 bg-amber-50/50" : "border-ink-150 bg-white"}`}>
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-bold text-ink-800">{a.type}</span>
                    <Badge tone={a.severity === "Critical" ? "red" : "amber"}>{a.severity}</Badge>
                  </div>
                  <p className="text-[11px] text-ink-500 mt-1">{a.cam} · {a.ts}</p>
                  {a.status === "Open" && (
                    <button onClick={() => acknowledgeCctv(a.id)} className="mt-2 text-[10px] font-semibold text-white bg-ink-900 px-2.5 py-1 rounded hover:bg-ink-800">
                      Acknowledge &amp; Clear
                    </button>
                  )}
                </div>
              ))}
              {!visibleCctv.length && <p className="text-xs text-ink-400">No detections match the current filter.</p>}
            </div>
          </div>
        </div>
      </Card>

      {showRules && (
        <div className="fixed inset-0 z-40 bg-ink-950/40 p-4 grid place-items-center" role="dialog" aria-modal="true" aria-label="Response rule settings">
          <Card className="w-full max-w-md p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-ink-900">Response rule settings</h2>
                <p className="text-xs text-ink-500 mt-1">Settings are saved locally for this browser.</p>
              </div>
              <button onClick={() => setShowRules(false)} aria-label="Close settings"><X className="w-5 h-5 text-ink-500" /></button>
            </div>
            <div className="mt-5 space-y-4">
              <label className="block text-xs font-semibold text-ink-600">
                SOS response threshold before auto-dispatch (seconds)
                <input
                  type="number"
                  min="5"
                  max="120"
                  value={workspace.rules.sosThresholdSec}
                  onChange={(e) => setRules({ ...workspace.rules, sosThresholdSec: Math.max(5, Number(e.target.value)) })}
                  className="mt-1 w-full rounded-lg border border-ink-200 px-3 py-2 text-sm"
                />
              </label>
              <label className="flex items-center justify-between gap-4 rounded-lg border border-ink-200 p-3 text-xs font-semibold text-ink-700">
                Auto-dispatch field crew
                <button
                  role="switch"
                  aria-checked={workspace.rules.autoDispatch}
                  onClick={() => setRules({ ...workspace.rules, autoDispatch: !workspace.rules.autoDispatch })}
                  className={`w-10 h-6 rounded-full p-0.5 transition ${workspace.rules.autoDispatch ? "bg-brand-600" : "bg-ink-300"}`}
                >
                  <span className={`block h-5 w-5 rounded-full bg-white transition ${workspace.rules.autoDispatch ? "translate-x-4" : "translate-x-0"}`} />
                </button>
              </label>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                <Zap className="w-4 h-4 float-left mr-2 mt-0.5" />
                When auto-dispatch is off, cases must be manually acknowledged and dispatched from the case table.
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setRules(DEFAULT_RULES)} className="text-xs font-semibold text-ink-600 px-3 py-2">Restore defaults</button>
              <button onClick={() => { setShowRules(false); setNotice("Response rules saved."); }} className="text-xs font-semibold bg-ink-900 text-white rounded-lg px-4 py-2">Save rules</button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
