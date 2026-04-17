import { LoadingState } from "@/components/ui/state-panel";

export default function AdminInquiryDetailLoading() {
  return (
    <LoadingState
      title="사건 상세를 불러오는 중입니다."
      description="고객 사건, Lawbot 결과, 견적 워크스페이스를 준비하고 있습니다."
      rows={6}
    />
  );
}
