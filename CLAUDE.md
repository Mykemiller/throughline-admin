# CLAUDE.md — throughline-admin invariants

- **What this is**: internal ops console for the Throughline product family, live at www.throughline-admin.com (Vercel project `project-foundry/throughline-admin`, auto-deploys from `main`).
- **Design is law**: `design_handoff_throughline_admin/` holds the hi-fi spec and prototype. Colors, spacing, and microcopy are final (Brand Bible v2). Never introduce colors outside the token palette; never pure black/white. Creek Blue only for the brook strip and product-engagement bars.
- **Voice**: warm, unhurried path/water language. Never "unlock", "your journey", "seamlessly", "you're making great progress".
- **Database**: the `admin` schema of the shared Throughline Supabase project (`uuzzfeaevxilwizaittq`, us-west-1), role `throughline_admin`. The product's own tables live in `public` — this app must never touch them; the role has no grants there. Runtime connects through the transaction pooler (:6543, `pgbouncer=true`), migrations through the session pooler (:5432) — host `aws-1-us-west-1.pooler.supabase.com`.
- **Schema changes**: Prisma migrations, checked in. `pnpm seed` must stay idempotent and keep matching the prototype counters (1,284 photos / 86 family / 412 events / 10 subscribers).
- **Auth**: allowlist (`ADMIN_EMAILS`) + JWT cookie, role `steward`. Steward-key login is the bootstrap path; magic-link letters go live once `RESEND_API_KEY`/`EMAIL_FROM` are set.
- **Telemetry**: all nine upstreams write through `POST /api/ingest/telemetry` with per-service bearer tokens (`SERVICE_TOKENS`). Contract documented in README — treat it as public API for product teams.
- **Env files**: never read or write `.env*` — template lives in `env.example`.
