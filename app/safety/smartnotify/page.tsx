"use client";

import { useState, useEffect } from "react";
import { Card, SectionTitle } from "@/components/ui";
import { zones } from "@/lib/data";
import { Megaphone, CheckCircle2, XCircle, Loader2, MessageCircle, Info } from "lucide-react";

type SendResult = { phone: string; status: "sent" | "failed"; error?: string };
type ApiResp = { configured: boolean; provider: string | null; sent: number; total: number; results: SendResult[] };

export default function SmartNotify() {
  const [zoneIdx, setZoneIdx] = useState(0);
  const [start, setStart] = useState("");
  const [dur, setDur] = useState("4 hours");
  const [wa, setWa] = useState<{ configured: boolean; provider: string | null }>({ configured: false, provider: null });
  const [sending, setSending] = useState(false);
  const [resp, setResp] = useState<ApiResp | null>(null);
  const [sim, setSim] = useState<{ progress: number; log: string[] } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const zone = zones[zoneIdx];
  const hrs = (mounted && start) ? (new Date(start).getTime() - Date.now()) / 3.6e6 : NaN;
  const compliant = hrs >= 48;
  const when = (mounted && start) ? new Date(start).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "[set date]";
  const msg = `Dear Customer, your PNG supply in ${zone.name} will be temporarily interrupted on ${when} for approx. ${dur} due to planned network maintenance. We regret the inconvenience. — Torrent Gas`;

  useEffect(() => {
    fetch("/api/notify")
      .then((r) => r.json())
      .then((d) => setWa({ configured: !!d.configured, provider: d.provider ?? null }))
      .catch(() => setWa({ configured: false, provider: null }));
  }, []);

  async function send() {
    setSending(true);
    setResp(null);
    setSim(null);
    try {
      const r = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      });
      const data: ApiResp = await r.json();
      if (data.configured) {
        setResp(data);
        setSending(false);
        return;
      }
    } catch {
      /* fall through to simulation */
    }
    simulate();
  }

  function simulate() {
    const total = zone.n;
    const names = ["+91 98•••231", "+91 99•••884", "+91 97•••552", "+91 96•••093", "+91 95•••318"];
    let p = 0;
    const log: string[] = [];
    const t = setInterval(() => {
      p += 5;
      if (log.length < 5) log.push(names[log.length]);
      setSim({ progress: Math.min(p, 100), log: [...log] });
      if (p >= 100) {
        clearInterval(t);
        setSending(false);
      }
    }, 100);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <SectionTitle title="Smart Notify — 48-hour Interruption Notices" sub="Real WhatsApp delivery to affected customers · PNGRB 2025 compliant" />
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-full border ${wa.configured ? "bg-brand-50 border-brand-200 text-brand-700" : "bg-amber-50 border-amber-200 text-amber-700"}`}>
          <MessageCircle className="w-3.5 h-3.5" />
          {wa.configured ? `WhatsApp live · ${wa.provider}` : "WhatsApp not configured (demo)"}
        </span>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <Card className="p-5">
          <h3 className="font-bold text-ink-900 mb-4">Plan a supply interruption</h3>

          <label className="text-xs font-medium text-ink-500">Affected zone</label>
          <select
            value={zoneIdx}
            onChange={(e) => setZoneIdx(Number(e.target.value))}
            className="w-full rounded-xl border border-ink-200 px-3 py-2.5 text-sm mt-1 mb-3 outline-none focus:ring-2 focus:ring-brand-400"
          >
            {zones.map((z, i) => (
              <option key={i} value={i}>{z.name} ({z.n.toLocaleString("en-IN")} customers)</option>
            ))}
          </select>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs font-medium text-ink-500">Work start</label>
              <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)}
                className="w-full rounded-xl border border-ink-200 px-3 py-2.5 text-sm mt-1 outline-none focus:ring-2 focus:ring-brand-400" />
            </div>
            <div>
              <label className="text-xs font-medium text-ink-500">Duration</label>
              <input type="text" value={dur} onChange={(e) => setDur(e.target.value)}
                className="w-full rounded-xl border border-ink-200 px-3 py-2.5 text-sm mt-1 outline-none focus:ring-2 focus:ring-brand-400" />
            </div>
          </div>

          <div className={`text-xs rounded-lg px-3 py-2 mb-3 border ${
            !start ? "bg-ink-100 text-ink-500 border-transparent"
              : compliant ? "bg-brand-50 text-brand-700 border-brand-200"
              : "bg-red-50 text-red-700 border-red-200"
          }`}>
            {!start ? "Set a work start time to verify the 48-hour rule."
              : compliant ? `✓ Compliant — ${Math.floor(hrs)}h advance notice (≥48h required by PNGRB 2025).`
              : `⚠ Only ${Math.max(0, Math.floor(hrs))}h notice — below the mandatory 48h.`}
          </div>

          <label className="text-xs font-medium text-ink-500">Message (sent over WhatsApp)</label>
          <textarea readOnly rows={4} value={msg}
            className="w-full rounded-xl border border-ink-200 px-3 py-2.5 text-sm mt-1 outline-none bg-ink-50/50 text-ink-600" />

          <button onClick={send} disabled={sending}
            className="mt-4 w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold rounded-xl py-2.5 flex items-center justify-center gap-2">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Megaphone className="w-4 h-4" />}
            {sending ? "Sending…" : wa.configured ? "Send WhatsApp notices" : "Send notices (demo)"}
          </button>
        </Card>

        <Card className="p-5">
          <h3 className="font-bold text-ink-900 mb-3">Delivery log &amp; proof</h3>

          {resp && resp.configured && (
            <div>
              <div className="text-sm mb-3">
                <span className="font-semibold text-brand-700">{resp.sent}/{resp.total} delivered</span>
                <span className="text-ink-500"> via WhatsApp ({resp.provider})</span>
              </div>
              <ul className="space-y-2 max-h-72 overflow-y-auto">
                {resp.results.map((r, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm animate-slideIn">
                    {r.status === "sent" ? <CheckCircle2 className="w-4 h-4 text-brand-600" /> : <XCircle className="w-4 h-4 text-red-500" />}
                    <span className="font-mono text-ink-700">{r.phone}</span>
                    <span className={`ml-auto text-[11px] ${r.status === "sent" ? "text-brand-600" : "text-red-500"}`}>
                      {r.status === "sent" ? "delivered ✓" : r.error?.slice(0, 40) || "failed"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {sim && (
            <div>
              <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
                <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                Demo mode — configure a WhatsApp provider in <code>.env.local</code> to send for real.
              </div>
              <div className="text-xs text-ink-500 mb-2">{Math.round((sim.progress / 100) * zone.n).toLocaleString("en-IN")} / {zone.n.toLocaleString("en-IN")}</div>
              <div className="h-2 rounded-full bg-ink-100 overflow-hidden mb-4">
                <div className="h-full bg-brand-500 transition-all duration-150" style={{ width: `${sim.progress}%` }} />
              </div>
              <ul className="space-y-2 text-sm">
                {sim.log.map((n, i) => (
                  <li key={i} className="flex items-center gap-2 text-ink-600 animate-slideIn">
                    <CheckCircle2 className="w-4 h-4 text-brand-600" /> {n}
                    <span className="text-[11px] text-ink-400 ml-auto">delivered ✓</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!resp && !sim && !sending && (
            <p className="text-sm text-ink-400 py-10 text-center">Compose a notice and hit send to see delivery results here.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
