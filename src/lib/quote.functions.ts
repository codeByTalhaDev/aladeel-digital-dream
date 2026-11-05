import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { rateLimit, clientIp } from "./ratelimit.server";

const quoteSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(7).max(20),
  email: z.string().trim().email().max(255).or(z.literal("")),
  emirate: z.string().trim().max(40).optional().default(""),
  details: z.string().trim().min(5).max(2000),
  // Honeypot: real visitors never fill this; bots do.
  company: z.string().max(0).optional().default(""),
});

const QUOTE_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const QUOTE_MAX_BURST = 3; // per IP per hour (in-memory)
const QUOTE_MAX_DAILY = 5; // per IP per 24h (stored, survives restarts)

export const submitQuote = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => quoteSchema.parse(d))
  .handler(async ({ data }) => {
    // Honeypot tripped: pretend success so bots do not retry.
    if (data.company) return { ok: true as const };

    if (!rateLimit("quote", QUOTE_MAX_BURST, QUOTE_WINDOW_MS)) {
      throw new Error("Too many requests. Please try again later.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ip = clientIp();
    const since = new Date(Date.now() - 24 * QUOTE_WINDOW_MS).toISOString();
    const { count, error: cntErr } = await supabaseAdmin
      .from("quote_requests")
      .select("id", { count: "exact", head: true })
      .eq("client_ip", ip)
      .gte("created_at", since);
    if (!cntErr && (count ?? 0) >= QUOTE_MAX_DAILY) {
      throw new Error("Too many requests. Please try again tomorrow.");
    }

    const { error } = await supabaseAdmin.from("quote_requests").insert({
      name: data.name,
      phone: data.phone,
      email: data.email || null,
      emirate: data.emirate || null,
      details: data.details,
      client_ip: ip,
    });
    if (error) {
      console.error("quote insert failed", error);
      throw new Error("Could not send. Please try again.");
    }
    return { ok: true as const };
  });
