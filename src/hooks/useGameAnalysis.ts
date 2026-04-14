import { useQuery } from "@tanstack/react-query";

import { getPrediction } from "../services/database";
import { buildFeatures } from "../services/featureEngineering";
import { runPrediction } from "../services/inferenceService";
import type { GameId, MatchupContext, PredictionResult } from "../types/domain";
import { useAnalysisLLM } from "./useAnalysisLLM";
import { useTabularModel } from "./useTabularModel";

export interface UseGameAnalysisInput {
  gameId: GameId;
  matchup: MatchupContext | null;
  featureInput: Parameters<typeof buildFeatures>[0] | null;
  enabled?: boolean;
}

const FRESH_MS = 1000 * 60 * 30;

export function useGameAnalysis(input: UseGameAnalysisInput) {
  const mlp = useTabularModel();
  const llm = useAnalysisLLM();

  return useQuery<PredictionResult>({
    queryKey: ["analysis", input.gameId, mlp.isReady, llm.isAvailable],
    enabled: Boolean(
      input.enabled !== false &&
        input.gameId &&
        input.matchup &&
        input.featureInput &&
        mlp.isReady
    ),
    staleTime: FRESH_MS,
    queryFn: async (): Promise<PredictionResult> => {
      const cached = await getPrediction(input.gameId);
      if (cached) {
        const age = Date.now() - Date.parse(cached.createdAt);
        if (age < FRESH_MS) {
          return { kind: "ready", prediction: cached };
        }
      }
      if (!input.matchup || !input.featureInput) {
        return { kind: "error", message: "Matchup context unavailable" };
      }
      const featsResult = buildFeatures(input.featureInput);
      if (!featsResult.ok) {
        return { kind: "error", message: featsResult.error.message };
      }
      return runPrediction({
        matchup: input.matchup,
        features: featsResult.value.v,
        mlpPredict: mlp.predict,
        llmGenerate: llm.isAvailable ? llm.generateJSON : null,
      });
    },
  });
}
