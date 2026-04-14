export interface JurisdictionNote {
  region: string;
  note: string;
}

export const JURISDICTION_NOTES: readonly JurisdictionNote[] = [
  {
    region: "United States",
    note: "Sports-wagering legality varies by state. This app performs statistical analysis only and does not facilitate any wagers.",
  },
  {
    region: "United Kingdom",
    note: "This app does not offer gambling services under the Gambling Act 2005.",
  },
  {
    region: "European Union",
    note: "This app is not a regulated gambling service under national licensing regimes.",
  },
  {
    region: "Other",
    note: "Consult local law. The app provides statistical analysis only and never places or facilitates wagers.",
  },
];
