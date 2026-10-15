import { Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { PHONE_PRIMARY, PHONE_SECONDARY, TRN } from "@/lib/shop";

const categoryLinks = [
  { slug: "sofas", en: "Sofa Sets", ar: "أطقم كنب" },
  { slug: "bedroom", en: "Bedroom Sets", ar: "غرف نوم" },
  { slug: "majlis", en: "Majlis", ar: "مجالس" },
  { slug: "dining", en: "Dining", ar: "طاولات طعام" },
  { slug: "tv-stands", en: "TV Stands", ar: "طاولات تلفزيون" },
  { slug: "kitchen", en: "Kitchen", ar: "مطابخ" },
];

export function SiteFooter() {
  const { t, pick } = useI18n();

  return (
    <footer className="mt-20 border-t border-border bg-secondary">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <h3 className="font-display text-xl text-primary">{t("brand")}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{t("tagline")}</p>
          <p className="mt-4 text-sm">{t("addressLine")}</p>
          <p className="mt-2 text-xs text-muted-foreground">{t("trn")}</p>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide">{t("categories")}</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {categoryLinks.map((c) => (
              <li key={c.slug}>
                <Link to="/shop" search={{ category: c.slug }} className="hover:text-primary">
                  {pick(c.en, c.ar)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide">{t("about")}</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/about" className="hover:text-primary">
                {t("aboutTitle")}
              </Link>
            </li>
            <li>
              <Link to="/about" hash="delivery" className="hover:text-primary">
                {t("deliveryPolicy")}
              </Link>
            </li>
            <li>
              <Link to="/returns" className="hover:text-primary">
                {t("returnsPolicy")}
              </Link>
            </li>
            <li>
              <Link to="/privacy" className="hover:text-primary">Privacy Policy</Link>
            </li>
            <li>
              <Link to="/terms" className="hover:text-primary">Terms &amp; Conditions</Link>
            </li>
            <li>
              <Link to="/track" className="hover:text-primary">Track order</Link>
            </li>
            <li>
              <Link to="/quote" className="hover:text-primary">Request a quote</Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-primary">
                {t("contact")}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide">{t("callUs")}</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <a href={`tel:+971${PHONE_PRIMARY.replace(/\D/g, "").slice(1)}`} className="hover:text-primary">
                {PHONE_PRIMARY}
              </a>
            </li>
            <li>
              <a href={`tel:+971${PHONE_SECONDARY.replace(/\D/g, "").slice(1)}`} className="hover:text-primary">
                {PHONE_SECONDARY}
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {t("brand")} · TRN {TRN}
      </div>
    </footer>
  );
}
