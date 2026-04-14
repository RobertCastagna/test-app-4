export interface GameStatLine {
  date: string;
  pointsFor: number;
  pointsAgainst: number;
  fgMade: number;
  fgAttempted: number;
  threeMade: number;
  threeAttempted: number;
  ftMade: number;
  ftAttempted: number;
  tov: number;
  reb: number;
  ast: number;
  possessions: number;
}

export interface RollingWindow {
  ppg: number;
  papg: number;
  fgPct: number;
  threePct: number;
  ftPct: number;
  tov: number;
  reb: number;
  ast: number;
  defRating: number;
  netRating: number;
  sampleSize: number;
}

const ZERO_WINDOW: RollingWindow = {
  ppg: 0,
  papg: 0,
  fgPct: 0,
  threePct: 0,
  ftPct: 0,
  tov: 0,
  reb: 0,
  ast: 0,
  defRating: 0,
  netRating: 0,
  sampleSize: 0,
};

export function lastN(games: GameStatLine[], n: number): GameStatLine[] {
  if (n <= 0) return [];
  return games.slice(-n);
}

export function mean(xs: number[]): number {
  if (xs.length === 0) return 0;
  let s = 0;
  for (const x of xs) s += x;
  return s / xs.length;
}

export function safeDivide(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : numerator / denominator;
}

export function buildRollingWindow(
  games: GameStatLine[],
  window: number
): RollingWindow {
  const slice = lastN(games, window);
  if (slice.length === 0) return ZERO_WINDOW;

  const fgMade = slice.reduce((a, g) => a + g.fgMade, 0);
  const fgAtt = slice.reduce((a, g) => a + g.fgAttempted, 0);
  const threeMade = slice.reduce((a, g) => a + g.threeMade, 0);
  const threeAtt = slice.reduce((a, g) => a + g.threeAttempted, 0);
  const ftMade = slice.reduce((a, g) => a + g.ftMade, 0);
  const ftAtt = slice.reduce((a, g) => a + g.ftAttempted, 0);
  const possessions = slice.reduce((a, g) => a + g.possessions, 0);
  const pointsAgainst = slice.reduce((a, g) => a + g.pointsAgainst, 0);
  const pointsFor = slice.reduce((a, g) => a + g.pointsFor, 0);

  const defRating = safeDivide(pointsAgainst * 100, possessions);
  const offRating = safeDivide(pointsFor * 100, possessions);

  return {
    ppg: mean(slice.map((g) => g.pointsFor)),
    papg: mean(slice.map((g) => g.pointsAgainst)),
    fgPct: safeDivide(fgMade, fgAtt),
    threePct: safeDivide(threeMade, threeAtt),
    ftPct: safeDivide(ftMade, ftAtt),
    tov: mean(slice.map((g) => g.tov)),
    reb: mean(slice.map((g) => g.reb)),
    ast: mean(slice.map((g) => g.ast)),
    defRating,
    netRating: offRating - defRating,
    sampleSize: slice.length,
  };
}

export function restDaysBetween(previousGame: string | null, upcoming: string): number {
  if (!previousGame) return 7;
  const prev = Date.parse(previousGame);
  const next = Date.parse(upcoming);
  if (Number.isNaN(prev) || Number.isNaN(next)) return 7;
  const diffMs = next - prev;
  return Math.max(0, Math.round(diffMs / (24 * 60 * 60 * 1000)));
}

export function isBackToBack(previousGame: string | null, upcoming: string): boolean {
  return restDaysBetween(previousGame, upcoming) <= 1;
}
