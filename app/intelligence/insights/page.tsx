"use client";

import { useState } from "react";
import { Card, Kpi, SectionTitle, Badge } from "@/components/ui";
import CountUp from "@/components/CountUp";
import Typewriter from "@/components/Typewriter";
import { TrendingUp, ShieldAlert, CheckCircle2, Award, Zap, Heart } from "lucide-react";
import { TrendChart } from "@/components/Charts";

export default function OperationalInsights() {
  const [data] = useState([
    { day: "Jan", alerts: 1400, resolved: 1250 },
    { day: "Feb", alerts: 1550, resolved: 1480 },
    { day: "Mar", alerts: 1800, resolved: 1720 },
    { day: "Apr", alerts: 1650, resolved: 1600 },
    { day: "May", alerts: 1900, resolved: 1880 },
    { day: "Jun", alerts: 2100, resolved: 2050 }
  ]);

  const insights = [
    { text: "Gas consumption has risen by 23% in Maninagar area due to early winter heaters.", cat: "Consumption" },
    { text: "Predictive maintenance on COMP-104 avoided a potential 4-hour breakdown downtime last week.", cat: "Predictive" },
    { text: "Revenue leakage anomaly checks reduced overall billing disputes by 18% in Surat region.", cat: "Leakage" }
  ];

  return (
    <div className="space-y-6 reveal">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-ink-900 via-ink-900 to-indigo-900 text-white p-6 relative overflow-hidden shadow-soft">
        <div className="floaty absolute -right-10 -top-10 w-56 h-56 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="relative">
          <p className="text-indigo-300 text-xs font-semibold uppercase tracking-widest">Business Intelligence Suite</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">
            <Typewriter speed={40} segments={[{ text: "Operational Insights" }]} />
          </h1>
          <p className="text-ink-300 mt-2 text-sm max-w-2xl">
            AI-powered pattern analyzer. Processes telemetry records, billing schedules, and compliance response timelines to generate diagnostic optimization recommendations.
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 anim-fade-up">
        <Kpi label="Data Points Scanned" value="2.4M" icon={<TrendingUp className="w-4 h-4 text-indigo-500" />} />
        <Kpi label="AI Insights Logged" value={<CountUp to={47} />} icon={<CheckCircle2 className="w-4 h-4 text-brand-600" />} />
        <Kpi label="Forecast Accuracy" value="96.2%" icon={<Award className="w-4 h-4 text-indigo-500" />} />
        <Kpi label="Downtime Cost Saved" value="₹18.6L" icon={<Zap className="w-4 h-4 text-brand-500 animate-pulse" />} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 anim-fade-up">
        {/* Trend analysis chart */}
        <Card className="lg:col-span-2 p-6">
          <h3 className="font-bold text-ink-900 mb-5">Monthly Supply Intake vs Allocation (SCM)</h3>
          <TrendChart data={data} />
        </Card>

        {/* Insights list */}
        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="font-bold text-ink-900 mb-4">Key AI Findings</h3>
            <div className="space-y-3">
              {insights.map((ins, idx) => (
                <div key={idx} className="p-3 bg-ink-50 rounded-xl border border-ink-100 text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-ink-800">Observation {idx + 1}</span>
                    <Badge tone="indigo">{ins.cat}</Badge>
                  </div>
                  <p className="text-ink-600 leading-relaxed mt-1">&quot;{ins.text}&quot;</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5 bg-gradient-to-br from-indigo-500/5 to-transparent border-indigo-500/10 text-xs">
            <h4 className="font-bold text-xs text-indigo-800 uppercase tracking-wide">Optimization Suggestion</h4>
            <p className="text-indigo-800/80 mt-1 leading-relaxed">
              Based on night billing spikes, increase regular safety pipeline patrol frequency around Naroda Industrial Estate between 02:00 and 05:00.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
