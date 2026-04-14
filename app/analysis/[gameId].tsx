import { useLocalSearchParams } from "expo-router";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { DisclaimerBanner } from "../../src/components/DisclaimerBanner";
import { ModelDownloadProgress } from "../../src/components/ModelDownloadProgress";
import { ProbabilityGauge } from "../../src/components/ProbabilityGauge";
import { RationaleCard } from "../../src/components/RationaleCard";
import { StatBar } from "../../src/components/StatBar";
import { useGameAnalysis } from "../../src/hooks/useGameAnalysis";
import { useModelStore } from "../../src/stores/modelStore";
import { formatProbability } from "../../src/utils/formatters";

export default function AnalysisDetail() {
  const { gameId } = useLocalSearchParams<{ gameId: string }>();
  const modelStore = useModelStore();

  const query = useGameAnalysis({
    gameId: gameId ?? "",
    matchup: null,
    featureInput: null,
    enabled: false,
  });

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["bottom"]}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <DisclaimerBanner variant="sticky" />

        <Text className="text-2xl font-bold text-fg">Matchup analysis</Text>
        <Text className="text-xs text-fgDim">Game ID: {gameId}</Text>

        {modelStore.llm !== "ready" ? (
          <ModelDownloadProgress
            progress={modelStore.downloadProgress}
            status={modelStore.llm}
          />
        ) : null}

        {query.isLoading ? (
          <View className="items-center py-12">
            <ActivityIndicator color="#16B3A6" />
            <Text className="mt-2 text-xs text-fgDim">Running on-device inference…</Text>
          </View>
        ) : null}

        {query.data?.kind === "ready" || query.data?.kind === "mlp_only" ? (
          <>
            <ProbabilityGauge
              homeProb={query.data.prediction.homeWinProb}
              homeAbbr="HOME"
              awayAbbr="AWAY"
            />
            <View className="rounded-xl bg-card p-4">
              <Text className="mb-2 text-xs font-semibold uppercase tracking-widest text-fgDim">
                Key Stats
              </Text>
              <StatBar label="PPG" home={0} away={0} />
              <StatBar label="Net Rating" home={0} away={0} />
              <StatBar label="FG%" home={0} away={0} higherIsBetter />
              <StatBar label="Rest (days)" home={0} away={0} />
            </View>
            <RationaleCard
              analysis={query.data.prediction.analysis}
              homeAbbr="HOME"
              awayAbbr="AWAY"
              degraded={query.data.kind === "mlp_only"}
            />
            <Text className="text-xs text-fgDim">
              Home win probability: {formatProbability(query.data.prediction.homeWinProb)}
            </Text>
          </>
        ) : null}

        {query.data?.kind === "error" ? (
          <View className="rounded-xl bg-loss/20 p-4">
            <Text className="text-sm text-loss">Unable to analyze: {query.data.message}</Text>
          </View>
        ) : null}

        <DisclaimerBanner variant="footer" />
      </ScrollView>
    </SafeAreaView>
  );
}
