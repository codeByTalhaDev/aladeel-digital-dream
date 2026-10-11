import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Lang = "en" | "ar";

const dict = {
  brand: { en: "Al Adeel Furniture", ar: "مفروشات العديل" },
  tagline: {
    en: "Bedroom Sets, Kitchen, TV Stand, Majlis, Sofa Set & Order Suppliers",
    ar: "غرف نوم، مطبخ، طاولة تلفزيون، مجلس، طقم كنب وتفصيل حسب الطلب",
  },
  home: { en: "Home", ar: "الرئيسية" },
  shop: { en: "Shop", ar: "المتجر" },
  categories: { en: "Categories", ar: "الأقسام" },
  about: { en: "About", ar: "من نحن" },
  contact: { en: "Contact", ar: "اتصل بنا" },
  cart: { en: "Cart", ar: "السلة" },
  account: { en: "My Account", ar: "حسابي" },
  admin: { en: "Admin", ar: "الإدارة" },
  signIn: { en: "Sign in", ar: "تسجيل الدخول" },
  signOut: { en: "Sign out", ar: "تسجيل الخروج" },
  signUp: { en: "Create account", ar: "إنشاء حساب" },
  email: { en: "Email", ar: "البريد الإلكتروني" },
  password: { en: "Password", ar: "كلمة المرور" },
  forgotPassword: { en: "Forgot password?", ar: "نسيت كلمة المرور؟" },
  resetPassword: { en: "Reset password", ar: "إعادة تعيين كلمة المرور" },
  sendResetLink: { en: "Send reset link", ar: "إرسال رابط إعادة التعيين" },
  resetEmailSent: { en: "If an account exists for this email, a reset link has been sent.", ar: "إذا كان هناك حساب بهذا البريد، فقد تم إرسال رابط إعادة التعيين." },
  newPassword: { en: "New password", ar: "كلمة المرور الجديدة" },
  confirmPassword: { en: "Confirm password", ar: "تأكيد كلمة المرور" },
  passwordsDontMatch: { en: "Passwords do not match.", ar: "كلمتا المرور غير متطابقتين." },
  passwordUpdated: { en: "Password updated. You are now signed in.", ar: "تم تحديث كلمة المرور. تم تسجيل دخولك الآن." },
  backToSignIn: { en: "Back to sign in", ar: "العودة لتسجيل الدخول" },
  fullName: { en: "Full name", ar: "الاسم الكامل" },
  phone: { en: "Phone", ar: "رقم الهاتف" },
  heroTitle: { en: "Furniture made for UAE homes", ar: "أثاث يليق ببيوت الإمارات" },
  heroSub: {
    en: "Sofas, majlis, bedrooms and fitted kitchens — delivered and assembled across the UAE from our Ras Al Khaimah showroom.",
    ar: "كنب، مجالس، غرف نوم ومطابخ تفصيل — توصيل وتركيب في جميع أنحاء الإمارات من معرضنا في رأس الخيمة.",
  },
  shopNow: { en: "Shop now", ar: "تسوق الآن" },
  whatsappUs: { en: "WhatsApp us", ar: "واتساب" },
  bestSellers: { en: "Best sellers", ar: "الأكثر مبيعاً" },
  newArrivals: { en: "New arrivals", ar: "وصل حديثاً" },
  shopByCategory: { en: "Shop by category", ar: "تسوق حسب القسم" },
  viewAll: { en: "View all", ar: "عرض الكل" },
  addToCart: { en: "Add to cart", ar: "أضف إلى السلة" },
  buyNow: { en: "Buy now", ar: "اشترِ الآن" },
  added: { en: "Added to cart", ar: "تمت الإضافة إلى السلة" },
  inStock: { en: "In stock", ar: "متوفر" },
  madeToOrder: { en: "Made to order", ar: "حسب الطلب" },
  outOfStock: { en: "Out of stock", ar: "غير متوفر" },
  price: { en: "Price", ar: "السعر" },
  vatIncluded: { en: "VAT 5% included", ar: "شامل ضريبة القيمة المضافة ٥٪" },
  filters: { en: "Filters", ar: "تصفية" },
  allCategories: { en: "All categories", ar: "كل الأقسام" },
  sortBy: { en: "Sort by", ar: "الترتيب" },
  newest: { en: "Newest", ar: "الأحدث" },
  priceLow: { en: "Price: low to high", ar: "السعر: من الأقل" },
  priceHigh: { en: "Price: high to low", ar: "السعر: من الأعلى" },
  maxPrice: { en: "Max price", ar: "أعلى سعر" },
  noProducts: { en: "No products match your filters.", ar: "لا توجد منتجات مطابقة." },
  catalogUnavailable: { en: "We couldn’t load the products", ar: "تعذر تحميل المنتجات" },
  catalogUnavailableBody: {
    en: "Please check your connection and try again.",
    ar: "يرجى التحقق من اتصالك والمحاولة مرة أخرى.",
  },
  tryAgain: { en: "Try again", ar: "حاول مرة أخرى" },
  relatedProducts: { en: "You may also like", ar: "قد يعجبك أيضاً" },
  description: { en: "Description", ar: "الوصف" },
  deliveryEstimate: {
    en: "Delivery in 2–5 days across the UAE. Assembly included.",
    ar: "التوصيل خلال ٢-٥ أيام في جميع الإمارات. التركيب مشمول.",
  },
  yourCart: { en: "Your cart", ar: "سلة التسوق" },
  emptyCart: { en: "Your cart is empty.", ar: "سلة التسوق فارغة." },
  quantity: { en: "Qty", ar: "الكمية" },
  remove: { en: "Remove", ar: "إزالة" },
  subtotal: { en: "Subtotal (excl. VAT)", ar: "المجموع قبل الضريبة" },
  vat: { en: "VAT 5%", ar: "ضريبة ٥٪" },
  deliveryFee: { en: "Delivery fee", ar: "رسوم التوصيل" },
  free: { en: "Free", ar: "مجاني" },
  total: { en: "Total", ar: "الإجمالي" },
  checkout: { en: "Checkout", ar: "إتمام الشراء" },
  continueShopping: { en: "Continue shopping", ar: "متابعة التسوق" },
  deliveryDetails: { en: "Delivery details", ar: "بيانات التوصيل" },
  emirate: { en: "Emirate", ar: "الإمارة" },
  area: { en: "Area", ar: "المنطقة" },
  address: { en: "Address", ar: "العنوان" },
  landmark: { en: "Nearest landmark", ar: "أقرب علامة مميزة" },
  preferredDate: { en: "Preferred delivery date", ar: "تاريخ التوصيل المفضل" },
  timeSlot: { en: "Time slot", ar: "الفترة" },
  morning: { en: "Morning (9am – 1pm)", ar: "صباحاً (٩ - ١)" },
  afternoon: { en: "Afternoon (1pm – 5pm)", ar: "ظهراً (١ - ٥)" },
  evening: { en: "Evening (5pm – 9pm)", ar: "مساءً (٥ - ٩)" },
  paymentMethod: { en: "Payment method", ar: "طريقة الدفع" },
  cod: { en: "Cash on delivery", ar: "الدفع عند الاستلام" },
  bankTransfer: { en: "Bank transfer", ar: "تحويل بنكي" },
  bankTransferNote: {
    en: "Transfer the total to our bank account and send the receipt on WhatsApp. We confirm your order once the payment arrives.",
    ar: "حوّل المبلغ الإجمالي إلى حسابنا البنكي وأرسل الإيصال عبر واتساب. نؤكد طلبك عند وصول الدفعة.",
  },
  bankDetails: { en: "Bank details", ar: "التفاصيل البنكية" },
  cardSoon: { en: "Card payment (coming soon)", ar: "الدفع بالبطاقة (قريباً)" },
  notes: { en: "Order notes", ar: "ملاحظات" },
  placeOrder: { en: "Place order", ar: "تأكيد الطلب" },
  orderPlaced: { en: "Thank you! Your order is confirmed.", ar: "شكراً لك! تم تأكيد طلبك." },
  orderNumber: { en: "Order number", ar: "رقم الطلب" },
  weWillCall: {
    en: "Our team will call you shortly to confirm the delivery time.",
    ar: "سيتصل بك فريقنا قريباً لتأكيد موعد التوصيل.",
  },
  myOrders: { en: "My orders", ar: "طلباتي" },
  noOrders: { en: "You have no orders yet.", ar: "لا توجد طلبات بعد." },
  status: { en: "Status", ar: "الحالة" },
  orders: { en: "Orders", ar: "الطلبات" },
  products: { en: "Products", ar: "المنتجات" },
  addProduct: { en: "Add product", ar: "إضافة منتج" },
  editProduct: { en: "Edit product", ar: "تعديل منتج" },
  save: { en: "Save", ar: "حفظ" },
  cancel: { en: "Cancel", ar: "إلغاء" },
  delete: { en: "Delete", ar: "حذف" },
  adminOnly: { en: "This area is for staff only.", ar: "هذه الصفحة لموظفي المتجر فقط." },
  pending: { en: "Pending", ar: "قيد المراجعة" },
  confirmed: { en: "Confirmed", ar: "مؤكد" },
  out_for_delivery: { en: "Out for delivery", ar: "قيد التوصيل" },
  delivered: { en: "Delivered", ar: "تم التوصيل" },
  cancelled: { en: "Cancelled", ar: "ملغي" },
  returned: { en: "Returned", ar: "مرتجع" },
  trustDelivery: { en: "Delivery across all Emirates", ar: "توصيل لجميع الإمارات" },
  trustAssembly: { en: "Free assembly by our own team", ar: "تركيب مجاني بواسطة فريقنا" },
  trustCustom: { en: "Custom sizes & fabrics made to order", ar: "مقاسات وأقمشة حسب الطلب" },
  trustVat: { en: "All prices include 5% VAT", ar: "جميع الأسعار شاملة ضريبة ٥٪" },
  visitShowroom: { en: "Visit our showroom", ar: "زر معرضنا" },
  addressLine: {
    en: "Almaemura, Sheikh Salem Bin Sultan Street, Ras Al Khaimah, U.A.E.",
    ar: "المعمورة، شارع الشيخ سالم بن سلطان، رأس الخيمة، الإمارات",
  },
  trn: { en: "TRN: 100236311500003", ar: "الرقم الضريبي: ١٠٠٢٣٦٣١١٥٠٠٠٠٣" },
  aboutTitle: { en: "About Al Adeel Furniture", ar: "عن مفروشات العديل" },
  aboutBody: {
    en: "Al Adeel Furniture has been furnishing homes and majlises in Ras Al Khaimah and across the UAE with sofa sets, bedroom sets, kitchens, TV stands and custom-made pieces. Everything we sell is delivered and assembled by our own team.",
    ar: "مفروشات العديل تؤثث البيوت والمجالس في رأس الخيمة وجميع أنحاء الإمارات بأطقم الكنب وغرف النوم والمطابخ وطاولات التلفزيون والقطع المفصلة حسب الطلب. جميع مشترياتك يتم توصيلها وتركيبها بواسطة فريقنا.",
  },
  deliveryPolicy: { en: "Delivery & assembly", ar: "التوصيل والتركيب" },
  deliveryPolicyBody: {
    en: "Free delivery on orders above AED 3,000 within the UAE. Below that a flat AED 150 delivery fee applies. Ready items are delivered within 2–5 days; made-to-order pieces take 2–3 weeks.",
    ar: "توصيل مجاني للطلبات فوق ٣٠٠٠ درهم داخل الإمارات، وأقل من ذلك رسوم ١٥٠ درهم. القطع الجاهزة خلال ٢-٥ أيام، والقطع حسب الطلب خلال ٢-٣ أسابيع.",
  },
  returnsPolicy: { en: "Returns & exchange", ar: "الاستبدال والإرجاع" },
  returnsPolicyBody: {
    en: "Ready-stock items can be exchanged within 7 days if unused and in original condition. Made-to-order and custom pieces are not returnable.",
    ar: "يمكن استبدال القطع الجاهزة خلال ٧ أيام إذا كانت غير مستعملة وبحالتها الأصلية. القطع المفصلة حسب الطلب غير قابلة للإرجاع.",
  },
  callUs: { en: "Call us", ar: "اتصل بنا" },
  required: { en: "Please fill in all required fields.", ar: "يرجى تعبئة جميع الحقول المطلوبة." },
  loading: { en: "Loading…", ar: "جاري التحميل…" },
} as const;

export type TKey = keyof typeof dict;

type Ctx = {
  lang: Lang;
  dir: "ltr" | "rtl";
  t: (key: TKey) => string;
  setLang: (lang: Lang) => void;
  pick: (en: string | null | undefined, ar: string | null | undefined) => string;
};

// Keep a single context instance across hot reloads to avoid "outside provider" errors.
const g = globalThis as unknown as { __alAdeelI18nCtx?: React.Context<Ctx | null> };
const I18nContext = g.__alAdeelI18nCtx ?? (g.__alAdeelI18nCtx = createContext<Ctx | null>(null));

function readStoredLang(): Lang | null {
  const stored = window.localStorage.getItem("aladeel-lang");
  if (stored === "ar" || stored === "en") return stored;
  const cookie = document.cookie.match(/(?:^|;\s*)aladeel-lang=(ar|en)(?:;|$)/);
  return cookie ? (cookie[1] as Lang) : null;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const stored = readStoredLang();
    if (stored) setLangState(stored);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    window.localStorage.setItem("aladeel-lang", next);
    // Cookie mirrors the choice so the server can render the right language/direction.
    document.cookie = `aladeel-lang=${next}; path=/; max-age=31536000; samesite=lax`;
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      lang,
      dir: lang === "ar" ? "rtl" : "ltr",
      setLang,
      t: (key) => dict[key][lang],
      pick: (en, ar) => (lang === "ar" ? ar || en || "" : en || ar || ""),
    }),
    [lang, setLang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}

export function formatAed(amount: number, lang: Lang) {
  return new Intl.NumberFormat(lang === "ar" ? "ar-AE" : "en-AE", {
    style: "currency",
    currency: "AED",
    maximumFractionDigits: 0,
  }).format(amount);
}
