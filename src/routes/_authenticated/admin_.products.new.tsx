import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useAuth, useIsAdmin } from "@/lib/useAuth";
import type { Category } from "@/lib/shop";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/admin_/products/new")({
  head: () => ({
    meta: [
      { title: "Add Product | Al Adeel Furniture" },
      { name: "description", content: "Add a new product to the Al Adeel Furniture catalogue." },
      { property: "og:title", content: "Add Product | Al Adeel Furniture" },
      { property: "og:description", content: "Add a new product to the store catalogue." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AddProduct,
});

function AddProduct() {
  const { t, pick } = useI18n();
  const { user } = useAuth();
  const { isAdmin, checked } = useIsAdmin(user?.id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [draft, setDraft] = useState({
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
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("sort_order");
      if (error) throw error;
      return data as Category[];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("products").insert({
        slug: draft.slug.trim(),
        sku: draft.sku.trim() || null,
        category_id: draft.category_id || null,
        name_en: draft.name_en.trim(),
        name_ar: draft.name_ar.trim(),
        description_en: draft.description_en.trim() || null,
        description_ar: draft.description_ar.trim() || null,
        price: Number(draft.price),
        compare_at_price: draft.compare_at_price ? Number(draft.compare_at_price) : null,
        material: draft.material.trim() || null,
        color: draft.color.trim() || null,
        images: draft.images.split(",").map((s) => s.trim()).filter(Boolean),
        stock_status: draft.stock_status,
        stock_qty: Number(draft.stock_qty) || 0,
        is_featured: draft.is_featured,
        is_active: draft.is_active,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Product added");
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      navigate({ to: "/admin" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!checked) return <div className="container-page py-20 text-muted-foreground">{t("loading")}</div>;
  if (!isAdmin) return <div className="container-page py-20">{t("adminOnly")}</div>;

  return (
    <div className="container-page max-w-3xl py-12">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link to="/admin">← {t("admin")}</Link>
      </Button>
      <h1 className="heading-section mb-8">{t("addProduct")}</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
        className="grid gap-4 rounded-lg border border-border bg-card p-5 sm:grid-cols-2"
      >
        <F label="Slug">
          <Input value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} required />
        </F>
        <F label="SKU">
          <Input value={draft.sku} onChange={(e) => setDraft({ ...draft, sku: e.target.value })} />
        </F>
        <F label="Name (English)">
          <Input value={draft.name_en} onChange={(e) => setDraft({ ...draft, name_en: e.target.value })} required />
        </F>
        <F label="الاسم (عربي)">
          <Input value={draft.name_ar} onChange={(e) => setDraft({ ...draft, name_ar: e.target.value })} required />
        </F>
        <F label="Description (English)">
          <Textarea value={draft.description_en} onChange={(e) => setDraft({ ...draft, description_en: e.target.value })} />
        </F>
        <F label="الوصف (عربي)">
          <Textarea value={draft.description_ar} onChange={(e) => setDraft({ ...draft, description_ar: e.target.value })} />
        </F>
        <F label="Price (AED, incl. VAT)">
          <Input type="number" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} required />
        </F>
        <F label="Compare-at price">
          <Input type="number" value={draft.compare_at_price} onChange={(e) => setDraft({ ...draft, compare_at_price: e.target.value })} />
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
          <Input type="number" value={draft.stock_qty} onChange={(e) => setDraft({ ...draft, stock_qty: e.target.value })} />
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
          <input type="checkbox" checked={draft.is_featured} onChange={(e) => setDraft({ ...draft, is_featured: e.target.checked })} />
          Featured
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={draft.is_active} onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })} />
          Active
        </label>
        <p className="text-xs text-muted-foreground sm:col-span-2">
          Save the product first, then edit it from the admin list to add colour / fabric / size options.
        </p>
        <div className="flex gap-2 sm:col-span-2">
          <Button type="submit" disabled={save.isPending}>
            {t("save")}
          </Button>
          <Button asChild type="button" variant="ghost">
            <Link to="/admin">{t("cancel")}</Link>
          </Button>
        </div>
      </form>
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
