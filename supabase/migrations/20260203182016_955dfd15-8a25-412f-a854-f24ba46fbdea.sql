-- Fix search_path security warnings
ALTER FUNCTION public.update_log_notes(bigint, text) SET search_path = public;
ALTER FUNCTION public.soft_delete_log_entry(bigint) SET search_path = public;
ALTER FUNCTION public.mark_unpaid_as_paid() SET search_path = public;