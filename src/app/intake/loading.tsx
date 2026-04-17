import { LoadingState } from "@/components/ui/state-panel";

export default function IntakeLoading() {
  return (
    <LoadingState
      title="접수 화면을 준비하고 있습니다."
      description="상담 접수 폼과 안내 문구를 불러오고 있습니다."
      rows={4}
    />
  );
}
