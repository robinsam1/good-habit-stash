// Prototype fixtures.
//
// The hosted preview does not talk to a real backend — activity data is mocked
// and auth/logging state is simulated in-memory (see ./mockClient.ts). These
// seed rows give the dashboard a believable, populated starting state.

export const PROTOTYPE_USER_ID = "prototype-user";

export interface MockActivity {
  id: number;
  name: string;
  active: boolean;
  user_id: string;
}

export interface MockActivityValue {
  id: number;
  activity_id: number;
  value: number;
  effective_from: string;
}

export interface MockLogEntry {
  id: number;
  date: string;
  activity_id: number;
  value: number;
  paid_out: string | null;
  notes: string | null;
  deleted_at: string | null;
  user_id: string;
}

export interface MockProfile {
  user_id: string;
  region_code: string;
  currency_code: string;
  currency_symbol: string;
  locale: string;
  minor_unit_digits: number;
  created_at: string;
}

// name + value (in minor currency units, e.g. cents) for each seeded activity.
// A couple of "bad habit" activities carry negative values to exercise both the
// positive and negative logging paths.
const SEED_ACTIVITIES: Array<{ name: string; value: number }> = [
  { name: "Morning run", value: 150 },
  { name: "Read a book", value: 100 },
  { name: "Drink water", value: 50 },
  { name: "Meditate", value: 75 },
  { name: "Sleep 8 hours", value: 120 },
  { name: "Workout", value: 150 },
  { name: "Eat vegetables", value: 80 },
  { name: "Study session", value: 100 },
  { name: "Write journal", value: 60 },
  { name: "Walk the dog", value: 70 },
  { name: "Practice guitar", value: 90 },
  { name: "Ride bike", value: 85 },
  { name: "Quit smoking", value: 200 },
  { name: "Side project", value: 110 },
  { name: "Family time", value: 70 },
  { name: "Scroll social media", value: -60 },
  { name: "Order takeaway", value: -40 },
];

const now = new Date();
const iso = (d: Date) => d.toISOString();
const hoursAgo = (h: number) => iso(new Date(now.getTime() - h * 60 * 60 * 1000));

export function buildSeedData() {
  const activities: MockActivity[] = SEED_ACTIVITIES.map((a, i) => ({
    id: i + 1,
    name: a.name,
    active: true,
    user_id: PROTOTYPE_USER_ID,
  }));

  const activityValues: MockActivityValue[] = SEED_ACTIVITIES.map((a, i) => ({
    id: i + 1,
    activity_id: i + 1,
    value: a.value,
    effective_from: hoursAgo(24 * 30),
  }));

  // A few unpaid entries already logged "today" so the balance and log look alive.
  const log: MockLogEntry[] = [
    {
      id: 1,
      date: hoursAgo(2),
      activity_id: 1,
      value: 150,
      paid_out: null,
      notes: null,
      deleted_at: null,
      user_id: PROTOTYPE_USER_ID,
    },
    {
      id: 2,
      date: hoursAgo(4),
      activity_id: 3,
      value: 50,
      paid_out: null,
      notes: "Kept the bottle on my desk 💧",
      deleted_at: null,
      user_id: PROTOTYPE_USER_ID,
    },
    {
      id: 3,
      date: hoursAgo(6),
      activity_id: 2,
      value: 100,
      paid_out: null,
      notes: null,
      deleted_at: null,
      user_id: PROTOTYPE_USER_ID,
    },
  ];

  const profiles: MockProfile[] = [
    {
      user_id: PROTOTYPE_USER_ID,
      region_code: "US",
      currency_code: "USD",
      currency_symbol: "$",
      locale: "en-US",
      minor_unit_digits: 2,
      created_at: hoursAgo(24 * 30),
    },
  ];

  return {
    activities,
    activity_values: activityValues,
    log,
    profiles,
    pro_interest: [] as Array<Record<string, unknown>>,
  };
}

export type SeedData = ReturnType<typeof buildSeedData>;
