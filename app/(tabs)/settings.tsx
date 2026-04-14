import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Switch, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { FULL_DISCLAIMERS } from "../../src/constants/disclaimers";
import { MODEL_VERSION } from "../../src/constants/model";
import { resetAll } from "../../src/services/database";
import { useModelStore } from "../../src/stores/modelStore";
import { useSettingsStore } from "../../src/stores/settingsStore";

const API_KEY_SECURE_KEY = "bdl_api_key";

export default function Settings() {
  const model = useModelStore();
  const settings = useSettingsStore();
  const [apiKey, setApiKey] = useState<string>("");

  useEffect(() => {
    SecureStore.getItemAsync(API_KEY_SECURE_KEY).then((v) => setApiKey(v ?? ""));
  }, []);

  async function saveApiKey(value: string) {
    setApiKey(value);
    await SecureStore.setItemAsync(API_KEY_SECURE_KEY, value);
  }

  function onReset() {
    Alert.alert(
      "Reset app",
      "This clears all predictions, stats cache, and settings. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            await resetAll();
            settings.resetOnboarding();
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["bottom"]}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Section title="Models">
          <Row label="Tabular MLP" value={statusLabel(model.mlp)} version={MODEL_VERSION} />
          <Row
            label="LLM (Llama 3.2 1B)"
            value={statusLabel(model.llm, model.downloadProgress)}
          />
          <View className="mt-2 flex-row items-center justify-between">
            <Text className="text-sm text-fg">Enable on-device LLM</Text>
            <Switch
              value={settings.llmEnabled}
              onValueChange={settings.setLlmEnabled}
              trackColor={{ true: "#16B3A6", false: "#6B7280" }}
            />
          </View>
        </Section>

        <Section title="Data">
          <Text className="mb-2 text-xs text-fgDim">BallDontLie API key (optional)</Text>
          <TextInput
            value={apiKey}
            onChangeText={saveApiKey}
            placeholder="API key"
            placeholderTextColor="#6B7280"
            secureTextEntry
            autoCapitalize="none"
            className="rounded bg-cardAlt px-3 py-2 text-sm text-fg"
          />
        </Section>

        <Section title="Sport">
          <Text className="text-sm text-fgDim">NBA (only option in v1)</Text>
        </Section>

        <Section title="Legal">
          {FULL_DISCLAIMERS.map((d, idx) => (
            <Text key={idx} className="mb-2 text-xs text-fgDim">
              {idx + 1}. {d}
            </Text>
          ))}
        </Section>

        <Pressable
          onPress={onReset}
          className="self-start rounded bg-loss/80 px-4 py-2 active:opacity-80"
        >
          <Text className="text-sm font-semibold text-bg">Reset app</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="rounded-xl bg-card p-4">
      <Text className="mb-3 text-xs font-semibold uppercase tracking-widest text-fgDim">
        {title}
      </Text>
      {children}
    </View>
  );
}

function Row({ label, value, version }: { label: string; value: string; version?: string }) {
  return (
    <View className="mb-2 flex-row items-start justify-between">
      <View>
        <Text className="text-sm text-fg">{label}</Text>
        {version ? <Text className="text-[10px] text-fgDim">{version}</Text> : null}
      </View>
      <Text className="text-xs text-accent">{value}</Text>
    </View>
  );
}

function statusLabel(status: string, progress?: number): string {
  switch (status) {
    case "ready":
      return "Ready";
    case "loading":
      return "Loading";
    case "downloading":
      return `Downloading ${Math.round((progress ?? 0) * 100)}%`;
    case "error":
      return "Error";
    default:
      return "Idle";
  }
}
