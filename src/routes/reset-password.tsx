import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password | Al Adeel Furniture" },
      { name: "description", content: "Set a new password for your Al Adeel Furniture account." },
      { property: "og:title", content: "Reset password | Al Adeel Furniture" },
      { property: "og:description", content: "Set a new password for your Al Adeel Furniture account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [isRecovery, setIsRecovery] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ password: "", confirm: "" });

  useEffect(() => {
    // Recovery links arrive with type=recovery in the URL hash; the Supabase
    // client exchanges it for a session and fires PASSWORD_RECOVERY.
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) setIsRecovery(true);
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setIsRecovery(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password.length < 6 || form.password.length > 72) {
      toast.error(t("required"));
      return;
    }
    if (form.password !== form.confirm) {
      toast.error(t("passwordsDontMatch"));
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: form.password });
      if (error) throw error;
      toast.success(t("passwordUpdated"));
      navigate({ to: "/account" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update password");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container-page flex justify-center py-16">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 shadow-soft">
        <h1 className="heading-section mb-6">{t("resetPassword")}</h1>
        {isRecovery ? (
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>{t("newPassword")}</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("confirmPassword")}</Label>
              <Input
                type="password"
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {t("resetPassword")}
            </Button>
          </form>
        ) : (
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>{t("resetEmailSent")}</p>
            <Link to="/auth" className="text-primary hover:underline">
              {t("backToSignIn")}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
