import { getRequestHeader } from "@tanstack/react-start/server";

type Bucket = { hits: number[] };

// In-memory sliding window, per server isolate. First layer against bursts.
const buckets = new Map<string, Bucket>();

function clientIp(): string {
  const fwd = getRequestHeader("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return getRequestHeader("cf-connecting-ip") ?? "unknown";
}

/**
 * Returns true when the caller is allowed, false when they are over the limit.
 * key: logical bucket name (e.g. "quote"), max: hits allowed, windowMs: window.
 */
export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const id = `${key}:${clientIp()}`;
  const now = Date.now();
  const b = buckets.get(id) ?? { hits: [] };
  b.hits = b.hits.filter((t) => now - t < windowMs);
  if (b.hits.length >= max) {
    buckets.set(id, b);
    return false;
  }
  b.hits.push(now);
  buckets.set(id, b);
  // Opportunistic cleanup so the map cannot grow unbounded.
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      if (v.hits.every((t) => now - t > windowMs)) buckets.delete(k);
    }
  }
  return true;
}

export { clientIp };
