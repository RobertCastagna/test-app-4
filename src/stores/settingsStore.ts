import { create } from "zustand";
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware";

import { getKv, setKv } from "../services/database";

const sqliteStorage: StateStorage = {
  getItem: async (name) => (await getKv(name)) ?? null,
  setItem: async (name, value) => {
    await setKv(name, value);
  },
  removeItem: async (name) => {
    await setKv(name, "");
  },
};

export interface SettingsState {
  ageVerified: boolean;
  jurisdictionConfirmed: boolean;
  disclaimersAcceptedAt: string | null;
  preferredSport: "nba";
  llmEnabled: boolean;
  debugMode: boolean;
  theme: "system" | "light" | "dark";

  setAgeVerified: (v: boolean) => void;
  setJurisdictionConfirmed: (v: boolean) => void;
  acceptDisclaimers: () => void;
  setLlmEnabled: (v: boolean) => void;
  setDebugMode: (v: boolean) => void;
  setTheme: (t: SettingsState["theme"]) => void;
  resetOnboarding: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ageVerified: false,
      jurisdictionConfirmed: false,
      disclaimersAcceptedAt: null,
      preferredSport: "nba",
      llmEnabled: true,
      debugMode: false,
      theme: "system",
      setAgeVerified: (v) => set({ ageVerified: v }),
      setJurisdictionConfirmed: (v) => set({ jurisdictionConfirmed: v }),
      acceptDisclaimers: () => set({ disclaimersAcceptedAt: new Date().toISOString() }),
      setLlmEnabled: (v) => set({ llmEnabled: v }),
      setDebugMode: (v) => set({ debugMode: v }),
      setTheme: (theme) => set({ theme }),
      resetOnboarding: () =>
        set({
          ageVerified: false,
          jurisdictionConfirmed: false,
          disclaimersAcceptedAt: null,
        }),
    }),
    {
      name: "settings_v1",
      storage: createJSONStorage(() => sqliteStorage),
    }
  )
);

export function isOnboardingComplete(state: SettingsState): boolean {
  return (
    state.ageVerified &&
    state.jurisdictionConfirmed &&
    state.disclaimersAcceptedAt != null
  );
}
