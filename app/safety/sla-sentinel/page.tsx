"use client";

import { useMemo, useState } from "react";
import { Badge, Card, Kpi } from "@/components/ui";
import { Toast, useToast } from "@/components/Toast";
import { useLocalWorkspaceState } from "@/lib/useLocalWorkspaceState";
import { slaTickets, slaMetrics, escalationCrew, inrLakh, type SlaTicket, type SlaStatus } from "@/lib/ops";
import { Activity, Check, CheckCircle2, ChevronRight, Download, MapPin, Search, ShieldAlert, Timer } from "lucide-react";

const tone: Record<SlaStatus, "brand" | "amber" | "red" | "sky"> = { Met: "brand", "At Risk": "amber", Breached: "red", Resolved: "sky" };
const areas = [["Ahmedabad", 34, "red"], ["Baroda", 27, "amber"], ["Rajkot", 19, "amber"], ["Surat", 12, "brand"]] as const;

function money(n: number) { return `₹${n.toLocaleString("en-IN")}`; }

export default function SLASentinel() {
  const [tickets, setTickets] = useLocalWorkspaceState<SlaTicket[]>("suraksha:sla-sentinel:v2", slaTickets);
  const [selectedId, setSelectedId] = useState(slaTickets[0].id);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"All" | SlaStatus>("All");
  const toast = useToast(4000);

  const selected = tickets.find((item) => item.id === selectedId) ?? tickets[0];
  const filtered = useMemo(
    () => tickets.filter((item) => (filter === "All" || item.status === filter) && `${item.id} ${item.consumer} ${item.area} ${item.type}`.toLowerCase().includes(search.toLowerCase())),
    [tickets, filter, search],
  );
  const breached = tickets.filter((item) => item.status === "Breached").length;
  const atRisk = tickets.filter((item) => item.status === "At Risk").length;
  const unassigned = tickets.filter((item) => item.assigned === "Unassigned").length;
  const complianceGap = Math.max(0, slaMetrics.complianceTarget - slaMetrics.complianceMTD).toFixed(1);
  const remainingMinutes = Math.max(0, Math.round((selected.slaHours - selected.elapsedHours) * 60));
  const compensationRisk = selected.status === "Breached" ? 4500 : selected.risk >= 80 ? 500 : 0;
  const recommendedCrew = escalationCrew[selected.id] ?? "Field Team 4";

  function assignRecommended() {
    setTickets((current) => current.map((item) => item.id === selected.id
      ? { ...item, assigned: recommendedCrew, status: item.status === "Breached" ? "Breached" : "At Risk", risk: Math.min(item.risk, 22), reasons: ["Priority crew assigned", "Expected closure within 2.5 hours"] }
      : item));
    toast.show(`${selected.id} assigned to ${recommendedCrew}. Breach risk reduced to 22%.`);
  }

  function resolve() {
    setTickets((current) => current.map((item) => item.id === selected.id
      ? { ...item, status: "Resolved", risk: 0, assigned: item.assigned === "Unassigned" ? recommendedCrew : item.assigned }
      : item));
    toast.show(`${selected.id} marked resolved and SLA outcome recorded.`);
  }

  function exportQueue() {
    const rows = [
      "Ticket,Type,Consumer,Area,Status,Risk,Assigned",
      ...tickets.map((item) => [item.id, item.type, item.consumer, item.area, item.status, `${item.risk}%`, item.assigned].join(",")),
    ];
    const url = URL.createObjectURL(new Blob([rows.join("\n")], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "sla-sentinel-queue.csv";
    link.click();
    URL.revokeObjectURL(url);
    toast.show("SLA queue exported as CSV.");
  }

  return (
    <div className="space-y-6 reveal">
      <Toast message={toast.message} onClose={toast.clear} />

      <header className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-ink-900 via-ink-900 to-violet-950 p-6 text-white shadow-soft">
        <div className="floaty absolute -right-10 -top-10 h-56 w-56 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-widest text-violet-300">CGD compliance decision center</p>
          <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">SLA Sentinel</h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-300">
            Predict breaches, assign the right team, escalate early, and protect customer trust and compensation exposure.
            This queue is shared live with the Business Intelligence console.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Compliance (MTD)" value={`${slaMetrics.complianceMTD}%`} sub={`Target ${slaMetrics.complianceTarget}% · gap ${complianceGap} pts`} accent="text-amber-600" icon={<ShieldAlert className="h-4 w-4" />} />
        <Kpi label="Mean resolution time" value={`${slaMetrics.meanResolutionHours}h`} sub="Target 12h" icon={<Timer className="h-4 w-4" />} />
        <Kpi label="First-time resolution" value={`${slaMetrics.firstTimeResolution}%`} sub="Service quality KPI" accent="text-brand-600" icon={<CheckCircle2 className="h-4 w-4" />} />
        <Kpi label="Breach forecast" value={slaMetrics.breachForecast24h} sub="Next 24h · 2 high risk" accent="text-red-600" icon={<Activity className="h-4 w-4" />} />
      </div>

      <Card className="border-red-200 bg-red-50/60 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-red-700">SLA war room</p>
            <h2 className="mt-1 font-bold text-ink-900">{breached} breached · {atRisk} at risk · {unassigned} without assignment</h2>
            <p className="mt-1 text-xs text-ink-600">Focus today: stop the next breach before it becomes customer dissatisfaction and compensation exposure.</p>
          </div>
          <Badge tone="red">Act now</Badge>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-red-600">Today&rsquo;s critical actions</p>
              <h2 className="mt-1 font-bold text-ink-900">Priority action queue</h2>
            </div>
            <button onClick={exportQueue} className="inline-flex items-center gap-1 rounded-lg border border-ink-200 px-3 py-2 text-xs font-bold text-ink-700 hover:bg-ink-50">
              <Download className="h-3.5 w-3.5" />Export
            </button>
          </div>
          <div className="mt-4 divide-y divide-ink-100">
            {[...tickets]
              .filter((item) => item.status === "Breached" || item.status === "At Risk")
              .sort((a, b) => b.risk - a.risk)
              .map((item, index) => (
                <button key={item.id} onClick={() => setSelectedId(item.id)} className={`flex w-full items-center gap-3 p-3 text-left ${selected.id === item.id ? "bg-violet-50" : "hover:bg-ink-50"}`}>
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-red-100 text-xs font-bold text-red-700">{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-ink-900">{item.type}</p>
                    <p className="text-[11px] text-ink-500">{item.consumer} · {item.area} · {item.assigned}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-extrabold text-red-600">
                      {item.status === "Breached" ? "Breached" : `${Math.max(0, Math.round((item.slaHours - item.elapsedHours) * 60))} min left`}
                    </p>
                    <p className="text-[10px] font-bold text-ink-500">{item.risk}% breach probability</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-ink-400" />
                </button>
              ))}
            {tickets.every((item) => item.status !== "Breached" && item.status !== "At Risk") && (
              <p className="py-8 text-center text-sm text-ink-400">No tickets are currently breached or at risk. The queue is healthy.</p>
            )}
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="font-bold text-ink-900">Penalty exposure</h2>
          <div className="mt-4 space-y-3">
            {[
              ["Breached cases", String(breached)],
              ["Expected compensation", money(breached * 4500)],
              ["Compensation avoided (MTD)", inrLakh(slaMetrics.compensationAvoidedMTD)],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between rounded-xl bg-ink-50 p-3 text-sm">
                <span className="text-ink-600">{label}</span>
                <strong className="text-red-700">{value}</strong>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-ink-500">₹4,500 is the PNGRB-mandated payout per missed emergency deadline.</p>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-violet-700">Decision workspace</p>
              <h2 className="mt-1 font-bold text-ink-900">{selected.id} · {selected.type}</h2>
              <p className="mt-1 text-xs text-ink-500">{selected.consumer} · {selected.area} · raised {selected.raised}</p>
            </div>
            <Badge tone={tone[selected.status]}>{selected.risk}% breach probability</Badge>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <h3 className="font-bold text-amber-900">Why SLA is at risk</h3>
              <ul className="mt-3 space-y-2 text-xs text-amber-900">
                {selected.reasons.map((item) => (
                  <li key={item}><Check className="mr-1 inline h-3.5 w-3.5" />{item}</li>
                ))}
              </ul>
              <p className="mt-3 text-xs font-bold">Customer sentiment: {selected.sentiment} · escalation probability {selected.sentiment === "Negative" ? "high" : "moderate"}</p>
            </section>
            <section className="rounded-xl border border-brand-200 bg-brand-50 p-4">
              <h3 className="font-bold text-brand-900">AI suggested action</h3>
              <p className="mt-3 text-sm font-extrabold text-brand-900">Assign {recommendedCrew}</p>
              <p className="mt-1 text-xs text-brand-800">Expected resolution: 2.5 hours · breach risk: {selected.risk}% → 22%</p>
              <div className="mt-4 flex gap-2">
                <button onClick={assignRecommended} className="flex-1 rounded-lg bg-brand-600 py-2 text-xs font-bold text-white hover:bg-brand-700">Assign crew</button>
                <button onClick={resolve} className="flex-1 rounded-lg border border-brand-200 py-2 text-xs font-bold text-brand-800 hover:bg-brand-100">Mark resolved</button>
              </div>
            </section>
          </div>
          <div className="mt-4 grid grid-cols-5 gap-1 text-center">
            {["Raised", "Assigned", "Supervisor", "Regional manager", "Breach / compensation"].map((stage, index) => (
              <div key={stage}>
                <div className={`h-2 rounded-full ${index < (selected.status === "Breached" ? 5 : selected.assigned === "Unassigned" ? 1 : 3) ? "bg-red-500" : "bg-ink-100"}`} />
                <p className="mt-1 text-[10px] leading-tight text-ink-500">{stage}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card className={`p-5 ${selected.status === "Breached" || remainingMinutes <= 60 ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"}`}>
          <p className="text-xs font-bold uppercase tracking-wider text-red-700">SLA burn-down timer</p>
          <p className="mt-2 text-3xl font-extrabold tabular-nums text-red-800">
            {selected.status === "Breached" ? "SLA breached" : `${remainingMinutes} min left`}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg bg-white/70 p-2">
              <p className="text-ink-500">Compensation risk</p>
              <strong className="text-red-700">{money(compensationRisk)}</strong>
            </div>
            <div className="rounded-lg bg-white/70 p-2">
              <p className="text-ink-500">Manager alert</p>
              <strong className="text-red-700">{selected.risk >= 80 ? "HIGH" : "WATCH"}</strong>
            </div>
          </div>
          <div className="mt-4 space-y-2 border-l-2 border-red-300 pl-3 text-xs text-ink-700">
            <p><strong>In 1 hour:</strong> {selected.status === "Breached" ? "Breach already recorded" : "SLA breach likely without assignment"}</p>
            <p><strong>In 4 hours:</strong> Customer escalation likely</p>
            <p><strong>In 24 hours:</strong> Executive escalation and compensation review</p>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-ink-900">Live SLA queue</h2>
            <p className="mt-1 text-xs text-ink-500">Select a ticket to investigate, assign, escalate, and close.</p>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Ticket, customer, area" className="w-44 rounded-xl border border-ink-200 py-2 pl-8 pr-3 text-xs outline-none focus:border-violet-400" />
            </div>
            <select value={filter} onChange={(event) => setFilter(event.target.value as "All" | SlaStatus)} className="rounded-xl border border-ink-200 px-3 py-2 text-xs outline-none">
              <option>All</option><option>Met</option><option>At Risk</option><option>Breached</option><option>Resolved</option>
            </select>
          </div>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-left text-[10px] font-bold uppercase tracking-wider text-ink-500">
                {["Ticket", "Consumer", "SLA", "Risk", "Status", "Assigned"].map((item) => <th key={item} className="px-3 pb-3 first:pl-0">{item}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-50">
              {filtered.map((item) => (
                <tr key={item.id} onClick={() => setSelectedId(item.id)} className={`cursor-pointer ${item.id === selected.id ? "bg-violet-50" : "hover:bg-ink-50"}`}>
                  <td className="px-3 py-3 first:pl-0">
                    <strong>{item.id}</strong>
                    <p className="text-[10px] text-ink-500">{item.type}</p>
                  </td>
                  <td className="px-3 py-3 text-xs">{item.consumer}<p className="text-[10px] text-ink-500">{item.area}</p></td>
                  <td className="px-3 py-3 text-xs tabular-nums">{item.elapsedHours}h / {item.slaHours}h</td>
                  <td className="px-3 py-3"><Badge tone={item.risk >= 90 ? "red" : item.risk >= 60 ? "amber" : "brand"}>{item.risk}%</Badge></td>
                  <td className="px-3 py-3"><Badge tone={tone[item.status]}>{item.status}</Badge></td>
                  <td className="px-3 py-3 text-xs">{item.assigned}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="py-8 text-center text-sm text-ink-400">No tickets match this search and filter.</p>}
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="p-5">
          <h2 className="font-bold text-ink-900">Engineer performance</h2>
          <div className="mt-4 space-y-3">
            {([["Ramesh Kumar", "95%", "brand"], ["Sunil Sharma", "82%", "amber"], ["Manoj Patel", "68%", "red"]] as const).map(([name, value, color]) => (
              <div key={name} className="flex items-center justify-between rounded-xl bg-ink-50 p-3">
                <span className="text-sm font-semibold text-ink-800">{name}</span>
                <Badge tone={color}>{value}</Badge>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="font-bold text-ink-900">Complaint lifecycle analytics</h2>
          <p className="mt-1 text-xs text-ink-500">Engineer assignment is the primary process bottleneck.</p>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            {[["Assignment", "3 hrs"], ["Field visit", "8 hrs"], ["Resolution", "21 hrs"]].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-ink-50 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-ink-500">{label}</p>
                <p className="mt-1 text-lg font-extrabold text-ink-900">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
            <strong>Bottleneck:</strong> Engineer assignment · suggested fix: auto-assign nearest qualified resource for P1/P2 cases.
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="flex items-center gap-2 font-bold text-ink-900"><MapPin className="h-4 w-4 text-red-600" /> Workload heatmap</h2>
          <div className="mt-4 space-y-3">
            {areas.map(([area, count, risk]) => (
              <div key={area} className="flex items-center justify-between rounded-xl border border-ink-100 p-3">
                <span className="font-semibold text-ink-800">{area}</span>
                <Badge tone={risk}>{count} pending</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h2 className="font-bold text-ink-900">Impact this month</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Compensation avoided", inrLakh(slaMetrics.compensationAvoidedMTD)],
              ["Breaches prevented", String(slaMetrics.breachesPreventedMTD)],
              ["Escalations prevented", "19"],
              ["Compliance (MTD)", `${slaMetrics.complianceMTD}%`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-brand-50 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-brand-700">{label}</p>
                <p className="mt-1 text-lg font-extrabold text-brand-900">{value}</p>
              </div>
            ))}
          </div>
        </Card>
        {selected.status === "Breached" ? (
          <Card className="border-red-200 bg-red-50 p-5">
            <h2 className="font-bold text-red-900">Post-breach analysis</h2>
            <p className="mt-3 text-xs text-red-800"><strong>Root cause:</strong> No engineer assigned</p>
            <p className="mt-1 text-xs text-red-800"><strong>Delay:</strong> {Math.max(1, Math.round(selected.elapsedHours - selected.slaHours))} hours past deadline</p>
            <p className="mt-1 text-xs text-red-800"><strong>Preventability:</strong> HIGH</p>
            <p className="mt-3 text-xs font-bold text-red-900">Suggested fix: auto-assignment for P1/P2 cases.</p>
          </Card>
        ) : (
          <Card className="p-5">
            <h2 className="font-bold text-ink-900">Learning loop</h2>
            <p className="mt-3 text-xs text-ink-600">When a case breaches, Sentinel records its root cause, preventability, and recommended process fix for future prevention.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
