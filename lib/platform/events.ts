"use client";

// ---- Platform event bus ----
// Every meaningful action in any suite emits exactly one typed event here.
// The effect engine (effects.ts) fans it out to every interested module —
// role feeds, canonical stores, KPI deltas, the recommendation engine — and
// the unified timeline is a projection of this log. Pages never synchronise
// each other by hand: they emit, the platform propagates.

import { useEffect, useState } from "react";
import { PLATFORM_SIGNAL, readStore, writeStore } from "./store";
import { runEffects } from "./effects";

export type EntityType =
  | "customer" | "bill" | "payment" | "appointment" | "engineer" | "complaint"
  | "incident" | "zone" | "station" | "asset" | "contractor" | "slaTicket"
  | "revenueCase" | "document" | "reward" | "notice" | "insight" | "connection";

export type EntityRef = { type: EntityType; id: string; label?: string };

export type PlatformEventType =
  // WhyMyBill / billing
  | "BillAnalyzed" | "BillAlertsEnabled" | "SavingsPlanSaved" | "PaymentCompleted"
  // Appointments
  | "AppointmentBooked" | "AppointmentRescheduled" | "AppointmentCancelled" | "AppointmentCompleted"
  // Voice of Customer
  | "ComplaintSubmitted" | "ComplaintReopened" | "ComplaintEscalated"
  // GasGuard / emergencies
  | "EmergencyStarted" | "EmergencyClosed" | "DrillCompleted"
  // Health / readiness
  | "EmergencyContactVerified"
  // My PNG Status
  | "DocumentUploaded" | "MobileVerified" | "SiteAccessScheduled" | "ConnectionQueryRaised"
  // TrustPoints
  | "TrustPointsAwarded" | "RewardRedeemed"
  // Safety & intelligence operations
  | "SlaEscalated" | "SlaResolved" | "NoticeSent"
  | "CrewDispatched" | "IncidentResolved" | "ZoneIsolated" | "ZoneRestored"
  | "RevenueCaseAdvanced" | "InsightActioned";

export type PlatformEventData = Record<string, string | number | boolean | undefined>;

export type PlatformEvent = {
  id: string;
  type: PlatformEventType;
  at: number;
  /** Module that produced the event, e.g. "WhyMyBill", "GasGuard". */
  module: string;
  /** Human-readable description used by the unified timeline. */
  summary: string;
  entities: EntityRef[];
  data: PlatformEventData;
  /** Modules the effect engine updated in response — the propagation trace. */
  impact: string[];
};

export type PlatformEventInput = {
  type: PlatformEventType;
  module: string;
  summary: string;
  entities?: EntityRef[];
  data?: PlatformEventData;
  /** Stable id — emitting the same id twice updates the log entry instead of duplicating it. */
  id?: string;
};

const LOG_KEY = "suraksha:platform:events";
const MAX_EVENTS = 120;

export function readEventLog(): PlatformEvent[] {
  const log = readStore<PlatformEvent[]>(LOG_KEY, []);
  return Array.isArray(log) ? log.filter((event) => event && typeof event.id === "string" && typeof event.at === "number") : [];
}

/**
 * Emit one platform event: run every downstream effect, persist the event with
 * its propagation trace, and signal every live view. Returns the event so the
 * caller can surface `impact` ("also updated: …") to the user.
 */
export function emitPlatformEvent(input: PlatformEventInput): PlatformEvent {
  const event: PlatformEvent = {
    id: input.id ?? `pev-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
    type: input.type,
    at: Date.now(),
    module: input.module,
    summary: input.summary,
    entities: input.entities ?? [],
    data: input.data ?? {},
    impact: [],
  };
  if (typeof window === "undefined") return event;
  event.impact = runEffects(event);
  writeStore(LOG_KEY, [event, ...readEventLog().filter((item) => item.id !== event.id)].slice(0, MAX_EVENTS));
  return event;
}

/** Live view over the platform event log (newest first). */
export function usePlatformEvents(): PlatformEvent[] {
  const [events, setEvents] = useState<PlatformEvent[]>([]);
  useEffect(() => {
    const refresh = () => setEvents(readEventLog());
    refresh();
    window.addEventListener(PLATFORM_SIGNAL, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(PLATFORM_SIGNAL, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  return events;
}
