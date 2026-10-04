import { Heart } from "lucide-react";
import { useWishlist } from "@/lib/wishlist";
import { cn } from "@/lib/utils";

export function WishlistButton({ productId, className }: { productId: string; className?: string }) {
  const { has, toggle } = useWishlist();
  const active = has(productId);
  return (
    <button
      type="button"
      aria-label={active ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={active}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(productId);
      }}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-full border border-border bg-background/90 transition-colors hover:text-primary",
        className,
      )}
    >
      <Heart className={cn("size-4", active && "fill-primary text-primary")} />
    </button>
  );
}
