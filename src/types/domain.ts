export type TeamId = number;
export type GameId = string;
export type Season = number;

export type GameStatus = "scheduled" | "live" | "final";
export type Conference = "East" | "West";
export type Outcome = "home" | "away";

export interface Team {
  id: TeamId;
  abbr: string;
  name: string;
  conference: Conference;
}

export interface Game {
  id: GameId;
  date: string;
  season: Season;
  status: GameStatus;
  home: Team;
  away: Team;
  homeScore?: number;
  awayScore?: number;
  venue?: string;
}

export interface RollingStats {
  teamId: TeamId;
  asOf: string;
  window: number;
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
}

export interface TeamGameContext {
  team: Team;
  rolling: RollingStats;
  restDays: number;
  backToBack: boolean;
  keyInjuries: string[];
}

export interface MatchupContext {
  game: Game;
  home: TeamGameContext;
  away: TeamGameContext;
  headToHeadHomeWinPctSeason: number;
}

export interface TabularFeatures {
  v: number[];
  labels: string[];
}

export interface LLMAnalysis {
  keyFactorsHome: string[];
  keyFactorsAway: string[];
  confidence: number;
  uncertaintyNotes: string[];
}

export interface Prediction {
  gameId: GameId;
  createdAt: string;
  homeWinProb: number;
  analysis: LLMAnalysis;
  actualOutcome?: Outcome | null;
  modelVersion: string;
}

export type PredictionResult =
  | { kind: "ready"; prediction: Prediction }
  | { kind: "mlp_only"; prediction: Prediction; reason: "llm_unavailable" | "llm_failed" }
  | { kind: "error"; message: string };
