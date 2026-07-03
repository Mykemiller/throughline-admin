-- Stage 1/2 bridge: read-only views over the product's public schema.
-- Run once as postgres (Supabase SQL editor, project uuzzfeaevxilwizaittq).
-- The app role gets SELECT on these two views ONLY — never on public tables.
-- Reverse with: drop view admin.bridge_subscribers, admin.bridge_counts;

create or replace view admin.bridge_counts as
select
  (select count(*) from public.subscribers)                              as product_subscribers,
  (select count(*) from public.photos)                                   as archive_photos,
  (select count(*) from public.media_assets where asset_type = 'photo')  as subscriber_photos,
  (select count(*) from public.persons)                                  as genealogy_persons,
  (select count(*) from public.readers)                                  as readers;

create or replace view admin.bridge_subscribers as
select
  subscriber_id,
  coalesce(nullif(display_name, ''), name) as name,
  email,
  plan_tier::text                          as plan_tier,
  companion_preference,
  profile_complete,
  created_at,
  chapter_progress
from public.subscribers;

grant select on admin.bridge_counts, admin.bridge_subscribers to throughline_admin;
