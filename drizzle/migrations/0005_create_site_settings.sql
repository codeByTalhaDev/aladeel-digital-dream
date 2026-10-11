CREATE TABLE public.site_settings (
  key TEXT PRIMARY KEY,
  value_en TEXT NOT NULL DEFAULT '',
  value_ar TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_settings public read"
ON public.site_settings FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "site_settings admin write"
ON public.site_settings FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.site_settings (key, value_en, value_ar) VALUES
  ('brand', 'Al Adeel Furniture', 'مفروشات العديل'),
  ('phone_primary', '050-37 17 658', '050-37 17 658'),
  ('phone_secondary', '055-99 97 049', '055-99 97 049'),
  ('whatsapp', '971503717658', '971503717658'),
  ('address', 'Almaemura, Sheikh Salem Bin Sultan Street, Ras Al Khaimah, U.A.E.', 'المعمورة، شارع الشيخ سالم بن سلطان، رأس الخيمة، الإمارات'),
  ('trn', '100236311500003', '100236311500003');