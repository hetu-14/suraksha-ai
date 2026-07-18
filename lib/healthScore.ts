import type { ConnectionStatusRecord } from "@/lib/connectionStatus";

export type HealthFactorId = "safety" | "payment" | "equipment" | "usage" | "readiness";

export type HealthProfile = {
  emergencyContactVerified: boolean;
  safetySurveyComplete: boolean;
  preventiveInspectionBooked: boolean;
};

export type HealthFactor = {
  id: HealthFactorId;
  name: string;
  score: number;
  weight: number;
  tone: "brand" | "amber";
  evidence: string[];
  action?: string;
};

export const healthProfileStorageKey = "suraksha:health-profile:GJ-559210";

export const emptyHealthProfile: HealthProfile = {
  emergencyContactVerified: false,
  safetySurveyComplete: true,
  preventiveInspectionBooked: false,
};

export function normalizeHealthProfile(value: unknown): HealthProfile {
  if (!value || typeof value !== "object") return emptyHealthProfile;
  const profile = value as Partial<HealthProfile>;
  return {
    emergencyContactVerified: Boolean(profile.emergencyContactVerified),
    safetySurveyComplete: profile.safetySurveyComplete !== false,
    preventiveInspectionBooked: Boolean(profile.preventiveInspectionBooked),
  };
}

export function buildHealthFactors(profile: HealthProfile, connection: ConnectionStatusRecord): HealthFactor[] {
  const safetyScore = 91 + (profile.safetySurveyComplete ? 4 : 0);
  const equipmentScore = profile.preventiveInspectionBooked ? 90 : 78;
  const readinessScore = 60 + (profile.emergencyContactVerified ? 12 : 0) + (connection.layout ? 5 : 0) + (connection.siteAccess ? 3 : 0);

  return [
    {
      id: "safety", name: "Safety compliance", score: safetyScore, weight: 35, tone: "brand",
      evidence: ["Safety inspection passed", "No leak alerts", "No emergency incidents", profile.safetySurveyComplete ? "Safety guidance viewed" : "Safety guidance not yet completed"],
      action: profile.safetySurveyComplete ? undefined : "Complete the safety guidance in GasGuard.",
    },
    {
      id: "payment", name: "Payment reliability", score: 88, weight: 10, tone: "brand",
      evidence: ["Last 12 bills paid on time", "No outstanding dues", "Payment method verified"],
    },
    {
      id: "equipment", name: "Equipment health", score: equipmentScore, weight: 25, tone: profile.preventiveInspectionBooked ? "brand" : "amber",
      evidence: ["Regulator age is within range", "Last inspection recorded", profile.preventiveInspectionBooked ? "Preventive inspection scheduled" : "Maintenance history is current"],
      action: profile.preventiveInspectionBooked ? undefined : "Kitchen regulator inspection is due in 45 days.",
    },
    {
      id: "usage", name: "Usage stability", score: 75, weight: 10, tone: "amber",
      evidence: ["Stable consumption overall", "Slight increase in the last two cycles", "No leak indicators detected"],
      action: "Continue monitoring the next billing cycle in WhyMyBill.",
    },
    {
      id: "readiness", name: "Safety readiness", score: readinessScore, weight: 20, tone: readinessScore >= 75 ? "brand" : "amber",
      evidence: [profile.emergencyContactVerified ? "Emergency contact verified" : "Emergency contact requires verification", connection.layout ? "Connection documentation complete" : "Connection layout approval pending", connection.siteAccess ? "Site access scheduled" : "Site access can be scheduled"],
      action: profile.emergencyContactVerified ? undefined : "Verify your emergency contact to improve this score.",
    },
  ];
}

export function overallHealthScore(factors: HealthFactor[]) {
  return Math.round(factors.reduce((total, factor) => total + factor.score * (factor.weight / 100), 0));
}
