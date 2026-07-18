import { Suspense } from "react";

import { AdminLoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "관리자 로그인 — ETHOS 행정사사무소",
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

        <Suspense fallback={null}>
          <AdminLoginForm />
        </Suspense>

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
