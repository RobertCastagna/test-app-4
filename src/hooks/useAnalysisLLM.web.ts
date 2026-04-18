/**
 * Web stub for useAnalysisLLM.
 *
 * react-native-executorch is a native-only package and cannot be bundled for
 * web. Metro resolves platform-specific files (.web.ts > .ts), so this stub
 * is loaded automatically for web builds while the real hook is used on
 * iOS/Android.
 */

import type { LLMAnalysisParsed } from "../types/models";

export interface UseAnalysisLLMResult {
  isAvailable: boolean;
  downloadProgress: number;
  generateJSON: (
    prompt: string,
    opts?: { maxTokens?: number }
  ) => Promise<LLMAnalysisParsed>;
}

export function useAnalysisLLM(): UseAnalysisLLMResult {
  return {
    isAvailable: false,
    downloadProgress: 0,
    generateJSON: () =>
      Promise.reject(new Error("LLM inference is not available on web.")),
  };
}
