import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Activity {
  id: number;
  name: string;
  active: boolean;
}

export interface ActivityValue {
  id: number;
  activity_id: number;
  value: number;
  effective_from: string;
}

export interface LogEntry {
  id: number;
  date: string;
  activity_id: number;
  value: number;
  paid_out: string | null;
  notes: string | null;
  deleted_at: string | null;
  activity?: Activity;
}

// Fetch all active activities
export function useActivities() {
  return useQuery({
    queryKey: ["activities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .eq("active", true)
        .order("name");
      
      if (error) throw error;
      return data as Activity[];
    },
  });
}

// Get the latest value for an activity
async function getLatestActivityValue(activityId: number): Promise<number> {
  const { data, error } = await supabase
    .from("activity_values")
    .select("value")
    .eq("activity_id", activityId)
    .order("effective_from", { ascending: false })
    .limit(1)
    .maybeSingle();
  
  if (error) throw error;
  return data?.value ?? 0;
}

// Fetch unpaid log entries (excluding deleted)
export function useUnpaidLog() {
  return useQuery({
    queryKey: ["unpaidLog"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("log")
        .select(`
          *,
          activity:activities(*)
        `)
        .is("paid_out", null)
        .is("deleted_at", null)
        .order("date", { ascending: false });
      
      if (error) throw error;
      return data as (LogEntry & { activity: Activity })[];
    },
  });
}

// Calculate running total from unpaid entries
export function useRunningTotal() {
  const { data: unpaidLog } = useUnpaidLog();
  
  const total = unpaidLog?.reduce((sum, entry) => sum + entry.value, 0) ?? 0;
  return total;
}

// Log a new habit entry
export function useLogActivity() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (activityId: number) => {
      // Server-side RPC resolves the reward value from activity_values and inserts the log entry.
      const { data: inserted, error } = await supabase.rpc("log_activity", {
        p_activity_id: activityId,
      });

      if (error) throw error;
      if (!inserted) throw new Error("Could not log activity.");

      // Fetch with joined activity for the UI.
      const { data, error: fetchError } = await supabase
        .from("log")
        .select(`*, activity:activities(*)`)
        .eq("id", (inserted as { id: number }).id)
        .single();

      if (fetchError) throw fetchError;
      return data as LogEntry & { activity: Activity };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unpaidLog"] });
    },
  });
}

// Mark all unpaid entries as paid
export function useMarkAsPaid() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("mark_unpaid_as_paid");
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unpaidLog"] });
      queryClient.invalidateQueries({ queryKey: ["paidLog"] });
    },
  });
}

// Update notes on a log entry
export function useUpdateLogNotes() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ logId, notes }: { logId: number; notes: string }) => {
      const { data, error } = await supabase.rpc("update_log_notes", {
        p_log_id: logId,
        p_notes: notes,
      });

      if (error) throw error;
      // If entry was already paid/deleted, function returns null
      if (!data) throw new Error("This entry can no longer be edited.");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unpaidLog"] });
      queryClient.invalidateQueries({ queryKey: ["paidLog"] });
    },
  });
}

// Fetch paid log entries (for history page, excluding deleted)
export function usePaidLog() {
  return useQuery({
    queryKey: ["paidLog"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("log")
        .select(`
          *,
          activity:activities(*)
        `)
        .not("paid_out", "is", null)
        .is("deleted_at", null)
        .order("date", { ascending: false });
      
      if (error) throw error;
      return data as (LogEntry & { activity: Activity })[];
    },
  });
}

// Soft delete a log entry
export function useDeleteLogEntry() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (logId: number) => {
      const { data, error } = await supabase.rpc("soft_delete_log_entry", {
        p_log_id: logId,
      });
      
      if (error) throw error;
      if (!data) throw new Error("You can't delete entries after they're paid.");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unpaidLog"] });
      queryClient.invalidateQueries({ queryKey: ["paidLog"] });
    },
  });
}

// Update activity on a log entry
export function useUpdateLogActivity() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ logId, activityId }: { logId: number; activityId: number }) => {
      const { data, error } = await supabase.rpc("update_log_activity", {
        p_log_id: logId,
        p_activity_id: activityId,
      });

      if (error) throw error;
      if (!data || data.length === 0) throw new Error("This entry can no longer be edited.");
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unpaidLog"] });
      queryClient.invalidateQueries({ queryKey: ["paidLog"] });
    },
  });
}

// Get activity values with their current values for display
export function useActivityValues() {
  const { data: activities } = useActivities();
  
  return useQuery({
    queryKey: ["activityValues", activities?.map(a => a.id)],
    enabled: !!activities?.length,
    queryFn: async () => {
      if (!activities) return [];
      
      const valuesPromises = activities.map(async (activity) => {
        const value = await getLatestActivityValue(activity.id);
        return {
          ...activity,
          currentValue: value,
        };
      });
      
      return Promise.all(valuesPromises);
    },
  });
}
