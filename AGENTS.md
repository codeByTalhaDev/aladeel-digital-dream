<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Public catalog policies must separate anonymous active-item reads from authenticated admin reads, so visitor queries never invoke restricted role checks.
- Orders are written only via the `place_order_atomic` Postgres function (service role) so stock, coupon use and order rows commit together.
- Schema changes live only in drizzle/migrations; there is no supabase/migrations folder.
- Product photos in the private `product-images` bucket are served through `/api/public/product-images/<path>` (validated, rate-limited streaming proxy); never restore a public SELECT policy on storage.objects for that bucket, and store photo paths — not public storage URLs — in product/package image fields.
