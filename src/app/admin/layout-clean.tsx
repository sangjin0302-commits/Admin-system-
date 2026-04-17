import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <section className="rounded-[20px] border border-line bg-surface px-5 py-5 shadow-panel">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="ui-kicker">\uAD00\uB9AC\uC790 \uC5C5\uBB34 \uACF5\uAC04</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-text-strong">
              \uD589\uC815\uC0AC \uC5C5\uBB34 \uAD00\uB9AC \uD5C8\uBE0C
            </h1>
            <p className="mt-2 text-sm text-text-muted">
              \uBB38\uC758 \uC811\uC218\uBD80\uD130 \uC0C1\uB2F4, \uACAC\uC801, \uC0AC\uAC74 \uC9C4\uD589, \uBD84\uC11D \uC5F0\uB3D9 \uC900\uBE44 \uC0C1\uD0DC\uAE4C\uC9C0
              \uD55C \uACF3\uC5D0\uC11C \uBCF4\uB294 \uAD00\uB9AC\uC790 \uD654\uBA74\uC785\uB2C8\uB2E4.
            </p>
          </div>
          <nav className="flex flex-wrap gap-2">
            <Link
              href="/admin"
              className="inline-flex h-10 items-center rounded-full border border-line-strong bg-surface px-4 text-sm font-medium text-text-strong transition hover:bg-surface-muted"
            >
              \uB300\uC2DC\uBCF4\uB4DC
            </Link>
            <Link
              href="/admin/inquiries"
              className="inline-flex h-10 items-center rounded-full border border-line-strong bg-surface px-4 text-sm font-medium text-text-strong transition hover:bg-surface-muted"
            >
              \uBB38\uC758 \uBAA9\uB85D
            </Link>
            <Link
              href="/admin/integrations"
              className="inline-flex h-10 items-center rounded-full border border-line-strong bg-surface px-4 text-sm font-medium text-text-strong transition hover:bg-surface-muted"
            >
              \uC5F0\uB3D9 \uC13C\uD130
            </Link>
            <Link
              href="/admin/monitoring"
              className="inline-flex h-10 items-center rounded-full border border-line-strong bg-surface px-4 text-sm font-medium text-text-strong transition hover:bg-surface-muted"
            >
              \uBAA8\uB2C8\uD130\uB9C1
            </Link>
          </nav>
        </div>
      </section>

      {children}
    </div>
  );
}
