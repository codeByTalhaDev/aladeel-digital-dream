ALTER TABLE public.reviews ADD COLUMN is_approved boolean NOT NULL DEFAULT false;
UPDATE public.reviews SET is_approved = true;
DROP POLICY IF EXISTS "reviews public read" ON public.reviews;
CREATE POLICY "reviews anon approved read" ON public.reviews FOR SELECT TO anon USING (is_approved);
CREATE POLICY "reviews auth read" ON public.reviews FOR SELECT TO authenticated USING (is_approved OR auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "reviews admin update" ON public.reviews FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.quote_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 100),
  phone text NOT NULL CHECK (char_length(phone) BETWEEN 7 AND 20),
  email text CHECK (email IS NULL OR char_length(email) <= 255),
  emirate text,
  details text NOT NULL CHECK (char_length(details) BETWEEN 5 AND 2000),
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','closed')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.quote_requests TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.quote_requests TO authenticated;
GRANT ALL ON public.quote_requests TO service_role;
ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quotes anyone insert" ON public.quote_requests FOR INSERT TO anon, authenticated WITH CHECK (status = 'new');
CREATE POLICY "quotes admin read" ON public.quote_requests FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));
CREATE POLICY "quotes admin update" ON public.quote_requests FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff')) WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));
CREATE POLICY "quotes admin delete" ON public.quote_requests FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));