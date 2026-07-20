"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Card } from "@/components/ui";
import { Bot, Send, Mic, Volume2, VolumeX, ShieldPlus, AlertCircle, Phone, PhoneCall, Flame, Ambulance, X } from "lucide-react";
import { readPlatformContext } from "@/lib/platform";

/* ==================================================================
 *  Multilingual gas-emergency assistant (English / हिंदी / ગુજરાતી).
 *  Grounded in AGA + MoPNG guidance. India numbers: 1906 gas · 101 fire · 108 amb.
 *  Gas LEAK (smell/hiss, no flame) and gas FIRE (active flame) are separate flows.
 * ================================================================== */

type Lang = "en" | "hi" | "gu";
type L<T> = Record<Lang, T>;
type CallNo = "1906" | "101" | "108";

function preferredLanguage(): Lang {
  if (typeof navigator === "undefined") return "en";
  const language = navigator.language.toLowerCase();
  if (language.startsWith("gu")) return "gu";
  if (language.startsWith("hi")) return "hi";
  return "en";
}

const LANGS: { code: Lang; label: string; stt: string }[] = [
  { code: "en", label: "EN", stt: "en-IN" },
  { code: "hi", label: "हिं", stt: "hi-IN" },
  { code: "gu", label: "ગુ", stt: "gu-IN" },
];

const SERVICE: Record<CallNo, L<string>> = {
  "1906": { en: "Gas Emergency Helpline", hi: "गैस इमरजेंसी हेल्पलाइन", gu: "ગેસ ઇમરજન્સી હેલ્પલાઇન" },
  "101": { en: "Fire Brigade", hi: "फायर ब्रिगेड", gu: "ફાયર બ્રિગેડ" },
  "108": { en: "Ambulance", hi: "एम्बुलेंस", gu: "એમ્બ્યુલન્સ" },
};

const GREET: L<string> = {
  en: "I'm your SuRaksha AI safety assistant — stay calm, help is on the way. First tell me: is there a flame or fire, or just a gas smell? Meanwhile, do not touch any switch, plug or phone indoors and do not light anything. Move everyone toward the door, open windows as you go, and get outside. Pick your language on top; you can type or tap the mic to speak.",
  hi: "मैं आपका SuRaksha AI सुरक्षा सहायक हूँ — शांत रहें, मदद आ रही है। पहले बताइए: कहीं आग या लपट है, या सिर्फ़ गैस की गंध? तब तक किसी भी स्विच, प्लग या फ़ोन को अंदर न छुएँ और कुछ भी न जलाएँ। सबको दरवाज़े की ओर ले जाएँ, रास्ते में खिड़कियाँ खोलते जाएँ और बाहर निकलें। ऊपर से भाषा चुनें; टाइप करें या माइक दबाकर बोलें।",
  gu: "હું તમારો SuRaksha AI સલામતી સહાયક છું — શાંત રહો, મદદ આવી રહી છે. પહેલાં મને કહો: ક્યાંય આગ કે ભડકો દેખાય છે, કે ફક્ત ગેસની વાસ આવે છે? ત્યાં સુધી ઘરની અંદર કોઈ સ્વિચ, પ્લગ કે ફોનને હાથ ન લગાડો અને કંઈ પણ સળગાવશો નહીં. બધાને દરવાજા તરફ દોરી જાઓ, જતાં જતાં બારીઓ ખોલો અને બહાર નીકળી જાઓ. ઉપર ભાષા પસંદ કરી શકો છો; લખો અથવા માઇક દબાવીને બોલો.",
};

const FULL_STEPS: L<string> = {
  en: "Here is the full checklist, in order. One, do not touch any switch, plug, appliance or doorbell, and do not use your phone indoors — any can spark. Two, do not light a match or lighter, and do not smoke. Three, get everyone moving to the exit, opening doors and windows as you pass to vent the gas. Four, if the meter valve is safely on your way out, turn it clockwise to shut the supply. Five, get children, elderly and pets out first. Six, move everyone to open air, away from the building. Seven, warn your neighbours as you leave. Eight, once safely outside, call the gas emergency helpline 1906. Nine, do not go back inside until the crew says it is safe.",
  hi: "पूरी सूची, क्रम में। एक, अंदर किसी भी स्विच, प्लग, उपकरण या डोरबेल को न छुएँ और फ़ोन का इस्तेमाल न करें — इनसे चिंगारी बन सकती है। दो, माचिस या लाइटर न जलाएँ, धूम्रपान न करें। तीन, सबको बाहर की ओर ले जाएँ और रास्ते में खिड़कियाँ-दरवाज़े खोलते जाएँ ताकि गैस निकल जाए। चार, अगर मीटर वाल्व सुरक्षित रूप से रास्ते में हो तो उसे दक्षिणावर्त घुमाकर बंद करें। पाँच, बच्चों, बुज़ुर्गों और पालतू जानवरों को पहले निकालें। छह, सबको खुली हवा में इमारत से दूर ले जाएँ। सात, बाहर निकलते समय पड़ोसियों को सचेत करें। आठ, सुरक्षित बाहर पहुँचकर गैस इमरजेंसी हेल्पलाइन 1906 पर कॉल करें। नौ, जब तक टीम सुरक्षित न कहे, अंदर वापस न जाएँ।",
  gu: "અહીં આખી યાદી ક્રમમાં છે. એક, ઘરની અંદર કોઈ સ્વિચ, પ્લગ, સાધન કે ડોરબેલને હાથ ન લગાડો અને ફોન વાપરશો નહીં — આમાંથી કોઈ પણ તણખો પેદા કરી શકે. બે, દીવાસળી કે લાઇટર સળગાવશો નહીં અને ધૂમ્રપાન કરશો નહીં. ત્રણ, બધાને બહાર તરફ દોરો અને જતાં જતાં બારી-બારણાં ખોલી નાખો જેથી ગેસ બહાર નીકળી જાય. ચાર, જો ગેસ મીટરનો વાલ્વ રસ્તામાં સલામત રીતે આવે તો તેને ઘડિયાળની દિશામાં ફેરવીને બંધ કરો. પાંચ, બાળકો, વૃદ્ધો અને પાળતુ પ્રાણીઓને પહેલાં બહાર કાઢો. છ, બધાને ખુલ્લી હવામાં, બિલ્ડિંગથી દૂર લઈ જાઓ. સાત, બહાર નીકળતી વખતે પડોશીઓને ચેતવો. આઠ, સલામત રીતે બહાર પહોંચ્યા પછી ગેસ ઇમરજન્સી હેલ્પલાઇન 1906 પર ફોન કરો. નવ, ટીમ સલામત જાહેર ન કરે ત્યાં સુધી ફરી અંદર ન જાઓ.",
};

const FALLBACKS: L<string[]> = {
  en: [
    "I'm here and ready to guide you. Is there a flame, just a gas smell, or a hissing sound? Tell me and I'll give the exact step. Meanwhile: stay away from switches and get fresh air.",
    "Tell me a little more — is anyone unwell, and can you safely reach the gas valve? While you answer, move toward a door and don't touch any switch.",
  ],
  hi: [
    "मैं यहाँ हूँ और मदद के लिए तैयार हूँ। क्या आग है, सिर्फ़ गैस की गंध है, या सूँ-सूँ आवाज़? बताइए, मैं सटीक कदम बताऊँगा। तब तक स्विच से दूर रहें और ताज़ी हवा लें।",
    "थोड़ा और बताइए — क्या कोई अस्वस्थ है, और क्या आप वाल्व सुरक्षित रूप से बंद कर सकते हैं? जवाब देते हुए दरवाज़े की ओर बढ़ें और कोई स्विच न छुएँ।",
  ],
  gu: [
    "હું અહીં જ છું અને તમને મદદ કરવા તૈયાર છું. શું ક્યાંય આગ છે, ફક્ત ગેસની વાસ છે, કે સિસકારો સંભળાય છે? મને કહો, હું ચોક્કસ પગલું જણાવીશ. ત્યાં સુધી સ્વિચથી દૂર રહો અને તાજી હવા લો.",
    "થોડું વધારે કહો — શું કોઈ અસ્વસ્થ છે, અને શું તમે વાલ્વ સુધી સલામત રીતે પહોંચી શકો છો? જવાબ આપતાં આપતાં દરવાજા તરફ આગળ વધો અને કોઈ સ્વિચને હાથ ન લગાડો.",
  ],
};

const QUICK: L<string[]> = {
  en: ["I smell gas, no fire", "There's a flame / fire", "I'm panicking", "Call fire brigade", "Someone feels dizzy", "All safety steps"],
  hi: ["गैस की गंध है, आग नहीं", "आग / लपट है", "मैं घबरा रहा हूँ", "फायर ब्रिगेड बुलाएँ", "किसी को चक्कर आ रहा है", "सभी सुरक्षा कदम"],
  gu: ["ગેસની વાસ છે, આગ નથી", "આગ / ભડકો છે", "હું ગભરાઈ ગયો છું", "ફાયર બ્રિગેડ બોલાવો", "કોઈને ચક્કર આવે છે", "બધાં સલામતી પગલાં"],
};

const UI: L<{ voiceOn: string; voiceOff: string; listening: string; placeholder: string; assistant: string; guidance: string; calling: string; cancel: string; callNow: string; callbar: [CallNo, string][] }> = {
  en: { voiceOn: "voice on", voiceOff: "voice off", listening: "Listening… speak now", placeholder: "Type or tap the mic to speak…", assistant: "Assistant", guidance: "Guidance only · a crew has been dispatched", calling: "Calling", cancel: "Cancel", callNow: "Call now", callbar: [["1906", "Gas 1906"], ["101", "Fire 101"], ["108", "Ambulance 108"]] },
  hi: { voiceOn: "आवाज़ चालू", voiceOff: "आवाज़ बंद", listening: "सुन रहा हूँ… अब बोलें", placeholder: "टाइप करें या माइक दबाकर बोलें…", assistant: "सहायक", guidance: "केवल मार्गदर्शन · टीम भेज दी गई है", calling: "कॉल हो रहा है", cancel: "रद्द करें", callNow: "अभी कॉल करें", callbar: [["1906", "गैस 1906"], ["101", "फायर 101"], ["108", "एम्बुलेंस 108"]] },
  gu: { voiceOn: "અવાજ ચાલુ", voiceOff: "અવાજ બંધ", listening: "સાંભળી રહ્યો છું… હવે બોલો", placeholder: "લખો અથવા માઇક દબાવીને બોલો…", assistant: "સહાયક", guidance: "ફક્ત માર્ગદર્શન · ટીમ રવાના કરી દેવાઈ છે", calling: "કૉલ થઈ રહ્યો છે", cancel: "રદ કરો", callNow: "હમણાં કૉલ કરો", callbar: [["1906", "ગેસ 1906"], ["101", "ફાયર 101"], ["108", "એમ્બ્યુલન્સ 108"]] },
};

type Intent = { id: string; keys: string[]; weight?: number; call?: CallNo; replies: L<string[]> };

const INTENTS: Intent[] = [
  {
    id: "panic", weight: 1.3,
    keys: ["panic", "scared", "afraid", "fear", "nervous", "worried", "shaking", "terrified", "freaking", "घबरा", "डर", "डरा", "घबराहट", "ગભરા", "બીક", "ડર"],
    replies: {
      en: [
        "Take a slow breath with me — in through your nose, out through your mouth. You'll be okay and you're not alone; help is on the way. Next small step: don't touch any switch, and move toward a door or window for fresh air.",
        "I've got you. One slow breath. You did right by reaching out. We'll get through this calmly, step by step. First, head to fresh air, away from switches and flames.",
      ],
      hi: [
        "मेरे साथ एक गहरी साँस लें — नाक से अंदर, मुँह से बाहर। आप ठीक रहेंगे और अकेले नहीं हैं, मदद आ रही है। अगला छोटा कदम: किसी स्विच को न छुएँ और दरवाज़े या खिड़की की ओर बढ़ें।",
        "मैं आपके साथ हूँ। एक धीमी साँस लें। घबराएँ नहीं — शांत रहकर हम हर कदम पूरा करेंगे। पहले ताज़ी हवा की ओर बढ़ें, स्विच और आग से दूर।",
      ],
      gu: [
        "મારી સાથે એક ઊંડો શ્વાસ લો — નાકથી અંદર લો, મોંથી બહાર કાઢો. તમે સલામત રહેશો અને એકલા નથી; મદદ આવી રહી છે. હવે નાનું પગલું: કોઈ સ્વિચને હાથ ન લગાડો અને દરવાજા કે બારી તરફ આગળ વધો, જ્યાં તાજી હવા મળે.",
        "હું તમારી સાથે છું. એક ધીમો શ્વાસ લો. તમે મદદ માંગીને સાચું કર્યું. આપણે શાંતિથી, એક એક પગલે આ પાર કરી લઈશું. પહેલાં તાજી હવા તરફ જાઓ, સ્વિચ અને આગથી દૂર.",
      ],
    },
  },
  {
    id: "medical", weight: 1.7, call: "108",
    keys: ["dizzy", "faint", "unconscious", "breathe", "breathing", "suffocat", "choking", "nausea", "vomit", "headache", "collapse", "drowsy", "passed out", "चक्कर", "बेहोश", "साँस", "दम घुट", "उल्टी", "ચક્કર", "બેભાન", "શ્વાસ", "ઉલટી"],
    replies: {
      en: ["This is urgent — move yourself and anyone affected into fresh open air now, and don't re-enter a strong-smelling room. If someone is unconscious or can't breathe, get them outside and call an ambulance on 108. Opening the dialer."],
      hi: ["यह ज़रूरी है — खुद को और प्रभावित व्यक्ति को तुरंत ताज़ी खुली हवा में ले जाएँ, तेज़ गंध वाले कमरे में दोबारा न जाएँ। कोई बेहोश हो या साँस न ले पा रहा हो तो उसे बाहर ले जाकर 108 पर एम्बुलेंस बुलाएँ। डायलर खोल रहा हूँ।"],
      gu: ["આ તાત્કાલિક બાબત છે — તમે અને અસર પામેલી વ્યક્તિ તરત જ ખુલ્લી તાજી હવામાં જાઓ, અને તીવ્ર વાસવાળા રૂમમાં ફરી ન જાઓ. જો કોઈ બેભાન હોય કે શ્વાસ ન લઈ શકતું હોય, તો તેને બહાર લઈ જઈને 108 પર એમ્બ્યુલન્સ બોલાવો. હું ડાયલર ખોલું છું."],
    },
  },
  {
    id: "fire", weight: 1.8, call: "101",
    keys: ["fire", "flame", "flames", "burning", "blaze", "caught fire", "fire brigade", "call fire", "आग", "लपट", "ज्वाला", "जल रहा", "भड़क", "આગ", "જ્યોત", "સળગ", "ભભૂક"],
    replies: {
      en: [
        "There's an active FIRE — this is different from a leak, getting out comes first. Evacuate everyone immediately and call the fire brigade on 101; I'm opening the dialer. Do NOT throw water on a gas fire. Only if a small flame is right by the valve and safe, shut it clockwise on your way out.",
        "Fire changes everything — leave now with everyone. Call 101 for the fire brigade. Don't fight a gas fire with water and don't stop for belongings.",
      ],
      hi: [
        "यह जलती हुई आग है — यह रिसाव से अलग है, पहले बाहर निकलना ज़रूरी है। सबको तुरंत निकालें और फायर ब्रिगेड को 101 पर कॉल करें; डायलर खोल रहा हूँ। गैस की आग पर पानी न डालें। सिर्फ़ अगर छोटी लपट वाल्व के पास और सुरक्षित हो तो बाहर निकलते समय वाल्व बंद करें।",
        "आग सब बदल देती है — अभी सबके साथ बाहर निकलें। 101 पर फायर ब्रिगेड बुलाएँ। गैस की आग पर पानी न डालें और सामान के लिए न रुकें।",
      ],
      gu: [
        "આ સળગતી આગ છે — આ લીકથી અલગ છે, પહેલાં બહાર નીકળવું જરૂરી છે. બધાને તરત બહાર કાઢો અને ફાયર બ્રિગેડને 101 પર ફોન કરો; હું ડાયલર ખોલું છું. ગેસની આગ પર પાણી ન નાખો. ફક્ત જો નાનો ભડકો વાલ્વ પાસે હોય અને સલામત હોય, તો બહાર નીકળતી વખતે વાલ્વ બંધ કરો.",
        "આગમાં બધું બદલાઈ જાય — હમણાં જ બધા સાથે બહાર નીકળી જાઓ. 101 પર ફાયર બ્રિગેડ બોલાવો. ગેસની આગ પર પાણી ન નાખો અને સામાન લેવા રોકાશો નહીં.",
      ],
    },
  },
  {
    id: "leak", weight: 1.2, call: "1906",
    keys: ["smell", "leak", "leaking", "gas", "odour", "odor", "stink", "no fire", "गंध", "बदबू", "रिसाव", "लीक", "गैस", "आग नहीं", "વાસ", "ગંધ", "લીક", "ગેસ", "આગ નહીં"],
    replies: {
      en: [
        "A gas LEAK with no flame — good, this is handled calmly. Keep away from every switch and flame, get everyone outside while opening windows to vent, shut the gas valve clockwise if it's safe, and call 1906 once you're out. No fire means no water and no panic — just ventilate and evacuate.",
        "Understood — a smell, not a fire. Priorities: no sparks or switches, evacuate while venting, cut the valve if reachable, then call 1906 from outside. Tell me where in the house you are.",
      ],
      hi: [
        "बिना लपट के गैस रिसाव — अच्छा, इसे शांति से संभालेंगे। हर स्विच और आग से दूर रहें, खिड़कियाँ खोलते हुए सबको बाहर निकालें, सुरक्षित हो तो वाल्व दक्षिणावर्त बंद करें, और बाहर पहुँचकर 1906 पर कॉल करें। आग नहीं है तो पानी नहीं, घबराना नहीं — बस हवादार करें और बाहर निकलें।",
        "समझ गया — गंध है, आग नहीं। प्राथमिकताएँ: कोई चिंगारी या स्विच नहीं, हवादार करते हुए बाहर निकलें, वाल्व पहुँच में हो तो बंद करें, फिर बाहर से 1906 पर कॉल करें। बताइए आप घर में कहाँ हैं।",
      ],
      gu: [
        "ભડકા વગરનો ગેસ લીક — સારું, આને શાંતિથી સંભાળી શકાય. દરેક સ્વિચ અને આગથી દૂર રહો, બારીઓ ખોલતાં ખોલતાં બધાને બહાર કાઢો, સલામત હોય તો વાલ્વ ઘડિયાળની દિશામાં બંધ કરો, અને બહાર નીકળ્યા પછી 1906 પર ફોન કરો. આગ નથી એટલે પાણી નહીં, ગભરાટ નહીં — બસ હવા આવવા દો અને બહાર નીકળો.",
        "સમજ્યો — વાસ છે, આગ નથી. પ્રાથમિકતાઓ: કોઈ તણખો કે સ્વિચ નહીં, હવા આવવા દેતાં બહાર નીકળો, વાલ્વ પહોંચમાં હોય તો બંધ કરો, પછી બહારથી 1906 પર ફોન કરો. મને કહો તમે ઘરમાં ક્યાં છો.",
      ],
    },
  },
  {
    id: "call", weight: 1.4, call: "1906",
    keys: ["call", "phone number", "who to call", "helpline", "emergency number", "1906", "report", "contact", "फ़ोन", "कॉल", "नंबर", "हेल्पलाइन", "ફોન", "કૉલ", "નંબર", "હેલ્પલાઇન"],
    replies: {
      en: ["Call the 24×7 gas emergency helpline 1906 — free and in many languages. Make the call from OUTSIDE in open air, not indoors. Opening the dialer now."],
      hi: ["24×7 गैस इमरजेंसी हेल्पलाइन 1906 पर कॉल करें — यह मुफ़्त है और कई भाषाओं में उपलब्ध है। कॉल हमेशा बाहर खुली हवा से करें, अंदर से नहीं। डायलर खोल रहा हूँ।"],
      gu: ["24×7 ગેસ ઇમરજન્સી હેલ્પલાઇન 1906 પર ફોન કરો — તે મફત છે અને ઘણી ભાષાઓમાં મળે છે. ફોન હંમેશા બહાર ખુલ્લી હવામાંથી કરો, ઘરની અંદરથી નહીં. હું ડાયલર ખોલું છું."],
    },
  },
  {
    id: "valve",
    keys: ["valve", "meter", "turn off", "shut off", "regulator", "stopcock", "वाल्व", "मीटर", "बंद", "रेगुलेटर", "વાલ્વ", "મીટર", "બંધ", "રેગ્યુલેટર"],
    replies: {
      en: ["The main shut-off is at the gas meter — often outside or at the kitchen entry. Turn it CLOCKWISE until it stops. For a piped cylinder, also close the regulator knob on top. Only if you can reach it without passing through a strong smell."],
      hi: ["मुख्य वाल्व गैस मीटर के पास होता है — अक्सर बाहर या रसोई के प्रवेश पर। इसे दक्षिणावर्त घुमाकर बंद करें। पाइप सिलेंडर हो तो ऊपर का रेगुलेटर नॉब भी बंद करें। यह तभी करें जब तेज़ गंध से गुज़रे बिना पहुँच सकें।"],
      gu: ["મુખ્ય વાલ્વ ગેસ મીટર પાસે હોય છે — ઘણી વાર બહાર કે રસોડાના પ્રવેશ પાસે. તેને ઘડિયાળની દિશામાં ફેરવીને બંધ કરો. પાઇપવાળા સિલિન્ડર માટે ઉપરનો રેગ્યુલેટર નૉબ પણ બંધ કરો. આ ત્યારે જ કરો જ્યારે તીવ્ર વાસમાંથી પસાર થયા વગર ત્યાં પહોંચી શકો."],
    },
  },
  {
    id: "electrical",
    keys: ["switch", "light", "fan", "plug", "appliance", "doorbell", "socket", "electric", "geyser", "स्विच", "लाइट", "बत्ती", "पंखा", "बिजली", "સ્વિચ", "લાઇટ", "પંખો", "વીજ"],
    replies: {
      en: ["Leave everything electrical exactly as it is — no lights, fans, switches, plugs, AC, geyser or doorbell. Turning something on OR off makes a spark. Just move to fresh air."],
      hi: ["बिजली से जुड़ी हर चीज़ वैसी ही रहने दें — कोई लाइट, पंखा, स्विच, प्लग, एसी, गीज़र या डोरबेल नहीं। चालू या बंद करने से चिंगारी बनती है। बस ताज़ी हवा की ओर बढ़ें।"],
      gu: ["વીજળીની દરેક વસ્તુ જેમ છે તેમ જ રહેવા દો — કોઈ લાઇટ, પંખો, સ્વિચ, પ્લગ, એસી, ગીઝર કે ડોરબેલ નહીં. કોઈ વસ્તુ ચાલુ કે બંધ કરવાથી તણખો થાય છે. બસ તાજી હવા તરફ આગળ વધો."],
    },
  },
  {
    id: "children",
    keys: ["child", "kid", "baby", "elder", "elderly", "senior", "pet", "dog", "cat", "family", "बच्चा", "बच्चे", "बुज़ुर्ग", "पालतू", "બાળક", "વૃદ્ધ", "પાળતુ"],
    replies: {
      en: ["Get children, elderly and pets out FIRST — they're most vulnerable to gas. Guide them calmly to open air, away from the building, and stay together."],
      hi: ["बच्चों, बुज़ुर्गों और पालतू जानवरों को सबसे पहले निकालें — वे गैस से सबसे ज़्यादा प्रभावित होते हैं। उन्हें शांति से खुली हवा में, इमारत से दूर ले जाएँ।"],
      gu: ["બાળકો, વૃદ્ધો અને પાળતુ પ્રાણીઓને સૌથી પહેલાં બહાર કાઢો — ગેસની અસર તેમને સૌથી વધુ થાય છે. તેમને શાંતિથી ખુલ્લી હવામાં, બિલ્ડિંગથી દૂર લઈ જાઓ."],
    },
  },
  {
    id: "stove",
    keys: ["stove", "burner", "cook", "cylinder", "lpg", "kitchen", "hob", "चूल्हा", "बर्नर", "सिलेंडर", "रसोई", "ચૂલો", "બર્નર", "સિલિન્ડર", "રસોડું"],
    replies: {
      en: ["If the stove is on and safely reachable, turn every burner knob OFF and close the cylinder regulator. Don't relight anything and never test for gas with a flame. Then open the kitchen window and step out."],
      hi: ["अगर चूल्हा चालू है और सुरक्षित पहुँच में है तो सभी बर्नर नॉब बंद करें और सिलेंडर रेगुलेटर बंद करें। कुछ भी दोबारा न जलाएँ और आग से गैस की जाँच कभी न करें। फिर खिड़की खोलकर बाहर निकलें।"],
      gu: ["જો ચૂલો ચાલુ હોય અને સલામત રીતે પહોંચી શકાય, તો બધા બર્નરના નૉબ બંધ કરો અને સિલિન્ડરનો રેગ્યુલેટર બંધ કરો. કંઈ ફરી સળગાવશો નહીં અને આગથી ગેસ ક્યારેય તપાસશો નહીં. પછી રસોડાની બારી ખોલીને બહાર નીકળો."],
    },
  },
  {
    id: "vent",
    keys: ["window", "ventilat", "air", "open door", "fresh air", "breeze", "खिड़की", "हवा", "दरवाज़ा", "બારી", "હવા", "બારણું"],
    replies: {
      en: ["Yes — as you leave, open the doors and windows you can safely reach so the gas vents outside. Skip the exhaust fan; that's electrical. Natural cross-ventilation is exactly right."],
      hi: ["हाँ — बाहर निकलते समय जो दरवाज़े और खिड़कियाँ सुरक्षित रूप से खोल सकें, खोल दें ताकि गैस निकल जाए। एग्ज़ॉस्ट फैन न चलाएँ, वह बिजली का है। प्राकृतिक हवा ही सही है।"],
      gu: ["હા — બહાર નીકળતી વખતે જે બારી-બારણાં સલામત રીતે ખોલી શકો તે ખોલી નાખો જેથી ગેસ બહાર નીકળી જાય. એક્ઝોસ્ટ ફેન ચાલુ ન કરો, તે વીજળીનો છે. કુદરતી હવાની અવરજવર જ યોગ્ય છે."],
    },
  },
  {
    id: "sound",
    keys: ["hiss", "whistle", "noise", "sound", "rotten egg", "sulphur", "सूँ", "फुफ", "सीटी", "आवाज़", "सड़े अंडे", "સિસ", "સીટી", "અવાજ", "સડેલા ઈંડા"],
    replies: {
      en: ["A rotten-egg smell, or a hiss or whistle near a pipe, is a real warning even if faint. Treat it as a confirmed leak: no switches, evacuate while venting, shut the valve if safe, and call 1906 from outside."],
      hi: ["सड़े अंडे जैसी गंध, या पाइप के पास सूँ-सूँ या सीटी की आवाज़ हल्की हो तो भी असली चेतावनी है। इसे पक्का रिसाव मानें: कोई स्विच नहीं, हवादार करते हुए बाहर निकलें, सुरक्षित हो तो वाल्व बंद करें, और बाहर से 1906 पर कॉल करें।"],
      gu: ["સડેલા ઈંડા જેવી વાસ, કે પાઇપ પાસે સિસકારો કે સીટી જેવો અવાજ — ધીમો હોય તોય એ સાચી ચેતવણી છે. તેને પાકો લીક ગણો: કોઈ સ્વિચ નહીં, હવા આવવા દેતાં બહાર નીકળો, સલામત હોય તો વાલ્વ બંધ કરો, અને બહારથી 1906 પર ફોન કરો."],
    },
  },
  {
    id: "cng",
    keys: ["car", "vehicle", "cng", "auto", "rickshaw", "engine", "station", "pump", "गाड़ी", "कार", "इंजन", "ગાડી", "કાર", "એન્જિન"],
    replies: {
      en: ["For a CNG vehicle or station: switch the engine off immediately, don't touch any electricals or lights, and no smoking or flames nearby. Move people to a safe distance and alert the station staff."],
      hi: ["सीएनजी वाहन या स्टेशन के लिए: तुरंत इंजन बंद करें, किसी बिजली उपकरण या लाइट को न छुएँ, और पास में धूम्रपान या आग बिल्कुल नहीं। लोगों को सुरक्षित दूरी पर ले जाएँ और स्टेशन स्टाफ़ को बताएँ।"],
      gu: ["સીએનજી વાહન કે સ્ટેશન માટે: તરત એન્જિન બંધ કરો, કોઈ વીજ સાધન કે લાઇટને હાથ ન લગાડો, અને પાસે ધૂમ્રપાન કે આગ બિલકુલ નહીં. લોકોને સલામત અંતરે લઈ જાઓ અને સ્ટેશનના સ્ટાફને જાણ કરો."],
    },
  },
  {
    id: "next",
    keys: ["what next", "now what", "outside now", "evacuated", "how long", "eta", "waiting", "अब क्या", "बाहर", "कितनी देर", "હવે શું", "બહાર", "કેટલી વાર"],
    replies: {
      en: ["You've done the right things. Stay outside in open air, away from the building, everyone together. Don't go back in for belongings until the crew clears it. Have you called 1906? If not, do it now — opening the dialer.", "Good. Hold your position outside, count heads, and wait for the crew. Don't re-enter until they say it's safe."],
      hi: ["आपने सही किया। बाहर खुली हवा में, इमारत से दूर, सबके साथ रहें। जब तक टीम सुरक्षित न कहे, सामान के लिए अंदर न जाएँ। क्या आपने 1906 पर कॉल किया? नहीं तो अभी करें — डायलर खोल रहा हूँ।", "बढ़िया। बाहर रुके रहें, सबको गिन लें, और टीम का इंतज़ार करें। सुरक्षित कहने तक अंदर न जाएँ।"],
      gu: ["તમે બરાબર કર્યું. બહાર ખુલ્લી હવામાં, બિલ્ડિંગથી દૂર, બધા સાથે રહો. ટીમ મંજૂરી ન આપે ત્યાં સુધી સામાન લેવા અંદર ન જાઓ. શું તમે 1906 પર ફોન કર્યો? ન કર્યો હોય તો હમણાં કરો — હું ડાયલર ખોલું છું.", "સરસ. બહાર જ રહો, બધાની ગણતરી કરી લો, અને ટીમની રાહ જુઓ. તેઓ સલામત કહે ત્યાં સુધી અંદર ન જાઓ."],
    },
  },
  {
    id: "thanks",
    keys: ["thank", "thanks", "okay", "ok", "done", "got it", "alright", "yes", "धन्यवाद", "ठीक", "ओके", "आभार", "આભાર", "ઠીક", "ઓકે"],
    replies: {
      en: ["You're doing really well. Keep following the steps, stay in fresh air, and stay with me — tell me anything you see or feel.", "Great. I'm right here. Describe what's around you and I'll guide the next move."],
      hi: ["आप बहुत अच्छा कर रहे हैं। कदमों का पालन करते रहें, ताज़ी हवा में रहें और मेरे साथ बने रहें — जो भी दिखे या महसूस हो, बताएँ।", "बढ़िया। मैं यहीं हूँ। बताइए आस-पास क्या है, मैं अगला कदम बताऊँगा।"],
      gu: ["તમે ખૂબ સરસ કરી રહ્યા છો. પગલાં અનુસરતા રહો, તાજી હવામાં રહો અને મારી સાથે રહો — જે પણ દેખાય કે અનુભવાય તે મને કહો.", "સરસ. હું અહીં જ છું. કહો આસપાસ શું છે, હું આગળનું પગલું જણાવીશ."],
    },
  },
];

const norm = (s: string) => " " + s.toLowerCase().replace(/[.,!?;:()"]/g, " ").replace(/\s+/g, " ").trim() + " ";

// Gujarati (U+0A80–U+0AFF) → Devanagari (U+0900–U+097F): parallel Unicode blocks,
// offset 0x180. Lets a Hindi TTS voice pronounce Gujarati when no gu-IN voice exists.
// A few letters need a phonetic override so a Hindi engine reads them cleanly.
const GU_FIX: Record<string, string> = {
  "ળ": "ल",   // retroflex ḷa → la  (સળગ, પાળતુ, મળે …)
  "ૄ": "ृ",   // vocalic RR sign → R sign
  "ૠ": "ऋ",   // vocalic RR → R
  "ઌ": "ल",   // vocalic L → la
  "ૐ": "ॐ",
};
function guToDeva(s: string) {
  let out = "";
  for (const ch of s) {
    if (GU_FIX[ch] !== undefined) { out += GU_FIX[ch]; continue; }
    const c = ch.codePointAt(0)!;
    out += c >= 0x0a80 && c <= 0x0aff ? String.fromCodePoint(c - 0x180) : ch;
  }
  return out;
}

type Msg = { role: "bot" | "user"; text: string; call?: CallNo };

export default function EmergencyChat() {
  const initialLanguage = preferredLanguage();
  const [lang, setLang] = useState<Lang>(initialLanguage);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [muted, setMuted] = useState(false);
  const [listening, setListening] = useState(false);
  const [sttOk, setSttOk] = useState(false);
  const [micMsg, setMicMsg] = useState<string | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceName, setVoiceName] = useState("");
  const [callPrompt, setCallPrompt] = useState<CallNo | null>(null);

  const boxRef = useRef<HTMLDivElement>(null);
  const recRef = useRef<any>(null);
  const mutedRef = useRef(false);
  const langRef = useRef<Lang>(initialLanguage);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const rot = useRef<Record<string, number>>({});
  const lastReply = useRef("");

  useEffect(() => { mutedRef.current = muted; }, [muted]);
  useEffect(() => { langRef.current = lang; }, [lang]);

  const byLang = (list: SpeechSynthesisVoice[], code: string) => list.find((v) => v.lang.toLowerCase().startsWith(code));
  function pickVoice(list: SpeechSynthesisVoice[], lg: Lang): SpeechSynthesisVoice | null {
    if (lg === "hi") return byLang(list, "hi") || list.find((v) => /hindi|swara|hemant|madhur/i.test(v.name)) || byLang(list, "en") || list[0] || null;
    if (lg === "gu") return byLang(list, "gu") || list.find((v) => /gujarati/i.test(v.name)) || byLang(list, "hi") || byLang(list, "en") || list[0] || null;
    const pref = [/daniel/i, /google uk english male/i, /\b(george|arthur|ryan|guy|brian|james)\b/i, /en[-_]?gb/i, /^en/i];
    for (const re of pref) { const v = list.find((x) => re.test(x.name) || re.test(x.lang)); if (v) return v; }
    return byLang(list, "en") || list[0] || null;
  }

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const load = () => {
      const vs = window.speechSynthesis.getVoices();
      if (!vs.length) return;
      setVoices(vs);
      if (!voiceRef.current) { const v = pickVoice(vs, langRef.current); voiceRef.current = v; if (v) setVoiceName(v.name); }
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const speak = useCallback((text: string) => {
    if (mutedRef.current || typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const v = voiceRef.current;
    const usingGuVoice = !!v && v.lang.toLowerCase().startsWith("gu");
    let toSpeak = text;
    let spokenLang = v ? v.lang : (langRef.current === "hi" ? "hi-IN" : langRef.current === "gu" ? "gu-IN" : "en-GB");
    // No Gujarati voice on this device → transliterate to Devanagari + read with Hindi voice.
    if (langRef.current === "gu" && !usingGuVoice) {
      toSpeak = guToDeva(text);
      spokenLang = "hi-IN";
    }
    const u = new SpeechSynthesisUtterance(toSpeak);
    u.rate = 0.96; u.pitch = 1;
    if (v) u.voice = v;
    u.lang = spokenLang;
    window.speechSynthesis.speak(u);
    setTimeout(() => window.speechSynthesis.resume(), 250);
  }, []);

  const pushBot = useCallback((text: string, call?: CallNo) => {
    lastReply.current = text;
    setMsgs((m) => [...m, { role: "bot", text, call }]);
    speak(text);
    if (call) setCallPrompt(call);
  }, [speak]);

  const respondTo = useCallback((raw: string) => {
    const t = raw.trim();
    if (!t) return;
    const lg = langRef.current;
    setMsgs((m) => [...m, { role: "user", text: t }]);
    setInput("");

    if (/all safety|full checklist|all steps|everything|सभी सुरक्षा|सभी कदम|पूरी सूची|બધા સલામતી|બધા પગલાં|પૂરી યાદી/i.test(t)) {
      setTimeout(() => pushBot(FULL_STEPS[lg]), 220);
      return;
    }

    // Situational answers come from the shared platform context, so the
    // assistant knows about the live incident, the address on file, and the
    // household's readiness — never answering in isolation.
    if (/my (status|info|details)|crew status|where.*crew|help coming|is help|status of|मदद कब|टीम कहाँ|मेरी जानकारी|स्थिति|ટીમ ક્યાં|મદદ ક્યારે|મારી માહિતી/i.test(t)) {
      const c = readPlatformContext();
      const live = c.liveIncident?.status === "active" ? c.liveIncident : null;
      const verified = c.healthProfile.emergencyContactVerified;
      const reply = lg === "hi"
        ? `${live ? `आपका आपातकाल ${live.id} (${live.type}) कंट्रोल रूम में लाइव है — टीम ${live.address} के लिए रवाना है।` : "अभी कोई आपातकालीन सत्र सक्रिय नहीं है।"} आपका आपातकालीन संपर्क ${verified ? "सत्यापित है, परिवार को सूचना तैयार है" : "अभी सत्यापित नहीं है — फिर भी मैं आपके साथ हूँ"}। सुरक्षा कदमों का पालन करते रहें।`
        : lg === "gu"
        ? `${live ? `તમારી ઇમરજન્સી ${live.id} (${live.type}) કંટ્રોલ રૂમમાં લાઇવ છે — ટીમ ${live.address} તરફ રવાના છે.` : "હમણાં કોઈ ઇમરજન્સી સત્ર સક્રિય નથી."} તમારો ઇમરજન્સી સંપર્ક ${verified ? "ચકાસાયેલ છે, કુટુંબને જાણ તૈયાર છે" : "હજી ચકાસાયેલ નથી — છતાં હું તમારી સાથે છું"}. સલામતી પગલાં અનુસરતા રહો.`
        : `${live ? `Your emergency ${live.id} (${live.type}) is live with the control room — a crew is en route to ${live.address}.` : "No emergency session is active right now."} Your emergency contact is ${verified ? "verified, so your family alert is ready" : "not verified yet — I can still help you"}. Keep following the safety steps.`;
      setTimeout(() => pushBot(reply), 220);
      return;
    }

    const msg = norm(t);
    let best: Intent | null = null;
    let bestScore = 0;
    for (const it of INTENTS) {
      let hits = 0;
      for (const k of it.keys) if (msg.includes(k)) hits++;
      const score = hits * (it.weight || 1);
      if (score > bestScore) { bestScore = score; best = it; }
    }

    let call: CallNo | undefined = best?.call;
    if (/fire brigade|call fire|आग|फायर|આગ|ફાયર/i.test(t)) call = "101";
    else if (/ambulance|108|एम्बुलेंस|એમ્બ્યુલન્સ|चक्कर|બેભાન/i.test(t)) call = "108";
    else if (/1906|helpline|हेल्पलाइन|હેલ્પલાઇન|call|कॉल|કૉલ/i.test(t)) call = call ?? "1906";

    let reply: string;
    if (best && bestScore > 0) {
      const arr = best.replies[lg];
      const key = best.id + ":" + lg;
      const prev = rot.current[key] ?? -1;
      let idx = (prev + 1) % arr.length;
      if (arr.length > 1 && arr[idx] === lastReply.current) idx = (idx + 1) % arr.length;
      rot.current[key] = idx;
      reply = arr[idx];
    } else {
      const arr = FALLBACKS[lg];
      const key = "_fb:" + lg;
      const prev = rot.current[key] ?? -1;
      const idx = (prev + 1) % arr.length;
      rot.current[key] = idx;
      reply = arr[idx];
    }
    setTimeout(() => pushBot(reply, call), 260);
  }, [pushBot]);

  const respondRef = useRef(respondTo);
  useEffect(() => { respondRef.current = respondTo; }, [respondTo]);

  // greeting + STT
  useEffect(() => {
    setMsgs([{ role: "bot", text: GREET[langRef.current] }]);
    lastReply.current = GREET[langRef.current];
    setTimeout(() => speak(GREET[langRef.current]), 600);

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SR) {
      const r = new SR();
      r.continuous = false; r.interimResults = true; r.maxAlternatives = 1; r.lang = LANGS.find((item) => item.code === langRef.current)!.stt;
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
          "not-allowed": "Microphone is blocked. Use the lock icon in the address bar to allow the microphone, then retry.",
          "service-not-allowed": "Microphone is blocked in browser settings — allow it and retry.",
          "no-speech": "I didn't catch that — tap the mic and speak again.",
          "audio-capture": "No microphone found. Check it's connected.",
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

  function changeLang(lg: Lang) {
    setLang(lg);
    langRef.current = lg;
    const v = pickVoice(voices, lg);
    voiceRef.current = v; if (v) setVoiceName(v.name);
    if (recRef.current) recRef.current.lang = LANGS.find((x) => x.code === lg)!.stt;
    setMsgs([{ role: "bot", text: GREET[lg] }]);
    lastReply.current = GREET[lg];
    rot.current = {};
    setTimeout(() => speak(GREET[lg]), 150);
  }

  async function toggleMic() {
    const r = recRef.current; if (!r) return; setMicMsg(null);
    r.lang = LANGS.find((x) => x.code === langRef.current)!.stt;
    if (listening) { try { r.stop(); } catch {} setListening(false); return; }
    try { await navigator.mediaDevices?.getUserMedia({ audio: true }); }
    catch { setMicMsg("Microphone is blocked. Allow mic access and try again."); return; }
    try { r.start(); setListening(true); } catch { setListening(true); }
  }
  function toggleMute() { setMuted((m) => { if (!m) window.speechSynthesis?.cancel(); return !m; }); }
  function changeVoice(name: string) {
    const v = voices.find((x) => x.name === name) || null;
    voiceRef.current = v; setVoiceName(name);
    if (v && !mutedRef.current) speak(lang === "hi" ? "ठीक है, अब यही आवाज़।" : lang === "gu" ? "બરાબર, હવે આ અવાજ." : "Okay, using this voice.");
  }

  const ui = UI[lang];
  const hasGuVoice = voices.some((v) => v.lang.toLowerCase().startsWith("gu"));
  const langVoices = (() => {
    if (lang === "gu") {
      const gu = voices.filter((v) => v.lang.toLowerCase().startsWith("gu"));
      if (gu.length) return gu;
      const hi = voices.filter((v) => v.lang.toLowerCase().startsWith("hi"));
      if (hi.length) return hi; // Hindi voice reads the Devanagari transliteration
      return voices.filter((v) => /^en/i.test(v.lang));
    }
    const f = voices.filter((v) => v.lang.toLowerCase().startsWith(lang));
    if (f.length) return f;
    const en = voices.filter((v) => /^en/i.test(v.lang));
    return en.length ? en : voices;
  })();

  return (
    <>
      <Card className="overflow-hidden flex flex-col h-[600px]">
        <div className="bg-ink-950 text-white p-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-9 w-9 rounded-full bg-brand-500/20 grid place-items-center shrink-0"><Bot className="w-4 h-4 text-brand-300" /></div>
            <div className="min-w-0">
              <div className="font-semibold text-sm truncate">SuRaksha AI · Safety Assistant</div>
              <div className="text-xs text-ink-400 flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-pulse" /> {muted ? ui.voiceOff : ui.voiceOn}</div>
            </div>
          </div>
          {/* Language and mute stay at full size and never collapse into an
              overflow menu — a caller who cannot read English must be able to
              switch script in one tap, without scrolling (design guide §20A). */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="flex overflow-hidden rounded-lg border border-white/15" role="group" aria-label="Assistant language">
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  onClick={() => changeLang(l.code)}
                  aria-pressed={lang === l.code}
                  className={`min-h-tap px-2.5 text-xs font-semibold sm:px-3 ${lang === l.code ? "bg-brand-500 text-white" : "bg-white/5 text-ink-300 hover:bg-white/10"}`}
                >
                  {l.label}
                </button>
              ))}
            </div>
            <button
              onClick={toggleMute}
              aria-label={muted ? "Unmute spoken guidance" : "Mute spoken guidance"}
              aria-pressed={muted}
              className="grid h-11 w-11 place-items-center rounded-lg text-ink-300 hover:bg-white/10"
            >
              {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5 text-brand-300" />}
            </button>
          </div>
        </div>

        {langVoices.length > 0 && (
          <div className="px-3 py-1.5 bg-ink-900/95 border-b border-white/5">
            <select value={voiceName} onChange={(e) => changeVoice(e.target.value)} title="Assistant voice"
              className="w-full text-xs bg-white/10 text-white rounded-lg px-2 py-1 outline-none border border-white/10">
              {langVoices.map((v) => <option key={v.name} value={v.name} className="text-ink-900">{v.name.replace(/Microsoft |Google |Online.*|\(.*\)/g, "").trim() || v.name}</option>)}
            </select>
            {lang === "gu" && !hasGuVoice && (
              <p className="text-xs text-ink-400 mt-1">ગુજરાતી અવાજ ઉપલબ્ધ નથી — હિન્દી અવાજ દ્વારા વાંચે છે.</p>
            )}
          </div>
        )}

        <div className="flex items-stretch gap-1.5 px-3 py-2 bg-red-50 border-b border-red-100">
          {ui.callbar.map(([n, label]) => (
            <button key={n} onClick={() => setCallPrompt(n)}
              className={`flex-1 flex items-center justify-center gap-1 text-white rounded-lg py-1.5 text-xs font-semibold ${n === "1906" ? "bg-red-600 hover:bg-red-700" : n === "101" ? "bg-orange-500 hover:bg-orange-600" : "bg-sky-600 hover:bg-sky-700"}`}>
              {n === "101" ? <Flame className="w-3.5 h-3.5" /> : n === "108" ? <Ambulance className="w-3.5 h-3.5" /> : <Phone className="w-3.5 h-3.5" />} {label}
            </button>
          ))}
        </div>

        <div ref={boxRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-ink-50/40">
          {msgs.map((m, i) => (
            <div key={i} className={`flex ${m.role === "bot" ? "justify-start" : "justify-end"}`}>
              <div className={`px-4 py-2.5 max-w-[86%] text-sm leading-relaxed shadow-sm rounded-xl ${m.role === "bot" ? "bg-white border border-ink-200 text-ink-800 rounded-tl-md" : "bg-brand-600 text-white rounded-tr-md"}`}>
                {m.role === "bot" && <span className="text-xs uppercase tracking-wider text-brand-600 block mb-0.5">{ui.assistant}</span>}
                {m.text}
                {m.call && (
                  <button onClick={() => setCallPrompt(m.call!)} className="mt-2 flex items-center gap-2 text-white bg-red-600 hover:bg-red-700 rounded-lg px-3 py-1.5 text-xs font-semibold">
                    <PhoneCall className="w-3.5 h-3.5" /> {SERVICE[m.call][lang]} · {m.call}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {micMsg && (
          <div className="mx-3 mb-1 flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {micMsg}
          </div>
        )}

        <div className="px-3 pt-2 flex gap-1.5 flex-wrap border-t border-ink-100">
          {QUICK[lang].map((q) => (
            <button key={q} onClick={() => respondTo(q)} className="text-xs font-medium px-2.5 py-1 rounded-full border border-ink-200 text-ink-600 hover:border-brand-300 hover:bg-brand-50 transition">{q}</button>
          ))}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); respondTo(input); }} className="p-3 flex items-center gap-2">
          {sttOk && (
            <button type="button" onClick={toggleMic} title="speak"
              className={`p-2.5 rounded-xl border transition ${listening ? "bg-red-600 border-red-600 text-white animate-pulse" : "border-ink-200 text-ink-600 hover:bg-ink-50"}`}>
              <Mic className="w-4 h-4" />
            </button>
          )}
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={listening ? ui.listening : ui.placeholder}
            className="flex-1 rounded-xl border border-ink-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-400" />
          <button type="submit" className="p-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white"><Send className="w-4 h-4" /></button>
        </form>
        <div className="px-3 pb-2 -mt-1 flex items-center gap-1.5 text-xs text-ink-400">
          <ShieldPlus className="w-3 h-3" /> {ui.guidance}
        </div>
      </Card>

      {callPrompt && <CallDialog num={callPrompt} lang={lang} onClose={() => setCallPrompt(null)} />}
    </>
  );
}

function CallDialog({ num, lang, onClose }: { num: CallNo; lang: Lang; onClose: () => void }) {
  const ui = UI[lang];
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink-950/60 backdrop-blur-sm p-4 animate-fade" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-xs bg-white rounded-xl shadow-2xl overflow-hidden pop">
        <div className="bg-ink-950 text-white pt-7 pb-6 text-center relative">
          <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-white/10 text-ink-400"><X className="w-4 h-4" /></button>
          <div className="mx-auto h-16 w-16 rounded-full bg-brand-500/20 grid place-items-center mb-3 animate-ring"><PhoneCall className="w-7 h-7 text-brand-300" /></div>
          <div className="text-sm text-ink-400">{ui.calling}</div>
          <div className="text-lg font-bold px-3">{SERVICE[num][lang]}</div>
          <div className="text-3xl font-bold tracking-wider mt-1">{num}</div>
        </div>
        <div className="p-4 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl border border-ink-200 text-ink-600 font-semibold py-3 text-sm hover:bg-ink-50">{ui.cancel}</button>
          <a href={`tel:${num}`} className="flex-[1.4] rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold py-3 text-sm flex items-center justify-center gap-2"><PhoneCall className="w-4 h-4" /> {ui.callNow}</a>
        </div>
      </div>
    </div>
  );
}
