import {
  Footprints,
  BookOpen,
  GlassWater,
  Brain,
  Moon,
  Dumbbell,
  Salad,
  Utensils,
  NotebookPen,
  Smartphone,
  Dog,
  Coffee,
  Bike,
  Music,
  Guitar,
  Code,
  Briefcase,
  CigaretteOff,
  Wine,
  GraduationCap,
  Paintbrush,
  PiggyBank,
  ShowerHead,
  Pill,
  Languages,
  Leaf,
  Sun,
  HeartPulse,
  Sparkles,
  Star,
  Zap,
  Target,
  Trophy,
  Heart,
  Flame,
  Activity,
  Waves,
  type LucideIcon,
} from "lucide-react";

/**
 * The activities data model has no icon field, so icons for the mobile grid are
 * derived from the activity name. We first try a set of keyword heuristics; if
 * nothing matches we fall back to a fixed palette of icons chosen deterministically
 * from the activity's position so the same activity always renders the same icon.
 */

interface KeywordRule {
  keywords: string[];
  Icon: LucideIcon;
}

// Order matters: the first rule whose keyword appears in the name wins, so more
// specific keywords should come before broader ones.
const KEYWORD_RULES: KeywordRule[] = [
  { keywords: ["run", "jog", "sprint", "marathon"], Icon: Footprints },
  { keywords: ["walk", "hike", "steps", "stroll"], Icon: Footprints },
  { keywords: ["gym", "workout", "exercise", "lift", "strength", "train"], Icon: Dumbbell },
  { keywords: ["cycle", "cycling", "bike", "ride"], Icon: Bike },
  { keywords: ["swim", "surf"], Icon: Waves },
  { keywords: ["meditat", "mindful", "breath", "calm", "focus"], Icon: Brain },
  { keywords: ["sleep", "bed", "nap", "rest", "wake early"], Icon: Moon },
  { keywords: ["read", "book"], Icon: BookOpen },
  { keywords: ["study", "learn", "homework", "revision", "course", "class"], Icon: GraduationCap },
  { keywords: ["language", "spanish", "french", "german", "vocab"], Icon: Languages },
  { keywords: ["journal", "write", "diary", "note", "blog"], Icon: NotebookPen },
  { keywords: ["code", "program", "dev", "leetcode"], Icon: Code },
  { keywords: ["work", "job", "office", "email", "meeting", "career"], Icon: Briefcase },
  { keywords: ["guitar", "piano", "instrument"], Icon: Guitar },
  { keywords: ["music", "sing", "practice"], Icon: Music },
  { keywords: ["art", "paint", "draw", "sketch", "creative"], Icon: Paintbrush },
  { keywords: ["coffee", "espresso", "caffeine"], Icon: Coffee },
  { keywords: ["water", "hydrate", "drink water"], Icon: GlassWater },
  { keywords: ["veg", "salad", "healthy", "fruit", "diet", "greens"], Icon: Salad },
  { keywords: ["eat", "food", "meal", "cook", "lunch", "dinner", "breakfast", "snack", "takeaway", "junk"], Icon: Utensils },
  { keywords: ["smok", "cigarette", "vape", "nicotine"], Icon: CigaretteOff },
  { keywords: ["alcohol", "beer", "wine", "drink"], Icon: Wine },
  { keywords: ["screen", "scroll", "social", "phone", "instagram", "tiktok"], Icon: Smartphone },
  { keywords: ["dog", "cat", "pet", "walk the"], Icon: Dog },
  { keywords: ["save", "money", "budget", "spend", "invest"], Icon: PiggyBank },
  { keywords: ["shower", "wash", "clean", "tidy", "brush"], Icon: ShowerHead },
  { keywords: ["vitamin", "pill", "medicine", "supplement", "meds"], Icon: Pill },
  { keywords: ["garden", "plant", "nature", "outdoor", "tree"], Icon: Leaf },
  { keywords: ["morning", "sunrise", "sunlight"], Icon: Sun },
  { keywords: ["stretch", "yoga", "pilates", "health"], Icon: HeartPulse },
];

// Deterministic fallback palette used when no keyword matches.
const FALLBACK_ICONS: LucideIcon[] = [
  Sparkles,
  Star,
  Zap,
  Target,
  Trophy,
  Heart,
  Flame,
  Activity,
  Leaf,
  Waves,
];

// Colour palette. Each entry is a full literal className so Tailwind's content
// scanner keeps them in the build. Colours are assigned deterministically by
// hashing the activity name so a given activity keeps a stable colour.
const COLOR_PALETTE: Array<{ fg: string; bg: string }> = [
  { fg: "text-rose-500", bg: "bg-rose-500/10" },
  { fg: "text-orange-500", bg: "bg-orange-500/10" },
  { fg: "text-amber-500", bg: "bg-amber-500/10" },
  { fg: "text-emerald-500", bg: "bg-emerald-500/10" },
  { fg: "text-teal-500", bg: "bg-teal-500/10" },
  { fg: "text-sky-500", bg: "bg-sky-500/10" },
  { fg: "text-blue-500", bg: "bg-blue-500/10" },
  { fg: "text-indigo-500", bg: "bg-indigo-500/10" },
  { fg: "text-violet-500", bg: "bg-violet-500/10" },
  { fg: "text-fuchsia-500", bg: "bg-fuchsia-500/10" },
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export interface ActivityIcon {
  Icon: LucideIcon;
  /** Tailwind text-colour class for the icon. */
  fg: string;
  /** Tailwind background-tint class for the icon container. */
  bg: string;
}

/**
 * Resolve a Lucide icon and colour for an activity.
 *
 * @param name  The activity name (matched against keyword heuristics).
 * @param index The activity's position in the list, used for the deterministic
 *              icon fallback (`index % palette.length`).
 */
export function getActivityIcon(name: string, index: number): ActivityIcon {
  const normalized = name.toLowerCase();
  const rule = KEYWORD_RULES.find((r) => r.keywords.some((k) => normalized.includes(k)));
  const Icon = rule ? rule.Icon : FALLBACK_ICONS[index % FALLBACK_ICONS.length];
  const color = COLOR_PALETTE[hashString(normalized) % COLOR_PALETTE.length];
  return { Icon, fg: color.fg, bg: color.bg };
}
