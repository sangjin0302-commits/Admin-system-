import { LoadingState } from "@/components/ui/state-panel";

export default function AdminInquiryListLoadingSafe() {
  return (
    <LoadingState
      title="문의 목록을 불러오는 중입니다."
      description="우선순위, 작업 큐, 필터 결과를 정리하고 있습니다."
      rows={5}
    />
  );
}
