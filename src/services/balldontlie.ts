import {
  BDLGamesResponseSchema,
  BDLStatsResponseSchema,
  type BDLGamesResponse,
  type BDLStatsResponse,
} from "../types/api";
import { ENV } from "../utils/env";

const BASE_URL = "https://api.balldontlie.io/v1";
const MAX_REQUESTS_PER_MINUTE = 5;

export class RateLimitError extends Error {
  constructor(public retryAfterSeconds: number) {
    super(`BallDontLie rate limit — retry in ${retryAfterSeconds}s`);
    this.name = "RateLimitError";
  }
}

export class BDLError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "BDLError";
  }
}

class TokenBucket {
  private tokens: number;
  private readonly capacity: number;
  private readonly refillMs: number;
  private lastRefill: number;

  constructor(capacity: number, refillWindowMs: number) {
    this.capacity = capacity;
    this.tokens = capacity;
    this.refillMs = refillWindowMs;
    this.lastRefill = Date.now();
  }

  async take(): Promise<void> {
    this.refill();
    if (this.tokens > 0) {
      this.tokens -= 1;
      return;
    }
    const wait = this.refillMs - (Date.now() - this.lastRefill);
    throw new RateLimitError(Math.max(1, Math.ceil(wait / 1000)));
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    if (elapsed >= this.refillMs) {
      this.tokens = this.capacity;
      this.lastRefill = now;
    }
  }
}

function appendList(search: URLSearchParams, key: string, values: readonly (string | number)[]): void {
  for (const v of values) search.append(key, String(v));
}

export interface BDLClientOptions {
  apiKey?: string;
  baseUrl?: string;
}

export class BallDontLieClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly bucket: TokenBucket;

  constructor(opts: BDLClientOptions = {}) {
    this.baseUrl = (opts.baseUrl ?? BASE_URL).replace(/\/$/, "");
    this.apiKey = opts.apiKey ?? ENV.BALLDONTLIE_API_KEY;
    this.bucket = new TokenBucket(MAX_REQUESTS_PER_MINUTE, 60_000);
  }

  private async request<T>(path: string, search: URLSearchParams, parser: (v: unknown) => T): Promise<T> {
    await this.bucket.take();
    const url = `${this.baseUrl}/${path}?${search.toString()}`;
    const headers: Record<string, string> = { Accept: "application/json" };
    if (this.apiKey) headers.Authorization = this.apiKey;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    try {
      const resp = await fetch(url, { headers, signal: controller.signal });
      if (resp.status === 429) throw new RateLimitError(60);
      if (!resp.ok) {
        throw new BDLError(`BDL ${resp.status} at ${path}`, resp.status);
      }
      const json = await resp.json();
      return parser(json);
    } finally {
      clearTimeout(timeout);
    }
  }

  async getGames(params: {
    date?: string;
    startDate?: string;
    endDate?: string;
    teamIds?: number[];
    perPage?: number;
    cursor?: number;
  }): Promise<BDLGamesResponse> {
    const search = new URLSearchParams();
    if (params.date) search.set("dates[]", params.date);
    if (params.startDate) search.set("start_date", params.startDate);
    if (params.endDate) search.set("end_date", params.endDate);
    if (params.perPage) search.set("per_page", String(params.perPage));
    if (params.cursor) search.set("cursor", String(params.cursor));
    appendList(search, "team_ids[]", params.teamIds ?? []);
    return this.request("games", search, (v) => BDLGamesResponseSchema.parse(v));
  }

  async getStats(params: {
    teamIds?: number[];
    seasons?: number[];
    startDate?: string;
    endDate?: string;
    perPage?: number;
    cursor?: number;
  }): Promise<BDLStatsResponse> {
    const search = new URLSearchParams();
    appendList(search, "team_ids[]", params.teamIds ?? []);
    appendList(search, "seasons[]", params.seasons ?? []);
    if (params.startDate) search.set("start_date", params.startDate);
    if (params.endDate) search.set("end_date", params.endDate);
    if (params.perPage) search.set("per_page", String(params.perPage));
    if (params.cursor) search.set("cursor", String(params.cursor));
    return this.request("stats", search, (v) => BDLStatsResponseSchema.parse(v));
  }
}

export const bdl = new BallDontLieClient();
