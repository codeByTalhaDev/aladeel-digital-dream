import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { useCart } from "@/lib/cart";
import { formatAed, useI18n } from "@/lib/i18n";
import type { Product } from "@/lib/shop";
import { Button } from "@/components/ui/button";
import { WishlistButton } from "@/components/WishlistButton";
import { ShoppingBag } from "lucide-react";

export function ProductCard({ product }: { product: Product }) {
  const { t, lang, pick } = useI18n();
  const { add } = useCart();
  const name = pick(product.name_en, product.name_ar);
  const discount =
    product.compare_at_price && product.compare_at_price > product.price
      ? Math.round((1 - product.price / product.compare_at_price) * 100)
      : null;
  const unavailable = product.stock_status === "out_of_stock" || product.stock_qty <= 0;

  return (
    <article className="card-product group flex flex-col">
      <Link
        to="/product/$slug"
        params={{ slug: product.slug }}
        className="relative block aspect-square overflow-hidden bg-sand"
      >
        {product.images[0] && (
          <img
            src={product.images[0]}
            alt={`${product.name_en} – furniture UAE`}
            loading="lazy"
            className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />
        )}
        {discount && (
          <span className="absolute start-3 top-3 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
            -{discount}%
          </span>
        )}
        <WishlistButton productId={product.id} className="absolute bottom-3 end-3" />
        {product.stock_status === "made_to_order" && (
          <span className="absolute end-3 top-3 rounded-full bg-brass px-2.5 py-1 text-xs font-medium text-brass-foreground">
            {t("madeToOrder")}
          </span>
        )}
        {unavailable && (
          <span className="absolute inset-x-3 bottom-3 rounded-md bg-background/90 px-3 py-2 text-center text-xs font-semibold text-foreground shadow-sm backdrop-blur-sm">
            {t("outOfStock")}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <Link
          to="/product/$slug"
          params={{ slug: product.slug }}
          className="min-h-12 text-base font-semibold leading-6 transition-colors hover:text-primary"
        >
          {name}
        </Link>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-xl font-semibold text-primary">{formatAed(product.price, lang)}</span>
          {product.compare_at_price && product.compare_at_price > product.price && (
            <span className="text-sm text-muted-foreground line-through">
              {formatAed(product.compare_at_price, lang)}
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{t("vatIncluded")}</p>
        <Button
          className="mt-4 w-full"
          disabled={unavailable}
          onClick={() => {
            add({
              productId: product.id,
              slug: product.slug,
              name_en: product.name_en,
              name_ar: product.name_ar,
              price: Number(product.price),
              image: product.images[0] ?? null,
            });
            toast.success(t("added"));
          }}
        >
          <ShoppingBag />
          {t("addToCart")}
        </Button>
      </div>
    </article>
  );
}
