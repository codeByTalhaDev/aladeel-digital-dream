import { MessageCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { whatsappLink } from "@/lib/shop";

export function WhatsAppButton() {
  const { t } = useI18n();
  return (
    <a
      href={whatsappLink("Hello Al Adeel Furniture, I would like to ask about your furniture.")}
      target="_blank"
      rel="noreferrer"
      aria-label={t("whatsappUs")}
      className="fixed bottom-5 end-5 z-50 flex items-center gap-2 rounded-full bg-whatsapp px-4 py-3 text-sm font-medium text-white shadow-lift transition-transform hover:scale-105"
    >
      <MessageCircle className="size-5" />
      <span className="hidden sm:inline">{t("whatsappUs")}</span>
    </a>
  );
}
