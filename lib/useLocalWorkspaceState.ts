"use client";

import { useEffect, useState } from "react";

export function useLocalWorkspaceState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(key);
      if (saved) setValue(JSON.parse(saved) as T);
    } catch { /* The local workflow remains usable without storage. */ }
    setLoaded(true);
  }, [key]);

  useEffect(() => {
    if (!loaded) return;
    try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* Storage is optional. */ }
  }, [key, loaded, value]);

  return [value, setValue, loaded] as const;
}
