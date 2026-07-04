import { NextResponse } from "next/server";

import { confirmSubscribe } from "@/lib/services/newsletter-service";

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "https://ethosattorney.com").replace(/\/+$/, "");
}

function page(title: string, body: string) {
  return new NextResponse(
    `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>${title}</title>
     <meta name="viewport" content="width=device-width, initial-scale=1">
     <style>
       body{font-family:-apple-system,'Pretendard',sans-serif;background:#faf8f2;color:#1a2744;padding:48px 20px;text-align:center;}
       .card{max-width:480px;margin:0 auto;background:#fff;border-radius:20px;padding:32px 24px;border:1px solid #e5e3da;}
       h1{font-size:20px;margin:0 0 12px;}
       p{font-size:14px;color:#555;line-height:1.7;margin:8px 0;}
       a{display:inline-block;margin-top:16px;padding:10px 24px;background:#1a2744;color:#fff;border-radius:20px;text-decoration:none;font-size:13px;font-weight:600;}
     </style></head><body>
     <div class="card">
       <h1>${title}</h1>
       ${body}
       <a href="${siteUrl()}">홈으로</a>
     </div></body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";

  const result = await confirmSubscribe(token);
  if (!result.ok) {
    return page(
      "확인 실패",
      `<p>토큰이 유효하지 않거나 만료되었습니다.</p><p>다시 구독 신청을 부탁드립니다.</p>`
    );
  }
  return page(
    "구독이 확인되었습니다",
    `<p>${result.email} 주소로 새 소식을 보내드립니다.</p><p>감사합니다.</p>`
  );
}
