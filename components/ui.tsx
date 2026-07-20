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
    <Card className="p-3.5 sm:p-4 lift">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium text-ink-500 leading-snug">{label}</span>
        <span className={`${accent} shrink-0`}>{icon}</span>
      </div>
      <div className="mt-1.5 text-fluid-kpi font-bold text-ink-900 tabular-nums break-anywhere">{value}</div>
      {sub && <div className={`text-xs mt-1 font-medium ${accent} leading-snug`}>{sub}</div>}
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
      <h2 className="text-fluid-h2 font-bold text-ink-900 tracking-tight">{title}</h2>
      {sub && <p className="text-sm text-ink-500 mt-0.5 measure">{sub}</p>}
    </div>
  );
}

/**
 * Page hero shared by every interior screen. Keeps the eyebrow/title/subtitle
 * hierarchy identical across suites while scaling type fluidly and shedding
 * padding on small and short (landscape phone) viewports.
 */
export function PageHeader({
  eyebrow,
  title,
  sub,
  actions,
  className = "",
}: {
  eyebrow?: string;
  title: ReactNode;
  sub?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={`rounded-xl bg-ink-950 text-white p-5 sm:p-7 lg:p-8 landscape-compact ${className}`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 max-w-3xl">
          {eyebrow && <p className="text-xs font-semibold uppercase tracking-widest text-ink-400">{eyebrow}</p>}
          <h1 className="text-fluid-h1 font-bold mt-1.5">{title}</h1>
          {sub && <p className="text-ink-300 mt-2 text-sm leading-relaxed measure">{sub}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </header>
  );
}

// ── Responsive data table ────────────────────────────────────────
// One definition renders two layouts: a real table with a sticky header at
// `md` and above, and a stack of scannable cards below it. Tables are never
// shrunk to fit a phone — they are re-authored as cards, so nobody has to
// pinch-zoom or scroll sideways to read a row.

export type Column<T> = {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  /** Becomes the card title on mobile. Exactly one column should set this. */
  primary?: boolean;
  /** Rendered under the title on mobile instead of in the label/value list. */
  secondary?: boolean;
  /** Drop this column from the desktop table below the given breakpoint. */
  hideBelow?: "lg" | "xl";
  align?: "left" | "right";
};

export function DataTable<T>({
  columns,
  rows,
  getKey,
  onRowClick,
  isActive,
  empty = "Nothing to show.",
  caption,
}: {
  columns: Column<T>[];
  rows: T[];
  getKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  isActive?: (row: T) => boolean;
  empty?: string;
  caption?: string;
}) {
  const primary = columns.find((column) => column.primary) ?? columns[0];
  const secondary = columns.filter((column) => column.secondary);
  const details = columns.filter((column) => column !== primary && !column.secondary);
  const hideClass = (column: Column<T>) =>
    column.hideBelow === "xl" ? "hidden xl:table-cell" : column.hideBelow === "lg" ? "hidden lg:table-cell" : "";

  if (rows.length === 0) {
    return <p className="py-8 text-center text-sm text-ink-400">{empty}</p>;
  }

  return (
    <>
      {/* Desktop / tablet: true table, sticky header, horizontal scroll only as a last resort */}
      <div className="hidden md:block scroll-x">
        <table className="w-full text-sm">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr className="border-b border-ink-100 text-left text-xs font-bold uppercase tracking-wider text-ink-500">
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={`sticky top-16 z-10 bg-white px-3 pb-3 pt-2 first:pl-0 ${column.align === "right" ? "text-right" : ""} ${hideClass(column)}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-50">
            {rows.map((row) => (
              <tr
                key={getKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={onRowClick ? (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onRowClick(row); } } : undefined}
                aria-selected={isActive?.(row)}
                className={`${onRowClick ? "cursor-pointer" : ""} ${isActive?.(row) ? "bg-brand-50" : onRowClick ? "hover:bg-ink-50" : ""}`}
              >
                {columns.map((column) => (
                  <td key={column.key} className={`px-3 py-3 first:pl-0 align-middle ${column.align === "right" ? "text-right" : ""} ${hideClass(column)}`}>
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: every row becomes a card — title, supporting line, then a
          two-up label/value grid. No sideways scrolling, no zooming. */}
      <ul className="space-y-2.5 md:hidden">
        {rows.map((row) => {
          const interactive = Boolean(onRowClick);
          const Wrapper = interactive ? "button" : "div";
          return (
            <li key={getKey(row)}>
              <Wrapper
                {...(interactive ? { onClick: () => onRowClick!(row), type: "button" as const } : {})}
                className={`w-full rounded-xl border p-3.5 text-left transition ${isActive?.(row) ? "border-brand-300 bg-brand-50" : "border-ink-200 bg-white"}`}
              >
                <div className="text-sm font-bold text-ink-900 break-anywhere">{primary.cell(row)}</div>
                {secondary.map((column) => (
                  <div key={column.key} className="mt-1 text-xs text-ink-500 break-anywhere">{column.cell(row)}</div>
                ))}
                {details.length > 0 && (
                  <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-ink-100 pt-3">
                    {details.map((column) => (
                      <div key={column.key} className="min-w-0">
                        <dt className="text-meta font-semibold uppercase tracking-wide text-ink-400">{column.header}</dt>
                        <dd className="mt-0.5 text-xs font-medium text-ink-800 break-anywhere">{column.cell(row)}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </Wrapper>
            </li>
          );
        })}
      </ul>
    </>
  );
}
