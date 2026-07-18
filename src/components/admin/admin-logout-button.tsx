"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * 세션 로그인으로 들어온 경우의 로그아웃 버튼.
 * Basic Auth로 들어온 경우 쿠키가 없어도 호출은 무해하며,
 * 브라우저 기본 인증은 브라우저를 닫아야 해제된다는 점을 안내한다.
 */
export function AdminLogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onLogout() {
    setBusy(true);
    try {
      await fetch("/api/admin-auth/logout", { method: "POST" });
      router.replace("/admin/login");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onLogout}
      disabled={busy}
      title="관리자 세션 종료"
      className="shrink-0 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-text-muted transition hover:bg-surface-muted hover:text-text disabled:opacity-60"
    >
      {busy ? "종료 중…" : "로그아웃"}
    </button>
  );
}
