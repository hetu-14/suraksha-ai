import Shell, { NavItem } from "@/components/Shell";

const nav: NavItem[] = [
  { href: "/safety", label: "Dashboard", icon: "dashboard" },
  { href: "/safety/smartnotify", label: "Smart Notify", icon: "megaphone" },
  { href: "/safety/station-readiness", label: "Station Readiness", icon: "building2" },
  { href: "/safety/asset-health", label: "Asset Health", icon: "wrench" },
  { href: "/safety/contractor-safety", label: "Contractor Safety", icon: "hardHat" },
  { href: "/safety/emergency", label: "Emergency Dashboard", icon: "siren", badge: "LIVE" },
];

export default function SafetyLayout({ children }: { children: React.ReactNode }) {
  return (
    <Shell role="safety" nav={nav}>
      {children}
    </Shell>
  );
}
