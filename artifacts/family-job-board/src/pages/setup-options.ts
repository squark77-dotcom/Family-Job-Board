export const SETUP_CHOICES = [
  {
    mode: "create",
    title: "Create Family",
    description: "Create a new family and add child profiles.",
  },
  {
    mode: "join",
    title: "I’m joining as a child",
    description: "Enter your family join code and child profile ID.",
  },
] as const;

export type SetupMode = (typeof SETUP_CHOICES)[number]["mode"];