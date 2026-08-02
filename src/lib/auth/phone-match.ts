/**
 * 전화번호 비교용 정규화 — 숫자만 남기고 마지막 8자리를 반환.
 * 국가코드(+82)·하이픈·공백·선행 0 차이를 흡수한다(국내 휴대폰 뒤 8자리는 고유).
 * 유효 숫자가 8자리 미만이면 매칭 불가로 보고 빈 문자열 반환.
 */
export function phoneTail(raw: string | null | undefined): string {
  const digits = (raw ?? "").replace(/\D/g, "");
  if (digits.length < 8) return "";
  return digits.slice(-8);
}

/** 두 전화번호가 같은 회선인지(뒤 8자리 일치). 둘 중 하나라도 무효면 false. */
export function samePhone(a: string | null | undefined, b: string | null | undefined): boolean {
  const ta = phoneTail(a);
  const tb = phoneTail(b);
  return ta !== "" && ta === tb;
}
