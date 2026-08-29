import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Profile {
  user_id: string;
  region_code: string;
  currency_code: string;
  locale: string;
  minor_unit_digits: number;
  bank_id: string | null;
  created_at: string;
  /** Optional daily habits-completed target override. Null = auto. */
  daily_target: number | null;
}

export function useProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as Profile | null;
    },
  });
}

/** Saves the user's daily habits-completed target (null = auto suggestion). */
export function useUpdateDailyTarget() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (target: number | null) => {
      const { error } = await supabase
        .from("profiles")
        .update({ daily_target: target })
        .eq("user_id", user!.id);
      if (error) throw error;
      return target;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
    },
  });
}

/** Saves the user's preferred banking app for the "move to savings" hand-off. */
export function useUpdateBank() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bankId: string | null) => {
      const { error } = await supabase
        .from("profiles")
        .update({ bank_id: bankId })
        .eq("user_id", user!.id);
      if (error) throw error;
      return bankId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
    },
  });
}


/**
 * Hook returning currency-aware money formatters.
 * Falls back to USD until the profile finishes loading.
 */
export function useMoney() {
  const { data: profile } = useProfile();
  const currency = profile?.currency_code ?? "USD";
  const locale = profile?.locale ?? "en-US";
  const digits = profile?.minor_unit_digits ?? 2;
  const factor = Math.pow(10, digits);

  const formatMoney = (minorUnits: number): string => {
    const amount = minorUnits / factor;
    try {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      }).format(amount);
    } catch {
      return `${amount.toFixed(digits)} ${currency}`;
    }
  };

  const formatMoneySigned = (minorUnits: number): string => {
    const formatted = formatMoney(Math.abs(minorUnits));
    return minorUnits >= 0 ? `+${formatted}` : `-${formatted}`;
  };

  /** Bare number, no currency symbol or grouping — safe to paste into a bank app. */
  const formatAmountPlain = (minorUnits: number): string =>
    (minorUnits / factor).toFixed(digits);

  return {
    currency,
    locale,
    minorUnitDigits: digits,
    formatMoney,
    formatMoneySigned,
    formatAmountPlain,
  };
}

