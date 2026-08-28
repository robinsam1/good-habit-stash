// Goal-specific starter habits offered during the /get-started onboarding.
// Naming convention matches the rest of the app: "Category – Habit".

import { GoalCode } from "./goals";

export interface PresetHabit {
  name: string;
  /** Pre-ticked in the picker. */
  suggested?: boolean;
}

export const HABIT_PRESETS: Record<GoalCode, PresetHabit[]> = {
  fit: [
    { name: "Exercise – 30 minutes of exercise", suggested: true },
    { name: "Exercise – 1 hour walking", suggested: true },
    { name: "Exercise – 10 minutes of stretching", suggested: true },
    { name: "Exercise – Strength session" },
    { name: "Sleep – Get up early", suggested: true },
    { name: "Sleep – Go to bed on time", suggested: true },
    { name: "Eating – Cook your meal", suggested: true },
    { name: "Eating – Drink 2L water" },
    { name: "Eating – 5 fruits/vegetables today" },
    { name: "Eating – Skip sugary drinks" },
  ],
  job: [
    { name: "Job – Send an application", suggested: true },
    { name: "Job – Tailor your CV", suggested: true },
    { name: "Job – 30 minutes of interview prep", suggested: true },
    { name: "Job – Message someone in your field", suggested: true },
    { name: "Job – Update your portfolio" },
    { name: "Job – Practise one interview answer" },
    { name: "Learning – 30 minutes of study", suggested: true },
    { name: "Sleep – Get up early" },
    { name: "Habits – Plan tomorrow's tasks" },
    { name: "Habits – Inbox to zero" },
  ],
  zen: [
    { name: "Mind – 10 minutes of meditation", suggested: true },
    { name: "Mind – Journal for 5 minutes", suggested: true },
    { name: "Mind – No phone for the first hour", suggested: true },
    { name: "Mind – Screen-free evening" },
    { name: "Mind – Breathing exercise" },
    { name: "Sleep – Go to bed on time", suggested: true },
    { name: "Sleep – Get up early" },
    { name: "Habits – Make bed", suggested: true },
    { name: "Habits – Tidy one space" },
    { name: "Exercise – 1 hour walking" },
  ],
  connect: [
    { name: "Connect – Message a friend", suggested: true },
    { name: "Connect – Call someone you miss", suggested: true },
    { name: "Connect – Say yes to an invite", suggested: true },
    { name: "Connect – Attend a meetup" },
    { name: "Connect – Start a conversation with someone new", suggested: true },
    { name: "Connect – Plan something with a friend" },
    { name: "Connect – Reconnect with an old contact" },
    { name: "Habits – Leave the house before noon" },
    { name: "Exercise – 1 hour walking" },
    { name: "Mind – Journal for 5 minutes" },
  ],
};

export const presetsForGoal = (goal: GoalCode): PresetHabit[] =>
  HABIT_PRESETS[goal] ?? HABIT_PRESETS.fit;
