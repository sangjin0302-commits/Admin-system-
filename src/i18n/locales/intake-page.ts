import type { LocaleMessages } from "@/i18n/shared";

type IntakePageKey = "switchToEnglish" | "switchToKorean";

export const intakePageMessages: LocaleMessages<IntakePageKey> = {
  ko: {
    switchToEnglish: "English",
    switchToKorean: "한국어"
  },
  en: {
    switchToEnglish: "English",
    switchToKorean: "Korean"
  }
};
