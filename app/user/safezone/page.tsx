"use client";

import { useState, useEffect } from "react";
import { Card, SectionTitle, Badge } from "@/components/ui";
import { safetyAlerts } from "@/lib/data";
import {
  ScanEye, Wind, Flame, Gauge, ShieldCheck, AlertTriangle, Play, Radio, CheckCircle2,
} from "lucide-react";

type Sensor = { key: string; label: string; icon: React.ReactNode; value: string; ok: boolean };

export default function SafeZone() {
  const [scanning, setScanning] = useState(false);
  const [detected, setDetected] = useState(false);
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setPulse((p) => (p + 1) % 100), 40);
    return () => clearInterval(t);
  }, []);

  const sensors: Sensor[] = [
    { key: "gas", label: "Gas concentration", icon: <Flame className="w-4 h-4" />, value: detected ? "0.9% LEL ⚠" : "0.0% LEL", ok: !detected },
    { key: "vent", label: "Ventilation", icon: <Wind className="w-4 h-4" />, value: "Adequate", ok: true },
    { key: "press", label: "Line pressure", icon: <Gauge className="w-4 h-4" />, value: "21 mbar", ok: true },
    { key: "det", label: "Detector health", icon: <ShieldCheck className="w-4 h-4" />, value: "Online", ok: true },
  ];

  function runScan() {
    setScanning(true);
    setDetected(false);
    setTimeout(() => {
      setScanning(false);
    }, 2600);
  }

  return (
    <div className="space-y-6">
      <SectionTitle title="SafeZone AI" sub="Live AI safety monitoring of your premises — vision + sensor fusion" />

      <div className="grid lg:grid-cols-3 gap-5">
        {/* camera */}
        <Card className="lg:col-span-2 overflow-hidden">
          <div className="bg-ink-950 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Radio className="w-4 h-4 text-red-400" />
              <span className="font-semibold">Kitchen Cam · AI vision</span>
            </div>
            <span className="flex items-center gap-1.5 text-xs text-red-300">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" /> REC
            </span>
          </div>
          {/* fake camera scene */}
          <div className="relative bg-gradient-to-br from-ink-800 to-ink-900 h-[300px] overflow-hidden">
            {/* scene props */}
            <div className="absolute left-8 bottom-8 w-28 h-16 rounded-md bg-ink-700/70 border border-white/10" />
            <div className="absolute left-14 bottom-24 w-6 h-10 rounded bg-ink-600/60" />
            <div className="absolute right-12 bottom-8 w-24 h-24 rounded-md bg-ink-700/60 border border-white/10" />
            {/* scan line */}
            {scanning && (
              <div
                className="absolute left-0 right-0 h-16 bg-gradient-to-b from-brand-400/0 via-brand-400/30 to-brand-400/0"
                style={{ top: `${pulse * 3}%` }}
              />
            )}
            {/* detection boxes */}
            <div className="absolute left-6 bottom-6 w-32 h-20 border-2 border-brand-400 rounded-md">
              <span className="absolute -top-5 left-0 text-[10px] bg-brand-500 text-white px-1.5 rounded">stove · safe 98%</span>
            </div>
            {detected && (
              <div className="absolute left-12 bottom-20 w-16 h-16 border-2 border-red-500 rounded-md animate-pulse">
                <span className="absolute -top-5 left-0 text-[10px] bg-red-500 text-white px-1.5 rounded">gas plume · 0.9%</span>
              </div>
            )}
            <div className="absolute inset-0 grid place-items-center pointer-events-none">
              {scanning && <span className="text-brand-300 text-sm font-medium animate-pulse">Analyzing frame…</span>}
            </div>
          </div>
          <div className="p-4 flex flex-col sm:flex-row gap-2">
            <button
              onClick={runScan}
              disabled={scanning}
              className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold rounded-xl py-2.5 flex items-center justify-center gap-2 transition"
            >
              <Play className="w-4 h-4" /> {scanning ? "Scanning…" : "Run AI safety scan"}
            </button>
            <button
              onClick={() => setDetected((d) => !d)}
              className="px-4 py-2.5 sm:py-0 rounded-xl border border-ink-200 hover:bg-ink-100 text-ink-600 text-sm w-full sm:w-auto"
            >
              Simulate hazard
            </button>
          </div>
        </Card>

        {/* status */}
        <div className="space-y-5">
          <Card className={`p-5 ${detected ? "border-red-200 bg-red-50" : "border-brand-200 bg-brand-50"}`}>
            <div className="flex items-center gap-2 font-bold">
              {detected ? (
                <><AlertTriangle className="w-5 h-5 text-red-600" /><span className="text-red-700">Hazard detected</span></>
              ) : (
                <><ShieldCheck className="w-5 h-5 text-brand-600" /><span className="text-brand-700">Premises safe</span></>
              )}
            </div>
            <p className="text-sm text-ink-600 mt-2">
              {detected
                ? "Elevated gas signature near the stove. Ventilate, avoid switches, and follow the emergency guidance."
                : "AI vision + sensors show no gas, good ventilation and healthy equipment."}
            </p>
          </Card>

          <Card className="p-5">
            <h3 className="font-bold text-ink-900 mb-3 flex items-center gap-2">
              <ScanEye className="w-4 h-4 text-violet-600" /> Live sensors
            </h3>
            <ul className="space-y-2.5">
              {sensors.map((s) => (
                <li key={s.key} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-ink-600">{s.icon} {s.label}</span>
                  <span className={`font-semibold ${s.ok ? "text-ink-800" : "text-red-600"}`}>{s.value}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      {/* history */}
      <Card className="p-5">
        <h3 className="font-bold text-ink-900 mb-3">Recent safety events</h3>
        <ul className="space-y-2">
          {safetyAlerts.map((a, i) => (
            <li key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2.5 rounded-xl hover:bg-ink-50">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className={`shrink-0 h-8 w-8 rounded-lg grid place-items-center ${
                  a.level === "critical" ? "bg-red-50 text-red-500" : a.level === "warn" ? "bg-amber-50 text-amber-500" : "bg-brand-50 text-brand-600"
                }`}>
                  {a.level === "info" ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                </span>
                <span className="text-sm text-ink-700 truncate sm:whitespace-normal">{a.text}</span>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-3 pl-11 sm:pl-0 shrink-0">
                <span className="text-xs text-ink-400 shrink-0">{a.time}</span>
                <Badge tone={a.level === "critical" ? "red" : a.level === "warn" ? "amber" : "brand"}>{a.level}</Badge>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
