"use client";

import Image from "next/image";
import { useRef, useState } from "react";

type ImageSlot = {
  key: string;
  label: string;
  hint: string;
  currentUrl: string | null;
};

const SLOTS: Omit<ImageSlot, "currentUrl">[] = [
  { key: "image.logo", label: "사이트 로고", hint: "헤더·홈페이지에 표시되는 로고 (권장: 정사각형 PNG, 512×512 이상)" },
  { key: "image.aboutPhoto", label: "대표 행정사 사진", hint: "소개 페이지에 표시 (권장: 세로형 4:5 비율)" },
  { key: "image.ogImage", label: "OG / 공유 이미지", hint: "SNS 공유 시 표시되는 대표 이미지 (권장: 1200×630)" },
  { key: "image.assocBadge", label: "행정사회 뱃지", hint: "대한행정사회 회원 뱃지 — 업로드 시 푸터에 자동 표시됩니다 (권장: 투명 PNG)" },
];

function UploadCard({ slot }: { slot: ImageSlot }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(slot.currentUrl);
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");

  async function handleFile(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      alert("파일 크기가 5MB를 초과합니다.");
      return;
    }
    setStatus("uploading");
    const fd = new FormData();
    fd.append("key", slot.key);
    fd.append("file", file);
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.ok) {
        setUrl(data.url);
        setStatus("idle");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  async function handleDelete() {
    if (!confirm("이미지를 삭제하시겠습니까?")) return;
    setStatus("uploading");
    try {
      const res = await fetch("/api/admin/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: slot.key }),
      });
      if (res.ok) {
        setUrl(null);
        setStatus("idle");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="rounded-xl border border-line bg-white p-5">
      <p className="text-sm font-semibold text-text-strong">{slot.label}</p>
      <p className="mt-1 text-xs text-text-muted">{slot.hint}</p>

      <div className="mt-4 flex items-start gap-4">
        {/* Preview */}
        <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line bg-surface-muted">
          {url ? (
            <Image src={url} alt={slot.label} width={96} height={96} className="h-full w-full object-contain" unoptimized />
          ) : (
            <span className="text-xs text-text-muted">없음</span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={status === "uploading"}
            className="inline-flex h-9 items-center rounded-lg border border-line bg-surface px-4 text-xs font-semibold text-text-strong transition hover:bg-surface-muted disabled:opacity-50"
          >
            {status === "uploading" ? "업로드 중…" : url ? "변경" : "업로드"}
          </button>
          {url && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={status === "uploading"}
              className="inline-flex h-9 items-center rounded-lg border border-rose-200 bg-rose-50 px-4 text-xs font-semibold text-rose-600 transition hover:bg-rose-100 disabled:opacity-50"
            >
              삭제
            </button>
          )}
          {status === "error" && <p className="text-xs text-rose-600">업로드 실패 — 다시 시도해 주세요</p>}
        </div>
      </div>
    </div>
  );
}

export function SiteImageUpload({ images }: { images: Record<string, string | null> }) {
  const slots: ImageSlot[] = SLOTS.map((s) => ({ ...s, currentUrl: images[s.key] ?? null }));

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-text-strong">이미지 관리</h3>
        <p className="mt-1 text-xs text-text-muted">
          로고, 대표 사진, 공유 이미지를 업로드합니다. 최대 5MB, 이미지 파일만 가능합니다.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {slots.map((s) => (
          <UploadCard key={s.key} slot={s} />
        ))}
      </div>
    </div>
  );
}
