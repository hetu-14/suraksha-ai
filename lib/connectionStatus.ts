// Client-safe state model for My PNG Status. This is deliberately separate
// from presentation so the same record can later be supplied by the CRM API.

export type UploadedLayout = {
  name: string;
  size: number;
  uploadedAt: string;
};

export type ConnectionStatusRecord = {
  layout?: UploadedLayout;
  mobileVerified: boolean;
  siteAccess?: string;
  appointment?: string;
  alertEnabled: boolean;
  seenUpdateIds: string[];
};

export const connectionStorageKey = "suraksha:connection-status:GJ-559210";

export const emptyConnectionStatus: ConnectionStatusRecord = {
  mobileVerified: false,
  alertEnabled: false,
  seenUpdateIds: [],
};

export function normalizeConnectionStatus(value: unknown): ConnectionStatusRecord {
  if (!value || typeof value !== "object") return emptyConnectionStatus;
  const input = value as Partial<ConnectionStatusRecord>;
  return {
    layout: input.layout && typeof input.layout.name === "string" && typeof input.layout.size === "number" && typeof input.layout.uploadedAt === "string" ? input.layout : undefined,
    mobileVerified: Boolean(input.mobileVerified),
    siteAccess: typeof input.siteAccess === "string" ? input.siteAccess : undefined,
    appointment: typeof input.appointment === "string" ? input.appointment : undefined,
    alertEnabled: Boolean(input.alertEnabled),
    seenUpdateIds: Array.isArray(input.seenUpdateIds) ? input.seenUpdateIds.filter((id): id is string => typeof id === "string") : [],
  };
}

export function connectionForecast(status: ConnectionStatusRecord) {
  if (!status.layout) return { date: "30 July 2026", risk: "Medium" as const, confidence: 88, days: 12, delayDays: 4 };
  if (!status.siteAccess) return { date: "28 July 2026", risk: "Low" as const, confidence: 90, days: 10, delayDays: 2 };
  return { date: "26 July 2026", risk: "Low" as const, confidence: 93, days: 8, delayDays: 0 };
}
