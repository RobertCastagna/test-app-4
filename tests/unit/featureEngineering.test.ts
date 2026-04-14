import { describe, it, expect } from "vitest";

import { FEATURE_COUNT } from "../../src/constants/model";
import {
  buildFeatures,
  type RawMatchup,
} from "../../src/services/featureEngineering";
import type { GameStatLine } from "../../src/utils/rolling";

function statLine(overrides: Partial<GameStatLine> = {}): GameStatLine {
  return {
    date: overrides.date ?? "2024-01-01",
    pointsFor: 110,
    pointsAgainst: 105,
    fgMade: 40,
    fgAttempted: 88,
    threeMade: 12,
    threeAttempted: 34,
    ftMade: 18,
    ftAttempted: 22,
    tov: 12,
    reb: 45,
    ast: 24,
    possessions: 100,
    ...overrides,
  };
}

function makeRaw(
  homePast: GameStatLine[],
  awayPast: GameStatLine[],
  gameDate: string,
  h2h = 0.5
): RawMatchup {
  return {
    game: {
      id: "g1",
      date: gameDate,
      season: 2024,
      status: "scheduled",
      home: { id: 1, abbr: "LAL", name: "Lakers", conference: "West" },
      away: { id: 2, abbr: "BOS", name: "Celtics", conference: "East" },
    },
    home: {
      past: homePast,
      previousGameDate: homePast.at(-1)?.date ?? null,
    },
    away: {
      past: awayPast,
      previousGameDate: awayPast.at(-1)?.date ?? null,
    },
    headToHead: { homeSeasonWinPct: h2h },
  };
}

describe("buildFeatures", () => {
  it("rejects empty histories", () => {
    const res = buildFeatures(makeRaw([], [], "2024-02-01"));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("missing_games");
  });

  it("produces a 26-length vector for equal-team inputs", () => {
    const home = Array.from({ length: 10 }, (_, i) =>
      statLine({ date: `2024-01-${String(i + 1).padStart(2, "0")}` })
    );
    const away = Array.from({ length: 10 }, (_, i) =>
      statLine({ date: `2024-01-${String(i + 1).padStart(2, "0")}` })
    );
    const res = buildFeatures(makeRaw(home, away, "2024-01-15"));
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.v).toHaveLength(FEATURE_COUNT);
    expect(res.value.labels).toHaveLength(FEATURE_COUNT);
    expect(res.value.v[25]).toBe(1);
  });

  it("records rest days and back-to-back flags", () => {
    const home = [statLine({ date: "2024-02-01" })];
    const away = [statLine({ date: "2024-01-28" })];
    const res = buildFeatures(makeRaw(home, away, "2024-02-02"));
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.v[10]).toBe(1);
    expect(res.value.v[11]).toBe(1);
    expect(res.value.v[23]).toBe(5);
    expect(res.value.v[24]).toBe(0);
  });

  it("clamps h2h to [0,1]", () => {
    const home = [statLine({ date: "2024-01-10" })];
    const away = [statLine({ date: "2024-01-10" })];
    const hi = buildFeatures(makeRaw(home, away, "2024-01-15", 5));
    const lo = buildFeatures(makeRaw(home, away, "2024-01-15", -2));
    if (hi.ok) expect(hi.value.v[12]).toBe(1);
    if (lo.ok) expect(lo.value.v[12]).toBe(0);
  });

  it("home court flag is always 1", () => {
    const home = [statLine({ date: "2024-01-10" })];
    const away = [statLine({ date: "2024-01-10" })];
    const res = buildFeatures(makeRaw(home, away, "2024-01-15"));
    if (res.ok) expect(res.value.v[25]).toBe(1);
  });
});
