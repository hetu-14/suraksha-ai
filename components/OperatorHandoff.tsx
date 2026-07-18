"use client";

import { useState } from "react";
import { Card } from "@/components/ui";
import { Radio } from "lucide-react";

export type HandoffEntry = { id: string; operator: string; shift: string; notes: string; timestamp: string };

const OPERATORS = ["Anil Kumar", "Priya Desai", "Ramesh Iyer", "Sunita Rao"];
const SHIFTS = ["Morning · 06:00–14:00", "Afternoon · 14:00–22:00", "Night · 22:00–06:00"];

export default function OperatorHandoff({ log, onComplete }: { log: HandoffEntry[]; onComplete: (entry: HandoffEntry) => void }) {
  const [operator, setOperator] = useState(OPERATORS[0]);
  const [shift, setShift] = useState(SHIFTS[0]);
  const [notes, setNotes] = useState("");

  function submit() {
    if (!notes.trim()) return;
    onComplete({
      id: `HO-${Date.now()}`,
      operator,
      shift,
      notes: notes.trim(),
      timestamp: new Date().toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" }),
    });
    setNotes("");
  }

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2">
        <Radio className="w-4 h-4 text-red-600" />
        <h2 className="font-bold text-ink-900">Operator handoff</h2>
      </div>
      <p className="text-xs text-ink-500 mt-1">Log a shift handoff note so the next operator has full context.</p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <label className="text-xs font-semibold text-ink-600">
          Operator
          <select value={operator} onChange={(e) => setOperator(e.target.value)} className="mt-1 w-full rounded-lg border border-ink-200 px-2.5 py-2 text-xs">
            {OPERATORS.map((name) => <option key={name}>{name}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold text-ink-600">
          Shift
          <select value={shift} onChange={(e) => setShift(e.target.value)} className="mt-1 w-full rounded-lg border border-ink-200 px-2.5 py-2 text-xs">
            {SHIFTS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
      </div>
      <label className="block text-xs font-semibold text-ink-600 mt-3">
        Handoff notes
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Open items, watch zones, incidents in progress…"
          rows={3}
          className="mt-1 w-full rounded-lg border border-ink-200 px-2.5 py-2 text-xs resize-none"
        />
      </label>
      <button
        onClick={submit}
        disabled={!notes.trim()}
        className="mt-3 w-full rounded-lg bg-ink-900 hover:bg-ink-800 disabled:bg-ink-200 disabled:text-ink-400 text-white text-xs font-semibold py-2.5"
      >
        Complete handoff
      </button>

      <div className="mt-4 pt-4 border-t border-ink-100">
        <p className="text-[11px] font-bold uppercase tracking-wide text-ink-500">Recent handoffs</p>
        {log.length === 0 ? (
          <p className="mt-2 text-xs text-ink-400">No handoff notes logged yet this session.</p>
        ) : (
          <div className="mt-2 space-y-2">
            {log.slice(0, 5).map((entry) => (
              <div key={entry.id} className="rounded-lg bg-ink-50 p-2.5 text-xs">
                <div className="flex justify-between font-semibold text-ink-800">
                  <span>{entry.operator} · {entry.shift.split(" · ")[0]}</span>
                  <span className="text-ink-400 font-normal">{entry.timestamp}</span>
                </div>
                <p className="mt-1 text-ink-600">{entry.notes}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
