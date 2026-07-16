-- ============================================================================
-- NearBite — RLS policies, triggers, and PostGIS setup.
-- Source-controlled security layer (foundation §B / §9).
--
-- APPLY ORDER:
--   1. `drizzle-kit migrate`  (creates tables/enums/indexes)
--   2. this file              (extensions, FK to auth.users, RLS, triggers)
-- Re-runnable: uses IF NOT EXISTS / CREATE OR REPLACE / DROP POLICY IF EXISTS.
-- ============================================================================

create extension if not exists postgis;

-- ---------------------------------------------------------------------------
-- Grants for Supabase API roles. `drop schema public` (used in --reset) wipes
-- these, and PostgREST needs them even though RLS still gates the rows.
-- RLS is the row-level gate; these grants are the table-level "can touch it".
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all functions in schema public to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on functions to anon, authenticated, service_role;

-- profiles.id references Supabase-managed auth.users (not modeled in Drizzle)
do $$ begin
  alter table profiles
    add constraint profiles_auth_fk
    foreign key (id) references auth.users(id) on delete cascade;
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Role helpers (SECURITY DEFINER breaks RLS recursion into profiles)
-- ---------------------------------------------------------------------------
create or replace function auth_role() returns user_role
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid();
$$;

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'admin' from profiles where id = auth.uid()), false);
$$;

-- ---------------------------------------------------------------------------
-- Enable RLS everywhere (deny-by-default)
-- ---------------------------------------------------------------------------
alter table profiles         enable row level security;
alter table businesses       enable row level security;
alter table business_hours   enable row level security;
alter table menu_items       enable row level security;
alter table photos           enable row level security;
alter table offers           enable row level security;
alter table reviews          enable row level security;
alter table favorites        enable row level security;
alter table content_reports  enable row level security;
alter table admin_action_log enable row level security;
alter table cities           enable row level security;
alter table categories       enable row level security;

-- ---------------------------------------------------------------------------
-- Reference tables
-- ---------------------------------------------------------------------------
drop policy if exists cities_read on cities;
create policy cities_read on cities for select using (true);
drop policy if exists cities_admin on cities;
create policy cities_admin on cities for all using (is_admin()) with check (is_admin());

drop policy if exists cat_read on categories;
create policy cat_read on categories for select using (true);
drop policy if exists cat_admin on categories;
create policy cat_admin on categories for all using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------------
-- businesses
-- ---------------------------------------------------------------------------
drop policy if exists biz_read_public on businesses;
create policy biz_read_public on businesses for select
  using (status = 'approved' or owner_id = auth.uid() or is_admin());

drop policy if exists biz_insert_owner on businesses;
create policy biz_insert_owner on businesses for insert
  with check (
    is_admin()
    or (owner_id = auth.uid() and auth_role() = 'owner' and status = 'pending')
  );

drop policy if exists biz_update_owner on businesses;
create policy biz_update_owner on businesses for update
  using (owner_id = auth.uid() or is_admin())
  with check (owner_id = auth.uid() or is_admin());

drop policy if exists biz_delete_admin on businesses;
create policy biz_delete_admin on businesses for delete using (is_admin());

-- ---------------------------------------------------------------------------
-- Child tables — inherit parent visibility
-- ---------------------------------------------------------------------------
-- menu_items
drop policy if exists menu_read on menu_items;
create policy menu_read on menu_items for select using (
  exists (select 1 from businesses b where b.id = business_id
          and (b.status='approved' or b.owner_id=auth.uid() or is_admin())));
drop policy if exists menu_write on menu_items;
create policy menu_write on menu_items for all
  using (exists (select 1 from businesses b where b.id = business_id
                 and (b.owner_id=auth.uid() or is_admin())))
  with check (exists (select 1 from businesses b where b.id = business_id
                      and (b.owner_id=auth.uid() or is_admin())));

-- photos
drop policy if exists photo_read on photos;
create policy photo_read on photos for select using (
  exists (select 1 from businesses b where b.id = business_id
          and (b.status='approved' or b.owner_id=auth.uid() or is_admin())));
drop policy if exists photo_write on photos;
create policy photo_write on photos for all
  using (exists (select 1 from businesses b where b.id = business_id
                 and (b.owner_id=auth.uid() or is_admin())))
  with check (exists (select 1 from businesses b where b.id = business_id
                      and (b.owner_id=auth.uid() or is_admin())));

-- business_hours
drop policy if exists hours_read on business_hours;
create policy hours_read on business_hours for select using (
  exists (select 1 from businesses b where b.id = business_id
          and (b.status='approved' or b.owner_id=auth.uid() or is_admin())));
drop policy if exists hours_write on business_hours;
create policy hours_write on business_hours for all
  using (exists (select 1 from businesses b where b.id = business_id
                 and (b.owner_id=auth.uid() or is_admin())))
  with check (exists (select 1 from businesses b where b.id = business_id
                      and (b.owner_id=auth.uid() or is_admin())));

-- offers — public sees only active + unexpired
drop policy if exists offer_read on offers;
create policy offer_read on offers for select using (
  (is_active and ends_at > now()
   and exists (select 1 from businesses b where b.id=business_id and b.status='approved'))
  or exists (select 1 from businesses b where b.id=business_id
             and (b.owner_id=auth.uid() or is_admin())));
drop policy if exists offer_write on offers;
create policy offer_write on offers for all
  using (exists (select 1 from businesses b where b.id = business_id
                 and (b.owner_id=auth.uid() or is_admin())))
  with check (exists (select 1 from businesses b where b.id = business_id
                      and (b.owner_id=auth.uid() or is_admin())));

-- ---------------------------------------------------------------------------
-- reviews / favorites / reports
-- ---------------------------------------------------------------------------
drop policy if exists rev_read on reviews;
create policy rev_read on reviews for select using (
  exists (select 1 from businesses b where b.id=business_id and b.status='approved')
  or user_id = auth.uid() or is_admin());
drop policy if exists rev_insert on reviews;
create policy rev_insert on reviews for insert
  with check (user_id = auth.uid() and auth_role() in ('consumer','owner'));
drop policy if exists rev_delete on reviews;
create policy rev_delete on reviews for delete using (user_id = auth.uid() or is_admin());
drop policy if exists rev_update_admin on reviews;
create policy rev_update_admin on reviews for update using (is_admin()) with check (is_admin());

drop policy if exists fav_all on favorites;
create policy fav_all on favorites for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists rep_insert on content_reports;
create policy rep_insert on content_reports for insert with check (reporter_id = auth.uid());
drop policy if exists rep_admin on content_reports;
create policy rep_admin on content_reports for select using (is_admin());
drop policy if exists rep_resolve on content_reports;
create policy rep_resolve on content_reports for update using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------------
-- profiles — read own; update own EXCEPT role (privilege-escalation guard)
-- ---------------------------------------------------------------------------
drop policy if exists prof_read on profiles;
create policy prof_read on profiles for select using (id = auth.uid() or is_admin());
drop policy if exists prof_update on profiles;
create policy prof_update on profiles for update
  using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from profiles where id = auth.uid()));
drop policy if exists prof_admin on profiles;
create policy prof_admin on profiles for all using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------------
-- admin_action_log — append-only (no update/delete policy = immutable)
-- ---------------------------------------------------------------------------
drop policy if exists audit_read on admin_action_log;
create policy audit_read on admin_action_log for select using (is_admin());
drop policy if exists audit_insert on admin_action_log;
create policy audit_insert on admin_action_log for insert with check (is_admin());

-- ---------------------------------------------------------------------------
-- Triggers (enforce what RLS can't express — foundation §8)
-- ---------------------------------------------------------------------------
-- 8a. status is admin-only (closes owner self-approve gap)
create or replace function guard_status_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status and not is_admin() then
    raise exception 'status can only be changed by an admin';
  end if;
  return new;
end $$;
drop trigger if exists biz_status_guard on businesses;
create trigger biz_status_guard before update on businesses
  for each row execute function guard_status_change();

-- 8b. freshness stamp
create or replace function stamp_freshness() returns trigger
language plpgsql set search_path = public as $$
begin
  new.updated_at := now();
  if not is_admin() then new.last_owner_update_at := now(); end if;
  return new;
end $$;
drop trigger if exists biz_freshness on businesses;
create trigger biz_freshness before update on businesses
  for each row execute function stamp_freshness();

-- ---------------------------------------------------------------------------
-- RPCs (PostgREST-callable). Geography inserts go through here so lat/lng are
-- turned into a PostGIS point in one place. SECURITY INVOKER so RLS + the
-- status-guard trigger still apply to the caller.
-- ---------------------------------------------------------------------------
create or replace function create_business(
  p_name text, p_category_id uuid, p_city_id uuid,
  p_description text, p_description_lang text,
  p_address text, p_lat double precision, p_lng double precision,
  p_phone text, p_price_tier smallint, p_is_veg_friendly boolean
) returns uuid
language plpgsql security invoker set search_path = public, extensions as $$
declare new_id uuid;
begin
  insert into businesses (
    owner_id, city_id, category_id, name, description, description_lang,
    address, location, phone, price_tier, is_veg_friendly, status, live,
    last_owner_update_at
  ) values (
    auth.uid(), p_city_id, p_category_id, p_name, p_description, p_description_lang,
    p_address, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
    p_phone, p_price_tier, p_is_veg_friendly, 'pending', 'closed', now()
  ) returning id into new_id;
  return new_id;
end $$;

-- 8c. keep avg_rating / review_count correct
create or replace function recompute_rating() returns trigger
language plpgsql set search_path = public as $$
declare bid uuid := coalesce(new.business_id, old.business_id);
begin
  update businesses b set
    avg_rating   = coalesce((select round(avg(rating),1) from reviews where business_id=bid),0),
    review_count = (select count(*) from reviews where business_id=bid)
  where b.id = bid;
  return null;
end $$;
drop trigger if exists rev_rating_sync on reviews;
create trigger rev_rating_sync after insert or update or delete on reviews
  for each row execute function recompute_rating();
