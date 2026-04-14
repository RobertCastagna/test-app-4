import { Text, View } from "react-native";

import { clamp01 } from "../utils/formatters";

export interface StatBarProps {
  label: string;
  home: number;
  away: number;
  higherIsBetter?: boolean;
  format?: (v: number) => string;
}

export function StatBar({
  label,
  home,
  away,
  higherIsBetter = true,
  format = (v) => v.toFixed(1),
}: StatBarProps) {
  const max = Math.max(Math.abs(home), Math.abs(away), 1);
  const homeFrac = clamp01(home / max);
  const awayFrac = clamp01(away / max);

  const homeWins = higherIsBetter ? home >= away : home <= away;

  return (
    <View className="mb-3">
      <View className="flex-row justify-between">
        <Text className="text-xs text-fgDim">{format(home)}</Text>
        <Text className="text-xs font-semibold text-fg">{label}</Text>
        <Text className="text-xs text-fgDim">{format(away)}</Text>
      </View>
      <View className="mt-1 flex-row gap-1">
        <View className="h-2 flex-1 flex-row-reverse rounded bg-cardAlt">
          <View
            style={{ width: `${homeFrac * 100}%` }}
            className={`h-2 rounded-l ${homeWins ? "bg-accent" : "bg-muted"}`}
          />
        </View>
        <View className="h-2 flex-1 rounded bg-cardAlt">
          <View
            style={{ width: `${awayFrac * 100}%` }}
            className={`h-2 rounded-r ${!homeWins ? "bg-accent" : "bg-muted"}`}
          />
        </View>
      </View>
    </View>
  );
}
