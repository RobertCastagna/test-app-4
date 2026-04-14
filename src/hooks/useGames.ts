import { useQuery } from "@tanstack/react-query";

import { bdl } from "../services/balldontlie";
import type { Game, Team } from "../types/domain";
import type { BDLGame, BDLTeam } from "../types/api";

function toTeam(t: BDLTeam): Team {
  return {
    id: t.id,
    abbr: t.abbreviation,
    name: t.full_name,
    conference: t.conference,
  };
}

function toGame(g: BDLGame): Game {
  const status = (() => {
    const s = g.status.toLowerCase();
    if (s.includes("final")) return "final" as const;
    if (s.includes("in progress") || s.includes("q")) return "live" as const;
    return "scheduled" as const;
  })();
  return {
    id: String(g.id),
    date: g.date,
    season: g.season,
    status,
    home: toTeam(g.home_team),
    away: toTeam(g.visitor_team),
    homeScore: g.home_team_score,
    awayScore: g.visitor_team_score,
  };
}

export function useGames(opts: { date?: string; startDate?: string; endDate?: string }) {
  const key = ["games", opts];
  return useQuery({
    queryKey: key,
    queryFn: async (): Promise<Game[]> => {
      const res = await bdl.getGames({ ...opts, perPage: 50 });
      return res.data.map(toGame);
    },
    staleTime: 1000 * 60 * 5,
  });
}
