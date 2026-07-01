import { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white rounded-2xl shadow-soft border border-ink-100 ${className}`}>
      {children}
    </div>
  );
}

export function Kpi({
  label,
  value,
  sub,
  icon,
  accent = "text-brand-600",
}: {
  label: string;
  value: ReactNode;
  sub?: string;
  icon?: ReactNode;
  accent?: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-ink-500">{label}</span>
        <span className={accent}>{icon}</span>
      </div>
      <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-ink-900 tabular-nums">{value}</div>
      {sub && <div className={`text-xs mt-1 font-medium ${accent}`}>{sub}</div>}
    </Card>
  );
}

export function Badge({
  children,
  tone = "ink",
}: {
  children: ReactNode;
  tone?: "ink" | "red" | "amber" | "sky" | "brand" | "violet" | "indigo";
}) {
  const tones: Record<string, string> = {
    ink: "bg-ink-100 text-ink-600",
    red: "bg-red-100 text-red-700",
    amber: "bg-amber-100 text-amber-700",
    sky: "bg-sky-100 text-sky-700",
    brand: "bg-brand-100 text-brand-700",
    violet: "bg-violet-100 text-violet-700",
    indigo: "bg-indigo-100 text-indigo-700",
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function SectionTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-xl font-bold text-ink-900">{title}</h2>
      {sub && <p className="text-sm text-ink-500 mt-0.5">{sub}</p>}
    </div>
  );
}
