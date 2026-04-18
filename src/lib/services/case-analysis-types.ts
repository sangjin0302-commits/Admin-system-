export type LawReference = {
  title: string;
  summary: string;
  keywords: string[];
};

export type PrecedentReference = {
  query: string;
  summary: string;
  keywords: string[];
};

export type AnalysisProfile = {
  laws: LawReference[];
  precedents: PrecedentReference[];
  issues: string[];
  favorableFactors: string[];
  riskFactors: string[];
  missingFacts: string[];
};

export type StrengthLabel = "강함" | "보통" | "주의" | "불리";
export type ResolutionOutlook = "높음" | "중간" | "신중" | "낮음";

export type InquiryCaseAnalysis = {
  strengthScore: number;
  strengthLabel: StrengthLabel;
  resolutionProbabilityPercent: number;
  resolutionOutlook: ResolutionOutlook;
  confidenceNote: string;
  summary: string;
  issues: string[];
  favorableFactors: string[];
  riskFactors: string[];
  missingFacts: string[];
  immediateActions: string[];
  communicationGuidance: {
    internalBrief: string;
    clientSummary: string;
    documentRequest: string;
  };
  lawReferences: LawReference[];
  precedentReferences: PrecedentReference[];
  recommendedAction: string;
};
