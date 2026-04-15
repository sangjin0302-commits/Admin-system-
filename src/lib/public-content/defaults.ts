export type EditableIntakeContent = {
  heroTitle: string;
  heroDescription: string;
  primaryAreas: string[];
  additionalGuidance: string[];
  intakePageTitle: string;
  intakePageDescription: string;
  intakeInfoTitle: string;
  intakeInfoItems: string[];
};

export type PublicIntakeContent = {
  ko: EditableIntakeContent;
  en: EditableIntakeContent;
};

export const PUBLIC_CONTENT_SETTINGS_ID = "public-intake";

export const defaultPublicIntakeContent: PublicIntakeContent = {
  ko: {
    heroTitle: "외부 공개 접수와 내부 운영 관리를 분리한 상담 시스템",
    heroDescription:
      "이제 외부 채널에서는 공개 접수 링크만 사용하고, 내부 운영팀은 관리자 화면에서만 처리할 수 있습니다. 네이버 블로그, 카페, 링크 버튼, 광고 랜딩에서 공개 접수 경로를 그대로 연결하면 됩니다.",
    primaryAreas: [
      "외국인 비자",
      "출입국 / 체류",
      "행정심판",
      "인허가"
    ],
    additionalGuidance: [
      "그 밖의 행정사 업무도 접수할 수 있으며, 내용 확인 후 추가 안내가 필요한 분야로 분류될 수 있습니다.",
      "번역·공증, 아포스티유·영사확인처럼 직접 수행하지 않는 업무는 제휴 또는 안내 가능 여부를 별도로 검토합니다.",
      "블로그, 광고, 카페, 문자 링크에는 공개 접수 경로만 연결하고 내부 운영 링크는 노출하지 않는 것을 권장합니다."
    ],
    intakePageTitle: "전문 분야 중심의 초기 상담 접수",
    intakePageDescription:
      "접수 내용을 바탕으로 문의 유형, 긴급도, 기본 안내 메시지가 자동 생성됩니다. 최종 진행 가능 여부와 처리 방향은 관리자 검토 후 확정됩니다.",
    intakeInfoTitle: "안내",
    intakeInfoItems: [
      "주요 전문 분야는 외국인 비자, 출입국·체류, 행정심판, 인허가입니다.",
      "그 밖의 행정사 업무도 접수할 수 있으며, 내용 확인 후 추가 안내가 필요한 분야로 분류될 수 있습니다.",
      "번역·공증, 아포스티유·영사확인처럼 직접 수행하지 않는 업무는 제휴 또는 안내 가능 여부를 별도로 검토합니다.",
      "영문 접수도 가능하지만 실제 진행 가능 여부는 관리자 검토 후 확정됩니다."
    ]
  },
  en: {
    heroTitle: "A consultation system that separates public intake from internal operations",
    heroDescription:
      "External channels can use a single public intake link, while the internal team handles review and operations only inside the admin workspace.",
    primaryAreas: [
      "Foreigner Visa",
      "Immigration / Stay",
      "Administrative Appeal",
      "Licenses / Permits"
    ],
    additionalGuidance: [
      "Other administrative matters may also be submitted and can be classified for additional review after intake.",
      "For translation, notarization, apostille, or consular legalization, we may first review whether guidance or referral is appropriate.",
      "For blogs or ad channels, we recommend exposing only the public intake route and not the internal admin links."
    ],
    intakePageTitle: "Initial consultation intake centered on core specialties",
    intakePageDescription:
      "After submission, the system generates a provisional inquiry type, urgency level, and client guidance draft. Final handling is confirmed after admin review.",
    intakeInfoTitle: "Notes",
    intakeInfoItems: [
      "Core specialties include foreigner visas, immigration and stay matters, administrative appeals, and licenses or permits.",
      "Other administrative matters may also be submitted and can be classified for additional review after intake.",
      "For translation, notarization, apostille, or consular legalization, we may first review whether guidance or referral is appropriate.",
      "You may submit in English, but final handling is confirmed after admin review."
    ]
  }
};
