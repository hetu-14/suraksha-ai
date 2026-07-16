"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, Kpi } from "@/components/ui";
import CountUp from "@/components/CountUp";
import Typewriter from "@/components/Typewriter";
import { currentCustomer } from "@/lib/data";
import {
  ShieldCheck, ReceiptText, Siren, ArrowRight, Phone, Flame, Droplets,
  Route, HeartPulse, MessageSquare, Award, Calendar, Star,
} from "lucide-react";

export default function CustomerHome() {
  const [animStep, setAnimStep] = useState(0);
  const due = currentCustomer.bills.find((b) => b.status === "Due");

  return (
    <div className="space-y-6 reveal">
      {/* Greeting banner */}
      <div className="rounded-2xl bg-gradient-to-br from-ink-900 via-ink-900 to-brand-900 text-white p-6 sm:p-8 relative overflow-hidden shadow-soft">
        <div className="floaty absolute -right-10 -top-10 w-56 h-56 bg-brand-500/20 rounded-full blur-3xl" />
        <div className="floaty-2 absolute -left-16 -bottom-16 w-48 h-48 bg-brand-400/10 rounded-full blur-3xl" />
        <div className="relative">
          <p className="text-brand-300 text-sm font-medium min-h-[20px]">
            <Typewriter
              speed={55}
              startDelay={250}
              onComplete={() => setAnimStep(1)}
              segments={[{ text: `Namaste, ${currentCustomer.name.split(" ")[0]} ` }, { text: "👋", cls: "wave" }]}
            />
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1 min-h-[36px] sm:min-h-[40px]">
            {animStep >= 1 ? (
              <Typewriter
                speed={42}
                onComplete={() => setAnimStep(2)}
                cursorClass="text-brand-300"
                segments={[{ text: "Your home is " }, { text: "safe & sound", cls: "text-brand-300" }, { text: "." }]}
              />
            ) : (
              <span className="text-transparent">Your home is safe &amp; sound.</span>
            )}
          </h1>
          <p className="text-ink-300 mt-2.5 text-sm flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-pulse" /> {currentCustomer.id}
            </span>
            <span className="text-ink-600">·</span> {currentCustomer.area}
            <span className="text-ink-600">·</span> {currentCustomer.type} connection
          </p>
        </div>
      </div>

      <div className="space-y-6 anim-fade-up">
        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Kpi label="Safety status" value="Safe" sub="All sensors nominal" icon={<ShieldCheck className="w-4 h-4" />} />
          <Kpi label="Current bill" value={due ? <CountUp to={due.amount} prefix="₹" format /> : "—"} sub={due ? "Due this cycle" : "Nothing due"} accent="text-amber-600" icon={<ReceiptText className="w-4 h-4" />} />
          <Kpi label="Customer Health Index" value="82%" sub="Gold Member rating" icon={<HeartPulse className="w-4 h-4" />} />
          <Kpi label="Confidence Score" value="87 / 100" sub="Verified safety index" icon={<Award className="w-4 h-4" />} />
        </div>

        {/* 7 Grid Modules — matching the confirmed feature list */}
        <h3 className="font-bold text-sm text-ink-500 uppercase tracking-wider mt-4">Customer Experience Modules</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Tile href="/customer/gascare" icon={<Flame className="w-5 h-5 text-red-500" />} title="Gas-Guard" sub="AI real-time gas leak detection & alerts" />
          <Tile href="/customer/explainbill" icon={<ReceiptText className="w-5 h-5 text-emerald-500" />} title="Why-My-Bill" sub="Understand every charge on your bill" />
          <Tile href="/customer/connection" icon={<Route className="w-5 h-5 text-sky-500" />} title="My PNG Status" sub="Track pipeline connection status" />
          <Tile href="/customer/health" icon={<HeartPulse className="w-5 h-5 text-red-500" />} title="Health Score" sub="Your overall customer health index" />
          <Tile href="/customer/voice" icon={<MessageSquare className="w-5 h-5 text-indigo-500" />} title="Voice of Customer" sub="AI feedback & complaint analysis" />
          <Tile href="/customer/trustpoints" icon={<Star className="w-5 h-5 text-amber-500" />} title="TrustPoints" sub="Earn & redeem loyalty rewards" />
          <Tile href="/customer/appointment" icon={<Calendar className="w-5 h-5 text-sky-600" />} title="Appointment Booking" sub="Book certified gas engineers instantly" />
        </div>

        {/* SOS Emergency Banner */}
        <Card className="p-5 border-red-200 bg-red-50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-11 w-11 rounded-2xl bg-red-100 grid place-items-center shrink-0">
                <Phone className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-red-800">Smell gas? Act now.</h3>
                <p className="text-sm text-red-700/80">Our emergency Gas-Guard line responds instantly by voice and dispatches nearest crew.</p>
              </div>
            </div>
            <Link href="/customer/gascare" className="bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl px-4 py-2.5 text-sm text-center w-full sm:w-auto shrink-0">
              SOS — GET HELP
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Tile({ href, icon, title, sub }: { href: string; icon: React.ReactNode; title: string; sub: string }) {
  return (
    <Link href={href}>
      <Card className="p-5 hover:border-brand-300 transition h-full lift">
        <div className="flex items-center justify-between">
          {icon}
          <ArrowRight className="w-4 h-4 text-ink-300" />
        </div>
        <div className="text-sm font-semibold text-ink-800 mt-3">{title}</div>
        <div className="text-[11px] text-ink-500">{sub}</div>
      </Card>
    </Link>
  );
}
