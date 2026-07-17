import type { Metadata, Viewport } from "next";

import { Analytics as VercelAnalytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { Toaster as SonnerToaster } from "sonner";

import { AppShellSafe } from "@/components/layout/app-shell-safe";
import { Analytics } from "@/components/public/analytics";
import { AiChatWidget } from "@/components/public/ai-chat-widget";
import { BottomSheetMount } from "@/components/public/bottom-sheet-mount";
import { LiveChat } from "@/components/public/live-chat";
import { LocalBusinessJsonLd } from "@/components/public/json-ld";
import { PWARegister } from "@/components/public/pwa-register";
import { AbBootstrap } from "@/components/public/ab-bootstrap";
import { GA4ConversionTracker } from "@/components/analytics/ga4-conversion-tracker";
import { BrandIntro } from "@/components/public/brand-intro";
import { OnboardingTour } from "@/components/public/onboarding-tour";
import { ToastProvider } from "@/components/ui/toast-provider";
import { getSiteUrl } from "@/lib/utils/site-url";
import "./globals.css";

const SITE_TITLE = "ETHOS \uD589\uC815\uC0AC\uC0AC\uBB34\uC18C";
const SITE_DESCRIPTION =
  "\uBE44\uC790/\uCCB4\uB958, \uD589\uC815\uC2EC\uD310, \uACC4\uC57D\uC11C\u00B7\uC0AC\uC2E4\uC870\uC0AC, \uC778\uD5C8\uAC00 \uC5C5\uBB34. \uC808\uCC28\uC5D0\uB294 \uC774\uC131\uC744, \uC0AC\uB78C\uC5D0\uAC8C\uB294 \uACF5\uAC10\uC744, \uC77C\uC5D0\uB294 \uC2E0\uB8B0\uB97C.";
const SITE_URL = getSiteUrl();

export const viewport: Viewport = {
  themeColor: "#1a3c5f",
};

export const metadata: Metadata = {
  title: { default: SITE_TITLE, template: "%s | ETHOS" },
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
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('ethos.theme');if(t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.dataset.theme='dark';}}catch(e){}`,
          }}
        />
      </head>
      <body>
        <BrandIntro />
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
        <AiChatWidget />
        <LiveChat />
        <GA4ConversionTracker enabled={true} />
        <Analytics />
        <VercelAnalytics />
        <SpeedInsights />
        <PWARegister />
        <LocalBusinessJsonLd />
        <AbBootstrap />
        <BottomSheetMount />
        <OnboardingTour />
      </body>
    </html>
  );
}
