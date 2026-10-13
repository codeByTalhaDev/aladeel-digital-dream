import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatAed, useI18n } from "@/lib/i18n";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/packages/$slug")({
  loader: async ({ params }) => {
    const { data } = await supabase.from("packages").select("name_en, description_en, image_url, price").eq("slug", params.slug).maybeSingle();
    return { seo: data as { name_en: string; description_en: string | null; images?: string[] | null; image_url?: string | null; price: number } | null };
  },
  head: ({ params, loaderData }) => {
    const d = loaderData?.seo;
    const name = d?.name_en ?? params.slug.replace(/-/g, " ");
    const title = `${name} | Al Adeel Furniture UAE`;
    const desc = (d?.description_en || `${name} from Al Adeel Furniture — delivered and assembled across the UAE. Prices in AED incl. VAT.`).slice(0, 160);
    const raw = d?.images?.[0] ?? d?.image_url ?? null;
    const img = raw ? (raw.startsWith("http") ? raw : `https://aladeel-digital-dream.lovable.app${raw.startsWith("/") ? "" : "/"}${raw}`) : null;
    const url = `https://aladeel-digital-dream.lovable.app/packages/${params.slug}`;
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
  component: PackagePage,
});

function PackagePage() {
  const { slug } = Route.useParams();
  const { pick, lang, t } = useI18n();
  const { add } = useCart();
  const navigate = useNavigate();
  const { data: pk, isLoading } = useQuery({
    queryKey: ["package", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("packages")
        .select("*, package_items(quantity, products(id, slug, name_en, name_ar, price, images))")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <div className="container-page py-20 text-muted-foreground">{t("loading")}</div>;
  if (!pk)
    return (
      <div className="container-page py-20">
        <Button asChild><Link to="/packages">{pick("All packages", "كل الباقات")}</Link></Button>
      </div>
    );

  const worth = pk.package_items.reduce((n, i) => n + Number(i.products?.price ?? 0) * i.quantity, 0);
  const addPkg = () => {
    add({ productId: null, packageId: pk.id, slug: pk.slug, name_en: pk.name_en, name_ar: pk.name_ar, price: Number(pk.price), image: pk.image_url });
    toast.success(t("added"));
  };

  return (
    <div className="container-page py-10">
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="aspect-[4/3] overflow-hidden rounded-lg border border-border bg-sand">
          {pk.image_url && <img src={pk.image_url} alt={`${pk.name_en} – furniture set UAE`} className="size-full object-cover" />}
        </div>
        <div>
          <h1 className="heading-section">{pick(pk.name_en, pk.name_ar)}</h1>
          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-semibold text-primary">{formatAed(Number(pk.price), lang)}</span>
            {worth > Number(pk.price) && <span className="text-lg text-muted-foreground line-through">{formatAed(worth, lang)}</span>}
          </div>
          {worth > Number(pk.price) && (
            <p className="mt-1 text-sm text-success">
              {pick("You save", "توفر")} {formatAed(worth - Number(pk.price), lang)}
            </p>
          )}
          <p className="text-sm text-muted-foreground">{t("vatIncluded")}</p>
          <p className="mt-5 text-sm text-muted-foreground">{pick(pk.description_en, pk.description_ar)}</p>

          <h2 className="mt-6 mb-3 font-semibold">{pick("Included in this package", "محتويات الباقة")}</h2>
          <ul className="space-y-3">
            {pk.package_items.map((i) =>
              i.products ? (
                <li key={i.products.id} className="flex items-center gap-3 rounded-md border border-border p-2">
                  <div className="size-14 shrink-0 overflow-hidden rounded bg-sand">
                    {i.products.images[0] && <img src={i.products.images[0]} alt={i.products.name_en} loading="lazy" className="size-full object-cover" />}
                  </div>
                  <Link to="/product/$slug" params={{ slug: i.products.slug }} className="flex-1 text-sm hover:text-primary">
                    {pick(i.products.name_en, i.products.name_ar)} × {i.quantity}
                  </Link>
                </li>
              ) : null,
            )}
          </ul>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" onClick={addPkg}>{t("addToCart")}</Button>
            <Button size="lg" variant="secondary" onClick={() => { addPkg(); navigate({ to: "/checkout" }); }}>
              {t("buyNow")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
