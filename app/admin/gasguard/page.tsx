"use client";

import { useState, useRef, useEffect } from "react";
import { Card, SectionTitle } from "@/components/ui";
import {
  PhoneIncoming, PhoneCall, RotateCcw, Check, Circle, ListChecks, FileText,
} from "lucide-react";

const script: [("caller" | "ai"), string][] = [
  ["caller", "Hello?? I think there is a gas leak in my kitchen, I can smell it strongly!"],
  ["ai", "I'm here with you and help is on the way. First — do NOT switch on or off any lights or electrical switches. Can you do that for me?"],
  ["caller", "O-okay, I won't touch anything."],
  ["ai", "Good. Now gently open the nearest windows and door to let air in. Are there windows close to you?"],
  ["caller", "Yes, opening them now."],
  ["ai", "Well done. Next, locate the gas meter valve and turn it clockwise to shut it off, only if it is safe to reach."],
  ["caller", "I turned the valve near the door."],
  ["ai", "Excellent. Please step outside now and move everyone away from the building. A trained crew is already on the way."],
  ["ai", "Stay on the line with me until they arrive. You are doing everything right."],
];

const stepDefs = [
  "Do not operate any electrical switches",
  "Open windows & doors for ventilation",
  "Shut the gas meter valve (if safe)",
  "Evacuate & move everyone to safety",
  "Nearest crew auto-dispatched",
];

export default function GasGuard() {
  const [msgs, setMsgs] = useState<[string, string][]>([]);
  const [steps, setSteps] = useState<boolean[]>([false, false, false, false, false]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [sec, setSec] = useState(0);
  const [severity, setSeverity] = useState<"idle" | "assessing" | "high">("idle");
  const [dispatch, setDispatch] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    let t: ReturnType<typeof setInterval>;
    if (running) t = setInterval(() => setSec((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  useEffect(() => {
    boxRef.current?.scrollTo(0, boxRef.current.scrollHeight);
  }, [msgs]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  function run() {
    if (running) return;
    reset();
    setRunning(true);
    setSeverity("assessing");
    let delay = 0;
    script.forEach((line, i) => {
      delay += line[0] === "ai" ? 1700 : 1100;
      timers.current.push(
        setTimeout(() => {
          setMsgs((m) => [...m, line]);
          if (i === 1) check(0);
          if (i === 3) check(1);
          if (i === 5) { check(2); setSeverity("high"); }
          if (i === 7) { check(3); check(4); setDispatch(true); }
          if (i === script.length - 1) { setRunning(false); setDone(true); }
        }, delay)
      );
    });
  }
  function check(i: number) {
    setSteps((s) => s.map((v, idx) => (idx === i ? true : v)));
  }
  function reset() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setMsgs([]); setSteps([false, false, false, false, false]);
    setRunning(false); setDone(false); setSec(0); setSeverity("idle"); setDispatch(false);
  }

  const mm = String(Math.floor(sec / 60)).padStart(2, "0");
  const ss = String(sec % 60).padStart(2, "0");

  return (
    <div className="space-y-6">
      <SectionTitle title="GasGuard — Emergency Voice Agent" sub="24/7 AI co-pilot for the gas-leak hotline" />

      <div className="grid lg:grid-cols-2 gap-5">
        {/* call */}
        <Card className="overflow-hidden">
          <div className="bg-ink-950 text-white p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`h-11 w-11 rounded-full grid place-items-center ${running || done ? "bg-brand-500/20" : "bg-red-500/20 animate-ring"}`}>
                <PhoneIncoming className={`w-5 h-5 ${running || done ? "text-brand-300" : "text-red-300"}`} />
              </div>
              <div>
                <div className="font-semibold">{running || done ? "Connected — AI agent speaking" : "Incoming emergency call"}</div>
                <div className="text-xs text-ink-400">+91 98••• ••231 · Sector 12, Ahmedabad</div>
              </div>
            </div>
            <div className="text-sm font-mono text-ink-300">{mm}:{ss}</div>
          </div>

          <div ref={boxRef} className="p-5 space-y-3 h-80 overflow-y-auto bg-ink-50/40 text-sm">
            {msgs.length === 0 && (
              <p className="text-center text-xs text-ink-400 py-24">
                Press <b>Simulate emergency call</b> to see the AI voice agent in action.
              </p>
            )}
            {msgs.map(([role, txt], i) => (
              <div key={i} className={`flex ${role === "ai" ? "justify-start" : "justify-end"}`}>
                <div className={`px-3.5 py-2 max-w-[80%] text-sm shadow-sm rounded-2xl ${
                  role === "ai" ? "bg-brand-600 text-white rounded-tl-sm" : "bg-white border border-ink-200 text-ink-800 rounded-tr-sm"
                }`}>
                  {role === "ai" && <span className="text-[10px] uppercase tracking-wider opacity-70 block mb-0.5">SuRaksha AI</span>}
                  {txt}
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-ink-100 flex gap-2">
            <button onClick={run} disabled={running} className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold rounded-xl py-2.5 flex items-center justify-center gap-2 transition">
              <PhoneCall className="w-4 h-4" /> Simulate emergency call
            </button>
            <button onClick={reset} className="px-4 rounded-xl border border-ink-200 hover:bg-ink-100 text-ink-600">
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </Card>

        {/* action */}
        <div className="space-y-5">
          <Card className="p-5">
            <h3 className="font-bold text-ink-900 mb-3 flex items-center gap-2"><ListChecks className="w-4 h-4 text-brand-600" /> Life-saving steps (auto-guided)</h3>
            <ul className="space-y-2 text-sm">
              {stepDefs.map((s, i) => (
                <li key={i} className={`flex items-center gap-3 ${steps[i] ? "text-ink-800 font-medium" : "text-ink-400"}`}>
                  <span className={`shrink-0 h-6 w-6 rounded-full grid place-items-center ${steps[i] ? "bg-brand-500 text-white" : "border-2 border-ink-200"}`}>
                    {steps[i] ? <Check className="w-3.5 h-3.5" /> : <Circle className="w-3 h-3" />}
                  </span>
                  {s}
                </li>
              ))}
            </ul>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Card className="p-5">
              <div className="text-xs text-ink-500 mb-1">Severity (AI assessed)</div>
              <div className={`text-2xl font-extrabold ${severity === "high" ? "text-red-600" : "text-ink-400"}`}>
                {severity === "idle" ? "—" : severity === "assessing" ? "Assessing…" : "HIGH"}
              </div>
              <div className="mt-2 h-2 rounded-full bg-ink-100 overflow-hidden">
                <div className="h-full bg-red-500 transition-all duration-700" style={{ width: severity === "high" ? "86%" : "0%" }} />
              </div>
            </Card>
            <Card className="p-5">
              <div className="text-xs text-ink-500 mb-1">Nearest crew dispatch</div>
              <div className={`text-sm font-semibold ${dispatch ? "text-brand-700" : "text-ink-400"}`}>
                {dispatch ? "Crew Unit GA-4 assigned" : "Awaiting…"}
              </div>
              {dispatch && <div className="text-xs text-ink-500 mt-1">ETA 6 min · 2.3 km away</div>}
            </Card>
          </div>

          {done && (
            <Card className="p-5 bg-ink-950 text-ink-200 border-ink-800">
              <div className="flex items-center gap-2 text-brand-300 font-semibold text-sm mb-2"><FileText className="w-4 h-4" /> Responder brief (auto-generated)</div>
              <pre className="text-xs whitespace-pre-wrap font-mono leading-relaxed">{`INCIDENT: Suspected domestic gas leak (kitchen)
LOCATION: Sector 12, Maninagar, Ahmedabad — 23.0011, 72.6009
CALLER STATE: Calm, compliant; followed all safety steps
SEVERITY: HIGH (strong odour, enclosed kitchen)
ACTIONS: Electrical untouched · ventilated · valve shut · evacuated
DISPATCH: Unit GA-4 · ETA 6 min
LANGUAGE: English (auto-detected) · call recorded`}</pre>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
