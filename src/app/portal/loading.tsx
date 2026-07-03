import { LoadingState } from "@/components/ui/state-panel";

export default function PortalLoading() {
  return (
    <LoadingState
      title="고객 포털을 불러오고 있습니다."
      description="사건 진행 상황과 알림을 확인하고 있습니다."
      rows={3}
    />
  );
}
