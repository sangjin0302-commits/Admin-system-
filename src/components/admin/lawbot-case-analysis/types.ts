import type { LawbotCaseAnalysisResult } from "@/lib/services/lawbot-case-analysis-service";

export type AvailableLawbotData = Extract<LawbotCaseAnalysisResult, { status: "available" }>["data"];
