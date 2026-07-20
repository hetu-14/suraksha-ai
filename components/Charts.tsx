"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";

const axis = { fontSize: 11, fill: "#94a3b8" };

/** Tracks a media query so chart internals (legends, margins, tick density)
 *  can adapt — ResponsiveContainer only solves width, not information density. */
export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const list = window.matchMedia(query);
    setMatches(list.matches);
    const onChange = (event: MediaQueryListEvent) => setMatches(event.matches);
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}

const tooltipStyle = { borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 };
/** Wider hit area so a fingertip can land a tooltip on a phone. */
const touchProps = { activeDot: { r: 5 } };

/** Chart frame: fluid height, never taller than the viewport on a landscape phone. */
function Frame({ children, tall = false }: { children: React.ReactElement; tall?: boolean }) {
  return (
    <div className={`w-full ${tall ? "h-[200px] xs:h-[230px] sm:h-[260px] xl:h-[300px] 3xl:h-[340px]" : "h-[190px] xs:h-[210px] sm:h-[240px] xl:h-[270px] 3xl:h-[300px]"}`}>
      <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
    </div>
  );
}

export function TrendChart({ data }: { data: { day: string; alerts: number; resolved: number }[] }) {
  const narrow = useMediaQuery("(max-width: 639px)");
  return (
    <Frame tall>
      <LineChart data={data} margin={{ top: 8, right: 8, left: narrow ? -22 : -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" vertical={false} />
        {/* Thin the axis on phones so labels never collide or get clipped. */}
        <XAxis dataKey="day" tick={axis} axisLine={false} tickLine={false} interval={narrow ? "preserveStartEnd" : 0} minTickGap={narrow ? 12 : 5} />
        <YAxis tick={axis} axisLine={false} tickLine={false} width={narrow ? 34 : 42} />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: narrow ? 11 : 12, paddingTop: 4 }} />
        <Line type="monotone" dataKey="alerts" stroke="#ef4444" strokeWidth={2} dot={false} name="Alerts" {...touchProps} />
        <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2} dot={false} name="Resolved" {...touchProps} />
      </LineChart>
    </Frame>
  );
}

export function DonutChart({ data }: { data: { name: string; value: number; color: string }[] }) {
  const narrow = useMediaQuery("(max-width: 639px)");
  // A pie legend with 5–7 entries steals most of a phone's chart height, so
  // below `sm` the donut keeps its ring and the breakdown becomes a readable
  // list underneath instead of a cramped wrapped legend.
  return (
    <div className="w-full">
      <div className="h-[180px] xs:h-[200px] sm:h-[240px] xl:h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={narrow ? 44 : 54} outerRadius={narrow ? 68 : 82} paddingAngle={2}>
              {data.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
            {!narrow && <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />}
          </PieChart>
        </ResponsiveContainer>
      </div>
      {narrow && (
        <ul className="mt-3 space-y-1.5">
          {data.map((item) => (
            <li key={item.name} className="flex items-center justify-between gap-3 text-xs">
              <span className="flex min-w-0 items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: item.color }} />
                <span className="truncate text-ink-600">{item.name}</span>
              </span>
              <span className="shrink-0 font-bold tabular-nums text-ink-800">{item.value}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function UsageBar({
  data,
  highlight = "#10b981",
}: {
  data: { name: string; units: number }[];
  highlight?: string;
}) {
  const narrow = useMediaQuery("(max-width: 639px)");
  return (
    <Frame tall>
      <BarChart data={data} margin={{ top: 8, right: 8, left: narrow ? -22 : -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" vertical={false} />
        <XAxis dataKey="name" tick={axis} axisLine={false} tickLine={false} interval={narrow ? "preserveStartEnd" : 0} minTickGap={narrow ? 10 : 5} />
        <YAxis tick={axis} axisLine={false} tickLine={false} width={narrow ? 34 : 42} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#f1f5f9" }} />
        <Bar dataKey="units" radius={[6, 6, 0, 0]} name="Units (SCM)">
          {data.map((d, i) => (
            <Cell key={i} fill={i === data.length - 1 ? highlight : "#cbd5e1"} />
          ))}
        </Bar>
      </BarChart>
    </Frame>
  );
}

export function FingerprintChart({ normal, actual }: { normal: number[]; actual: number[] }) {
  const narrow = useMediaQuery("(max-width: 639px)");
  const data = normal.map((n, i) => ({ name: "M" + (i + 1), expected: n, actual: actual[i] }));
  return (
    <Frame>
      <LineChart data={data} margin={{ top: 8, right: 8, left: narrow ? -22 : -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" vertical={false} />
        <XAxis dataKey="name" tick={axis} axisLine={false} tickLine={false} minTickGap={narrow ? 10 : 5} />
        <YAxis tick={axis} axisLine={false} tickLine={false} width={narrow ? 34 : 42} />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: narrow ? 11 : 12, paddingTop: 4 }} />
        <Line type="monotone" dataKey="expected" stroke="#cbd5e1" strokeWidth={2} strokeDasharray="5 4" dot={false} name="Expected" {...touchProps} />
        <Line type="monotone" dataKey="actual" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} name="Actual" {...touchProps} />
      </LineChart>
    </Frame>
  );
}
