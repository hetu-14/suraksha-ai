"use client";

// ---- Business impact propagation ----
// The single place that knows what every event means for the rest of the
// platform. Each handler fans one event out to: role notification feeds,
// canonical fact stores (health profile, TrustPoints ledger, live incident),
// KPI deltas, and the recommendation engine — then returns the list of
// modules it touched so the UI can show the propagation trace.

import { recordActivity, type SuiteRole, type ActivityInput } from "@/lib/activity";
import { writeLiveIncident } from "@/lib/ops";
import { healthProfileStorageKey, normalizeHealthProfile } from "@/lib/healthScore";
import { storageKey as trustKey, readTrustProfile, type Ledger } from "@/lib/trustPoints";
import { readStore, writeStore } from "./store";
import { updateFacts } from "./facts";
import { bumpKpis } from "./kpis";
import { addDynamicRecommendation, resolveRecommendation } from "./recommendations";
import type { PlatformEvent } from "./events";

const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

function notify(role: SuiteRole, input: ActivityInput) {
  recordActivity(role, input);
}

function patchHealthProfile(patch: Record<string, boolean>) {
  const current = normalizeHealthProfile(readStore<unknown>(healthProfileStorageKey, null));
  writeStore(healthProfileStorageKey, { ...current, ...patch });
}

/** Append a TrustPoints ledger row exactly once (id-deduplicated). */
function appendTrustLedger(row: Ledger) {
  const profile = readTrustProfile();
  if (profile.ledger.some((entry) => entry.id === row.id)) return false;
  writeStore(trustKey, { ...profile, ledger: [row, ...profile.ledger] });
  return true;
}

const str = (value: unknown, fallback = "") => (typeof value === "string" ? value : fallback);
const num = (value: unknown, fallback = 0) => (typeof value === "number" && Number.isFinite(value) ? value : fallback);

type EffectHandler = (event: PlatformEvent) => string[];

const EFFECTS: Record<PlatformEvent["type"], EffectHandler> = {
  // ── WhyMyBill / billing ──────────────────────────────────────
  BillAnalyzed: (event) => {
    const leakLevel = str(event.data.leakLevel, "none") as "none" | "watch" | "high";
    updateFacts({
      lastBillAnalysis: {
        billId: str(event.data.billId), cycle: str(event.data.cycle),
        verdict: str(event.data.verdict, "normal") as "normal" | "leak" | "under",
        leakLevel, leakPct: num(event.data.leakPct), amount: num(event.data.amount), at: event.at,
      },
    });
    const impact = ["Health Score", "Recommendations", "Dashboard"];
    if (leakLevel === "high") {
      notify("customer", { id: `leak-${str(event.data.billId)}`, module: "WhyMyBill", title: `Possible leak · ${num(event.data.leakPct)}% probability`, detail: `${str(event.data.cycle)} usage is far above your baseline. Book a free leak inspection now.`, href: "/customer/appointment?service=leak", tone: "red", priority: "critical" });
      notify("safety", { id: `leak-${str(event.data.billId)}`, module: "WhyMyBill", title: "Consumption-based leak signal · GJ-559210", detail: `Bill analytics flagged ${num(event.data.leakPct)}% leak probability at a Maninagar domestic connection.`, href: "/safety/sla-sentinel", tone: "red", priority: "high" });
      impact.push("Notifications", "Safety console");
    } else if (leakLevel === "watch") {
      notify("customer", { id: `leak-${str(event.data.billId)}`, module: "WhyMyBill", title: `Usage watch · leak risk ${num(event.data.leakPct)}%`, detail: `${str(event.data.cycle)} is above your normal range. A precautionary check is recommended.`, href: "/customer/appointment?service=leak", tone: "amber", priority: "high" });
      impact.push("Notifications");
    }
    return impact;
  },
  BillAlertsEnabled: () => {
    notify("customer", { module: "WhyMyBill", title: "Bill increase alerts enabled", detail: "You will be notified when a cycle deviates from your normal range · TrustPoints mission verified.", href: "/customer/explainbill" });
    return ["Notifications", "TrustPoints"];
  },
  SavingsPlanSaved: (event) => {
    notify("customer", { module: "WhyMyBill", title: "Savings plan saved", detail: str(event.data.detail, "Your usage-reduction plan is saved and tracked against the next cycle."), href: "/customer/explainbill" });
    return ["Notifications", "Dashboard"];
  },
  PaymentCompleted: (event) => {
    updateFacts((facts) => ({ paymentsRecorded: facts.paymentsRecorded + 1 }));
    notify("customer", { module: "Billing", title: `Payment of ${inr(num(event.data.amount))} recorded`, detail: `${str(event.data.cycle)} bill settled on time · payment reliability stays at 12 on-time bills.`, href: "/customer/explainbill" });
    resolveRecommendation("rec-clear-bill");
    return ["Notifications", "Health Score", "TrustPoints", "Recommendations", "Executive KPIs"];
  },

  // ── Appointments ─────────────────────────────────────────────
  AppointmentBooked: (event) => {
    const serviceId = str(event.data.serviceId);
    const impact = ["Notifications", "Dashboard", "Timeline"];
    notify("customer", { module: "Appointments", title: `${str(event.data.service)} booked`, detail: `${str(event.data.appointmentId)} · ${str(event.data.date)} · ${str(event.data.slot)} · ${str(event.data.engineer)}.`, href: "/customer/appointment" });
    if (serviceId === "inspection" || serviceId === "regulator") {
      patchHealthProfile({ preventiveInspectionBooked: true });
      bumpKpis({ inspectionsBooked: 1 });
      resolveRecommendation("rec-book-inspection");
      impact.push("Health Score", "TrustPoints", "Recommendations", "Executive KPIs");
    }
    if (serviceId === "leak") {
      resolveRecommendation("rec-leak-inspection");
      notify("safety", { module: "Appointments", title: "Leak inspection visit scheduled · GJ-559210", detail: `${str(event.data.engineer)} assigned for ${str(event.data.date)} · ${str(event.data.slot)} following a customer leak signal.`, href: "/safety/sla-sentinel", tone: "amber", priority: "high" });
      impact.push("Safety console", "Recommendations");
    }
    return impact;
  },
  AppointmentRescheduled: (event) => {
    notify("customer", { module: "Appointments", title: `${str(event.data.service)} rescheduled`, detail: `${str(event.data.appointmentId)} · ${str(event.data.date)} · ${str(event.data.slot)} · ${str(event.data.engineer)}.`, href: "/customer/appointment" });
    return ["Notifications", "Engineer schedule", "Timeline"];
  },
  AppointmentCancelled: (event) => {
    notify("customer", { module: "Appointments", title: `${str(event.data.service)} cancelled`, detail: `${str(event.data.appointmentId)} · ${str(event.data.reason)}. Book a new slot whenever you need one.`, href: "/customer/appointment", tone: "amber" });
    return ["Notifications", "Engineer schedule", "Timeline"];
  },
  AppointmentCompleted: (event) => {
    const serviceId = str(event.data.serviceId);
    const impact = ["Notifications", "Service history", "Timeline"];
    notify("customer", { module: "Appointments", title: `${str(event.data.service)} completed`, detail: `${str(event.data.appointmentId)} · ${str(event.data.engineer)} finished the visit. Your service report is ready in History.`, href: "/customer/appointment", tone: "brand" });
    if (serviceId === "inspection" || serviceId === "regulator") {
      const awarded = appendTrustLedger({ id: `visit-${str(event.data.appointmentId)}`, date: "Today", action: "Preventive inspection completed", points: 100, category: "Inspections" });
      if (awarded) {
        bumpKpis({ pointsAwarded: 100 });
        notify("customer", { module: "TrustPoints", title: "+100 points · inspection completed", detail: "Your completed safety visit was added to your safety ledger.", href: "/customer/trustpoints" });
      }
      notify("intelligence", { module: "Appointments", title: "Preventive inspection completed · GJ-559210", detail: "Completed field visit feeds the inspection-coverage KPI and the customer safety trend.", href: "/intelligence", tone: "brand" });
      impact.push("TrustPoints", "Health Score", "Executive KPIs");
    }
    return impact;
  },

  // ── Voice of Customer ────────────────────────────────────────
  ComplaintSubmitted: (event) => {
    const isSafety = event.data.safety === true;
    updateFacts((facts) => ({ complaintsSubmitted: facts.complaintsSubmitted + 1, safetyComplaintsOpen: facts.safetyComplaintsOpen + (isSafety ? 1 : 0) }));
    notify("customer", { module: "Voice of Customer", title: `Feedback ${str(event.data.complaintId)} submitted`, detail: `${str(event.data.category)} · assigned to ${str(event.data.owner)} · priority ${str(event.data.priority)}.`, href: "/customer/voice", tone: isSafety ? "red" : "brand", priority: isSafety ? "high" : "normal" });
    const impact = ["Notifications", "SLA Sentinel", "Timeline", "Dashboard"];
    if (isSafety) {
      notify("safety", { module: "Voice of Customer", title: `Safety-flagged feedback · ${str(event.data.complaintId)}`, detail: `Customer GJ-559210 reported: "${str(event.data.text).slice(0, 80)}" — routed to GasGuard Safety Team.`, href: "/safety/sla-sentinel", tone: "red", priority: "high" });
      impact.push("Safety console", "Recommendations");
    }
    return impact;
  },
  ComplaintReopened: (event) => {
    updateFacts((facts) => ({ complaintsReopened: facts.complaintsReopened + 1 }));
    notify("customer", { module: "Voice of Customer", title: `${str(event.data.complaintId)} reopened for review`, detail: "You marked this issue as unresolved — the Customer Resolution Team has been assigned.", href: "/customer/voice", tone: "amber", priority: "high" });
    notify("intelligence", { module: "Voice of Customer", title: `Satisfaction risk · ${str(event.data.complaintId)} reopened`, detail: "A closed complaint failed the customer recheck — counts against CSAT and raises compensation exposure if it ages.", href: "/intelligence/sla", tone: "amber", priority: "high" });
    addDynamicRecommendation({
      id: `rec-reopened-${str(event.data.complaintId)}`, role: "intelligence", module: "Voice of Customer",
      title: `Intervene on reopened complaint ${str(event.data.complaintId)}`,
      reason: "The customer marked this issue unresolved after closure — repeat failures drive churn and PNGRB escalations.",
      evidence: ["Post-resolution satisfaction: No", "Reassigned to the Customer Resolution Team", "Second failure would enter the grievance track"],
      confidence: 90, priority: "high",
      impacts: [{ label: "Customer impact", value: "At-risk household relationship" }, { label: "Business impact", value: "CSAT and SLA exposure" }],
      outcome: "Resolution owner intervenes before the PNGRB clock restarts.",
      action: { label: "Review SLA exposure", href: "/intelligence/sla" },
      entities: [{ type: "complaint", id: str(event.data.complaintId) }],
    });
    return ["Notifications", "Executive KPIs", "SLA Sentinel", "Recommendations"];
  },
  ComplaintEscalated: (event) => {
    const kind = str(event.data.kind);
    notify("customer", {
      module: "Voice of Customer",
      title: kind === "review" ? "Review requested" : kind === "callback" ? "Callback requested" : "Grievance raised",
      detail: kind === "review" ? "The Customer Resolution Team will reassess your feedback." : kind === "callback" ? "A customer-care specialist will contact you within one business day." : "Your grievance is tracked under the PNGRB consumer-protection timeline.",
      href: "/customer/voice", tone: "amber",
    });
    return ["Notifications", "SLA Sentinel", "Timeline"];
  },

  // ── GasGuard / emergencies ───────────────────────────────────
  EmergencyStarted: (event) => {
    const id = str(event.data.incidentId);
    writeLiveIncident({ id, source: "customer-app", area: str(event.data.area), address: str(event.data.address), type: str(event.data.type), risk: (str(event.data.risk, "High") as "Critical" | "High"), startedAt: event.at, status: "active" });
    updateFacts({ activeIncidentId: id, lastEmergencyType: str(event.data.type) });
    notify("customer", { id: `sos-${id}`, module: "GasGuard", title: `Emergency session started · ${str(event.data.type)}`, detail: `${id} · location shared, crew dispatch in progress. Follow the safety steps.`, href: "/customer/gascare", tone: "red", priority: "critical" });
    notify("safety", { id: `sos-${id}`, module: "Emergency", title: `Customer SOS · ${id} · ${str(event.data.type)}`, detail: `${str(event.data.address)}, ${str(event.data.area)} · ${str(event.data.risk)} risk · triaged via customer app.`, href: "/safety/emergency", tone: "red", priority: "critical" });
    return ["Notifications", "Emergency Dashboard", "Safety console", "Recommendations", "Timeline"];
  },
  EmergencyClosed: (event) => {
    const id = str(event.data.incidentId);
    writeLiveIncident({ id, source: "customer-app", area: str(event.data.area), address: str(event.data.address), type: str(event.data.type), risk: (str(event.data.risk, "High") as "Critical" | "High"), startedAt: event.at, status: "resolved" });
    updateFacts((facts) => ({ activeIncidentId: undefined, emergenciesClosed: facts.emergenciesClosed + 1, lastEmergencyClosedAt: event.at, lastEmergencyType: str(event.data.type) }));
    bumpKpis({ emergenciesResolved: 1 });
    resolveRecommendation(`rec-sos-${id}`);
    notify("customer", { id: `sos-${id}`, module: "GasGuard", title: "Emergency session closed", detail: `${id} · session ended. The incident report is available in GasGuard.`, href: "/customer/gascare", tone: "brand" });
    notify("safety", { id: `sos-${id}`, module: "Emergency", title: `Customer SOS resolved · ${id}`, detail: "Session closed from the customer app · incident record retained for review.", href: "/safety/emergency", tone: "brand" });
    notify("intelligence", { module: "Emergency", title: `Emergency ${id} closed`, detail: "Closure feeds the safety KPI trend · post-incident analysis is ready for review.", href: "/intelligence", tone: "brand" });
    addDynamicRecommendation({
      id: `rec-post-sos-${id}`, role: "customer", module: "GasGuard",
      title: "Book a post-incident safety inspection",
      reason: `After emergency ${id}, a professional check of the regulator and supply line closes the loop.`,
      evidence: [`Incident type: ${str(event.data.type)}`, "Root cause noted in the incident report", "Post-incident visits are free"],
      confidence: 95, priority: "high",
      impacts: [{ label: "Safety impact", value: "Confirms the premises are safe" }, { label: "Customer impact", value: "Free visit · restores Health Score" }],
      outcome: "Incident formally closed with a verified safe status.",
      action: { label: "Book the inspection", href: "/customer/appointment?service=leak" },
      entities: [{ type: "incident", id }],
    });
    return ["Notifications", "Emergency Dashboard", "Executive KPIs", "Health Score", "Recommendations", "Timeline"];
  },
  DrillCompleted: () => {
    patchHealthProfile({ safetySurveyComplete: true });
    resolveRecommendation("rec-complete-drill");
    notify("customer", { module: "GasGuard", title: "Emergency drill completed", detail: "Household rehearsal finished · your leak-safety mission is verified in TrustPoints.", href: "/customer/trustpoints" });
    return ["Notifications", "Health Score", "TrustPoints", "Safety Passport", "Recommendations"];
  },

  // ── Health / readiness ───────────────────────────────────────
  EmergencyContactVerified: () => {
    patchHealthProfile({ emergencyContactVerified: true });
    resolveRecommendation("rec-verify-contact");
    notify("customer", { module: "Health Score", title: "Emergency contact verified", detail: "Safety readiness +3 · your emergency profile is now complete.", href: "/customer/health" });
    return ["Notifications", "Health Score", "TrustPoints", "GasGuard readiness", "Recommendations"];
  },

  // ── My PNG Status ────────────────────────────────────────────
  DocumentUploaded: (event) => {
    updateFacts({ connectionDocsCleared: true });
    notify("customer", { module: "My PNG Status", title: "Layout approval uploaded", detail: `${str(event.data.fileName)} received for verification · meter installation can now be scheduled and the completion forecast improved to 26 July.`, href: "/customer/connection" });
    return ["Notifications", "Connection forecast", "Health Score", "Timeline"];
  },
  MobileVerified: () => {
    notify("customer", { module: "My PNG Status", title: "Mobile number verified", detail: "Installation updates will reach you by SMS at every stage.", href: "/customer/connection" });
    return ["Notifications", "Connection profile"];
  },
  SiteAccessScheduled: (event) => {
    notify("customer", { module: "My PNG Status", title: "Site access scheduled", detail: `Access confirmed for ${str(event.data.slot)} · the installation team has been informed.`, href: "/customer/connection" });
    return ["Notifications", "Connection forecast", "Health Score", "Engineer schedule"];
  },
  ConnectionQueryRaised: (event) => {
    const callback = event.data.kind === "callback";
    notify("customer", { module: "My PNG Status", title: callback ? "Callback requested" : "Connection query raised", detail: callback ? "A connection coordinator will contact you within one business day." : "Your query is tracked here and answered by SMS.", href: "/customer/connection", tone: "amber" });
    return ["Notifications", "Connection updates"];
  },

  // ── TrustPoints ──────────────────────────────────────────────
  TrustPointsAwarded: (event) => {
    bumpKpis({ pointsAwarded: num(event.data.points) });
    notify("customer", { id: event.data.notifyId ? String(event.data.notifyId) : undefined, module: "TrustPoints", title: `+${num(event.data.points)} points · ${str(event.data.action)}`, detail: str(event.data.detail, "Added to your safety ledger."), href: "/customer/trustpoints" });
    return ["Notifications", "TrustPoints", "Dashboard", "Executive KPIs"];
  },
  RewardRedeemed: (event) => {
    notify("customer", { module: "TrustPoints", title: `Reward requested · ${str(event.data.reward)}`, detail: `${str(event.data.requestId)} · ${num(event.data.points)} points redeemed. Our team will confirm fulfilment.`, href: "/customer/trustpoints" });
    if (event.data.rewardId === "annual") resolveRecommendation("rec-redeem-inspection");
    return ["Notifications", "TrustPoints", "Recommendations"];
  },

  // ── Safety & intelligence operations ─────────────────────────
  SlaEscalated: (event) => {
    resolveRecommendation(`rec-sla-${str(event.data.ticketId)}`);
    notify("safety", { module: "SLA Sentinel", title: `${str(event.data.ticketId)} escalated to ${str(event.data.crew)}`, detail: `${str(event.data.type)} · ${str(event.data.area)} · breach risk reduced to 22% after priority routing.`, href: "/safety/sla-sentinel", tone: "amber" });
    return ["Notifications", "SLA queue", "Recommendations", "Timeline"];
  },
  SlaResolved: (event) => {
    const compensation = num(event.data.compensation);
    bumpKpis({ breachesPrevented: 1, compensationAvoided: compensation, complaintsResolved: 1 });
    resolveRecommendation(`rec-sla-${str(event.data.ticketId)}`);
    notify("safety", { module: "SLA Sentinel", title: `${str(event.data.ticketId)} resolved within SLA`, detail: `${str(event.data.type)} · ${str(event.data.area)} · outcome recorded for PNGRB compliance.`, href: "/safety/sla-sentinel", tone: "brand" });
    notify("intelligence", { module: "SLA Sentinel", title: `Breach prevented · ${str(event.data.ticketId)}`, detail: `${str(event.data.type)} in ${str(event.data.area)} closed before the ${str(event.data.cat)} deadline${compensation ? ` — ${inr(compensation)} compensation avoided` : ""}.`, href: "/intelligence/sla", tone: "brand" });
    return ["Notifications", "Executive KPIs", "SLA queue", "Recommendations", "Timeline"];
  },
  NoticeSent: (event) => {
    bumpKpis({ noticesSent: 1, customersNotified: num(event.data.customers) });
    notify("safety", { module: "Auto-Notify", title: `48-hour notice sent · ${str(event.data.zone)}`, detail: `${num(event.data.customers).toLocaleString("en-IN")} customers notified via ${str(event.data.channel)}; delivery proof stored for the PNGRB audit log.`, href: "/safety/smartnotify", tone: "brand" });
    notify("intelligence", { module: "Auto-Notify", title: `Interruption notice logged · ${str(event.data.zone)}`, detail: `${num(event.data.customers).toLocaleString("en-IN")} customers received the mandated 48-hour advance notice — compliance evidence recorded.`, href: "/intelligence", tone: "brand" });
    return ["Notifications", "Compliance log", "Executive KPIs", "Timeline"];
  },
  CrewDispatched: (event) => {
    bumpKpis({ crewsDispatched: 1 });
    const fromGrid = event.data.source === "gas-guard";
    notify("safety", {
      module: fromGrid ? "Gas-Guard" : "Emergency",
      title: fromGrid ? `Field crew dispatched · ${str(event.data.caseId)}` : `Crew ${str(event.data.crew)} dispatched · ${str(event.data.caseId)}`,
      detail: fromGrid ? "Crew en route to the affected zone; incident remains open until closure." : "Manual dispatch from the emergency dashboard; case stays open until field closure.",
      href: fromGrid ? "/safety/dashboard-gas-guard" : "/safety/emergency", tone: "amber", priority: "high",
    });
    return ["Notifications", "Crew roster", "Incident queue", "Timeline"];
  },
  IncidentResolved: (event) => {
    bumpKpis({ emergenciesResolved: 1 });
    const fromGrid = event.data.source === "gas-guard";
    notify("safety", { module: fromGrid ? "Gas-Guard" : "Emergency", title: fromGrid ? `Incident ${str(event.data.caseId)} resolved` : `Case ${str(event.data.caseId)} resolved`, detail: fromGrid ? "Zone telemetry back in range; closure recorded in the incident history." : "Field closure confirmed; the incident record is retained for review.", href: fromGrid ? "/safety/dashboard-gas-guard" : "/safety/emergency", tone: "brand" });
    if (!fromGrid) notify("intelligence", { module: "Emergency", title: `Emergency case ${str(event.data.caseId)} closed`, detail: "Response completed by the control room — closure feeds the safety KPI trend.", href: "/intelligence", tone: "brand" });
    return ["Notifications", "Incident queue", "Executive KPIs", "Timeline"];
  },
  ZoneIsolated: (event) => {
    notify("safety", { module: "Gas-Guard", title: `${str(event.data.zone)} isolated`, detail: "Emergency isolation valve closed — gas flow stopped and field action flagged.", href: "/safety/dashboard-gas-guard", tone: "red", priority: "critical" });
    notify("intelligence", { module: "Gas-Guard", title: `Supply isolated · ${str(event.data.zone)}`, detail: "An isolation affects the 99.97% uptime KPI and may trigger 48-hour notice obligations if prolonged.", href: "/intelligence/command", tone: "amber", priority: "high" });
    return ["Notifications", "Command Center", "Executive KPIs", "Auto-Notify", "Timeline"];
  },
  ZoneRestored: (event) => {
    notify("safety", { module: "Gas-Guard", title: `${str(event.data.zone)} restored`, detail: "Isolation lifted; the zone has returned to monitored operation.", href: "/safety/dashboard-gas-guard", tone: "brand" });
    return ["Notifications", "Command Center", "Timeline"];
  },
  RevenueCaseAdvanced: (event) => {
    const stage = str(event.data.stage);
    const impact = ["Notifications", "Investigation queue", "Timeline"];
    notify("safety", { module: "Rev-Guard", title: `${str(event.data.caseId)} moved to ${stage}`, detail: `${str(event.data.consumer)} · ${str(event.data.area)} · ${str(event.data.type)} · exposure ${inr(num(event.data.loss))}.`, href: "/safety/rev-guard", tone: stage === "Recovered" ? "brand" : "amber" });
    if (stage === "Recovered") {
      bumpKpis({ revenueRecovered: num(event.data.loss) });
      notify("intelligence", { module: "Revenue Guard", title: `${inr(num(event.data.loss))} recovered · ${str(event.data.caseId)}`, detail: `${str(event.data.type)} case in ${str(event.data.area)} closed with recovery recorded — monthly recovered total updated.`, href: "/intelligence/revenue-guard", tone: "brand" });
      impact.push("Executive KPIs", "Revenue analytics");
    }
    return impact;
  },
  InsightActioned: (event) => {
    const approved = event.data.status === "approved";
    if (approved) bumpKpis({ insightsActioned: 1 });
    notify("intelligence", { module: "Operational Insights", title: `${str(event.data.insightId)} ${approved ? "approved" : "deferred"}`, detail: approved ? `Work order routed to ${str(event.data.owner)} for execution.` : "Will resurface in next week's briefing with refreshed data.", href: "/intelligence/insights", tone: approved ? "brand" : "amber" });
    return ["Notifications", "Executive KPIs", "Timeline"];
  },
};

/** Run every downstream effect for one event; returns the propagation trace. */
export function runEffects(event: PlatformEvent): string[] {
  try {
    const impact = EFFECTS[event.type]?.(event) ?? [];
    return [...new Set([...impact, "Unified timeline", "Global search"])];
  } catch {
    return ["Unified timeline"];
  }
}
