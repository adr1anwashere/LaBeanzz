LaBeans Architecture Blueprint
Architecture blueprint v1, 12 November 2026. Stack: Next.js, Flask, PostgreSQL with pgvector, OpenRouter.
0. Decisions that extend or change the brief
These came up while reading the brief end to end. Each one is settled below so implementation does not stall on it.
1. Flask issues its own JWT. Auth.js handles Google OAuth in Next.js. Flask verifies the Google ID token once, upserts the user, and returns a short-lived app JWT carrying sub and role. All later API calls use that JWT.
2. Next.js acts as a thin proxy (BFF). Browser calls go to /api/proxy/* on Next, which attaches the JWT server-side. The token never sits in browser JS, and CORS stays simple.
3. Predicted flavor profile is split in two. Acidity, body and sweetness are computed deterministically as the percentage-weighted average of the beans' stored values. Tasting-note axes (chocolate, caramel, fruitiness) are LLM estimates and labelled as such in the UI. This keeps the number trustworthy and honest.
4. Owner inventory is a new table. Reorder intelligence needs on-hand stock and usage, and the brief only models supplier stock. See owner_stock and blends.daily_usage_kg.
5. Order lifecycle gets CANCELLED. The brief has no way to cancel. Stock is reserved at order creation and released on cancel.
6. Timeline labels are config, not statuses. The UI spec shows 5 segments (Harvested, Sorted, Blended, Shipped, Delivered) while the brief has 7 statuses. Mapping: the 5 segments are CONFIRMED, PREPARING, READY, SHIPPED, DELIVERED with default labels Confirmed, Blending, Ready, Shipped, Delivered. PENDING renders all segments dim with an 'Awaiting supplier' note. COMPLETED renders all segments filled. 'Harvested' and 'Sorted' would imply farm-side events the data model does not track.
7. Branding and theme. The UI spec says 'Marrow'.  & mobile friendly Treat Marrow as the design system (tokens, components) and show the LaBeans wordmark. The Coffee/Tea switcher is out of scope; keep only the token and label config so a second product is possible later. Currency is config with default USD (the brief mixes $ and USD); store amounts as numeric plus a currency code.
8. Navigation overlap resolved. New Blend is the guided generator (form to recipe). AI Lab is the free-form sandbox: chat, substitute-a-bean, feedback analysis, nothing persisted until saved. Insights holds analytics and reorder intelligence.
9. Beans are retrieved with SQL, not vectors. The catalog is small and structured, so filter by availability and pass the candidates straight to the LLM. pgvector is used for knowledge documents and the owner's feedback, where semantic search earns its place.
10. Verify before depending on it: whether OpenRouter's embeddings endpoint and your chosen LLM support JSON-schema structured output. Fallbacks are in section F.
A. Executive Product Summary
What it is. LaBeans is an AI coffee development partner for coffee shop owners. It combines a bean marketplace view, blend management, an AI blend generator grounded in coffee knowledge, a feedback loop, and ordering.
Who it is for. Primary: shop owners and startup café founders without blending expertise. Secondary: bean suppliers who list inventory and fulfil orders.
Problem. Blending by trial and error is expensive, supply changes without warning, and nothing connects what the owner tasted to what they buy next.
Why AI. Choosing a blend is a constrained search (available beans, target flavor, price, past complaints) with fuzzy human language as input. An LLM turns 'bold espresso, dark chocolate, low acidity' into a candidate recipe. Retrieval keeps it grounded in real beans and the owner's own history, and server-side validation keeps it correct.
Differentiation. It is not a chatbot. AI output is structured, validated against live inventory, tied to a supplier you can order from, and adjusted by your own feedback. Discover, Create, Save, Test, Learn, Reorder happens in one product.
Honesty constraint. The learning loop is retrieval plus structured preference adjustment, not model training. The UI and demo script must say so.
B. Product Architecture
Browser
  |  (session cookie, Auth.js)
Next.js on Vercel
  - pages, Auth.js Google login
  - /api/proxy/*  attaches app JWT server-side
  |  HTTPS + Bearer JWT
Flask API (gunicorn) on Railway/Render
  - routes -> services -> models
  - AI service -> OpenRouter (chat + embeddings)
  - RAG service -> pgvector
  |
PostgreSQL (managed) + pgvector
One Flask monolith, one database, no queue, no cache layer. The AI call runs synchronously inside the request.
Request path example (generate blend). Browser posts to Next proxy. Proxy adds the JWT and forwards to Flask. Flask checks role OWNER, loads available beans, runs retrieval, calls OpenRouter, validates, logs to ai_generations, returns the draft. Nothing is saved as a blend until the owner clicks Save.
C. Actors and RBAC
Resource
OWNER
SUPPLIER
Own profile
read/update
read/update
Coffee beans
read all listed beans
CRUD own beans only
Suppliers
read public profiles
update own profile
Blends, presets, feedback
CRUD own only
no access
AI endpoints
own use only
no access
Orders
create; read/cancel own
read orders addressed to them; update status
Spend, volume, reorder analytics
own only
no access
Enforcement rules
• Every route carries @require_auth and @require_role(...). No role means 403 on everything except /auth/* and onboarding.
• Ownership is enforced in queries, never after fetch. Use scoped helpers such as Blend.query.filter_by(owner_id=g.user.id), so another user's id returns 404 (not 403) and leaks nothing.
• Suppliers see an order only through orders.supplier_id = their supplier id. They see bean names and quantities, not the owner's blends, feedback or analytics.
• Role is set once during onboarding and is immutable in the MVP.
• Write one IDOR test per resource: user B requests user A's id and must get 404.
D. Database Design
PostgreSQL 15+, extensions pgcrypto (UUIDs) and vector. All primary keys are uuid default gen_random_uuid(). All tables have created_at timestamptz default now(); mutable ones add updated_at.
Tables
users: id, google_sub (unique, not null), email (unique), name, avatar_url, role (enum OWNER|SUPPLIER, nullable until onboarding), onboarded_at.
owner_profiles: user_id (PK, FK users), business_name, currency (default IDR), taste_adjustments (jsonb, derived from feedback, see F).
suppliers: id, user_id (unique FK users), business_name, region, country, story (text), photo_url.
coffee_beans: id, supplier_id (FK), name, origin, region, farm, producer, varietal, altitude_m (int), processing_method, roast_level, flavor_notes (text[]), acidity, body, sweetness (each numeric(3,1), check 0-10), price_per_kg numeric(12,2), stock_kg numeric(10,2) check >= 0, status (AVAILABLE|LOW_STOCK|RESERVED|OUT_OF_STOCK), producer_story (text, for spotlight).
blends: id, owner_id (FK users), name, description, status (DRAFT|ACTIVE|ARCHIVED), source_generation_id (FK ai_generations, nullable), predicted_profile (jsonb: {computed:{...}, estimated:{...}}), daily_usage_kg numeric(8,2) nullable, style (espresso|filter|milk), version int.
blend_items: id, blend_id (FK, cascade), coffee_bean_id (FK), percentage int check 1-100. Unique on (blend_id, coffee_bean_id). The sum equals 100 and is enforced in the service layer inside one transaction. Integer percentages make 'exactly 100' unambiguous.
presets: id, owner_id (FK), name, flavor_preferences (jsonb, keys come from config), acidity_pref, body_pref, sweetness_pref (numeric(3,1)), brewing_method, coffee_style, notes. Unique on (owner_id, name).
orders: id, owner_id (FK), supplier_id (FK), status (PENDING|CONFIRMED|PREPARING|READY|SHIPPED|DELIVERED|COMPLETED|CANCELLED), total_price, currency, source_blend_id (nullable FK), eta_date, notes.
order_items: id, order_id (FK, cascade), coffee_bean_id (FK), quantity_kg, unit_price (snapshot at order time).
One order belongs to one supplier. Reordering a blend whose beans come from several suppliers creates one order per supplier, grouped by a shared group_id (uuid, nullable on orders).
owner_stock: id, owner_id (FK), coffee_bean_id (FK), quantity_kg. Unique on (owner_id, coffee_bean_id). Incremented when an order reaches DELIVERED. The owner can also adjust it manually.
feedback: id, blend_id (FK), owner_id (FK), overall, flavor, body, acidity, sweetness (int 1-5), brew_context (espresso|filter|milk), comment, recipe_snapshot (jsonb, copy of the recipe tested), created_at.
ai_generations: id, owner_id, kind (GENERATE|SUBSTITUTE|CHAT|FEEDBACK_ANALYSIS), input (jsonb), retrieved_chunk_ids (uuid[]), raw_output (text), validated_output (jsonb, nullable), status (OK|INVALID|ERROR), model, latency_ms, error.
knowledge_chunks: id, owner_id (nullable; null means global knowledge), source_type (DOC|BEAN|FEEDBACK|BLEND), source_id (nullable), content text, metadata jsonb, embedding vector(1536). The dimension must match the chosen embedding model; set it once before ingestion.
Relationships (ERD)
users 1--0..1 owner_profiles
users 1--0..1 suppliers
suppliers 1--* coffee_beans
users(owner) 1--* blends 1--* blend_items *--1 coffee_beans
users(owner) 1--* presets
users(owner) 1--* orders *--1 suppliers
orders 1--* order_items *--1 coffee_beans
users(owner) 1--* owner_stock *--1 coffee_beans
blends 1--* feedback
users(owner) 1--* ai_generations
knowledge_chunks *--0..1 users(owner)   (null = global)
Indexes
• coffee_beans (status, supplier_id), coffee_beans (supplier_id)
• blends (owner_id, status), presets (owner_id)
• orders (owner_id, status), orders (supplier_id, status), order_items (order_id)
• feedback (blend_id), feedback (owner_id, created_at desc)
• knowledge_chunks (owner_id, source_type) and an HNSW index: USING hnsw (embedding vector_cosine_ops). At seed-data scale it works without the vector index too; add it once there are thousands of rows.
pgvector design
Retrieval always filters owner_id IS NULL OR owner_id = :current_user before ranking. That one clause is what stops one owner's feedback from reaching another owner's prompt. It must live inside the retrieval function so no caller can skip it.
E. API Architecture
Base /api. JSON in, JSON out. Errors use { "error": { "code": "...", "message": "...", "fields": {} } } with 400/401/403/404/409/422/429. Lists take limit, cursor or page. Request bodies are validated with Pydantic v2.
Method
Path
Role
Authorization notes
POST
/auth/google
public
verifies Google ID token, returns app JWT
GET
/auth/me
any
current user, role, onboarded flag
POST
/auth/onboard
any, once
sets role, creates owner_profile or supplier
GET
/dashboard/summary
OWNER
active orders, month kg, month spend, reorder, spotlight
GET
/coffee-beans
OWNER, SUPPLIER
owners: listed beans from all suppliers; suppliers: own only
POST
/coffee-beans
SUPPLIER
supplier_id taken from token
GET
/coffee-beans/:id
OWNER, SUPPLIER
suppliers only their own
PATCH
/coffee-beans/:id
SUPPLIER
own bean only, includes stock and status
GET
/suppliers, /suppliers/:id
OWNER
public profile fields only
GET
/blends
OWNER
own, filter by status
POST
/blends
OWNER
validates sum 100, beans exist and are available
GET, PATCH
/blends/:id
OWNER
own only; recipe edit bumps version
POST
/blends/:id/duplicate
OWNER
own only
POST
/blends/:id/status
OWNER
DRAFT/ACTIVE/ARCHIVED transitions
POST
/blends/:id/feedback
OWNER
own blend only
GET
/blends/:id/feedback
OWNER
own only
GET, POST
/presets
OWNER
own only
PATCH, DELETE
/presets/:id
OWNER
own only
POST
/ai/generate-blend
OWNER
accepts prompt and/or preset_id; rate limited
POST
/ai/substitute
OWNER
replace an unavailable bean in a blend
POST
/ai/chat
OWNER
sandbox, grounded the same way, no side effects
POST
/ai/analyze-feedback
OWNER
summarises own feedback, refreshes taste_adjustments
GET
/ai/generations/:id
OWNER
own only
GET
/orders
OWNER, SUPPLIER
owner sees own; supplier sees orders addressed to them
POST
/orders
OWNER
creates one order per supplier, reserves stock
GET
/orders/:id
OWNER, SUPPLIER
party to the order only
PATCH
/orders/:id/status
SUPPLIER, OWNER
supplier: forward transitions; owner: cancel while PENDING, mark COMPLETED
GET
/insights/spend, /insights/volume, /insights/reorder
OWNER
own only
GET, PATCH
/owner-stock
OWNER
own only
Status transitions (enforced server-side). Supplier moves PENDING to CONFIRMED, PREPARING, READY, SHIPPED, DELIVERED in order only. The owner moves DELIVERED to COMPLETED and may cancel from PENDING or CONFIRMED. Any other move returns 409.
Examples
POST /api/ai/generate-blend
{
  "prompt": "Bold espresso, dark chocolate and caramel, low acidity, heavy body",
  "preset_id": null,
  "style": "espresso",
  "max_price_per_kg": 180000
}
Response 200:
{
  "generation_id": "b1f0...",
  "draft": {
    "blend_name": "Graveyard Shift",
    "description": "A bold chocolate-forward espresso blend",
    "recipe": [
      { "coffee_bean_id": "uuid-a", "name": "Brazil Santos", "percentage": 55 },
      { "coffee_bean_id": "uuid-b", "name": "Gayo Aceh", "percentage": 30 },
      { "coffee_bean_id": "uuid-c", "name": "Ethiopia Yirgacheffe", "percentage": 15 }
    ],
    "profile": {
      "computed": { "acidity": 3.8, "body": 8.9, "sweetness": 6.2 },
      "estimated": { "chocolate": 9.1, "caramel": 8.4, "fruitiness": 4.2 }
    },
    "reasoning": "Brazil Santos is the chocolate and caramel base...",
    "applied_feedback": ["Reduced acidity: your last two milk-based tests were rated too acidic."]
  }
}
POST /api/orders
{ "supplier_id": "uuid", "source_blend_id": "uuid", "items": [ { "coffee_bean_id": "uuid-a", "quantity_kg": 14 } ] }
POST /api/blends/:id/feedback
{ "overall": 4, "flavor": 4, "body": 5, "acidity": 2, "sweetness": 3, "brew_context": "milk", "comment": "Great body, slightly too acidic for milk drinks" }
F. AI Architecture
Knowledge ingestion
A script scripts/ingest_knowledge.py reads markdown files in knowledge/ (origins, varietals, processing methods, roast effects, blending principles, 10-20 hand-written blend archetypes), splits them into 300-500 token chunks, embeds them, and inserts rows with owner_id = NULL. Beans and feedback are indexed into the same table through rag_service.index_feedback() and index_bean(), called on write. Write the global documents yourself or from sources you have the right to use. Quality here sets the ceiling of the demo.
Generation pipeline
1. Parse intent. Combine prompt, preset values and form constraints into one structured request.
2. Candidate beans. SQL: status in (AVAILABLE, LOW_STOCK), stock above a minimum, optional price cap. For a catalog under roughly 50 beans, pass all candidates; above that, pre-rank by distance to target acidity, body and sweetness.
3. Retrieve context. Embed the request and pull the top 6-8 chunks (global knowledge plus this owner's feedback and blends) through the owner-scoped retriever.
4. Apply taste adjustments. Read owner_profiles.taste_adjustments, for example { "milk": { "acidity_max": 4.0 } }, and add it to the prompt as hard constraints.
5. Call the LLM through the AI service with a JSON schema response format and low temperature.
6. Validate (below). On failure retry once with the validation error appended. A second failure returns 422 and logs INVALID.
7. Compute the weighted acidity, body, sweetness from stored bean values; keep the LLM's note estimates in the separate estimated block.
8. Log everything in ai_generations, return the draft. Saving is a separate call.
Validation rules
• Percentages are integers, each 1-100, sum exactly 100, 2-5 components, no duplicate beans.
• Every coffee_bean_id exists, is in the candidate set sent to the model, and is still available at save time (re-checked then, because stock can change between draft and save).
• Names and descriptions are length-capped and rendered as text, never as HTML.
• Reasoning text is displayed but never trusted as data.
AI service abstraction
ai_service.py
  complete_json(messages, schema, model=None) -> dict
  embed(texts) -> list[list[float]]
Both go through one OpenRouter client (OpenAI-compatible base URL, OPENROUTER_API_KEY, OPENROUTER_MODEL, optional OPENROUTER_EMBED_MODEL). Services never import the HTTP client directly, so changing models or providers touches one file. If the chosen model lacks native JSON-schema support, request JSON in the prompt and parse with the same Pydantic validation and retry.
Embeddings fallback. If OpenRouter's embeddings endpoint does not suit you, call an embeddings API directly from the backend or run a small local model, and set vector(n) to match. Decide before the first ingestion because changing the dimension means re-embedding.
Feedback loop (what is actually implemented)
• Each feedback row is stored with its recipe snapshot and indexed as a chunk, so the retriever can surface it for similar future requests.
• analyze-feedback (and a lightweight recompute after each submission) aggregates the owner's ratings per brew_context. A rule turns repeated low acidity or sweetness scores into constraints in taste_adjustments. This part is plain SQL and thresholds; no model is involved.
• The generator receives both the constraints and the retrieved comments, and must list what it applied in applied_feedback.
• UI copy: 'Adjusted using your previous feedback', never 'the AI has learned'.
Substitute-a-bean
When a blend contains a bean that goes OUT_OF_STOCK, the blend card shows a warning. POST /ai/substitute sends the blend, the missing bean's profile and the candidates, then returns the closest replacement and a re-balanced recipe through the same validation path. This answers the 'bean ran out' problem from the brief.
Reorder intelligence
For each active blend: days_remaining = min over beans of owner_stock_kg / (daily_usage_kg * percentage / 100). The bean that runs out first is named. Show 'Reorder soon' when days remaining is under a configurable threshold (default 10). It needs daily_usage_kg set when a blend is activated.
G. Authentication Architecture
Continue with Google
  -> Auth.js (Google provider) -> Google consent
  -> Auth.js receives id_token
  -> server-side: POST Flask /auth/google { id_token }
  -> Flask verifies signature, audience, expiry (google-auth)
  -> upsert users by google_sub
  -> returns app JWT + user { role, onboarded }
  -> Auth.js stores JWT in its encrypted session cookie
  -> role null? redirect /onboarding : redirect by role
• Verification. Flask checks the token against GOOGLE_CLIENT_ID (audience) and requires email_verified. Identity key is google_sub, never email.
• App JWT. HS256, signed with JWT_SECRET, claims sub (user id), role, exp (24 hours for the MVP). On expiry the user signs in again. Token refresh is a later improvement.
• Role in the token is a hint. The backend reloads the user for authorization-sensitive actions, so a role change takes effect immediately.
• Onboarding. /auth/onboard accepts OWNER or SUPPLIER once. Owner creates owner_profiles; supplier creates suppliers. A second call returns 409.
• Frontend gating. Next middleware redirects by role and onboarding state. This is UX only; Flask is the authority.
• Security. The Google client secret and AUTH_SECRET stay in Vercel server env. Cookies are HttpOnly, Secure, SameSite=Lax. Flask CORS allows only the production and preview origins you list. Rate limiting on /auth/google and /ai/*.
H. Frontend Architecture
Stack. Next.js App Router, TypeScript, Tailwind with the Marrow tokens as CSS variables, Auth.js, TanStack Query for server state, React Hook Form with Zod for forms, Recharts for the one spend chart. No global client store is needed.
Theme tokens (--bg #14100E, --surface #1E1815, --border #2E2621, --text #F2E9E1, --muted #A39488, --dim #3A312B, --candle #F5C84C, --accent #E8833A, --accent-2 #C9A27E, --on-accent #14100E) live in one file; fonts (Fraunces, Inter) load through next/font. A product.config.ts holds labels, units, flavor axes, order stage labels and currency, so nothing is hardcoded in components.
Routes
/login
/onboarding
(owner)    /dashboard  /beans  /beans/[id]  /blends/new  /blends  /blends/[id]
           /presets  /orders  /orders/[id]  /ai-lab  /suppliers  /suppliers/[id]
           /insights  /settings
(supplier) /supplier/dashboard  /supplier/beans  /supplier/orders  /supplier/profile
/api/auth/[...nextauth]   /api/proxy/[...path]
Component layout
components/ui/        Button, Card, FlavorBar, StatTile, Chip, Dialog, Toast
components/layout/    TopNav, Sidebar, PageHeader
components/features/  OrderTimeline, BlendCard, BlendRecipeEditor, BeanCard,
                      FlavorTargetForm, AIReasoningPanel, FeedbackForm,
                      ReorderCard, ProducerSpotlight, SpendChart
lib/api/              typed client per module (beans, blends, ai, orders...)
lib/schemas/          Zod schemas mirroring backend Pydantic models
AI interaction states. Generation takes several seconds: show a staged loader (retrieving knowledge, selecting beans, validating), then the recipe with a percentage bar, the computed vs estimated profile, reasoning, and applied feedback. The owner can tweak percentages (live sum indicator, Save disabled unless 100) before saving.
Supplier UI. Separate layout, four pages, same components. Supplier routes are unreachable for OWNER by middleware and by the API.
I. Backend Architecture
backend/
  app/
    __init__.py          app factory, extensions, error handlers
    config.py            env-driven config
    extensions.py        db, migrate, limiter, cors
    auth/                decorators.py (require_auth, require_role), google.py, jwt.py
    routes/              auth, users, coffee_beans, suppliers, blends, presets,
                         orders, feedback, ai, insights, owner_stock
    schemas/             Pydantic request/response models
    services/            coffee_service, blend_service, order_service,
                         ai_service, rag_service, recommendation_service,
                         feedback_service, insights_service
    models/              SQLAlchemy models, one file per table
    prompts/             generate_blend.md, substitute.md (versioned text)
  knowledge/             markdown source documents
  migrations/            Alembic via Flask-Migrate
  scripts/               seed.py, ingest_knowledge.py
  tests/
  wsgi.py
Layering rule. Routes parse and authorize, call a service, return a schema. Services hold business rules and transactions. Models hold no logic beyond relationships. Order creation and blend saving run in single transactions with row locks (SELECT ... FOR UPDATE) on beans so stock cannot go negative.
Libraries. Flask, Flask-SQLAlchemy, Flask-Migrate, Pydantic v2, PyJWT, google-auth, Flask-Limiter, Flask-CORS, pgvector (Python package), httpx, gunicorn, pytest.
Rate limiting. Flask-Limiter on /ai/* (for example 10 per minute per user) and /auth/*. In-memory storage is per process, so run one gunicorn worker with threads for the demo, or add Redis later.
J. Deployment Architecture
Piece
Host
Notes
Frontend
Vercel
set maxDuration on the proxy route so AI calls are not cut off; check your plan's function limit
Backend
Railway or Render
gunicorn; run flask db upgrade at release; Render's free tier sleeps, so use a paid instance or pre-warm before the demo
Database
Managed Postgres with pgvector
Supabase, Neon, Railway and Render all offer it; use it purely as Postgres, no vendor auth. Run migrations on the direct connection, the app on the pooled one
AI
OpenRouter
called only from Flask
Environment variables
Frontend (Vercel, server-side only unless prefixed):
AUTH_SECRET
AUTH_URL
AUTH_GOOGLE_ID
AUTH_GOOGLE_SECRET
API_URL                 backend base URL, used by the proxy
Backend:
DATABASE_URL
JWT_SECRET
GOOGLE_CLIENT_ID
OPENROUTER_API_KEY
OPENROUTER_MODEL
OPENROUTER_EMBED_MODEL
CORS_ORIGINS
FLASK_ENV
There is deliberately no NEXT_PUBLIC_API_URL: the browser only talks to Next. Add Google OAuth redirect URIs for local, preview and production. Commit .env.example for both apps, never real values.
Production checks. HTTPS everywhere, CORS locked to known origins, debug off, secrets only in host dashboards, /health endpoint, request logging with user id and generation id (no prompts containing personal data in logs).
K. MVP Roadmap
Must have (demo path)
1. Foundation. Monorepo (frontend/, backend/), Flask app factory, Postgres plus pgvector, Alembic baseline, Next app with theme tokens, Auth.js Google login, /auth/google, /auth/me, onboarding, role decorators, first deploy of both apps. Deploy early; it removes the biggest end-of-hackathon risk.
2. Core data and seed. Models for users, suppliers, beans. Supplier bean CRUD. Owner bean list and detail. Seed script with 3 suppliers and about 20 beans with realistic attributes. Owner dashboard shell.
3. AI generation. AI service, knowledge ingestion, retriever, generate-blend, validation and retry, ai_generations logging, New Blend page.
4. Blend management. Save blend, My Blends, status changes, presets, duplicate.
5. Orders. Create order with stock reservation, supplier order list and status updates, owner Active Orders with the timeline.
6. Feedback loop. Feedback form, storage, indexing, taste adjustments, 'applied feedback' shown in the next generation. Seed one blend with feedback so the demo shows the effect immediately.
Should have
7. Reorder reminder (owner_stock, daily_usage_kg, days remaining card).
8. Dashboard summary: kilograms ordered and spend this month.
9. Substitute-a-bean for out-of-stock beans.
10. Rate limiting, IDOR tests, error states and empty states everywhere.
Nice to have
11. One monthly spend chart in Insights.
12. Producer spotlight (uses existing bean and supplier fields).
13. AI Lab chat and feedback analysis view.
14. Token refresh, supplier photo upload, email notifications.
Demo script alignment
Discover (beans, seeded) then Create (generate) then Save then Test (feedback on a pre-seeded blend) then Learn (second generation visibly adjusted) then Reorder (reminder to order). Every step maps to a Must or Should item above; the order timeline and the 'Reorder soon' card are the visual payoff.
Recommended implementation order
Phase 1 foundation first (it includes the first deployment), then core data and seed, then AI generation, because AI quality depends on realistic seed beans and knowledge documents. The longest-lead item is the knowledge content: start writing the markdown documents in parallel with phase 1.
Next instruction expected: start Phase 1 (repo scaffold, auth flow, role gating, deployment config).