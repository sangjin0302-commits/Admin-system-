"use client";

import { usePathname } from "next/navigation";

/**
 * 고객용 위젯을 공개 페이지에서만 렌더합니다.
 * /admin, /portal 은 업무 화면이라 고객 대상 오버레이가 뜨면 안 됩니다.
 */
export function PublicOnly({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  if (pathname.startsWith("/admin") || pathname.startsWith("/portal")) {
    return null;
  }
  return <>{children}</>;
}
