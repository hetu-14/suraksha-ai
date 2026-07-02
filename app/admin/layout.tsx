import Shell, { NavItem } from "@/components/Shell";

const nav: NavItem[] = [
  { href: "/admin", label: "Command Center", icon: "dashboard" },
  { href: "/admin/safezone", label: "SafeZone AI", icon: "video", badge: "LIVE" },
  { href: "/admin/gasguard", label: "GasGuard Cases", icon: "siren", badge: "LIVE" },
  { href: "/admin/autonotify", label: "AutoNotify", icon: "megaphone" },
  { href: "/admin/sla", label: "SLA Sentinel", icon: "timer" },
  { href: "/admin/revguard", label: "RevGuard", icon: "shieldAlert" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Shell role="admin" nav={nav}>
      {children}
    </Shell>
  );
}
