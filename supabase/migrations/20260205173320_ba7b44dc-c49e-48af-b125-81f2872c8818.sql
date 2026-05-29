-- Create function to update activity on a log entry (only if unpaid and not deleted)
CREATE OR REPLACE FUNCTION public.update_log_activity(p_log_id bigint, p_activity_id bigint)
RETURNS SETOF log
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_value bigint;
BEGIN
  -- Get the latest value for the new activity
  SELECT av.value INTO v_new_value
  FROM activity_values av
  WHERE av.activity_id = p_activity_id
  ORDER BY av.effective_from DESC
  LIMIT 1;
  
  -- Default to 0 if no value found
  v_new_value := COALESCE(v_new_value, 0);
  
  -- Update only if entry is unpaid and not deleted
  RETURN QUERY
  UPDATE log
  SET activity_id = p_activity_id,
      value = v_new_value
  WHERE id = p_log_id
    AND paid_out IS NULL
    AND deleted_at IS NULL
  RETURNING *;
END;
$$;