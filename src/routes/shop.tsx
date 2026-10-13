import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import type { Category, Product } from "@/lib/shop";
import { ProductCard } from "@/components/ProductCard";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { ProductCardSkeleton } from "@/components/ProductCardSkeleton";
import { CatalogError } from "@/components/CatalogError";

type Search = { category?: string; sort?: string; max?: number; q?: string };

export const Route = createFileRoute("/shop")({
  validateSearch: (search: Record<string, unknown>): Search => {
    const out: Search = {};
    if (typeof search["category"] === "string") out.category = search["category"];
    if (typeof search["sort"] === "string") out.sort = search["sort"];
    if (typeof search["max"] === "number") out.max = search["max"];
    if (typeof search["q"] === "string") out.q = search["q"];
    return out;
  },
  head: () => ({
    meta: [
      { title: "Shop Furniture Online in UAE & Sharjah | Al Adeel Furniture" },
      {
        name: "description",
        content:
          "Browse sofas, majlis sets, beds, dining tables, TV stands and kitchens. Filter by category and price, all prices in AED including 5% VAT.",
      },
      { property: "og:title", content: "Shop Furniture Online | Al Adeel Furniture" },
      { property: "og:description", content: "Sofas, majlis, bedrooms and kitchens delivered across the UAE." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Shop,
});

function Shop() {
  const { t, pick, lang } = useI18n();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/shop" });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("sort_order");
      if (error) throw error;
      return data as Category[];
    },
  });

  const { data: products, isLoading, isError, refetch } = useQuery({
    queryKey: ["products", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Product[];
    },
  });

  const categoryId = categories?.find((c) => c.slug === search.category)?.id;
  const maxPrice = search.max ?? 20000;
  const [visible, setVisible] = useState(12);

  const list = useMemo(() => {
    let out = (products ?? []).filter((p) => Number(p.price) <= maxPrice);
    if (categoryId) out = out.filter((p) => p.category_id === categoryId);
    const q = search.q?.trim().toLowerCase();
    if (q) out = out.filter((p) => `${p.name_en} ${p.name_ar} ${p.sku ?? ""}`.toLowerCase().includes(q));
    if (search.sort === "price_asc") out = [...out].sort((a, b) => Number(a.price) - Number(b.price));
    if (search.sort === "price_desc") out = [...out].sort((a, b) => Number(b.price) - Number(a.price));
    return out;
  }, [products, categoryId, maxPrice, search.sort, search.q]);

  // Reset pagination whenever the filters change.
  const filterKey = `${search.category}|${search.sort}|${search.max}|${search.q}`;
  const [lastKey, setLastKey] = useState(filterKey);
  if (filterKey !== lastKey) {
    setLastKey(filterKey);
    setVisible(12);
  }
  const shown = list.slice(0, visible);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [liveMax, setLiveMax] = useState<number | null>(null);
  function updateLater(next: Record<string, string | number | undefined>) {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      update(next);
      setLiveMax(null);
    }, 300);
  }

  function update(next: Record<string, string | number | undefined>) {
    navigate({
      replace: true,
      search: (prev) => {
        const merged: Record<string, string | number> = { ...prev };
        for (const [k, v] of Object.entries(next)) {
          if (v === undefined || v === "") delete merged[k];
          else merged[k] = v;
        }
        return merged as Search;
      },
    });
  }


  return (
    <div className="container-page py-10">
      <h1 className="heading-section mb-4">{pick("Shop Furniture in the UAE", "تسوق الأثاث في الإمارات")}</h1>
      <div className="relative mb-8 max-w-xl">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          defaultValue={search.q ?? ""}
          onChange={(e) => updateLater({ q: e.target.value || undefined })}
          placeholder={pick("Search products by name…", "ابحث عن المنتجات بالاسم…")}
          aria-label={pick("Search products", "بحث المنتجات")}
          className="ps-9"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-[250px_1fr]">
        <aside className="space-y-6 rounded-lg border border-border bg-card p-5 lg:sticky lg:top-28 lg:self-start">
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide">{t("categories")}</h2>
            <div className="flex flex-wrap gap-2 lg:flex-col lg:items-start">
              <Button
                variant={search.category ? "ghost" : "secondary"}
                size="sm"
                onClick={() => update({ category: undefined })}
              >
                {t("allCategories")}
              </Button>
              {categories?.map((c) => (
                <Button
                  key={c.id}
                  variant={search.category === c.slug ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => update({ category: c.slug })}
                >
                  {pick(c.name_en, c.name_ar)}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label className="mb-3 block text-sm font-semibold uppercase tracking-wide">
              {t("maxPrice")}: {new Intl.NumberFormat(lang === "ar" ? "ar-AE" : "en-AE").format(maxPrice)} AED
            </Label>
            <Slider
              value={[liveMax ?? maxPrice]}
              min={500}
              max={20000}
              step={500}
              onValueChange={(v) => {
                setLiveMax(v[0] ?? null);
                updateLater({ max: v[0] });
              }}
            />
          </div>

          <div>
            <Label className="mb-2 block text-sm font-semibold uppercase tracking-wide">{t("sortBy")}</Label>
            <select
              value={search.sort ?? "newest"}
              onChange={(e) => update({ sort: e.target.value })}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="newest">{t("newest")}</option>
              <option value="price_asc">{t("priceLow")}</option>
              <option value="price_desc">{t("priceHigh")}</option>
            </select>
          </div>
        </aside>

        <main aria-live="polite" aria-busy={isLoading}>
          {isLoading ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }, (_, index) => (
                <ProductCardSkeleton key={index} />
              ))}
            </div>
          ) : isError ? (
            <CatalogError onRetry={() => void refetch()} />
          ) : list.length === 0 ? (
            <div className="flex min-h-56 items-center justify-center rounded-lg border border-dashed border-border bg-muted/40 p-6 text-center text-muted-foreground">
              {t("noProducts")}
            </div>
          ) : (
            <>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {shown.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
              {list.length > visible && (
                <div className="mt-8 text-center">
                  <Button variant="secondary" onClick={() => setVisible((v) => v + 12)}>
                    {pick("Show more products", "عرض المزيد من المنتجات")} ({list.length - visible} {pick("left", "متبقية")})
                  </Button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
