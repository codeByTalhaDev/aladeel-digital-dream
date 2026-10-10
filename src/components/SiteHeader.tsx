import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, Phone, ShoppingBag, Heart, User } from "lucide-react";
import { useState } from "react";
import { useI18n, formatAed } from "@/lib/i18n";
import { useCart } from "@/lib/cart";
import { useAuth, useIsAdmin } from "@/lib/useAuth";
import { PHONE_PRIMARY } from "@/lib/shop";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useQueryClient } from "@tanstack/react-query";

export function SiteHeader() {
  const { t, lang, setLang } = useI18n();
  const { count, itemsTotal } = useCart();
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin(user?.id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const links = [
    { to: "/", label: t("home") },
    { to: "/shop", label: t("shop") },
    { to: "/packages", label: lang === "ar" ? "الباقات" : "Packages" },
    { to: "/about", label: t("about") },
    { to: "/contact", label: t("contact") },
  ];

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="bg-primary text-primary-foreground">
        <div className="container-page flex flex-wrap items-center justify-between gap-2 py-1.5 text-xs">
          <span className="flex items-center gap-1.5">
            <Phone className="size-3.5" /> {PHONE_PRIMARY}
          </span>
          <span className="hidden sm:block">{t("trustVat")}</span>
          <button
            onClick={() => setLang(lang === "en" ? "ar" : "en")}
            className="rounded-full border border-primary-foreground/40 px-2.5 py-0.5 font-medium transition-colors hover:bg-primary-foreground/15"
          >
            {lang === "en" ? "العربية" : "English"}
          </button>
        </div>
      </div>

      <div className="container-page flex items-center gap-4 py-3">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" aria-label="Menu">
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <nav className="mt-10 flex flex-col gap-1">
              {links.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-2 text-base hover:bg-accent"
                >
                  {l.label}
                </Link>
              ))}
              <Link to="/account" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 hover:bg-accent">
                {t("account")}
              </Link>
              {isAdmin && (
                <Link to="/admin" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 hover:bg-accent">
                  {t("admin")}
                </Link>
              )}
            </nav>
          </SheetContent>
        </Sheet>

        <Link to="/" className="flex flex-col leading-none">
          <span className="font-display text-xl font-semibold tracking-tight text-primary sm:text-2xl">
            {t("brand")}
          </span>
          <span className="hidden text-[10px] uppercase tracking-[0.18em] text-muted-foreground sm:block">
            Ras Al Khaimah · U.A.E.
          </span>
        </Link>

        <nav className="mx-auto hidden items-center gap-6 text-sm md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="transition-colors hover:text-primary [&.active]:font-medium [&.active]:text-primary"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ms-auto flex items-center gap-1 md:ms-0">
          {isAdmin && (
            <Button asChild variant="ghost" size="sm" className="hidden lg:inline-flex">
              <Link to="/admin">{t("admin")}</Link>
            </Button>
          )}
          {user ? (
            <>
              <Button asChild variant="ghost" size="icon" aria-label={t("account")}>
                <Link to="/account">
                  <User />
                </Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={signOut} className="hidden sm:inline-flex">
                {t("signOut")}
              </Button>
            </>
          ) : (
            <Button asChild variant="ghost" size="sm">
              <Link to="/auth">{t("signIn")}</Link>
            </Button>
          )}

          <Button asChild variant="ghost" size="icon" aria-label="Wishlist">
            <Link to="/wishlist">
              <Heart className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="secondary" className="gap-2">
            <Link to="/cart">
              <ShoppingBag className="size-4" />
              <span className="tabular-nums">{count}</span>
              <span className="hidden text-xs text-muted-foreground sm:inline">{formatAed(itemsTotal, lang)}</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
