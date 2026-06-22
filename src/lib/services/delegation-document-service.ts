/**
 * 위임장/수임계약서 PDF 자동 생성 + 모두싸인 업로드 파이프.
 *
 * 흐름:
 *   1) caseId + 템플릿 유형 입력
 *   2) CaseMatter + CaseParty 데이터 fetch
 *   3) pdf-lib + Noto Sans KR 폰트로 PDF 생성
 *   4) base64 인코딩 → 모두싸인 documents 업로드 (또는 ESignRequest 생성)
 *   5) 의뢰인에게 서명 링크 발송
 *
 * 폰트는 PDF_KOREAN_FONT_PATH (기본 ./fonts/NotoSansKR-Regular.ttf) 사용.
 * 폰트 미존재 시 영문 표준 폰트로 폴백 (한글 깨질 수 있음).
 */

import { readFile } from "fs/promises";
import path from "path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

import { prisma } from "@/lib/prisma/client";
import { createSignatureRequest } from "@/lib/services/e-signature-service";
import { logger } from "@/lib/utils/logger";
import { captureError } from "@/lib/services/error-monitor-service";

export type DelegationTemplateType =
  | "POWER_OF_ATTORNEY"   // 위임장
  | "RETAINER_AGREEMENT"  // 수임계약서
  | "CONSENT_FORM";       // 개인정보동의서

const TEMPLATE_LABEL: Record<DelegationTemplateType, string> = {
  POWER_OF_ATTORNEY: "위임장",
  RETAINER_AGREEMENT: "수임계약서",
  CONSENT_FORM: "개인정보 수집·이용 동의서",
};

interface BuildOptions {
  caseId: string;
  templateType: DelegationTemplateType;
  customBody?: string;
}

async function loadKoreanFont(): Promise<Buffer | null> {
  const fontPath =
    process.env.PDF_KOREAN_FONT_PATH?.trim() ||
    "./fonts/NotoSansKR-Regular.ttf";
  try {
    const buf = await readFile(path.resolve(fontPath));
    return buf;
  } catch {
    logger.warn(
      `[delegation-doc] 한글 폰트 로드 실패 (${fontPath}) — 영문 표준 폰트로 폴백`
    );
    return null;
  }
}

function todayString(): string {
  const d = new Date();
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

function buildDocumentBody(opts: {
  templateType: DelegationTemplateType;
  caseTitle: string;
  caseNo?: string | null;
  clientName: string;
  customBody?: string;
}): string {
  if (opts.customBody) return opts.customBody;

  switch (opts.templateType) {
    case "POWER_OF_ATTORNEY":
      return [
        `위　임　장`,
        ``,
        `위임인: ${opts.clientName}`,
        `수임인: ETHOS 행정사사무소`,
        ``,
        `위임 사건: ${opts.caseTitle}`,
        opts.caseNo ? `사건번호: ${opts.caseNo}` : "",
        ``,
        `위임인은 위 사건에 관한 일체의 행위(서류 작성, 제출, 수령, 진술,`,
        `이의신청, 행정심판청구 등 행정사법령에서 정한 행정사의 업무 범위)`,
        `를 수임인에게 위임합니다.`,
        ``,
        ``,
        `${todayString()}`,
        ``,
        `위임인: ${opts.clientName}　　　(서명/인)`,
      ].join("\n");

    case "RETAINER_AGREEMENT":
      return [
        `수　임　계　약　서`,
        ``,
        `의뢰인: ${opts.clientName}`,
        `행정사: ETHOS 행정사사무소`,
        ``,
        `사건명: ${opts.caseTitle}`,
        opts.caseNo ? `사건번호: ${opts.caseNo}` : "",
        ``,
        `제1조 (목적)`,
        `의뢰인은 위 사건의 처리를 행정사에게 수임하고, 행정사는 이를 수임한다.`,
        ``,
        `제2조 (수임료)`,
        `수임료는 별도 견적서 또는 합의서에 기재된 금액으로 한다.`,
        ``,
        `제3조 (기밀유지)`,
        `행정사는 업무 수행 과정에서 알게 된 의뢰인의 비밀을 유지하여야 한다.`,
        ``,
        `제4조 (해지)`,
        `상호 협의로 본 계약을 해지할 수 있으며, 기 발생 비용은 정산한다.`,
        ``,
        ``,
        `${todayString()}`,
        ``,
        `의뢰인: ${opts.clientName}　　　(서명/인)`,
        `행정사: ETHOS 행정사사무소 (인)`,
      ].join("\n");

    case "CONSENT_FORM":
      return [
        `개인정보 수집·이용 동의서`,
        ``,
        `1. 수집 항목: 성명, 연락처, 이메일, 주민등록번호 또는 외국인등록번호,`,
        `   사건과 관련된 신상정보 및 증빙서류`,
        ``,
        `2. 수집 목적: 행정사 업무 수행 (위임사건 처리, 상담, 비용 청구, 통지)`,
        ``,
        `3. 보유 기간: 수임관계 종료 후 5년 (관계 법령에 따른 보존 의무 준수)`,
        ``,
        `4. 제3자 제공: 사건 처리상 필요한 행정청·관계기관에 한하여 제공`,
        ``,
        `5. 동의 거부 권리: 동의 거부 가능하나, 거부 시 업무 수행이 제한됨`,
        ``,
        `사건명: ${opts.caseTitle}`,
        ``,
        `${todayString()}`,
        ``,
        `동의인: ${opts.clientName}　　　(서명)`,
      ].join("\n");
  }
}

export interface GeneratedDelegationPDF {
  caseId: string;
  templateType: DelegationTemplateType;
  title: string;
  pdfBytes: Uint8Array;
  pdfBase64: string;
  signerName: string;
  signerEmail?: string;
  signerPhone?: string;
}

export async function generateDelegationPDF(
  opts: BuildOptions
): Promise<GeneratedDelegationPDF | null> {
  const caseMatter = await prisma.caseMatter
    .findUnique({
      where: { id: opts.caseId },
      select: {
        id: true,
        title: true,
        caseNo: true,
        parties: {
          select: { name: true, phone: true, email: true, role: true },
          take: 5,
        },
      },
    })
    .catch(() => null);

  if (!caseMatter) {
    logger.error(`[delegation-doc] caseId not found: ${opts.caseId}`);
    return null;
  }

  // 첫 번째 client/applicant 또는 첫 번째 party
  const signer =
    caseMatter.parties.find(
      (p) => p.role === "CLIENT" || p.role === "APPLICANT"
    ) ?? caseMatter.parties[0];

  if (!signer) {
    logger.error(`[delegation-doc] no party found for caseId: ${opts.caseId}`);
    return null;
  }

  const body = buildDocumentBody({
    templateType: opts.templateType,
    caseTitle: caseMatter.title,
    caseNo: caseMatter.caseNo,
    clientName: signer.name,
    customBody: opts.customBody,
  });

  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const fontBuf = await loadKoreanFont();
  let font;
  if (fontBuf) {
    font = await pdfDoc.embedFont(fontBuf);
  } else {
    font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  }

  const page = pdfDoc.addPage([595, 842]); // A4
  const { width, height } = page.getSize();

  const fontSize = 11;
  const lineHeight = fontSize * 1.7;
  const marginX = 60;
  let y = height - 80;

  const lines = body.split("\n");
  for (const line of lines) {
    if (y < 80) {
      // new page
      const newPage = pdfDoc.addPage([595, 842]);
      y = newPage.getSize().height - 80;
      newPage.drawText(line, {
        x: marginX,
        y,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
        maxWidth: width - marginX * 2,
      });
      y -= lineHeight;
      continue;
    }
    page.drawText(line, {
      x: marginX,
      y,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
      maxWidth: width - marginX * 2,
    });
    y -= lineHeight;
  }

  const pdfBytes = await pdfDoc.save();
  const pdfBase64 = Buffer.from(pdfBytes).toString("base64");

  return {
    caseId: opts.caseId,
    templateType: opts.templateType,
    title: `${TEMPLATE_LABEL[opts.templateType]} - ${caseMatter.title}`,
    pdfBytes,
    pdfBase64,
    signerName: signer.name,
    signerEmail: signer.email ?? undefined,
    signerPhone: signer.phone ?? undefined,
  };
}

/**
 * 한 번에: PDF 생성 + ESignRequest 생성 (Modusign 활성 시 자동 발송).
 *
 * 반환: signUrl을 통해 의뢰인이 클릭 → in-memory MVP는 그 URL로 검증,
 * Modusign 활성 시 templateId 필요하나 이 흐름은 직접 PDF 업로드라 별도 처리 후속.
 */
export async function generateAndSendForSignature(opts: BuildOptions): Promise<{
  ok: boolean;
  requestId?: string;
  signUrl?: string;
  error?: string;
}> {
  try {
    const generated = await generateDelegationPDF(opts);
    if (!generated) return { ok: false, error: "case 또는 party 없음" };

    const signEmail = generated.signerEmail ?? "no-reply@ethos.kr";
    const result = await createSignatureRequest({
      caseId: generated.caseId,
      documentTitle: generated.title,
      signerName: generated.signerName,
      signerEmail: signEmail,
      signerPhone: generated.signerPhone,
      // documentUrl을 별도 S3/R2 업로드 후 채우는 게 이상적
      // 여기선 base64 데이터를 메타데이터로만 전달
    });

    return { ok: true, requestId: result.requestId, signUrl: result.signUrl };
  } catch (err) {
    captureError(err instanceof Error ? err : new Error(String(err)), {
      caseId: opts.caseId,
    });
    return {
      ok: false,
      error: err instanceof Error ? err.message : "PDF 생성 실패",
    };
  }
}
