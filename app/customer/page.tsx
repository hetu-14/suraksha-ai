"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Badge, Card, Kpi } from "@/components/ui";
import CountUp from "@/components/CountUp";
import Typewriter from "@/components/Typewriter";
import { currentCustomer, inr } from "@/lib/data";
import {
  Award, Bell, Calendar, CheckCircle2, ChevronRight, CircleAlert,
  ClipboardCheck, Flame, HeartPulse, Phone, ReceiptText,
  RotateCcw, ShieldCheck, Siren, Sparkles, TriangleAlert, X,
} from "lucide-react";

type Toast = { message: string } | null;
type AttentionAction = "contact" | "inspection" | "bill";
type DashboardState = { contactVerified: boolean; inspectionBooked: boolean; billCleared: boolean };
type UpdateItem = { id: string; text: string; time: string; warning?: boolean; read: boolean };

const STORAGE_KEY = "suraksha-customer-dashboard";
const INITIAL_UPDATES: UpdateItem[] = [
  { id: "survey", text: "Site survey completed", time: "Today", read: false },
  { id: "feedback", text: "Feedback resolved", time: "Yesterday", read: false },
  { id: "training", text: "Leak safety training completed", time: "2 days ago", read: true },
  { id: "inspection", text: "Inspection due in 45 days", time: "3 days ago", warning: true, read: false },
  { id: "points", text: "TrustPoints earned +100", time: "4 days ago", read: true },
];

export default function CustomerHome() {
  const [animStep, setAnimStep] = useState(0);
  const [contactVerified, setContactVerified] = useState(false);
  const [inspectionBooked, setInspectionBooked] = useState(false);
  const [billCleared, setBillCleared] = useState(false);
  const [toast, setToast] = useState<Toast>(null);
  const [updates, setUpdates] = useState<UpdateItem[]>(INITIAL_UPDATES);
  const [hydrated, setHydrated] = useState(false);
  const [notificationFilter, setNotificationFilter] = useState<"All" | "Unread">("All");
  const dueBill = currentCustomer.bills.find((bill) => bill.status === "Due");
  const activeBill = billCleared ? undefined : dueBill;
  const readiness = contactVerified ? 100 : 75;
  const safetyScore = contactVerified ? 85 : 82;

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const state = JSON.parse(saved) as Partial<DashboardState>;
        setContactVerified(Boolean(state.contactVerified));
        setInspectionBooked(Boolean(state.inspectionBooked));
        setBillCleared(Boolean(state.billCleared));
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ contactVerified, inspectionBooked, billCleared }));
  }, [billCleared, contactVerified, hydrated, inspectionBooked]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const attention = useMemo(() => {
    const items: { key: AttentionAction; title: string; detail: string; icon: React.ReactNode }[] = [];
    if (!contactVerified) items.push({ key: "contact", title: "Verify emergency contact", detail: "+3 Safety Readiness", icon: <Phone className="w-4 h-4" /> });
    if (!inspectionBooked) items.push({ key: "inspection", title: "Regulator inspection", detail: "Due in 45 days", icon: <Calendar className="w-4 h-4" /> });
    if (activeBill) items.push({ key: "bill", title: "Current gas bill", detail: `${inr(activeBill.amount)} due in 4 days`, icon: <ReceiptText className="w-4 h-4" /> });
    return items;
  }, [activeBill, contactVerified, inspectionBooked]);
  const nextAction = attention[0];
  const unreadUpdates = updates.filter((update) => !update.read).length;
  const visibleUpdates = notificationFilter === "Unread" ? updates.filter((update) => !update.read) : updates;

  function completeAction(action: AttentionAction) {
    if (action === "contact") {
      setContactVerified(true);
      setToast({ message: "Emergency contact verified. Your Safety Readiness increased by 3 points." });
    }
    if (action === "inspection") {
      setInspectionBooked(true);
      setToast({ message: "Inspection visit requested for 18 Jul at 10:00 AM." });
    }
    if (action === "bill") {
      setBillCleared(true);
      setToast({ message: "Bill marked as paid for this dashboard session." });
    }
  }

  function resetDashboard() {
    setContactVerified(false);
    setInspectionBooked(false);
    setBillCleared(false);
    setUpdates(INITIAL_UPDATES);
    setToast({ message: "Dashboard restored to its current household action list." });
  }

  function markUpdateRead(id: string) {
    setUpdates((items) => items.map((item) => item.id === id ? { ...item, read: true } : item));
  }

  function dismissUpdate(id: string) {
    setUpdates((items) => items.filter((item) => item.id !== id));
  }

  return <div className="space-y-6 pb-4 reveal">
    {toast && <div className="fixed z-50 bottom-5 right-5 max-w-sm rounded-2xl bg-ink-900 text-white px-4 py-3 text-sm shadow-2xl flex items-start gap-2.5"><CheckCircle2 className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" /><span>{toast.message}</span><button onClick={() => setToast(null)} className="ml-auto text-ink-300 hover:text-white" aria-label="Close notification">×</button></div>}

    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink-950 via-ink-900 to-brand-950 px-6 py-7 sm:px-8 sm:py-9 text-white shadow-soft">
      <div className="absolute -right-16 -top-20 h-72 w-72 rounded-full bg-brand-400/15 blur-3xl" />
      <div className="absolute bottom-0 right-1/4 h-px w-1/2 bg-gradient-to-r from-transparent via-brand-300/40 to-transparent" />
      <div className="relative grid gap-7 lg:grid-cols-[1.35fr_.65fr] lg:items-end">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-300/20 bg-brand-400/10 px-3 py-1 text-xs font-semibold text-brand-200"><span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-pulse" />Household protection active</div>
          <p className="mt-5 min-h-[20px] text-sm font-medium text-brand-200"><Typewriter speed={50} startDelay={180} onComplete={() => setAnimStep(1)} segments={[{ text: `Good afternoon, ${currentCustomer.name.split(" ")[0]} ` }, { text: "👋", cls: "wave" }]} /></p>
          <h1 className="mt-1 min-h-[38px] text-3xl font-extrabold tracking-tight sm:text-4xl">{animStep ? <Typewriter speed={38} cursorClass="text-brand-300" segments={[{ text: "Your household is " }, { text: "safe", cls: "text-brand-300" }]} /> : <span className="text-transparent">Your household is safe</span>}</h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-300">No leak indicators detected. Your PNG connection and home safety profile are protected and monitored.</p>
          <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs text-ink-400"><span>{currentCustomer.id}</span><span>{currentCustomer.area}</span><span>{currentCustomer.type} connection</span></div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm"><p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-200">Next best action</p>{nextAction ? <><div className="mt-3 flex items-start gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-400/15 text-amber-200">{nextAction.icon}</div><div><p className="text-sm font-bold">{nextAction.title}</p><p className="mt-1 text-xs leading-relaxed text-ink-300">{nextAction.detail}. Completing it will update your household readiness.</p></div></div><button onClick={() => completeAction(nextAction.key)} className="mt-4 w-full rounded-xl bg-white py-2.5 text-xs font-bold text-ink-900 transition hover:bg-brand-50">Complete now</button></> : <div className="mt-3 flex items-start gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-400/15 text-brand-200"><CheckCircle2 className="w-5 h-5" /></div><div><p className="text-sm font-bold">Everything is up to date</p><p className="mt-1 text-xs leading-relaxed text-ink-300">Your household has no pending safety, inspection, or billing actions.</p></div></div>}</div>
      </div>
    </section>

    <div className="grid gap-3 sm:grid-cols-3">
      <QuickAction icon={<ShieldCheck className="h-4 w-4" />} label="Safety check" detail="View Gas-Guard" href="/customer/gascare" tone="brand" />
      <QuickAction icon={<Calendar className="h-4 w-4" />} label="Plan a visit" detail={inspectionBooked ? "Visit booked" : "Book inspection"} onClick={() => !inspectionBooked && completeAction("inspection")} tone="sky" />
      <QuickAction icon={<ReceiptText className="h-4 w-4" />} label="Billing" detail={activeBill ? `${inr(activeBill.amount)} due` : "Bill paid"} onClick={() => activeBill && completeAction("bill")} tone={activeBill ? "amber" : "brand"} />
    </div>

    <Card className={`overflow-hidden border ${attention.length ? "border-amber-200" : "border-brand-200"}`}>
      <div className={`h-1 w-full ${attention.length ? "bg-gradient-to-r from-amber-400 via-amber-300 to-transparent" : "bg-gradient-to-r from-brand-500 via-brand-300 to-transparent"}`} />
      <div className="p-5 sm:p-6">{attention.length ? <><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700"><CircleAlert className="w-5 h-5" /></div><div><p className="text-xs font-bold uppercase tracking-wider text-amber-700">Today&apos;s attention required</p><h2 className="mt-0.5 text-lg font-bold text-ink-900">Three quick actions will keep everything on track.</h2></div></div><Badge tone="amber">{attention.length} pending</Badge></div><div className="mt-5 grid gap-3 lg:grid-cols-3">{attention.map((item, index) => <button key={item.key} onClick={() => completeAction(item.key)} className="group flex items-center gap-3 rounded-2xl border border-ink-100 bg-ink-50/70 p-4 text-left transition hover:-translate-y-0.5 hover:border-amber-300 hover:bg-amber-50"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-amber-100 text-amber-700">{item.icon}</span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-ink-800">{item.title}</span><span className="mt-0.5 block text-xs text-ink-500">{item.detail}</span></span><ChevronRight className="h-4 w-4 text-ink-300 transition group-hover:text-amber-600" /><span className="sr-only">Complete action {index + 1}</span></button>)}</div></> : <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-100 text-brand-700"><CheckCircle2 className="w-6 h-6" /></div><div><p className="text-xs font-bold uppercase tracking-wider text-brand-700">All caught up</p><h2 className="mt-0.5 text-lg font-bold text-ink-900">No action required today</h2><p className="mt-1 text-sm text-ink-600">Your household is safe, compliant, and up to date.</p></div></div><button onClick={resetDashboard} className="inline-flex items-center justify-center gap-2 rounded-xl border border-ink-200 px-3 py-2 text-xs font-bold text-ink-600 hover:bg-ink-50"><RotateCcw className="w-3.5 h-3.5" />Restore demo actions</button></div>}</div>
    </Card>

    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 sm:gap-4">
      <Kpi label="Safety status" value="Safe" sub="No leak indicators" icon={<ShieldCheck className="w-4 h-4" />} />
      <Kpi label="Current bill" value={activeBill ? <CountUp to={activeBill.amount} prefix="₹" format /> : "Paid"} sub={activeBill ? "Due in 4 days" : "Nothing pending"} accent={activeBill ? "text-amber-600" : "text-brand-600"} icon={<ReceiptText className="w-4 h-4" />} />
      <Kpi label="Safety readiness" value={`${safetyScore}%`} sub={contactVerified ? "Emergency profile complete" : "One action remaining"} icon={<HeartPulse className="w-4 h-4" />} />
      <Kpi label="Inspection status" value="Valid" sub="Review: 16 Jan 2027" accent="text-brand-600" icon={<ClipboardCheck className="w-4 h-4" />} />
    </div>

    <div className="grid gap-5 xl:grid-cols-[1.55fr_.85fr]">
      <Card className="p-5 sm:p-6"><div className="flex items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-brand-700">At a glance</p><h2 className="mt-1 text-lg font-bold text-ink-900">Household snapshot</h2></div><span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700"><span className="h-1.5 w-1.5 rounded-full bg-brand-500" />Healthy</span></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><Snapshot label="Safety" value="Good" detail="No gas leak signals" tone="brand" /><Snapshot label="Billing" value={activeBill ? `${inr(activeBill.amount)} due` : "Normal"} detail={activeBill ? "Payment due in 4 days" : "No payment pending"} tone={activeBill ? "amber" : "brand"} /><Snapshot label="Connection" value="Active" detail="Supply operating normally" tone="brand" /><Snapshot label="Emergency readiness" value={contactVerified ? "Complete" : "Needs attention"} detail={contactVerified ? "Contact is verified" : "Verify your contact"} tone={contactVerified ? "brand" : "amber"} /></div></Card>
      <Card className="p-5 sm:p-6"><div className="flex items-center gap-2"><TriangleAlert className="h-4 w-4 text-amber-600" /><div><p className="text-xs font-bold uppercase tracking-wider text-amber-700">Risk summary</p><h2 className="mt-1 text-lg font-bold text-ink-900">What to watch</h2></div></div><div className="mt-5 space-y-3"><Risk label="Leak risk" value="Low" tone="brand" /><Risk label="Equipment risk" value="Medium" tone="amber" /><Risk label="Payment risk" value={activeBill ? "Medium" : "Low"} tone={activeBill ? "amber" : "brand"} /><Risk label="Service risk" value="Low" tone="brand" /></div><Link href="/customer/health" className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-brand-700 hover:text-brand-800">View safety details <ChevronRight className="w-3.5 h-3.5" /></Link></Card>
    </div>

    <div className="grid gap-5 lg:grid-cols-3">
      <Card className="overflow-hidden border-red-100 p-5 sm:p-6"><div className="flex items-start justify-between gap-3"><div className="flex items-center gap-2"><div className="grid h-9 w-9 place-items-center rounded-xl bg-red-50 text-red-600"><Siren className="h-4 w-4" /></div><div><p className="text-xs font-bold uppercase tracking-wider text-red-700">Preparedness</p><h2 className="mt-0.5 text-lg font-bold text-ink-900">Emergency readiness</h2></div></div><div className="relative grid h-14 w-14 place-items-center rounded-full" style={{ background: `conic-gradient(#10b981 ${readiness * 3.6}deg, #e2e8f0 0deg)` }}><div className="grid h-11 w-11 place-items-center rounded-full bg-white"><span className="text-xs font-extrabold text-ink-800">{readiness}%</span></div></div></div><div className="mt-5 space-y-2"><Readiness label="Gas-Guard activated" complete /><Readiness label="Safety training completed" complete /><Readiness label="Emergency contact" complete={contactVerified} /><Readiness label="Inspection valid" complete /></div>{!contactVerified ? <button onClick={() => completeAction("contact")} className="mt-5 w-full rounded-xl bg-ink-900 py-2.5 text-xs font-bold text-white transition hover:bg-ink-800">Complete emergency profile</button> : <div className="mt-5 rounded-xl bg-brand-50 px-3 py-2.5 text-center text-xs font-bold text-brand-700">You are ready for a faster emergency response.</div>}</Card>
      <Card className="overflow-hidden border-sky-100 p-5 sm:p-6"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><div className="grid h-9 w-9 place-items-center rounded-xl bg-sky-50 text-sky-600"><Calendar className="h-4 w-4" /></div><div><p className="text-xs font-bold uppercase tracking-wider text-sky-700">Plan ahead</p><h2 className="mt-0.5 text-lg font-bold text-ink-900">Upcoming timeline</h2></div></div><span className="rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-bold text-sky-700">3 dates</span></div><div className="mt-5"><Upcoming date="18 Jul" title={inspectionBooked ? "Regulator inspection visit" : "Inspection slot available"} detail="10:00 AM · Home service" accent="sky" /><Upcoming date="25 Jul" title={activeBill ? "Gas bill due" : "Bill settled"} detail={activeBill ? `${inr(activeBill.amount)} · Set a reminder` : "No payment pending"} accent={activeBill ? "amber" : "brand"} /><Upcoming date="16 Jan 2027" title="Inspection renewal" detail="Current certificate valid" accent="ink" /></div>{!inspectionBooked && <button onClick={() => completeAction("inspection")} className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-sky-700 hover:text-sky-800">Book the 18 Jul visit <ChevronRight className="h-3.5 w-3.5" /></button>}</Card>
      <Card className="overflow-hidden border-violet-100 p-5 sm:p-6"><div className="flex items-start justify-between gap-3"><div className="flex items-center gap-2"><div className="grid h-9 w-9 place-items-center rounded-xl bg-violet-50 text-violet-600"><Bell className="h-4 w-4" /></div><div><p className="text-xs font-bold uppercase tracking-wider text-violet-700">Notification center</p><h2 className="mt-0.5 text-lg font-bold text-ink-900">Updates for you</h2></div></div>{unreadUpdates > 0 && <button onClick={() => setUpdates((items) => items.map((item) => ({ ...item, read: true })))} className="rounded-lg bg-violet-50 px-2.5 py-1.5 text-[11px] font-bold text-violet-700 hover:bg-violet-100">Mark all read</button>}</div><div className="mt-4 flex gap-1 rounded-xl bg-ink-50 p-1"><button onClick={() => setNotificationFilter("All")} className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-bold transition ${notificationFilter === "All" ? "bg-white text-ink-800 shadow-sm" : "text-ink-400"}`}>All <span className="ml-1 text-[10px]">{updates.length}</span></button><button onClick={() => setNotificationFilter("Unread")} className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-bold transition ${notificationFilter === "Unread" ? "bg-white text-ink-800 shadow-sm" : "text-ink-400"}`}>Unread <span className="ml-1 text-[10px]">{unreadUpdates}</span></button></div><div className="mt-3 max-h-64 overflow-y-auto pr-1">{visibleUpdates.length ? visibleUpdates.map((update) => <Update key={update.id} {...update} onClick={() => markUpdateRead(update.id)} onDismiss={() => dismissUpdate(update.id)} />) : <div className="rounded-xl bg-ink-50 px-3 py-6 text-center text-xs text-ink-500">No unread updates. You&apos;re all caught up.</div>}</div></Card>
    </div>

    <div className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
      <Card className="p-5 sm:p-6"><div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-amber-600" /><div><p className="text-xs font-bold uppercase tracking-wider text-amber-700">Your progress</p><h2 className="mt-1 text-lg font-bold text-ink-900">Building a safer, smarter household</h2></div></div><div className="mt-5 grid gap-5 md:grid-cols-3"><Progress label="Safety readiness" value={safetyScore} target={90} suffix="%" /><Progress label="TrustPoints" value={1840} target={2500} suffix="" /><Progress label="Safety missions" value={contactVerified ? 2 : 1} target={5} suffix=" completed" /></div></Card>
      <Card className="p-5 sm:p-6 bg-gradient-to-br from-violet-50 via-white to-white border-violet-100"><div className="flex items-center gap-2"><Award className="h-4 w-4 text-violet-600" /><p className="text-xs font-bold uppercase tracking-wider text-violet-700">You said, we did</p></div><h2 className="mt-2 text-lg font-bold text-ink-900">WhyMyBill AI launched</h2><p className="mt-2 text-sm leading-relaxed text-ink-600">Created from customer feedback asking for simpler, clearer bill explanations.</p><Link href="/customer/voice" className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-violet-700 hover:text-violet-800">See community improvements <ChevronRight className="w-3.5 h-3.5" /></Link></Card>
    </div>

    <Card className="border-red-200 bg-gradient-to-r from-red-50 to-white p-5 sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-4"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-red-100"><Flame className="h-6 w-6 text-red-600" /></div><div><p className="text-xs font-bold uppercase tracking-wider text-red-600">Emergency response</p><h2 className="mt-0.5 font-bold text-red-900">Immediate gas leak support</h2><p className="mt-1 text-sm text-red-800/80">Smell gas? Get instant voice guidance and nearest-crew dispatch. Average response: <strong>&lt;10 minutes</strong>.</p></div></div><Link href="/customer/gascare" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-700"><Siren className="h-4 w-4" />SOS — Get help</Link></div></Card>
  </div>;
}

function Snapshot({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: "brand" | "amber" }) {
  return <div className={`rounded-2xl border p-4 ${tone === "brand" ? "border-brand-100 bg-brand-50/60" : "border-amber-200 bg-amber-50/60"}`}><p className="text-xs text-ink-500">{label}</p><p className={`mt-1 text-sm font-bold ${tone === "brand" ? "text-brand-800" : "text-amber-800"}`}>{tone === "brand" ? "✓ " : "⚠ "}{value}</p><p className="mt-1 text-[11px] text-ink-500">{detail}</p></div>;
}

function QuickAction({ icon, label, detail, tone, href, onClick }: { icon: React.ReactNode; label: string; detail: string; tone: "brand" | "amber" | "sky"; href?: string; onClick?: () => void | false }) {
  const colors = {
    brand: "border-brand-100 bg-brand-50/60 text-brand-700 hover:border-brand-300",
    amber: "border-amber-100 bg-amber-50/60 text-amber-700 hover:border-amber-300",
    sky: "border-sky-100 bg-sky-50/60 text-sky-700 hover:border-sky-300",
  };
  const body = <><span className="grid h-9 w-9 place-items-center rounded-xl bg-white shadow-sm">{icon}</span><span className="min-w-0 flex-1"><span className="block text-xs font-bold">{label}</span><span className="mt-0.5 block truncate text-[11px] opacity-75">{detail}</span></span><ChevronRight className="h-4 w-4 opacity-50" /></>;
  const className = `flex items-center gap-3 rounded-2xl border p-3.5 text-left transition hover:-translate-y-0.5 ${colors[tone]}`;
  return href ? <Link href={href} className={className}>{body}</Link> : <button onClick={onClick} className={className}>{body}</button>;
}

function Risk({ label, value, tone }: { label: string; value: string; tone: "brand" | "amber" }) {
  return <div className="flex items-center justify-between rounded-xl bg-ink-50 px-3 py-2.5 text-sm"><span className="text-ink-600">{label}</span><Badge tone={tone}>{value} {tone === "brand" ? "✓" : "⚠"}</Badge></div>;
}

function Readiness({ label, complete = false }: { label: string; complete?: boolean }) {
  return <div className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-xs ${complete ? "bg-brand-50/70" : "bg-amber-50"}`}><span className="font-medium text-ink-600">{label}</span><span className={`font-bold ${complete ? "text-brand-700" : "text-amber-700"}`}>{complete ? "✓ Ready" : "⚠ Pending"}</span></div>;
}

function Upcoming({ date, title, detail, accent }: { date: string; title: string; detail: string; accent: "brand" | "amber" | "sky" | "ink" }) {
  const colors = { brand: "bg-brand-50 text-brand-700 border-brand-100", amber: "bg-amber-50 text-amber-700 border-amber-100", sky: "bg-sky-50 text-sky-700 border-sky-100", ink: "bg-ink-50 text-ink-600 border-ink-100" };
  return <div className="relative flex gap-3 py-2.5 last:pb-0"><div className="relative flex w-14 shrink-0 flex-col items-center"><span className={`w-full rounded-lg border px-1 py-1.5 text-center text-[11px] font-bold ${colors[accent]}`}>{date}</span><span className="absolute -bottom-3 h-3 border-l border-dashed border-ink-200 last:hidden" /></div><div className="min-w-0 pt-0.5"><p className="text-sm font-semibold text-ink-700">{title}</p><p className="mt-0.5 text-[11px] text-ink-400">{detail}</p></div></div>;
}

function Update({ text, time, warning = false, read, onClick, onDismiss }: UpdateItem & { onClick: () => void; onDismiss: () => void }) {
  return <div className={`group flex gap-2.5 rounded-xl px-2 py-2.5 transition hover:bg-ink-50 ${read ? "opacity-60" : ""}`}><button onClick={onClick} className="flex min-w-0 flex-1 gap-2.5 text-left"><span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${warning ? "bg-amber-500" : "bg-brand-500"}`} /><span className="min-w-0"><span className="block text-sm font-medium text-ink-700">{text}{!read && <span className="ml-2 inline-block h-1.5 w-1.5 rounded-full bg-violet-500 align-middle" />}</span><span className="mt-0.5 block text-[11px] text-ink-400">{time}</span></span></button><button onClick={onDismiss} className="h-6 w-6 shrink-0 rounded-md text-ink-300 opacity-0 transition hover:bg-ink-100 hover:text-ink-600 group-hover:opacity-100 focus:opacity-100" aria-label={`Dismiss ${text}`}><X className="m-auto h-3.5 w-3.5" /></button></div>;
}

function Progress({ label, value, target, suffix }: { label: string; value: number; target: number; suffix: string }) {
  const progress = Math.min(100, Math.round((value / target) * 100));
  return <div><div className="flex items-end justify-between gap-2"><span className="text-xs font-semibold text-ink-600">{label}</span><span className="text-xs font-bold text-ink-800">{value.toLocaleString("en-IN")}{suffix}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-ink-100"><div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${progress}%` }} /></div><p className="mt-1.5 text-[11px] text-ink-400">Target: {target.toLocaleString("en-IN")}{suffix}</p></div>;
}
