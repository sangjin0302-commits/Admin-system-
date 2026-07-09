/**
 * 사건 문서 자동 생성 (III6)
 * - 위임장 (Power of Attorney)
 * - 영수증 (Receipt)
 *
 * 출력: 인쇄 가능한 HTML 문자열 (브라우저에서 window.print).
 */

import { prisma } from "@/lib/prisma/client";

type CaseDocData = Awaited<ReturnType<typeof loadCaseData>>;

async function loadCaseData(caseId: string) {
  return prisma.caseMatter.findUnique({
    where: { id: caseId },
    select: {
      id: true,
      caseNo: true,
      title: true,
      matterType: true,
      category: true,
      summary: true,
      openedAt: true,
      createdAt: true,
      parties: { select: { role: true, name: true, phone: true, organization: true } },
      inquiry: {
        select: {
          contactName: true,
          organizationName: true,
          email: true,
          phone: true,
          title: true,
          description: true
        }
      }
    }
  });
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function pickClientName(data: NonNullable<CaseDocData>): string {
  const party = data.parties.find((p) => p.role === "CLIENT") ?? data.parties[0];
  return party?.name ?? data.inquiry?.contactName ?? "(의뢰인)";
}

function pickClientContact(data: NonNullable<CaseDocData>): { phone: string; address: string } {
  const party = data.parties.find((p) => p.role === "CLIENT") ?? data.parties[0];
  return {
    phone: party?.phone ?? data.inquiry?.phone ?? "-",
    address: party?.organization ?? data.inquiry?.organizationName ?? "-"
  };
}

function formatKoreanDate(d: Date): string {
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

function wrap(title: string, body: string): string {
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<style>
  @page { size: A4; margin: 20mm; }
  * { box-sizing: border-box; }
  body { font-family: "Nanum Gothic", "Malgun Gothic", sans-serif; color: #111; line-height: 1.7; margin: 0; padding: 24px; }
  .doc { max-width: 720px; margin: 0 auto; }
  h1 { text-align: center; font-size: 28px; letter-spacing: 12px; margin: 0 0 32px; }
  .meta { display: grid; grid-template-columns: 120px 1fr; row-gap: 8px; font-size: 14px; margin-bottom: 24px; }
  .meta dt { font-weight: 600; color: #444; }
  .body { font-size: 15px; white-space: pre-wrap; }
  .signature { margin-top: 60px; text-align: right; font-size: 15px; }
  .signature .line { display: inline-block; min-width: 220px; border-bottom: 1px solid #111; padding-bottom: 4px; }
  .print-btn { position: fixed; top: 12px; right: 12px; padding: 8px 16px; background: #111; color: #fff; border: 0; border-radius: 6px; cursor: pointer; font-size: 13px; }
  @media print { .print-btn { display: none; } body { padding: 0; } }
  table.receipt { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px; }
  table.receipt th, table.receipt td { border: 1px solid #333; padding: 10px; text-align: left; }
  table.receipt th { background: #f4f4f4; width: 140px; }
  .amount { font-size: 22px; font-weight: 700; letter-spacing: 2px; }
</style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">인쇄하기</button>
  <div class="doc">${body}</div>
</body>
</html>`;
}

export async function generatePowerOfAttorney(caseId: string): Promise<string> {
  const data = await loadCaseData(caseId);
  if (!data) throw new Error(`Case not found: ${caseId}`);

  const clientName = pickClientName(data);
  const contact = pickClientContact(data);
  const today = formatKoreanDate(new Date());
  const caseNo = data.caseNo ?? "-";
  const scope = data.title || data.summary || data.inquiry?.title || "행정 대행 업무 일체";

  const body = `
    <h1>위 임 장</h1>
    <dl class="meta">
      <dt>사건번호</dt><dd>${escapeHtml(caseNo)}</dd>
      <dt>사건명</dt><dd>${escapeHtml(data.title)}</dd>
      <dt>위임인 성명</dt><dd>${escapeHtml(clientName)}</dd>
      <dt>연락처</dt><dd>${escapeHtml(contact.phone)}</dd>
      <dt>주소</dt><dd>${escapeHtml(contact.address)}</dd>
    </dl>
    <div class="body">위 위임인은 다음의 사항에 관하여 아래 수임인에게 그 처리 일체를 위임합니다.

【위임 사항】
1. ${escapeHtml(scope)}에 관한 서류의 작성·제출·수령
2. 관할 행정기관·법원·수사기관 등에 대한 각종 신청·이의·불복 절차
3. 관련 자료의 열람·복사 및 사실확인 요청
4. 위 각 사항의 처리에 부수하는 일체의 행위

【수임인】
행정사 사무소 : 에토스 행정사사무소
대표 행정사 : (성명)
사무소 소재지 : (주소)
</div>
    <div class="signature">
      <p>${escapeHtml(today)}</p>
      <p>위임인 <span class="line">${escapeHtml(clientName)}</span> (인)</p>
    </div>`;

  return wrap(`위임장 - ${caseNo}`, body);
}

export async function generateReceipt(
  caseId: string,
  amount: number,
  receivedAt: Date
): Promise<string> {
  const data = await loadCaseData(caseId);
  if (!data) throw new Error(`Case not found: ${caseId}`);

  const clientName = pickClientName(data);
  const caseNo = data.caseNo ?? "-";
  const dateStr = formatKoreanDate(receivedAt);
  const amountFmt = new Intl.NumberFormat("ko-KR").format(Math.floor(amount));

  const body = `
    <h1>영 수 증</h1>
    <table class="receipt">
      <tr><th>수령인</th><td>${escapeHtml(clientName)} 귀하</td></tr>
      <tr><th>사건번호</th><td>${escapeHtml(caseNo)}</td></tr>
      <tr><th>사건명</th><td>${escapeHtml(data.title)}</td></tr>
      <tr><th>수령 금액</th><td class="amount">₩ ${amountFmt}</td></tr>
      <tr><th>수령 일자</th><td>${escapeHtml(dateStr)}</td></tr>
      <tr><th>수령 사유</th><td>위 사건 관련 수임료 및 실비</td></tr>
    </table>
    <div class="body">위 금액을 정히 영수하였음을 확인합니다.</div>
    <div class="signature">
      <p>${escapeHtml(formatKoreanDate(new Date()))}</p>
      <p>발행 : 에토스 행정사사무소 (인)</p>
    </div>`;

  return wrap(`영수증 - ${caseNo}`, body);
}
