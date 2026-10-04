import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/useAuth";
import type { Product } from "@/lib/shop";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/wishlist")({
  head: () => ({
    meta: [
      { title: "My Wishlist | Al Adeel Furniture" },
      { name: "description", content: "Furniture you've saved at Al Adeel Furniture." },
      { property: "og:title", content: "My Wishlist | Al Adeel Furniture" },
      { property: "og:description", content: "Your saved furniture pieces." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Wishlist,
});

function Wishlist() {
  const { pick } = useI18n();
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["wishlist", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wishlists")
        .select("created_at, products(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data.map((r) => r.products).filter(Boolean) as unknown as Product[];
    },
  });

  return (
    <div className="container-page py-10">
      <h1 className="heading-section mb-8">{pick("My Wishlist", "قائمة الأمنيات")}</h1>
      {isLoading ? (
        <p className="text-muted-foreground">…</p>
      ) : !data?.length ? (
        <div className="rounded-lg border border-border bg-card p-10 text-center">
          <p className="mb-4 text-muted-foreground">{pick("No saved items yet. Tap the heart on any product.", "لا توجد عناصر محفوظة. اضغط على القلب في أي منتج.")}</p>
          <Button asChild><Link to="/shop">{pick("Browse furniture", "تصفح الأثاث")}</Link></Button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {data.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}
