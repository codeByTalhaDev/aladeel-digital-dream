import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useAuth, useIsAdmin } from "@/lib/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/admin/coupons/new")({
  head: () => ({
    meta: [
      { title: "Add Coupon | Al Adeel Furniture" },
      { name: "description", content: "Create a new discount coupon for the Al Adeel Furniture store." },
      { property: "og:title", content: "Add Coupon | Al Adeel Furniture" },
      { property: "og:description", content: "Create a new discount coupon." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AddCoupon,
});

function AddCoupon() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { isAdmin, checked } = useIsAdmin(user?.id);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [f, setF] = useState({ code: "", discount_type: "percent", value: "", min_order: "0", max_uses: "", expires_at: "" });

  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("coupons").insert({
        code: f.code.trim().toUpperCase(),
        discount_type: f.discount_type,
        value: Number(f.value),
        min_order: Number(f.min_order) || 0,
        max_uses: f.max_uses ? Number(f.max_uses) : null,
        expires_at: f.expires_at ? new Date(f.expires_at).toISOString() : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Coupon created");
      qc.invalidateQueries({ queryKey: ["admin-coupons"] });
      navigate({ to: "/admin" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!checked) return <div className="container-page py-20 text-muted-foreground">{t("loading")}</div>;
  if (!isAdmin) return <div className="container-page py-20">{t("adminOnly")}</div>;

  return (
    <div className="container-page max-w-xl py-12">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link to="/admin">← {t("admin")}</Link>
      </Button>
      <h1 className="heading-section mb-8">Add coupon</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!f.code.trim() || !Number(f.value)) {
            toast.error("Code and value are required");
            return;
          }
          add.mutate();
        }}
        className="grid gap-4 rounded-lg border border-border bg-card p-5 sm:grid-cols-2"
      >
        <div className="space-y-1.5">
          <Label>Code</Label>
          <Input placeholder="CODE" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Type</Label>
          <select
            value={f.discount_type}
            onChange={(e) => setF({ ...f, discount_type: e.target.value })}
            className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="percent">% off</option>
            <option value="fixed">AED off</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label>Value</Label>
          <Input type="number" placeholder="Value" value={f.value} onChange={(e) => setF({ ...f, value: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Minimum order (AED)</Label>
          <Input type="number" value={f.min_order} onChange={(e) => setF({ ...f, min_order: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Max uses</Label>
          <Input type="number" placeholder="Unlimited" value={f.max_uses} onChange={(e) => setF({ ...f, max_uses: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Expires</Label>
          <Input type="date" value={f.expires_at} onChange={(e) => setF({ ...f, expires_at: e.target.value })} />
        </div>
        <div className="flex gap-2 sm:col-span-2">
          <Button type="submit" disabled={add.isPending}>
            Create coupon
          </Button>
          <Button asChild type="button" variant="ghost">
            <Link to="/admin">{t("cancel")}</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
