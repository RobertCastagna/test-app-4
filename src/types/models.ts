import { z } from "zod";

export const LLMAnalysisSchema = z.object({
  keyFactorsHome: z.array(z.string().min(1)).min(1).max(5),
  keyFactorsAway: z.array(z.string().min(1)).min(1).max(5),
  confidence: z.number().min(0).max(1),
  uncertaintyNotes: z.array(z.string().min(1)).min(0).max(5),
});

export type LLMAnalysisParsed = z.infer<typeof LLMAnalysisSchema>;

export interface TabularInference {
  logit: number;
  homeWinProb: number;
}

export interface ModelReadyState {
  mlp: "ready" | "loading" | "error";
  llm: "ready" | "downloading" | "not_downloaded" | "disabled" | "error";
  progress?: number;
  localUri?: string;
  tokenizerUri?: string;
  error?: string;
}
