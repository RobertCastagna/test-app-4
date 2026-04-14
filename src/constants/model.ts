export const FEATURE_COUNT = 26;

export const FEATURE_LABELS = [
  "home_last10_ppg",
  "home_last10_papg",
  "home_last10_fg_pct",
  "home_last10_3p_pct",
  "home_last10_ft_pct",
  "home_last10_tov",
  "home_last10_reb",
  "home_last10_ast",
  "home_last10_def_rating",
  "home_last10_net_rating",
  "home_rest_days",
  "home_b2b_flag",
  "h2h_home_win_pct_season",
  "away_last10_ppg",
  "away_last10_papg",
  "away_last10_fg_pct",
  "away_last10_3p_pct",
  "away_last10_ft_pct",
  "away_last10_tov",
  "away_last10_reb",
  "away_last10_ast",
  "away_last10_def_rating",
  "away_last10_net_rating",
  "away_rest_days",
  "away_b2b_flag",
  "home_court_flag",
] as const;

export type FeatureLabel = (typeof FEATURE_LABELS)[number];

export const ROLLING_WINDOW = 10;

export const MLP_VERSION = "mlp-v0.1";
export const LLM_VERSION = "llama3.2-1b-q8";
export const MODEL_VERSION = `${MLP_VERSION}+${LLM_VERSION}` as const;

export const LLM_MIN_RAM_GB = 4;
export const MIN_IOS_VERSION = 17;
