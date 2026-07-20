"use client";

// Cross-module recommendation surface. The same panel serves all three suites:
// it renders whatever the platform recommendation engine derives for the role,
// with evidence, confidence, impact, and a full lifecycle (act / done /
// remind later / dismiss). Completing or dismissing here is platform state —
// every other surface updates instantly.

import { useState } from "react";
import Link from "next/link";
import { AlarmClock, ArrowRight, Check, ChevronDown, Lightbulb, X } from "lucide-react";
import { Card } from "@/components/ui";
import { useRecommendations, type Recommendation, type RecommendationPriority } from "@/lib/platform";
import type { SuiteRole } from "@/lib/activity";

const PRIORITY_STYLE: Record<RecommendationPriority, string> = {
  critical: "bg-red-100 text-red-700",
  high: "bg-amber-100 text-amber-800",
  medium: "bg-sky-100 text-sky-700",
  low: "bg-ink-100 text-ink-600",
};

const ROLE_ACCENT: Record<SuiteRole, { text: string; bar: string }> = {
  customer: { text: "text-brand-700", bar: "bg-brand-500" },
  safety: { text: "text-amber-700", bar: "bg-amber-500" },
  intelligence: { text: "text-indigo-700", bar: "bg-indigo-500" },
};

export default function RecommendationsPanel({ role, limit = 4, className = "" }: { role: SuiteRole; limit?: number; className?: string }) {
  const { recommendations, dismiss, snooze, complete } = useRecommendations(role);
  const [expanded, setExpanded] = useState<string | null>(null);
  const accent = ROLE_ACCENT[role];
  const visible = recommendations.slice(0, limit);

  return <Card className={`p-5 sm:p-6 ${className}`}>
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <div className={`grid h-9 w-9 place-items-center rounded-xl bg-ink-50 ${accent.text}`}><Lightbulb className="h-4 w-4" /></div>
        <div>
          <p className={`text-xs font-bold uppercase tracking-wider ${accent.text}`}>Cross-module intelligence</p>
          <h2 className="mt-0.5 text-lg font-bold text-ink-900">Recommended actions</h2>
        </div>
      </div>
      <span className="rounded-full bg-ink-50 px-2.5 py-1 text-xs font-bold text-ink-600">{recommendations.length} open</span>
    </div>

    {visible.length === 0 ? (
      <div className="mt-4 rounded-xl bg-ink-50 px-4 py-6 text-center text-xs text-ink-500">Nothing recommended right now — every signal across the platform is handled.</div>
    ) : (
      <div className="mt-4 space-y-3">
        {visible.map((rec) => <RecommendationCard key={rec.id} rec={rec} accentBar={accent.bar} open={expanded === rec.id} onToggle={() => setExpanded(expanded === rec.id ? null : rec.id)} onDismiss={() => dismiss(rec.id)} onSnooze={() => snooze(rec.id)} onComplete={() => complete(rec.id)} />)}
      </div>
    )}
  </Card>;
}

function RecommendationCard({ rec, accentBar, open, onToggle, onDismiss, onSnooze, onComplete }: { rec: Recommendation; accentBar: string; open: boolean; onToggle: () => void; onDismiss: () => void; onSnooze: () => void; onComplete: () => void }) {
  return <div className="overflow-hidden rounded-xl border border-ink-100 bg-white">
    <button onClick={onToggle} className="flex w-full items-start gap-3 p-4 text-left transition hover:bg-ink-50/60" aria-expanded={open}>
      <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${rec.priority === "critical" ? "bg-red-500" : rec.priority === "high" ? "bg-amber-500" : accentBar}`} />
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold text-ink-900">{rec.title}</span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${PRIORITY_STYLE[rec.priority]}`}>{rec.priority}</span>
          <span className="text-xs font-bold uppercase tracking-wide text-ink-400">{rec.module}</span>
        </span>
        <span className="mt-1 block text-xs leading-relaxed text-ink-600">{rec.reason}</span>
      </span>
      <ChevronDown className={`mt-1 h-4 w-4 shrink-0 text-ink-300 transition ${open ? "rotate-180" : ""}`} />
    </button>

    {open && <div className="border-t border-ink-100 bg-ink-50/50 px-4 py-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-ink-400">Evidence</p>
          <ul className="mt-1.5 space-y-1">
            {rec.evidence.map((item) => <li key={item} className="flex gap-1.5 text-xs text-ink-700"><Check className="mt-0.5 h-3 w-3 shrink-0 text-ink-400" />{item}</li>)}
          </ul>
        </div>
        <div className="space-y-2">
          {rec.impacts.map((impact) => <div key={impact.label} className="text-xs"><span className="font-bold text-ink-800">{impact.label}: </span><span className="text-ink-600">{impact.value}</span></div>)}
          <div className="text-xs"><span className="font-bold text-ink-800">Expected outcome: </span><span className="text-ink-600">{rec.outcome}</span></div>
          <div className="flex items-center gap-1.5 text-xs text-ink-500">
            <span className="inline-block h-1.5 w-14 overflow-hidden rounded-full bg-ink-100"><span className={`block h-full ${accentBar}`} style={{ width: `${rec.confidence}%` }} /></span>
            {rec.confidence}% confidence
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-ink-100 pt-3">
        <Link href={rec.action.href} className="inline-flex items-center gap-1.5 rounded-lg bg-ink-900 px-3 py-2 text-xs font-bold text-white transition hover:bg-ink-800">{rec.action.label} <ArrowRight className="h-3.5 w-3.5" /></Link>
        <button onClick={onComplete} className="inline-flex items-center gap-1 rounded-lg border border-ink-200 px-3 py-2 text-xs font-bold text-ink-600 hover:bg-white"><Check className="h-3.5 w-3.5" />Done</button>
        <button onClick={onSnooze} className="inline-flex items-center gap-1 rounded-lg border border-ink-200 px-3 py-2 text-xs font-bold text-ink-600 hover:bg-white"><AlarmClock className="h-3.5 w-3.5" />Remind later</button>
        <button onClick={onDismiss} className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-bold text-ink-400 hover:text-ink-600"><X className="h-3.5 w-3.5" />Dismiss</button>
      </div>
    </div>}
  </div>;
}
