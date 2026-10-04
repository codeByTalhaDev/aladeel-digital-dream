import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PHONE_PRIMARY, PHONE_SECONDARY, TRN } from "@/lib/shop";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/invoice/$id")({
  head: () => ({
    meta: [
      { title: "Tax Invoice | Al Adeel Furniture" },
      { name: "description", content: "Your Al Adeel Furniture tax invoice with 5% VAT." },
      { property: "og:title", content: "Tax Invoice | Al Adeel Furniture" },
      { property: "og:description", content: "Order tax invoice." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Invoice,
});

const aed = (n: number) => `AED ${Number(n).toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function Invoice() {
  const { id } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["invoice", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*, order_items(*)").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <div className="container-page py-20 text-muted-foreground">Loading…</div>;
  if (!data) return <div className="container-page py-20">Invoice not found.</div>;

  return (
    <div className="container-page py-8">
      <div className="mb-4 flex justify-end print:hidden">
        <Button onClick={() => window.print()}>
          <Printer className="size-4" /> Print / Save as PDF
        </Button>
      </div>
      <div className="mx-auto max-w-3xl rounded-lg border-2 border-primary bg-card p-6 text-sm print:border-0 sm:p-10">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-primary pb-4">
          <div>
            <p className="text-2xl font-bold text-primary">Al Adeel Furniture</p>
            <p className="text-lg font-bold text-primary" dir="rtl">مفروشات العديل</p>
            <p className="mt-1 text-xs text-muted-foreground">Sheikh Salem Bin Sultan Street, Almaemura, Ras Al Khaimah, UAE</p>
            <p className="text-xs text-muted-foreground">Tel: {PHONE_PRIMARY} · {PHONE_SECONDARY}</p>
          </div>
          <div className="text-end">
            <p className="text-lg font-semibold">TAX INVOICE · فاتورة ضريبية</p>
            <p>TRN: <span className="font-semibold">{TRN}</span></p>
            <p>Invoice #: {data.order_number}</p>
            <p>Date: {new Date(data.created_at).toLocaleDateString("en-AE")}</p>
          </div>
        </div>

        <div className="grid gap-2 py-4 sm:grid-cols-2">
          <div>
            <p className="font-semibold">Bill to · العميل</p>
            <p>{data.customer_name}</p>
            <p>{data.customer_phone}</p>
            {data.customer_email && <p>{data.customer_email}</p>}
          </div>
          <div>
            <p className="font-semibold">Deliver to · التوصيل</p>
            <p>{data.address}</p>
            <p>{data.area}, {data.emirate}</p>
            <p>Payment: {data.payment_method === "cod" ? "Cash on Delivery" : data.payment_method}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-primary text-primary-foreground">
                <th className="p-2">Description · الوصف</th>
                <th className="p-2 text-end">Qty</th>
                <th className="p-2 text-end">Unit</th>
                <th className="p-2 text-end">Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.order_items.map((i) => (
                <tr key={i.id} className="border-b border-border">
                  <td className="p-2">{i.name_en}</td>
                  <td className="p-2 text-end">{i.quantity}</td>
                  <td className="p-2 text-end">{aed(i.unit_price)}</td>
                  <td className="p-2 text-end">{aed(i.line_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="ms-auto mt-4 max-w-xs space-y-1">
          {Number(data.discount) > 0 && <Row l={`Discount (${data.coupon_code})`} v={`-${aed(data.discount)}`} />}
          <Row l="Delivery" v={aed(data.delivery_fee)} />
          <Row l="Total excl. VAT" v={aed(data.subtotal)} />
          <Row l="VAT 5% · ضريبة القيمة المضافة" v={aed(data.vat)} />
          <div className="border-t-2 border-primary pt-1">
            <Row l="Total incl. VAT · الإجمالي" v={aed(data.total)} bold />
          </div>
        </div>

        <div className="mt-12 flex justify-between text-xs text-muted-foreground">
          <span>Receiver's signature ______________</span>
          <span>Salesman ______________</span>
        </div>
      </div>
    </div>
  );
}

function Row({ l, v, bold }: { l: string; v: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 ${bold ? "text-base font-bold" : ""}`}>
      <span>{l}</span>
      <span>{v}</span>
    </div>
  );
}
