"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, ReactNode } from "react";
import {
  ShieldCheck, LayoutDashboard, PhoneCall, Megaphone, Timer, ShieldAlert,
  ScanEye, ReceiptText, Menu, Bell, LogOut, ChevronRight, Video, Siren,
  Route, HeartPulse, MessageSquare, Award, Building2, Wrench, HardHat,
  Monitor, TrendingUp, Activity, Flame, CalendarDays,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: keyof typeof ICONS; badge?: string };

const ICONS = {
  dashboard: LayoutDashboard,
  phone: PhoneCall,
  megaphone: Megaphone,
  timer: Timer,
  shieldAlert: ShieldAlert,
  scan: ScanEye,
  receipt: ReceiptText,
  video: Video,
  siren: Siren,
  route: Route,
  heartPulse: HeartPulse,
  messageSquare: MessageSquare,
  award: Award,
  building2: Building2,
  wrench: Wrench,
  hardHat: HardHat,
  monitor: Monitor,
  trendingUp: TrendingUp,
  activity: Activity,
  flame: Flame,
  calendarDays: CalendarDays,
};

type SuiteRole = "customer" | "safety" | "intelligence";

const SUITE_CONFIG: Record<SuiteRole, {
  label: string; sub: string; consoleName: string; accent: string;
  activeBg: string; activeText: string; badgeBg: string; badgeText: string;
  headerBreadcrumb: string; avatarInitials: string; avatarFrom: string; avatarTo: string;
  liveBg: string; liveText: string; liveBorder: string; liveDot: string; livePing: string;
}> = {
  customer: {
    label: "Customer", sub: "Riddhi Mehta", consoleName: "Customer Experience",
    accent: "text-brand-400", activeBg: "bg-brand-500/15", activeText: "text-brand-300",
    badgeBg: "bg-red-500/20", badgeText: "text-red-300",
    headerBreadcrumb: "My Account", avatarInitials: "RM",
    avatarFrom: "from-brand-600", avatarTo: "to-brand-800",
    liveBg: "bg-brand-50", liveText: "text-brand-700", liveBorder: "border-brand-200",
    liveDot: "bg-brand-500", livePing: "bg-brand-400",
  },
  safety: {
    label: "Operations", sub: "Control Room", consoleName: "Safety & Operations",
    accent: "text-amber-400", activeBg: "bg-amber-500/15", activeText: "text-amber-300",
    badgeBg: "bg-red-500/20", badgeText: "text-red-300",
    headerBreadcrumb: "Operations", avatarInitials: "OP",
    avatarFrom: "from-amber-600", avatarTo: "to-amber-800",
    liveBg: "bg-amber-50", liveText: "text-amber-700", liveBorder: "border-amber-200",
    liveDot: "bg-amber-500", livePing: "bg-amber-400",
  },
  intelligence: {
    label: "Management", sub: "Intelligence Hub", consoleName: "Business Intelligence",
    accent: "text-indigo-400", activeBg: "bg-indigo-500/15", activeText: "text-indigo-300",
    badgeBg: "bg-red-500/20", badgeText: "text-red-300",
    headerBreadcrumb: "Intelligence", avatarInitials: "MG",
    avatarFrom: "from-indigo-600", avatarTo: "to-indigo-800",
    liveBg: "bg-indigo-50", liveText: "text-indigo-700", liveBorder: "border-indigo-200",
    liveDot: "bg-indigo-500", livePing: "bg-indigo-400",
  },
};

export default function Shell({
  role,
  nav,
  children,
}: {
  role: SuiteRole;
  nav: NavItem[];
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const cfg = SUITE_CONFIG[role];

  return (
    <div className="flex min-h-screen">
      {/* Sidebar Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-ink-950/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${open ? "flex" : "hidden"} lg:flex w-64 shrink-0 flex-col bg-ink-950 text-ink-300 fixed h-screen z-40`}
      >
        <div className="px-5 py-5 flex items-center gap-3 border-b border-white/5">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 grid place-items-center shadow-lg">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-white font-extrabold tracking-tight leading-none">
              SuRaksha<span className={cfg.accent}> AI</span>
            </div>
            <div className="text-[10px] uppercase tracking-widest text-ink-500 mt-1">
              {cfg.consoleName}
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 text-sm">
          {nav.map((item) => {
            const Icon = ICONS[item.icon];
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition ${
                  active ? `${cfg.activeBg} ${cfg.activeText}` : "hover:bg-white/5"
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon className={`w-[18px] h-[18px] ${active ? cfg.activeText : ""}`} />
                  {item.label}
                </span>
                {item.badge && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${cfg.badgeBg} ${cfg.badgeText} font-semibold`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/5">
          <div className="rounded-xl bg-white/5 p-3 text-xs mb-2">
            <div className={`${cfg.accent} font-semibold`}>PNGRB-aligned</div>
            <p className="text-ink-500 mt-1 leading-relaxed">Consumer Protection Regulations, 2025.</p>
          </div>
          <Link href="/" className="flex items-center gap-2 px-3 py-2 rounded-xl text-ink-400 hover:bg-white/5 hover:text-white transition">
            <LogOut className="w-4 h-4" /> Switch suite
          </Link>
          <p className="text-[10px] text-ink-600 text-center mt-2">Torrent Gas • Spark Tank 2026</p>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 lg:ml-64 min-w-0">
        <header className="sticky top-0 z-30 glass border-b border-ink-200/70">
          <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-ink-100" onClick={() => setOpen((o) => !o)}>
                <Menu className="w-5 h-5" />
              </button>
              <nav className="flex items-center gap-1.5 text-sm text-ink-500 min-w-0">
                <span className="font-semibold text-ink-800">{cfg.headerBreadcrumb}</span>
                <ChevronRight className="w-4 h-4" />
                <span className="truncate">{crumb(pathname, nav)}</span>
              </nav>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <span className={`hidden sm:flex items-center gap-2 text-xs font-medium ${cfg.liveText} ${cfg.liveBg} px-3 py-1.5 rounded-full border ${cfg.liveBorder}`}>
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute h-2 w-2 rounded-full ${cfg.livePing} opacity-75`} />
                  <span className={`relative rounded-full h-2 w-2 ${cfg.liveDot}`} />
                </span>
                Live
              </span>
              <button className="relative p-2 rounded-lg hover:bg-ink-100">
                <Bell className="w-5 h-5 text-ink-600" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
              </button>
              <div className="flex items-center gap-2 pl-1">
                <div className={`h-9 w-9 rounded-full bg-gradient-to-br ${cfg.avatarFrom} ${cfg.avatarTo} grid place-items-center text-white text-sm font-semibold`}>
                  {cfg.avatarInitials}
                </div>
                <div className="hidden sm:block leading-tight">
                  <div className="text-sm font-semibold text-ink-800">{cfg.label}</div>
                  <div className="text-[11px] text-ink-500">{cfg.sub}</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1400px] mx-auto animate-fade">{children}</main>
      </div>
    </div>
  );
}

function crumb(pathname: string | null, nav: NavItem[]) {
  return nav.find((n) => n.href === pathname)?.label ?? "Overview";
}
