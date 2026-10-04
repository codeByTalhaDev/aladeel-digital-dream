import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Truck, Wrench, Ruler, BadgeCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import type { Category, Product } from "@/lib/shop";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { ProductCardSkeleton } from "@/components/ProductCardSkeleton";
import { CatalogError } from "@/components/CatalogError";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Al Adeel Furniture | Sofas, Majlis & Bedroom Sets in Ras Al Khaimah" },
      {
        name: "description",
        content:
          "Shop sofa sets, majlis, bedroom sets, TV stands and custom kitchens from Al Adeel Furniture. Delivery and free assembly across the UAE, cash on delivery available.",
      },
      { property: "og:title", content: "Al Adeel Furniture | Furniture made for UAE homes" },
      {
        property: "og:description",
        content: "Sofas, majlis, bedrooms and fitted kitchens delivered and assembled across the UAE.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const { t, pick } = useI18n();

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("sort_order");
      if (error) throw error;
      return data as Category[];
    },
  });

  const { data: featured, isLoading: featuredLoading, isError: featuredError, refetch: refetchFeatured } = useQuery({
    queryKey: ["products", "featured"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .eq("is_featured", true)
        .limit(8);
      if (error) throw error;
      return data as Product[];
    },
  });

  const { data: newest, isLoading: newestLoading, isError: newestError, refetch: refetchNewest } = useQuery({
    queryKey: ["products", "newest"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(4);
      if (error) throw error;
      return data as Product[];
    },
  });

  const trust = [
    { icon: Truck, label: t("trustDelivery") },
    { icon: Wrench, label: t("trustAssembly") },
    { icon: Ruler, label: t("trustCustom") },
    { icon: BadgeCheck, label: t("trustVat") },
  ];

  return (
    <>
      <section className="relative isolate overflow-hidden">
        <img
          src="/images/hero-majlis.jpg"
          alt="Majlis furnished by Al Adeel Furniture"
          width={1920}
          height={1088}
          className="absolute inset-0 -z-10 size-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/80 via-black/50 to-black/25" />
        <div className="container-page flex min-h-[70vh] flex-col justify-end py-16 text-white sm:py-24">
          <p className="mb-3 text-xs uppercase tracking-[0.3em] text-brass">Ras Al Khaimah · U.A.E.</p>
          <h1 className="heading-xl max-w-3xl">{t("heroTitle")}</h1>
          <p className="mt-4 max-w-xl text-base text-white/85">{t("heroSub")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/shop">{t("shopNow")}</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link to="/contact">{t("visitShowroom")}</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-secondary">
        <div className="container-page grid gap-4 py-6 sm:grid-cols-2 lg:grid-cols-4">
          {trust.map((item) => (
            <div key={item.label} className="flex items-center gap-3 text-sm">
              <item.icon className="size-5 shrink-0 text-primary" />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page py-16">
        <h2 className="heading-section mb-8">{t("shopByCategory")}</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {categories?.map((c) => (
            <Link
              key={c.id}
              to="/shop"
              search={{ category: c.slug }}
              className="group flex flex-col items-center gap-3 text-center"
            >
              <div className="size-24 overflow-hidden rounded-full border border-border bg-sand sm:size-28">
                {c.image_url && (
                  <img
                    src={c.image_url}
                    alt={pick(c.name_en, c.name_ar)}
                    loading="lazy"
                    className="size-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                )}
              </div>
              <span className="text-sm font-medium group-hover:text-primary">{pick(c.name_en, c.name_ar)}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="container-page pb-16">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="heading-section">{t("bestSellers")}</h2>
          <Link to="/shop" className="text-sm text-primary hover:underline">
            {t("viewAll")}
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featuredLoading
            ? Array.from({ length: 4 }, (_, index) => <ProductCardSkeleton key={index} />)
            : featuredError
              ? <CatalogError onRetry={() => void refetchFeatured()} />
              : featured?.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      <section className="bg-sand py-16">
        <div className="container-page">
          <h2 className="heading-section mb-8">{t("newArrivals")}</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {newestLoading
              ? Array.from({ length: 4 }, (_, index) => <ProductCardSkeleton key={index} />)
              : newestError
                ? <CatalogError onRetry={() => void refetchNewest()} />
                : newest?.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      </section>
    </>
  );
}
