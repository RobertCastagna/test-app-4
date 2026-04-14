import { describe, it, expect } from "vitest";

import {
  buildRollingWindow,
  isBackToBack,
  restDaysBetween,
  lastN,
  mean,
  safeDivide,
  type GameStatLine,
} from "../../src/utils/rolling";

function line(overrides: Partial<GameStatLine> = {}): GameStatLine {
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

describe("mean", () => {
  it("returns 0 on empty", () => expect(mean([])).toBe(0));
  it("averages correctly", () => expect(mean([1, 2, 3])).toBe(2));
});

describe("safeDivide", () => {
  it("returns 0 for zero denominator", () => expect(safeDivide(5, 0)).toBe(0));
  it("divides normally", () => expect(safeDivide(10, 4)).toBe(2.5));
});

describe("lastN", () => {
  it("clamps to slice of length n", () => {
    const games = [line({ date: "2024-01-01" }), line({ date: "2024-01-02" }), line({ date: "2024-01-03" })];
    const sliced = lastN(games, 2);
    expect(sliced).toHaveLength(2);
    expect(sliced[0]?.date).toBe("2024-01-02");
  });
  it("returns empty for n<=0", () => expect(lastN([line()], 0)).toEqual([]));
  it("returns all when n > length", () => {
    const games = [line(), line()];
    expect(lastN(games, 10)).toHaveLength(2);
  });
});

describe("buildRollingWindow", () => {
  it("returns zeroed window for empty input", () => {
    const w = buildRollingWindow([], 10);
    expect(w.sampleSize).toBe(0);
    expect(w.ppg).toBe(0);
    expect(w.fgPct).toBe(0);
  });

  it("computes averages for full window", () => {
    const games = Array.from({ length: 10 }, (_, i) =>
      line({ date: `2024-01-${String(i + 1).padStart(2, "0")}` })
    );
    const w = buildRollingWindow(games, 10);
    expect(w.sampleSize).toBe(10);
    expect(w.ppg).toBe(110);
    expect(w.papg).toBe(105);
    expect(w.fgPct).toBeCloseTo(40 / 88);
    expect(w.defRating).toBeCloseTo((105 * 10 * 100) / (100 * 10));
    expect(w.netRating).toBeCloseTo(
      (110 * 10 * 100) / (100 * 10) - (105 * 10 * 100) / (100 * 10)
    );
  });

  it("honors partial window (<n games)", () => {
    const games = [line(), line(), line()];
    const w = buildRollingWindow(games, 10);
    expect(w.sampleSize).toBe(3);
    expect(w.ppg).toBe(110);
  });
});

describe("restDaysBetween + isBackToBack", () => {
  it("returns 7 for null previous", () => {
    expect(restDaysBetween(null, "2024-01-10")).toBe(7);
    expect(isBackToBack(null, "2024-01-10")).toBe(false);
  });

  it("computes day diff", () => {
    expect(restDaysBetween("2024-01-10", "2024-01-13")).toBe(3);
    expect(isBackToBack("2024-01-10", "2024-01-11")).toBe(true);
    expect(isBackToBack("2024-01-10", "2024-01-12")).toBe(false);
  });

  it("clamps negatives to 0", () => {
    expect(restDaysBetween("2024-01-15", "2024-01-10")).toBe(0);
  });

  it("falls back to 7 on invalid dates", () => {
    expect(restDaysBetween("not-a-date", "2024-01-10")).toBe(7);
  });
});
