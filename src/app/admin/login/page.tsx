import { redirect } from "next/navigation";

import { Card } from "@/components/ui/card";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { getOptionalAdminSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getOptionalAdminSession();
  const params = await searchParams;
  const next =
    typeof params.next === "string" && params.next.startsWith("/admin") ? params.next : "/admin";

  if (session) {
    redirect(next);
  }

  return (
    <div className="mx-auto max-w-md">
      <Card className="ui-stat-card p-6">
        <p className="ui-kicker">Admin Sign In</p>
        <h2 className="mt-2 ui-page-title">관리자 로그인</h2>
        <p className="ui-section-copy mt-2">
          관리자 영역 접근을 위해 로그인해 주세요.
        </p>
        <div className="mt-6">
          <AdminLoginForm nextPath={next} />
        </div>
      </Card>
    </div>
  );
}
