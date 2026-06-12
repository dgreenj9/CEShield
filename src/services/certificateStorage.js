// Certificate storage service.
//
// New uploads go to Supabase Storage (bucket: `certificates`) under
// `<auth_uid>/<course_id>/<filename>`. The course row stores a small
// JSON descriptor in `certificate_storage` instead of the raw base64.
//
// Reads accept BOTH shapes:
//   - legacy course.certificate = { name, data: 'data:image/...;base64,...' }
//   - new     course.certificate_storage = { path, name, mime, size }
// `resolveCertificateUrl(course)` returns whichever is available.

import { supabase } from './supabaseClient';

const BUCKET = 'certificates';

const sanitizeFilename = (name) =>
  String(name || 'certificate').replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 120);

const readArrayBuffer = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });

const sha256Hex = async (file) => {
  if (!file || !crypto?.subtle) return null;
  try {
    const buffer = await readArrayBuffer(file);
    const digest = await crypto.subtle.digest('SHA-256', buffer);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  } catch {
    return null;
  }
};

/**
 * Upload a certificate file to Storage and return the descriptor to persist
 * on the course row (in `certificate_storage`).
 *
 * @param {Object} args
 * @param {File} args.file              - the file the user picked
 * @param {string} args.userId          - auth user id
 * @param {string|number} args.courseId - the course's PK (or 'pending' if new)
 * @returns {Promise<{path,name,mime,size,sha256}>}
 */
export const uploadCertificate = async ({ file, userId, courseId }) => {
  if (!file) throw new Error('uploadCertificate: file is required');
  if (!userId) throw new Error('uploadCertificate: userId is required');
  const filename = sanitizeFilename(file.name);
  const path = `${userId}/${courseId || 'pending'}/${Date.now()}-${filename}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type,
  });
  if (error) throw error;
  const sha256 = await sha256Hex(file);
  return {
    path,
    name: file.name,
    mime: file.type,
    size: file.size,
    sha256,
  };
};

/**
 * Generate a short-lived signed URL for downloading a stored certificate.
 * Default expiry: 5 minutes — long enough for the click-through, short enough
 * that a leaked URL doesn't become a permanent backdoor.
 */
export const getCertificateUrl = async (storageDescriptor, expiresInSeconds = 300) => {
  if (!storageDescriptor?.path) return null;
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storageDescriptor.path, expiresInSeconds);
  if (error) {
    // eslint-disable-next-line no-console
    console.error('getCertificateUrl error:', error);
    return null;
  }
  return data?.signedUrl || null;
};

/**
 * Delete a stored certificate file. Best-effort: row deletion proceeds even
 * if the Storage delete fails (the file becomes an orphan, which a cleanup
 * job can sweep later).
 */
export const deleteCertificate = async (storageDescriptor) => {
  if (!storageDescriptor?.path) return;
  const { error } = await supabase.storage.from(BUCKET).remove([storageDescriptor.path]);
  if (error) {
    // eslint-disable-next-line no-console
    console.warn('deleteCertificate: orphaning file', storageDescriptor.path, error);
  }
};

/**
 * Backwards-compatible URL resolver. Hands back whatever the course actually
 * has — supports both the legacy base64 inline data and the new Storage path.
 *
 * Returns null if there's no certificate at all.
 */
export const resolveCertificateUrl = async (course) => {
  if (!course) return null;
  // New shape: storage descriptor on `certificate_storage`
  if (course.certificate_storage?.path) {
    return getCertificateUrl(course.certificate_storage);
  }
  // Legacy shape: full base64 data URL on `certificate.data`
  if (course.certificate?.data) {
    return course.certificate.data;
  }
  return null;
};

/**
 * Pick the human filename regardless of which shape the course uses.
 */
export const resolveCertificateName = (course) => {
  if (course?.certificate_storage?.name) return course.certificate_storage.name;
  if (course?.certificate?.name) return course.certificate.name;
  return 'certificate';
};
