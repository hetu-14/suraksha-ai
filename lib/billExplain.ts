import { Bill, BillExplanation, Customer, ExplanationFactor, Verdict } from "./types";

// ============================================================================
//  WhyMyBill explanation engine
//  Pure, deterministic functions — no hardcoded per-customer text. Every
//  conclusion is derived from the bill history passed in.
// ============================================================================

const WINTER_MONTHS = new Set([11, 12, 1, 2]); // Nov–Feb (heating season in India)

function monthOf(iso: string) {
  return new Date(iso).getUTCMonth() + 1;
}
function isWinter(iso: string) {
  return WINTER_MONTHS.has(monthOf(iso));
}
function mean(xs: number[]) {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}
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

/**
 * Find the bill from roughly the same season one year earlier.
 * Bi-monthly billing => 6 cycles per year, so index-6 is the primary guess;
 * we fall back to the nearest earlier bill sharing the same end-month.
 */
function sameSeasonLastYear(bills: Bill[], idx: number): Bill | null {
  const cur = bills[idx];
  const byIndex = bills[idx - 6];
  if (byIndex && monthOf(byIndex.periodEnd) === monthOf(cur.periodEnd)) return byIndex;
  const m = monthOf(cur.periodEnd);
  for (let i = idx - 1; i >= 0; i--) {
    if (monthOf(bills[i].periodEnd) === m) return bills[i];
  }
  return byIndex ?? null;
}

/**
 * Decompose the change in bill amount vs the previous cycle into its true
 * drivers. Because amount = units*rate + fixed + arrears, these effects sum
 * exactly to the total amount delta.
 */
function decompose(cur: Bill, prev: Bill): ExplanationFactor[] {
  const usageEffect = (cur.unitsScm - prev.unitsScm) * cur.ratePerScm;
  const tariffEffect = prev.unitsScm * (cur.ratePerScm - prev.ratePerScm);
  const fixedEffect = cur.fixedCharge - prev.fixedCharge;
  const arrearsEffect = cur.arrears - prev.arrears;

  const factors: ExplanationFactor[] = [];
  if (Math.abs(usageEffect) >= 1)
    factors.push({
      label: usageEffect >= 0 ? "Higher gas usage" : "Lower gas usage",
      amount: usageEffect,
      detail: `${cur.unitsScm - prev.unitsScm >= 0 ? "+" : ""}${(cur.unitsScm - prev.unitsScm).toFixed(0)} SCM vs last cycle at ${inr(cur.ratePerScm)}/SCM`,
    });
  if (Math.abs(tariffEffect) >= 1)
    factors.push({
      label: tariffEffect >= 0 ? "Tariff revision" : "Tariff reduction",
      amount: tariffEffect,
      detail: `Rate changed ${inr(prev.ratePerScm)} → ${inr(cur.ratePerScm)} per SCM`,
    });
  if (Math.abs(fixedEffect) >= 1)
    factors.push({ label: "Fixed charges", amount: fixedEffect, detail: "Change in fixed / service charge" });
  if (Math.abs(arrearsEffect) >= 1)
    factors.push({ label: "Previous arrears", amount: arrearsEffect, detail: "Unpaid balance carried forward" });
  return factors;
}

export function explainBill(
  bills: Bill[],
  customer: Customer,
  targetId?: string
): BillExplanation {
  const sorted = [...bills].sort((a, b) => +new Date(a.periodEnd) - +new Date(b.periodEnd));
  const idx = targetId ? sorted.findIndex((b) => b.id === targetId) : sorted.length - 1;
  const cur = sorted[idx];
  const prev = sorted[idx - 1] ?? null;
  const yoy = sameSeasonLastYear(sorted, idx);

  // Baseline: up to the previous 6 cycles (one year) before current.
  const baseline = sorted.slice(Math.max(0, idx - 6), idx);
  const avgUnits = baseline.length ? mean(baseline.map((b) => b.unitsScm)) : null;
  const sd = stddev(baseline.map((b) => b.unitsScm));
  const z = sd > 0 && avgUnits !== null ? (cur.unitsScm - avgUnits) / sd : 0;

  const vsPrevPct = prev ? pct(cur.unitsScm, prev.unitsScm) : null;
  const vsYearPct = yoy ? pct(cur.unitsScm, yoy.unitsScm) : null;
  const vsAvgPct = avgUnits ? pct(cur.unitsScm, avgUnits) : null;

  const curWinter = isWinter(cur.periodEnd);
  // Seasonal if this is winter AND usage is in line with last winter (±30%).
  const seasonalMatch =
    curWinter && yoy != null && isWinter(yoy.periodEnd) &&
    Math.abs((cur.unitsScm - yoy.unitsScm) / yoy.unitsScm) <= 0.3;

  const factors = prev ? decompose(cur, prev) : [];
  const amountDeltaVsPrev = prev ? +(cur.amount - prev.amount).toFixed(2) : 0;

  // ---- Classify ----
  let verdict: Verdict = "normal";
  let confidence = 80;

  const bigJump = vsPrevPct != null && vsPrevPct > 60;
  const jumpVsYear = vsYearPct == null || vsYearPct > 40;
  const bigDrop = vsPrevPct != null && vsPrevPct < -30;

  if (bigJump && jumpVsYear && !seasonalMatch && z > 2.2) {
    verdict = "leak";
    confidence = Math.min(96, 60 + Math.round(z * 8));
  } else if (bigDrop && z < -2) {
    verdict = "under";
    confidence = Math.min(94, 55 + Math.round(Math.abs(z) * 8));
  } else {
    verdict = "normal";
    confidence = seasonalMatch ? 92 : 82;
  }

  // ---- Build narrative + headline + safety ----
  let headline: string;
  let narrative: string;
  let safety: BillExplanation["safety"];

  if (verdict === "leak") {
    headline = "Unusual sustained rise — a safety check is recommended";
    narrative =
      `Your usage jumped to ${cur.unitsScm.toFixed(0)} SCM` +
      (prev ? ` (${vsPrevPct}% above last cycle)` : "") +
      (yoy ? ` and ${vsYearPct}% above the same period last year` : "") +
      `. This increase is well outside your normal range (${avgUnits?.toFixed(0)} SCM average) and is not explained by season or tariff. ` +
      `A rise this large that persists can indicate an in-premise leak, so we recommend a free safety inspection.`;
    safety = {
      flag: "investigate",
      title: "Possible in-premise leak",
      message: "Abnormal, unexplained consumption detected. Book a free safety check — better safe than sorry.",
    };
  } else if (verdict === "under") {
    headline = "Unusually low — a meter verification is scheduled";
    narrative =
      `Your billed usage fell to ${cur.unitsScm.toFixed(0)} SCM` +
      (prev ? ` (${vsPrevPct}% below last cycle)` : "") +
      `, despite a steady history around ${avgUnits?.toFixed(0)} SCM. A drop this sharp with normal operations often points to a ` +
      `meter under-registration or fault rather than lower actual usage. We have flagged the meter for verification so you are billed accurately and fairly.`;
    safety = {
      flag: "meter",
      title: "Meter check advised",
      message: "Consumption dropped abnormally. Routed to RevGuard for a meter verification.",
    };
  } else {
    const drivers: string[] = [];
    const usageF = factors.find((f) => f.label.includes("usage"));
    const tariffF = factors.find((f) => f.label.includes("Tariff"));
    if (seasonalMatch) drivers.push("higher winter heating — in line with last winter");
    else if (usageF && usageF.amount > 0) drivers.push("higher usage this cycle");
    else if (usageF && usageF.amount < 0) drivers.push("lower usage this cycle");
    if (tariffF) drivers.push(`a tariff revision (${inr(tariffF.amount)})`);

    headline = seasonalMatch ? "Expected seasonal usage — no leak" : "Normal for this period";
    narrative =
      `This bill is ${amountDeltaVsPrev >= 0 ? "higher" : "lower"} than last cycle mainly due to ` +
      (drivers.length ? drivers.join(", and ") : "routine variation") +
      `. Your readings are consistent with your history` +
      (yoy ? ` and with the same season last year (${yoy.unitsScm.toFixed(0)} → ${cur.unitsScm.toFixed(0)} SCM)` : "") +
      `, and no leak signature was detected.`;
    safety = {
      flag: "safe",
      title: "Safe — no leak signal",
      message: "Usage pattern matches seasonal norms. No abnormal or continuous consumption detected.",
    };
  }

  return {
    billId: cur.id,
    verdict,
    confidence,
    headline,
    narrative,
    factors,
    amountDeltaVsPrev,
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
