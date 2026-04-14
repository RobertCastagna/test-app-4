import { useCallback, useEffect } from "react";
import { LLAMA3_2_1B_SPINQUANT, useLLM } from "react-native-executorch";

import { useModelStore } from "../stores/modelStore";
import { useSettingsStore } from "../stores/settingsStore";
import { LLMAnalysisSchema, type LLMAnalysisParsed } from "../types/models";

export interface UseAnalysisLLMResult {
  isAvailable: boolean;
  downloadProgress: number;
  generateJSON: (prompt: string, opts?: { maxTokens?: number }) => Promise<LLMAnalysisParsed>;
}

function extractJsonBlock(text: string): string {
  const trimmed = text.trim();
  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first < 0 || last < first) return trimmed;
  return trimmed.slice(first, last + 1);
}

const SYSTEM_PROMPT =
  "You are a basketball data analyst. You MUST NOT suggest bets or wagering. Analyze numbers only and respond with strict JSON.";

export function useAnalysisLLM(): UseAnalysisLLMResult {
  const llmEnabled = useSettingsStore((s) => s.llmEnabled);
  const setLlm = useModelStore((s) => s.setLlm);
  const setDownloadProgress = useModelStore((s) => s.setDownloadProgress);
  const setError = useModelStore((s) => s.setError);

  const llm = useLLM({
    model: LLAMA3_2_1B_SPINQUANT,
    preventLoad: !llmEnabled,
  });

  useEffect(() => {
    if (!llmEnabled) {
      setLlm("idle");
      return;
    }
    if (llm.error) {
      setLlm("error");
      setError(String(llm.error));
      return;
    }
    if (llm.isReady) {
      setLlm("ready");
      return;
    }
    if (llm.downloadProgress > 0 && llm.downloadProgress < 1) {
      setLlm("downloading");
      setDownloadProgress(llm.downloadProgress);
      return;
    }
    setLlm("loading");
  }, [
    llmEnabled,
    llm.isReady,
    llm.error,
    llm.downloadProgress,
    setLlm,
    setDownloadProgress,
    setError,
  ]);

  const generateJSON = useCallback(
    async (prompt: string, opts?: { maxTokens?: number }): Promise<LLMAnalysisParsed> => {
      if (!llm.isReady) throw new Error("LLM not ready");
      void opts;

      const messages = [
        { role: "system" as const, content: SYSTEM_PROMPT },
        { role: "user" as const, content: prompt },
      ];

      const first = await llm.generate(messages);
      try {
        return LLMAnalysisSchema.parse(JSON.parse(extractJsonBlock(first)));
      } catch {
        const retryMessages = [
          ...messages,
          { role: "assistant" as const, content: first },
          {
            role: "user" as const,
            content:
              "Your previous response was not valid JSON. Output ONLY a JSON object matching the schema.",
          },
        ];
        const retry = await llm.generate(retryMessages);
        return LLMAnalysisSchema.parse(JSON.parse(extractJsonBlock(retry)));
      }
    },
    [llm]
  );

  return {
    isAvailable: Boolean(llmEnabled && llm.isReady),
    downloadProgress: llm.downloadProgress ?? 0,
    generateJSON,
  };
}
