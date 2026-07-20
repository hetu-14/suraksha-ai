"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, SectionTitle, Kpi, DataTable } from "@/components/ui";
import { FingerprintChart } from "@/components/Charts";
import { Toast, useToast } from "@/components/Toast";
import { revCases, revMetrics, inr } from "@/lib/ops";
import { ShieldAlert, IndianRupee, Target, ScanLine, MapPin, Check, ArrowRight } from "lucide-react";

export default function RevGuard() {
  const [sel, setSel] = useState(0);
  const [dispatchedIds, setDispatchedIds] = useState<string[]>([]);
  const toast = useToast();
  const d = revCases[sel];
  const dispatched = dispatchedIds.includes(d.id);

  function dispatchInspection() {
    setDispatchedIds((ids) => [...ids, d.id]);
    toast.show(`${d.id} inspection dispatched — Vigilance Unit V-2, visit window tomorrow 10:00–13:00.`);
  }

  return (
    <div className="space-y-6">
      <Toast message={toast.message} onClose={toast.clear} />
      <SectionTitle title="Revenue Guard — Revenue & Tampering Intelligence" sub="Finds hidden money in data you already have" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Accounts scanned" value={revMetrics.accountsScanned.toLocaleString("en-IN")} icon={<ScanLine className="w-4 h-4" />} />
        <Kpi label="High-risk flagged" value={revMetrics.flaggedHighRisk} sub={`Top ${revCases.length} under field investigation`} accent="text-red-600" icon={<ShieldAlert className="w-4 h-4" />} />
        <Kpi label="Est. revenue at risk" value={revMetrics.atRiskAnnualized} sub={`${inr(revMetrics.recoveredMTD)} recovered MTD`} icon={<IndianRupee className="w-4 h-4" />} />
        <Kpi label="Model precision" value={`${revMetrics.modelPrecision}%`} sub={`${revMetrics.alertsValidated}/${revMetrics.alertsGenerated} alerts validated`} icon={<Target className="w-4 h-4" />} />
      </div>

      <div className="grid lg:grid-cols-5 gap-5">
        <Card className="lg:col-span-3 overflow-hidden">
          <div className="p-5 border-b border-ink-100 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h3 className="font-bold text-ink-900">Investigate-first queue</h3>
              <p className="text-xs text-ink-500 mt-0.5">Highest-score cases from the {revMetrics.flaggedHighRisk} flagged accounts — same queue the field team works in Rev-Guard operations.</p>
            </div>
            <span className="text-xs text-ink-500">Ranked by anomaly score</span>
          </div>
          <div className="p-4 sm:p-5">
            <DataTable
              columns={[
                { key: "case", header: "Case", primary: true, cell: (a) => <span className="font-semibold text-ink-800">{a.id}</span> },
                { key: "who", header: "Consumer", secondary: true, cell: (a) => <span>{a.consumer} · {a.account}</span> },
                { key: "area", header: "Area", cell: (a) => <span className="text-ink-600">{a.area}</span> },
                { key: "type", header: "Pattern", cell: (a) => <span className="text-ink-600">{a.type}</span> },
                { key: "loss", header: "At risk", align: "right", cell: (a) => <span className="font-medium tabular-nums">{inr(a.loss)}/mo</span> },
                {
                  key: "score", header: "Score", align: "right",
                  cell: (a) => <span className={`rounded-full px-2 py-1 text-xs font-bold ${a.score >= 90 ? "bg-red-100 text-red-700" : a.score >= 80 ? "bg-amber-100 text-amber-700" : "bg-sky-100 text-sky-700"}`}>{a.score}</span>,
                },
              ]}
              rows={revCases}
              getKey={(a) => a.id}
              onRowClick={(a) => setSel(revCases.findIndex((item) => item.id === a.id))}
              isActive={(a) => revCases[sel]?.id === a.id}
              caption="Flagged revenue cases ranked by anomaly score"
            />
          </div>
          <div className="p-4 border-t border-ink-100">
            <Link href="/safety/rev-guard" className="text-xs font-bold text-indigo-700 hover:text-indigo-900 inline-flex items-center gap-1">
              Open the operational investigation workspace <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </Card>

        <Card className="lg:col-span-2 p-5">
          <h3 className="font-bold text-ink-900">{d.id} — {d.type}</h3>
          <p className="text-xs text-ink-500 mb-3">{d.area} · anomaly score {d.score} · {inr(d.loss)}/mo at risk</p>
          <FingerprintChart normal={d.normal} actual={d.actual} />

          <div className="mt-4 rounded-xl bg-ink-50 border border-ink-100 p-3 text-xs space-y-1.5">
            <p className="font-bold text-ink-800 uppercase tracking-wide text-xs">AI assessment</p>
            <p className="text-ink-600 leading-relaxed">
              Consumption fingerprint deviates {d.drop}% from the account&apos;s seasonal baseline while similar households average {d.neighbourhood} SCM.
              Pattern matches <span className="font-semibold text-ink-800">{d.type.toLowerCase()}</span> signatures with <span className="font-semibold text-ink-800">{d.confidence}% confidence</span>.
            </p>
            <p className="text-ink-600">Recommended action: physical meter inspection · Priority: {d.score >= 90 ? "High" : "Medium"} · Expected recovery: {inr(d.loss)}/mo</p>
          </div>

          {dispatched ? (
            <div className="mt-4 rounded-xl border border-brand-200 bg-brand-50 p-4 text-xs space-y-2 anim-fade-up">
              <p className="flex items-center gap-1.5 font-bold text-brand-800"><Check className="w-4 h-4" /> Inspection dispatched</p>
              <div className="grid grid-cols-2 gap-2 text-ink-700">
                <div><span className="block text-ink-500">Case reference</span><span className="font-bold">{d.id}-A</span></div>
                <div><span className="block text-ink-500">Assigned crew</span><span className="font-bold">Vigilance Unit V-2</span></div>
                <div><span className="block text-ink-500">Visit window</span><span className="font-bold">Tomorrow · 10:00–13:00</span></div>
                <div><span className="block text-ink-500">Meter status</span><span className="font-bold">Flagged · read-lock on</span></div>
              </div>
              <p className="text-ink-500">Outcome auto-syncs to this queue and the Rev-Guard field workspace.</p>
            </div>
          ) : (
            <button onClick={dispatchInspection}
              className="mt-4 w-full bg-ink-900 hover:bg-ink-800 text-white text-sm font-semibold rounded-xl py-2.5 flex items-center justify-center gap-2 transition-colors">
              <MapPin className="w-4 h-4" /> Dispatch field inspection
            </button>
          )}
        </Card>
      </div>
    </div>
  );
}
