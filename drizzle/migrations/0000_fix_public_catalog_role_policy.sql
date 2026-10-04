DROP POLICY IF EXISTS "products public read" ON public.products;
CREATE POLICY "products public active read"
ON public.products
FOR SELECT
TO anon
USING (is_active);
CREATE POLICY "products authenticated read"
ON public.products
FOR SELECT
TO authenticated
USING (is_active OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "packages public read" ON public.packages;
CREATE POLICY "packages public active read"
ON public.packages
FOR SELECT
TO anon
USING (is_active);
CREATE POLICY "packages authenticated read"
ON public.packages
FOR SELECT
TO authenticated
USING (is_active OR public.has_role(auth.uid(), 'admin'));

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;