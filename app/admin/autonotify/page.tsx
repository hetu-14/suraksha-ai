"use client";

import { useState, useEffect, useRef } from "react";
import { Card, SectionTitle } from "@/components/ui";
import { zones } from "@/lib/data";
import { Megaphone, CheckCircle2 } from "lucide-react";

export default function AutoNotify() {
  const [zoneIdx, setZoneIdx] = useState(0);
  const [start, setStart] = useState("");
  const [dur, setDur] = useState("4 hours");
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const timer = useRef<ReturnType<typeof setInterval>>(undefined);

  const zone = zones[zoneIdx];
  const hrs = start ? (new Date(start).getTime() - Date.now()) / 3.6e6 : NaN;
  const compliant = hrs >= 48;

  const when = start
    ? new Date(start).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
    : "[set date]";
  const msg = `Dear Customer, your PNG supply in ${zone.name} will be temporarily interrupted on ${when} for approx. ${dur} due to planned network maintenance. We regret the inconvenience. — Torrent Gas`;

  useEffect(() => () => clearInterval(timer.current), []);

  const names = [
    "SMS → +91 98•••231", "WhatsApp → +91 99•••884", "App push → device A41",
    "SMS → +91 97•••552", "WhatsApp → +91 96•••093",
  ];

  function send() {
    setSending(true);
    setProgress(0);
    setLog([]);
    let p = 0;
    clearInterval(timer.current);
    timer.current = setInterval(() => {
      p += 4;
      setProgress(Math.min(p, 100));
      setLog((l) => (l.length < 5 ? [...l, names[l.length]] : l));
      if (p >= 100) {
        clearInterval(timer.current);
        setSending(false);
      }
    }, 90);
  }

  const sent = Math.round((progress / 100) * zone.n);

  return (
    <div className="space-y-6">
      <SectionTitle title="AutoNotify — 48-hour Interruption Notices" sub="Mandatory advance notice, automated and audited (PNGRB 2025)" />

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

          <div className="grid grid-cols-2 gap-3 mb-3">
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
              : `⚠ Only ${Math.max(0, Math.floor(hrs))}h notice — below the mandatory 48h. Reschedule to stay compliant.`}
          </div>

          <label className="text-xs font-medium text-ink-500">Notice (PNGRB-compliant template)</label>
          <textarea readOnly rows={4} value={msg}
            className="w-full rounded-xl border border-ink-200 px-3 py-2.5 text-sm mt-1 outline-none bg-ink-50/50 text-ink-600" />

          <button onClick={send} disabled={sending}
            className="mt-4 w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold rounded-xl py-2.5 flex items-center justify-center gap-2">
            <Megaphone className="w-4 h-4" /> {sending ? "Sending…" : "Send compliant notices"}
          </button>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-ink-900">Delivery log &amp; proof</h3>
            <span className="text-xs text-ink-500">
              {progress > 0 ? `${sent.toLocaleString("en-IN")} / ${zone.n.toLocaleString("en-IN")} delivered` : ""}
            </span>
          </div>
          <div className="h-2 rounded-full bg-ink-100 overflow-hidden mb-4">
            <div className="h-full bg-brand-500 transition-all duration-150" style={{ width: `${progress}%` }} />
          </div>
          <div className="grid grid-cols-10 gap-1.5 mb-4">
            {Array.from({ length: 100 }).map((_, i) => (
              <div key={i} className={`h-3 rounded-sm transition-colors ${i < progress ? "bg-brand-500" : "bg-ink-100"}`} />
            ))}
          </div>
          <ul className="space-y-2 text-sm max-h-56 overflow-y-auto">
            {log.map((n, i) => (
              <li key={i} className="flex items-center gap-2 text-ink-600 animate-slideIn">
                <CheckCircle2 className="w-4 h-4 text-brand-600" /> {n}
                <span className="text-[11px] text-ink-400 ml-auto">delivered ✓ proof logged</span>
              </li>
            ))}
            {progress >= 100 && (
              <li className="font-semibold text-brand-700 pt-2">
                All {zone.n.toLocaleString("en-IN")} customers notified — audit log saved.
              </li>
            )}
          </ul>
        </Card>
      </div>
    </div>
  );
}
