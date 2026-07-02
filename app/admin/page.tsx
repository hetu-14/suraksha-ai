import Link from "next/link";
import { Card, Kpi } from "@/components/ui";
import { TrendChart, DonutChart } from "@/components/Charts";
import { trend, workload } from "@/lib/data";
import {
  Siren, IndianRupee, TrendingUp, BadgeCheck, Megaphone, Timer, ShieldAlert, ArrowRight, Video,
} from "lucide-react";

export default function AdminHome() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-br from-ink-900 via-ink-900 to-brand-900 text-white p-6 sm:p-7 relative overflow-hidden shadow-soft">
        <div className="absolute -right-10 -top-10 w-56 h-56 bg-brand-500/20 rounded-full blur-3xl" />
        <div className="relative">
          <p className="text-brand-300 text-sm font-medium">Control Room · live</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">The AI layer that catches what humans miss.</h1>
          <p className="text-ink-300 mt-2 text-sm max-w-2xl">
            Emergency response, customer notices, compliance and revenue intelligence — one console.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Emergencies handled (24h)" value="38" sub="Avg AI pickup 1.2s" icon={<Siren className="w-4 h-4 text-red-500" />} accent="text-red-500" />
        <Kpi label="Compensation avoided" value="₹4.8L" sub="SLA breaches prevented" icon={<IndianRupee className="w-4 h-4" />} />
        <Kpi label="Revenue recovered (MTD)" value="₹27.3L" sub="142 tamper cases" icon={<TrendingUp className="w-4 h-4" />} />
        <Kpi label="SLA compliance" value="99.2%" sub="vs 87% baseline" icon={<BadgeCheck className="w-4 h-4" />} />
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
  );
}

function Tile({ href, icon, title, sub }: { href: string; icon: React.ReactNode; title: string; sub: string }) {
  return (
    <Link href={href}>
      <Card className="p-5 hover:border-brand-300 transition h-full">
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
