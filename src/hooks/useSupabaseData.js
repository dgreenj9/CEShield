import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import {
  uploadCertificate,
  deleteCertificate,
} from '../services/certificateStorage';

// Legacy localStorage keys from the pre-Supabase era. We no longer cache
// profile/course data client-side (it contains license numbers and PII that
// must not survive sign-out on shared machines) — but we proactively clear
// any leftovers from older builds.
const LEGACY_CACHE_KEYS = ['ceTrackerUser', 'ceTrackerCourses'];
export const clearLocalCaches = () => {
  for (const k of LEGACY_CACHE_KEYS) {
    try { localStorage.removeItem(k); } catch { /* storage unavailable */ }
  }
};

// Custom hooks for data management
export const useSupabaseData = (authUser) => {
  const [user, setUser] = useState({
    name: '', licenseType: '', licenseNumber: '', renewalDate: '', isFirstRenewal: false, state: 'IL',
    headline: '', bio: '', yearsExperience: '', specialties: [],
    handle: '', isPublic: false, avatarUrl: '',
  });
  const [courses, setCourses] = useState([]);
  const [credentials, setCredentials] = useState([]); // user_credentials rows
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // Non-null when the initial profile/course fetch failed — the UI shows a
  // banner instead of silently rendering an empty account.
  const [loadError, setLoadError] = useState(null);

  const saveUserProfile = async (userData) => {
    setSaving(true);
    try {
      // Explicit camelCase → column map. years_experience coerces '' → null
      // (the column is integer); specialties is a JSON array.
      const yrs = userData.yearsExperience;
      const { error } = await supabase.from('user_profiles').upsert({
        id: authUser.id,
        name: userData.name ?? '',
        license_type: userData.licenseType ?? '',
        license_number: userData.licenseNumber ?? '',
        renewal_date: userData.renewalDate || null,
        is_first_renewal: !!userData.isFirstRenewal,
        state: userData.state ?? 'IL',
        headline: userData.headline ?? '',
        bio: userData.bio ?? '',
        years_experience:
          yrs === '' || yrs === null || yrs === undefined ? null : Number(yrs),
        specialties: Array.isArray(userData.specialties) ? userData.specialties : [],
        handle: userData.handle ? userData.handle.trim().toLowerCase() : null,
        is_public: !!userData.isPublic,
        avatar_url: userData.avatarUrl || null,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error saving profile:', error);
      // Surface the two handle-specific failures with actionable messages.
      if (error?.code === '23505') {
        alert('That handle is already taken — try another.');
      } else if (error?.code === '23514') {
        alert('Handle must be 3–30 characters: lowercase letters, numbers, and hyphens only (no leading/trailing hyphen).');
      } else {
        alert('Error saving profile. Please try again.');
      }
      return false;
    } finally {
      setSaving(false);
    }
  };

  const saveCourse = async (courseData, editingId = null) => {
    setSaving(true);
    try {
      // Caller (AddCourseModal) passes either:
      //   courseData.certificateFile  -> new File picked this submission (upload)
      //   courseData.certificate      -> legacy { name, data } already on the row
      //   courseData.certificate_storage -> existing Storage descriptor (no change)
      let storageDescriptor = courseData.certificate_storage || null;
      const newFile = courseData.certificateFile;

      // Build the base payload (everything except the certificate fields).
      // Postgres date columns reject empty strings — coerce to null so
      // optional/unset fields don't blow up the insert.
      const basePayload = {
        user_id: authUser.id,
        title: courseData.title,
        provider: courseData.provider,
        date: courseData.date || null,
        hours: parseFloat(courseData.hours),
        category: courseData.category,
        format: courseData.format,
        has_test: courseData.hasTest,
        updated_at: new Date().toISOString(),
      };

      // Upload new file to Storage first so the row references a real path.
      if (newFile instanceof File) {
        storageDescriptor = await uploadCertificate({
          file: newFile,
          userId: authUser.id,
          courseId: editingId || 'pending',
        });
      }

      // Persist the row.
      const payload = {
        ...basePayload,
        // Keep `certificate` (legacy base64) untouched if no new file was
        // uploaded — preserves data for un-migrated rows. When the user
        // uploads a NEW file, switch to the storage descriptor and clear
        // the legacy column.
        ...(newFile instanceof File
          ? { certificate_storage: storageDescriptor, certificate: null }
          : storageDescriptor
            ? { certificate_storage: storageDescriptor }
            : courseData.certificate
              ? { certificate: courseData.certificate }
              : {}),
      };

      let savedRow;
      if (editingId) {
        // .eq('user_id', ...) is defense-in-depth alongside RLS: even if a
        // policy is misconfigured, this query can only touch the caller's
        // own rows.
        const { data, error } = await supabase
          .from('courses')
          .update(payload)
          .eq('id', editingId)
          .eq('user_id', authUser.id)
          .select();
        if (error) throw error;
        if (!data || data.length === 0) throw new Error('Course not found or not yours');
        savedRow = data[0];
        setCourses((prev) => prev.map((c) => (c.id === editingId ? savedRow : c)));
      } else {
        const { data, error } = await supabase.from('courses').insert([payload]).select();
        if (error) throw error;
        savedRow = data[0];
        setCourses((prev) => [...prev, savedRow]);
      }

      return true;
    } catch (error) {
      console.error('Error saving course:', error);
      alert('Error saving course. Please try again.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const deleteCourse = async (courseId) => {
    setSaving(true);
    try {
      const target = courses.find((c) => c.id === courseId);
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId)
        .eq('user_id', authUser.id);
      if (error) throw error;
      // Best-effort storage cleanup. Row is already gone; orphan file is a
      // small cost (cleanup job sweep can pick it up later).
      if (target?.certificate_storage) {
        await deleteCertificate(target.certificate_storage);
      }
      setCourses((prev) => prev.filter((c) => c.id !== courseId));
      return true;
    } catch (error) {
      console.error('Error deleting course:', error);
      alert('Error deleting course. Please try again.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  // ── Avatar upload (public bucket) ───────────────────────────────────────
  // Uploads to avatars/<uid>/avatar-<ts>.<ext> (timestamped to bust CDN
  // cache on replace) and returns the public URL for storage in avatar_url.
  const uploadAvatar = async (file) => {
    if (!(file instanceof File)) return null;
    setSaving(true);
    try {
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
      const stamp = Date.now();
      const path = `${authUser.id}/avatar-${stamp}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      return data?.publicUrl || null;
    } catch (error) {
      console.error('Avatar upload failed:', error);
      alert('Could not upload that image. Use a JPG, PNG, or WebP under 3MB.');
      return null;
    } finally {
      setSaving(false);
    }
  };

  // ── Credential CRUD (Living Rehab CV) ───────────────────────────────────
  // Add or update one credential on the user's profile. Keyed by cert_name
  // (unique per user) so re-adding the same credential updates status/date.
  const saveCredential = async ({ certName, status = 'earned', dateEarned = null, notes = null }) => {
    setSaving(true);
    try {
      const payload = {
        user_id: authUser.id,
        cert_name: certName,
        status,
        date_earned: dateEarned || null,
        notes: notes || null,
        updated_at: new Date().toISOString(),
      };
      const { data, error } = await supabase
        .from('user_credentials')
        .upsert(payload, { onConflict: 'user_id,cert_name' })
        .select();
      if (error) throw error;
      const row = data[0];
      setCredentials((prev) => {
        const without = prev.filter((c) => c.cert_name !== certName);
        return [...without, row];
      });
      return true;
    } catch (error) {
      console.error('Error saving credential:', error);
      alert('Could not save that credential. Please try again.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const removeCredential = async (certName) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_credentials')
        .delete()
        .eq('user_id', authUser.id)
        .eq('cert_name', certName);
      if (error) throw error;
      setCredentials((prev) => prev.filter((c) => c.cert_name !== certName));
      return true;
    } catch (error) {
      console.error('Error removing credential:', error);
      alert('Could not remove that credential. Please try again.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!authUser) return;

    // One-time cleanup of legacy client-side caches (contained PII).
    clearLocalCaches();

    const loadData = async () => {
      try {
        const [profileResponse, coursesResponse, credentialsResponse] = await Promise.all([
          supabase.from('user_profiles').select('*').eq('id', authUser.id).single(),
          supabase.from('courses').select('*').eq('user_id', authUser.id).order('date', { ascending: false }),
          supabase.from('user_credentials').select('*').eq('user_id', authUser.id),
        ]);

        // Supabase returns errors in the response object rather than
        // throwing — check explicitly so RLS/auth failures surface instead
        // of silently rendering an empty account. (PGRST116 = zero rows for
        // .single(), which is normal for a brand-new profile.)
        if (profileResponse.error && profileResponse.error.code !== 'PGRST116') {
          throw profileResponse.error;
        }
        if (coursesResponse.error) {
          throw coursesResponse.error;
        }
        // Credentials table may not exist yet on older deploys — tolerate a
        // missing-relation error rather than blanking the whole dashboard.
        if (credentialsResponse.error && credentialsResponse.error.code !== '42P01') {
          throw credentialsResponse.error;
        }

        if (profileResponse.data) {
          const profile = profileResponse.data;
          setUser({
            name: profile.name || '',
            licenseType: profile.license_type || '',
            licenseNumber: profile.license_number || '',
            renewalDate: profile.renewal_date || '',
            isFirstRenewal: profile.is_first_renewal || false,
            state: profile.state || 'IL',
            headline: profile.headline || '',
            bio: profile.bio || '',
            yearsExperience:
              profile.years_experience === null || profile.years_experience === undefined
                ? '' : String(profile.years_experience),
            specialties: Array.isArray(profile.specialties) ? profile.specialties : [],
            handle: profile.handle || '',
            isPublic: !!profile.is_public,
            avatarUrl: profile.avatar_url || '',
          });
        }

        setCourses(coursesResponse.data || []);
        setCredentials(credentialsResponse.data || []);
        setLoadError(null);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoadError('We couldn’t load your data. Check your connection and refresh — your records are safe.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [authUser]);

  return {
    user, setUser, courses, credentials, loading, saving, loadError,
    saveUserProfile, saveCourse, deleteCourse, saveCredential, removeCredential,
    uploadAvatar,
  };
};
