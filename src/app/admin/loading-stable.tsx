import { LoadingState } from "@/components/ui/state-panel";

export default function AdminLoading() {
  return (
    <LoadingState
      title="관리자 화면을 준비하고 있습니다."
      description="문의, 견적, 사건, 연동 상태를 불러오고 있습니다."
      rows={4}
    />
  );
}
