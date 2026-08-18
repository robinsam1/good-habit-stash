-- 1. New-user seeding: single onboarding activity
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
  v_onboarding_names text[];
  v_reward bigint;
BEGIN
  v_region := COALESCE(NEW.raw_user_meta_data ->> 'region_code', 'US');
  v_currency := COALESCE(NEW.raw_user_meta_data ->> 'currency_code', 'USD');
  v_locale := COALESCE(NEW.raw_user_meta_data ->> 'locale', 'en-US');
  v_digits := COALESCE((NEW.raw_user_meta_data ->> 'minor_unit_digits')::smallint, 2);
  v_symbol := COALESCE(NEW.raw_user_meta_data ->> 'currency_symbol', '$');
  v_goal := COALESCE(NEW.raw_user_meta_data ->> 'goal_code', 'fit');
  v_unit := public.currency_unit_amount(v_currency);
  v_reward := public.onboarding_reward_amount(v_currency);

  INSERT INTO public.profiles (user_id, region_code, currency_code, locale, minor_unit_digits)
  VALUES (NEW.id, v_region, v_currency, v_locale, v_digits)
  ON CONFLICT (user_id) DO NOTHING;

  v_names := ARRAY[
    'Sleep – Get up early',
    'Sleep – Go to bed on time',
    'Exercise – 30 minutes of exercise',
    'Exercise – 1 hour walking',
    'Exercise – 10 minutes of stretching',
    'Exercise – Strength session',
    'Eating – Cook your meal',
    'Eating – Drink 2L water',
    'Eating – 5 fruits/vegetables today',
    'Eating – Skip sugary drinks'
  ];

  FOREACH v_name IN ARRAY v_names LOOP
    INSERT INTO public.activities (name, active, user_id, is_onboarding)
    VALUES (v_name, true, NEW.id, false)
    RETURNING id INTO v_new_id;

    INSERT INTO public.activity_values (activity_id, value)
    VALUES (v_new_id, v_unit);
  END LOOP;

  v_onboarding_names := ARRAY['Onboarding – Completed onboarding'];

  FOREACH v_name IN ARRAY v_onboarding_names LOOP
    INSERT INTO public.activities (name, active, user_id, is_onboarding)
    VALUES (v_name, true, NEW.id, true)
    RETURNING id INTO v_new_id;

    INSERT INTO public.activity_values (activity_id, value)
    VALUES (v_new_id, v_reward);
  END LOOP;

  RETURN NEW;
END;
$function$;

-- 2. Backfill the single onboarding activity for existing users
INSERT INTO public.activities (name, active, user_id, is_onboarding)
SELECT 'Onboarding – Completed onboarding', true, p.user_id, true
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.activities a
  WHERE a.user_id = p.user_id AND a.name = 'Onboarding – Completed onboarding'
);

INSERT INTO public.activity_values (activity_id, value)
SELECT a.id, public.onboarding_reward_amount(p.currency_code)
FROM public.activities a
JOIN public.profiles p ON p.user_id = a.user_id
WHERE a.name = 'Onboarding – Completed onboarding'
  AND NOT EXISTS (
    SELECT 1 FROM public.activity_values av WHERE av.activity_id = a.id
  );

-- 3. Remove the obsolete per-step onboarding activities that were never used
DELETE FROM public.activity_values av
USING public.activities a
WHERE av.activity_id = a.id
  AND a.is_onboarding = true
  AND a.name <> 'Onboarding – Completed onboarding'
  AND NOT EXISTS (SELECT 1 FROM public.log l WHERE l.activity_id = a.id);

DELETE FROM public.activities a
WHERE a.is_onboarding = true
  AND a.name <> 'Onboarding – Completed onboarding'
  AND NOT EXISTS (SELECT 1 FROM public.log l WHERE l.activity_id = a.id);

-- 4. Claim RPC: only one valid step key
CREATE OR REPLACE FUNCTION public.claim_onboarding_reward(p_step_key text)
RETURNS public.log
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_activity_id bigint;
  v_value bigint;
  v_reward public.log;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF trim(COALESCE(p_step_key, '')) <> 'onboarding_complete' THEN
    RAISE EXCEPTION 'Unknown onboarding step';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.onboarding_rewards
    WHERE user_id = v_uid AND step_key = 'onboarding_complete'
  ) THEN
    RETURN NULL;
  END IF;

  SELECT a.id INTO v_activity_id
  FROM public.activities a
  WHERE a.user_id = v_uid
    AND a.is_onboarding = true
    AND a.name = 'Onboarding – Completed onboarding';

  IF v_activity_id IS NULL THEN
    INSERT INTO public.activities (name, active, user_id, is_onboarding)
    VALUES ('Onboarding – Completed onboarding', true, v_uid, true)
    RETURNING id INTO v_activity_id;

    INSERT INTO public.activity_values (activity_id, value)
    SELECT v_activity_id, public.onboarding_reward_amount(p.currency_code)
    FROM public.profiles p WHERE p.user_id = v_uid;
  END IF;

  SELECT av.value INTO v_value
  FROM public.activity_values av
  WHERE av.activity_id = v_activity_id
  ORDER BY av.effective_from DESC
  LIMIT 1;

  v_value := COALESCE(v_value, 0);

  INSERT INTO public.log (user_id, activity_id, value, date)
  VALUES (v_uid, v_activity_id, v_value, now())
  RETURNING * INTO v_reward;

  INSERT INTO public.onboarding_rewards (user_id, step_key)
  VALUES (v_uid, 'onboarding_complete');

  RETURN v_reward;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.claim_onboarding_reward(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_onboarding_reward(text) TO authenticated, service_role;