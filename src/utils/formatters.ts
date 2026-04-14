export function formatPct(v: number, digits = 1): string {
  if (!Number.isFinite(v)) return "—";
  return `${(v * 100).toFixed(digits)}%`;
}

export function formatProbability(p: number): string {
  return formatPct(clamp01(p), 0);
}

export function clamp01(v: number): number {
  if (Number.isNaN(v)) return 0;
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}

export function formatDateShort(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function formatTimeShort(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function brierScore(predictions: { prob: number; outcome: 0 | 1 }[]): number {
  if (predictions.length === 0) return 0;
  const total = predictions.reduce((acc, p) => {
    const diff = p.prob - p.outcome;
    return acc + diff * diff;
  }, 0);
  return total / predictions.length;
}
