"use client";

import { useState } from "react";
import { Card, Kpi, Badge } from "@/components/ui";
import Typewriter from "@/components/Typewriter";
import CountUp from "@/components/CountUp";
import {
  Award, Star, Gift, Zap, TrendingUp, Crown,
  ShieldCheck, ChevronRight, Clock, CheckCircle,
} from "lucide-react";

const TIER_CONFIG = {
  Silver: { color: "from-slate-400 to-slate-600", textColor: "text-slate-700", bg: "bg-slate-50", border: "border-slate-200", emoji: "🥈", pointsNeeded: 1000 },
  Gold: { color: "from-amber-400 to-amber-600", textColor: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", emoji: "🥇", pointsNeeded: 2500 },
  Platinum: { color: "from-indigo-400 to-indigo-600", textColor: "text-indigo-700", bg: "bg-indigo-50", border: "border-indigo-200", emoji: "💎", pointsNeeded: 5000 },
};

const TRANSACTIONS = [
  { date: "Jul 14", action: "Timely Bill Payment — July", points: +120, type: "earn" },
  { date: "Jul 10", action: "Safety Compliance Check", points: +80, type: "earn" },
  { date: "Jul 08", action: "Redeemed: Gas Connection Priority", points: -200, type: "redeem" },
  { date: "Jun 30", action: "Annual Inspection Completed", points: +150, type: "earn" },
  { date: "Jun 25", action: "Referral Bonus — New Customer", points: +250, type: "earn" },
  { date: "Jun 15", action: "Feedback Survey Submitted", points: +50, type: "earn" },
];

const REWARDS = [
  { title: "Bill Credit ₹100", points: 300, available: true, icon: "💳" },
  { title: "Priority Engineer Visit", points: 500, available: true, icon: "🔧" },
  { title: "Free Safety Inspection", points: 400, available: false, icon: "🛡️" },
  { title: "Gas Connection Upgrade", points: 800, available: false, icon: "🔗" },
  { title: "Appliance Discount Voucher", points: 350, available: true, icon: "🏷️" },
  { title: "Smart Meter Installation", points: 1000, available: false, icon: "📡" },
];

const MILESTONES = [
  { label: "First Payment", done: true },
  { label: "Safety Verified", done: true },
  { label: "3 Months Active", done: true },
  { label: "Referral Bonus", done: true },
  { label: "Platinum Tier", done: false },
];

export default function TrustPoints() {
  const [points] = useState(1840);
  const tier = "Gold";
  const cfg = TIER_CONFIG[tier];
  const nextTier = "Platinum";
  const nextCfg = TIER_CONFIG["Platinum"];
  const progressPct = Math.round(((points - 1000) / (2500 - 1000)) * 100);

  return (
    <div className="space-y-6 reveal">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-ink-900 via-ink-900 to-amber-900 text-white p-6 relative overflow-hidden shadow-soft">
        <div className="floaty absolute -right-10 -top-10 w-56 h-56 bg-amber-500/20 rounded-full blur-3xl" />
        <div className="relative">
          <p className="text-amber-300 text-xs font-semibold uppercase tracking-widest">Customer Loyalty Platform</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">
            <Typewriter speed={40} segments={[{ text: "TrustPoints " }, { text: "⭐", cls: "" }]} />
          </h1>
          <p className="text-ink-300 mt-2 text-sm max-w-2xl">
            Earn points for safe behavior, timely payments, and active engagement. Redeem for exclusive benefits and priority service.
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 anim-fade-up">
        <Kpi label="TrustPoints Balance" value={<CountUp to={points} />} sub="Available to redeem" icon={<Star className="w-4 h-4" />} />
        <Kpi label="Current Tier" value={tier} sub={`${cfg.emoji} Loyalty Member`} accent="text-amber-600" icon={<Crown className="w-4 h-4" />} />
        <Kpi label="Points to Platinum" value={<CountUp to={2500 - points} />} sub="Next tier unlock" icon={<TrendingUp className="w-4 h-4" />} />
        <Kpi label="Points Earned This Month" value={<CountUp to={450} />} sub="Since Jul 1" accent="text-brand-600" icon={<Zap className="w-4 h-4" />} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 anim-fade-up">
        {/* Tier Progress Card */}
        <div className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${cfg.color} grid place-items-center text-2xl shadow-lg`}>
                {cfg.emoji}
              </div>
              <div>
                <p className="font-extrabold text-ink-900 text-lg">{tier} Member</p>
                <p className="text-xs text-ink-500">ID · PNG-01847-G</p>
              </div>
            </div>

            <div className="mb-2 flex justify-between text-xs font-medium">
              <span className="text-ink-600">Progress to {nextTier}</span>
              <span className={nextCfg.textColor}>{progressPct}%</span>
            </div>
            <div className="h-3 bg-ink-100 rounded-full overflow-hidden mb-1">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-1000"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-ink-400 mt-1">
              <span>1,000 pts (Silver)</span>
              <span>2,500 pts (Platinum)</span>
            </div>

            <div className="mt-5 space-y-2">
              {MILESTONES.map((m, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  {m.done
                    ? <CheckCircle className="w-4 h-4 text-brand-500 shrink-0" />
                    : <div className="w-4 h-4 rounded-full border-2 border-ink-200 shrink-0" />}
                  <span className={m.done ? "text-ink-700 font-medium" : "text-ink-400"}>{m.label}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Tier Benefits */}
          <Card className={`p-5 border ${cfg.border} ${cfg.bg}`}>
            <h3 className={`font-bold text-sm mb-3 ${cfg.textColor}`}>{tier} Tier Benefits</h3>
            <ul className="space-y-1.5 text-xs text-ink-600">
              {[
                "Priority customer support queue",
                "Free annual safety inspection",
                "5% off connection upgrade fees",
                "Exclusive seasonal reward offers",
              ].map((b, i) => (
                <li key={i} className="flex items-center gap-2">
                  <ShieldCheck className="w-3 h-3 text-amber-500 shrink-0" />
                  {b}
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Rewards Catalog */}
        <Card className="lg:col-span-2 p-6">
          <h3 className="font-bold text-ink-900 mb-5 flex items-center gap-2">
            <Gift className="w-4 h-4 text-amber-500" /> Rewards Catalog
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {REWARDS.map((r, i) => (
              <div
                key={i}
                className={`rounded-xl p-4 border flex items-center justify-between gap-3 transition ${
                  r.available
                    ? "border-brand-200 bg-brand-50 hover:border-brand-400 cursor-pointer"
                    : "border-ink-100 bg-ink-50 opacity-60 cursor-not-allowed"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{r.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-ink-800 leading-tight">{r.title}</p>
                    <p className="text-[11px] text-ink-500 mt-0.5">
                      <span className="font-bold text-amber-600">{r.points} pts</span>
                    </p>
                  </div>
                </div>
                {r.available ? (
                  <button className="text-xs font-bold text-brand-600 bg-brand-100 px-3 py-1.5 rounded-lg hover:bg-brand-200 transition whitespace-nowrap">
                    Redeem
                  </button>
                ) : (
                  <Badge tone="ink">Locked</Badge>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Transaction History */}
      <Card className="p-6 anim-fade-up">
        <h3 className="font-bold text-ink-900 mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-ink-500" /> Points History
        </h3>
        <div className="divide-y divide-ink-100">
          {TRANSACTIONS.map((t, i) => (
            <div key={i} className="flex items-center justify-between py-3 gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`h-8 w-8 rounded-xl grid place-items-center shrink-0 ${
                  t.type === "earn" ? "bg-brand-50" : "bg-amber-50"
                }`}>
                  {t.type === "earn"
                    ? <TrendingUp className="w-3.5 h-3.5 text-brand-500" />
                    : <Gift className="w-3.5 h-3.5 text-amber-500" />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink-800 truncate">{t.action}</p>
                  <p className="text-[11px] text-ink-400">{t.date}</p>
                </div>
              </div>
              <span className={`text-sm font-bold tabular-nums shrink-0 ${
                t.points > 0 ? "text-brand-600" : "text-amber-600"
              }`}>
                {t.points > 0 ? "+" : ""}{t.points} pts
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
