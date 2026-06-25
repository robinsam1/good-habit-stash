
-- Rewrite handle_new_user to honour an optional goal_code in raw_user_meta_data.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_region text;
  v_currency text;
  v_locale text;
  v_digits smallint;
  v_unit bigint;
  v_symbol text;
  v_goal text;
  v_name text;
  v_new_id bigint;
  v_names text[];
BEGIN
  v_region   := COALESCE(NEW.raw_user_meta_data->>'region_code',   'US');
  v_currency := COALESCE(NEW.raw_user_meta_data->>'currency_code', 'USD');
  v_locale   := COALESCE(NEW.raw_user_meta_data->>'locale',        'en-US');
  v_digits   := COALESCE((NEW.raw_user_meta_data->>'minor_unit_digits')::smallint, 2);
  v_symbol   := COALESCE(NEW.raw_user_meta_data->>'currency_symbol', '$');
  v_goal     := NEW.raw_user_meta_data->>'goal_code';
  v_unit     := public.currency_unit_amount(v_currency);

  INSERT INTO public.profiles (user_id, region_code, currency_code, locale, minor_unit_digits)
  VALUES (NEW.id, v_region, v_currency, v_locale, v_digits);

  IF v_goal = 'fit' THEN
    v_names := ARRAY[
      'Exercise – 30 minutes of exercise',
      'Exercise – 1 hour walking',
      'Exercise – 10 minutes of stretching',
      'Exercise – Strength session',
      'Eating – Cook your meal',
      'Eating – Drink 2L water',
      'Eating – 5 fruits/vegetables today',
      'Eating – Skip sugary drinks',
      'Sleep – Get up early',
      'Sleep – Go to bed on time'
    ];
  ELSIF v_goal = 'job' THEN
    v_names := ARRAY[
      'Job – Apply to 1 role',
      'Job – Tailor CV for a role',
      'Job – Update LinkedIn section',
      'Job – Practice 30 mins interview prep',
      'Job – Reach out to 1 contact',
      'Job – 1 hour upskilling',
      'Job – Research 3 companies',
      'Habits – Plan tomorrow',
      'Mind – Read 20 pages',
      'Work – 1 hour deep work block'
    ];
  ELSIF v_goal = 'zen' THEN
    v_names := ARRAY[
      'Mind – 10 minutes meditation',
      'Mind – Journal 1 page',
      'Mind – Read 20 pages',
      'Mind – 2 hours free of social media',
      'Mind – Gratitude list',
      'Exercise – 10 minutes of stretching',
      'Habits – Tidy living space',
      'Sleep – Go to bed on time',
      'Eating – Drink 2L water',
      'Habits – 30 minutes outside'
    ];
  ELSIF v_goal = 'connect' THEN
    v_names := ARRAY[
      'Social – Call a friend or family member',
      'Social – Send a thoughtful message',
      'Social – Meet someone in person',
      'Social – Make plans for the week',
      'Social – Reconnect with an old friend',
      'Social – Compliment someone',
      'Social – Attend a social event',
      'Social – 1 hour phone-free with others',
      'Habits – Remember a birthday',
      'Mind – Practice active listening'
    ];
  ELSE
    -- Fallback: full default list (existing behaviour)
    v_names := ARRAY[
      'Sleep – Get up early',
      'Sleep – Go to bed on time',
      'Exercise – 30 minutes of exercise',
      'Exercise – 1 hour walking',
      'Exercise – 10 minutes of stretching',
      'Habits – Make bed',
      'Habits – Do laundry',
      'Habits – Clean room',
      'Eating – Cook your meal',
      'Eating – Drink 2L water',
      'Eating – 5 fruits/vegetables today',
      'Finances – Skip big purchase',
      'Finances – Save ' || v_symbol || '10',
      'Mind – 10 minutes meditation',
      'Mind – Read 20 pages',
      'Mind – Journal 1 page',
      'Mind – 2 hours free of social media',
      'Social – Call a friend or family member',
      'Social – 1 hour phone-free',
      'Work – 1 hour deep work block',
      'Work – Set 3 goals for the day',
      'Work – Get to inbox zero'
    ];
  END IF;

  FOREACH v_name IN ARRAY v_names LOOP
    INSERT INTO public.activities (user_id, name, active)
    VALUES (NEW.id, v_name, true)
    RETURNING id INTO v_new_id;

    INSERT INTO public.activity_values (activity_id, value)
    VALUES (v_new_id, v_unit);
  END LOOP;

  RETURN NEW;
END;
$function$;

-- Cleanup function: removes anonymous users older than 24h. Cascades to their data.
CREATE OR REPLACE FUNCTION public.cleanup_anonymous_users()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  removed bigint;
BEGIN
  WITH deleted AS (
    DELETE FROM auth.users
    WHERE is_anonymous = true
      AND created_at < now() - interval '24 hours'
    RETURNING id
  )
  SELECT count(*) INTO removed FROM deleted;
  RETURN removed;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.cleanup_anonymous_users() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_anonymous_users() TO service_role;

-- Schedule hourly cleanup via pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-anonymous-users-hourly') THEN
    PERFORM cron.unschedule('cleanup-anonymous-users-hourly');
  END IF;
  PERFORM cron.schedule(
    'cleanup-anonymous-users-hourly',
    '0 * * * *',
    $cron$ SELECT public.cleanup_anonymous_users(); $cron$
  );
END $$;
