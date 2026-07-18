"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle, Bot, Check, CheckCircle2, Clock3, Flame, MessageCircle,
  Mic, Pause, Send, ThumbsDown, ThumbsUp, UserRound, UsersRound, Volume2,
} from "lucide-react";
import { Card, Kpi } from "@/components/ui";
import Typewriter from "@/components/Typewriter";

type Status = "Received" | "Under Review" | "Assigned" | "Action Taken" | "Closed" | "Implemented";
type Satisfaction = "yes" | "partial" | "no" | undefined;
type Feedback = { id: string; category: string; text: string; status: Status; submitted: string; owner: string; priority: "Low" | "Medium" | "High"; impact?: string; implementationReason?: string; released?: string; timeline: { label: string; date: string }[]; satisfaction?: Satisfaction; voiceNote?: boolean; voiceData?: string };

const storageKey = "suraksha:voice-feedback:GJ-559210";
const initialFeedback: Feedback[] = [
  { id: "VOC-903", category: "Billing transparency", text: "The WhyMyBill explanation helped me understand my seasonal bill increase.", status: "Implemented", submitted: "10 Jul 2026", owner: "Customer Experience", priority: "Low", impact: "WhyMyBill is now available to 8,000+ customers.", implementationReason: "35% of customers raised similar concerns. The Customer Experience Team approved the change.", released: "Released in July 2026", timeline: [{ label: "Submitted", date: "10 Jul" }, { label: "Reviewed", date: "11 Jul" }, { label: "Accepted", date: "12 Jul" }, { label: "Implemented", date: "15 Jul" }] },
  { id: "VOC-884", category: "Connection delay", text: "Site survey scheduling took longer than expected in Maninagar.", status: "Closed", submitted: "12 Jul 2026", owner: "Installation Team Ahmedabad", priority: "Medium", timeline: [{ label: "Submitted", date: "12 Jul" }, { label: "Assigned", date: "13 Jul" }, { label: "Reviewed", date: "14 Jul" }, { label: "Action Taken", date: "15 Jul" }, { label: "Closed", date: "16 Jul" }] },
];

const community = [
  { id: "whatsapp", title: "Enable WhatsApp bill alerts", count: 328, down: 12, status: "Under evaluation" },
  { id: "reschedule", title: "Online appointment rescheduling", count: 243, down: 6, status: "Planned Q3 2026" },
  { id: "language", title: "More Gujarati voice support", count: 176, down: 4, status: "In development" },
];

const safetyWords = /gas smell|leak|fire|pressure issue|hissing|smell gas/i;

export default function VoiceOfCustomer() {
  const [tab, setTab] = useState<"mine" | "community" | "share">("mine");
  const [feedback, setFeedback] = useState<Feedback[]>(initialFeedback);
  const [text, setText] = useState("");
  const [category, setCategory] = useState("General support");
  const [submitted, setSubmitted] = useState<Feedback | null>(null);
  const [votes, setVotes] = useState<Record<string, boolean>>({});
  const [downVotes, setDownVotes] = useState<Record<string, boolean>>({});
  const [recording, setRecording] = useState(false);
  const [voiceUrl, setVoiceUrl] = useState<string | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const recordingTimer = useRef<number | null>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(storageKey) ?? "null");
      if (Array.isArray(saved?.feedback)) setFeedback(saved.feedback);
      if (saved?.votes && typeof saved.votes === "object") setVotes(saved.votes);
      if (saved?.downVotes && typeof saved.downVotes === "object") setDownVotes(saved.downVotes);
    } catch { /* Fresh profile uses the seeded feedback journey. */ }
  }, []);

  useEffect(() => {
    try { window.localStorage.setItem(storageKey, JSON.stringify({ feedback, votes, downVotes })); } catch { /* session remains usable without storage */ }
  }, [downVotes, feedback, votes]);

  const mine = feedback.filter((item) => item.id.startsWith("VOC-"));
  const implemented = mine.filter((item) => item.status === "Implemented").length;
  const underReview = mine.filter((item) => ["Received", "Under Review", "Assigned"].includes(item.status)).length;
  const urgent = safetyWords.test(text);
  const detectedCategory = urgent ? "Safety concern" : /bill|charge|tariff|payment/i.test(text) ? "Billing transparency" : /delay|installation|survey|connection/i.test(text) ? "Connection delay" : category;
  const detectedConfidence = urgent ? 98 : text.trim() ? 92 : 0;
  const detectedPriority = urgent ? "High" : /delay|complaint/i.test(text) ? "Medium" : "Low";
  const expectedResponse = urgent ? "Immediate safety escalation" : detectedPriority === "Medium" ? "24–48 hours" : "2 business days";

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!text.trim() && !voiceUrl) return;
    const isSafety = safetyWords.test(text);
    const item: Feedback = {
      id: `VOC-${Math.floor(1000 + Math.random() * 8999)}`,
      category: detectedCategory,
      text: text.trim() || "Voice feedback submitted",
      status: isSafety ? "Assigned" : "Received",
      submitted: "Today",
      owner: isSafety ? "GasGuard Safety Team" : category === "Connection delay" ? "Installation Team Ahmedabad" : "Customer Experience",
      priority: isSafety ? "High" : detectedPriority,
      voiceNote: Boolean(voiceUrl), voiceData: voiceUrl ?? undefined,
      timeline: isSafety ? [{ label: "Received", date: "Now" }, { label: "Safety escalation", date: "Now" }, { label: "Assigned", date: "Now" }] : [{ label: "Received", date: "Now" }],
    };
    setFeedback((current) => [item, ...current]);
    setSubmitted(item);
    setText("");
    setVoiceUrl(null);
    setTab("mine");
  }

  async function toggleRecording() {
    if (recording) {
      recorder.current?.stop();
      return;
    }
    setVoiceError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const media = new MediaRecorder(stream);
      chunks.current = [];
      media.ondataavailable = (event) => chunks.current.push(event.data);
      media.onstop = async () => {
        if (recordingTimer.current) window.clearTimeout(recordingTimer.current);
        const blob = new Blob(chunks.current, { type: media.mimeType || "audio/webm" });
        if (blob.size > 1_500_000) {
          setVoiceError("Voice notes must be under 1.5 MB. Please record a shorter message.");
        } else {
          setVoiceUrl(await toDataUrl(blob));
        }
        stream.getTracks().forEach((track) => track.stop());
        setRecording(false);
      };
      recorder.current = media;
      media.start();
      setRecording(true);
      recordingTimer.current = window.setTimeout(() => media.state === "recording" && media.stop(), 60_000);
    } catch {
      setVoiceError("Microphone access is needed to record a voice note.");
    }
  }

  function vote(id: string) {
    setVotes((current) => ({ ...current, [id]: !current[id] }));
    setDownVotes((current) => ({ ...current, [id]: false }));
  }

  function downVote(id: string) {
    setDownVotes((current) => ({ ...current, [id]: !current[id] }));
    setVotes((current) => ({ ...current, [id]: false }));
  }

  function rate(itemId: string, satisfaction: Satisfaction) {
    setFeedback((current) => current.map((item) => item.id === itemId
      ? satisfaction === "no"
        ? { ...item, satisfaction, status: "Under Review", owner: "Customer Resolution Team", timeline: [...item.timeline, { label: "Reopened after recheck", date: "Now" }] }
        : { ...item, satisfaction }
      : item));
  }

  function escalate(kind: "review" | "callback" | "grievance") {
    setNotice(kind === "review" ? "Review requested. The Customer Resolution Team will reassess your feedback." : kind === "callback" ? "Callback requested. A customer-care specialist will contact you within one business day." : "Grievance raised. You will receive a tracking update in this dashboard.");
  }

  return <div className="space-y-6 reveal">
    {notice && <div className="fixed right-4 top-4 z-50 flex max-w-sm items-start gap-3 rounded-2xl bg-ink-900 px-5 py-3 text-white shadow-xl"><CheckCircle2 className="h-5 w-5 shrink-0 text-brand-400" /><span className="flex-1 text-sm font-semibold">{notice}</span><button onClick={() => setNotice(null)} aria-label="Dismiss notification">×</button></div>}
    <header className="rounded-2xl bg-gradient-to-br from-ink-900 via-ink-900 to-brand-900 text-white p-6 sm:p-8 relative overflow-hidden shadow-soft"><div className="floaty absolute -right-10 -top-10 w-56 h-56 bg-brand-500/20 rounded-full blur-3xl" /><div className="relative max-w-3xl"><p className="text-brand-300 text-xs font-semibold uppercase tracking-widest">Voice of Customer</p><h1 className="text-2xl sm:text-3xl font-extrabold mt-1"><Typewriter speed={40} segments={[{ text: "Your voice matters. See what it changes." }]} /></h1><p className="text-ink-300 mt-2 text-sm">Track every feedback item from submission to action, add a voice note, and help choose the next service improvements.</p></div></header>

    <nav aria-label="Feedback sections" className="sticky top-3 z-10 flex gap-1 overflow-x-auto rounded-2xl border border-ink-100 bg-white/95 p-1.5 shadow-soft backdrop-blur">{([ ["mine", "My feedback"], ["community", "Community impact"], ["share", "Share feedback"] ] as const).map(([id, label]) => <button key={id} onClick={() => setTab(id)} className={`shrink-0 rounded-xl px-3.5 py-2 text-sm font-semibold transition ${tab === id ? "bg-ink-900 text-white" : "text-ink-500 hover:bg-ink-50 hover:text-ink-900"}`}>{label}</button>)}</nav>

    {tab === "mine" && <><div className="grid grid-cols-2 lg:grid-cols-4 gap-4"><Kpi label="My feedback impact" value={`${implemented} implemented`} sub="Ideas that improved service" icon={<CheckCircle2 className="w-4 h-4 text-brand-500" />} /><Kpi label="Under review" value={underReview} sub={underReview ? "Expected update within 24 hrs" : "No open issue"} icon={<Clock3 className="w-4 h-4" />} /><Kpi label="My open issues" value={underReview} sub={underReview ? "Team has been assigned" : "Nothing waiting on you"} icon={<MessageCircle className="w-4 h-4" />} /><Kpi label="Estimated reach" value="8,000+" sub="Customers helped by feedback" icon={<UsersRound className="w-4 h-4" />} /></div>
      <Card className="p-5 border-brand-100 bg-gradient-to-r from-brand-50 to-white"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-brand-700">Your voice summary</p><h2 className="mt-1 font-bold text-ink-900">Your feedback creates visible service improvements.</h2></div><span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-brand-700 shadow-sm">Impact reach · 8,000+ customers</span></div><div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3"><VoiceMetric label="Submitted" value={String(mine.length)} /><VoiceMetric label="Implemented" value={String(implemented)} good /><VoiceMetric label="In review" value={String(underReview)} /><VoiceMetric label="Rejected" value="0" /></div></Card>
      {submitted && <Card className={`p-5 border ${submitted.priority === "High" ? "border-red-200 bg-red-50" : "border-brand-200 bg-brand-50"}`}><div className="flex items-start gap-3"><Bot className={`w-5 h-5 mt-0.5 ${submitted.priority === "High" ? "text-red-600" : "text-brand-600"}`} /><div><h2 className="font-bold text-ink-900">What we understood</h2><p className="text-sm text-ink-700 mt-1">You reported: <strong>{submitted.text}</strong></p><div className="grid sm:grid-cols-3 gap-3 mt-3 text-xs"><span><strong>Category:</strong> {submitted.category}</span><span><strong>Priority:</strong> {submitted.priority}</span><span><strong>Assigned to:</strong> {submitted.owner}</span></div></div></div></Card>}
      <div className="space-y-4">{mine.map((item) => <FeedbackCard key={item.id} item={item} onRate={rate} onEscalate={escalate} />)}</div></>}

    {tab === "community" && <div className="grid lg:grid-cols-3 gap-5"><Card className="lg:col-span-2 p-5"><h2 className="font-bold text-ink-900 flex items-center gap-2"><UsersRound className="w-4 h-4 text-brand-600" /> Most discussed topics</h2><p className="mt-1 text-xs text-ink-500">Community themes and their current direction.</p><div className="mt-5 space-y-4">{[{ name: "Billing transparency", value: 34, trend: "↑" }, { name: "Connection delays", value: 28, trend: "↓" }, { name: "Safety awareness", value: 18, trend: "→" }, { name: "Appointment requests", value: 12, trend: "↑" }, { name: "Other", value: 8, trend: "→" }].map((topic) => <div key={topic.name}><div className="flex justify-between text-sm"><span className="font-medium text-ink-700">{topic.name}</span><span className="font-bold text-brand-700">{topic.value}% <span className="text-ink-400">{topic.trend}</span></span></div><div className="h-2 rounded-full bg-ink-100 overflow-hidden mt-1"><div className="h-full bg-brand-500 rounded-full" style={{ width: `${topic.value}%` }} /></div></div>)}</div></Card><Card className="p-5"><h2 className="font-bold text-ink-900 flex items-center gap-2"><ThumbsUp className="w-4 h-4 text-brand-600" /> Community suggestions</h2><div className="mt-4 space-y-3">{community.map((idea) => <div key={idea.id} className={`rounded-xl border p-3 transition ${votes[idea.id] ? "border-brand-300 bg-brand-50" : "border-ink-100"}`}><div className="font-semibold text-sm text-ink-800">{idea.title}</div><span className="mt-2 inline-block rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-bold text-ink-600">{idea.status}</span><div className="mt-3 flex gap-2"><button onClick={() => vote(idea.id)} className={`text-xs font-semibold ${votes[idea.id] ? "text-brand-700" : "text-ink-500"}`}><ThumbsUp className={`w-3.5 h-3.5 inline mr-1 ${votes[idea.id] ? "fill-brand-500 text-brand-500" : ""}`} />{idea.count + (votes[idea.id] ? 1 : 0)} support</button><button onClick={() => downVote(idea.id)} className={`text-xs font-semibold ${downVotes[idea.id] ? "text-red-600" : "text-ink-500"}`}><ThumbsDown className={`w-3.5 h-3.5 inline mr-1 ${downVotes[idea.id] ? "fill-red-500 text-red-500" : ""}`} />{idea.down + (downVotes[idea.id] ? 1 : 0)} not needed</button></div></div>)}</div></Card><Card className="lg:col-span-3 p-5 bg-gradient-to-r from-brand-50 to-white border-brand-100"><h2 className="font-bold text-ink-900">You said, we did</h2><div className="grid sm:grid-cols-3 gap-4 mt-4">{[{ said: "Bill details are unclear", did: "Introduced WhyMyBill AI", result: "35% fewer billing support calls" }, { said: "Appointments are hard to change", did: "Added online rescheduling", result: "243 customers supported it" }, { said: "Connection updates are unclear", did: "Added My PNG Status tracking", result: "Clearer forecast and owner details" }].map((item) => <div key={item.said} className="rounded-xl bg-white border border-brand-100 p-4"><div className="text-xs text-ink-500">YOU SAID</div><div className="font-bold text-sm text-ink-800 mt-1">{item.said}</div><div className="text-xs text-ink-500 mt-4">WE DID</div><div className="font-bold text-sm text-brand-700 mt-1">{item.did}</div><div className="text-xs text-ink-600 mt-3">{item.result}</div></div>)}</div><div className="mt-5 rounded-xl bg-white/80 p-4"><p className="text-xs font-bold uppercase tracking-wider text-brand-700">Customer-driven improvements · 2026</p><div className="mt-3 flex flex-wrap gap-2">{["WhyMyBill", "My PNG Status", "Online Rescheduling", "SMS Notifications"].map((release) => <span key={release} className="rounded-full border border-brand-100 bg-white px-3 py-1.5 text-xs font-bold text-ink-700"><Check className="mr-1 inline h-3.5 w-3.5 text-brand-600" />{release}</span>)}</div></div></Card></div>}

    {tab === "share" && <div className="grid lg:grid-cols-3 gap-5"><Card className="lg:col-span-2 p-5"><h2 className="font-bold text-ink-900">Share feedback</h2><p className="text-xs text-ink-500 mt-1">Tell us what happened. We will show you the category, priority, owner, and progress after submission.</p><form onSubmit={submit} className="mt-5 space-y-4"><div><label className="text-xs font-medium text-ink-500">Category</label><select value={category} onChange={(event) => setCategory(event.target.value)} className="w-full rounded-xl border border-ink-200 px-3 py-2.5 text-sm mt-1 outline-none focus:ring-2 focus:ring-brand-400 bg-white"><option>General support</option><option>Billing transparency</option><option>Connection delay</option><option>Safety awareness</option></select></div><div><label className="text-xs font-medium text-ink-500">Your feedback</label><textarea rows={5} value={text} onChange={(event) => setText(event.target.value)} placeholder="Tell us what worked, what did not, or what we should improve..." className="w-full rounded-xl border border-ink-200 px-3 py-2.5 text-sm mt-1 outline-none focus:ring-2 focus:ring-brand-400" /></div>{(text.trim() || voiceUrl) && <div className={`rounded-xl border p-4 ${urgent ? "border-red-200 bg-red-50" : "border-brand-100 bg-brand-50/60"}`}><div className="flex items-center gap-2"><Bot className={`w-4 h-4 ${urgent ? "text-red-600" : "text-brand-600"}`} /><p className="text-xs font-bold uppercase tracking-wide text-ink-700">Feedback preview</p></div><div className="mt-3 grid sm:grid-cols-4 gap-3 text-xs"><Preview label="Detected category" value={detectedCategory} /><Preview label="Confidence" value={`${detectedConfidence}%`} /><Preview label="Priority" value={detectedPriority} /><Preview label="Expected response" value={expectedResponse} /></div></div>}{urgent && <div className="rounded-xl border border-red-200 bg-red-50 p-4"><div className="flex items-center gap-2 font-bold text-red-800"><AlertTriangle className="w-4 h-4" /> Safety risk identified</div><p className="text-xs text-red-700 mt-2">Your message may describe a gas safety issue. Do not wait for feedback review.</p><div className="flex flex-wrap gap-2 mt-3"><Link href="/customer/gascare" className="bg-red-600 text-white rounded-lg px-3 py-2 text-xs font-bold"><Flame className="w-3.5 h-3.5 inline mr-1" /> Contact GasGuard</Link><a href="tel:1906" className="border border-red-200 text-red-700 rounded-lg px-3 py-2 text-xs font-bold">Call emergency helpline</a></div></div>}<div className="rounded-xl border border-ink-100 bg-ink-50 p-3"><div className="flex flex-wrap items-center gap-3"><button type="button" onClick={toggleRecording} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold ${recording ? "bg-red-600 text-white" : "bg-white border border-ink-200 text-ink-700"}`}>{recording ? <Pause className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}{recording ? "Stop recording" : "Record voice note"}</button>{voiceUrl && <><audio controls src={voiceUrl} className="h-8 max-w-full" /><button type="button" onClick={() => setVoiceUrl(null)} className="text-xs font-bold text-ink-500 hover:text-red-600">Remove</button></>}{voiceError && <span className="text-xs text-red-600">{voiceError}</span>}</div><p className="text-[11px] text-ink-500 mt-2">Voice notes up to 60 seconds are attached to this feedback item and stored securely in this browser profile.</p></div><button type="submit" disabled={!text.trim() && !voiceUrl} className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 text-sm"><Send className="w-4 h-4" /> Submit feedback</button></form></Card><Card className="p-5"><h2 className="font-bold text-ink-900">What happens next?</h2><ol className="mt-4 space-y-3 text-sm text-ink-700">{["We acknowledge and categorise your feedback", "The responsible team reviews or is assigned", "You can see action taken and closure", "You can rate whether the issue was resolved"].map((item, index) => <li key={item} className="flex gap-3"><span className="h-6 w-6 rounded-full bg-brand-100 text-brand-700 grid place-items-center text-xs font-bold shrink-0">{index + 1}</span>{item}</li>)}</ol><div className="mt-5 rounded-xl bg-ink-50 p-3"><p className="text-xs font-bold text-ink-800">Not satisfied later?</p><p className="mt-1 text-xs text-ink-600">Request review, a callback, or raise a grievance from your feedback item after closure.</p></div></Card></div>}
  </div>;
}

function FeedbackCard({ item, onRate, onEscalate }: { item: Feedback; onRate: (id: string, value: Satisfaction) => void; onEscalate: (kind: "review" | "callback" | "grievance") => void }) {
  const statuses: Status[] = ["Received", "Under Review", "Assigned", "Action Taken", "Closed"];
  const activeIndex = item.status === "Implemented" ? statuses.length : Math.max(0, statuses.indexOf(item.status));
  return <Card className="p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="text-xs font-bold text-brand-700">{item.id} · {item.category}</div><p className="text-sm text-ink-800 mt-2">&quot;{item.text}&quot;</p>{item.voiceData && <audio controls src={item.voiceData} className="h-8 max-w-full mt-3" />}</div><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${item.status === "Implemented" || item.status === "Closed" ? "bg-brand-100 text-brand-700" : item.priority === "High" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{item.status}</span></div><div className="mt-5 grid grid-cols-5 gap-1">{statuses.map((status, index) => <div key={status} className="text-center"><div className={`h-2 rounded-full ${index <= activeIndex ? "bg-brand-500" : "bg-ink-100"}`} /><div className="text-[9px] leading-tight text-ink-500 mt-1">{status}</div></div>)}</div><div className="mt-4 rounded-xl bg-ink-50 p-3"><div className="text-xs text-ink-500">What happened after your feedback</div><div className="flex flex-wrap gap-x-4 gap-y-2 mt-2">{item.timeline.map((event) => <span key={`${event.label}-${event.date}`} className="text-xs text-ink-700"><strong>{event.label}</strong> · {event.date}</span>)}</div><div className="text-xs text-ink-600 mt-3"><strong>Assigned to:</strong> {item.owner} · <strong>Priority:</strong> {item.priority}</div></div>{item.impact && <div className="mt-3 rounded-xl bg-brand-50 border border-brand-100 p-3 text-sm text-brand-800"><strong>Impact:</strong> {item.impact}</div>}{item.implementationReason && <div className="mt-3 rounded-xl border border-violet-100 bg-violet-50 p-3 text-sm text-violet-900"><p className="font-bold">Why implemented?</p><p className="mt-1">{item.implementationReason}</p>{item.released && <p className="mt-1 text-xs font-bold text-violet-700">{item.released}</p>}</div>}{["Closed", "Implemented"].includes(item.status) && <div className="mt-4"><div className="text-xs font-semibold text-ink-700">Was your issue resolved?</div><div className="flex flex-wrap gap-2 mt-2">{([ ["yes", "😊 Yes"], ["partial", "😐 Partially"], ["no", "😞 No"] ] as const).map(([value, label]) => <button key={value} onClick={() => onRate(item.id, value)} className={`rounded-lg border px-3 py-2 text-xs font-semibold ${item.satisfaction === value ? "border-brand-300 bg-brand-50 text-brand-700" : "border-ink-200 text-ink-600 hover:bg-ink-50"}`}>{label}</button>)}</div>{item.satisfaction === "no" && <div className="mt-3 flex flex-wrap gap-2"><button onClick={() => onEscalate("review")} className="rounded-lg border border-brand-200 px-3 py-2 text-xs font-bold text-brand-700">Request review</button><button onClick={() => onEscalate("callback")} className="rounded-lg border border-ink-200 px-3 py-2 text-xs font-bold text-ink-700">Request callback</button><button onClick={() => onEscalate("grievance")} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700">Raise grievance</button></div>}{item.satisfaction && <p className="text-xs text-brand-700 mt-2">{item.satisfaction === "no" ? "Your issue has been reopened for review." : "Thanks—your recheck has been recorded."}</p>}</div>}</Card>;
}

function VoiceMetric({ label, value, good = false }: { label: string; value: string; good?: boolean }) {
  return <div className="rounded-xl border border-brand-100 bg-white p-3"><p className="text-[11px] text-ink-500">{label}</p><p className={`mt-1 text-lg font-extrabold ${good ? "text-brand-700" : "text-ink-900"}`}>{value}</p></div>;
}

function Preview({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-white/70 p-2.5"><span className="block text-[10px] font-semibold uppercase tracking-wide text-ink-400">{label}</span><span className="mt-1 block font-bold text-ink-800">{value}</span></div>;
}

function toDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Voice note could not be read"));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
