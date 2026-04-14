import "../global.css";
import "react-native-reanimated";

import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "../src/components/ErrorBoundary";
import { useOnboardingGate } from "../src/hooks/useOnboardingGate";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const gate = useOnboardingGate();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const onOnboarding = segments[0] === "onboarding";
    if (!gate.complete && !onOnboarding) {
      router.replace("/onboarding");
    } else if (gate.complete && onOnboarding) {
      router.replace("/(tabs)");
    }
  }, [gate.complete, segments, router]);

  const theme = useMemo(() => ({
    ...DarkTheme,
    colors: { ...DarkTheme.colors, background: "#0B0F17", card: "#141A24" },
  }), []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider value={theme}>
            <ErrorBoundary>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="onboarding" options={{ presentation: "modal" }} />
                <Stack.Screen
                  name="analysis/[gameId]"
                  options={{ headerShown: true, title: "Analysis" }}
                />
              </Stack>
            </ErrorBoundary>
            <StatusBar style="light" />
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

void DefaultTheme;
