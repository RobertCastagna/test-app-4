/**
 * Web stub for useTabularModel.
 *
 * react-native-executorch is a native-only package and cannot be bundled for
 * web. Metro resolves platform-specific files (.web.ts > .ts), so this stub
 * is loaded automatically for web builds while the real hook is used on
 * iOS/Android.
 */

export interface UseTabularModelResult {
  isReady: boolean;
  predict: (features: number[]) => Promise<number>;
}

export function useTabularModel(): UseTabularModelResult {
  return {
    isReady: false,
    predict: () =>
      Promise.reject(new Error("MLP inference is not available on web.")),
  };
}
