// In-memory mock of the Supabase client used for the hosted prototype preview.
//
// It implements just the slice of the supabase-js surface the app touches
// (auth, a chainable query builder, RPCs and realtime channels) backed by the
// fixtures in ./mockData.ts. No network, no real backend — auth accepts any
// credentials and logging state lives in memory for the session.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { buildSeedData, PROTOTYPE_USER_ID, type SeedData } from "./mockData";

type Row = Record<string, unknown>;
type Result<T = unknown> = { data: T; error: { message: string } | null };

const SESSION_STORAGE_KEY = "habit-visor-prototype-session";

// ---------------------------------------------------------------------------
// Data store
// ---------------------------------------------------------------------------

const db: SeedData = buildSeedData();

function nextId(rows: Array<{ id?: number }>): number {
  return rows.reduce((max, r) => Math.max(max, r.id ?? 0), 0) + 1;
}

function latestValueFor(activityId: number): number {
  const values = db.activity_values
    .filter((v) => v.activity_id === activityId)
    .sort((a, b) => (a.effective_from < b.effective_from ? 1 : -1));
  return values[0]?.value ?? 0;
}

// ---------------------------------------------------------------------------
// Query builder
// ---------------------------------------------------------------------------

interface Filter {
  kind: "eq" | "is" | "not_is" | "in";
  column: string;
  value: unknown;
}

function compare(a: unknown, b: unknown): number {
  if (typeof a === "number" && typeof b === "number") return a - b;
  const sa = String(a ?? "");
  const sb = String(b ?? "");
  return sa < sb ? -1 : sa > sb ? 1 : 0;
}

class MockQueryBuilder implements PromiseLike<Result> {
  private filters: Filter[] = [];
  private selectStr = "*";
  private orderBy: { column: string; ascending: boolean } | null = null;
  private limitN: number | null = null;
  private insertRows: Row[] | null = null;

  constructor(private readonly table: keyof SeedData) {}

  select(str = "*") {
    this.selectStr = str;
    return this;
  }

  insert(rows: Row | Row[]) {
    this.insertRows = Array.isArray(rows) ? rows : [rows];
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push({ kind: "eq", column, value });
    return this;
  }

  is(column: string, value: unknown) {
    this.filters.push({ kind: "is", column, value });
    return this;
  }

  not(column: string, _op: string, value: unknown) {
    this.filters.push({ kind: "not_is", column, value });
    return this;
  }

  in(column: string, value: unknown[]) {
    this.filters.push({ kind: "in", column, value });
    return this;
  }

  order(column: string, opts?: { ascending?: boolean }) {
    this.orderBy = { column, ascending: opts?.ascending ?? true };
    return this;
  }

  limit(n: number) {
    this.limitN = n;
    return this;
  }

  maybeSingle() {
    return this.run("maybeSingle");
  }

  single() {
    return this.run("single");
  }

  then<TResult1 = Result, TResult2 = never>(
    onfulfilled?: ((value: Result) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return this.run("many").then(onfulfilled, onrejected);
  }

  private matches(row: Row): boolean {
    return this.filters.every((f) => {
      const cell = row[f.column];
      switch (f.kind) {
        case "eq":
          return cell === f.value;
        case "is":
          return f.value === null ? cell === null || cell === undefined : cell === f.value;
        case "not_is":
          return f.value === null ? cell !== null && cell !== undefined : cell !== f.value;
        case "in":
          return Array.isArray(f.value) && f.value.includes(cell);
        default:
          return true;
      }
    });
  }

  private decorate(row: Row): Row {
    if (this.selectStr.includes("activities(")) {
      const activity = db.activities.find((a) => a.id === row.activity_id);
      return { ...row, activity: activity ?? null };
    }
    return { ...row };
  }

  private shape(rows: Row[], mode: "many" | "single" | "maybeSingle"): Result {
    if (mode === "many") return { data: rows, error: null };
    if (mode === "maybeSingle") return { data: rows[0] ?? null, error: null };
    // single
    if (rows.length === 0) return { data: null, error: { message: "No rows found" } };
    return { data: rows[0], error: null };
  }

  private async run(mode: "many" | "single" | "maybeSingle"): Promise<Result> {
    try {
      if (this.insertRows) {
        const table = db[this.table] as Array<Row & { id?: number }>;
        const inserted = this.insertRows.map((r) => {
          const row: Row & { id?: number } = { ...r };
          if (row.id == null) row.id = nextId(table);
          return row;
        });
        table.push(...inserted);
        return this.shape(inserted.map((r) => this.decorate(r)), mode);
      }

      let rows = (db[this.table] as Row[]).filter((r) => this.matches(r));
      if (this.orderBy) {
        const { column, ascending } = this.orderBy;
        rows = [...rows].sort((a, b) => {
          const c = compare(a[column], b[column]);
          return ascending ? c : -c;
        });
      }
      if (this.limitN != null) rows = rows.slice(0, this.limitN);
      return this.shape(rows.map((r) => this.decorate(r)), mode);
    } catch (e) {
      return { data: null, error: { message: e instanceof Error ? e.message : "Mock query failed" } };
    }
  }
}

// ---------------------------------------------------------------------------
// RPCs
// ---------------------------------------------------------------------------

const nowIso = () => new Date().toISOString();

const rpcHandlers: Record<string, (args: Record<string, unknown>) => Result> = {
  log_activity: (args) => {
    const activityId = Number(args.p_activity_id);
    const entry = {
      id: nextId(db.log),
      date: nowIso(),
      activity_id: activityId,
      value: latestValueFor(activityId),
      paid_out: null,
      notes: null,
      deleted_at: null,
      user_id: PROTOTYPE_USER_ID,
    };
    db.log.push(entry);
    return { data: { id: entry.id }, error: null };
  },

  mark_unpaid_as_paid: () => {
    const stamp = nowIso();
    let count = 0;
    for (const row of db.log) {
      if (row.paid_out === null && row.deleted_at === null) {
        row.paid_out = stamp;
        count++;
      }
    }
    return { data: count, error: null };
  },

  soft_delete_log_entry: (args) => {
    const row = db.log.find((r) => r.id === Number(args.p_log_id));
    if (!row || row.paid_out !== null) return { data: null, error: null };
    row.deleted_at = nowIso();
    return { data: row, error: null };
  },

  update_log_notes: (args) => {
    const row = db.log.find((r) => r.id === Number(args.p_log_id));
    if (!row || row.paid_out !== null || row.deleted_at !== null) return { data: null, error: null };
    row.notes = String(args.p_notes ?? "");
    return { data: row, error: null };
  },

  update_log_activity: (args) => {
    const row = db.log.find((r) => r.id === Number(args.p_log_id));
    if (!row || row.paid_out !== null || row.deleted_at !== null) return { data: [], error: null };
    const activityId = Number(args.p_activity_id);
    row.activity_id = activityId;
    row.value = latestValueFor(activityId);
    return { data: [row], error: null };
  },

  is_pro: () => ({ data: false, error: null }),

  create_activity: (args) => {
    const id = nextId(db.activities);
    db.activities.push({ id, name: String(args.p_name), active: true, user_id: PROTOTYPE_USER_ID });
    db.activity_values.push({
      id: nextId(db.activity_values),
      activity_id: id,
      value: Number(args.p_value),
      effective_from: nowIso(),
    });
    return { data: id, error: null };
  },

  update_activity: (args) => {
    const activity = db.activities.find((a) => a.id === Number(args.p_activity_id));
    if (activity) {
      activity.name = String(args.p_name);
      activity.active = Boolean(args.p_active);
      db.activity_values.push({
        id: nextId(db.activity_values),
        activity_id: activity.id,
        value: Number(args.p_value),
        effective_from: nowIso(),
      });
    }
    return { data: undefined, error: null };
  },

  delete_activity: (args) => {
    const activity = db.activities.find((a) => a.id === Number(args.p_activity_id));
    if (activity) activity.active = false;
    return { data: undefined, error: null };
  },
};

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

interface MockUser {
  id: string;
  email: string;
  user_metadata: Record<string, unknown>;
  app_metadata: Record<string, unknown>;
  aud: string;
  created_at: string;
}

interface MockSession {
  access_token: string;
  token_type: string;
  expires_in: number;
  expires_at: number;
  refresh_token: string;
  user: MockUser;
}

type AuthListener = (event: string, session: MockSession | null) => void;

let currentSession: MockSession | null = null;
const authListeners = new Set<AuthListener>();

function safeStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function persistSession(session: MockSession | null) {
  try {
    const store = safeStorage();
    if (!store) return;
    if (session) store.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    else store.removeItem(SESSION_STORAGE_KEY);
  } catch {
    /* ignore storage failures — never break the prototype */
  }
}

function loadSession(): MockSession | null {
  try {
    const store = safeStorage();
    const raw = store?.getItem(SESSION_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as MockSession) : null;
  } catch {
    return null;
  }
}

currentSession = loadSession();

function makeSession(email: string, metadata: Record<string, unknown> = {}): MockSession {
  const user: MockUser = {
    id: PROTOTYPE_USER_ID,
    email,
    user_metadata: metadata,
    app_metadata: {},
    aud: "authenticated",
    created_at: nowIso(),
  };
  return {
    access_token: "prototype-access-token",
    token_type: "bearer",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    refresh_token: "prototype-refresh-token",
    user,
  };
}

function notify(event: string) {
  persistSession(currentSession);
  for (const listener of authListeners) listener(event, currentSession);
}

function upsertProfileFromMetadata(metadata: Record<string, unknown>) {
  const existing = db.profiles.find((p) => p.user_id === PROTOTYPE_USER_ID);
  const patch = {
    region_code: (metadata.region_code as string) ?? existing?.region_code ?? "US",
    currency_code: (metadata.currency_code as string) ?? existing?.currency_code ?? "USD",
    currency_symbol: (metadata.currency_symbol as string) ?? existing?.currency_symbol ?? "$",
    locale: (metadata.locale as string) ?? existing?.locale ?? "en-US",
    minor_unit_digits: (metadata.minor_unit_digits as number) ?? existing?.minor_unit_digits ?? 2,
  };
  if (existing) {
    Object.assign(existing, patch);
  } else {
    db.profiles.push({ user_id: PROTOTYPE_USER_ID, created_at: nowIso(), ...patch });
  }
}

const auth = {
  onAuthStateChange(callback: AuthListener) {
    authListeners.add(callback);
    // Mimic supabase-js emitting an initial event shortly after subscription.
    setTimeout(() => callback("INITIAL_SESSION", currentSession), 0);
    return {
      data: {
        subscription: {
          id: "prototype-subscription",
          callback,
          unsubscribe: () => authListeners.delete(callback),
        },
      },
    };
  },

  async getSession() {
    return { data: { session: currentSession }, error: null };
  },

  async getUser() {
    return { data: { user: currentSession?.user ?? null }, error: null };
  },

  async signInWithPassword({ email }: { email: string; password: string }) {
    currentSession = makeSession(email);
    notify("SIGNED_IN");
    return { data: { session: currentSession, user: currentSession.user }, error: null };
  },

  async signUp({ email, options }: { email: string; password: string; options?: { data?: Record<string, unknown> } }) {
    const metadata = options?.data ?? {};
    currentSession = makeSession(email, metadata);
    upsertProfileFromMetadata(metadata);
    notify("SIGNED_IN");
    return { data: { session: currentSession, user: currentSession.user }, error: null };
  },

  async signOut() {
    currentSession = null;
    notify("SIGNED_OUT");
    return { error: null };
  },

  async updateUser(attributes: Record<string, unknown>) {
    if (currentSession && attributes && typeof attributes === "object") {
      const data = (attributes as { data?: Record<string, unknown> }).data;
      if (data) currentSession.user.user_metadata = { ...currentSession.user.user_metadata, ...data };
      notify("USER_UPDATED");
    }
    return { data: { user: currentSession?.user ?? null }, error: null };
  },
};

// ---------------------------------------------------------------------------
// Realtime (no-op stubs)
// ---------------------------------------------------------------------------

function makeChannel() {
  const channel = {
    on: () => channel,
    subscribe: () => channel,
    unsubscribe: () => Promise.resolve("ok"),
  };
  return channel;
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

const mockClient = {
  auth,
  from(table: string) {
    return new MockQueryBuilder(table as keyof SeedData);
  },
  async rpc(name: string, args: Record<string, unknown> = {}) {
    const handler = rpcHandlers[name];
    if (!handler) return { data: null, error: { message: `Unknown RPC: ${name}` } };
    return handler(args);
  },
  channel: () => makeChannel(),
  removeChannel: () => Promise.resolve("ok"),
};

export const mockSupabase = mockClient as unknown as SupabaseClient<Database>;
