-- Row Level Security for user data tables.
--
-- The app filters every query by the authenticated user's id client-side,
-- but client-side filters are advisory — RLS is the actual security
-- boundary. This migration makes the policies explicit and version-
-- controlled instead of relying on dashboard state.
--
-- Idempotent: drops + recreates policies so re-running is safe.

-- ── user_profiles ──────────────────────────────────────────────────────────
alter table public.user_profiles enable row level security;

drop policy if exists "profiles_select_own" on public.user_profiles;
create policy "profiles_select_own"
  on public.user_profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.user_profiles;
create policy "profiles_insert_own"
  on public.user_profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.user_profiles;
create policy "profiles_update_own"
  on public.user_profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "profiles_delete_own" on public.user_profiles;
create policy "profiles_delete_own"
  on public.user_profiles for delete
  using (auth.uid() = id);

-- ── courses ────────────────────────────────────────────────────────────────
alter table public.courses enable row level security;

drop policy if exists "courses_select_own" on public.courses;
create policy "courses_select_own"
  on public.courses for select
  using (auth.uid() = user_id);

drop policy if exists "courses_insert_own" on public.courses;
create policy "courses_insert_own"
  on public.courses for insert
  with check (auth.uid() = user_id);

drop policy if exists "courses_update_own" on public.courses;
create policy "courses_update_own"
  on public.courses for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);  -- blocks reassigning user_id to someone else

drop policy if exists "courses_delete_own" on public.courses;
create policy "courses_delete_own"
  on public.courses for delete
  using (auth.uid() = user_id);
