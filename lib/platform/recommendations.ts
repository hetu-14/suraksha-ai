"use client";

// ---- Cross-module recommendation engine ----
// Recommendations come from two sources and one lifecycle:
//   1. Derived — recomputed from the live platform context on every read
//      (verify contact, book inspection, leak follow-up, clear bill …).
//   2. Dynamic — pushed by the effect engine when an event warrants one
//      (post-incident review, reopened-complaint satisfaction risk …).
// A shared status ledger (dismissed / snoozed / completed) applies to both, and
// the effect engine auto-completes a recommendation when the underlying action
// actually happens anywhere in the platform.

import type { SuiteRole } from "@/lib/activity";
import { revCases, slaTickets, inr } from "@/lib/ops";
import type { EntityRef } from "./events";
import { readPlatformContext, type PlatformContext } from "./context";
import { readStore, writeStore, usePlatformDerived } from "./store";
import { useCallback } from "react";

export type RecommendationPriority = "critical" | "high" | "medium" | "low";

export type Recommendation = {
  id: string;
  role: SuiteRole;
  module: string;
  title: string;
  reason: string;
  evidence: string[];
  confidence: number; // %
  priority: RecommendationPriority;
  /** Business / customer / safety / financial impact statements. */
  impacts: { label: string; value: string }[];
  outcome: string;
  action: { label: string; href: string };
  entities?: EntityRef[];
};

type RecommendationState = { state: "dismissed" | "snoozed" | "completed"; at: number; until?: number };
type RecommendationStore = { dynamic: Recommendation[]; states: Record<string, RecommendationState> };

const REC_KEY = "suraksha:platform:recommendations";
const SNOOZE_MS = 4 * 3_600_000;

function readRecStore(): RecommendationStore {
  const store = readStore<Partial<RecommendationStore>>(REC_KEY, {});
  return { dynamic: Array.isArray(store.dynamic) ? store.dynamic : [], states: store.states && typeof store.states === "object" ? store.states : {} };
}

/** Effect engine: push an event-driven recommendation (same id updates in place). */
export function addDynamicRecommendation(rec: Recommendation) {
  const store = readRecStore();
  writeStore(REC_KEY, { ...store, dynamic: [rec, ...store.dynamic.filter((item) => item.id !== rec.id)].slice(0, 24) });
}

/** Effect engine: the recommended action happened somewhere — close the loop. */
export function resolveRecommendation(id: string) {
  const store = readRecStore();
  writeStore(REC_KEY, { ...store, states: { ...store.states, [id]: { state: "completed", at: Date.now() } } });
}

export function setRecommendationState(id: string, state: "dismissed" | "snoozed" | "completed") {
  const store = readRecStore();
  writeStore(REC_KEY, {
    ...store,
    states: { ...store.states, [id]: { state, at: Date.now(), until: state === "snoozed" ? Date.now() + SNOOZE_MS : undefined } },
  });
}

const PRIORITY_ORDER: RecommendationPriority[] = ["critical", "high", "medium", "low"];

function deriveRecommendations(context: PlatformContext): Recommendation[] {
  const recs: Recommendation[] = [];
  const analysis = context.facts.lastBillAnalysis;

  // — Customer —
  if (analysis && analysis.leakLevel !== "none" && analysis.verdict !== "under") {
    const high = analysis.leakLevel === "high";
    recs.push({
      id: "rec-leak-inspection", role: "customer", module: "WhyMyBill",
      title: high ? "Book a leak inspection now" : "Book a precautionary leak check",
      reason: `Your ${analysis.cycle} bill analysis put leak probability at ${analysis.leakPct}%.`,
      evidence: [`Leak model score ${analysis.leakPct}% (${analysis.leakLevel})`, `Bill ${inr(analysis.amount)} deviates from your personal baseline`, "Usage-while-away and seasonal checks factored in"],
      confidence: Math.max(70, analysis.leakPct), priority: high ? "critical" : "high",
      impacts: [{ label: "Safety impact", value: high ? "Possible in-premise leak" : "Early leak signal" }, { label: "Customer impact", value: "Free safety visit, covered by Torrent Gas" }],
      outcome: "Leak ruled out or isolated within one visit; Health Score usage risk restored.",
      action: { label: "Book leak inspection", href: "/customer/appointment?service=leak" },
      entities: [{ type: "bill", id: analysis.billId, label: analysis.cycle }, { type: "customer", id: context.customer.id }],
    });
  }
  if (!context.healthProfile.emergencyContactVerified) {
    recs.push({
      id: "rec-verify-contact", role: "customer", module: "Health Score",
      title: "Verify your emergency contact",
      reason: "GasGuard cannot notify your household during an emergency until a contact is verified.",
      evidence: ["Emergency profile incomplete in Safety Passport", "Readiness factor is capped at 60/100 without it"],
      confidence: 98, priority: "high",
      impacts: [{ label: "Safety impact", value: "Faster emergency response for your household" }, { label: "Customer impact", value: "+3 safety readiness · +50 TrustPoints" }],
      outcome: "Emergency profile complete; readiness and TrustPoints update instantly.",
      action: { label: "Verify contact", href: "/customer/health" },
      entities: [{ type: "customer", id: context.customer.id }],
    });
  }
  if (!context.healthProfile.preventiveInspectionBooked) {
    recs.push({
      id: "rec-book-inspection", role: "customer", module: "Health Score",
      title: "Schedule your preventive inspection",
      reason: "Your kitchen regulator was last checked 14 months ago; equipment health sits at 78/100.",
      evidence: ["Equipment health factor 78/100 (weight 25%)", "Annual inspection window closes in 45 days", "Visit is free — covered service"],
      confidence: 94, priority: "medium",
      impacts: [{ label: "Safety impact", value: "Regulator and line verified" }, { label: "Customer impact", value: "+12 equipment health · +200 TrustPoints" }],
      outcome: "Equipment health rises to 90/100 once the visit completes.",
      action: { label: "Book inspection", href: "/customer/appointment?service=inspection" },
    });
  }
  if (context.billDue) {
    recs.push({
      id: "rec-clear-bill", role: "customer", module: "Billing",
      title: `Clear your ${context.billDue.cycle} bill`,
      reason: `${inr(context.billDue.amount)} is due in 4 days; paying on time protects your payment-reliability score.`,
      evidence: ["12 consecutive on-time payments so far", "Late fee applies after the due date"],
      confidence: 99, priority: "medium",
      impacts: [{ label: "Customer impact", value: "Payment reliability stays at 88/100" }, { label: "Financial impact", value: "Avoids the late fee" }],
      outcome: "Payment recorded across Billing, Health Score, and TrustPoints.",
      action: { label: "Review & pay", href: "/customer/explainbill" },
    });
  }
  if (!context.healthProfile.safetySurveyComplete) {
    recs.push({
      id: "rec-complete-drill", role: "customer", module: "GasGuard",
      title: "Run the household emergency drill",
      reason: "A 5-minute rehearsal makes a real emergency response dramatically calmer.",
      evidence: ["Safety training incomplete in your passport", "Verifies your leak-safety TrustPoints mission"],
      confidence: 90, priority: "medium",
      impacts: [{ label: "Safety impact", value: "Household knows the exit plan" }, { label: "Customer impact", value: "+100 TrustPoints mission verified" }],
      outcome: "Safety passport training complete; Health Score safety factor rises.",
      action: { label: "Start the drill", href: "/customer/gascare" },
    });
  }
  if (context.trustPoints >= 400 && !context.trust.redeemed.includes("annual")) {
    recs.push({
      id: "rec-redeem-inspection", role: "customer", module: "TrustPoints",
      title: "Use your points for a free annual inspection",
      reason: `You have ${context.trustPoints.toLocaleString("en-IN")} TrustPoints — enough for the highest-value safety reward.`,
      evidence: [`Balance ${context.trustPoints.toLocaleString("en-IN")} ≥ 400 required`, "Safety rewards outrank service rewards for your profile"],
      confidence: 82, priority: "low",
      impacts: [{ label: "Customer impact", value: "₹0 inspection visit" }, { label: "Safety impact", value: "Keeps your inspection cadence annual" }],
      outcome: "Reward requested; fulfilment tracked in TrustPoints.",
      action: { label: "Open rewards", href: "/customer/trustpoints" },
    });
  }

  // — Safety & Operations —
  if (context.liveIncident?.status === "active") {
    recs.push({
      id: `rec-sos-${context.liveIncident.id}`, role: "safety", module: "Emergency",
      title: `Dispatch a crew to ${context.liveIncident.id}`,
      reason: `Live customer SOS (${context.liveIncident.type}) at ${context.liveIncident.address}, ${context.liveIncident.area}.`,
      evidence: ["Triaged through the customer app voice assistant", `${context.liveIncident.risk} risk classification`, "Caller is following guided safety steps"],
      confidence: 99, priority: "critical",
      impacts: [{ label: "Safety impact", value: "Life-safety response" }, { label: "Business impact", value: "PNGRB 24h emergency clock is running" }],
      outcome: "Crew on site inside the response window; incident closed with an auditable trail.",
      action: { label: "Open Emergency Dashboard", href: "/safety/emergency" },
      entities: [{ type: "incident", id: context.liveIncident.id }],
    });
  }
  const breached = slaTickets.find((ticket) => ticket.status === "Breached");
  if (breached) {
    recs.push({
      id: `rec-sla-${breached.id}`, role: "safety", module: "SLA Sentinel",
      title: `Escalate ${breached.id} — already breached`,
      reason: `${breached.type} in ${breached.area} has passed its ${breached.cat} PNGRB deadline; the compensation window is open.`,
      evidence: breached.reasons,
      confidence: breached.risk, priority: "critical",
      impacts: [{ label: "Financial impact", value: "Compensation payout is now accruing" }, { label: "Customer impact", value: `${breached.consumer} unresolved` }],
      outcome: "Priority crew assigned; payout exposure capped and closure recorded for the regulator.",
      action: { label: "Open the ticket", href: "/safety/sla-sentinel" },
      entities: [{ type: "slaTicket", id: breached.id }],
    });
  }
  if (context.facts.safetyComplaintsOpen > 0) {
    recs.push({
      id: "rec-safety-complaint", role: "safety", module: "Voice of Customer",
      title: "Review the safety-flagged customer feedback",
      reason: "A customer report matched leak/smell language and was auto-routed to the GasGuard Safety Team.",
      evidence: ["Keyword triage matched a safety pattern", "Reporter is a verified PNG customer", "24-hour PNGRB class applies if confirmed"],
      confidence: 92, priority: "high",
      impacts: [{ label: "Safety impact", value: "Possible unreported leak" }, { label: "Business impact", value: "Starts inside the SLA window, not after" }],
      outcome: "Feedback triaged into an inspection or an emergency case within the hour.",
      action: { label: "Open SLA queue", href: "/safety/sla-sentinel" },
    });
  }

  // — Business Intelligence —
  const openHighCases = revCases.filter((item) => item.severity === "High" && item.stage !== "Recovered");
  if (openHighCases.length) {
    const exposure = openHighCases.reduce((sum, item) => sum + item.loss, 0);
    recs.push({
      id: "rec-rev-followup", role: "intelligence", module: "Revenue Guard",
      title: `Dispatch inspections for ${openHighCases.length} high-severity revenue cases`,
      reason: `${openHighCases.map((item) => item.id).join(", ")} carry ${inr(exposure)}/month of open exposure.`,
      evidence: openHighCases.map((item) => `${item.id} · ${item.type} in ${item.area} · score ${item.score}`),
      confidence: 91, priority: "high",
      impacts: [{ label: "Financial impact", value: `${inr(exposure)}/month recoverable` }, { label: "Business impact", value: "Model precision 91% on validated alerts" }],
      outcome: "Field evidence collected this week; recovery recorded against the ₹27.3L flagged pool.",
      action: { label: "Open Revenue Guard", href: "/intelligence/revenue-guard" },
      entities: openHighCases.map((item) => ({ type: "revenueCase" as const, id: item.id })),
    });
  }
  if (context.facts.emergenciesClosed >= 1) {
    recs.push({
      id: "rec-post-incident-review", role: "intelligence", module: "Emergency",
      title: "Review the post-incident analysis",
      reason: `${context.facts.emergenciesClosed} customer emergency session${context.facts.emergenciesClosed > 1 ? "s" : ""} closed recently — the debrief affects the safety KPI trend.`,
      evidence: ["Closure recorded from the customer app", context.facts.lastEmergencyType ? `Latest type: ${context.facts.lastEmergencyType}` : "Incident record retained", "Root-cause noted in the GasGuard report"],
      confidence: 88, priority: "medium",
      impacts: [{ label: "Business impact", value: "Feeds the executive safety trend" }, { label: "Safety impact", value: "Repeat-incident prevention" }],
      outcome: "Learning logged; repeated patterns trigger an executive review automatically.",
      action: { label: "Open executive view", href: "/intelligence" },
    });
  }
  return recs;
}

/** All live recommendations for a role, statuses applied, priority-ordered. */
export function getRecommendations(role: SuiteRole): Recommendation[] {
  const context = readPlatformContext();
  const store = readRecStore();
  const now = Date.now();
  return [...store.dynamic, ...deriveRecommendations(context)]
    .filter((rec) => rec.role === role)
    .filter((rec) => {
      const state = store.states[rec.id];
      if (!state) return true;
      if (state.state === "snoozed") return (state.until ?? 0) < now;
      return false;
    })
    .filter((rec, index, list) => list.findIndex((item) => item.id === rec.id) === index)
    .sort((a, b) => PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority));
}

/** Live recommendations with the user-facing lifecycle actions. */
export function useRecommendations(role: SuiteRole) {
  const recommendations = usePlatformDerived(useCallback(() => getRecommendations(role), [role]), []);
  const dismiss = useCallback((id: string) => setRecommendationState(id, "dismissed"), []);
  const snooze = useCallback((id: string) => setRecommendationState(id, "snoozed"), []);
  const complete = useCallback((id: string) => setRecommendationState(id, "completed"), []);
  return { recommendations, dismiss, snooze, complete };
}
