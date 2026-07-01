import Link from "next/link";
import {
  ShieldCheck, ArrowRight, User, Cog, PhoneCall, ReceiptText,
  Megaphone, Timer, ShieldAlert, ScanEye, Sparkles,
} from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-ink-950 text-white relative overflow-hidden">
      {/* glow */}
      <div className="absolute -top-32 -right-24 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl" />
      <div className="absolute top-1/2 -left-24 w-96 h-96 bg-brand-700/10 rounded-full blur-3xl" />

      <div className="relative max-w-6xl mx-auto px-6 py-10">
        {/* nav */}
        <header className="flex items-center justify-between mb-16">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 grid place-items-center shadow-lg">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-extrabold tracking-tight leading-none">SuRaksha<span className="text-brand-400"> AI</span></div>
              <div className="text-[10px] uppercase tracking-widest text-ink-500 mt-1">CGD Intelligence</div>
            </div>
          </div>
          <span className="text-xs text-ink-400 hidden sm:block">Torrent Gas • Spark Tank 2026</span>
        </header>

        {/* hero */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-brand-300 bg-white/10 px-3 py-1.5 rounded-full">
            <Sparkles className="w-3.5 h-3.5" /> One platform • Six AI agents
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold mt-5 leading-tight">
            The AI layer that catches<br /> what humans miss.
          </h1>
          <p className="text-ink-300 mt-4 text-lg">
            Safety, customer trust, revenue protection and PNGRB compliance —
            unified for City Gas Distribution.
          </p>
        </div>

        {/* portal cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <Link href="/user" className="group rounded-3xl bg-white/5 border border-white/10 p-7 hover:border-brand-400/50 hover:bg-white/[0.07] transition">
            <div className="flex items-center justify-between">
              <div className="h-12 w-12 rounded-2xl bg-brand-500/20 grid place-items-center">
                <User className="w-6 h-6 text-brand-300" />
              </div>
              <ArrowRight className="w-5 h-5 text-ink-500 group-hover:text-brand-300 group-hover:translate-x-1 transition" />
            </div>
            <h2 className="text-xl font-bold mt-5">Customer Portal</h2>
            <p className="text-sm text-ink-400 mt-1.5 leading-relaxed">
              For PNG/CNG customers — track safety at your premises and understand every bill.
            </p>
            <div className="flex flex-wrap gap-2 mt-5">
              <Feature icon={<ScanEye className="w-3.5 h-3.5" />} label="SafeZone AI" />
              <Feature icon={<ReceiptText className="w-3.5 h-3.5" />} label="WhyMyBill" />
            </div>
            <div className="mt-6 text-sm font-semibold text-brand-300 flex items-center gap-1.5">
              Enter as customer <ArrowRight className="w-4 h-4" />
            </div>
          </Link>

          <Link href="/admin" className="group rounded-3xl bg-white/5 border border-white/10 p-7 hover:border-brand-400/50 hover:bg-white/[0.07] transition">
            <div className="flex items-center justify-between">
              <div className="h-12 w-12 rounded-2xl bg-indigo-500/20 grid place-items-center">
                <Cog className="w-6 h-6 text-indigo-300" />
              </div>
              <ArrowRight className="w-5 h-5 text-ink-500 group-hover:text-brand-300 group-hover:translate-x-1 transition" />
            </div>
            <h2 className="text-xl font-bold mt-5">Operations Admin</h2>
            <p className="text-sm text-ink-400 mt-1.5 leading-relaxed">
              For the control room — emergency response, notices, compliance and revenue intelligence.
            </p>
            <div className="flex flex-wrap gap-2 mt-5">
              <Feature icon={<PhoneCall className="w-3.5 h-3.5" />} label="GasGuard" />
              <Feature icon={<Megaphone className="w-3.5 h-3.5" />} label="AutoNotify" />
              <Feature icon={<Timer className="w-3.5 h-3.5" />} label="SLA Sentinel" />
              <Feature icon={<ShieldAlert className="w-3.5 h-3.5" />} label="RevGuard" />
            </div>
            <div className="mt-6 text-sm font-semibold text-brand-300 flex items-center gap-1.5">
              Enter as admin <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        </div>

        <p className="text-center text-xs text-ink-500 mt-12">
          Demo prototype · role selection is illustrative (no real credentials) · all figures placeholder
        </p>
      </div>
    </div>
  );
}

function Feature({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-ink-300 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
      {icon} {label}
    </span>
  );
}
