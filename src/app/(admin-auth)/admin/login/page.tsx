import { Suspense } from "react";

import { isAdminSessionConfigured } from "@/lib/security/admin-session";
import { AdminLoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "관리자 로그인 — 에토스 행정사사무소(ETHOS)",
  robots: { index: false, follow: false }
};

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-muted px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <p className="font-serif text-xs uppercase tracking-[0.3em] text-gold-deep">ETHOS</p>
          <h1 className="mt-3 font-serif text-2xl font-bold text-primary">관리자 로그인</h1>
          <div className="mt-4 flex items-center justify-center gap-3">
            <span className="h-px w-12 bg-gold" />
            <span className="h-1.5 w-1.5 rotate-45 bg-gold" />
            <span className="h-px w-12 bg-gold" />
          </div>
        </div>

        {isAdminSessionConfigured() ? (
          <Suspense fallback={null}>
            <AdminLoginForm />
          </Suspense>
        ) : (
          <div className="mt-8 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
            <p className="font-bold">폼 로그인이 아직 활성화되지 않았습니다</p>
            <p className="mt-2">
              세션 서명용 비밀키가 없어 브라우저 기본 인증창으로만 로그인할 수 있습니다. Vercel
              환경변수에 <code className="font-mono">ADMIN_SESSION_SECRET</code> 을 추가하고 재배포하면
              이 폼이 활성화됩니다.
            </p>
            <p className="mt-2 font-mono text-xs">생성: openssl rand -base64 32</p>
          </div>
        )}

        <p className="mt-6 text-center text-xs text-text-muted">
          관리자 전용 페이지입니다. 의뢰인은{" "}
          <a href="/portal/signin" className="font-semibold text-primary underline">
            의뢰인 포털
          </a>
          을 이용해 주세요.
        </p>
      </div>
    </main>
  );
}
