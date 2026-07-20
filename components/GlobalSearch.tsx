"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Clock3, CornerDownLeft, Pin, Search, Sparkles, X, Zap } from "lucide-react";
import {
  didYouMean, dynamicEntries, entryById, popularSearches, readHistory, recordVisit,
  searchEverything, staticIndex, togglePin, type HistoryItem, type SearchEntry,
} from "@/lib/searchIndex";

const FILTERS = ["All", "Actions", "Pages", "Customers", "Bills", "SLA tickets", "Revenue cases", "Zones & stations", "Appointments", "Documentation"];

const PRIORITY_STYLES: Record<string, string> = {
  Critical: "bg-red-100 text-red-700",
  High: "bg-amber-100 text-amber-700",
  Medium: "bg-sky-100 text-sky-700",
  Low: "bg-ink-100 text-ink-500",
};

export default function GlobalSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [highlighted, setHighlighted] = useState(0);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const live = useMemo(() => (open ? dynamicEntries() : []), [open]);
  const results = useMemo(
    () => searchEverything(query, live, filter === "All" ? undefined : filter),
    [filter, live, query],
  );
  const suggestion = useMemo(() => (query.trim().length >= 3 && results.length === 0 ? didYouMean(query) : null), [query, results.length]);
  const selected = results[highlighted];

  useEffect(() => {
    if (open) {
      setQuery("");
      setFilter("All");
      setHighlighted(0);
      setHistory(readHistory());
      window.setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  useEffect(() => { setHighlighted(0); }, [query, filter]);

  useEffect(() => {
    listRef.current?.querySelector('[data-highlighted="true"]')?.scrollIntoView({ block: "nearest" });
  }, [highlighted]);

  const go = useCallback((entry: SearchEntry) => {
    recordVisit(entry);
    onClose();
    router.push(entry.href);
  }, [onClose, router]);

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Escape") { onClose(); return; }
    if (event.key === "Tab") {
      event.preventDefault();
      const direction = event.shiftKey ? -1 : 1;
      setFilter((current) => FILTERS[(FILTERS.indexOf(current) + direction + FILTERS.length) % FILTERS.length]);
      return;
    }
    if (event.key === "ArrowDown") { event.preventDefault(); setHighlighted((i) => Math.min(results.length - 1, i + 1)); }
    if (event.key === "ArrowUp") { event.preventDefault(); setHighlighted((i) => Math.max(0, i - 1)); }
    if (event.key === "Enter" && selected) go(selected);
  }

  if (!open) return null;

  const pinned = history.filter((h) => h.pinned).slice(0, 4);
  const recents = history.filter((h) => !h.pinned).slice(0, 5);
  const frequent = [...history].sort((a, b) => b.count - a.count).filter((h) => h.count > 1).slice(0, 3);
  const quickActions = staticIndex.filter((e) => e.isAction).slice(0, 4);

  const grouped = results.reduce<Array<{ group: string; items: Array<{ entry: SearchEntry; index: number }> }>>((acc, entry, index) => {
    const bucket = acc.find((g) => g.group === entry.group);
    if (bucket) bucket.items.push({ entry, index });
    else acc.push({ group: entry.group, items: [{ entry, index }] });
    return acc;
  }, []);

  return (
    // Phones get a true fullscreen search surface (no dialog inset, no rounded
    // card floating on a backdrop); tablets and desktop keep the command palette.
    <div
      className="fixed inset-0 z-[60] flex items-stretch justify-center bg-ink-950/50 sm:items-start sm:p-4 sm:pt-[9vh]"
      onMouseDown={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Global search"
    >
      <div
        className="flex w-full max-w-3xl flex-col overflow-hidden border-ink-200 bg-white sm:rounded-xl sm:border sm:shadow-float"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-2 border-b border-ink-100 px-3 pt-[env(safe-area-inset-top)] sm:gap-3 sm:px-4 sm:pt-0">
          <Search className="h-4 w-4 shrink-0 text-ink-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search anything — customers, tickets, zones, bills…"
            enterKeyHint="search"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            className="h-14 w-full bg-transparent text-base text-ink-900 outline-none placeholder:text-ink-400 sm:h-12 sm:text-sm"
            aria-label="Search everything"
          />
          <button onClick={onClose} className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-ink-400 hover:bg-ink-50 hover:text-ink-700 sm:h-9 sm:w-9" aria-label="Close search">
            <X className="h-5 w-5 sm:h-4 sm:w-4" />
          </button>
        </div>

        {/* Filters */}
        <div className="scroll-x snap-rail flex gap-1 border-b border-ink-100 px-3 py-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); inputRef.current?.focus(); }}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${filter === f ? "bg-ink-900 text-white" : "text-ink-500 hover:bg-ink-50"}`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Below `sm` the preview pane is dropped entirely: on a phone the result
            list should own the full height, and tapping a result navigates. */}
        <div className="grid min-h-0 flex-1 sm:min-h-[320px] sm:flex-none sm:grid-cols-[1.05fr_.95fr]">
          {/* Results */}
          <div ref={listRef} className="scroll-y min-h-0 flex-1 border-r border-ink-100 sm:max-h-[52vh]">
            {query.trim().length < 2 ? (
              <EmptyState pinned={pinned} recents={recents} frequent={frequent} quickActions={quickActions} onPick={go} onPin={(id) => setHistory(togglePin(id))} onQuery={(q) => { setQuery(q); inputRef.current?.focus(); }} />
            ) : results.length === 0 ? (
              <NoResults query={query} suggestion={suggestion} quickActions={quickActions} onQuery={(q) => { setQuery(q); inputRef.current?.focus(); }} onPick={go} />
            ) : (
              grouped.map((section) => (
                <div key={section.group}>
                  <p className="px-4 pt-3 pb-1 text-xs font-bold uppercase tracking-wider text-ink-400">{section.group}</p>
                  {section.items.map(({ entry, index }) => (
                    <button
                      key={entry.id}
                      data-highlighted={highlighted === index}
                      onClick={() => go(entry)}
                      onMouseEnter={() => setHighlighted(index)}
                      className={`flex min-h-tap-lg w-full items-center gap-2.5 px-4 py-3 text-left sm:py-2.5 ${highlighted === index ? "bg-ink-50" : ""}`}
                    >
                      {entry.isAction && <Zap className="h-3.5 w-3.5 shrink-0 text-amber-500" />}
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-sm font-semibold text-ink-800">{entry.title}</span>
                          {entry.priority && <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-xs font-bold ${PRIORITY_STYLES[entry.priority]}`}>{entry.priority.toUpperCase()}</span>}
                        </span>
                        <span className="block truncate text-xs text-ink-500">{entry.description}</span>
                      </span>
                      {highlighted === index && <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-ink-400" />}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>

          {/* Preview */}
          <div className="hidden max-h-[52vh] scroll-y p-4 sm:block">
            {selected ? (
              <Preview entry={selected} onNavigate={go} onPin={() => { recordVisit(selected); setHistory(togglePin(selected.id)); }} pinnedIds={new Set(history.filter((h) => h.pinned).map((h) => h.id))} />
            ) : (
              <div className="grid h-full place-items-center text-center text-xs text-ink-400">
                <div>
                  <Sparkles className="mx-auto h-5 w-5 text-ink-300" />
                  <p className="mt-2 max-w-[24ch]">Select a result to see its status, connections, and suggested actions.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-ink-100 bg-ink-50/60 px-4 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] text-xs text-ink-400 sm:pb-2">
          <span className="hidden sm:inline">↑↓ navigate · Enter open · Tab filter · Esc close</span>
          <span className="sm:hidden">Tap a result to open</span>
          <span className="font-semibold">{query.trim().length >= 2 ? `${results.length} results` : "SuRaksha search"}</span>
        </div>
      </div>
    </div>
  );
}

function Preview({ entry, onNavigate, onPin, pinnedIds }: { entry: SearchEntry; onNavigate: (entry: SearchEntry) => void; onPin: () => void; pinnedIds: Set<string> }) {
  const related = (entry.related ?? []).map(entryById).filter((e): e is SearchEntry => Boolean(e));
  return (
    <div>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-400">{entry.group}</p>
          <h3 className="mt-0.5 text-sm font-bold text-ink-900">{entry.title}</h3>
        </div>
        <button onClick={onPin} className={`rounded-md p-1.5 ${pinnedIds.has(entry.id) ? "bg-amber-50 text-amber-600" : "text-ink-300 hover:bg-ink-50 hover:text-ink-600"}`} aria-label={pinnedIds.has(entry.id) ? "Unpin" : "Pin to search home"}>
          <Pin className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {entry.status && <span className="rounded-full bg-ink-100 px-2 py-0.5 text-xs font-bold text-ink-600">{entry.status}</span>}
        {entry.priority && <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${PRIORITY_STYLES[entry.priority]}`}>{entry.priority} priority</span>}
        {entry.updated && <span className="rounded-full bg-ink-100 px-2 py-0.5 text-xs font-bold text-ink-500">Updated {entry.updated}</span>}
      </div>

      <p className="mt-3 text-xs leading-relaxed text-ink-600">{entry.description}</p>

      {entry.summary && (
        <div className="mt-3 rounded-lg border border-ink-100 bg-ink-50/70 p-2.5">
          <p className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-ink-500"><Sparkles className="h-3 w-3" /> AI summary</p>
          <p className="mt-1 text-xs leading-relaxed text-ink-700">{entry.summary}</p>
        </div>
      )}

      {related.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-bold uppercase tracking-wide text-ink-400">Related</p>
          <div className="mt-1.5 space-y-1">
            {related.map((rel) => (
              <button key={rel.id} onClick={() => onNavigate(rel)} className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-ink-50">
                <span className="min-w-0">
                  <span className="block truncate text-xs font-semibold text-ink-700">{rel.title}</span>
                  <span className="block text-xs text-ink-400">{rel.group}</span>
                </span>
                <ArrowRight className="h-3 w-3 shrink-0 text-ink-300" />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-3 space-y-1.5">
        {(entry.actions ?? [{ label: entry.isAction ? "Run this action" : "Open", href: entry.href }]).map((action) => (
          <button key={action.label} onClick={() => onNavigate({ ...entry, href: action.href })} className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-ink-900 py-2 text-xs font-bold text-white hover:bg-ink-800">
            {action.label} <ArrowRight className="h-3 w-3" />
          </button>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ pinned, recents, frequent, quickActions, onPick, onPin, onQuery }: {
  pinned: HistoryItem[]; recents: HistoryItem[]; frequent: HistoryItem[]; quickActions: SearchEntry[];
  onPick: (entry: SearchEntry) => void; onPin: (id: string) => void; onQuery: (q: string) => void;
}) {
  const toEntry = (h: HistoryItem): SearchEntry => entryById(h.id) ?? { id: h.id, title: h.title, description: "", group: h.group, href: h.href };
  return (
    <div className="p-2">
      {pinned.length > 0 && (
        <Section label="Pinned">
          {pinned.map((h) => <HistoryRow key={h.id} item={h} icon={<Pin className="h-3.5 w-3.5 text-amber-500" />} onClick={() => onPick(toEntry(h))} onPin={() => onPin(h.id)} pinned />)}
        </Section>
      )}
      {recents.length > 0 && (
        <Section label="Recent">
          {recents.map((h) => <HistoryRow key={h.id} item={h} icon={<Clock3 className="h-3.5 w-3.5 text-ink-400" />} onClick={() => onPick(toEntry(h))} onPin={() => onPin(h.id)} />)}
        </Section>
      )}
      {frequent.length > 0 && (
        <Section label="Frequently accessed">
          {frequent.map((h) => <HistoryRow key={`f-${h.id}`} item={h} icon={<Sparkles className="h-3.5 w-3.5 text-ink-400" />} onClick={() => onPick(toEntry(h))} onPin={() => onPin(h.id)} />)}
        </Section>
      )}
      <Section label="Quick actions">
        {quickActions.map((entry) => (
          <button key={entry.id} onClick={() => onPick(entry)} className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left hover:bg-ink-50">
            <Zap className="h-3.5 w-3.5 shrink-0 text-amber-500" />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-ink-800">{entry.title}</span>
              <span className="block truncate text-xs text-ink-500">{entry.description}</span>
            </span>
          </button>
        ))}
      </Section>
      <Section label="Popular searches">
        <div className="flex flex-wrap gap-1.5 px-2 pb-2">
          {popularSearches.map((q) => (
            <button key={q} onClick={() => onQuery(q)} className="rounded-full border border-ink-200 px-2.5 py-1 text-xs font-semibold text-ink-600 hover:border-ink-300 hover:bg-ink-50">{q}</button>
          ))}
        </div>
      </Section>
    </div>
  );
}

function NoResults({ query, suggestion, quickActions, onQuery, onPick }: { query: string; suggestion: string | null; quickActions: SearchEntry[]; onQuery: (q: string) => void; onPick: (entry: SearchEntry) => void }) {
  return (
    <div className="p-4">
      <p className="text-sm text-ink-600">Nothing matches <span className="font-semibold text-ink-900">&ldquo;{query.trim()}&rdquo;</span> yet.</p>
      {suggestion && (
        <button onClick={() => onQuery(suggestion)} className="mt-2 text-xs font-bold text-sky-700 hover:underline">
          Did you mean &ldquo;{suggestion}&rdquo;?
        </button>
      )}
      <p className="mt-4 text-xs font-bold uppercase tracking-wide text-ink-400">Try instead</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {popularSearches.slice(0, 5).map((q) => (
          <button key={q} onClick={() => onQuery(q)} className="rounded-full border border-ink-200 px-2.5 py-1 text-xs font-semibold text-ink-600 hover:bg-ink-50">{q}</button>
        ))}
      </div>
      <p className="mt-4 text-xs font-bold uppercase tracking-wide text-ink-400">Or start a workflow</p>
      <div className="mt-1">
        {quickActions.slice(0, 3).map((entry) => (
          <button key={entry.id} onClick={() => onPick(entry)} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-ink-50">
            <Zap className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-xs font-semibold text-ink-700">{entry.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-1">
      <p className="px-2 pt-2 pb-1 text-xs font-bold uppercase tracking-wider text-ink-400">{label}</p>
      {children}
    </div>
  );
}

function HistoryRow({ item, icon, onClick, onPin, pinned = false }: { item: HistoryItem; icon: React.ReactNode; onClick: () => void; onPin: () => void; pinned?: boolean }) {
  return (
    <div className="group flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-ink-50">
      <button onClick={onClick} className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
        {icon}
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-ink-700">{item.title}</span>
          <span className="block text-xs text-ink-400">{item.group}{item.count > 1 ? ` · opened ${item.count}×` : ""}</span>
        </span>
      </button>
      <button onClick={onPin} className={`rounded p-1 ${pinned ? "text-amber-500" : "text-ink-300 opacity-0 group-hover:opacity-100"} hover:bg-ink-100`} aria-label={pinned ? `Unpin ${item.title}` : `Pin ${item.title}`}>
        <Pin className="h-3 w-3" />
      </button>
    </div>
  );
}
