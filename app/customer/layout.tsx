import Shell, { NavItem } from "@/components/Shell";

const nav: NavItem[] = [
  { href: "/customer", label: "Dashboard", icon: "dashboard" },
  { href: "/customer/explainbill", label: "ExplainBill AI", icon: "receipt" },
  { href: "/customer/connection", label: "Connection Journey", icon: "route" },
  { href: "/customer/health", label: "Health Score", icon: "heartPulse" },
  { href: "/customer/voice", label: "Voice of Customer", icon: "messageSquare" },
  { href: "/customer/confidence", label: "Confidence Score", icon: "award" },
  { href: "/customer/gascare", label: "GasCare", icon: "siren", badge: "SOS" },
];

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <Shell role="customer" nav={nav}>
      {children}
    </Shell>
  );
}
