import { createFileRoute } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About & Policies | Al Adeel Furniture Ras Al Khaimah" },
      {
        name: "description",
        content:
          "Al Adeel Furniture in Ras Al Khaimah: who we are, our delivery and free assembly service, and our returns and exchange policy.",
      },
      { property: "og:title", content: "About Al Adeel Furniture" },
      { property: "og:description", content: "Furnishing homes and majlises across the UAE since day one." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: About,
});

function About() {
  const { t } = useI18n();
  return (
    <div className="container-page max-w-3xl py-14">
      <h1 className="heading-section">{t("aboutTitle")}</h1>
      <p className="mt-4 leading-relaxed text-muted-foreground">{t("aboutBody")}</p>

      <section id="delivery" className="mt-12 scroll-mt-28">
        <h2 className="heading-section text-2xl">{t("deliveryPolicy")}</h2>
        <p className="mt-3 leading-relaxed text-muted-foreground">{t("deliveryPolicyBody")}</p>
      </section>

      <section id="returns" className="mt-12 scroll-mt-28">
        <h2 className="heading-section text-2xl">{t("returnsPolicy")}</h2>
        <p className="mt-3 leading-relaxed text-muted-foreground">{t("returnsPolicyBody")}</p>
      </section>

      <p className="mt-12 rounded-lg bg-secondary p-4 text-sm">
        {t("addressLine")} · {t("trn")}
      </p>
    </div>
  );
}
