/**
 * PDF 생성 헬퍼 (pdf-lib)
 *
 * 한글 폰트: 시스템에 Pretendard / Noto Sans KR 폰트 파일(.ttf)이 필요.
 * env: PDF_KOREAN_FONT_PATH — 기본 ./fonts/NotoSansKR-Regular.ttf
 *
 * 폰트가 없으면 영문/숫자만 정상 출력되며 한글은 누락될 수 있음.
 */

import { readFile } from "node:fs/promises";
import path from "node:path";

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { logger } from "@/lib/utils/logger";

const NAVY = rgb(26 / 255, 60 / 255, 95 / 255);
const GOLD = rgb(201 / 255, 169 / 255, 97 / 255);
const MUTED = rgb(110 / 255, 100 / 255, 84 / 255);

export type PdfSection = { heading: string; body: string };

export type ContractPdfInput = {
  title: string;
  clientName: string;
  caseNo?: string;
  date: string;          // "2026-06-13"
  sections: readonly PdfSection[];
  signature?: string;    // 행정사 이름
};

export type GenericDocPdfInput = ContractPdfInput;

// CDN fallback: 한글 TTF (jsDelivr — Google Fonts 미러). 로컬 폰트가 없을 때 사용.
const KOREAN_FONT_CDN =
  process.env.PDF_KOREAN_FONT_URL ??
  "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/nanumgothic/NanumGothic-Regular.ttf";

let cachedFontBytes: Uint8Array | null = null;

async function loadKoreanFont(): Promise<Uint8Array | Buffer | null> {
  if (cachedFontBytes) return cachedFontBytes;

  // 1) 로컬 폰트 파일 우선
  const envPath = process.env.PDF_KOREAN_FONT_PATH;
  const candidates = [
    envPath,
    path.join(process.cwd(), "fonts/NotoSansKR-Regular.ttf"),
    path.join(process.cwd(), "fonts/NotoSansKR-Regular.otf"),
    path.join(process.cwd(), "fonts/NanumGothic-Regular.ttf"),
    path.join(process.cwd(), "fonts/Pretendard-Regular.ttf")
  ].filter((p): p is string => Boolean(p));

  for (const file of candidates) {
    try {
      const data = await readFile(file);
      cachedFontBytes = data;
      return data;
    } catch {
      continue;
    }
  }

  // 2) CDN fallback (런타임 1회 fetch 후 모듈 캐시)
  try {
    const res = await fetch(KOREAN_FONT_CDN);
    if (res.ok) {
      const buf = new Uint8Array(await res.arrayBuffer());
      cachedFontBytes = buf;
      return buf;
    }
  } catch (error) {
    logger.warn("[pdf] korean font CDN fetch failed", error);
  }

  return null;
}

export async function generateContractPdf(input: ContractPdfInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);

  const koreanFontData = await loadKoreanFont();
  const font = koreanFontData
    ? await pdf.embedFont(koreanFontData)
    : await pdf.embedFont(StandardFonts.Helvetica);

  const page = pdf.addPage([595, 842]); // A4
  const { width } = page.getSize();
  const margin = 60;
  let cursorY = 800;

  // ETHOS 헤더
  page.drawText("ETHOS", {
    x: margin,
    y: cursorY,
    size: 22,
    font,
    color: NAVY
  });
  page.drawText("Administrative Attorney Office", {
    x: margin,
    y: cursorY - 18,
    size: 9,
    font,
    color: MUTED
  });
  // 골드 라인
  page.drawLine({
    start: { x: margin, y: cursorY - 28 },
    end: { x: width - margin, y: cursorY - 28 },
    thickness: 1,
    color: GOLD
  });
  cursorY -= 60;

  // 제목
  page.drawText(input.title, {
    x: margin,
    y: cursorY,
    size: 18,
    font,
    color: NAVY
  });
  cursorY -= 30;

  // 메타
  const meta = [
    `의뢰인: ${input.clientName}`,
    input.caseNo ? `사건번호: ${input.caseNo}` : "",
    `작성일: ${input.date}`
  ].filter(Boolean);
  for (const line of meta) {
    page.drawText(line, { x: margin, y: cursorY, size: 10, font, color: MUTED });
    cursorY -= 14;
  }
  cursorY -= 16;

  // 본문 섹션
  for (const sec of input.sections) {
    if (cursorY < 100) {
      cursorY = 800;
      pdf.addPage([595, 842]);
    }
    page.drawText(sec.heading, { x: margin, y: cursorY, size: 12, font, color: NAVY });
    cursorY -= 18;
    const wrapped = wrapText(sec.body, 80);
    for (const line of wrapped) {
      page.drawText(line, { x: margin, y: cursorY, size: 10, font, color: rgb(0.2, 0.2, 0.2) });
      cursorY -= 14;
    }
    cursorY -= 12;
  }

  // 서명
  if (input.signature) {
    cursorY -= 20;
    page.drawText(`행정사 ${input.signature}`, {
      x: width - margin - 150,
      y: cursorY,
      size: 11,
      font,
      color: NAVY
    });
  }

  return pdf.save();
}

export async function generateGenericDocPdf(input: GenericDocPdfInput): Promise<Uint8Array> {
  return generateContractPdf(input);
}

export type BriefingItem = { priorityLabel: string; title: string; detail: string };
export type BriefingPdfInput = {
  date: string;
  metricsLine: string;
  items: readonly BriefingItem[];
};

/** 운영 참모 일일 브리핑 PDF. */
export async function generateBriefingPdf(input: BriefingPdfInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const koreanFontData = await loadKoreanFont();
  const font = koreanFontData
    ? await pdf.embedFont(koreanFontData)
    : await pdf.embedFont(StandardFonts.Helvetica);

  let page = pdf.addPage([595, 842]);
  const { width } = page.getSize();
  const margin = 56;
  let y = 800;

  page.drawText("ETHOS", { x: margin, y, size: 20, font, color: NAVY });
  page.drawText("운영 브리핑", { x: width - margin - 90, y, size: 18, font, color: NAVY });
  page.drawLine({ start: { x: margin, y: y - 26 }, end: { x: width - margin, y: y - 26 }, thickness: 1, color: GOLD });
  y -= 50;

  page.drawText(`기준일: ${input.date}`, { x: margin, y, size: 10, font, color: MUTED });
  y -= 18;
  for (const line of wrapText(input.metricsLine, 70).filter(Boolean)) {
    page.drawText(line, { x: margin, y, size: 10, font, color: rgb(0.2, 0.25, 0.32) });
    y -= 14;
  }
  y -= 14;

  page.drawText("오늘 챙길 일", { x: margin, y, size: 13, font, color: NAVY });
  y -= 10;
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.5, color: rgb(0.8, 0.78, 0.7) });
  y -= 20;

  let n = 1;
  for (const item of input.items) {
    if (y < 90) {
      page = pdf.addPage([595, 842]);
      y = 800;
    }
    page.drawText(`${n}. [${item.priorityLabel}] ${item.title}`, { x: margin, y, size: 11, font, color: NAVY });
    y -= 16;
    for (const line of wrapText(item.detail, 64).filter(Boolean)) {
      page.drawText(line, { x: margin + 14, y, size: 9.5, font, color: rgb(0.25, 0.3, 0.35) });
      y -= 13;
    }
    y -= 8;
    n += 1;
  }

  return pdf.save();
}

export type ResumeEntry = { typeLabel: string; year: string; title: string; detail?: string };

export type ResumePdfInput = {
  name: string;
  subtitle?: string;
  entries: readonly ResumeEntry[];
};

/** 대표 약력(이력서) PDF — 경력 항목 기반. */
export async function generateResumePdf(input: ResumePdfInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const koreanFontData = await loadKoreanFont();
  const font = koreanFontData
    ? await pdf.embedFont(koreanFontData)
    : await pdf.embedFont(StandardFonts.Helvetica);

  let page = pdf.addPage([595, 842]);
  const { width } = page.getSize();
  const margin = 60;
  let y = 800;

  page.drawText("ETHOS", { x: margin, y, size: 22, font, color: NAVY });
  page.drawText("Administrative Attorney Office", { x: margin, y: y - 18, size: 9, font, color: MUTED });
  page.drawLine({ start: { x: margin, y: y - 28 }, end: { x: width - margin, y: y - 28 }, thickness: 1, color: GOLD });
  y -= 58;

  page.drawText(input.name, { x: margin, y, size: 24, font, color: NAVY });
  y -= 22;
  if (input.subtitle) {
    page.drawText(input.subtitle, { x: margin, y, size: 11, font, color: MUTED });
    y -= 20;
  }
  y -= 14;

  page.drawText("약력", { x: margin, y, size: 14, font, color: NAVY });
  y -= 8;
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.5, color: rgb(0.8, 0.78, 0.7) });
  y -= 20;

  for (const e of input.entries) {
    if (y < 90) {
      page = pdf.addPage([595, 842]);
      y = 800;
    }
    page.drawText(e.year, { x: margin, y, size: 11, font, color: GOLD });
    page.drawText(`[${e.typeLabel}]`, { x: margin + 70, y, size: 9, font, color: MUTED });
    page.drawText(e.title, { x: margin + 130, y, size: 11, font, color: rgb(0.15, 0.2, 0.28) });
    y -= 15;
    if (e.detail) {
      page.drawText(e.detail, { x: margin + 130, y, size: 9, font, color: MUTED });
      y -= 13;
    }
    y -= 6;
  }

  y -= 16;
  page.drawText("※ 본 약력은 ETHOS 행정사사무소 운영 자료로 자동 생성되었습니다.", {
    x: margin,
    y: Math.max(y, 50),
    size: 8,
    font,
    color: MUTED
  });

  return pdf.save();
}

export type QuotePdfLine = { category: string; service: string; amount: string; note?: string };

export type QuotePdfInput = {
  clientName: string;
  date: string;
  lines: readonly QuotePdfLine[];
  totalText?: string;
  notice?: string;
  signature?: string;
};

/** 견적서 PDF — FeeItem 기반 표 형식. */
export async function generateQuotePdf(input: QuotePdfInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const koreanFontData = await loadKoreanFont();
  const font = koreanFontData
    ? await pdf.embedFont(koreanFontData)
    : await pdf.embedFont(StandardFonts.Helvetica);

  let page = pdf.addPage([595, 842]);
  const { width } = page.getSize();
  const margin = 55;
  let y = 800;

  page.drawText("ETHOS", { x: margin, y, size: 22, font, color: NAVY });
  page.drawText("Administrative Attorney Office", { x: margin, y: y - 18, size: 9, font, color: MUTED });
  page.drawText("견적서", { x: width - margin - 70, y, size: 20, font, color: NAVY });
  page.drawLine({ start: { x: margin, y: y - 28 }, end: { x: width - margin, y: y - 28 }, thickness: 1, color: GOLD });
  y -= 56;

  page.drawText(`의뢰인: ${input.clientName}`, { x: margin, y, size: 10, font, color: MUTED });
  page.drawText(`작성일: ${input.date}`, { x: width - margin - 120, y, size: 10, font, color: MUTED });
  y -= 28;

  // 표 헤더
  const cols = { cat: margin, svc: margin + 95, amt: width - margin - 150, note: width - margin - 150 };
  page.drawRectangle({ x: margin, y: y - 4, width: width - margin * 2, height: 22, color: rgb(0.96, 0.94, 0.88) });
  page.drawText("분야", { x: cols.cat + 4, y: y + 3, size: 9, font, color: NAVY });
  page.drawText("항목", { x: cols.svc + 4, y: y + 3, size: 9, font, color: NAVY });
  page.drawText("금액", { x: cols.amt + 4, y: y + 3, size: 9, font, color: NAVY });
  y -= 24;

  for (const line of input.lines) {
    if (y < 120) {
      page = pdf.addPage([595, 842]);
      y = 800;
    }
    page.drawText(line.category, { x: cols.cat + 4, y, size: 9, font, color: MUTED });
    const svcLines = wrapText(line.service, 28).filter(Boolean);
    page.drawText(svcLines[0] ?? line.service, { x: cols.svc + 4, y, size: 9, font, color: rgb(0.2, 0.2, 0.2) });
    page.drawText(line.amount, { x: cols.amt + 4, y, size: 9, font, color: NAVY });
    y -= 14;
    if (line.note) {
      page.drawText(`· ${line.note}`, { x: cols.svc + 4, y, size: 8, font, color: MUTED });
      y -= 12;
    }
    page.drawLine({ start: { x: margin, y: y + 2 }, end: { x: width - margin, y: y + 2 }, thickness: 0.3, color: rgb(0.85, 0.82, 0.75) });
    y -= 6;
  }

  if (input.totalText) {
    y -= 10;
    page.drawText(`합계: ${input.totalText}`, { x: width - margin - 200, y, size: 12, font, color: NAVY });
    y -= 20;
  }

  y -= 10;
  const notice =
    input.notice ??
    "본 견적은 제시일 기준 참고용이며, 사실관계 확인 후 변동될 수 있습니다. 관청 수수료·실비는 별도입니다.";
  for (const line of wrapText(notice, 60).filter(Boolean)) {
    page.drawText(line, { x: margin, y, size: 8, font, color: MUTED });
    y -= 12;
  }

  if (input.signature) {
    y -= 24;
    page.drawText(`행정사 ${input.signature}`, { x: width - margin - 150, y, size: 11, font, color: NAVY });
  }

  return pdf.save();
}

function wrapText(text: string, maxChars: number): string[] {
  const lines: string[] = [];
  for (const para of text.split("\n")) {
    let buf = "";
    for (const word of para.split(/\s+/)) {
      if ((buf + " " + word).length > maxChars) {
        lines.push(buf.trim());
        buf = word;
      } else {
        buf += " " + word;
      }
    }
    if (buf.trim()) lines.push(buf.trim());
    lines.push("");
  }
  return lines;
}
