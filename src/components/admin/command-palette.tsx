"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useFeatureFlag } from "@/lib/hooks/use-feature-flag";

type CommandGroup = "page" | "case" | "inquiry" | "flag" | "action";

type CommandItem = {
  id: string;
  group: CommandGroup;
  label: string;
  hint?: string;
  href?: string;
  action?: string;
  aliases?: string[];
  keywords?: string[];
};

const RECENT_STORAGE_KEY = "admin.command_palette.recent";
const MAX_RECENT = 8;
const GROUP_LABEL: Record<CommandGroup, string> = {
  page: "페이지",
  case: "사건",
  inquiry: "문의",
  flag: "설정",
  action: "액션",
};

function fuzzyScore(item: CommandItem, q: string): number {
  if (!q) return 1;
  const needle = q.toLowerCase();
  const haystack = [
    item.label,
    item.hint ?? "",
    ...(item.aliases ?? []),
    ...(item.keywords ?? []),
  ]
    .join(" ")
    .toLowerCase();
  if (haystack.includes(needle)) return 100 - Math.min(needle.length, haystack.indexOf(needle));
  // subsequence match
  let hi = 0;
  let score = 0;
  for (const ch of needle) {
    const idx = haystack.indexOf(ch, hi);
    if (idx < 0) return 0;
    score += 1;
    hi = idx + 1;
  }
  return score;
}

function loadRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

function saveRecent(list: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(list.slice(0, MAX_RECENT)));
  } catch {
    /* ignore */
  }
}

export function CommandPalette() {
  const enabled = useFeatureFlag("command_palette");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [items, setItems] = useState<CommandItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [active, setActive] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Global Cmd/Ctrl+K binding
  useEffect(() => {
    if (enabled === false) return;
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled]);

  // Load index once, on first open
  useEffect(() => {
    if (!open || loaded) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/command-index", { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!cancelled && Array.isArray(data?.items)) {
          setItems(data.items);
          setLoaded(true);
        }
      } catch (err) {
        if (!cancelled) setError((err as Error).message ?? "인덱스 로드 실패");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, loaded]);

  useEffect(() => {
    if (open) {
      setRecent(loadRecent());
      setTimeout(() => inputRef.current?.focus(), 30);
      setActive(0);
    }
  }, [open]);

  const filtered = useMemo(() => {
    if (!items.length) return [] as CommandItem[];
    if (!q.trim()) {
      // no query → show recent first, then all pages/actions/flags/recent
      const recentItems = recent
        .map((id) => items.find((i) => i.id === id))
        .filter((v): v is CommandItem => Boolean(v));
      const rest = items.filter((i) => !recent.includes(i.id));
      return [...recentItems, ...rest].slice(0, 40);
    }
    const scored = items
      .map((it) => ({ it, s: fuzzyScore(it, q.trim()) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s);
    return scored.slice(0, 40).map((x) => x.it);
  }, [items, q, recent]);

  useEffect(() => {
    if (active >= filtered.length) setActive(0);
  }, [filtered.length, active]);

  async function runAction(action: string) {
    if (action === "refresh_flags") {
      try {
        await fetch("/api/public/features", { cache: "no-store" });
      } catch {
        /* ignore */
      }
      return;
    }
    if (action.startsWith("toggle_flag:")) {
      const key = action.slice("toggle_flag:".length);
      try {
        await fetch("/api/admin/features/toggle", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ key }),
        });
      } catch (err) {
        setError((err as Error).message ?? "플래그 토글 실패");
      }
    }
  }

  function pushRecent(id: string) {
    const next = [id, ...recent.filter((r) => r !== id)].slice(0, MAX_RECENT);
    setRecent(next);
    saveRecent(next);
  }

  async function activate(item: CommandItem) {
    pushRecent(item.id);
    setOpen(false);
    if (item.href) {
      router.push(item.href);
      return;
    }
    if (item.action) {
      await runAction(item.action);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const it = filtered[active];
      if (it) void activate(it);
    }
  }

  if (enabled === false) return null;
  if (!open) return null;

  // Group results
  const groups: Record<CommandGroup, CommandItem[]> = {
    page: [],
    case: [],
    inquiry: [],
    action: [],
    flag: [],
  };
  filtered.forEach((it) => groups[it.group].push(it));
  const orderedGroups: CommandGroup[] = ["page", "case", "inquiry", "action", "flag"];

  let flatIndex = 0;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/40 p-4 pt-24"
      role="dialog"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-line bg-surface shadow-panel">
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="검색 (페이지·사건·문의·플래그·액션)"
          className="w-full border-b border-line bg-transparent px-4 py-3 text-sm text-text-strong outline-none placeholder:text-text-muted"
        />
        <div className="max-h-[60vh] overflow-y-auto py-2">
          {!q && recent.length > 0 && (
            <div className="px-4 py-1 text-xs uppercase tracking-wider text-text-muted">최근 사용</div>
          )}
          {orderedGroups.map((g) => {
            const list = groups[g];
            if (!list.length) return null;
            return (
              <div key={g}>
                <div className="mt-2 px-4 py-1 text-xs uppercase tracking-wider text-text-muted">
                  {GROUP_LABEL[g]}
                </div>
                {list.map((it) => {
                  const idx = flatIndex++;
                  const isActive = idx === active;
                  return (
                    <button
                      key={it.id}
                      type="button"
                      className={`flex w-full items-start gap-3 px-4 py-2 text-left text-sm ${
                        isActive ? "bg-surface-muted" : "hover:bg-surface-muted"
                      }`}
                      onMouseEnter={() => setActive(idx)}
                      onClick={() => void activate(it)}
                    >
                      <span className="flex-1">
                        <span className="block font-medium text-text-strong">{it.label}</span>
                        {it.hint && <span className="mt-0.5 block text-xs text-text-muted">{it.hint}</span>}
                      </span>
                      {it.href && <span className="text-xs text-text-muted">↵</span>}
                    </button>
                  );
                })}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="px-4 py-6 text-sm text-text-muted">일치하는 항목이 없습니다.</div>
          )}
          {error && <div className="px-4 py-2 text-xs text-danger">{error}</div>}
        </div>
        <div className="border-t border-line px-4 py-2 text-xs text-text-muted">
          ↑↓ 이동 · ↵ 실행 · Esc 닫기 · Cmd/Ctrl+K 토글
        </div>
      </div>
    </div>
  );
}
