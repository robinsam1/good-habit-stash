
CREATE OR REPLACE FUNCTION public.create_activity(p_name text, p_value bigint)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  IF p_value IS NULL THEN
    RAISE EXCEPTION 'Value required';
  END IF;

  INSERT INTO public.activities (user_id, name, active)
  VALUES (v_uid, trim(p_name), true)
  RETURNING id INTO v_new_id;

  INSERT INTO public.activity_values (activity_id, value)
  VALUES (v_new_id, p_value);

  RETURN v_new_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_activity(p_activity_id bigint, p_name text, p_value bigint, p_active boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  IF p_value IS NULL THEN
    RAISE EXCEPTION 'Value required';
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
$function$;
