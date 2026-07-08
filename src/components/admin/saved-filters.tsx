"use client";

/**
 * XX1: 저장된 필터 (내 뷰) 컴포넌트.
 * 현재 URL(pathname+search)를 이름 붙여 localStorage에 저장.
 * 최대 10개 저장. 클릭 → router.push로 이동.
 *
 * Feature flag: `saved_filter_views`
 */

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

type SavedView = { id: string; name: string; href: string; at: number };
const LS_KEY_PREFIX = "admin.saved_views.";
const MAX_VIEWS = 10;

function loadViews(scope: string): SavedView[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LS_KEY_PREFIX + scope);
    return raw ? (JSON.parse(raw) as SavedView[]).slice(0, MAX_VIEWS) : [];
  } catch { return []; }
}

function saveViews(scope: string, list: SavedView[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LS_KEY_PREFIX + scope, JSON.stringify(list.slice(0, MAX_VIEWS)));
  } catch { /* ignore */ }
}

export function SavedFilters({ scope, enabled = true }: { scope: string; enabled?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [views, setViews] = useState<SavedView[]>([]);
  const [mounted, setMounted] = useState(false);
  const [nameInput, setNameInput] = useState("");

  useEffect(() => {
    setMounted(true);
    setViews(loadViews(scope));
  }, [scope]);

  if (!enabled || !mounted) return null;

  const currentHref = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");
  const currentSaved = views.some((v) => v.href === currentHref);

  const save = () => {
    const name = nameInput.trim() || `뷰 ${views.length + 1}`;
    const next: SavedView[] = [
      { id: `${Date.now()}`, name, href: currentHref, at: Date.now() },
      ...views.filter((v) => v.href !== currentHref),
    ].slice(0, MAX_VIEWS);
    setViews(next);
    saveViews(scope, next);
    setNameInput("");
    toast.success(`"${name}" 저장됨`);
  };

  const remove = (id: string) => {
    const next = views.filter((v) => v.id !== id);
    setViews(next);
    saveViews(scope, next);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-surface-muted p-2">
      <span className="text-[10px] uppercase tracking-wider text-text-muted">내 뷰</span>
      {views.map((v) => (
        <div key={v.id} className="inline-flex items-center gap-1 rounded-full border border-line bg-surface pl-2 pr-1 py-0.5">
          <button
            onClick={() => router.push(v.href)}
            className="text-xs text-text hover:text-primary"
            title={v.href}
          >
            {v.name}
          </button>
          <button
            onClick={() => remove(v.id)}
            className="rounded-full px-1 text-[10px] text-danger hover:bg-surface-muted"
            aria-label={`${v.name} 삭제`}
          >
            ×
          </button>
        </div>
      ))}
      <input
        type="text"
        value={nameInput}
        onChange={(e) => setNameInput(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") save(); }}
        placeholder={currentSaved ? "이미 저장됨" : "현재 필터 이름..."}
        className="rounded-full border border-line bg-surface px-3 py-1 text-xs"
        disabled={currentSaved}
      />
      <button
        onClick={save}
        disabled={currentSaved}
        className="rounded-full bg-primary px-3 py-1 text-xs text-white disabled:opacity-50"
      >
        +저장
      </button>
    </div>
  );
}
