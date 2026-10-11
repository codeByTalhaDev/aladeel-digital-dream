-- 1. Staff role: can read orders and order items, and update order status/payment status
CREATE POLICY "orders staff read"
ON public.orders FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'staff'));

CREATE POLICY "orders staff update"
ON public.orders FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'staff'))
WITH CHECK (public.has_role(auth.uid(), 'staff'));

CREATE POLICY "order items staff read"
ON public.order_items FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'staff'));

-- 2. Restock on cancel: when an order moves to cancelled, return quantities to stock
CREATE OR REPLACE FUNCTION public.restock_on_cancel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status IS DISTINCT FROM 'cancelled' THEN
    UPDATE public.product_variants v
    SET stock_qty = v.stock_qty + oi.quantity
    FROM public.order_items oi
    WHERE oi.order_id = NEW.id AND oi.variant_id = v.id;

    UPDATE public.products p
    SET stock_qty = p.stock_qty + oi.quantity,
        stock_status = CASE WHEN p.stock_status = 'out_of_stock' THEN 'in_stock' ELSE p.stock_status END
    FROM public.order_items oi
    WHERE oi.order_id = NEW.id AND oi.product_id = p.id AND oi.variant_id IS NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER orders_restock_on_cancel
AFTER UPDATE OF status ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.restock_on_cancel();

-- 3. Product image storage policies (bucket created via storage tool): public read, admin/staff write
CREATE POLICY "product images public read"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'product-images');

CREATE POLICY "product images admin write"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'product-images' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff')));

CREATE POLICY "product images admin update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'product-images' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff')));

CREATE POLICY "product images admin delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'product-images' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff')));