import { AdminLiveIndicator } from "@/components/admin/live-indicator";
import { AdminOpsBanner } from "@/components/admin/admin-ops-banner";
import { AdminSearchBar } from "@/components/admin/admin-search-bar";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminTopNav } from "@/components/admin/admin-top-nav";
import { AdminMobileNav } from "@/components/admin/mobile-nav";
import { InstallPWAPrompt } from "@/components/admin/install-pwa-prompt";
import { VoiceCommandMic } from "@/components/admin/voice-command-mic";
import { CommandPalette } from "@/components/admin/command-palette";
import { DarkModeToggle } from "@/components/admin/dark-mode-toggle";
import { AdminLogoutButton } from "@/components/admin/admin-logout-button";
import { QuickNoteFab } from "@/components/admin/quick-note-fab";
import { MacroHotkeyListener } from "@/components/admin/macro-hotkey-listener";
import { headers } from "next/headers";
import Link from "next/link";

import { countInquiries } from "@/lib/services/inquiry-service";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { isExperimentalAdminPath } from "@/lib/security/experimental-admin-pages";

/** 실험 페이지가 비활성일 때 본문 대신 보여주는 안내. 셸·메뉴는 그대로 두어 다른 화면으로 이동 가능. */
function ExperimentalDisabledNotice({ pathname }: { pathname: string }) {
  return (
    <section className="admin-card-static">
      <p className="ui-kicker">실험실</p>
      <h2 className="mt-2 text-xl font-semibold text-text-strong">비활성화된 실험 기능입니다</h2>
      <p className="mt-2 max-w-prose text-sm text-text-muted">
        이 페이지(<code className="rounded bg-surface-muted px-1 font-mono text-xs">{pathname}</code>)는
        실험·데모 성격이라 기본적으로 꺼져 있습니다. 페이지와 데이터는 그대로 보존됩니다.
      </p>
      <p className="mt-1 max-w-prose text-sm text-text-muted">
        필요하면 <Link href="/admin/features" className="font-medium text-primary underline underline-offset-2">기능 설정</Link>에서
        &ldquo;실험실 페이지 활성화&rdquo;를 켜면 즉시 다시 열립니다.
      </p>
      <div className="mt-5">
        <Link
          href="/admin"
          className="inline-flex items-center justify-center rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium text-text transition hover:border-line-strong hover:bg-surface-muted"
        >
          대시보드로 돌아가기
        </Link>
      </div>
    </section>
  );
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [
    newCount,
    darkToggleEnabled,
    quickNoteEnabled,
    macroHotkeysEnabled,
    macroServerSync,
    hideMode,
    showAdvanced,
    useTopNav,
    experimentalEnabled
  ] = await Promise.all([
    countInquiries({ status: "NEW" }).catch(() => 0),
    isFeatureEnabled("dark_mode_manual_toggle"),
    isFeatureEnabled("quick_note_fab"),
    isFeatureEnabled("macro_hotkeys"),
    isFeatureEnabled("macro_server_sync"),
    isFeatureEnabled("admin_hide_mode"),
    isFeatureEnabled("admin_show_advanced"),
    isFeatureEnabled("admin_top_nav_layout"),
    isFeatureEnabled("admin_experimental_pages")
  ]);

  // 실험 페이지 게이트 — 미들웨어가 실어 보낸 경로로 판정한다.
  const adminPathname = (await headers()).get("x-admin-pathname") ?? "";
  const experimentalBlocked =
    !experimentalEnabled && !!adminPathname && isExperimentalAdminPath(adminPathname);
  const content = experimentalBlocked ? (
    <ExperimentalDisabledNotice pathname={adminPathname} />
  ) : (
    children
  );

  const header = (
    <>
      <section className="admin-card-static">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <p className="ui-kicker">관리자 업무 공간</p>
              <AdminLiveIndicator />
            </div>
            <h2 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-text-strong lg:text-2xl">
              행정사 업무 관리 허브
            </h2>
            <p className="mt-1.5 text-[14px] text-text-muted leading-relaxed">
              문의 접수부터 상담, 견적, 사건 진행, 분석 연동 준비 상태까지 한 곳에서 보는 관리자 화면입니다.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex-1"><AdminSearchBar /></div>
              <DarkModeToggle enabled={darkToggleEnabled} />
              <AdminLogoutButton />
            </div>
          </div>
        </div>
      </section>
      <AdminOpsBanner />
    </>
  );

  const overlays = (
    <>
      <AdminMobileNav />
      <InstallPWAPrompt />
      <VoiceCommandMic />
      <CommandPalette />
      <QuickNoteFab enabled={quickNoteEnabled} />
      <MacroHotkeyListener enabled={macroHotkeysEnabled} serverSync={macroServerSync} />
    </>
  );

  if (useTopNav) {
    return (
      <div className="admin-body">
        <AdminTopNav newInquiryCount={newCount} hideMode={hideMode} showAdvanced={showAdvanced} />
        <div className="min-w-0 w-full space-y-5 p-2 lg:p-4 pb-16 lg:pb-4">
          {header}
          {content}
        </div>
        {overlays}
      </div>
    );
  }

  return (
    <div className="admin-body flex gap-6 p-2 lg:p-4">
      <AdminSidebar newInquiryCount={newCount} hideMode={hideMode} showAdvanced={showAdvanced} />
      <div className="min-w-0 flex-1 space-y-5 pb-16 lg:pb-0">
        {header}
        {content}
      </div>
      {overlays}
    </div>
  );
}
