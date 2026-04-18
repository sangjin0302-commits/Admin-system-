import type { Metadata } from "next";

import { AppShellSafe } from "@/components/layout/app-shell-safe";
import "./globals.css";

const KO_SYSTEM_TITLE = "\uD589\uC815\uC0AC \uC5C5\uBB34 \uAD00\uB9AC \uC2DC\uC2A4\uD15C";
const KO_SYSTEM_DESCRIPTION =
  "\uD589\uC815\uC0AC \uBB38\uC758 \uC811\uC218, \uC790\uB3D9 \uBD84\uB958, \uACAC\uC801, \uC0AC\uAC74 \uAD00\uB9AC, \uC6B4\uC601 \uB300\uC2DC\uBCF4\uB4DC\uB97C \uC704\uD55C \uC2DC\uC2A4\uD15C";

export const metadata: Metadata = {
  title: KO_SYSTEM_TITLE,
  description: KO_SYSTEM_DESCRIPTION
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
