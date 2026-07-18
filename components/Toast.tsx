"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, X } from "lucide-react";

/** Shared auto-dismissing toast state. Replaces the per-page notice implementations. */
export function useToast(timeoutMs = 3500) {
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => {
    if (!message) return;
    const t = window.setTimeout(() => setMessage(null), timeoutMs);
    return () => window.clearTimeout(t);
  }, [message, timeoutMs]);
  return { message, show: setMessage, clear: () => setMessage(null) };
}

export function Toast({ message, onClose }: { message: string | null; onClose: () => void }) {
  if (!message) return null;
  return (
    <div
      role="status"
      className="fixed right-4 top-4 z-50 flex max-w-sm items-start gap-2.5 rounded-xl bg-ink-900 px-4 py-3 text-sm font-semibold text-white shadow-xl anim-fade-down"
    >
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
      <span className="flex-1">{message}</span>
      <button onClick={onClose} aria-label="Dismiss notification">
        <X className="h-4 w-4 text-ink-300" />
      </button>
    </div>
  );
}
