import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "Hoop Oracle",
  slug: "hoop-oracle",
  version: "0.1.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "hoopoi",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    bundleIdentifier: "com.rcbul.hoopoi",
    supportsTablet: false,
    buildNumber: "1",
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
    entitlements: {
      "com.apple.developer.kernel.increased-memory-limit": true,
      "com.apple.developer.kernel.extended-virtual-addressing": true,
    },
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#0B0F17",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    "expo-dev-client",
    "expo-asset",
    "expo-secure-store",
    "expo-sqlite",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#0B0F17",
        dark: { backgroundColor: "#000000" },
      },
    ],
    [
      "expo-build-properties",
      {
        ios: {
          deploymentTarget: "17.0",
          newArchEnabled: true,
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    eas: {
      projectId: "FILL_AFTER_EAS_INIT",
    },
  },
};

export default config;
