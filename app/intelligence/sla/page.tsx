"use client";

import { useState, useEffect } from "react";
import { Card, SectionTitle, Kpi, Badge, DataTable, type Column } from "@/components/ui";
import { slaTickets, ticketSecondsLeft, escalationCrew, slaMetrics, inrLakh, type SlaTicket } from "@/lib/ops";
import { Toast, useToast } from "@/components/Toast";
import { Timer, ShieldCheck, IndianRupee, AlertTriangle, Eye, Zap } from "lucide-react";

const catTone: Record<string, "red" | "amber" | "sky"> = { "24h": "red", "7d": "amber", "15d": "sky" };

type Row = SlaTicket & { left: number; handling?: "escalated" | "monitoring" };

function fmt(s: number) {
  if (s <= 0) return "BREACHED";
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m ${sec}s`;
}

export default function SLA() {
  const [rows, setRows] = useState<Row[]>(() => slaTickets.map((t) => ({ ...t, left: ticketSecondsLeft(t) })));
  const toast = useToast();

  useEffect(() => {
    const t = setInterval(() => {
      setRows((rs) => rs.map((r) => ({ ...r, left: Math.max(0, r.left - 1) })));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const escalate = (id: string) => {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, handling: "escalated", risk: Math.max(8, r.risk - 45) } : r)));
    toast.show(`${id} escalated — ${escalationCrew[id] ?? "priority crew"} dispatched with priority routing.`);
  };
  const monitor = (id: string) => {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, handling: "monitoring" } : r)));
    toast.show(`${id} placed under active watch — auto-escalates on any further breach-risk increase.`);
  };

  // Column definitions drive both the desktop table and the mobile card list.
  // The countdown and the action are the two things an operator needs at any
  // width, so they are the card title and its footer respectively.
  const columns: Column<Row>[] = [
    {
      key: "ticket", header: "Ticket", primary: true,
      cell: (t) => <span className="font-semibold text-ink-800">{t.id} <span className="font-normal text-ink-500">· {t.type}</span></span>,
    },
    {
      key: "where", header: "Location", secondary: true,
      cell: (t) => (
        <span>
          {t.area} · {t.consumer}
          {t.handling === "escalated" && (
            <span className="mt-1 block text-xs font-semibold text-indigo-700">→ {escalationCrew[t.id] ?? "Priority crew"} en route</span>
          )}
        </span>
      ),
    },
    { key: "cat", header: "Category", cell: (t) => <Badge tone={catTone[t.cat]}>{t.cat}</Badge> },
    {
      key: "left", header: "Time left",
      cell: (t) => <span className={`tabular-nums ${t.left < 3600 ? "font-bold text-red-600" : "text-ink-700"}`}>{fmt(t.left)}</span>,
    },
    {
      key: "risk", header: "Breach risk",
      cell: (t) => (
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-14 overflow-hidden rounded-full bg-ink-100">
            <span className={`block h-full transition-all duration-700 ${t.risk >= 75 ? "bg-red-500" : t.risk >= 50 ? "bg-amber-500" : "bg-brand-500"}`} style={{ width: `${t.risk}%` }} />
          </span>
          <span className={`text-xs font-semibold tabular-nums ${t.risk >= 75 ? "text-red-600" : t.risk >= 50 ? "text-amber-600" : "text-brand-600"}`}>{t.risk}%</span>
        </span>
      ),
    },
    {
      key: "action", header: "Action", align: "right",
      cell: (t) => t.handling === "escalated" ? (
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700"><ShieldCheck className="w-3.5 h-3.5" /> Escalated</span>
      ) : t.handling === "monitoring" ? (
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700"><Eye className="w-3.5 h-3.5" /> Watching</span>
      ) : t.left < 3600 ? (
        <button onClick={() => escalate(t.id)} className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-700">Escalate now</button>
      ) : (
        <button onClick={() => monitor(t.id)} className="rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-semibold text-ink-600 transition-colors hover:bg-ink-50">Monitor</button>
      ),
    },
  ];

  const sorted = [...rows].sort((a, b) => a.left - b.left);
  const atRisk = rows.filter((t) => t.risk >= 50 && t.left > 0).length;
  const breached = rows.filter((t) => t.left <= 0).length;
  const escalated = rows.filter((t) => t.handling === "escalated").length;
  const exposure = rows.filter((t) => t.left <= 0 || (t.risk >= 75 && !t.handling)).length * 4500;

  return (
    <div className="space-y-6">
      <Toast message={toast.message} onClose={toast.clear} />

      <SectionTitle title="SLA Sentinel — Compliance Guardian" sub="Predict & prevent PNGRB compensation payouts" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Open complaints" value={rows.length} sub={`${breached} breached · ${atRisk} at risk`} accent={breached > 0 ? "text-red-600" : "text-ink-600"} icon={<Timer className="w-4 h-4" />} />
        <Kpi label="Compliance (MTD)" value={`${slaMetrics.complianceMTD}%`} sub={`Target ${slaMetrics.complianceTarget}%`} accent="text-amber-600" icon={<AlertTriangle className="w-4 h-4" />} />
        <Kpi label="Escalated this shift" value={escalated} sub={`Live payout exposure ${exposure > 0 ? `₹${exposure.toLocaleString("en-IN")}` : "cleared"}`} accent="text-indigo-600" icon={<Zap className="w-4 h-4" />} />
        <Kpi label="Compensation avoided" value={inrLakh(slaMetrics.compensationAvoidedMTD)} sub={`${slaMetrics.breachesPreventedMTD} breaches prevented MTD`} icon={<IndianRupee className="w-4 h-4" />} />
      </div>

      <Card className="overflow-hidden">
        <div className="p-5 border-b border-ink-100 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="font-bold text-ink-900">Live SLA queue</h3>
            <p className="text-xs text-ink-500 mt-0.5">Same queue the Safety console works from — this view prices the risk.</p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Badge tone="red">24h emergency</Badge>
            <Badge tone="amber">7-day service</Badge>
            <Badge tone="sky">15-day routine</Badge>
          </div>
        </div>
        <div className="p-4 sm:p-5">
          <DataTable
            columns={columns}
            rows={sorted}
            getKey={(t) => t.id}
            caption="PNGRB SLA tickets ranked by time remaining"
            empty="No tickets in the compliance queue."
          />
        </div>
      </Card>
    </div>
  );
}
