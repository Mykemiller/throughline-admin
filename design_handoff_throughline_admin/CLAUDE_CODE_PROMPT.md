# Claude Code Prompt — Build the Throughline Administrator (production)

Copy everything below into Claude Code from the root of the `throughline-admin` repo. The `design_handoff_throughline_admin/` folder from this package should be committed to the repo first — the prompt references it.

---

## Mission

Build a production web application: the **Throughline Administrator** — the internal ops console for the Throughline product family (Weaver, Surfer, Witness, Reunion, Scout, plus the Narrator/AI Service Core and the ingestion pipelines). A high-fidelity HTML prototype and a full design spec live in `design_handoff_throughline_admin/`. Recreate that design **exactly** (colors, type, spacing, copy, interactions — see `README.md` for tokens and per-screen specs) and wire it to a real backend.

**Definition of done:**
1. Administer subscribers (search/filter, edit plan/companion/status, suspend/reactivate, refund, cancel, impersonate, invite).
2. Monitor subscriber progress (time engaged, photographs attached, chapters completed, family members added through dialogue, per-product engagement).
3. Monitor all Throughline data sources and error logs (ingestion counters, service health, filterable log).

## Stack

Unless the repo already establishes otherwise, use:
- **Next.js 15 (App Router) + TypeScript**, React server components where sensible
- **PostgreSQL** via **Prisma** (Supabase-compatible; use `DATABASE_URL` env)
- **Tailwind** configured with the Throughline design tokens (below) — no default Tailwind palette in the UI
- **Auth**: email-magic-link or Supabase Auth restricted to an allowlist of internal ops emails; every session has role `steward`
- Deployable to Vercel; `pnpm dev` runs locally against a seeded local Postgres (docker-compose file included)

## Routes

- `/` Overview — ingestion tiles, service health grid, needs-attention feed, top-engaged subscribers
- `/subscribers` — searchable/filterable list + invite modal
- `/subscribers/[id]` — detail: metrics, editable profile, actions, family-added list, time-by-product
- `/progress` — progress tiles + per-subscriber table + engagement-by-product
- `/sources` — ingestion tiles, service health cards, filterable error log (`?source=&severity=` query params so health cards can deep-link)

## Database schema (create via Prisma migrations; extend as needed)

```prisma
enum SubscriberStatus { active invited suspended cancelled }
enum Plan { founding family solo }
enum Companion { seth miriam }
enum Product { weaver surfer witness reunion scout narrator }
enum Severity { error warn info }
enum ServiceStatus { ok degraded down }

model Subscriber {
  id            String   @id @default(cuid())
  name          String
  email         String   @unique
  plan          Plan     @default(solo)
  companion     Companion
  status        SubscriberStatus @default(invited)
  joinedAt      DateTime @default(now())
  lastActiveAt  DateTime?
  invitedAt     DateTime?
  sessions      EngagementSession[]
  photos        Photo[]
  chapterProgress ChapterProgress[]
  familyMembers FamilyMember[]
  payments      Payment[]
  auditEvents   AuditEvent[]
}

model EngagementSession {           // source of "time engaged"
  id           String   @id @default(cuid())
  subscriberId String
  subscriber   Subscriber @relation(fields: [subscriberId], references: [id])
  product      Product
  startedAt    DateTime
  endedAt      DateTime?
  durationMin  Int      // finalized on session end
  @@index([subscriberId, product])
}

model Photo {                       // source of "photographs attached"
  id           String   @id @default(cuid())
  subscriberId String?
  subscriber   Subscriber? @relation(fields: [subscriberId], references: [id])
  storageKey   String
  source       String   // "subscriber_upload" | "archive_import"
  exifTakenAt  DateTime?
  eraEstimated Boolean  @default(false)
  ingestedAt   DateTime @default(now())
  checksumOk   Boolean  @default(true)
}

model Chapter {                     // canonical chapter list (default 12)
  id      String @id @default(cuid())
  ordinal Int    @unique
  title   String
  progress ChapterProgress[]
}

model ChapterProgress {             // source of "chapters completed"
  id           String   @id @default(cuid())
  subscriberId String
  chapterId    String
  subscriber   Subscriber @relation(fields: [subscriberId], references: [id])
  chapter      Chapter    @relation(fields: [chapterId], references: [id])
  completedAt  DateTime
  @@unique([subscriberId, chapterId])
}

model FamilyMember {                // people added through companion dialogue
  id           String   @id @default(cuid())
  subscriberId String
  subscriber   Subscriber @relation(fields: [subscriberId], references: [id])
  name         String
  relation     String   // "great-grandfather", …
  addedVia     String   // e.g. "Chapter 6" or "dialogue"
  addedAt      DateTime @default(now())
  source       String   @default("dialogue") // "dialogue" | "genealogy_feed" | "manual"
}

model HistoricalEvent {             // Historical Archive ingestion
  id         String   @id @default(cuid())
  title      String
  year       Int
  era        String   // frontier | settlement | interwar | postwar | modern | contemporary
  sourceRef  String?
  ingestedAt DateTime @default(now())
  dedupeKey  String   @unique
}

model Payment {
  id           String   @id @default(cuid())
  subscriberId String
  subscriber   Subscriber @relation(fields: [subscriberId], references: [id])
  amountCents  Int
  paidAt       DateTime
  refundedAt   DateTime?
}

model Service {                     // health registry, one row per source/product
  id        String @id @default(cuid())
  name      String @unique          // "Photo Ingestion", "Genealogy Feed", "Historical Archive", "AI Service Core (Narrator)", "Weaver", "Surfer", "Witness", "Reunion", "Scout"
  status    ServiceStatus @default(ok)
  note      String?
  heartbeatAt DateTime?
  logs      LogEvent[]
}

model LogEvent {                    // the error log
  id        String   @id @default(cuid())
  serviceId String
  service   Service  @relation(fields: [serviceId], references: [id])
  severity  Severity
  message   String
  meta      Json?
  createdAt DateTime @default(now())
  @@index([serviceId, severity, createdAt])
}

model AuditEvent {                  // every admin action, incl. impersonation
  id           String   @id @default(cuid())
  actorEmail   String
  action       String   // "impersonate" | "suspend" | "reactivate" | "refund" | "cancel" | "edit_profile" | "invite"
  subscriberId String?
  subscriber   Subscriber? @relation(fields: [subscriberId], references: [id])
  detail       Json?
  createdAt    DateTime @default(now())
}
```

Derived metrics (compute in queries, don't store): time engaged = `SUM(EngagementSession.durationMin)`; photos = count by subscriber; chapters = `ChapterProgress` count vs `Chapter` count; ingestion tiles = counts of `Photo`, `Subscriber`, `FamilyMember`, `HistoricalEvent`.

## API / server actions

- `GET /api/overview` — tiles, service health, top-4 non-info logs, top-4 engaged subscribers
- `GET /api/subscribers?query=&status=` · `GET/PATCH /api/subscribers/:id` (plan, companion, status)
- `POST /api/subscribers/:id/impersonate` — mint a short-lived read-only token for the subscriber-facing app; write AuditEvent
- `POST /api/subscribers/:id/refund` — refund latest Payment (stub the payment provider behind an interface; Stripe adapter if keys present)
- `POST /api/invitations` — create invited Subscriber + send email (stub mailer behind interface)
- `GET /api/progress` — per-subscriber metrics + product aggregates
- `GET /api/services` · `GET /api/logs?source=&severity=&cursor=` (paginated)
- `POST /api/ingest/telemetry` — authenticated endpoint (bearer service token) for products to write EngagementSessions, heartbeats, and LogEvents; this is how Weaver/Surfer/Witness/Reunion/Scout/Narrator and the pipelines report in. Heartbeat older than 15 min ⇒ mark service `degraded` (scheduled job or on-read check).

All admin mutations write an `AuditEvent`.

## Data-source wiring

Each upstream (Photo Ingestion, Genealogy Feed, Historical Archive, AI Service Core/Narrator, and the five products) reports through `POST /api/ingest/telemetry` with a per-service token (`SERVICE_TOKENS` env, comma-separated `name:token`). Until real services connect, include a `pnpm simulate` script that replays realistic telemetry (sessions, photos, log events, a degraded Genealogy Feed) so the console is demonstrably live end-to-end.

## Seed data (must match the prototype)

10 subscribers — `myke` (Founding, Miriam, active, 1840 min, 214 photos, ch 9/12, family: Frederick Bull, Fannie Bull, Thomas Bull), `mom` (Family, Seth, active, 2210 min, 187 photos, ch 11, family: Harold, Ruth, Evelyn), `mark` (Family, Miriam, active, 960/96/6, Walter), `lynn` (Family, Seth, active, 1310/142/8, Edith, June), `june` (Solo, Seth, active, 540/45/4, Dorothy), `sara` (Solo, Seth, active, 380/61/3), `paul` (Solo, Miriam, **suspended**, 120/12/1), `ann` (Solo, Seth, active, 610/74/5, George), `beth` + `tom` (invited, zeros). 12 chapters. 9 services (Genealogy Feed seeded `degraded`: "Upstream 429s — backoff active"). ~12 log events matching the prototype's log (see the logic class in the design file). Counters: 1,284 photos total (subscriber uploads + archive imports), 86 family members, 412 historical events.

## Design fidelity requirements

- Follow `design_handoff_throughline_admin/README.md` exactly: tokens, per-screen layout, pill colors, bar heights, hover states, and **all microcopy verbatim** (toasts, empty states, invite modal copy).
- Fonts: Lora + Inter (next/font). Never pure black/white. Creek Blue only for the brook strip and product-engagement bars.
- The sidebar brook strip animation, hover states, and the invite-modal validation toast are required, not optional.
- Companion rule when editing/creating subscribers: default Seth for female subscribers, Miriam for male (cross-gender by design) — but the select stays freely editable.

## Quality bar

- TypeScript strict, no `any` in domain code. Prisma migrations checked in. `pnpm seed` idempotent.
- Loading skeletons in parchment tones; error states in brand voice ("Something went sideways on the path. Give it a moment — we'll find our way back.").
- E2E happy path (Playwright): search → open subscriber → suspend → toast → log filter by service.
- README in repo root: setup, env vars, telemetry contract for product teams.

Build it completely, run the seed, verify all five routes against the design reference, then summarize what was built and any decisions made.
