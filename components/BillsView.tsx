"use client";

import { useState, useMemo, useEffect } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from "recharts";
import {
  ReceiptText, Download, Sparkles, ShieldCheck, AlertTriangle, Gauge,
  ArrowUpRight, ArrowDownRight, Minus, TrendingUp, Database, HardDrive, Calendar,
} from "lucide-react";
import { CustomerWithBills } from "@/lib/types";
import { explainBill, inr } from "@/lib/billExplain";
import { downloadBillPdf } from "@/lib/pdf";

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
  const [custId, setCustId] = useState(customers[0]?.id);
  const customer = customers.find((c) => c.id === custId) ?? customers[0];
  const bills = customer.bills;
  const [billId, setBillId] = useState(bills[bills.length - 1]?.id);

  // keep a valid bill selected when switching customers
  useEffect(() => {
    setBillId(customer.bills[customer.bills.length - 1]?.id);
  }, [custId]); // eslint-disable-line react-hooks/exhaustive-deps

  const bill = bills.find((b) => b.id === billId) ?? bills[bills.length - 1];
  const explanation = useMemo(
    () => explainBill(bills, customer, bill.id),
    [bills, customer, bill.id]
  );

  const animAmount = useCountUp(bill.amount, bill.id);

  const chartData = bills.map((b) => ({ name: b.cycleLabel.replace(" 20", " '"), units: b.unitsScm, id: b.id, winter: [11, 12, 1, 2].includes(new Date(b.periodEnd).getUTCMonth() + 1) }));
  const maxFactor = Math.max(1, ...explanation.factors.map((f) => Math.abs(f.amount)));

  const verdictTone = explanation.verdict === "leak" ? "red" : explanation.verdict === "under" ? "sky" : "brand";
  const toneClasses: Record<string, string> = {
    red: "bg-red-50 border-red-200 text-red-700",
    sky: "bg-sky-50 border-sky-200 text-sky-700",
    brand: "bg-brand-50 border-brand-200 text-brand-700",
  };

  return (
    <div className="space-y-6">
      {/* header + account switcher */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-ink-900">WhyMyBill</h2>
          <p className="text-sm text-ink-500 mt-0.5">Every charge explained from your own history — no guesswork.</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-full border ${live ? "bg-brand-50 border-brand-200 text-brand-700" : "bg-ink-100 border-ink-200 text-ink-500"}`}>
          {live ? <Database className="w-3.5 h-3.5" /> : <HardDrive className="w-3.5 h-3.5" />}
          {live ? "Live · Supabase" : "Demo data"}
        </span>
      </div>

      {/* account chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-ink-400 mr-1">Account:</span>
        {customers.map((c) => (
          <button
            key={c.id}
            onClick={() => setCustId(c.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
              c.id === custId ? "bg-ink-900 text-white border-ink-900" : "bg-white text-ink-600 border-ink-200 hover:border-ink-300"
            }`}
          >
            {c.accountNo} · {c.name.split(" ")[0]}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* bill list */}
        <div className="bg-white rounded-2xl shadow-soft border border-ink-100 overflow-hidden">
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
                  className={`w-full text-left px-4 py-3 flex items-center justify-between transition ${b.id === bill.id ? "bg-brand-50" : "hover:bg-ink-50"}`}
                >
                  <div>
                    <div className="text-sm font-semibold text-ink-800">{b.cycleLabel}</div>
                    <div className="text-xs text-ink-500">{b.unitsScm} SCM</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-ink-900">{inr(b.amount)}</div>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${b.status === "paid" ? "bg-brand-100 text-brand-700" : "bg-amber-100 text-amber-700"}`}>
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
          <div className="rounded-2xl bg-gradient-to-br from-ink-900 to-brand-900 text-white p-6 shadow-soft relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-48 h-48 bg-brand-500/20 rounded-full blur-3xl" />
            <div className="relative flex items-start justify-between flex-wrap gap-4">
              <div>
                <div className="text-xs text-brand-300 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {bill.cycleLabel}</div>
                <div className="text-4xl font-extrabold mt-1 tabular-nums">{inr(animAmount)}</div>
                <div className="text-sm text-ink-300 mt-1">
                  {bill.unitsScm} SCM · {bill.status === "paid" ? `Paid ${fmt(bill.paidOn)}` : `Due ${fmt(bill.dueDate)}`}
                </div>
              </div>
              <button
                onClick={() => downloadBillPdf(customer, bill, explanation)}
                className="flex items-center gap-2 text-sm font-semibold bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl px-4 py-2.5 transition"
              >
                <Download className="w-4 h-4" /> Download PDF
              </button>
            </div>
          </div>

          {/* comparison chips */}
          <div className="grid grid-cols-3 gap-3">
            <CompareChip label="vs last cycle" pct={explanation.comparisons.vsPrevPct} />
            <CompareChip label="vs last year" pct={explanation.comparisons.vsYearPct} sub={explanation.comparisons.yoyLabel ?? undefined} />
            <CompareChip label="vs 6-mo avg" pct={explanation.comparisons.vsAvgPct} sub={explanation.comparisons.avgUnits ? `${explanation.comparisons.avgUnits} SCM` : undefined} />
          </div>

          {/* why this amount — breakdown */}
          {explanation.factors.length > 0 && (
            <div className="bg-white rounded-2xl shadow-soft border border-ink-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-ink-900 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-brand-600" /> Why this amount changed</h3>
                <span className={`text-sm font-bold ${explanation.amountDeltaVsPrev >= 0 ? "text-red-600" : "text-brand-600"}`}>
                  {explanation.amountDeltaVsPrev >= 0 ? "+" : ""}{inr(explanation.amountDeltaVsPrev)} vs last cycle
                </span>
              </div>
              <div className="space-y-3">
                {explanation.factors.map((f, i) => {
                  const up = f.amount >= 0;
                  return (
                    <div key={i} className="animate-slideIn" style={{ animationDelay: `${i * 80}ms` }}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="font-medium text-ink-700">{f.label}</span>
                        <span className={`font-bold tabular-nums ${up ? "text-red-600" : "text-brand-600"}`}>{up ? "+" : ""}{inr(f.amount)}</span>
                      </div>
                      <div className="h-2.5 rounded-full bg-ink-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${up ? "bg-red-400" : "bg-brand-400"}`}
                          style={{ width: `${(Math.abs(f.amount) / maxFactor) * 100}%` }}
                        />
                      </div>
                      <div className="text-xs text-ink-400 mt-1">{f.detail}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* narrative + safety */}
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-soft border border-ink-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-ink-900 flex items-center gap-2"><Sparkles className="w-4 h-4 text-brand-600" /> {explanation.headline}</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-ink-400">AI confidence</span>
              <div className="w-20 h-1.5 rounded-full bg-ink-100 overflow-hidden">
                <div className="h-full bg-brand-500 transition-all duration-700" style={{ width: `${explanation.confidence}%` }} />
              </div>
              <span className="text-xs font-semibold text-brand-600">{explanation.confidence}%</span>
            </div>
          </div>
          <p className="text-sm text-ink-700 leading-relaxed bg-brand-50 border border-brand-100 rounded-xl p-4">
            {explanation.narrative}
          </p>
        </div>

        <div className={`rounded-2xl shadow-soft border p-5 ${toneClasses[verdictTone]}`}>
          <div className="flex items-center gap-2 font-bold">
            {explanation.verdict === "leak" ? <AlertTriangle className="w-5 h-5" /> : explanation.verdict === "under" ? <Gauge className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
            {explanation.safety.title}
          </div>
          <p className="text-sm text-ink-600 mt-2">{explanation.safety.message}</p>
          {explanation.verdict === "leak" && (
            <button className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl py-2.5">Book free safety check</button>
          )}
        </div>
      </div>

      {/* usage history */}
      <div className="bg-white rounded-2xl shadow-soft border border-ink-100 p-5">
        <h3 className="font-bold text-ink-900 mb-3">Consumption history (SCM)</h3>
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} interval={0} angle={-12} dy={8} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} cursor={{ fill: "#f1f5f9" }} />
              <Bar dataKey="units" radius={[6, 6, 0, 0]} onClick={(d: { id?: string }) => d?.id && setBillId(d.id)}>
                {chartData.map((d) => (
                  <Cell
                    key={d.id}
                    cursor="pointer"
                    fill={d.id === bill.id ? (verdictTone === "red" ? "#ef4444" : verdictTone === "sky" ? "#0ea5e9" : "#10b981") : d.winter ? "#fcd9b6" : "#cbd5e1"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-4 mt-2 text-xs text-ink-500">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-brand-500" /> Selected</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: "#fcd9b6" }} /> Winter cycle</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-ink-300" /> Other</span>
        </div>
      </div>
    </div>
  );
}

function CompareChip({ label, pct, sub }: { label: string; pct: number | null; sub?: string }) {
  const up = (pct ?? 0) > 0;
  const flat = pct === null || Math.abs(pct) < 1;
  return (
    <div className="bg-white rounded-2xl shadow-soft border border-ink-100 p-4">
      <div className="text-xs text-ink-500">{label}</div>
      <div className={`text-xl font-extrabold mt-1 flex items-center gap-1 ${flat ? "text-ink-500" : up ? "text-red-600" : "text-brand-600"}`}>
        {pct === null ? "—" : (
          <>
            {flat ? <Minus className="w-4 h-4" /> : up ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            {Math.abs(pct)}%
          </>
        )}
      </div>
      {sub && <div className="text-[11px] text-ink-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function fmt(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
