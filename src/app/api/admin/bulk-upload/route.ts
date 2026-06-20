import { NextResponse } from "next/server";

import { createInquiry } from "@/lib/services/inquiry-service";
import { logger } from "@/lib/utils/logger";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
    }

    const text = await file.text();
    const rows = parseCSV(text);

    if (rows.length === 0) {
      return NextResponse.json({ error: "데이터가 없습니다." }, { status: 400 });
    }

    const errors: string[] = [];
    let created = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        await createInquiry({
          name: row.name ?? row["이름"] ?? "",
          email: row.email ?? row["이메일"] ?? "",
          phone: row.phone ?? row["전화"] ?? row["연락처"] ?? "",
          inquiryType: row.inquiryType ?? row["유형"] ?? "GENERAL",
          message: row.message ?? row["내용"] ?? row["메시지"] ?? "",
          serviceCategory: row.serviceCategory ?? row["분야"] ?? undefined,
        });
        created++;
      } catch (err) {
        errors.push(`행 ${i + 2}: ${err instanceof Error ? err.message : "등록 실패"}`);
      }
    }

    return NextResponse.json({
      total: rows.length,
      created,
      errors,
    });
  } catch (err) {
    logger.error("Bulk upload error:", err);
    return NextResponse.json({ error: "업로드 처리 실패" }, { status: 500 });
  }
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = splitCSVLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = splitCSVLine(line);
    const record: Record<string, string> = {};
    headers.forEach((h, i) => {
      record[h.trim()] = (values[i] ?? "").trim();
    });
    return record;
  });
}

function splitCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}
