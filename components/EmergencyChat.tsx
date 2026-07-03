"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Card } from "@/components/ui";
import { Bot, Send, Mic, Volume2, VolumeX, ShieldPlus, AlertCircle } from "lucide-react";

/* ==================================================================
 *  Gas-leak safety brain — scored intent matcher with varied,
 *  non-repeating responses (no API key needed).
 * ================================================================== */

const FULL_STEPS =
  "Here is the complete checklist, in order. " +
  "One, do not switch any light, fan, appliance or switch on or off — even a tiny spark can ignite gas. " +
  "Two, do not light a match, lighter, stove or candle, and do not smoke. " +
  "Three, do not use the doorbell, and don't use your phone indoors — step outside to call. " +
  "Four, open all doors and windows for cross ventilation. " +
  "Five, if it's safe to reach, turn the gas meter valve clockwise to shut the supply. " +
  "Six, turn off the stove knobs and the cylinder regulator. " +
  "Seven, get children, elderly people and pets out first. " +
  "Eight, evacuate everyone to open air, away from the building. " +
  "Nine, warn your neighbours as you leave. " +
  "Ten, stay outside and don't go back in until the crew says it's safe.";

type Intent = { id: string; keys: string[]; weight?: number; replies: string[] };

const INTENTS: Intent[] = [
  {
    id: "panic", weight: 1.3,
    keys: ["panic", "panicking", "scared", "afraid", "fear", "nervous", "worried", "shaking", "help me", "terrified", "anxious", "freaking"],
    replies: [
      "Breathe with me — slowly in through your nose, and out through your mouth. You're going to be okay, and you're not alone. A crew is already on the way. Let's take it one small step: don't touch any switch, and walk toward a door or window for fresh air.",
      "I've got you. Take one slow breath. You're doing the right thing by reaching out. Nothing bad happens if we stay calm and follow the steps together. First, move toward fresh air and keep away from any switches.",
      "Stay with me, you're safe as long as we move calmly. In… and out. Good. Now let's just do the next thing: get to an open window or door and breathe the fresh air there.",
    ],
  },
  {
    id: "medical", weight: 1.6,
    keys: ["dizzy", "faint", "fainted", "unconscious", "can't breathe", "cant breathe", "breathing", "suffocat", "choking", "nausea", "vomit", "vomiting", "headache", "collapse", "collapsed", "sick", "drowsy", "passed out"],
    replies: [
      "This matters — move yourself and anyone affected into fresh, open air right now. Do NOT enter a room where the smell is strong. If someone is unconscious or struggling to breathe, get them outside and call an ambulance on 108 immediately, then loosen any tight clothing.",
      "Get to fresh air first — gas can make you dizzy fast. If a person has fainted, move them outdoors, call 108, and keep them lying on their side. Don't re-enter the gassy area to fetch anything.",
    ],
  },
  {
    id: "fire", weight: 1.6,
    keys: ["fire", "flame", "flames", "burning", "spark", "lit", "ignite", "blaze", "caught fire", "smoke coming"],
    replies: [
      "If there's an active flame or fire, get everyone out of the building now and call the fire brigade on 101. Do NOT throw water on a gas fire. Only if the flame is small and the valve is safely within reach, shut it clockwise — otherwise just evacuate and keep well away.",
      "Fire changes the plan — priority is getting out. Evacuate everyone, call 101, and don't try to fight a gas fire with water. If, and only if, you can safely reach the gas valve on the way out, turn it off clockwise.",
    ],
  },
  {
    id: "valve",
    keys: ["valve", "meter", "turn off", "shut off", "shut the gas", "stopcock", "regulator", "main tap", "where is the valve", "how to close"],
    replies: [
      "Your main gas valve is usually near the meter — often just outside or at the kitchen entry. Turn it CLOCKWISE, to the right, until it stops. If you have a piped cylinder, also close the round regulator knob on top. Only do this if you can reach it without walking through a strong smell.",
      "Look for the meter — the shut-off is right beside it. Rotate it clockwise all the way to cut the gas. Can't find or reach it safely? Then skip it, get outside, and the crew will handle the supply.",
    ],
  },
  {
    id: "electrical",
    keys: ["switch", "light", "lights", "fan", "ac", "plug", "appliance", "doorbell", "socket", "button", "electric", "electrical", "geyser", "exhaust"],
    replies: [
      "Leave everything electrical exactly as it is — no lights, fans, switches, plugs, AC, geyser or doorbell. Turning something on OR off makes a spark that can ignite gas. Just move to fresh air.",
      "Hands off all switches and gadgets — even flipping one off can spark. Don't touch the exhaust fan either. Natural airflow from open windows is what clears the gas.",
    ],
  },
  {
    id: "phone",
    keys: ["phone", "mobile", "landline", "call inside", "should i call"],
    replies: [
      "Don't call from inside — a phone can spark too. Step outside into open air first, then call. You can keep this session open; the crew is already alerted.",
      "Make calls only once you're outdoors. Inside, keep the phone in your pocket and focus on getting everyone out.",
    ],
  },
  {
    id: "children",
    keys: ["child", "children", "kid", "kids", "baby", "elder", "elderly", "old", "senior", "grandmother", "grandfather", "pet", "pets", "dog", "cat", "family"],
    replies: [
      "Get children, elderly family and pets out FIRST — they're the most vulnerable to gas. Guide them calmly to open air, away from the building, and stay together there.",
      "Little ones, older folks and pets go out ahead of everything else. Walk them out to fresh air first, then come back to the doorway if you still need to do anything safe.",
    ],
  },
  {
    id: "stove",
    keys: ["stove", "burner", "cook", "cooking", "cylinder", "lpg", "kitchen", "gas ki", "chulha"],
    replies: [
      "If the stove is on and safely reachable, turn every burner knob to OFF and close the cylinder regulator. Don't relight anything and don't test the gas with a flame. Then open the kitchen window and step out.",
      "Shut all burner knobs and the cylinder valve if you can do it without passing through heavy fumes. No lighting a match to 'check' — that's the biggest risk.",
    ],
  },
  {
    id: "vent",
    keys: ["window", "windows", "ventilat", "air", "open door", "fresh air", "smell going", "clear the gas", "breeze"],
    replies: [
      "Yes — open every door and window you safely can to create a cross-breeze that clears the gas. Skip the exhaust fan though, that's electrical. Natural ventilation is exactly right.",
      "Good instinct. Fling open windows and doors on opposite sides so air moves through. Don't switch on any fan to help it — just let it flow naturally.",
    ],
  },
  {
    id: "sound",
    keys: ["hiss", "hissing", "sound", "noise", "whistle", "no smell", "cant smell", "can't smell", "not sure", "faint smell"],
    replies: [
      "Trust the warning even if the smell is faint — a hiss or whistle near a pipe or appliance means gas is escaping. Treat it as a real leak: no switches, ventilate, shut the valve if safe, and get out.",
      "A hissing sound is enough on its own — you don't need a strong smell. Act as if it's a confirmed leak and follow the steps; better safe than sorry.",
    ],
  },
  {
    id: "cng",
    keys: ["car", "vehicle", "cng", "auto", "rickshaw", "engine", "station", "pump", "bus", "taxi"],
    replies: [
      "For a CNG vehicle or station: switch the engine off immediately, don't touch any electricals or lights, and absolutely no smoking or flames nearby. Move people away to a safe distance and alert the station staff.",
      "Kill the engine first, then step away from the vehicle. No phones-on-charge, no cigarettes, no sparks. Tell the station attendant so they can isolate the pump.",
    ],
  },
  {
    id: "neighbor",
    keys: ["neighbor", "neighbour", "neighbours", "others", "building", "society", "apartment", "flat", "warn", "people upstairs"],
    replies: [
      "As you leave, knock and warn your neighbours so they evacuate too — but don't ring electric doorbells. Get everyone out and gather in open air at a safe distance.",
      "Alert the neighbours by knocking or calling out, not by the doorbell. Help the building empty out and regroup outside, away from the walls.",
    ],
  },
  {
    id: "next",
    keys: ["what next", "now what", "after", "evacuated", "outside now", "i'm out", "im out", "waiting", "how long", "when will", "eta", "crew", "then what", "did it"],
    replies: [
      "You've done the right things. Now stay outside in open air, well away from the building, and keep everyone together. Do NOT go back in for belongings until the crew clears it. They're on the way — stay with me and I'll keep you posted.",
      "Perfect. Hold your position outside, count heads to make sure everyone's out, and wait. The crew has been dispatched; I'll let you know the moment it's safe to return.",
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
    keys: ["smell", "smelling", "leak", "leaking", "gas", "odour", "odor", "rotten", "stink", "rotten eggs", "lpg smell"],
    replies: [
      "Okay — treat this as a real gas leak. Right now: keep away from every switch and flame, open doors and windows, shut the gas valve clockwise if it's safe, and get everyone outside. I'll walk you through each step; a crew is already on the way.",
      "Understood, that smell means gas. Priorities: no sparks or switches, ventilate, cut the valve if reachable, evacuate. Tell me where you are in the house and I'll tailor the steps.",
    ],
  },
];

const FALLBACKS = [
  "I'm here and ready to guide you. Are you smelling gas, hearing a hiss, or seeing a flame? Tell me what's happening and I'll give you the exact step. Meanwhile: keep away from switches and get some fresh air.",
  "Tell me a little more — is anyone feeling unwell, and can you safely reach the gas valve? While you answer, open a window and don't touch any switch.",
  "I want to give you the right step. Describe what you see or smell. If in doubt, the safe default is: no flames or switches, open the windows, and move everyone outside.",
];

function normalize(s: string) {
  return " " + s.toLowerCase().replace(/[^a-z0-9\s']/g, " ").replace(/\s+/g, " ") + " ";
}

export default function EmergencyChat() {
  const [msgs, setMsgs] = useState<{ role: "bot" | "user"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [muted, setMuted] = useState(false);
  const [listening, setListening] = useState(false);
  const [sttOk, setSttOk] = useState(false);
  const [micMsg, setMicMsg] = useState<string | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceName, setVoiceName] = useState<string>("");

  const boxRef = useRef<HTMLDivElement>(null);
  const recRef = useRef<any>(null);
  const mutedRef = useRef(false);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const lastVariant = useRef<Record<string, number>>({});
  const lastReply = useRef<string>("");

  useEffect(() => { mutedRef.current = muted; }, [muted]);

  /* ---- pick the best available voice ---- */
  const PREF: RegExp[] = [
    /neerja/i, /aria|jenny|libby|sonia|natural/i, /google (uk|us) english/i,
    /google.*english/i, /heera|priya|kalpana|raveena/i, /en[-_]?in/i,
    /female/i, /en[-_]?gb/i, /en[-_]?us/i,
  ];
  function pickVoice(list: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
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
    u.rate = 0.97; u.pitch = 1.05;
    if (voiceRef.current) { u.voice = voiceRef.current; u.lang = voiceRef.current.lang; }
    else u.lang = "en-IN";
    window.speechSynthesis.speak(u);
    // Chrome long-utterance keepalive
    setTimeout(() => window.speechSynthesis.resume(), 250);
  }, []);

  const pushBot = useCallback((text: string) => {
    lastReply.current = text;
    setMsgs((m) => [...m, { role: "bot", text }]);
    speak(text);
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
      for (const k of it.keys) if (msg.includes(" " + k) || msg.includes(k + " ") || msg.includes(k)) hits++;
      const score = hits * (it.weight || 1);
      if (score > bestScore) { bestScore = score; best = it; }
    }

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
    setTimeout(() => pushBot(reply), 280);
  }, [pushBot]);

  const respondRef = useRef(respondTo);
  useEffect(() => { respondRef.current = respondTo; }, [respondTo]);

  /* ---- greeting + speech recognition setup ---- */
  useEffect(() => {
    const greet =
      "I'm your SuRaksha AI safety assistant, and I'll talk you through this. Stay calm — a crew is already on the way. Right now: keep away from all switches and flames, open a window for fresh air, and if it's safe, shut the gas valve. Tell me what's happening — you can type, or tap the mic and speak.";
    setMsgs([{ role: "bot", text: greet }]);
    lastReply.current = greet;
    // slight delay so voices are ready
    setTimeout(() => speak(greet), 350);

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SR) {
      const r = new SR();
      r.lang = "en-IN";
      r.continuous = false;
      r.interimResults = true;
      r.maxAlternatives = 1;
      r.onresult = (e: any) => {
        let interim = "", final = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const tr = e.results[i][0].transcript;
          if (e.results[i].isFinal) final += tr; else interim += tr;
        }
        setInput(final || interim);
        if (final.trim()) {
          setListening(false);
          try { r.stop(); } catch { /* noop */ }
          respondRef.current(final);
        }
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
      recRef.current = r;
      setSttOk(true);
    }
    return () => { window.speechSynthesis?.cancel(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs]);

  async function toggleMic() {
    const r = recRef.current;
    if (!r) return;
    setMicMsg(null);
    if (listening) { try { r.stop(); } catch { /* noop */ } setListening(false); return; }
    // pre-request permission for a clear prompt
    try { await navigator.mediaDevices?.getUserMedia({ audio: true }); } catch {
      setMicMsg("Microphone is blocked. Allow mic access in your browser and try again.");
      return;
    }
    try { r.start(); setListening(true); }
    catch { /* already started */ setListening(true); }
  }

  function toggleMute() {
    setMuted((m) => { if (!m) window.speechSynthesis?.cancel(); return !m; });
  }

  function changeVoice(name: string) {
    const v = voices.find((x) => x.name === name) || null;
    voiceRef.current = v;
    setVoiceName(name);
    if (v && !mutedRef.current) speak("Okay, I'll use this voice from now on.");
  }

  const enVoices = voices.filter((v) => /^en/i.test(v.lang));

  const QUICK = ["I'm panicking", "I can't find the valve", "Someone feels dizzy", "There's a small flame", "I'm outside now, what next?", "All safety steps"];

  return (
    <Card className="overflow-hidden flex flex-col h-[540px]">
      <div className="bg-ink-950 text-white p-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-full bg-brand-500/20 grid place-items-center shrink-0">
            <Bot className="w-5 h-5 text-brand-300" />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-sm truncate">SuRaksha AI · Safety Assistant</div>
            <div className="text-xs text-ink-400 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-pulse" /> {muted ? "voice off" : "voice on"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {enVoices.length > 0 && (
            <select value={voiceName} onChange={(e) => changeVoice(e.target.value)}
              title="Assistant voice"
              className="max-w-[130px] text-[11px] bg-white/10 text-white rounded-lg px-2 py-1.5 outline-none border border-white/10">
              {enVoices.map((v) => (
                <option key={v.name} value={v.name} className="text-ink-900">{v.name.replace(/Microsoft |Google |Online.*|\(.*\)/g, "").trim() || v.name}</option>
              ))}
            </select>
          )}
          <button onClick={toggleMute} title={muted ? "Unmute" : "Mute"} className="p-2 rounded-lg hover:bg-white/10 text-ink-300">
            {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5 text-brand-300" />}
          </button>
        </div>
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

      {micMsg && (
        <div className="mx-3 mb-1 flex items-start gap-2 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {micMsg}
        </div>
      )}

      <div className="px-3 pt-2 flex gap-1.5 flex-wrap border-t border-ink-100">
        {QUICK.map((q) => (
          <button key={q} onClick={() => respondTo(q)}
            className="text-[11px] font-medium px-2.5 py-1 rounded-full border border-ink-200 text-ink-600 hover:border-brand-300 hover:bg-brand-50 transition">
            {q}
          </button>
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
