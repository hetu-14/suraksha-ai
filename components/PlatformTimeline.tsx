"use client";

// Unified cross-suite timeline: one chronological record of everything that
// happened anywhere on the platform — bills, emergencies, compliance, revenue,
// rewards — each entry carrying its source module, related entities, and the
// downstream modules the platform updated in response.

import { useState } from "react";
import Link from "next/link";
import { History } from "lucide-react";
import { Card } from "@/components/ui";
import { timeAgo } from "@/lib/activity";
import { usePlatformTimeline, type TimelineCategory } from "@/lib/platform";

const CATEGORY_STYLE: Record<TimelineCategory, string> = {
  Billing: "bg-brand-50 text-brand-700",
  Safety: "bg-brand-50 text-brand-700",
  Emergency: "bg-red-50 text-red-700",
  Service: "bg-sky-50 text-sky-700",
  Connection: "bg-sky-50 text-sky-700",
  Rewards: "bg-violet-50 text-violet-700",
  Compliance: "bg-amber-50 text-amber-700",
  Revenue: "bg-indigo-50 text-indigo-700",
  Network: "bg-amber-50 text-amber-700",
  Insight: "bg-indigo-50 text-indigo-700",
};

const FILTERS: Array<"All" | TimelineCategory> = ["All", "Emergency", "Compliance", "Revenue", "Service", "Billing", "Connection", "Rewards", "Network"];

export default function PlatformTimeline({ limit = 10, className = "" }: { limit?: number; className?: string }) {
  const timeline = usePlatformTimeline();
  const [filter, setFilter] = useState<"All" | TimelineCategory>("All");
  const visible = (filter === "All" ? timeline : timeline.filter((item) => item.category === filter)).slice(0, limit);

  return <Card className={`p-5 ${className}`}>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h3 className="flex items-center gap-2 font-bold text-ink-900"><History className="h-4 w-4 text-ink-500" /> Unified platform timeline</h3>
      <span className="text-xs text-ink-500">Every suite · one record</span>
    </div>
    <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
      {FILTERS.map((category) => <button key={category} onClick={() => setFilter(category)} className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-bold transition ${filter === category ? "border-ink-900 bg-ink-900 text-white" : "border-ink-200 text-ink-500 hover:border-ink-300 hover:text-ink-800"}`}>{category}</button>)}
    </div>
    <div className="mt-3 divide-y divide-ink-100">
      {visible.length === 0 && <p className="rounded-xl bg-ink-50 px-3 py-5 text-center text-xs text-ink-500">No {filter === "All" ? "" : `${filter.toLowerCase()} `}activity recorded yet.</p>}
      {visible.map((item) => <Link key={item.id} href={item.href} className="group flex gap-3 py-3 transition hover:bg-ink-50/60">
        <span className="w-16 shrink-0 pt-0.5 text-[11px] tabular-nums text-ink-400">{timeAgo(item.at)}</span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${CATEGORY_STYLE[item.category]}`}>{item.category}</span>
            <span className="text-sm font-semibold text-ink-800 group-hover:text-ink-950">{item.title}</span>
          </span>
          <span className="mt-0.5 block text-[11px] text-ink-500">{item.module}{item.detail ? ` · updated ${item.detail}` : ""}</span>
          {item.entities.length > 0 && <span className="mt-1 flex flex-wrap gap-1">{item.entities.slice(0, 3).map((entity) => <span key={`${entity.type}-${entity.id}`} className="rounded border border-ink-100 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-ink-500">{entity.label ?? entity.id}</span>)}</span>}
        </span>
      </Link>)}
    </div>
  </Card>;
}
