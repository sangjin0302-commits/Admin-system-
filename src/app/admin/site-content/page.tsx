import { prisma } from "@/lib/prisma/client";
import { getSiteSettings, SITE_SETTINGS_LABELS, type SiteSettingsKey } from "@/lib/services/site-settings";

import { SiteContentForm } from "./form";
import { SiteImageUpload } from "./image-upload";

export const dynamic = "force-dynamic";

const IMAGE_KEYS = ["image.logo", "image.aboutPhoto", "image.ogImage", "image.assocBadge"];

export default async function AdminSiteContentPage() {
  const settings = await getSiteSettings();

  const fields = (Object.keys(SITE_SETTINGS_LABELS) as SiteSettingsKey[]).map((key) => ({
    key,
    value: settings[key] ?? "",
    label: SITE_SETTINGS_LABELS[key].label,
    hint: SITE_SETTINGS_LABELS[key].hint,
    multiline: SITE_SETTINGS_LABELS[key].multiline ?? false,
    section: SITE_SETTINGS_LABELS[key].section
  }));

  const imageRows = await prisma.siteSetting.findMany({ where: { key: { in: IMAGE_KEYS } } }).catch(() => []);
  const images: Record<string, string | null> = {};
  for (const row of imageRows) images[row.key] = row.value || null;

  return (
    <section className="rounded-[20px] border border-line bg-surface px-5 py-6 shadow-panel sm:px-7">
      <p className="ui-kicker">홈페이지 운영</p>
      <h2 className="mt-2 text-xl font-semibold text-text-strong">사이트 컨텐츠 관리</h2>
      <p className="mt-2 text-sm text-text-muted">
        홈페이지에 노출되는 소개글, 연락처, 공지, 네이버 블로그 연동을 직접 편집합니다. 비워두면 기본값이 표시됩니다.
      </p>

      <div className="mt-6 space-y-8">
        <SiteImageUpload images={images} />
        <hr className="border-line" />
        <SiteContentForm initialFields={fields} />
      </div>
    </section>
  );
}
