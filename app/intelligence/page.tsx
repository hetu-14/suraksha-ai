"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, Kpi } from "@/components/ui";
import { TrendChart, DonutChart } from "@/components/Charts";
import CountUp from "@/components/CountUp";
import Typewriter from "@/components/Typewriter";
import { trend } from "@/lib/data";
import {
  TrendingUp, ShieldAlert, Timer, Monitor, ArrowRight, IndianRupee, ShieldCheck
} from "lucide-react";

export default function IntelligenceHome() {
  const [animStep, setAnimStep] = useState(0);

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
      <div className="rounded-2xl bg-gradient-to-br from-ink-900 via-ink-900 to-indigo-900 text-white p-6 sm:p-7 relative overflow-hidden shadow-soft">
        <div className="floaty absolute -right-10 -top-10 w-56 h-56 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="floaty-2 absolute -left-16 -bottom-16 w-48 h-48 bg-indigo-400/10 rounded-full blur-3xl" />
        <div className="relative">
          <p className="text-indigo-300 text-sm font-medium min-h-[20px]">
            <Typewriter
              speed={55}
              startDelay={250}
              onComplete={() => setAnimStep(1)}
              segments={[{ text: "Business Intelligence Hub " }, { text: "· executive view", cls: "text-indigo-300 font-bold" }]}
            />
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1 min-h-[36px] sm:min-h-[40px]">
            {animStep >= 1 ? (
              <Typewriter
                speed={42}
                onComplete={() => setAnimStep(2)}
                cursorClass="text-indigo-300"
                segments={[{ text: "Data-driven decisions for " }, { text: "City Gas Distribution excellence", cls: "text-indigo-300" }, { text: "." }]}
              />
            ) : (
              <span className="text-transparent">Data-driven decisions for City Gas Distribution excellence.</span>
            )}
          </h1>
          <p className="text-ink-300 mt-2 text-sm max-w-2xl">
            Analyze billing exceptions, prevent SLA penalty payouts, track regional telemetry metrics, and explore predictive maintenance cost savings.
          </p>
        </div>
      </div>

      <div className="space-y-6 anim-fade-up">
        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Kpi label="Revenue Recovered (MTD)" value={<CountUp to={27.3} prefix="₹" suffix="L" decimals={1} />} icon={<IndianRupee className="w-4 h-4" />} />
          <Kpi label="SLA Compliance Rate" value="99.2%" accent="text-brand-600" icon={<ShieldCheck className="w-4 h-4" />} />
          <Kpi label="AI Insights Logged" value={<CountUp to={47} />} icon={<TrendingUp className="w-4 h-4 text-indigo-500" />} />
          <Kpi label="Pipeline Loss Prevented" value="₹18.6L" icon={<ShieldAlert className="w-4 h-4 text-indigo-500 animate-pulse" />} />
        </div>

        {/* Charts block */}
        <div className="grid lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 p-5">
            <h3 className="font-bold text-ink-900 mb-3">Leakage Alerts Scanned vs Recovered — Last 7 Days</h3>
            <TrendChart data={trend} />
          </Card>
          <Card className="p-5">
            <h3 className="font-bold text-ink-900 mb-3">Model Scan Weight Allocation</h3>
            <DonutChart data={intelWorkload} />
          </Card>
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
