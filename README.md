# Hoop Oracle

On-device NBA data-analysis app built with [Expo](https://expo.dev) + [react-native-executorch](https://docs.swmansion.com/react-native-executorch/). Runs both a small tabular MLP (home-win probability) and a quantized Llama 3.2 1B (structured rationale) entirely on the iPhone — no cloud inference.

**This app is for statistical analysis only.** It does not place wagers, integrate with sportsbooks, or offer betting advice. See [`src/constants/disclaimers.ts`](./src/constants/disclaimers.ts).

## Stack

- Expo SDK 54, Expo Router, React Native 0.81, React 19, New Architecture
- `react-native-executorch` 0.8 for on-device inference (MLP + LLM)
- Zustand state, expo-sqlite persistence, react-query remote data
- NativeWind (Tailwind) UI, react-native-gifted-charts, react-native-svg
- BallDontLie API for NBA game + stats data (token-bucketed at 5 req/min)

## Layout

```
app/             Expo Router screens (onboarding, tabs, analysis detail)
src/
  components/    UI primitives (GameCard, ProbabilityGauge, RationaleCard, ...)
  hooks/         useTabularModel, useAnalysisLLM, useGameAnalysis, useGames
  services/      balldontlie, featureEngineering (pure), database, inferenceService, telemetry
  stores/        modelStore, predictionStore, settingsStore (persisted)
  types/         domain types + zod-validated BDL/LLM schemas
  utils/         rolling windows, formatters, Result<T,E>
  constants/     model version, disclaimers, jurisdictions
assets/models/   mlp.pte (bundled, replace with trained output from tools/)
tools/           Python training + ExecuTorch export pipeline (not bundled)
tests/unit/      Vitest unit tests (parity gate for feature engineering)
```

## Scripts

```bash
npm start          # expo start --dev-client
npm run ios        # dev client on iOS
npm run typecheck  # tsc --noEmit
npm test           # vitest run
npm run lint       # expo lint
```

## Building for iOS

Expo Go is not supported (native modules). See [`BUILD.md`](./BUILD.md) for the full EAS dev-client + TestFlight flow from Windows.

## Model pipeline

Python training lives in `tools/` and is documented in [`tools/README.md`](./tools/README.md). The feature vector must stay in byte-for-byte parity with `src/services/featureEngineering.ts` — the golden-fixture test in `tests/unit/featureEngineering.test.ts` is the gate.

## License & disclaimers

Private project. Nothing in this app constitutes betting advice. Gambling is harmful — if you need help in the US call 1-800-GAMBLER.
