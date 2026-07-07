"use client";

import { useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useFeatureFlag } from "@/lib/hooks/use-feature-flag";
import {
  preloadCaseDetail,
  preloadInquiryDetail,
} from "@/lib/services/tab-preload-service";

/**
 * 목록 → 상세로 이동하기 전에 상세 데이터를 미리 프리로드.
 *
 * 사용법:
 *   const { hoverHandler } = usePreloadOnHover(caseId, "case");
 *   <tr onMouseEnter={hoverHandler}>...</tr>
 *
 * - Feature flag: `tab_preload` (꺼져있으면 no-op)
 * - 라우터 prefetch + 데이터 fetch 병행
 * - hover 후 120ms 지연 (엉뚱한 셀 위로 지나가면 취소)
 */
export function usePreloadOnHover(id: string, kind: "case" | "inquiry" = "case") {
  const enabled = useFeatureFlag("tab_preload");
  const router = useRouter();
  const timer = useRef<number | null>(null);

  const clear = useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const hoverHandler = useCallback(() => {
    if (enabled === false || !id) return;
    clear();
    timer.current = window.setTimeout(() => {
      const href = kind === "case" ? `/admin/cases/${id}` : `/admin/inquiries/${id}`;
      try {
        router.prefetch(href);
      } catch {
        /* ignore */
      }
      if (kind === "case") {
        void preloadCaseDetail(id).catch(() => undefined);
      } else {
        void preloadInquiryDetail(id).catch(() => undefined);
      }
    }, 120);
  }, [enabled, id, kind, clear, router]);

  const leaveHandler = useCallback(() => {
    clear();
  }, [clear]);

  return { hoverHandler, leaveHandler };
}
