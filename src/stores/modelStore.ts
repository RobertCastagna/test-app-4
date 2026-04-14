import { create } from "zustand";

export type ModelStatus =
  | "idle"
  | "loading"
  | "downloading"
  | "ready"
  | "error";

interface ModelStoreState {
  mlp: ModelStatus;
  llm: ModelStatus;
  downloadProgress: number;
  error: string | null;
  setMlp: (s: ModelStatus) => void;
  setLlm: (s: ModelStatus) => void;
  setDownloadProgress: (n: number) => void;
  setError: (e: string | null) => void;
  reset: () => void;
}

export const useModelStore = create<ModelStoreState>((set) => ({
  mlp: "idle",
  llm: "idle",
  downloadProgress: 0,
  error: null,
  setMlp: (mlp) => set({ mlp }),
  setLlm: (llm) => set({ llm }),
  setDownloadProgress: (downloadProgress) => set({ downloadProgress }),
  setError: (error) => set({ error }),
  reset: () => set({ mlp: "idle", llm: "idle", downloadProgress: 0, error: null }),
}));
