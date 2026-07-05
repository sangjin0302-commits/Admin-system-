import { listPurchases, listWhitepapers } from "@/lib/services/whitepaper-service";
import { WhitepapersAdminClient } from "./client";

export const dynamic = "force-dynamic";
export const metadata = { title: "백서 관리 · Admin" };

export default async function AdminWhitepapersPage() {
  const [items, purchases] = await Promise.all([listWhitepapers(), listPurchases()]);
  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-serif text-2xl font-bold text-primary">AI 법률 백서 관리</h1>
      <div className="mt-8">
        <WhitepapersAdminClient initialItems={items} initialPurchases={purchases} />
      </div>
    </section>
  );
}
