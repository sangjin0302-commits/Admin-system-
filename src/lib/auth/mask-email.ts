/** 이메일 로컬파트를 부분 마스킹. 예: attorney@gmail.com → at****@gmail.com */
export function maskEmail(email: string): string {
  const at = email.indexOf("@");
  if (at <= 0) return "***";
  const local = email.slice(0, at);
  const domain = email.slice(at); // "@gmail.com"
  // 로컬파트가 2자 이하면 아무것도 노출하지 않는다(짧은 아이디 전체노출 방지).
  if (local.length <= 2) return `**${domain}`;
  const shown = local.slice(0, 2);
  return `${shown}${"*".repeat(Math.max(3, local.length - 2))}${domain}`;
}
