# Foundry Handoff — Throughline Administrator (throughline-admin)
**Date:** 2026-07-03
**Session #:** 1 (first session of the throughline-admin workstream; parent Throughline project last handed off 2026-06-12, Session 2)
**Foundry Stage:** Build
**Sprint / Phase:** Admin Console v1.0 (MVP shipped)
**Prepared by:** Claude (Fable 5)
**Handoff to:** Next Claude session / Human Operator (Myke)

---

## 1. Session Summary
Built the Throughline Administrator from the hi-fi design handoff package and shipped it to production at https://throughline-admin.com (www redirects in) in a single session. The full brief was delivered: 5 screens recreating the prototype exactly, Prisma schema + seed matching the prototype dataset, complete API surface, telemetry ingestion for all 9 sources (verified live), allowlist auth, audit trail, and a green Playwright happy path. Status epic THOUG-145 filed in Jira.

---

## 2. Project State Snapshot

| Dimension          | Current State                                      |
|--------------------|----------------------------------------------------|
| Foundry Stage      | Build (acceptance criteria met; console live)      |
| Gate Status        | Build gate passed — all three Definition-of-Done items delivered and verified |
| Jira Epic          | THOUG-145 — "Throughline Administrator — internal ops console live at throughline-admin.com" |
| GitHub Repo        | https://github.com/Mykemiller/throughline-admin    |
| Notion Brief       | Design handoff committed in-repo (`design_handoff_throughline_admin/`); Throughline Project Hub in Notion |
| Airtable Score     | Not yet scored                                     |
| Revenue Status     | N/A — internal ops tooling (pre-revenue product)   |
| CFO Flag           | None                                               |

---

## 3. Active Decisions & Rationale

1. **Reuse the shared Throughline Supabase project with a dedicated `admin` schema and scoped `throughline_admin` role** — avoids a second database bill and keeps admin data walled off from product tables (role has no grants on `public`). Pooler host is `aws-1-us-west-1` (aws-0 does not resolve the tenant).
2. **In-app magic-link auth + steward-key bootstrap instead of Supabase Auth** — configuring Supabase Auth redirect URLs on the shared project risked the subscriber product's auth flows; the in-app JWT approach touches nothing shared. Steward key (`ADMIN_ACCESS_KEY`) makes the console usable before an email provider is wired.
3. **Mailer and payment provider behind interfaces (console/stub adapters live, Resend/Stripe adapters ready)** — per the build brief; production behavior upgrades by setting env vars, no code change.
4. **Heartbeat-staleness rule only applies to services that have heartbeated at least once** — keeps the seeded demo services stable (they'd otherwise all degrade 15 minutes after seeding) while the rule works correctly for real connected services.
5. **`vercel.json` declares `framework: nextjs`** — the Vercel project was created against an empty repo and had framework `null`, which made the first deploy fail looking for a `public` output directory.

---

## 4. Open Threads

- Magic-link letters currently log server-side (console mailer) → set `RESEND_API_KEY` + `EMAIL_FROM` in Vercel, then rotate/retire the steward key.
- www vs apex: www 307s to apex; brief/goal named www as canonical → optionally flip redirect direction in Vercel domain settings.
- Jira project name is typo'd "Thoughline" (key THOUG) → rename in Jira settings if it grates.
- Airtable Foundry scoring for this workstream has never been done → score or explicitly waive.

---

## 5. Next Session Priorities

1. Wire Resend (`RESEND_API_KEY`, `EMAIL_FROM`) and verify magic-link login end-to-end — Vercel CLI is authenticated on Myke's Mac — unblocks retiring the shared steward key.
2. Point the first real product service (likely Weaver) at `POST /api/ingest/telemetry` with its token from `SERVICE_TOKENS` (pull via `vercel env pull`) — replaces simulated telemetry with real signal.
3. Decide www/apex canonical direction and set it in Vercel domain settings — cosmetic but user-facing.
4. Transition THOUG-145 through the THOUG board workflow as follow-ons complete.

---

## 6. Agent Handoff Notes

- **Secrets live only in Vercel production env** (`vercel env pull` from the repo root). Nothing secret is committed; local env template is `env.example` (no leading dot — Myke's rule: never read/write `.env*`).
- **Do not touch the `public` schema** of Supabase project `uuzzfeaevxilwizaittq` — that's the subscriber-facing product. The admin console owns only the `admin` schema.
- **`pnpm seed` is destructive-and-recreate for the admin schema** and must keep matching the prototype counters (1,284 photos / 10 subscribers / 86 family / 412 events). Re-run it after e2e or simulate runs to restore the demo dataset.
- **Design is law**: `design_handoff_throughline_admin/` in-repo is the spec; microcopy is verbatim and brand voice rules apply (no "unlock", "your journey", "seamlessly").
- Repo has its own CLAUDE.md with these invariants — read it first.

---

## 7. Blockers & Dependencies

No active blockers.

---

## 8. Foundry Loop Signal
The engine-as-site pattern proven on Faraday (one Next.js app serving product + ops) was deliberately inverted here — ops console as its own app on a shared database — because the subscriber product and admin console have different auth and risk profiles; worth codifying when each pattern applies.

---

## 9. Learning Ledger Flag

**Tag:** Throughline
**Insight:** A scoped Postgres role + dedicated schema on an existing Supabase project is a zero-cost, low-risk way to give internal tools a real database without touching product credentials — pattern is reusable for future Foundry ops tooling.
**Trigger Learning Steward:** No

---

## 10. Handoff Confidence

**Score:** 4
**Reason:** Every section is populated and priorities are actionable; a 5 would require the Slack summary post (no Foundry/Throughline Slack channel exists to post to) and an Airtable score.
