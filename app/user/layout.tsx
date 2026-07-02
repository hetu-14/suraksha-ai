import Shell, { NavItem } from "@/components/Shell";

const nav: NavItem[] = [
  { href: "/user", label: "Home", icon: "dashboard" },
  { href: "/user/gasguard", label: "Emergency", icon: "siren", badge: "SOS" },
  { href: "/user/bills", label: "WhyMyBill", icon: "receipt" },
];

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <Shell role="user" nav={nav}>
      {children}
    </Shell>
  );
}
