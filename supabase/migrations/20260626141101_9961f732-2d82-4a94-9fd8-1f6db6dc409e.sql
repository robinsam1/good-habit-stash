
-- 1) New no-arg is_pro that scopes strictly to the caller via auth.uid().
CREATE OR REPLACE FUNCTION public.is_pro()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.pro_subscribers WHERE user_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.is_pro() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_pro() TO authenticated, service_role;

-- 2) Lock down the parameterised probe — only internal SECURITY DEFINER callers
--    (which run as the function owner) and service_role need it.
REVOKE ALL ON FUNCTION public.is_pro(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_pro(uuid) TO service_role;

-- 3) Bound log.notes length to prevent oversized payloads.
ALTER TABLE public.log
  DROP CONSTRAINT IF EXISTS log_notes_max_length;
ALTER TABLE public.log
  ADD CONSTRAINT log_notes_max_length
  CHECK (notes IS NULL OR char_length(notes) <= 2000);

CREATE OR REPLACE FUNCTION public.update_log_notes(p_log_id bigint, p_notes text)
RETURNS public.log
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  updated_row public.log;
BEGIN
  IF p_notes IS NOT NULL AND char_length(p_notes) > 2000 THEN
    RAISE EXCEPTION 'Note exceeds maximum length of 2000 characters';
  END IF;

  UPDATE public.log
    SET notes = p_notes
    WHERE id = p_log_id
      AND deleted_at IS NULL
      AND paid_out IS NULL
      AND user_id = auth.uid()
    RETURNING * INTO updated_row;
  RETURN updated_row;
END;
$function$;
