import { prisma } from "@/lib/prisma/client";

export interface MemoTemplate { id: string; title: string; content: string; }

const SETTING_KEY = "admin.memoTemplates";

export async function getMemoTemplates(): Promise<MemoTemplate[]> {
  const row = await prisma.siteSetting.findUnique({ where: { key: SETTING_KEY } });
  if (!row?.value) return [];
  try { return JSON.parse(row.value); } catch { return []; }
}

export async function saveMemoTemplates(templates: MemoTemplate[]) {
  await prisma.siteSetting.upsert({
    where: { key: SETTING_KEY },
    create: { key: SETTING_KEY, value: JSON.stringify(templates) },
    update: { value: JSON.stringify(templates) },
  });
}
