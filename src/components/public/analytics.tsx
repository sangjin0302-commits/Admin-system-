import Script from "next/script";

import { getSiteSettings } from "@/lib/services/site-settings";

/**
 * Google/Naver Analytics + 사이트 인증.
 * 우선순위: 운영란(site-settings) → env. 값이 있을 때만 렌더.
 */
export async function Analytics() {
  const site = await getSiteSettings().catch(() => null);
  const gaId = site?.["analytics.gaId"]?.trim() || process.env.NEXT_PUBLIC_GA_ID;
  const naverId = process.env.NEXT_PUBLIC_NAVER_ID;
  const googleVerify = site?.["seo.googleVerification"]?.trim();
  const naverVerify = site?.["seo.naverVerification"]?.trim();

  return (
    <>
      {googleVerify && <meta name="google-site-verification" content={googleVerify} />}
      {naverVerify && <meta name="naver-site-verification" content={naverVerify} />}

      {gaId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script id="ga-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaId}', { anonymize_ip: true });
            `}
          </Script>
        </>
      )}

      {naverId && (
        <Script id="naver-analytics" strategy="afterInteractive">
          {`
            if (!wcs_add) var wcs_add = {};
            wcs_add["wa"] = "${naverId}";
            if (window.wcs) {
              wcs_do();
            }
          `}
        </Script>
      )}
    </>
  );
}
