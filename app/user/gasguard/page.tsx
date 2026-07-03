"use client";

import { useState, useRef, useEffect } from "react";
import { Card, SectionTitle } from "@/components/ui";
import EmergencyChat from "@/components/EmergencyChat";
import {
  Siren, PhoneCall, Check, Circle, ShieldCheck, Wind, Flame, LogOut, MapPin,
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
    steps.forEach((_, i) => {
      timers.current.push(setTimeout(() => setChecked((c) => c.map((v, idx) => (idx === i ? true : v))), 2500 + i * 2600));
    });
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

  return (
    <div className="space-y-6">
      <SectionTitle title="Gas Emergency" sub="Smell gas? Get instant, AI-guided voice help — 24×7." />

      {!active ? (
        <Card className="p-8 text-center border-red-200 bg-gradient-to-b from-red-50 to-white">
          <div className="mx-auto h-20 w-20 rounded-full bg-red-100 grid place-items-center mb-4 animate-ring">
            <Siren className="w-9 h-9 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-ink-900">If you smell gas, act now</h3>
          <p className="text-sm text-ink-500 mt-1 max-w-md mx-auto">
            Tap SOS to connect instantly to our AI safety assistant — it talks you through every step by voice, and dispatches the nearest crew automatically.
          </p>
          <button onClick={sos}
            className="mt-6 inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold text-lg rounded-2xl px-8 py-4 shadow-lg transition">
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
          {/* voice safety assistant */}
          <EmergencyChat />

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

            <button onClick={reset} className="w-full rounded-xl border border-ink-200 hover:bg-ink-100 text-ink-600 text-sm py-2.5">
              End emergency session
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
