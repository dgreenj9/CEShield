# Certificate Storage Migration

## What changed

Certificate files used to be stored as base64 strings inside the `courses` table
(`certificate` jsonb column). That:

- Made every dashboard load ship megabytes of inline data
- Left no per-file access controls (just RLS on the row)
- Couldn't be revoked or rotated independently of the row

New uploads go to a private Supabase Storage bucket (`certificates`) with
per-file RLS. The course row stores only a small descriptor in
`certificate_storage`.

## Manual steps (you, one time)

1. Open Supabase Studio → **SQL editor**.
2. Run the file `supabase/migrations/20260603_certificates_storage.sql` end-to-end.
3. Verify in **Storage** that the `certificates` bucket exists and is private.
4. Verify in **Database → Tables → courses** that `certificate_storage jsonb`
   column now exists.

The app code now:

- Uploads new file picks to `certificates/<auth_uid>/<course_id>/<filename>`
- Persists `{path, name, mime, size, sha256}` to `certificate_storage`
- Falls back to the legacy `certificate.data` base64 for unmigrated rows
- Generates short-lived (5 min) signed URLs for downloads
- Deletes the Storage object when a course row is deleted

## Migrating existing rows (later, when you're ready)

You can backfill the existing base64 rows into Storage with a one-off script.
A safe approach:

```js
// scripts/migrate_base64_to_storage.mjs (sketch)
// Run with `node` from a logged-in environment (service-role key required).
// For each row with course.certificate but no certificate_storage:
//   1. Decode base64 → Blob
//   2. Upload to <user_id>/<course_id>/<original_name>
//   3. Update row: certificate_storage = {...}, certificate = null
//   4. Commit one row at a time so a failure leaves the row in a recoverable state
```

Don't migrate until the new path has been live for a release cycle — both
shapes are read-supported, so there's no rush.

## Rollback

If something goes wrong, revert the code (the legacy code path still reads
`certificate.data` correctly). The migration is additive — no destructive SQL
changes. Drop the new column with:

```sql
alter table public.courses drop column if exists certificate_storage;
```

The bucket is safe to leave; it doesn't affect rows that don't reference it.
