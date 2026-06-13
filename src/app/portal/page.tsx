import Link from "next/link";
import { redirect } from "next/navigation";

import { Card } from "@/components/ui/card";
import { auth, signOut } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma/client";

export const dynamic = "force-dynamic";

export default async function PortalDashboard() {
  const session = await auth();
  if (!session?.user) {
    redirect("/portal/signin");
  }

  const userId = (session.user as { id?: string }).id;
  const client = userId
    ? await prisma.portalClient.findUnique({
        where: { id: userId },
        include: { uploadedFiles: { orderBy: { uploadedAt: "desc" }, take: 10 } }
      })
    : null;

  // 연결된 inquiry 조회 (이메일 일치)
  const inquiries = client
    ? await prisma.inquiry.findMany({
        where: { email: client.email },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
          publicTrackingCode: true,
          caseMatters: {
            select: { id: true, caseNo: true, title: true, status: true, category: true }
          }
        },
        take: 20
      })
    : [];

  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-12 sm:px-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-serif text-xs uppercase tracking-[0.3em] text-gold-deep">Client Portal</p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-primary">
            {client?.name}님, 환영합니다
          </h1>
          <p className="mt-1 text-sm text-text-muted">{client?.email}</p>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="rounded-lg border border-gold/40 bg-surface px-4 py-2 text-sm font-semibold text-primary hover:bg-gold-soft/30"
          >
            로그아웃
          </button>
        </form>
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat title="문의" value={inquiries.length} />
        <Stat title="진행 사건" value={inquiries.flatMap((i) => i.caseMatters).length} />
        <Stat title="업로드 자료" value={client?.uploadedFiles.length ?? 0} />
      </div>

      {/* 문의 목록 */}
      <section>
        <h2 className="font-serif text-xl font-bold text-primary">내 문의 / 사건</h2>
        {inquiries.length === 0 ? (
          <Card className="mt-4 p-8 text-center">
            <p className="text-sm text-text-muted">아직 접수된 문의가 없습니다.</p>
            <Link
              href="/intake"
              className="mt-4 inline-flex h-10 items-center rounded-lg bg-primary px-5 text-sm font-bold text-white hover:bg-text-strong"
            >
              상담 신청하기
            </Link>
          </Card>
        ) : (
          <div className="mt-4 space-y-3">
            {inquiries.map((iq) => (
              <Card key={iq.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-serif text-base font-bold text-primary">{iq.title}</p>
                    <p className="mt-1 text-xs text-text-muted">
                      {new Date(iq.createdAt).toLocaleDateString("ko-KR")} · 상태: {iq.status}
                    </p>
                  </div>
                  {iq.publicTrackingCode && (
                    <Link
                      href={`/track?code=${iq.publicTrackingCode}`}
                      className="rounded-full bg-gold-soft/60 px-3 py-1 text-xs font-bold text-gold-deep"
                    >
                      {iq.publicTrackingCode}
                    </Link>
                  )}
                </div>
                {iq.caseMatters.length > 0 && (
                  <div className="mt-3 space-y-2 border-t border-gold/20 pt-3">
                    {iq.caseMatters.map((c) => (
                      <Link
                        key={c.id}
                        href={`/portal/cases/${c.id}`}
                        className="flex items-center justify-between rounded-lg px-2 py-1 text-sm hover:bg-gold-soft/30"
                      >
                        <div>
                          <span className="font-bold text-text-strong">{c.title}</span>
                          <span className="ml-2 text-xs text-text-muted">{c.caseNo ?? "-"}</span>
                        </div>
                        <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs">{c.status}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* 자료 업로드 */}
      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl font-bold text-primary">내 자료</h2>
          <Link
            href="/portal/upload"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-text-strong"
          >
            자료 업로드
          </Link>
        </div>
        {!client?.uploadedFiles.length ? (
          <Card className="mt-4 p-6 text-center text-sm text-text-muted">아직 업로드한 자료가 없습니다.</Card>
        ) : (
          <Card className="mt-4 overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead className="bg-surface-muted/60 text-xs uppercase tracking-wider text-gold-deep">
                <tr>
                  <th className="px-4 py-3 text-left font-serif">파일명</th>
                  <th className="px-4 py-3 text-left font-serif">크기</th>
                  <th className="px-4 py-3 text-left font-serif">업로드 일자</th>
                </tr>
              </thead>
              <tbody>
                {client.uploadedFiles.map((f) => (
                  <tr key={f.id} className="border-t border-gold/15">
                    <td className="px-4 py-3 font-bold text-text-strong">{f.fileName}</td>
                    <td className="px-4 py-3 text-text-muted">{(f.sizeBytes / 1024).toFixed(1)} KB</td>
                    <td className="px-4 py-3 text-text-muted">
                      {new Date(f.uploadedAt).toLocaleDateString("ko-KR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </section>
    </div>
  );
}

function Stat({ title, value }: { title: string; value: number }) {
  return (
    <Card className="p-5">
      <p className="font-serif text-xs uppercase tracking-wider text-gold-deep">{title}</p>
      <p className="mt-2 font-serif text-3xl font-bold text-primary">{value}</p>
    </Card>
  );
}
