import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CartItem = {
  /** Unique line key: product + variant, or package */
  key: string;
  productId: string | null;
  variantId?: string | null;
  variantLabel?: string | null;
  packageId?: string | null;
  slug: string;
  name_en: string;
  name_ar: string;
  price: number;
  image: string | null;
  qty: number;
};

type NewItem = Omit<CartItem, "qty" | "key">;

type Ctx = {
  items: CartItem[];
  count: number;
  itemsTotal: number;
  add: (item: NewItem, qty?: number) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
};

const CartContext = createContext<Ctx | null>(null);
const KEY = "aladeel-cart-v2";

export function lineKey(i: NewItem) {
  return i.packageId ? `pkg:${i.packageId}` : `p:${i.productId}:${i.variantId ?? ""}`;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw) as CartItem[]);
    } catch {
      /* ignore malformed cart */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) window.localStorage.setItem(KEY, JSON.stringify(items));
  }, [items, loaded]);

  const value = useMemo<Ctx>(() => {
    return {
      items,
      count: items.reduce((n, i) => n + i.qty, 0),
      itemsTotal: items.reduce((n, i) => n + i.qty * i.price, 0),
      add: (item, qty = 1) =>
        setItems((prev) => {
          const key = lineKey(item);
          const found = prev.find((i) => i.key === key);
          if (found) return prev.map((i) => (i.key === key ? { ...i, qty: i.qty + qty } : i));
          return [...prev, { ...item, key, qty }];
        }),
      setQty: (key, qty) =>
        setItems((prev) =>
          qty <= 0 ? prev.filter((i) => i.key !== key) : prev.map((i) => (i.key === key ? { ...i, qty } : i)),
        ),
      remove: (key) => setItems((prev) => prev.filter((i) => i.key !== key)),
      clear: () => setItems([]),
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
