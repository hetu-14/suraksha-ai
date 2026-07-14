"use client";

import { useState, useEffect, useRef } from "react";
import { Card, SectionTitle, Kpi, Badge } from "@/components/ui";
import { Siren, Timer, Truck, CheckCircle2, MapPin, PhoneCall, Bell, Video, ShieldAlert, HardHat, Flame } from "lucide-react";

type CaseStatus = "AI guiding" | "Dispatched" | "Resolved";
type EmergencyCase = { id: string; area: string; severity: "High" | "Medium"; age: number; status: CaseStatus; crew?: string };

type CCTVAle = { id: string; cam: string; type: string; ts: string; status: "Open" | "Resolved"; severity: "Critical" | "Warning" };

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

export default function EmergencyDashboard() {
  const [cases, setCases] = useState<EmergencyCase[]>(initialCases);
  const [cctvAlerts, setCctvAlerts] = useState<CCTVAle[]>(initialCctv);
  const [feed, setFeed] = useState<string[]>([
    "System Alert · Pressure drop in Naroda CGS (Auto-resolved)",
    "New SOS · EMG-2231 · Maninagar — AI answering",
    "CCTV Alert · Ignition Source in Compressor Room"
  ]);
  const [activeCam, setActiveCam] = useState(0);
  const [timeStr, setTimeStr] = useState("");
  const tick = useRef(0);

  useEffect(() => {
    setTimeStr(new Date().toISOString());
    const interval = setInterval(() => {
      setTimeStr(new Date().toISOString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      tick.current += 1;
      setCases((cs) => cs.map((c) => ({ ...c, age: c.age + 1 })));

      // Spawn a new SOS emergency every 24 seconds
      if (tick.current % 24 === 0) {
        const id = "EMG-" + (2232 + Math.floor(tick.current / 24));
        const area = newAreas[Math.floor(Math.random() * newAreas.length)];
        const nc: EmergencyCase = { id, area, severity: Math.random() > 0.5 ? "High" : "Medium", age: 0, status: "AI guiding" };
        setCases((cs) => [nc, ...cs].slice(0, 6));
        setFeed((f) => [`New SOS · ${id} · ${area} — AI answering`, ...f].slice(0, 6));
      }

      // Auto-dispatch a crew after a case is guiding for > 10 seconds
      if (tick.current % 15 === 0) {
        setCases((cs) => {
          const idx = cs.findIndex((c) => c.status === "AI guiding" && c.age > 8);
          if (idx === -1) return cs;
          const crew = crews[Math.floor(Math.random() * crews.length)];
          setFeed((f) => [`Crew ${crew} auto-dispatched to ${cs[idx].id}`, ...f].slice(0, 6));
          return cs.map((c, i) => (i === idx ? { ...c, status: "Dispatched", crew } : c));
        });
      }
    }, 1000);
    return () => clearInterval(t);
  }, []);

  function dispatchCrew(id: string) {
    const crew = crews[Math.floor(Math.random() * crews.length)];
    setCases((cs) => cs.map((c) => (c.id === id ? { ...c, status: "Dispatched", crew } : c)));
    setFeed((f) => [`Crew ${crew} dispatched manually to ${id}`, ...f].slice(0, 6));
  }

  function resolveCase(id: string) {
    setCases((cs) => cs.map((c) => (c.id === id ? { ...c, status: "Resolved" } : c)));
    setFeed((f) => [`Case ${id} resolved`, ...f].slice(0, 6));
  }

  function acknowledgeCctv(id: string) {
    setCctvAlerts((alerts) => alerts.map((a) => (a.id === id ? { ...a, status: "Resolved" } : a)));
    setFeed((f) => [`CCTV alert ${id} resolved`, ...f].slice(0, 6));
  }

  const activeSOS = cases.filter((c) => c.status !== "Resolved").length;
  const activeCctv = cctvAlerts.filter((a) => a.status === "Open").length;

  return (
    <div className="space-y-6 reveal">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-ink-900 via-ink-900 to-amber-900 text-white p-6 relative overflow-hidden shadow-soft">
        <div className="floaty absolute -right-10 -top-10 w-56 h-56 bg-amber-500/20 rounded-full blur-3xl" />
        <div className="relative">
          <p className="text-amber-300 text-xs font-semibold uppercase tracking-widest">Safety &amp; Operations Console</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">Emergency Dashboard</h1>
          <p className="text-ink-300 mt-2 text-sm max-w-2xl">
            Unified control center: real-time customer SOS triggers, automated AI dispatcher, and live CCTV incident triage.
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Active Gas SOS" value={activeSOS} accent="text-red-500" icon={<Siren className="w-4 h-4 text-red-500 animate-pulse" />} />
        <Kpi label="Open CCTV Alerts" value={activeCctv} accent="text-amber-500" icon={<Video className="w-4 h-4" />} />
        <Kpi label="Avg AI Pickup" value="1.2s" icon={<Timer className="w-4 h-4" />} />
        <Kpi label="Crews Dispatched" value={cases.filter((c) => c.status === "Dispatched").length} icon={<Truck className="w-4 h-4" />} />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Active SOS section */}
        <Card className="lg:col-span-2 overflow-hidden">
          <div className="p-5 border-b border-ink-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-ink-900">Gas Emergency Cases</h3>
              <p className="text-xs text-ink-500 mt-0.5">Triaged via multilingual Customer App voice assistance</p>
            </div>
            <span className="flex items-center gap-1.5 text-xs text-red-600 font-semibold">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" /> Live SOS Stream
            </span>
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
                {cases.map((c) => (
                  <tr key={c.id} className={c.status === "AI guiding" ? "bg-red-50/50" : ""}>
                    <td className="px-5 py-3">
                      <div className="font-semibold text-ink-800">{c.id}</div>
                      <div className="text-xs text-ink-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-ink-400" /> {c.area} · {c.age}s ago
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <Badge tone={c.severity === "High" ? "red" : "amber"}>{c.severity}</Badge>
                    </td>
                    <td className="px-3 py-3 font-medium">
                      <span className={`inline-flex items-center gap-1.5 ${c.status === "Resolved" ? "text-brand-600" : c.status === "Dispatched" ? "text-sky-600" : "text-red-600"}`}>
                        {c.status} {c.crew && `(${c.crew})`}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {c.status === "AI guiding" ? (
                        <button onClick={() => dispatchCrew(c.id)} className="text-xs font-semibold text-white bg-red-600 px-3 py-1.5 rounded-lg hover:bg-red-700">
                          Dispatch Crew
                        </button>
                      ) : c.status === "Dispatched" ? (
                        <button onClick={() => resolveCase(c.id)} className="text-xs font-semibold text-ink-700 border border-ink-200 px-3 py-1.5 rounded-lg hover:bg-ink-100">
                          Mark Resolved
                        </button>
                      ) : (
                        <span className="text-xs text-ink-400">Archived</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Live notification feed */}
        <Card className="p-5">
          <h3 className="font-bold text-ink-900 mb-3">Live Triage Feed</h3>
          <div className="space-y-3">
            {feed.map((f, i) => (
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

      {/* CCTV Alerts Section */}
      <Card className="p-5">
        <h3 className="font-bold text-ink-900 mb-3">CCTV Safety Violations (SafeZone AI)</h3>
        <div className="grid md:grid-cols-3 gap-5">
          <div className="md:col-span-2 overflow-hidden border border-ink-200 rounded-xl bg-ink-950 aspect-video relative flex flex-col justify-between p-4">
            <div className="flex items-center justify-between text-white/80 text-xs font-mono">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-600 animate-pulse" /> LIVE CAMERA FEED
              </span>
              <span>1080p · 25 FPS · ZONE A</span>
            </div>
            <div className="my-auto text-center text-white/40 text-sm font-mono tracking-widest uppercase">
              {activeCam === 0 ? "Naroda Station Compressor Room" : "Vastral Station Dispenser 4"}
              <div className="text-xs text-white/20 mt-1">[Mock video placeholder - Active Detection Mode]</div>
            </div>
            <div className="flex items-center justify-between text-white/60 text-[10px] font-mono">
              <span>CONF: 94.6%</span>
              <span>UTC: {timeStr}</span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-ink-500 uppercase tracking-wide">Pending Detections</h4>
            <div className="space-y-2">
              {cctvAlerts.map((a) => (
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
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
