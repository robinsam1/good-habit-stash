// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";
//
// PROTOTYPE MODE: this preview does not connect to a real Supabase backend.
// Activity data is mocked and auth/logging state is simulated in-memory so the
// full UI flow is previewable end to end. See ./mockClient.ts for the stub.
import { mockSupabase } from './mockClient';

export const supabase = mockSupabase;