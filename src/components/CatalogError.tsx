import { AlertCircle, RefreshCw } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export function CatalogError({ onRetry }: { onRetry: () => void }) {
  const { t } = useI18n();

  return (
    <div className="col-span-full flex min-h-56 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/40 px-6 text-center">
      <span className="mb-4 inline-flex size-11 items-center justify-center rounded-full bg-background text-primary shadow-sm">
        <AlertCircle className="size-5" />
      </span>
      <h3 className="font-semibold">{t("catalogUnavailable")}</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{t("catalogUnavailableBody")}</p>
      <Button type="button" variant="outline" className="mt-5" onClick={onRetry}>
        <RefreshCw />
        {t("tryAgain")}
      </Button>
    </div>
  );
}