export const SHORT_DISCLAIMER =
  "Statistical analysis only. Not betting advice. Not affiliated with any sportsbook or league.";

export const FOOTER_DISCLAIMER = "Analysis only. Not betting advice.";

export const FULL_DISCLAIMERS: readonly string[] = [
  "This app produces statistical predictions about NBA game outcomes using on-device AI analysis of public game statistics.",
  "Nothing in this app is a wager, a bet, a solicitation to wager, or betting advice.",
  "The app does not connect to, integrate with, or facilitate any sportsbook, casino, or real-money platform.",
  "Model predictions are probabilistic and frequently incorrect. Past accuracy does not guarantee future results.",
  "Gambling can be harmful. If you or someone you know has a gambling problem, call 1-800-GAMBLER (US).",
  "This app does not transmit your usage or predictions off-device except for fetching public sports statistics from third-party APIs.",
  "You must be 18+ (or legal age of majority in your jurisdiction) to use this app.",
];

export const JURISDICTION_NOTICE =
  "Sports wagering laws vary. This app does not let you wager. You are responsible for complying with local laws regarding any external activity.";

export const FORBIDDEN_COPY_WORDS = [
  "pick",
  "bet",
  "play",
  "lock",
  "action",
  "parlay",
  "wager",
] as const;

export const PREFERRED_COPY_WORDS = [
  "prediction",
  "analysis",
  "probability",
  "factor",
  "confidence",
  "uncertainty",
] as const;
