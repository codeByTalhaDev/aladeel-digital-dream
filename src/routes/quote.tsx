import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { submitQuote } from "@/lib/quote.functions";
import { EMIRATES } from "@/lib/shop";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/quote")({
  head: () => ({
    meta: [
      { title: "Request a Custom Furniture Quote | Al Adeel Furniture UAE" },
      { name: "description", content: "Tell us what you need — custom majlis, kitchens, bedrooms or bulk orders — and Al Adeel Furniture will send you a price." },
      { property: "og:title", content: "Request a Quote | Al Adeel Furniture" },
      { property: "og:description", content: "Custom furniture and kitchens made to your size. Get a free quote." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: QuotePage,
});

function QuotePage() {
  const { pick, lang } = useI18n();
  const [f, setF] = useState({ name: "", phone: "", email: "", emirate: "", details: "", company: "" });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (f.name.trim().length < 2 || f.phone.replace(/\D/g, "").length < 7 || f.details.trim().length < 5) {
      toast.error(pick("Please fill name, phone and details.", "يرجى إدخال الاسم والهاتف والتفاصيل."));
      return;
    }
    setBusy(true);
    try {
      await submitQuote({ data: { ...f, company: f.company, email: f.email.trim() } });
      setSent(true);
    } catch {
      toast.error(pick("Could not send. Please try again.", "تعذر الإرسال. حاول مرة أخرى."));
    }
    setBusy(false);
  }

  if (sent)
    return (
      <div className="container-page max-w-lg py-20 text-center">
        <h1 className="heading-section">{pick("Thank you!", "شكراً لك!")}</h1>
        <p className="mt-3 text-muted-foreground">{pick("We'll call you with a price soon.", "سنتصل بك قريباً بالسعر.")}</p>
      </div>
    );

  return (
    <div className="container-page max-w-lg py-14">
      <h1 className="heading-section mb-2">{pick("Request a quote", "اطلب عرض سعر")}</h1>
      <p className="mb-6 text-muted-foreground">{pick("Custom sizes, kitchens, majlis or bulk orders — tell us what you need.", "مقاسات خاصة، مطابخ، مجالس أو طلبات كبيرة — أخبرنا بما تحتاج.")}</p>
      <form onSubmit={submit} className="space-y-4 rounded-lg border border-border bg-card p-5">
        <div className="space-y-1.5"><Label htmlFor="qn">{pick("Name", "الاسم")}</Label><Input id="qn" value={f.name} onChange={set("name")} maxLength={100} required /></div>
        <div className="space-y-1.5"><Label htmlFor="qp">{pick("Phone", "الهاتف")}</Label><Input id="qp" type="tel" value={f.phone} onChange={set("phone")} maxLength={20} required /></div>
        <div className="space-y-1.5"><Label htmlFor="qe">{pick("Email (optional)", "البريد (اختياري)")}</Label><Input id="qe" type="email" value={f.email} onChange={set("email")} maxLength={255} /></div>
        <div className="space-y-1.5">
          <Label htmlFor="qm">{pick("Emirate", "الإمارة")}</Label>
          <select id="qm" value={f.emirate} onChange={set("emirate")} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value="">—</option>
            {EMIRATES.map((e) => <option key={e.value} value={e.value}>{lang === "ar" ? e.ar : e.en}</option>)}
          </select>
        </div>
        <div className="space-y-1.5"><Label htmlFor="qd">{pick("What do you need?", "ماذا تحتاج؟")}</Label><Textarea id="qd" rows={5} value={f.details} onChange={set("details")} maxLength={2000} required /></div>
        <Button type="submit" disabled={busy} className="w-full">{pick("Send request", "إرسال الطلب")}</Button>
      </form>
    </div>
  );
}
