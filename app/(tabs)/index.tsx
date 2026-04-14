import { useRouter } from "expo-router";
import { ActivityIndicator, FlatList, RefreshControl, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { DisclaimerBanner } from "../../src/components/DisclaimerBanner";
import { GameCard } from "../../src/components/GameCard";
import { useGames } from "../../src/hooks/useGames";
import type { Game } from "../../src/types/domain";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function Today() {
  const router = useRouter();
  const { data, isLoading, isFetching, refetch, error } = useGames({ date: todayIso() });

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["bottom"]}>
      <View className="p-4">
        <DisclaimerBanner variant="sticky" />
      </View>
      <FlatList<Game>
        data={data ?? []}
        keyExtractor={(g) => g.id}
        renderItem={({ item }) => (
          <GameCard game={item} onPress={() => router.push(`/analysis/${item.id}`)} />
        )}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor="#16B3A6" />}
        ListEmptyComponent={
          <View className="items-center py-12">
            {isLoading ? (
              <ActivityIndicator color="#16B3A6" />
            ) : error ? (
              <Text className="text-sm text-loss">Failed to load games: {String(error)}</Text>
            ) : (
              <Text className="text-sm text-fgDim">No NBA games today.</Text>
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
}
