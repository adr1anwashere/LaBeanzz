# agen3.md: LaBeans Phase Development

Working agreement for building LaBeans in phases. Read this before starting any task. The full design lives in the LaBeans Architecture Blueprint; this file is the execution order and the rules for moving between phases.

## Ground rules

1. Work one phase at a time. Do not start a phase until the previous one meets its exit criteria.
2. Do not build features from a later phase early, even if it looks quick.
3. Backend authorization is the authority. Frontend role checks are UX only.
4. Every owned resource is queried through an ownership scope. Another user's id returns 404.
5. Secrets live in env vars on the server only. Nothing secret reaches the browser.
6. AI output is never trusted: validate with Pydantic, check bean ids, check percentages sum to exactly 100 (integers, 2-5 components, no duplicates).
7. Keep one Flask monolith and one Postgres. No queues, no extra services.
8. Deploy after Phase 1 and redeploy at the end of every phase. A broken deploy is a blocker, not a later problem.
9. Every label, unit, currency and flavor axis comes from `product.config.ts`, not hardcoded in components.
10. Do not claim machine learning. The feedback loop is retrieval plus rule-based adjustments.
11. Code and copy should read like a person wrote them: no filler comments, no boilerplate narration.

## Repo layout

```text
labeans/
  frontend/    Next.js App Router, TypeScript, Tailwind, Auth.js
  backend/     Flask app factory, services, models, migrations, scripts
  knowledge/   markdown source docs for RAG ingestion
  agen3.md
```

## Phase overview

| Phase | Name | Priority | Core outcome |
|---|---|---|---|
| 1 | Foundation | Must | Login, roles, both apps deployed |
| 2 | Core coffee data | Must | Beans, suppliers, seeded catalog, dashboard shell |
| 3 | AI blend generation | Must | Validated structured blend from a prompt |
| 4 | Blend management | Must | Save, list, activate, presets |
| 5 | Feedback loop | Must | Feedback changes the next generation |
| 6 | Business flow | Must | Orders, supplier fulfilment, tracking |
| 7 | Nice to have | Should / Nice | Reorder, analytics, spotlight, substitute |

---

## Phase 1: Foundation

**Goal.** A user can sign in with Google, pick a role, and land on the right empty dashboard, on deployed infrastructure.

**Tasks**

- Scaffold monorepo, `.env.example` for both apps.
- Flask app factory, config, extensions, `/health`.
- Postgres with `pgcrypto` and `vector` extensions, Flask-Migrate baseline.
- Models and migration: `users`, `owner_profiles`, `suppliers`.
- `POST /api/auth/google`: verify Google ID token (audience, expiry, `email_verified`), upsert by `google_sub`, return app JWT.
- `GET /api/auth/me`, `POST /api/auth/onboard` (role set once, creates owner profile or supplier).
- `require_auth` and `require_role` decorators.
- Next.js: theme tokens (CSS variables), fonts, Auth.js Google provider, `/login`, `/onboarding`, middleware redirect by role, `/api/proxy/[...path]`.
- Empty owner and supplier layouts with navigation.
- Deploy: Vercel, Railway or Render, managed Postgres. Configure Google redirect URIs for local, preview, production.

**Exit criteria**

- New Google account can sign in, choose a role, and reach the correct dashboard in production.
- OWNER token gets 403 on a supplier-only route and the reverse.
- Second call to `/auth/onboard` returns 409.
- No secret appears in the browser bundle or network tab.

---

## Phase 2: Core coffee data

**Goal.** Suppliers manage beans; owners browse a realistic catalog.

**Tasks**

- Model and migration: `coffee_beans`.
- Supplier bean CRUD (`supplier_id` always from the token, never the body).
- Owner list and detail with filters (origin, roast, status, price).
- Status handling: AVAILABLE, LOW_STOCK, RESERVED, OUT_OF_STOCK.
- Seed script: 3 suppliers, about 20 beans with believable acidity, body, sweetness, notes, prices, producer story.
- Owner dashboard shell using the Marrow layout (top nav, header, sidebar cards with placeholder data).
- Suppliers list and detail pages (public profile fields only).

**Exit criteria**

- A supplier edits stock and the owner sees it.
- A supplier cannot read or edit another supplier's beans (404).
- Seeded catalog renders with filters on the deployed site.

---

## Phase 3: AI blend generation

**Goal.** An owner describes a coffee and gets a validated recipe with reasoning.

**Tasks**

- `ai_service.py`: single OpenRouter client with `complete_json` and `embed`. Model and keys from env.
- Models and migration: `knowledge_chunks` (vector), `ai_generations`.
- Write 10-20 knowledge markdown docs (origins, varietals, processing, roast effects, blending principles, archetypes).
- `scripts/ingest_knowledge.py`: chunk, embed, insert with `owner_id = NULL`.
- `rag_service.retrieve()`: always filters `owner_id IS NULL OR owner_id = :user`.
- `POST /api/ai/generate-blend`: candidate beans by SQL, retrieval, prompt, JSON-schema call, validation, one retry, log to `ai_generations`.
- Compute acidity, body, sweetness as the weighted average of bean values; keep LLM note estimates in a separate `estimated` block.
- New Blend page: prompt and constraints form, staged loader, recipe view with percentage bar, computed vs estimated profile, reasoning.
- Proxy route `maxDuration` set so generation is not cut off.

**Exit criteria**

- The demo prompt returns a recipe whose percentages sum to 100 using only available beans.
- Invalid model output is rejected, retried once, then returns 422 and logs INVALID.
- A forced invalid bean id never reaches the response.
- Retrieval never returns another owner's rows (test with two users).

---

## Phase 4: Blend management

**Goal.** Owners keep, edit and reuse blends and presets.

**Tasks**

- Models and migration: `blends`, `blend_items`, `presets`.
- Save blend from a draft (re-check bean availability and sum at save time, single transaction).
- My Blends list, detail, edit (recipe edit bumps `version`), duplicate.
- Status transitions DRAFT, ACTIVE, ARCHIVED; `daily_usage_kg` captured on activation.
- Presets CRUD; `preset_id` accepted by `generate-blend` and merged into the request.
- Editor with live sum indicator, Save disabled unless total is 100.

**Exit criteria**

- Blend and presets persist across devices on the same Google account.
- User B gets 404 on user A's blend and preset ids.
- A recipe summing to 99 or containing an unavailable bean is rejected on save.

---

## Phase 5: Feedback loop

**Goal.** Feedback visibly changes the next recommendation.

**Tasks**

- Model and migration: `feedback` (with `brew_context`, `recipe_snapshot`).
- `POST /api/blends/:id/feedback`, `GET /api/blends/:id/feedback`.
- Index feedback comments into `knowledge_chunks` with the owner's id.
- `feedback_service`: aggregate ratings per brew context, rule-based constraints saved to `owner_profiles.taste_adjustments` (for example max acidity for milk drinks).
- Generation reads adjustments as hard constraints plus retrieved comments, and returns `applied_feedback`.
- Feedback form on the blend page; UI copy says "adjusted using your previous feedback".
- Seed one blend with feedback so the demo effect is immediate.

**Exit criteria**

- After low-acidity-for-milk feedback, a milk-style generation uses lower-acidity beans and lists what it applied.
- Feedback from user A never appears in user B's prompt.

---

## Phase 6: Business flow

**Goal.** Owner orders from suppliers; suppliers fulfil; owner tracks.

**Tasks**

- Models and migration: `orders`, `order_items` (and `group_id` on orders).
- `POST /api/orders`: one order per supplier, row-locked stock reservation, unit price snapshot, total computed server-side.
- Supplier order list and `PATCH /orders/:id/status` with forward-only transitions.
- Owner cancel (PENDING or CONFIRMED) releases reserved stock; owner marks COMPLETED after DELIVERED.
- Reorder from a blend creates the grouped orders.
- Owner Active Orders page with the five-segment timeline (CONFIRMED, PREPARING, READY, SHIPPED, DELIVERED; labels from config).

**Exit criteria**

- Ordering more than available stock fails with a clear error and stock never goes negative under concurrent requests.
- Invalid status jumps return 409.
- Supplier sees only orders addressed to them and no owner blend data.

---

## Phase 7: Nice to have

Build in this order, stop when time runs out.

1. **Reorder intelligence.** `owner_stock` table, increment on DELIVERED, `days_remaining = min(stock / (daily_usage * pct / 100))`, "Reorder soon" card.
2. **Dashboard summary.** Kilograms ordered and spend this month.
3. **Substitute a bean.** `POST /api/ai/substitute` through the same validation path; warning on blends containing out-of-stock beans.
4. **Hardening.** Rate limits on `/ai/*` and `/auth/*`, IDOR tests per resource, empty and error states.
5. **Spend chart.** One monthly cost chart in Insights.
6. **Producer spotlight.** From existing bean and supplier fields.
7. **AI Lab.** Free-form chat and feedback analysis, no persistence until saved.

**Exit criteria.** Each item works on production and does not break the Phase 1-6 demo path.

---

## Phase gate checklist

Run this at the end of every phase before starting the next.

- [ ] Migrations apply cleanly on a fresh database and on production.
- [ ] New endpoints have auth, role check, ownership scope, Pydantic validation.
- [ ] One cross-user access test per new resource returns 404.
- [ ] No secrets in frontend code or logs.
- [ ] Deployed and clicked through on production, not only locally.
- [ ] Exit criteria for the phase all pass.

## Demo path

```text
Login -> Dashboard -> Browse beans -> New Blend (describe flavor)
-> AI recipe -> Save -> Activate -> Submit feedback
-> Next generation shows adjustment -> Reorder reminder -> Create supplier order
```

Phases 1-6 must support this path end to end. Phase 7 items improve it but are not required for it.