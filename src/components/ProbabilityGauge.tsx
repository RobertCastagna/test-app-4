import { Text, View } from "react-native";
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";

import { clamp01, formatProbability } from "../utils/formatters";

export interface ProbabilityGaugeProps {
  homeProb: number;
  homeAbbr: string;
  awayAbbr: string;
}

const SIZE = 220;
const STROKE = 18;

function polar(cx: number, cy: number, r: number, angle: number) {
  return {
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  };
}

function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polar(cx, cy, r, endAngle);
  const end = polar(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= Math.PI ? 0 : 1;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

export function ProbabilityGauge({ homeProb, homeAbbr, awayAbbr }: ProbabilityGaugeProps) {
  const p = clamp01(homeProb);
  const r = SIZE / 2 - STROKE;
  const cx = SIZE / 2;
  const cy = SIZE / 2 + 10;
  const startAngle = Math.PI;
  const endAngle = 2 * Math.PI;
  const filledEndAngle = startAngle + (endAngle - startAngle) * p;
  const fullArc = arcPath(cx, cy, r, startAngle, endAngle);
  const filled = arcPath(cx, cy, r, startAngle, filledEndAngle);

  return (
    <View className="items-center py-4">
      <Svg width={SIZE} height={SIZE * 0.6 + 40}>
        <Defs>
          <LinearGradient id="gauge" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#F87171" />
            <Stop offset="1" stopColor="#4ADE80" />
          </LinearGradient>
        </Defs>
        <Path d={fullArc} stroke="#1B2231" strokeWidth={STROKE} fill="none" strokeLinecap="round" />
        <Path d={filled} stroke="url(#gauge)" strokeWidth={STROKE} fill="none" strokeLinecap="round" />
      </Svg>
      <Text className="mt-[-40px] text-4xl font-bold text-fg">{formatProbability(p)}</Text>
      <Text className="mt-1 text-sm text-fgDim">
        Home ({homeAbbr}) win probability · Away: {awayAbbr}
      </Text>
    </View>
  );
}
