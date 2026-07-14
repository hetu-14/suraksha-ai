"use client";

import { useState } from "react";
import { Card, Kpi, SectionTitle } from "@/components/ui";
import CountUp from "@/components/CountUp";
import Typewriter from "@/components/Typewriter";
import { HeartPulse, ShieldCheck, Activity, CreditCard, Flame, Settings } from "lucide-react";
import { TrendChart } from "@/components/Charts";

export default function CustomerHealthScore() {
  const [healthHistory] = useState([
    { day: "Jan", alerts: 78, resolved: 78 },
    { day: "Feb", alerts: 80, resolved: 80 },
    { day: "Mar", alerts: 82, resolved: 82 },
    { day: "Apr", alerts: 81, resolved: 81 },
    { day: "May", alerts: 85, resolved: 85 },
    { day: "Jun", alerts: 82, resolved: 82 }
  ]);

  const factors = [
    { name: "Safety Compliance", score: 95, color: "bg-brand-500" },
    { name: "Payment Regularity", score: 88, color: "bg-brand-500" },
    { name: "Equipment Health", score: 78, color: "bg-amber-500" },
    { name: "Usage Pattern", score: 75, color: "bg-amber-500" },
    { name: "Customer Engagement", score: 72, color: "bg-amber-500" }
  ];

  return (
    <div className="space-y-6 reveal">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-ink-900 via-ink-900 to-brand-900 text-white p-6 relative overflow-hidden shadow-soft">
        <div className="floaty absolute -right-10 -top-10 w-56 h-56 bg-brand-500/20 rounded-full blur-3xl" />
        <div className="relative">
          <p className="text-brand-300 text-xs font-semibold uppercase tracking-widest">Customer Experience Suite</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">
            <Typewriter speed={40} segments={[{ text: "Customer Health Score" }]} />
          </h1>
          <p className="text-ink-300 mt-2 text-sm max-w-2xl">
            Unified metric that monitors equipment safety compliance, bill payment promptness, usage abnormalities, and engagement.
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 anim-fade-up">
        <Kpi label="Overall Health Index" value="82 / 100" icon={<HeartPulse className="w-4 h-4 text-brand-500" />} />
        <Kpi label="Safety Rating" value="Excellent" accent="text-brand-600" icon={<ShieldCheck className="w-4 h-4" />} />
        <Kpi label="Payment Rank" value="Top 15%" icon={<CreditCard className="w-4 h-4" />} />
        <Kpi label="Inspection status" value="Active" icon={<Settings className="w-4 h-4" />} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 anim-fade-up">
        {/* Factors Breakdown */}
        <Card className="lg:col-span-2 p-6">
          <h3 className="font-bold text-ink-900 mb-5">Health Factor Breakdown</h3>
          <div className="space-y-4">
            {factors.map((f, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-ink-700">{f.name}</span>
                  <span className="font-bold text-brand-600">{f.score}%</span>
                </div>
                <div className="h-2 rounded-full bg-ink-100 overflow-hidden">
                  <div className={`h-full ${f.color}`} style={{ width: `${f.score}%` }} />
                </div>
              </div>
            ))}
          </div>

          <h3 className="font-bold text-ink-900 mt-8 mb-4">6-Month Trend</h3>
          <TrendChart data={healthHistory} />
        </Card>

        {/* Info / Tips */}
        <div className="space-y-4">
          <Card className="p-5 border border-brand-100 bg-gradient-to-br from-brand-50 to-white">
            <h3 className="font-bold text-ink-900">Current Loyalty Status</h3>
            <div className="flex items-center gap-3 mt-3">
              <span className="h-10 w-10 rounded-xl bg-brand-500 text-white grid place-items-center text-lg font-bold">🥇</span>
              <div>
                <span className="block font-extrabold text-sm text-brand-700">Gold Customer Tier</span>
                <span className="block text-[11px] text-ink-500">Maintained index above 80 for 5 cycles</span>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-bold text-ink-900 mb-3">AI Suggestions for Improvement</h3>
            <ul className="space-y-3 text-xs text-ink-600 leading-relaxed">
              <li className="flex gap-2">
                <span className="text-brand-500 font-bold shrink-0">1.</span>
                <span>Complete the voluntary self-safety survey inside SafeZone (boosts engagement by +10 pts)</span>
              </li>
              <li className="flex gap-2">
                <span className="text-brand-500 font-bold shrink-0">2.</span>
                <span>Enable autopay settings to secure consistent 100% payment regularity score</span>
              </li>
              <li className="flex gap-2">
                <span className="text-brand-500 font-bold shrink-0">3.</span>
                <span>Confirm your annual inspection schedule for the kitchen regulator before Sep 2026</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
