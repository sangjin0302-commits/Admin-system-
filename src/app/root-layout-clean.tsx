import type { Metadata } from "next";
import Link from "next/link";

import "./globals.css";

export const metadata: Metadata = {
  title: "\uD589\uC815\uC0AC \uC5C5\uBB34 \uAD00\uB9AC \uC2DC\uC2A4\uD15C",
  description:
    "\uD589\uC815\uC0AC \uBB38\uC758 \uC811\uC218, \uC790\uB3D9 \uBD84\uB958, \uACAC\uC801, \uC0AC\uAC74 \uAD00\uB9AC, \uC6B4\uC601 \uB300\uC2DC\uBCF4\uB4DC\uB97C \uC704\uD55C \uC2DC\uC2A4\uD15C"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <div className="ui-shell">
          <header className="mb-6 rounded-lg border border-line bg-surface px-5 py-4 shadow-panel">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="ui-kicker">Administrative Office Intake System</p>
                <h1 className="mt-1 text-xl font-semibold text-text-strong">
                  \uD589\uC815\uC0AC \uBB38\uC758 \uC811\uC218 \uBC0F \uC5C5\uBB34 \uAD00\uB9AC \uC2DC\uC2A4\uD15C
                </h1>
              </div>
              <nav className="flex flex-wrap gap-2 text-sm font-medium">
                <Link
                  href="/intake"
                  className="inline-flex h-10 items-center rounded-md border border-line-strong bg-surface px-4 text-text-strong transition hover:bg-surface-muted"
                >
                  \uACF5\uAC1C \uC811\uC218
                </Link>
                <Link
                  href="/admin"
                  className="inline-flex h-10 items-center rounded-md border border-primary bg-primary px-4 text-white transition hover:bg-[#143d5d]"
                >
                  \uAD00\uB9AC\uC790
                </Link>
              </nav>
            </div>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
