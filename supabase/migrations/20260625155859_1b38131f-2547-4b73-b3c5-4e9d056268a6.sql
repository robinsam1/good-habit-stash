CREATE OR REPLACE FUNCTION public.log_activity(p_activity_id bigint)
RETURNS public.log
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_value bigint;
  v_row public.log;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.activities
    WHERE id = p_activity_id AND user_id = v_uid AND active = true
  ) THEN
    RAISE EXCEPTION 'Activity not found';
  END IF;

  SELECT av.value INTO v_value
  FROM public.activity_values av
  WHERE av.activity_id = p_activity_id
  ORDER BY av.effective_from DESC
  LIMIT 1;

  v_value := COALESCE(v_value, 0);

  INSERT INTO public.log (user_id, activity_id, value, date)
  VALUES (v_uid, p_activity_id, v_value, now())
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.log_activity(bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_activity(bigint) TO authenticated, service_role;

-- Remove direct INSERT access on log table; force inserts through RPC
REVOKE INSERT ON public.log FROM authenticated, anon;

DROP POLICY IF EXISTS "Users can insert their own log entries" ON public.log;
DROP POLICY IF EXISTS "Users insert own log" ON public.log;
DROP POLICY IF EXISTS "log_insert_own" ON public.log;