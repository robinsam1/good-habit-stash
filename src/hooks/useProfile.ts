import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Profile {
  user_id: string;
  region_code: string;
  currency_code: string;
  locale: string;
  minor_unit_digits: number;
  created_at: string;
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

  return { currency, locale, minorUnitDigits: digits, formatMoney, formatMoneySigned };
}
