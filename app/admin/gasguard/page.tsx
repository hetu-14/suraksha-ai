"use client";

import { useState, useEffect, useRef } from "react";
import { Card, SectionTitle, Kpi, Badge } from "@/components/ui";
import { Siren, Timer, Truck, CheckCircle2, MapPin, PhoneCall, Bell } from "lucide-react";

type Status = "AI guiding" | "Dispatched" | "Resolved";
type Case = { id: string; area: string; severity: "High" | "Medium"; age: number; status: Status; crew?: string };

const seed: Case[] = [
  { id: "EMG-2231", area: "Maninagar · Sec 12", severity: "High", age: 42, status: "AI guiding" },
  { id: "EMG-2229", area: "Vastral · Ward 4", severity: "Medium", age: 315, status: "Dispatched", crew: "GA-2" },
  { id: "EMG-2225", area: "Odhav · Ring Rd", severity: "High", age: 548, status: "Dispatched", crew: "GA-4" },
  { id: "EMG-2218", area: "Naroda · Zone 3", severity: "Medium", age: 1320, status: "Resolved", crew: "GA-1" },
];

const newAreas = ["Bopal · Sec 2", "Nikol · Ward 9", "Chandkheda · Zone 1", "Ghatlodia · Sec 5"];
const crews = ["GA-3", "GA-5", "GA-6", "GA-7"];

function ago(s: number) {
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  return m < 60 ? `${m}m ago` : `${Math.floor(m / 60)}h ago`;
}

export default function GasGuardCases() {
  const [cases, setCases] = useState<Case[]>(seed);
  const [feed, setFeed] = useState<string[]>(["New SOS · EMG-2231 · Maninagar — AI answering"]);
  const tick = useRef(0);

  useEffect(() => {
    const t = setInterval(() => {
      tick.current += 1;
      setCases((cs) => cs.map((c) => ({ ...c, age: c.age + 1 })));
      // every ~16s spawn a new SOS
      if (tick.current % 16 === 0) {
        const id = "EMG-" + (2232 + Math.floor(tick.current / 16));
        const area = newAreas[Math.floor(Math.random() * newAreas.length)];
        const nc: Case = { id, area, severity: Math.random() > 0.5 ? "High" : "Medium", age: 0, status: "AI guiding" };
        setCases((cs) => [nc, ...cs].slice(0, 8));
        setFeed((f) => [`New SOS · ${id} · ${area} — AI answering`, ...f].slice(0, 6));
      }
      // auto-dispatch a guiding case after a while
      if (tick.current % 9 === 0) {
        setCases((cs) => {
          const idx = cs.findIndex((c) => c.status === "AI guiding" && c.age > 6);
          if (idx === -1) return cs;
          const crew = crews[Math.floor(Math.random() * crews.length)];
          setFeed((f) => [`Crew ${crew} dispatched · ${cs[idx].id}`, ...f].slice(0, 6));
          return cs.map((c, i) => (i === idx ? { ...c, status: "Dispatched", crew } : c));
        });
      }
    }, 1000);
    return () => clearInterval(t);
  }, []);

  function assign(id: string) {
    const crew = crews[Math.floor(Math.random() * crews.length)];
    setCases((cs) => cs.map((c) => (c.id === id ? { ...c, status: "Dispatched", crew } : c)));
    setFeed((f) => [`Crew ${crew} dispatched · ${id}`, ...f].slice(0, 6));
  }
  function resolve(id: string) {
    setCases((cs) => cs.map((c) => (c.id === id ? { ...c, status: "Resolved" } : c)));
    setFeed((f) => [`Case ${id} resolved`, ...f].slice(0, 6));
  }

  const active = cases.filter((c) => c.status !== "Resolved").length;
  const needAction = cases.filter((c) => c.status === "AI guiding").length;

  return (
    <div className="space-y-6">
      <SectionTitle title="GasGuard — Live Emergency Cases" sub="Every SOS from customers, triaged in real time" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Active emergencies" value={active} accent="text-red-600" icon={<Siren className="w-4 h-4" />} />
        <Kpi label="Awaiting dispatch" value={needAction} accent="text-amber-600" icon={<Bell className="w-4 h-4" />} />
        <Kpi label="Avg AI pickup" value="1.2s" icon={<Timer className="w-4 h-4" />} />
        <Kpi label="Crews available" value={Math.max(0, 6 - cases.filter((c) => c.status === "Dispatched").length)} icon={<Truck className="w-4 h-4" />} />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* cases */}
        <Card className="lg:col-span-2 overflow-hidden">
          <div className="p-5 border-b border-ink-100 flex items-center justify-between">
            <h3 className="font-bold text-ink-900">Incoming cases</h3>
            <span className="flex items-center gap-1.5 text-xs text-brand-600 font-medium"><span className="h-2 w-2 rounded-full bg-brand-500 animate-pulse" /> streaming</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-ink-50 text-ink-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left font-semibold px-5 py-3">Case</th>
                  <th className="text-left font-semibold px-3 py-3">Severity</th>
                  <th className="text-left font-semibold px-3 py-3">Status</th>
                  <th className="text-right font-semibold px-5 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {cases.map((c) => (
                  <tr key={c.id} className={c.status === "AI guiding" ? "bg-red-50/50" : ""}>
                    <td className="px-5 py-3">
                      <div className="font-semibold text-ink-800">{c.id}</div>
                      <div className="text-xs text-ink-500 flex items-center gap-1"><MapPin className="w-3 h-3" />{c.area} · {ago(c.age)}</div>
                    </td>
                    <td className="px-3 py-3"><Badge tone={c.severity === "High" ? "red" : "amber"}>{c.severity}</Badge></td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${c.status === "Resolved" ? "text-brand-600" : c.status === "Dispatched" ? "text-sky-600" : "text-red-600"}`}>
                        {c.status === "AI guiding" && <PhoneCall className="w-3.5 h-3.5" />}
                        {c.status === "Dispatched" && <Truck className="w-3.5 h-3.5" />}
                        {c.status === "Resolved" && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {c.status}{c.crew ? ` · ${c.crew}` : ""}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {c.status === "AI guiding" ? (
                        <button onClick={() => assign(c.id)} className="text-xs font-semibold text-white bg-red-600 px-3 py-1.5 rounded-lg hover:bg-red-700">Dispatch crew</button>
                      ) : c.status === "Dispatched" ? (
                        <button onClick={() => resolve(c.id)} className="text-xs font-semibold text-ink-600 border border-ink-200 px-3 py-1.5 rounded-lg hover:bg-ink-50">Mark resolved</button>
                      ) : (
                        <span className="text-xs text-ink-400">Closed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* feed */}
        <Card className="p-5">
          <h3 className="font-bold text-ink-900 mb-3">Live notifications</h3>
          <ul className="space-y-2">
            {feed.map((f, i) => (
              <li key={i} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-ink-50 animate-slideIn">
                <Siren className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div className="text-sm text-ink-700">{f}</div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
