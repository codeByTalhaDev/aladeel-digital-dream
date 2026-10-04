import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

export function PolicyPage({ slug }: { slug: "privacy" | "terms" | "returns" }) {
  const { pick } = useI18n();
  const { data } = useQuery({
    queryKey: ["site-page", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_pages").select("*").eq("slug", slug).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const body = data ? pick(data.body_en, data.body_ar) : "";
  return (
    <div className="container-page max-w-3xl py-12">
      <h1 className="heading-section mb-6">{data ? pick(data.title_en, data.title_ar) : "…"}</h1>
      {data && (
        body.trim() ? (
          <div className="whitespace-pre-line leading-relaxed text-muted-foreground">{body}</div>
        ) : (
          <p className="text-muted-foreground">{pick("This page is being updated. Please contact us for details.", "يتم تحديث هذه الصفحة. يرجى التواصل معنا للتفاصيل.")}</p>
        )
      )}
    </div>
  );
}
