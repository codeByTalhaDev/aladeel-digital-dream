# Fix product loading and polish the shop

## Outcome
Products will load correctly in every category, with a professional loading experience and a clear recovery message if the catalog cannot be reached.

## Plan
1. **Repair public catalog access**
   - Add a database migration that lets visitors read active products and packages without calling the restricted admin-role check.
   - Keep inactive items and all product-management actions restricted to authenticated admins.
   - Restore the role-check permission required by authenticated admin policies.

2. **Make shop loading resilient**
   - Replace the plain “Loading” text with stable product-card placeholders that match the final grid.
   - Handle failed product requests explicitly, showing a bilingual error message and retry button instead of loading forever.
   - Preserve the existing search, category, price, and sorting controls.

3. **Polish the catalog presentation**
   - Refine product-card spacing, image treatment, price hierarchy, stock badges, and actions using the existing green, cream, and brass design system.
   - Keep layouts clean and usable in English and Arabic across phone and desktop sizes.

4. **Verify the complete result**
   - Confirm the database still contains five active products in each of the six categories.
   - Test the home featured products and every shop category as a signed-out visitor.
   - Check phone and desktop layouts, retry behavior, console/network errors, and the final build.

## Technical details
- The current requests fail with `permission denied for function has_role`: the public product policy evaluates an admin-only function even for signed-out visitors.
- The migration will split public active-item visibility from authenticated admin visibility, avoiding that function on anonymous reads while preserving admin access.
- The shop query will use explicit loading, error, and retry states so failures can never appear as an endless loader.
