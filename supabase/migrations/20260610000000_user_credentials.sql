-- Living Rehab CV — credentials a clinician selects from the matrix.
--
-- Each row links a user to a credential by its matrix name (the same string
-- used as the key in citations_meta.json / certificationData.js), tagged with
-- where they are with it. Self-attested in Phase 1; a verification layer
-- (proof upload, issuer check) comes later without schema change beyond an
-- added `verified_*` column.

create table if not exists public.user_credentials (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  cert_name   text not null,
  status      text not null default 'earned'
              check (status in ('earned', 'in_progress', 'planned')),
  date_earned date,
  notes       text,
  created_at  timestamptz default timezone('utc', now()),
  updated_at  timestamptz default timezone('utc', now()),
  unique (user_id, cert_name)
);

create index if not exists user_credentials_user_id_idx
  on public.user_credentials (user_id);

-- RLS: a clinician can only see/modify their own credential list. Same
-- own-rows pattern as user_profiles / courses.
alter table public.user_credentials enable row level security;

drop policy if exists "user_credentials_select_own" on public.user_credentials;
create policy "user_credentials_select_own"
  on public.user_credentials for select
  using (auth.uid() = user_id);

drop policy if exists "user_credentials_insert_own" on public.user_credentials;
create policy "user_credentials_insert_own"
  on public.user_credentials for insert
  with check (auth.uid() = user_id);

drop policy if exists "user_credentials_update_own" on public.user_credentials;
create policy "user_credentials_update_own"
  on public.user_credentials for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "user_credentials_delete_own" on public.user_credentials;
create policy "user_credentials_delete_own"
  on public.user_credentials for delete
  using (auth.uid() = user_id);
