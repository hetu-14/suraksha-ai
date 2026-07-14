"use client";

import { useState, useEffect } from "react";
import { Card, Kpi, SectionTitle, Badge } from "@/components/ui";
import CountUp from "@/components/CountUp";
import Typewriter from "@/components/Typewriter";
import { Building2, CheckCircle2, AlertTriangle, AlertOctagon, HelpCircle, HardHat, TrendingUp } from "lucide-react";

type Station = { name: string; score: number; status: "Operational" | "Maintenance" | "Alert"; details: string };

export default function StationReadiness() {
  const [stations, setStations] = useState<Station[]>([
    { name: "Mother Station · Naroda", score: 94, status: "Operational", details: "All compressor units nominal. Pressure steady." },
    { name: "CNG Station · Vastral", score: 88, status: "Operational", details: "Dispenser 3 scheduled maintenance completed." },
    { name: "CGS · Odhav", score: 71, status: "Maintenance", details: "Checking regulator bypass valve seals." },
    { name: "CNG Station · Bopal", score: 92, status: "Operational", details: "Pressure values optimal. Daily check verified." },
    { name: "Compressor Room · Naroda", score: 62, status: "Alert", details: "Compressor unit 4 temp warning logged." },
    { name: "Gate Entry · Vatva", score: 86, status: "Operational", details: "Visitor screening active. Safety gates functional." }
  ]);

  const [sel, setSel] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      // Simulate minor scores fluctuation
      setStations((prev) =>
        prev.map((s) => {
          const delta = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
          const ns = Math.min(100, Math.max(50, s.score + delta));
          return { ...s, score: ns };
        })
      );
    }, 4000);
    return () => clearInterval(t);
  }, []);

  const overallScore = Math.round(stations.reduce((sum, s) => sum + s.score, 0) / stations.length);
  const operationalCount = stations.filter((s) => s.status === "Operational").length;
  const alertCount = stations.filter((s) => s.status === "Alert").length;

  return (
    <div className="space-y-6 reveal">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-ink-900 via-ink-900 to-amber-900 text-white p-6 relative overflow-hidden shadow-soft">
        <div className="floaty absolute -right-10 -top-10 w-56 h-56 bg-amber-500/20 rounded-full blur-3xl" />
        <div className="relative">
          <p className="text-amber-300 text-xs font-semibold uppercase tracking-widest">Safety &amp; Operations Suite</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">
            <Typewriter speed={40} segments={[{ text: "Station Readiness Index" }]} />
          </h1>
          <p className="text-ink-300 mt-2 text-sm max-w-2xl">
            Real-time inspection checklists, equipment telemetry metrics, and staff compliance checks mapped to a single unified readiness index.
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 anim-fade-up">
        <Kpi label="Readiness Index" value={`${overallScore}%`} icon={<Building2 className="w-4 h-4 text-amber-500" />} />
        <Kpi label="Operational Stations" value={`${operationalCount} / ${stations.length}`} accent="text-brand-600" icon={<CheckCircle2 className="w-4 h-4" />} />
        <Kpi label="Active Alerts" value={alertCount} accent={alertCount > 0 ? "text-red-600" : "text-ink-500"} icon={<AlertOctagon className="w-4 h-4" />} />
        <Kpi label="Daily Inspections Due" value={<CountUp to={3} />} icon={<HardHat className="w-4 h-4" />} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 anim-fade-up">
        {/* Stations List */}
        <Card className="lg:col-span-2 overflow-hidden">
          <div className="p-5 border-b border-ink-100 flex items-center justify-between">
            <h3 className="font-bold text-ink-900">Readiness Status Queue</h3>
            <span className="text-xs text-ink-500">Live telemetry fluctuations</span>
          </div>

          <div className="divide-y divide-ink-100">
            {stations.map((s, idx) => {
              const bg = s.score >= 85 ? "bg-brand-50" : s.score >= 70 ? "bg-amber-50" : "bg-red-50/50";
              const border = s.score >= 85 ? "border-brand-200" : s.score >= 70 ? "border-amber-200" : "border-red-200";
              const text = s.score >= 85 ? "text-brand-700" : s.score >= 70 ? "text-amber-700" : "text-red-700";
              const tag = s.status === "Operational" ? "brand" : s.status === "Maintenance" ? "sky" : "red";

              return (
                <div key={idx} onClick={() => setSel(idx)}
                  className={`p-4 flex items-center justify-between cursor-pointer transition ${sel === idx ? "bg-amber-50/20" : "hover:bg-ink-50/40"}`}>
                  <div>
                    <span className="font-semibold text-sm text-ink-800 block">{s.name}</span>
                    <span className="text-xs text-ink-500 mt-1 block">Status: <Badge tone={tag}>{s.status}</Badge></span>
                  </div>
                  <div className={`px-3 py-1.5 rounded-lg border font-bold text-xs ${bg} ${border} ${text}`}>
                    {s.score}% Readiness
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Selected Station detail */}
        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="font-bold text-ink-900 mb-2">{stations[sel].name}</h3>
            <span className="inline-block text-xs font-semibold text-ink-500 mb-4">Inspection breakdown details</span>
            
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs text-ink-700 font-semibold mb-1">
                  <span>Compressor Unit Telemetry</span>
                  <span>{stations[sel].score >= 85 ? "92%" : "70%"}</span>
                </div>
                <div className="h-1.5 rounded-full bg-ink-150 overflow-hidden">
                  <div className="h-full bg-amber-500" style={{ width: `${stations[sel].score >= 85 ? 92 : 70}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-ink-700 font-semibold mb-1">
                  <span>Safety Checklist Verification</span>
                  <span>{stations[sel].score >= 75 ? "88%" : "55%"}</span>
                </div>
                <div className="h-1.5 rounded-full bg-ink-150 overflow-hidden">
                  <div className="h-full bg-amber-500" style={{ width: `${stations[sel].score >= 75 ? 88 : 55}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-ink-700 font-semibold mb-1">
                  <span>Staff Certifications &amp; Attendance</span>
                  <span>95%</span>
                </div>
                <div className="h-1.5 rounded-full bg-ink-150 overflow-hidden">
                  <div className="h-full bg-brand-500" style={{ width: "95%" }} />
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-ink-50 rounded-xl border border-ink-100 text-xs text-ink-600 leading-relaxed mt-5">
              <span className="font-bold block text-ink-800 mb-1">System Diagnostics:</span>
              {stations[sel].details}
            </div>
          </Card>

          <Card className="p-5 bg-gradient-to-br from-amber-500/5 to-transparent border-amber-500/10 text-xs">
            <h4 className="font-bold text-xs text-amber-800 uppercase tracking-wide">Readiness Mandate</h4>
            <p className="text-amber-800/80 mt-1 leading-relaxed">
              CNG refueling stations must maintain a minimum index of 80% to comply with quarterly regional safety guidelines.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
