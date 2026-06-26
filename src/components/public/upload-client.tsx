"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type ChangeEvent, type DragEvent } from "react";

const ACCEPT = ".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xlsx";
const ACCEPT_RE = /\.(pdf|png|jpg|jpeg|webp|doc|docx|xlsx)$/i;

type Item = { file: File; status: "pending" | "uploading" | "done" | "error"; message?: string };

export function UploadClient() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function addFiles(files: FileList | File[]) {
    const arr = Array.from(files).filter((f) => ACCEPT_RE.test(f.name));
    if (arr.length === 0) return;
    setItems((prev) => [...prev, ...arr.map((file) => ({ file, status: "pending" as const }))]);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer?.files) addFiles(e.dataTransfer.files);
  }

  function onDragOver(e: DragEvent) {
    e.preventDefault();
    setDragging(true);
  }

  function onSelect(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files) addFiles(e.target.files);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function uploadOne(idx: number) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, status: "uploading" } : it)));
    const fd = new FormData();
    fd.append("file", items[idx].file);
    try {
      const res = await fetch("/api/portal/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!data.ok) {
        setItems((prev) =>
          prev.map((it, i) => (i === idx ? { ...it, status: "error", message: data.error ?? "실패" } : it))
        );
        return false;
      }
      setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, status: "done", message: data.file?.fileName } : it)));
      return true;
    } catch {
      setItems((prev) =>
        prev.map((it, i) => (i === idx ? { ...it, status: "error", message: "네트워크 오류" } : it))
      );
      return false;
    }
  }

  async function uploadAll() {
    for (let i = 0; i < items.length; i++) {
      if (items[i].status === "pending") {
        await uploadOne(i);
      }
    }
    router.refresh();
  }

  function remove(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  const pending = items.filter((i) => i.status === "pending").length;

  return (
    <div className="ethos-card mt-8 p-6">
      {/* Drop zone */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={() => setDragging(false)}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed py-12 text-center transition ${
          dragging ? "border-gold bg-gold-soft/30" : "border-gold/40 bg-gold-soft/10 hover:bg-gold-soft/20"
        }`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-12 w-12 text-gold-deep">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
        </svg>
        <p className="mt-3 font-serif text-base font-bold text-primary">
          파일을 여기로 끌어다 놓거나 클릭해서 선택
        </p>
        <p className="mt-1 text-xs text-text-muted">PDF · 이미지 · Word · Excel (한 번에 여러 파일 가능)</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT}
          onChange={onSelect}
          className="hidden"
        />
      </div>

      {/* File queue */}
      {items.length > 0 && (
        <ul className="mt-5 space-y-2">
          {items.map((it, i) => (
            <li
              key={i}
              className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 ${
                it.status === "done"
                  ? "border-emerald-200 bg-emerald-50"
                  : it.status === "error"
                    ? "border-red-200 bg-red-50"
                    : "border-line bg-surface"
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-text-strong">{it.file.name}</p>
                <p className="text-[11px] text-text-muted">
                  {(it.file.size / 1024).toFixed(1)} KB
                  {it.message && ` · ${it.message}`}
                </p>
              </div>
              <span className="shrink-0 text-xs font-bold">
                {it.status === "done" && <span className="text-emerald-700">✓ 완료</span>}
                {it.status === "uploading" && <span className="text-gold-deep">업로드 중…</span>}
                {it.status === "error" && <span className="text-red-700">실패</span>}
                {it.status === "pending" && (
                  <button onClick={() => remove(i)} type="button" className="text-text-muted hover:text-red-700">
                    삭제
                  </button>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* Action buttons */}
      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={uploadAll}
          disabled={pending === 0}
          className="inline-flex h-11 flex-1 items-center justify-center rounded-lg bg-primary font-serif text-sm font-bold text-white transition hover:bg-text-strong disabled:opacity-50"
        >
          {pending > 0 ? `${pending}개 업로드 시작` : "업로드할 파일 추가"}
        </button>
        <Link
          href="/portal"
          className="inline-flex h-11 items-center justify-center rounded-lg border border-line px-5 text-sm font-medium text-text-muted hover:bg-surface-muted"
        >
          ← 대시보드
        </Link>
      </div>
    </div>
  );
}
