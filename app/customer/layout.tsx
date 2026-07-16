import Shell, { NavItem } from "@/components/Shell";

const nav: NavItem[] = [
  { href: "/customer", label: "Dashboard", icon: "dashboard" },
  { href: "/customer/explainbill", label: "Why-My-Bill", icon: "receipt" },
  { href: "/customer/connection", label: "My PNG Status", icon: "route" },
  { href: "/customer/health", label: "Health Score", icon: "heartPulse" },
  { href: "/customer/voice", label: "Voice of Customer", icon: "messageSquare" },
  { href: "/customer/trustpoints", label: "TrustPoints", icon: "award" },
  { href: "/customer/appointment", label: "Appointment Booking", icon: "calendarDays" },
  { href: "/customer/gascare", label: "Gas-Guard", icon: "flame", badge: "SOS" },
];

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <Shell role="customer" nav={nav}>
      {children}
    </Shell>
  );
}
