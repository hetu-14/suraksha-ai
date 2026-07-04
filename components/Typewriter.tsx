"use client";

import { useEffect, useState, useRef } from "react";

export type Seg = { text: string; cls?: string };

export default function Typewriter({
  segments, speed = 48, startDelay = 0, cursorClass = "", onComplete,
}: {
  segments: Seg[];
  speed?: number;
  startDelay?: number;
  cursorClass?: string;
  onComplete?: () => void;
}) {
  const total = segments.reduce((a, s) => a + s.text.length, 0);
  const [count, setCount] = useState(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setCount(total);
      setTimeout(() => onCompleteRef.current?.(), 0);
      return;
    }
    let interval: ReturnType<typeof setInterval>;
    const start = setTimeout(() => {
      interval = setInterval(() => {
        setCount((c) => {
          if (c >= total) {
            clearInterval(interval);
            setTimeout(() => onCompleteRef.current?.(), 0);
            return c;
          }
          return c + 1;
        });
      }, speed);
    }, startDelay);
    return () => { clearTimeout(start); clearInterval(interval); };
  }, [total, speed, startDelay]);

  let acc = count;
  return (
    <>
      {segments.map((s, i) => {
        const shown = Math.max(0, Math.min(s.text.length, acc));
        acc -= s.text.length;
        return <span key={i} className={s.cls}>{s.text.slice(0, shown)}</span>;
      })}
      {count < total && <span className={`tw-cursor ${cursorClass}`}>|</span>}
    </>
  );
}
