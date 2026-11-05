import { describe, expect, it } from "vitest";
import { quoteSchema } from "./quote.functions";

const valid = {
  name: "Ahmed",
  phone: "0501234567",
  email: "",
  emirate: "dubai",
  details: "Need a custom majlis 4x5 meters",
};

describe("quote schema", () => {
  it("accepts a normal quote request", () => {
    expect(quoteSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects when the honeypot field is filled (bot)", () => {
    const r = quoteSchema.safeParse({ ...valid, company: "SpamBot Ltd" });
    expect(r.success).toBe(false);
  });

  it("accepts an empty honeypot (real visitor)", () => {
    const r = quoteSchema.safeParse({ ...valid, company: "" });
    expect(r.success).toBe(true);
  });

  it("rejects details shorter than 5 chars", () => {
    const r = quoteSchema.safeParse({ ...valid, details: "hi" });
    expect(r.success).toBe(false);
  });

  it("rejects a name shorter than 2 chars", () => {
    const r = quoteSchema.safeParse({ ...valid, name: "A" });
    expect(r.success).toBe(false);
  });
});
