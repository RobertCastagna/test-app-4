import { Pressable, Text, View } from "react-native";

import { formatPct } from "../utils/formatters";

export interface ModelDownloadProgressProps {
  progress: number;
  status: "idle" | "loading" | "downloading" | "ready" | "error";
  onRetry?: () => void;
}

export function ModelDownloadProgress({ progress, status, onRetry }: ModelDownloadProgressProps) {
  const message =
    status === "downloading"
      ? `Downloading LLM model (${formatPct(progress, 0)})`
      : status === "loading"
        ? "Loading LLM…"
        : status === "error"
          ? "LLM unavailable"
          : null;
  if (!message) return null;
  return (
    <View className="mb-4 rounded-xl bg-cardAlt p-4">
      <Text className="mb-2 text-sm text-fg">{message}</Text>
      {status === "downloading" ? (
        <View className="h-2 overflow-hidden rounded bg-card">
          <View
            style={{ width: `${Math.round(progress * 100)}%` }}
            className="h-2 bg-accent"
          />
        </View>
      ) : null}
      {status === "error" && onRetry ? (
        <Pressable
          onPress={onRetry}
          className="mt-2 self-start rounded bg-accent px-3 py-1"
        >
          <Text className="text-xs font-semibold text-bg">Retry</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
