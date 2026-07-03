import Link from "next/link";
import { Card, Kpi } from "@/components/ui";
import CountUp from "@/components/CountUp";
import { currentCustomer } from "@/lib/data";
import {
  ShieldCheck, ReceiptText, Siren, ArrowRight, Phone, Flame, Droplets,
} from "lucide-react";

export default function UserHome() {
  const due = currentCustomer.bills.find((b) => b.status === "Due");
  return (
    <div className="space-y-6 reveal">
      {/* greeting */}
      <div className="rounded-2xl bg-gradient-to-br from-ink-900 via-ink-900 to-brand-900 text-white p-6 sm:p-8 relative overflow-hidden shadow-soft">
        <div className="floaty absolute -right-10 -top-10 w-56 h-56 bg-brand-500/20 rounded-full blur-3xl" />
        <div className="floaty-2 absolute -left-16 -bottom-16 w-48 h-48 bg-brand-400/10 rounded-full blur-3xl" />
        <div className="relative">
          <p className="text-brand-300 text-sm font-medium">Namaste, {currentCustomer.name.split(" ")[0]} <span className="wave">👋</span></p>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">Your home is <span className="text-brand-300">safe &amp; sound</span>.</h1>
          <p className="text-ink-300 mt-2.5 text-sm flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-pulse" /> {currentCustomer.id}</span>
            <span className="text-ink-600">·</span> {currentCustomer.area}
            <span className="text-ink-600">·</span> {currentCustomer.type} connection
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Safety status" value="Safe" sub="All sensors nominal" icon={<ShieldCheck className="w-4 h-4" />} />
        <Kpi label="Current bill" value={due ? <CountUp to={due.amount} prefix="₹" format /> : "—"} sub={due ? "Due this cycle" : "Nothing due"} accent="text-amber-600" icon={<ReceiptText className="w-4 h-4" />} />
        <Kpi label="Leak risk" value="None" sub="No anomaly detected" icon={<Droplets className="w-4 h-4" />} />
        <Kpi label="This cycle usage" value={<CountUp to={due?.units ?? 0} suffix=" SCM" />} sub="Winter heating" icon={<Flame className="w-4 h-4" />} accent="text-orange-500" />
      </div>

      {/* quick actions */}
      <div className="grid md:grid-cols-2 gap-4">
        <Link href="/user/gasguard">
          <Card className="p-6 hover:border-red-300 transition h-full lift">
            <div className="flex items-center justify-between">
              <div className="h-11 w-11 rounded-2xl bg-red-100 grid place-items-center">
                <Siren className="w-5 h-5 text-red-600" />
              </div>
              <ArrowRight className="w-5 h-5 text-ink-300" />
            </div>
            <h3 className="font-bold text-ink-900 mt-4">Gas Emergency</h3>
            <p className="text-sm text-ink-500 mt-1">
              Smell gas? Tap SOS to connect instantly — AI guides you and dispatches the nearest crew.
            </p>
          </Card>
        </Link>
        <Link href="/user/bills">
          <Card className="p-6 hover:border-brand-300 transition h-full lift">
            <div className="flex items-center justify-between">
              <div className="h-11 w-11 rounded-2xl bg-brand-100 grid place-items-center">
                <ReceiptText className="w-5 h-5 text-brand-600" />
              </div>
              <ArrowRight className="w-5 h-5 text-ink-300" />
            </div>
            <h3 className="font-bold text-ink-900 mt-4">WhyMyBill</h3>
            <p className="text-sm text-ink-500 mt-1">
              See all your past bills and get a plain-language reason for every charge.
            </p>
          </Card>
        </Link>
      </div>

      {/* emergency banner */}
      <Card className="p-5 border-red-200 bg-red-50">
        <div className="flex items-center gap-4">
          <div className="h-11 w-11 rounded-2xl bg-red-100 grid place-items-center shrink-0">
            <Phone className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-red-800">Smell gas? Act now.</h3>
            <p className="text-sm text-red-700/80">Our AI emergency line answers instantly and guides you step-by-step.</p>
          </div>
          <Link href="/user/gasguard" className="bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl px-4 py-2.5 text-sm whitespace-nowrap">
            SOS
          </Link>
        </div>
      </Card>
    </div>
  );
}
