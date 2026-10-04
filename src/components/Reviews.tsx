import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function Stars({ value, size = "size-4" }: { value: number; size?: string }) {
  return (
    <span className="inline-flex" aria-label={`${value.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={cn(size, n <= Math.round(value) ? "fill-brass text-brass" : "text-muted-foreground")} />
      ))}
    </span>
  );
}

export function useReviews(productId: string | undefined) {
  return useQuery({
    queryKey: ["reviews", productId],
    enabled: Boolean(productId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("id, user_id, author_name, rating, comment, created_at")
        .eq("product_id", productId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function Reviews({ productId }: { productId: string }) {
  const { pick, lang } = useI18n();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: reviews = [] } = useReviews(productId);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const mine = reviews.find((r) => r.user_id === user?.id);

  const submit = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const author = (user.user_metadata?.["full_name"] as string | undefined) || user.email?.split("@")[0] || "Customer";
      const { error } = await supabase.from("reviews").upsert(
        { product_id: productId, user_id: user.id, author_name: author.slice(0, 60), rating, comment: comment.trim().slice(0, 1000) || null },
        { onConflict: "product_id,user_id" },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(pick("Thanks for your review", "شكراً لتقييمك"));
      setComment("");
      qc.invalidateQueries({ queryKey: ["reviews", productId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const avg = reviews.length ? reviews.reduce((n, r) => n + r.rating, 0) / reviews.length : 0;

  return (
    <section className="mt-16">
      <h2 className="heading-section mb-2">{pick("Customer reviews", "آراء العملاء")}</h2>
      <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Stars value={avg} />
        <span>
          {reviews.length ? avg.toFixed(1) : "—"} · {reviews.length} {pick("reviews", "تقييم")}
        </span>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <ul className="space-y-4">
          {reviews.length === 0 && <p className="text-muted-foreground">{pick("No reviews yet.", "لا توجد تقييمات بعد.")}</p>}
          {reviews.map((r) => (
            <li key={r.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{r.author_name}</span>
                <Stars value={r.rating} />
              </div>
              {r.comment && <p className="mt-2 text-sm text-muted-foreground">{r.comment}</p>}
              <p className="mt-2 text-xs text-muted-foreground">
                {new Date(r.created_at).toLocaleDateString(lang === "ar" ? "ar-AE" : "en-AE")}
              </p>
            </li>
          ))}
        </ul>

        <div className="h-fit rounded-lg border border-border bg-card p-5">
          {user ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submit.mutate();
              }}
              className="space-y-3"
            >
              <p className="font-medium">{mine ? pick("Update your review", "عدّل تقييمك") : pick("Write a review", "اكتب تقييماً")}</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} stars`}>
                    <Star className={cn("size-6", n <= rating ? "fill-brass text-brass" : "text-muted-foreground")} />
                  </button>
                ))}
              </div>
              <Textarea value={comment} onChange={(e) => setComment(e.target.value)} maxLength={1000} placeholder={pick("Your experience…", "تجربتك…")} />
              <Button type="submit" disabled={submit.isPending}>
                {pick("Submit", "إرسال")}
              </Button>
            </form>
          ) : (
            <p className="text-sm text-muted-foreground">
              <Link to="/auth" className="font-medium text-primary underline">
                {pick("Sign in", "سجّل الدخول")}
              </Link>{" "}
              {pick("to write a review.", "لكتابة تقييم.")}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
