"""Emit golden-fixture JSON for the TS/Python feature-engineering parity test.

Writes to stdout; redirect into tests/unit/featureEngineering.golden.json.

The fixtures are hand-crafted tiny scenarios designed so both pipelines can
build the same feature vector deterministically without pulling real NBA data.
"""
from __future__ import annotations

import json
from fetch_training_data import GameStatLine, rolling_window, rest_days, ROLLING_WINDOW

FEATURE_COUNT = 26


def scenario_stats(**overrides: float) -> dict[str, float]:
    base = dict(
        points_for=110, points_against=105,
        fg_made=40, fg_attempted=88,
        three_made=12, three_attempted=34,
        ft_made=18, ft_attempted=22,
        tov=12, reb=45, ast=24,
        possessions=100.0,
    )
    base.update(overrides)
    return base


def build_game_line(date: str, **overrides: float) -> GameStatLine:
    return GameStatLine(date=date, **scenario_stats(**overrides))


def feature_vector(
    home_games: list[GameStatLine],
    away_games: list[GameStatLine],
    game_date: str,
    home_prev: str | None,
    away_prev: str | None,
    h2h_home_win_pct: float,
) -> list[float]:
    hw = rolling_window(home_games, ROLLING_WINDOW)
    aw = rolling_window(away_games, ROLLING_WINDOW)
    h_rest = rest_days(home_prev, game_date)
    a_rest = rest_days(away_prev, game_date)
    return [
        hw["ppg"], hw["papg"], hw["fg_pct"], hw["three_pct"], hw["ft_pct"],
        hw["tov"], hw["reb"], hw["ast"], hw["def_rating"], hw["net_rating"],
        h_rest, 1 if h_rest <= 1 else 0, h2h_home_win_pct,
        aw["ppg"], aw["papg"], aw["fg_pct"], aw["three_pct"], aw["ft_pct"],
        aw["tov"], aw["reb"], aw["ast"], aw["def_rating"], aw["net_rating"],
        a_rest, 1 if a_rest <= 1 else 0, 1,
    ]


def main() -> None:
    fixtures = []

    # Fixture 1: fresh teams, both rested, equal rolling stats
    home1 = [build_game_line(f"2024-01-{str(i + 1).zfill(2)}") for i in range(10)]
    away1 = [build_game_line(f"2024-01-{str(i + 1).zfill(2)}") for i in range(10)]
    fixtures.append({
        "name": "equal_teams_rested",
        "inputs": _serialize(home1, away1, "2024-01-15", "2024-01-10", "2024-01-10", 0.5),
        "expected": feature_vector(home1, away1, "2024-01-15", "2024-01-10", "2024-01-10", 0.5),
    })

    # Fixture 2: home hot shooting, back-to-back
    home2 = [build_game_line(f"2024-02-{str(i + 1).zfill(2)}", fg_made=45, three_made=15, points_for=120) for i in range(10)]
    away2 = [build_game_line(f"2024-02-{str(i + 1).zfill(2)}", points_for=100) for i in range(10)]
    fixtures.append({
        "name": "home_hot_shooting_b2b",
        "inputs": _serialize(home2, away2, "2024-02-12", "2024-02-11", "2024-02-09", 0.6),
        "expected": feature_vector(home2, away2, "2024-02-12", "2024-02-11", "2024-02-09", 0.6),
    })

    # Fixture 3: short home history (5 games only)
    home3 = [build_game_line(f"2024-03-{str(i + 1).zfill(2)}") for i in range(5)]
    away3 = [build_game_line(f"2024-03-{str(i + 1).zfill(2)}") for i in range(10)]
    fixtures.append({
        "name": "short_home_history",
        "inputs": _serialize(home3, away3, "2024-03-15", "2024-03-05", "2024-03-10", 0.4),
        "expected": feature_vector(home3, away3, "2024-03-15", "2024-03-05", "2024-03-10", 0.4),
    })

    # Fixture 4: away on long rest
    home4 = [build_game_line(f"2024-04-{str(i + 1).zfill(2)}") for i in range(10)]
    away4 = [build_game_line(f"2024-04-{str(i + 1).zfill(2)}") for i in range(10)]
    fixtures.append({
        "name": "away_long_rest",
        "inputs": _serialize(home4, away4, "2024-04-20", "2024-04-18", "2024-04-10", 0.5),
        "expected": feature_vector(home4, away4, "2024-04-20", "2024-04-18", "2024-04-10", 0.5),
    })

    # Fixture 5: extreme h2h, pace difference
    home5 = [build_game_line(f"2024-05-{str(i + 1).zfill(2)}", possessions=110.0, points_for=120) for i in range(10)]
    away5 = [build_game_line(f"2024-05-{str(i + 1).zfill(2)}", possessions=90.0, points_for=95) for i in range(10)]
    fixtures.append({
        "name": "pace_gap_extreme_h2h",
        "inputs": _serialize(home5, away5, "2024-05-20", "2024-05-15", "2024-05-15", 0.9),
        "expected": feature_vector(home5, away5, "2024-05-20", "2024-05-15", "2024-05-15", 0.9),
    })

    print(json.dumps(fixtures, indent=2))


def _serialize(
    home: list[GameStatLine],
    away: list[GameStatLine],
    game_date: str,
    home_prev: str | None,
    away_prev: str | None,
    h2h: float,
) -> dict:
    def g_to_dict(g: GameStatLine) -> dict:
        return {
            "date": g.date,
            "pointsFor": g.points_for,
            "pointsAgainst": g.points_against,
            "fgMade": g.fg_made,
            "fgAttempted": g.fg_attempted,
            "threeMade": g.three_made,
            "threeAttempted": g.three_attempted,
            "ftMade": g.ft_made,
            "ftAttempted": g.ft_attempted,
            "tov": g.tov,
            "reb": g.reb,
            "ast": g.ast,
            "possessions": g.possessions,
        }

    return {
        "gameDate": game_date,
        "homePrev": home_prev,
        "awayPrev": away_prev,
        "h2hHomeWinPct": h2h,
        "homePast": [g_to_dict(g) for g in home],
        "awayPast": [g_to_dict(g) for g in away],
    }


if __name__ == "__main__":
    main()
