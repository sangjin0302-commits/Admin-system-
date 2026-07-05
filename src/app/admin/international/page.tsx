import { listShippingRequests } from "@/lib/services/document-shipping-service";
import { listRequests as listNotary } from "@/lib/services/notary-integration-service";
import { InternationalAdminClient } from "./client";

export const dynamic = "force-dynamic";
export const metadata = { title: "국제 서비스 관리 · Admin" };

export default async function AdminInternationalPage() {
  const [shipping, notary] = await Promise.all([listShippingRequests(), listNotary()]);
  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-serif text-2xl font-bold text-primary">국제 배송 · 공증 관리</h1>
      <p className="mt-2 text-sm text-text-muted">대기 중인 요청 큐를 처리하고 상태를 갱신합니다.</p>
      <div className="mt-8">
        <InternationalAdminClient initialShipping={shipping} initialNotary={notary} />
      </div>
    </section>
  );
}
