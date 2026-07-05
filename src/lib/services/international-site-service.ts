/**
 * 국제 진출 — 지역별 (KR/JP/VN) 사이트 설정.
 * Storage: SiteSetting "international.regions" (Record<Region, RegionConfig>).
 * 기존 i18n locales를 재사용하며, 지역 단위(콘텐츠·통화·연락처)만 추가.
 */

import { prisma } from "@/lib/prisma/client";

export type Region = "kr" | "jp" | "vn";

export interface RegionConfig {
  region: Region;
  enabled: boolean;
  label: string;
  locale: string;
  currency: string;
  phoneFormat: string;
  addressFormat: string;
  contactPhone?: string;
  contactEmail?: string;
  heroTitle?: string;
  heroDescription?: string;
  domain?: string; // ex) jp.ethos-office.kr
}

const KEY = "international.regions";

export const DEFAULT_REGIONS: Record<Region, RegionConfig> = {
  kr: {
    region: "kr",
    enabled: true,
    label: "대한민국",
    locale: "ko-KR",
    currency: "KRW",
    phoneFormat: "0##-####-####",
    addressFormat: "시/도 시/군/구 도로명 상세",
    heroTitle: "행정 문제, 사람의 마음까지",
    heroDescription: "비자·행정심판·계약서·인허가·법인 설립을 ETHOS 원칙으로.",
  },
  jp: {
    region: "jp",
    enabled: false,
    label: "日本",
    locale: "ja-JP",
    currency: "JPY",
    phoneFormat: "0#-####-####",
    addressFormat: "都道府県 市区町村 番地",
    heroTitle: "行政の悩み、その人の想いまで",
    heroDescription: "在留資格・行政不服審査・契約書・許認可・法人設立。",
  },
  vn: {
    region: "vn",
    enabled: false,
    label: "Việt Nam",
    locale: "vi-VN",
    currency: "VND",
    phoneFormat: "0## ### ####",
    addressFormat: "Tỉnh/Thành phố Quận/Huyện Địa chỉ",
    heroTitle: "Giải quyết hành chính, thấu hiểu tâm tư",
    heroDescription: "Thị thực, khiếu nại hành chính, hợp đồng, cấp phép, thành lập công ty.",
  },
};

async function readJson<T>(key: string, fallback: T): Promise<T> {
  const row = await prisma.siteSetting.findUnique({ where: { key } }).catch(() => null);
  if (!row?.value) return fallback;
  try {
    return JSON.parse(row.value) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(key: string, value: unknown): Promise<void> {
  const v = JSON.stringify(value);
  await prisma.siteSetting.upsert({
    where: { key },
    create: { key, value: v },
    update: { value: v },
  });
}

export async function getAllRegions(): Promise<Record<Region, RegionConfig>> {
  const stored = await readJson<Partial<Record<Region, RegionConfig>>>(KEY, {});
  return {
    kr: { ...DEFAULT_REGIONS.kr, ...(stored.kr ?? {}) },
    jp: { ...DEFAULT_REGIONS.jp, ...(stored.jp ?? {}) },
    vn: { ...DEFAULT_REGIONS.vn, ...(stored.vn ?? {}) },
  };
}

export async function getRegion(region: Region): Promise<RegionConfig> {
  const all = await getAllRegions();
  return all[region];
}

export async function updateRegion(region: Region, patch: Partial<RegionConfig>): Promise<RegionConfig> {
  const stored = await readJson<Partial<Record<Region, RegionConfig>>>(KEY, {});
  const current = { ...DEFAULT_REGIONS[region], ...(stored[region] ?? {}) };
  const next: RegionConfig = { ...current, ...patch, region };
  stored[region] = next;
  await writeJson(KEY, stored);
  return next;
}

export function isRegionCode(input: string): input is Region {
  return input === "kr" || input === "jp" || input === "vn";
}

export function formatCurrency(amount: number, region: Region): string {
  const cfg = DEFAULT_REGIONS[region];
  try {
    return new Intl.NumberFormat(cfg.locale, { style: "currency", currency: cfg.currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${amount} ${cfg.currency}`;
  }
}
