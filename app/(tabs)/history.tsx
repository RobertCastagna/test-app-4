import { useQuery } from "@tanstack/react-query";
import { FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { DisclaimerBanner } from "../../src/components/DisclaimerBanner";
import { getPredictionHistory } from "../../src/services/database";
import type { Prediction } from "../../src/types/domain";
import { brierScore, formatPct, formatProbability } from "../../src/utils/formatters";

export default function History() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["history"],
    queryFn: () => getPredictionHistory(200),
    staleTime: 1000 * 60,
  });

  const { accuracy, brier } = summarize(data);

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["bottom"]}>
      <View className="gap-4 px-4 pt-4">
        <DisclaimerBanner variant="sticky" />
        <View className="flex-row gap-3">
          <MetricCard label="Accuracy" value={formatPct(accuracy, 0)} />
          <MetricCard label="Brier" value={brier.toFixed(3)} />
          <MetricCard label="Count" value={String(data.length)} />
        </View>
      </View>
      <FlatList<Prediction>
        data={data}
        keyExtractor={(p) => p.gameId}
        renderItem={({ item }) => <HistoryRow item={item} />}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, paddingTop: 12 }}
        ListEmptyComponent={
          <View className="items-center py-12">
            <Text className="text-sm text-fgDim">
              {isLoading ? "Loading..." : "No predictions yet. Open a matchup to analyze."}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 rounded-xl bg-card p-3">
      <Text className="text-xs text-fgDim">{label}</Text>
      <Text className="mt-1 text-xl font-bold text-fg">{value}</Text>
    </View>
  );
}

function HistoryRow({ item }: { item: Prediction }) {
  const resolved = item.actualOutcome != null;
  const correct =
    resolved &&
    ((item.homeWinProb > 0.5 && item.actualOutcome === "home") ||
      (item.homeWinProb <= 0.5 && item.actualOutcome === "away"));
  return (
    <View className="mb-2 flex-row items-center justify-between rounded-xl bg-card px-4 py-3">
      <View>
        <Text className="text-sm text-fg">Game {item.gameId}</Text>
        <Text className="text-xs text-fgDim">{new Date(item.createdAt).toLocaleString()}</Text>
      </View>
      <View className="items-end">
        <Text className="text-sm font-semibold text-fg">{formatProbability(item.homeWinProb)}</Text>
        {resolved ? (
          <Text className={`text-xs ${correct ? "text-win" : "text-loss"}`}>
            {correct ? "hit" : "miss"}
          </Text>
        ) : (
          <Text className="text-xs text-fgDim">pending</Text>
        )}
      </View>
    </View>
  );
}

function summarize(preds: Prediction[]) {
  const resolved = preds.filter((p) => p.actualOutcome != null);
  if (resolved.length === 0) return { accuracy: 0, brier: 0 };
  const hits = resolved.filter(
    (p) =>
      (p.homeWinProb > 0.5 && p.actualOutcome === "home") ||
      (p.homeWinProb <= 0.5 && p.actualOutcome === "away")
  ).length;
  const accuracy = hits / resolved.length;
  const brier = brierScore(
    resolved.map((p) => ({
      prob: p.homeWinProb,
      outcome: p.actualOutcome === "home" ? 1 : 0,
    }))
  );
  return { accuracy, brier };
}
