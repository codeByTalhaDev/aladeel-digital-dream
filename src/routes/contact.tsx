import { createFileRoute } from "@tanstack/react-router";
import { MapPin, Phone, MessageCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { PHONE_PRIMARY, PHONE_SECONDARY, whatsappLink } from "@/lib/shop";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact & Showroom | Al Adeel Furniture Ras Al Khaimah" },
      {
        name: "description",
        content:
          "Visit Al Adeel Furniture on Sheikh Salem Bin Sultan Street, Almaemura, Ras Al Khaimah. Call 050-37 17 658 or message us on WhatsApp.",
      },
      { property: "og:title", content: "Contact Al Adeel Furniture" },
      { property: "og:description", content: "Showroom in Ras Al Khaimah — call or WhatsApp us any day." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Contact,
});

function Contact() {
  const { t } = useI18n();

  return (
    <div className="container-page py-14">
      <h1 className="heading-section mb-8">{t("contact")}</h1>
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="flex gap-3">
            <MapPin className="mt-1 size-5 shrink-0 text-primary" />
            <p>{t("addressLine")}</p>
          </div>
          <div className="flex gap-3">
            <Phone className="mt-1 size-5 shrink-0 text-primary" />
            <p>
              {PHONE_PRIMARY}
              <br />
              {PHONE_SECONDARY}
            </p>
          </div>
          <Button asChild size="lg">
            <a href={whatsappLink("Hello Al Adeel Furniture!")} target="_blank" rel="noreferrer">
              <MessageCircle className="size-4" /> {t("whatsappUs")}
            </a>
          </Button>
          <p className="text-sm text-muted-foreground">{t("trn")}</p>
        </div>

        <div className="overflow-hidden rounded-lg border border-border">
          <iframe
            title="Al Adeel Furniture location"
            src="https://www.google.com/maps?q=Sheikh%20Salem%20Bin%20Sultan%20Street%2C%20Al%20Maamoura%2C%20Ras%20Al%20Khaimah&output=embed"
            className="h-80 w-full"
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );
}
