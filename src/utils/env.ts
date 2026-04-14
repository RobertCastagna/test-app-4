const DEFAULT_LLM_MODEL_URL =
  "https://huggingface.co/executorch-community/Llama-3.2-1B-Instruct-ExecuTorch/resolve/main/llama3_2_1B_instruct_xnnpack.pte";
const DEFAULT_LLM_TOKENIZER_URL =
  "https://huggingface.co/executorch-community/Llama-3.2-1B-Instruct-ExecuTorch/resolve/main/tokenizer.bin";

function take(raw: string | undefined, fallback: string): string {
  return raw == null || raw === "" ? fallback : raw;
}

export const ENV = {
  BALLDONTLIE_API_KEY: take(process.env.EXPO_PUBLIC_BALLDONTLIE_API_KEY, ""),
  LLM_MODEL_URL: take(process.env.EXPO_PUBLIC_LLM_MODEL_URL, DEFAULT_LLM_MODEL_URL),
  LLM_TOKENIZER_URL: take(
    process.env.EXPO_PUBLIC_LLM_TOKENIZER_URL,
    DEFAULT_LLM_TOKENIZER_URL
  ),
  LLM_CHECKSUM_SHA256: take(process.env.EXPO_PUBLIC_LLM_CHECKSUM_SHA256, ""),
};
