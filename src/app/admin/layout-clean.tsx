import { AdminLiveIndicator } from "@/components/admin/live-indicator";
import { AdminOpsBanner } from "@/components/admin/admin-ops-banner";
import { AdminSearchBar } from "@/components/admin/admin-search-bar";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminMobileNav } from "@/components/admin/mobile-nav";
import { listInquiries } from "@/lib/services/inquiry-service";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let newCount = 0;
  try {
    const newInquiries = await listInquiries({ status: "NEW" });
    newCount = newInquiries.length;
  } catch { /* ignore */ }

  return (
    <div className="flex gap-6">
      <AdminSidebar newInquiryCount={newCount} />
      <div className="min-w-0 flex-1 space-y-6 pb-16 lg:pb-0">
        <section className="rounded-[20px] border border-line bg-surface px-5 py-5 shadow-panel">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <p className="ui-kicker">관리자 업무 공간</p>
                <AdminLiveIndicator />
              </div>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-text-strong">
                행정사 업무 관리 허브
              </h2>
              <p className="mt-2 text-sm text-text-muted">
                문의 접수부터 상담, 견적, 사건 진행, 분석 연동 준비 상태까지 한 곳에서 보는 관리자 화면입니다.
              </p>
              <div className="mt-4">
                <AdminSearchBar />
              </div>
            </div>
          </div>
        </section>

        <AdminOpsBanner />

        {children}
      </div>
      <AdminMobileNav />
    </div>
  );
}
