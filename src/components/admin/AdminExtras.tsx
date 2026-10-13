import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/lib/shop";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/admin/ImageUpload";

const aed = (n: number) => `AED ${Math.round(n).toLocaleString("en-AE")}`;

/* ---------------- Analytics ---------------- */
export function AnalyticsPanel() {
  const { data } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: async () => {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const { data: orders, error } = await supabase
        .from("orders")
        .select("id, total, status, created_at")
        .gte("created_at", monthStart);
      if (error) throw error;
      const valid = orders.filter((o) => o.status !== "cancelled" && o.status !== "returned");
      const { data: items } = await supabase
        .from("order_items")
        .select("name_en, product_id, package_id, quantity, line_total, orders!inner(status)")
        .neq("orders.status", "cancelled");
      const map = new Map<string, { name: string; qty: number; revenue: number }>();
      for (const i of items ?? []) {
        const k = i.product_id ?? i.package_id ?? i.name_en;
        const cur = map.get(k) ?? { name: i.name_en.replace(/ \(.*\)$/, ""), qty: 0, revenue: 0 };
        cur.qty += i.quantity;
        cur.revenue += Number(i.line_total);
        map.set(k, cur);
      }
      return {
        today: orders.filter((o) => o.created_at >= dayStart).length,
        monthRevenue: valid.reduce((n, o) => n + Number(o.total), 0),
        monthOrders: valid.length,
        best: [...map.values()].sort((a, b) => b.qty - a.qty).slice(0, 5),
      };
    },
  });

  return (
    <section className="mb-8 grid gap-4 md:grid-cols-3">
      <Stat label="Orders today" value={String(data?.today ?? "–")} />
      <Stat label="Revenue this month" value={data ? aed(data.monthRevenue) : "–"} sub={data ? `${data.monthOrders} orders` : ""} />
      <div className="rounded-lg border border-border bg-card p-4 md:row-span-1">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Best sellers</p>
        {!data?.best.length ? (
          <p className="text-sm text-muted-foreground">No sales yet</p>
        ) : (
          <ol className="space-y-1 text-sm">
            {data.best.map((b, i) => (
              <li key={b.name + i} className="flex justify-between gap-2">
                <span className="truncate">{i + 1}. {b.name}</span>
                <span className="shrink-0 text-muted-foreground">{b.qty} sold</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-primary">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

/* ---------------- Variants ---------------- */
type VariantDraft = { id?: string; option_type: string; label: string; price: string; stock_qty: string };

export function VariantsEditor({ productId, basePrice }: { productId: string; basePrice: number }) {
  const qc = useQueryClient();
  const { data: rows = [] } = useQuery({
    queryKey: ["variants", productId],
    queryFn: async () => {
      const { data, error } = await supabase.from("product_variants").select("*").eq("product_id", productId).order("sort_order");
      if (error) throw error;
      return data;
    },
  });
  const [list, setList] = useState<VariantDraft[]>([]);
  useEffect(() => {
    setList(rows.map((r) => ({ id: r.id, option_type: r.option_type, label: r.label, price: String(r.price), stock_qty: String(r.stock_qty) })));
  }, [rows]);

  const save = useMutation({
    mutationFn: async () => {
      const keep = list.filter((v) => v.label.trim());
      const removed = rows.filter((r) => !keep.some((k) => k.id === r.id)).map((r) => r.id);
      if (removed.length) {
        const { error } = await supabase.from("product_variants").delete().in("id", removed);
        if (error) throw error;
      }
      for (const [i, v] of keep.entries()) {
        const payload = {
          product_id: productId,
          option_type: v.option_type,
          label: v.label.trim(),
          price: Number(v.price) || basePrice,
          stock_qty: Math.max(0, Number(v.stock_qty) || 0),
          sort_order: i,
        };
        const { error } = v.id
          ? await supabase.from("product_variants").update(payload).eq("id", v.id)
          : await supabase.from("product_variants").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Options saved");
      qc.invalidateQueries({ queryKey: ["variants", productId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const upd = (i: number, patch: Partial<VariantDraft>) => setList((l) => l.map((v, j) => (j === i ? { ...v, ...patch } : v)));

  return (
    <div className="rounded-md border border-dashed border-border p-4">
      <p className="mb-1 font-medium">Options (colour / fabric / size)</p>
      <p className="mb-3 text-xs text-muted-foreground">Each option has its own price and stock. Leave empty if the product has no options.</p>
      <div className="space-y-2">
        {list.map((v, i) => (
          <div key={v.id ?? `new-${i}`} className="grid grid-cols-2 gap-2 sm:grid-cols-[120px_1fr_110px_90px_auto]">
            <select
              value={v.option_type}
              onChange={(e) => upd(i, { option_type: e.target.value })}
              className="h-10 rounded-md border border-input bg-background px-2 text-sm"
              aria-label="Option type"
            >
              <option value="color">Colour</option>
              <option value="fabric">Fabric</option>
              <option value="size">Size</option>
            </select>
            <Input placeholder="e.g. Beige" value={v.label} onChange={(e) => upd(i, { label: e.target.value })} aria-label="Option name" />
            <Input type="number" placeholder="Price" value={v.price} onChange={(e) => upd(i, { price: e.target.value })} aria-label="Price" />
            <Input type="number" placeholder="Stock" value={v.stock_qty} onChange={(e) => upd(i, { stock_qty: e.target.value })} aria-label="Stock" />
            <Button type="button" variant="ghost" size="sm" onClick={() => setList((l) => l.filter((_, j) => j !== i))}>
              Remove
            </Button>
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setList((l) => [...l, { option_type: "color", label: "", price: String(basePrice || ""), stock_qty: "0" }])}
        >
          Add option
        </Button>
        <Button type="button" size="sm" onClick={() => save.mutate()} disabled={save.isPending}>
          Save options
        </Button>
      </div>
    </div>
  );
}

/* ---------------- Coupons ---------------- */
export function CouponsPanel() {
  const qc = useQueryClient();
  const { data: coupons = [] } = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: async () => {
      const { data, error } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const toggle = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("coupons").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-coupons"] }),
  });

  return (
    <div className="space-y-6">
      <Button asChild>
        <Link to="/admin/coupons/new">Add coupon</Link>
      </Button>
      <ul className="space-y-2">
        {coupons.map((c) => (
          <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-3 text-sm">
            <span className="font-mono font-semibold">{c.code}</span>
            <span>{c.discount_type === "percent" ? `${c.value}%` : aed(Number(c.value))} off · min {aed(Number(c.min_order))}</span>
            <span className="text-muted-foreground">
              used {c.used_count}{c.max_uses ? `/${c.max_uses}` : ""}
              {c.expires_at ? ` · until ${new Date(c.expires_at).toLocaleDateString("en-AE")}` : ""}
            </span>
            <Button size="sm" variant={c.is_active ? "secondary" : "outline"} onClick={() => toggle.mutate({ id: c.id, is_active: !c.is_active })}>
              {c.is_active ? "Active" : "Disabled"}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------- Packages ---------------- */
export function PackagesPanel({ products }: { products: Product[] }) {
  const qc = useQueryClient();
  const { data: pkgs = [] } = useQuery({
    queryKey: ["admin-packages"],
    queryFn: async () => {
      const { data, error } = await supabase.from("packages").select("*, package_items(product_id, quantity)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const empty = { id: "", slug: "", name_en: "", name_ar: "", description_en: "", description_ar: "", price: "", image_url: "", is_active: true, items: {} as Record<string, number> };
  const [d, setD] = useState<typeof empty | null>(null);
  const worth = d ? Object.entries(d.items).reduce((n, [id, q]) => n + Number(products.find((p) => p.id === id)?.price ?? 0) * q, 0) : 0;

  const save = useMutation({
    mutationFn: async (x: typeof empty) => {
      const payload = {
        slug: x.slug.trim(),
        name_en: x.name_en.trim(),
        name_ar: x.name_ar.trim(),
        description_en: x.description_en.trim() || null,
        description_ar: x.description_ar.trim() || null,
        price: Number(x.price),
        image_url: x.image_url.trim() || null,
        is_active: x.is_active,
      };
      let id = x.id;
      if (id) {
        const { error } = await supabase.from("packages").update(payload).eq("id", id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("packages").insert(payload).select("id").single();
        if (error) throw error;
        id = data.id;
      }
      await supabase.from("package_items").delete().eq("package_id", id);
      const items = Object.entries(x.items).filter(([, q]) => q > 0).map(([product_id, quantity]) => ({ package_id: id, product_id, quantity }));
      if (items.length) {
        const { error } = await supabase.from("package_items").insert(items);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Package saved");
      setD(null);
      qc.invalidateQueries({ queryKey: ["admin-packages"] });
      qc.invalidateQueries({ queryKey: ["packages"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("packages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-packages"] }),
  });

  return (
    <div className="space-y-4">
      <Button asChild>
        <Link to="/admin/packages/new">Add package</Link>
      </Button>
      {d && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!d.slug || !d.name_en || !d.name_ar || !Number(d.price)) { toast.error("Fill slug, names and price"); return; }
            save.mutate(d);
          }}
          className="grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-2"
        >
          <Input placeholder="slug (e.g. living-room-set)" value={d.slug} onChange={(e) => setD({ ...d, slug: e.target.value })} />
          <div className="space-y-2">
            <Input placeholder="Image URL" value={d.image_url} onChange={(e) => setD({ ...d, image_url: e.target.value })} />
            <ImageUpload onUploaded={(url) => setD({ ...d, image_url: url })} />
          </div>
          <Input placeholder="Name (English)" value={d.name_en} onChange={(e) => setD({ ...d, name_en: e.target.value })} />
          <Input placeholder="الاسم (عربي)" value={d.name_ar} onChange={(e) => setD({ ...d, name_ar: e.target.value })} />
          <Textarea placeholder="Description (English)" value={d.description_en} onChange={(e) => setD({ ...d, description_en: e.target.value })} />
          <Textarea placeholder="الوصف (عربي)" value={d.description_ar} onChange={(e) => setD({ ...d, description_ar: e.target.value })} />
          <div className="sm:col-span-2">
            <p className="mb-2 text-sm font-medium">Products in this package (quantity)</p>
            <div className="grid max-h-64 gap-2 overflow-y-auto sm:grid-cols-2">
              {products.map((p) => (
                <label key={p.id} className="flex items-center justify-between gap-2 rounded border border-border p-2 text-sm">
                  <span className="truncate">{p.name_en} · {aed(Number(p.price))}</span>
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
            <Button type="submit" disabled={save.isPending}>Save</Button>
            <Button type="button" variant="ghost" onClick={() => setD(null)}>Cancel</Button>
          </div>
        </form>
      )}
      <ul className="space-y-2">
        {pkgs.map((p) => (
          <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-3 text-sm">
            <span className="font-medium">{p.name_en}</span>
            <span>{aed(Number(p.price))} · {p.package_items.length} items{p.is_active ? "" : " · hidden"}</span>
            <span className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  setD({
                    id: p.id,
                    slug: p.slug,
                    name_en: p.name_en,
                    name_ar: p.name_ar,
                    description_en: p.description_en ?? "",
                    description_ar: p.description_ar ?? "",
                    price: String(p.price),
                    image_url: p.image_url ?? "",
                    is_active: p.is_active,
                    items: Object.fromEntries(p.package_items.map((i) => [i.product_id, i.quantity])),
                  })
                }
              >
                Edit
              </Button>
              <Button size="sm" variant="ghost" onClick={() => confirm("Delete package?") && remove.mutate(p.id)}>Delete</Button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------- Policy pages ---------------- */
export function PagesPanel() {
  const qc = useQueryClient();
  const { data: pages = [] } = useQuery({
    queryKey: ["admin-pages"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_pages").select("*").order("slug");
      if (error) throw error;
      return data;
    },
  });
  return (
    <div className="space-y-6">
      {pages.map((p) => (
        <PageEditor key={p.slug} page={p} onSaved={() => { qc.invalidateQueries({ queryKey: ["admin-pages"] }); qc.invalidateQueries({ queryKey: ["site-page", p.slug] }); }} />
      ))}
    </div>
  );
}

function PageEditor({ page, onSaved }: { page: { slug: string; title_en: string; body_en: string; body_ar: string }; onSaved: () => void }) {
  const [en, setEn] = useState(page.body_en);
  const [ar, setAr] = useState(page.body_ar);
  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("site_pages").update({ body_en: en, body_ar: ar, updated_at: new Date().toISOString() }).eq("slug", page.slug);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Page saved"); onSaved(); },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="mb-3 font-medium">{page.title_en} <span className="text-xs text-muted-foreground">(/{page.slug})</span></p>
      <div className="grid gap-3 md:grid-cols-2">
        <Textarea rows={8} placeholder="English text" value={en} onChange={(e) => setEn(e.target.value)} />
        <Textarea rows={8} dir="rtl" placeholder="النص العربي" value={ar} onChange={(e) => setAr(e.target.value)} />
      </div>
      <Button className="mt-3" size="sm" onClick={() => save.mutate()} disabled={save.isPending}>Save</Button>
    </div>
  );
}
