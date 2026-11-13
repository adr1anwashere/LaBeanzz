Good. I've read all three documents. Let me check the current state of the backend before building Phase 2.Now let me read the frontend files to understand what's already built:Good picture of the codebase. Now I'll build Phase 2 systematically. Let me start with all the backend pieces in parallel:

**Plan:**
1. `coffee_beans` model + migration `0002`
2. Pydantic schemas for beans
3. Supplier bean CRUD routes + owner bean routes
4. Seed script
5. Frontend: beans pages (owner list/detail, supplier CRUD), suppliers list/detail, updated owner dashboard shellNow add the `back_populates` on the Supplier side:Now write the Alembic migration for `coffee_beans`:Now write the Pydantic schemas for beans:Now write the beans routes:Now add suppliers routes (owner can browse supplier public profiles):Register the new blueprints in the app factory:Now add `flask-limiter` to the schemas init and update the schemas `__init__.py`:Good. Now write the seed script:Now let's check the backend compiles cleanly:The app gets past imports — it tries to connect to DB only when `db.init_app` runs. That's expected. Let me use a simpler syntax check:All backend Python files compile cleanly. Now let's build the frontend. Let me check the existing structure:Good. Now I'll build all the frontend pages. Let me start with the shared API client, then pages:

**Frontend pieces to build:**
1. `lib/api/beans.ts` and `lib/api/suppliers.ts` — typed fetch helpers
2. Owner: `/dashboard/owner/beans` (list + filters) and `/dashboard/owner/beans/[id]` (detail)
3. Owner: `/dashboard/owner/suppliers` and `/dashboard/owner/suppliers/[id]`
4. Supplier: `/dashboard/supplier/beans` (CRUD list) and `/dashboard/supplier/beans/new` / `/dashboard/supplier/beans/[id]/edit`
5. Updated owner dashboard shell (real stat cards structure)
6. Updated nav links in both layoutsNow add `RoastLevel` and `BeanStatus` type exports to `product.config.ts` (they're already there as `export type`). Now build the frontend pages. First, update the owner nav and layout to include the new pages:Now create the owner beans list page:Now build the shared UI components first, then pages:Now build the owner beans list page. Since this needs client-side filtering, I'll make it a client component:Now the supplier bean management pages:Now build the shared bean form component (used by both "new" and "edit"):Now the supplier dashboard page:Now update both dashboard pages with richer shells and real quick stats:Now add supplier profile page (placeholder for now, the layout has it in the nav):Now update the proxy middleware to allow the new supplier routes:The proxy already handles all dashboard paths correctly. Now let me run the Next.js build to check for TypeScript errors:Build passes clean with zero TypeScript errors. All 19 pages show up. Now let me also do a final syntax check on all the new backend files together and verify the migration chain is correct:Let's also verify the migration chain is correct (down_revision is correct):Migration chain is correct: `0001 → 0002`. Everything is clean.Phase 2 is done. Here's a summary of everything built:

---

**Backend**

- `CoffeeBean` model (`backend/app/models/coffee_bean.py`) — full schema with acidity/body/sweetness, `flavor_notes[]`, status, `producer_story`, timestamps
- Supplier model updated with `coffee_beans` relationship
- Migration `0002_coffee_beans` — `coffee_beans` table with check constraints on ratings, stock, roast level, and status; two indexes
- Pydantic schemas (`schemas/beans.py`) — `CreateBeanRequest`, `PatchBeanRequest`, `BeanFilterParams` with full validation
- Supplier bean CRUD routes (`GET/POST/PATCH/DELETE /api/supplier/beans`): `supplier_id` always from the token, never the request body
- Owner browse routes (`GET /api/coffee-beans`, `GET /api/coffee-beans/:id`) with filters: origin, roast level, status, max price
- Supplier public profile routes (`GET /api/suppliers`, `GET /api/suppliers/:id`) — public fields only
- Seed script (`scripts/seed.py`) — 3 suppliers (Indonesian, Latin American, African) + 20 beans with realistic profiles, stories, prices, and flavor notes

**Frontend**

- `lib/api/client.ts` — base `apiFetch` helper (handles proxy routing, server vs browser, `ApiError`)
- `lib/api/beans.ts` + `lib/api/suppliers.ts` — fully typed API clients
- `components/ui/StatusChip.tsx` — availability badge
- `components/ui/FlavorBar.tsx` — visual 0–10 meter
- `components/features/BeanCard.tsx` — card for catalog grid
- `components/features/BeanForm.tsx` — full create/edit form used by both new and edit pages
- Owner: `/dashboard/owner/beans` (filterable catalog grid), `/dashboard/owner/beans/[id]` (detail with flavor bars and supplier link)
- Owner: `/dashboard/owner/suppliers` (directory), `/dashboard/owner/suppliers/[id]` (profile + beans)
- Supplier: `/dashboard/supplier/beans` (table with edit/delete), `/dashboard/supplier/beans/new`, `/dashboard/supplier/beans/[id]` (edit)
- Updated dashboard shells for both roles — real bean counts from the API, quick-action cards
- Stub pages for orders, blends, profile (Phase 6/4 respectively) so nav links don't 404

**Build:** `npm run build` passes with zero TypeScript errors, all 19 routes render.

**To run on production:** `flask db upgrade` will apply `0002`, then `python -m scripts.seed` populates the catalog. A supplier can then edit stock and an owner will see the update reflected immediately.