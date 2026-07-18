"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ResponsiveContainer, Line, LineChart, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  Activity, AlertTriangle, Award, CalendarDays, Check, ChevronRight,
  CircleCheck, CreditCard, Flame, HeartPulse, NotebookTabs, ShieldCheck,
  Sparkles, Wrench,
} from "lucide-react";
import { Card, Kpi } from "@/components/ui";
import Typewriter from "@/components/Typewriter";
import { buildHealthFactors, emptyHealthProfile, healthProfileStorageKey, normalizeHealthProfile, overallHealthScore, type HealthFactor, type HealthProfile } from "@/lib/healthScore";
import { connectionStorageKey, emptyConnectionStatus, normalizeConnectionStatus, type ConnectionStatusRecord } from "@/lib/connectionStatus";

const history = [
  { month: "Jan", score: 75 }, { month: "Feb", score: 77 }, { month: "Mar", score: 79 },
  { month: "Apr", score: 81 }, { month: "May", score: 84 }, { month: "Jun", score: 82 },
];

export default function CustomerHealthScore() {
  const [activeTab, setActiveTab] = useState<"overview" | "details" | "passport" | "improve">("overview");
  const [selectedFactor, setSelectedFactor] = useState<HealthFactor["id"]>("safety");
  const [profile, setProfile] = useState<HealthProfile>(emptyHealthProfile);
  const [connection, setConnection] = useState<ConnectionStatusRecord>(emptyConnectionStatus);
  const [loaded, setLoaded] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(t);
  }, [notice]);

  useEffect(() => {
    try {
      setProfile(normalizeHealthProfile(JSON.parse(window.localStorage.getItem(healthProfileStorageKey) ?? "null")));
      setConnection(normalizeConnectionStatus(JSON.parse(window.localStorage.getItem(connectionStorageKey) ?? "null")));
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(healthProfileStorageKey, JSON.stringify(profile));
    } catch {
      // Private browsing can disable storage; the session still remains interactive.
    }
  }, [loaded, profile]);

  const factors = useMemo(() => buildHealthFactors(profile, connection), [connection, profile]);
  const selected = factors.find((factor) => factor.id === selectedFactor) ?? factors[0];
  const equipment = factors.find((factor) => factor.id === "equipment") ?? factors[0];
  const payment = factors.find((factor) => factor.id === "payment") ?? factors[0];
  const score = overallHealthScore(factors);
  const healthTrend = useMemo(() => history.map((point, index) => index === history.length - 1 ? { ...point, score } : point), [score]);
  const trendDelta = score - healthTrend[0].score;
  const contactVerified = profile.emergencyContactVerified;
  const readinessLabel = contactVerified && profile.safetySurveyComplete ? "Ready" : "Action needed";
  const readinessTone = readinessLabel === "Ready" ? "brand" : "amber";
  const targetScore = 90;
  const pointsToTarget = Math.max(0, targetScore - score);
  const inspectionDaysRemaining = 183;
  const scoreChanges = [
    { label: "Annual inspection completed", points: profile.preventiveInspectionBooked ? 3 : 0, positive: true },
    { label: "Stable usage behaviour", points: 2, positive: true },
    { label: "No active complaints", points: 2, positive: true },
    { label: "Emergency contact not verified", points: contactVerified ? 0 : -1, positive: false },
  ].filter((item) => item.points !== 0);

  function updateProfile(update: Partial<HealthProfile>) {
    if (update.emergencyContactVerified && !profile.emergencyContactVerified) {
      setNotice("Emergency contact verified. +3 to your safety readiness.");
    }
    setProfile((current) => ({ ...current, ...update }));
  }

  return (
    <div className="space-y-6 reveal">
      <header className="rounded-2xl bg-gradient-to-br from-ink-900 via-ink-900 to-brand-900 text-white p-6 sm:p-8 relative overflow-hidden shadow-soft">
        <div className="floaty absolute -right-10 -top-10 w-56 h-56 bg-brand-500/20 rounded-full blur-3xl" />
        <div className="relative max-w-3xl"><p className="text-brand-300 text-xs font-semibold uppercase tracking-widest">SuRaksha AI · Customer safety</p><h1 className="text-2xl sm:text-3xl font-extrabold mt-1"><Typewriter speed={40} segments={[{ text: "Gas Safety & Service Health Index" }]} /></h1><p className="text-ink-300 mt-2 text-sm">A simple view of whether your connection is safe, equipment is healthy, payments are on track, and any action needs your attention.</p></div>
      </header>

      <nav aria-label="Health score sections" className="sticky top-3 z-10 flex gap-1 overflow-x-auto rounded-2xl border border-ink-100 bg-white/95 p-1.5 shadow-soft backdrop-blur">
        {([ ["overview", "Overview"], ["details", "Score details"], ["passport", "Safety passport"], ["improve", "Improve score"] ] as const).map(([id, label]) => <button key={id} onClick={() => setActiveTab(id)} className={`shrink-0 rounded-xl px-3.5 py-2 text-sm font-semibold transition ${activeTab === id ? "bg-ink-900 text-white shadow-sm" : "text-ink-500 hover:bg-ink-50 hover:text-ink-900"}`}>{label}</button>)}
      </nav>

      {notice && <div className="flex items-center justify-between gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800 anim-fade-up"><span><Check className="w-4 h-4 inline mr-1" />{notice}</span><button onClick={() => setNotice(null)} className="text-xs font-bold">Dismiss</button></div>}

      {activeTab === "overview" && <>
        <section className="grid lg:grid-cols-3 gap-5"><Card className="lg:col-span-2 p-5 sm:p-6 bg-gradient-to-br from-brand-50 to-white border-brand-200"><div className="flex flex-wrap items-start justify-between gap-4"><div><span className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${readinessTone === "brand" ? "text-brand-700" : "text-amber-700"}`}><ShieldCheck className="w-3.5 h-3.5" /> Overall readiness · {readinessLabel}</span><div className="flex items-end gap-2 mt-2"><span className="text-5xl font-extrabold text-ink-900">{score}</span><span className="text-lg text-ink-500 mb-1">/ 100</span></div><p className="text-sm text-ink-600 mt-2">Inspection valid, no safety alerts, and no active complaints. Next action: <strong>{contactVerified ? "Keep monitoring your safety profile" : "Verify emergency contact"}</strong>.</p></div><div className="rounded-xl bg-white border border-brand-100 p-3 text-xs text-ink-700"><div className="font-bold text-ink-900 mb-2">Readiness signals</div>{["Inspection valid", "No active safety alerts", "No active complaints", contactVerified ? "Emergency contact verified" : "Emergency contact pending"].map((item, index) => <div key={item} className={`flex items-center gap-1.5 mt-1 ${index === 3 && !contactVerified ? "text-amber-700" : ""}`}>{index === 3 && !contactVerified ? <AlertTriangle className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5 text-brand-600" />}{item}</div>)}</div></div></Card><Card className="p-5"><h2 className="font-bold text-ink-900 flex items-center gap-2"><Award className="w-4 h-4 text-amber-500" /> Safety advantages</h2><ul className="mt-4 space-y-2.5 text-sm text-ink-700">{["Valid safety profile", "Emergency ready household", "Preventive inspection tracking", "Reduced household risk", "Safety passport verified"].map((benefit) => <li key={benefit}><Check className="w-4 h-4 inline mr-2 text-brand-600" />{benefit}</li>)}</ul></Card></section>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4"><Kpi label="Safety status" value="Excellent" sub="No active safety issue" icon={<ShieldCheck className="w-4 h-4 text-brand-500" />} /><Kpi label="Payment reliability" value={`${payment.score} / 100`} sub="12 recent bills on time" icon={<CreditCard className="w-4 h-4" />} /><Kpi label="Inspection validity" value="Valid" sub={`Until 16 Jan 2027 · ${inspectionDaysRemaining} days`} icon={<CalendarDays className="w-4 h-4" />} /><Kpi label="Usage risk" value="Low" sub="No leak indicators" icon={<Activity className="w-4 h-4 text-brand-500" />} /></div>
        <div className="grid lg:grid-cols-2 gap-5"><Card className="p-5"><div className="flex items-center justify-between"><div><h2 className="font-bold text-ink-900">Score changes this month</h2><p className="text-xs text-ink-500 mt-1">Every movement is explained in plain language.</p></div><span className="text-2xl font-extrabold text-brand-700">{score}</span></div><div className="mt-4 space-y-2.5">{scoreChanges.map((change) => <div key={change.label} className="flex items-center justify-between rounded-xl bg-ink-50 px-3 py-2.5 text-sm"><span className="text-ink-700">{change.label}</span><span className={`font-bold ${change.positive ? "text-brand-700" : "text-amber-700"}`}>{change.points > 0 ? "+" : ""}{change.points}</span></div>)}</div></Card><Card className="p-5 border-brand-100 bg-gradient-to-br from-brand-50/60 to-white"><div className="flex items-center gap-2"><Activity className="w-4 h-4 text-brand-600" /><div><h2 className="font-bold text-ink-900">Household risk status</h2><p className="text-xs text-ink-500 mt-1">Low risk · practical context behind the score.</p></div></div><div className="mt-4 rounded-xl bg-white border border-brand-100 p-3"><p className="text-lg font-extrabold text-brand-700">● Low Risk</p><div className="mt-3 grid sm:grid-cols-2 gap-2 text-xs text-ink-700"><RiskSignal label="Valid inspection" good /><RiskSignal label="No leak alerts" good /><RiskSignal label="Stable consumption" good /><RiskSignal label="Emergency contact missing" good={contactVerified} /></div></div></Card></div>
        <div className="grid lg:grid-cols-3 gap-5"><Card className="lg:col-span-2 p-5"><div className="flex items-start justify-between gap-3"><div><h2 className="font-bold text-ink-900">Health trend</h2><p className="text-xs text-ink-500 mt-1">Your score improved by {trendDelta} points over six months and is currently {score}.</p></div><span className="text-xs font-bold text-brand-700 bg-brand-50 px-2 py-1 rounded">+{trendDelta} pts since Jan</span></div><div className="h-[240px] mt-4"><ResponsiveContainer width="100%" height="100%"><LineChart data={healthTrend} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" vertical={false} /><XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} /><YAxis domain={[60, 100]} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} /><Line type="monotone" dataKey="score" name="Health score" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: "#10b981" }} /></LineChart></ResponsiveContainer></div></Card><Card className={`p-5 ${profile.preventiveInspectionBooked ? "border-brand-200 bg-brand-50/50" : "border-amber-200 bg-amber-50/50"}`}><h2 className={`font-bold flex items-center gap-2 ${profile.preventiveInspectionBooked ? "text-brand-800" : "text-amber-900"}`}><AlertTriangle className="w-4 h-4" /> {profile.preventiveInspectionBooked ? "Inspection scheduled" : "Attention required"}</h2><div className="mt-4"><div className="flex justify-between"><span className="font-semibold text-ink-800">Equipment health</span><span className={`font-bold ${equipment.tone === "brand" ? "text-brand-700" : "text-amber-700"}`}>{equipment.score} / 100</span></div><p className="text-xs text-ink-600 mt-2">{profile.preventiveInspectionBooked ? "Your preventive inspection has been added to your health plan." : "Kitchen regulator inspection is due in 45 days."}</p><Link href="/customer/appointment?service=inspection" className="mt-4 inline-flex w-full justify-center items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl py-2.5 text-sm font-semibold"><Wrench className="w-4 h-4" /> {profile.preventiveInspectionBooked ? "View appointment" : "Book inspection"}</Link></div></Card></div>
      </>}

      {activeTab === "details" && <div className="grid lg:grid-cols-3 gap-5"><Card className="lg:col-span-2 p-5"><h2 className="font-bold text-ink-900">Score calculation</h2><p className="text-xs text-ink-500 mt-1">Safety-first weights explain exactly what contributes to your index.</p><div className="mt-5 space-y-3">{factors.map((factor) => <button key={factor.id} onClick={() => setSelectedFactor(factor.id)} className={`w-full text-left rounded-xl border p-4 transition ${selectedFactor === factor.id ? "border-brand-300 bg-brand-50" : "border-ink-100 hover:bg-ink-50"}`}><div className="flex items-center justify-between"><div><span className="font-semibold text-ink-800">{factor.name}</span><span className="ml-2 text-xs text-ink-400">Weight: {factor.weight}%</span></div><span className={`font-bold ${factor.tone === "brand" ? "text-brand-700" : "text-amber-700"}`}>{factor.score}/100</span></div><div className="h-2 bg-ink-100 rounded-full overflow-hidden mt-3"><div className={`h-full rounded-full ${factor.tone === "brand" ? "bg-brand-500" : "bg-amber-500"}`} style={{ width: `${factor.score}%` }} /></div></button>)}</div></Card><Card className="p-5"><h2 className="font-bold text-ink-900">{selected.name}</h2><div className="text-3xl font-extrabold text-brand-700 mt-3">{selected.score}<span className="text-sm text-ink-500"> / 100</span></div><div className="mt-4 space-y-2">{selected.evidence.map((item) => <div key={item} className="flex gap-2 text-xs text-ink-700"><Check className="w-3.5 h-3.5 text-brand-600 shrink-0" />{item}</div>)}</div>{selected.action && <div className="mt-4 rounded-xl bg-amber-50 border border-amber-100 p-3 text-xs text-amber-800"><strong>Recommended action:</strong> {selected.action}</div>}</Card><Card className="lg:col-span-3 p-5"><h2 className="font-bold text-ink-900 flex items-center gap-2"><NotebookTabs className="w-4 h-4 text-brand-600" /> Connected SuRaksha modules</h2><div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">{[{ title: "WhyMyBill", value: "+5", note: "Stable usage pattern" }, { title: "GasGuard", value: "+3", note: "No emergency incidents" }, { title: "My PNG Status", value: "+2", note: "Documents completed" }, { title: "TrustPoints", value: "+1", note: "Active safety participation" }].map((module) => <div key={module.title} className="rounded-xl bg-ink-50 p-3"><div className="flex justify-between"><span className="text-sm font-bold text-ink-800">{module.title}</span><span className="text-sm font-bold text-brand-700">{module.value}</span></div><div className="text-xs text-ink-500 mt-1">{module.note}</div></div>)}</div></Card></div>}

      {activeTab === "passport" && <div className="grid lg:grid-cols-3 gap-5"><Card className="lg:col-span-2 p-5"><h2 className="font-bold text-ink-900 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-brand-600" /> Personal safety passport</h2><p className="text-xs text-ink-500 mt-1">A verified record of household safety readiness and important dates.</p><div className="grid sm:grid-cols-2 gap-3 mt-5">{[{ label: "Emergency contact", value: contactVerified ? "Verified · 12 Jan 2026" : "Verification pending", icon: HeartPulse }, { label: "Safety training", value: profile.safetySurveyComplete ? "Completed · 08 Feb 2026" : "Pending", icon: Flame }, { label: "Inspection", value: "Valid until 16 Jan 2027", icon: CalendarDays }, { label: "GasGuard registration", value: "Active", icon: ShieldCheck }].map((item) => <div key={item.label} className="rounded-xl border border-ink-100 bg-white p-4"><item.icon className="w-5 h-5 text-brand-600" /><div className="text-xs text-ink-500 mt-3">{item.label}</div><div className="font-bold text-ink-900 mt-0.5">{item.value}</div></div>)}</div><div className="mt-5 rounded-xl bg-brand-50 border border-brand-100 p-4"><p className="text-xs font-bold uppercase tracking-wide text-brand-700">Safety milestones</p><div className="grid sm:grid-cols-2 gap-2 mt-3 text-sm text-ink-700">{["Inspection completed", "Safety training completed", "No leak events for 12 months", "Consumption stable for 6 months"].map((item) => <span key={item}><Check className="w-4 h-4 inline mr-1 text-brand-600" />{item}</span>)}</div></div></Card><Card className="p-5"><h2 className="font-bold text-ink-900">Safety readiness</h2><p className="text-sm text-ink-600 mt-3">Complete your emergency-contact check to make your household safety profile more resilient.</p>{!contactVerified ? <button onClick={() => updateProfile({ emergencyContactVerified: true })} className="mt-4 w-full rounded-xl bg-brand-600 hover:bg-brand-700 text-white py-2.5 text-sm font-semibold">Verify emergency contact · +3</button> : <div className="mt-4 rounded-xl bg-brand-50 border border-brand-100 p-3 text-sm font-semibold text-brand-700"><Check className="w-4 h-4 inline mr-1" /> Emergency contact verified</div>}<Link href="/customer/gascare" className="mt-3 inline-flex w-full justify-center items-center gap-2 rounded-xl border border-brand-200 text-brand-700 hover:bg-brand-50 py-2.5 text-sm font-semibold"><Flame className="w-4 h-4" /> Open GasGuard</Link></Card></div>}

      {activeTab === "improve" && <div className="grid lg:grid-cols-3 gap-5"><Card className="lg:col-span-2 p-5"><h2 className="font-bold text-ink-900 flex items-center gap-2"><Sparkles className="w-4 h-4 text-brand-600" /> Your safety improvement journey</h2><div className="mt-4 grid grid-cols-3 gap-3"><ScoreStep label="Current score" value={String(score)} /><ScoreStep label="Target score" value={String(targetScore)} /><ScoreStep label="Required" value={`+${pointsToTarget}`} /></div><p className="text-sm text-ink-600 mt-4">Complete the recommended safety actions below to make your household more resilient.</p><div className="mt-5 space-y-3">{[{ points: 3, label: "Verify emergency contact", done: contactVerified, href: undefined }, { points: 3, label: "Schedule safety inspection", done: profile.preventiveInspectionBooked, href: "/customer/appointment?service=inspection" }, { points: 2, label: "Complete safety refresher", done: profile.safetySurveyComplete, href: "/customer/gascare" }].map((task) => <div key={task.label} className={`flex flex-wrap items-center gap-3 rounded-xl border p-4 ${task.done ? "border-brand-100 bg-brand-50" : "border-ink-100 bg-white"}`}><span className={`h-8 w-8 rounded-full grid place-items-center font-bold text-sm ${task.done ? "bg-brand-500 text-white" : "bg-ink-100 text-ink-600"}`}>{task.done ? <Check className="w-4 h-4" /> : `+${task.points}`}</span><div className="min-w-0 flex-1"><span className="font-semibold text-sm text-ink-800">{task.label}</span>{!task.done && <span className="block text-xs text-ink-500 mt-0.5">Current: {score} → After completion: {Math.min(targetScore, score + task.points)}</span>}</div>{task.href && !task.done && <Link href={task.href} className="text-xs font-bold text-brand-700 hover:underline">Open <ChevronRight className="w-3 h-3 inline" /></Link>}{!task.href && !task.done && <button onClick={() => updateProfile({ emergencyContactVerified: true })} className="text-xs font-bold text-brand-700 hover:underline">Verify <ChevronRight className="w-3 h-3 inline" /></button>}</div>)}</div></Card><Card className="p-5 bg-gradient-to-br from-brand-50 to-white border-brand-100"><h2 className="font-bold text-ink-900">Safety advantages</h2><ul className="mt-4 space-y-3 text-sm text-ink-700">{["Valid safety profile", "Emergency-ready household", "Preventive inspection tracking", "Reduced household risk", "Safety passport verified"].map((item) => <li key={item}><CircleCheck className="w-4 h-4 inline mr-2 text-brand-600" />{item}</li>)}</ul></Card></div>}
    </div>
  );
}

function RiskSignal({ label, good }: { label: string; good: boolean }) {
  return <span className={good ? "text-brand-700" : "text-amber-700"}>{good ? "✓" : "⚠"} {label}</span>;
}

function ScoreStep({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-ink-50 p-3"><p className="text-[11px] text-ink-500">{label}</p><p className="mt-1 text-lg font-extrabold text-ink-900">{value}</p></div>;
}
