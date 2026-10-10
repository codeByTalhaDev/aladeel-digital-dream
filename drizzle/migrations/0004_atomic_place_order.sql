CREATE OR REPLACE FUNCTION public.place_order_atomic(p_order jsonb, p_lines jsonb, p_coupon text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  l jsonb; v_qty int; v_status text; v_id uuid; v_num bigint; c record;
BEGIN
  FOR l IN SELECT * FROM jsonb_array_elements(p_lines) LOOP
    IF (l->>'variant_id') IS NOT NULL THEN
      SELECT stock_qty INTO v_qty FROM product_variants WHERE id = (l->>'variant_id')::uuid FOR UPDATE;
      IF v_qty IS NULL OR v_qty < (l->>'quantity')::int THEN RAISE EXCEPTION 'OUT_OF_STOCK:%', l->>'name_en'; END IF;
      UPDATE product_variants SET stock_qty = stock_qty - (l->>'quantity')::int WHERE id = (l->>'variant_id')::uuid;
    ELSIF (l->>'product_id') IS NOT NULL THEN
      SELECT stock_qty, stock_status INTO v_qty, v_status FROM products WHERE id = (l->>'product_id')::uuid FOR UPDATE;
      IF v_status = 'out_of_stock' THEN RAISE EXCEPTION 'OUT_OF_STOCK:%', l->>'name_en'; END IF;
      IF v_status = 'in_stock' THEN
        IF v_qty < (l->>'quantity')::int THEN RAISE EXCEPTION 'OUT_OF_STOCK:%', l->>'name_en'; END IF;
        UPDATE products SET stock_qty = stock_qty - (l->>'quantity')::int,
          stock_status = CASE WHEN stock_qty - (l->>'quantity')::int <= 0 THEN 'out_of_stock' ELSE stock_status END
        WHERE id = (l->>'product_id')::uuid;
      END IF;
    END IF;
  END LOOP;

  IF p_coupon IS NOT NULL THEN
    SELECT * INTO c FROM coupons WHERE code = p_coupon FOR UPDATE;
    IF c IS NULL OR NOT c.is_active OR (c.max_uses IS NOT NULL AND c.used_count >= c.max_uses)
      OR (c.expires_at IS NOT NULL AND c.expires_at < now()) THEN RAISE EXCEPTION 'COUPON_INVALID'; END IF;
    UPDATE coupons SET used_count = used_count + 1 WHERE code = p_coupon;
  END IF;

  INSERT INTO orders (user_id, customer_name, customer_phone, customer_email, emirate, area, address, landmark,
    delivery_date, delivery_slot, notes, payment_method, coupon_code, discount, subtotal, vat, delivery_fee, total)
  VALUES (NULLIF(p_order->>'user_id','')::uuid, p_order->>'customer_name', p_order->>'customer_phone',
    NULLIF(p_order->>'customer_email',''), p_order->>'emirate', p_order->>'area', p_order->>'address',
    NULLIF(p_order->>'landmark',''), NULLIF(p_order->>'delivery_date','')::date, NULLIF(p_order->>'delivery_slot',''),
    NULLIF(p_order->>'notes',''), p_order->>'payment_method', p_coupon, (p_order->>'discount')::numeric,
    (p_order->>'subtotal')::numeric, (p_order->>'vat')::numeric, (p_order->>'delivery_fee')::numeric, (p_order->>'total')::numeric)
  RETURNING id, order_number INTO v_id, v_num;

  INSERT INTO order_items (order_id, product_id, variant_id, variant_label, package_id, name_en, name_ar, unit_price, quantity, line_total)
  SELECT v_id, NULLIF(x->>'product_id','')::uuid, NULLIF(x->>'variant_id','')::uuid, x->>'variant_label',
    NULLIF(x->>'package_id','')::uuid, x->>'name_en', x->>'name_ar', (x->>'unit_price')::numeric,
    (x->>'quantity')::int, (x->>'line_total')::numeric
  FROM jsonb_array_elements(p_lines) x;

  RETURN jsonb_build_object('id', v_id, 'order_number', v_num);
END $$;
REVOKE ALL ON FUNCTION public.place_order_atomic(jsonb, jsonb, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.place_order_atomic(jsonb, jsonb, text) TO service_role;
REVOKE INSERT ON public.orders, public.order_items FROM anon;