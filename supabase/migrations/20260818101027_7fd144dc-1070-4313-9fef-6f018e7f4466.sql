-- 1. Tag onboarding activities so they can be hidden from the picker.
ALTER TABLE public.activities
  ADD COLUMN IF NOT EXISTS is_onboarding boolean NOT NULL DEFAULT false;

-- 2. Track which onboarding rewards a user has already claimed.
CREATE TABLE IF NOT EXISTS public.onboarding_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  step_key text NOT NULL,
  claimed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, step_key)
);

GRANT SELECT, INSERT ON public.onboarding_rewards TO authenticated;
GRANT ALL ON public.onboarding_rewards TO service_role;

ALTER TABLE public.onboarding_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own onboarding rewards"
  ON public.onboarding_rewards FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can claim their own onboarding rewards"
  ON public.onboarding_rewards FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- 3. Region-appropriate reward amount (server-side lookup).
CREATE OR REPLACE FUNCTION public.onboarding_reward_amount(_currency text)
RETURNS bigint
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE _currency
    WHEN 'JPY' THEN 25
    WHEN 'IDR' THEN 500
    ELSE 25
  END;
$$;

-- 4. Update new-user seeding to create hidden onboarding activities alongside goal-based defaults.
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
  v_region   := COALESCE(NEW.raw_user_meta_data->>'region_code',   'US');
  v_currency := COALESCE(NEW.raw_user_meta_data->>'currency_code', 'USD');
  v_locale   := COALESCE(NEW.raw_user_meta_data->>'locale',        'en-US');
  v_digits   := COALESCE((NEW.raw_user_meta_data->>'minor_unit_digits')::smallint, 2);
  v_symbol   := COALESCE(NEW.raw_user_meta_data->>'currency_symbol', '$');
  v_goal     := NEW.raw_user_meta_data->>'goal_code';
  v_unit     := public.currency_unit_amount(v_currency);
  v_reward   := public.onboarding_reward_amount(v_currency);

  INSERT INTO public.profiles (user_id, region_code, currency_code, locale, minor_unit_digits)
  VALUES (NEW.id, v_region, v_currency, v_locale, v_digits);

  -- Goal-based default activities
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

  -- Hidden onboarding reward activities
  v_onboarding_names := ARRAY[
    'Onboarding – Completed welcome tour',
    'Onboarding – Chose your focus',
    'Onboarding – Saw your piggy bank',
    'Onboarding – Logged your first habit',
    'Onboarding – Paid yourself out',
    'Onboarding – Tuned your habits',
    'Onboarding – Saved your progress'
  ];

  FOREACH v_name IN ARRAY v_onboarding_names LOOP
    INSERT INTO public.activities (user_id, name, active, is_onboarding)
    VALUES (NEW.id, v_name, true, true)
    RETURNING id INTO v_new_id;

    INSERT INTO public.activity_values (activity_id, value)
    VALUES (v_new_id, v_reward);
  END LOOP;

  RETURN NEW;
END;
$function$;

-- 5. Backfill hidden onboarding activities for existing users (no auto-claim).
INSERT INTO public.activities (user_id, name, active, is_onboarding)
SELECT
  p.user_id,
  n.name,
  true,
  true
FROM public.profiles p
CROSS JOIN (VALUES
  ('Onboarding – Completed welcome tour'),
  ('Onboarding – Chose your focus'),
  ('Onboarding – Saw your piggy bank'),
  ('Onboarding – Logged your first habit'),
  ('Onboarding – Paid yourself out'),
  ('Onboarding – Tuned your habits'),
  ('Onboarding – Saved your progress')
) AS n(name)
WHERE NOT EXISTS (
  SELECT 1 FROM public.activities a
  WHERE a.user_id = p.user_id
    AND a.name = n.name
    AND a.is_onboarding = true
);

-- Seed the reward value for any backfilled onboarding activity that lacks one.
INSERT INTO public.activity_values (activity_id, value)
SELECT
  a.id,
  public.onboarding_reward_amount(COALESCE(p.currency_code, 'USD'))
FROM public.activities a
JOIN public.profiles p ON p.user_id = a.user_id
WHERE a.is_onboarding = true
  AND NOT EXISTS (
    SELECT 1 FROM public.activity_values av
    WHERE av.activity_id = a.id
  );

-- 6. Idempotent RPC to claim an onboarding reward.
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
  v_step_name text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_step_key IS NULL OR length(trim(p_step_key)) = 0 THEN
    RAISE EXCEPTION 'Step key required';
  END IF;

  -- Idempotency: already claimed
  IF EXISTS (
    SELECT 1 FROM public.onboarding_rewards
    WHERE user_id = v_uid AND step_key = trim(p_step_key)
  ) THEN
    RETURN NULL;
  END IF;

  v_step_name := CASE trim(p_step_key)
    WHEN 'welcome_complete'    THEN 'Completed welcome tour'
    WHEN 'get_started_complete'  THEN 'Chose your focus'
    WHEN 'tour_total'            THEN 'Saw your piggy bank'
    WHEN 'tour_log_habit'        THEN 'Logged your first habit'
    WHEN 'tour_mark_paid'        THEN 'Paid yourself out'
    WHEN 'tour_tune_habits'      THEN 'Tuned your habits'
    WHEN 'tour_save_progress'    THEN 'Saved your progress'
    ELSE NULL
  END;

  IF v_step_name IS NULL THEN
    RAISE EXCEPTION 'Unknown onboarding step';
  END IF;

  SELECT a.id INTO v_activity_id
  FROM public.activities a
  WHERE a.user_id = v_uid
    AND a.is_onboarding = true
    AND a.name = 'Onboarding – ' || v_step_name;

  IF v_activity_id IS NULL THEN
    RAISE EXCEPTION 'Onboarding activity not found';
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
  VALUES (v_uid, trim(p_step_key));

  RETURN v_reward;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.claim_onboarding_reward(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_onboarding_reward(text) TO authenticated, service_role;