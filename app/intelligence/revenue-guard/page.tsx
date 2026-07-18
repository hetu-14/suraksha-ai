"use client";

import { useState } from "react";
import { Card, SectionTitle, Kpi } from "@/components/ui";
import { FingerprintChart } from "@/components/Charts";
import { anomalies } from "@/lib/data";
import { ShieldAlert, IndianRupee, Target, ScanLine, MapPin, Check } from "lucide-react";

export default function RevGuard() {
  const [sel, setSel] = useState(0);
  const [dispatched, setDispatched] = useState(false);
  const d = anomalies[sel];

  return (
    <div className="space-y-6">
      <SectionTitle title="Revenue Guard — Revenue & Tampering Intelligence" sub="Finds hidden money in data you already have" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Accounts scanned" value="2,41,860" icon={<ScanLine className="w-4 h-4" />} />
        <Kpi label="High-risk flagged" value="142" accent="text-red-600" icon={<ShieldAlert className="w-4 h-4" />} />
        <Kpi label="Est. revenue at risk" value="₹27.3L" icon={<IndianRupee className="w-4 h-4" />} />
        <Kpi label="Model precision" value="91%" icon={<Target className="w-4 h-4" />} />
      </div>

      <div className="grid lg:grid-cols-5 gap-5">
        <Card className="lg:col-span-3 overflow-hidden">
          <div className="p-5 border-b border-ink-100 flex items-center justify-between">
            <h3 className="font-bold text-ink-900">Investigate-first queue</h3>
            <span className="text-xs text-ink-500">Ranked by anomaly score</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-ink-50 text-ink-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left font-semibold px-5 py-3">Account</th>
                  <th className="text-left font-semibold px-3 py-3">Area</th>
                  <th className="text-left font-semibold px-3 py-3">Pattern</th>
                  <th className="text-right font-semibold px-3 py-3">At risk</th>
                  <th className="text-right font-semibold px-5 py-3">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {anomalies.map((a, i) => {
                  const sc = a.score >= 90 ? "bg-red-100 text-red-700" : a.score >= 83 ? "bg-amber-100 text-amber-700" : "bg-sky-100 text-sky-700";
                  return (
                    <tr key={a.id} onClick={() => { setSel(i); setDispatched(false); }}
                      className={`cursor-pointer transition ${sel === i ? "bg-brand-50" : "hover:bg-brand-50/40"}`}>
                      <td className="px-5 py-3 font-semibold text-ink-800">{a.id}</td>
                      <td className="px-3 py-3 text-ink-600">{a.area}</td>
                      <td className="px-3 py-3 text-ink-600">{a.pattern}</td>
                      <td className="px-3 py-3 text-right font-medium">{a.risk}</td>
                      <td className="px-5 py-3 text-right"><span className={`px-2 py-1 rounded-full text-xs font-bold ${sc}`}>{a.score}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="lg:col-span-2 p-5">
          <h3 className="font-bold text-ink-900">{d.id} — {d.pattern}</h3>
          <p className="text-xs text-ink-500 mb-3">{d.area} · anomaly score {d.score} · {d.risk} at risk</p>
          <FingerprintChart normal={d.normal} actual={d.actual} />

          <div className="mt-4 rounded-xl bg-ink-50 border border-ink-100 p-3 text-xs space-y-1.5">
            <p className="font-bold text-ink-800 uppercase tracking-wide text-[10px]">AI assessment</p>
            <p className="text-ink-600 leading-relaxed">
              Consumption fingerprint deviates {Math.round((1 - d.actual[d.actual.length - 1] / d.normal[d.normal.length - 1]) * 100)}% from the account&apos;s seasonal baseline.
              Pattern matches <span className="font-semibold text-ink-800">{d.pattern.toLowerCase()}</span> signatures with <span className="font-semibold text-ink-800">{d.score}% confidence</span>.
            </p>
            <p className="text-ink-600">Recommended action: physical meter inspection · Priority: {d.score >= 90 ? "High" : "Medium"} · Expected recovery: {d.risk}</p>
          </div>

          {dispatched ? (
            <div className="mt-4 rounded-xl border border-brand-200 bg-brand-50 p-4 text-xs space-y-2 anim-fade-up">
              <p className="flex items-center gap-1.5 font-bold text-brand-800"><Check className="w-4 h-4" /> Inspection dispatched</p>
              <div className="grid grid-cols-2 gap-2 text-ink-700">
                <div><span className="block text-ink-500">Case reference</span><span className="font-bold">RG-{d.id.slice(3)}-A</span></div>
                <div><span className="block text-ink-500">Assigned crew</span><span className="font-bold">Vigilance Unit V-2</span></div>
                <div><span className="block text-ink-500">Visit window</span><span className="font-bold">Tomorrow · 10:00–13:00</span></div>
                <div><span className="block text-ink-500">Meter status</span><span className="font-bold">Flagged · read-lock on</span></div>
              </div>
              <p className="text-ink-500">Outcome auto-syncs to this queue and the executive revenue dashboard.</p>
            </div>
          ) : (
            <button onClick={() => setDispatched(true)}
              className="mt-4 w-full bg-ink-900 hover:bg-ink-800 text-white text-sm font-semibold rounded-xl py-2.5 flex items-center justify-center gap-2 transition-colors">
              <MapPin className="w-4 h-4" /> Dispatch field inspection
            </button>
          )}
        </Card>
      </div>
    </div>
  );
}
