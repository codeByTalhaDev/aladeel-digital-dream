import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { trackOrder } from "@/lib/orders.functions";
import { formatAed, useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/track")({
  head: () => ({
    meta: [
      { title: "Track Your Order | Al Adeel Furniture" },
      { name: "description", content: "Check the status of your Al Adeel Furniture order with your order number and phone — no account needed." },
      { property: "og:title", content: "Track Your Order | Al Adeel Furniture" },
      { property: "og:description", content: "Check your furniture order status with your order number and phone." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TrackPage,
});

type Result = Awaited<ReturnType<typeof trackOrder>>;

function TrackPage() {
  const { pick, lang } = useI18n();
  const track = useServerFn(trackOrder);
  const [num, setNum] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<Result | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(num.replace(/\D/g, ""));
    if (!n || phone.trim().length < 7) return;
    setBusy(true);
    try {
      setRes(await track({ data: { orderNumber: n, phone } }));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container-page max-w-lg py-14">
      <h1 className="heading-section mb-2">{pick("Track your order", "تتبع طلبك")}</h1>
      <p className="mb-6 text-muted-foreground">{pick("Enter your order number and the phone used at checkout.", "أدخل رقم الطلب ورقم الهاتف المستخدم عند الطلب.")}</p>
      <form onSubmit={submit} className="space-y-4 rounded-lg border border-border bg-card p-5">
        <div className="space-y-1.5">
          <Label htmlFor="tn">{pick("Order number", "رقم الطلب")}</Label>
          <Input id="tn" inputMode="numeric" value={num} onChange={(e) => setNum(e.target.value)} placeholder="1001" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tp">{pick("Phone", "الهاتف")}</Label>
          <Input id="tp" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="05X XXX XXXX" required />
        </div>
        <Button type="submit" disabled={busy} className="w-full">{pick("Check status", "تحقق من الحالة")}</Button>
      </form>
      {res && !res.found && (
        <p className="mt-6 text-destructive">{pick("No order matches that number and phone.", "لا يوجد طلب بهذا الرقم والهاتف.")}</p>
      )}
      {res?.found && (
        <dl className="mt-6 space-y-2 rounded-lg border border-border bg-card p-5 text-sm">
          <div className="flex justify-between"><dt className="text-muted-foreground">{pick("Order", "الطلب")}</dt><dd className="font-semibold">#{res.orderNumber}</dd></div>
          <div className="flex justify-between"><dt className="text-muted-foreground">{pick("Status", "الحالة")}</dt><dd className="font-semibold capitalize">{res.status.replace(/_/g, " ")}</dd></div>
          <div className="flex justify-between"><dt className="text-muted-foreground">{pick("Payment", "الدفع")}</dt><dd className="capitalize">{res.paymentStatus}</dd></div>
          <div className="flex justify-between"><dt className="text-muted-foreground">{pick("Total", "الإجمالي")}</dt><dd>{formatAed(res.total, lang)}</dd></div>
          {res.deliveryDate && <div className="flex justify-between"><dt className="text-muted-foreground">{pick("Delivery date", "تاريخ التوصيل")}</dt><dd>{res.deliveryDate}</dd></div>}
        </dl>
      )}
    </div>
  );
}
