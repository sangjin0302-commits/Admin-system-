import { NextResponse } from "next/server";

import { exportContractDraftDocument } from "@/lib/services/quote-service";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const document = await exportContractDraftDocument(id);
    const { searchParams } = new URL(request.url);
    const shouldDownload = searchParams.get("download") === "1";

    if (!shouldDownload) {
      const escapedTitle = escapeHtml(document.fileName.replace(/\.md$/i, ""));
      const renderedBody = renderContractMarkdown(document.content);
      const html = `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapedTitle}</title>
    <style>
      :root {
        color-scheme: light;
        font-family: "Pretendard", "Noto Sans KR", system-ui, sans-serif;
      }
      body {
        margin: 0;
        background: linear-gradient(180deg, #f7f2e8 0%, #f1ebe0 100%);
        color: #1f2937;
      }
      .shell {
        max-width: 980px;
        margin: 0 auto;
        padding: 32px 20px 80px;
      }
      .toolbar {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-bottom: 24px;
      }
      .button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 12px 16px;
        border-radius: 12px;
        border: 1px solid #c9b99b;
        background: #fffdf8;
        color: #1f2937;
        text-decoration: none;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
      }
      .card {
        background: #fffdf8;
        border: 1px solid #e5dccb;
        border-radius: 24px;
        padding: 36px;
        box-shadow: 0 20px 55px rgba(116, 86, 45, 0.1);
      }
      .eyebrow {
        display: inline-flex;
        align-items: center;
        padding: 6px 10px;
        border-radius: 999px;
        background: #efe5d5;
        color: #78572d;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }
      h1 {
        margin: 18px 0 10px;
        font-size: 32px;
        line-height: 1.2;
      }
      .subtitle {
        margin: 0 0 24px;
        color: #6b7280;
        font-size: 14px;
        line-height: 1.6;
      }
      .meta {
        display: grid;
        gap: 12px;
        margin-bottom: 28px;
        padding: 16px 18px;
        border-radius: 18px;
        background: #fbf6ee;
        border: 1px solid #eadcc2;
      }
      .meta strong {
        display: block;
        margin-bottom: 4px;
        font-size: 12px;
        color: #7a6344;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .document {
        display: grid;
        gap: 22px;
      }
      .section {
        padding-top: 18px;
        border-top: 1px solid #eee4d2;
      }
      .section:first-child {
        padding-top: 0;
        border-top: none;
      }
      .section h2 {
        margin: 0 0 12px;
        font-size: 18px;
      }
      .section p {
        margin: 0;
        white-space: pre-wrap;
        word-break: break-word;
        font-size: 15px;
        line-height: 1.8;
      }
      .section ul {
        margin: 0;
        padding-left: 20px;
      }
      .section li {
        margin: 8px 0;
        line-height: 1.7;
      }
      @media print {
        @page {
          size: A4;
          margin: 16mm;
        }
        body {
          background: #ffffff;
        }
        .toolbar {
          display: none;
        }
        .shell {
          max-width: none;
          padding: 0;
        }
        .card {
          border: none;
          box-shadow: none;
          padding: 0;
        }
      }
    </style>
  </head>
  <body>
    <main class="shell">
      <div class="toolbar">
        <a class="button" href="?download=1">파일 다운로드</a>
        <button class="button" onclick="window.print()">PDF로 저장 / 인쇄</button>
      </div>
      <section class="card">
        <span class="eyebrow">계약 초안</span>
        <h1>${escapedTitle}</h1>
        <p class="subtitle">관리자 화면에서 생성한 계약 초안입니다. 내용을 검토한 뒤 PDF 저장 또는 파일 다운로드로 바로 활용할 수 있습니다.</p>
        <div class="meta">
          <div>
            <strong>문서 형태</strong>
            계약 초안 미리보기 / PDF 저장 가능
          </div>
          <div>
            <strong>출력 시점</strong>
            ${new Date().toLocaleString("ko-KR")}
          </div>
        </div>
        <div class="document">${renderedBody}</div>
      </section>
    </main>
  </body>
</html>`;

      return new NextResponse(html, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8"
        }
      });
    }

    return new NextResponse(document.content, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(document.fileName)}"`
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "계약 초안 파일을 만들지 못했습니다." },
      { status: 400 }
    );
  }
}

function renderContractMarkdown(markdown: string) {
  const lines = markdown.split(/\r?\n/);
  const sections: Array<{ title: string | null; body: string[] }> = [];
  let current = { title: null as string | null, body: [] as string[] };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (line.startsWith("# ")) {
      continue;
    }

    if (line.startsWith("## ")) {
      if (current.title || current.body.length > 0) {
        sections.push(current);
      }
      current = { title: line.slice(3).trim(), body: [] };
      continue;
    }

    current.body.push(line);
  }

  if (current.title || current.body.length > 0) {
    sections.push(current);
  }

  return sections
    .map((section) => {
      const nonEmptyLines = section.body.filter((line) => line.trim().length > 0);
      const listOnly = nonEmptyLines.length > 0 && nonEmptyLines.every((line) => line.startsWith("- "));
      const content = listOnly
        ? `<ul>${nonEmptyLines.map((line) => `<li>${escapeHtml(line.slice(2).trim())}</li>`).join("")}</ul>`
        : `<p>${escapeHtml(section.body.join("\n").trim() || "내용 없음")}</p>`;

      return `<section class="section">${section.title ? `<h2>${escapeHtml(section.title)}</h2>` : ""}${content}</section>`;
    })
    .join("");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
