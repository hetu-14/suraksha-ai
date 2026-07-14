"use client";

import { useState } from "react";
import { Card, Kpi, SectionTitle, Badge } from "@/components/ui";
import CountUp from "@/components/CountUp";
import Typewriter from "@/components/Typewriter";
import { HardHat, ShieldCheck, Activity, Users, AlertOctagon, CheckCircle2 } from "lucide-react";
import { TrendChart } from "@/components/Charts";

type Contractor = { name: string; score: number; incidents: number; certification: string; auditDate: string; rating: "Excellent" | "Satisfactory" | "Needs Audit" | "Suspended" };

export default function ContractorSafety() {
  const [contractors] = useState<Contractor[]>([
    { name: "SafeGas Solutions", score: 94, incidents: 0, certification: "Active", auditDate: "Jun 12, 2026", rating: "Excellent" },
    { name: "PipeWeld Corp", score: 86, incidents: 1, certification: "Active", auditDate: "Jul 02, 2026", rating: "Satisfactory" },
    { name: "MeterTech India", score: 89, incidents: 0, certification: "Active", auditDate: "Jun 28, 2026", rating: "Excellent" },
    { name: "GreenLine Services", score: 72, incidents: 2, certification: "Expiring soon", auditDate: "Jul 11, 2026", rating: "Needs Audit" },
    { name: "SecurePipe Ltd", score: 45, incidents: 4, certification: "Suspended", auditDate: "May 10, 2026", rating: "Suspended" }
  ]);

  const [sel, setSel] = useState(0);

  const avgScore = Math.round(contractors.reduce((sum, c) => sum + c.score, 0) / contractors.length);

  return (
    <div className="space-y-6 reveal">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-ink-900 via-ink-900 to-amber-900 text-white p-6 relative overflow-hidden shadow-soft">
        <div className="floaty absolute -right-10 -top-10 w-56 h-56 bg-amber-500/20 rounded-full blur-3xl" />
        <div className="relative">
          <p className="text-amber-300 text-xs font-semibold uppercase tracking-widest">Safety &amp; Operations Suite</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">
            <Typewriter speed={40} segments={[{ text: "Contractor Safety Index" }]} />
          </h1>
          <p className="text-ink-300 mt-2 text-sm max-w-2xl">
            Monitors third-party pipeline contractors on site safety compliance, mandatory certification levels, and safety audits.
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 anim-fade-up">
        <Kpi label="Active Contractors" value={<CountUp to={contractors.length} />} icon={<Users className="w-4 h-4 text-amber-500" />} />
        <Kpi label="Avg Safety Index" value={`${avgScore} / 100`} accent={avgScore >= 80 ? "text-brand-600" : "text-amber-600"} icon={<Activity className="w-4 h-4" />} />
        <Kpi label="Incidents (MTD)" value={<CountUp to={7} />} accent="text-red-600" icon={<AlertOctagon className="w-4 h-4" />} />
        <Kpi label="Certifications Expiring" value={<CountUp to={1} />} accent="text-amber-600" icon={<HardHat className="w-4 h-4" />} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 anim-fade-up">
        {/* Contractors list */}
        <Card className="lg:col-span-2 overflow-hidden">
          <div className="p-5 border-b border-ink-100">
            <h3 className="font-bold text-ink-900">Contractor Scoreboard</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-ink-50 text-ink-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left font-semibold px-5 py-3">Contractor Name</th>
                  <th className="text-right font-semibold px-3 py-3">Safety Index</th>
                  <th className="text-right font-semibold px-5 py-3">Compliance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {contractors.map((c, idx) => {
                  const tag = c.rating === "Excellent" ? "brand" : c.rating === "Satisfactory" ? "sky" : c.rating === "Needs Audit" ? "amber" : "red";
                  const scoreColor = c.score >= 85 ? "text-brand-600" : c.score >= 70 ? "text-amber-600" : "text-red-600";
                  return (
                    <tr key={c.name} onClick={() => setSel(idx)}
                      className={`cursor-pointer transition ${sel === idx ? "bg-amber-50/20" : "hover:bg-ink-50/40"}`}>
                      <td className="px-5 py-3.5">
                        <span className="font-bold text-ink-800 block">{c.name}</span>
                        <span className="text-xs text-ink-500 block mt-0.5">{c.incidents} incidents MTD</span>
                      </td>
                      <td className={`px-3 py-3.5 text-right font-bold ${scoreColor}`}>{c.score}</td>
                      <td className="px-5 py-3.5 text-right">
                        <Badge tone={tag}>{c.rating}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Selected details */}
        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="font-bold text-ink-900">{contractors[sel].name}</h3>
            <span className="text-xs text-ink-500 block mt-1">Audit Details &amp; Certification Status</span>

            <div className="mt-5 space-y-3.5 text-xs">
              <div className="flex justify-between">
                <span className="text-ink-500">Last Audit Date:</span>
                <span className="font-bold text-ink-800">{contractors[sel].auditDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-500">Certification:</span>
                <span className={`font-bold ${contractors[sel].certification === "Suspended" ? "text-red-600" : "text-ink-800"}`}>
                  {contractors[sel].certification}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-500">Violations Flagged:</span>
                <span className="font-bold text-red-600">{contractors[sel].incidents}</span>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <button className="w-full bg-ink-900 hover:bg-ink-800 text-white font-semibold py-2.5 rounded-xl text-xs">
                Schedule Audit Verification
              </button>
              {contractors[sel].rating === "Suspended" && (
                <span className="block text-center text-xs font-bold text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
                  Contractor Work Blocked
                </span>
              )}
            </div>
          </Card>

          <Card className="p-5 bg-gradient-to-br from-amber-500/5 to-transparent border-amber-500/10 text-xs">
            <h4 className="font-bold text-xs text-amber-800 uppercase tracking-wide">Audit Regulatory Compliance</h4>
            <p className="text-amber-800/80 mt-1 leading-relaxed">
              Contractors carrying out pipeline excavation are audited bi-monthly. Scores below 70 require immediate work stoppage and safety training re-validation.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
