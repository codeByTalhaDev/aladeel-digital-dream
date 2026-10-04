import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatAed, useI18n, type TKey } from "@/lib/i18n";
import { useAuth } from "@/lib/useAuth";
import { Button } from "@/components/ui/button";

const STEPS = ["pending", "confirmed", "out_for_delivery", "delivered"] as const;

type OrderRow = {
  id: string;
  order_number: number;
  created_at: string;
  status: string;
  total: number;
  emirate: string;
};

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({
    meta: [
      { title: "My Account | Al Adeel Furniture" },
      { name: "description", content: "View your Al Adeel Furniture orders and their delivery status." },
      { property: "og:title", content: "My Account | Al Adeel Furniture" },
      { property: "og:description", content: "Track your furniture orders." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Account,
});

function Account() {
  const { t, lang, pick } = useI18n();
  const { user } = useAuth();

  const { data: orders, isLoading } = useQuery({
    queryKey: ["my-orders", user?.id],
    enabled: Boolean(user?.id),
    refetchInterval: 30000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, created_at, status, total, emirate")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as OrderRow[];
    },
  });

  return (
    <div className="container-page py-12">
      <h1 className="heading-section">{t("account")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{user?.email}</p>

      <div className="mt-4">
        <Button asChild variant="secondary" size="sm"><Link to="/wishlist">{pick("My Wishlist", "قائمة الأمنيات")}</Link></Button>
      </div>
      <h2 className="mt-10 mb-4 text-lg font-semibold">{pick("Track your orders", "تتبع طلباتك")}</h2>
      {isLoading ? (
        <p className="text-muted-foreground">{t("loading")}</p>
      ) : !orders || orders.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="mb-4 text-muted-foreground">{t("noOrders")}</p>
          <Button asChild>
            <Link to="/shop">{t("shopNow")}</Link>
          </Button>
        </div>
      ) : (
        <ul className="space-y-4">
          {orders.map((o) => {
            const step = STEPS.indexOf(o.status as (typeof STEPS)[number]);
            return (
              <li key={o.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">#{o.order_number}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(o.created_at).toLocaleDateString(lang === "ar" ? "ar-AE" : "en-AE")} · {o.emirate}
                    </p>
                  </div>
                  <span className="font-semibold">{formatAed(Number(o.total), lang)}</span>
                  <Button asChild size="sm" variant="outline">
                    <Link to="/invoice/$id" params={{ id: o.id }}>{pick("Invoice", "الفاتورة")}</Link>
                  </Button>
                </div>
                {step >= 0 ? (
                  <ol className="mt-4 grid grid-cols-4 gap-1 text-center text-[11px] sm:text-xs">
                    {STEPS.map((s, i) => (
                      <li key={s}>
                        <div className={`mb-1 h-1.5 rounded-full ${i <= step ? "bg-primary" : "bg-muted"}`} />
                        <span className={i <= step ? "font-medium text-foreground" : "text-muted-foreground"}>{t(s as TKey)}</span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="mt-3 inline-flex rounded-full bg-secondary px-3 py-1 text-xs">{t(o.status as TKey)}</p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
