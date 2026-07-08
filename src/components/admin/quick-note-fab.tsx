"use client";

/**
 * TT2: 빠른 노트 플로팅 버튼 (FAB).
 * 모든 admin 페이지 우하단에 고정. Ctrl+/ 단축키.
 * localStorage 기반 (서버 저장 없음).
 * 최근 노트 5개 유지, textarea 큰 편집기.
 *
 * Feature flag: `quick_note_fab`
 */

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

type Note = { id: string; text: string; at: number };
const LS_KEY = "admin.quick_notes";
const MAX_NOTES = 5;

function loadNotes(): Note[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, MAX_NOTES) : [];
  } catch {
    return [];
  }
}

function saveNotes(list: Note[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(list.slice(0, MAX_NOTES)));
  } catch { /* ignore */ }
}

export function QuickNoteFab({ enabled = true }: { enabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [mounted, setMounted] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setMounted(true);
    setNotes(loadNotes());
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape" && open) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled, open]);

  useEffect(() => {
    if (open && textareaRef.current) textareaRef.current.focus();
  }, [open]);

  const save = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const next: Note[] = [
      { id: `${Date.now()}`, text: trimmed, at: Date.now() },
      ...notes,
    ].slice(0, MAX_NOTES);
    setNotes(next);
    saveNotes(next);
    setText("");
    toast.success("노트 저장됨 (로컬)");
  };

  const remove = (id: string) => {
    const next = notes.filter((n) => n.id !== id);
    setNotes(next);
    saveNotes(next);
  };

  const restore = (n: Note) => {
    setText(n.text);
    textareaRef.current?.focus();
  };

  if (!enabled || !mounted) return null;

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-4 right-20 z-40 hidden h-11 w-11 items-center justify-center rounded-full bg-gold text-white shadow-floating hover:brightness-110 lg:flex"
        aria-label="빠른 노트 (Ctrl+/)"
        title="빠른 노트 (Ctrl+/)"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2">
          <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="absolute bottom-20 right-4 w-[420px] max-w-[95vw] rounded-xl border border-line bg-surface p-4 shadow-floating"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-bold">빠른 노트</h3>
              <span className="text-[10px] text-text-muted">Ctrl+/ 로 열기·닫기 · 로컬 저장</span>
            </div>
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); save(); }
              }}
              placeholder="빠르게 노트를 남기세요. Ctrl+Enter 저장, Esc 닫기."
              className="w-full min-h-[100px] rounded-lg border border-line bg-surface-muted px-3 py-2 text-sm"
            />
            <div className="mt-2 flex items-center justify-end gap-2">
              <button
                onClick={save}
                disabled={!text.trim()}
                className="rounded-full bg-primary px-4 py-1.5 text-xs text-white disabled:opacity-50"
              >
                저장 (Ctrl+Enter)
              </button>
            </div>
            {notes.length > 0 ? (
              <div className="mt-3 border-t border-line pt-2">
                <p className="text-[10px] uppercase tracking-wider text-text-muted">최근 노트</p>
                <ul className="mt-1 space-y-1">
                  {notes.map((n) => (
                    <li key={n.id} className="flex items-start gap-2 rounded border border-line bg-surface p-2 text-xs">
                      <span className="flex-1 whitespace-pre-line text-text">
                        {n.text.length > 200 ? `${n.text.slice(0, 200)}…` : n.text}
                      </span>
                      <div className="flex flex-col gap-1">
                        <button onClick={() => restore(n)} className="text-[10px] text-primary hover:underline">불러오기</button>
                        <button onClick={() => remove(n.id)} className="text-[10px] text-danger hover:underline">삭제</button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}
