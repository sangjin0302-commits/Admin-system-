import { getSiteSettings, SITE_SETTINGS_LABELS, type SiteSettingsKey } from "@/lib/services/site-settings";

import { SiteContentForm } from "../site-content/form";

export const dynamic = "force-dynamic";

// 서비스별 편집 가능 필드(순서) + 섹션 라벨.
const SERVICES: { key: string; section: string }[] = [
  { key: "immigration", section: "비자 / 외국인 체류" },
  { key: "appeal", section: "행정심판" },
  { key: "contract", section: "계약서 / 사실조사" },
  { key: "license", section: "인허가" },
  { key: "corporate", section: "법인 설립" },
];

// 각 서비스에서 편집하는 필드(렌더 순서).
const FIELD_ORDER = ["title", "tagline", "desc", "whoFor", "documents", "faq", "process", "deadlines"];

export default async function AdminServicesPage() {
  const settings = await getSiteSettings();

  const fields = SERVICES.flatMap((svc) =>
    FIELD_ORDER.map((field) => {
      const key = `services.${svc.key}.${field}` as SiteSettingsKey;
      const meta = SITE_SETTINGS_LABELS[key];
      return {
        key,
        value: settings[key] ?? "",
        label: meta.label,
        hint: meta.hint,
        multiline: meta.multiline ?? false,
        section: svc.section,
      };
    })
  );

  return (
    <section className="rounded-[20px] border border-line bg-surface px-5 py-6 shadow-panel sm:px-7">
      <p className="ui-kicker">서비스 편집</p>
      <h2 className="mt-2 text-xl font-semibold text-text-strong">서비스 상세 페이지 관리</h2>
      <p className="mt-2 text-sm text-text-muted">
        각 서비스(업무분야) 상세 페이지의 제목·소개·대상·자료·FAQ·절차·기한을 직접 편집합니다.
        비워두면 기본 문구가 표시됩니다. 목록형(대상/자료)은 한 줄에 하나, FAQ·절차·기한은 &quot;앞 :: 뒤&quot; 형식으로 입력하세요.
      </p>

      <div className="mt-6">
        <SiteContentForm initialFields={fields} />
      </div>
    </section>
  );
}
