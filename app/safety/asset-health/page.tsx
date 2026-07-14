"use client";

import { useState } from "react";
import { Card, Kpi, SectionTitle, Badge } from "@/components/ui";
import CountUp from "@/components/CountUp";
import Typewriter from "@/components/Typewriter";
import { Wrench, CheckCircle2, AlertTriangle, Hammer, ShieldAlert, Cpu } from "lucide-react";

type Asset = { id: string; name: string; health: number; lastChecked: string; nextCheck: string; status: "Healthy" | "Attention" | "Critical" };

export default function AssetHealth() {
  const [assets] = useState<Asset[]>([
    { id: "COMP-104", name: "Reciprocating Compressor · Naroda", health: 62, lastChecked: "Jul 10, 2026", nextCheck: "Jul 15, 2026", status: "Attention" },
    { id: "PIPE-382", name: "High-Pressure Carbon Pipeline · Odhav CGS", health: 96, lastChecked: "Jun 24, 2026", nextCheck: "Jul 24, 2026", status: "Healthy" },
    { id: "REG-991", name: "Active Pressure Regulator Valve · Vastral", health: 48, lastChecked: "Jul 11, 2026", nextCheck: "Jul 14, 2026", status: "Critical" },
    { id: "METR-808", name: "Commercial Meter Assembly · Naroda Zone 2", health: 91, lastChecked: "Jun 12, 2026", nextCheck: "Aug 12, 2026", status: "Healthy" },
    { id: "VALV-215", name: "Emergency Isolation Gate Valve · Vatva", health: 88, lastChecked: "Jul 05, 2026", nextCheck: "Oct 05, 2026", status: "Healthy" }
  ]);

  const [sel, setSel] = useState(0);

  return (
    <div className="space-y-6 reveal">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-ink-900 via-ink-900 to-amber-900 text-white p-6 relative overflow-hidden shadow-soft">
        <div className="floaty absolute -right-10 -top-10 w-56 h-56 bg-amber-500/20 rounded-full blur-3xl" />
        <div className="relative">
          <p className="text-amber-300 text-xs font-semibold uppercase tracking-widest">Safety &amp; Operations Suite</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">
            <Typewriter speed={40} segments={[{ text: "Asset Health" }]} />
          </h1>
          <p className="text-ink-300 mt-2 text-sm max-w-2xl">
            Predictive lifecycle tracker. Monitors pipeline pressure integrity, compressor vibration anomalies, and valve inspection cadences.
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 anim-fade-up">
        <Kpi label="Total Monitored Assets" value={<CountUp to={2847} />} icon={<Cpu className="w-4 h-4" />} />
        <Kpi label="Overall Health Rate" value="91%" accent="text-brand-600" icon={<CheckCircle2 className="w-4 h-4" />} />
        <Kpi label="Maintenance Warnings" value={<CountUp to={23} />} accent="text-amber-600" icon={<AlertTriangle className="w-4 h-4" />} />
        <Kpi label="Critical Replacements" value={<CountUp to={4} />} accent="text-red-600" icon={<ShieldAlert className="w-4 h-4" />} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 anim-fade-up">
        {/* Assets table */}
        <Card className="lg:col-span-2 overflow-hidden">
          <div className="p-5 border-b border-ink-100">
            <h3 className="font-bold text-ink-900">Asset Health Matrix</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-ink-50 text-ink-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left font-semibold px-5 py-3">Asset ID</th>
                  <th className="text-right font-semibold px-3 py-3">Health score</th>
                  <th className="text-right font-semibold px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {assets.map((a, idx) => {
                  const tag = a.status === "Healthy" ? "brand" : a.status === "Attention" ? "amber" : "red";
                  const pctColor = a.health >= 85 ? "text-brand-600" : a.health >= 60 ? "text-amber-600" : "text-red-600";
                  return (
                    <tr key={a.id} onClick={() => setSel(idx)}
                      className={`cursor-pointer transition ${sel === idx ? "bg-amber-50/20" : "hover:bg-ink-50/40"}`}>
                      <td className="px-5 py-3.5">
                        <span className="font-bold text-ink-800 block">{a.id}</span>
                        <span className="text-xs text-ink-500 block mt-0.5">{a.name}</span>
                      </td>
                      <td className={`px-3 py-3.5 text-right font-bold ${pctColor}`}>{a.health}%</td>
                      <td className="px-5 py-3.5 text-right">
                        <Badge tone={tag}>{a.status}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Selected asset lifecycle details */}
        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="font-bold text-ink-900">{assets[sel].id}</h3>
            <span className="text-xs text-ink-500 block mt-0.5">{assets[sel].name}</span>

            <div className="mt-5 space-y-3.5 text-xs">
              <div className="flex justify-between">
                <span className="text-ink-500">Last inspected on:</span>
                <span className="font-bold text-ink-800">{assets[sel].lastChecked}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-500">Next check date:</span>
                <span className="font-bold text-ink-800">{assets[sel].nextCheck}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-500">Failure Probability:</span>
                <span className={`font-bold ${assets[sel].health < 60 ? "text-red-600 font-extrabold" : "text-ink-700"}`}>
                  {100 - assets[sel].health}%
                </span>
              </div>
            </div>

            <div className="mt-6">
              {assets[sel].status !== "Healthy" ? (
                <button className="w-full bg-ink-900 hover:bg-ink-800 text-white font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2">
                  <Wrench className="w-4 h-4" /> Schedule maintenance
                </button>
              ) : (
                <span className="block text-center text-xs font-semibold text-brand-600 bg-brand-50 p-2.5 rounded-xl border border-brand-100">
                  Asset in peak operating health
                </span>
              )}
            </div>
          </Card>

          <Card className="p-5">
            <h4 className="font-bold text-xs text-ink-700 uppercase tracking-wide">Predictive Insight</h4>
            <p className="text-xs text-ink-500 mt-2 leading-relaxed">
              Vibration telemetry on COMP-104 Compressor suggests bearing fatigue. Servicing before Jul 20 avoids potential CGS breakdown.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
