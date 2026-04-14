import { MODEL_VERSION } from "../constants/model";
import type { LLMAnalysis, MatchupContext, Prediction, PredictionResult } from "../types/domain";
import type { LLMAnalysisParsed } from "../types/models";
import { formatProbability } from "../utils/formatters";
import { savePrediction } from "./database";

export interface TabularPredictFn {
  (features: number[]): Promise<number>;
}

export type LLMGenerateJSONFn = (
  prompt: string,
  opts?: { maxTokens?: number }
) => Promise<LLMAnalysisParsed>;

export interface RunPredictionArgs {
  matchup: MatchupContext;
  features: number[];
  mlpPredict: TabularPredictFn;
  llmGenerate?: LLMGenerateJSONFn | null;
}

export function buildLLMPrompt(
  matchup: MatchupContext,
  homeWinProb: number
): string {
  const { game, home, away } = matchup;
  const h = home.rolling;
  const a = away.rolling;
  const fmt = (n: number, digits = 1) => n.toFixed(digits);
  return [
    "You are a basketball data analyst. You MUST NOT suggest bets or wagering.",
    "You analyze numbers only.",
    "",
    `Game: ${away.team.abbr} @ ${home.team.abbr}, ${game.date}`,
    `Tabular model probability of home win: ${formatProbability(homeWinProb)}`,
    "",
    "Rolling last-10 averages:",
    `Home (${home.team.abbr}): PPG ${fmt(h.ppg)}, OppPPG ${fmt(h.papg)}, FG% ${fmt(h.fgPct * 100)}, 3P% ${fmt(h.threePct * 100)}, Net ${fmt(h.netRating)}, Rest ${home.restDays}d`,
    `Away (${away.team.abbr}): PPG ${fmt(a.ppg)}, OppPPG ${fmt(a.papg)}, FG% ${fmt(a.fgPct * 100)}, 3P% ${fmt(a.threePct * 100)}, Net ${fmt(a.netRating)}, Rest ${away.restDays}d`,
    "",
    "Return ONLY valid JSON matching this schema, no prose:",
    '{"keyFactorsHome": [string, string, string], "keyFactorsAway": [string, string, string], "confidence": number between 0 and 1, "uncertaintyNotes": [string, string]}',
  ].join("\n");
}

function fallbackAnalysis(matchup: MatchupContext, homeWinProb: number): LLMAnalysis {
  const { home, away } = matchup;
  const netDelta = home.rolling.netRating - away.rolling.netRating;
  const restDelta = home.restDays - away.restDays;
  const probEdge = homeWinProb - 0.5;

  const homeFactors = [
    `Home rolling net rating ${home.rolling.netRating.toFixed(1)}`,
    `Rest advantage: ${restDelta >= 0 ? "+" : ""}${restDelta} days`,
    `Tabular edge: ${(probEdge * 100).toFixed(1)}pp for home`,
  ];
  const awayFactors = [
    `Away rolling net rating ${away.rolling.netRating.toFixed(1)}`,
    `Road team with ${away.rolling.ppg.toFixed(1)} PPG recent form`,
    away.backToBack ? "Back-to-back schedule" : `${away.restDays}d rest`,
  ];

  return {
    keyFactorsHome: homeFactors,
    keyFactorsAway: awayFactors,
    confidence: Math.min(0.9, Math.max(0.3, 0.5 + Math.abs(netDelta) / 20)),
    uncertaintyNotes: [
      "LLM analysis unavailable — factors derived from feature deltas only.",
      "No injury data considered in this fallback.",
    ],
  };
}

function analysisFromLLM(parsed: LLMAnalysisParsed): LLMAnalysis {
  return {
    keyFactorsHome: parsed.keyFactorsHome,
    keyFactorsAway: parsed.keyFactorsAway,
    confidence: parsed.confidence,
    uncertaintyNotes: parsed.uncertaintyNotes,
  };
}

export async function runPrediction(
  args: RunPredictionArgs
): Promise<PredictionResult> {
  try {
    const logitProb = await args.mlpPredict(args.features);
    const homeWinProb = Math.min(1, Math.max(0, logitProb));

    let analysis: LLMAnalysis;
    let reason: "llm_unavailable" | "llm_failed" | null = null;

    if (args.llmGenerate) {
      try {
        const prompt = buildLLMPrompt(args.matchup, homeWinProb);
        const parsed = await args.llmGenerate(prompt, { maxTokens: 300 });
        analysis = analysisFromLLM(parsed);
      } catch {
        analysis = fallbackAnalysis(args.matchup, homeWinProb);
        reason = "llm_failed";
      }
    } else {
      analysis = fallbackAnalysis(args.matchup, homeWinProb);
      reason = "llm_unavailable";
    }

    const prediction: Prediction = {
      gameId: args.matchup.game.id,
      createdAt: new Date().toISOString(),
      homeWinProb,
      analysis,
      modelVersion: MODEL_VERSION,
    };

    await savePrediction(prediction);

    return reason
      ? { kind: "mlp_only", prediction, reason }
      : { kind: "ready", prediction };
  } catch (e) {
    return {
      kind: "error",
      message: e instanceof Error ? e.message : String(e),
    };
  }
}
