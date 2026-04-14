import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import {
  FOOTER_DISCLAIMER,
  SHORT_DISCLAIMER,
} from "../constants/disclaimers";

export interface DisclaimerBannerProps {
  variant?: "sticky" | "inline" | "footer";
}

export function DisclaimerBanner({ variant = "inline" }: DisclaimerBannerProps) {
  const [expanded, setExpanded] = useState(variant !== "sticky");

  if (variant === "footer") {
    return (
      <View className="mt-4 rounded-md bg-cardAlt/60 px-3 py-2">
        <Text className="text-center text-xs text-fgDim">{FOOTER_DISCLAIMER}</Text>
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => setExpanded((v) => !v)}
      className="rounded-md border border-accentDim/40 bg-cardAlt px-3 py-2"
    >
      <Text className="text-xs text-accent">
        {expanded ? SHORT_DISCLAIMER : "Tap for legal notice"}
      </Text>
    </Pressable>
  );
}
