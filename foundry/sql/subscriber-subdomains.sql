-- thrline.com personal subdomains: slug → subscriber mapping.
-- Lives in the PRODUCT's public schema and is owned by the product
-- (Throughline-Seth / Vercel project throughline-server) — throughline-admin's
-- role has NO grants here. This file is a documented snapshot, same idea as
-- foundry/sql/bridge-views.sql.
-- Already applied to project uuzzfeaevxilwizaittq as Supabase migration
-- 20260711184438_create_subscriber_subdomains — do not run twice blindly;
-- the statements below are idempotent for safety.

create table if not exists public.subscriber_subdomains (
  id            uuid primary key default gen_random_uuid(),
  subdomain     text not null unique,
  display_name  text,
  subscriber_id uuid references public.subscribers(subscriber_id),
  created_at    timestamptz not null default now()
);

comment on table public.subscriber_subdomains is
  'Maps a thrline.com subdomain slug (e.g. myke) to a subscriber. subscriber_id is nullable so a subdomain can be reserved before a full subscriber record exists.';

-- Seeded 2026-07-11: chuck, myke, warren. subscriber_id is null on all three
-- because public.subscribers is currently empty — link the uuids once the
-- product creates those subscriber rows:
--   update public.subscriber_subdomains set subscriber_id = '<uuid>'
--   where subdomain = 'myke';
insert into public.subscriber_subdomains (subdomain, display_name)
values ('chuck', 'Chuck'), ('myke', 'Myke'), ('warren', 'Warren')
on conflict (subdomain) do nothing;

-- RECOMMENDED, NOT YET APPLIED. RLS is disabled on this table today, so anyone
-- holding the anon key can read AND write the mappings. This keeps public
-- reads working (the middleware lookup uses the anon key) while pushing writes
-- behind the service role. Uncomment and run once the product team confirms
-- nothing writes to this table with the anon key:
--
-- alter table public.subscriber_subdomains enable row level security;
-- create policy "subdomain mappings are readable by everyone"
--   on public.subscriber_subdomains for select to anon, authenticated
--   using (true);
