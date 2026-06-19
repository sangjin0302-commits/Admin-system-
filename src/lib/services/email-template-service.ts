import { prisma } from "@/lib/prisma/client";

export type EmailTemplate = {
  key: string;
  subject: string;
  bodyHtml: string;
  variables: string[];
};

export const DEFAULT_TEMPLATES: Record<string, EmailTemplate> = {
  new_inquiry: {
    key: "new_inquiry",
    subject: "[ETHOS] 신규 문의 접수 - {{title}}",
    bodyHtml: `<p>안녕하세요 {{name}}님,</p>
<p>문의해 주셔서 감사합니다. 접수번호 <strong>{{trackingCode}}</strong>로 등록되었습니다.</p>
<p>담당자가 곧 연락드리겠습니다.</p>
<p>감사합니다.<br/>ETHOS 행정사사무소</p>`,
    variables: ["name", "title", "trackingCode"],
  },
  quote_sent: {
    key: "quote_sent",
    subject: "[ETHOS] 견적서 발송 안내 - {{title}}",
    bodyHtml: `<p>{{name}}님,</p>
<p>요청하신 건에 대한 견적서를 발송해 드렸습니다.</p>
<p>견적 금액: <strong>{{amount}}원</strong></p>
<p>견적 확인: <a href="{{link}}">{{link}}</a></p>
<p>감사합니다.</p>`,
    variables: ["name", "title", "amount", "link"],
  },
  case_started: {
    key: "case_started",
    subject: "[ETHOS] 사건 진행 시작 - {{caseNo}}",
    bodyHtml: `<p>{{name}}님,</p>
<p>사건번호 <strong>{{caseNo}}</strong>의 진행이 시작되었습니다.</p>
<p>담당자: {{assignee}}</p>
<p>진행 상황은 마이페이지에서 확인하실 수 있습니다.</p>`,
    variables: ["name", "caseNo", "assignee"],
  },
  case_completed: {
    key: "case_completed",
    subject: "[ETHOS] 사건 완료 안내 - {{caseNo}}",
    bodyHtml: `<p>{{name}}님,</p>
<p>사건 <strong>{{caseNo}}</strong>이(가) 성공적으로 완료되었습니다.</p>
<p>이용해 주셔서 감사합니다.</p>`,
    variables: ["name", "caseNo"],
  },
  followup_reminder: {
    key: "followup_reminder",
    subject: "[ETHOS] 후속 확인 안내 - {{title}}",
    bodyHtml: `<p>{{name}}님,</p>
<p>이전 문의 <strong>{{title}}</strong>에 대해 추가 진행 여부를 확인드리고자 합니다.</p>
<p>회신 부탁드립니다.</p>`,
    variables: ["name", "title"],
  },
};

function settingKey(key: string) {
  return `email.template.${key}`;
}

export async function getTemplate(key: string): Promise<EmailTemplate> {
  const fallback = DEFAULT_TEMPLATES[key];
  if (!fallback) {
    throw new Error(`Unknown template key: ${key}`);
  }
  try {
    const row = await prisma.siteSetting.findUnique({
      where: { key: settingKey(key) },
    });
    if (!row) return fallback;
    const parsed = JSON.parse(row.value) as { subject?: string; bodyHtml?: string };
    return {
      key,
      subject: parsed.subject ?? fallback.subject,
      bodyHtml: parsed.bodyHtml ?? fallback.bodyHtml,
      variables: fallback.variables,
    };
  } catch {
    return fallback;
  }
}

export async function saveTemplate(
  key: string,
  subject: string,
  bodyHtml: string
): Promise<void> {
  if (!DEFAULT_TEMPLATES[key]) {
    throw new Error(`Unknown template key: ${key}`);
  }
  const value = JSON.stringify({ subject, bodyHtml });
  await prisma.siteSetting.upsert({
    where: { key: settingKey(key) },
    create: { key: settingKey(key), value },
    update: { value },
  });
}

export function renderTemplate(
  template: EmailTemplate,
  vars: Record<string, string>
): { subject: string; html: string } {
  function replace(input: string): string {
    return input.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, name) => {
      return vars[name] ?? `{{${name}}}`;
    });
  }
  return {
    subject: replace(template.subject),
    html: replace(template.bodyHtml),
  };
}

export async function listTemplates(): Promise<EmailTemplate[]> {
  return Promise.all(Object.keys(DEFAULT_TEMPLATES).map((k) => getTemplate(k)));
}
