"use client";

import { useState, useRef, useEffect } from "react";
import EmergencyChat from "@/components/EmergencyChat";
import {
  Siren, PhoneCall, Check, ShieldCheck, Wind, Flame, LogOut, MapPin, Bot, Languages, Truck,
} from "lucide-react";

const steps = [
  { label: "Don't touch electrical switches", icon: Flame },
  { label: "Open windows & doors", icon: Wind },
  { label: "Shut the gas valve (if safe)", icon: ShieldCheck },
  { label: "Evacuate everyone", icon: LogOut },
];

export default function UserEmergency() {
  const [active, setActive] = useState(false);
  const [checked, setChecked] = useState<boolean[]>([false, false, false, false]);
  const [dispatched, setDispatched] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  function sos() {
    if (active) return;
    setActive(true);
    setChecked([false, false, false, false]);
    setDispatched(false);
    steps.forEach((_, i) => timers.current.push(setTimeout(() => setChecked((c) => c.map((v, idx) => (idx === i ? true : v))), 2500 + i * 2600)));
    timers.current.push(setTimeout(() => setDispatched(true), 3200));
  }
  function reset() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    setActive(false);
    setChecked([false, false, false, false]);
    setDispatched(false);
  }

  const doneCount = checked.filter(Boolean).length;

  return (
    <div className="space-y-6">
      {!active ? (
        /* ---------- SOS landing ---------- */
        <div className="relative overflow-hidden rounded-3xl border border-red-100 bg-gradient-to-b from-red-50 via-white to-white p-8 sm:p-14 text-center shadow-soft">
          <div className="pointer-events-none absolute inset-x-0 -top-24 mx-auto h-64 w-64 rounded-full bg-red-400/20 blur-3xl" />
          <div className="relative">
            <div className="relative mx-auto mb-6 h-28 w-28 grid place-items-center">
              <span className="absolute inset-0 rounded-full bg-red-500/10 animate-ping" />
              <span className="absolute inset-3 rounded-full bg-red-500/10" />
              <div className="relative h-20 w-20 rounded-full bg-gradient-to-br from-red-500 to-red-600 grid place-items-center shadow-lg shadow-red-500/30">
                <Siren className="w-9 h-9 text-white" />
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-red-600 bg-red-100 px-3 py-1 rounded-full">24×7 Emergency</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-ink-900 mt-4 leading-tight">Smell gas? Get help in seconds.</h2>
            <p className="text-ink-500 mt-2.5 max-w-md mx-auto text-sm leading-relaxed">
              Tap SOS to connect to our AI safety assistant. It talks you through every step by voice and dispatches the nearest crew automatically.
            </p>
            <button onClick={sos}
              className="group mt-7 inline-flex items-center gap-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-lg rounded-2xl px-9 py-4 shadow-lg shadow-red-500/25 transition active:scale-95">
              <Siren className="w-5 h-5 group-hover:animate-pulse" /> SOS — Report gas leak
            </button>
            <div className="mt-3.5">
              <a href="tel:1906" className="text-sm font-semibold text-red-700 inline-flex items-center gap-1.5 hover:underline">
                <PhoneCall className="w-4 h-4" /> Or call the helpline · 1906
              </a>
            </div>
            <div className="mt-9 grid grid-cols-3 gap-3 max-w-md mx-auto">
              {[
                { icon: Bot, label: "AI-guided voice" },
                { icon: Languages, label: "EN · हिं · ગુ" },
                { icon: MapPin, label: "Auto-dispatch" },
              ].map((f, i) => (
                <div key={i} className="rounded-2xl border border-ink-100 bg-white/70 backdrop-blur px-3 py-3">
                  <f.icon className="w-5 h-5 text-red-500 mx-auto" />
                  <div className="text-[11px] font-medium text-ink-600 mt-1.5">{f.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* ---------- active session ---------- */
        <>
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-ink-950 text-white px-4 py-3 shadow-soft">
            <div className="flex items-center gap-3 min-w-0">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute h-2.5 w-2.5 rounded-full bg-red-500 opacity-75" />
                <span className="relative rounded-full h-2.5 w-2.5 bg-red-500" />
              </span>
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate">Emergency session active</div>
                <div className="text-[11px] text-ink-400 truncate">AI assistant connected · crew notified</div>
              </div>
            </div>
            <button onClick={reset} className="shrink-0 text-xs font-semibold text-ink-300 hover:text-white border border-white/15 hover:border-white/30 rounded-lg px-3 py-1.5 transition">
              End session
            </button>
          </div>

          <div className="grid lg:grid-cols-2 gap-5">
            <EmergencyChat />

            <div className="space-y-5">
              {/* steps */}
              <div className="bg-white rounded-2xl shadow-soft border border-ink-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-ink-900">Safety steps</h3>
                  <span className="text-xs font-semibold text-brand-600">{doneCount}/{steps.length} done</span>
                </div>
                <div className="h-1.5 rounded-full bg-ink-100 overflow-hidden mb-4">
                  <div className="h-full bg-brand-500 transition-all duration-700" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
                </div>
                <ul className="space-y-2.5">
                  {steps.map((s, i) => {
                    const Icon = s.icon;
                    const done = checked[i];
                    return (
                      <li key={i} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${done ? "bg-brand-50" : "bg-ink-50/60"}`}>
                        <span className={`shrink-0 h-8 w-8 rounded-xl grid place-items-center transition ${done ? "bg-brand-500 text-white" : "bg-white border border-ink-200 text-ink-400"}`}>
                          {done ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                        </span>
                        <span className={`text-sm ${done ? "text-ink-800 font-medium" : "text-ink-500"}`}>{s.label}</span>
                        {done && <Check className="w-4 h-4 text-brand-500 ml-auto" />}
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* status */}
              <div className={`rounded-2xl shadow-soft border p-5 transition ${dispatched ? "border-brand-200 bg-gradient-to-br from-brand-50 to-white" : "border-ink-100 bg-white"}`}>
                <div className="flex items-center gap-3">
                  <div className={`h-11 w-11 rounded-2xl grid place-items-center ${dispatched ? "bg-brand-100 text-brand-600" : "bg-ink-100 text-ink-400"}`}>
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-ink-900">Response status</div>
                    <div className="text-xs text-ink-500">{dispatched ? "Crew on the way" : "Locating nearest crew…"}</div>
                  </div>
                </div>
                {dispatched && (
                  <div className="mt-4 flex items-center justify-between rounded-xl bg-white border border-ink-100 px-4 py-3">
                    <div>
                      <div className="text-sm font-bold text-ink-900">Crew Unit GA-4</div>
                      <div className="text-xs text-ink-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> 2.3 km away</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-extrabold text-brand-600 tabular-nums">6 min</div>
                      <div className="text-[11px] text-ink-400">ETA</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
