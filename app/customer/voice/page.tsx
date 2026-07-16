"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle, Bot, Check, CheckCircle2, Clock3, Flame, MessageCircle,
  Mic, Pause, Send, ThumbsUp, UserRound, UsersRound, Volume2,
} from "lucide-react";
import { Card, Kpi } from "@/components/ui";
import Typewriter from "@/components/Typewriter";

type Status = "Received" | "Under Review" | "Assigned" | "Action Taken" | "Closed" | "Implemented";
type Satisfaction = "yes" | "partial" | "no" | undefined;
type Feedback = { id: string; category: string; text: string; status: Status; submitted: string; owner: string; priority: "Low" | "Medium" | "High"; impact?: string; timeline: { label: string; date: string }[]; satisfaction?: Satisfaction; voiceNote?: boolean; voiceData?: string };

const storageKey = "suraksha:voice-feedback:GJ-559210";
const initialFeedback: Feedback[] = [
  { id: "VOC-903", category: "Billing transparency", text: "The WhyMyBill explanation helped me understand my seasonal bill increase.", status: "Implemented", submitted: "10 Jul 2026", owner: "Customer Experience", priority: "Low", impact: "WhyMyBill is now available to 8,000+ customers.", timeline: [{ label: "Submitted", date: "10 Jul" }, { label: "Reviewed", date: "11 Jul" }, { label: "Accepted", date: "12 Jul" }, { label: "Implemented", date: "15 Jul" }] },
  { id: "VOC-884", category: "Connection delay", text: "Site survey scheduling took longer than expected in Maninagar.", status: "Closed", submitted: "12 Jul 2026", owner: "Installation Team Ahmedabad", priority: "Medium", timeline: [{ label: "Submitted", date: "12 Jul" }, { label: "Assigned", date: "13 Jul" }, { label: "Reviewed", date: "14 Jul" }, { label: "Action Taken", date: "15 Jul" }, { label: "Closed", date: "16 Jul" }] },
];

const community = [
  { id: "whatsapp", title: "Enable WhatsApp bill alerts", count: 328 },
  { id: "reschedule", title: "Online appointment rescheduling", count: 243 },
  { id: "language", title: "More Gujarati voice support", count: 176 },
];

const safetyWords = /gas smell|leak|fire|pressure issue|hissing|smell gas/i;

export default function VoiceOfCustomer() {
  const [tab, setTab] = useState<"mine" | "community" | "share">("mine");
  const [feedback, setFeedback] = useState<Feedback[]>(initialFeedback);
  const [text, setText] = useState("");
  const [category, setCategory] = useState("General support");
  const [submitted, setSubmitted] = useState<Feedback | null>(null);
  const [votes, setVotes] = useState<Record<string, boolean>>({});
  const [recording, setRecording] = useState(false);
  const [voiceUrl, setVoiceUrl] = useState<string | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const recordingTimer = useRef<number | null>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(storageKey) ?? "null");
      if (Array.isArray(saved?.feedback)) setFeedback(saved.feedback);
      if (saved?.votes && typeof saved.votes === "object") setVotes(saved.votes);
    } catch { /* Fresh profile uses the seeded feedback journey. */ }
  }, []);

  useEffect(() => {
    try { window.localStorage.setItem(storageKey, JSON.stringify({ feedback, votes })); } catch { /* session remains usable without storage */ }
  }, [feedback, votes]);

  const mine = feedback.filter((item) => item.id.startsWith("VOC-"));
  const implemented = mine.filter((item) => item.status === "Implemented").length;
  const underReview = mine.filter((item) => ["Received", "Under Review", "Assigned"].includes(item.status)).length;
  const urgent = safetyWords.test(text);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!text.trim() && !voiceUrl) return;
    const isSafety = safetyWords.test(text);
    const item: Feedback = {
      id: `VOC-${Math.floor(1000 + Math.random() * 8999)}`,
      category: isSafety ? "Safety concern" : category,
      text: text.trim() || "Voice feedback submitted",
      status: isSafety ? "Assigned" : "Received",
      submitted: "Today",
      owner: isSafety ? "GasGuard Safety Team" : category === "Connection delay" ? "Installation Team Ahmedabad" : "Customer Experience",
      priority: isSafety ? "High" : "Medium",
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
  }

  function rate(itemId: string, satisfaction: Satisfaction) {
    setFeedback((current) => current.map((item) => item.id === itemId
      ? satisfaction === "no"
        ? { ...item, satisfaction, status: "Under Review", owner: "Customer Resolution Team", timeline: [...item.timeline, { label: "Reopened after recheck", date: "Now" }] }
        : { ...item, satisfaction }
      : item));
  }

  return <div className="space-y-6 reveal">
    <header className="rounded-2xl bg-gradient-to-br from-ink-900 via-ink-900 to-brand-900 text-white p-6 sm:p-8 relative overflow-hidden shadow-soft"><div className="floaty absolute -right-10 -top-10 w-56 h-56 bg-brand-500/20 rounded-full blur-3xl" /><div className="relative max-w-3xl"><p className="text-brand-300 text-xs font-semibold uppercase tracking-widest">Voice of Customer</p><h1 className="text-2xl sm:text-3xl font-extrabold mt-1"><Typewriter speed={40} segments={[{ text: "Your voice matters. See what it changes." }]} /></h1><p className="text-ink-300 mt-2 text-sm">Track every feedback item from submission to action, add a voice note, and help choose the next service improvements.</p></div></header>

    <nav aria-label="Feedback sections" className="sticky top-3 z-10 flex gap-1 overflow-x-auto rounded-2xl border border-ink-100 bg-white/95 p-1.5 shadow-soft backdrop-blur">{([ ["mine", "My feedback"], ["community", "Community impact"], ["share", "Share feedback"] ] as const).map(([id, label]) => <button key={id} onClick={() => setTab(id)} className={`shrink-0 rounded-xl px-3.5 py-2 text-sm font-semibold transition ${tab === id ? "bg-ink-900 text-white" : "text-ink-500 hover:bg-ink-50 hover:text-ink-900"}`}>{label}</button>)}</nav>

    {tab === "mine" && <><div className="grid grid-cols-2 lg:grid-cols-4 gap-4"><Kpi label="My feedback impact" value={`${implemented} implemented`} sub="Ideas that improved service" icon={<CheckCircle2 className="w-4 h-4 text-brand-500" />} /><Kpi label="Under review" value={underReview} sub={underReview ? "Expected update within 24 hrs" : "No open issue"} icon={<Clock3 className="w-4 h-4" />} /><Kpi label="My open issues" value={underReview} sub={underReview ? "Team has been assigned" : "Nothing waiting on you"} icon={<MessageCircle className="w-4 h-4" />} /><Kpi label="Last feedback" value="2 days" sub="Resolved in" icon={<UserRound className="w-4 h-4" />} /></div>
      {submitted && <Card className={`p-5 border ${submitted.priority === "High" ? "border-red-200 bg-red-50" : "border-brand-200 bg-brand-50"}`}><div className="flex items-start gap-3"><Bot className={`w-5 h-5 mt-0.5 ${submitted.priority === "High" ? "text-red-600" : "text-brand-600"}`} /><div><h2 className="font-bold text-ink-900">What we understood</h2><p className="text-sm text-ink-700 mt-1">You reported: <strong>{submitted.text}</strong></p><div className="grid sm:grid-cols-3 gap-3 mt-3 text-xs"><span><strong>Category:</strong> {submitted.category}</span><span><strong>Priority:</strong> {submitted.priority}</span><span><strong>Assigned to:</strong> {submitted.owner}</span></div></div></div></Card>}
      <div className="space-y-4">{mine.map((item) => <FeedbackCard key={item.id} item={item} onRate={rate} />)}</div></>}

    {tab === "community" && <div className="grid lg:grid-cols-3 gap-5"><Card className="lg:col-span-2 p-5"><h2 className="font-bold text-ink-900 flex items-center gap-2"><UsersRound className="w-4 h-4 text-brand-600" /> Most discussed topics</h2><div className="mt-5 space-y-4">{[{ name: "Billing transparency", value: 34 }, { name: "Connection delays", value: 28 }, { name: "Safety awareness", value: 18 }, { name: "Customer support", value: 12 }, { name: "Other", value: 8 }].map((topic) => <div key={topic.name}><div className="flex justify-between text-sm"><span className="font-medium text-ink-700">{topic.name}</span><span className="font-bold text-brand-700">{topic.value}%</span></div><div className="h-2 rounded-full bg-ink-100 overflow-hidden mt-1"><div className="h-full bg-brand-500 rounded-full" style={{ width: `${topic.value}%` }} /></div></div>)}</div></Card><Card className="p-5"><h2 className="font-bold text-ink-900 flex items-center gap-2"><ThumbsUp className="w-4 h-4 text-brand-600" /> Community suggestions</h2><div className="mt-4 space-y-3">{community.map((idea) => <button key={idea.id} onClick={() => vote(idea.id)} className={`w-full text-left rounded-xl border p-3 transition ${votes[idea.id] ? "border-brand-300 bg-brand-50" : "border-ink-100 hover:bg-ink-50"}`}><div className="font-semibold text-sm text-ink-800">{idea.title}</div><div className="text-xs text-ink-500 mt-2"><ThumbsUp className={`w-3.5 h-3.5 inline mr-1 ${votes[idea.id] ? "fill-brand-500 text-brand-500" : ""}`} />{idea.count + (votes[idea.id] ? 1 : 0)} customers support</div></button>)}</div></Card><Card className="lg:col-span-3 p-5 bg-gradient-to-r from-brand-50 to-white border-brand-100"><h2 className="font-bold text-ink-900">You said, we did</h2><div className="grid sm:grid-cols-3 gap-4 mt-4">{[{ said: "Bill details are unclear", did: "Introduced WhyMyBill AI", result: "35% fewer billing support calls" }, { said: "Appointments are hard to change", did: "Added online rescheduling", result: "243 customers supported it" }, { said: "Connection updates are unclear", did: "Added My PNG Status tracking", result: "Clearer forecast and owner details" }].map((item) => <div key={item.said} className="rounded-xl bg-white border border-brand-100 p-4"><div className="text-xs text-ink-500">YOU SAID</div><div className="font-bold text-sm text-ink-800 mt-1">{item.said}</div><div className="text-xs text-ink-500 mt-4">WE DID</div><div className="font-bold text-sm text-brand-700 mt-1">{item.did}</div><div className="text-xs text-ink-600 mt-3">{item.result}</div></div>)}</div></Card></div>}

    {tab === "share" && <div className="grid lg:grid-cols-3 gap-5"><Card className="lg:col-span-2 p-5"><h2 className="font-bold text-ink-900">Share feedback</h2><p className="text-xs text-ink-500 mt-1">Tell us what happened. We will show you the category, priority, owner, and progress after submission.</p><form onSubmit={submit} className="mt-5 space-y-4"><div><label className="text-xs font-medium text-ink-500">Category</label><select value={category} onChange={(event) => setCategory(event.target.value)} className="w-full rounded-xl border border-ink-200 px-3 py-2.5 text-sm mt-1 outline-none focus:ring-2 focus:ring-brand-400 bg-white"><option>General support</option><option>Billing transparency</option><option>Connection delay</option><option>Safety awareness</option></select></div><div><label className="text-xs font-medium text-ink-500">Your feedback</label><textarea rows={5} value={text} onChange={(event) => setText(event.target.value)} placeholder="Tell us what worked, what did not, or what we should improve..." className="w-full rounded-xl border border-ink-200 px-3 py-2.5 text-sm mt-1 outline-none focus:ring-2 focus:ring-brand-400" /></div>{urgent && <div className="rounded-xl border border-red-200 bg-red-50 p-4"><div className="flex items-center gap-2 font-bold text-red-800"><AlertTriangle className="w-4 h-4" /> Safety risk identified</div><p className="text-xs text-red-700 mt-2">Your message may describe a gas safety issue. Do not wait for feedback review.</p><div className="flex flex-wrap gap-2 mt-3"><Link href="/customer/gascare" className="bg-red-600 text-white rounded-lg px-3 py-2 text-xs font-bold"><Flame className="w-3.5 h-3.5 inline mr-1" /> Contact GasGuard</Link><a href="tel:1906" className="border border-red-200 text-red-700 rounded-lg px-3 py-2 text-xs font-bold">Call emergency helpline</a></div></div>}<div className="rounded-xl border border-ink-100 bg-ink-50 p-3"><div className="flex flex-wrap items-center gap-3"><button type="button" onClick={toggleRecording} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold ${recording ? "bg-red-600 text-white" : "bg-white border border-ink-200 text-ink-700"}`}>{recording ? <Pause className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}{recording ? "Stop recording" : "Record voice note"}</button>{voiceUrl && <><audio controls src={voiceUrl} className="h-8 max-w-full" /><button type="button" onClick={() => setVoiceUrl(null)} className="text-xs font-bold text-ink-500 hover:text-red-600">Remove</button></>}{voiceError && <span className="text-xs text-red-600">{voiceError}</span>}</div><p className="text-[11px] text-ink-500 mt-2">Voice notes up to 60 seconds are attached to this feedback item and stored securely in this browser profile.</p></div><button type="submit" disabled={!text.trim() && !voiceUrl} className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 text-sm"><Send className="w-4 h-4" /> Submit feedback</button></form></Card><Card className="p-5"><h2 className="font-bold text-ink-900">What happens next?</h2><ol className="mt-4 space-y-3 text-sm text-ink-700">{["We acknowledge and categorise your feedback", "The responsible team reviews or is assigned", "You can see action taken and closure", "You can rate whether the issue was resolved"].map((item, index) => <li key={item} className="flex gap-3"><span className="h-6 w-6 rounded-full bg-brand-100 text-brand-700 grid place-items-center text-xs font-bold shrink-0">{index + 1}</span>{item}</li>)}</ol></Card></div>}
  </div>;
}

function FeedbackCard({ item, onRate }: { item: Feedback; onRate: (id: string, value: Satisfaction) => void }) {
  const statuses: Status[] = ["Received", "Under Review", "Assigned", "Action Taken", "Closed"];
  const activeIndex = item.status === "Implemented" ? statuses.length : Math.max(0, statuses.indexOf(item.status));
  return <Card className="p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="text-xs font-bold text-brand-700">{item.id} · {item.category}</div><p className="text-sm text-ink-800 mt-2">&quot;{item.text}&quot;</p>{item.voiceData && <audio controls src={item.voiceData} className="h-8 max-w-full mt-3" />}</div><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${item.status === "Implemented" || item.status === "Closed" ? "bg-brand-100 text-brand-700" : item.priority === "High" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{item.status}</span></div><div className="mt-5 grid grid-cols-5 gap-1">{statuses.map((status, index) => <div key={status} className="text-center"><div className={`h-2 rounded-full ${index <= activeIndex ? "bg-brand-500" : "bg-ink-100"}`} /><div className="text-[9px] leading-tight text-ink-500 mt-1">{status}</div></div>)}</div><div className="mt-4 rounded-xl bg-ink-50 p-3"><div className="text-xs text-ink-500">What happened after your feedback</div><div className="flex flex-wrap gap-x-4 gap-y-2 mt-2">{item.timeline.map((event) => <span key={`${event.label}-${event.date}`} className="text-xs text-ink-700"><strong>{event.label}</strong> · {event.date}</span>)}</div><div className="text-xs text-ink-600 mt-3"><strong>Assigned to:</strong> {item.owner} · <strong>Priority:</strong> {item.priority}</div></div>{item.impact && <div className="mt-3 rounded-xl bg-brand-50 border border-brand-100 p-3 text-sm text-brand-800"><strong>Impact:</strong> {item.impact}</div>}{["Closed", "Implemented"].includes(item.status) && <div className="mt-4"><div className="text-xs font-semibold text-ink-700">Was your issue resolved?</div><div className="flex flex-wrap gap-2 mt-2">{([ ["yes", "😊 Yes"], ["partial", "😐 Partially"], ["no", "😞 No"] ] as const).map(([value, label]) => <button key={value} onClick={() => onRate(item.id, value)} className={`rounded-lg border px-3 py-2 text-xs font-semibold ${item.satisfaction === value ? "border-brand-300 bg-brand-50 text-brand-700" : "border-ink-200 text-ink-600 hover:bg-ink-50"}`}>{label}</button>)}</div>{item.satisfaction && <p className="text-xs text-brand-700 mt-2">{item.satisfaction === "no" ? "Your issue has been reopened for review." : "Thanks—your recheck has been recorded."}</p>}</div>}</Card>;
}

function toDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Voice note could not be read"));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
