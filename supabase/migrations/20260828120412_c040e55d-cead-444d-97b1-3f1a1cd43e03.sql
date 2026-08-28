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
  v_custom jsonb;
  v_item jsonb;
  v_count int := 0;
  v_value bigint;
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

  -- Habits chosen during onboarding, if any: [{ "name": "...", "value": 100 }, ...]
  BEGIN
    v_custom := (NEW.raw_user_meta_data -> 'habits');
  EXCEPTION WHEN others THEN
    v_custom := NULL;
  END;

  IF v_custom IS NOT NULL AND jsonb_typeof(v_custom) = 'array' AND jsonb_array_length(v_custom) > 0 THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(v_custom) LOOP
      EXIT WHEN v_count >= 40;
      v_name := btrim(COALESCE(v_item ->> 'name', ''));
      CONTINUE WHEN v_name = '';
      v_name := left(v_name, 120);
      BEGIN
        v_value := COALESCE((v_item ->> 'value')::bigint, v_unit);
      EXCEPTION WHEN others THEN
        v_value := v_unit;
      END;
      IF v_value > 100000000 THEN v_value := 100000000; END IF;
      IF v_value < -100000000 THEN v_value := -100000000; END IF;

      INSERT INTO public.activities (name, active, user_id, is_onboarding)
      VALUES (v_name, true, NEW.id, false)
      RETURNING id INTO v_new_id;

      INSERT INTO public.activity_values (activity_id, value)
      VALUES (v_new_id, v_value);

      v_count := v_count + 1;
    END LOOP;
  END IF;

  IF v_count = 0 THEN
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
  END IF;

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