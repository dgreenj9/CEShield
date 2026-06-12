-- One-time setup for the `certificates` storage bucket.
-- Run from Supabase Studio → SQL editor. Idempotent: safe to re-run.
--
-- Why move off base64-in-rows:
--   - Course rows currently embed full PDF/image data, blowing up table size
--     and forcing every dashboard query to ship megabytes per cert.
--   - Storage gives us per-object RLS, signed URLs with expiration, and CDN
--     delivery without rewriting our API layer.

-- 1) Create the bucket (private). Public access is gated by signed URLs only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'certificates',
  'certificates',
  false,
  10 * 1024 * 1024,    -- 10MB cap per file
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 2) RLS policies on storage.objects scoped to the bucket.
--    Object path convention: <auth_uid>/<course_id>/<filename>
--    The auth_uid prefix is what we authorize against.

-- Users can SELECT their own files
drop policy if exists "certificates_select_own" on storage.objects;
create policy "certificates_select_own"
on storage.objects for select
to authenticated
using (
  bucket_id = 'certificates'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can INSERT into their own folder
drop policy if exists "certificates_insert_own" on storage.objects;
create policy "certificates_insert_own"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'certificates'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can UPDATE (overwrite) their own files
drop policy if exists "certificates_update_own" on storage.objects;
create policy "certificates_update_own"
on storage.objects for update
to authenticated
using (
  bucket_id = 'certificates'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can DELETE their own files
drop policy if exists "certificates_delete_own" on storage.objects;
create policy "certificates_delete_own"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'certificates'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- 3) Add a forward-compatible column on `courses` so we can persist the
--    storage path alongside (or instead of) the legacy `certificate` JSON.
--    Schema: { path: string, name: string, mime: string, size: int, sha256?: string }
alter table public.courses
  add column if not exists certificate_storage jsonb;

comment on column public.courses.certificate_storage is
  'New path: { path, name, mime, size, sha256 }. The legacy `certificate` JSON column (base64 data) is retained until all rows are migrated.';
