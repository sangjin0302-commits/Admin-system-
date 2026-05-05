import type { Metadata } from "next";

import { AppShellSafe } from "@/components/layout/app-shell-safe";
import "./globals.css";

const KO_SYSTEM_TITLE = "\uD589\uC815\uC0AC \uC5C5\uBB34 \uAD00\uB9AC \uC2DC\uC2A4\uD15C";
const KO_SYSTEM_DESCRIPTION =
  "\uD589\uC815\uC0AC \uBB38\uC758 \uC811\uC218, \uC790\uB3D9 \uBD84\uB958, \uACAC\uC801, \uC0AC\uAC74 \uAD00\uB9AC, \uC6B4\uC601 \uB300\uC2DC\uBCF4\uB4DC\uB97C \uC704\uD55C \uC2DC\uC2A4\uD15C";

export const metadata: Metadata = {
  title: KO_SYSTEM_TITLE,
  description: KO_SYSTEM_DESCRIPTION,
  applicationName: "\uD589\uC815\uC0AC \uC9C4\uD589\uC0C1\uD669 \uC870\uD68C",
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
      </body>
    </html>
  );
}
