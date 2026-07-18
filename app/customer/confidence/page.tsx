"use client";

import { useEffect, useState } from "react";
import { Card, Kpi } from "@/components/ui";
import CountUp from "@/components/CountUp";
import Typewriter from "@/components/Typewriter";
import { Award, Check, CheckCircle2, Copy, HeartPulse, ShieldCheck, Users } from "lucide-react";
import { TrendChart } from "@/components/Charts";
import { computeTier, ledgerPoints, storageKey as trustStorageKey, type Ledger } from "@/lib/trustPoints";
import { healthProfileStorageKey, normalizeHealthProfile, type HealthProfile } from "@/lib/healthScore";

const trend = [
  { day: "Jan", alerts: 82, resolved: 82 },
  { day: "Feb", alerts: 83, resolved: 83 },
  { day: "Mar", alerts: 84, resolved: 84 },
  { day: "Apr", alerts: 86, resolved: 86 },
  { day: "May", alerts: 85, resolved: 85 },
  { day: "Jun", alerts: 87, resolved: 87 },
];

const billAlertsKey = "suraksha:why-my-bill:cust-riddhi";
const referralCode = "SURAKSHA-MEHTA-99";

export default function CustomerConfidenceScore() {
  const [ledger, setLedger] = useState<Ledger[]>([]);
  const [health, setHealth] = useState<HealthProfile>({ emergencyContactVerified: false, safetySurveyComplete: true, preventiveInspectionBooked: false });
  const [billAlerts, setBillAlerts] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedTrust = JSON.parse(window.localStorage.getItem(trustStorageKey) ?? "null");
      if (savedTrust && Array.isArray(savedTrust.ledger)) setLedger(savedTrust.ledger);
      setHealth(normalizeHealthProfile(JSON.parse(window.localStorage.getItem(healthProfileStorageKey) ?? "null")));
      const billPrefs = JSON.parse(window.localStorage.getItem(billAlertsKey) ?? "null");
      setBillAlerts(Boolean(billPrefs?.alertEnabled));
    } catch { /* First visit reads as a new customer with no history yet. */ }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(t);
  }, [notice]);

  const points = ledgerPoints(ledger);
  const { tier } = computeTier(points);
  const referralPoints = ledger.filter((row) => row.category === "Referrals").reduce((sum, row) => sum + Math.max(0, row.points), 0);

  const requirements = [
    { label: "Emergency contact verified", status: health.emergencyContactVerified ? "Verified" : "Pending", done: health.emergencyContactVerified, desc: "Confirmed contact for emergency dispatch" },
    { label: "Preventive inspection", status: health.preventiveInspectionBooked ? "Scheduled" : "Not scheduled", done: health.preventiveInspectionBooked, desc: "Annual safety inspection booking" },
    { label: "Bill increase alerts", status: billAlerts ? "Active" : "Not enabled", done: billAlerts, desc: "WhyMyBill proactive alerting" },
    { label: "Safety guidance completed", status: health.safetySurveyComplete ? "Completed" : "Pending", done: health.safetySurveyComplete, desc: "GasGuard leak-safety awareness module" },
  ];

  function copyReferralCode() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(referralCode).then(
        () => setNotice("Referral code copied."),
        () => setNotice("Couldn't copy automatically — code shown above."),
      );
    } else {
      setNotice("Couldn't copy automatically — code shown above.");
    }
  }

  return (
    <div className="space-y-6 reveal">
      {notice && (
        <div className="fixed right-4 top-4 z-50 flex max-w-sm items-start gap-3 rounded-2xl bg-ink-900 px-5 py-3 text-white shadow-xl anim-fade-up">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-brand-400" />
          <span className="flex-1 text-sm font-semibold">{notice}</span>
          <button onClick={() => setNotice(null)} aria-label="Dismiss notification">×</button>
        </div>
      )}

      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-ink-900 via-ink-900 to-brand-900 text-white p-6 relative overflow-hidden shadow-soft">
        <div className="floaty absolute -right-10 -top-10 w-56 h-56 bg-brand-500/20 rounded-full blur-3xl" />
        <div className="relative">
          <p className="text-brand-300 text-xs font-semibold uppercase tracking-widest">Customer Experience Suite</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">
            <Typewriter speed={40} segments={[{ text: "Confidence & Safety Reputation" }]} />
          </h1>
          <p className="text-ink-300 mt-2 text-sm max-w-2xl">
            A detailed breakdown of your TrustPoints-driven safety reputation — the same score used across SuRaksha AI, with the requirements that build it.
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 anim-fade-up">
        <Kpi label="TrustPoints balance" value={loaded ? <CountUp to={points} /> : "—"} icon={<Award className="w-4 h-4 text-brand-500" />} />
        <Kpi label="Safety reputation" value={loaded ? tier.name : "—"} accent="text-brand-600" icon={<ShieldCheck className="w-4 h-4" />} />
        <Kpi label="Referral points" value={loaded ? <CountUp to={referralPoints} /> : "—"} icon={<Users className="w-4 h-4 text-red-500" />} />
        <Kpi label="Area avg index" value="79" sub="You are above average" icon={<HeartPulse className="w-4 h-4" />} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 anim-fade-up">
        {/* Trend history chart */}
        <Card className="lg:col-span-2 p-6">
          <h3 className="font-bold text-ink-900 mb-5">Trust &amp; Confidence Trend</h3>
          <TrendChart data={trend} />

          <h3 className="font-bold text-ink-900 mt-8 mb-4">Safety Reputation Requirements</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {requirements.map((req) => (
              <div key={req.label} className="p-4 bg-ink-50/60 rounded-xl border border-ink-100 flex flex-col justify-between">
                <div>
                  <span className="block font-bold text-xs text-ink-800">{req.label}</span>
                  <span className="block text-[11px] text-ink-500 mt-1">{req.desc}</span>
                </div>
                <span className={`inline-flex items-center gap-1 mt-3 text-xs font-bold rounded px-2 py-0.5 w-fit border ${req.done ? "text-brand-600 bg-brand-50 border-brand-100" : "text-amber-700 bg-amber-50 border-amber-100"}`}>
                  {req.done && <Check className="w-3 h-3" />}
                  {req.status}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Benefits Card */}
        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="font-bold text-ink-900 mb-3">Refer &amp; Earn</h3>
            <p className="text-xs text-ink-500 mb-4 leading-relaxed">
              Help your neighbors switch to safer pipeline connections. Refer a neighbor and get ₹500 bill discount credit when they register.
            </p>
            <div className="p-3 bg-brand-50 border border-brand-100 rounded-xl text-center flex flex-col gap-2">
              <span className="text-[10px] text-brand-600 font-bold uppercase tracking-wider">Referral Code</span>
              <span className="font-extrabold text-sm text-brand-700 tracking-wider">{referralCode}</span>
              <button
                onClick={copyReferralCode}
                className="mt-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold py-2"
              >
                <Copy className="w-3.5 h-3.5" /> Copy code
              </button>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-bold text-ink-900 mb-3">{loaded ? tier.name : "Safety"} Tier Benefits</h3>
            <ul className="space-y-2 text-xs text-ink-600">
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-brand-500 shrink-0" />
                <span>Priority safety dispatch (SLA under 10 minutes)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-brand-500 shrink-0" />
                <span>Zero service charge on appliance inspection calls</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-brand-500 shrink-0" />
                <span>Free upgrade to smart kitchen leak sensor kit</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
