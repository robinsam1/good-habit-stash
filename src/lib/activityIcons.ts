import {
  Activity,
  Apple,
  Bed,
  BookOpen,
  Brain,
  Briefcase,
  Coffee,
  Coins,
  Droplets,
  Dumbbell,
  Flame,
  Footprints,
  Heart,
  Inbox,
  Leaf,
  Moon,
  Music,
  NotebookPen,
  PersonStanding,
  Phone,
  PiggyBank,
  Smartphone,
  Sparkles,
  Star,
  Sun,
  Sunrise,
  Target,
  Trophy,
  Users,
  Utensils,
  Wallet,
  WashingMachine,
  Wind,
  Zap,
  type LucideIcon,
} from "lucide-react";

export type { LucideIcon };

/**
 * Ordered keyword → icon rules. The first rule whose keyword appears anywhere in
 * the lowercased activity name wins, so more specific keywords must come before
 * broader ones (e.g. "workout" before "work", "cook" before "eat").
 */
const ICON_RULES: ReadonlyArray<{ keywords: string[]; icon: LucideIcon }> = [
  { keywords: ["water", "hydrate", "hydration"], icon: Droplets },
  { keywords: ["coffee", "caffeine"], icon: Coffee },
  { keywords: ["run", "jog", "cardio"], icon: Footprints },
  { keywords: ["walk"], icon: PersonStanding },
  { keywords: ["stretch", "yoga", "mobility"], icon: Activity },
  { keywords: ["exercise", "workout", "gym", "train", "fitness", "hiit"], icon: Dumbbell },
  { keywords: ["sleep", "nap", "rest"], icon: Moon },
  { keywords: ["bed"], icon: Bed },
  { keywords: ["wake", "early", "get up", "sunrise", "morning"], icon: Sunrise },
  { keywords: ["read", "book", "pages"], icon: BookOpen },
  { keywords: ["journal", "write", "diary", "gratitude"], icon: NotebookPen },
  { keywords: ["meditat", "mindful", "breath", "calm"], icon: Brain },
  { keywords: ["cook", "meal", "recipe"], icon: Utensils },
  { keywords: ["fruit", "veg", "eat", "salad", "nutrition"], icon: Apple },
  { keywords: ["spend", "purchase", "money", "invest"], icon: Wallet },
  { keywords: ["save", "saving", "budget", "finance"], icon: PiggyBank },
  { keywords: ["laundry", "wash", "dishes"], icon: WashingMachine },
  { keywords: ["clean", "tidy", "room", "chore"], icon: Sparkles },
  { keywords: ["phone", "screen", "social media", "scroll"], icon: Smartphone },
  { keywords: ["call", "text"], icon: Phone },
  { keywords: ["friend", "family", "connect", "social"], icon: Users },
  { keywords: ["inbox", "email", "mail"], icon: Inbox },
  { keywords: ["goal", "plan", "prioriti"], icon: Target },
  { keywords: ["work", "focus", "deep work", "study"], icon: Briefcase },
  { keywords: ["music", "instrument", "practice"], icon: Music },
  { keywords: ["garden", "plant", "nature", "outdoor"], icon: Leaf },
];

/**
 * Deterministic fallback palette used when no keyword matches. Indexing by the
 * activity's stable list position keeps the icon consistent across sessions.
 */
const FALLBACK_PALETTE: readonly LucideIcon[] = [
  Star,
  Zap,
  Trophy,
  Target,
  Flame,
  Leaf,
  Sun,
  Heart,
  Sparkles,
  Coins,
  Wind,
  Activity,
];

/**
 * Resolve a Lucide icon for an activity. Tries keyword heuristics first, then
 * falls back to a deterministic palette keyed on the activity's index.
 */
export function getActivityIcon(name: string, index: number): LucideIcon {
  const haystack = name.toLowerCase();
  for (const rule of ICON_RULES) {
    if (rule.keywords.some((kw) => haystack.includes(kw))) {
      return rule.icon;
    }
  }
  const len = FALLBACK_PALETTE.length;
  const safeIndex = ((index % len) + len) % len;
  return FALLBACK_PALETTE[safeIndex];
}
