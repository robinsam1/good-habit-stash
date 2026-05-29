-- Fix: Require authentication for activities table SELECT
DROP POLICY IF EXISTS "Allow public read activities" ON public.activities;

CREATE POLICY "Authenticated users can read activities"
ON public.activities
FOR SELECT
TO authenticated
USING (true);

-- Fix: Require authentication for activity_values table SELECT
DROP POLICY IF EXISTS "Allow public read activity_values" ON public.activity_values;

CREATE POLICY "Authenticated users can read activity_values"
ON public.activity_values
FOR SELECT
TO authenticated
USING (true);