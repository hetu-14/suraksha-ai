"use client";

import { useState, useEffect } from "react";
import { Card, Kpi, SectionTitle, Badge } from "@/components/ui";
import CountUp from "@/components/CountUp";
import Typewriter from "@/components/Typewriter";
import { Monitor, ShieldAlert, Activity, Heart, Thermometer, Wind, Zap } from "lucide-react";

type RegionStatus = { name: string; pressure: number; flow: number; complaints: number; status: "Healthy" | "Attention" | "Critical" };

export default function CommandCenter() {
  const [regions, setRegions] = useState<RegionStatus[]>([
    { name: "Maninagar Zone", pressure: 4.2, flow: 1280, complaints: 1, status: "Healthy" },
    { name: "Vastral Zone", pressure: 4.0, flow: 940, complaints: 0, status: "Healthy" },
    { name: "Odhav Zone", pressure: 3.8, flow: 1100, complaints: 2, status: "Healthy" },
    { name: "Naroda Station", pressure: 4.5, flow: 2100, complaints: 0, status: "Healthy" },
    { name: "Vatva Gate", pressure: 3.5, flow: 780, complaints: 0, status: "Healthy" },
    { name: "Bopal Zone", pressure: 4.1, flow: 1350, complaints: 1, status: "Healthy" },
    { name: "Ghatlodia", pressure: 2.9, flow: 640, complaints: 3, status: "Attention" },
    { name: "Gandhinagar", pressure: 4.3, flow: 1800, complaints: 0, status: "Healthy" }
  ]);

  const [feed, setFeed] = useState<string[]>([
    "09:12 - Vastral telemetry verified nominal",
    "09:10 - Pressure drop warning resolved in Naroda",
    "09:05 - Operator Shift changed (Duty Head: A. Sharma)"
  ]);

  useEffect(() => {
    const t = setInterval(() => {
      // Simulate slight pressure and flow fluctuations
      setRegions((prev) =>
        prev.map((r) => {
          const deltaP = (Math.random() - 0.5) * 0.2;
          const deltaF = Math.floor((Math.random() - 0.5) * 50);
          const newP = parseFloat(Math.min(5, Math.max(1, r.pressure + deltaP)).toFixed(2));
          const newF = Math.min(5000, Math.max(100, r.flow + deltaF));
          const status = newP < 3.0 ? "Attention" : newP < 2.0 ? "Critical" : "Healthy";
          return { ...r, pressure: newP, flow: newF, status };
        })
      );

      // Random logs added
      if (Math.random() > 0.6) {
        const timestamp = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        const logTemplates = [
          "Telemetry ping complete for Vatva inlet",
          "Pressure adjustment commanded for Naroda regulator",
          "Billing audit database synchronization complete",
          "SLA watchdog timers nominal"
        ];
        const newLog = `${timestamp} - ${logTemplates[Math.floor(Math.random() * logTemplates.length)]}`;
        setFeed((prev) => [newLog, ...prev].slice(0, 5));
      }
    }, 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="space-y-6 reveal">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-ink-900 via-ink-900 to-indigo-900 text-white p-6 relative overflow-hidden shadow-soft">
        <div className="floaty absolute -right-10 -top-10 w-56 h-56 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="relative">
          <p className="text-indigo-300 text-xs font-semibold uppercase tracking-widest">Business Intelligence Suite</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">
            <Typewriter speed={40} segments={[{ text: "Operations Command Center" }]} />
          </h1>
          <p className="text-ink-300 mt-2 text-sm max-w-2xl">
            Live telemetry monitoring grid. Tracks regional gas supply pressure, inlet flow rates, active complaints, and dispatch crew statuses.
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 anim-fade-up">
        <Kpi label="Monitored Zones" value="8 / 8" icon={<Monitor className="w-4 h-4 text-indigo-500" />} />
        <Kpi label="Active Operations" value="Nominal" accent="text-brand-600" icon={<Activity className="w-4 h-4" />} />
        <Kpi label="Supply Uptime (MTD)" value="99.97%" icon={<Zap className="w-4 h-4 text-indigo-500" />} />
        <Kpi label="Atmosphere temp" value="31°C" icon={<Thermometer className="w-4 h-4" />} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 anim-fade-up">
        {/* Status Grid */}
        <Card className="lg:col-span-2 p-6">
          <h3 className="font-bold text-ink-900 mb-4">Regional Supply Telemetry</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {regions.map((r, idx) => {
              const bg = r.status === "Healthy" ? "bg-brand-50" : r.status === "Attention" ? "bg-amber-50" : "bg-red-50/50";
              const border = r.status === "Healthy" ? "border-brand-100" : r.status === "Attention" ? "border-amber-200" : "border-red-200";
              const dot = r.status === "Healthy" ? "bg-brand-500" : r.status === "Attention" ? "bg-amber-500" : "bg-red-500 animate-ping";

              return (
                <div key={idx} className={`p-4 rounded-2xl border ${bg} ${border} flex flex-col justify-between`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-ink-800">{r.name}</span>
                    <span className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold uppercase tracking-wide ${r.status === "Healthy" ? "text-brand-700" : r.status === "Attention" ? "text-amber-700" : "text-red-700"}`}>{r.status}</span>
                      <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-4 text-xs">
                    <div>
                      <span className="block text-ink-500">Pressure</span>
                      <span className="font-extrabold text-ink-800 tabular-nums">{r.pressure} bar</span>
                    </div>
                    <div>
                      <span className="block text-ink-500">Flow Rate</span>
                      <span className="font-extrabold text-ink-800 tabular-nums">{r.flow} SCM/h</span>
                    </div>
                    <div>
                      <span className="block text-ink-500">Complaints</span>
                      <span className={`font-extrabold tabular-nums ${r.complaints > 1 ? "text-amber-700" : "text-ink-800"}`}>{r.complaints}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Live log feed */}
        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="font-bold text-ink-900 mb-3">Live Log Feed</h3>
            <div className="space-y-2.5 pr-2">
              {feed.map((f, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-ink-50 border border-ink-100 text-xs font-mono text-ink-700">
                  {f}
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-bold text-ink-900 mb-2">Shift Duty Personnel</h3>
            <div className="space-y-2 text-xs text-ink-600 mt-3">
              <div className="flex justify-between border-b border-ink-100 pb-2">
                <span>Duty Supervisor:</span>
                <span className="font-bold text-ink-800">Amit Sharma (Operator-1)</span>
              </div>
              <div className="flex justify-between border-b border-ink-100 pb-2">
                <span>Secondary Officer:</span>
                <span className="font-bold text-ink-800">Rohan Das (Operator-3)</span>
              </div>
              <div className="flex justify-between">
                <span>Emergency Response:</span>
                <span className="font-bold text-brand-600">Unit GA-4, GA-2 standby</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
