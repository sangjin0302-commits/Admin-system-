export type Experiment = {
  id: string;
  variants: string[];
  weights?: number[]; // default equal split
};

export const EXPERIMENTS: Record<string, Experiment> = {
  hero_cta: {
    id: "hero_cta",
    variants: ["control", "urgency", "benefit"],
  },
  form_fields: {
    id: "form_fields",
    variants: ["4field", "2field"],
  },
};
