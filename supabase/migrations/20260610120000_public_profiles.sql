-- Phase 2: opt-in public clinician CV.
--
-- Adds a handle (URL slug), a visibility flag, and an avatar URL. The hard
-- part is exposing public profiles to anonymous visitors WITHOUT leaking the
-- license number (which lives in the same row). We do NOT loosen user_profiles
-- RLS. Instead we publish two SQL views that project only safe columns for
-- rows the owner has marked public. Views owned by the postgres role bypass
-- the base table's RLS, so anon can read the projection but never the raw row.

alter table public.user_profiles
  add column if not exists handle     text unique,
  add column if not exists is_public  boolean not null default false,
  add column if not exists avatar_url text;

-- Handle format guard: 3-30 chars, lowercase alphanumeric + single hyphens.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'user_profiles_handle_format'
  ) then
    alter table public.user_profiles
      add constraint user_profiles_handle_format
      check (handle is null or handle ~ '^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$');
  end if;
end $$;

-- ── Safe public projection of profiles ──────────────────────────────────────
-- Only non-sensitive columns. NO license_number, NO renewal_date, NO email.
create or replace view public.public_clinicians as
  select
    handle, name, headline, bio, specialties,
    years_experience, state, license_type, avatar_url
  from public.user_profiles
  where is_public = true and handle is not null;

-- ── Safe public projection of credentials for public profiles ───────────────
create or replace view public.public_clinician_credentials as
  select up.handle, uc.cert_name, uc.status, uc.date_earned
  from public.user_credentials uc
  join public.user_profiles up on up.id = uc.user_id
  where up.is_public = true and up.handle is not null;

grant select on public.public_clinicians to anon, authenticated;
grant select on public.public_clinician_credentials to anon, authenticated;
