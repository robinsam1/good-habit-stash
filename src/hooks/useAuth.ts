import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Region } from '@/lib/regions';
import { GoalCode } from '@/lib/goals';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  }, []);

  const signUp = useCallback(async (email: string, password: string, region: Region) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          region_code: region.code,
          currency_code: region.currencyCode,
          currency_symbol: region.currencySymbol,
          locale: region.locale,
          minor_unit_digits: region.minorUnitDigits,
        },
      },
    });
    return { error };
  }, []);

  /**
   * Create a temporary (anonymous) account. The handle_new_user trigger
   * reads `goal_code` from raw_user_meta_data and seeds tasks accordingly.
   * When `habits` is supplied, those habits (values in minor units) are
   * seeded instead of the default starter list.
   */
  const signInAnonymously = useCallback(
    async (
      goal: GoalCode,
      region: Region,
      habits?: { name: string; value: number }[]
    ) => {
      const { error } = await supabase.auth.signInAnonymously({
        options: {
          data: {
            goal_code: goal,
            region_code: region.code,
            currency_code: region.currencyCode,
            currency_symbol: region.currencySymbol,
            locale: region.locale,
            minor_unit_digits: region.minorUnitDigits,
            ...(habits?.length ? { habits: habits.slice(0, 40) } : {}),
          },
        },
      });
      return { error };
    },
    []
  );


  /**
   * Convert the current anonymous account into a permanent one.
   * Same user_id — all activities/log entries follow automatically.
   */
  const upgradeAccount = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.updateUser({ email, password });
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    // Guest accounts are purged on sign-out so we don't leave orphan data.
    if (user?.is_anonymous) {
      try {
        await supabase.rpc('delete_my_anonymous_account');
      } catch {
        // Fall through — 24h cron will clean up if the delete failed.
      }
    }
    const { error } = await supabase.auth.signOut();
    return { error };
  }, [user]);

  return {
    user,
    session,
    isLoading,
    isAuthenticated: !!session,
    isAnonymous: !!user?.is_anonymous,
    signIn,
    signUp,
    signInAnonymously,
    upgradeAccount,
    signOut,
  };
}
