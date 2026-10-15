import { createFileRoute, Link } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { useCart } from "@/lib/cart";
import { formatAed, useI18n } from "@/lib/i18n";
import { totals } from "@/lib/shop";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Cart | Al Adeel Furniture" },
      { name: "description", content: "Review the furniture in your cart, with VAT and delivery calculated in AED." },
      { property: "og:title", content: "Your Cart | Al Adeel Furniture" },
      { property: "og:description", content: "Review your furniture order before checkout." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { t, lang, pick } = useI18n();
  const { items, setQty, remove, itemsTotal } = useCart();
  const sums = totals(itemsTotal);

  return (
    <div className="container-page py-10">
      <h1 className="heading-section mb-8">{t("yourCart")}</h1>

      {items.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-10 text-center">
          <p className="mb-5 text-muted-foreground">{t("emptyCart")}</p>
          <Button asChild>
            <Link to="/shop">{t("continueShopping")}</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          <ul className="space-y-4">
            {items.map((item) => (
              <li key={item.key} className="flex gap-4 rounded-lg border border-border bg-card p-4">
                <div className="size-24 shrink-0 overflow-hidden rounded-md bg-sand">
                  {item.image && <img src={item.image} alt={item.name_en} loading="lazy" className="size-full object-cover" />}
                </div>
                <div className="flex-1">
                  {item.packageId ? (
                    <span className="font-medium">{pick(item.name_en, item.name_ar)}</span>
                  ) : (
                    <Link to="/product/$slug" params={{ slug: item.slug }} className="font-medium hover:text-primary">
                      {pick(item.name_en, item.name_ar)}
                    </Link>
                  )}
                  {item.variantLabel && <p className="text-xs capitalize text-muted-foreground">{item.variantLabel}</p>}
                  <p className="mt-1 text-sm text-primary">{formatAed(item.price, lang)}</p>
                  <div className="mt-3 flex items-center gap-3">
                    <label className="text-sm text-muted-foreground">{t("quantity")}</label>
                    <input
                      type="number"
                      min={1}
                      value={item.qty}
                      onChange={(e) => setQty(item.key, Number(e.target.value))}
                      className="w-20 rounded-md border border-input bg-background px-2 py-1 text-sm"
                    />
                    <Button variant="ghost" size="sm" onClick={() => remove(item.key)}>
                      <Trash2 className="size-4" /> {t("remove")}
                    </Button>
                  </div>
                </div>
                <div className="text-end font-medium">{formatAed(item.price * item.qty, lang)}</div>
              </li>
            ))}
          </ul>

          <aside className="h-fit space-y-3 rounded-lg border border-border bg-card p-5">
            <Row label={t("subtotal")} value={formatAed(sums.subtotal, lang)} />
            <Row label={t("vat")} value={formatAed(sums.vat, lang)} />
            <Row
              label={t("deliveryFee")}
              value={sums.delivery === 0 ? t("free") : pick("Set at checkout by emirate", "تُحدد عند الدفع حسب الإمارة")}
            />
            <div className="border-t border-border pt-3">
              <Row label={t("total")} value={formatAed(sums.grand - sums.delivery, lang)} bold />
            </div>
            <Button asChild className="w-full" size="lg">
              <Link to="/checkout">{t("checkout")}</Link>
            </Button>
            <Button asChild variant="ghost" className="w-full">
              <Link to="/shop">{t("continueShopping")}</Link>
            </Button>
          </aside>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between text-sm ${bold ? "text-base font-semibold" : ""}`}>
      <span className={bold ? "" : "text-muted-foreground"}>{label}</span>
      <span>{value}</span>
    </div>
  );
}
