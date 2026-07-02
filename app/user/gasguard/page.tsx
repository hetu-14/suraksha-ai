"use client";

import { useState, useRef, useEffect } from "react";
import { Card, SectionTitle } from "@/components/ui";
import {
  Siren, PhoneCall, Check, Circle, ShieldCheck, Wind, Flame, LogOut,
  MapPin, Radio,
} from "lucide-react";

const guidance: string[] = [
  "You're connected — help is on the way. First, do NOT switch any lights or electrical switches on or off.",
  "Now gently open the nearest windows and doors to let fresh air in.",
  "If it's safe to reach, turn the gas meter valve clockwise to shut off the supply.",
  "Please step outside and move everyone away from the building.",
  "Stay with me. A trained crew has been dispatched to your location.",
];

const steps = [
  { label: "Don't touch electrical switches", icon: Flame },
  { label: "Open windows & doors", icon: Wind },
  { label: "Shut the gas valve (if safe)", icon: ShieldCheck },
  { label: "Evacuate everyone", icon: LogOut },
];

export default function UserEmergency() {
  const [active, setActive] = useState(false);
  const [line, setLine] = useState(-1);
  const [checked, setChecked] = useState<boolean[]>([false, false, false, false]);
  const [dispatched, setDispatched] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  function sos() {
    if (active) return;
    setActive(true);
    setLine(-1);
    setChecked([false, false, false, false]);
    setDispatched(false);
    guidance.forEach((_, i) => {
      timers.current.push(
        setTimeout(() => {
          setLine(i);
          if (i >= 1 && i <= 4) setChecked((c) => c.map((v, idx) => (idx === i - 1 ? true : v)));
          if (i === 4) setDispatched(true);
        }, 900 + i * 2200)
      );
    });
  }
  function reset() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setActive(false);
    setLine(-1);
    setChecked([false, false, false, false]);
    setDispatched(false);
  }

  return (
    <div className="space-y-6">
      <SectionTitle title="Gas Emergency" sub="Smell gas? Get instant, AI-guided help — 24×7." />

      {!active ? (
        <Card className="p-8 text-center border-red-200 bg-gradient-to-b from-red-50 to-white">
          <div className="mx-auto h-20 w-20 rounded-full bg-red-100 grid place-items-center mb-4 animate-ring">
            <Siren className="w-9 h-9 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-ink-900">If you smell gas, act now</h3>
          <p className="text-sm text-ink-500 mt-1 max-w-md mx-auto">
            Tap SOS to connect instantly. Our AI answers in seconds, guides you step-by-step, and dispatches the nearest crew automatically.
          </p>
          <button
            onClick={sos}
            className="mt-6 inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold text-lg rounded-2xl px-8 py-4 shadow-lg transition"
          >
            <Siren className="w-5 h-5" /> SOS — Report gas leak
          </button>
          <div className="mt-4">
            <a href="tel:1906" className="text-sm font-semibold text-red-700 inline-flex items-center gap-1.5">
              <PhoneCall className="w-4 h-4" /> Or call 1906
            </a>
          </div>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-2 gap-5">
          {/* connection */}
          <Card className="overflow-hidden">
            <div className="bg-ink-950 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-full bg-brand-500/20 grid place-items-center">
                  <Radio className="w-5 h-5 text-brand-300" />
                </div>
                <div>
                  <div className="font-semibold">Connected · SuRaksha AI</div>
                  <div className="text-xs text-ink-400">Control room notified · call recorded</div>
                </div>
              </div>
              <span className="flex items-center gap-1.5 text-xs text-brand-300">
                <span className="h-2 w-2 rounded-full bg-brand-400 animate-pulse" /> live
              </span>
            </div>
            <div className="p-5 space-y-3 h-72 overflow-y-auto bg-ink-50/40">
              {guidance.map((g, i) =>
                i <= line ? (
                  <div key={i} className="flex justify-start animate-slideIn">
                    <div className="bg-brand-600 text-white rounded-2xl rounded-tl-sm px-3.5 py-2 max-w-[85%] text-sm shadow-sm">
                      <span className="text-[10px] uppercase tracking-wider opacity-70 block mb-0.5">SuRaksha AI</span>
                      {g}
                    </div>
                  </div>
                ) : null
              )}
            </div>
            <div className="p-4 border-t border-ink-100 flex gap-2">
              <a href="tel:1906" className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl py-2.5 flex items-center justify-center gap-2">
                <PhoneCall className="w-4 h-4" /> Call 1906
              </a>
              <button onClick={reset} className="px-4 rounded-xl border border-ink-200 hover:bg-ink-100 text-ink-600 text-sm">End</button>
            </div>
          </Card>

          {/* status */}
          <div className="space-y-5">
            <Card className="p-5">
              <h3 className="font-bold text-ink-900 mb-3">Follow these steps</h3>
              <ul className="space-y-2.5">
                {steps.map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <li key={i} className={`flex items-center gap-3 ${checked[i] ? "text-ink-800 font-medium" : "text-ink-400"}`}>
                      <span className={`shrink-0 h-7 w-7 rounded-full grid place-items-center ${checked[i] ? "bg-brand-500 text-white" : "border-2 border-ink-200"}`}>
                        {checked[i] ? <Check className="w-4 h-4" /> : <Circle className="w-3.5 h-3.5" />}
                      </span>
                      <Icon className="w-4 h-4" /> {s.label}
                    </li>
                  );
                })}
              </ul>
            </Card>

            <Card className={`p-5 ${dispatched ? "border-brand-200 bg-brand-50" : ""}`}>
              <div className="flex items-center gap-2 font-bold text-ink-900">
                <MapPin className="w-5 h-5 text-brand-600" /> Response status
              </div>
              {dispatched ? (
                <div className="mt-2 text-sm text-ink-700">
                  <span className="font-semibold text-brand-700">Crew Unit GA-4 dispatched</span> to your registered address —
                  ETA 6 min, 2.3 km away. Stay outside and safe.
                </div>
              ) : (
                <div className="mt-2 text-sm text-ink-500">Locating nearest crew…</div>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
