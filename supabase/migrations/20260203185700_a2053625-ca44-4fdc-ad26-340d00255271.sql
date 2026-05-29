-- Enable realtime for the log table so all devices sync instantly
ALTER PUBLICATION supabase_realtime ADD TABLE public.log;