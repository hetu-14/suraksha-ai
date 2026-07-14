"use client";

import { useState } from "react";
import { Card, Kpi, SectionTitle, Badge } from "@/components/ui";
import CountUp from "@/components/CountUp";
import Typewriter from "@/components/Typewriter";
import { Award, ShieldCheck, Heart, Users, RefreshCw } from "lucide-react";
import { TrendChart } from "@/components/Charts";

export default function CustomerConfidenceScore() {
  const [data] = useState([
    { day: "Jan", alerts: 82, resolved: 82 },
    { day: "Feb", alerts: 83, resolved: 83 },
    { day: "Mar", alerts: 84, resolved: 84 },
    { day: "Apr", alerts: 86, resolved: 86 },
    { day: "May", alerts: 85, resolved: 85 },
    { day: "Jun", alerts: 87, resolved: 87 }
  ]);

  const requirements = [
    { label: "Transparent Bills Explained", status: "100%", desc: "WhyMyBill / ExplainBill checks verified" },
    { label: "Annual Safety Compliance", status: "Active", desc: "Inspection confirmed within schedule" },
    { label: "Zero Leak/Abnormal Usage", status: "Verified", desc: "No abnormal flow anomalies detected" },
    { label: "App Engagement Level", status: "High", desc: "Active self-safety survey completion" }
  ];

  return (
    <div className="space-y-6 reveal">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-ink-900 via-ink-900 to-brand-900 text-white p-6 relative overflow-hidden shadow-soft">
        <div className="floaty absolute -right-10 -top-10 w-56 h-56 bg-brand-500/20 rounded-full blur-3xl" />
        <div className="relative">
          <p className="text-brand-300 text-xs font-semibold uppercase tracking-widest">Customer Experience Suite</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">
            <Typewriter speed={40} segments={[{ text: "Customer Confidence Score" }]} />
          </h1>
          <p className="text-ink-300 mt-2 text-sm max-w-2xl">
            Loyalty tier tracker and trust measurement index. Earn reward benefits by retaining high safety standards and compliance ratings.
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 anim-fade-up">
        <Kpi label="Confidence Score" value="87 / 100" icon={<Award className="w-4 h-4 text-brand-500 animate-bounce" />} />
        <Kpi label="Loyalty Tier" value="Platinum" accent="text-brand-600" icon={<ShieldCheck className="w-4 h-4" />} />
        <Kpi label="Referral Points" value={<CountUp to={2400} />} icon={<Heart className="w-4 h-4 text-red-500" />} />
        <Kpi label="Area Avg Index" value="79" icon={<Users className="w-4 h-4" />} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 anim-fade-up">
        {/* Trend history chart */}
        <Card className="lg:col-span-2 p-6">
          <h3 className="font-bold text-ink-900 mb-5">Trust &amp; Confidence Trend</h3>
          <TrendChart data={data} />

          <h3 className="font-bold text-ink-900 mt-8 mb-4">Loyalty Tier Requirements</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {requirements.map((req, idx) => (
              <div key={idx} className="p-4 bg-ink-50/60 rounded-xl border border-ink-100 flex flex-col justify-between">
                <div>
                  <span className="block font-bold text-xs text-ink-800">{req.label}</span>
                  <span className="block text-[11px] text-ink-500 mt-1">{req.desc}</span>
                </div>
                <span className="inline-block mt-3 text-xs font-bold text-brand-600 bg-brand-50 border border-brand-100 rounded px-2 py-0.5 w-fit">
                  {req.status}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Benefits Card */}
        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="font-bold text-ink-900 mb-3">Refer &amp; Earn</h3>
            <p className="text-xs text-ink-500 mb-4 leading-relaxed">
              Help your neighbors switch to safer pipeline connections. Refer a neighbor and get ₹500 bill discount credit when they register.
            </p>
            <div className="p-3 bg-brand-50 border border-brand-100 rounded-xl text-center flex flex-col gap-2">
              <span className="text-[10px] text-brand-600 font-bold uppercase tracking-wider">Referral Code</span>
              <span className="font-extrabold text-sm text-brand-700 tracking-wider">SURAKSHA-MEHTA-99</span>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-bold text-ink-900 mb-3">Platinum Tier Benefits</h3>
            <ul className="space-y-2 text-xs text-ink-600">
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-brand-500 shrink-0" />
                <span>Priority safety dispatch (SLA under 10 minutes)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-brand-500 shrink-0" />
                <span>Zero service charge on appliance inspection calls</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-brand-500 shrink-0" />
                <span>Free upgrade to smart kitchen leak sensor kit</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
