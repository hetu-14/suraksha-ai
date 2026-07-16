"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, Kpi } from "@/components/ui";
import { TrendChart, DonutChart } from "@/components/Charts";
import CountUp from "@/components/CountUp";
import Typewriter from "@/components/Typewriter";
import { trend, workload } from "@/lib/data";
import {
  Siren, BadgeCheck, Megaphone, Wrench, HardHat, Building2, Video, ArrowRight,
  Flame, ShieldAlert, Timer,
} from "lucide-react";

export default function SafetyHome() {
  const [animStep, setAnimStep] = useState(0);

  // Safety Suite specific workload (7 modules)
  const safetyWorkload = [
    { name: "Dashboard Gas-Guard", value: 18, color: "#ef4444" },
    { name: "Rev-Guard", value: 14, color: "#f97316" },
    { name: "SLA Sentinel", value: 12, color: "#8b5cf6" },
    { name: "Auto-Notify", value: 15, color: "#f59e0b" },
    { name: "Station Safety", value: 16, color: "#a855f7" },
    { name: "Asset Maintenance", value: 13, color: "#6366f1" },
    { name: "Contractor Safety", value: 12, color: "#0ea5e9" },
  ];

  return (
    <div className="space-y-6 reveal">
      {/* Greeting banner */}
      <div className="rounded-2xl bg-gradient-to-br from-ink-900 via-ink-900 to-amber-900 text-white p-6 sm:p-7 relative overflow-hidden shadow-soft">
        <div className="floaty absolute -right-10 -top-10 w-56 h-56 bg-amber-500/20 rounded-full blur-3xl" />
        <div className="floaty-2 absolute -left-16 -bottom-16 w-48 h-48 bg-amber-400/10 rounded-full blur-3xl" />
        <div className="relative">
          <p className="text-amber-300 text-sm font-medium min-h-[20px]">
            <Typewriter
              speed={55}
              startDelay={250}
              onComplete={() => setAnimStep(1)}
              segments={[{ text: "Safety & Operations Console " }, { text: "· live", cls: "text-red-400 font-bold" }]}
            />
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1 min-h-[36px] sm:min-h-[40px]">
            {animStep >= 1 ? (
              <Typewriter
                speed={42}
                onComplete={() => setAnimStep(2)}
                cursorClass="text-amber-300"
                segments={[{ text: "The safety layer that " }, { text: "protects our pipeline grid", cls: "text-amber-300" }, { text: "." }]}
              />
            ) : (
              <span className="text-transparent">The safety layer that protects our pipeline grid.</span>
            )}
          </h1>
          <p className="text-ink-300 mt-2 text-sm max-w-2xl">
            Check station readiness checklists, schedule asset checks, audit contractor compliance, and triage active SOS alarms.
          </p>
        </div>
      </div>

      <div className="space-y-6 anim-fade-up">
        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Kpi label="Active SOS Calls" value={<CountUp to={3} />} accent="text-red-600" icon={<Siren className="w-4 h-4 text-red-500 animate-pulse" />} />
          <Kpi label="Avg Station Index" value="87%" icon={<Building2 className="w-4 h-4 text-amber-500" />} />
          <Kpi label="Asset Health Score" value="91%" icon={<Wrench className="w-4 h-4 text-amber-500" />} />
          <Kpi label="Contractor Safety Index" value="84" icon={<HardHat className="w-4 h-4" />} />
        </div>

        {/* Charts block */}
        <div className="grid lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 p-5">
            <h3 className="font-bold text-ink-900 mb-3">Safety Alerts Resolved — Last 7 Days</h3>
            <TrendChart data={trend} />
          </Card>
          <Card className="p-5">
            <h3 className="font-bold text-ink-900 mb-3">Triage Allocation by Module</h3>
            <DonutChart data={safetyWorkload} />
          </Card>
        </div>

        {/* 7 Grid Modules */}
        <h3 className="font-bold text-sm text-ink-500 uppercase tracking-wider mt-4">Safety &amp; Operations Modules</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Tile href="/safety/dashboard-gas-guard" icon={<Flame className="w-5 h-5 text-red-500" />} title="Dashboard-Gas-Guard" sub="Centralized gas grid safety monitoring" />
          <Tile href="/safety/rev-guard" icon={<ShieldAlert className="w-5 h-5 text-red-600" />} title="Rev-Guard" sub="AI revenue leakage detection & tamper alerts" />
          <Tile href="/safety/sla-sentinel" icon={<Timer className="w-5 h-5 text-violet-500" />} title="SLA Sentinel" sub="PNGRB SLA compliance & breach tracking" />
          <Tile href="/safety/smartnotify" icon={<Megaphone className="w-5 h-5 text-amber-500" />} title="Auto-Notify" sub="Plan outages and send WhatsApp notices" />
          <Tile href="/safety/station-readiness" icon={<Building2 className="w-5 h-5 text-purple-500" />} title="Station Safety Score" sub="CNG station operation readiness metrics" />
          <Tile href="/safety/asset-health" icon={<Wrench className="w-5 h-5 text-indigo-500" />} title="Asset Maintenance Notify" sub="Pipeline telemetry & lifecycle alerts" />
          <Tile href="/safety/contractor-safety" icon={<HardHat className="w-5 h-5 text-sky-500" />} title="Contractor Safety Scorecard" sub="Third-party contractor safety audit" />
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
