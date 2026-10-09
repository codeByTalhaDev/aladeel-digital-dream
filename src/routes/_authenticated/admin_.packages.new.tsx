import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useAuth, useIsAdmin } from "@/lib/useAuth";
import type { Product } from "@/lib/shop";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const aed = (n: number) => `AED ${Math.round(n).toLocaleString("en-AE")}`;

export const Route = createFileRoute("/_authenticated/admin_/packages/new")({
  head: () => ({
    meta: [
      { title: "Add Package | Al Adeel Furniture" },
      { name: "description", content: "Create a new bundle package for the Al Adeel Furniture store." },
      { property: "og:title", content: "Add Package | Al Adeel Furniture" },
      { property: "og:description", content: "Create a new bundle package." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AddPackage,
});

function AddPackage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { isAdmin, checked } = useIsAdmin(user?.id);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [d, setD] = useState({
    slug: "",
    name_en: "",
    name_ar: "",
    description_en: "",
    description_ar: "",
    price: "",
    image_url: "",
    is_active: true,
    items: {} as Record<string, number>,
  });

  const { data: products = [] } = useQuery({
    queryKey: ["admin-products"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Product[];
    },
  });

  const worth = Object.entries(d.items).reduce(
    (n, [id, q]) => n + Number(products.find((p) => p.id === id)?.price ?? 0) * q,
    0,
  );

  const save = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("packages")
        .insert({
          slug: d.slug.trim(),
          name_en: d.name_en.trim(),
          name_ar: d.name_ar.trim(),
          description_en: d.description_en.trim() || null,
          description_ar: d.description_ar.trim() || null,
          price: Number(d.price),
          image_url: d.image_url.trim() || null,
          is_active: d.is_active,
        })
        .select("id")
        .single();
      if (error) throw error;
      const items = Object.entries(d.items)
        .filter(([, q]) => q > 0)
        .map(([product_id, quantity]) => ({ package_id: data.id, product_id, quantity }));
      if (items.length) {
        const { error: itemsError } = await supabase.from("package_items").insert(items);
        if (itemsError) throw itemsError;
      }
    },
    onSuccess: () => {
      toast.success("Package saved");
      qc.invalidateQueries({ queryKey: ["admin-packages"] });
      qc.invalidateQueries({ queryKey: ["packages"] });
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
      <h1 className="heading-section mb-8">Add package</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!d.slug || !d.name_en || !d.name_ar || !Number(d.price)) {
            toast.error("Fill slug, names and price");
            return;
          }
          save.mutate();
        }}
        className="grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-2"
      >
        <Input placeholder="slug (e.g. living-room-set)" value={d.slug} onChange={(e) => setD({ ...d, slug: e.target.value })} />
        <Input placeholder="Image URL" value={d.image_url} onChange={(e) => setD({ ...d, image_url: e.target.value })} />
        <Input placeholder="Name (English)" value={d.name_en} onChange={(e) => setD({ ...d, name_en: e.target.value })} />
        <Input placeholder="الاسم (عربي)" value={d.name_ar} onChange={(e) => setD({ ...d, name_ar: e.target.value })} />
        <Textarea placeholder="Description (English)" value={d.description_en} onChange={(e) => setD({ ...d, description_en: e.target.value })} />
        <Textarea placeholder="الوصف (عربي)" value={d.description_ar} onChange={(e) => setD({ ...d, description_ar: e.target.value })} />
        <div className="sm:col-span-2">
          <p className="mb-2 text-sm font-medium">Products in this package (quantity)</p>
          <div className="grid max-h-64 gap-2 overflow-y-auto sm:grid-cols-2">
            {products.map((p) => (
              <label key={p.id} className="flex items-center justify-between gap-2 rounded border border-border p-2 text-sm">
                <span className="truncate">
                  {p.name_en} · {aed(Number(p.price))}
                </span>
                <Input
                  type="number"
                  min={0}
                  className="h-8 w-16"
                  value={d.items[p.id] ?? 0}
                  onChange={(e) => setD({ ...d, items: { ...d.items, [p.id]: Math.max(0, Number(e.target.value) || 0) } })}
                />
              </label>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Items worth {aed(worth)} separately.</p>
        </div>
        <Input type="number" placeholder="Package price (AED incl. VAT)" value={d.price} onChange={(e) => setD({ ...d, price: e.target.value })} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={d.is_active} onChange={(e) => setD({ ...d, is_active: e.target.checked })} /> Active
        </label>
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
