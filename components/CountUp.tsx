"use client";

import { useEffect, useRef, useState } from "react";

export default function CountUp({
  to, prefix = "", suffix = "", format = false, dur = 900, decimals = 0,
}: {
  to: number;
  prefix?: string;
  suffix?: string;
  format?: boolean;
  dur?: number;
  decimals?: number;
}) {
  const [v, setV] = useState(0);
  const raf = useRef(0);
  useEffect(() => {
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      setV(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf.current = requestAnimationFrame(tick);
      else setV(to);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [to, dur]);

  const displayVal = format
    ? v.toLocaleString("en-IN", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })
    : v.toFixed(decimals);

  return <span className="tabular-nums">{prefix}{displayVal}{suffix}</span>;
}
