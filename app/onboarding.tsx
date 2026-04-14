import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { FULL_DISCLAIMERS, JURISDICTION_NOTICE } from "../src/constants/disclaimers";
import { useSettingsStore } from "../src/stores/settingsStore";

type Step = "age" | "jurisdiction" | "disclaimers";

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("age");
  const setAgeVerified = useSettingsStore((s) => s.setAgeVerified);
  const setJurisdictionConfirmed = useSettingsStore((s) => s.setJurisdictionConfirmed);
  const acceptDisclaimers = useSettingsStore((s) => s.acceptDisclaimers);

  function handleAge() {
    setAgeVerified(true);
    setStep("jurisdiction");
  }

  function handleJurisdiction() {
    setJurisdictionConfirmed(true);
    setStep("disclaimers");
  }

  function handleDisclaimers() {
    acceptDisclaimers();
    router.replace("/(tabs)");
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <Text className="text-3xl font-bold text-fg">Welcome to Hoop Oracle</Text>
        <Text className="text-sm text-fgDim">
          On-device NBA data analysis. Before you can use the app, please confirm a
          few things.
        </Text>

        {step === "age" ? (
          <View className="rounded-xl bg-card p-4">
            <Text className="mb-3 text-lg font-semibold text-fg">1. Age</Text>
            <Text className="mb-4 text-sm text-fg">
              You must be 18+ (or the legal age of majority in your jurisdiction).
            </Text>
            <PrimaryButton label="I am 18+" onPress={handleAge} />
          </View>
        ) : null}

        {step === "jurisdiction" ? (
          <View className="rounded-xl bg-card p-4">
            <Text className="mb-3 text-lg font-semibold text-fg">2. Jurisdiction</Text>
            <Text className="mb-4 text-sm text-fg">{JURISDICTION_NOTICE}</Text>
            <PrimaryButton label="I understand" onPress={handleJurisdiction} />
          </View>
        ) : null}

        {step === "disclaimers" ? (
          <View className="rounded-xl bg-card p-4">
            <Text className="mb-3 text-lg font-semibold text-fg">3. Disclaimers</Text>
            <View className="mb-4 max-h-80 rounded bg-bg p-3">
              {FULL_DISCLAIMERS.map((d, idx) => (
                <Text key={idx} className="mb-2 text-xs text-fg">
                  {idx + 1}. {d}
                </Text>
              ))}
            </View>
            <PrimaryButton label="Accept and continue" onPress={handleDisclaimers} />
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function PrimaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="self-start rounded-lg bg-accent px-5 py-2.5 active:opacity-80"
    >
      <Text className="text-sm font-semibold text-bg">{label}</Text>
    </Pressable>
  );
}
