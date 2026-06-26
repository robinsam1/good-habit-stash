
-- 1. is_pro helper (email allowlist for now; swap to subscribers table later)
CREATE OR REPLACE FUNCTION public.is_pro(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = _user_id
      AND lower(email) = lower('redacted@example.invalid')
  );
$$;

-- 2. create_activity
CREATE OR REPLACE FUNCTION public.create_activity(p_name text, p_value bigint)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_new_id bigint;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF NOT public.is_pro(v_uid) THEN
    RAISE EXCEPTION 'Pro feature' USING ERRCODE = '42501';
  END IF;
  IF p_name IS NULL OR length(trim(p_name)) = 0 THEN
    RAISE EXCEPTION 'Name required';
  END IF;
  IF p_value IS NULL OR p_value < 0 THEN
    RAISE EXCEPTION 'Value must be >= 0';
  END IF;

  INSERT INTO public.activities (user_id, name, active)
  VALUES (v_uid, trim(p_name), true)
  RETURNING id INTO v_new_id;

  INSERT INTO public.activity_values (activity_id, value)
  VALUES (v_new_id, p_value);

  RETURN v_new_id;
END;
$$;

-- 3. update_activity
CREATE OR REPLACE FUNCTION public.update_activity(
  p_activity_id bigint,
  p_name text,
  p_value bigint,
  p_active boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_current_value bigint;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF NOT public.is_pro(v_uid) THEN
    RAISE EXCEPTION 'Pro feature' USING ERRCODE = '42501';
  END IF;
  IF p_name IS NULL OR length(trim(p_name)) = 0 THEN
    RAISE EXCEPTION 'Name required';
  END IF;
  IF p_value IS NULL OR p_value < 0 THEN
    RAISE EXCEPTION 'Value must be >= 0';
  END IF;

  UPDATE public.activities
  SET name = trim(p_name),
      active = p_active
  WHERE id = p_activity_id
    AND user_id = v_uid;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Activity not found';
  END IF;

  SELECT av.value INTO v_current_value
  FROM public.activity_values av
  WHERE av.activity_id = p_activity_id
  ORDER BY av.effective_from DESC
  LIMIT 1;

  IF v_current_value IS DISTINCT FROM p_value THEN
    INSERT INTO public.activity_values (activity_id, value)
    VALUES (p_activity_id, p_value);
  END IF;
END;
$$;

-- 4. delete_activity (soft delete)
CREATE OR REPLACE FUNCTION public.delete_activity(p_activity_id bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF NOT public.is_pro(v_uid) THEN
    RAISE EXCEPTION 'Pro feature' USING ERRCODE = '42501';
  END IF;

  UPDATE public.activities
  SET active = false
  WHERE id = p_activity_id
    AND user_id = v_uid;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Activity not found';
  END IF;
END;
$$;

-- 5. pro_interest table
CREATE TABLE public.pro_interest (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  notified_at timestamptz
);

GRANT SELECT, INSERT ON public.pro_interest TO authenticated;
GRANT ALL ON public.pro_interest TO service_role;

ALTER TABLE public.pro_interest ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own interest"
  ON public.pro_interest FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can register their own interest"
  ON public.pro_interest FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
