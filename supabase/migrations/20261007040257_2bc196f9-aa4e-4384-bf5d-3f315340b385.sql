CREATE TABLE public.demo_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  sample_code TEXT NOT NULL,
  sample_name TEXT NOT NULL,
  facebook_url TEXT,
  contact_email TEXT,
  offer_price BIGINT,
  status TEXT NOT NULL DEFAULT 'cart',
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.demo_requests TO authenticated;
GRANT ALL ON public.demo_requests TO service_role;
ALTER TABLE public.demo_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own rows select" ON public.demo_requests FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own rows insert" ON public.demo_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND status = 'cart');
CREATE POLICY "Own cart update" ON public.demo_requests FOR UPDATE TO authenticated USING (auth.uid() = user_id AND status = 'cart') WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own cart delete" ON public.demo_requests FOR DELETE TO authenticated USING (auth.uid() = user_id AND status = 'cart');