import { logger } from "@/lib/utils/logger";
const API_KEY = process.env.PUBLIC_DATA_API_KEY;

export async function lookupForeignerStatus(passportNo: string): Promise<{
  name?: string;
  nationality?: string;
  stayStatus?: string;
}> {
  if (!API_KEY) {
    return {
      name: "MOCK USER",
      nationality: "VN",
      stayStatus: "E-9",
    };
  }
  try {
    const url = `https://apis.data.go.kr/1170000/foreigner/status?serviceKey=${encodeURIComponent(
      API_KEY
    )}&passportNo=${encodeURIComponent(passportNo)}&_type=json`;
    const res = await fetch(url, { cache: "no-store" });
    const data: any = await res.json();
    const item = data?.response?.body?.items?.item ?? {};
    return {
      name: item.name,
      nationality: item.nationality,
      stayStatus: item.stayStatus,
    };
  } catch (err) {
    logger.error("[public-data] lookupForeignerStatus", err);
    return {};
  }
}

export async function searchLaw(
  keyword: string,
  limit = 10
): Promise<{ title: string; lawNo: string; effectiveDate: string }[]> {
  if (!API_KEY) {
    return [
      {
        title: `${keyword} 관련 모의 법령 1`,
        lawNo: "MOCK-001",
        effectiveDate: "2024-01-01",
      },
      {
        title: `${keyword} 관련 모의 법령 2`,
        lawNo: "MOCK-002",
        effectiveDate: "2023-06-01",
      },
    ].slice(0, limit);
  }
  try {
    const url = `https://apis.data.go.kr/1170000/law/search?serviceKey=${encodeURIComponent(
      API_KEY
    )}&query=${encodeURIComponent(keyword)}&display=${limit}&_type=json`;
    const res = await fetch(url, { cache: "no-store" });
    const data: any = await res.json();
    const items: any[] = data?.response?.body?.items?.item ?? [];
    return items.slice(0, limit).map((it) => ({
      title: it.title ?? "",
      lawNo: it.lawNo ?? "",
      effectiveDate: it.effectiveDate ?? "",
    }));
  } catch (err) {
    logger.error("[public-data] searchLaw", err);
    return [];
  }
}

export async function getCompanyInfo(bizNo: string): Promise<{
  name?: string;
  representative?: string;
  address?: string;
  status?: string;
}> {
  if (!API_KEY) {
    return {
      name: "모의 주식회사",
      representative: "홍길동",
      address: "서울특별시 강남구 테헤란로 123",
      status: "계속사업자",
    };
  }
  try {
    const url = `https://api.odcloud.kr/api/nts-businessman/v1/status?serviceKey=${encodeURIComponent(
      API_KEY
    )}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ b_no: [bizNo] }),
      cache: "no-store",
    });
    const data: any = await res.json();
    const item = data?.data?.[0] ?? {};
    return {
      name: item.tax_type_name ?? item.company_name,
      representative: item.representative,
      address: item.address,
      status: item.b_stt ?? item.b_stt_cd,
    };
  } catch (err) {
    logger.error("[public-data] getCompanyInfo", err);
    return {};
  }
}
