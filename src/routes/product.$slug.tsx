import { isAvailable } from "@/lib/shop";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Truck, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatAed, useI18n } from "@/lib/i18n";
import { useCart } from "@/lib/cart";
import { whatsappLink, type Product } from "@/lib/shop";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { WishlistButton } from "@/components/WishlistButton";
import { Reviews, Stars, useReviews } from "@/components/Reviews";

export const Route = createFileRoute("/product/$slug")({
  loader: async ({ params }) => {
    const { data } = await supabase.from("products").select("name_en, description_en, images, price").eq("slug", params.slug).maybeSingle();
    return { seo: data as { name_en: string; description_en: string | null; images?: string[] | null; image_url?: string | null; price: number } | null };
  },
  head: ({ params, loaderData }) => {
    const d = loaderData?.seo;
    const name = d?.name_en ?? params.slug.replace(/-/g, " ");
    const title = `${name} | Al Adeel Furniture UAE`;
    const desc = (d?.description_en || `${name} from Al Adeel Furniture — delivered and assembled across the UAE. Prices in AED incl. VAT.`).slice(0, 160);
    const raw = d?.images?.[0] ?? d?.image_url ?? null;
    const img = raw ? (raw.startsWith("http") ? raw : `https://aladeel-digital-dream.lovable.app${raw.startsWith("/") ? "" : "/"}${raw}`) : null;
    const url = `https://aladeel-digital-dream.lovable.app/product/${params.slug}`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "product" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
        ...(img ? [{ property: "og:image", content: img }, { name: "twitter:image", content: img }] : []),
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: d ? [{ type: "application/ld+json", children: JSON.stringify({ "@context": "https://schema.org", "@type": "Product", name, description: desc, ...(img ? { image: img } : {}), brand: { "@type": "Brand", name: "Al Adeel Furniture" }, offers: { "@type": "Offer", price: d.price, priceCurrency: "AED", availability: "https://schema.org/InStock", url } }) }] : [],
    };
  },
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { t, lang, pick } = useI18n();
  const { add } = useCart();
  const navigate = useNavigate();
  const [active, setActive] = useState(0);
  const [variantId, setVariantId] = useState<string | null>(null);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").eq("slug", slug).maybeSingle();
      if (error) throw error;
      return data as Product | null;
    },
  });

  const { data: related } = useQuery({
    queryKey: ["related", product?.category_id, product?.id],
    enabled: Boolean(product?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .neq("id", product!.id)
        .limit(12);
      if (error) throw error;
      const all = data as Product[];
      const same = all.filter((p) => p.category_id === product!.category_id);
      const other = all.filter((p) => p.category_id !== product!.category_id);
      return [...same, ...other].slice(0, 4);
    },
  });

  const { data: variants = [] } = useQuery({
    queryKey: ["variants", product?.id],
    enabled: Boolean(product?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", product!.id)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });
  const { data: reviews = [] } = useReviews(product?.id);

  if (isLoading) return <div className="container-page py-20 text-muted-foreground">{t("loading")}</div>;
  if (!product)
    return (
      <div className="container-page py-20">
        <p className="mb-4">{t("noProducts")}</p>
        <Button asChild>
          <Link to="/shop">{t("shop")}</Link>
        </Button>
      </div>
    );

  const name = pick(product.name_en, product.name_ar);
  const stockLabel =
    product.stock_status === "in_stock"
      ? t("inStock")
      : product.stock_status === "made_to_order"
        ? t("madeToOrder")
        : t("outOfStock");

  const variant = variants.find((v) => v.id === variantId) ?? null;
  const needsVariant = variants.length > 0 && !variant;
  const price = variant ? Number(variant.price) : Number(product.price);
  const soldOut = variant ? product.stock_status === "out_of_stock" || variant.stock_qty <= 0 : !isAvailable(product);
  const avg = reviews.length ? reviews.reduce((n, r) => n + r.rating, 0) / reviews.length : 0;
  const groups = Array.from(new Set(variants.map((v) => v.option_type)));

  function addToCart() {
    if (needsVariant) {
      toast.error(pick("Please choose an option", "يرجى اختيار خيار"));
      return false;
    }
    add({
      productId: product!.id,
      variantId: variant?.id ?? null,
      variantLabel: variant ? `${variant.option_type}: ${variant.label}` : null,
      slug: product!.slug,
      name_en: product!.name_en,
      name_ar: product!.name_ar,
      price,
      image: product!.images[0] ?? null,
    });
    toast.success(t("added"));
    return true;
  }

  return (
    <div className="container-page py-10">
      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <div className="aspect-square overflow-hidden rounded-lg border border-border bg-sand">
            {product.images[active] && (
              <img src={product.images[active]} alt={`${product.name_en} – Al Adeel Furniture UAE`} className="size-full object-cover" />
            )}
          </div>
          {product.images.length > 1 && (
            <div className="mt-3 flex gap-3">
              {product.images.map((img, i) => (
                <button
                  key={img}
                  onClick={() => setActive(i)}
                  className={`size-20 overflow-hidden rounded-md border ${i === active ? "border-primary" : "border-border"}`}
                >
                  <img src={img} alt={`${product.name_en} view ${i + 1}`} loading="lazy" className="size-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-start justify-between gap-3">
            <h1 className="heading-section">{name}</h1>
            <WishlistButton productId={product.id} className="shrink-0" />
          </div>
          {reviews.length > 0 && (
            <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <Stars value={avg} /> {avg.toFixed(1)} ({reviews.length})
            </p>
          )}
          {product.sku && <p className="mt-1 text-xs text-muted-foreground">SKU {product.sku}</p>}

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-semibold text-primary">{formatAed(price, lang)}</span>
            {product.compare_at_price && Number(product.compare_at_price) > Number(product.price) && (
              <span className="text-lg text-muted-foreground line-through">
                {formatAed(Number(product.compare_at_price), lang)}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{t("vatIncluded")}</p>

          <p className="mt-4 inline-flex rounded-full bg-secondary px-3 py-1 text-sm">{stockLabel}</p>

          {groups.map((g) => (
            <div key={g} className="mt-5">
              <p className="mb-2 text-sm font-medium capitalize">{g}</p>
              <div className="flex flex-wrap gap-2">
                {variants
                  .filter((v) => v.option_type === g)
                  .map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      disabled={v.stock_qty <= 0}
                      onClick={() => setVariantId(v.id)}
                      className={`rounded-md border px-3 py-2 text-sm transition-colors disabled:opacity-40 ${
                        variantId === v.id ? "border-primary bg-secondary text-primary" : "border-border hover:border-primary"
                      }`}
                    >
                      {v.label} · {formatAed(Number(v.price), lang)}
                      {v.stock_qty <= 0 && ` (${t("outOfStock")})`}
                    </button>
                  ))}
              </div>
            </div>
          ))}
          {variant && (
            <p className="mt-2 text-xs text-muted-foreground">
              {variant.stock_qty} {pick("in stock", "متوفر")}
            </p>
          )}

          <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
            {pick(product.description_en, product.description_ar)}
          </p>

          <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
            {product.material && (
              <div>
                <dt className="text-muted-foreground">Material</dt>
                <dd>{product.material}</dd>
              </div>
            )}
            {product.color && (
              <div>
                <dt className="text-muted-foreground">Colour</dt>
                <dd>{product.color}</dd>
              </div>
            )}
          </dl>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" onClick={addToCart} disabled={soldOut}>
              {t("addToCart")}
            </Button>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => {
                if (addToCart()) navigate({ to: "/checkout" });
              }}
              disabled={soldOut}
            >
              {t("buyNow")}
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href={whatsappLink(`Hello, I'm interested in: ${product.name_en}`)} target="_blank" rel="noreferrer">
                {t("whatsappUs")}
              </a>
            </Button>
          </div>

          <div className="mt-8 space-y-3 rounded-lg bg-secondary p-4 text-sm">
            <p className="flex items-center gap-2">
              <Truck className="size-4 text-primary" /> {t("deliveryEstimate")}
            </p>
            <p className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" /> {t("trustAssembly")}
            </p>
          </div>
        </div>
      </div>

      {related && related.length > 0 && (
        <section className="mt-16">
          <h2 className="heading-section mb-6">{pick("You may also like", "قد يعجبك أيضاً")}</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      <Reviews productId={product.id} />
    </div>
  );
}
