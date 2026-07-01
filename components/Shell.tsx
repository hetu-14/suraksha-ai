"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, ReactNode } from "react";
import {
  ShieldCheck, LayoutDashboard, PhoneCall, Megaphone, Timer, ShieldAlert,
  ScanEye, ReceiptText, Menu, Bell, LogOut, ChevronRight,
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
};

export default function Shell({
  role,
  nav,
  children,
}: {
  role: "user" | "admin";
  nav: NavItem[];
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const roleLabel = role === "admin" ? "Operations Admin" : "Customer";
  const roleSub = role === "admin" ? "Control Room" : currentName;

  return (
    <div className="flex min-h-screen">
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
              SuRaksha<span className="text-brand-400"> AI</span>
            </div>
            <div className="text-[10px] uppercase tracking-widest text-ink-500 mt-1">
              {role === "admin" ? "Admin Console" : "Customer App"}
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
                  active ? "bg-brand-500/15 text-brand-300" : "hover:bg-white/5"
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon className={`w-[18px] h-[18px] ${active ? "text-brand-300" : ""}`} />
                  {item.label}
                </span>
                {item.badge && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-300 font-semibold">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/5">
          <div className="rounded-xl bg-white/5 p-3 text-xs mb-2">
            <div className="text-brand-300 font-semibold">PNGRB-aligned</div>
            <p className="text-ink-500 mt-1 leading-relaxed">Consumer Protection Regulations, 2025.</p>
          </div>
          <Link href="/" className="flex items-center gap-2 px-3 py-2 rounded-xl text-ink-400 hover:bg-white/5 hover:text-white transition">
            <LogOut className="w-4 h-4" /> Switch portal
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
                <span className="font-semibold text-ink-800">{role === "admin" ? "Admin" : "My Account"}</span>
                <ChevronRight className="w-4 h-4" />
                <span className="truncate">{crumb(pathname, nav)}</span>
              </nav>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="hidden sm:flex items-center gap-2 text-xs font-medium text-brand-700 bg-brand-50 px-3 py-1.5 rounded-full border border-brand-200">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute h-2 w-2 rounded-full bg-brand-400 opacity-75" />
                  <span className="relative rounded-full h-2 w-2 bg-brand-500" />
                </span>
                Live
              </span>
              <button className="relative p-2 rounded-lg hover:bg-ink-100">
                <Bell className="w-5 h-5 text-ink-600" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
              </button>
              <div className="flex items-center gap-2 pl-1">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-ink-700 to-ink-900 grid place-items-center text-white text-sm font-semibold">
                  {role === "admin" ? "OP" : "RM"}
                </div>
                <div className="hidden sm:block leading-tight">
                  <div className="text-sm font-semibold text-ink-800">{roleLabel}</div>
                  <div className="text-[11px] text-ink-500">{roleSub}</div>
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

const currentName = "Riddhi Mehta";
function crumb(pathname: string, nav: NavItem[]) {
  return nav.find((n) => n.href === pathname)?.label ?? "Overview";
}
