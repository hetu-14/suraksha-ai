"use client";

// ---- Unified platform timeline ----
// One chronological record across all three suites: a projection of the
// platform event log on top of a seeded operational history. Every item knows
// its category, source module, related entities, outcome, and where to act.

import { useCallback } from "react";
import { readEventLog, type PlatformEvent, type PlatformEventType, type EntityRef } from "./events";
import { usePlatformDerived } from "./store";

export type TimelineCategory = "Billing" | "Safety" | "Emergency" | "Service" | "Connection" | "Rewards" | "Compliance" | "Revenue" | "Network" | "Insight";

export type TimelineItem = {
  id: string;
  at: number;
  category: TimelineCategory;
  module: string;
  title: string;
  detail: string;
  entities: EntityRef[];
  href: string;
  /** Which modules the platform updated in response. */
  impact: string[];
};

const CATEGORY: Record<PlatformEventType, TimelineCategory> = {
  BillAnalyzed: "Billing", BillAlertsEnabled: "Billing", SavingsPlanSaved: "Billing", PaymentCompleted: "Billing",
  AppointmentBooked: "Service", AppointmentRescheduled: "Service", AppointmentCancelled: "Service", AppointmentCompleted: "Service",
  ComplaintSubmitted: "Service", ComplaintReopened: "Service", ComplaintEscalated: "Service",
  EmergencyStarted: "Emergency", EmergencyClosed: "Emergency", DrillCompleted: "Safety",
  EmergencyContactVerified: "Safety",
  DocumentUploaded: "Connection", MobileVerified: "Connection", SiteAccessScheduled: "Connection", ConnectionQueryRaised: "Connection",
  TrustPointsAwarded: "Rewards", RewardRedeemed: "Rewards",
  SlaEscalated: "Compliance", SlaResolved: "Compliance", NoticeSent: "Compliance",
  CrewDispatched: "Emergency", IncidentResolved: "Emergency", ZoneIsolated: "Network", ZoneRestored: "Network",
  RevenueCaseAdvanced: "Revenue", InsightActioned: "Insight",
};

const HREF: Record<TimelineCategory, string> = {
  Billing: "/customer/explainbill", Safety: "/customer/health", Emergency: "/safety/emergency",
  Service: "/customer/appointment", Connection: "/customer/connection", Rewards: "/customer/trustpoints",
  Compliance: "/safety/sla-sentinel", Revenue: "/safety/rev-guard", Network: "/safety/dashboard-gas-guard",
  Insight: "/intelligence/insights",
};

const HOUR = 3_600_000;

function seededHistory(now: number): TimelineItem[] {
  return [
    { id: "tl-seed-survey", at: now - 2 * HOUR, category: "Connection", module: "My PNG Status", title: "Site survey completed", detail: "Application GJ-559210 moved to meter installation.", entities: [{ type: "connection", id: "CONN-GJ-559210" }], href: "/customer/connection", impact: ["Connection forecast", "Health Score"] },
    { id: "tl-seed-rev", at: now - 26 * HOUR, category: "Revenue", module: "Revenue Guard", title: "RG-0912 recovery recorded", detail: "Meter bypass in Gota closed · ₹5,600 recovered after meter replacement.", entities: [{ type: "revenueCase", id: "RG-0912" }], href: "/safety/rev-guard", impact: ["Executive KPIs"] },
    { id: "tl-seed-sla", at: now - 30 * HOUR, category: "Compliance", module: "SLA Sentinel", title: "T-7699 met on time", detail: "Meter relocation in Vatva closed inside the 7-day class.", entities: [{ type: "slaTicket", id: "T-7699" }], href: "/safety/sla-sentinel", impact: ["Executive KPIs"] },
    { id: "tl-seed-training", at: now - 48 * HOUR, category: "Rewards", module: "TrustPoints", title: "Leak safety training completed", detail: "+100 TrustPoints added to the customer safety ledger.", entities: [{ type: "customer", id: "GJ-559210" }], href: "/customer/trustpoints", impact: ["Health Score", "TrustPoints"] },
  ];
}

function fromEvent(event: PlatformEvent): TimelineItem {
  const category = CATEGORY[event.type] ?? "Service";
  return {
    id: event.id, at: event.at, category, module: event.module,
    title: event.summary,
    detail: event.impact.filter((module) => module !== "Unified timeline" && module !== "Global search").slice(0, 4).join(" · "),
    entities: event.entities, href: HREF[category], impact: event.impact,
  };
}

export function readPlatformTimeline(): TimelineItem[] {
  const events = readEventLog().map(fromEvent);
  return [...events, ...seededHistory(Date.now())].sort((a, b) => b.at - a.at).slice(0, 60);
}

/** Live unified timeline across every suite. */
export function usePlatformTimeline(): TimelineItem[] {
  return usePlatformDerived(useCallback(readPlatformTimeline, []), []);
}
