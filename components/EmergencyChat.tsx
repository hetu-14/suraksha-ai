"use client";

import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui";
import { Bot, Send, Mic, MicOff, Volume2, VolumeX, ShieldPlus } from "lucide-react";

/* ------------------------------------------------------------------ *
 *  Comprehensive gas-leak safety brain (rule-based, offline, free).
 *  Each intent = keywords -> a calm, speakable, actionable reply.
 * ------------------------------------------------------------------ */

const FULL_STEPS =
  "Here is everything to do right now, in order. " +
  "One: do not switch any light, fan, appliance, or switch on or off — even a tiny spark can ignite gas. " +
  "Two: do not light a match, lighter, stove, candle, or smoke. " +
  "Three: do not use the doorbell, and do not use your phone while inside — step outside to make calls. " +
  "Four: open all doors and windows for cross ventilation. " +
  "Five: if it is safe to reach, turn the gas meter valve clockwise to shut off the supply. " +
  "Six: turn off the stove knobs and the cylinder regulator if you have one. " +
  "Seven: get children, elderly people, and pets out of the house first. " +
  "Eight: evacuate everyone and move to open air, away from the building. " +
  "Nine: warn your neighbours as you leave. " +
  "Ten: from outside, stay on this line — a crew has been dispatched. Do not go back inside until they tell you it is safe.";

type Intent = { keys: string[]; reply: string };

const INTENTS: Intent[] = [
  {
    keys: ["panic", "scared", "afraid", "fear", "nervous", "worried", "shaking", "help me", "dying", "terrified"],
    reply:
      "Take a slow, deep breath — in through your nose, out through your mouth. You are going to be okay, and you are not alone. I am right here with you and a trained crew is already on the way. Let's move together, one small step at a time. First, do not touch any switch. Now walk towards a door or window and let fresh air in.",
  },
  {
    keys: ["dizzy", "faint", "unconscious", "can't breathe", "cant breathe", "breath", "suffocat", "choking", "nausea", "vomit", "headache", "collaps", "sick"],
    reply:
      "This is important. Move yourself and anyone affected into fresh, open air immediately. Do NOT enter a room where the gas smell is very strong. If someone is unconscious or struggling to breathe, get them outside and call an ambulance on 108 right away. Loosen tight clothing and keep them calm until help arrives.",
  },
  {
    keys: ["fire", "flame", "burning", "spark", "lit", "ignite", "blaze", "caught fire"],
    reply:
      "If there is an active flame or fire, get everyone out of the building now and call the fire brigade on 101. Do NOT throw water on a gas fire. Only if the flame is small AND you can safely reach the gas valve, shut it off clockwise to cut the supply. If in any doubt, just evacuate and stay far away.",
  },
  {
    keys: ["valve", "meter", "turn off", "shut off", "stopcock", "regulator", "main tap", "shut the gas"],
    reply:
      "The main gas valve is usually near your meter, often outside or at the kitchen entry. Turn it CLOCKWISE (to the right) until it stops — that shuts off the supply. If you have a piped cylinder, also close the regulator knob on top. Only do this if you can reach it safely without passing through a strong gas smell. If you can't reach it, leave it and get out.",
  },
  {
    keys: ["switch", "light", "fan", " ac", "plug", "appliance", "doorbell", "socket", "button", "electric", "geyser"],
    reply:
      "Do NOT operate anything electrical — no lights, fans, switches, plugs, AC, geyser, or doorbell. Turning something on OR off creates a spark that can ignite the gas. Leave everything exactly as it is and move to fresh air.",
  },
  {
    keys: ["phone", "mobile", "landline", "call inside"],
    reply:
      "Don't make calls from inside the house — a phone can also spark. Step outside into open air first, then call. You can stay connected with me; a crew has already been alerted.",
  },
  {
    keys: ["child", "kid", "baby", "elder", "old ", "senior", "grand", "pet", "dog", "cat", "family"],
    reply:
      "Get children, elderly family members, and pets out of the house FIRST — they are most vulnerable to gas. Guide them calmly to open air, away from the building, and keep them there with you.",
  },
  {
    keys: ["stove", "burner", "cook", "cylinder", "lpg", "kitchen", "gas ki"],
    reply:
      "If the stove is on and you can reach it safely, turn every burner knob to OFF and close the cylinder regulator. Do not relight anything. Then open the kitchen window and move out. Do not try to cook or use a lighter to 'check' the gas.",
  },
  {
    keys: ["window", "ventilat", "air", "open door", "fresh air", "smell going"],
    reply:
      "Yes — open all the doors and windows you safely can, to create a cross-breeze that clears the gas. Do not switch on an exhaust fan (that's electrical). Natural ventilation is what you want.",
  },
  {
    keys: ["hiss", "hissing", "sound", "noise", "whistle", "no smell", "cant smell", "can't smell"],
    reply:
      "Trust the warning even if the smell is faint — a hissing or whistling sound near a pipe or appliance means gas is escaping. Treat it as a real leak: no switches, ventilate, shut the valve if safe, and evacuate.",
  },
  {
    keys: ["car", "vehicle", "cng", "auto", "rickshaw", "engine", "station", "pump"],
    reply:
      "For a CNG vehicle or station: switch the engine off immediately, do not operate any electricals or lights, and absolutely no smoking or flames nearby. Move people away from the vehicle to a safe distance and alert the station staff.",
  },
  {
    keys: ["neighbor", "neighbour", "others", "building", "society", "apartment", "flat", "warn"],
    reply:
      "As you leave, knock and warn your neighbours so they can evacuate too — but don't ring electrical doorbells. Get everyone out of the building and gather in open air at a safe distance.",
  },
  {
    keys: ["what next", "now what", "after", "evacuat", "outside now", "i'm out", "im out", "waiting", "how long", "when will", "eta", "crew"],
    reply:
      "You've done the right things. Now stay outside in open air, well away from the building, and keep everyone together. Do NOT go back inside for belongings — not until the crew declares it safe. They have been dispatched and are on the way; stay on this line so I can update you.",
  },
  {
    keys: ["thank", "okay", "ok", "done", "got it", "alright", "understood"],
    reply:
      "You're doing really well. Keep following the steps, stay in fresh air, and stay with me. Tell me anything you see or feel and I'll guide you.",
  },
  {
    keys: ["smell", "leak", "gas", "odour", "odor", "rotten", "stink", "smelling"],
    reply:
      "Okay, treat this as a real gas leak. Right now: do not touch any switch or flame, open doors and windows for fresh air, shut the gas valve clockwise if you can reach it safely, and get everyone outside. I'll walk you through each step — a crew is already on the way.",
  },
];

function getReply(raw: string): string {
  const msg = " " + raw.toLowerCase() + " ";
  for (const it of INTENTS) {
    if (it.keys.some((k) => msg.includes(k))) return it.reply;
  }
  return (
    "I'm here to help. If you smell gas or hear hissing, follow these steps: keep away from all switches and flames, open windows and doors, shut the gas valve if it's safe, and get everyone outside. " +
    "Tap 'All safety steps' below and I'll read out the full checklist."
  );
}

type Msg = { role: "bot" | "user"; text: string };

const QUICK = [
  "I'm panicking",
  "I can't find the valve",
  "Someone feels dizzy",
  "There's a small flame",
  "I'm outside now, what next?",
  "All safety steps",
];

export default function EmergencyChat() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [muted, setMuted] = useState(false);
  const [listening, setListening] = useState(false);
  const [sttOk, setSttOk] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const recRef = useRef<any>(null);
  const mutedRef = useRef(false);

  useEffect(() => { mutedRef.current = muted; }, [muted]);

  function speak(text: string) {
    if (mutedRef.current || typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1; u.pitch = 1; u.lang = "en-IN";
    const voices = window.speechSynthesis.getVoices();
    const v = voices.find((x) => /en-IN|en_GB|en-GB|en-US|English/i.test(x.lang + " " + x.name));
    if (v) u.voice = v;
    window.speechSynthesis.speak(u);
  }

  function pushBot(text: string) {
    setMsgs((m) => [...m, { role: "bot", text }]);
    speak(text);
  }

  // greeting on mount
  useEffect(() => {
    const hello =
      "I'm your SuRaksha AI safety assistant. Stay calm — I'll guide you through this and a crew is already on the way. Tell me what's happening, or tap a button below.";
    setMsgs([{ role: "bot", text: hello }]);
    speak(hello);
    setTimeout(() => pushBot(FULL_STEPS), 600);

    // speech-to-text setup
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SR) {
      const r = new SR();
      r.lang = "en-IN"; r.interimResults = false; r.maxAlternatives = 1;
      r.onresult = (e: any) => {
        const t = e.results[0][0].transcript;
        handleSend(t);
      };
      r.onend = () => setListening(false);
      r.onerror = () => setListening(false);
      recRef.current = r;
      setSttOk(true);
    }
    return () => window.speechSynthesis?.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs]);

  function handleSend(text: string) {
    const t = text.trim();
    if (!t) return;
    setMsgs((m) => [...m, { role: "user", text: t }]);
    setInput("");
    const reply = t.toLowerCase().includes("all safety") ? FULL_STEPS : getReply(t);
    setTimeout(() => pushBot(reply), 300);
  }

  function toggleMic() {
    const r = recRef.current;
    if (!r) return;
    if (listening) { r.stop(); setListening(false); }
    else { try { r.start(); setListening(true); } catch { /* already started */ } }
  }

  function toggleMute() {
    setMuted((m) => {
      if (!m) window.speechSynthesis?.cancel();
      return !m;
    });
  }

  return (
    <Card className="overflow-hidden flex flex-col h-[520px]">
      <div className="bg-ink-950 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-brand-500/20 grid place-items-center">
            <Bot className="w-5 h-5 text-brand-300" />
          </div>
          <div>
            <div className="font-semibold text-sm">SuRaksha AI · Safety Assistant</div>
            <div className="text-xs text-ink-400 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-pulse" /> voice guidance on
            </div>
          </div>
        </div>
        <button onClick={toggleMute} title={muted ? "Unmute voice" : "Mute voice"}
          className="p-2 rounded-lg hover:bg-white/10 text-ink-300">
          {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5 text-brand-300" />}
        </button>
      </div>

      <div ref={boxRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-ink-50/40">
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === "bot" ? "justify-start" : "justify-end"}`}>
            <div className={`px-3.5 py-2 max-w-[85%] text-sm shadow-sm rounded-2xl ${
              m.role === "bot" ? "bg-white border border-ink-200 text-ink-800 rounded-tl-sm" : "bg-brand-600 text-white rounded-tr-sm"
            }`}>
              {m.role === "bot" && <span className="text-[10px] uppercase tracking-wider text-brand-600 block mb-0.5">Assistant</span>}
              {m.text}
            </div>
          </div>
        ))}
      </div>

      {/* quick replies */}
      <div className="px-3 pt-2 flex gap-1.5 flex-wrap border-t border-ink-100">
        {QUICK.map((q) => (
          <button key={q} onClick={() => handleSend(q)}
            className="text-[11px] font-medium px-2.5 py-1 rounded-full border border-ink-200 text-ink-600 hover:border-brand-300 hover:bg-brand-50 transition">
            {q}
          </button>
        ))}
      </div>

      {/* input */}
      <form onSubmit={(e) => { e.preventDefault(); handleSend(input); }} className="p-3 flex items-center gap-2">
        {sttOk && (
          <button type="button" onClick={toggleMic} title="Speak"
            className={`p-2.5 rounded-xl border ${listening ? "bg-red-600 border-red-600 text-white animate-pulse" : "border-ink-200 text-ink-600 hover:bg-ink-50"}`}>
            {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        )}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={listening ? "Listening…" : "Type or speak what's happening…"}
          className="flex-1 rounded-xl border border-ink-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-400"
        />
        <button type="submit" className="p-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white">
          <Send className="w-4 h-4" />
        </button>
      </form>
      <div className="px-3 pb-2 -mt-1 flex items-center gap-1.5 text-[11px] text-ink-400">
        <ShieldPlus className="w-3 h-3" /> Guidance only · a crew has been dispatched to your address
      </div>
    </Card>
  );
}
