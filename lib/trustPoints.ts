export type Ledger = { id: string; date: string; action: string; points: number; category: string };

export const storageKey = "suraksha:trust-points:GJ-559210";

export const tiers = [
  { name: "Safe User", threshold: 0, icon: "✓" },
  { name: "Safety Champion", threshold: 1000, icon: "★" },
  { name: "Safety Guardian", threshold: 2500, icon: "🛡" },
  { name: "Community Protector", threshold: 5000, icon: "✦" },
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
