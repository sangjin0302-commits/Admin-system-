export const CUSTOMER_TRACKING_NOTICE_TRACK_URL = "https://adminofficemvp2.vercel.app/track";

export const CUSTOMER_TRACKING_NOTICE_EMPTY_MESSAGE =
  "고객용 접수번호가 있는 접수에서만 안내문을 만들 수 있습니다.";

export type CustomerTrackingNoticeTemplateInput = {
  trackingCode: string | null | undefined;
  trackUrl?: string;
};

export function normalizeCustomerTrackingCode(value: string | null | undefined) {
  const normalized = (value ?? "").trim().toUpperCase();
  return normalized || null;
}

export function buildCustomerTrackingNoticeTemplate(input: CustomerTrackingNoticeTemplateInput) {
  const trackingCode = normalizeCustomerTrackingCode(input.trackingCode);
  if (!trackingCode) return null;

  const trackUrl = input.trackUrl?.trim() || CUSTOMER_TRACKING_NOTICE_TRACK_URL;

  return [
    "접수가 완료되었습니다. 담당자가 확인 후 연락드리겠습니다.",
    "",
    `접수번호: ${trackingCode}`,
    `진행상황 확인: ${trackUrl}`,
    "",
    "진행상황은 접수번호와 접수 시 남겨주신 휴대폰 번호 뒤 4자리로 조회할 수 있습니다.",
    "휴대폰 홈 화면에 추가해두면 접수 진행상황을 앱처럼 빠르게 확인할 수 있습니다.",
    "",
    "iPhone: 공유 버튼을 누른 뒤 \"홈 화면에 추가\"를 선택하세요.",
    "Android: 브라우저 메뉴를 누른 뒤 \"홈 화면에 추가\"를 선택하세요."
  ].join("\n");
}
