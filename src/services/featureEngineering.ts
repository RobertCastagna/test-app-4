import { FEATURE_COUNT, FEATURE_LABELS, ROLLING_WINDOW } from "../constants/model";
import type {
  Game,
  MatchupContext,
  TabularFeatures,
  TeamGameContext,
} from "../types/domain";
import { buildRollingWindow, GameStatLine, isBackToBack, restDaysBetween } from "../utils/rolling";
import { err, ok, Result } from "../utils/result";

export interface FeatureError {
  code: "missing_games" | "invalid_game" | "insufficient_history";
  message: string;
}

export interface TeamHistory {
  past: GameStatLine[];
  previousGameDate: string | null;
}

export interface HeadToHead {
  homeSeasonWinPct: number;
}

export interface RawMatchup {
  game: Game;
  home: TeamHistory;
  away: TeamHistory;
  headToHead: HeadToHead;
}

export function buildFeatures(
  raw: RawMatchup
): Result<TabularFeatures, FeatureError> {
  const { game, home, away, headToHead } = raw;

  if (!game || !game.home || !game.away) {
    return err({ code: "invalid_game", message: "Game missing home/away teams" });
  }
  if (home.past.length === 0 || away.past.length === 0) {
    return err({ code: "missing_games", message: "Need prior games for both teams" });
  }

  const homeRolling = buildRollingWindow(home.past, ROLLING_WINDOW);
  const awayRolling = buildRollingWindow(away.past, ROLLING_WINDOW);
  const homeRest = restDaysBetween(home.previousGameDate, game.date);
  const awayRest = restDaysBetween(away.previousGameDate, game.date);

  const v = [
    homeRolling.ppg,
    homeRolling.papg,
    homeRolling.fgPct,
    homeRolling.threePct,
    homeRolling.ftPct,
    homeRolling.tov,
    homeRolling.reb,
    homeRolling.ast,
    homeRolling.defRating,
    homeRolling.netRating,
    homeRest,
    isBackToBack(home.previousGameDate, game.date) ? 1 : 0,
    clampPct(headToHead.homeSeasonWinPct),
    awayRolling.ppg,
    awayRolling.papg,
    awayRolling.fgPct,
    awayRolling.threePct,
    awayRolling.ftPct,
    awayRolling.tov,
    awayRolling.reb,
    awayRolling.ast,
    awayRolling.defRating,
    awayRolling.netRating,
    awayRest,
    isBackToBack(away.previousGameDate, game.date) ? 1 : 0,
    1,
  ];

  if (v.length !== FEATURE_COUNT) {
    return err({
      code: "invalid_game",
      message: `Feature vector length ${v.length} != FEATURE_COUNT ${FEATURE_COUNT}`,
    });
  }

  return ok({ v, labels: [...FEATURE_LABELS] });
}

export function buildMatchupContext(raw: RawMatchup, homeCtx: TeamGameContext, awayCtx: TeamGameContext): MatchupContext {
  return {
    game: raw.game,
    home: homeCtx,
    away: awayCtx,
    headToHeadHomeWinPctSeason: clampPct(raw.headToHead.homeSeasonWinPct),
  };
}

function clampPct(v: number): number {
  if (!Number.isFinite(v)) return 0.5;
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}
