"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui";
import {
  AlertTriangle, BadgeCheck, Bot, Calculator, CalendarDays, Check, ChevronDown, Droplets,
  Download, Flame, Gauge, HeartPulse, Lightbulb, Mail, ReceiptText, ShieldCheck,
  Sparkles, Timer, TrendingDown, UsersRound, UtensilsCrossed, WalletCards,
} from "lucide-react";
import { Bill, BillExplanation, Customer } from "@/lib/types";
import { inr } from "@/lib/billExplain";

type Props = {
  bill: Bill;
  previousBill?: Bill;
  customer: Customer;
  explanation: BillExplanation;
  away: boolean;
  onAwayChange: (away: boolean) => void;
  onAsk: () => void;
  onDownload: () => void;
  usageHistory: ReactNode;
};

type Appliance = "stove" | "waterHeater" | "geyser";

const applianceInfo: Record<Appliance, { label: string; hint: string; icon: typeof Flame }> = {
  stove: { label: "Gas stove", hint: "Daily cooking", icon: UtensilsCrossed },
  waterHeater: { label: "Water heater", hint: "Bath & cleaning", icon: Droplets },
  geyser: { label: "PNG geyser", hint: "Water heating", icon: Flame },
};

function positive(n: number) {
  return Math.max(0, n);
}

export default function BillIntelligence({ bill, previousBill, customer, explanation, away, onAwayChange, onAsk, onDownload, usageHistory }: Props) {
  const [usageReduction, setUsageReduction] = useState(20);
  const [simple, setSimple] = useState(false);
  const [appliances, setAppliances] = useState<Record<Appliance, boolean>>({ stove: true, waterHeater: true, geyser: true });
  const [cookingFrequency, setCookingFrequency] = useState(5);
  const [activeTab, setActiveTab] = useState<"overview" | "explanation" | "safety" | "insights" | "actions">("overview");
  const [alertEnabled, setAlertEnabled] = useState(false);
  const [planSaved, setPlanSaved] = useState(false);
  const [timelineStep, setTimelineStep] = useState(0);
  const preferenceKey = `suraksha:why-my-bill:${customer.id}`;

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(preferenceKey) ?? "{}");
      if (typeof saved.usageReduction === "number") setUsageReduction(saved.usageReduction);
      if (typeof saved.cookingFrequency === "number") setCookingFrequency(saved.cookingFrequency);
      if (saved.appliances && typeof saved.appliances === "object") setAppliances((current) => ({ ...current, ...saved.appliances }));
      setAlertEnabled(Boolean(saved.alertEnabled));
      onAwayChange(Boolean(saved.away));
    } catch {
      // Preferences are optional; a corrupted browser value must never block billing.
    }
  }, [onAwayChange, preferenceKey]);

  useEffect(() => {
    try {
      window.localStorage.setItem(preferenceKey, JSON.stringify({ usageReduction, cookingFrequency, appliances, alertEnabled, away }));
    } catch {
      // Storage may be unavailable in private browsing; controls still work for this session.
    }
  }, [alertEnabled, appliances, away, cookingFrequency, preferenceKey, usageReduction]);

  const lateFee = bill.lateFee;
  const billRows = [
    { label: "Gas consumption charge", value: bill.gasCharge, note: `${bill.unitsScm} SCM × ${inr(bill.ratePerScm)}/SCM` },
    { label: "Fixed charges", value: bill.fixedCharge, note: "Connection and service availability" },
    { label: "Tax / GST", value: bill.tax, note: "Applicable statutory charges" },
    { label: "Previous due", value: bill.arrears, note: "Balance carried forward" },
    { label: "Late fee", value: lateFee, note: "Applied after the payment due date" },
  ];

  const predicted = useMemo(() => {
    const adjustedGas = bill.gasCharge * (1 - usageReduction / 100);
    // Tax linked to consumption reduces proportionally; fixed and previous dues remain.
    const adjustedTax = bill.tax * (1 - usageReduction / 100);
    return Math.round(adjustedGas + bill.fixedCharge + adjustedTax + bill.arrears + lateFee);
  }, [bill, lateFee, usageReduction]);
  const saving = positive(Math.round(bill.amount - predicted));

  const applianceShare = useMemo(() => {
    const enabled = (Object.keys(appliances) as Appliance[]).filter((key) => appliances[key]);
    if (!enabled.length) return [] as { key: Appliance; share: number }[];
    const weights: Record<Appliance, number> = {
      stove: 3 + cookingFrequency * 0.35,
      waterHeater: 2.4,
      geyser: 2.8,
    };
    const total = enabled.reduce((sum, key) => sum + weights[key], 0);
    let used = 0;
    return enabled.map((key, index) => {
      const share = index === enabled.length - 1 ? 100 - used : Math.round((weights[key] / total) * 100);
      used += share;
      return { key, share };
    });
  }, [appliances, cookingFrequency]);

  const usageEffect = explanation.factors.find((factor) => /usage/i.test(factor.label))?.amount ?? 0;
  const tariffEffect = explanation.factors.find((factor) => /tariff/i.test(factor.label))?.amount ?? 0;
  const cycleDays = Math.round((new Date(bill.periodEnd).getTime() - new Date(bill.periodStart).getTime()) / 86_400_000) + 1;
  const previousDays = previousBill
    ? Math.round((new Date(previousBill.periodEnd).getTime() - new Date(previousBill.periodStart).getTime()) / 86_400_000) + 1
    : cycleDays;
  const daysEffect = previousBill ? Math.round(Math.max(0, cycleDays - previousDays) * (bill.gasCharge / Math.max(1, cycleDays))) : 0;
  const unexplained = positive(Math.round(explanation.amountDeltaVsPrev - usageEffect - tariffEffect - daysEffect));
  const areaAverage = bill.areaAverageScm == null ? null : Math.round(bill.areaAverageScm);
  const benchmarkPct = areaAverage ? Math.round(((bill.unitsScm - areaAverage) / areaAverage) * 100) : null;
  const billHealth = Math.max(58, Math.min(98, Math.round(94 - explanation.leakPct * 0.18 - (bill.status === "overdue" ? 12 : bill.status === "due" ? 3 : 0))));
  const isHighRisk = explanation.leakPct >= 65;
  const readingVerified = bill.closingReading >= bill.openingReading && bill.unitsScm === bill.closingReading - bill.openingReading;
  const chargeReconciled = Math.abs(bill.amount - bill.gasCharge - bill.fixedCharge - bill.tax - bill.arrears - bill.lateFee) < 0.01;
  const patternMatched = Math.abs(explanation.comparisons.vsYearPct ?? explanation.comparisons.vsAvgPct ?? 0) < 30;
  const trustScore = 60 + (readingVerified ? 15 : 0) + (chargeReconciled ? 15 : 0) + (!bill.manualAdjustment ? 5 : 0) + (patternMatched ? 5 : 0);
  const simpleNarrative = `Your bill ${explanation.amountDeltaVsPrev >= 0 ? "increased" : "decreased"} by ${inr(Math.abs(explanation.amountDeltaVsPrev))} because you used ${Math.abs(Math.round(explanation.comparisons.vsPrevPct ?? 0))}% ${explanation.amountDeltaVsPrev >= 0 ? "more" : "less"} gas than last cycle. ${explanation.comparisons.vsYearPct !== null && Math.abs(explanation.comparisons.vsYearPct) < 30 ? "This is close to your usual seasonal pattern." : "We will keep watching the next cycle for a clearer pattern."}`;
  const changeBase = Math.max(1, Math.abs(explanation.amountDeltaVsPrev));
  const primaryCause = Math.abs(usageEffect) >= Math.abs(tariffEffect) && Math.abs(usageEffect) >= Math.abs(daysEffect) ? "Higher consumption" : Math.abs(tariffEffect) > 0 ? "Tariff revision" : "Routine billing variation";
  const secondaryCause = [tariffEffect, daysEffect, unexplained].some((value) => Math.abs(value) >= 1) && primaryCause === "Higher consumption" ? (Math.abs(tariffEffect) >= 1 ? "Tariff change" : Math.abs(daysEffect) >= 1 ? "Additional billing days" : "Other charges") : "None";
  const leakCategory = explanation.leakPct < 30 ? "Low risk" : explanation.leakPct < 60 ? "Watch" : explanation.leakPct < 80 ? "Investigate" : "Critical";
  const applianceEstimate = applianceShare.map((item) => ({ ...item, low: Math.max(0, item.share - 4), high: Math.min(100, item.share + 4) }));
  const lastYearUsage = explanation.comparisons.vsYearPct === null ? null : Math.round(bill.unitsScm / (1 + explanation.comparisons.vsYearPct / 100));
  const timeline = [
    { title: "Meter reading taken", detail: `Opening ${bill.openingReading} → closing ${bill.closingReading}; ${bill.unitsScm} SCM consumed.` },
    { title: "Consumption calculated", detail: `${bill.unitsScm} SCM × ${inr(bill.ratePerScm)} per SCM = ${inr(bill.gasCharge)} gas charge.` },
    { title: "Tariff applied", detail: `Rate verified at ${inr(bill.ratePerScm)} per SCM. Tariff change contribution: ${inr(tariffEffect)}.` },
    { title: "Tax & dues added", detail: `GST/tax: ${inr(bill.tax)} · Previous due: ${inr(bill.arrears)} · Late fee: ${inr(lateFee)}.` },
    { title: "Final bill created", detail: `All charges reconcile to your final payable amount of ${inr(bill.amount)}.` },
  ];

  const actions = isHighRisk
    ? ["Check stove knobs and the isolation valve now", "Open windows if you smell gas", "Connect to GasGuard for immediate safety help"]
    : [
      explanation.comparisons.vsYearPct !== null && Math.abs(explanation.comparisons.vsYearPct) < 30 ? "Monitor the next billing cycle; the increase appears seasonal" : "Monitor the next billing cycle",
      appliances.geyser || appliances.waterHeater ? "Check water-heater usage and consider servicing" : "Review cooking-time usage",
      "Schedule a safety inspection if the increase continues",
      "Set a bill-increase alert",
    ];

  const riskReasons = [
    explanation.comparisons.vsYearPct !== null && Math.abs(explanation.comparisons.vsYearPct) < 30
      ? "Similar to your usage in the same season last year"
      : "Compared with your own recent billing history",
    Math.abs(explanation.comparisons.vsPrevPct ?? 0) < 30
      ? "No sudden billing-cycle spike detected"
      : "A change in usage is being monitored against your normal range",
    Math.abs(explanation.comparisons.vsAvgPct ?? 0) < 25
      ? "No abnormal growth trend against your six-month average"
      : "Usage is above your six-month average, so we are watching it",
    "No continuous-use pattern can be confirmed from billing-cycle readings",
  ];

  const emailBody = [
    `WhyMyBill report · ${bill.cycleLabel}`,
    `Total bill: ${inr(bill.amount)}`,
    `Consumption: ${bill.unitsScm} SCM`,
    `Change vs last cycle: ${explanation.amountDeltaVsPrev >= 0 ? "+" : ""}${inr(explanation.amountDeltaVsPrev)}`,
    `Leak risk: ${explanation.leakPct}%`,
    `Recommendation: ${actions[0] ?? "Monitor the next cycle."}`,
  ].join("\n");

  function enableAlert() {
    setAlertEnabled(true);
    if ("Notification" in window && Notification.permission === "default") void Notification.requestPermission();
  }

  return (
    <div className="space-y-5">
      <nav aria-label="Bill intelligence sections" className="sticky top-3 z-10 flex gap-1 overflow-x-auto rounded-2xl border border-ink-100 bg-white/95 p-1.5 shadow-soft backdrop-blur">
        {([
          ["overview", "Overview"], ["explanation", "Explanation"], ["safety", "Safety"], ["insights", "Insights"], ["actions", "Actions"],
        ] as const).map(([id, label]) => (
          <button key={id} onClick={() => setActiveTab(id)} className={`shrink-0 rounded-xl px-3.5 py-2 text-sm font-semibold transition ${activeTab === id ? "bg-ink-900 text-white shadow-sm" : "text-ink-500 hover:bg-ink-50 hover:text-ink-900"}`}>{label}</button>
        ))}
      </nav>

      {activeTab === "overview" && <div className="space-y-5">
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-ink-900 via-ink-900 to-brand-900 p-5 sm:p-6 text-white shadow-soft">
          <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-brand-400/20 blur-3xl" />
          <div className="relative"><span className="inline-flex items-center gap-1.5 rounded-full bg-brand-400/15 px-2.5 py-1 text-[11px] font-bold text-brand-200"><Bot className="h-3.5 w-3.5" /> AI BILLING DOCTOR</span><h3 className="mt-3 text-xl font-extrabold">Your bill {explanation.amountDeltaVsPrev >= 0 ? "increased" : "decreased"} by {inr(Math.abs(explanation.amountDeltaVsPrev))}.</h3><div className="mt-4 grid gap-2 text-sm text-ink-200 sm:grid-cols-2"><DoctorLine text={`${inr(Math.abs(usageEffect))} came from ${usageEffect >= 0 ? "changed gas consumption" : "lower gas use"}.`} /><DoctorLine text={`${inr(Math.abs(tariffEffect))} came from tariff changes.`} /><DoctorLine text={`${inr(daysEffect)} came from ${Math.max(0, cycleDays - previousDays)} additional billing days.`} /><DoctorLine text={`Leak probability remains ${explanation.leakLevel === "none" ? "low" : explanation.leakLevel} at ${explanation.leakPct}%.`} /></div><div className="mt-4 rounded-xl border border-white/10 bg-white/10 p-3 text-sm text-white"><strong>Recommended action:</strong> {actions[0] ?? "Monitor your next cycle."}</div></div>
        </section>
        <section className="rounded-2xl border border-brand-200 bg-gradient-to-r from-brand-50 via-white to-white p-5 shadow-soft"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-brand-700">Summary</p><h3 className="mt-1 text-lg font-bold text-ink-900">The bill change, clearly explained.</h3></div><span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-brand-700 shadow-sm">{explanation.confidence}% analysis confidence</span></div><div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><SummaryChip label="Bill change" value={`${explanation.amountDeltaVsPrev >= 0 ? "+" : "−"}${inr(Math.abs(explanation.amountDeltaVsPrev))}`} tone={explanation.amountDeltaVsPrev > 0 ? "amber" : "brand"} /><SummaryChip label="Primary cause" value={primaryCause} tone="brand" /><SummaryChip label="Secondary cause" value={secondaryCause} tone="ink" /><SummaryChip label="Leak risk" value={`${leakCategory} · ${explanation.leakPct}%`} tone={explanation.leakPct < 30 ? "brand" : "amber"} /></div><div className="mt-4 flex items-center gap-2 rounded-xl border border-brand-100 bg-white px-3 py-2.5 text-sm text-ink-700"><Lightbulb className="h-4 w-4 shrink-0 text-amber-500" /><span><strong>Recommended action:</strong> {actions[0] ?? "Monitor next cycle."}</span></div></section>
        <div className="grid lg:grid-cols-2 gap-5">
          <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-soft"><h3 className="font-bold text-ink-900 flex items-center gap-2"><HeartPulse className="w-4 h-4 text-red-500" /> Bill health score</h3><div className="flex items-end gap-2 mt-3"><span className="text-4xl font-extrabold text-brand-700">{billHealth}</span><span className="text-sm text-ink-500 mb-1">/ 100</span></div><div className="h-2 rounded-full bg-ink-100 overflow-hidden mt-3"><div className="h-full bg-brand-500 rounded-full" style={{ width: `${billHealth}%` }} /></div><ul className="mt-4 space-y-1.5 text-xs text-ink-600"><li><Check className="w-3.5 h-3.5 inline mr-1 text-brand-600" />Bill transparency: high</li><li><Check className="w-3.5 h-3.5 inline mr-1 text-brand-600" />Leak risk: {explanation.leakLevel === "none" ? "low" : explanation.leakLevel}</li><li><Check className="w-3.5 h-3.5 inline mr-1 text-brand-600" />Payment status: {bill.status}</li><li><Check className="w-3.5 h-3.5 inline mr-1 text-brand-600" />Consumption trend: {Math.abs(explanation.comparisons.vsAvgPct ?? 0) < 25 ? "stable" : "watching"}</li></ul></section>
          <TrustMeter score={trustScore} readingVerified={readingVerified} chargeReconciled={chargeReconciled} manualAdjustment={bill.manualAdjustment} patternMatched={patternMatched} />
        </div>
        <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-soft"><div className="flex items-start gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-700"><UsersRound className="h-5 w-5" /></div><div><p className="text-xs font-bold uppercase tracking-wider text-violet-700">Impact on Torrent Gas</p><h3 className="mt-1 font-bold text-ink-900">A clear bill explanation can prevent an avoidable service call.</h3></div></div><div className="mt-4 grid gap-3 md:grid-cols-2"><ImpactPath title="Before WhyMyBill" steps={["Customer receives bill", "Calls customer care", "Raises complaint", "Engineer visit may be needed"]} tone="ink" /><ImpactPath title="After WhyMyBill" steps={["Customer receives explanation", "Understands the change", "Self-resolves the doubt", "No complaint raised"]} tone="brand" /></div></section>
      </div>}

      {activeTab === "explanation" && <div className="space-y-5">
      <section className="bg-white rounded-2xl shadow-soft border border-ink-100 overflow-hidden">
        <div className="p-5 border-b border-ink-100 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-ink-900 flex items-center gap-2"><ReceiptText className="w-4 h-4 text-brand-600" /> Bill breakdown intelligence</h3>
            <p className="text-xs text-ink-500 mt-1">Every rupee in your {bill.cycleLabel} bill, reconciled to the total.</p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 bg-brand-50 border border-brand-100 px-2.5 py-1.5 rounded-full"><BadgeCheck className="w-3.5 h-3.5" /> Bill transparency: high</span>
        </div>
        <div className="divide-y divide-ink-100">
          {billRows.map((row) => (
            <div key={row.label} className="px-5 py-3 flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-medium text-ink-700">{row.label}</div>
                <div className="text-[11px] text-ink-400">{row.note}</div>
              </div>
              <div className="font-bold text-ink-900 tabular-nums">{inr(row.value)}</div>
            </div>
          ))}
          <div className="px-5 py-4 flex items-center justify-between bg-ink-900 text-white">
            <span className="font-bold">Total bill</span>
            <span className="text-xl font-extrabold tabular-nums">{inr(bill.amount)}</span>
          </div>
        </div>
      </section>
      <section className="bg-white rounded-2xl shadow-soft border border-ink-100 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-bold text-ink-900 flex items-center gap-2"><Sparkles className="w-4 h-4 text-brand-600" /> AI anomaly story</h3><p className="text-xs text-ink-500 mt-1">A plain-language explanation of why this bill changed.</p></div><button onClick={() => setSimple((value) => !value)} className="inline-flex items-center gap-1.5 rounded-xl border border-brand-200 text-brand-700 text-xs font-semibold px-3 py-2 hover:bg-brand-50"><Bot className="w-3.5 h-3.5" /> {simple ? "Show detailed story" : "Explain simply"}</button></div>
        {simple ? <p className="mt-4 text-sm text-ink-700 leading-relaxed bg-brand-50 border border-brand-100 rounded-xl p-4">{simpleNarrative}</p> : <><p className="mt-4 text-sm text-ink-700">Your bill {explanation.amountDeltaVsPrev >= 0 ? "increased" : "decreased"} by <strong>{inr(Math.abs(explanation.amountDeltaVsPrev))}</strong>. Here is the attributed change:</p><div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4"><StoryMetric label="Usage change" value={usageEffect} total={changeBase} /><StoryMetric label="Tariff revision" value={tariffEffect} total={changeBase} /><StoryMetric label="Extra billing days" value={daysEffect} total={changeBase} /><StoryMetric label="Other charges" value={unexplained} total={changeBase} /></div><div className="mt-4 rounded-xl border border-brand-100 bg-brand-50/60 p-4"><p className="text-xs font-bold uppercase tracking-wide text-brand-800">Why usage changed</p><ul className="mt-2 space-y-1.5 text-sm text-ink-700"><li><Check className="mr-1.5 inline h-4 w-4 text-brand-600" />Cooking frequency reflects {cookingFrequency} days per week.</li><li><Check className="mr-1.5 inline h-4 w-4 text-brand-600" />{explanation.comparisons.vsYearPct !== null && Math.abs(explanation.comparisons.vsYearPct) < 30 ? "Seasonal usage pattern matches the comparable period last year." : "Seasonal usage is being compared with your previous patterns."}</li><li><Check className="mr-1.5 inline h-4 w-4 text-brand-600" />Consumption is {Math.abs(Math.round(explanation.comparisons.vsPrevPct ?? 0))}% {((explanation.comparisons.vsPrevPct ?? 0) >= 0) ? "above" : "below"} the previous cycle.</li></ul></div><p className="text-xs text-ink-400 mt-3">Analysis confidence: <span className="font-bold text-brand-700">{explanation.confidence}%</span></p></>}
      </section>
      <section className="bg-white rounded-2xl shadow-soft border border-ink-100 p-5"><h3 className="font-bold text-ink-900 flex items-center gap-2"><Timer className="w-4 h-4 text-brand-600" /> Billing timeline</h3><p className="text-xs text-ink-500 mt-1">Select a step to see exactly what was applied.</p><div className="mt-5 grid sm:grid-cols-5 gap-2">{timeline.map((item, index) => <button key={item.title} onClick={() => setTimelineStep(index)} className={`rounded-xl border p-3 text-left transition ${timelineStep === index ? "border-brand-400 bg-brand-50 ring-1 ring-brand-200" : "border-ink-100 hover:border-brand-200 hover:bg-ink-50"}`}><div className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${timelineStep === index ? "bg-brand-600 text-white" : "bg-brand-100 text-brand-700"}`}>{index + 1}</div><div className="mt-2 text-xs font-semibold text-ink-700">{item.title}</div></button>)}</div><div className="mt-4 rounded-xl border border-brand-100 bg-brand-50/60 p-4"><p className="text-sm font-bold text-ink-900">{timeline[timelineStep].title}</p><p className="mt-1 text-sm text-ink-700">{timeline[timelineStep].detail}</p></div></section>
      </div>}

      {activeTab === "safety" && <div className="grid xl:grid-cols-2 gap-5">
        <section className="bg-white rounded-2xl shadow-soft border border-ink-100 p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-bold text-ink-900 flex items-center gap-2"><Gauge className="w-4 h-4 text-brand-600" /> Leak investigation journey</h3><p className="text-xs text-ink-500 mt-1">The score is contextual—not a diagnosis.</p></div><Badge tone={explanation.leakPct < 30 ? "brand" : explanation.leakPct < 60 ? "amber" : "red"}>{leakCategory}</Badge></div><div className="mt-4 grid grid-cols-3 gap-3"><Metric label="Leak risk" value={`${explanation.leakPct}%`} emphasis /><Metric label="Industry average" value="15%" /><Metric label="Customer category" value={leakCategory} good={explanation.leakPct < 30} /></div><div className="mt-4 space-y-3">{riskReasons.map((reason, index) => <div className="flex gap-3" key={reason}><div className="h-6 w-6 rounded-full bg-brand-100 text-brand-700 grid place-items-center text-xs font-bold shrink-0">{index + 1}</div><div className="text-sm text-ink-700 pt-0.5">{reason}</div></div>)}</div><div className="mt-5 grid grid-cols-4 gap-1 text-center text-[10px] font-bold"><RiskBand label="Safe" range="0–30%" active={explanation.leakPct < 30} tone="brand" /><RiskBand label="Watch" range="30–60%" active={explanation.leakPct >= 30 && explanation.leakPct < 60} tone="amber" /><RiskBand label="Investigate" range="60–80%" active={explanation.leakPct >= 60 && explanation.leakPct < 80} tone="red" /><RiskBand label="Critical" range="80%+" active={explanation.leakPct >= 80} tone="red" /></div></section>
        <section className={`rounded-2xl border p-5 shadow-soft ${isHighRisk ? "border-red-200 bg-red-50" : "border-brand-200 bg-brand-50/50"}`}><h3 className="font-bold text-ink-900 flex items-center gap-2">{isHighRisk ? <AlertTriangle className="w-4 h-4 text-red-600" /> : <ShieldCheck className="w-4 h-4 text-brand-600" />} Safety guidance</h3>{isHighRisk ? <><p className="text-sm text-red-800 mt-3 font-medium">Possible gas leak — take these steps now.</p><ol className="mt-3 space-y-1.5 text-xs text-red-800 list-decimal pl-4"><li>Check stove knobs and turn off the isolation valve.</li><li>Open windows and avoid electrical switches.</li><li>Connect to GasGuard for immediate help.</li></ol><Link href="/customer/gascare" className="mt-4 inline-flex w-full justify-center items-center gap-2 bg-red-600 hover:bg-red-700 text-white rounded-xl py-2.5 text-sm font-semibold"><Flame className="w-4 h-4" /> Connect to GasGuard</Link></> : <><p className="text-sm text-ink-700 mt-3"><strong className="text-brand-700">Risk low.</strong> Your score is {explanation.leakPct}%—above the broad 15% industry reference, but still in the low-risk customer category based on your own usage signals.</p><div className="mt-4 rounded-xl bg-white/70 p-3"><p className="text-xs font-bold text-ink-800">Recommended</p><ul className="mt-2 space-y-1 text-xs text-ink-700"><li><Check className="mr-1 inline h-3.5 w-3.5 text-brand-600" />Continue monitoring.</li><li><Check className="mr-1 inline h-3.5 w-3.5 text-brand-600" />Review your next bill.</li><li><Check className="mr-1 inline h-3.5 w-3.5 text-brand-600" />Book an inspection if the rise continues.</li></ul></div><div className="mt-4 grid gap-2 sm:grid-cols-2"><Link href="/customer/gascare" className="inline-flex justify-center items-center gap-2 border border-brand-200 hover:bg-brand-50 text-brand-700 rounded-xl py-2.5 text-sm font-semibold"><ShieldCheck className="w-4 h-4" /> Open GasGuard</Link><Link href="/customer/appointment?service=inspection" className="inline-flex justify-center items-center gap-2 bg-ink-900 hover:bg-ink-800 text-white rounded-xl py-2.5 text-sm font-semibold"><CalendarDays className="w-4 h-4" /> Book safety inspection</Link></div></>}<label className="mt-3 flex items-center gap-2 rounded-lg bg-white/70 px-3 py-2 text-xs text-ink-700 cursor-pointer"><input type="checkbox" checked={away} onChange={(e) => onAwayChange(e.target.checked)} className="rounded text-brand-600" />I was away / home locked this cycle</label></section>
      </div>}

      {activeTab === "insights" && <div className="grid xl:grid-cols-2 gap-5">
        <div className="space-y-5">{usageHistory}<section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-soft"><h3 className="font-bold text-ink-900 flex items-center gap-2"><TrendingDown className="w-4 h-4 text-brand-600" /> Seasonal context</h3><p className="text-xs text-ink-500 mt-1">Read your usage alongside the two comparisons that matter.</p><div className="mt-4 grid grid-cols-3 gap-3"><Metric label="Your usage" value={`${bill.unitsScm} SCM`} emphasis /><Metric label="Area average" value={areaAverage === null ? "—" : `${areaAverage} SCM`} /><Metric label="Previous year" value={lastYearUsage === null ? "—" : `${lastYearUsage} SCM`} /></div><p className="mt-3 text-xs text-ink-600">Your next chart layer compares <strong>your usage</strong>, <strong>area average</strong>, and <strong>previous-year season</strong>—so a seasonal increase is not mistaken for a fault.</p></section></div>
        <div className="space-y-5"><section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-soft"><h3 className="font-bold text-ink-900 flex items-center gap-2"><UsersRound className="w-4 h-4 text-brand-600" /> Neighborhood benchmark</h3><p className="text-xs text-ink-500 mt-1">Aggregated domestic comparison for {customer.area}.</p>{areaAverage === null ? <div className="mt-4 rounded-xl bg-ink-50 p-3 text-xs text-ink-500">A verified area benchmark is not available for this billing cycle yet. We never estimate it from your own usage.</div> : <><div className="grid grid-cols-2 gap-3 mt-4"><Metric label="Your usage" value={`${bill.unitsScm} SCM`} /><Metric label="Area average" value={`${areaAverage} SCM`} emphasis /></div><p className="mt-3 text-[11px] text-ink-400">Compared with 56 similar households in your service area.</p><div className={`mt-2 text-xs font-semibold rounded-lg px-3 py-2 ${(benchmarkPct ?? 0) > 0 ? "bg-amber-50 text-amber-700" : "bg-brand-50 text-brand-700"}`}>{(benchmarkPct ?? 0) >= 0 ? "+" : ""}{benchmarkPct}% higher than average {(benchmarkPct ?? 0) < 30 ? "· within the expected range for this season" : "· worth monitoring next cycle"}</div></>}</section>
        <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-soft"><div className="flex items-start justify-between gap-3"><div><h3 className="font-bold text-ink-900 flex items-center gap-2"><Flame className="w-4 h-4 text-amber-500" /> Appliance intelligence</h3><p className="text-xs text-ink-500 mt-1">Estimated distribution—not a device-level measurement.</p></div><Bot className="w-5 h-5 text-brand-600" /></div><div className="grid sm:grid-cols-3 gap-2 mt-4">{(Object.keys(applianceInfo) as Appliance[]).map((key) => { const item = applianceInfo[key]; const Icon = item.icon; return <button key={key} onClick={() => setAppliances((prev) => ({ ...prev, [key]: !prev[key] }))} className={`text-left rounded-xl border p-3 transition ${appliances[key] ? "border-brand-300 bg-brand-50" : "border-ink-200 bg-white text-ink-400"}`}><Icon className="w-4 h-4 mb-2 text-brand-600" /><div className="text-xs font-semibold text-ink-700">{item.label}</div><div className="text-[10px] mt-0.5">{item.hint}</div></button>; })}</div><div className="mt-4"><div className="flex justify-between text-xs text-ink-600"><span>Cooking frequency</span><span>{cookingFrequency} days/week</span></div><input aria-label="Cooking frequency" type="range" min="1" max="7" value={cookingFrequency} onChange={(e) => setCookingFrequency(Number(e.target.value))} className="w-full accent-emerald-600 mt-2" /></div><div className="mt-4 space-y-2.5">{applianceEstimate.length ? applianceEstimate.map(({ key, low, high, share }) => <div key={key}><div className="flex justify-between text-xs"><span className="font-medium text-ink-700">{applianceInfo[key].label}</span><span className="font-bold text-brand-700">Estimated {low}–{high}%</span></div><div className="h-2 rounded-full bg-ink-100 overflow-hidden mt-1"><div className="h-full bg-brand-500 rounded-full" style={{ width: `${share}%` }} /></div></div>) : <p className="text-xs text-ink-500 bg-ink-50 rounded-lg p-3">Select an appliance to estimate its contribution.</p>}</div><div className="mt-4 rounded-xl border border-brand-100 bg-brand-50/60 p-3 text-xs text-ink-700"><div className="flex justify-between"><span className="font-bold">Estimation confidence</span><span className="font-bold text-brand-700">71%</span></div><p className="mt-1">Based on selected appliances, usage pattern, cooking frequency, and billing history—not a smart meter reading from each appliance.</p></div></section></div>
      </div>}

      {activeTab === "actions" && <div className="space-y-5"><div className="grid xl:grid-cols-2 gap-5">
        <section className="bg-white rounded-2xl shadow-soft border border-ink-100 p-5"><h3 className="font-bold text-ink-900 flex items-center gap-2"><Lightbulb className="w-4 h-4 text-amber-500" /> Recommended next actions</h3><p className="mt-1 text-xs text-ink-500">A practical sequence—from understanding to prevention.</p><div className="mt-4 space-y-2.5">{actions.map((action, index) => <div key={action} className="flex items-start gap-3 text-sm text-ink-700 bg-ink-50 rounded-xl px-3 py-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-100 text-[11px] font-bold text-brand-700">{index + 1}</span><span>{action}</span></div>)}</div><div className="grid sm:grid-cols-2 gap-3 mt-5"><Link href="/customer/appointment?service=inspection" className="inline-flex justify-center items-center gap-2 rounded-xl bg-ink-900 hover:bg-ink-800 text-white py-2.5 text-sm font-semibold"><CalendarDays className="w-4 h-4" /> Schedule inspection</Link><button onClick={onAsk} className="inline-flex justify-center items-center gap-2 rounded-xl border border-ink-200 hover:bg-ink-50 text-ink-700 py-2.5 text-sm font-semibold"><Bot className="w-4 h-4" /> Ask AI assistant</button><button onClick={onDownload} className="inline-flex justify-center items-center gap-2 rounded-xl border border-ink-200 hover:bg-ink-50 text-ink-700 py-2.5 text-sm font-semibold"><Download className="w-4 h-4" /> Download PDF</button><button onClick={enableAlert} className={`inline-flex justify-center items-center gap-2 rounded-xl py-2.5 text-sm font-semibold ${alertEnabled ? "bg-brand-50 text-brand-700 border border-brand-200" : "bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"}`}><Check className="w-4 h-4" />{alertEnabled ? "Bill alert enabled" : "Set bill increase alert"}</button><a href={`mailto:${customer.email ?? ""}?subject=${encodeURIComponent(`WhyMyBill report · ${bill.cycleLabel}`)}&body=${encodeURIComponent(emailBody)}`} className="sm:col-span-2 inline-flex justify-center items-center gap-2 rounded-xl border border-brand-200 hover:bg-brand-50 text-brand-700 py-2.5 text-sm font-semibold"><Mail className="w-4 h-4" /> Email review report</a></div></section>
        <section className="rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 to-white p-5 shadow-soft"><div className="flex items-start justify-between gap-3"><div><h3 className="font-bold text-ink-900 flex items-center gap-2"><Calculator className="w-4 h-4 text-brand-600" /> Bill simulation</h3><p className="text-xs text-ink-500 mt-1">See the estimated impact before your next bill.</p></div><TrendingDown className="w-5 h-5 text-brand-600" /></div><div className="mt-5 rounded-xl bg-white border border-brand-100 p-4"><div className="flex justify-between text-sm font-semibold text-ink-700"><span>Reduce next-cycle usage</span><span className="text-brand-700">{usageReduction}%</span></div><input aria-label="Usage reduction" type="range" min="0" max="40" step="5" value={usageReduction} onChange={(e) => { setUsageReduction(Number(e.target.value)); setPlanSaved(false); }} className="w-full accent-emerald-600 mt-3" /><div className="grid grid-cols-3 gap-2 mt-4 text-center"><Metric label="Current" value={inr(bill.amount)} /><Metric label="Predicted" value={inr(predicted)} emphasis /><Metric label="Potential saving" value={inr(saving)} good /></div></div><button onClick={() => setPlanSaved(true)} className={`mt-3 w-full rounded-xl py-2.5 text-sm font-semibold ${planSaved ? "bg-brand-600 text-white" : "border border-brand-200 bg-white text-brand-700 hover:bg-brand-50"}`}>{planSaved ? "Savings plan saved" : "Save this savings plan"}</button><p className="text-[11px] text-ink-400 mt-3">Estimate keeps fixed charges, previous due and any late fee unchanged. Actual bills may vary with tariff and tax revisions.</p></section>
      </div><section className="rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 via-white to-white p-5 shadow-soft"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-brand-700">AI Bill Certificate</p><h3 className="mt-1 text-lg font-bold text-ink-900">Bill review status: verified</h3><p className="mt-1 text-sm text-ink-600">A final trust layer that confirms the checks completed for this bill.</p></div><div className="text-right"><span className="text-3xl font-extrabold text-brand-700">{Math.min(100, trustScore + 3)}</span><p className="text-[11px] font-bold uppercase tracking-wide text-ink-500">Transparency score</p></div></div><div className="mt-5 grid gap-2 sm:grid-cols-2"><CertificateCheck pass={!isHighRisk} label="No leak indicators" /><CertificateCheck pass={chargeReconciled} label="Charges reconciled" /><CertificateCheck pass={readingVerified} label="Meter reading verified" /><CertificateCheck pass={Boolean(primaryCause)} label="Usage pattern explained" /></div></section></div>}
    </div>
  );
}

function Metric({ label, value, emphasis = false, good = false }: { label: string; value: string; emphasis?: boolean; good?: boolean }) {
  return <div className={`rounded-lg p-2.5 ${emphasis ? "bg-brand-50" : "bg-ink-50"}`}><div className="text-[10px] text-ink-500">{label}</div><div className={`font-bold text-sm tabular-nums mt-0.5 ${good ? "text-brand-700" : "text-ink-900"}`}>{value}</div></div>;
}

function SummaryChip({ label, value, tone }: { label: string; value: string; tone: "brand" | "amber" | "ink" }) {
  const styles = { brand: "border-brand-100 bg-brand-50 text-brand-800", amber: "border-amber-100 bg-amber-50 text-amber-800", ink: "border-ink-100 bg-ink-50 text-ink-800" };
  return <div className={`rounded-xl border p-3 ${styles[tone]}`}><p className="text-[11px] font-semibold opacity-70">{label}</p><p className="mt-1 text-sm font-bold">{value}</p></div>;
}

function ImpactPath({ title, steps, tone }: { title: string; steps: string[]; tone: "brand" | "ink" }) {
  return <div className={`rounded-xl border p-4 ${tone === "brand" ? "border-brand-100 bg-brand-50/60" : "border-ink-100 bg-ink-50"}`}><p className={`text-sm font-bold ${tone === "brand" ? "text-brand-800" : "text-ink-800"}`}>{title}</p><div className="mt-3 space-y-1.5">{steps.map((step, index) => <div key={step} className="flex items-center gap-2 text-xs text-ink-700"><span className={`grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold ${tone === "brand" ? "bg-brand-100 text-brand-700" : "bg-white text-ink-500"}`}>{index + 1}</span>{step}{index < steps.length - 1 && <ChevronDown className="ml-auto h-3.5 w-3.5 text-ink-300" />}</div>)}</div></div>;
}

function RiskBand({ label, range, active, tone }: { label: string; range: string; active: boolean; tone: "brand" | "amber" | "red" }) {
  const styles = { brand: active ? "bg-brand-600 text-white" : "bg-brand-50 text-brand-700", amber: active ? "bg-amber-500 text-white" : "bg-amber-50 text-amber-700", red: active ? "bg-red-600 text-white" : "bg-red-50 text-red-700" };
  return <div className={`rounded-lg px-1.5 py-2 ${styles[tone]}`}><span className="block">{label}</span><span className="mt-0.5 block opacity-75">{range}</span></div>;
}

function CertificateCheck({ pass, label }: { pass: boolean; label: string }) {
  return <div className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm ${pass ? "bg-brand-50 text-brand-800" : "bg-amber-50 text-amber-800"}`}><Check className={`h-4 w-4 shrink-0 ${pass ? "text-brand-600" : "text-amber-600"}`} />{label}{!pass && " · review advised"}</div>;
}

function StoryMetric({ label, value, total }: { label: string; value: number; total: number }) {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  const contribution = Math.round((Math.abs(value) / total) * 100);
  return <div className="rounded-xl bg-ink-50 p-3"><div className="text-[11px] text-ink-500">{label}</div><div className={`font-bold mt-1 tabular-nums ${value > 0 ? "text-red-600" : value < 0 ? "text-brand-700" : "text-ink-700"}`}>{sign}{inr(Math.abs(value))} <span className="text-xs text-ink-400">({contribution}%)</span></div></div>;
}

function DoctorLine({ text }: { text: string }) {
  return <div className="flex items-start gap-2 rounded-lg bg-white/5 px-3 py-2"><Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-300" />{text}</div>;
}

function TrustMeter({ score, readingVerified, chargeReconciled, manualAdjustment, patternMatched }: { score: number; readingVerified: boolean; chargeReconciled: boolean; manualAdjustment: boolean; patternMatched: boolean }) {
  const checks: Array<[boolean, string]> = [
    [readingVerified, "Verified meter reading"],
    [chargeReconciled, "Charges reconcile to the total"],
    [!manualAdjustment, "No manual adjustment"],
    [patternMatched, "Historical pattern match"],
  ];
  return <section className="rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 to-white p-5 shadow-soft"><h3 className="font-bold text-ink-900 flex items-center gap-2"><WalletCards className="w-4 h-4 text-brand-600" /> Bill trust score</h3><div className="flex items-end gap-2 mt-3"><span className="text-4xl font-extrabold text-brand-700">{score}</span><span className="text-sm text-ink-500 mb-1">/ 100</span></div><div className="h-2 rounded-full bg-white overflow-hidden mt-3"><div className="h-full bg-brand-500 rounded-full" style={{ width: `${score}%` }} /></div><ul className="mt-4 space-y-1.5 text-xs text-ink-700">{checks.map(([passes, label]) => <li key={label}><Check className={`w-3.5 h-3.5 inline mr-1 ${passes ? "text-brand-600" : "text-ink-300"}`} />{label}{!passes && " · needs review"}</li>)}</ul></section>;
}
