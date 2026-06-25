
CREATE OR REPLACE FUNCTION public.delete_my_anonymous_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_is_anon boolean;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT is_anonymous INTO v_is_anon FROM auth.users WHERE id = v_uid;

  IF v_is_anon IS NOT TRUE THEN
    RAISE EXCEPTION 'Only anonymous accounts can be self-deleted';
  END IF;

  DELETE FROM auth.users WHERE id = v_uid;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.delete_my_anonymous_account() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_my_anonymous_account() TO authenticated;
