# Throughline Administrator

Internal ops console for the Throughline product family (Weaver, Surfer, Witness, Reunion, Scout, the Narrator/AI Service Core, and the ingestion pipelines). Live at **https://www.throughline-admin.com**.

It does three things:

1. **Administer subscribers** — search/filter, edit plan/companion/status, suspend/reactivate, refund, cancel, impersonate ("view as"), invite.
2. **Monitor subscriber progress** — time engaged, photographs attached, chapters completed, family added through dialogue, per-product engagement.
3. **Monitor data sources & error logs** — ingestion counters, service health for all nine sources, filterable log.

Design source of truth: [`design_handoff_throughline_admin/`](design_handoff_throughline_admin/README.md) (tokens, per-screen specs, microcopy — all verbatim in this app).

## Stack

Next.js (App Router, TypeScript strict) · PostgreSQL via Prisma (Supabase in production, `admin` schema) · Tailwind v4 configured with the Throughline tokens only · JWT sessions (`jose`) · deployed on Vercel.

## Setup

```bash
pnpm install
docker compose up -d          # local Postgres on :5433
cp env.example .env           # fill in values (see below)
pnpm prisma migrate deploy    # or `pnpm prisma migrate dev` while developing
pnpm seed                     # production bootstrap: steward, 7 chapters, service registry
pnpm seed:demo                # OR: the full design-prototype demo dataset (destructive)
pnpm dev
```

Note: the env template is `env.example` (no leading dot) so tooling never confuses it with a real env file. Copy it to `.env`, which is git-ignored.

## Environment variables

| Var | Purpose |
| --- | --- |
| `DATABASE_URL` | Prisma runtime URL. Production: Supabase **transaction pooler** (`:6543`) with `?pgbouncer=true&connection_limit=1&schema=admin` |
| `DIRECT_URL` | Migrations/seed URL. Production: Supabase **session pooler** (`:5432`) with `?schema=admin` |
| `AUTH_SECRET` | Signs steward sessions and impersonation tokens |
| `SERVICE_TOKENS` | Telemetry bearer tokens, `slug:token` comma-separated (slugs below) |
| `RESEND_API_KEY` / `EMAIL_FROM` | Optional. When set, invitation letters are actually delivered; otherwise the mailer logs them server-side. Activate everything (domain, DNS, verification, env, redeploy, test letter) with `RESEND_API_KEY=re_xxx pnpm setup:resend` |
| `STRIPE_SECRET_KEY` | Optional. When set, refunds hit Stripe; otherwise a stub provider records them |
| `NEXT_PUBLIC_APP_URL` | Base URL used in emailed links |
| `ADMIN_TIMEZONE` | Display TZ for "today, 9:12a" formatting (default `America/Los_Angeles`) |

## Auth

Email + password at `/login`. Stewards live in the `AdminUser` table (scrypt-hashed passwords); the seed creates the sole authorized steward if missing and **never resets an existing password**. Passwords are changed in the **Account** screen (click the user row at the bottom of the sidebar), which also has sign-out.

Sessions are 7-day httpOnly JWT cookies with role `steward`. Everything except `/login`, `/api/auth/*`, and `/api/ingest/*` requires one.

## Real product data (the bridge)

Overview/Sources counters and the subscriber list draw from the real Throughline product tables through two **read-only views** — `admin.bridge_counts` and `admin.bridge_subscribers` (definition: [`foundry/sql/bridge-views.sql`](foundry/sql/bridge-views.sql), run once as `postgres`). The app role can `SELECT` those views only; it has no grants on `public` tables. Until the views exist, everything degrades gracefully to admin-schema data.

- **Sync**: each admin page upserts product subscribers into the admin schema. Product owns `name`/`email` (refreshed every sync) and supplies first-import plan/companion/status (`profile_complete` ⇒ Active, else Invited). After import, **plan, companion, and status belong to the steward** — product changes never overwrite them.
- **Plan mapping**: `MVP` → Founding · `family` → Family · `standard` (or unknown) → Solo.
- **Statuses**: Planned · Active · Invited · Suspended · Cancelled · Dead. Sync derives only Active/Invited; the rest are set in the console.
- **Chapters**: the 7 real chapters (First Light → Last Night) live in the `Chapter` table; totals are derived, never hard-coded. `public.subscribers.chapter_progress` contract: JSON object keyed by ordinal (`{"3": true}`) or slugged title (`{"the_school_years": true}`), truthy = complete.
- **Not bridged (telemetry-fed instead)**: time engaged, per-subscriber photos, logs, service health, historical events.

## Telemetry contract (for product teams)

Every upstream reports through one door:

```
POST /api/ingest/telemetry
Authorization: Bearer <your service token>
Content-Type: application/json

{ "events": [ ... up to 500 ... ] }
```

Service slugs: `photo-ingestion`, `genealogy-feed`, `historical-archive`, `narrator`, `weaver`, `surfer`, `witness`, `reunion`, `scout`.

Event shapes:

| type | fields |
| --- | --- |
| `heartbeat` | `status?` (`ok`\|`degraded`\|`down`), `note?` — updates the health card. A service that has heartbeated before and then goes quiet 15+ min reads as degraded on the console |
| `log` | `severity` (`error`\|`warn`\|`info`), `message`, `meta?` |
| `session` | `subscriberEmail`, `product`, `startedAt` (ISO), `endedAt?`, `durationMin` — feeds "time engaged" and bumps `lastActiveAt` |
| `photo` | `storageKey`, `subscriberEmail?`, `exifTakenAt?`, `checksumOk?` — no `exifTakenAt` ⇒ era estimated |
| `family_member` | `subscriberEmail`, `name`, `relation`, `addedVia?`, `source?` |
| `historical_event` | `title`, `year`, `era`, `sourceRef?` — deduped on `title::year` |

Responses: `200` all accepted, `207` partial (body lists rejected indices), `401` bad token.

`pnpm simulate` replays a realistic batch (sessions, a photo, log events, a degraded Genealogy Feed) against `SIMULATE_URL` so the console can be demonstrated live end-to-end.

## API surface

`GET /api/overview` · `GET /api/subscribers?query=&status=` · `GET|PATCH /api/subscribers/:id` · `POST /api/subscribers/:id/impersonate` (mints a 15-min read-only token for the subscriber app) · `POST /api/subscribers/:id/refund` · `POST /api/invitations` · `GET /api/progress` · `GET /api/services` · `GET /api/logs?source=&severity=&cursor=` (paginated) · `POST /api/ingest/telemetry`.

Every admin mutation writes an `AuditEvent` (actor, action, subscriber, detail).

## Tests

```bash
E2E_ADMIN_EMAIL=<email> E2E_ADMIN_PASSWORD=<password> pnpm e2e   # happy path: search → open → suspend → toast → log filter
```

The happy path expects the demo dataset (`pnpm seed:demo`) — run it against local Postgres, not production.

## Conventions

- Companion default when creating subscribers: Seth for female, Miriam for male (cross-gender by design); invites default to Seth and the select stays freely editable.
- Derived metrics are computed in queries, never stored (time engaged = Σ session minutes; chapters = progress rows vs 12; tiles = row counts).
- Plan prices seeded as Founding $249 / Family $149 / Solo $79 — placeholders until billing lands.
