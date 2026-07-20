"use client";

// ---- Canonical cross-module facts ----
// Facts that no single feature store owns but many modules consume: the last
// bill analysis (WhyMyBill → Health Score, Appointments, GasGuard), emergency
// history (GasGuard → Executive KPIs, Recommendations), and running counters.
// Only the effect engine writes here; everything else reads.

import { readStore, writeStore } from "./store";

export type BillAnalysisFact = {
  billId: string;
  cycle: string;
  verdict: "normal" | "leak" | "under";
  leakLevel: "none" | "watch" | "high";
  leakPct: number;
  amount: number;
  at: number;
};

export type PlatformFacts = {
  lastBillAnalysis?: BillAnalysisFact;
  activeIncidentId?: string;
  lastEmergencyType?: string;
  lastEmergencyClosedAt?: number;
  emergenciesClosed: number;
  drillCompletedAt?: number;
  paymentsRecorded: number;
  complaintsSubmitted: number;
  complaintsReopened: number;
  safetyComplaintsOpen: number;
  connectionDocsCleared: boolean;
};

const FACTS_KEY = "suraksha:platform:facts";

export const emptyFacts: PlatformFacts = {
  emergenciesClosed: 0,
  paymentsRecorded: 0,
  complaintsSubmitted: 0,
  complaintsReopened: 0,
  safetyComplaintsOpen: 0,
  connectionDocsCleared: false,
};

export function readFacts(): PlatformFacts {
  return { ...emptyFacts, ...readStore<Partial<PlatformFacts>>(FACTS_KEY, {}) };
}

export function updateFacts(update: Partial<PlatformFacts> | ((current: PlatformFacts) => Partial<PlatformFacts>)) {
  const current = readFacts();
  const patch = typeof update === "function" ? update(current) : update;
  writeStore(FACTS_KEY, { ...current, ...patch });
}
