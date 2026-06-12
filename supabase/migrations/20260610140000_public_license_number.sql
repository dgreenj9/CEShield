-- License numbers are public record (searchable on state board sites), so
-- surface them on the public CV for verifiability. Adds license_number to the
-- safe public projection. `create or replace view` preserves existing grants.

-- NOTE: license_number is appended LAST. `create or replace view` can only
-- add columns at the end (re-ordering reads as a rename and errors).
create or replace view public.public_clinicians as
  select
    handle, name, headline, bio, specialties,
    years_experience, state, license_type, avatar_url, license_number
  from public.user_profiles
  where is_public = true and handle is not null;
