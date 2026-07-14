"use client";

import { useState } from "react";
import { Card, Kpi, SectionTitle, Badge } from "@/components/ui";
import CountUp from "@/components/CountUp";
import Typewriter from "@/components/Typewriter";
import { MessageSquare, ThumbsUp, Send, CheckCircle2, Bot, HelpCircle } from "lucide-react";

type Feedback = { id: string; cat: string; txt: string; sentiment: "Positive" | "Neutral" | "Negative"; status: string; reply?: string };

export default function VoiceOfCustomer() {
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([
    { id: "VOC-903", cat: "Billing Clarity", txt: "The Explanation factor detail in WhyMyBill is very helpful to understand seasonal bill rise.", sentiment: "Positive", status: "Resolved", reply: "Thank you Riddhi! We aim to keep our billing explanations transparent and simple." },
    { id: "VOC-901", cat: "Safety Support", txt: "The emergency SOS assistant was super quick during my accidental gas stove leak check last month.", sentiment: "Positive", status: "Resolved", reply: "Safety is our priority. Glad the automated dispatcher and crew could assist you." },
    { id: "VOC-884", cat: "Connection Delay", txt: "Site survey schedule took 3 days longer than expected in Maninagar area.", sentiment: "Negative", status: "Resolved", reply: "Apologies for the delay. We had heavy rain surveys during that period. Resolved and surveyed now." }
  ]);

  const [txt, setTxt] = useState("");
  const [cat, setCat] = useState("General");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!txt) return;
    const sentiment = txt.toLowerCase().includes("bad") || txt.toLowerCase().includes("slow") ? "Negative" :
                      txt.toLowerCase().includes("good") || txt.toLowerCase().includes("great") || txt.toLowerCase().includes("helpful") ? "Positive" : "Neutral";
    const nf: Feedback = {
      id: "VOC-" + (904 + Math.floor(Math.random() * 100)),
      cat,
      txt,
      sentiment,
      status: "AI Analyzing",
      reply: "AI Triage Agent is analyzing your query. Operations will respond within 2 hours."
    };
    setFeedbackList((prev) => [nf, ...prev]);
    setTxt("");
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  }

  return (
    <div className="space-y-6 reveal">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-ink-900 via-ink-900 to-brand-900 text-white p-6 relative overflow-hidden shadow-soft">
        <div className="floaty absolute -right-10 -top-10 w-56 h-56 bg-brand-500/20 rounded-full blur-3xl" />
        <div className="relative">
          <p className="text-brand-300 text-xs font-semibold uppercase tracking-widest">Customer Experience Suite</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">
            <Typewriter speed={40} segments={[{ text: "Voice of Customer AI" }]} />
          </h1>
          <p className="text-ink-300 mt-2 text-sm max-w-2xl">
            Share your feedback directly. Our AI analyzer classifies feedback, performs instant sentiment scoring, and escalates safety concerns instantly.
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 anim-fade-up">
        <Kpi label="Your Submissions" value={<CountUp to={feedbackList.length} />} icon={<MessageSquare className="w-4 h-4" />} />
        <Kpi label="Avg Response Time" value="2.4 Hours" icon={<Bot className="w-4 h-4 text-brand-500" />} />
        <Kpi label="Resolution Rate" value="94%" accent="text-brand-600" icon={<CheckCircle2 className="w-4 h-4" />} />
        <Kpi label="Customer Satisfaction" value="4.2 / 5" icon={<ThumbsUp className="w-4 h-4" />} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 anim-fade-up">
        {/* Feedback form */}
        <Card className="p-6">
          <h3 className="font-bold text-ink-900 mb-4">Submit Feedback / Inquiry</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-ink-500">Category</label>
              <select value={cat} onChange={(e) => setCat(e.target.value)}
                className="w-full rounded-xl border border-ink-200 px-3 py-2.5 text-sm mt-1 outline-none focus:ring-2 focus:ring-brand-400 bg-white">
                <option>Safety &amp; Leakage</option>
                <option>Billing Clarity</option>
                <option>Installation &amp; Setup</option>
                <option>General Support</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-ink-500">Your Feedback</label>
              <textarea rows={4} value={txt} onChange={(e) => setTxt(e.target.value)} placeholder="Type here... (our AI will auto-analyze sentiment)"
                className="w-full rounded-xl border border-ink-200 px-3 py-2.5 text-sm mt-1 outline-none focus:ring-2 focus:ring-brand-400" />
            </div>

            <button type="submit"
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs">
              <Send className="w-4 h-4" /> Submit Feedback
            </button>

            {submitted && (
              <div className="p-2 bg-brand-50 text-brand-700 text-xs rounded-lg text-center font-semibold">
                Submitted! Sentiment analyzed &amp; updated in log.
              </div>
            )}
          </form>
        </Card>

        {/* History log */}
        <Card className="lg:col-span-2 p-6 overflow-hidden">
          <h3 className="font-bold text-ink-900 mb-4">Submission &amp; Triage History</h3>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {feedbackList.map((f) => {
              const tone = f.sentiment === "Positive" ? "brand" : f.sentiment === "Negative" ? "red" : "amber";
              return (
                <div key={f.id} className="p-4 bg-ink-50/60 rounded-2xl border border-ink-100 text-xs">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-bold text-ink-900">{f.id} · {f.cat}</span>
                    <Badge tone={tone}>{f.sentiment}</Badge>
                  </div>
                  <p className="text-ink-700 mt-2 italic leading-relaxed">&quot;{f.txt}&quot;</p>
                  {f.reply && (
                    <div className="mt-3 p-3 bg-white rounded-xl border border-brand-100 flex items-start gap-2">
                      <Bot className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-brand-700 block">AI Triage / Ops Agent</span>
                        <span className="text-ink-600 block mt-0.5">{f.reply}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
