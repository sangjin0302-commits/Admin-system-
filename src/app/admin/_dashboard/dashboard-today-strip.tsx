import { DashboardTodayWidget, type TodayItem } from "@/components/admin/dashboard-today-widget";
import { AdvisorSummaryCard } from "@/components/admin/advisor-summary-card";
import { RecentActivityCard } from "@/components/admin/recent-activity-card";

export function DashboardTodayStrip({ todayItems }: { todayItems: TodayItem[] }) {
  if (todayItems.length > 0) {
    return (
      <div className="grid gap-6 xl:grid-cols-[1fr_2fr]">
        <DashboardTodayWidget items={todayItems} />
        <div className="grid gap-6 md:grid-cols-2">
          <AdvisorSummaryCard />
          <RecentActivityCard />
        </div>
      </div>
    );
  }
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <AdvisorSummaryCard />
      <RecentActivityCard />
    </div>
  );
}
