"use client";

import { useState, useEffect } from "react";
import { Card, SectionTitle, Kpi, Badge } from "@/components/ui";
import { tickets as seed, Ticket } from "@/lib/data";
import { Timer, ShieldCheck, IndianRupee, AlertTriangle, Eye, Zap } from "lucide-react";

const catTone: Record<string, "red" | "amber" | "sky"> = { "24h": "red", "7d": "amber", "15d": "sky" };

type RowState = Ticket & { handling?: "escalated" | "monitoring" };

const ESCALATION_CREW: Record<string, string> = {
  "T-7741": "Unit GA-4 · S. Patel",
  "T-7720": "Unit GA-2 · M. Qureshi",
  "T-7681": "Unit GA-4 · S. Patel",
  "T-7738": "Zone crew VS-1 · K. Raval",
  "T-7699": "Zone crew VT-2 · D. Chauhan",
  "T-7702": "Billing desk · R. Iyer",
};

function fmt(s: number) {
  if (s <= 0) return "BREACHED";
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m ${sec}s`;
}

export default function SLA() {
  const [rows, setRows] = useState<RowState[]>(() => seed.map((t) => ({ ...t })));
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const t = setInterval(() => {
      setRows((rs) => rs.map((r) => ({ ...r, left: Math.max(0, r.left - 1) })));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const escalate = (id: string) => {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, handling: "escalated", risk: Math.max(8, r.risk - 45) } : r)));
    setToast(`${id} escalated — ${ESCALATION_CREW[id] ?? "priority crew"} dispatched with priority routing.`);
  };
  const monitor = (id: string) => {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, handling: "monitoring" } : r)));
    setToast(`${id} placed under active watch — auto-escalates on any further breach-risk increase.`);
  };

  const sorted = [...rows].sort((a, b) => a.left - b.left);
  const atRisk = rows.filter((t) => t.risk >= 50).length;
  const escalated = rows.filter((t) => t.handling === "escalated").length;

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed right-4 top-4 z-50 max-w-sm rounded-xl bg-ink-900 px-4 py-3 text-sm font-semibold text-white shadow-xl anim-fade-down" role="status">
          {toast}
        </div>
      )}

      <SectionTitle title="SLA Sentinel — Compliance Guardian" sub="Predict & prevent PNGRB compensation payouts" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Open complaints" value={rows.length} icon={<Timer className="w-4 h-4" />} />
        <Kpi label="At breach-risk" value={atRisk} accent="text-amber-600" icon={<AlertTriangle className="w-4 h-4" />} />
        <Kpi label="Escalated this shift" value={escalated} accent="text-indigo-600" icon={<Zap className="w-4 h-4" />} />
        <Kpi label="Compensation avoided" value="₹4.8L" sub="63 breaches prevented MTD" icon={<IndianRupee className="w-4 h-4" />} />
      </div>

      <Card className="overflow-hidden">
        <div className="p-5 border-b border-ink-100 flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-bold text-ink-900">Live SLA queue</h3>
          <div className="flex items-center gap-2 text-xs">
            <Badge tone="red">24h emergency</Badge>
            <Badge tone="amber">7-day service</Badge>
            <Badge tone="sky">15-day routine</Badge>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-ink-50 text-ink-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left font-semibold px-5 py-3">Ticket</th>
                <th className="text-left font-semibold px-3 py-3">Category</th>
                <th className="text-left font-semibold px-3 py-3">Time left</th>
                <th className="text-left font-semibold px-3 py-3">Breach risk</th>
                <th className="text-right font-semibold px-5 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {sorted.map((t) => {
                const danger = t.left < 3600;
                const warn = t.left < 6 * 3600;
                return (
                  <tr key={t.id} className={danger && !t.handling ? "bg-red-50/60" : warn && !t.handling ? "bg-amber-50/40" : ""}>
                    <td className="px-5 py-3">
                      <div className="font-semibold text-ink-800">{t.id}</div>
                      <div className="text-xs text-ink-500">{t.label}</div>
                      {t.handling === "escalated" && (
                        <div className="text-[11px] font-semibold text-indigo-700 mt-1">
                          → {ESCALATION_CREW[t.id] ?? "Priority crew"} en route
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3"><Badge tone={catTone[t.cat]}>{t.cat}</Badge></td>
                    <td className={`px-3 py-3 font-mono ${danger ? "text-red-600 font-bold" : "text-ink-700"}`}>{fmt(t.left)}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-ink-100 overflow-hidden">
                          <div className={`h-full transition-all duration-700 ${t.risk >= 75 ? "bg-red-500" : t.risk >= 50 ? "bg-amber-500" : "bg-brand-500"}`} style={{ width: `${t.risk}%` }} />
                        </div>
                        <span className={`text-xs font-semibold ${t.risk >= 75 ? "text-red-600" : t.risk >= 50 ? "text-amber-600" : "text-brand-600"}`}>{t.risk}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {t.handling === "escalated" ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-lg">
                          <ShieldCheck className="w-3.5 h-3.5" /> Escalated
                        </span>
                      ) : t.handling === "monitoring" ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 bg-brand-50 border border-brand-200 px-3 py-1.5 rounded-lg">
                          <Eye className="w-3.5 h-3.5" /> Watching
                        </span>
                      ) : danger ? (
                        <button onClick={() => escalate(t.id)} className="text-xs font-semibold text-white bg-red-600 px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors">Escalate now</button>
                      ) : (
                        <button onClick={() => monitor(t.id)} className="text-xs font-semibold text-ink-600 border border-ink-200 px-3 py-1.5 rounded-lg hover:bg-ink-50 transition-colors">Monitor</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
