-- Add soft delete column to log table
ALTER TABLE public.log ADD COLUMN deleted_at timestamp with time zone;