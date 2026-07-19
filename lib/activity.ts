"use client";

// ---- Unified activity & notification feed ----
// Every module writes real events here; the Shell notification center and the
// customer timeline both read from this single chronological record, so a
// booking, an SOS, a feedback item, or a points change surfaces everywhere at
// once instead of living inside one page.

import { useCallback, useEffect, useState } from "react";

export type SuiteRole = "customer" | "safety" | "intelligence";

export type ActivityTone = "brand" | "amber" | "red" | "sky";

export type ActivityEvent = {
  id: string;
  at: number; // epoch ms
  module: string; // e.g. "Appointments", "GasGuard", "WhyMyBill"
  title: string;
  detail: string;
  href: string; // deep link to where the event can be acted on
  tone: ActivityTone;
  priority: "normal" | "high" | "critical";
  read: boolean;
};

const FEED_EVENT = "suraksha:feed";
const MAX_EVENTS = 60;

const feedKey = (role: SuiteRole) => `suraksha:feed:${role}`;

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

type Seed = Omit<ActivityEvent, "id" | "at" | "read"> & { id: string; ago: number; read?: boolean };

// Materialised once per browser profile, then persisted — later events from
// real actions are appended on top of this history.
const SEEDS: Record<SuiteRole, Seed[]> = {
  customer: [
    { id: "seed-survey", ago: 2 * HOUR, module: "My PNG Status", title: "Site survey completed", detail: "Your new-connection application moved to meter installation.", href: "/customer/connection", tone: "brand", priority: "normal" },
    { id: "seed-bill", ago: 6 * HOUR, module: "Billing", title: "Bill of ₹1,980 due in 4 days", detail: "GJ-559210 · pay before Jul 22 to avoid a late fee.", href: "/customer/explainbill", tone: "amber", priority: "high" },
    { id: "seed-feedback", ago: DAY, module: "Voice of Customer", title: "Feedback resolved", detail: "VOC-884 · Connection delay in Maninagar was closed by the installation team.", href: "/customer/voice", tone: "brand", priority: "normal", read: true },
    { id: "seed-training", ago: 2 * DAY, module: "TrustPoints", title: "Leak safety training completed", detail: "+100 TrustPoints added to your safety ledger.", href: "/customer/trustpoints", tone: "brand", priority: "normal", read: true },
    { id: "seed-inspection", ago: 3 * DAY, module: "Health Score", title: "Inspection due in 45 days", detail: "Book your annual safety inspection to keep your Safety Passport current.", href: "/customer/appointment?service=inspection", tone: "amber", priority: "high" },
  ],
  safety: [
    { id: "seed-ppm", ago: 3 * 60_000, module: "Gas-Guard", title: "Critical PPM at Naranpura Inlet Line", detail: "Zone Z-04 crossed the critical methane threshold — field response required.", href: "/safety/dashboard-gas-guard", tone: "red", priority: "critical" },
    { id: "seed-sos", ago: 8 * 60_000, module: "Emergency", title: "New SOS · EMG-2231 · Maninagar Sec 12", detail: "AI dispatcher is guiding the caller; crew dispatch pending.", href: "/safety/emergency", tone: "red", priority: "critical" },
    { id: "seed-breach", ago: 22 * 60_000, module: "SLA Sentinel", title: "T-7714 breached — Meter fault, Satellite", detail: "Compensation payout window is now active. Assign a crew now.", href: "/safety/sla-sentinel", tone: "amber", priority: "high" },
    { id: "seed-audit", ago: DAY, module: "Contractor Safety", title: "Contractor audit overdue", detail: "2 vendors have certifications expiring this week.", href: "/safety/contractor-safety", tone: "amber", priority: "normal", read: true },
  ],
  intelligence: [
    { id: "seed-rev", ago: HOUR, module: "Revenue Guard", title: "Weekly revenue report ready", detail: "142 high-risk accounts flagged · ₹27.3L annualized exposure.", href: "/intelligence/revenue-guard", tone: "brand", priority: "normal" },
    { id: "seed-sla", ago: 5 * HOUR, module: "SLA Sentinel", title: "SLA compliance at 94.2% (MTD)", detail: "0.8 points below the 95% target — 1 breach and 4 at-risk tickets in the live queue.", href: "/intelligence/sla", tone: "amber", priority: "high", read: true },
  ],
};

function materialise(role: SuiteRole): ActivityEvent[] {
  const now = Date.now();
  return SEEDS[role].map((seed) => ({
    id: seed.id, at: now - seed.ago, module: seed.module, title: seed.title,
    detail: seed.detail, href: seed.href, tone: seed.tone, priority: seed.priority,
    read: Boolean(seed.read),
  }));
}

function isEvent(value: unknown): value is ActivityEvent {
  const event = value as ActivityEvent;
  return Boolean(event && typeof event.id === "string" && typeof event.at === "number" && typeof event.title === "string" && typeof event.href === "string");
}

export function readFeed(role: SuiteRole): ActivityEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(feedKey(role));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter(isEvent).sort((a, b) => b.at - a.at);
    }
  } catch { /* fall through to a fresh seed */ }
  const seeded = materialise(role);
  writeFeed(role, seeded);
  return seeded.sort((a, b) => b.at - a.at);
}

function writeFeed(role: SuiteRole, events: ActivityEvent[]) {
  try {
    window.localStorage.setItem(feedKey(role), JSON.stringify(events.slice(0, MAX_EVENTS)));
    window.dispatchEvent(new CustomEvent(FEED_EVENT, { detail: role }));
  } catch { /* Storage is optional; the session keeps working without the shared feed. */ }
}

export type ActivityInput = {
  module: string;
  title: string;
  detail: string;
  href: string;
  tone?: ActivityTone;
  priority?: "normal" | "high" | "critical";
  /** Stable id — recording the same id twice updates the event instead of duplicating it. */
  id?: string;
};

export function recordActivity(role: SuiteRole, input: ActivityInput) {
  if (typeof window === "undefined") return;
  const current = readFeed(role);
  const event: ActivityEvent = {
    id: input.id ?? `evt-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
    at: Date.now(),
    module: input.module,
    title: input.title,
    detail: input.detail,
    href: input.href,
    tone: input.tone ?? "brand",
    priority: input.priority ?? "normal",
    read: false,
  };
  writeFeed(role, [event, ...current.filter((item) => item.id !== event.id)]);
}

export function timeAgo(at: number): string {
  const diff = Date.now() - at;
  if (diff < 90_000) return "Just now";
  if (diff < HOUR) return `${Math.round(diff / 60_000)}m ago`;
  if (diff < DAY) return `${Math.round(diff / HOUR)}h ago`;
  if (diff < 2 * DAY) return "Yesterday";
  if (diff < 8 * DAY) return `${Math.round(diff / DAY)} days ago`;
  return new Date(at).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

/** Live view over the role's feed — re-renders on any recordActivity call, including from other tabs. */
export function useActivityFeed(role: SuiteRole) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);

  useEffect(() => {
    setEvents(readFeed(role));
    const refresh = () => setEvents(readFeed(role));
    window.addEventListener(FEED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(FEED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [role]);

  const markRead = useCallback((id: string) => {
    writeFeed(role, readFeed(role).map((event) => (event.id === id ? { ...event, read: true } : event)));
  }, [role]);

  const markAllRead = useCallback(() => {
    writeFeed(role, readFeed(role).map((event) => ({ ...event, read: true })));
  }, [role]);

  const dismiss = useCallback((id: string) => {
    writeFeed(role, readFeed(role).filter((event) => event.id !== id));
  }, [role]);

  return { events, unread: events.filter((event) => !event.read).length, markRead, markAllRead, dismiss };
}
