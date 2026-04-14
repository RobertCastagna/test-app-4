import * as SQLite from "expo-sqlite";

import type { Game, Prediction } from "../types/domain";

const DB_NAME = "hoopoi.db";
const SCHEMA_VERSION = 1;

let dbSingleton: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbSingleton) return dbSingleton;
  dbSingleton = await SQLite.openDatabaseAsync(DB_NAME);
  await migrate(dbSingleton);
  return dbSingleton;
}

async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>(
    "PRAGMA user_version"
  );
  const current = row?.user_version ?? 0;
  if (current >= SCHEMA_VERSION) return;

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      season INTEGER NOT NULL,
      home_id INTEGER NOT NULL,
      away_id INTEGER NOT NULL,
      home_score INTEGER,
      away_score INTEGER,
      status TEXT NOT NULL,
      raw_json TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_games_date ON games(date);

    CREATE TABLE IF NOT EXISTS teams_rolling_stats (
      team_id INTEGER NOT NULL,
      as_of_date TEXT NOT NULL,
      window_size INTEGER NOT NULL,
      stats_json TEXT NOT NULL,
      PRIMARY KEY (team_id, as_of_date, window_size)
    );

    CREATE TABLE IF NOT EXISTS predictions (
      game_id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      home_win_prob REAL NOT NULL,
      confidence REAL NOT NULL,
      model_version TEXT NOT NULL,
      analysis_json TEXT NOT NULL,
      actual_outcome TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_pred_created ON predictions(created_at);

    CREATE TABLE IF NOT EXISTS kv (
      k TEXT PRIMARY KEY,
      v TEXT NOT NULL
    );
  `);
  await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
}

export async function saveGame(game: Game): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO games (id, date, season, home_id, away_id, home_score, away_score, status, raw_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    game.id,
    game.date,
    game.season,
    game.home.id,
    game.away.id,
    game.homeScore ?? null,
    game.awayScore ?? null,
    game.status,
    JSON.stringify(game)
  );
}

export async function savePrediction(p: Prediction): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO predictions
      (game_id, created_at, home_win_prob, confidence, model_version, analysis_json, actual_outcome)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    p.gameId,
    p.createdAt,
    p.homeWinProb,
    p.analysis.confidence,
    p.modelVersion,
    JSON.stringify(p.analysis),
    p.actualOutcome ?? null
  );
}

export async function getPrediction(gameId: string): Promise<Prediction | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{
    game_id: string;
    created_at: string;
    home_win_prob: number;
    confidence: number;
    model_version: string;
    analysis_json: string;
    actual_outcome: string | null;
  }>(`SELECT * FROM predictions WHERE game_id = ?`, gameId);
  if (!row) return null;
  return {
    gameId: row.game_id,
    createdAt: row.created_at,
    homeWinProb: row.home_win_prob,
    analysis: JSON.parse(row.analysis_json),
    actualOutcome: row.actual_outcome as Prediction["actualOutcome"],
    modelVersion: row.model_version,
  };
}

export async function getPredictionHistory(limit = 100): Promise<Prediction[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    game_id: string;
    created_at: string;
    home_win_prob: number;
    confidence: number;
    model_version: string;
    analysis_json: string;
    actual_outcome: string | null;
  }>(
    `SELECT * FROM predictions ORDER BY created_at DESC LIMIT ?`,
    limit
  );
  return rows.map((r) => ({
    gameId: r.game_id,
    createdAt: r.created_at,
    homeWinProb: r.home_win_prob,
    analysis: JSON.parse(r.analysis_json),
    actualOutcome: r.actual_outcome as Prediction["actualOutcome"],
    modelVersion: r.model_version,
  }));
}

export async function setKv(k: string, v: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO kv (k, v) VALUES (?, ?)`,
    k,
    v
  );
}

export async function getKv(k: string): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ v: string }>(
    `SELECT v FROM kv WHERE k = ?`,
    k
  );
  return row?.v ?? null;
}

export async function resetAll(): Promise<void> {
  const db = await getDatabase();
  await db.execAsync(`
    DELETE FROM games;
    DELETE FROM teams_rolling_stats;
    DELETE FROM predictions;
    DELETE FROM kv;
  `);
}
