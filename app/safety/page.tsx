"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, Kpi } from "@/components/ui";
import { TrendChart, DonutChart } from "@/components/Charts";
import CountUp from "@/components/CountUp";
import { trend, workload } from "@/lib/data";
import RecommendationsPanel from "@/components/RecommendationsPanel";
import {
  Siren, BadgeCheck, Megaphone, Wrench, HardHat, Building2, Video, ArrowRight,
  Flame, ShieldAlert, Timer,
} from "lucide-react";

export default function SafetyHome() {

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
      <div className="rounded-xl bg-ink-950 text-white p-6 sm:p-7 relative overflow-hidden ">
        <div className="relative">
          <p className="text-amber-300 text-sm font-medium">
            Safety &amp; Operations Console <span className="text-red-400 font-bold">· live</span>
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold mt-1">
            The safety layer that <span className="text-amber-300">protects our pipeline grid</span>.
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

        {/* Cross-module intelligence: live SOS, breached tickets, and safety-flagged feedback surface here */}
        <RecommendationsPanel role="safety" />

        {/* 7 Grid Modules */}
        <h3 className="font-bold text-sm text-ink-500 uppercase tracking-wider mt-4">Safety &amp; Operations Modules</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Tile href="/safety/emergency" icon={<Siren className="w-5 h-5 text-red-500" />} title="Emergency Dashboard" sub="Live SOS triage & CCTV incident response" badge="LIVE" />
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

function Tile({ href, icon, title, sub, badge }: { href: string; icon: React.ReactNode; title: string; sub: string; badge?: string }) {
  return (
    <Link href={href}>
      <Card className="p-5 hover:border-brand-300 transition h-full lift">
        <div className="flex items-center justify-between">
          {icon}
          <div className="flex items-center gap-2">
            {badge && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-red-600">
                <span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute h-1.5 w-1.5 rounded-full bg-red-400 opacity-75" /><span className="relative rounded-full h-1.5 w-1.5 bg-red-500" /></span>
                {badge}
              </span>
            )}
            <ArrowRight className="w-4 h-4 text-ink-300" />
          </div>
        </div>
        <div className="text-sm font-semibold text-ink-800 mt-3">{title}</div>
        <div className="text-[11px] text-ink-500">{sub}</div>
      </Card>
    </Link>
  );
}
