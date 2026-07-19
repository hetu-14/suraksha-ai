"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, ReactNode } from "react";
import {
  LayoutDashboard, PhoneCall, Megaphone, Timer, ShieldAlert,
  ScanEye, ReceiptText, Menu, Bell, LogOut, ChevronRight, Video, Siren,
  Route, HeartPulse, MessageSquare, Award, Building2, Wrench, HardHat,
  Monitor, TrendingUp, Activity, Flame, CalendarDays, Check, Search,
} from "lucide-react";
import GlobalSearch from "@/components/GlobalSearch";
import { timeAgo, useActivityFeed } from "@/lib/activity";

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
  headerBreadcrumb: string; avatarInitials: string; avatarBg: string;
  liveBg: string; liveText: string; liveBorder: string; liveDot: string; livePing: string;
}> = {
  customer: {
    label: "Customer", sub: "Riddhi Mehta", consoleName: "Customer Experience",
    accent: "text-brand-400", activeBg: "bg-brand-500/15", activeText: "text-brand-300",
    badgeBg: "bg-red-500/20", badgeText: "text-red-300",
    headerBreadcrumb: "My Account", avatarInitials: "RM", avatarBg: "bg-brand-600",
    liveBg: "bg-brand-50", liveText: "text-brand-700", liveBorder: "border-brand-200",
    liveDot: "bg-brand-500", livePing: "bg-brand-400",
  },
  safety: {
    label: "Operations", sub: "Control Room", consoleName: "Safety & Operations",
    accent: "text-amber-400", activeBg: "bg-amber-500/15", activeText: "text-amber-300",
    badgeBg: "bg-red-500/20", badgeText: "text-red-300",
    headerBreadcrumb: "Operations", avatarInitials: "OP", avatarBg: "bg-amber-700",
    liveBg: "bg-amber-50", liveText: "text-amber-700", liveBorder: "border-amber-200",
    liveDot: "bg-amber-500", livePing: "bg-amber-400",
  },
  intelligence: {
    label: "Management", sub: "Intelligence Hub", consoleName: "Business Intelligence",
    accent: "text-indigo-400", activeBg: "bg-indigo-500/15", activeText: "text-indigo-300",
    badgeBg: "bg-red-500/20", badgeText: "text-red-300",
    headerBreadcrumb: "Intelligence", avatarInitials: "MG", avatarBg: "bg-indigo-600",
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
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const cfg = SUITE_CONFIG[role];
  const { events, unread, markRead, markAllRead } = useActivityFeed(role);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen((value) => !value);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!notifOpen) return;
    function onOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) setNotifOpen(false);
    }
    function onEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setNotifOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, [notifOpen]);

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
        <div className="px-5 py-5 border-b border-white/5">
          <div className="text-white font-bold text-[17px] tracking-tight leading-none">
            SuRaksha<span className={cfg.accent}> AI</span>
          </div>
          <div className="text-[11px] uppercase tracking-[0.14em] text-ink-500 mt-1.5">
            {cfg.consoleName}
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
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition ${
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
          <div className="rounded-lg bg-white/5 p-3 text-xs mb-2">
            <div className={`${cfg.accent} font-semibold`}>PNGRB-aligned</div>
            <p className="text-ink-500 mt-1 leading-relaxed">Consumer Protection Regulations, 2025.</p>
          </div>
          <Link href="/" className="flex items-center gap-2 px-3 py-2 rounded-lg text-ink-400 hover:bg-white/5 hover:text-white transition">
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
              <button
                onClick={() => setSearchOpen(true)}
                className="hidden sm:flex items-center gap-2 rounded-lg border border-ink-200 bg-white/70 px-3 py-1.5 text-xs text-ink-500 hover:border-ink-300 hover:text-ink-700"
                aria-label="Search everything"
              >
                <Search className="w-3.5 h-3.5" />
                Search
                <kbd className="rounded border border-ink-200 bg-ink-50 px-1 text-[10px] font-semibold text-ink-400">Ctrl K</kbd>
              </button>
              <button onClick={() => setSearchOpen(true)} className="sm:hidden p-2 rounded-lg hover:bg-ink-100" aria-label="Search everything">
                <Search className="w-5 h-5 text-ink-600" />
              </button>
              <span className={`hidden sm:flex items-center gap-2 text-xs font-medium ${cfg.liveText} ${cfg.liveBg} px-3 py-1.5 rounded-full border ${cfg.liveBorder}`}>
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute h-2 w-2 rounded-full ${cfg.livePing} opacity-75`} />
                  <span className={`relative rounded-full h-2 w-2 ${cfg.liveDot}`} />
                </span>
                Live
              </span>
              <div className="relative" ref={notifRef}>
                <button
                  className="relative p-2 rounded-lg hover:bg-ink-100"
                  onClick={() => setNotifOpen((v) => !v)}
                  aria-haspopup="true"
                  aria-expanded={notifOpen}
                  aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
                >
                  <Bell className="w-5 h-5 text-ink-600" />
                  {unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </button>
                {notifOpen && (
                  <div
                    role="dialog"
                    aria-label="Notifications"
                    className="absolute right-0 top-12 z-50 w-[22rem] rounded-xl border border-ink-200 bg-white shadow-float overflow-hidden"
                  >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-ink-100">
                      <span className="text-sm font-bold text-ink-900">
                        Notifications{unread > 0 && <span className="ml-1.5 text-xs font-semibold text-ink-500">({unread} unread)</span>}
                      </span>
                      {unread > 0 && (
                        <button onClick={markAllRead} className="text-xs font-semibold text-ink-500 hover:text-ink-900">
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-ink-50">
                      {events.length === 0 && (
                        <p className="px-4 py-8 text-center text-sm text-ink-400">You&apos;re all caught up.</p>
                      )}
                      {events.map((n) => (
                        <button
                          key={n.id}
                          onClick={() => {
                            markRead(n.id);
                            setNotifOpen(false);
                            router.push(n.href);
                          }}
                          className={`w-full text-left flex items-start gap-2.5 px-4 py-3 hover:bg-ink-50 transition ${n.read ? "" : "bg-ink-50/60"}`}
                        >
                          <span
                            className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${
                              n.read ? "bg-ink-200" : n.tone === "red" ? "bg-red-500" : n.tone === "amber" ? "bg-amber-500" : n.tone === "sky" ? "bg-sky-500" : "bg-brand-500"
                            }`}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-ink-900 truncate">{n.title}</span>
                              {n.priority === "critical" && !n.read && (
                                <span className="shrink-0 rounded-full bg-red-100 px-1.5 py-0.5 text-[9px] font-bold text-red-700">CRITICAL</span>
                              )}
                              {n.read && <Check className="w-3 h-3 text-ink-400 shrink-0" />}
                            </span>
                            <span className="block text-[11px] text-ink-500 mt-0.5 leading-relaxed">{n.detail}</span>
                            <span className="mt-1 flex items-center justify-between gap-2">
                              <span className="text-[10px] text-ink-400">{n.module} · {timeAgo(n.at)}</span>
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-ink-500">
                                Open <ChevronRight className="w-3 h-3" />
                              </span>
                            </span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 pl-1">
                <div className={`h-9 w-9 rounded-full ${cfg.avatarBg} grid place-items-center text-white text-sm font-semibold`}>
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

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}

function crumb(pathname: string | null, nav: NavItem[]) {
  return nav.find((n) => n.href === pathname)?.label ?? "Overview";
}
