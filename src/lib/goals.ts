// Goals presented in the first-run experience. Each goal seeds a distinct
// set of starter habits when the user signs in anonymously.
// Keep the task names in sync with public.handle_new_user() in the database.

export type GoalCode = "fit" | "job" | "zen" | "connect";

export interface Goal {
  code: GoalCode;
  label: string;
  emoji: string;
  blurb: string;
}

export const GOALS: Goal[] = [
  {
    code: "fit",
    label: "Getting Fit",
    emoji: "💪",
    blurb: "Move more, eat better, sleep deeper.",
  },
  {
    code: "job",
    label: "Finding a New Job",
    emoji: "💼",
    blurb: "Apply, prep and grow your network.",
  },
  {
    code: "zen",
    label: "Zen Living",
    emoji: "🧘",
    blurb: "Calmer mind, slower scroll, lighter days.",
  },
  {
    code: "connect",
    label: "Making New Connections",
    emoji: "🤝",
    blurb: "Reach out, show up, build your circle.",
  },
];

export const getGoal = (code: string | null | undefined): Goal | undefined =>
  GOALS.find((g) => g.code === code);
