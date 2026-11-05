export const VAT_RATE = 0.05;
export const FREE_DELIVERY_THRESHOLD = 3000;
export const DELIVERY_FEE = 150;

export const WHATSAPP_NUMBER = "971503717658";
export const PHONE_PRIMARY = "050-37 17 658";
export const PHONE_SECONDARY = "055-99 97 049";
export const TRN = "100236311500003";

export const EMIRATES = [
  { value: "Ras Al Khaimah", en: "Ras Al Khaimah", ar: "رأس الخيمة" },
  { value: "Sharjah", en: "Sharjah", ar: "الشارقة" },
  { value: "Dubai", en: "Dubai", ar: "دبي" },
  { value: "Abu Dhabi", en: "Abu Dhabi", ar: "أبوظبي" },
  { value: "Ajman", en: "Ajman", ar: "عجمان" },
  { value: "Umm Al Quwain", en: "Umm Al Quwain", ar: "أم القيوين" },
  { value: "Fujairah", en: "Fujairah", ar: "الفجيرة" },
];

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "returned",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type Product = {
  id: string;
  slug: string;
  sku: string | null;
  category_id: string | null;
  name_en: string;
  name_ar: string;
  description_en: string | null;
  description_ar: string | null;
  price: number;
  compare_at_price: number | null;
  material: string | null;
  color: string | null;
  images: string[];
  stock_status: string;
  stock_qty: number;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
};

export type Category = {
  id: string;
  slug: string;
  name_en: string;
  name_ar: string;
  image_url: string | null;
  sort_order: number;
};

/** Displayed prices are VAT-inclusive, so split the VAT back out of the total. */
/** Delivery fee per emirate (AED), used below the free-delivery threshold. */
export const DELIVERY_BY_EMIRATE: Record<string, number> = {
  "Ras Al Khaimah": 100,
  "Umm Al Quwain": 120,
  Ajman: 130,
  Sharjah: 150,
  Dubai: 150,
  Fujairah: 180,
  "Abu Dhabi": 250,
};

export function deliveryFee(itemsTotal: number, emirate?: string): number {
  if (itemsTotal === 0 || itemsTotal >= FREE_DELIVERY_THRESHOLD) return 0;
  return (emirate ? DELIVERY_BY_EMIRATE[emirate] : undefined) ?? DELIVERY_FEE;
}

export function totals(itemsTotal: number, emirate?: string) {
  const delivery = deliveryFee(itemsTotal, emirate);
  const grand = itemsTotal + delivery;
  const vat = Math.round((grand - grand / (1 + VAT_RATE)) * 100) / 100;
  // subtotal (excl. VAT) + VAT + delivery must equal the grand total
  const subtotal = Math.round((grand - vat - delivery) * 100) / 100;
  return { subtotal, vat, delivery, grand };
}

export function whatsappLink(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

/** One availability rule for cards and the product page. Made-to-order items never run out. */
export function isAvailable(p: { stock_status: string; stock_qty: number }) {
  if (p.stock_status === "out_of_stock") return false;
  if (p.stock_status === "made_to_order") return true;
  return p.stock_qty > 0;
}
