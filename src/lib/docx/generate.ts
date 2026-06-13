import {
  AlignmentType,
  Document,
  HeadingLevel,
  LevelFormat,
  Packer,
  Paragraph,
  TextRun
} from "docx";

import type { ContractTemplate } from "@/lib/docx/contract-templates";

const NAVY = "1A3C5F";
const GOLD = "C9A961";
const MUTED = "6E6454";

export type DocxContractInput = {
  template: ContractTemplate;
  variables: Record<string, string>;
  clientName: string;
  providerName: string;
  caseNo?: string;
  date: string;
};

function renderText(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `[${key}]`);
}

function navyHeading(text: string, level: typeof HeadingLevel[keyof typeof HeadingLevel]): Paragraph {
  return new Paragraph({
    heading: level,
    children: [new TextRun({ text, bold: true, color: NAVY })],
    spacing: { before: 240, after: 120 }
  });
}

export async function generateContractDocx(input: DocxContractInput): Promise<Buffer> {
  const { template, variables, clientName, providerName, caseNo, date } = input;
  const vars = { ...variables, clientName, providerName };

  const docElements: Paragraph[] = [];

  // 헤더
  docElements.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "ETHOS", bold: true, size: 48, color: NAVY })],
      spacing: { after: 80 }
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "Administrative Attorney Office", italics: true, size: 18, color: MUTED })],
      spacing: { after: 120 }
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "─── ✦ ───", color: GOLD, size: 18 })],
      spacing: { after: 240 }
    })
  );

  // 제목
  docElements.push(navyHeading(template.label, HeadingLevel.HEADING_1));

  // 메타
  docElements.push(
    new Paragraph({
      children: [new TextRun({ text: `위임인: ${clientName}`, color: MUTED, size: 22 })]
    }),
    new Paragraph({
      children: [new TextRun({ text: `수임인: ${providerName}`, color: MUTED, size: 22 })]
    })
  );
  if (caseNo) {
    docElements.push(
      new Paragraph({ children: [new TextRun({ text: `사건번호: ${caseNo}`, color: MUTED, size: 22 })] })
    );
  }
  docElements.push(
    new Paragraph({
      children: [new TextRun({ text: `작성일: ${date}`, color: MUTED, size: 22 })],
      spacing: { after: 240 }
    })
  );

  // 본문 조문
  for (const sec of template.sections) {
    docElements.push(navyHeading(sec.heading, HeadingLevel.HEADING_2));
    const bodyText = renderText(sec.body, vars);
    for (const line of bodyText.split("\n")) {
      docElements.push(
        new Paragraph({
          children: [new TextRun({ text: line, size: 22 })],
          spacing: { after: 60 }
        })
      );
    }
  }

  // 서명란
  docElements.push(
    new Paragraph({
      children: [new TextRun({ text: "" })],
      spacing: { before: 360 }
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: `${date}`, color: MUTED, size: 22 })]
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: "위임인: __________________ (인)", size: 24 })],
      spacing: { before: 200 }
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: "수임인: __________________ (인)", size: 24 })],
      spacing: { before: 100 }
    })
  );

  const doc = new Document({
    creator: "ETHOS Administrative Attorney Office",
    title: template.label,
    sections: [{ children: docElements }],
    numbering: {
      config: [
        {
          reference: "default",
          levels: [
            { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.START }
          ]
        }
      ]
    }
  });

  return Packer.toBuffer(doc);
}
