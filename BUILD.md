# Build & Run on iOS

Hoop Oracle relies on `react-native-executorch` native modules, so **Expo Go will not work**. You need a custom dev build installed on a physical iPhone.

## Prerequisites

- Apple Developer Program membership (~$99/yr)
- A physical iPhone running iOS 17 or later (ExecuTorch does not run in the simulator)
- Expo account (free)
- This repo cloned locally

> The entire flow works from Windows — EAS Build runs in Expo's macOS cloud, no Xcode install required on your machine.

## One-time EAS setup

Run these inside the project directory:

```bash
npx eas login
npx eas init            # asks to create a project; fills extra.eas.projectId in app.config.ts
npx eas credentials     # follow prompts — iOS distribution cert + provisioning profile
```

Commit the updated `app.config.ts` after `eas init` writes the real `projectId`.

## Train the MLP (optional for first boot, required for real predictions)

```bash
cd tools
python -m venv .venv
.venv\Scripts\activate            # on Windows
pip install -r requirements.txt
python fetch_training_data.py
python train_mlp.py
python export_to_executorch.py    # writes ../assets/models/mlp.pte
python generate_golden_fixtures.py > ../tests/unit/featureEngineering.golden.json
```

Run `npm test` in the repo root to confirm Python/TS feature parity before committing the new `.pte`.

## Build a dev-client iOS IPA

```bash
npx eas build --platform ios --profile development
```

Wait ~15–25 minutes. When done you'll see a download link + QR code.

**Install options:**

- **TestFlight (recommended)** — `npx eas submit --platform ios --latest --profile development` once, then add testers. Future installs are one tap.
- **Ad-hoc over Safari** — open Safari on iPhone, scan the QR code, tap "Install". Works if the device's UDID is listed in your internal distribution profile.

## Run Metro and connect

Once the dev-client IPA is installed:

```bash
npm start        # shortcut for `expo start --dev-client`
```

Open the installed Hoop Oracle app on iPhone — it scans your LAN for the Metro server. iPhone and PC must be on the same Wi-Fi. If your Windows firewall blocks node.exe inbound, either allow it on private networks or use:

```bash
npx expo start --dev-client --tunnel
```

JavaScript changes hot-reload via the dev client. You only need to rebuild the IPA when native deps change (e.g. new Expo plugin, react-native-executorch upgrade).

## Production + App Store

```bash
npx eas build --platform ios --profile production
npx eas submit --platform ios --latest
```

Then finish metadata in App Store Connect.

**App Review risk is real.** The app's framing as *statistical analysis only, no wagering* is what gets it through review. Keep that discipline:

- Never use the words *pick, bet, play, lock, action, parlay, wager* in copy
- Always use *prediction, analysis, probability, factor, confidence, uncertainty*
- Category: Sports + Reference (not Casino, not Sports Betting)
- Answer "No" to every real-money/gambling question in the submission form
- Include a short demo video showing the app never touches a sportsbook
- Reference this in the reviewer notes: "This app provides on-device statistical analysis of NBA game data. It does not place wagers, facilitate wagers, or connect to any sportsbook. All disclaimers are reviewed in the onboarding flow."

## Troubleshooting

| Symptom | Fix |
|---|---|
| Metro can't find `.pte` | Confirm `metro.config.js` includes `config.resolver.assetExts.push('pte')` |
| iPhone won't connect to Metro | Same Wi-Fi, allow node.exe through firewall, or use `--tunnel` |
| `useExecutorchModule` error on launch | Rebuild dev client after any `react-native-executorch` upgrade |
| App crashes when opening analysis screen | Ensure `assets/models/mlp.pte` is a real exported ExecuTorch model, not the 1-byte placeholder |
| LLM download hangs | Check `EXPO_PUBLIC_LLM_MODEL_URL` env var; confirm iPhone has Wi-Fi and enough free storage (~1.5 GB) |
| TypeScript/test CI | `npm run typecheck && npm test` |
