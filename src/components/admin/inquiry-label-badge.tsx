"use client";

const LABEL_COLOR: Record<string, string> = {
  요구: "bg-blue-100 text-blue-800",
  공포: "bg-red-100 text-red-800",
  불만: "bg-orange-100 text-orange-800",
  문의: "bg-emerald-100 text-emerald-800",
};

/**
 * 자동 라벨링 결과 배지.
 *
 * 예전에는 이 컴포넌트가 스스로 `/api/admin/inquiries/{id}/labels` 를 GET 했다.
 * 그 라우트에는 GET 핸들러가 없어(POST 전용) 매번 405 를 받았고, 응답을
 * `json.data` 로 읽는 오류까지 겹쳐 배지는 영구히 아무것도 표시하지 못했다.
 *
 * 이제 라벨은 Inquiry 에 저장되고, 목록 페이지가 이미 그 값을 들고 있으므로
 * props 로 받는다. 행마다 요청을 보내지 않는다 — 50행짜리 목록에서 요청 50개가
 * 나가던 구조를 없앤다.
 */
export function InquiryLabelBadge({
  labels,
  enabled = true,
}: {
  /** Inquiry.autoLabels (JSON 문자열) 또는 이미 파싱된 배열 */
  labels?: string | string[] | null;
  enabled?: boolean;
}) {
  if (!enabled) return null;

  let list: string[] = [];
  if (Array.isArray(labels)) {
    list = labels.filter((l): l is string => typeof l === "string");
  } else if (typeof labels === "string" && labels.trim()) {
    try {
      const parsed = JSON.parse(labels);
      if (Array.isArray(parsed)) list = parsed.filter((l): l is string => typeof l === "string");
    } catch {
      // 저장값이 깨졌으면 표시하지 않는다.
    }
  }

  if (list.length === 0) return null;

  return (
    <span className="ml-1 inline-flex items-center gap-0.5">
      {list.map((l) => (
        <span
          key={l}
          className={`inline-block rounded px-1 py-0.5 text-[10px] font-medium leading-none ${LABEL_COLOR[l] ?? "bg-gray-100 text-gray-700"}`}
        >
          {l}
        </span>
      ))}
    </span>
  );
}
