# thrline.com wildcard subdomains — handoff for Throughline-Seth

**Date:** 2026-07-11
**Written from:** a throughline-admin session (this repo cannot ship code to
Throughline-Seth, so the app-side pieces are packaged here, ready to install).

## The shape of it

`thrline.com` is registered through Vercel on team `project-foundry`
(`team_JS3rgFwySt8w8yds7fAh1KeM`). Each subscriber gets a personal address —
`chuck.thrline.com`, `myke.thrline.com`, `warren.thrline.com`, more over time —
served by the **throughline-server** Vercel project
(`prj_f8sBe4iIopb9UIh0vOuglZAmRBLa`), which deploys from
`Mykemiller/Throughline-Seth`. Subdomains are never hard-coded: they resolve
through `public.subscriber_subdomains` in Supabase, so a new name is one
inserted row, not a code change.

## What already exists (done, verified live 2026-07-11)

- `public.subscriber_subdomains` in Supabase project `uuzzfeaevxilwizaittq`,
  created by migration `20260711184438_create_subscriber_subdomains`:
  - `id uuid` primary key, default `gen_random_uuid()`
  - `subdomain text` not null, **unique**
  - `display_name text` nullable
  - `subscriber_id uuid` nullable, FK → `public.subscribers(subscriber_id)`
  - `created_at timestamptz` not null, default `now()`
- Seeded with `chuck`, `myke`, `warren`. All three have `subscriber_id = null`
  because `public.subscribers` has no rows yet — link them when those
  subscriber records exist.
- Snapshot checked into this repo: `foundry/sql/subscriber-subdomains.sql`.

> **Security note:** RLS is currently **disabled** on this table — anyone with
> the anon key can read and write it. Recommended fix (enable RLS + read-only
> policy for anon/authenticated) is in the SQL snapshot, commented out. Apply
> it once you confirm nothing writes to the table with the anon key.

## 1 · Vercel dashboard steps (manual — no API/CLI token in this session)

In **throughline-server → Settings → Domains**:

1. Add `thrline.com` (apex).
2. Add `*.thrline.com` (wildcard).
3. Leave the existing `throughline-seth.*` domains untouched.

Because thrline.com is registered with Vercel and uses Vercel nameservers,
DNS is managed for you: Vercel creates the apex ALIAS and wildcard records
when the domains are attached. To double-check, look at the team's
**Domains → thrline.com → DNS records** — you should see the `*` record after
step 2. Only if the domain were on external nameservers would you add a manual
`CNAME * → cname.vercel-dns.com.` (and wildcard SSL would then require
switching to Vercel nameservers anyway — not your case).

**SSL:** automatic. Vercel issues the wildcard certificate for `*.thrline.com`
via Let's Encrypt DNS-01 once the wildcard domain is attached; there are no
manual certificate steps. Expect a few minutes for issuance after step 2.

## 2 · App-side code (install in Throughline-Seth)

Written for a Next.js App Router app. If Throughline-Seth uses the pages
router or a custom server, keep the same logic and adapt the plumbing. Adjust
`/river/[subscriberId]` to the app's real River route.

Env needed by the middleware (likely already present):
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

### `middleware.ts` (repo root, next to `app/`)

If a `middleware.ts` already exists, merge the thrline branch into it — the
early return keeps every non-thrline host (throughline-seth.com, preview URLs)
completely untouched.

```ts
import { NextRequest, NextResponse } from "next/server";

const APEX = "thrline.com";

type SubdomainRow = {
  subdomain: string;
  display_name: string | null;
  subscriber_id: string | null;
};

async function lookupSubdomain(slug: string): Promise<SubdomainRow | null> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!base || !key) return null;
  const url =
    `${base}/rest/v1/subscriber_subdomains` +
    `?subdomain=eq.${encodeURIComponent(slug)}` +
    `&select=subdomain,display_name,subscriber_id&limit=1`;
  const res = await fetch(url, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!res.ok) return null;
  const rows = (await res.json()) as SubdomainRow[];
  return rows[0] ?? null;
}

export async function middleware(req: NextRequest) {
  const host = (req.headers.get("host") ?? "").toLowerCase().split(":")[0];

  // Any non-thrline host flows on exactly as before.
  if (host !== APEX && host !== `www.${APEX}` && !host.endsWith(`.${APEX}`)) {
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();

  // Apex and www: the page that explains what thrline.com is.
  if (host === APEX || host === `www.${APEX}`) {
    if (url.pathname === "/") {
      url.pathname = "/thrline";
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  // Personal subdomain: only rewrite the root; deeper paths pass through.
  if (url.pathname !== "/") return NextResponse.next();

  const slug = host.slice(0, -(APEX.length + 1)); // "chuck" from chuck.thrline.com

  // Claimed slugs are single-label and url-safe; anything else is unclaimed.
  const row = /^[a-z0-9-]+$/.test(slug) ? await lookupSubdomain(slug) : null;

  if (row?.subscriber_id) {
    url.pathname = `/river/${row.subscriber_id}`;
    return NextResponse.rewrite(url);
  }

  url.pathname = "/thrline/unclaimed";
  url.searchParams.set("slug", slug);
  if (row?.display_name) url.searchParams.set("reserved", row.display_name);
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    "/((?!_next/|api/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|ico|woff2?)$).*)",
  ],
};
```

Decisions baked in, change if the product wants otherwise:

- **Reserved but unlinked** (row exists, `subscriber_id` null — chuck/myke/
  warren today) lands on the unclaimed page with the person's `display_name`,
  so it reads as "being prepared" rather than "nobody here".
- **Deeper paths** on a subdomain (`chuck.thrline.com/anything`) pass through
  to the app's normal routing rather than being forced into the River. Tighten
  later if personal domains should be River-only.
- The lookup is one indexed REST call per root-path request. If that ever
  matters, put a short-TTL cache in front — don't precompute slugs into code.

### `app/thrline/page.tsx` — apex landing

Copy below follows the family voice (warm, unhurried, water language). Style
it with the product's real components; the markup is deliberately plain.

```tsx
export const metadata = { title: "thrline.com — a place for every river" };

export default function ThrlinePage() {
  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "96px 24px" }}>
      <h1>thrline.com</h1>
      <p>
        Every Throughline is a river — a life gathered slowly, stone by stone,
        photograph by photograph.
      </p>
      <p>
        Each subscriber has a stretch of the river to call their own, at an
        address shaped like <strong>name.thrline.com</strong>. If someone has
        shared theirs with you, follow it — the water is the introduction.
      </p>
      <p>
        To learn about Throughline itself, visit{" "}
        <a href="https://throughline-seth.com">throughline-seth.com</a>.
      </p>
    </main>
  );
}
```

### `app/thrline/unclaimed/page.tsx` — fallback for unclaimed names

```tsx
type Props = {
  searchParams: Promise<{ slug?: string; reserved?: string }>;
};

export const metadata = { title: "thrline.com — still water" };

export default async function UnclaimedPage({ searchParams }: Props) {
  const { slug, reserved } = await searchParams;
  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "96px 24px" }}>
      {reserved ? (
        <>
          <h1>{reserved}&rsquo;s river is being prepared</h1>
          <p>
            This stretch of thrline.com is spoken for, and the water will be
            along soon. Check back in a little while.
          </p>
        </>
      ) : (
        <>
          <h1>Still water here</h1>
          <p>
            {slug ? <strong>{slug}.thrline.com</strong> : "This page"} hasn&rsquo;t
            been claimed yet. If you were expecting someone&rsquo;s river,
            check the spelling of the name before the dot.
          </p>
        </>
      )}
      <p>
        <a href="https://thrline.com">What is thrline.com?</a>
      </p>
    </main>
  );
}
```

(On Next.js 14 or older, `searchParams` is a plain object — drop the `await`
and the `Promise<>` wrapper.)

## 3 · Adding a new person later

One row, no deploy:

```sql
insert into public.subscriber_subdomains (subdomain, display_name, subscriber_id)
values ('newname', 'New Name', '<subscriber uuid or null>');
```

## 4 · Test plan (after domains are attached and Seth deploys the middleware)

```sh
# All three resolve and serve a 200 (unclaimed-with-name for now, since
# subscriber_id is still null on every row):
curl -sI https://chuck.thrline.com | head -1
curl -sI https://myke.thrline.com | head -1
curl -sI https://warren.thrline.com | head -1

# Unclaimed name gets the friendly fallback, not an error:
curl -s https://test123.thrline.com | grep -i "hasn't been claimed"

# Apex serves the landing page, not a personal river:
curl -s https://thrline.com | grep -i "name.thrline.com"

# Existing product domain is untouched:
curl -sI https://throughline-seth.com | head -1
```

Once a real subscriber row exists and is linked, re-test that
`myke.thrline.com` rewrites to `/river/<uuid>`.

## Open items

1. **Vercel dashboard:** attach `thrline.com` + `*.thrline.com` to
   throughline-server (§1) — could not be done from this session (no domain
   tools/token available).
2. **Throughline-Seth:** install middleware + two pages (§2), adjust the River
   route path, restyle pages to the product's design system.
3. **Supabase:** link chuck/myke/warren `subscriber_id`s when the subscriber
   rows exist; decide on the RLS lockdown (snapshot file has the SQL).
