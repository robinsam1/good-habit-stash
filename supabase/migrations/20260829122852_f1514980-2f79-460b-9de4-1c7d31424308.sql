CREATE OR REPLACE FUNCTION public.log_activity(p_activity_id bigint, p_is_demo boolean DEFAULT false)
RETURNS public.log
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_value bigint;
  v_row public.log;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.activities a
    WHERE a.id = p_activity_id AND a.user_id = v_user AND a.active = true
  ) THEN
    RAISE EXCEPTION 'Activity not found';
  END IF;

  SELECT av.value INTO v_value
  FROM public.activity_values av
  WHERE av.activity_id = p_activity_id
  ORDER BY av.effective_from DESC
  LIMIT 1;

  INSERT INTO public.log (activity_id, value, user_id, is_demo)
  VALUES (p_activity_id, COALESCE(v_value, 0), v_user, COALESCE(p_is_demo, false))
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.log_activity(bigint, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_activity(bigint, boolean) TO authenticated;