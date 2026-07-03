"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Card } from "@/components/ui";
import { Bot, Send, Mic, Volume2, VolumeX, ShieldPlus, AlertCircle, Phone, PhoneCall, Flame, Ambulance, X } from "lucide-react";

/* ==================================================================
 *  Gas-leak safety brain — grounded in official guidance (AGA / MoPNG).
 *  Emergency numbers (India): 1906 gas helpline · 101 fire · 108 ambulance.
 * ================================================================== */

type CallInfo = { service: string; number: string };

const NUM = {
  gas: { service: "Gas Emergency Helpline", number: "1906" },
  fire: { service: "Fire Brigade", number: "101" },
  ambulance: { service: "Ambulance", number: "108" },
};

const FULL_STEPS =
  "Here is the complete checklist, in order. " +
  "One, do not touch any electrical switch, plug, appliance or the doorbell, and do not use your phone indoors — any of these can spark. " +
  "Two, do not light a match or lighter, and do not smoke. " +
  "Three, get everyone moving toward the exit, opening doors and windows as you pass to let the gas vent. " +
  "Four, if the gas meter valve is safely on your way out, turn it clockwise to shut off the supply. " +
  "Five, get children, elderly people and pets out first. " +
  "Six, move everyone to open air, well away from the building. " +
  "Seven, warn your neighbours as you leave. " +
  "Eight, once you are safely outside, call the gas emergency helpline on 1906. " +
  "Nine, do not go back inside for any reason until the emergency crew says it is safe.";

type Intent = { id: string; keys: string[]; weight?: number; replies: string[]; call?: CallInfo };

const INTENTS: Intent[] = [
  {
    id: "panic", weight: 1.3,
    keys: ["panic", "panicking", "scared", "afraid", "fear", "nervous", "worried", "shaking", "help me", "terrified", "anxious", "freaking", "crying"],
    replies: [
      "Take a slow breath with me — in through your nose, and out through your mouth. You are going to be okay and you are not alone. Help is already on the way. Let's just do the next small thing: don't touch any switch, and walk toward a door or window for fresh air.",
      "I've got you. One slow breath. You did the right thing reaching out. Nothing bad happens while we stay calm and follow the steps together. First, move toward fresh air, away from any switches or flames.",
      "Stay with me — you're safe as long as we keep moving calmly. Breathe in… and out. Good. Now guide everyone toward the exit and step outside into the open air.",
    ],
  },
  {
    id: "medical", weight: 1.7,
    keys: ["dizzy", "faint", "fainted", "unconscious", "can't breathe", "cant breathe", "breathing", "suffocat", "choking", "nausea", "vomit", "vomiting", "headache", "collapse", "collapsed", "drowsy", "passed out", "not breathing"],
    replies: [
      "This is urgent — move yourself and anyone affected into fresh, open air right now, and do not re-enter a room where the smell is strong. If someone is unconscious or struggling to breathe, get them outside and call an ambulance on 108 immediately. I'm opening the dialer for you.",
      "Get to fresh air first — gas causes dizziness fast. If a person has fainted, move them outdoors, lay them on their side, and call 108 now. Don't go back into the gassy area to fetch anything.",
    ],
    call: NUM.ambulance,
  },
  {
    id: "fire", weight: 1.7,
    keys: ["fire", "flame", "flames", "burning", "spark", "sparked", "lit", "ignite", "blaze", "caught fire", "fire brigade", "call fire", "smoke"],
    replies: [
      "There's fire involved, so getting out is the priority. Evacuate everyone immediately and call the fire brigade on 101 — I'm opening the dialer now. Do NOT throw water on a gas fire. Only if a small flame is right by the valve and safe to reach, shut it clockwise on your way out.",
      "Fire changes everything — leave now and take everyone with you. Call 101 for the fire brigade. Don't fight a gas fire with water, and don't stop for belongings.",
    ],
    call: NUM.fire,
  },
  {
    id: "call", weight: 1.4,
    keys: ["call", "phone number", "who to call", "helpline", "emergency number", "1906", "report it", "report the leak", "contact", "number to call"],
    replies: [
      "Call the 24×7 gas emergency helpline on 1906 — it's free, works across India, and in many languages. Make the call from OUTSIDE in open air, not indoors. I'm opening the dialer for you now.",
      "The number you want is 1906, the national gas emergency helpline, open round the clock. Step outside first, then call. Opening the dialer now.",
    ],
    call: NUM.gas,
  },
  {
    id: "valve",
    keys: ["valve", "meter", "turn off", "shut off", "shut the gas", "stopcock", "regulator", "main tap", "where is the valve", "how to close", "isolate"],
    replies: [
      "The main shut-off is at the gas meter — often just outside or at the kitchen entry. Turn it CLOCKWISE, to the right, until it stops; that isolates the supply. If you have a piped cylinder, also close the round regulator knob on top. Only do this if you can reach it without walking through a strong smell.",
      "Find the meter — the shut-off is right beside it. Rotate it clockwise all the way to cut the gas. Can't reach it safely? Skip it, get outside, and the crew will isolate it.",
    ],
  },
  {
    id: "electrical",
    keys: ["switch", "light", "lights", "fan", "ac", "plug", "appliance", "doorbell", "socket", "button", "electric", "electrical", "geyser", "exhaust", "chimney"],
    replies: [
      "Leave everything electrical exactly as it is — no lights, fans, switches, plugs, AC, geyser, chimney or doorbell. Turning something on OR off creates a spark that can ignite gas. Just move to fresh air.",
      "Hands off every switch and gadget — even flipping one off can spark. Don't touch the exhaust fan either. The airflow you want comes from open doors and windows, not fans.",
    ],
  },
  {
    id: "phone",
    keys: ["phone inside", "mobile", "landline", "call inside", "use phone"],
    replies: [
      "Don't make or take calls indoors — a phone can spark too. Step outside into open air first, then call 1906. You can keep this session open; a crew is already alerted.",
      "Use the phone only once you're outdoors. Inside, keep it in your pocket and focus on getting everyone out.",
    ],
  },
  {
    id: "children",
    keys: ["child", "children", "kid", "kids", "baby", "elder", "elderly", "old", "senior", "grandmother", "grandfather", "pet", "pets", "dog", "cat", "family"],
    replies: [
      "Get children, elderly family and pets out FIRST — they're most vulnerable to gas. Guide them calmly to open air, away from the building, and stay together there.",
      "Little ones, older folks and pets go out ahead of everything else. Walk them to fresh air first, then step back to the doorway only if there's something safe left to do.",
    ],
  },
  {
    id: "stove",
    keys: ["stove", "burner", "cook", "cooking", "cylinder", "lpg", "kitchen", "chulha", "gas ki", "hob"],
    replies: [
      "If the stove is on and safely reachable, turn every burner knob to OFF and close the cylinder regulator. Don't relight anything, and never test for gas with a flame. Then open the kitchen window and step out.",
      "Shut all burner knobs and the cylinder valve — but only if you can do it without passing through heavy fumes. No lighting a match to 'check', that's the biggest danger.",
    ],
  },
  {
    id: "vent",
    keys: ["window", "windows", "ventilat", "air", "open door", "fresh air", "smell going", "clear the gas", "breeze"],
    replies: [
      "Yes — as you leave, open the doors and windows you can safely reach so the gas vents outside. Skip the exhaust fan though; that's electrical. Natural cross-ventilation is exactly right.",
      "Good instinct — open windows and doors on your way out to let it air out. Don't switch on any fan to help; just let it flow naturally while you get everyone outside.",
    ],
  },
  {
    id: "sound",
    keys: ["hiss", "hissing", "sound", "noise", "whistle", "no smell", "cant smell", "can't smell", "not sure", "faint smell", "rotten egg", "sulphur", "sulfur"],
    replies: [
      "That rotten-egg smell, or a hiss or whistle near a pipe or appliance, is a real warning even if it's faint. Treat it as a confirmed leak: no switches, get everyone out venting as you go, shut the valve if safe, and call 1906 from outside.",
      "A hissing sound alone is enough — you don't need a strong smell to act. Follow the steps as if the leak is confirmed; better safe than sorry.",
    ],
  },
  {
    id: "cng",
    keys: ["car", "vehicle", "cng", "auto", "rickshaw", "engine", "station", "pump", "bus", "taxi"],
    replies: [
      "For a CNG vehicle or station: switch the engine off immediately, don't touch any electricals or lights, and absolutely no smoking or flames nearby. Move people away to a safe distance and alert the station staff.",
      "Kill the engine first, then step away from the vehicle. No phone-on-charge, no cigarettes, no sparks. Tell the station attendant so they can isolate the pump.",
    ],
  },
  {
    id: "neighbor",
    keys: ["neighbor", "neighbour", "neighbours", "others", "building", "society", "apartment", "flat", "warn", "upstairs", "security guard"],
    replies: [
      "As you leave, knock and warn your neighbours and building security so they evacuate too — but don't ring electric doorbells. Get everyone out and gather in open air at a safe distance.",
      "Alert neighbours by knocking or calling out, not the doorbell. Help the building empty and regroup outside, away from the walls.",
    ],
  },
  {
    id: "next",
    keys: ["what next", "now what", "after", "evacuated", "outside now", "i'm out", "im out", "waiting", "how long", "when will", "eta", "crew", "then what", "did it", "i am safe"],
    replies: [
      "You've done the right things. Stay outside in open air, well away from the building, and keep everyone together. Do NOT go back in for belongings until the crew clears it. Have you called 1906 yet? If not, do it now — I'll open the dialer.",
      "Perfect. Hold your position outside, count heads to be sure everyone's out, and wait for the crew. Don't re-enter until they say it's safe.",
    ],
  },
  {
    id: "thanks",
    keys: ["thank", "thanks", "okay", "ok", "done", "got it", "alright", "understood", "will do", "yes"],
    replies: [
      "You're doing really well. Keep following the steps, stay in fresh air, and stay with me — tell me anything you see or feel.",
      "Great. I'm right here. Describe what's around you and I'll guide the next move.",
      "Good work. Stay calm and stay outside; ask me anything at all.",
    ],
  },
  {
    id: "leak",
    keys: ["smell", "smelling", "leak", "leaking", "gas", "odour", "odor", "stink", "lpg smell", "png smell"],
    replies: [
      "Okay — treat this as a real gas leak. Right now: keep away from every switch and flame, get everyone moving outside while opening windows to vent, shut the gas valve clockwise if it's safe, and call 1906 once you're out. I'll walk you through each step.",
      "Understood, that smell means gas. Priorities: no sparks or switches, evacuate while venting, cut the valve if reachable, then call 1906 from outside. Tell me where in the house you are and I'll tailor the steps.",
    ],
  },
];

const FALLBACKS = [
  "I'm here and ready to guide you. Are you smelling gas, hearing a hiss, or seeing a flame? Tell me what's happening and I'll give the exact step. Meanwhile: keep away from switches and get some fresh air.",
  "Tell me a little more — is anyone feeling unwell, and can you safely reach the gas valve? While you answer, start moving toward a door and don't touch any switch.",
  "I want to give you the right step. Describe what you see or smell. If in doubt, the safe default is: no flames or switches, get everyone outside venting as you go, and call 1906.",
];

function normalize(s: string) {
  return " " + s.toLowerCase().replace(/[^a-z0-9\s']/g, " ").replace(/\s+/g, " ") + " ";
}

type Msg = { role: "bot" | "user"; text: string; call?: CallInfo };

export default function EmergencyChat() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [muted, setMuted] = useState(false);
  const [listening, setListening] = useState(false);
  const [sttOk, setSttOk] = useState(false);
  const [micMsg, setMicMsg] = useState<string | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceName, setVoiceName] = useState("");
  const [callPrompt, setCallPrompt] = useState<CallInfo | null>(null);

  const boxRef = useRef<HTMLDivElement>(null);
  const recRef = useRef<any>(null);
  const mutedRef = useRef(false);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const lastVariant = useRef<Record<string, number>>({});
  const lastReply = useRef<string>("");

  useEffect(() => { mutedRef.current = muted; }, [muted]);

  /* ---- voice: prefer Daniel, then a good male English voice ---- */
  const PREF: RegExp[] = [
    /daniel/i, /google uk english male/i, /\b(george|arthur|ryan|guy|brian|james)\b/i,
    /en[-_]?gb.*male/i, /male/i, /en[-_]?gb/i, /google.*english/i, /en[-_]?in/i, /^en/i,
  ];
  function pickVoice(list: SpeechSynthesisVoice[]) {
    for (const re of PREF) {
      const v = list.find((x) => re.test(x.name) || re.test(x.lang));
      if (v) return v;
    }
    return list.find((x) => /^en/i.test(x.lang)) || list[0] || null;
  }

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const load = () => {
      const vs = window.speechSynthesis.getVoices();
      if (!vs.length) return;
      setVoices(vs);
      if (!voiceRef.current) {
        const v = pickVoice(vs);
        voiceRef.current = v;
        if (v) setVoiceName(v.name);
      }
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const speak = useCallback((text: string) => {
    if (mutedRef.current || typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.97; u.pitch = 1;
    if (voiceRef.current) { u.voice = voiceRef.current; u.lang = voiceRef.current.lang; } else u.lang = "en-GB";
    window.speechSynthesis.speak(u);
    setTimeout(() => window.speechSynthesis.resume(), 250);
  }, []);

  const pushBot = useCallback((text: string, call?: CallInfo) => {
    lastReply.current = text;
    setMsgs((m) => [...m, { role: "bot", text, call }]);
    speak(text);
    if (call) setCallPrompt(call);
  }, [speak]);

  const respondTo = useCallback((raw: string) => {
    const t = raw.trim();
    if (!t) return;
    setMsgs((m) => [...m, { role: "user", text: t }]);
    setInput("");

    if (/all safety|full checklist|all steps|everything/i.test(t)) {
      setTimeout(() => pushBot(FULL_STEPS), 250);
      return;
    }

    const msg = normalize(t);
    let best: Intent | null = null;
    let bestScore = 0;
    for (const it of INTENTS) {
      let hits = 0;
      for (const k of it.keys) if (msg.includes(k)) hits++;
      const score = hits * (it.weight || 1);
      if (score > bestScore) { bestScore = score; best = it; }
    }

    // explicit "call X" always wins the dialer
    let call: CallInfo | undefined = best?.call;
    if (/fire brigade|call fire|fire department|fire engine/i.test(t)) call = NUM.fire;
    else if (/ambulance|108|medical help/i.test(t)) call = NUM.ambulance;
    else if (/1906|gas helpline|gas emergency|who.*call|helpline|emergency number/i.test(t)) call = NUM.gas;

    let reply: string;
    if (best && bestScore > 0) {
      const prev = lastVariant.current[best.id] ?? -1;
      let idx = (prev + 1) % best.replies.length;
      if (best.replies.length > 1 && best.replies[idx] === lastReply.current) idx = (idx + 1) % best.replies.length;
      lastVariant.current[best.id] = idx;
      reply = best.replies[idx];
    } else {
      const prev = lastVariant.current["_fb"] ?? -1;
      const idx = (prev + 1) % FALLBACKS.length;
      lastVariant.current["_fb"] = idx;
      reply = FALLBACKS[idx];
    }
    setTimeout(() => pushBot(reply, call), 280);
  }, [pushBot]);

  const respondRef = useRef(respondTo);
  useEffect(() => { respondRef.current = respondTo; }, [respondTo]);

  /* ---- greeting + speech recognition ---- */
  useEffect(() => {
    const greet =
      "I'm your SuRaksha AI safety assistant — stay calm, I'll guide you through this and help is already on the way. Right now: do not touch any switch, plug or phone indoors, and do not light anything. Get everyone moving toward the door, opening windows as you go, and step outside into fresh air. If the gas valve is safely on your way out, turn it clockwise to shut it off. Once you're outside, call the gas emergency helpline on 1906. Tell me what's happening — you can type, or tap the microphone and speak.";
    setMsgs([{ role: "bot", text: greet }]);
    lastReply.current = greet;
    setTimeout(() => speak(greet), 350);

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SR) {
      const r = new SR();
      r.lang = "en-IN"; r.continuous = false; r.interimResults = true; r.maxAlternatives = 1;
      r.onresult = (e: any) => {
        let interim = "", final = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const tr = e.results[i][0].transcript;
          if (e.results[i].isFinal) final += tr; else interim += tr;
        }
        setInput(final || interim);
        if (final.trim()) { setListening(false); try { r.stop(); } catch {} respondRef.current(final); }
      };
      r.onerror = (e: any) => {
        setListening(false);
        const map: Record<string, string> = {
          "not-allowed": "Microphone is blocked. Click the 🔒 in the address bar → allow Microphone, then try again.",
          "service-not-allowed": "Microphone is blocked in your browser settings — allow it and retry.",
          "no-speech": "I didn't catch that — tap the mic and speak again, a bit closer.",
          "audio-capture": "No microphone found. Check your mic is connected.",
          "aborted": "",
        };
        setMicMsg(map[e.error] ?? `Voice input error: ${e.error}`);
      };
      r.onend = () => setListening(false);
      recRef.current = r; setSttOk(true);
    }
    return () => { window.speechSynthesis?.cancel(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight, behavior: "smooth" }); }, [msgs]);

  async function toggleMic() {
    const r = recRef.current; if (!r) return; setMicMsg(null);
    if (listening) { try { r.stop(); } catch {} setListening(false); return; }
    try { await navigator.mediaDevices?.getUserMedia({ audio: true }); }
    catch { setMicMsg("Microphone is blocked. Allow mic access in your browser and try again."); return; }
    try { r.start(); setListening(true); } catch { setListening(true); }
  }
  function toggleMute() { setMuted((m) => { if (!m) window.speechSynthesis?.cancel(); return !m; }); }
  function changeVoice(name: string) {
    const v = voices.find((x) => x.name === name) || null;
    voiceRef.current = v; setVoiceName(name);
    if (v && !mutedRef.current) speak("Okay, I'll use this voice.");
  }

  const enVoices = voices.filter((v) => /^en/i.test(v.lang));
  const QUICK = ["I'm panicking", "Call fire brigade", "Someone feels dizzy", "I can't find the valve", "I'm outside now, what next?", "All safety steps"];

  return (
    <>
      <Card className="overflow-hidden flex flex-col h-[560px]">
        <div className="bg-ink-950 text-white p-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-full bg-brand-500/20 grid place-items-center shrink-0"><Bot className="w-5 h-5 text-brand-300" /></div>
            <div className="min-w-0">
              <div className="font-semibold text-sm truncate">SuRaksha AI · Safety Assistant</div>
              <div className="text-xs text-ink-400 flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-pulse" /> {muted ? "voice off" : "voice on"}</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {enVoices.length > 0 && (
              <select value={voiceName} onChange={(e) => changeVoice(e.target.value)} title="Assistant voice"
                className="max-w-[120px] text-[11px] bg-white/10 text-white rounded-lg px-2 py-1.5 outline-none border border-white/10">
                {enVoices.map((v) => <option key={v.name} value={v.name} className="text-ink-900">{v.name.replace(/Microsoft |Google |Online.*|\(.*\)/g, "").trim() || v.name}</option>)}
              </select>
            )}
            <button onClick={toggleMute} title={muted ? "Unmute" : "Mute"} className="p-2 rounded-lg hover:bg-white/10 text-ink-300">
              {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5 text-brand-300" />}
            </button>
          </div>
        </div>

        {/* always-visible emergency call bar */}
        <div className="flex items-stretch gap-1.5 px-3 py-2 bg-red-50 border-b border-red-100">
          <CallBtn onClick={() => setCallPrompt(NUM.gas)} icon={<Phone className="w-3.5 h-3.5" />} label="Gas 1906" tone="red" />
          <CallBtn onClick={() => setCallPrompt(NUM.fire)} icon={<Flame className="w-3.5 h-3.5" />} label="Fire 101" tone="orange" />
          <CallBtn onClick={() => setCallPrompt(NUM.ambulance)} icon={<Ambulance className="w-3.5 h-3.5" />} label="Ambulance 108" tone="sky" />
        </div>

        <div ref={boxRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-ink-50/40">
          {msgs.map((m, i) => (
            <div key={i} className={`flex ${m.role === "bot" ? "justify-start" : "justify-end"}`}>
              <div className={`px-3.5 py-2 max-w-[85%] text-sm shadow-sm rounded-2xl ${m.role === "bot" ? "bg-white border border-ink-200 text-ink-800 rounded-tl-sm" : "bg-brand-600 text-white rounded-tr-sm"}`}>
                {m.role === "bot" && <span className="text-[10px] uppercase tracking-wider text-brand-600 block mb-0.5">Assistant</span>}
                {m.text}
                {m.call && (
                  <button onClick={() => setCallPrompt(m.call!)} className="mt-2 flex items-center gap-2 text-white bg-red-600 hover:bg-red-700 rounded-lg px-3 py-1.5 text-xs font-semibold">
                    <PhoneCall className="w-3.5 h-3.5" /> Call {m.call.service} · {m.call.number}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {micMsg && (
          <div className="mx-3 mb-1 flex items-start gap-2 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {micMsg}
          </div>
        )}

        <div className="px-3 pt-2 flex gap-1.5 flex-wrap border-t border-ink-100">
          {QUICK.map((q) => (
            <button key={q} onClick={() => respondTo(q)} className="text-[11px] font-medium px-2.5 py-1 rounded-full border border-ink-200 text-ink-600 hover:border-brand-300 hover:bg-brand-50 transition">{q}</button>
          ))}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); respondTo(input); }} className="p-3 flex items-center gap-2">
          {sttOk && (
            <button type="button" onClick={toggleMic} title="Tap and speak"
              className={`p-2.5 rounded-xl border transition ${listening ? "bg-red-600 border-red-600 text-white animate-pulse" : "border-ink-200 text-ink-600 hover:bg-ink-50"}`}>
              <Mic className="w-4 h-4" />
            </button>
          )}
          <input value={input} onChange={(e) => setInput(e.target.value)}
            placeholder={listening ? "Listening… speak now" : "Type or tap the mic to speak…"}
            className="flex-1 rounded-xl border border-ink-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-400" />
          <button type="submit" className="p-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white"><Send className="w-4 h-4" /></button>
        </form>
        <div className="px-3 pb-2 -mt-1 flex items-center gap-1.5 text-[11px] text-ink-400">
          <ShieldPlus className="w-3 h-3" /> Guidance only · a crew has been dispatched to your address
        </div>
      </Card>

      {/* dial popup */}
      {callPrompt && <CallDialog info={callPrompt} onClose={() => setCallPrompt(null)} />}
    </>
  );
}

function CallBtn({ onClick, icon, label, tone }: { onClick: () => void; icon: React.ReactNode; label: string; tone: "red" | "orange" | "sky" }) {
  const t = { red: "bg-red-600 hover:bg-red-700", orange: "bg-orange-500 hover:bg-orange-600", sky: "bg-sky-600 hover:bg-sky-700" }[tone];
  return (
    <button onClick={onClick} className={`flex-1 flex items-center justify-center gap-1.5 text-white ${t} rounded-lg py-1.5 text-[11px] font-semibold`}>
      {icon} {label}
    </button>
  );
}

function CallDialog({ info, onClose }: { info: CallInfo; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink-950/60 backdrop-blur-sm p-4 animate-fade" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-xs bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="bg-ink-950 text-white pt-7 pb-6 text-center relative">
          <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-white/10 text-ink-400"><X className="w-4 h-4" /></button>
          <div className="mx-auto h-16 w-16 rounded-full bg-brand-500/20 grid place-items-center mb-3 animate-ring">
            <PhoneCall className="w-7 h-7 text-brand-300" />
          </div>
          <div className="text-sm text-ink-400">Calling</div>
          <div className="text-lg font-bold">{info.service}</div>
          <div className="text-3xl font-extrabold tracking-wider mt-1">{info.number}</div>
        </div>
        <div className="p-4 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl border border-ink-200 text-ink-600 font-semibold py-3 text-sm hover:bg-ink-50">Cancel</button>
          <a href={`tel:${info.number}`} className="flex-[1.4] rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold py-3 text-sm flex items-center justify-center gap-2">
            <PhoneCall className="w-4 h-4" /> Call now
          </a>
        </div>
      </div>
    </div>
  );
}
