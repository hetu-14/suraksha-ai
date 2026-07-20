"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, Kpi } from "@/components/ui";
import { TrendChart, DonutChart } from "@/components/Charts";
import CountUp from "@/components/CountUp";
import { trend } from "@/lib/data";
import { slaMetrics, inr, inrLakh } from "@/lib/ops";
import { usePlatformKpis } from "@/lib/platform";
import RecommendationsPanel from "@/components/RecommendationsPanel";
import PlatformTimeline from "@/components/PlatformTimeline";
import {
  TrendingUp, ShieldAlert, Timer, Monitor, ArrowRight, IndianRupee, ShieldCheck, Sparkles
} from "lucide-react";

const BRIEFING = [
  {
    area: "Revenue Protection",
    tone: "red" as const,
    finding: "142 accounts show tamper-pattern consumption signatures; the six highest-score cases carry ₹9.1L of annualized risk.",
    action: "Dispatch physical inspections for the six highest-score accounts this week.",
    impact: "₹9.1L annualized recovery",
    confidence: 91,
    priority: "High",
    href: "/intelligence/revenue-guard",
    cta: "Open Revenue Guard",
  },
  {
    area: "PNGRB Compliance",
    tone: "amber" as const,
    finding: "3 emergency tickets are within 6 hours of their 24h SLA breach window and T-7714 has already breached; T-7720 carries 91% breach risk.",
    action: "Escalate T-7720 to priority crew routing before the 11:00 review.",
    impact: "Avoids compensation payout and a reportable breach",
    confidence: 96,
    priority: "High",
    href: "/intelligence/sla",
    cta: "Open SLA Sentinel",
  },
  {
    area: "Network Operations",
    tone: "sky" as const,
    finding: "Ghatlodia zone pressure is trending below 3.0 bar with complaint volume rising over 48 hours.",
    action: "Schedule a regulator inspection before the evening demand peak.",
    impact: "Prevents supply degradation for ~640 connections",
    confidence: 84,
    priority: "Medium",
    href: "/intelligence/command",
    cta: "Open Command Center",
  },
];

export default function IntelligenceHome() {
  // Live platform KPIs: a breach prevented or a recovery recorded anywhere in
  // the safety console moves these numbers without a refresh.
  const kpis = usePlatformKpis();

  // Business Intelligence Suite specific workload
  const intelWorkload = [
    { name: "Revenue Guard", value: 45, color: "#6366f1" },
    { name: "SLA Sentinel", value: 35, color: "#8b5cf6" },
    { name: "Command Center", value: 12, color: "#0ea5e9" },
    { name: "Operational Insights", value: 8, color: "#f59e0b" }
  ];

  return (
    <div className="space-y-6 reveal">
      {/* Greeting banner */}
      <div className="rounded-xl bg-ink-950 text-white p-6 sm:p-7 relative overflow-hidden ">
        <div className="relative">
          <p className="text-indigo-300 text-sm font-medium">
            Business Intelligence Hub <span className="font-bold">· executive view</span>
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold mt-1">
            Data-driven decisions for <span className="text-indigo-300">City Gas Distribution excellence</span>.
          </h1>
          <p className="text-ink-300 mt-2 text-sm max-w-2xl">
            Analyze billing exceptions, prevent SLA penalty payouts, track regional telemetry metrics, and explore predictive maintenance cost savings.
          </p>
        </div>
      </div>

      <div className="space-y-6 anim-fade-up">
        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Kpi label="Revenue at Risk (flagged)" value={<CountUp to={27.3} prefix="₹" suffix="L" decimals={1} />} sub={`${inr(kpis.recoveredMTD)} recovered MTD${kpis.deltas.revenueRecovered ? ` · ${inr(kpis.deltas.revenueRecovered)} live` : ""}`} icon={<IndianRupee className="w-4 h-4" />} />
          <Kpi label="SLA Compliance (MTD)" value={`${kpis.complianceMTD}%`} sub={`Target ${slaMetrics.complianceTarget}% · ${kpis.breachesPreventedMTD} breaches prevented · ${inrLakh(kpis.compensationAvoidedMTD)} avoided`} accent="text-amber-600" icon={<ShieldCheck className="w-4 h-4" />} />
          <Kpi label="AI Insights Logged" value={<CountUp to={47} />} icon={<TrendingUp className="w-4 h-4 text-indigo-500" />} />
          <Kpi label="Downtime Cost Avoided (YTD)" value="₹18.6L" icon={<ShieldAlert className="w-4 h-4 text-indigo-500 animate-pulse" />} />
        </div>

        {/* Charts block */}
        <div className="grid lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 p-5">
            <h3 className="font-bold text-ink-900 mb-3">Network Alerts Raised vs Resolved — Last 7 Days</h3>
            <TrendChart data={trend} />
          </Card>
          <Card className="p-5">
            <h3 className="font-bold text-ink-900 mb-3">Model Scan Weight Allocation</h3>
            <DonutChart data={intelWorkload} />
          </Card>
        </div>

        {/* Executive AI briefing */}
        <Card className="p-5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="font-bold text-ink-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" /> Executive AI Briefing
            </h3>
            <span className="text-xs text-ink-500">Generated from overnight scan · 3 items need decisions</span>
          </div>
          <div className="mt-4 grid lg:grid-cols-3 gap-4">
            {BRIEFING.map((b) => (
              <div key={b.area} className="rounded-xl border border-ink-100 bg-ink-50/50 p-4 flex flex-col">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-ink-500">{b.area}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${b.priority === "High" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                    {b.priority} priority
                  </span>
                </div>
                <p className="text-xs text-ink-700 mt-2.5 leading-relaxed">{b.finding}</p>
                <p className="text-xs mt-2.5"><span className="font-bold text-ink-800">Recommended: </span><span className="text-ink-600">{b.action}</span></p>
                <p className="text-xs mt-1.5"><span className="font-bold text-ink-800">Impact: </span><span className="text-ink-600">{b.impact}</span></p>
                <div className="mt-3 pt-3 border-t border-ink-100 flex items-center justify-between mt-auto">
                  <span className="flex items-center gap-1.5 text-[11px] text-ink-500">
                    <span className="w-12 h-1.5 rounded-full bg-ink-100 overflow-hidden inline-block">
                      <span className="block h-full bg-indigo-500" style={{ width: `${b.confidence}%` }} />
                    </span>
                    {b.confidence}% confidence
                  </span>
                  <Link href={b.href} className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 inline-flex items-center gap-1 transition-colors">
                    {b.cta} <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Cross-module intelligence: live recommendations + the unified platform timeline */}
        <div className="grid lg:grid-cols-2 gap-4">
          <RecommendationsPanel role="intelligence" />
          <PlatformTimeline limit={8} />
        </div>

        {/* 4 Grid Modules */}
        <h3 className="font-bold text-sm text-ink-500 uppercase tracking-wider mt-4">Business Intelligence Modules</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Tile href="/intelligence/revenue-guard" icon={<ShieldAlert className="w-5 h-5 text-indigo-500" />} title="Revenue Guard" sub="Find meter bypass anomalies &amp; tampering" />
          <Tile href="/intelligence/sla" icon={<Timer className="w-5 h-5 text-purple-500" />} title="SLA Sentinel" sub="Predict and prevent PNGRB payouts" />
          <Tile href="/intelligence/command" icon={<Monitor className="w-5 h-5 text-sky-500" />} title="Command Center" sub="Live supply pressure inlet flow grid" />
          <Tile href="/intelligence/insights" icon={<TrendingUp className="w-5 h-5 text-amber-500" />} title="Operational Insights" sub="AI analytics, charts, forecasts" />
        </div>
      </div>
    </div>
  );
}

function Tile({ href, icon, title, sub }: { href: string; icon: React.ReactNode; title: string; sub: string }) {
  return (
    <Link href={href}>
      <Card className="p-5 hover:border-brand-300 transition h-full lift">
        <div className="flex items-center justify-between">
          {icon}
          <ArrowRight className="w-4 h-4 text-ink-300" />
        </div>
        <div className="text-sm font-semibold text-ink-800 mt-3">{title}</div>
        <div className="text-[11px] text-ink-500">{sub}</div>
      </Card>
    </Link>
  );
}
