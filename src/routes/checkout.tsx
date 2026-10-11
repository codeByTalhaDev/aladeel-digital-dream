import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { checkCoupon, placeOrder, UAE_PHONE } from "@/lib/orders.functions";
import { BANK_DETAILS, BANK_TRANSFER_ENABLED } from "@/lib/bank";
import { useCart } from "@/lib/cart";
import { formatAed, useI18n } from "@/lib/i18n";
import { EMIRATES, totals } from "@/lib/shop";
import { useAuth } from "@/lib/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout | Al Adeel Furniture" },
      {
        name: "description",
        content: "Complete your furniture order with cash on delivery and scheduled delivery across the UAE.",
      },
      { property: "og:title", content: "Checkout | Al Adeel Furniture" },
      { property: "og:description", content: "Cash on delivery and scheduled delivery across the UAE." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Checkout,
});

const schema = z.object({
  customer_name: z.string().trim().min(2).max(100),
  customer_phone: z.string().trim().max(20).refine((v) => UAE_PHONE.test(v.replace(/[\s-]/g, "")), "Enter a valid UAE phone number, e.g. 050 123 4567."),
  customer_email: z.string().trim().email().max(255).or(z.literal("")),
  emirate: z.string().trim().min(2),
  area: z.string().trim().min(2).max(100),
  address: z.string().trim().min(5).max(300),
  landmark: z.string().trim().max(200),
  delivery_date: z.string().max(20),
  delivery_slot: z.string().max(40),
  notes: z.string().trim().max(500),
});

function Checkout() {
  const { t, lang, pick } = useI18n();
  const { items, itemsTotal, clear } = useCart();
  const { user } = useAuth();
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; discount: number } | null>(null);
  const discount = coupon ? Math.min(coupon.discount, itemsTotal) : 0;
  const sums = totals(itemsTotal - discount);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "bank_transfer">("cod");
  const [doneMethod, setDoneMethod] = useState<"cod" | "bank_transfer">("cod");
  const [form, setForm] = useState({
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    emirate: "Ras Al Khaimah",
    area: "",
    address: "",
    landmark: "",
    delivery_date: "",
    delivery_slot: "morning",
    notes: "",
  });

  function set(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function applyCoupon() {
    if (!couponInput.trim()) return;
    const r = await checkCoupon({ data: { code: couponInput.trim(), itemsTotal } });
    if (r.ok && "code" in r && r.code) {
      setCoupon({ code: r.code, discount: r.discount });
      toast.success(pick("Coupon applied", "تم تطبيق القسيمة"));
    } else {
      setCoupon(null);
      toast.error(
        r.reason === "min_order"
          ? pick(`Minimum order AED ${r.minOrder}`, `الحد الأدنى للطلب ${r.minOrder} درهم`)
          : pick("Invalid or expired code", "رمز غير صالح أو منتهي"),
      );
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(t("required"));
      return;
    }
    setSubmitting(true);
    try {
      const res = await placeOrder({
        data: {
          ...parsed.data,
          coupon: coupon?.code,
          payment_method: paymentMethod,
          items: items.map((i) => ({ productId: i.productId, variantId: i.variantId ?? null, packageId: i.packageId ?? null, qty: i.qty })),
        },
      });
      clear();
      setOrderId(res.id);
      setDone(res.orderNumber);
      setDoneMethod(paymentMethod);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Order failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (done !== null) {
    return (
      <div className="container-page py-20 text-center">
        <CheckCircle2 className="mx-auto mb-4 size-14 text-success" />
        <h1 className="heading-section">{t("orderPlaced")}</h1>
        <p className="mt-3 text-muted-foreground">
          {t("orderNumber")}: <span className="font-semibold text-foreground">#{done}</span>
        </p>
        <p className="mt-2 text-muted-foreground">{t("weWillCall")}</p>
        {doneMethod === "bank_transfer" && (
          <div className="mx-auto mt-6 max-w-md rounded-lg border border-border bg-card p-5 text-start text-sm">
            <h2 className="mb-3 font-semibold">{t("bankDetails")}</h2>
            <dl className="space-y-1.5">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{pick("Bank", "البنك")}</dt>
                <dd className="font-medium">{BANK_DETAILS.bankName}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{pick("Account name", "اسم الحساب")}</dt>
                <dd className="font-medium">{BANK_DETAILS.accountName}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{pick("Account number", "رقم الحساب")}</dt>
                <dd className="font-medium" dir="ltr">{BANK_DETAILS.accountNumber}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">IBAN</dt>
                <dd className="font-medium" dir="ltr">{BANK_DETAILS.iban}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">SWIFT</dt>
                <dd className="font-medium" dir="ltr">{BANK_DETAILS.swift}</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-muted-foreground">{t("bankTransferNote")}</p>
          </div>
        )}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link to="/shop">{t("continueShopping")}</Link>
          </Button>
          {user && (
            <Button asChild variant="secondary">
              <Link to="/account">{t("myOrders")}</Link>
            </Button>
          )}
          {user && orderId && (
            <Button asChild variant="outline">
              <Link to="/invoice/$id" params={{ id: orderId }}>{pick("View invoice", "عرض الفاتورة")}</Link>
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container-page py-20 text-center">
        <p className="mb-5 text-muted-foreground">{t("emptyCart")}</p>
        <Button asChild>
          <Link to="/shop">{t("continueShopping")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      <h1 className="heading-section mb-8">{t("checkout")}</h1>
      <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6 rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">{t("deliveryDetails")}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("fullName")}>
              <Input value={form.customer_name} onChange={(e) => set("customer_name", e.target.value)} required />
            </Field>
            <Field label={t("phone")}>
              <Input value={form.customer_phone} onChange={(e) => set("customer_phone", e.target.value)} required />
            </Field>
            <Field label={t("email")}>
              <Input type="email" value={form.customer_email} onChange={(e) => set("customer_email", e.target.value)} />
            </Field>
            <Field label={t("emirate")}>
              <select
                value={form.emirate}
                onChange={(e) => set("emirate", e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {EMIRATES.map((em) => (
                  <option key={em.value} value={em.value}>
                    {pick(em.en, em.ar)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t("area")}>
              <Input value={form.area} onChange={(e) => set("area", e.target.value)} required />
            </Field>
            <Field label={t("landmark")}>
              <Input value={form.landmark} onChange={(e) => set("landmark", e.target.value)} />
            </Field>
          </div>
          <Field label={t("address")}>
            <Textarea value={form.address} onChange={(e) => set("address", e.target.value)} required />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("preferredDate")}>
              <Input type="date" min={new Date(Date.now() + 4 * 3600_000).toISOString().slice(0, 10)} value={form.delivery_date} onChange={(e) => set("delivery_date", e.target.value)} />
            </Field>
            <Field label={t("timeSlot")}>
              <select
                value={form.delivery_slot}
                onChange={(e) => set("delivery_slot", e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="morning">{t("morning")}</option>
                <option value="afternoon">{t("afternoon")}</option>
                <option value="evening">{t("evening")}</option>
              </select>
            </Field>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold">{t("paymentMethod")}</h2>
            <div className="space-y-2 text-sm">
              <label
                className={`flex items-center gap-2 rounded-md border p-3 ${
                  paymentMethod === "cod" ? "border-primary bg-secondary" : "border-border"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "cod"}
                  onChange={() => setPaymentMethod("cod")}
                />
                {t("cod")}
              </label>
              {BANK_TRANSFER_ENABLED && (
              <label
                className={`flex items-center gap-2 rounded-md border p-3 ${
                  paymentMethod === "bank_transfer" ? "border-primary bg-secondary" : "border-border"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "bank_transfer"}
                  onChange={() => setPaymentMethod("bank_transfer")}
                />
                {t("bankTransfer")}
              </label>
              )}
              {paymentMethod === "bank_transfer" && (
                <p className="rounded-md bg-muted p-3 text-xs text-muted-foreground">{t("bankTransferNote")}</p>
              )}
              <label className="flex items-center gap-2 rounded-md border border-border p-3 text-muted-foreground">
                <input type="radio" disabled /> {t("cardSoon")}
              </label>
            </div>
          </div>

          <Field label={t("notes")}>
            <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} />
          </Field>
        </div>

        <aside className="h-fit space-y-3 rounded-lg border border-border bg-card p-5">
          <ul className="space-y-2 text-sm">
            {items.map((i) => (
              <li key={i.key} className="flex justify-between gap-3">
                <span className="text-muted-foreground">
                  {pick(i.name_en, i.name_ar)} × {i.qty}
                </span>
                <span>{formatAed(i.price * i.qty, lang)}</span>
              </li>
            ))}
          </ul>
          <div className="flex gap-2 border-t border-border pt-3">
            <Input
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value)}
              placeholder={pick("Coupon code", "رمز القسيمة")}
              aria-label={pick("Coupon code", "رمز القسيمة")}
            />
            <Button type="button" variant="secondary" onClick={applyCoupon}>
              {pick("Apply", "تطبيق")}
            </Button>
          </div>
          {coupon && (
            <div className="flex justify-between text-sm text-success">
              <span>
                {coupon.code}{" "}
                <button type="button" className="underline" onClick={() => setCoupon(null)}>
                  {pick("remove", "إزالة")}
                </button>
              </span>
              <span>-{formatAed(discount, lang)}</span>
            </div>
          )}
          <div className="space-y-2 border-t border-border pt-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("subtotal")}</span>
              <span>{formatAed(sums.subtotal, lang)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("vat")}</span>
              <span>{formatAed(sums.vat, lang)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("deliveryFee")}</span>
              <span>{sums.delivery === 0 ? t("free") : formatAed(sums.delivery, lang)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
              <span>{t("total")}</span>
              <span>{formatAed(sums.grand, lang)}</span>
            </div>
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? t("loading") : t("placeOrder")}
          </Button>
        </aside>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactElement }) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {cloneElement(children, { id })}
    </div>
  );
}
