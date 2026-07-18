"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Award, Check, CheckCircle2, ChevronRight, Clock3, Flame, Gift,
  HeartPulse, History, Medal, ShieldCheck, Sparkles, Star, TrendingUp,
  UsersRound, Wrench, Zap,
} from "lucide-react";
import { Card, Kpi } from "@/components/ui";
import Typewriter from "@/components/Typewriter";
import { healthProfileStorageKey, normalizeHealthProfile, type HealthProfile } from "@/lib/healthScore";
import { computeTier, ledgerPoints, storageKey, type Ledger } from "@/lib/trustPoints";

type Redemption = { rewardId: string; requestId: string; requestedAt: string; status: "Requested" | "Fulfilment in progress" };
type Profile = { completedMissions: string[]; redeemed: string[]; riskRewarded: boolean; gasGuardActive: boolean; redemptions: Redemption[]; ledger: Ledger[] };

const startingLedger: Ledger[] = [
  { id: "pay", date: "Jul 14", action: "Timely bill payments", points: 620, category: "Timely payments" },
  { id: "safe", date: "Jul 10", action: "Safety compliance", points: 480, category: "Safety compliance" },
  { id: "refer", date: "Jun 25", action: "Referred a new PNG customer", points: 350, category: "Referrals" },
  { id: "inspection", date: "Jun 30", action: "Annual equipment inspections", points: 290, category: "Inspections" },
  { id: "training", date: "Jun 15", action: "Leak safety awareness training", points: 100, category: "Training" },
];

const missions = [
  { id: "contact", title: "Verify emergency contact", reward: 50, icon: HeartPulse, href: "/customer/health", source: "Health Score" },
  { id: "quiz", title: "Complete leak safety module", reward: 100, icon: ShieldCheck, href: "/customer/gascare", source: "Safety Passport" },
  { id: "inspection", title: "Schedule preventive inspection", reward: 200, icon: Wrench, href: "/customer/appointment", source: "Health Score" },
  { id: "alerts", title: "Enable bill increase alerts", reward: 50, icon: Zap, href: "/customer/explainbill", source: "WhyMyBill" },
  { id: "gasguard", title: "Activate GasGuard", reward: 60, icon: Flame, href: "/customer/gascare", source: "GasGuard" },
];

const rewards = [
  { id: "annual", title: "Free annual inspection", points: 400, group: "Safety rewards", icon: "🛡️" },
  { id: "leak", title: "Free leak testing", points: 300, group: "Safety rewards", icon: "🔎" },
  { id: "certificate", title: "Safety awareness certificate", points: 150, group: "Safety rewards", icon: "📜" },
  { id: "kit", title: "Home emergency kit", points: 600, group: "Safety rewards", icon: "🧰" },
  { id: "credit", title: "Bill credit ₹100", points: 300, group: "Service rewards", icon: "💳" },
  { id: "reconnect", title: "Free reconnection fee", points: 450, group: "Service rewards", icon: "🔗" },
  { id: "appliance", title: "PNG appliance discount", points: 350, group: "Partner rewards", icon: "🏷️" },
  { id: "meter", title: "Smart meter upgrade discount", points: 1000, group: "Partner rewards", icon: "📡" },
];

export default function TrustPoints() {
  const [tab, setTab] = useState<"overview" | "missions" | "rewards" | "history">("overview");
  const [profile, setProfile] = useState<Profile>({ completedMissions: ["quiz"], redeemed: [], riskRewarded: false, gasGuardActive: false, redemptions: [], ledger: startingLedger });
  const [health, setHealth] = useState<HealthProfile>({ emergencyContactVerified: false, safetySurveyComplete: true, preventiveInspectionBooked: false });
  const [billAlerts, setBillAlerts] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(t);
  }, [notice]);

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(storageKey) ?? "null");
      if (saved && Array.isArray(saved.ledger)) {
        const redeemed = Array.isArray(saved.redeemed) ? saved.redeemed : [];
        const redemptions = Array.isArray(saved.redemptions)
          ? saved.redemptions
          : redeemed.map((rewardId: string) => ({ rewardId, requestId: "TP-EXISTING", requestedAt: "Earlier", status: "Fulfilment in progress" as const }));
        setProfile({ completedMissions: Array.isArray(saved.completedMissions) ? saved.completedMissions : ["quiz"], redeemed, riskRewarded: Boolean(saved.riskRewarded), gasGuardActive: Boolean(saved.gasGuardActive), redemptions, ledger: saved.ledger });
      }
      setHealth(normalizeHealthProfile(JSON.parse(window.localStorage.getItem(healthProfileStorageKey) ?? "null")));
      const billPrefs = JSON.parse(window.localStorage.getItem("suraksha:why-my-bill:cust-riddhi") ?? "null");
      setBillAlerts(Boolean(billPrefs?.alertEnabled));
    } catch { /* First visit uses the transparent starting ledger. */ }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try { window.localStorage.setItem(storageKey, JSON.stringify(profile)); } catch { /* current session remains functional */ }
  }, [loaded, profile]);

  useEffect(() => {
    if (!loaded) return;
    const verified: Record<string, boolean> = {
      contact: health.emergencyContactVerified,
      inspection: health.preventiveInspectionBooked,
      alerts: billAlerts,
      gasguard: profile.gasGuardActive,
      quiz: health.safetySurveyComplete,
    };
    const missing = missions.filter((mission) => verified[mission.id] && !profile.completedMissions.includes(mission.id));
    if (!missing.length) return;
    setProfile((current) => ({
      ...current,
      completedMissions: [...current.completedMissions, ...missing.map((mission) => mission.id)],
      ledger: [...missing.map((mission) => ({ id: `mission-${mission.id}`, date: "Today", action: mission.title, points: mission.reward, category: "Safety missions" })), ...current.ledger],
    }));
    setNotice(`${missing.map((mission) => mission.reward).reduce((sum, reward) => sum + reward, 0)} verified mission points added.`);
  }, [billAlerts, health, loaded, profile.completedMissions, profile.gasGuardActive]);

  const points = useMemo(() => ledgerPoints(profile.ledger), [profile.ledger]);
  const { tier, nextTier, away, progress } = useMemo(() => computeTier(points), [points]);
  const sourceTotals = ["Timely payments", "Safety compliance", "Referrals", "Inspections", "Training"].map((category) => ({ category, points: profile.ledger.filter((row) => row.category === category).reduce((sum, row) => sum + Math.max(0, row.points), 0) }));

  function activateGasGuard() {
    if (profile.gasGuardActive) return;
    setProfile((current) => ({ ...current, gasGuardActive: true }));
    setNotice("GasGuard activated. Your 60 mission points will be added after verification.");
  }

  function rewardRiskReduction() {
    if (profile.riskRewarded) return;
    setProfile((current) => ({ ...current, riskRewarded: true, ledger: [{ id: "risk-reduction", date: "Today", action: "Reduced leak risk from 62% to 18%", points: 150, category: "Risk reduction" }, ...current.ledger] }));
    setNotice("150 points added for reducing your gas safety risk.");
  }

  function redeem(id: string) {
    const reward = rewards.find((item) => item.id === id);
    if (!reward || profile.redeemed.includes(id)) return;
    if (points < reward.points) { setNotice(`You need ${reward.points - points} more points for ${reward.title}.`); return; }
    const requestId = `TP-${Math.floor(10000 + Math.random() * 89999)}`;
    setProfile((current) => ({ ...current, redeemed: [...current.redeemed, id], redemptions: [{ rewardId: id, requestId, requestedAt: "Today", status: "Requested" }, ...current.redemptions], ledger: [{ id: `redeem-${id}`, date: "Today", action: `Redeemed: ${reward.title}`, points: -reward.points, category: "Redemptions" }, ...current.ledger] }));
    setNotice(`${reward.title} has been requested as ${requestId}. Our team will contact you with the next step.`);
  }

  return <div className="space-y-6 reveal">
    <header className="rounded-2xl bg-gradient-to-br from-ink-900 via-ink-900 to-brand-900 text-white p-6 sm:p-8 relative overflow-hidden shadow-soft"><div className="floaty absolute -right-10 -top-10 w-56 h-56 bg-brand-500/20 rounded-full blur-3xl" /><div className="relative max-w-3xl"><p className="text-brand-300 text-xs font-semibold uppercase tracking-widest">Safety & engagement rewards</p><h1 className="text-2xl sm:text-3xl font-extrabold mt-1"><Typewriter speed={40} segments={[{ text: "TrustPoints for safer gas living." }]} /></h1><p className="text-ink-300 mt-2 text-sm">Earn rewards for safer, more responsible PNG use—timely payments, inspections, training, and keeping your safety details current.</p></div></header>
    <nav aria-label="TrustPoints sections" className="sticky top-3 z-10 flex gap-1 overflow-x-auto rounded-2xl border border-ink-100 bg-white/95 p-1.5 shadow-soft backdrop-blur">{([ ["overview", "Overview"], ["missions", "Safety missions"], ["rewards", "Rewards"], ["history", "Points history"] ] as const).map(([id, label]) => <button key={id} onClick={() => setTab(id)} className={`shrink-0 rounded-xl px-3.5 py-2 text-sm font-semibold transition ${tab === id ? "bg-ink-900 text-white" : "text-ink-500 hover:bg-ink-50 hover:text-ink-900"}`}>{label}</button>)}</nav>
    {notice && <div className="flex items-center justify-between gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800"><span><CheckCircle2 className="w-4 h-4 inline mr-1" />{notice}</span><button onClick={() => setNotice(null)} className="text-xs font-bold">Dismiss</button></div>}

    {tab === "overview" && <><div className="grid grid-cols-2 lg:grid-cols-4 gap-4"><Kpi label="TrustPoints balance" value={points.toLocaleString("en-IN")} sub="Available for safety & service rewards" icon={<Star className="w-4 h-4" />} /><Kpi label="Safety reputation" value={tier.name} sub="Responsible customer rating" icon={<ShieldCheck className="w-4 h-4 text-brand-500" />} /><Kpi label={nextTier ? `Points to ${nextTier.name}` : "Top reputation"} value={nextTier ? away : "Achieved"} sub={nextTier ? "Next reputation milestone" : "Thank you for leading safely"} icon={<TrendingUp className="w-4 h-4" />} /><Kpi label="Earned this month" value={profile.ledger.filter((row) => row.date === "Today").reduce((sum, row) => sum + Math.max(0, row.points), 0)} sub="Safety actions completed" icon={<Zap className="w-4 h-4 text-brand-500" />} /></div>
      <div className="grid lg:grid-cols-3 gap-5"><Card className="lg:col-span-2 p-5"><div className="flex items-start justify-between gap-3"><div><h2 className="font-bold text-ink-900">Safety Guardian journey</h2><p className="text-sm text-ink-600 mt-1">{points.toLocaleString("en-IN")} points earned. {nextTier ? `${away} points away from ${nextTier.name}.` : "You have reached the highest safety reputation."}</p></div><span className="h-11 w-11 rounded-xl bg-brand-100 text-brand-700 grid place-items-center text-lg font-bold">{tier.icon}</span></div><div className="mt-5"><div className="flex justify-between text-xs font-semibold"><span>{tier.name}</span><span>{nextTier?.name ?? "Community Protector"}</span></div><div className="h-3 bg-ink-100 rounded-full overflow-hidden mt-2"><div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${progress}%` }} /></div><div className="flex justify-between text-[11px] text-ink-400 mt-1"><span>{tier.threshold.toLocaleString("en-IN")} points</span><span>{nextTier?.threshold.toLocaleString("en-IN") ?? points.toLocaleString("en-IN")} points</span></div></div><div className="grid sm:grid-cols-3 gap-3 mt-5">{missions.slice(0, 3).map((mission) => <div key={mission.id} className="rounded-xl bg-ink-50 p-3"><div className="text-xs text-ink-500">Ways to earn</div><div className="font-semibold text-sm text-ink-800 mt-1">{mission.title}</div><div className="font-bold text-brand-700 mt-2">+{mission.reward}</div></div>)}</div></Card><Card className="p-5"><h2 className="font-bold text-ink-900 flex items-center gap-2"><Award className="w-4 h-4 text-brand-600" /> Safety reputation</h2><div className="text-2xl font-extrabold text-brand-700 mt-4">Excellent</div><ul className="mt-4 space-y-2 text-xs text-ink-700">{["3 years without incidents", "Timely safety inspections", "No overdue bills", "Emergency details maintained"].map((reason) => <li key={reason}><Check className="w-3.5 h-3.5 inline mr-1 text-brand-600" />{reason}</li>)}</ul><div className="mt-4 rounded-xl bg-brand-50 p-3 text-xs text-brand-800"><UsersRound className="w-3.5 h-3.5 inline mr-1" /> Area average: <strong>Safe User</strong> · You are above average</div><Link href="/customer/confidence" className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-brand-700 hover:underline">View detailed confidence breakdown <ChevronRight className="w-3.5 h-3.5" /></Link></Card></div>
      <div className="grid lg:grid-cols-2 gap-5"><Card className="p-5"><h2 className="font-bold text-ink-900">How you earned your points</h2><div className="mt-4 space-y-3">{sourceTotals.map((source) => <div key={source.category}><div className="flex justify-between text-sm"><span className="text-ink-700">{source.category}</span><span className="font-bold text-brand-700">{source.points}</span></div><div className="h-2 rounded-full bg-ink-100 overflow-hidden mt-1"><div className="h-full bg-brand-500 rounded-full" style={{ width: `${Math.min(100, (source.points / 620) * 100)}%` }} /></div></div>)}</div></Card><Card className={`p-5 ${profile.riskRewarded ? "border-brand-200 bg-brand-50/50" : "border-amber-200 bg-amber-50/50"}`}><h2 className="font-bold text-ink-900 flex items-center gap-2"><Flame className="w-4 h-4 text-amber-600" /> Risk reduction reward</h2><div className="grid grid-cols-2 gap-3 mt-4"><div><div className="text-xs text-ink-500">Previous leak risk</div><div className="font-bold text-red-600 mt-1">62%</div></div><div><div className="text-xs text-ink-500">Current leak risk</div><div className="font-bold text-brand-700 mt-1">18%</div></div></div>{profile.riskRewarded ? <div className="mt-4 text-sm font-bold text-brand-700"><Check className="w-4 h-4 inline mr-1" />150 points earned for safer behaviour</div> : <button onClick={rewardRiskReduction} className="mt-4 w-full rounded-xl bg-amber-500 hover:bg-amber-600 text-white py-2.5 text-sm font-semibold">Record safety improvement · +150 points</button>}</Card></div></>}

    {tab === "missions" && <div className="grid lg:grid-cols-3 gap-5"><Card className="lg:col-span-2 p-5"><h2 className="font-bold text-ink-900 flex items-center gap-2"><Sparkles className="w-4 h-4 text-brand-600" /> Monthly safety missions</h2><p className="text-xs text-ink-500 mt-1">Complete practical actions that make your household safer and earn points transparently.</p><div className="mt-5 space-y-3">{missions.map((mission) => { const done = profile.completedMissions.includes(mission.id); const Icon = mission.icon; return <div key={mission.id} className={`flex items-center gap-3 rounded-xl border p-4 ${done ? "border-brand-200 bg-brand-50" : "border-ink-100 bg-white"}`}><span className={`h-10 w-10 rounded-xl grid place-items-center ${done ? "bg-brand-500 text-white" : "bg-ink-100 text-brand-700"}`}>{done ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}</span><div className="min-w-0"><div className="font-semibold text-sm text-ink-800">{mission.title}</div><div className="text-xs font-bold text-brand-700 mt-1">Reward: +{mission.reward} points</div></div>{done ? <span className="ml-auto text-xs font-bold text-brand-700">Verified</span> : <div className="ml-auto shrink-0 text-right"><Link href={mission.href} className="text-xs font-bold text-brand-700 hover:underline">Open {mission.source}</Link>{mission.id === "gasguard" ? <button onClick={activateGasGuard} className="mt-1 block ml-auto rounded-lg bg-brand-600 hover:bg-brand-700 text-white px-3 py-1.5 text-xs font-bold">Activate</button> : <div className="mt-1 text-[10px] text-ink-400">Points added after verification</div>}</div>}</div>})}</div></Card><Card className="p-5"><h2 className="font-bold text-ink-900">Mission progress</h2><div className="text-4xl font-extrabold text-brand-700 mt-4">{profile.completedMissions.length}<span className="text-base text-ink-500"> / {missions.length}</span></div><div className="h-2 rounded-full bg-ink-100 overflow-hidden mt-3"><div className="h-full bg-brand-500" style={{ width: `${(profile.completedMissions.length / missions.length) * 100}%` }} /></div><p className="text-xs text-ink-600 mt-4">Each mission is verified from its linked feature, then shown in your ledger.</p></Card></div>}

    {tab === "rewards" && <Card className="p-5"><h2 className="font-bold text-ink-900 flex items-center gap-2"><Gift className="w-4 h-4 text-brand-600" /> Safety & service reward catalog</h2><p className="text-xs text-ink-500 mt-1">Rewards support prevention, safe equipment use, and useful PNG services. Emergency support is never prioritised by points.</p><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-5">{rewards.map((reward) => { const request = profile.redemptions.find((item) => item.rewardId === reward.id); const eligible = points >= reward.points; return <div key={reward.id} className={`rounded-xl border p-4 ${request ? "border-brand-200 bg-brand-50" : "border-ink-100 bg-white"}`}><div className="text-2xl">{reward.icon}</div><div className="text-[11px] text-ink-500 mt-3">{reward.group}</div><div className="font-bold text-sm text-ink-800 mt-1">{reward.title}</div><div className="text-xs font-bold text-amber-700 mt-2">{reward.points} points</div>{request ? <div className="mt-3 text-xs font-bold text-brand-700"><Check className="w-3.5 h-3.5 inline mr-1" />{request.status}<div className="mt-1 text-[10px] font-medium text-ink-500">{request.requestId} · {request.requestedAt}</div></div> : <button onClick={() => redeem(reward.id)} className={`mt-3 w-full rounded-lg py-2 text-xs font-bold ${eligible ? "bg-brand-600 hover:bg-brand-700 text-white" : "bg-ink-100 text-ink-400"}`}>{eligible ? "Redeem" : `${reward.points - points} more needed`}</button>}</div>})}</div>{profile.redemptions.length > 0 && <div className="mt-6 rounded-xl border border-ink-100 bg-ink-50 p-4"><h3 className="text-sm font-bold text-ink-900">My reward requests</h3><div className="mt-3 space-y-2">{profile.redemptions.map((request) => { const reward = rewards.find((item) => item.id === request.rewardId); return <div key={request.requestId} className="flex items-center justify-between gap-3 text-xs"><span className="font-medium text-ink-700">{reward?.title ?? "Reward"} <span className="text-ink-400">· {request.requestId}</span></span><span className="font-bold text-brand-700">{request.status}</span></div> })}</div></div>}</Card>}

    {tab === "history" && <Card className="p-5"><h2 className="font-bold text-ink-900 flex items-center gap-2"><History className="w-4 h-4 text-ink-500" /> Points history</h2><div className="divide-y divide-ink-100 mt-4">{profile.ledger.map((entry) => <div key={entry.id} className="flex items-center justify-between gap-4 py-3"><div className="flex items-center gap-3 min-w-0"><span className={`h-8 w-8 rounded-xl grid place-items-center shrink-0 ${entry.points > 0 ? "bg-brand-50 text-brand-600" : "bg-amber-50 text-amber-600"}`}>{entry.points > 0 ? <TrendingUp className="w-4 h-4" /> : <Gift className="w-4 h-4" />}</span><div><div className="text-sm font-semibold text-ink-800">{entry.action}</div><div className="text-[11px] text-ink-500">{entry.date} · {entry.category}</div></div></div><span className={`font-bold tabular-nums ${entry.points > 0 ? "text-brand-700" : "text-amber-700"}`}>{entry.points > 0 ? "+" : ""}{entry.points} pts</span></div>)}</div></Card>}
  </div>;
}
