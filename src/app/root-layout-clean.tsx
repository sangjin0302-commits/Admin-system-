import type { Metadata } from "next";

import { AppShell } from "@/components/layout/app-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "행정사 업무 관리 시스템",
  description:
    "행정사 문의 접수, 자동 분류, 견적, 사건 관리, 운영 대시보드를 위한 시스템"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
