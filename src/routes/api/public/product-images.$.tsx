import { createFileRoute } from "@tanstack/react-router";
import { rateLimit } from "@/lib/ratelimit.server";

const ALLOWED_EXT = new Set(["jpg", "jpeg", "png", "webp", "gif", "avif"]);
const SEGMENT_RE = /^[A-Za-z0-9._-]+$/;

function parsePath(pathname: string): string | null {
  const prefix = "/api/public/product-images/";
  if (!pathname.startsWith(prefix)) return null;
  let raw: string;
  try {
    raw = decodeURIComponent(pathname.slice(prefix.length));
  } catch {
    return null;
  }
  if (!raw || raw.length > 256 || raw.includes("/") || raw.includes("\\")) return null;
  const parts = raw.split("/");
  if (parts.length !== 1) return null;
  for (const part of parts) {
    if (!part || part === "." || part === ".." || !SEGMENT_RE.test(part)) return null;
  }
  const ext = raw.split(".").pop()?.toLowerCase();
  if (!ext || !ALLOWED_EXT.has(ext)) return null;
  return raw;
}

/**
 * Public proxy for product photos stored in the private product-images bucket.
 * Validates the object path, rate-limits callers, then streams the image bytes
 * through the app. The bucket itself has no public read policy.
 */
export const Route = createFileRoute("/api/public/product-images/$")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const objectPath = parsePath(url.pathname);
        if (!objectPath) {
          return new Response("Not found", { status: 404 });
        }
        if (!rateLimit("product-image", 240, 5 * 60 * 1000)) {
          return new Response("Too many requests", { status: 429 });
        }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.storage.from("product-images").download(objectPath);
        if (error || !data) {
          return new Response("Not found", { status: 404 });
        }
        const ext = objectPath.split(".").pop()!.toLowerCase();
        const types: Record<string, string> = {
          jpg: "image/jpeg",
          jpeg: "image/jpeg",
          png: "image/png",
          webp: "image/webp",
          gif: "image/gif",
          avif: "image/avif",
        };
        const bytes = await data.arrayBuffer();
        return new Response(bytes, {
          status: 200,
          headers: {
            "Content-Type": types[ext] ?? "application/octet-stream",
            "Cache-Control": "public, max-age=86400",
          },
        });
      },
    },
  },
});
