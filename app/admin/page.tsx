"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, Kpi } from "@/components/ui";
import { TrendChart, DonutChart } from "@/components/Charts";
import CountUp from "@/components/CountUp";
import Typewriter from "@/components/Typewriter";
import { trend, workload } from "@/lib/data";
import {
  Siren, IndianRupee, TrendingUp, BadgeCheck, Megaphone, Timer, ShieldAlert, ArrowRight, Video,
} from "lucide-react";

export default function AdminHome() {
  const [animStep, setAnimStep] = useState(0);

  return (
    <div className="space-y-6 reveal">
      <div className="rounded-2xl bg-gradient-to-br from-ink-900 via-ink-900 to-brand-900 text-white p-6 sm:p-7 relative overflow-hidden shadow-soft">
        <div className="floaty absolute -right-10 -top-10 w-56 h-56 bg-brand-500/20 rounded-full blur-3xl" />
        <div className="floaty-2 absolute -left-16 -bottom-16 w-48 h-48 bg-brand-400/10 rounded-full blur-3xl" />
        <div className="relative">
          <p className="text-brand-300 text-sm font-medium min-h-[20px]">
            <Typewriter
              speed={55}
              startDelay={250}
              onComplete={() => setAnimStep(1)}
              segments={[{ text: "Control Room " }, { text: "· live", cls: "text-red-400 font-bold" }]}
            />
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1 min-h-[36px] sm:min-h-[40px]">
            {animStep >= 1 && (
              <Typewriter
                speed={42}
                onComplete={() => setAnimStep(2)}
                cursorClass="text-brand-300"
                segments={[{ text: "The AI layer that " }, { text: "catches what humans miss", cls: "text-brand-300" }, { text: "." }]}
              />
            )}
          </h1>
          <p className="text-ink-300 mt-2 text-sm max-w-2xl animate-fade-in">
            Emergency response, customer notices, compliance and revenue intelligence — one console.
          </p>
        </div>
      </div>

      {animStep >= 2 && (
        <div className="space-y-6 anim-fade-up">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Kpi
              label="Emergencies handled (24h)"
              value={<CountUp to={38} />}
              sub="Avg AI pickup 1.2s"
              icon={<Siren className="w-4 h-4 text-red-500" />}
              accent="text-red-500"
            />
            <Kpi
              label="Compensation avoided"
              value={<CountUp to={4.8} prefix="₹" suffix="L" decimals={1} />}
              sub="SLA breaches prevented"
              icon={<IndianRupee className="w-4 h-4" />}
            />
            <Kpi
              label="Revenue recovered (MTD)"
              value={<CountUp to={27.3} prefix="₹" suffix="L" decimals={1} />}
              sub="142 tamper cases"
              icon={<TrendingUp className="w-4 h-4" />}
            />
            <Kpi
              label="SLA compliance"
              value={<CountUp to={99.2} suffix="%" decimals={1} />}
              sub="vs 87% baseline"
              icon={<BadgeCheck className="w-4 h-4" />}
            />
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2 p-5">
              <h3 className="font-bold text-ink-900 mb-3">Alerts &amp; resolutions — last 7 days</h3>
              <TrendChart data={trend} />
            </Card>
            <Card className="p-5">
              <h3 className="font-bold text-ink-900 mb-3">Workload by agent</h3>
              <DonutChart data={workload} />
            </Card>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Tile href="/admin/safezone" icon={<Video className="w-5 h-5 text-violet-500" />} title="SafeZone AI" sub="CCTV safety" />
            <Tile href="/admin/gasguard" icon={<Siren className="w-5 h-5 text-red-500" />} title="GasGuard Cases" sub="Live emergencies" />
            <Tile href="/admin/autonotify" icon={<Megaphone className="w-5 h-5 text-sky-500" />} title="AutoNotify" sub="48h notices" />
            <Tile href="/admin/sla" icon={<Timer className="w-5 h-5 text-indigo-500" />} title="SLA Sentinel" sub="Deadlines" />
            <Tile href="/admin/revguard" icon={<ShieldAlert className="w-5 h-5 text-amber-500" />} title="RevGuard" sub="Anomalies" />
          </div>
        </div>
      )}
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
