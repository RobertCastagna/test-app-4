import { Text, View } from "react-native";

import type { LLMAnalysis } from "../types/domain";
import { formatPct } from "../utils/formatters";

export interface RationaleCardProps {
  analysis: LLMAnalysis;
  homeAbbr: string;
  awayAbbr: string;
  degraded?: boolean;
}

function FactorList({ title, items }: { title: string; items: string[] }) {
  return (
    <View className="flex-1">
      <Text className="mb-2 text-sm font-semibold text-fg">{title}</Text>
      {items.map((f, idx) => (
        <View key={idx} className="mb-1 flex-row">
          <Text className="mr-2 text-accent">•</Text>
          <Text className="flex-1 text-sm text-fg">{f}</Text>
        </View>
      ))}
    </View>
  );
}

export function RationaleCard({ analysis, homeAbbr, awayAbbr, degraded }: RationaleCardProps) {
  return (
    <View className="rounded-xl bg-card p-4">
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-sm font-semibold text-fg">Analysis</Text>
        <View className="flex-row items-center gap-2">
          {degraded ? (
            <Text className="rounded bg-loss/20 px-2 py-0.5 text-[10px] text-loss">
              Fallback
            </Text>
          ) : null}
          <Text className="rounded bg-accentDim/30 px-2 py-0.5 text-xs text-accent">
            Confidence {formatPct(analysis.confidence, 0)}
          </Text>
        </View>
      </View>
      <View className="flex-row gap-4">
        <FactorList title={`Home (${homeAbbr})`} items={analysis.keyFactorsHome} />
        <FactorList title={`Away (${awayAbbr})`} items={analysis.keyFactorsAway} />
      </View>
      {analysis.uncertaintyNotes.length > 0 ? (
        <View className="mt-3 rounded bg-cardAlt p-2">
          <Text className="mb-1 text-[11px] font-semibold text-fgDim">Uncertainty</Text>
          {analysis.uncertaintyNotes.map((u, idx) => (
            <Text key={idx} className="text-xs text-fgDim">
              · {u}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}
