import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { LANGS, NAMESPACES, setI18nOverrides, type Lang } from "@/lib/i18n/locales";

/** SiteSetting key for a lang's override payload. */
function overrideKey(lang: Lang) {
  return `i18n.overrides.${lang}`;
}

/** Read all lang override maps from SiteSetting → { lang: { namespace: { key: value } } } */
async function readAllOverrides(): Promise<
  Partial<Record<Lang, Record<string, Record<string, string>>>>
> {
  const rows = await prisma.siteSetting
    .findMany({ where: { key: { in: LANGS.map(overrideKey) } } })
    .catch(() => []);
  const out: Partial<Record<Lang, Record<string, Record<string, string>>>> = {};
  for (const row of rows) {
    const lang = row.key.replace(/^i18n\.overrides\./, "") as Lang;
    if (!LANGS.includes(lang)) continue;
    try {
      const parsed = JSON.parse(row.value || "{}");
      if (parsed && typeof parsed === "object") {
        out[lang] = parsed as Record<string, Record<string, string>>;
      }
    } catch {
      // skip malformed
    }
  }
  return out;
}

export async function GET() {
  const overrides = await readAllOverrides();
  setI18nOverrides(overrides);
  // Return the raw catalogue + overrides for the admin editor
  const catalogue: Record<string, Record<Lang, Record<string, string>>> = {};
  for (const [ns, bundle] of Object.entries(NAMESPACES)) {
    catalogue[ns] = {
      ko: { ...bundle.ko },
      en: { ...bundle.en },
      zh: { ...bundle.zh },
    };
  }
  return NextResponse.json({ ok: true, catalogue, overrides });
}

interface PutBody {
  namespace?: string;
  key?: string;
  values?: Partial<Record<Lang, string>>;
}

export async function PUT(request: Request) {
  const body = (await request.json().catch(() => null)) as PutBody | null;
  if (!body || typeof body !== "object" || !body.namespace || !body.key) {
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });
  }
  if (!(body.namespace in NAMESPACES)) {
    return NextResponse.json({ ok: false, error: "UNKNOWN_NAMESPACE" }, { status: 400 });
  }

  const current = await readAllOverrides();
  for (const lang of LANGS) {
    const nextVal = body.values?.[lang];
    if (nextVal === undefined) continue; // untouched
    const langBucket = (current[lang] ??= {});
    const nsBucket = (langBucket[body.namespace] ??= {});
    if (nextVal === "" || nextVal == null) {
      delete nsBucket[body.key];
      if (Object.keys(nsBucket).length === 0) delete langBucket[body.namespace];
    } else {
      nsBucket[body.key] = nextVal;
    }
  }

  await Promise.all(
    LANGS.map((lang) => {
      const payload = JSON.stringify(current[lang] ?? {});
      return prisma.siteSetting.upsert({
        where: { key: overrideKey(lang) },
        create: { key: overrideKey(lang), value: payload },
        update: { value: payload },
      });
    })
  );

  setI18nOverrides(current);
  return NextResponse.json({ ok: true, overrides: current });
}
