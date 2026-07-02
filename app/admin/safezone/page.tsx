"use client";

import { useState, useEffect, useRef } from "react";
import { Card, SectionTitle, Kpi, Badge } from "@/components/ui";
import {
  Video, HardHat, ShieldAlert, Flame, UserX, ScanEye, Camera, CheckCircle2, Bell,
} from "lucide-react";

type Cat = "No helmet" | "No safety vest" | "Restricted area" | "Ignition source" | "Loitering";

const CAT_META: Record<Cat, { tone: "red" | "amber" | "orange" | "sky"; icon: typeof HardHat; sev: "High" | "Medium" }> = {
  "No helmet": { tone: "red", icon: HardHat, sev: "High" },
  "No safety vest": { tone: "amber", icon: ShieldAlert, sev: "Medium" },
  "Restricted area": { tone: "red", icon: UserX, sev: "High" },
  "Ignition source": { tone: "red", icon: Flame, sev: "High" },
  "Loitering": { tone: "sky", icon: UserX, sev: "Medium" },
};

const toneClass: Record<string, string> = {
  red: "bg-red-50 text-red-600",
  amber: "bg-amber-50 text-amber-600",
  orange: "bg-orange-50 text-orange-600",
  sky: "bg-sky-50 text-sky-600",
};

const CAMERAS = [
  "Mother Station · Naroda", "CNG Station · Vastral", "CGS · Odhav",
  "CNG Station · Bopal", "City Gate · Ghatlodia", "DRS · Nikol",
];

type Alert = { id: number; cat: Cat; cam: string; ts: number; ack: boolean };

let counter = 1;
function makeAlert(): Alert {
  const cats = Object.keys(CAT_META) as Cat[];
  return { id: counter++, cat: cats[Math.floor(Math.random() * cats.length)], cam: CAMERAS[Math.floor(Math.random() * CAMERAS.length)], ts: Date.now(), ack: false };
}

export default function SafeZoneAdmin() {
  const [alerts, setAlerts] = useState<Alert[]>([
    { id: counter++, cat: "No helmet", cam: "Mother Station · Naroda", ts: Date.now() - 40000, ack: false },
    { id: counter++, cat: "Restricted area", cam: "CGS · Odhav", ts: Date.now() - 120000, ack: false },
    { id: counter++, cat: "No safety vest", cam: "CNG Station · Vastral", ts: Date.now() - 300000, ack: true },
  ]);
  const [violationsToday, setViolationsToday] = useState(37);
  const tick = useRef(0);

  useEffect(() => {
    const t = setInterval(() => {
      tick.current += 1;
      if (tick.current % 7 === 0) {
        setAlerts((a) => [makeAlert(), ...a].slice(0, 12));
        setViolationsToday((v) => v + 1);
      }
    }, 1000);
    return () => clearInterval(t);
  }, []);

  function ack(id: number) {
    setAlerts((a) => a.map((x) => (x.id === id ? { ...x, ack: true } : x)));
  }

  const open = alerts.filter((a) => !a.ack).length;

  return (
    <div className="space-y-6">
      <SectionTitle title="SafeZone AI — CCTV Safety Monitoring" sub="AI watches every camera 24×7 and flags safety violations the instant they happen" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Cameras online" value="48 / 50" sub="2 under maintenance" icon={<Camera className="w-4 h-4" />} />
        <Kpi label="Violations today" value={violationsToday} accent="text-amber-600" icon={<ScanEye className="w-4 h-4" />} />
        <Kpi label="Open cases" value={open} accent="text-red-600" icon={<Bell className="w-4 h-4" />} />
        <Kpi label="Avg resolution" value="7 min" icon={<CheckCircle2 className="w-4 h-4" />} />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* camera grid */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            {CAMERAS.slice(0, 4).map((cam, i) => {
              const flagged = i === 0 ? "No helmet" : i === 2 ? "Restricted area" : null;
              return (
                <Card key={cam} className="overflow-hidden">
                  <div className="bg-ink-950 text-white px-3 py-2 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5"><Video className="w-3.5 h-3.5 text-brand-300" /> {cam}</span>
                    <span className="flex items-center gap-1 text-red-300"><span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" /> REC</span>
                  </div>
                  <div className="relative bg-gradient-to-br from-ink-700 to-ink-900 h-36 overflow-hidden">
                    <div className="absolute left-4 bottom-4 w-16 h-20 rounded bg-ink-600/50" />
                    <div className="absolute right-6 bottom-4 w-20 h-14 rounded bg-ink-700/60 border border-white/10" />
                    {/* worker figure */}
                    <div className="absolute left-8 bottom-6 w-8 h-16 rounded-t-full bg-ink-500/70" />
                    {flagged && (
                      <div className="absolute left-6 bottom-5 w-12 h-20 border-2 border-red-500 rounded animate-pulse">
                        <span className="absolute -top-5 left-0 text-[9px] bg-red-500 text-white px-1 rounded whitespace-nowrap">{flagged}</span>
                      </div>
                    )}
                    {!flagged && (
                      <span className="absolute bottom-2 left-2 text-[10px] text-brand-300 bg-black/30 px-1.5 rounded">AI: all clear</span>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
          {/* category summary */}
          <Card className="p-5">
            <h3 className="font-bold text-ink-900 mb-3">Violations by category (today)</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(Object.keys(CAT_META) as Cat[]).map((c) => {
                const meta = CAT_META[c];
                const Icon = meta.icon;
                const count = alerts.filter((a) => a.cat === c).length + Math.floor(Math.random() * 3) + 2;
                return (
                  <div key={c} className="rounded-xl border border-ink-100 p-3">
                    <div className={`h-8 w-8 rounded-lg grid place-items-center ${toneClass[meta.tone]}`}><Icon className="w-4 h-4" /></div>
                    <div className="text-lg font-extrabold text-ink-900 mt-2">{count}</div>
                    <div className="text-[11px] text-ink-500">{c}</div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* live alert feed */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-ink-900">Live alerts</h3>
            <span className="flex items-center gap-1.5 text-xs text-brand-600 font-medium"><span className="h-2 w-2 rounded-full bg-brand-500 animate-pulse" /> monitoring</span>
          </div>
          <ul className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
            {alerts.map((a) => {
              const meta = CAT_META[a.cat];
              const Icon = meta.icon;
              return (
                <li key={a.id} className={`p-3 rounded-xl border animate-slideIn ${a.ack ? "border-ink-100 bg-white" : "border-red-100 bg-red-50/40"}`}>
                  <div className="flex items-start gap-2.5">
                    <span className={`shrink-0 h-8 w-8 rounded-lg grid place-items-center ${toneClass[meta.tone]}`}><Icon className="w-4 h-4" /></span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-ink-800">{a.cat}</span>
                        <Badge tone={meta.sev === "High" ? "red" : "amber"}>{meta.sev}</Badge>
                      </div>
                      <div className="text-xs text-ink-500 mt-0.5">{a.cam} · {rel(a.ts)}</div>
                    </div>
                    {a.ack ? (
                      <span className="text-[11px] text-brand-600 font-semibold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Ack</span>
                    ) : (
                      <button onClick={() => ack(a.id)} className="text-[11px] font-semibold text-white bg-ink-900 px-2.5 py-1 rounded-lg hover:bg-ink-800">Assign</button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function rel(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  return m < 60 ? `${m}m ago` : `${Math.floor(m / 60)}h ago`;
}
