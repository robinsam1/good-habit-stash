-- Use RPC (POST) instead of PATCH updates to avoid browser NetworkError

CREATE OR REPLACE FUNCTION public.update_log_notes(p_log_id bigint, p_notes text)
RETURNS public.log
LANGUAGE plpgsql
AS $$
DECLARE
  updated_row public.log;
BEGIN
  UPDATE public.log
    SET notes = p_notes
    WHERE id = p_log_id
      AND deleted_at IS NULL
      AND paid_out IS NULL
    RETURNING * INTO updated_row;

  RETURN updated_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.soft_delete_log_entry(p_log_id bigint)
RETURNS public.log
LANGUAGE plpgsql
AS $$
DECLARE
  updated_row public.log;
BEGIN
  UPDATE public.log
    SET deleted_at = now()
    WHERE id = p_log_id
      AND deleted_at IS NULL
      AND paid_out IS NULL
    RETURNING * INTO updated_row;

  RETURN updated_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_unpaid_as_paid()
RETURNS bigint
LANGUAGE plpgsql
AS $$
DECLARE
  updated_count bigint;
BEGIN
  UPDATE public.log
    SET paid_out = now()
    WHERE paid_out IS NULL
      AND deleted_at IS NULL;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;