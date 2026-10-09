import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatAed, useI18n, type TKey } from "@/lib/i18n";
import { useAuth, useIsAdmin } from "@/lib/useAuth";
import { ORDER_STATUSES, type Category, type Product } from "@/lib/shop";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnalyticsPanel, CouponsPanel, PackagesPanel, PagesPanel, VariantsEditor } from "@/components/admin/AdminExtras";

type OrderRow = {
  id: string;
  order_number: number;
  created_at: string;
  status: string;
  payment_status: string;
  total: number;
  customer_name: string;
  customer_phone: string;
  emirate: string;
  area: string;
  address: string;
};

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin | Al Adeel Furniture" },
      { name: "description", content: "Manage the Al Adeel Furniture catalogue and customer orders." },
      { property: "og:title", content: "Admin | Al Adeel Furniture" },
      { property: "og:description", content: "Store management for Al Adeel Furniture staff." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Admin,
});

const emptyProduct = {
  id: "",
  slug: "",
  sku: "",
  category_id: "",
  name_en: "",
  name_ar: "",
  description_en: "",
  description_ar: "",
  price: "",
  compare_at_price: "",
  material: "",
  color: "",
  images: "",
  stock_status: "in_stock",
  stock_qty: "0",
  is_featured: false,
  is_active: true,
};

function Admin() {
  const { t, lang, pick } = useI18n();
  const { user } = useAuth();
  const { isAdmin, checked } = useIsAdmin(user?.id);
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<typeof emptyProduct | null>(null);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("sort_order");
      if (error) throw error;
      return data as Category[];
    },
  });

  const { data: products } = useQuery({
    queryKey: ["admin-products"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Product[];
    },
  });

  const { data: orders } = useQuery({
    queryKey: ["admin-orders"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, created_at, status, payment_status, total, customer_name, customer_phone, emirate, area, address")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as OrderRow[];
    },
  });

  const saveProduct = useMutation({
    mutationFn: async (p: typeof emptyProduct) => {
      const payload = {
        slug: p.slug.trim(),
        sku: p.sku.trim() || null,
        category_id: p.category_id || null,
        name_en: p.name_en.trim(),
        name_ar: p.name_ar.trim(),
        description_en: p.description_en.trim() || null,
        description_ar: p.description_ar.trim() || null,
        price: Number(p.price),
        compare_at_price: p.compare_at_price ? Number(p.compare_at_price) : null,
        material: p.material.trim() || null,
        color: p.color.trim() || null,
        images: p.images
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        stock_status: p.stock_status,
        stock_qty: Number(p.stock_qty) || 0,
        is_featured: p.is_featured,
        is_active: p.is_active,
      };
      const { error } = p.id
        ? await supabase.from("products").update(payload).eq("id", p.id)
        : await supabase.from("products").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Saved");
      setDraft(null);
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Order updated");
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!checked) return <div className="container-page py-20 text-muted-foreground">{t("loading")}</div>;
  if (!isAdmin) return <div className="container-page py-20">{t("adminOnly")}</div>;

  return (
    <div className="container-page py-12">
      <h1 className="heading-section mb-8">{t("admin")}</h1>

      <AnalyticsPanel />
      <Tabs defaultValue="orders">
        <TabsList className="flex h-auto flex-wrap">
          <TabsTrigger value="orders">{t("orders")}</TabsTrigger>
          <TabsTrigger value="products">{t("products")}</TabsTrigger>
          <TabsTrigger value="packages">Packages</TabsTrigger>
          <TabsTrigger value="coupons">Coupons</TabsTrigger>
          <TabsTrigger value="pages">Policy pages</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="mt-6 space-y-3">
          {orders?.length === 0 && <p className="text-muted-foreground">{t("noOrders")}</p>}
          {orders?.map((o) => (
            <div key={o.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">
                    #{o.order_number} · {o.customer_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {o.customer_phone} · {o.emirate}, {o.area} · {o.address}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(o.created_at).toLocaleString(lang === "ar" ? "ar-AE" : "en-AE")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{formatAed(Number(o.total), lang)}</span>
                  <select
                    value={o.status}
                    onChange={(e) => updateStatus.mutate({ id: o.id, status: e.target.value })}
                    className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                  >
                    {ORDER_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {t(s as TKey)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="products" className="mt-6">
          <Button asChild>
            <Link to="/admin/products/new">{t("addProduct")}</Link>
          </Button>

          {draft && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveProduct.mutate(draft);
              }}
              className="mt-6 grid gap-4 rounded-lg border border-border bg-card p-5 sm:grid-cols-2"
            >
              <F label="Slug">
                <Input value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} required />
              </F>
              <F label="SKU">
                <Input value={draft.sku} onChange={(e) => setDraft({ ...draft, sku: e.target.value })} />
              </F>
              <F label="Name (English)">
                <Input
                  value={draft.name_en}
                  onChange={(e) => setDraft({ ...draft, name_en: e.target.value })}
                  required
                />
              </F>
              <F label="الاسم (عربي)">
                <Input
                  value={draft.name_ar}
                  onChange={(e) => setDraft({ ...draft, name_ar: e.target.value })}
                  required
                />
              </F>
              <F label="Description (English)">
                <Textarea
                  value={draft.description_en}
                  onChange={(e) => setDraft({ ...draft, description_en: e.target.value })}
                />
              </F>
              <F label="الوصف (عربي)">
                <Textarea
                  value={draft.description_ar}
                  onChange={(e) => setDraft({ ...draft, description_ar: e.target.value })}
                />
              </F>
              <F label="Price (AED, incl. VAT)">
                <Input
                  type="number"
                  value={draft.price}
                  onChange={(e) => setDraft({ ...draft, price: e.target.value })}
                  required
                />
              </F>
              <F label="Compare-at price">
                <Input
                  type="number"
                  value={draft.compare_at_price}
                  onChange={(e) => setDraft({ ...draft, compare_at_price: e.target.value })}
                />
              </F>
              <F label="Category">
                <select
                  value={draft.category_id}
                  onChange={(e) => setDraft({ ...draft, category_id: e.target.value })}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">—</option>
                  {categories?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {pick(c.name_en, c.name_ar)}
                    </option>
                  ))}
                </select>
              </F>
              <F label="Stock status">
                <select
                  value={draft.stock_status}
                  onChange={(e) => setDraft({ ...draft, stock_status: e.target.value })}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="in_stock">{t("inStock")}</option>
                  <option value="made_to_order">{t("madeToOrder")}</option>
                  <option value="out_of_stock">{t("outOfStock")}</option>
                </select>
              </F>
              <F label="Stock quantity">
                <Input
                  type="number"
                  value={draft.stock_qty}
                  onChange={(e) => setDraft({ ...draft, stock_qty: e.target.value })}
                />
              </F>
              <F label="Material">
                <Input value={draft.material} onChange={(e) => setDraft({ ...draft, material: e.target.value })} />
              </F>
              <F label="Colour">
                <Input value={draft.color} onChange={(e) => setDraft({ ...draft, color: e.target.value })} />
              </F>
              <F label="Image URLs (comma separated)">
                <Input value={draft.images} onChange={(e) => setDraft({ ...draft, images: e.target.value })} />
              </F>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={draft.is_featured}
                  onChange={(e) => setDraft({ ...draft, is_featured: e.target.checked })}
                />
                Featured
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={draft.is_active}
                  onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })}
                />
                Active
              </label>
              <div className="sm:col-span-2">
                {draft.id ? (
                  <VariantsEditor productId={draft.id} basePrice={Number(draft.price) || 0} />
                ) : (
                  <p className="text-xs text-muted-foreground">Save the product first, then edit it to add colour / fabric / size options.</p>
                )}
              </div>
              <div className="flex gap-2 sm:col-span-2">
                <Button type="submit" disabled={saveProduct.isPending}>
                  {t("save")}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setDraft(null)}>
                  {t("cancel")}
                </Button>
              </div>
            </form>
          )}

          <div className="mt-6 space-y-3">
            {products?.map((p) => (
              <div
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="size-12 overflow-hidden rounded bg-sand">
                    {p.images[0] && <img src={p.images[0]} alt="" loading="lazy" className="size-full object-cover" />}
                  </div>
                  <div>
                    <p className="font-medium">{pick(p.name_en, p.name_ar)}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.slug} · {formatAed(Number(p.price), lang)} {p.is_active ? "" : "· hidden"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      setDraft({
                        id: p.id,
                        slug: p.slug,
                        sku: p.sku ?? "",
                        category_id: p.category_id ?? "",
                        name_en: p.name_en,
                        name_ar: p.name_ar,
                        description_en: p.description_en ?? "",
                        description_ar: p.description_ar ?? "",
                        price: String(p.price),
                        compare_at_price: p.compare_at_price ? String(p.compare_at_price) : "",
                        material: p.material ?? "",
                        color: p.color ?? "",
                        images: p.images.join(", "),
                        stock_status: p.stock_status,
                        stock_qty: String(p.stock_qty),
                        is_featured: p.is_featured,
                        is_active: p.is_active,
                      })
                    }
                  >
                    {t("editProduct")}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteProduct.mutate(p.id)}>
                    {t("delete")}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="packages" className="mt-6"><PackagesPanel products={products ?? []} /></TabsContent>
        <TabsContent value="coupons" className="mt-6"><CouponsPanel /></TabsContent>
        <TabsContent value="pages" className="mt-6"><PagesPanel /></TabsContent>
      </Tabs>
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
