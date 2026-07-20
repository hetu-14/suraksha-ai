"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Card } from "@/components/ui";
import { Bot, Send, Mic, Volume2, VolumeX, X, Sparkles } from "lucide-react";
import { Bill, BillExplanation, Customer, ExplanationFactor } from "@/lib/types";
import { inr } from "@/lib/billExplain";
import { readPlatformContext } from "@/lib/platform";

type Lang = "en" | "hi" | "gu";
const LANGS: { code: Lang; label: string; stt: string }[] = [
  { code: "en", label: "EN", stt: "en-IN" },
  { code: "hi", label: "हिं", stt: "hi-IN" },
  { code: "gu", label: "ગુ", stt: "gu-IN" },
];
const t = (lg: Lang, en: string, hi: string, gu: string) => (lg === "hi" ? hi : lg === "gu" ? gu : en);

const GU_FIX: Record<string, string> = { "ળ": "ल", "ૄ": "ृ", "ૠ": "ऋ", "ઌ": "ल", "ૐ": "ॐ" };
function guToDeva(s: string) {
  let out = "";
  for (const ch of s) {
    if (GU_FIX[ch] !== undefined) { out += GU_FIX[ch]; continue; }
    const c = ch.codePointAt(0)!;
    out += c >= 0x0a80 && c <= 0x0aff ? String.fromCodePoint(c - 0x180) : ch;
  }
  return out;
}
const norm = (s: string) => " " + s.toLowerCase().replace(/[.,!?;:()"]/g, " ").replace(/\s+/g, " ").trim() + " ";

/* ---------- facts from the computed explanation ---------- */
type Facts = {
  cycle: string; amount: number; delta: number; higher: boolean;
  usage?: ExplanationFactor; tariff?: ExplanationFactor; fixed?: ExplanationFactor; arrears?: ExplanationFactor; lateFee?: ExplanationFactor;
  leakPct: number; leakLevel: "none" | "watch" | "high"; verdict: string; away: boolean;
  units: number; avg: number | null; vsPrev: number | null; vsYear: number | null; vsAvg: number | null;
  yoy: string | null; rate: number; status: string; dueDate?: string;
};
function toFacts(ex: BillExplanation, bill: Bill): Facts {
  const f = ex.factors;
  return {
    cycle: bill.cycleLabel, amount: bill.amount, delta: ex.amountDeltaVsPrev, higher: ex.amountDeltaVsPrev >= 0,
    usage: f.find((x) => /usage/i.test(x.label)), tariff: f.find((x) => /tariff/i.test(x.label)), fixed: f.find((x) => /fixed/i.test(x.label)), arrears: f.find((x) => /arrears/i.test(x.label)), lateFee: f.find((x) => /late payment/i.test(x.label)),
    leakPct: ex.leakPct, leakLevel: ex.leakLevel, verdict: ex.verdict, away: ex.away,
    units: bill.unitsScm, avg: ex.comparisons.avgUnits, vsPrev: ex.comparisons.vsPrevPct, vsYear: ex.comparisons.vsYearPct,
    vsAvg: ex.comparisons.vsAvgPct, yoy: ex.comparisons.yoyLabel, rate: bill.ratePerScm, status: bill.status, dueDate: bill.dueDate,
  };
}
const abs = (n: number) => Math.abs(n);

function driver(f: Facts, lg: Lang) {
  const cand = [f.usage, f.tariff, f.fixed, f.arrears, f.lateFee].filter(Boolean).sort((a, b) => abs(b!.amount) - abs(a!.amount));
  if (!cand.length) return t(lg, "routine variation", "सामान्य बदलाव", "સામાન્ય ફેરફાર");
  const top = cand[0]!;
  if (/usage/i.test(top.label)) return t(lg, "higher gas usage", "गैस की ज़्यादा खपत", "ગેસનો વધુ વપરાશ");
  if (/tariff/i.test(top.label)) return t(lg, "a change in the gas rate", "गैस दर में बदलाव", "ગેસના દરમાં ફેરફાર");
  if (/arrears/i.test(top.label)) return t(lg, "a previous unpaid balance", "पिछला बकाया", "પહેલાનું બાકી" );
  if (/late payment/i.test(top.label)) return t(lg, "a late payment fee", "देरी शुल्क", "વિલંબ શુલ્ક");
  return t(lg, "fixed charges", "फिक्स्ड चार्ज", "ફિક્સ્ડ ચાર્જ");
}
function levelNote(f: Facts, lg: Lang) {
  if (f.verdict === "under") return t(lg, `this looks like a meter issue, not a leak (leak risk ${f.leakPct}%)`, `यह मीटर की समस्या लगती है, रिसाव नहीं (लीक जोखिम ${f.leakPct}%)`, `આ મીટરની સમસ્યા લાગે છે, લીક નહીં (લીક જોખમ ${f.leakPct}%)`);
  if (f.leakLevel === "high") return t(lg, `leak risk is ${f.leakPct}%, which points to a possible leak`, `लीक जोखिम ${f.leakPct}% है, जो संभावित रिसाव दर्शाता है`, `લીક જોખમ ${f.leakPct}% છે, જે શક્ય લીક સૂચવે છે`);
  if (f.leakLevel === "watch") return t(lg, `leak risk is ${f.leakPct}% — worth keeping an eye on`, `लीक जोखिम ${f.leakPct}% — नज़र रखना ठीक रहेगा`, `લીક જોખમ ${f.leakPct}% — નજર રાખવી સારી`);
  return t(lg, `leak risk is only ${f.leakPct}%, so no signs of a leak`, `लीक जोखिम सिर्फ़ ${f.leakPct}%, यानी रिसाव के कोई संकेत नहीं`, `લીક જોખમ ફક્ત ${f.leakPct}%, એટલે લીકના કોઈ સંકેત નથી`);
}

function greeting(f: Facts, lg: Lang) {
  const dir = f.higher ? t(lg, "higher", "ज़्यादा", "વધારે") : t(lg, "lower", "कम", "ઓછું");
  return t(lg,
    `Hello! Your ${f.cycle} bill is ${inr(f.amount)}. That's ${inr(abs(f.delta))} ${dir} than last cycle, mainly due to ${driver(f, lg)}, and ${levelNote(f, lg)}. Ask me why it changed, if it's normal, or whether there's a leak — type or tap the mic.`,
    `नमस्ते! आपका ${f.cycle} का बिल ${inr(f.amount)} है। यह पिछली बार से ${inr(abs(f.delta))} ${dir} है, मुख्यतः ${driver(f, lg)} के कारण, और ${levelNote(f, lg)}। पूछिए यह क्यों बदला, सामान्य है या नहीं, या कोई रिसाव तो नहीं — टाइप करें या माइक दबाएँ।`,
    `નમસ્તે! તમારું ${f.cycle} નું બિલ ${inr(f.amount)} છે. તે ગયા વખત કરતાં ${inr(abs(f.delta))} ${dir} છે, મુખ્યત્વે ${driver(f, lg)} ના કારણે, અને ${levelNote(f, lg)}. પૂછો કે તે કેમ બદલાયું, સામાન્ય છે કે નહીં, કે કોઈ લીક તો નથી — લખો કે માઇક દબાવો.`);
}

function answer(intent: string, f: Facts, lg: Lang): string {
  const moreLess = (p: number | null) => (p == null ? "" : `${abs(p)}% ${p >= 0 ? t(lg, "more", "ज़्यादा", "વધારે") : t(lg, "less", "कम", "ઓછું")}`);
  switch (intent) {
    case "why": {
      const parts: string[] = [];
      if (f.usage) parts.push(t(lg, `usage ${f.usage.amount >= 0 ? "added" : "saved"} ${inr(abs(f.usage.amount))}`, `खपत ने ${inr(abs(f.usage.amount))} ${f.usage.amount >= 0 ? "जोड़े" : "घटाए"}`, `વપરાશે ${inr(abs(f.usage.amount))} ${f.usage.amount >= 0 ? "ઉમેર્યા" : "ઘટાડ્યા"}`));
      if (f.tariff) parts.push(t(lg, `the rate change added ${inr(f.tariff.amount)}`, `दर बदलाव ने ${inr(f.tariff.amount)} जोड़े`, `દર ફેરફારે ${inr(f.tariff.amount)} ઉમેર્યા`));
      if (f.fixed) parts.push(t(lg, `fixed charges ${f.fixed.amount >= 0 ? "added" : "saved"} ${inr(abs(f.fixed.amount))}`, `फिक्स्ड चार्ज ने ${inr(abs(f.fixed.amount))} ${f.fixed.amount >= 0 ? "जोड़े" : "घटाए"}`, `ફિક્સ્ડ ચાર્જે ${inr(abs(f.fixed.amount))} ${f.fixed.amount >= 0 ? "ઉમેર્યા" : "ઘટાડ્યા"}`));
      if (f.arrears) parts.push(t(lg, `previous due added ${inr(abs(f.arrears.amount))}`, `पिछले बकाये ने ${inr(abs(f.arrears.amount))} जोड़े`, `પહેલાના બાકીએ ${inr(abs(f.arrears.amount))} ઉમેર્યા`));
      if (f.lateFee) parts.push(t(lg, `late payment fee added ${inr(abs(f.lateFee.amount))}`, `देरी शुल्क ने ${inr(abs(f.lateFee.amount))} जोड़े`, `વિલંબ શુલ્કે ${inr(abs(f.lateFee.amount))} ઉમેર્યા`));
      const joined = parts.length ? parts.join(t(lg, "; ", "; ", "; ")) : t(lg, "small routine variation", "छोटा सामान्य बदलाव", "નાનો સામાન્ય ફેરફાર");
      const awayNote = f.away ? t(lg, " You also marked this cycle as away, which is factored in.", " आपने इस चक्र को 'बाहर' चिह्नित किया है, जो शामिल है।", " તમે આ ચક્રને 'બહાર' તરીકે ચિહ્નિત કર્યું છે, જે સામેલ છે.") : "";
      return t(lg,
        `Your bill ${f.higher ? "went up" : "went down"} by ${inr(abs(f.delta))} vs last cycle: ${joined}.${awayNote} Overall, ${levelNote(f, lg)}.`,
        `आपका बिल पिछली बार से ${inr(abs(f.delta))} ${f.higher ? "बढ़ा" : "घटा"}: ${joined}।${awayNote} कुल मिलाकर, ${levelNote(f, lg)}।`,
        `તમારું બિલ ગયા વખત કરતાં ${inr(abs(f.delta))} ${f.higher ? "વધ્યું" : "ઘટ્યું"}: ${joined}.${awayNote} એકંદરે, ${levelNote(f, lg)}.`);
    }
    case "normal": {
      if (f.verdict === "under") return t(lg, `Your usage dropped sharply this cycle, so this reads as a meter under-reading rather than higher use. We've flagged the meter for a check.`, `इस बार आपकी खपत तेज़ी से घटी है, इसलिए यह मीटर की कम रीडिंग लगती है, ज़्यादा उपयोग नहीं। मीटर जाँच के लिए चिह्नित है।`, `આ વખતે તમારો વપરાશ ઝડપથી ઘટ્યો, તેથી આ મીટરની ઓછી રીડિંગ લાગે છે, વધુ વપરાશ નહીં. મીટર તપાસ માટે ચિહ્નિત છે.`);
      if (f.leakLevel === "high") return t(lg, `This is higher than normal for you — ${levelNote(f, lg)}. I'd recommend a free safety check.`, `यह आपके लिए सामान्य से ज़्यादा है — ${levelNote(f, lg)}। मैं एक मुफ़्त सुरक्षा जाँच की सलाह दूँगा।`, `આ તમારા માટે સામાન્ય કરતાં વધારે છે — ${levelNote(f, lg)}. હું મફત સલામતી તપાસની સલાહ આપીશ.`);
      if (f.leakLevel === "watch") return t(lg, `It's a little above your usual, but not alarming — ${levelNote(f, lg)}. Keep an eye out for any gas smell.`, `यह आपकी सामान्य से थोड़ा ज़्यादा है, पर चिंता की बात नहीं — ${levelNote(f, lg)}। किसी गैस की गंध पर ध्यान रखें।`, `આ તમારા સામાન્ય કરતાં થોડું વધારે છે, પણ ચિંતાની વાત નથી — ${levelNote(f, lg)}. કોઈ ગેસની વાસ પર ધ્યાન રાખો.`);
      return t(lg, `Yes — this looks normal for you. Your usage (${f.units} SCM) is in line with your ~${f.avg} SCM average, and ${levelNote(f, lg)}.`, `हाँ — यह आपके लिए सामान्य है। आपकी खपत (${f.units} SCM) आपके ~${f.avg} SCM औसत के अनुरूप है, और ${levelNote(f, lg)}।`, `હા — આ તમારા માટે સામાન્ય છે. તમારો વપરાશ (${f.units} SCM) તમારા ~${f.avg} SCM સરેરાશ સાથે મેળ ખાય છે, અને ${levelNote(f, lg)}.`);
    }
    case "leak": {
      let why: string;
      if (f.verdict === "under") why = t(lg, "your usage actually dropped, which points to a meter fault, not a leak", "आपकी खपत घटी है, जो मीटर की खराबी दर्शाता है, रिसाव नहीं", "તમારો વપરાશ ઘટ્યો છે, જે મીટરની ખામી સૂચવે છે, લીક નહીં");
      else if (f.away && f.leakPct >= 50) why = t(lg, "the home was marked as away, yet gas is still being used — a classic leak sign", "घर 'बाहर' चिह्नित था, फिर भी गैस इस्तेमाल हो रही है — रिसाव का स्पष्ट संकेत", "ઘર 'બહાર' ચિહ્નિત હતું, છતાં ગેસ વપરાય છે — લીકનો સ્પષ્ટ સંકેત");
      else if (f.leakLevel === "high") why = t(lg, `your usage is well above your ~${f.avg} SCM average with no seasonal reason`, `आपकी खपत ~${f.avg} SCM औसत से काफ़ी ज़्यादा है, बिना किसी मौसमी कारण के`, `તમારો વપરાશ ~${f.avg} SCM સરેરાશ કરતાં ઘણો વધારે છે, કોઈ મોસમી કારણ વગર`);
      else if (f.leakLevel === "watch") why = t(lg, "your usage is a little above normal", "आपकी खपत सामान्य से थोड़ी ज़्यादा है", "તમારો વપરાશ સામાન્ય કરતાં થોડો વધારે છે");
      else why = t(lg, `your usage matches your ~${f.avg} SCM average`, `आपकी खपत ~${f.avg} SCM औसत के बराबर है`, `તમારો વપરાશ ~${f.avg} SCM સરેરાશ જેટલો છે`);
      const rec = f.leakLevel === "none" || f.verdict === "under" ? t(lg, "No action needed.", "किसी कार्रवाई की ज़रूरत नहीं।", "કોઈ પગલાંની જરૂર નથી.") : t(lg, "I'd recommend booking a free safety check to be sure.", "पक्का करने के लिए एक मुफ़्त सुरक्षा जाँच बुक करने की सलाह दूँगा।", "ખાતરી માટે એક મફત સલામતી તપાસ બુક કરવાની સલાહ આપીશ.");
      return t(lg, `Your estimated leak risk is ${f.leakPct}% — ${why}. ${rec}`, `आपका अनुमानित लीक जोखिम ${f.leakPct}% है — ${why}। ${rec}`, `તમારું અંદાજિત લીક જોખમ ${f.leakPct}% છે — ${why}. ${rec}`);
    }
    case "compare":
      return t(lg,
        `Versus last cycle you used ${moreLess(f.vsPrev)}${f.vsYear != null ? `, and versus the same period last year (${f.yoy}) ${moreLess(f.vsYear)}` : ""}. Your six-month average is about ${f.avg} SCM.`,
        `पिछली बार से आपने ${moreLess(f.vsPrev)}${f.vsYear != null ? `, और पिछले साल इसी समय (${f.yoy}) से ${moreLess(f.vsYear)}` : ""} उपयोग किया। आपका छह-माह औसत लगभग ${f.avg} SCM है।`,
        `ગયા વખત કરતાં તમે ${moreLess(f.vsPrev)}${f.vsYear != null ? `, અને ગયા વર્ષે આ સમયે (${f.yoy}) કરતાં ${moreLess(f.vsYear)}` : ""} વાપર્યું. તમારો છ-માસનો સરેરાશ આશરે ${f.avg} SCM છે.`);
    case "usage":
      return t(lg,
        `This cycle you used ${f.units} SCM. Your typical average is about ${f.avg} SCM${f.vsAvg != null ? `, so this is ${abs(f.vsAvg)}% ${f.vsAvg >= 0 ? "above" : "below"} average` : ""}.`,
        `इस बार आपने ${f.units} SCM उपयोग किया। आपका सामान्य औसत लगभग ${f.avg} SCM है${f.vsAvg != null ? `, यानी यह औसत से ${abs(f.vsAvg)}% ${f.vsAvg >= 0 ? "ज़्यादा" : "कम"} है` : ""}।`,
        `આ વખતે તમે ${f.units} SCM વાપર્યું. તમારો સામાન્ય સરેરાશ આશરે ${f.avg} SCM છે${f.vsAvg != null ? `, એટલે આ સરેરાશ કરતાં ${abs(f.vsAvg)}% ${f.vsAvg >= 0 ? "વધારે" : "ઓછું"} છે` : ""}.`);
    case "tariff":
      return f.tariff
        ? t(lg, `Part of the change is a rate revision — the gas rate is now ${inr(f.rate)} per SCM, adding about ${inr(f.tariff.amount)} this cycle.`, `बदलाव का एक हिस्सा दर संशोधन है — गैस दर अब ${inr(f.rate)} प्रति SCM है, जिससे इस बार लगभग ${inr(f.tariff.amount)} जुड़े।`, `ફેરફારનો એક ભાગ દર સુધારો છે — ગેસ દર હવે ${inr(f.rate)} પ્રતિ SCM છે, જેનાથી આ વખતે આશરે ${inr(f.tariff.amount)} ઉમેરાયા.`)
        : t(lg, `There was no rate change this cycle — the difference is from your usage${f.fixed ? " and fixed charges" : ""}.`, `इस बार दर में कोई बदलाव नहीं हुआ — अंतर आपकी खपत${f.fixed ? " और फिक्स्ड चार्ज" : ""} से है।`, `આ વખતે દરમાં કોઈ ફેરફાર નથી — તફાવત તમારા વપરાશ${f.fixed ? " અને ફિક્સ્ડ ચાર્જ" : ""} થી છે.`);
    case "reduce":
      return f.leakLevel === "high"
        ? t(lg, `First, rule out a leak with a free safety check. After that, use the geyser and room heater less, service your appliances, and check no burner or tap is left on.`, `पहले मुफ़्त सुरक्षा जाँच से रिसाव की पुष्टि करें। उसके बाद गीज़र और हीटर कम इस्तेमाल करें, उपकरण सर्विस कराएँ, और देखें कोई बर्नर या नल खुला न रह जाए।`, `પહેલા મફત સલામતી તપાસથી લીકની ખાતરી કરો. પછી ગીઝર અને હીટર ઓછું વાપરો, સાધનોની સર્વિસ કરાવો, અને કોઈ બર્નર કે નળ ખુલ્લો ન રહે તે જુઓ.`)
        : t(lg, `To lower your bill: use the geyser and heater less in winter, keep burners on a medium flame, cover pots while cooking, and service appliances yearly.`, `बिल घटाने के लिए: सर्दियों में गीज़र और हीटर कम चलाएँ, बर्नर मध्यम आँच पर रखें, पकाते समय बर्तन ढकें, और हर साल उपकरण सर्विस कराएँ।`, `બિલ ઘટાડવા: શિયાળામાં ગીઝર અને હીટર ઓછું વાપરો, બર્નર મધ્યમ આંચ પર રાખો, રાંધતી વખતે વાસણ ઢાંકો, અને દર વર્ષે સાધનોની સર્વિસ કરાવો.`);
    case "away":
      return t(lg, `If you were away this cycle, tick the "I was away" box on the bill page. With nobody home, normal usage becomes a strong leak signal, and I'll recalculate the risk instantly.`, `अगर आप इस चक्र में बाहर थे, तो बिल पेज पर "मैं बाहर था" बॉक्स चुनें। घर में कोई न हो तो सामान्य खपत भी रिसाव का मज़बूत संकेत बन जाती है, और मैं जोखिम तुरंत फिर से गणना करूँगा।`, `જો તમે આ ચક્રમાં બહાર હતા, તો બિલ પેજ પર "હું બહાર હતો" બોક્સ પસંદ કરો. ઘરમાં કોઈ ન હોય તો સામાન્ય વપરાશ પણ લીકનો મજબૂત સંકેત બને છે, અને હું જોખમ તરત ફરી ગણીશ.`);
    case "pay":
      return f.status === "paid"
        ? t(lg, `This bill is already paid — nothing due. You can download the PDF from the bill page.`, `यह बिल भुगतान हो चुका है — कुछ बकाया नहीं। आप बिल पेज से PDF डाउनलोड कर सकते हैं।`, `આ બિલ ચૂકવાઈ ગયું છે — કંઈ બાકી નથી. તમે બિલ પેજ પરથી PDF ડાઉનલોડ કરી શકો.`)
        : t(lg, `This bill of ${inr(f.amount)} is due${f.dueDate ? " by " + new Date(f.dueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : ""}. You can download the PDF from the bill page.`, `${inr(f.amount)} का यह बिल${f.dueDate ? " " + new Date(f.dueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) + " तक" : ""} देय है। आप बिल पेज से PDF डाउनलोड कर सकते हैं।`, `${inr(f.amount)} નું આ બિલ${f.dueDate ? " " + new Date(f.dueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) + " સુધી" : ""} બાકી છે. તમે બિલ પેજ પરથી PDF ડાઉનલોડ કરી શકો.`);
    case "thanks":
      return t(lg, `Happy to help — ask me anything else about your bill.`, `मदद करके अच्छा लगा — बिल के बारे में और कुछ भी पूछें।`, `મદદ કરીને આનંદ થયો — બિલ વિશે બીજું કંઈ પણ પૂછો.`);
    default:
      return t(lg, `I can explain why your bill changed, whether it's normal, if there's a possible leak, or how it compares to last month. What would you like to know?`, `मैं बता सकता हूँ कि आपका बिल क्यों बदला, सामान्य है या नहीं, कोई रिसाव तो नहीं, या पिछले महीने से कैसी तुलना है। आप क्या जानना चाहेंगे?`, `હું સમજાવી શકું કે તમારું બિલ કેમ બદલાયું, સામાન્ય છે કે નહીં, કોઈ લીક તો નથી, કે ગયા મહિના સાથે કેવી સરખામણી છે. તમે શું જાણવા માંગો છો?`);
  }
}

// Answers grounded in the whole platform, not just this bill: appointments,
// health score, TrustPoints, and pending actions all come from the shared
// platform context so the assistant never contradicts another module.
function platformAnswer(lg: Lang): string {
  const c = readPlatformContext();
  const visit = c.nextVisit;
  const contact = c.healthProfile.emergencyContactVerified;
  return t(lg,
    `Looking across your SuRaksha account: health score ${c.healthScore}/100, ${c.trustPoints.toLocaleString("en-IN")} TrustPoints (${c.tierName}), emergency contact ${contact ? "verified" : "not verified yet"}, ${visit ? `and your ${visit.service} is ${visit.status.toLowerCase()} for ${visit.date} · ${visit.slot} with ${visit.engineer}` : "and no engineer visit is scheduled right now"}.${c.billDue ? ` Your ${c.billDue.cycle} bill of ${inr(c.billDue.amount)} is still due.` : ""}`,
    `आपके SuRaksha खाते के अनुसार: हेल्थ स्कोर ${c.healthScore}/100, ${c.trustPoints.toLocaleString("en-IN")} TrustPoints (${c.tierName}), आपातकालीन संपर्क ${contact ? "सत्यापित" : "अभी सत्यापित नहीं"}, ${visit ? `और आपकी ${visit.service} विज़िट ${visit.date} को तय है` : "और अभी कोई इंजीनियर विज़िट तय नहीं है"}।${c.billDue ? ` आपका ${c.billDue.cycle} का ${inr(c.billDue.amount)} बिल बकाया है।` : ""}`,
    `તમારા SuRaksha ખાતા મુજબ: હેલ્થ સ્કોર ${c.healthScore}/100, ${c.trustPoints.toLocaleString("en-IN")} TrustPoints (${c.tierName}), ઇમરજન્સી સંપર્ક ${contact ? "ચકાસાયેલ" : "હજી ચકાસાયેલ નથી"}, ${visit ? `અને તમારી ${visit.service} મુલાકાત ${visit.date} ના રોજ નક્કી છે` : "અને હમણાં કોઈ એન્જિનિયર મુલાકાત નક્કી નથી"}.${c.billDue ? ` તમારું ${c.billDue.cycle} નું ${inr(c.billDue.amount)} બિલ બાકી છે.` : ""}`);
}

/** Extra line for leak answers when a safety visit is already on the books. */
function leakVisitNote(lg: Lang): string {
  const c = readPlatformContext();
  const visit = c.appointments.find((item) => (item.serviceId === "leak" || item.serviceId === "inspection") && item.status !== "Cancelled" && item.status !== "Completed");
  if (!visit) return "";
  return t(lg,
    ` Good news — your ${visit.service} is already ${visit.status.toLowerCase()} for ${visit.date} · ${visit.slot}.`,
    ` अच्छी बात — आपकी ${visit.service} विज़िट पहले से ${visit.date} को तय है।`,
    ` સારી વાત — તમારી ${visit.service} મુલાકાત પહેલેથી ${visit.date} ના રોજ નક્કી છે.`);
}

const KEYS: { id: string; keys: string[] }[] = [
  { id: "account", keys: ["inspection", "appointment", "visit", "engineer", "health score", "trustpoints", "points", "my account", "my status", "booked", "अपॉइंटमेंट", "विज़िट", "इंजीनियर", "स्कोर", "खाता", "મુલાકાત", "એન્જિનિયર", "સ્કોર", "ખાતું"] },
  { id: "leak", keys: ["leak", "leakage", "safe", "danger", "रिसाव", "लीक", "सुरक्षित", "લીક", "સલામત", "જોખમ"] },
  { id: "normal", keys: ["normal", "okay", "fine", "correct", "right", "सामान्य", "ठीक", "सही", "નોર્મલ", "બરાબર", "સાચું"] },
  { id: "why", keys: ["why", "high", "increase", "increased", "more", "expensive", "cause", "reason", "क्यों", "ज़्यादा", "बढ़", "महंगा", "कारण", "કેમ", "વધ", "મોંઘું", "કારણ"] },
  { id: "compare", keys: ["compare", "last month", "previous", "last year", "average", "पिछले", "तुलना", "औसत", "ગયા", "સરખાવ", "સરેરાશ"] },
  { id: "usage", keys: ["usage", "units", "consumption", "scm", "उपयोग", "खपत", "यूनिट", "વપરાશ", "યુનિટ"] },
  { id: "tariff", keys: ["tariff", "rate", "price", "charge", "दर", "कीमत", "रेट", "દર", "ભાવ", "રેટ"] },
  { id: "reduce", keys: ["reduce", "save", "lower", "less", "tips", "घटा", "कम", "बचत", "ઘટાડ", "બચત"] },
  { id: "away", keys: ["away", "vacation", "not home", "locked", "बाहर", "छुट्टी", "बंद", "બહાર", "રજા", "તાળું"] },
  { id: "pay", keys: ["pay", "due", "download", "payment", "भुगतान", "बकाया", "डाउनलोड", "ચૂકવ", "બાકી", "ડાઉનલોડ"] },
  { id: "thanks", keys: ["thank", "thanks", "ok", "great", "धन्यवाद", "शुक्रिया", "આભાર", "ધન્યવાદ"] },
];

export default function BillAssistant({ explanation, bill, onClose }: { explanation: BillExplanation; bill: Bill; customer: Customer; onClose: () => void }) {
  const f = toFacts(explanation, bill);
  const [lang, setLang] = useState<Lang>("en");
  const [msgs, setMsgs] = useState<{ role: "bot" | "user"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [muted, setMuted] = useState(false);
  const [listening, setListening] = useState(false);
  const [sttOk, setSttOk] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceName, setVoiceName] = useState("");

  const boxRef = useRef<HTMLDivElement>(null);
  const recRef = useRef<any>(null);
  const mutedRef = useRef(false);
  const langRef = useRef<Lang>("en");
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const fRef = useRef(f);
  useEffect(() => { fRef.current = f; });
  useEffect(() => { mutedRef.current = muted; }, [muted]);
  useEffect(() => { langRef.current = lang; }, [lang]);

  const byLang = (list: SpeechSynthesisVoice[], code: string) => list.find((v) => v.lang.toLowerCase().startsWith(code));
  function pickVoice(list: SpeechSynthesisVoice[], lg: Lang) {
    if (lg === "hi") return byLang(list, "hi") || byLang(list, "en") || list[0] || null;
    if (lg === "gu") return byLang(list, "gu") || byLang(list, "hi") || byLang(list, "en") || list[0] || null;
    const pref = [/daniel/i, /google uk english male/i, /\b(george|arthur|ryan|guy|brian)\b/i, /en[-_]?gb/i, /^en/i];
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
    const usingGu = !!v && v.lang.toLowerCase().startsWith("gu");
    let toSpeak = text;
    let spokenLang = v ? v.lang : (langRef.current === "hi" ? "hi-IN" : langRef.current === "gu" ? "gu-IN" : "en-GB");
    if (langRef.current === "gu" && !usingGu) { toSpeak = guToDeva(text); spokenLang = "hi-IN"; }
    const u = new SpeechSynthesisUtterance(toSpeak);
    u.rate = 0.97; u.pitch = 1;
    if (v) u.voice = v;
    u.lang = spokenLang;
    window.speechSynthesis.speak(u);
    setTimeout(() => window.speechSynthesis.resume(), 250);
  }, []);

  const pushBot = useCallback((text: string) => { setMsgs((m) => [...m, { role: "bot", text }]); speak(text); }, [speak]);

  const respondTo = useCallback((raw: string) => {
    const text = raw.trim(); if (!text) return;
    const lg = langRef.current;
    setMsgs((m) => [...m, { role: "user", text }]);
    setInput("");
    const msg = norm(text);
    let id = "default";
    for (const k of KEYS) { if (k.keys.some((kk) => msg.includes(kk))) { id = k.id; break; } }
    let rep = id === "account" ? platformAnswer(lg) : answer(id, fRef.current, lg);
    if (id === "leak" && fRef.current.leakLevel !== "none") rep += leakVisitNote(lg);
    setTimeout(() => pushBot(rep), 240);
  }, [pushBot]);

  const respondRef = useRef(respondTo);
  useEffect(() => { respondRef.current = respondTo; }, [respondTo]);

  useEffect(() => {
    const g = greeting(fRef.current, "en");
    setMsgs([{ role: "bot", text: g }]);
    setTimeout(() => speak(g), 350);
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SR) {
      const r = new SR();
      r.continuous = false; r.interimResults = true; r.maxAlternatives = 1; r.lang = "en-IN";
      r.onresult = (e: any) => {
        let interim = "", final = "";
        for (let i = e.resultIndex; i < e.results.length; i++) { const tr = e.results[i][0].transcript; if (e.results[i].isFinal) final += tr; else interim += tr; }
        setInput(final || interim);
        if (final.trim()) { setListening(false); try { r.stop(); } catch {} respondRef.current(final); }
      };
      r.onerror = () => setListening(false);
      r.onend = () => setListening(false);
      recRef.current = r; setSttOk(true);
    }
    return () => { window.speechSynthesis?.cancel(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight, behavior: "smooth" }); }, [msgs]);

  function changeLang(lg: Lang) {
    setLang(lg); langRef.current = lg;
    const v = pickVoice(voices, lg); voiceRef.current = v; if (v) setVoiceName(v.name);
    if (recRef.current) recRef.current.lang = LANGS.find((x) => x.code === lg)!.stt;
    const g = greeting(fRef.current, lg);
    setMsgs([{ role: "bot", text: g }]);
    setTimeout(() => speak(g), 150);
  }
  async function toggleMic() {
    const r = recRef.current; if (!r) return;
    r.lang = LANGS.find((x) => x.code === langRef.current)!.stt;
    if (listening) { try { r.stop(); } catch {} setListening(false); return; }
    try { await navigator.mediaDevices?.getUserMedia({ audio: true }); } catch { return; }
    try { r.start(); setListening(true); } catch { setListening(true); }
  }
  function toggleMute() { setMuted((m) => { if (!m) window.speechSynthesis?.cancel(); return !m; }); }
  function changeVoice(name: string) { const v = voices.find((x) => x.name === name) || null; voiceRef.current = v; setVoiceName(name); }

  const hasGuVoice = voices.some((v) => v.lang.toLowerCase().startsWith("gu"));
  const langVoices = (() => {
    if (lang === "gu") { const gu = voices.filter((v) => v.lang.toLowerCase().startsWith("gu")); if (gu.length) return gu; const hi = voices.filter((v) => v.lang.toLowerCase().startsWith("hi")); if (hi.length) return hi; return voices.filter((v) => /^en/i.test(v.lang)); }
    const f2 = voices.filter((v) => v.lang.toLowerCase().startsWith(lang)); if (f2.length) return f2;
    const en = voices.filter((v) => /^en/i.test(v.lang)); return en.length ? en : voices;
  })();

  const QUICK: Record<Lang, string[]> = {
    en: ["Why is my bill higher?", "Is this normal?", "Do I have a leak?", "Compare to last month", "How can I reduce it?"],
    hi: ["बिल ज़्यादा क्यों है?", "क्या यह सामान्य है?", "क्या रिसाव है?", "पिछले महीने से तुलना", "इसे कैसे घटाएँ?"],
    gu: ["બિલ કેમ વધારે છે?", "શું આ સામાન્ય છે?", "શું લીક છે?", "ગયા મહિના સાથે સરખાવો", "કેવી રીતે ઘટાડું?"],
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink-950/60 backdrop-blur-sm p-3 animate-fade" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md pop">
        <Card className="overflow-hidden flex flex-col h-[600px]">
          <div className="bg-ink-950 text-white p-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-9 w-9 rounded-full bg-brand-500/20 grid place-items-center shrink-0"><Bot className="w-4 h-4 text-brand-300" /></div>
              <div className="min-w-0"><div className="font-semibold text-sm truncate">Bill Assistant</div><div className="text-[11px] text-ink-400 flex items-center gap-1.5"><Sparkles className="w-3 h-3" /> {muted ? "voice off" : "voice on"}</div></div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="flex rounded-lg overflow-hidden border border-white/15">
                {LANGS.map((l) => <button key={l.code} onClick={() => changeLang(l.code)} className={`px-2 py-1 text-[11px] font-semibold ${lang === l.code ? "bg-brand-500 text-white" : "bg-white/5 text-ink-300 hover:bg-white/10"}`}>{l.label}</button>)}
              </div>
              <button onClick={toggleMute} className="p-1.5 rounded-lg hover:bg-white/10 text-ink-300">{muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5 text-brand-300" />}</button>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-ink-400"><X className="w-4 h-4" /></button>
            </div>
          </div>

          {langVoices.length > 0 && (
            <div className="px-3 py-1.5 bg-ink-900/95 border-b border-white/5">
              <select value={voiceName} onChange={(e) => changeVoice(e.target.value)} className="w-full text-[11px] bg-white/10 text-white rounded-lg px-2 py-1 outline-none border border-white/10">
                {langVoices.map((v) => <option key={v.name} value={v.name} className="text-ink-900">{v.name.replace(/Microsoft |Google |Online.*|\(.*\)/g, "").trim() || v.name}</option>)}
              </select>
              {lang === "gu" && !hasGuVoice && <p className="text-[10px] text-ink-400 mt-1">ગુજરાતી અવાજ ઉપલબ્ધ નથી — હિન્દી અવાજ દ્વારા વાંચે છે.</p>}
            </div>
          )}

          <div ref={boxRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-ink-50/40">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === "bot" ? "justify-start" : "justify-end"}`}>
                <div className={`px-3.5 py-2 max-w-[85%] text-sm shadow-sm rounded-xl ${m.role === "bot" ? "bg-white border border-ink-200 text-ink-800 rounded-tl-sm" : "bg-brand-600 text-white rounded-tr-sm"}`}>
                  {m.role === "bot" && <span className="text-[10px] uppercase tracking-wider text-brand-600 block mb-0.5">Assistant</span>}
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          <div className="px-3 pt-2 flex gap-1.5 flex-wrap border-t border-ink-100">
            {QUICK[lang].map((q) => <button key={q} onClick={() => respondTo(q)} className="text-[11px] font-medium px-2.5 py-1 rounded-full border border-ink-200 text-ink-600 hover:border-brand-300 hover:bg-brand-50 transition">{q}</button>)}
          </div>

          <form onSubmit={(e) => { e.preventDefault(); respondTo(input); }} className="p-3 flex items-center gap-2">
            {sttOk && <button type="button" onClick={toggleMic} className={`p-2.5 rounded-xl border transition ${listening ? "bg-red-600 border-red-600 text-white animate-pulse" : "border-ink-200 text-ink-600 hover:bg-ink-50"}`}><Mic className="w-4 h-4" /></button>}
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={listening ? "Listening…" : "Ask about your bill…"} className="flex-1 rounded-xl border border-ink-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-400" />
            <button type="submit" className="p-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white"><Send className="w-4 h-4" /></button>
          </form>
        </Card>
      </div>
    </div>
  );
}
