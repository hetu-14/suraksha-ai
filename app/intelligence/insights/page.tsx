"use client";

import { useState } from "react";
import { Card, Kpi, Badge } from "@/components/ui";
import CountUp from "@/components/CountUp";
import { Toast, useToast } from "@/components/Toast";
import { useLocalWorkspaceState } from "@/lib/useLocalWorkspaceState";
import { emitPlatformEvent } from "@/lib/platform";
import { TrendingUp, CheckCircle2, Award, Zap, ClipboardList, Check, Clock } from "lucide-react";
import { TrendChart } from "@/components/Charts";

const TREND = [
  { day: "Jan", alerts: 1400, resolved: 1250 },
  { day: "Feb", alerts: 1550, resolved: 1480 },
  { day: "Mar", alerts: 1800, resolved: 1720 },
  { day: "Apr", alerts: 1650, resolved: 1600 },
  { day: "May", alerts: 1900, resolved: 1880 },
  { day: "Jun", alerts: 2100, resolved: 2050 },
];

type Insight = {
  id: string;
  cat: string;
  owner: string;
  text: string;
  action: string;
  impact: string;
  confidence: number;
};

const INSIGHTS: Insight[] = [
  {
    id: "INS-047",
    cat: "Consumption",
    owner: "Network Planning",
    text: "Gas consumption rose 23% in Maninagar driven by early winter heater usage.",
    action: "Pre-position LPG-to-PNG conversion crews and re-forecast zone allocation.",
    impact: "Protects supply continuity through peak season",
    confidence: 89,
  },
  {
    id: "INS-046",
    cat: "Predictive",
    owner: "O&M — Naroda",
    text: "Predictive maintenance on COMP-104 avoided a potential 4-hour breakdown last week.",
    action: "Extend vibration-model coverage to the remaining 6 Naroda compressors.",
    impact: "₹3.1L avoided downtime per prevented failure",
    confidence: 94,
  },
  {
    id: "INS-045",
    cat: "Revenue",
    owner: "Commercial Billing",
    text: "Revenue anomaly checks reduced billing disputes 18% in the Surat region.",
    action: "Roll the same scoring model out to Ahmedabad commercial accounts.",
    impact: "Projected 12% dispute reduction on 41k accounts",
    confidence: 86,
  },
];

type Decision = { status: "approved" | "deferred"; at: string };

export default function OperationalInsights() {
  const [decisions, setDecisions] = useLocalWorkspaceState<Record<string, Decision>>("suraksha:insights:decisions", {});
  const toast = useToast(4000);
  const decided = Object.entries(decisions);

  function decide(insight: Insight, status: Decision["status"]) {
    const at = new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
    setDecisions((d) => ({ ...d, [insight.id]: { status, at } }));
    emitPlatformEvent({ type: "InsightActioned", module: "Operational Insights", summary: `${insight.id} ${status} · ${insight.cat}`, entities: [{ type: "insight", id: insight.id, label: insight.cat }], data: { insightId: insight.id, status, owner: insight.owner } });
    toast.show(
      status === "approved"
        ? `${insight.id} approved — work order routed to ${insight.owner} for execution.`
        : `${insight.id} deferred — will resurface in next week's briefing with refreshed data.`,
    );
  }

  return (
    <div className="space-y-6 reveal">
      <Toast message={toast.message} onClose={toast.clear} />

      {/* Header Banner */}
      <div className="rounded-xl bg-ink-950 text-white p-6 relative overflow-hidden ">
        <div className="relative">
          <p className="text-indigo-300 text-xs font-semibold uppercase tracking-widest">Business Intelligence Suite</p>
          <h1 className="text-2xl sm:text-3xl font-bold mt-1">Operational Insights</h1>
          <p className="text-ink-300 mt-2 text-sm max-w-2xl">
            AI-generated recommendations with an approval workflow — every approved insight becomes a routed work order,
            every deferral is recorded for the next review.
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 anim-fade-up">
        <Kpi label="Data Points Scanned" value="2.4M" icon={<TrendingUp className="w-4 h-4 text-indigo-500" />} />
        <Kpi label="AI Insights Logged" value={<CountUp to={47} />} icon={<CheckCircle2 className="w-4 h-4 text-brand-600" />} />
        <Kpi label="Forecast Accuracy" value="96.2%" icon={<Award className="w-4 h-4 text-indigo-500" />} />
        <Kpi label="Downtime Cost Avoided (YTD)" value="₹18.6L" icon={<Zap className="w-4 h-4 text-brand-500" />} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 anim-fade-up">
        {/* Trend analysis chart */}
        <Card className="lg:col-span-2 p-6">
          <h3 className="font-bold text-ink-900 mb-5">Network Alerts Raised vs Resolved — 6-Month Trend</h3>
          <TrendChart data={TREND} />
          <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/60 p-3 text-xs text-indigo-900">
            <strong>What this means:</strong> alert volume is growing ~8% month-on-month as sensor coverage expands, while the
            resolution gap has narrowed from 150 to 50 per month — the AI triage layer is absorbing the added volume without
            added headcount.
          </div>
        </Card>

        {/* Insights list with decision workflow */}
        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="font-bold text-ink-900 mb-4">Decision queue</h3>
            <div className="space-y-3">
              {INSIGHTS.map((ins) => {
                const decision = decisions[ins.id];
                return (
                  <div key={ins.id} className="p-3 bg-ink-50 rounded-xl border border-ink-100 text-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-ink-800">{ins.id}</span>
                      <Badge tone="indigo">{ins.cat}</Badge>
                    </div>
                    <p className="text-ink-600 leading-relaxed mt-1">{ins.text}</p>
                    <p className="mt-2"><span className="font-bold text-ink-800">Recommended: </span><span className="text-ink-600">{ins.action}</span></p>
                    <p className="mt-1"><span className="font-bold text-ink-800">Impact: </span><span className="text-ink-600">{ins.impact}</span></p>
                    <p className="mt-1"><span className="font-bold text-ink-800">Owner: </span><span className="text-ink-600">{ins.owner}</span></p>
                    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-ink-500">
                      <span className="w-12 h-1.5 rounded-full bg-ink-200 overflow-hidden inline-block">
                        <span className="block h-full bg-indigo-500" style={{ width: `${ins.confidence}%` }} />
                      </span>
                      {ins.confidence}% confidence
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-ink-200/70">
                      {decision ? (
                        <span className={`inline-flex items-center gap-1.5 font-bold rounded-lg px-2.5 py-1.5 border ${
                          decision.status === "approved"
                            ? "text-brand-700 bg-brand-50 border-brand-200"
                            : "text-amber-700 bg-amber-50 border-amber-200"
                        }`}>
                          {decision.status === "approved" ? <Check className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                          {decision.status === "approved" ? `Approved · routed to ${ins.owner}` : "Deferred to next review"}
                        </span>
                      ) : (
                        <div className="flex gap-2">
                          <button onClick={() => decide(ins, "approved")} className="flex-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 transition-colors">
                            Approve
                          </button>
                          <button onClick={() => decide(ins, "deferred")} className="flex-1 rounded-lg border border-ink-200 hover:bg-white text-ink-600 font-bold py-1.5 transition-colors">
                            Defer
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="p-5">
            <h4 className="flex items-center gap-2 font-bold text-ink-900 text-sm">
              <ClipboardList className="w-4 h-4 text-indigo-600" /> Decision log
            </h4>
            {decided.length === 0 ? (
              <p className="mt-3 text-xs text-ink-500">
                No decisions recorded yet. Approve or defer a recommendation above — every decision is logged for the
                monthly governance review.
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                {decided.map(([id, d]) => (
                  <div key={id} className="flex items-center justify-between rounded-lg bg-ink-50 px-3 py-2 text-xs">
                    <span className="font-bold text-ink-800">{id}</span>
                    <span className={`font-semibold ${d.status === "approved" ? "text-brand-700" : "text-amber-700"}`}>
                      {d.status === "approved" ? "Approved" : "Deferred"} · {d.at}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
