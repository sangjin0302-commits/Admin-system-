import Link from "next/link";
import { notFound } from "next/navigation";

import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { previewDocs, readGeneratedDoc, type DocCategory } from "@/lib/services/self-documentation-service";

export const dynamic = "force-dynamic";

type SearchParams = { category?: string; q?: string };

export default async function PublicDocsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const enabled = await isFeatureEnabled("self_documentation");
  if (!enabled) notFound();

  const params = await searchParams;
  const raw = (params.category ?? "feature") as string;
  const category: DocCategory = (["feature", "config", "env"] as const).includes(raw as DocCategory)
    ? (raw as DocCategory)
    : "feature";
  const q = (params.q ?? "").trim().toLowerCase();

  const markdown =
    (await readGeneratedDoc(category)) ?? previewDocs()[category];

  const filtered =
    q.length > 0
      ? markdown
          .split("\n")
          .filter((line) => line.toLowerCase().includes(q))
          .join("\n")
      : markdown;

  const tabs: Array<{ key: DocCategory; label: string }> = [
    { key: "feature", label: "기능" },
    { key: "config", label: "설정" },
    { key: "env", label: "환경" },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">시스템 문서</h1>
      <p className="text-sm text-gray-500">코드 상태에서 자동 생성된 시스템 문서입니다.</p>
      <div className="flex gap-2 border-b">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/docs?category=${t.key}`}
            className={`px-3 py-2 text-sm ${
              category === t.key ? "border-b-2 border-blue-500 font-medium" : "text-gray-500"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>
      <form className="flex gap-2" method="get">
        <input type="hidden" name="category" value={category} />
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="문서 내에서 검색"
          className="flex-1 border rounded px-3 py-2 text-sm"
        />
        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded text-sm">
          검색
        </button>
      </form>
      <pre className="whitespace-pre-wrap text-xs font-mono overflow-auto border rounded p-4 bg-gray-50">
        {filtered || "결과 없음"}
      </pre>
    </div>
  );
}
