"use client";

import { useEffect, useRef, useState } from "react";
import EmergencyChat from "@/components/EmergencyChat";
import { Badge, Card, Kpi } from "@/components/ui";
import { healthProfileStorageKey, normalizeHealthProfile, type HealthProfile } from "@/lib/healthScore";
import { writeLiveIncident } from "@/lib/ops";
import {
  Ambulance, BellRing, Camera, Check, CheckCircle2, ChevronRight, CircleAlert, ClipboardCheck, Download,
  Flame, Gauge, HeartHandshake, House, Languages, LocateFixed, LogOut, MapPin, PhoneCall, Play,
  ShieldAlert, ShieldCheck, Siren, Sparkles, Users, Video, Volume2, WifiOff, Wind, XCircle,
} from "lucide-react";

type EmergencyType = "smell" | "fire" | "hissing" | "dizzy" | "unsure";

const emergencyTypes: Array<{ id: EmergencyType; label: string; detail: string; icon: typeof Flame; tone: "red" | "amber" | "sky"; risk: "Critical" | "High" }> = [
  { id: "smell", label: "Strong gas smell", detail: "No flame visible", icon: Wind, tone: "red", risk: "High" },
  { id: "fire", label: "Fire visible", detail: "Flame or burning", icon: Flame, tone: "red", risk: "Critical" },
  { id: "hissing", label: "Hissing near pipe", detail: "Sound from pipe or meter", icon: Volume2, tone: "amber", risk: "High" },
  { id: "dizzy", label: "Feeling dizzy", detail: "Someone feels unwell", icon: Ambulance, tone: "red", risk: "Critical" },
  { id: "unsure", label: "Not sure", detail: "Get guided help", icon: CircleAlert, tone: "sky", risk: "High" },
];

const visualSteps = [
  { label: "Leave the area", detail: "Move everyone outside", icon: LogOut },
  { label: "Open windows", detail: "Only as you leave", icon: Wind },
  { label: "Close valve", detail: "Only if safe to reach", icon: Gauge },
  { label: "Meet outside", detail: "Go to the gate entrance", icon: Users },
  { label: "Wait for crew", detail: "Do not re-enter", icon: ShieldCheck },
];

const crewFlow = ["Call received", "Crew assigned", "Crew en route", "Reaching site", "Inspection", "Safe clearance"];
const contacts = ["Priya Mehta · Spouse", "Mahesh Mehta · Father", "Aarav Shah · Neighbour"];
const storageKey = "suraksha:gascare:GJ-559210";

function toneClass(tone: "red" | "amber" | "sky") {
  return tone === "red" ? "border-red-200 bg-red-50 text-red-800" : tone === "amber" ? "border-amber-200 bg-amber-50 text-amber-800" : "border-sky-200 bg-sky-50 text-sky-800";
}

function responsePath(type: EmergencyType) {
  if (type === "fire") return "Fire visible: evacuate immediately, do not use water on a gas fire, and call Fire 101 from outside.";
  if (type === "dizzy") return "Possible gas exposure: move everyone into open air now and call Ambulance 108 if anyone is unwell.";
  if (type === "hissing") return "Treat a hissing pipe as a confirmed leak: avoid sparks, ventilate while leaving, and call 1906 outdoors.";
  if (type === "unsure") return "Stay outside and follow the visual steps. GasGuard will keep the response crew informed as you confirm details.";
  return "Gas smell with no flame: avoid every switch and flame, ventilate as you leave, then call 1906 from outside.";
}

export default function GasCarePage() {
  const [profile, setProfile] = useState<HealthProfile>({ emergencyContactVerified: false, safetySurveyComplete: true, preventiveInspectionBooked: false });
  const [loaded, setLoaded] = useState(false);
  const [active, setActive] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [silentMode, setSilentMode] = useState(false);
  const [type, setType] = useState<EmergencyType>("smell");
  const [checked, setChecked] = useState<boolean[]>([false, false, false, false, false]);
  const [crewStage, setCrewStage] = useState(0);
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const [people, setPeople] = useState("2–4");
  const [injured, setInjured] = useState(false);
  const [childrenPresent, setChildrenPresent] = useState(false);
  const [seniorsPresent, setSeniorsPresent] = useState(false);
  const [notified, setNotified] = useState(false);
  const [drillOpen, setDrillOpen] = useState(false);
  const [drillStep, setDrillStep] = useState(0);
  const [drillComplete, setDrillComplete] = useState(false);
  const [valveKnown, setValveKnown] = useState(true);
  const [numberSaved, setNumberSaved] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(t);
  }, [notice]);
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [operatorConnected, setOperatorConnected] = useState(false);
  const [valveGuide, setValveGuide] = useState<"yes" | "no" | "unsure" | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(storageKey) ?? "null") as { valveKnown?: boolean; numberSaved?: boolean; drillComplete?: boolean } | null;
      const health = normalizeHealthProfile(JSON.parse(window.localStorage.getItem(healthProfileStorageKey) ?? "null"));
      setProfile(health);
      if (saved) {
        setValveKnown(saved.valveKnown !== false);
        setNumberSaved(saved.numberSaved !== false);
        setDrillComplete(Boolean(saved.drillComplete));
      }
    } catch { /* A usable safety flow remains available if browser storage is blocked. */ }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try { window.localStorage.setItem(storageKey, JSON.stringify({ valveKnown, numberSaved, drillComplete })); } catch { /* Session state remains usable. */ }
  }, [drillComplete, loaded, numberSaved, valveKnown]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const selectedType = emergencyTypes.find((item) => item.id === type) ?? emergencyTypes[0];
  const readinessItems = [
    { label: "Emergency contact", detail: profile.emergencyContactVerified ? "Verified" : "Verification needed", done: profile.emergencyContactVerified },
    { label: "Safety training", detail: profile.safetySurveyComplete ? "Completed" : "Start emergency drill", done: profile.safetySurveyComplete },
    { label: "Last inspection", detail: "Jan 2026 · valid", done: true },
    { label: "GasGuard registered", detail: "Emergency profile active", done: true },
  ];
  const readiness = Math.round((readinessItems.filter((item) => item.done).length / readinessItems.length) * 100);
  const riskReasons = [selectedType.label, "Indoor location", injured ? "Injury reported" : `${people} people inside`];
  const rootCause = type === "fire" ? "Gas ignition near the appliance" : type === "hissing" ? "Loose regulator fitting" : type === "dizzy" ? "Gas exposure in an enclosed room" : "Loose regulator fitting";
  const specificResponse = responsePath(type);

  function persistProfile(update: Partial<HealthProfile>) {
    const next = { ...profile, ...update };
    setProfile(next);
    try { window.localStorage.setItem(healthProfileStorageKey, JSON.stringify(next)); } catch { /* The current session remains usable. */ }
  }

  function startEmergency() {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const unlock = new SpeechSynthesisUtterance("");
      unlock.volume = 0;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(unlock);
    }
    setActive(true);
    setConfirmOpen(false);
    writeLiveIncident({ id: "GG-2026-00125", source: "customer-app", area: "Maninagar · Sec 12", address: "A-402 Shreeji Residency", type: selectedType.label, risk: selectedType.risk, startedAt: Date.now(), status: "active" });
    setChecked([false, false, false, false, false]);
    setCrewStage(0);
    setLocationConfirmed(false);
    setNotified(false);
    setPhotoName(null);
    setOperatorConnected(false);
    setValveGuide(null);
    timers.current.forEach(clearTimeout);
    crewFlow.slice(1).forEach((_, index) => timers.current.push(setTimeout(() => setCrewStage(index + 1), 2200 + index * 3000)));
  }

  function reset() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    writeLiveIncident({ id: "GG-2026-00125", source: "customer-app", area: "Maninagar · Sec 12", address: "A-402 Shreeji Residency", type: selectedType.label, risk: selectedType.risk, startedAt: Date.now(), status: "resolved" });
    setActive(false);
    setConfirmOpen(false);
    setSilentMode(false);
    setChecked([false, false, false, false, false]);
    setCrewStage(0);
  }

  function completeDrill() {
    setDrillComplete(true);
    setDrillOpen(false);
    persistProfile({ safetySurveyComplete: true });
    setNotice("Emergency drill completed. 50 TrustPoints added to your safety profile.");
  }

  function notifyContacts() {
    setNotified(true);
    setNotice("Emergency update sent to Priya, Mahesh, and Aarav.");
  }

  function downloadIncidentReport() {
    const body = ["Torrent Gas - GasGuard Incident Report", "", "Incident ID: GG-2026-00125", "Time reported: 17:23", "Crew arrival: 17:31", `Emergency type: ${selectedType.label}`, "Location: A-402 Shreeji Residency", `Root cause: ${rootCause}`, "Action taken: Regulator and supply line inspected; safety clearance issued.", "Safety status: Safe", "", "For emergencies call 1906 from a safe outdoor location."].join("\n");
    const url = URL.createObjectURL(new Blob([body], { type: "text/plain" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "GasGuard_GG-2026-00125_incident-report.txt";
    link.click();
    URL.revokeObjectURL(url);
  }

  function classifyPhoto(file: File | undefined) {
    if (!file) return;
    setPhotoName(file.name);
    setNotice("Photo received. Possible regulator or pipe-area concern detected with low confidence. Engineer inspection is still required.");
  }

  function requestOperator() {
    setOperatorConnected(true);
    setNotice("Safety operator request sent. Continue following the tap-only safety steps while we connect you.");
  }

  return <div className="space-y-6 reveal">
    {notice && <div className="fixed right-4 top-4 z-50 flex max-w-sm items-start gap-3 rounded-2xl bg-brand-600 px-5 py-3 text-white shadow-xl"><CheckCircle2 className="h-5 w-5 shrink-0" /><span className="flex-1 text-sm font-semibold">{notice}</span><button onClick={() => setNotice(null)} aria-label="Dismiss message"><XCircle className="h-4 w-4" /></button></div>}
    {confirmOpen && <div className="fixed inset-0 z-50 grid place-items-center bg-ink-950/50 p-4"><Card className="w-full max-w-md p-6"><div className="flex items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-red-100 text-red-700"><Siren className="h-5 w-5" /></span><div><h2 className="font-bold text-ink-900">Start emergency session?</h2><p className="mt-1 text-sm text-ink-600">You selected <strong>{selectedType.label}</strong>. GasGuard will begin safety guidance, capture your location, and alert a response crew.</p></div></div><div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900"><CircleAlert className="mr-1 inline h-3.5 w-3.5" /> If this was an accidental tap, go back. Nothing has been dispatched yet.</div><div className="mt-5 flex gap-3"><button onClick={() => setConfirmOpen(false)} className="flex-1 rounded-xl border border-ink-200 py-2.5 text-sm font-semibold text-ink-600">Go back</button><button onClick={startEmergency} className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white">Start session</button></div></Card></div>}
    {!active ? <>
      <header className="relative overflow-hidden rounded-3xl border border-red-100 bg-gradient-to-br from-ink-950 via-ink-900 to-red-950 p-6 text-white shadow-soft sm:p-8">
        <div className="absolute -right-12 -top-10 h-56 w-56 rounded-full bg-red-500/20 blur-3xl" />
        <div className="relative grid gap-6 lg:grid-cols-[1.25fr_.75fr] lg:items-center">
          <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-300">GasGuard · household emergency protection</p><h1 className="mt-2 text-2xl font-extrabold sm:text-3xl">Be ready before an emergency.</h1><p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-300">Build your household safety plan, practise a guided drill, and get type-specific emergency help when it matters.</p></div>
          <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur"><div className="flex items-center justify-between"><span className="text-sm font-semibold">Emergency readiness</span><span className="text-2xl font-extrabold text-brand-300">{readiness}%</span></div><div className="mt-3 h-2 rounded-full bg-white/15"><div className="h-full rounded-full bg-brand-400" style={{ width: `${readiness}%` }} /></div><p className="mt-3 text-xs text-ink-300">{profile.emergencyContactVerified ? "Your household profile is ready for emergency outreach." : "Verify an emergency contact to complete your plan."}</p><p className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-brand-200"><WifiOff className="h-3.5 w-3.5" /> Offline safety guide saved on this device</p></div>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4"><Kpi label="Readiness score" value={`${readiness}%`} sub={readiness === 100 ? "Household ready" : "1 action remaining"} icon={<ShieldCheck className="h-4 w-4" />} /><Kpi label="Calls assisted" value="1,248" sub="This quarter" icon={<PhoneCall className="h-4 w-4 text-red-600" />} accent="text-red-600" /><Kpi label="Response reduced" value="4.6 min" sub="Average guided response" icon={<Sparkles className="h-4 w-4" />} /><Kpi label="Guidance completed" value="92%" sub="Safety flows completed" icon={<ClipboardCheck className="h-4 w-4" />} /></div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-bold text-ink-900">Are you experiencing?</h2><p className="mt-1 text-xs text-ink-500">Choose the closest situation so GasGuard can guide and prioritize the right response.</p></div><Badge tone={selectedType.risk === "Critical" ? "red" : "amber"}>{selectedType.risk} risk route</Badge></div><div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{emergencyTypes.map((item) => <button key={item.id} onClick={() => setType(item.id)} className={`rounded-2xl border p-4 text-left transition ${type === item.id ? toneClass(item.tone) : "border-ink-100 bg-white hover:border-red-200 hover:bg-red-50/40"}`}><item.icon className="h-5 w-5" /><p className="mt-3 text-sm font-bold">{item.label}</p><p className="mt-1 text-xs opacity-75">{item.detail}</p></button>)}</div><button onClick={() => setConfirmOpen(true)} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-500/20 transition hover:bg-red-700 active:scale-[.99]"><Siren className="h-5 w-5" /> Start emergency session</button><div className="mt-4 grid grid-cols-2 gap-2 text-center sm:grid-cols-5">{["AI guide starts", "Safety steps begin", "Location captured", "Crew dispatched", "Track live"].map((item, index) => <div key={item} className="rounded-lg bg-ink-50 px-2 py-2 text-[10px] font-semibold text-ink-600"><span className="mr-1 text-brand-700">{index + 1}.</span>{item}</div>)}</div><a href="tel:1906" className="mt-3 flex justify-center gap-2 text-xs font-bold text-red-700 hover:underline"><PhoneCall className="h-4 w-4" /> Call gas emergency helpline · 1906</a></Card>
        <Card className="border-red-100 bg-red-50 p-5"><div className="flex items-center gap-2 text-red-900"><ShieldAlert className="h-5 w-5" /><h2 className="font-bold">Do not do this</h2></div><p className="mt-2 text-xs text-red-800">If you smell gas, keep all possible sparks away.</p><ul className="mt-4 space-y-3 text-sm text-red-900">{["Use a mobile phone indoors", "Switch lights or fans on or off", "Operate any appliance", "Start a vehicle nearby", "Use a lift or elevator"].map((item) => <li key={item} className="flex gap-2"><XCircle className="mt-0.5 h-4 w-4 shrink-0" />{item}</li>)}</ul></Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5"><div className="flex items-center justify-between"><div><h2 className="font-bold text-ink-900">Household readiness</h2><p className="mt-1 text-xs text-ink-500">Your personal emergency safety passport.</p></div><span className="text-xl font-extrabold text-brand-700">{readiness}%</span></div><div className="mt-5 space-y-3">{readinessItems.map((item) => <div key={item.label} className="flex items-center gap-3"><span className={`grid h-8 w-8 place-items-center rounded-xl ${item.done ? "bg-brand-100 text-brand-700" : "bg-amber-100 text-amber-700"}`}>{item.done ? <Check className="h-4 w-4" /> : <CircleAlert className="h-4 w-4" />}</span><div className="min-w-0"><p className="text-sm font-semibold text-ink-800">{item.label}</p><p className="text-[11px] text-ink-500">{item.detail}</p></div>{item.label === "Emergency contact" && !item.done && <button onClick={() => persistProfile({ emergencyContactVerified: true })} className="ml-auto text-xs font-bold text-brand-700">Verify</button>}</div>)}</div></Card>
        <Card className="p-5"><h2 className="font-bold text-ink-900">Emergency equipment</h2><p className="mt-1 text-xs text-ink-500">Confirm these before you need them.</p><div className="mt-5 space-y-3">{[{ label: "Gas isolation valve known", done: valveKnown, toggle: () => setValveKnown((value) => !value) }, { label: "Emergency number saved", done: numberSaved, toggle: () => setNumberSaved((value) => !value) }, { label: "Contact verified", done: profile.emergencyContactVerified, toggle: () => persistProfile({ emergencyContactVerified: !profile.emergencyContactVerified }) }, { label: "Inspection valid until Jan 2027", done: true, toggle: undefined }].map((item) => <button key={item.label} onClick={item.toggle} disabled={!item.toggle} className="flex w-full items-center gap-3 text-left disabled:cursor-default"><span className={`grid h-8 w-8 place-items-center rounded-xl ${item.done ? "bg-brand-100 text-brand-700" : "bg-amber-100 text-amber-700"}`}>{item.done ? <Check className="h-4 w-4" /> : <CircleAlert className="h-4 w-4" />}</span><span className="text-sm font-medium text-ink-700">{item.label}</span></button>)}</div></Card>
        <Card className="p-5"><div className="flex items-center gap-2"><HeartHandshake className="h-5 w-5 text-sky-600" /><h2 className="font-bold text-ink-900">Emergency contacts</h2></div><p className="mt-1 text-xs text-ink-500">GasGuard can notify your household in one tap.</p><div className="mt-4 space-y-2">{contacts.map((contact) => <div key={contact} className="rounded-xl bg-ink-50 px-3 py-2 text-xs font-semibold text-ink-700"><Check className="mr-1 inline h-3.5 w-3.5 text-brand-600" />{contact}</div>)}</div><button onClick={() => setNotice("Your emergency contact card is ready. GasGuard will notify these contacts after a report.")} className="mt-4 w-full rounded-xl border border-sky-200 py-2.5 text-xs font-bold text-sky-700 hover:bg-sky-50">Review household card</button></Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3"><Card className="p-5 lg:col-span-2"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-bold text-ink-900">Practice emergency drill</h2><p className="mt-1 text-xs text-ink-500">A guided five-step rehearsal. No incident is reported and no crew is dispatched.</p></div>{drillComplete && <Badge tone="brand">Completed · +50 TrustPoints</Badge>}</div>{drillOpen ? <div className="mt-5 rounded-2xl border border-brand-200 bg-brand-50 p-4"><p className="text-xs font-bold text-brand-700">Step {drillStep + 1} of {visualSteps.length}</p><div className="mt-3 flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-white text-brand-700"><Play className="h-5 w-5" /></span><div><p className="font-bold text-ink-900">{visualSteps[drillStep].label}</p><p className="text-xs text-ink-600">{visualSteps[drillStep].detail}</p></div></div><button onClick={() => drillStep === visualSteps.length - 1 ? completeDrill() : setDrillStep((step) => step + 1)} className="mt-4 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white">{drillStep === visualSteps.length - 1 ? "Complete drill" : "Next step"} <ChevronRight className="inline h-3.5 w-3.5" /></button></div> : <button onClick={() => { setDrillStep(0); setDrillOpen(true); }} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-ink-900 px-4 py-2.5 text-xs font-bold text-white"><Play className="h-4 w-4" /> Start practice drill</button>}</Card><Card className="p-5"><h2 className="font-bold text-ink-900">Past emergencies</h2><div className="mt-4 rounded-xl border border-ink-100 p-3"><p className="text-sm font-bold text-ink-800">Gas smell reported</p><p className="mt-1 text-xs text-ink-500">15 Jan 2026 · Resolved in 11 min</p><p className="mt-2 text-xs font-semibold text-brand-700">Cause: Loose connection</p></div><button onClick={downloadIncidentReport} className="mt-3 text-xs font-bold text-sky-700 hover:underline"><Download className="mr-1 inline h-3.5 w-3.5" /> Download previous report</button></Card></div>
    </> : <>
      <div className="flex items-center justify-between gap-3 rounded-2xl bg-ink-950 px-4 py-3 text-white shadow-soft"><div className="flex min-w-0 items-center gap-3"><span className="relative flex h-2.5 w-2.5"><span className="absolute h-2.5 w-2.5 animate-ping rounded-full bg-red-500 opacity-75" /><span className="relative h-2.5 w-2.5 rounded-full bg-red-500" /></span><div className="min-w-0"><p className="truncate text-sm font-semibold">GasGuard emergency · GG-2026-00125</p><p className="truncate text-[11px] text-ink-400">Stay calm. Help is on the way. Leave the area safely first.</p></div></div><div className="flex shrink-0 gap-2"><button onClick={() => setSilentMode((value) => !value)} className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${silentMode ? "border-brand-400 bg-brand-500 text-white" : "border-white/15 text-ink-300 hover:text-white"}`}>{silentMode ? "Tap-only mode" : "Silent mode"}</button><button onClick={reset} className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-ink-300 hover:text-white">End</button></div></div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4"><Kpi label="Risk level" value={selectedType.risk} sub={selectedType.label} accent="text-red-600" icon={<ShieldAlert className="h-4 w-4 text-red-600" />} /><Kpi label="Location" value={locationConfirmed ? "Confirmed" : "Verify"} sub="A-402 Shreeji Residency" icon={<MapPin className="h-4 w-4 text-sky-600" />} /><Kpi label="Crew ETA" value={crewStage >= 4 ? "On site" : crewStage >= 2 ? "6 min" : "Locating"} sub={crewStage >= 4 ? "Inspection underway" : crewStage >= 2 ? "Crew Unit GA-4" : "Nearest crew"} icon={<Siren className="h-4 w-4 text-red-600" />} accent="text-red-600" /><Kpi label="Household" value={people} sub={injured ? "Injury reported" : "No injury reported"} icon={<Users className="h-4 w-4" />} /></div>

      <div className="grid gap-6 lg:grid-cols-3"><Card className={`p-5 ${selectedType.risk === "Critical" ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"}`}><div className="flex items-center gap-2"><ShieldAlert className="h-5 w-5" /><h2 className="font-bold">{selectedType.risk} risk assessment</h2></div><p className="mt-2 text-xs">Your crew has been prioritized based on these conditions.</p><div className="mt-4 space-y-2">{riskReasons.map((reason) => <div key={reason} className="text-xs font-semibold"><Check className="mr-1 inline h-3.5 w-3.5" />{reason}</div>)}</div><p className="mt-4 rounded-xl bg-white/70 p-3 text-xs font-semibold leading-relaxed">{specificResponse}</p></Card><Card className="p-5"><div className="flex items-center gap-2"><LocateFixed className="h-5 w-5 text-sky-600" /><h2 className="font-bold text-ink-900">Share your location</h2></div><p className="mt-2 text-sm font-semibold text-ink-800">A-402, Shreeji Residency</p><p className="mt-1 text-xs text-ink-500">Maninagar · Main gate access</p><button onClick={() => setLocationConfirmed(true)} className={`mt-4 w-full rounded-xl py-2.5 text-xs font-bold ${locationConfirmed ? "bg-brand-100 text-brand-700" : "bg-sky-600 text-white"}`}>{locationConfirmed ? <><Check className="mr-1 inline h-3.5 w-3.5" /> Location confirmed</> : "Confirm location"}</button><label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-sky-200 py-2.5 text-xs font-bold text-sky-700 hover:bg-sky-50"><Camera className="h-4 w-4" /> {photoName ? "Photo sent for triage" : "Add photo for triage"}<input type="file" accept="image/*" className="hidden" onChange={(event) => classifyPhoto(event.target.files?.[0])} /></label></Card><Card className="p-5"><h2 className="font-bold text-ink-900">Household status</h2><div className="mt-4 flex gap-2">{["1", "2–4", "5+"].map((value) => <button key={value} onClick={() => setPeople(value)} className={`flex-1 rounded-lg border py-2 text-xs font-bold ${people === value ? "border-sky-500 bg-sky-50 text-sky-700" : "border-ink-100 text-ink-600"}`}>{value}</button>)}</div><div className="mt-3 grid grid-cols-3 gap-2 text-[11px] font-semibold">{[["Injured", injured, setInjured], ["Children", childrenPresent, setChildrenPresent], ["Seniors", seniorsPresent, setSeniorsPresent]].map(([label, activeState, setter]) => <button key={label as string} onClick={() => (setter as (value: boolean) => void)(!(activeState as boolean))} className={`rounded-lg border px-2 py-2 ${(activeState as boolean) ? "border-red-300 bg-red-50 text-red-700" : "border-ink-100 text-ink-600"}`}>{(activeState as boolean) && <Check className="mr-1 inline h-3 w-3" />}{label as string}</button>)}</div></Card></div>

      <div className="grid gap-6 lg:grid-cols-2">{silentMode ? <Card className="border-brand-200 bg-brand-50/60 p-5"><div className="flex items-center gap-2"><Volume2 className="h-5 w-5 text-brand-700" /><h2 className="font-bold text-ink-900">Silent emergency · tap-only guidance</h2></div><p className="mt-2 text-xs text-ink-600">No speaking required. Tap the facts you can safely confirm.</p><div className="mt-5 grid gap-2">{[["Yes, I smell gas", "smell"], ["No visible fire", "unsure"], ["People are inside", "people"], ["Need ambulance", "ambulance"]].map(([label, action]) => <button key={label} onClick={() => { if (action === "smell") setType("smell"); if (action === "ambulance") setInjured(true); if (action === "people") setPeople("2–4"); setNotice(`${label} recorded for the safety crew.`); }} className="rounded-xl border border-brand-200 bg-white px-4 py-3 text-left text-sm font-bold text-brand-800"><Check className="mr-2 inline h-4 w-4" />{label}</button>)}</div><button onClick={() => setSilentMode(false)} className="mt-4 text-xs font-bold text-brand-700">Return to voice assistant</button></Card> : <EmergencyChat />}<div className="space-y-5"><Card className="p-5"><div className="flex items-center justify-between"><div><h2 className="font-bold text-ink-900">Leave safely, step by step</h2><p className="mt-1 text-xs text-ink-500">Tap each step as your household completes it.</p></div><span className="text-xs font-bold text-brand-700">{checked.filter(Boolean).length}/5 done</span></div><div className="mt-4 space-y-2">{visualSteps.map((step, index) => <button key={step.label} onClick={() => setChecked((current) => current.map((item, itemIndex) => itemIndex === index ? !item : item))} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left ${checked[index] ? "border-brand-200 bg-brand-50" : "border-ink-100 bg-white"}`}><span className={`grid h-8 w-8 place-items-center rounded-lg ${checked[index] ? "bg-brand-500 text-white" : "bg-ink-100 text-ink-500"}`}>{checked[index] ? <Check className="h-4 w-4" /> : <step.icon className="h-4 w-4" />}</span><span><span className="block text-sm font-bold text-ink-800">Step {index + 1} · {step.label}</span><span className="block text-[11px] text-ink-500">{step.detail}{index === 0 && (childrenPresent || seniorsPresent) ? " · Help children and seniors first" : ""}</span></span></button>)}</div><div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3 text-xs font-semibold text-red-800"><XCircle className="mr-1 inline h-3.5 w-3.5" /> Do not use switches, mobile phones indoors, appliances, lifts, or vehicles nearby.</div></Card>
        <Card className="border-sky-100 bg-sky-50/60 p-5"><div className="flex items-center gap-2"><House className="h-5 w-5 text-sky-700" /><h2 className="font-bold text-ink-900">Safe meeting point</h2></div><p className="mt-3 text-lg font-extrabold text-sky-800">Gate entrance</p><p className="mt-1 text-xs text-ink-600">Move everyone 50 metres away from the building and wait together in open air.</p></Card><Card className="p-5"><div className="flex items-center gap-2"><Gauge className="h-5 w-5 text-amber-600" /><h2 className="font-bold text-ink-900">Isolation valve guide</h2></div><p className="mt-2 text-xs text-ink-500">Can you see the isolation valve near the meter or kitchen entry?</p><div className="mt-3 grid grid-cols-3 gap-2">{(["yes", "no", "unsure"] as const).map((choice) => <button key={choice} onClick={() => setValveGuide(choice)} className={`rounded-lg border py-2 text-xs font-bold capitalize ${valveGuide === choice ? "border-amber-400 bg-amber-50 text-amber-800" : "border-ink-100 text-ink-600"}`}>{choice === "unsure" ? "Not sure" : choice}</button>)}</div>{valveGuide === "yes" && <div className="mt-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-900"><Gauge className="mr-1 inline h-3.5 w-3.5" /> If it is safe and on your way out, turn the handle clockwise until it stops. Never go back inside to reach it.</div>}{valveGuide === "no" && <p className="mt-3 text-xs font-semibold text-sky-700">Do not search for it. Leave the area and wait for the crew.</p>}{valveGuide === "unsure" && <p className="mt-3 text-xs font-semibold text-sky-700">Skip the valve. Evacuate safely and let the crew isolate the supply.</p>}</Card></div></div>

      <Card className="p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="font-bold text-ink-900">Crew journey & incident timeline</h2><p className="mt-1 text-xs text-ink-500">GG-2026-00125 · Updates are shared with your household.</p></div>{crewStage >= 2 && <div className="rounded-xl bg-brand-50 px-3 py-2 text-right"><p className="text-[11px] text-brand-700">Crew Unit GA-4</p><p className="text-lg font-extrabold text-brand-700">{crewStage >= 4 ? "On site" : "6 min ETA"}</p></div>}</div><div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-6">{crewFlow.map((stage, index) => <div key={stage} className="text-center"><span className={`mx-auto grid h-8 w-8 place-items-center rounded-full text-xs font-bold ${index <= crewStage ? "bg-brand-500 text-white" : "bg-ink-100 text-ink-400"}`}>{index < crewStage ? <Check className="h-4 w-4" /> : index + 1}</span><p className={`mt-2 text-[10px] leading-tight ${index <= crewStage ? "font-semibold text-ink-700" : "text-ink-400"}`}>{stage}</p></div>)}</div><div className="mt-5 grid gap-3 sm:grid-cols-3"><button onClick={notifyContacts} className={`rounded-xl border px-4 py-3 text-left text-sm font-bold ${notified ? "border-brand-200 bg-brand-50 text-brand-700" : "border-sky-200 bg-white text-sky-700"}`}>{notified ? <><Check className="mr-1 inline h-4 w-4" /> Emergency contacts notified</> : <><BellRing className="mr-1 inline h-4 w-4" /> Notify emergency contacts</>}<span className="mt-1 block text-[11px] font-normal text-ink-500">Priya, Mahesh, and Aarav will receive your safety status.</span></button><button onClick={requestOperator} className={`rounded-xl border px-4 py-3 text-left text-sm font-bold ${operatorConnected ? "border-brand-200 bg-brand-50 text-brand-700" : "border-violet-200 bg-white text-violet-700"}`}>{operatorConnected ? <><Check className="mr-1 inline h-4 w-4" /> Operator requested</> : <><Video className="mr-1 inline h-4 w-4" /> Need live help?</>}<span className="mt-1 block text-[11px] font-normal text-ink-500">Connect to a safety operator by video when it is safe to do so.</span></button><div className="rounded-xl border border-ink-100 bg-ink-50 p-3"><p className="text-xs font-bold text-ink-800">Auto incident record</p><p className="mt-1 text-[11px] text-ink-500">Reported 17:23 · Crew assigned 17:24 · Arrived 17:31 · Resolution target 17:45</p></div></div></Card>

      {crewStage === crewFlow.length - 1 && <Card className="border-brand-200 bg-gradient-to-br from-brand-50 to-white p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><Badge tone="brand">Incident closed · Safe</Badge><h2 className="mt-3 font-bold text-ink-900">Post-incident learning</h2><p className="mt-2 text-sm text-ink-700"><strong>Root cause:</strong> {rootCause}</p><p className="mt-1 text-sm text-ink-700"><strong>Action taken:</strong> Regulator and supply line inspected; safety clearance issued.</p><p className="mt-1 text-sm text-ink-700"><strong>Prevention:</strong> Keep your annual inspection appointment and repeat the household drill.</p></div><button onClick={downloadIncidentReport} className="rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-xs font-bold text-brand-700"><Download className="mr-1 inline h-4 w-4" /> Download report</button></div></Card>}
    </>}
  </div>;
}
