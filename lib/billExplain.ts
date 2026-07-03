import { Bill, BillExplanation, Customer, ExplanationFactor, LeakLevel, Verdict } from "./types";

// ============================================================================
//  WhyMyBill explanation + leak-risk engine
//  Pure, deterministic. Every conclusion derives from the bill history + an
//  optional "was the premise unoccupied this cycle" (away) signal.
// ============================================================================

const WINTER_MONTHS = new Set([11, 12, 1, 2]);

const monthOf = (iso: string) => new Date(iso).getUTCMonth() + 1;
const isWinter = (iso: string) => WINTER_MONTHS.has(monthOf(iso));
const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
function stddev(xs: number[]) {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)));
}
function pct(cur: number, base: number): number | null {
  if (!base) return null;
  return +(((cur - base) / base) * 100).toFixed(1);
}
export function inr(n: number) {
  const sign = n < 0 ? "-" : "";
  return sign + "₹" + Math.abs(Math.round(n)).toLocaleString("en-IN");
}

function sameSeasonLastYear(bills: Bill[], idx: number): Bill | null {
  const cur = bills[idx];
  const byIndex = bills[idx - 6];
  if (byIndex && monthOf(byIndex.periodEnd) === monthOf(cur.periodEnd)) return byIndex;
  const m = monthOf(cur.periodEnd);
  for (let i = idx - 1; i >= 0; i--) if (monthOf(bills[i].periodEnd) === m) return bills[i];
  return byIndex ?? null;
}

function decompose(cur: Bill, prev: Bill): ExplanationFactor[] {
  const usageEffect = (cur.unitsScm - prev.unitsScm) * cur.ratePerScm;
  const tariffEffect = prev.unitsScm * (cur.ratePerScm - prev.ratePerScm);
  const fixedEffect = cur.fixedCharge - prev.fixedCharge;
  const arrearsEffect = cur.arrears - prev.arrears;
  const f: ExplanationFactor[] = [];
  if (Math.abs(usageEffect) >= 1)
    f.push({ label: usageEffect >= 0 ? "Higher gas usage" : "Lower gas usage", amount: usageEffect, detail: `${cur.unitsScm - prev.unitsScm >= 0 ? "+" : ""}${(cur.unitsScm - prev.unitsScm).toFixed(0)} SCM at ${inr(cur.ratePerScm)}/SCM` });
  if (Math.abs(tariffEffect) >= 1)
    f.push({ label: tariffEffect >= 0 ? "Tariff revision" : "Tariff reduction", amount: tariffEffect, detail: `Rate ${inr(prev.ratePerScm)} → ${inr(cur.ratePerScm)} per SCM` });
  if (Math.abs(fixedEffect) >= 1)
    f.push({ label: "Fixed charges", amount: fixedEffect, detail: "Change in fixed / service charge" });
  if (Math.abs(arrearsEffect) >= 1)
    f.push({ label: "Previous arrears", amount: arrearsEffect, detail: "Unpaid balance carried forward" });
  return f;
}

// ---- the leak-probability model -------------------------------------------
function assessLeak(opts: {
  ratio: number;          // current units / baseline average
  z: number;              // std-devs above baseline
  seasonalMatch: boolean; // rise explained by same season last year
  away: boolean;          // premise unoccupied this cycle
  isUnder: boolean;       // sharp drop => meter fault, not a leak
  avgUnits: number;
  units: number;
}): { pct: number; level: LeakLevel; reasons: string[] } {
  const { ratio, z, seasonalMatch, away, isUnder, avgUnits, units } = opts;
  const reasons: string[] = [];
  let p = 0;

  if (isUnder) {
    p = 8;
    reasons.push("This is a sharp DROP in usage — that points to a meter fault or under-registration, not a leak.");
  } else if (away) {
    // Nobody home => usage should be near zero. Real usage while away is the
    // strongest leak signal there is.
    const awayFactor = clamp((ratio - 0.1) / 0.5, 0, 1); // ratio 0.1→0, ≥0.6→1
    p = Math.round(awayFactor * 100);
    if (ratio >= 0.6)
      reasons.push(`You marked this cycle as away, yet usage is about ${ratio.toFixed(1)}× a normal cycle — gas is being consumed with nobody home, a classic leak signature.`);
    else if (ratio >= 0.3)
      reasons.push(`You were away, but there is still meaningful gas usage (${Math.round(units)} SCM) — worth a safety check.`);
    else
      reasons.push(`You were away and usage is near zero — nothing is consuming gas, so no leak signs.`);
  } else {
    // Occupied: usage well above your own average, not explained by season.
    const usageFactor = clamp((ratio - 1.2) / 1.0, 0, 1); // 0 at ≤1.2×, 1 at ≥2.2×
    let base = usageFactor;
    if (seasonalMatch) {
      base *= 0.3;
      reasons.push("The higher usage matches last winter, so most of the rise is expected heating — that lowers leak risk.");
    }
    const zFactor = clamp((z - 1.5) / 3, 0, 0.4);
    p = Math.round(clamp(base * 0.85 + zFactor, 0, 0.97) * 100);

    if (ratio >= 2) reasons.push(`Usage is about ${ratio.toFixed(1)}× your ${Math.round(avgUnits)} SCM average — a large, unexplained rise.`);
    else if (ratio >= 1.4 && !seasonalMatch) reasons.push(`Usage is ${Math.round((ratio - 1) * 100)}% above your average with no seasonal reason.`);
    if (z >= 2.5 && !seasonalMatch) reasons.push("Consumption is a statistical outlier versus your own history.");
    if (ratio < 1.2) reasons.push(`Usage is in line with your ${Math.round(avgUnits)} SCM average — no leak signature.`);
  }

  p = clamp(p, 0, 99);
  const level: LeakLevel = p >= 65 ? "high" : p >= 35 ? "watch" : "none";
  return { pct: p, level, reasons };
}

export function explainBill(bills: Bill[], customer: Customer, targetId?: string, away = false): BillExplanation {
  const sorted = [...bills].sort((a, b) => +new Date(a.periodEnd) - +new Date(b.periodEnd));
  const idx = targetId ? sorted.findIndex((b) => b.id === targetId) : sorted.length - 1;
  const cur = sorted[idx];
  const prev = sorted[idx - 1] ?? null;
  const yoy = sameSeasonLastYear(sorted, idx);

  const baseline = sorted.slice(Math.max(0, idx - 6), idx);
  const avgUnits = baseline.length ? mean(baseline.map((b) => b.unitsScm)) : cur.unitsScm;
  const sd = stddev(baseline.map((b) => b.unitsScm));
  const z = sd > 0 ? (cur.unitsScm - avgUnits) / sd : 0;
  const ratio = avgUnits ? cur.unitsScm / avgUnits : 1;

  const vsPrevPct = prev ? pct(cur.unitsScm, prev.unitsScm) : null;
  const vsYearPct = yoy ? pct(cur.unitsScm, yoy.unitsScm) : null;
  const vsAvgPct = avgUnits ? pct(cur.unitsScm, avgUnits) : null;

  const curWinter = isWinter(cur.periodEnd);
  const seasonalMatch =
    !away && curWinter && yoy != null && isWinter(yoy.periodEnd) &&
    Math.abs((cur.unitsScm - yoy.unitsScm) / yoy.unitsScm) <= 0.3;

  const isUnder = vsPrevPct != null && vsPrevPct < -30 && z < -2 && !away;

  const leak = assessLeak({ ratio, z, seasonalMatch, away, isUnder, avgUnits, units: cur.unitsScm });

  const factors = prev ? decompose(cur, prev) : [];
  const amountDeltaVsPrev = prev ? +(cur.amount - prev.amount).toFixed(2) : 0;

  const verdict: Verdict = isUnder ? "under" : leak.level === "high" ? "leak" : "normal";
  const confidence = seasonalMatch ? 92 : leak.level === "high" ? Math.min(96, 60 + leak.pct / 3) : 84;

  // ---- amount narrative (why the bill is this much) ----
  const drivers: string[] = [];
  const usageF = factors.find((f) => f.label.includes("usage"));
  const tariffF = factors.find((f) => f.label.includes("Tariff"));
  if (away) drivers.push("this cycle was marked as away/unoccupied");
  if (seasonalMatch) drivers.push("higher winter heating, in line with last winter");
  else if (usageF && usageF.amount > 0) drivers.push("higher usage this cycle");
  else if (usageF && usageF.amount < 0) drivers.push("lower usage this cycle");
  if (tariffF) drivers.push(`a tariff revision (${inr(tariffF.amount)})`);
  const narrative =
    prev
      ? `This bill is ${amountDeltaVsPrev >= 0 ? "higher" : "lower"} than last cycle mainly due to ${drivers.length ? drivers.join(", and ") : "routine variation"}. ` +
        (yoy ? `Compared with the same period last year, usage went ${yoy.unitsScm.toFixed(0)} → ${cur.unitsScm.toFixed(0)} SCM. ` : "") +
        `Your average is about ${Math.round(avgUnits)} SCM per cycle.`
      : `This is your earliest bill on record — ${cur.unitsScm} SCM at ${inr(cur.ratePerScm)}/SCM.`;

  let headline: string;
  let safety: BillExplanation["safety"];
  if (verdict === "under") {
    headline = "Unusually low — meter verification advised";
    safety = { flag: "meter", title: "Meter check advised", message: "Consumption dropped abnormally — routed for a meter verification so you're billed fairly." };
  } else if (leak.level === "high") {
    headline = `High leak chance — ${leak.pct}%`;
    safety = { flag: "investigate", title: `Possible leak · ${leak.pct}% risk`, message: "Unusual consumption detected. Please book a free safety inspection — better safe than sorry." };
  } else if (leak.level === "watch") {
    headline = `Worth watching — ${leak.pct}% leak chance`;
    safety = { flag: "investigate", title: `Monitor · ${leak.pct}% risk`, message: "Usage is a little high. Watch for any gas smell or hissing, and book a check if unsure." };
  } else {
    headline = seasonalMatch ? "Expected seasonal usage — no leak" : "Normal usage — no leak signs";
    safety = { flag: "safe", title: `Safe · ${leak.pct}% leak risk`, message: "Usage pattern matches your norms. No abnormal or continuous consumption detected." };
  }

  return {
    billId: cur.id,
    verdict,
    confidence: Math.round(confidence),
    headline,
    narrative,
    factors,
    amountDeltaVsPrev,
    leakPct: leak.pct,
    leakLevel: leak.level,
    leakReasons: leak.reasons,
    away,
    comparisons: {
      vsPrevPct,
      vsYearPct,
      vsAvgPct,
      avgUnits: avgUnits != null ? +avgUnits.toFixed(0) : null,
      yoyLabel: yoy ? yoy.cycleLabel : null,
    },
    safety,
  };
}
