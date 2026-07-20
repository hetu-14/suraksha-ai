"use client";

// ---- Shared platform context ----
// One snapshot of everything the platform knows about the current customer
// and the live operational state. The recommendation engine derives from it,
// dashboards read it, and every AI surface (BillAssistant, EmergencyChat)
// answers with it instead of answering in isolation.

import { currentCustomer } from "@/lib/data";
import { readAppointments, type Appointment } from "@/lib/appointments";
import { buildHealthFactors, emptyHealthProfile, healthProfileStorageKey, normalizeHealthProfile, overallHealthScore, type HealthProfile } from "@/lib/healthScore";
import { connectionForecast, connectionStorageKey, emptyConnectionStatus, normalizeConnectionStatus, type ConnectionStatusRecord } from "@/lib/connectionStatus";
import { computeTier, ledgerPoints, readTrustProfile, type TrustProfileRecord } from "@/lib/trustPoints";
import { readLiveIncident, type LiveIncident } from "@/lib/ops";
import { readFacts, type PlatformFacts } from "./facts";
import { readStore, usePlatformDerived } from "./store";

export type PlatformContext = {
  customer: { id: string; name: string; firstName: string; area: string; type: string };
  healthProfile: HealthProfile;
  healthScore: number;
  connection: ConnectionStatusRecord;
  connectionForecastDate: string;
  connectionBlocked: boolean;
  appointments: Appointment[];
  nextVisit?: Appointment;
  trust: TrustProfileRecord;
  trustPoints: number;
  tierName: string;
  billDue: { cycle: string; amount: number } | null;
  billCleared: boolean;
  openComplaints: number;
  liveIncident: LiveIncident | null;
  facts: PlatformFacts;
};

type VoiceStore = { feedback?: { id: string; status: string }[] };

export function readPlatformContext(): PlatformContext {
  const healthProfile = typeof window === "undefined"
    ? emptyHealthProfile
    : normalizeHealthProfile(readStore<unknown>(healthProfileStorageKey, null));
  const connection = typeof window === "undefined"
    ? emptyConnectionStatus
    : normalizeConnectionStatus(readStore<unknown>(connectionStorageKey, null));
  const appointments = readAppointments();
  const trust = readTrustProfile();
  const trustPoints = ledgerPoints(trust.ledger);
  const facts = readFacts();
  const dueBill = currentCustomer.bills.find((bill) => bill.status === "Due");
  const billCleared = Boolean(readStore<{ billCleared?: boolean }>("suraksha-customer-dashboard", {}).billCleared);
  const voice = readStore<VoiceStore>("suraksha:voice-feedback:GJ-559210", {});
  const openComplaints = Array.isArray(voice.feedback)
    ? voice.feedback.filter((item) => ["Received", "Under Review", "Assigned"].includes(item.status)).length
    : 1;
  const forecast = connectionForecast(connection);

  return {
    customer: {
      id: currentCustomer.id,
      name: currentCustomer.name,
      firstName: currentCustomer.name.split(" ")[0],
      area: currentCustomer.area,
      type: currentCustomer.type,
    },
    healthProfile,
    healthScore: overallHealthScore(buildHealthFactors(healthProfile, connection)),
    connection,
    connectionForecastDate: forecast.date,
    connectionBlocked: !connection.layout,
    appointments,
    nextVisit: appointments.find((item) => item.status !== "Cancelled" && item.status !== "Completed"),
    trust,
    trustPoints,
    tierName: computeTier(trustPoints).tier.name,
    billDue: dueBill && !billCleared ? { cycle: dueBill.cycle, amount: dueBill.amount } : null,
    billCleared,
    openComplaints,
    liveIncident: readLiveIncident(),
    facts,
  };
}

/** Live platform context — re-renders on any platform change. */
export function usePlatformContext(): PlatformContext | null {
  return usePlatformDerived<PlatformContext | null>(readPlatformContext, null);
}

/** One-line situational summary an AI surface can ground its replies in. */
export function describePlatformContext(context: PlatformContext): string {
  const parts = [
    `Customer ${context.customer.name} (${context.customer.id}) in ${context.customer.area}`,
    `health score ${context.healthScore}/100`,
    context.healthProfile.emergencyContactVerified ? "emergency contact verified" : "emergency contact NOT verified",
    context.nextVisit ? `next visit ${context.nextVisit.service} on ${context.nextVisit.date}` : "no visit scheduled",
    context.billDue ? `bill of ₹${context.billDue.amount.toLocaleString("en-IN")} due` : "no bill pending",
    `${context.trustPoints.toLocaleString("en-IN")} TrustPoints (${context.tierName})`,
  ];
  if (context.liveIncident?.status === "active") parts.push(`ACTIVE EMERGENCY ${context.liveIncident.id}`);
  if (context.facts.lastBillAnalysis && context.facts.lastBillAnalysis.leakLevel !== "none") {
    parts.push(`leak risk ${context.facts.lastBillAnalysis.leakPct}% on ${context.facts.lastBillAnalysis.cycle}`);
  }
  return parts.join(" · ");
}
