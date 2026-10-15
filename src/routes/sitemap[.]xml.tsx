import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

const SITE = "https://aladeel-digital-dream.lovable.app";
const STATIC = ["/", "/shop", "/packages", "/about", "/contact", "/privacy", "/terms", "/returns"];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const [{ data: products }, { data: packages }] = await Promise.all([
          supabase.from("products").select("slug").eq("is_active", true),
          supabase.from("packages").select("slug").eq("is_active", true),
        ]);
        const urls = [
          ...STATIC,
          ...(products ?? []).map((p) => `/product/${p.slug}`),
          ...(packages ?? []).map((p) => `/packages/${p.slug}`),
        ];
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
          .map((u) => `  <url><loc>${SITE}${u}</loc></url>`)
          .join("\n")}\n</urlset>`;
        return new Response(xml, { headers: { "Content-Type": "application/xml" } });
      },
    },
  },
});
