import { describe, expect, it } from "vitest";
import { isAvailable, totals } from "./shop";

describe("totals", () => {
  it("adds up: subtotal + VAT + delivery = grand", () => {
    const t = totals(1650);
    expect(t.grand).toBe(1800);
    expect(t.delivery).toBe(150);
    expect(Math.round((t.subtotal + t.vat + t.delivery) * 100) / 100).toBe(1800);
  });
  it("free delivery above threshold", () => {
    const t = totals(3000);
    expect(t.delivery).toBe(0);
    expect(t.grand).toBe(3000);
  });
  it("empty cart is zero", () => expect(totals(0).grand).toBe(0));
});

describe("isAvailable", () => {
  it("made to order is always available", () =>
    expect(isAvailable({ stock_status: "made_to_order", stock_qty: 0 })).toBe(true));
  it("in stock with zero qty is not", () => expect(isAvailable({ stock_status: "in_stock", stock_qty: 0 })).toBe(false));
});
