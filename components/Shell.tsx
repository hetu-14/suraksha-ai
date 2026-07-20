"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, ReactNode } from "react";
import {
  LayoutDashboard, PhoneCall, Megaphone, Timer, ShieldAlert,
  ScanEye, ReceiptText, Menu, Bell, LogOut, ChevronRight, Video, Siren,
  Route, HeartPulse, MessageSquare, Award, Building2, Wrench, HardHat,
  Monitor, TrendingUp, Activity, Flame, CalendarDays, Check, Search,
  PanelLeftClose, PanelLeftOpen, X, MoreHorizontal,
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
  tabActive: string;
}> = {
  customer: {
    label: "Customer", sub: "Riddhi Mehta", consoleName: "Customer Experience",
    accent: "text-brand-400", activeBg: "bg-brand-500/15", activeText: "text-brand-300",
    badgeBg: "bg-red-500/20", badgeText: "text-red-300",
    headerBreadcrumb: "My Account", avatarInitials: "RM", avatarBg: "bg-brand-600",
    liveBg: "bg-brand-50", liveText: "text-brand-700", liveBorder: "border-brand-200",
    liveDot: "bg-brand-500", livePing: "bg-brand-400", tabActive: "text-brand-700",
  },
  safety: {
    label: "Operations", sub: "Control Room", consoleName: "Safety & Operations",
    accent: "text-amber-400", activeBg: "bg-amber-500/15", activeText: "text-amber-300",
    badgeBg: "bg-red-500/20", badgeText: "text-red-300",
    headerBreadcrumb: "Operations", avatarInitials: "OP", avatarBg: "bg-amber-700",
    liveBg: "bg-amber-50", liveText: "text-amber-700", liveBorder: "border-amber-200",
    liveDot: "bg-amber-500", livePing: "bg-amber-400", tabActive: "text-amber-700",
  },
  intelligence: {
    label: "Management", sub: "Intelligence Hub", consoleName: "Business Intelligence",
    accent: "text-indigo-400", activeBg: "bg-indigo-500/15", activeText: "text-indigo-300",
    badgeBg: "bg-red-500/20", badgeText: "text-red-300",
    headerBreadcrumb: "Intelligence", avatarInitials: "MG", avatarBg: "bg-indigo-600",
    liveBg: "bg-indigo-50", liveText: "text-indigo-700", liveBorder: "border-indigo-200",
    liveDot: "bg-indigo-500", livePing: "bg-indigo-400", tabActive: "text-indigo-700",
  },
};

const RAIL_KEY = "suraksha:shell:rail";
/** How many destinations get a permanent slot in the mobile tab bar. */
const TAB_SLOTS = 4;

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
  const [open, setOpen] = useState(false);          // drawer, < lg
  const [rail, setRail] = useState(false);          // icon-rail sidebar, >= lg
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const touchStartX = useRef<number | null>(null);
  const cfg = SUITE_CONFIG[role];
  const { events, unread, markRead, markAllRead } = useActivityFeed(role);

  const primaryTabs = nav.slice(0, TAB_SLOTS);
  const inOverflow = nav.slice(TAB_SLOTS).some((item) => item.href === pathname);

  // Desktop rail preference persists — an operator who collapsed the sidebar
  // for chart real estate should not have to re-collapse it every visit.
  useEffect(() => {
    try { setRail(window.localStorage.getItem(RAIL_KEY) === "1"); } catch { /* default expanded */ }
  }, []);
  const toggleRail = useCallback(() => {
    setRail((value) => {
      const next = !value;
      try { window.localStorage.setItem(RAIL_KEY, next ? "1" : "0"); } catch { /* preference is optional */ }
      return next;
    });
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen((value) => !value);
      }
      // Escape unwinds one overlay at a time, innermost first.
      if (event.key === "Escape") {
        if (notifOpen) setNotifOpen(false);
        else if (open) setOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [notifOpen, open]);

  // Drawer: lock page scroll, move focus in, trap Tab, and restore focus on close.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const first = drawerRef.current?.querySelector<HTMLElement>("a, button");
    first?.focus();

    function onTab(event: KeyboardEvent) {
      if (event.key !== "Tab" || !drawerRef.current) return;
      const focusables = drawerRef.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled])");
      if (!focusables.length) return;
      const firstEl = focusables[0];
      const lastEl = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === firstEl) { event.preventDefault(); lastEl.focus(); }
      else if (!event.shiftKey && document.activeElement === lastEl) { event.preventDefault(); firstEl.focus(); }
    }
    document.addEventListener("keydown", onTab);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onTab);
      menuButtonRef.current?.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!notifOpen) return;
    function onOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) setNotifOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [notifOpen]);

  // Swipe-left closes the drawer, matching the platform gesture users expect.
  function onTouchStart(event: React.TouchEvent) { touchStartX.current = event.touches[0].clientX; }
  function onTouchEnd(event: React.TouchEvent) {
    if (touchStartX.current === null) return;
    if (event.changedTouches[0].clientX - touchStartX.current < -55) setOpen(false);
    touchStartX.current = null;
  }

  const navList = (collapsed: boolean) => (
    <nav aria-label="Suite navigation" className={`flex-1 scroll-y py-4 space-y-1 text-sm ${collapsed ? "px-2" : "px-3"}`}>
      {nav.map((item) => {
        const Icon = ICONS[item.icon];
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            aria-current={active ? "page" : undefined}
            title={collapsed ? item.label : undefined}
            className={`group relative w-full flex items-center min-h-tap rounded-lg transition ${collapsed ? "justify-center px-2 py-2.5" : "justify-between px-3 py-2.5"} ${
              active ? `${cfg.activeBg} ${cfg.activeText}` : "hover:bg-white/5"
            }`}
          >
            <span className={`flex items-center ${collapsed ? "" : "gap-3"}`}>
              <Icon className={`w-[18px] h-[18px] shrink-0 ${active ? cfg.activeText : ""}`} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </span>
            {item.badge && !collapsed && (
              <span className={`text-meta px-1.5 py-0.5 rounded-full ${cfg.badgeBg} ${cfg.badgeText} font-semibold`}>
                {item.badge}
              </span>
            )}
            {item.badge && collapsed && (
              <span className={`absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full ${cfg.badgeText.replace("text", "bg")}`} />
            )}
            {/* Collapsed rail keeps labels reachable via an on-hover/focus flyout. */}
            {collapsed && (
              <span className="pointer-events-none absolute left-full ml-2 z-50 hidden whitespace-nowrap rounded-lg bg-ink-900 px-2.5 py-1.5 text-xs font-semibold text-white shadow-float group-hover:block group-focus-visible:block">
                {item.label}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  const sidebarFooter = (collapsed: boolean) => (
    <div className={`border-t border-white/5 pad-safe-b ${collapsed ? "p-2" : "p-3"}`}>
      {!collapsed && (
        <div className="rounded-lg bg-white/5 p-3 text-xs mb-2">
          <div className={`${cfg.accent} font-semibold`}>PNGRB-aligned</div>
          <p className="text-ink-500 mt-1 leading-relaxed">Consumer Protection Regulations, 2025.</p>
        </div>
      )}
      <Link
        href="/"
        title={collapsed ? "Switch suite" : undefined}
        className={`flex items-center min-h-tap gap-2 rounded-lg text-ink-400 hover:bg-white/5 hover:text-white transition ${collapsed ? "justify-center px-2" : "px-3 py-2"}`}
      >
        <LogOut className="w-4 h-4 shrink-0" /> {!collapsed && "Switch suite"}
      </Link>
      {!collapsed && <p className="text-meta text-ink-600 text-center mt-2">Torrent Gas • Spark Tank 2026</p>}
    </div>
  );

  return (
    <div className="flex min-h-screen">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[70] focus:rounded-lg focus:bg-ink-900 focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to main content
      </a>

      {/* ── Desktop sidebar: persistent, collapsible to an icon rail ── */}
      <aside
        className={`hidden lg:flex ${rail ? "w-[4.5rem]" : "w-64"} shrink-0 flex-col bg-ink-950 text-ink-300 fixed h-screen z-40 transition-[width] duration-200 ease-out`}
      >
        <div className={`border-b border-white/5 flex items-center gap-2 ${rail ? "px-2 py-4 justify-center" : "px-5 py-5"}`}>
          {!rail && (
            <div className="min-w-0 flex-1">
              <div className="text-white font-semibold text-[17px] tracking-tight leading-none">
                SuRaksha<span className={cfg.accent}> AI</span>
              </div>
              <div className="text-meta uppercase tracking-[0.14em] text-ink-500 mt-1.5 truncate">
                {cfg.consoleName}
              </div>
            </div>
          )}
          <button
            onClick={toggleRail}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-ink-400 hover:bg-white/5 hover:text-white transition"
            aria-label={rail ? "Expand sidebar" : "Collapse sidebar"}
            aria-pressed={rail}
          >
            {rail ? <PanelLeftOpen className="w-[18px] h-[18px]" /> : <PanelLeftClose className="w-[18px] h-[18px]" />}
          </button>
        </div>
        {navList(rail)}
        {sidebarFooter(rail)}
      </aside>

      {/* ── Drawer (< lg): backdrop + slide-in panel ── */}
      <div
        className={`fixed inset-0 z-40 bg-ink-950/60 backdrop-blur-sm lg:hidden transition-opacity duration-200 ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      <aside
        ref={drawerRef}
        id="suite-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Suite navigation"
        aria-hidden={!open}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(19rem,85vw)] flex-col bg-ink-950 text-ink-300 shadow-float transition-transform duration-250 ease-out lg:hidden ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between gap-2 border-b border-white/5 px-5 py-4 pt-[max(1rem,env(safe-area-inset-top))]">
          <div className="min-w-0">
            <div className="text-white font-semibold text-[17px] tracking-tight leading-none">
              SuRaksha<span className={cfg.accent}> AI</span>
            </div>
            <div className="text-meta uppercase tracking-[0.14em] text-ink-500 mt-1.5 truncate">{cfg.consoleName}</div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-ink-400 hover:bg-white/5 hover:text-white"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {navList(false)}
        {sidebarFooter(false)}
      </aside>

      {/* ── Main column ── */}
      <div className={`flex-1 min-w-0 ${rail ? "lg:ml-[4.5rem]" : "lg:ml-64"} transition-[margin] duration-200 ease-out`}>
        <header className="sticky top-0 z-30 glass border-b border-ink-200/70 pad-safe-x">
          <div className="px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
              <button
                ref={menuButtonRef}
                className="lg:hidden grid h-11 w-11 -ml-1.5 shrink-0 place-items-center rounded-lg hover:bg-ink-100"
                onClick={() => setOpen(true)}
                aria-label="Open navigation"
                aria-expanded={open}
                aria-controls="suite-drawer"
              >
                <Menu className="w-5 h-5" />
              </button>
              {/* Breadcrumb sheds its root on phones — the current page is the
                  only part that carries information at that width. */}
              <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-ink-500 min-w-0">
                <span className="hidden sm:inline font-semibold text-ink-800">{cfg.headerBreadcrumb}</span>
                <ChevronRight className="hidden sm:block w-4 h-4 shrink-0" />
                <span className="truncate font-semibold text-ink-800 sm:font-normal sm:text-ink-500">{crumb(pathname, nav)}</span>
              </nav>
            </div>

            <div className="flex items-center gap-0.5 sm:gap-2 shrink-0">
              <button
                onClick={() => setSearchOpen(true)}
                className="hidden md:flex items-center gap-2 rounded-lg border border-ink-200 bg-white/70 px-3 py-2 text-xs text-ink-500 hover:border-ink-300 hover:text-ink-700"
                aria-label="Search everything"
              >
                <Search className="w-3.5 h-3.5" />
                Search
                <kbd className="rounded border border-ink-200 bg-ink-50 px-1 text-meta font-semibold text-ink-400">Ctrl K</kbd>
              </button>
              <button
                onClick={() => setSearchOpen(true)}
                className="md:hidden grid h-11 w-11 place-items-center rounded-lg hover:bg-ink-100"
                aria-label="Search everything"
              >
                <Search className="w-5 h-5 text-ink-600" />
              </button>
              <span className={`hidden xl:flex items-center gap-2 text-xs font-medium ${cfg.liveText} ${cfg.liveBg} px-3 py-1.5 rounded-full border ${cfg.liveBorder}`}>
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute h-2 w-2 rounded-full ${cfg.livePing} opacity-75`} />
                  <span className={`relative rounded-full h-2 w-2 ${cfg.liveDot}`} />
                </span>
                Live
              </span>

              <div className="relative" ref={notifRef}>
                <button
                  className="relative grid h-11 w-11 place-items-center rounded-lg hover:bg-ink-100"
                  onClick={() => setNotifOpen((v) => !v)}
                  aria-haspopup="dialog"
                  aria-expanded={notifOpen}
                  aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
                >
                  <Bell className="w-5 h-5 text-ink-600" />
                  {unread > 0 && (
                    <span className="absolute top-1 right-1 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <>
                    {/* Phones get a bottom sheet: a 352px dropdown would hang off
                        a 320–360px viewport and force a horizontal scroll. */}
                    <div className="fixed inset-0 z-40 bg-ink-950/40 sm:hidden" onClick={() => setNotifOpen(false)} aria-hidden="true" />
                    <div
                      role="dialog"
                      aria-label="Notifications"
                      className="fixed inset-x-0 bottom-0 z-50 max-h-[80vh] rounded-t-2xl border-t border-ink-200 bg-white shadow-float overflow-hidden
                                 sm:absolute sm:inset-x-auto sm:bottom-auto sm:right-0 sm:top-12 sm:max-h-none sm:w-[min(22rem,calc(100vw-2rem))] sm:rounded-xl sm:border"
                    >
                      <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-ink-200 sm:hidden" />
                      <div className="flex items-center justify-between px-4 py-3 border-b border-ink-100">
                        <span className="text-sm font-bold text-ink-900">
                          Notifications{unread > 0 && <span className="ml-1.5 text-xs font-semibold text-ink-500">({unread} unread)</span>}
                        </span>
                        <div className="flex items-center gap-1">
                          {unread > 0 && (
                            <button onClick={markAllRead} className="tap-inline rounded-lg px-2 py-1.5 text-xs font-semibold text-ink-500 hover:text-ink-900">
                              Mark all read
                            </button>
                          )}
                          <button onClick={() => setNotifOpen(false)} className="grid h-9 w-9 place-items-center rounded-lg text-ink-400 hover:bg-ink-100 sm:hidden" aria-label="Close notifications">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="max-h-[60vh] sm:max-h-80 scroll-y divide-y divide-ink-50 pad-safe-b">
                        {events.length === 0 && (
                          <p className="px-4 py-8 text-center text-sm text-ink-400">You&apos;re all caught up.</p>
                        )}
                        {events.map((n) => (
                          <button
                            key={n.id}
                            onClick={() => { markRead(n.id); setNotifOpen(false); router.push(n.href); }}
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
                                  <span className="shrink-0 rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700">CRITICAL</span>
                                )}
                                {n.read && <Check className="w-3 h-3 text-ink-400 shrink-0" />}
                              </span>
                              <span className="block text-xs text-ink-500 mt-0.5 leading-relaxed">{n.detail}</span>
                              <span className="mt-1 flex items-center justify-between gap-2">
                                <span className="text-meta text-ink-400 truncate">{n.module} · {timeAgo(n.at)}</span>
                                <span className="inline-flex shrink-0 items-center gap-0.5 text-meta font-bold text-ink-500">
                                  Open <ChevronRight className="w-3 h-3" />
                                </span>
                              </span>
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2 pl-0.5 sm:pl-1">
                <div className={`h-9 w-9 shrink-0 rounded-full ${cfg.avatarBg} grid place-items-center text-white text-sm font-semibold`}>
                  {cfg.avatarInitials}
                </div>
                <div className="hidden lg:block leading-tight">
                  <div className="text-sm font-semibold text-ink-800">{cfg.label}</div>
                  <div className="text-xs text-ink-500">{cfg.sub}</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content width grows in deliberate steps so ultrawide gains readable
            columns instead of one narrow column between two empty margins. */}
        <main
          id="main-content"
          tabIndex={-1}
          className="px-4 sm:px-6 lg:px-8 py-5 sm:py-6 max-w-[1400px] 2xl:max-w-[1600px] 3xl:max-w-[1840px] 4xl:max-w-[2200px] mx-auto animate-fade has-bottom-nav lg:pb-8 landscape-compact"
        >
          {children}
        </main>
      </div>

      {/* ── Mobile tab bar: primary destinations stay one thumb-tap away ── */}
      <nav
        aria-label="Primary"
        className="app-bottom-nav fixed inset-x-0 bottom-0 z-30 flex items-stretch border-t border-ink-200 bg-white/95 backdrop-blur pad-safe-b lg:hidden"
      >
        {primaryTabs.map((item) => {
          const Icon = ICONS[item.icon];
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`relative flex min-h-[3.5rem] flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[11px] font-semibold transition ${active ? cfg.tabActive : "text-ink-500"}`}
            >
              {active && <span className={`absolute top-0 h-0.5 w-8 rounded-full ${cfg.liveDot}`} />}
              <Icon className="w-[19px] h-[19px]" />
              <span className="w-full truncate text-center leading-tight">{item.label.split(" ")[0]}</span>
              {item.badge && <span className="absolute right-1/4 top-2 h-1.5 w-1.5 rounded-full bg-red-500" />}
            </Link>
          );
        })}
        <button
          onClick={() => setOpen(true)}
          aria-label="More destinations"
          aria-expanded={open}
          className={`flex min-h-[3.5rem] flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[11px] font-semibold transition ${inOverflow ? cfg.tabActive : "text-ink-500"}`}
        >
          {inOverflow && <span className={`absolute top-0 h-0.5 w-8 rounded-full ${cfg.liveDot}`} />}
          <MoreHorizontal className="w-[19px] h-[19px]" />
          <span className="leading-tight">More</span>
        </button>
      </nav>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}

function crumb(pathname: string | null, nav: NavItem[]) {
  return nav.find((n) => n.href === pathname)?.label ?? "Overview";
}
