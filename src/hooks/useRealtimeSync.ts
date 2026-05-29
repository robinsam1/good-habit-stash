import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Subscribes to realtime changes on the log table and
 * invalidates relevant queries when data changes.
 * This enables cross-device sync without manual refresh.
 */
export function useRealtimeSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("log-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "log",
        },
        () => {
          // Invalidate both unpaid and paid log queries
          // This refreshes the balance, pending habits, and history
          queryClient.invalidateQueries({ queryKey: ["unpaidLog"] });
          queryClient.invalidateQueries({ queryKey: ["paidLog"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
