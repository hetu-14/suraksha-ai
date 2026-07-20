"use client";

import { useState } from "react";
import { Card, Kpi, SectionTitle, Badge, DataTable } from "@/components/ui";
import CountUp from "@/components/CountUp";
import { useLocalWorkspaceState } from "@/lib/useLocalWorkspaceState";
import { Wrench, CheckCircle2, AlertTriangle, Hammer, ShieldAlert, Cpu } from "lucide-react";

type Asset = { id: string; name: string; health: number; lastChecked: string; nextCheck: string; status: "Healthy" | "Attention" | "Critical" };
const money = (value: number) => `₹${value.toLocaleString("en-IN")}`;

export default function AssetHealth() {
  const [assets, setAssets] = useLocalWorkspaceState<Asset[]>("suraksha:asset-health", [
    { id: "COMP-104", name: "Reciprocating Compressor · Naroda", health: 62, lastChecked: "Jul 10, 2026", nextCheck: "Jul 15, 2026", status: "Attention" },
    { id: "PIPE-382", name: "High-Pressure Carbon Pipeline · Odhav CGS", health: 96, lastChecked: "Jun 24, 2026", nextCheck: "Jul 24, 2026", status: "Healthy" },
    { id: "REG-991", name: "Active Pressure Regulator Valve · Vastral", health: 48, lastChecked: "Jul 11, 2026", nextCheck: "Jul 14, 2026", status: "Critical" },
    { id: "METR-808", name: "Commercial Meter Assembly · Naroda Zone 2", health: 91, lastChecked: "Jun 12, 2026", nextCheck: "Aug 12, 2026", status: "Healthy" },
    { id: "VALV-215", name: "Emergency Isolation Gate Valve · Vatva", health: 88, lastChecked: "Jul 05, 2026", nextCheck: "Oct 05, 2026", status: "Healthy" }
  ]);

  const [sel, setSel] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const selected = assets[sel];
  const criticality = selected.id.includes("COMP") ? 95 : selected.id.includes("REG") ? 90 : 65;
  function scheduleMaintenance() { setAssets((current) => current.map((asset, index) => index === sel ? { ...asset, health: Math.min(88, asset.health + 20), status: "Attention", nextCheck: "Jul 18, 2026 · 2:00 PM" } : asset)); setNotice(`${selected.id} maintenance scheduled; health forecast updated.`); }

  return (
    <div className="space-y-6 reveal">
      {notice && <div className="fixed right-4 top-4 z-50 rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-xl">{notice}<button className="ml-3" onClick={() => setNotice(null)}>×</button></div>}
      {/* Header Banner */}
      <div className="rounded-xl bg-ink-950 text-white p-6 relative overflow-hidden ">
        <div className="relative">
          <p className="text-amber-300 text-xs font-semibold uppercase tracking-widest">Safety &amp; Operations Suite</p>
          <h1 className="text-2xl sm:text-3xl font-bold mt-1">
            Asset Health
          </h1>
          <p className="text-ink-300 mt-2 text-sm max-w-2xl">
            Predictive lifecycle tracker. Monitors pipeline pressure integrity, compressor vibration anomalies, and valve inspection cadences.
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 anim-fade-up">
        <Kpi label="Total Monitored Assets" value={<CountUp to={2847} />} icon={<Cpu className="w-4 h-4" />} />
        <Kpi label="Portfolio health" value="91%" sub="4 critical assets · 23 attention required" accent="text-brand-600" icon={<CheckCircle2 className="w-4 h-4" />} />
        <Kpi label="Maintenance Warnings" value={<CountUp to={23} />} accent="text-amber-600" icon={<AlertTriangle className="w-4 h-4" />} />
        <Kpi label="Critical Replacements" value={<CountUp to={4} />} accent="text-red-600" icon={<ShieldAlert className="w-4 h-4" />} />
      </div>

      <div className="grid gap-5 lg:grid-cols-3"><Card className="p-5 lg:col-span-2"><h2 className="font-bold text-ink-900">{selected.id} · health explanation & criticality</h2><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{[["Vibration",selected.health < 70 ? "45%":"78%"],["Temperature","71%"],["Pressure variation","66%"],["Inspection compliance","92%"]].map(([label,value]) => <div key={label} className="rounded-xl bg-ink-50 p-3"><p className="text-[10px] uppercase text-ink-500">{label}</p><p className="mt-1 text-lg font-bold">{value}</p></div>)}</div><p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">Why health is {selected.health}%: vibration increased 23%, operating temperature exceeded baseline, and bearing wear pattern was detected.</p></Card><Card className="p-5"><p className="text-xs font-bold uppercase text-red-700">Criticality matrix</p><p className="mt-2 text-2xl font-bold text-red-700">Very High</p><p className="mt-2 text-xs">Health {selected.health}% · business criticality {criticality}% · mother-station dependency high.</p></Card></div>
      <div className="grid gap-5 lg:grid-cols-3"><Card className="p-5"><h2 className="font-bold">Next best action</h2><p className="mt-3 text-sm font-bold">Bearing replacement</p><p className="mt-1 text-xs text-ink-600">₹12,000 · within 7 days · expected health {selected.health}% → 88%</p><button onClick={scheduleMaintenance} className="mt-4 w-full rounded-lg bg-ink-900 py-2 text-xs font-bold text-white">Schedule 18 Jul · 2–4 PM</button></Card><Card className="p-5"><h2 className="font-bold">If asset fails</h2><div className="mt-3 space-y-2 text-xs"><p>Affected customers: <strong>5,200</strong></p><p>Expected downtime: <strong>8 hours</strong></p><p>Revenue impact: <strong>{money(150000)}</strong></p><p>Station readiness: <strong>−12 points</strong></p></div></Card><Card className="p-5"><h2 className="font-bold">Cost avoidance</h2><p className="mt-3 text-2xl font-bold text-brand-700">₹3.08L</p><p className="mt-1 text-xs text-ink-600">Preventive cost ₹12,000 vs potential failure cost ₹3.20L.</p></Card></div>

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
                <span className={`font-bold ${assets[sel].health < 60 ? "text-red-600 font-bold" : "text-ink-700"}`}>
                  {100 - assets[sel].health}%
                </span>
              </div>
            </div>

            <div className="mt-6">
              {assets[sel].status !== "Healthy" ? (
                <button onClick={scheduleMaintenance} className="w-full bg-ink-900 hover:bg-ink-800 text-white font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors">
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
