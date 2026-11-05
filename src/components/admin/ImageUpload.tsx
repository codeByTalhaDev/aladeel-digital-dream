import { useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

/** Uploads one photo to the product-images bucket and returns its URL via onUploaded. */
export function ImageUpload({ onUploaded }: { onUploaded: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Photo must be under 10 MB.");
      return;
    }
    setBusy(true);
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    // The bucket is private: photos are served through the app's signed-URL
    // proxy route instead of a public storage link.
    onUploaded(`/api/public/product-images/${path}`);
    toast.success("Photo uploaded");
  }

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
          e.target.value = "";
        }}
      />
      <Button type="button" variant="secondary" size="sm" disabled={busy} onClick={() => inputRef.current?.click()}>
        {busy ? "Uploading…" : "Upload photo"}
      </Button>
      <span className="text-xs text-muted-foreground">JPG/PNG/WebP, up to 10 MB</span>
    </div>
  );
}
