"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle, ArrowRight, CalendarDays, Check, CheckCircle2, ChevronRight,
  Circle, ClipboardCheck, Clock3, FileCheck2, FileText, Gauge, MapPin,
  Phone, Route, ShieldCheck, Sparkles, Upload, UserRound, UsersRound,
} from "lucide-react";
import { Card, Kpi } from "@/components/ui";
import Typewriter from "@/components/Typewriter";
import { connectionForecast, connectionStorageKey, emptyConnectionStatus, normalizeConnectionStatus, type ConnectionStatusRecord } from "@/lib/connectionStatus";

type Stage = {
  name: string;
  date: string;
  duration: string;
  owner: string;
  team: string;
  contact: string;
  description: string;
  next: string[];
};

const stages: Stage[] = [
  { name: "Application submitted", date: "05 Jul 2026", duration: "Complete", owner: "Customer onboarding", team: "Ahmedabad Zone", contact: "+91 79 4000 1906", description: "Your application and connection request were created successfully.", next: ["We register the application", "A document review is initiated", "You receive a survey slot"] },
  { name: "Document verification", date: "08 Jul 2026", duration: "Complete", owner: "Compliance desk", team: "Ahmedabad Zone", contact: "+91 79 4000 1906", description: "Identity, ownership, and address documents were reviewed.", next: ["Documents are checked for validity", "Property details are matched", "Survey team receives the case"] },
  { name: "Site survey & planning", date: "12 Jul 2026", duration: "Complete", owner: "Survey team", team: "Ahmedabad Zone", contact: "+91 79 4000 1906", description: "The route, access and safety clearance were assessed at your premises.", next: ["Technician visits the location", "Pipeline route is finalised", "Safety clearance is recorded"] },
  { name: "Meter installation", date: "Scheduled after approval", duration: "3 days", owner: "Installation coordinator", team: "Ahmedabad Zone", contact: "+91 79 4000 1906", description: "The meter, regulator and internal connection are installed after the signed layout is approved.", next: ["A meter-installation slot is confirmed", "Meter and service line are fitted", "The line is handed to safety testing"] },
  { name: "Gas safety testing", date: "After meter installation", duration: "2 days", owner: "QA inspectors", team: "Ahmedabad Zone", contact: "+91 79 4000 1906", description: "Pressure, leakage and appliance-safety tests are completed before supply is activated.", next: ["Pressure test is performed", "Leakage checks are recorded", "Safety clearance is issued"] },
  { name: "Final commissioning", date: "After safety clearance", duration: "1 day", owner: "Field engineer", team: "Ahmedabad Zone", contact: "+91 79 4000 1906", description: "Your connection is activated and the engineer explains safe PNG use.", next: ["Supply is activated", "Handover is completed", "You receive safety guidance"] },
];

const updates = [
  { date: "12 Jul", text: "Site survey completed", category: "Survey", team: "Ahmedabad Survey Team", channel: "SMS sent" },
  { date: "08 Jul", text: "Documents verified", category: "Documents", team: "Compliance Desk", channel: "App notification sent" },
  { date: "05 Jul", text: "Application approved", category: "Approval", team: "Customer Onboarding", channel: "SMS sent" },
];

export default function ConnectionJourney() {
  const [activeStage, setActiveStage] = useState(3);
  const [status, setStatus] = useState<ConnectionStatusRecord>(emptyConnectionStatus);
  const [loaded, setLoaded] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [siteAccessSlot, setSiteAccessSlot] = useState("2026-07-17T10:00");
  const [showDelay, setShowDelay] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "journey" | "documents" | "updates" | "actions">("overview");
  const [notice, setNotice] = useState<string | null>(null);
  const completedStages = 3;
  const progress = Math.round((completedStages / stages.length) * 100);
  const blockerCleared = Boolean(status.layout);
  const forecast = connectionForecast(status);
  const active = stages[activeStage];
  const readiness = blockerCleared ? (status.siteAccess ? 98 : 95) : 92;
  const waitingOn = blockerCleared ? "Torrent Gas Installation Team" : "Customer";
  const customerAction = blockerCleared ? "No action required from you" : "Upload signed layout approval";
  const delayActive = !blockerCleared;

  const pendingStages = useMemo(() => stages.slice(completedStages).map((stage) => ({ name: stage.name, duration: stage.duration })), []);

  useEffect(() => {
    try {
      setStatus(normalizeConnectionStatus(JSON.parse(window.localStorage.getItem(connectionStorageKey) ?? "null")));
    } catch {
      setStatus(emptyConnectionStatus);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(connectionStorageKey, JSON.stringify(status));
    } catch {
      // The live CRM integration can replace local persistence; this view remains usable if storage is blocked.
    }
  }, [loaded, status]);

  function updateStatus(update: Partial<ConnectionStatusRecord>) {
    setStatus((current) => ({ ...current, ...update }));
  }

  function uploadLayout(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Please upload a file smaller than 10 MB.");
      return;
    }
    if (!/\.(pdf|jpe?g|png)$/i.test(file.name)) {
      setUploadError("Use a PDF, JPG, JPEG, or PNG layout file.");
      return;
    }
    setUploadError(null);
    updateStatus({ layout: { name: file.name, size: file.size, uploadedAt: new Date().toISOString() } });
  }

  function verifyMobile() {
    updateStatus({ mobileVerified: true });
  }

  function scheduleSiteAccess() {
    updateStatus({ siteAccess: siteAccessSlot });
  }

  function toggleAlerts() {
    const next = !status.alertEnabled;
    updateStatus({ alertEnabled: next });
    if (next && "Notification" in window && Notification.permission === "default") void Notification.requestPermission();
  }

  function requestHelp(kind: "callback" | "query") {
    setNotice(kind === "callback" ? "Callback requested. A connection coordinator will contact you within one business day." : "Connection query raised. You will receive an update in this dashboard and by SMS.");
  }

  return (
    <div className="space-y-6 reveal">
      {notice && <div className="fixed right-4 top-4 z-50 flex max-w-sm items-start gap-3 rounded-2xl bg-ink-900 px-5 py-3 text-white shadow-xl anim-fade-up"><CheckCircle2 className="h-5 w-5 shrink-0 text-brand-400" /><span className="flex-1 text-sm font-semibold">{notice}</span><button onClick={() => setNotice(null)} aria-label="Dismiss notification">×</button></div>}
      <header className="rounded-2xl bg-gradient-to-br from-ink-900 via-ink-900 to-brand-900 text-white p-6 sm:p-8 relative overflow-hidden shadow-soft">
        <div className="floaty absolute -right-10 -top-10 w-56 h-56 bg-brand-500/20 rounded-full blur-3xl" />
        <div className="relative max-w-3xl"><p className="text-brand-300 text-xs font-semibold uppercase tracking-widest">My PNG Status</p><h1 className="text-2xl sm:text-3xl font-extrabold mt-1"><Typewriter speed={40} segments={[{ text: "Your connection, clearly tracked." }]} /></h1><p className="text-ink-300 mt-2 text-sm">See exactly when your PNG connection is expected, what is pending, who owns the next step, and what you can do today.</p></div>
      </header>

      <nav aria-label="Connection status sections" className="sticky top-3 z-10 flex gap-1 overflow-x-auto rounded-2xl border border-ink-100 bg-white/95 p-1.5 shadow-soft backdrop-blur">
        {([
          ["overview", "Overview"], ["journey", "Journey"], ["documents", "Documents"], ["updates", "Updates"], ["actions", "Actions"],
        ] as const).map(([id, label]) => <button key={id} onClick={() => setActiveTab(id)} className={`shrink-0 rounded-xl px-3.5 py-2 text-sm font-semibold transition ${activeTab === id ? "bg-ink-900 text-white shadow-sm" : "text-ink-500 hover:bg-ink-50 hover:text-ink-900"}`}>{label}</button>)}
      </nav>

      {activeTab === "overview" && <>
      <section className="rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 to-white p-5 sm:p-6 shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><div className="text-xs font-bold text-brand-700 uppercase tracking-wider flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> AI completion forecast</div><h2 className="text-2xl sm:text-3xl font-extrabold text-ink-900 mt-2">Expected completion: {forecast.date}</h2><p className="text-sm text-ink-600 mt-2">{forecast.days} days remaining, subject to the signed layout approval.</p></div><span className={`px-3 py-1.5 rounded-full text-xs font-bold ${forecast.risk === "Low" ? "bg-brand-100 text-brand-700" : "bg-amber-100 text-amber-700"}`}>Delay risk: {forecast.risk}</span></div>
        <div className="grid sm:grid-cols-3 gap-3 mt-5">{pendingStages.map((stage) => <div key={stage.name} className="bg-white border border-brand-100 rounded-xl p-3"><Check className="w-4 h-4 text-brand-600 mb-2" /><div className="text-sm font-semibold text-ink-800">{stage.name}</div><div className="text-xs text-ink-500 mt-0.5">Expected duration: {stage.duration}</div></div>)}</div>
        <div className="mt-4 rounded-xl border border-brand-100 bg-white/80 p-3"><div className="flex flex-wrap items-center justify-between gap-3 text-xs"><span className="font-semibold text-ink-600">Completion confidence: <span className="text-brand-700">{forecast.confidence}%</span></span><button onClick={() => setShowDelay((current) => !current)} className="text-brand-700 font-semibold hover:underline">{showDelay ? "Hide forecast details" : "View forecast details"}</button></div><div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-ink-600"><ConfidenceFactor label="Similar installations" /><ConfidenceFactor label="Engineer availability" /><ConfidenceFactor label="Current workload" /><ConfidenceFactor label="Material readiness" /></div></div>
        {showDelay && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4"><div className="flex gap-2"><AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" /><div className="flex-1"><h3 className="font-bold text-sm text-amber-900">Forecast updated</h3><div className="grid sm:grid-cols-3 gap-3 mt-3 text-xs"><div><span className="block text-amber-700">Previous completion</span><strong className="text-ink-800">26 July 2026</strong></div><div><span className="block text-amber-700">New completion</span><strong className="text-ink-800">{forecast.date}</strong></div><div><span className="block text-amber-700">Timeline impact</span><strong className="text-ink-800">{blockerCleared ? "Recovered" : "+4 days"}</strong></div></div><div className="mt-3 rounded-lg bg-white/70 p-3 text-xs"><p><span className="font-bold text-amber-900">Reason: </span>{blockerCleared ? "Signed layout approval received; scheduling can resume." : "Signed layout approval is pending."}</p><p className="mt-1"><span className="font-bold text-amber-900">How to recover time: </span>{blockerCleared ? "Our installation team is scheduling the next available visit." : "Upload the approval today to resume meter-installation scheduling."}</p></div></div></div></div>}
      </section>

      <div className="grid xl:grid-cols-3 gap-5">
        <Card className={`xl:col-span-2 p-5 border ${blockerCleared ? "border-brand-200 bg-brand-50/40" : "border-amber-200 bg-amber-50/50"}`}><div className="flex items-start gap-3"><div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${blockerCleared ? "bg-brand-100 text-brand-700" : "bg-amber-100 text-amber-700"}`}><UsersRound className="w-5 h-5" /></div><div className="flex-1"><p className="text-xs font-bold uppercase tracking-wider text-ink-500">Current dependency</p><h2 className="mt-1 font-bold text-ink-900">Who is waiting for whom?</h2><div className="mt-4 grid sm:grid-cols-2 gap-3"><div className="rounded-xl bg-white p-3 border border-white"><span className="block text-[11px] font-semibold text-ink-500">Waiting on</span><span className="mt-1 block text-sm font-bold text-ink-900">{waitingOn}</span></div><div className="rounded-xl bg-white p-3 border border-white"><span className="block text-[11px] font-semibold text-ink-500">Action required</span><span className={`mt-1 block text-sm font-bold ${blockerCleared ? "text-brand-700" : "text-amber-700"}`}>{customerAction}</span></div></div></div></div>{!blockerCleared && <button onClick={() => setActiveTab("documents")} className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-amber-800 hover:underline">Upload approval now <ChevronRight className="w-3.5 h-3.5" /></button>}</Card>
        <Card className="p-5"><p className="text-xs font-bold uppercase tracking-wider text-brand-700">Journey summary</p><div className="mt-3 space-y-2 text-xs"><SummaryLine label="Application submitted" value="05 Jul" /><SummaryLine label="Survey completed" value="12 Jul" /><SummaryLine label="Current stage" value="Meter installation" /><SummaryLine label="Expected activation" value={forecast.date.replace(" 2026", "")} /><SummaryLine label="Pending action" value={blockerCleared ? "None" : "Layout approval"} warn={!blockerCleared} /></div></Card>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Connection progress" value={`${completedStages} / ${stages.length}`} sub={`${progress}% stages complete`} icon={<Route className="w-4 h-4" />} />
        <Kpi label="Expected activation" value={forecast.date.replace(" 2026", "").replace("July", "Jul")} sub={`${forecast.days} days remaining`} icon={<CalendarDays className="w-4 h-4" />} />
        <Kpi label="Readiness score" value={`${readiness}/100`} sub={blockerCleared ? "Ready to schedule" : "One item pending"} icon={<Gauge className="w-4 h-4 text-brand-500" />} />
        <Kpi label="Documents received" value={blockerCleared ? "5 / 5" : "4 / 5"} sub={blockerCleared ? "All verified" : "Layout approval pending"} icon={<ClipboardCheck className="w-4 h-4" />} />
      </div>
      <Card className="p-5 border-brand-100 bg-gradient-to-r from-brand-50 to-white"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-brand-700">Service promise</p><h2 className="mt-1 font-bold text-ink-900">Your expected connection timeline</h2></div><span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-brand-700 shadow-sm">{forecast.days} days remaining</span></div><div className="mt-4 grid grid-cols-3 gap-3"><PromiseMetric label="Current progress" value={`${progress}%`} /><PromiseMetric label="Average similar connection" value="16 days" /><PromiseMetric label="Your estimated completion" value={forecast.date.replace(" 2026", "")} /></div></Card>
      {delayActive && <Card className="border-amber-200 bg-amber-50 p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700"><AlertTriangle className="w-5 h-5" /></div><div><p className="text-xs font-bold uppercase tracking-wider text-amber-700">Need help?</p><h2 className="mt-1 font-bold text-ink-900">Your connection is delayed while we wait for the signed layout approval.</h2><p className="mt-1 text-sm text-ink-600">If you need help after seven days, request a callback or raise a connection query.</p></div></div><div className="flex flex-wrap gap-2"><button onClick={() => requestHelp("callback")} className="rounded-xl bg-ink-900 px-3 py-2.5 text-xs font-bold text-white hover:bg-ink-800">Request callback</button><button onClick={() => requestHelp("query")} className="rounded-xl border border-amber-300 px-3 py-2.5 text-xs font-bold text-amber-800 hover:bg-amber-100">Raise query</button></div></div></Card>}
      </>}

      {activeTab === "journey" &&
      <div className="grid xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2 p-5 sm:p-6"><div className="flex items-center justify-between mb-5"><div><h2 className="font-bold text-ink-900">Installation progress</h2><p className="text-xs text-ink-500 mt-1">Select a stage to see what happens and who is responsible.</p></div><span className="text-sm font-bold text-brand-700">{progress}%</span></div><div className="h-2.5 bg-ink-100 rounded-full overflow-hidden mb-6"><div className="h-full bg-brand-500 rounded-full transition-all duration-700" style={{ width: `${progress}%` }} /></div><div className="relative border-l border-ink-200 ml-3 pl-6 space-y-6">{stages.map((stage, index) => { const done = index < completedStages; const current = index === completedStages; return <button key={stage.name} onClick={() => setActiveStage(index)} className={`relative block text-left w-full rounded-xl p-3 -ml-3 transition ${activeStage === index ? "bg-brand-50 border border-brand-100" : "hover:bg-ink-50 border border-transparent"}`}><span className={`absolute -left-[25px] top-4 h-5 w-5 rounded-full border-2 grid place-items-center bg-white ${done ? "border-brand-500 text-brand-600" : current ? "border-brand-600 text-brand-600" : "border-ink-200 text-ink-400"}`}>{done ? <Check className="w-3 h-3" /> : <span className="text-[9px] font-bold">{index + 1}</span>}</span><div className="flex flex-wrap items-center justify-between gap-2"><span className={`font-bold text-sm ${current ? "text-brand-700" : "text-ink-800"}`}>{stage.name}</span><span className="text-[11px] font-semibold text-ink-400">{stage.date}</span></div><p className="text-xs text-ink-500 mt-1">{stage.description}</p>{current && <span className="inline-block mt-2 px-2 py-0.5 rounded bg-brand-100 text-brand-700 text-[10px] font-bold">CURRENT STAGE</span>}</button>; })}</div></Card>

        <div className="space-y-5"><Card className="p-5"><h2 className="font-bold text-ink-900 flex items-center gap-2"><UserRound className="w-4 h-4 text-brand-600" /> Current responsibility</h2><div className="mt-4 rounded-xl bg-ink-50 p-3"><div className="text-[11px] text-ink-500">Current owner</div><div className="font-bold text-ink-900 mt-0.5">{active.owner}</div><div className="text-xs text-ink-500 mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" />{active.team}</div><a href={`tel:${active.contact.replace(/[^+\d]/g, "")}`} className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:underline"><Phone className="w-3.5 h-3.5" />{active.contact}</a></div><div className="mt-3 text-xs text-ink-600"><span className="font-semibold">Current activity: </span>{active.name}</div></Card>
        <Card className="p-5"><h2 className="font-bold text-ink-900 flex items-center gap-2"><Circle className="w-4 h-4 text-brand-600" /> What happens now?</h2><p className="text-xs text-ink-500 mt-1">{active.description}</p><ul className="mt-3 space-y-2">{active.next.map((item) => <li key={item} className="text-xs text-ink-700 flex gap-2"><ChevronRight className="w-3.5 h-3.5 text-brand-600 shrink-0 mt-0.5" />{item}</li>)}</ul><div className="mt-3 rounded-lg bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700">Expected date: {activeStage === 3 ? (blockerCleared ? "18 Jul 2026" : "After layout approval") : active.date} <span className="font-normal text-ink-500">· {active.duration}</span></div></Card></div>
      </div>
      }

      {activeTab === "documents" && <>
      <div className="grid xl:grid-cols-3 gap-6">
        <Card className={`xl:col-span-2 p-5 border ${blockerCleared ? "border-brand-200 bg-brand-50/40" : "border-amber-200 bg-amber-50/50"}`}><div className="flex items-start gap-3"><div className={`h-10 w-10 rounded-xl grid place-items-center shrink-0 ${blockerCleared ? "bg-brand-100 text-brand-700" : "bg-amber-100 text-amber-700"}`}><FileText className="w-5 h-5" /></div><div><h2 className="font-bold text-ink-900">Installation blocker</h2><p className="text-sm text-ink-700 mt-1">{blockerCleared ? "Signed layout approval received — meter installation can now be scheduled." : "Signed layout approval pending"}</p></div></div>{!blockerCleared && <><div className="mt-4 grid sm:grid-cols-2 gap-2"><div className="rounded-xl bg-white/70 p-3 text-xs text-amber-900"><span className="font-bold">Impact</span><p className="mt-1">❌ Meter installation cannot begin</p></div><div className="rounded-xl bg-white/70 p-3 text-xs text-amber-900"><span className="font-bold">Impact</span><p className="mt-1">❌ Safety testing cannot begin</p></div></div><label className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white px-4 py-2.5 text-sm font-semibold cursor-pointer"><Upload className="w-4 h-4" /> Upload signed layout sheet<input id="layout-upload" type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={uploadLayout} /></label>{uploadError && <p className="mt-3 text-xs font-semibold text-red-600">{uploadError}</p>}</>}{blockerCleared && <div className="mt-4 text-xs font-semibold text-brand-700 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> {status.layout?.name} uploaded for verification</div>}</Card>
        <Card className="p-5"><h2 className="font-bold text-ink-900 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-brand-600" /> Installation readiness</h2><div className="flex items-end gap-2 mt-3"><span className="text-3xl font-extrabold text-brand-700">{readiness}</span><span className="text-sm text-ink-500 mb-1">/ 100</span></div><div className="h-2 bg-ink-100 rounded-full overflow-hidden mt-3"><div className="h-full bg-brand-500" style={{ width: `${readiness}%` }} /></div><p className="mt-4 text-xs font-bold uppercase tracking-wide text-ink-500">Readiness breakdown</p><div className="mt-2 space-y-2"><ReadinessRow label="Documents" score="30 / 30" /><ReadinessRow label="Access availability" score={status.siteAccess ? "25 / 25" : "22 / 25"} /><ReadinessRow label="Safety clearance" score="25 / 25" /><ReadinessRow label="Final approval" score={blockerCleared ? "20 / 20" : "12 / 20"} warning={!blockerCleared} /></div></Card>
      </div>

      <div className="grid xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2 p-5"><h2 className="font-bold text-ink-900 flex items-center gap-2"><FileCheck2 className="w-4 h-4 text-brand-600" /> My submitted documents</h2><div className="grid sm:grid-cols-2 gap-3 mt-4">{[{ name: "Aadhaar", state: "Verified" }, { name: "PAN", state: "Verified" }, { name: "Ownership proof", state: "Verified" }, { name: "Layout approval", state: blockerCleared ? "Uploaded · verification pending" : "Pending upload" }].map((document) => <div key={document.name} className={`rounded-xl border p-3 flex items-center justify-between gap-3 ${document.state === "Pending upload" ? "border-amber-200 bg-amber-50" : "border-ink-100 bg-white"}`}><div className="flex items-center gap-2"><FileText className={`w-4 h-4 ${document.state === "Pending upload" ? "text-amber-600" : "text-brand-600"}`} /><span className="text-sm font-semibold text-ink-800">{document.name}</span></div><span className={`text-[10px] font-bold ${document.state === "Pending upload" ? "text-amber-700" : "text-brand-700"}`}>{document.state}</span></div>)}</div></Card>
      </div>
      </>}

      {activeTab === "updates" && <div className="grid xl:grid-cols-2 gap-6">
        <Card className="p-5"><h2 className="font-bold text-ink-900 flex items-center gap-2"><Clock3 className="w-4 h-4 text-brand-600" /> Recent updates</h2><p className="mt-1 text-xs text-ink-500">A complete record of what changed, who completed it, and how you were informed.</p><div className="mt-4 space-y-3">{updates.map((update) => <div key={update.date} className="flex gap-3 rounded-xl bg-ink-50 p-3"><div className="w-11 shrink-0 text-[11px] font-bold text-brand-700 pt-0.5">{update.date}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-sm font-semibold text-ink-800">{update.text}</span><span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-bold text-brand-700">{update.category}</span></div><p className="mt-1 text-xs text-ink-600">Completed by: {update.team}</p><p className="mt-1 text-[11px] text-ink-400">{update.channel}</p></div></div>)}</div></Card>
        <Card className="p-5"><h2 className="font-bold text-ink-900 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-600" /> Forecast change log</h2><div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-4"><div className="grid grid-cols-3 gap-3 text-xs"><div><span className="block text-amber-700">Original</span><strong>26 Jul</strong></div><div><span className="block text-amber-700">Current</span><strong>{forecast.date.replace(" 2026", "").replace("July", "Jul")}</strong></div><div><span className="block text-amber-700">Impact</span><strong>{blockerCleared ? "Resolved" : "+4 days"}</strong></div></div><p className="mt-3 text-xs text-amber-800">{blockerCleared ? "Signed layout approval received; the revised installation forecast is now on track." : "Signed layout approval is pending, so installation and safety testing cannot yet be scheduled."}</p></div></Card>
      </div>}

      {activeTab === "actions" && <>
      <div className="grid xl:grid-cols-2 gap-6">
        <Card className="p-5"><h2 className="font-bold text-ink-900 flex items-center gap-2"><UsersRound className="w-4 h-4 text-brand-600" /> Things you can do today</h2><div className="mt-4 space-y-3"><ActionRow done={blockerCleared} label={blockerCleared ? "Layout sheet uploaded" : "Upload pending layout sheet"} action={!blockerCleared ? "Open documents" : undefined} onClick={() => setActiveTab("documents")} /><ActionRow done={status.mobileVerified} label="Verify mobile number" action={status.mobileVerified ? undefined : "Verify"} onClick={verifyMobile} /><div className="rounded-xl bg-ink-50 px-3 py-3"><div className="flex items-center gap-3"><span className={`h-6 w-6 rounded-full grid place-items-center shrink-0 ${status.siteAccess ? "bg-brand-500 text-white" : "bg-white border border-ink-200 text-ink-400"}`}>{status.siteAccess ? <Check className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}</span><span className="text-sm font-medium text-ink-700">Schedule site access</span></div>{!status.siteAccess ? <div className="mt-3 flex gap-2"><input aria-label="Site access time" type="datetime-local" value={siteAccessSlot} onChange={(event) => setSiteAccessSlot(event.target.value)} className="min-w-0 flex-1 rounded-lg border border-ink-200 bg-white px-2 py-2 text-xs text-ink-700" /><button onClick={scheduleSiteAccess} className="rounded-lg bg-brand-600 px-3 text-xs font-bold text-white hover:bg-brand-700">Save</button></div> : <p className="mt-2 text-xs font-semibold text-brand-700">Access confirmed: {new Date(status.siteAccess).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</p>}</div><ActionRow done={status.alertEnabled} label={status.alertEnabled ? "Connection updates enabled" : "Enable connection updates"} action={status.alertEnabled ? undefined : "Enable"} onClick={toggleAlerts} /></div></Card>
        <Card className="p-5"><h2 className="font-bold text-ink-900 flex items-center gap-2"><CalendarDays className="w-4 h-4 text-brand-600" /> Meter installation appointment</h2><p className="text-sm text-ink-600 mt-3">Once the layout approval is verified, we will offer the next available meter-installation slot.</p><div className="mt-4 rounded-xl bg-ink-50 p-3"><div className="text-xs text-ink-500">{status.appointment ? "Confirmed slot" : "Proposed slot"}</div><div className="font-bold text-ink-900 mt-1">{status.appointment ?? "18 July 2026 · 10:00 AM"}</div><div className="text-xs text-ink-500 mt-1">{status.appointment ? "Saved from Appointment Booking" : "Subject to layout verification"}</div></div><div className="mt-4 rounded-xl border border-brand-100 bg-brand-50/60 p-3"><div className="flex items-center justify-between"><span className="text-xs font-bold text-ink-700">Appointment confidence</span><span className={`text-xs font-bold ${blockerCleared ? "text-brand-700" : "text-amber-700"}`}>{blockerCleared ? "High" : "Pending approval"}</span></div><div className="mt-2 grid grid-cols-3 gap-2 text-[11px]"><ConfidenceStatus label="Engineer assigned" good={blockerCleared} /><ConfidenceStatus label="Material available" good /><ConfidenceStatus label="Approval" good={blockerCleared} /></div></div><Link href="/customer/appointment?service=connection" className="mt-4 inline-flex items-center justify-center gap-2 w-full rounded-xl border border-brand-200 text-brand-700 hover:bg-brand-50 py-2.5 text-sm font-semibold"><CalendarDays className="w-4 h-4" /> {status.appointment ? "Reschedule appointment" : "Choose appointment"}</Link></Card>
      </div>

      <Card className="p-5 border-brand-100 bg-gradient-to-r from-brand-50 to-white"><h2 className="font-bold text-ink-900">Before activation</h2><p className="text-xs text-ink-500 mt-1">A few simple preparations help the engineer commission your connection on the first visit.</p><div className="grid sm:grid-cols-3 gap-3 mt-4">{["Keep the kitchen accessible", "Ensure appliances are ready", "Keep an adult present"].map((item) => <div key={item} className="rounded-xl bg-white border border-brand-100 p-3 text-sm font-semibold text-ink-700"><Check className="w-4 h-4 inline mr-2 text-brand-600" />{item}</div>)}</div></Card>
      </>}
    </div>
  );
}

function ActionRow({ done, label, action, onClick }: { done: boolean; label: string; action?: string; onClick: () => void }) {
  return <div className="flex items-center gap-3 rounded-xl bg-ink-50 px-3 py-3"><span className={`h-6 w-6 rounded-full grid place-items-center shrink-0 ${done ? "bg-brand-500 text-white" : "bg-white border border-ink-200 text-ink-400"}`}>{done ? <Check className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}</span><span className="text-sm font-medium text-ink-700">{label}</span>{action && <button onClick={onClick} className="ml-auto text-xs font-bold text-brand-700 hover:underline">{action}<ArrowRight className="inline w-3 h-3 ml-1" /></button>}</div>;
}

function SummaryLine({ label, value, warn = false }: { label: string; value: string; warn?: boolean }) {
  return <div className="flex items-center justify-between gap-3"><span className="text-ink-500">{label}</span><span className={`text-right font-bold ${warn ? "text-amber-700" : "text-ink-800"}`}>{value}</span></div>;
}

function ConfidenceFactor({ label }: { label: string }) {
  return <div className="flex items-center gap-1.5 rounded-lg bg-brand-50 px-2 py-1.5"><Check className="h-3 w-3 shrink-0 text-brand-600" />{label}</div>;
}

function ReadinessRow({ label, score, warning = false }: { label: string; score: string; warning?: boolean }) {
  return <div className="flex items-center justify-between rounded-lg bg-ink-50 px-3 py-2 text-xs"><span className="text-ink-600">{label}</span><span className={`font-bold ${warning ? "text-amber-700" : "text-brand-700"}`}>{score}</span></div>;
}

function ConfidenceStatus({ label, good }: { label: string; good?: boolean }) {
  return <div className={`rounded-lg px-2 py-2 text-center ${good ? "bg-brand-50 text-brand-700" : "bg-amber-50 text-amber-700"}`}><span className="block font-bold">{good ? "✓" : "⚠"}</span><span className="mt-0.5 block leading-tight">{label}</span></div>;
}

function PromiseMetric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-brand-100 bg-white p-3"><p className="text-[11px] text-ink-500">{label}</p><p className="mt-1 text-sm font-bold text-ink-800">{value}</p></div>;
}
