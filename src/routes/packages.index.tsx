import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatAed, useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/packages/")({
  head: () => ({
    meta: [
      { title: "Furniture Room-Set Packages UAE | Al Adeel Furniture" },
      { name: "description", content: "Save on complete room sets — sofa, table and TV console bundles delivered across Sharjah, Dubai and the UAE." },
      { property: "og:title", content: "Room-Set Packages | Al Adeel Furniture" },
      { property: "og:description", content: "Discounted furniture bundles delivered across the UAE." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Packages,
});

export function usePackages() {
  return useQuery({
    queryKey: ["packages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("packages")
        .select("*, package_items(quantity, products(id, slug, name_en, name_ar, price, images))")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

function Packages() {
  const { pick, lang } = useI18n();
  const { data, isLoading } = usePackages();
  return (
    <div className="container-page py-10">
      <h1 className="heading-section mb-2">{pick("Room-Set Packages", "باقات الغرف")}</h1>
      <p className="mb-8 text-muted-foreground">{pick("Complete rooms at a bundle price.", "غرف كاملة بسعر الباقة.")}</p>
      {isLoading ? (
        <p className="text-muted-foreground">…</p>
      ) : !data?.length ? (
        <p className="text-muted-foreground">{pick("No packages yet.", "لا توجد باقات حالياً.")}</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((pk) => {
            const worth = pk.package_items.reduce((n, i) => n + Number(i.products?.price ?? 0) * i.quantity, 0);
            return (
              <article key={pk.id} className="card-product flex flex-col">
                <Link to="/packages/$slug" params={{ slug: pk.slug }} className="block aspect-[4/3] bg-sand">
                  {pk.image_url && <img src={pk.image_url} alt={`${pk.name_en} furniture package UAE`} loading="lazy" className="size-full object-cover" />}
                </Link>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <Link to="/packages/$slug" params={{ slug: pk.slug }} className="font-medium hover:text-primary">
                    {pick(pk.name_en, pk.name_ar)}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {pk.package_items.length} {pick("pieces", "قطع")}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-semibold text-primary">{formatAed(Number(pk.price), lang)}</span>
                    {worth > Number(pk.price) && <span className="text-sm text-muted-foreground line-through">{formatAed(worth, lang)}</span>}
                  </div>
                  <Button asChild className="mt-auto">
                    <Link to="/packages/$slug" params={{ slug: pk.slug }}>{pick("View package", "عرض الباقة")}</Link>
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
