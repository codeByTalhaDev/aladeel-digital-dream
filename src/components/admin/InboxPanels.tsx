import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export function QuotesPanel() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["admin-quotes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("quote_requests").select("*").order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data;
    },
  });
  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("quote_requests").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-quotes"] }),
    onError: (e: Error) => toast.error(e.message),
  });
  if (!data.length) return <p className="text-muted-foreground">No quote requests yet.</p>;
  return (
    <ul className="space-y-3">
      {data.map((q) => (
        <li key={q.id} className="rounded-lg border border-border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-medium">{q.name} · <a href={`tel:${q.phone}`} className="underline">{q.phone}</a></p>
              <p className="text-xs text-muted-foreground">{[q.email, q.emirate, new Date(q.created_at).toLocaleString()].filter(Boolean).join(" · ")}</p>
            </div>
            <select
              value={q.status}
              onChange={(e) => setStatus.mutate({ id: q.id, status: e.target.value })}
              className="h-9 rounded-md border border-input bg-background px-2 text-sm"
              aria-label="Quote status"
            >
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm">{q.details}</p>
        </li>
      ))}
    </ul>
  );
}

export function ReviewsPanel() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("id, author_name, rating, comment, is_approved, created_at, products(name_en)")
        .order("is_approved")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });
  const done = () => {
    qc.invalidateQueries({ queryKey: ["admin-reviews"] });
    qc.invalidateQueries({ queryKey: ["reviews"] });
  };
  const approve = useMutation({
    mutationFn: async ({ id, ok }: { id: string; ok: boolean }) => {
      const { error } = await supabase.from("reviews").update({ is_approved: ok }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: done,
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reviews").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: done,
    onError: (e: Error) => toast.error(e.message),
  });
  if (!data.length) return <p className="text-muted-foreground">No reviews yet.</p>;
  return (
    <ul className="space-y-3">
      {data.map((r) => (
        <li key={r.id} className="rounded-lg border border-border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium">
              {r.author_name} · {"★".repeat(r.rating)} · <span className="text-muted-foreground">{(r.products as { name_en: string } | null)?.name_en}</span>
            </p>
            <div className="flex gap-2">
              {r.is_approved ? (
                <Button size="sm" variant="outline" onClick={() => approve.mutate({ id: r.id, ok: false })}>Hide</Button>
              ) : (
                <Button size="sm" onClick={() => approve.mutate({ id: r.id, ok: true })}>Approve</Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => confirm("Delete this review?") && remove.mutate(r.id)}>Delete</Button>
            </div>
          </div>
          {r.comment && <p className="mt-2 text-sm">{r.comment}</p>}
          {!r.is_approved && <p className="mt-1 text-xs text-muted-foreground">Waiting for approval</p>}
        </li>
      ))}
    </ul>
  );
}
