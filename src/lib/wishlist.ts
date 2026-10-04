import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useWishlist() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: ids = [] } = useQuery({
    queryKey: ["wishlist-ids", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase.from("wishlists").select("product_id");
      if (error) throw error;
      return data.map((r) => r.product_id);
    },
  });

  const toggle = useMutation({
    mutationFn: async (productId: string) => {
      if (!user) throw new Error("signin");
      if (ids.includes(productId)) {
        const { error } = await supabase.from("wishlists").delete().eq("product_id", productId).eq("user_id", user.id);
        if (error) throw error;
        return false;
      }
      const { error } = await supabase.from("wishlists").insert({ user_id: user.id, product_id: productId });
      if (error) throw error;
      return true;
    },
    onSuccess: (added) => {
      toast.success(added ? "Saved to wishlist" : "Removed from wishlist");
      qc.invalidateQueries({ queryKey: ["wishlist-ids"] });
      qc.invalidateQueries({ queryKey: ["wishlist"] });
    },
    onError: (e: Error) => {
      if (e.message === "signin") {
        toast("Sign in to save items");
        navigate({ to: "/auth" });
      } else toast.error(e.message);
    },
  });

  return { ids, has: (id: string) => ids.includes(id), toggle: (id: string) => toggle.mutate(id), signedIn: !!user };
}
