
-- 1. WIPE all existing rows (single-user data being abandoned)
TRUNCATE TABLE public.log RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.activity_values RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.activities RESTART IDENTITY CASCADE;

-- 2. Add ownership columns
ALTER TABLE public.activities
  ADD COLUMN user_id uuid NOT NULL;
CREATE INDEX activities_user_id_idx ON public.activities(user_id);

ALTER TABLE public.log
  ADD COLUMN user_id uuid NOT NULL;
CREATE INDEX log_user_id_idx ON public.log(user_id);

-- 3. Profiles table
CREATE TABLE public.profiles (
  user_id uuid PRIMARY KEY,
  region_code text NOT NULL,
  currency_code text NOT NULL,
  locale text NOT NULL,
  minor_unit_digits smallint NOT NULL DEFAULT 2,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- 4. Replace activities RLS with per-user scope
DROP POLICY IF EXISTS "Authenticated users can read activities" ON public.activities;
DROP POLICY IF EXISTS "Deny public delete on activities" ON public.activities;
DROP POLICY IF EXISTS "Deny public insert on activities" ON public.activities;
DROP POLICY IF EXISTS "Deny public update on activities" ON public.activities;

CREATE POLICY "Users can view their own activities" ON public.activities
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own activities" ON public.activities
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own activities" ON public.activities
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own activities" ON public.activities
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 5. Replace activity_values RLS — scoped via parent activity
DROP POLICY IF EXISTS "Authenticated users can read activity_values" ON public.activity_values;
DROP POLICY IF EXISTS "Deny public delete on activity_values" ON public.activity_values;
DROP POLICY IF EXISTS "Deny public insert on activity_values" ON public.activity_values;
DROP POLICY IF EXISTS "Deny public update on activity_values" ON public.activity_values;

CREATE POLICY "Users can view values for their activities" ON public.activity_values
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.activities a WHERE a.id = activity_values.activity_id AND a.user_id = auth.uid())
  );
CREATE POLICY "Users can insert values for their activities" ON public.activity_values
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.activities a WHERE a.id = activity_values.activity_id AND a.user_id = auth.uid())
  );
CREATE POLICY "Users can update values for their activities" ON public.activity_values
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.activities a WHERE a.id = activity_values.activity_id AND a.user_id = auth.uid())
  );
CREATE POLICY "Users can delete values for their activities" ON public.activity_values
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.activities a WHERE a.id = activity_values.activity_id AND a.user_id = auth.uid())
  );

-- 6. Replace log RLS with per-user scope
DROP POLICY IF EXISTS "Authenticated users can read log" ON public.log;
DROP POLICY IF EXISTS "Authenticated users can insert log" ON public.log;
DROP POLICY IF EXISTS "Authenticated users can update log" ON public.log;

CREATE POLICY "Users can view their own log" ON public.log
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own log" ON public.log
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own log" ON public.log
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- 7. Default for log.user_id so client inserts don't need to pass it
ALTER TABLE public.log ALTER COLUMN user_id SET DEFAULT auth.uid();

-- 8. Currency unit-amount helper (returns smallest integer unit representing "1 unit")
CREATE OR REPLACE FUNCTION public.currency_unit_amount(_currency text)
RETURNS bigint
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE _currency
    WHEN 'JPY' THEN 1
    WHEN 'KRW' THEN 1
    WHEN 'VND' THEN 1
    WHEN 'CLP' THEN 1
    WHEN 'IDR' THEN 100
    ELSE 100
  END;
$$;

-- 9. New-user seed trigger: profile + default activities + values
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  -- Seed default activities, each with a single activity_value of 1 currency unit
  FOR v_activity IN
    SELECT * FROM (VALUES
      ('Sleep – Get up early'),
      ('Sleep – Go to bed on time'),
      ('Exercise – 30 minutes of exercise'),
      ('Exercise – 1 hour walking'),
      ('Habits – Make bed'),
      ('Habits – Do laundry'),
      ('Habits – Clean room'),
      ('Eating – Cook your meal'),
      ('Eating – Drink 2L water'),
      ('Finances – Skip big purchase'),
      ('Finances – Save ' || v_symbol || '10'),
      ('Mind – 10 minutes meditation'),
      ('Mind – Read 20 pages')
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
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10. Update RPCs to scope by auth.uid()
CREATE OR REPLACE FUNCTION public.mark_unpaid_as_paid()
RETURNS bigint
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  updated_count bigint;
BEGIN
  UPDATE public.log
    SET paid_out = now()
    WHERE paid_out IS NULL
      AND deleted_at IS NULL
      AND user_id = auth.uid();
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.soft_delete_log_entry(p_log_id bigint)
RETURNS public.log
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  updated_row public.log;
BEGIN
  UPDATE public.log
    SET deleted_at = now()
    WHERE id = p_log_id
      AND deleted_at IS NULL
      AND paid_out IS NULL
      AND user_id = auth.uid()
    RETURNING * INTO updated_row;
  RETURN updated_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_log_notes(p_log_id bigint, p_notes text)
RETURNS public.log
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  updated_row public.log;
BEGIN
  UPDATE public.log
    SET notes = p_notes
    WHERE id = p_log_id
      AND deleted_at IS NULL
      AND paid_out IS NULL
      AND user_id = auth.uid()
    RETURNING * INTO updated_row;
  RETURN updated_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_log_activity(p_log_id bigint, p_activity_id bigint)
RETURNS SETOF public.log
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_new_value bigint;
BEGIN
  -- Confirm caller owns the target activity
  IF NOT EXISTS (
    SELECT 1 FROM public.activities
    WHERE id = p_activity_id AND user_id = auth.uid()
  ) THEN
    RETURN;
  END IF;

  SELECT av.value INTO v_new_value
  FROM public.activity_values av
  WHERE av.activity_id = p_activity_id
  ORDER BY av.effective_from DESC
  LIMIT 1;

  v_new_value := COALESCE(v_new_value, 0);

  RETURN QUERY
  UPDATE public.log
  SET activity_id = p_activity_id,
      value = v_new_value
  WHERE id = p_log_id
    AND paid_out IS NULL
    AND deleted_at IS NULL
    AND user_id = auth.uid()
  RETURNING *;
END;
$$;
