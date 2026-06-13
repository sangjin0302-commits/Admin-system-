import Script from "next/script";

/**
 * Google Analytics + Naver Analytics scaffold.
 * Set NEXT_PUBLIC_GA_ID and NEXT_PUBLIC_NAVER_ID env vars.
 * Only renders when IDs are set.
 */
export function Analytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const naverId = process.env.NEXT_PUBLIC_NAVER_ID;

  return (
    <>
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
