-- Update handle_new_user to include new default activities
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
  v_activity record;
  v_new_id bigint;
BEGIN
  v_region   := COALESCE(NEW.raw_user_meta_data->>'region_code',   'US');
  v_currency := COALESCE(NEW.raw_user_meta_data->>'currency_code', 'USD');
  v_locale   := COALESCE(NEW.raw_user_meta_data->>'locale',        'en-US');
  v_digits   := COALESCE((NEW.raw_user_meta_data->>'minor_unit_digits')::smallint, 2);
  v_symbol   := COALESCE(NEW.raw_user_meta_data->>'currency_symbol', '$');
  v_unit     := public.currency_unit_amount(v_currency);

  INSERT INTO public.profiles (user_id, region_code, currency_code, locale, minor_unit_digits)
  VALUES (NEW.id, v_region, v_currency, v_locale, v_digits);

  FOR v_activity IN
    SELECT * FROM (VALUES
      ('Sleep – Get up early'),
      ('Sleep – Go to bed on time'),
      ('Exercise – 30 minutes of exercise'),
      ('Exercise – 1 hour walking'),
      ('Exercise – 10 minutes of stretching'),
      ('Habits – Make bed'),
      ('Habits – Do laundry'),
      ('Habits – Clean room'),
      ('Eating – Cook your meal'),
      ('Eating – Drink 2L water'),
      ('Eating – 5 fruits/vegetables today'),
      ('Finances – Skip big purchase'),
      ('Finances – Save ' || v_symbol || '10'),
      ('Mind – 10 minutes meditation'),
      ('Mind – Read 20 pages'),
      ('Mind – Journal 1 page'),
      ('Mind – 2 hours free of social media'),
      ('Social – Call a friend or family member'),
      ('Social – 1 hour phone-free'),
      ('Work – 1 hour deep work block'),
      ('Work – Set 3 goals for the day'),
      ('Work – Get to inbox zero')
    ) AS t(name)
  LOOP
    INSERT INTO public.activities (user_id, name, active)
    VALUES (NEW.id, v_activity.name, true)
    RETURNING id INTO v_new_id;

    INSERT INTO public.activity_values (activity_id, value)
    VALUES (v_new_id, v_unit);
  END LOOP;

  RETURN NEW;
END;
$function$;

-- Backfill new activities for all existing users (skip if user already has an activity with the same name)
DO $$
DECLARE
  v_user record;
  v_name text;
  v_unit bigint;
  v_currency text;
  v_new_id bigint;
  v_names text[] := ARRAY[
    'Social – Call a friend or family member',
    'Social – 1 hour phone-free',
    'Exercise – 10 minutes of stretching',
    'Mind – Journal 1 page',
    'Mind – 2 hours free of social media',
    'Eating – 5 fruits/vegetables today',
    'Work – 1 hour deep work block',
    'Work – Set 3 goals for the day',
    'Work – Get to inbox zero'
  ];
BEGIN
  FOR v_user IN SELECT user_id, currency_code FROM public.profiles LOOP
    v_unit := public.currency_unit_amount(v_user.currency_code);
    FOREACH v_name IN ARRAY v_names LOOP
      IF NOT EXISTS (
        SELECT 1 FROM public.activities
        WHERE user_id = v_user.user_id AND name = v_name
      ) THEN
        INSERT INTO public.activities (user_id, name, active)
        VALUES (v_user.user_id, v_name, true)
        RETURNING id INTO v_new_id;

        INSERT INTO public.activity_values (activity_id, value)
        VALUES (v_new_id, v_unit);
      END IF;
    END LOOP;
  END LOOP;
END $$;