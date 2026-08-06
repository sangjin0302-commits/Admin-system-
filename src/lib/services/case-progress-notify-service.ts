/**
 * 사건 진행 상태 변경 알림 서비스.
 *
 * 정본은 case-status-notify.ts 로 통합됨. 이 파일은 기존 import 경로/이름을
 * 유지하기 위한 얇은 재-export 래퍼이며 STATUS_LABELS·이메일·포털 로직을
 * 중복 보관하지 않는다.
 */

export { notifyCaseStatusChange } from "@/lib/services/case-status-notify";
