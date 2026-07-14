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
          <button onClick={() => setDispatched(true)}
            className="mt-4 w-full bg-ink-900 hover:bg-ink-800 text-white text-sm font-semibold rounded-xl py-2.5 flex items-center justify-center gap-2">
            {dispatched ? <><Check className="w-4 h-4" /> Inspection dispatched</> : <><MapPin className="w-4 h-4" /> Dispatch field inspection</>}
          </button>
        </Card>
      </div>
    </div>
  );
}
