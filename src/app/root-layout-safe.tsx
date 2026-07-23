import type { Metadata, Viewport } from "next";

import { Analytics as VercelAnalytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { Toaster as SonnerToaster } from "sonner";

import { AppShellSafe } from "@/components/layout/app-shell-safe";
import { HtmlLangSync } from "@/components/layout/html-lang-sync";
import { Analytics } from "@/components/public/analytics";
import { AiChatWidget } from "@/components/public/ai-chat-widget";
import { BottomSheetMount } from "@/components/public/bottom-sheet-mount";
import { LiveChat } from "@/components/public/live-chat";
import { LocalBusinessJsonLd } from "@/components/public/json-ld";
import { PublicOnly } from "@/components/public/public-only";
import { PWARegister } from "@/components/public/pwa-register";
import { AbBootstrap } from "@/components/public/ab-bootstrap";
import { GA4ConversionTracker } from "@/components/analytics/ga4-conversion-tracker";
import { BrandIntro } from "@/components/public/brand-intro";
import { OnboardingTour } from "@/components/public/onboarding-tour";
import { ToastProvider } from "@/components/ui/toast-provider";
import { fontVariables } from "@/lib/fonts";
import { getSiteUrl } from "@/lib/utils/site-url";
import "./globals.css";

const SITE_TITLE = "\uC5D0\uD1A0\uC2A4 \uD589\uC815\uC0AC\uC0AC\uBB34\uC18C(ETHOS)";
const SITE_DESCRIPTION =
  "\uBE44\uC790/\uCCB4\uB958, \uD589\uC815\uC2EC\uD310, \uACC4\uC57D\uC11C\u00B7\uC0AC\uC2E4\uC870\uC0AC, \uC778\uD5C8\uAC00 \uC5C5\uBB34. \uC808\uCC28\uC5D0\uB294 \uC774\uC131\uC744, \uC0AC\uB78C\uC5D0\uAC8C\uB294 \uACF5\uAC10\uC744, \uC77C\uC5D0\uB294 \uC2E0\uB8B0\uB97C.";
const SITE_URL = getSiteUrl();

export const viewport: Viewport = {
  themeColor: "#1a3c5f",
};

export const metadata: Metadata = {
  title: { default: SITE_TITLE, template: "%s | 에토스 행정사사무소" },
  description: SITE_DESCRIPTION,
  applicationName: SITE_TITLE,
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: "/",
    languages: { ko: "/", en: "/en", "x-default": "/" }
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_TITLE,
    locale: "ko_KR",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "\uC9C4\uD589\uC0C1\uD669",
    statusBarStyle: "default"
  },
  icons: {
    icon: [
      {
        url: "/icons/logo-192.png",
        sizes: "192x192",
        type: "image/png"
      },
      {
        url: "/icons/logo-512.png",
        sizes: "512x512",
        type: "image/png"
      }
    ],
    apple: [
      {
        url: "/icons/logo-192.png",
        sizes: "192x192",
        type: "image/png"
      }
    ]
  },
  other: {
    "theme-color": "#1B2B6B",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-title": "ETHOS"
  }
};

export default function RootLayoutSafe({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className={fontVariables} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('ethos.theme');if(t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.dataset.theme='dark';}}catch(e){}`,
          }}
        />
        {/*
          <html lang>을 실제 표시 언어로 교정한다. 루트 레이아웃은 서버 컴포넌트라
          경로를 알 수 없어 lang="ko"가 박혀 나가는데, 그러면 영어/아랍어 페이지에서
          크롬이 "한국어를 번역할까요"를 잘못 띄운다. 번역이 텍스트 노드를 갈아치우면
          React 재조정이 parentNode null로 터지므로(Sentry 이슈), 브라우저가 언어를
          판정하기 전인 <head> 단계에서 동기적으로 바로잡는다.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var p=location.pathname,q=new URLSearchParams(location.search).get('lang'),l='ko';if(/^\\/en(\\/|$)/.test(p))l='en';else if(/^\\/ar(\\/|$)/.test(p))l='ar';else if(/^\\/jp(\\/|$)/.test(p))l='ja';else if(/^\\/vn(\\/|$)/.test(p))l='vi';else if(q==='en')l='en';var d=document.documentElement;if(d.lang!==l)d.lang=l;d.dir=l==='ar'?'rtl':'ltr';}catch(e){}`,
          }}
        />
      </head>
      <body>
        <HtmlLangSync />
        <PublicOnly>
          <BrandIntro />
        </PublicOnly>
        <AppShellSafe>{children}</AppShellSafe>
        <ToastProvider />
        <SonnerToaster
          position="top-center"
          richColors
          closeButton
          toastOptions={{
            classNames: {
              toast: "font-serif text-sm",
              title: "font-bold",
              description: "text-text-muted"
            }
          }}
        />
        <PublicOnly>
          <AiChatWidget />
          <LiveChat />
        </PublicOnly>
        <GA4ConversionTracker enabled={true} />
        <Analytics />
        <VercelAnalytics />
        <SpeedInsights />
        <PWARegister />
        <LocalBusinessJsonLd />
        <AbBootstrap />
        <BottomSheetMount />
        <PublicOnly>
          <OnboardingTour />
        </PublicOnly>
      </body>
    </html>
  );
}
