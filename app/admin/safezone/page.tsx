"use client";

import { useState, useEffect, useRef } from "react";
import { Card, SectionTitle, Kpi, Badge } from "@/components/ui";
import {
  Video, HardHat, ShieldAlert, Flame, UserX, ScanEye, Camera, CheckCircle2, Bell, Wifi, WifiOff,
} from "lucide-react";

type Cat = "No helmet" | "No safety vest" | "Restricted area" | "Ignition source" | "Loitering" | "Person detected";

const CAT_META: Record<string, { tone: "red" | "amber" | "sky"; icon: typeof HardHat; sev: "High" | "Medium" }> = {
  "No helmet": { tone: "red", icon: HardHat, sev: "High" },
  "No safety vest": { tone: "amber", icon: ShieldAlert, sev: "Medium" },
  "Restricted area": { tone: "red", icon: UserX, sev: "High" },
  "Ignition source": { tone: "red", icon: Flame, sev: "High" },
  "Loitering": { tone: "sky", icon: UserX, sev: "Medium" },
  "Person detected": { tone: "sky", icon: UserX, sev: "Medium" },
};
const metaFor = (c: string) => CAT_META[c] ?? { tone: "amber" as const, icon: ShieldAlert, sev: "Medium" as const };
const toneClass: Record<string, string> = {
  red: "bg-red-50 text-red-600",
  amber: "bg-amber-50 text-amber-600",
  sky: "bg-sky-50 text-sky-600",
};

const API = process.env.NEXT_PUBLIC_SAFEZONE_API || "http://localhost:8000";
const CAMERAS = ["Mother Station · Naroda", "CNG Station · Vastral", "CGS · Odhav", "CNG Station · Bopal"];

type Alert = { id: number; cat: string; cam: string; ts: number; ack: boolean };

let simId = 1;
const simCats: Cat[] = ["No helmet", "No safety vest", "Restricted area", "Ignition source", "Loitering"];

export default function SafeZoneAdmin() {
  const [connected, setConnected] = useState(false);
  const [live, setLive] = useState<Alert[]>([]);
  const [sim, setSim] = useState<Alert[]>([
    { id: simId++, cat: "No helmet", cam: CAMERAS[0], ts: Date.now() - 40000, ack: false },
    { id: simId++, cat: "Restricted area", cam: CAMERAS[2], ts: Date.now() - 120000, ack: false },
    { id: simId++, cat: "No safety vest", cam: CAMERAS[1], ts: Date.now() - 300000, ack: true },
  ]);
  const [violations, setViolations] = useState(37);
  const ackRef = useRef<Set<number>>(new Set());
  const tick = useRef(0);

  // Poll the Python detector; fall back to simulation if unreachable.
  useEffect(() => {
    let stop = false;
    async function poll() {
      try {
        const r = await fetch(`${API}/events`, { cache: "no-store" });
        if (!r.ok) throw new Error();
        const data: { id: number; cat: string; cam: string; ts: string }[] = await r.json();
        if (stop) return;
        setConnected(true);
        setLive(data.slice(0, 14).map((e) => ({ id: e.id, cat: e.cat, cam: e.cam, ts: new Date(e.ts).getTime(), ack: ackRef.current.has(e.id) })));
      } catch {
        if (!stop) setConnected(false);
      }
    }
    poll();
    const t = setInterval(poll, 2500);
    return () => { stop = true; clearInterval(t); };
  }, []);

  // Simulation only runs while the detector is offline.
  useEffect(() => {
    if (connected) return;
    const t = setInterval(() => {
      tick.current += 1;
      if (tick.current % 7 === 0) {
        const a: Alert = { id: simId++, cat: simCats[Math.floor(Math.random() * simCats.length)], cam: CAMERAS[Math.floor(Math.random() * CAMERAS.length)], ts: Date.now(), ack: false };
        setSim((s) => [a, ...s].slice(0, 12));
        setViolations((v) => v + 1);
      }
    }, 1000);
    return () => clearInterval(t);
  }, [connected]);

  const alerts = connected ? live : sim;
  const open = alerts.filter((a) => !a.ack).length;

  function ack(id: number) {
    if (connected) {
      ackRef.current.add(id);
      setLive((l) => l.map((a) => (a.id === id ? { ...a, ack: true } : a)));
    } else {
      setSim((s) => s.map((a) => (a.id === id ? { ...a, ack: true } : a)));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <SectionTitle title="SafeZone AI — CCTV Safety Monitoring" sub="A Python + YOLO detector watches the feed and flags violations in real time" />
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-full border ${connected ? "bg-brand-50 border-brand-200 text-brand-700" : "bg-amber-50 border-amber-200 text-amber-700"}`}>
          {connected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          {connected ? "Live detector" : "Simulated feed"}
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Cameras online" value={connected ? "1 live" : "48 / 50"} sub={connected ? "detector connected" : "2 under maintenance"} icon={<Camera className="w-4 h-4" />} />
        <Kpi label="Violations today" value={connected ? alerts.length : violations} accent="text-amber-600" icon={<ScanEye className="w-4 h-4" />} />
        <Kpi label="Open cases" value={open} accent="text-red-600" icon={<Bell className="w-4 h-4" />} />
        <Kpi label="Avg resolution" value="7 min" icon={<CheckCircle2 className="w-4 h-4" />} />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* camera grid */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            {/* live / first camera */}
            <Card className="overflow-hidden">
              <div className="bg-ink-950 text-white px-3 py-2 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5"><Video className="w-3.5 h-3.5 text-brand-300" /> {connected ? (live[0]?.cam || "Live detector") : CAMERAS[0]}</span>
                <span className="flex items-center gap-1 text-red-300"><span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" /> REC</span>
              </div>
              {connected ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`${API}/video`} alt="live detector" className="w-full h-36 object-cover bg-ink-900" />
              ) : (
                <CameraScene flagged="No helmet" />
              )}
            </Card>
            {CAMERAS.slice(1, 4).map((cam, i) => (
              <Card key={cam} className="overflow-hidden">
                <div className="bg-ink-950 text-white px-3 py-2 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5"><Video className="w-3.5 h-3.5 text-brand-300" /> {cam}</span>
                  <span className="flex items-center gap-1 text-red-300"><span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" /> REC</span>
                </div>
                <CameraScene flagged={i === 1 ? "Restricted area" : null} />
              </Card>
            ))}
          </div>

          {/* category summary */}
          <Card className="p-5">
            <h3 className="font-bold text-ink-900 mb-3">Violations by category</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(Object.keys(CAT_META) as string[]).filter((c) => c !== "Person detected").map((c) => {
                const meta = metaFor(c);
                const Icon = meta.icon;
                const count = alerts.filter((a) => a.cat === c).length;
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

        {/* live alerts */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-ink-900">Live alerts</h3>
            <span className="flex items-center gap-1.5 text-xs text-brand-600 font-medium"><span className="h-2 w-2 rounded-full bg-brand-500 animate-pulse" /> monitoring</span>
          </div>
          {alerts.length === 0 && <p className="text-sm text-ink-400 py-8 text-center">No violations detected yet.</p>}
          <ul className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
            {alerts.map((a) => {
              const meta = metaFor(a.cat);
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

function CameraScene({ flagged }: { flagged: string | null }) {
  return (
    <div className="relative bg-gradient-to-br from-ink-700 to-ink-900 h-36 overflow-hidden">
      <div className="absolute left-4 bottom-4 w-16 h-20 rounded bg-ink-600/50" />
      <div className="absolute right-6 bottom-4 w-20 h-14 rounded bg-ink-700/60 border border-white/10" />
      <div className="absolute left-8 bottom-6 w-8 h-16 rounded-t-full bg-ink-500/70" />
      {flagged ? (
        <div className="absolute left-6 bottom-5 w-12 h-20 border-2 border-red-500 rounded animate-pulse">
          <span className="absolute -top-5 left-0 text-[9px] bg-red-500 text-white px-1 rounded whitespace-nowrap">{flagged}</span>
        </div>
      ) : (
        <span className="absolute bottom-2 left-2 text-[10px] text-brand-300 bg-black/30 px-1.5 rounded">AI: all clear</span>
      )}
    </div>
  );
}

function rel(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  return m < 60 ? `${m}m ago` : `${Math.floor(m / 60)}h ago`;
}
