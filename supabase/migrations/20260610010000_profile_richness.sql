-- Profile richness for the Living Rehab CV: the fields a patient (or
-- recruiter) would actually browse on. Additive, nullable columns on the
-- existing user_profiles table — no RLS change needed (policies already
-- scope all access to auth.uid() = id).

alter table public.user_profiles
  add column if not exists headline         text,
  add column if not exists bio              text,
  add column if not exists years_experience integer,
  add column if not exists specialties      jsonb default '[]'::jsonb;

comment on column public.user_profiles.headline is
  'Short professional tagline shown at the top of the CV, e.g. "Orthopedic PT · manual therapy & return-to-sport".';
comment on column public.user_profiles.specialties is
  'JSON array of curated specialty/service-line tags (see SPECIALTY_OPTIONS in the client).';
