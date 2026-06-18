import type { Metadata } from "next";

import { AppShellSafe } from "@/components/layout/app-shell-safe";
import { Analytics } from "@/components/public/analytics";
import { ToastProvider } from "@/components/ui/toast-provider";
import "./globals.css";

const SITE_TITLE = "ETHOS \uD589\uC815\uC0AC\uC0AC\uBB34\uC18C";
const SITE_DESCRIPTION =
  "\uBE44\uC790/\uCCB4\uB958, \uD589\uC815\uC2EC\uD310, \uACC4\uC57D\uC11C\u00B7\uC0AC\uC2E4\uC870\uC0AC, \uC778\uD5C8\uAC00 \uC5C5\uBB34. \uC808\uCC28\uC5D0\uB294 \uC774\uC131\uC744, \uC0AC\uB78C\uC5D0\uAC8C\uB294 \uACF5\uAC10\uC744, \uC77C\uC5D0\uB294 \uC2E0\uB8B0\uB97C.";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ethos.kr";

export const metadata: Metadata = {
  title: { default: SITE_TITLE, template: "%s | ETHOS" },
  description: SITE_DESCRIPTION,
  applicationName: SITE_TITLE,
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: "/",
    languages: { ko: "/", en: "/?lang=en", "x-default": "/" }
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
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "\uC9C4\uD589\uC0C1\uD669",
    statusBarStyle: "default"
  },
  icons: {
    icon: [
      {
        url: "/icons/tracking-192.svg",
        sizes: "192x192",
        type: "image/svg+xml"
      },
      {
        url: "/icons/tracking-512.svg",
        sizes: "512x512",
        type: "image/svg+xml"
      }
    ],
    apple: [
      {
        url: "/icons/tracking-192.svg",
        sizes: "192x192",
        type: "image/svg+xml"
      }
    ]
  },
  other: {
    "theme-color": "#0f4c81",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-title": "\uC9C4\uD589\uC0C1\uD669"
  }
};

export default function RootLayoutSafe({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <AppShellSafe>{children}</AppShellSafe>
        <ToastProvider />
        <Analytics />
      </body>
    </html>
  );
}
