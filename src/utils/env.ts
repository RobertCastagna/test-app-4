function read(key: string, fallback: string): string {
  const v = process.env[key];
  return v == null || v === "" ? fallback : v;
}

function readRequired(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing required env var: ${key}`);
  return v;
}

export const ENV = {
  BALLDONTLIE_API_KEY: read("EXPO_PUBLIC_BALLDONTLIE_API_KEY", ""),
  LLM_MODEL_URL: read(
    "EXPO_PUBLIC_LLM_MODEL_URL",
    "https://huggingface.co/executorch-community/Llama-3.2-1B-Instruct-ExecuTorch/resolve/main/llama3_2_1B_instruct_xnnpack.pte"
  ),
  LLM_TOKENIZER_URL: read(
    "EXPO_PUBLIC_LLM_TOKENIZER_URL",
    "https://huggingface.co/executorch-community/Llama-3.2-1B-Instruct-ExecuTorch/resolve/main/tokenizer.bin"
  ),
  LLM_CHECKSUM_SHA256: read("EXPO_PUBLIC_LLM_CHECKSUM_SHA256", ""),
};

export { read, readRequired };
