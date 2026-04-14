import { Pressable, Text, View } from "react-native";

import type { Game } from "../types/domain";
import { formatTimeShort } from "../utils/formatters";

export interface GameCardProps {
  game: Game;
  onPress?: () => void;
}

export function GameCard({ game, onPress }: GameCardProps) {
  const subtitle =
    game.status === "final"
      ? `Final · ${game.awayScore ?? "–"} – ${game.homeScore ?? "–"}`
      : game.status === "live"
        ? "Live"
        : formatTimeShort(game.date);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${game.away.abbr} at ${game.home.abbr}`}
      className="mb-3 rounded-xl bg-card px-4 py-3 active:opacity-80"
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <View className="flex-col items-end">
            <Text className="text-sm text-fgDim">Away</Text>
            <Text className="font-semibold text-fg">{game.away.abbr}</Text>
          </View>
          <Text className="text-fgDim">@</Text>
          <View className="flex-col items-start">
            <Text className="text-sm text-fgDim">Home</Text>
            <Text className="font-semibold text-fg">{game.home.abbr}</Text>
          </View>
        </View>
        <Text className="text-xs text-accent">{subtitle}</Text>
      </View>
    </Pressable>
  );
}
