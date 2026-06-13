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

async function loadKoreanFont(): Promise<Buffer | null> {
  const envPath = process.env.PDF_KOREAN_FONT_PATH;
  const candidates = [
    envPath,
    path.join(process.cwd(), "fonts/NotoSansKR-Regular.ttf"),
    path.join(process.cwd(), "fonts/NotoSansKR-Regular.otf"),
    path.join(process.cwd(), "fonts/Pretendard-Regular.ttf")
  ].filter((p): p is string => Boolean(p));

  for (const file of candidates) {
    try {
      const data = await readFile(file);
      return data;
    } catch {
      continue;
    }
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
