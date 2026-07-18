import Shell, { NavItem } from "@/components/Shell";

const nav: NavItem[] = [
  { href: "/safety", label: "Dashboard", icon: "dashboard" },
  { href: "/safety/dashboard-gas-guard", label: "Gas-Guard Grid", icon: "flame" },
  { href: "/safety/rev-guard", label: "Rev-Guard", icon: "shieldAlert" },
  { href: "/safety/sla-sentinel", label: "SLA Sentinel", icon: "timer" },
  { href: "/safety/smartnotify", label: "Auto-Notify", icon: "megaphone" },
  { href: "/safety/station-readiness", label: "Station Readiness", icon: "building2" },
  { href: "/safety/asset-health", label: "Asset Health", icon: "wrench" },
  { href: "/safety/contractor-safety", label: "Contractor Safety", icon: "hardHat" },
  { href: "/safety/emergency", label: "Emergency Response", icon: "siren", badge: "LIVE" },
];

export default function SafetyLayout({ children }: { children: React.ReactNode }) {
  return (
    <Shell role="safety" nav={nav}>
      {children}
    </Shell>
  );
}
