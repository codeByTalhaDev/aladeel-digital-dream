import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import { totals, EMIRATES } from "./shop";
import { BANK_TRANSFER_ENABLED } from "./bank";
import { rateLimit } from "./ratelimit.server";

export const UAE_PHONE = /^(?:\+?971|0)?5\d{8}$|^(?:\+?971|0)[2-9]\d{7}$/;
function todayUae() {
  return new Date(Date.now() + 4 * 3600_000).toISOString().slice(0, 10);
}

type Coupon = {
  code: string;
  discount_type: string;
  value: number;
  min_order: number;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
};

function couponDiscount(c: Coupon, itemsTotal: number): { ok: boolean; discount: number; reason?: string } {
  if (!c.is_active) return { ok: false, discount: 0, reason: "inactive" };
  if (c.expires_at && new Date(c.expires_at) < new Date()) return { ok: false, discount: 0, reason: "expired" };
  if (c.max_uses !== null && c.used_count >= c.max_uses) return { ok: false, discount: 0, reason: "used_up" };
  if (itemsTotal < Number(c.min_order)) return { ok: false, discount: 0, reason: "min_order" };
  const raw = c.discount_type === "percent" ? (itemsTotal * Number(c.value)) / 100 : Number(c.value);
  return { ok: true, discount: Math.round(Math.min(raw, itemsTotal) * 100) / 100 };
}

export const checkCoupon = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ code: z.string().trim().min(1).max(40), itemsTotal: z.number().min(0) }).parse(d),
  )
  .handler(async ({ data }) => {
    if (!rateLimit("coupon-check", 20, 5 * 60_000)) throw new Error("Too many attempts. Please try again later.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: c } = await supabaseAdmin
      .from("coupons")
      .select("code, discount_type, value, min_order, max_uses, used_count, expires_at, is_active")
      .ilike("code", data.code)
      .maybeSingle();
    if (!c) return { ok: false as const, discount: 0, reason: "not_found", minOrder: 0 };
    const r = couponDiscount(c as Coupon, data.itemsTotal);
    return { ok: r.ok, discount: r.discount, reason: r.reason ?? null, minOrder: Number(c.min_order), code: c.code };
  });

const itemSchema = z.object({
  productId: z.string().uuid().nullable().optional(),
  variantId: z.string().uuid().nullable().optional(),
  packageId: z.string().uuid().nullable().optional(),
  qty: z.number().int().min(1).max(50),
});

const orderSchema = z.object({
  items: z.array(itemSchema).min(1).max(50),
  coupon: z.string().trim().max(40).optional(),
  payment_method: z.enum(["cod", "bank_transfer"]).default("cod"),
  customer_name: z.string().trim().min(2).max(100),
  customer_phone: z.string().trim().max(20).transform((v) => v.replace(/[\s-]/g, "")).refine((v) => UAE_PHONE.test(v), "Enter a valid UAE phone number."),
  customer_email: z.string().trim().email().max(255).or(z.literal("")),
  emirate: z.string().refine((v) => EMIRATES.some((e) => e.value === v), "Choose an emirate."),
  area: z.string().trim().min(2).max(100),
  address: z.string().trim().min(5).max(300),
  landmark: z.string().trim().max(200),
  delivery_date: z.string().max(20).refine((v) => !v || (/^\d{4}-\d{2}-\d{2}$/.test(v) && v >= todayUae()), "Delivery date cannot be in the past."),
  delivery_slot: z.string().max(40),
  notes: z.string().trim().max(500),
});

export const placeOrder = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => orderSchema.parse(d))
  .handler(async ({ data }) => {
    if (!rateLimit("order", 5, 15 * 60_000)) throw new Error("Too many orders from this device. Please try again later.");
    if (data.payment_method === "bank_transfer" && !BANK_TRANSFER_ENABLED) throw new Error("Bank transfer is not available yet.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Optional signed-in customer
    let userId: string | null = null;
    const auth = getRequestHeader("authorization");
    if (auth?.startsWith("Bearer ")) {
      const { data: u } = await supabaseAdmin.auth.getUser(auth.slice(7));
      userId = u.user?.id ?? null;
    }

    // Price every line from the database
    const lines: {
      product_id: string | null;
      variant_id: string | null;
      variant_label: string | null;
      package_id: string | null;
      name_en: string;
      name_ar: string;
      unit_price: number;
      quantity: number;
      line_total: number;
    }[] = [];
    const variantStock: { id: string; newQty: number }[] = [];

    for (const it of data.items) {
      if (it.packageId) {
        const { data: pkg } = await supabaseAdmin
          .from("packages")
          .select("id, name_en, name_ar, price, is_active")
          .eq("id", it.packageId)
          .maybeSingle();
        if (!pkg || !pkg.is_active) throw new Error("A package in your cart is no longer available.");
        lines.push({
          product_id: null,
          variant_id: null,
          variant_label: null,
          package_id: pkg.id,
          name_en: `Package: ${pkg.name_en}`,
          name_ar: `باقة: ${pkg.name_ar}`,
          unit_price: Number(pkg.price),
          quantity: it.qty,
          line_total: Number(pkg.price) * it.qty,
        });
        continue;
      }
      if (!it.productId) throw new Error("Invalid cart item.");
      const { data: p } = await supabaseAdmin
        .from("products")
        .select("id, name_en, name_ar, price, is_active, stock_status")
        .eq("id", it.productId)
        .maybeSingle();
      if (!p || !p.is_active || p.stock_status === "out_of_stock")
        throw new Error("An item in your cart is no longer available.");
      let price = Number(p.price);
      let label: string | null = null;
      if (it.variantId) {
        const { data: v } = await supabaseAdmin
          .from("product_variants")
          .select("id, product_id, label, option_type, price, stock_qty")
          .eq("id", it.variantId)
          .maybeSingle();
        if (!v || v.product_id !== p.id) throw new Error("Selected option is no longer available.");
        if (v.stock_qty < it.qty) throw new Error(`Only ${v.stock_qty} left of ${p.name_en} (${v.label}).`);
        price = Number(v.price);
        label = `${v.option_type}: ${v.label}`;
        variantStock.push({ id: v.id, newQty: v.stock_qty - it.qty });
      }
      lines.push({
        product_id: p.id,
        variant_id: it.variantId ?? null,
        variant_label: label,
        package_id: null,
        name_en: label ? `${p.name_en} (${label})` : p.name_en,
        name_ar: label ? `${p.name_ar} (${label})` : p.name_ar,
        unit_price: price,
        quantity: it.qty,
        line_total: price * it.qty,
      });
    }

    const itemsTotal = lines.reduce((n, l) => n + l.line_total, 0);
    let discount = 0;
    let couponCode: string | null = null;
    let couponRow: Coupon | null = null;
    if (data.coupon) {
      const { data: c } = await supabaseAdmin.from("coupons").select("*").ilike("code", data.coupon).maybeSingle();
      if (!c) throw new Error("Coupon code not found.");
      const r = couponDiscount(c as Coupon, itemsTotal);
      if (!r.ok) throw new Error("Coupon cannot be applied to this order.");
      discount = r.discount;
      couponCode = c.code;
      couponRow = c as Coupon;
    }

    void couponRow;
    void variantStock;
    const sums = totals(itemsTotal - discount, data.emirate);
    const { data: res, error } = await supabaseAdmin.rpc("place_order_atomic", {
      p_order: {
        user_id: userId ?? "",
        customer_name: data.customer_name,
        customer_phone: data.customer_phone,
        customer_email: data.customer_email || "",
        emirate: data.emirate,
        area: data.area,
        address: data.address,
        landmark: data.landmark,
        delivery_date: data.delivery_date,
        delivery_slot: data.delivery_slot,
        notes: data.notes,
        payment_method: data.payment_method,
        discount,
        subtotal: sums.subtotal,
        vat: sums.vat,
        delivery_fee: sums.delivery,
        total: sums.grand,
      },
      p_lines: lines,
      p_coupon: couponCode as string,
    });
    if (error || !res) {
      console.error(error);
      const msg = error?.message ?? "";
      if (msg.includes("OUT_OF_STOCK:")) throw new Error(`Not enough stock left for ${msg.split("OUT_OF_STOCK:")[1]?.trim()}.`);
      if (msg.includes("COUPON_INVALID")) throw new Error("Coupon cannot be applied to this order.");
      throw new Error("Could not place order. Please try again.");
    }
    const r = res as { id: string; order_number: number };
    return { id: r.id, orderNumber: Number(r.order_number) };
  });

export const trackOrder = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ orderNumber: z.number().int().positive(), phone: z.string().trim().max(20).transform((v) => v.replace(/[\s-]/g, "")) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: o } = await supabaseAdmin
      .from("orders")
      .select("order_number, customer_phone, status, payment_status, total, delivery_date, created_at")
      .eq("order_number", data.orderNumber)
      .maybeSingle();
    const digits = (v: string) => v.replace(/\D/g, "").slice(-9);
    if (!o || digits(o.customer_phone) !== digits(data.phone)) return { found: false as const };
    return {
      found: true as const,
      orderNumber: Number(o.order_number),
      status: o.status,
      paymentStatus: o.payment_status,
      total: Number(o.total),
      deliveryDate: o.delivery_date,
      createdAt: o.created_at,
    };
  });
