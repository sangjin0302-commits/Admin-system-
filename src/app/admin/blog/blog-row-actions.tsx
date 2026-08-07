"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

/** 블로그 목록 행의 수정/삭제 버튼(클라이언트). 삭제는 확인 후 DELETE API. */
export function BlogRowActions({ id }: { id: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const onDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("이 글을 삭제할까요? 되돌릴 수 없습니다.")) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/admin/blog", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "삭제 실패");
        return;
      }
      toast.success("삭제 완료");
      router.refresh();
    } catch {
      toast.error("삭제 중 오류");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <Link
        href={`/admin/blog/${id}`}
        onClick={(e) => e.stopPropagation()}
        className="rounded border border-line px-2.5 py-1 text-xs font-semibold text-text-strong hover:bg-surface-muted"
      >
        수정
      </Link>
      <button
        type="button"
        onClick={onDelete}
        disabled={deleting}
        className="rounded border border-danger/40 px-2.5 py-1 text-xs font-semibold text-danger hover:bg-danger/10 disabled:opacity-50"
      >
        {deleting ? "삭제…" : "삭제"}
      </button>
    </div>
  );
}
