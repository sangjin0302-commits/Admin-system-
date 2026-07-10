import Link from "next/link";
import { Card } from "@/components/ui/card";
import { getAllContent } from "@/lib/services/site-content-service";
import { CONTENT_KEYS, groupContentKeys } from "@/lib/services/site-content-keys";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { ContentEditorClient } from "./content-editor-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "콘텐츠 편집 — 관리자"
};

export default async function AdminContentEditorPage() {
  const enabled = await isFeatureEnabled("site_content_editor");

  if (!enabled) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <p className="ui-kicker">Content CMS</p>
          <h1 className="mt-2 ui-page-title">웹페이지 콘텐츠 편집</h1>
          <p className="mt-2 text-sm text-text-muted">
            이 기능은 현재 비활성 상태입니다. <Link href="/admin/features" className="underline">기능 플래그</Link>에서
            <code className="mx-1 rounded bg-line/40 px-1 py-0.5 text-xs">site_content_editor</code>를 켠 뒤 사용하세요.
          </p>
        </Card>
      </div>
    );
  }

  const [extendedOn, imageOn] = await Promise.all([
    isFeatureEnabled("cms_extended").catch(() => true),
    isFeatureEnabled("cms_image_upload").catch(() => true)
  ]);

  const baseSections = new Set(["홈 · 히어로", "홈 · CTA", "홈 · 상단 스트립", "서비스", "푸터", "연락처"]);

  const values = await getAllContent();
  const grouped = groupContentKeys();
  const filtered = Object.entries(grouped).filter(([section, items]) => {
    const isBase = baseSections.has(section);
    const isImage = items[0]?.type === "image";
    if (isImage) return imageOn;
    if (isBase) return true;
    return extendedOn;
  });
  const sections = filtered.map(([section, items]) => ({
    section,
    items: items.map((it) => ({
      key: it.key,
      label: it.label,
      type: it.type,
      hint: it.hint,
      default: it.default,
      value: values[it.key] ?? it.default
    }))
  }));

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <p className="ui-kicker">Content CMS</p>
        <h1 className="mt-2 ui-page-title">웹페이지 콘텐츠 편집</h1>
        <p className="mt-2 text-sm text-text-muted">
          홈페이지·서비스·푸터의 주요 문구를 직접 편집합니다. 저장 즉시 반영됩니다. 총 {CONTENT_KEYS.length}개 항목.
        </p>
        <div className="mt-3">
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1 text-xs text-primary underline underline-offset-2"
          >
            홈페이지 새 창에서 보기 →
          </Link>
        </div>
      </Card>

      <ContentEditorClient sections={sections} />
    </div>
  );
}
