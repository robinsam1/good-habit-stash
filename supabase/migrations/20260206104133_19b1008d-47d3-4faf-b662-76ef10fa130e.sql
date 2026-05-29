-- Fix 1: Add restrictive policies on activities table to deny public writes
CREATE POLICY "Deny public insert on activities"
ON public.activities
AS RESTRICTIVE
FOR INSERT
TO public
WITH CHECK (false);

CREATE POLICY "Deny public update on activities"
ON public.activities
AS RESTRICTIVE
FOR UPDATE
TO public
USING (false);

CREATE POLICY "Deny public delete on activities"
ON public.activities
AS RESTRICTIVE
FOR DELETE
TO public
USING (false);

-- Fix 2: Add restrictive policies on activity_values table to deny public writes
CREATE POLICY "Deny public insert on activity_values"
ON public.activity_values
AS RESTRICTIVE
FOR INSERT
TO public
WITH CHECK (false);

CREATE POLICY "Deny public update on activity_values"
ON public.activity_values
AS RESTRICTIVE
FOR UPDATE
TO public
USING (false);

CREATE POLICY "Deny public delete on activity_values"
ON public.activity_values
AS RESTRICTIVE
FOR DELETE
TO public
USING (false);

-- Fix 3: Update log table policies to require authentication
-- First drop the overly permissive policies
DROP POLICY IF EXISTS "Allow public insert log" ON public.log;
DROP POLICY IF EXISTS "Allow public read log" ON public.log;
DROP POLICY IF EXISTS "Allow public update log" ON public.log;

-- Create new policies that require authentication
CREATE POLICY "Authenticated users can insert log"
ON public.log
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can read log"
ON public.log
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can update log"
ON public.log
FOR UPDATE
TO authenticated
USING (true);

-- Fix 4: Replace SECURITY DEFINER with SECURITY INVOKER on update_log_activity
CREATE OR REPLACE FUNCTION public.update_log_activity(p_log_id bigint, p_activity_id bigint)
 RETURNS SETOF log
 LANGUAGE plpgsql
 SECURITY INVOKER
 SET search_path TO 'public'
AS $function$
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
$function$;