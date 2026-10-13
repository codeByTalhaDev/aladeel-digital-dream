import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatAed, useI18n, type TKey } from "@/lib/i18n";
import { useAuth, useIsAdmin } from "@/lib/useAuth";
import { ORDER_STATUSES } from "@/lib/shop";
import { Button } from "@/components/ui/button";

const PAYMENT_STATUSES = ["pending", "paid", "refunded"] as const;

export const Route = createFileRoute("/_authenticated/admin_/orders/$id")({
  head: () => ({
    meta: [
      { title: "Order Details | Al Adeel Furniture" },
      { name: "description", content: "View and manage a customer order." },
      { property: "og:title", content: "Order Details | Al Adeel Furniture" },
      { property: "og:description", content: "View and manage a customer order." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OrderDetail,
});

function OrderDetail() {
  const { t, lang, pick } = useI18n();
  const { id } = Route.useParams();
  const { user } = useAuth();
  const { isAdmin, isStaff, checked } = useIsAdmin(user?.id);
  const queryClient = useQueryClient();

  const { data: order, isLoading } = useQuery({
    queryKey: ["admin-order", id],
    enabled: isAdmin || isStaff,
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: items } = useQuery({
    queryKey: ["admin-order-items", id],
    enabled: isAdmin || isStaff,
    queryFn: async () => {
      const { data, error } = await supabase.from("order_items").select("*").eq("order_id", id);
      if (error) throw error;
      return data;
    },
  });

  const update = useMutation({
    mutationFn: async (patch: { status?: string; payment_status?: string }) => {
      const { error } = await supabase.from("orders").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Order updated");
      queryClient.invalidateQueries({ queryKey: ["admin-order", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!checked) return <div className="container-page py-20 text-muted-foreground">{t("loading")}</div>;
  if (!isAdmin && !isStaff) return <div className="container-page py-20">{t("adminOnly")}</div>;
  if (isLoading || !order) return <div className="container-page py-20 text-muted-foreground">{t("loading")}</div>;

  return (
    <div className="container-page max-w-3xl py-12">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link to="/admin">← {t("admin")}</Link>
      </Button>
      <h1 className="heading-section mb-6">
        {pick("Order", "طلب")} #{order.order_number}
      </h1>

      <div className="space-y-6">
        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide">{pick("Customer", "العميل")}</h2>
          <p className="font-medium">{order.customer_name}</p>
          <p className="text-sm text-muted-foreground">{order.customer_phone}{order.customer_email ? ` · ${order.customer_email}` : ""}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {order.emirate}, {order.area} · {order.address}
            {order.landmark ? ` · ${order.landmark}` : ""}
          </p>
          {(order.delivery_date || order.delivery_slot) && (
            <p className="mt-1 text-sm text-muted-foreground">
              {pick("Delivery", "التوصيل")}: {order.delivery_date ?? "—"} {order.delivery_slot ?? ""}
            </p>
          )}
          {order.notes && <p className="mt-1 text-sm text-muted-foreground">{pick("Notes", "ملاحظات")}: {order.notes}</p>}
        </section>

        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide">{pick("Items", "المنتجات")}</h2>
          <ul className="divide-y divide-border">
            {items?.map((i) => (
              <li key={i.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span>
                  {pick(i.name_en, i.name_ar)} × {i.quantity}
                </span>
                <span className="shrink-0 font-medium">{formatAed(Number(i.line_total), lang)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-1 border-t border-border pt-3 text-sm">
            <div className="flex justify-between"><dt>{pick("Subtotal", "المجموع الفرعي")}</dt><dd>{formatAed(Number(order.subtotal), lang)}</dd></div>
            {Number(order.discount) > 0 && (
              <div className="flex justify-between text-green-700"><dt>{pick("Discount", "الخصم")}{order.coupon_code ? ` (${order.coupon_code})` : ""}</dt><dd>-{formatAed(Number(order.discount), lang)}</dd></div>
            )}
            <div className="flex justify-between"><dt>{pick("VAT (5%)", "الضريبة (5%)")}</dt><dd>{formatAed(Number(order.vat), lang)}</dd></div>
            <div className="flex justify-between"><dt>{pick("Delivery fee", "رسوم التوصيل")}</dt><dd>{formatAed(Number(order.delivery_fee), lang)}</dd></div>
            <div className="flex justify-between text-base font-semibold"><dt>{pick("Total", "الإجمالي")}</dt><dd>{formatAed(Number(order.total), lang)}</dd></div>
          </dl>
        </section>

        <section className="grid gap-4 rounded-lg border border-border bg-card p-5 sm:grid-cols-2">
          <div>
            <label htmlFor="order-status" className="mb-1.5 block text-sm font-semibold uppercase tracking-wide">
              {pick("Order status", "حالة الطلب")}
            </label>
            <select
              id="order-status"
              value={order.status}
              onChange={(e) => update.mutate({ status: e.target.value })}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>{t(s as TKey)}</option>
              ))}
            </select>
            {order.status === "cancelled" && (
              <p className="mt-1 text-xs text-muted-foreground">{pick("Stock was returned automatically.", "تمت إعادة المخزون تلقائياً.")}</p>
            )}
          </div>
          <div>
            <label htmlFor="payment-status" className="mb-1.5 block text-sm font-semibold uppercase tracking-wide">
              {pick("Payment", "الدفع")}
            </label>
            <select
              id="payment-status"
              value={order.payment_status}
              onChange={(e) => update.mutate({ payment_status: e.target.value })}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {PAYMENT_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-muted-foreground">{order.payment_method === "cod" ? pick("Cash on delivery", "الدفع عند الاستلام") : order.payment_method}</p>
          </div>
        </section>
      </div>
    </div>
  );
}
