import Shell, { NavItem } from "@/components/Shell";

const nav: NavItem[] = [
  { href: "/intelligence", label: "Dashboard", icon: "dashboard" },
  { href: "/intelligence/revenue-guard", label: "Revenue Guard", icon: "shieldAlert" },
  { href: "/intelligence/sla", label: "SLA Sentinel", icon: "timer" },
  { href: "/intelligence/command", label: "Command Center", icon: "monitor" },
  { href: "/intelligence/insights", label: "Operational Insights", icon: "trendingUp" },
];

export default function IntelligenceLayout({ children }: { children: React.ReactNode }) {
  return (
    <Shell role="intelligence" nav={nav}>
      {children}
    </Shell>
  );
}
