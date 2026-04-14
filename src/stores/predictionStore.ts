import { create } from "zustand";

import type { Prediction } from "../types/domain";

interface PredictionStoreState {
  cache: Record<string, Prediction>;
  inFlight: Record<string, Promise<Prediction> | undefined>;
  setCached: (p: Prediction) => void;
  getCached: (gameId: string) => Prediction | undefined;
  getOrCompute: (gameId: string, fn: () => Promise<Prediction>) => Promise<Prediction>;
  clear: () => void;
}

export const usePredictionStore = create<PredictionStoreState>((set, get) => ({
  cache: {},
  inFlight: {},
  setCached(p) {
    set((s) => ({ cache: { ...s.cache, [p.gameId]: p } }));
  },
  getCached(gameId) {
    return get().cache[gameId];
  },
  async getOrCompute(gameId, fn) {
    const state = get();
    const cached = state.cache[gameId];
    if (cached) return cached;
    const existing = state.inFlight[gameId];
    if (existing) return existing;
    const promise = (async () => {
      try {
        const result = await fn();
        set((s) => ({
          cache: { ...s.cache, [gameId]: result },
          inFlight: { ...s.inFlight, [gameId]: undefined },
        }));
        return result;
      } catch (e) {
        set((s) => ({ inFlight: { ...s.inFlight, [gameId]: undefined } }));
        throw e;
      }
    })();
    set((s) => ({ inFlight: { ...s.inFlight, [gameId]: promise } }));
    return promise;
  },
  clear: () => set({ cache: {}, inFlight: {} }),
}));
