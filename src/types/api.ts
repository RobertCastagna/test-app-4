import { z } from "zod";

export const BDLTeamSchema = z.object({
  id: z.number(),
  abbreviation: z.string(),
  full_name: z.string(),
  conference: z.enum(["East", "West"]),
  city: z.string().optional(),
  name: z.string().optional(),
  division: z.string().optional(),
});

export const BDLGameSchema = z.object({
  id: z.number(),
  date: z.string(),
  season: z.number(),
  status: z.string(),
  period: z.number().optional(),
  time: z.string().nullable().optional(),
  postseason: z.boolean().optional(),
  home_team: BDLTeamSchema,
  visitor_team: BDLTeamSchema,
  home_team_score: z.number().optional(),
  visitor_team_score: z.number().optional(),
});

export const BDLGamesResponseSchema = z.object({
  data: z.array(BDLGameSchema),
  meta: z
    .object({
      next_cursor: z.number().nullable().optional(),
      per_page: z.number().optional(),
    })
    .optional(),
});

export const BDLStatsRowSchema = z.object({
  id: z.number(),
  game: z
    .object({ id: z.number(), date: z.string(), season: z.number() })
    .passthrough(),
  team: z.object({ id: z.number(), abbreviation: z.string() }).passthrough(),
  pts: z.number().nullable().optional(),
  fgm: z.number().nullable().optional(),
  fga: z.number().nullable().optional(),
  fg3m: z.number().nullable().optional(),
  fg3a: z.number().nullable().optional(),
  ftm: z.number().nullable().optional(),
  fta: z.number().nullable().optional(),
  reb: z.number().nullable().optional(),
  ast: z.number().nullable().optional(),
  turnover: z.number().nullable().optional(),
});

export const BDLStatsResponseSchema = z.object({
  data: z.array(BDLStatsRowSchema),
  meta: z.object({ next_cursor: z.number().nullable().optional() }).optional(),
});

export type BDLTeam = z.infer<typeof BDLTeamSchema>;
export type BDLGame = z.infer<typeof BDLGameSchema>;
export type BDLGamesResponse = z.infer<typeof BDLGamesResponseSchema>;
export type BDLStatsRow = z.infer<typeof BDLStatsRowSchema>;
export type BDLStatsResponse = z.infer<typeof BDLStatsResponseSchema>;
