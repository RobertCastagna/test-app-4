import { isOnboardingComplete, useSettingsStore } from "../stores/settingsStore";

export function useOnboardingGate(): {
  complete: boolean;
  ageVerified: boolean;
  jurisdictionConfirmed: boolean;
  disclaimersAccepted: boolean;
} {
  const state = useSettingsStore();
  return {
    complete: isOnboardingComplete(state),
    ageVerified: state.ageVerified,
    jurisdictionConfirmed: state.jurisdictionConfirmed,
    disclaimersAccepted: state.disclaimersAcceptedAt != null,
  };
}
