-- Create activities table
CREATE TABLE public.activities (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true
);

-- Create activity_values table (stores value history for each activity)
CREATE TABLE public.activity_values (
  id BIGSERIAL PRIMARY KEY,
  activity_id BIGINT NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  value BIGINT NOT NULL,
  effective_from TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create log table (records each habit entry)
CREATE TABLE public.log (
  id BIGSERIAL PRIMARY KEY,
  date TIMESTAMPTZ NOT NULL DEFAULT now(),
  activity_id BIGINT NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  value BIGINT NOT NULL,
  paid_out TIMESTAMPTZ NULL
);

-- Create indexes for performance
CREATE INDEX idx_activity_values_lookup ON public.activity_values(activity_id, effective_from DESC);
CREATE INDEX idx_log_unpaid ON public.log(paid_out) WHERE paid_out IS NULL;
CREATE INDEX idx_log_activity ON public.log(activity_id);

-- Enable RLS on all tables
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.log ENABLE ROW LEVEL SECURITY;

-- Create public read policies (this is a personal app, no auth needed for MVP)
CREATE POLICY "Allow public read activities" ON public.activities FOR SELECT USING (true);
CREATE POLICY "Allow public read activity_values" ON public.activity_values FOR SELECT USING (true);
CREATE POLICY "Allow public read log" ON public.log FOR SELECT USING (true);
CREATE POLICY "Allow public insert log" ON public.log FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update log" ON public.log FOR UPDATE USING (true);

-- Insert some sample activities
INSERT INTO public.activities (name, active) VALUES
  ('Brushed teeth (morning)', true),
  ('Brushed teeth (evening)', true),
  ('Went for a walk', true),
  ('Drank 2L water', true),
  ('Meditated', true),
  ('Read for 30 mins', true),
  ('Exercised', true),
  ('Ate junk food', true),
  ('Skipped workout', true);

-- Insert initial values for activities
INSERT INTO public.activity_values (activity_id, value, effective_from) VALUES
  (1, 50, now()),   -- Brushed teeth morning: £0.50
  (2, 50, now()),   -- Brushed teeth evening: £0.50
  (3, 100, now()),  -- Walk: £1.00
  (4, 75, now()),   -- Water: £0.75
  (5, 150, now()),  -- Meditate: £1.50
  (6, 100, now()),  -- Read: £1.00
  (7, 200, now()),  -- Exercise: £2.00
  (8, -150, now()), -- Junk food: -£1.50
  (9, -200, now()); -- Skip workout: -£2.00