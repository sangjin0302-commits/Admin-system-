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
import { listInquiries } from "@/lib/services/inquiry-service";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let newCount = 0;
  try {
    const newInquiries = await listInquiries({ status: "NEW" });
    newCount = newInquiries.length;
  } catch { /* ignore */ }
  const darkToggleEnabled = await isFeatureEnabled("dark_mode_manual_toggle");
  const quickNoteEnabled = await isFeatureEnabled("quick_note_fab");
  const macroHotkeysEnabled = await isFeatureEnabled("macro_hotkeys");
  const macroServerSync = await isFeatureEnabled("macro_server_sync");
  const hideMode = await isFeatureEnabled("admin_hide_mode");
  const showAdvanced = await isFeatureEnabled("admin_show_advanced");
  const useTopNav = await isFeatureEnabled("admin_top_nav_layout");

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
          {children}
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
        {children}
      </div>
      {overlays}
    </div>
  );
}
