import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useIsPro() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["isPro", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("is_pro");
      if (error) throw error;
      return !!data;
    },
  });
}

export function useProInterest() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["proInterest", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pro_interest")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useRegisterProInterest() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("pro_interest")
        .insert({ user_id: user!.id, email: user!.email ?? null })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["proInterest", user?.id] });
    },
  });
}

export interface ManagedActivity {
  id: number;
  name: string;
  active: boolean;
  currentValue: number;
}

export function useAllActivities() {
  return useQuery({
    queryKey: ["allActivities"],
    queryFn: async () => {
      const { data: acts, error } = await supabase
        .from("activities")
        .select("*")
        .order("name");
      if (error) throw error;
      if (!acts?.length) return [] as ManagedActivity[];

      const ids = acts.map((a) => a.id);
      const { data: vals, error: vErr } = await supabase
        .from("activity_values")
        .select("activity_id, value, effective_from")
        .in("activity_id", ids)
        .order("effective_from", { ascending: false });
      if (vErr) throw vErr;

      const latest = new Map<number, number>();
      for (const v of vals ?? []) {
        if (!latest.has(v.activity_id)) latest.set(v.activity_id, v.value);
      }
      return acts.map((a) => ({
        id: a.id,
        name: a.name,
        active: a.active,
        currentValue: latest.get(a.id) ?? 0,
      })) as ManagedActivity[];
    },
  });
}

function invalidateActivityCaches(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["allActivities"] });
  qc.invalidateQueries({ queryKey: ["activities"] });
  qc.invalidateQueries({ queryKey: ["activityValues"] });
}

export function useCreateActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, value }: { name: string; value: number }) => {
      const { data, error } = await supabase.rpc("create_activity", {
        p_name: name,
        p_value: value,
      });
      if (error) throw error;
      return data as number;
    },
    onSuccess: () => invalidateActivityCaches(qc),
  });
}

export function useUpdateActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: number;
      name: string;
      value: number;
      active: boolean;
    }) => {
      const { error } = await supabase.rpc("update_activity", {
        p_activity_id: input.id,
        p_name: input.name,
        p_value: input.value,
        p_active: input.active,
      });
      if (error) throw error;
    },
    onSuccess: () => invalidateActivityCaches(qc),
  });
}

export function useDeleteActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.rpc("delete_activity", { p_activity_id: id });
      if (error) throw error;
    },
    onSuccess: () => invalidateActivityCaches(qc),
  });
}
