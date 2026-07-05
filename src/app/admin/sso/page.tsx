import { listSsoConfigs } from "@/lib/services/enterprise-sso-service";
import { SsoAdminClient } from "./client";

export const dynamic = "force-dynamic";
export const metadata = { title: "SSO 관리 · Admin" };

export default async function AdminSsoPage() {
  const configs = await listSsoConfigs();
  return (
    <section className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="font-serif text-2xl font-bold text-primary">기업 SSO 관리</h1>
      <p className="mt-2 text-sm text-text-muted">
        OIDC 기반 기업 로그인을 조직별로 설정하고 도메인 매칭을 관리합니다.
      </p>
      <div className="mt-8">
        <SsoAdminClient initial={configs} />
      </div>
    </section>
  );
}
