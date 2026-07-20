export type Ledger = { id: string; date: string; action: string; points: number; category: string };

export const storageKey = "suraksha:trust-points:GJ-559210";

import { Check, Star, ShieldCheck, Sparkle } from "lucide-react";

export const tiers = [
  { name: "Safe User", threshold: 0, icon: Check },
  { name: "Safety Champion", threshold: 1000, icon: Star },
  { name: "Safety Guardian", threshold: 2500, icon: ShieldCheck },
  { name: "Community Protector", threshold: 5000, icon: Sparkle },
];

export function computeTier(points: number) {
  const tierIndex = Math.max(0, tiers.map((tier) => tier.threshold).filter((threshold) => threshold <= points).length - 1);
  const tier = tiers[tierIndex];
  const nextTier = tiers[tierIndex + 1] ?? null;
  const away = nextTier ? nextTier.threshold - points : 0;
  const progress = nextTier ? Math.round(((points - tier.threshold) / (nextTier.threshold - tier.threshold)) * 100) : 100;
  return { tierIndex, tier, nextTier, away, progress };
}

export function ledgerPoints(ledger: Ledger[]) {
  return ledger.reduce((sum, row) => sum + row.points, 0);
}

// The transparent starting ledger every fresh profile begins with; shared so
// the TrustPoints page, the platform effect engine, and the platform context
// all agree on the same balance.
export const startingLedger: Ledger[] = [
  { id: "pay", date: "Jul 14", action: "Timely bill payments", points: 620, category: "Timely payments" },
  { id: "safe", date: "Jul 10", action: "Safety compliance", points: 480, category: "Safety compliance" },
  { id: "refer", date: "Jun 25", action: "Referred a new PNG customer", points: 350, category: "Referrals" },
  { id: "inspection", date: "Jun 30", action: "Annual equipment inspections", points: 290, category: "Inspections" },
  { id: "training", date: "Jun 15", action: "Leak safety awareness training", points: 100, category: "Training" },
];

export type TrustProfileRecord = {
  completedMissions: string[];
  redeemed: string[];
  riskRewarded: boolean;
  gasGuardActive: boolean;
  redemptions: { rewardId: string; requestId: string; requestedAt: string; status: "Requested" | "Fulfilment in progress" }[];
  ledger: Ledger[];
};

export const emptyTrustProfile: TrustProfileRecord = {
  completedMissions: ["quiz"], redeemed: [], riskRewarded: false,
  gasGuardActive: false, redemptions: [], ledger: startingLedger,
};

export function readTrustProfile(): TrustProfileRecord {
  if (typeof window === "undefined") return emptyTrustProfile;
  try {
    const saved = JSON.parse(window.localStorage.getItem(storageKey) ?? "null");
    if (saved && Array.isArray(saved.ledger)) {
      return {
        completedMissions: Array.isArray(saved.completedMissions) ? saved.completedMissions : ["quiz"],
        redeemed: Array.isArray(saved.redeemed) ? saved.redeemed : [],
        riskRewarded: Boolean(saved.riskRewarded),
        gasGuardActive: Boolean(saved.gasGuardActive),
        redemptions: Array.isArray(saved.redemptions) ? saved.redemptions : [],
        ledger: saved.ledger,
      };
    }
  } catch { /* fall through to the starting profile */ }
  return emptyTrustProfile;
}
