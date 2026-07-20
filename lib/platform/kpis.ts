"use client";

// ---- KPI propagation ----
// Executive and operational KPIs are the ops baselines (lib/ops.ts) plus live
// deltas accumulated by the effect engine. A breach prevented in the safety
// console moves the compensation-avoided number on the intelligence dashboard
// without either page knowing about the other.

import { slaMetrics, revMetrics } from "@/lib/ops";
import { readStore, writeStore, usePlatformDerived } from "./store";

export type KpiDeltas = {
  breachesPrevented: number;
  compensationAvoided: number; // ₹
  revenueRecovered: number; // ₹
  noticesSent: number;
  customersNotified: number;
  emergenciesResolved: number;
  crewsDispatched: number;
  inspectionsBooked: number;
  complaintsResolved: number;
  insightsActioned: number;
  pointsAwarded: number;
};

const KPI_KEY = "suraksha:platform:kpis";

const zeroDeltas: KpiDeltas = {
  breachesPrevented: 0, compensationAvoided: 0, revenueRecovered: 0,
  noticesSent: 0, customersNotified: 0, emergenciesResolved: 0,
  crewsDispatched: 0, inspectionsBooked: 0, complaintsResolved: 0,
  insightsActioned: 0, pointsAwarded: 0,
};

export function readKpiDeltas(): KpiDeltas {
  return { ...zeroDeltas, ...readStore<Partial<KpiDeltas>>(KPI_KEY, {}) };
}

export function bumpKpis(patch: Partial<KpiDeltas>) {
  const current = readKpiDeltas();
  const next = { ...current };
  for (const key of Object.keys(patch) as (keyof KpiDeltas)[]) next[key] = current[key] + (patch[key] ?? 0);
  writeStore(KPI_KEY, next);
}

export type PlatformKpis = {
  deltas: KpiDeltas;
  breachesPreventedMTD: number;
  compensationAvoidedMTD: number; // ₹
  recoveredMTD: number; // ₹
  complianceMTD: number;
};

export function computePlatformKpis(): PlatformKpis {
  const deltas = readKpiDeltas();
  return {
    deltas,
    breachesPreventedMTD: slaMetrics.breachesPreventedMTD + deltas.breachesPrevented,
    compensationAvoidedMTD: slaMetrics.compensationAvoidedMTD + deltas.compensationAvoided,
    recoveredMTD: revMetrics.recoveredMTD + deltas.revenueRecovered,
    complianceMTD: Math.min(99.9, Math.round((slaMetrics.complianceMTD + deltas.breachesPrevented * 0.1) * 10) / 10),
  };
}

/** Live merged KPIs — updates whenever any suite resolves, recovers, or notifies. */
export function usePlatformKpis(): PlatformKpis {
  return usePlatformDerived(computePlatformKpis, {
    deltas: zeroDeltas,
    breachesPreventedMTD: slaMetrics.breachesPreventedMTD,
    compensationAvoidedMTD: slaMetrics.compensationAvoidedMTD,
    recoveredMTD: revMetrics.recoveredMTD,
    complianceMTD: slaMetrics.complianceMTD,
  });
}
