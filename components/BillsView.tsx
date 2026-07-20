"use client";

import { useState, useMemo, useEffect } from "react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import {
  ReceiptText, Download, ArrowUpRight, ArrowDownRight, Minus, Database, HardDrive, Calendar,
} from "lucide-react";
import { CustomerWithBills } from "@/lib/types";
import { explainBill, inr } from "@/lib/billExplain";
import { downloadBillPdf } from "@/lib/pdf";
import BillAssistant from "@/components/BillAssistant";
import BillIntelligence from "@/components/BillIntelligence";

function useCountUp(target: number, key: string | number) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const dur = 650;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      setV(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, key]);
  return v;
}

export default function BillsView({ customers, live }: { customers: CustomerWithBills[]; live: boolean }) {
  // A logged-in customer only ever sees their own account.
  const customer = customers?.[0];
  const bills = useMemo(() => customer?.bills ?? [], [customer]);
  const [billId, setBillId] = useState(bills[bills.length - 1]?.id);
  const [away, setAway] = useState(false);
  const [askOpen, setAskOpen] = useState(false);

  const bill = bills.find((b) => b.id === billId) ?? bills[bills.length - 1];
  const previousBill = bills.findIndex((b) => b.id === bill?.id) > 0
    ? bills[bills.findIndex((b) => b.id === bill?.id) - 1]
    : undefined;
  const explanation = useMemo(
    () => (bill && customer) ? explainBill(bills, customer, bill.id, away) : null,
    [bills, customer, bill, away]
  );

  const animAmount = useCountUp(bill?.amount ?? 0, bill?.id ?? "");

  if (!customer || !bill || !explanation) {
    return (
      <div className="p-8 text-center text-ink-500 bg-white rounded-xl border border-ink-100">
        No billing records found.
      </div>
    );
  }

  const chartData = bills.map((b, index) => {
    const label = b.cycleLabel ?? "";
    const name = label.includes(" 20") ? label.replace(" 20", " '") : label;
    const isWinterMonth = b.periodEnd ? [11, 12, 1, 2].includes(new Date(b.periodEnd).getUTCMonth() + 1) : false;
    return { name, units: b.unitsScm ?? 0, area: b.areaAverageScm ?? null, previousYear: bills[index - 6]?.unitsScm ?? null, id: b.id, winter: isWinterMonth };
  });
  const verdictTone = explanation.verdict === "leak" ? "red" : explanation.verdict === "under" ? "sky" : "brand";

  return (
    <div className="space-y-6 reveal">
      {/* header + account switcher */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-brand-100 grid place-items-center shrink-0">
            <ReceiptText className="w-5 h-5 text-brand-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-ink-900">WhyMyBill</h2>
            <p className="text-sm text-ink-500 mt-0.5">Every charge explained from your own history — no guesswork.</p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-full border ${live ? "bg-brand-50 border-brand-200 text-brand-700" : "bg-ink-100 border-ink-200 text-ink-500"}`}>
          {live ? <Database className="w-3.5 h-3.5" /> : <HardDrive className="w-3.5 h-3.5" />}
          {live ? "Live · Supabase" : "Demo data"}
        </span>
      </div>

      {/* logged-in account summary */}
      <div className="bg-white rounded-xl  border border-ink-100 p-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-brand-100 grid place-items-center text-brand-700 font-bold">
          {customer.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-bold text-ink-900 truncate">{customer.name}</div>
          <div className="text-xs text-ink-500 truncate">A/C {customer.accountNo} · {customer.area}</div>
        </div>
        <span className="ml-auto text-xs font-semibold px-2.5 py-1 rounded-full bg-ink-100 text-ink-600 capitalize">{customer.type}</span>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* bill list */}
        <div className="bg-white rounded-xl  border border-ink-100 overflow-hidden">
          <div className="p-4 border-b border-ink-100 flex items-center gap-2">
            <ReceiptText className="w-4 h-4 text-brand-600" />
            <h3 className="font-bold text-ink-900">Your bills</h3>
            <span className="ml-auto text-xs text-ink-400">{bills.length} cycles</span>
          </div>
          <ul className="divide-y divide-ink-100 max-h-[460px] overflow-y-auto">
            {[...bills].reverse().map((b) => (
              <li key={b.id}>
                <button
                  onClick={() => setBillId(b.id)}
                  className={`w-full text-left px-4 py-3 flex items-center justify-between transition border-l-2 ${b.id === bill.id ? "bg-brand-50 border-brand-500" : "border-transparent hover:bg-ink-50"}`}
                >
                  <div>
                    <div className="text-sm font-semibold text-ink-800">{b.cycleLabel}</div>
                    <div className="text-xs text-ink-500">{b.unitsScm} SCM</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-ink-900">{inr(b.amount)}</div>
                    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${b.status === "paid" ? "bg-brand-100 text-brand-700" : "bg-amber-100 text-amber-700"}`}>
                      {b.status}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* main */}
        <div className="lg:col-span-2 space-y-5">
          {/* hero */}
          <div className="rounded-xl bg-ink-950 text-white p-6  relative overflow-hidden">
            <div className="relative flex items-start justify-between flex-wrap gap-4">
              <div>
                <div className="text-xs text-brand-300 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {bill.cycleLabel}</div>
                <div className="text-4xl sm:text-5xl font-bold mt-1 tabular-nums">{inr(animAmount)}</div>
                <div className="flex items-center gap-2 mt-2.5">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${bill.status === "paid" ? "bg-brand-400/20 text-brand-200" : "bg-amber-400/20 text-amber-100"}`}>
                    {bill.status === "paid" ? "Paid" : "Due"}
                  </span>
                  <span className="text-xs text-ink-300">{bill.unitsScm} SCM · {bill.status === "paid" ? fmt(bill.paidOn) : fmt(bill.dueDate)}</span>
                </div>
              </div>
              <button
                onClick={() => downloadBillPdf(customer, bill)}
                className="flex items-center justify-center gap-2 text-sm font-semibold bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl px-4 py-2.5 transition w-full sm:w-auto"
              >
                <Download className="w-4 h-4" /> Download PDF
              </button>
            </div>
          </div>

          {/* comparison chips */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <CompareChip label="vs last cycle" pct={explanation.comparisons.vsPrevPct} />
            <CompareChip label="vs last year" pct={explanation.comparisons.vsYearPct} sub={explanation.comparisons.yoyLabel ?? undefined} />
            <CompareChip label="vs 6-mo avg" pct={explanation.comparisons.vsAvgPct} sub={explanation.comparisons.avgUnits ? `${explanation.comparisons.avgUnits} SCM` : undefined} />
          </div>

        </div>
      </div>

      <BillIntelligence
        bill={bill}
        previousBill={previousBill}
        customer={customer}
        explanation={explanation}
        away={away}
        onAwayChange={setAway}
        onAsk={() => setAskOpen(true)}
        onDownload={() => downloadBillPdf(customer, bill)}
        usageHistory={
          <div className="bg-white rounded-xl  border border-ink-100 p-5">
            <h3 className="font-bold text-ink-900 mb-3">Consumption history (SCM)</h3>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} interval={0} angle={-12} dy={8} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="units" name="Your usage" stroke={verdictTone === "red" ? "#ef4444" : verdictTone === "sky" ? "#0ea5e9" : "#10b981"} strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="area" name="Area average" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 4" dot={false} connectNulls />
                    <Line type="monotone" dataKey="previousYear" name="Previous year" stroke="#f59e0b" strokeWidth={2} dot={false} connectNulls />
                  </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-xs text-ink-500">Seasonal overlay compares your usage with available area averages and the same position last year.</p>
          </div>
        }
      />

      {askOpen && (
        <BillAssistant key={bill.id + String(away)} explanation={explanation} bill={bill} customer={customer} onClose={() => setAskOpen(false)} />
      )}
    </div>
  );
}

function CompareChip({ label, pct, sub }: { label: string; pct: number | null; sub?: string }) {
  const up = (pct ?? 0) > 0;
  const flat = pct === null || Math.abs(pct) < 1;
  const color = flat ? "text-ink-500" : up ? "text-red-600" : "text-brand-600";
  const chip = flat ? "bg-ink-100 text-ink-400" : up ? "bg-red-50 text-red-500" : "bg-brand-50 text-brand-600";
  return (
    <div className="bg-white rounded-xl  border border-ink-100 p-4 lift">
      <div className="flex items-center justify-between">
        <span className="text-xs text-ink-500">{label}</span>
        <span className={`h-6 w-6 rounded-lg grid place-items-center ${chip}`}>
          {flat ? <Minus className="w-3.5 h-3.5" /> : up ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
        </span>
      </div>
      <div className={`text-2xl font-bold mt-2 tabular-nums ${color}`}>{pct === null ? "—" : `${Math.abs(pct)}%`}</div>
      {sub && <div className="text-xs text-ink-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function fmt(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
