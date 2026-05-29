CREATE TABLE public.pro_subscribers (
  user_id uuid PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.pro_subscribers TO authenticated;
GRANT ALL ON public.pro_subscribers TO service_role;

ALTER TABLE public.pro_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own pro status"
ON public.pro_subscribers FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.is_pro(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.pro_subscribers WHERE user_id = _user_id
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_pro(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_pro(uuid) TO authenticated, service_role;

INSERT INTO public.pro_subscribers (user_id)
VALUES ('5f58ce78-b17c-4724-80f9-00f2816826e4')
ON CONFLICT (user_id) DO NOTHING;