"""Fetch 5 seasons of NBA regular-season game data and build the 26-feature
training vector using logic that mirrors src/services/featureEngineering.ts.

Writes data/train.parquet.
"""
from __future__ import annotations

import os
import time
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Optional

import numpy as np
import pandas as pd
from nba_api.stats.endpoints import leaguegamefinder
from tqdm import tqdm

ROLLING_WINDOW = 10
FEATURE_COUNT = 26
SEASONS = ["2019-20", "2020-21", "2021-22", "2022-23", "2023-24"]
OUTPUT = Path(__file__).parent / "data" / "train.parquet"


@dataclass(frozen=True)
class GameStatLine:
    date: str
    points_for: int
    points_against: int
    fg_made: int
    fg_attempted: int
    three_made: int
    three_attempted: int
    ft_made: int
    ft_attempted: int
    tov: int
    reb: int
    ast: int
    possessions: float


def safe_div(n: float, d: float) -> float:
    return 0.0 if d == 0 else n / d


def rolling_window(games: list[GameStatLine], window: int) -> dict[str, float]:
    s = games[-window:]
    if not s:
        return dict(
            ppg=0.0, papg=0.0, fg_pct=0.0, three_pct=0.0, ft_pct=0.0,
            tov=0.0, reb=0.0, ast=0.0, def_rating=0.0, net_rating=0.0,
            sample_size=0,
        )
    fg_made = sum(g.fg_made for g in s)
    fg_att = sum(g.fg_attempted for g in s)
    tp_made = sum(g.three_made for g in s)
    tp_att = sum(g.three_attempted for g in s)
    ft_made = sum(g.ft_made for g in s)
    ft_att = sum(g.ft_attempted for g in s)
    pos = sum(g.possessions for g in s)
    pa = sum(g.points_against for g in s)
    pf = sum(g.points_for for g in s)
    def_rating = safe_div(pa * 100.0, pos)
    off_rating = safe_div(pf * 100.0, pos)
    return dict(
        ppg=float(np.mean([g.points_for for g in s])),
        papg=float(np.mean([g.points_against for g in s])),
        fg_pct=safe_div(fg_made, fg_att),
        three_pct=safe_div(tp_made, tp_att),
        ft_pct=safe_div(ft_made, ft_att),
        tov=float(np.mean([g.tov for g in s])),
        reb=float(np.mean([g.reb for g in s])),
        ast=float(np.mean([g.ast for g in s])),
        def_rating=def_rating,
        net_rating=off_rating - def_rating,
        sample_size=len(s),
    )


def rest_days(previous: Optional[str], upcoming: str) -> int:
    if not previous:
        return 7
    prev = datetime.fromisoformat(previous).date()
    nxt = datetime.fromisoformat(upcoming).date()
    return max(0, (nxt - prev).days)


def fetch_season(season: str) -> pd.DataFrame:
    finder = leaguegamefinder.LeagueGameFinder(
        season_nullable=season, season_type_nullable="Regular Season"
    )
    df = finder.get_data_frames()[0]
    df["GAME_DATE"] = pd.to_datetime(df["GAME_DATE"]).dt.strftime("%Y-%m-%d")
    df["POSSESSIONS"] = 0.96 * (df["FGA"] - df["OREB"] + df["TOV"] + 0.44 * df["FTA"])
    return df


def _statline(row: pd.Series) -> GameStatLine:
    return GameStatLine(
        date=row["GAME_DATE"],
        points_for=int(row["PTS"]),
        points_against=int(row["PTS"] - row["PLUS_MINUS"]),
        fg_made=int(row["FGM"]),
        fg_attempted=int(row["FGA"]),
        three_made=int(row["FG3M"]),
        three_attempted=int(row["FG3A"]),
        ft_made=int(row["FTM"]),
        ft_attempted=int(row["FTA"]),
        tov=int(row["TOV"]),
        reb=int(row["REB"]),
        ast=int(row["AST"]),
        possessions=float(row["POSSESSIONS"]),
    )


def build_features_for_season(season_df: pd.DataFrame) -> pd.DataFrame:
    season_df = season_df.sort_values(["TEAM_ID", "GAME_DATE"]).reset_index(drop=True)
    # Group by GAME_ID to pair home + away
    rows = []
    for game_id, pair in season_df.groupby("GAME_ID"):
        if len(pair) != 2:
            continue
        home = pair[pair["MATCHUP"].str.contains("vs")].iloc[0]
        away = pair[pair["MATCHUP"].str.contains("@")].iloc[0]
        rows.append({
            "game_id": game_id,
            "date": home["GAME_DATE"],
            "home_team_id": int(home["TEAM_ID"]),
            "away_team_id": int(away["TEAM_ID"]),
            "home_pts": int(home["PTS"]),
            "away_pts": int(away["PTS"]),
            "home_won": int(home["PTS"] > away["PTS"]),
        })
    matchups = pd.DataFrame(rows).sort_values("date").reset_index(drop=True)

    # Build team history and emit features at each matchup's as-of date
    history: dict[int, list[GameStatLine]] = {}
    h2h: dict[tuple[int, int], list[int]] = {}  # (home_id, away_id) -> list of home_won
    out = []
    for _, m in tqdm(matchups.iterrows(), total=len(matchups), desc="features"):
        hid, aid = m["home_team_id"], m["away_team_id"]
        h_hist = history.get(hid, [])
        a_hist = history.get(aid, [])
        if not h_hist or not a_hist:
            # record games and skip (cold start)
            _append_game(season_df, game_id=m["game_id"], history=history)
            continue

        hw = rolling_window(h_hist, ROLLING_WINDOW)
        aw = rolling_window(a_hist, ROLLING_WINDOW)
        h_prev_date = h_hist[-1].date if h_hist else None
        a_prev_date = a_hist[-1].date if a_hist else None
        h_rest = rest_days(h_prev_date, m["date"])
        a_rest = rest_days(a_prev_date, m["date"])
        h2h_key = tuple(sorted((hid, aid)))
        h2h_record = h2h.get(h2h_key, [])
        h2h_pct = float(np.mean(h2h_record)) if h2h_record else 0.5

        v = [
            hw["ppg"], hw["papg"], hw["fg_pct"], hw["three_pct"], hw["ft_pct"],
            hw["tov"], hw["reb"], hw["ast"], hw["def_rating"], hw["net_rating"],
            h_rest, 1 if h_rest <= 1 else 0, h2h_pct,
            aw["ppg"], aw["papg"], aw["fg_pct"], aw["three_pct"], aw["ft_pct"],
            aw["tov"], aw["reb"], aw["ast"], aw["def_rating"], aw["net_rating"],
            a_rest, 1 if a_rest <= 1 else 0, 1,
        ]
        assert len(v) == FEATURE_COUNT, f"feature count mismatch: {len(v)}"
        out.append({"game_id": m["game_id"], "date": m["date"], **{f"f{i}": v[i] for i in range(FEATURE_COUNT)}, "label": m["home_won"]})

        # Update history + h2h after the matchup
        _append_game(season_df, game_id=m["game_id"], history=history)
        h2h.setdefault(h2h_key, []).append(m["home_won"])

    return pd.DataFrame(out)


def _append_game(season_df: pd.DataFrame, game_id: str, history: dict[int, list[GameStatLine]]) -> None:
    pair = season_df[season_df["GAME_ID"] == game_id]
    for _, row in pair.iterrows():
        history.setdefault(int(row["TEAM_ID"]), []).append(_statline(row))


def main() -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    frames = []
    for season in SEASONS:
        print(f"Fetching {season}...")
        raw = fetch_season(season)
        frames.append(build_features_for_season(raw))
        time.sleep(1.5)
    df = pd.concat(frames, ignore_index=True)
    df.to_parquet(OUTPUT)
    print(f"Wrote {OUTPUT} with {len(df)} rows across {len(SEASONS)} seasons")


if __name__ == "__main__":
    main()
