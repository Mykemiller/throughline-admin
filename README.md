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
pnpm seed                     # idempotent; recreates the prototype dataset
pnpm dev
```

Note: the env template is `env.example` (no leading dot) so tooling never confuses it with a real env file. Copy it to `.env`, which is git-ignored.

## Environment variables

| Var | Purpose |
| --- | --- |
| `DATABASE_URL` | Prisma runtime URL. Production: Supabase **transaction pooler** (`:6543`) with `?pgbouncer=true&connection_limit=1&schema=admin` |
| `DIRECT_URL` | Migrations/seed URL. Production: Supabase **session pooler** (`:5432`) with `?schema=admin` |
| `AUTH_SECRET` | Signs steward sessions, magic-link tokens, impersonation tokens |
| `ADMIN_EMAILS` | Comma-separated allowlist of steward emails. Every session has role `steward` |
| `ADMIN_ACCESS_KEY` | Steward-key login at `/login` — the bootstrap path until an email provider is configured |
| `SERVICE_TOKENS` | Telemetry bearer tokens, `slug:token` comma-separated (slugs below) |
| `RESEND_API_KEY` / `EMAIL_FROM` | Optional. When set, magic-link + invitation letters are actually delivered; otherwise the mailer logs them server-side |
| `STRIPE_SECRET_KEY` | Optional. When set, refunds hit Stripe; otherwise a stub provider records them |
| `NEXT_PUBLIC_APP_URL` | Base URL used in emailed links |
| `ADMIN_TIMEZONE` | Display TZ for "today, 9:12a" formatting (default `America/Los_Angeles`) |

## Auth

`/login` offers two doors, both restricted to `ADMIN_EMAILS`:

- **Letter (magic link)** — 15-minute one-time link, delivered via the mailer interface.
- **Steward key** — `ADMIN_ACCESS_KEY` typed into the login page. Exists so the console is usable before email delivery is wired; rotate or unset it once Resend is configured.

Sessions are 7-day httpOnly JWT cookies with role `steward`. Everything except `/login`, `/api/auth/*`, and `/api/ingest/*` requires one.

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
ADMIN_ACCESS_KEY=<key> pnpm e2e   # Playwright happy path: search → open → suspend → toast → log filter
```

## Conventions

- Companion default when creating subscribers: Seth for female, Miriam for male (cross-gender by design); invites default to Seth and the select stays freely editable.
- Derived metrics are computed in queries, never stored (time engaged = Σ session minutes; chapters = progress rows vs 12; tiles = row counts).
- Plan prices seeded as Founding $249 / Family $149 / Solo $79 — placeholders until billing lands.
