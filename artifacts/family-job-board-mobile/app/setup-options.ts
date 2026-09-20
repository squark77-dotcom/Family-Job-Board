export const SETUP_CHOICES = [
  {
    mode: "create",
    label: "Create Family",
  },
  {
    mode: "join",
    label: "Join as a child",
  },
] as const;

export type SetupMode = (typeof SETUP_CHOICES)[number]["mode"];