import { NextResponse } from "next/server";

import { unsubscribe } from "@/lib/services/newsletter-service";
import { consumeRateLimit, getClientIpFromHeaders } from "@/lib/security/rate-limit";

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
     <div class="card"><h1>${title}</h1>${body}<a href="${siteUrl()}">홈으로</a></div></body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

/** 원클릭 수신거부. 이메일은 수신자 본인 주소(메일 링크에 실림). 항상 성공 안내(존재여부 비노출). */
export async function GET(request: Request) {
  const ip = getClientIpFromHeaders(request.headers) ?? "unknown";
  const rl = consumeRateLimit({ namespace: "public:newsletter-unsub", key: ip, windowMs: 60 * 60 * 1000, max: 60 });
  if (!rl.allowed) {
    return page("잠시 후 다시 시도", "<p>요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.</p>");
  }
  const email = new URL(request.url).searchParams.get("email") ?? "";
  if (email) {
    await unsubscribe(email).catch(() => undefined);
  }
  return page(
    "수신거부 완료",
    "<p>뉴스레터 수신을 해지했습니다. 더 이상 마케팅 메일을 보내지 않습니다.</p><p>실수로 해지하셨다면 사이트에서 다시 구독할 수 있습니다.</p>"
  );
}
