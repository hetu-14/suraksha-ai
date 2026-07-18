import { ReactNode } from "react";

/** Flat, bordered surface — cards sit on the page, they don't float (design guide §18). */
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white rounded-xl border border-ink-200 ${className}`}>
      {children}
    </div>
  );
}

export function Kpi({
  label,
  value,
  sub,
  icon,
  accent = "text-brand-700",
}: {
  label: string;
  value: ReactNode;
  sub?: string;
  icon?: ReactNode;
  accent?: string;
}) {
  return (
    <Card className="p-4 lift">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-ink-500">{label}</span>
        <span className={accent}>{icon}</span>
      </div>
      <div className="mt-1.5 text-2xl sm:text-[28px] font-bold leading-tight text-ink-900 tabular-nums">{value}</div>
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
    red: "bg-red-50 text-red-700 border border-red-200/70",
    amber: "bg-amber-50 text-amber-800 border border-amber-200/70",
    sky: "bg-sky-50 text-sky-700 border border-sky-200/70",
    brand: "bg-brand-50 text-brand-700 border border-brand-200/70",
    violet: "bg-violet-50 text-violet-700 border border-violet-200/70",
    indigo: "bg-indigo-50 text-indigo-700 border border-indigo-200/70",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function SectionTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-xl font-bold text-ink-900 tracking-tight">{title}</h2>
      {sub && <p className="text-sm text-ink-500 mt-0.5">{sub}</p>}
    </div>
  );
}
