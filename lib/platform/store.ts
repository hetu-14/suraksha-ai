"use client";

// ---- Shared persistence + change signal for the platform layer ----
// Every platform store (events, facts, KPIs, recommendations) persists through
// these helpers and announces changes on one signal, so any hook anywhere in
// the app re-renders when any module changes platform state — including from
// another tab via the browser storage event.

import { useCallback, useEffect, useState } from "react";

/** Single DOM event name announcing that any platform store changed. */
export const PLATFORM_SIGNAL = "suraksha:platform";

export function readStore<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw != null) return JSON.parse(raw) as T;
  } catch { /* corrupt or unavailable storage falls back below */ }
  return fallback;
}

export function writeStore<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch { /* storage is optional; the session keeps working in memory */ }
  window.dispatchEvent(new CustomEvent(PLATFORM_SIGNAL, { detail: key }));
}

/** Live view over a derivation of platform state — recomputes on any platform change. */
export function usePlatformDerived<T>(compute: () => T, initial: T): T {
  const [value, setValue] = useState<T>(initial);
  const refresh = useCallback(() => setValue(compute()), [compute]);
  useEffect(() => {
    refresh();
    window.addEventListener(PLATFORM_SIGNAL, refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener("suraksha:feed", refresh);
    return () => {
      window.removeEventListener(PLATFORM_SIGNAL, refresh);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("suraksha:feed", refresh);
    };
  }, [refresh]);
  return value;
}
