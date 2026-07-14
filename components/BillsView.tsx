"use client";

import { useState, useMemo, useEffect } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from "recharts";
import {
  ReceiptText, Download, Sparkles, Gauge, MessageSquareText,
  ArrowUpRight, ArrowDownRight, Minus, TrendingUp, Database, HardDrive, Calendar,
} from "lucide-react";
import { CustomerWithBills } from "@/lib/types";
import { explainBill, inr } from "@/lib/billExplain";
import { downloadBillPdf } from "@/lib/pdf";
import BillAssistant from "@/components/BillAssistant";

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
  const explanation = useMemo(
    () => (bill && customer) ? explainBill(bills, customer, bill.id, away) : null,
    [bills, customer, bill, away]
  );

  const animAmount = useCountUp(bill?.amount ?? 0, bill?.id ?? "");

  if (!customer || !bill || !explanation) {
    return (
      <div className="p-8 text-center text-ink-500 bg-white rounded-2xl border border-ink-100">
        No billing records found.
      </div>
    );
  }

  const chartData = bills.map((b) => {
    const label = b.cycleLabel ?? "";
    const name = label.includes(" 20") ? label.replace(" 20", " '") : label;
    const isWinterMonth = b.periodEnd ? [11, 12, 1, 2].includes(new Date(b.periodEnd).getUTCMonth() + 1) : false;
    return { name, units: b.unitsScm ?? 0, id: b.id, winter: isWinterMonth };
  });
  const maxFactor = Math.max(1, ...explanation.factors.map((f) => Math.abs(f.amount)));

  const verdictTone = explanation.verdict === "leak" ? "red" : explanation.verdict === "under" ? "sky" : "brand";

  return (
    <div className="space-y-6 reveal">
      {/* header + account switcher */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-brand-100 grid place-items-center shrink-0">
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
      <div className="bg-white rounded-2xl shadow-soft border border-ink-100 p-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-brand-100 grid place-items-center text-brand-700 font-bold">
          {customer.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-bold text-ink-900 truncate">{customer.name}</div>
          <div className="text-xs text-ink-500 truncate">A/C {customer.accountNo} · {customer.area}</div>
        </div>
        <span className="ml-auto text-[11px] font-semibold px-2.5 py-1 rounded-full bg-ink-100 text-ink-600 capitalize">{customer.type}</span>
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
                  className={`w-full text-left px-4 py-3 flex items-center justify-between transition border-l-2 ${b.id === bill.id ? "bg-brand-50 border-brand-500" : "border-transparent hover:bg-ink-50"}`}
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
                <div className="text-4xl sm:text-5xl font-extrabold mt-1 tabular-nums">{inr(animAmount)}</div>
                <div className="flex items-center gap-2 mt-2.5">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${bill.status === "paid" ? "bg-brand-400/20 text-brand-200" : "bg-amber-400/20 text-amber-100"}`}>
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

      {/* ask assistant — sits between the breakdown and the narrative */}
      <button onClick={() => setAskOpen(true)}
        className="group w-full flex items-center justify-center gap-2 text-sm font-semibold text-white bg-gradient-to-r from-ink-900 to-brand-800 hover:opacity-95 active:scale-[.99] rounded-2xl py-3.5 shadow-soft transition">
        <MessageSquareText className="w-4 h-4 transition-transform group-hover:-rotate-6" /> Ask about this bill · chat &amp; voice
      </button>

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

        {explanation.verdict === "under" ? (
          <div className="rounded-2xl shadow-soft border border-sky-200 bg-sky-50 p-5">
            <div className="flex items-center gap-2 font-bold text-sky-700"><Gauge className="w-5 h-5" /> {explanation.safety.title}</div>
            <p className="text-sm text-ink-600 mt-2">{explanation.safety.message}</p>
            <label className="mt-4 flex items-center gap-2 text-xs text-ink-700 cursor-pointer bg-white/60 rounded-lg px-3 py-2">
              <input type="checkbox" checked={away} onChange={(e) => setAway(e.target.checked)} className="rounded text-brand-600" />
              I was away / house locked this cycle
            </label>
          </div>
        ) : (
          <LeakPanel pct={explanation.leakPct} level={explanation.leakLevel} reasons={explanation.leakReasons} away={away} setAway={setAway} />
        )}
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
    <div className="bg-white rounded-2xl shadow-soft border border-ink-100 p-4 lift">
      <div className="flex items-center justify-between">
        <span className="text-xs text-ink-500">{label}</span>
        <span className={`h-6 w-6 rounded-lg grid place-items-center ${chip}`}>
          {flat ? <Minus className="w-3.5 h-3.5" /> : up ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
        </span>
      </div>
      <div className={`text-2xl font-extrabold mt-2 tabular-nums ${color}`}>{pct === null ? "—" : `${Math.abs(pct)}%`}</div>
      {sub && <div className="text-[11px] text-ink-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function fmt(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function LeakPanel({
  pct, level, reasons, away, setAway,
}: {
  pct: number;
  level: "none" | "watch" | "high";
  reasons: string[];
  away: boolean;
  setAway: (b: boolean) => void;
}) {
  const map = {
    high: { ring: "#ef4444", text: "text-red-700", chip: "bg-red-100 text-red-700", label: "High leak chance", border: "border-red-200" },
    watch: { ring: "#f59e0b", text: "text-amber-700", chip: "bg-amber-100 text-amber-700", label: "Worth watching", border: "border-amber-200" },
    none: { ring: "#10b981", text: "text-brand-700", chip: "bg-brand-100 text-brand-700", label: "No leak signs", border: "border-brand-200" },
  }[level];
  const R = 42;
  const C = 2 * Math.PI * R;
  const off = C * (1 - pct / 100);

  return (
    <div className={`rounded-2xl shadow-soft border ${map.border} bg-white p-5`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-ink-900 text-sm">Gas leak risk</h3>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${map.chip}`}>{map.label}</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative shrink-0" style={{ width: 108, height: 108 }}>
          <svg viewBox="0 0 100 100" className="w-[108px] h-[108px] -rotate-90">
            <circle cx="50" cy="50" r={R} stroke="#eef2f6" strokeWidth="10" fill="none" />
            <circle cx="50" cy="50" r={R} stroke={map.ring} strokeWidth="10" fill="none" strokeLinecap="round"
              strokeDasharray={C} strokeDashoffset={off} style={{ transition: "stroke-dashoffset .7s ease" }} />
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <div className="text-center">
              <div className={`text-2xl font-extrabold ${map.text}`}>{pct}%</div>
              <div className="text-[10px] text-ink-400 -mt-0.5">probability</div>
            </div>
          </div>
        </div>
        <p className="text-xs text-ink-500">Estimated from your usage vs your average, the season, and whether the home was occupied.</p>
      </div>

      <ul className="mt-3 space-y-1.5">
        {reasons.map((r, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-ink-600">
            <span className="mt-1 h-1.5 w-1.5 rounded-full shrink-0" style={{ background: map.ring }} /> {r}
          </li>
        ))}
      </ul>

      <label className="mt-3 flex items-center gap-2 text-xs text-ink-700 cursor-pointer bg-ink-50 rounded-lg px-3 py-2">
        <input type="checkbox" checked={away} onChange={(e) => setAway(e.target.checked)} className="rounded text-brand-600" />
        I was away / house locked this cycle
      </label>

      {level !== "none" && (
        <button className={`mt-3 w-full text-white text-sm font-semibold rounded-xl py-2.5 ${level === "high" ? "bg-red-600 hover:bg-red-700" : "bg-amber-500 hover:bg-amber-600"}`}>
          Book free safety check
        </button>
      )}
    </div>
  );
}
