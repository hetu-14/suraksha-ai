"use client";

import { useState } from "react";
import { Card, SectionTitle, Badge } from "@/components/ui";
import { UsageBar } from "@/components/Charts";
import { currentCustomer, usageSeries, inr } from "@/lib/data";
import {
  ReceiptText, Download, MessageSquareText, ShieldCheck, Sparkles, Send,
} from "lucide-react";

export default function Bills() {
  const c = currentCustomer;
  const [sent, setSent] = useState(false);
  const [active, setActive] = useState(0);
  const bill = c.bills[active];

  return (
    <div className="space-y-6">
      <SectionTitle title="WhyMyBill" sub="All your bills in one place — with a clear reason for every charge" />

      <div className="grid lg:grid-cols-3 gap-5">
        {/* bill list */}
        <Card className="p-0 overflow-hidden lg:col-span-1">
          <div className="p-4 border-b border-ink-100 flex items-center gap-2">
            <ReceiptText className="w-4 h-4 text-brand-600" />
            <h3 className="font-bold text-ink-900">Your bills</h3>
          </div>
          <ul className="divide-y divide-ink-100 max-h-[420px] overflow-y-auto">
            {c.bills.map((b, i) => (
              <li key={i}>
                <button
                  onClick={() => setActive(i)}
                  className={`w-full text-left px-4 py-3 flex items-center justify-between transition ${
                    active === i ? "bg-brand-50" : "hover:bg-ink-50"
                  }`}
                >
                  <div>
                    <div className="text-sm font-semibold text-ink-800">{b.cycle}</div>
                    <div className="text-xs text-ink-500">{b.units} SCM</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-ink-900">{inr(b.amount)}</div>
                    <Badge tone={b.status === "Paid" ? "brand" : "amber"}>{b.status}</Badge>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </Card>

        {/* detail + chart */}
        <div className="lg:col-span-2 space-y-5">
          <Card className="p-5">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <div className="text-xs text-ink-500">{bill.cycle}</div>
                <div className="text-3xl font-extrabold text-ink-900 mt-1">{inr(bill.amount)}</div>
                <div className="text-sm text-ink-500 mt-1">
                  {bill.units} SCM · {bill.status === "Paid" ? `Paid on ${bill.paidOn}` : "Due this cycle"}
                </div>
              </div>
              <button className="flex items-center gap-2 text-sm font-semibold text-ink-600 border border-ink-200 rounded-xl px-3 py-2 hover:bg-ink-50">
                <Download className="w-4 h-4" /> Download PDF
              </button>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-bold text-ink-900 mb-3">Your consumption history</h3>
            <UsageBar data={usageSeries} highlight={c.verdict === "normal" ? "#10b981" : "#ef4444"} />
          </Card>
        </div>
      </div>

      {/* AI explanation */}
      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2 p-5">
          <h3 className="font-bold text-ink-900 mb-3 flex items-center gap-2">
            <MessageSquareText className="w-4 h-4 text-brand-600" /> Why is my bill like this?
          </h3>
          <div className="text-sm text-ink-700 leading-relaxed bg-brand-50 border border-brand-100 rounded-xl p-4 flex gap-3">
            <Sparkles className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
            <p>{c.reason}</p>
          </div>
          <button
            onClick={() => setSent(true)}
            className="mt-3 text-sm font-semibold text-brand-700 hover:text-brand-800 flex items-center gap-1.5"
          >
            {sent ? <>✓ Saved to your inbox</> : <><Send className="w-4 h-4" /> Email me this explanation</>}
          </button>
        </Card>

        <Card className="p-5 border-brand-200 bg-brand-50">
          <div className="flex items-center gap-2 text-brand-700 font-bold">
            <ShieldCheck className="w-5 h-5" /> Safe — no leak signal
          </div>
          <p className="text-sm text-ink-600 mt-2">
            Your usage pattern matches seasonal norms. No abnormal or continuous consumption was detected, so
            there is no sign of an in-premise leak.
          </p>
          <div className="mt-4 text-xs text-ink-500">
            Powered by SuRaksha AI · pattern check runs on every bill.
          </div>
        </Card>
      </div>
    </div>
  );
}
