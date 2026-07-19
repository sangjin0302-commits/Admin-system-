/**
 * 포털 API 인증 — 신원은 **세션에서만** 얻는다.
 *
 * 여러 포털 라우트가 사용자 신원을 `?userId=`, `?email=`, `x-portal-user` 헤더,
 * 혹은 요청 본문의 `userId` 에서 읽고 있었다. 이 값들은 전부 호출자가 마음대로
 * 정하는 값이다. 미들웨어 matcher 에 `/api/portal/*` 이 없어 인증 게이트도 없었으므로,
 * 아무나 남의 이메일을 적어 넣어 남의 구독을 해지하거나, 남의 상담 내역을 읽거나,
 * 결제 없이 유료 등급을 받을 수 있었다.
 *
 * 그래서 이 파일은 클라이언트가 보낸 신원 값을 **읽지 않는다**. NextAuth 세션만 본다.
 */

import { NextResponse } from "next/server";

import { auth } from "@/lib/auth/auth";

export type PortalUser = {
  /** PortalClient.id 또는 AdminUser.id */
  id: string;
  email: string;
  /** "portal"(의뢰인) | "admin"(내부 사용자) */
  userType: string;
};

/**
 * 로그인한 포털 사용자를 반환한다. 없으면 null.
 * 라우트에서는 보통 requirePortalUser() 를 쓰고, 이 함수는 선택적 인증에만 쓴다.
 */
export async function getPortalUser(): Promise<PortalUser | null> {
  const session = await auth().catch(() => null);
  const user = session?.user as
    | { id?: string; email?: string | null; userType?: string }
    | undefined;
  if (!user?.id || !user.email) return null;
  return { id: user.id, email: user.email, userType: user.userType ?? "portal" };
}

/**
 * 로그인 필수 라우트용. 미인증이면 401 응답을 그대로 반환한다.
 *
 *   const authed = await requirePortalUser();
 *   if (authed instanceof NextResponse) return authed;
 *   // 여기부터 authed.id / authed.email 사용
 */
export async function requirePortalUser(): Promise<PortalUser | NextResponse> {
  const user = await getPortalUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }
  return user;
}

/**
 * 구독·VIP 서비스가 쓰는 사용자 키. 이메일 기준이며 세션에서만 나온다.
 * (서비스 레이어가 이메일을 키로 저장하고 있어 id 가 아니라 email 을 쓴다.)
 */
export function portalUserKey(user: PortalUser): string {
  return user.email.trim().toLowerCase();
}
