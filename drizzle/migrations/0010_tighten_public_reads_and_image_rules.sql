-- Scope public catalog reads with real predicates and add visibility flags.

-- 1. categories: admin-visible flag, public sees active only
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
DROP POLICY IF EXISTS "categories public read" ON public.categories;
CREATE POLICY "categories public active read"
  ON public.categories FOR SELECT TO public
  USING (is_active);

-- 2. product_variants: public sees only variants of active products
DROP POLICY IF EXISTS "variants public read" ON public.product_variants;
CREATE POLICY "variants public active read"
  ON public.product_variants FOR SELECT TO public
  USING (EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = product_variants.product_id AND p.is_active
  ));

-- 3. package_items: public sees only items of active packages
DROP POLICY IF EXISTS "package items public read" ON public.package_items;
CREATE POLICY "package items active read"
  ON public.package_items FOR SELECT TO public
  USING (EXISTS (
    SELECT 1 FROM public.packages pk
    WHERE pk.id = package_items.package_id AND pk.is_active
  ));

-- 4. site_settings: admin-visible flag, public sees public entries only
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT true;
DROP POLICY IF EXISTS "site_settings public read" ON public.site_settings;
CREATE POLICY "site_settings public visible read"
  ON public.site_settings FOR SELECT TO anon, authenticated
  USING (is_public);

-- 5. site_pages: publish flag; public sees published, admins see drafts
ALTER TABLE public.site_pages ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT true;
DROP POLICY IF EXISTS "pages public read" ON public.site_pages;
CREATE POLICY "pages public published read"
  ON public.site_pages FOR SELECT TO public
  USING (is_published);
CREATE POLICY "pages admin read"
  ON public.site_pages FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 6. storage.objects: product photos readable only by admin/staff;
--    public display goes through the app's signed-URL proxy route.
DROP POLICY IF EXISTS "product images public read" ON storage.objects;
CREATE POLICY "product images staff read"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'product-images' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff')));