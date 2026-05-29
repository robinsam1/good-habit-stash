REVOKE EXECUTE ON FUNCTION public.is_pro(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.create_activity(text, bigint) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.update_activity(bigint, text, bigint, boolean) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.delete_activity(bigint) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.soft_delete_log_entry(bigint) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.update_log_notes(bigint, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.update_log_activity(bigint, bigint) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.mark_unpaid_as_paid() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.is_pro(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_activity(text, bigint) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_activity(bigint, text, bigint, boolean) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.delete_activity(bigint) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.soft_delete_log_entry(bigint) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_log_notes(bigint, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_log_activity(bigint, bigint) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.mark_unpaid_as_paid() TO authenticated, service_role;