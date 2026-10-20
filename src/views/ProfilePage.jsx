import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Save, Camera, Eye, EyeOff, ExternalLink, Loader2 } from 'lucide-react';
import { useUserData } from '../contexts/UserDataContext';
import { SUPPORTED_STATES, getRulesFor } from '../data/stateRules';
import { Card, Button, Input, ConfirmDialog } from '../components/ui';
import CredentialProfile from '../components/dashboard/CredentialProfile';
import { A, FIG, tabularNums, kicker, display, LINE2 } from '../components/atlas/theme';

// Curated rehab service lines for the specialty multi-select. Kept as a flat
// list (not free text) so future clinician search/filtering has clean facets.
const SPECIALTY_OPTIONS = [
  'Orthopedics', 'Sports', 'Manual Therapy', 'Return-to-Sport',
  'Neurologic', 'Vestibular', 'Concussion', 'Stroke',
  'Pelvic Health', 'Obstetric / Postpartum',
  'Geriatrics', 'Pediatrics', 'Acute Care', 'ICU / Cardiopulmonary',
  'Hand Therapy', 'Lymphedema', 'Oncology', 'Wound Care',
  'Amputee / Prosthetics', 'Chronic Pain', 'Aquatic', 'Home Health',
];

const cardTitle = { fontFamily: FIG, fontWeight: 420, fontSize: 19, letterSpacing: '-0.025em', color: A.ink, margin: 0 };
const fieldLabel = { display: 'block', fontFamily: FIG, fontSize: 13, fontWeight: 500, color: A.inkBody, marginBottom: 8 };
const fieldStyle = { fontFamily: FIG, fontSize: 14, boxSizing: 'border-box' };

export default function ProfilePage() {
  const { user, setUser, courses, saving, saveUserProfile, uploadAvatar } = useUserData();
  const [localUser, setLocalUser] = useState(user);
  const [pendingLicenseChange, setPendingLicenseChange] = useState(null);
  const [savedAt, setSavedAt] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => { setLocalUser(user); }, [user]);

  const ptRules = useMemo(() => getRulesFor(localUser.state, 'PT'), [localUser.state]);
  const otRules = useMemo(() => getRulesFor(localUser.state, 'OT'), [localUser.state]);
  const selectedRules = useMemo(
    () => getRulesFor(localUser.state, localUser.licenseType),
    [localUser.state, localUser.licenseType],
  );

  const set = (patch) => setLocalUser((u) => ({ ...u, ...patch }));

  const requestLicenseChange = (nextType) => {
    if (localUser.licenseType === nextType) return;
    if (courses.length > 0) setPendingLicenseChange(nextType);
    else set({ licenseType: nextType });
  };

  const handleSave = async () => {
    const ok = await saveUserProfile(localUser);
    if (ok) { setUser(localUser); setSavedAt(new Date()); }
  };

  // Avatar: upload to storage, then persist the URL immediately so the image
  // sticks even before the user hits "Save changes".
  const handleAvatarPick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadAvatar(file);
    if (url) {
      const next = { ...localUser, avatarUrl: url };
      setLocalUser(next);
      const ok = await saveUserProfile(next);
      if (ok) setUser(next);
    }
    e.target.value = '';
  };

  const initials = (localUser.name || '?')
    .split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  const handleValid = !localUser.handle || /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$/.test(localUser.handle);
  const publicLiveHandle = user.isPublic && user.handle ? user.handle : null;

  return (
    <div>
      {/* Header */}
      <header className="plum-rise" style={{ marginBottom: '2rem' }}>
        <div style={{ ...kicker(), marginBottom: 14 }}>
          Your credential record · claims, specialties, licensing
        </div>
        <h1 style={display('clamp(2rem, 4.4vw, 3.25rem)', 360)}>
          Your record, <em style={{ fontStyle: 'normal', color: A.accentMid }}>kept current.</em>
        </h1>
        <p style={{ fontFamily: FIG, fontSize: 15, color: A.inkBody, margin: '14px 0 0', maxWidth: '40em', lineHeight: 1.7 }}>
          The credentials, specialties, and experience that define your practice.
          Licensing details below also drive the ledger.
        </p>
      </header>

      {/* Resume-style two-column editor: identity sidebar + main column. */}
      <div className="cs-cv-grid" style={{ maxWidth: 1000 }}>
        {/* ── LEFT: identity sidebar ─────────────────────────────────── */}
        <aside className="cs-cv-side" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={saving}
                aria-label="Upload profile photo"
                style={{
                  position: 'relative', width: 112, height: 112, borderRadius: '50%',
                  overflow: 'hidden', border: `1px solid ${LINE2}`,
                  background: A.accentTint, color: A.accent, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: FIG, fontSize: '2rem', fontWeight: 350, letterSpacing: '-0.03em', padding: 0,
                }}
              >
                {localUser.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={localUser.avatarUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : initials}
                <span style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0, padding: '5px 0 9px',
                  background: 'rgba(31,26,39,0.78)', color: A.ink,
                  fontFamily: FIG, fontSize: 10.5, fontWeight: 500,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                }}>
                  {saving ? <Loader2 size={11} className="animate-spin" aria-hidden="true" /> : <Camera size={11} aria-hidden="true" />}
                  Photo
                </span>
              </button>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarPick} style={{ display: 'none' }} />
              <p style={{ fontFamily: FIG, fontSize: 11.5, color: A.inkMuted, margin: '8px 0 0' }}>JPG, PNG, or WebP · up to 3MB</p>
            </div>

            <div className="grid gap-3 mt-4">
              <Input label="Your name" value={localUser.name || ''} onChange={(e) => set({ name: e.target.value })} />
              <Input
                label="Headline"
                placeholder="e.g. Orthopedic PT · return-to-sport"
                value={localUser.headline || ''}
                onChange={(e) => set({ headline: e.target.value })}
              />
              <Input
                type="number"
                label="Years of experience"
                value={localUser.yearsExperience ?? ''}
                onChange={(e) => set({ yearsExperience: e.target.value })}
              />
            </div>
          </Card>

          <Card>
            <h2 style={{ ...cardTitle, marginBottom: 12 }}>Specialties</h2>
            <div className="flex flex-wrap gap-2">
              {SPECIALTY_OPTIONS.map((sp) => {
                const selected = (localUser.specialties || []).includes(sp);
                return (
                  <button
                    key={sp}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => set({
                      specialties: selected
                        ? (localUser.specialties || []).filter((x) => x !== sp)
                        : [...(localUser.specialties || []), sp],
                    })}
                    className="plum-chip"
                  >
                    {sp}
                  </button>
                );
              })}
            </div>
          </Card>
        </aside>

        {/* ── RIGHT: bio + publish + licensing ───────────────────────── */}
        <div className="cs-cv-main" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 0 }}>
          <Card>
            <h2 style={{ ...cardTitle, marginBottom: 12 }}>Bio</h2>
            <label htmlFor="profile-bio" className="sr-only">Bio</label>
            <textarea
              id="profile-bio"
              className="plum-input"
              rows={5}
              placeholder="A short professional summary: focus areas, populations you serve, your approach."
              value={localUser.bio || ''}
              onChange={(e) => set({ bio: e.target.value })}
              style={{ ...fieldStyle, resize: 'vertical', lineHeight: 1.5 }}
            />
          </Card>

          {/* Public profile (Phase 2) */}
          <Card>
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
              <h2 style={cardTitle}>Public profile</h2>
              {publicLiveHandle && (
                <a
                  href={`/clinicians/${publicLiveHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="atlas-link"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: FIG, fontSize: 12.5, fontWeight: 500, textDecoration: 'none', minHeight: 36 }}
                >
                  View the public CV <ExternalLink size={13} aria-hidden="true" />
                </a>
              )}
            </div>
            <div className="grid gap-3">
              <div>
                <label htmlFor="profile-handle" style={fieldLabel}>Profile handle</label>
                <div className="flex items-center plum-input" aria-invalid={!handleValid} style={{ padding: 0, overflow: 'hidden' }}>
                  <span style={{ padding: '0 0 0 14px', color: A.inkMuted, fontFamily: FIG, fontSize: 13, whiteSpace: 'nowrap' }}>ceshield.com/clinicians/</span>
                  <input
                    id="profile-handle"
                    value={localUser.handle || ''}
                    onChange={(e) => set({ handle: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    placeholder="your-name"
                    className="flex-1 bg-transparent px-1 text-sm focus:outline-none"
                    style={{ minWidth: 0, minHeight: 42, fontFamily: FIG, color: A.ink, border: 'none' }}
                  />
                </div>
                {!handleValid && (
                  <p style={{ fontFamily: FIG, fontSize: 11.5, fontWeight: 500, color: A.warn, margin: '6px 0 0' }}>
                    3–30 chars: lowercase letters, numbers, hyphens (no leading or trailing hyphen).
                  </p>
                )}
              </div>

              <label className="flex items-start gap-2 text-sm" style={{ cursor: 'pointer', fontFamily: FIG }}>
                <input
                  type="checkbox"
                  checked={!!localUser.isPublic}
                  onChange={(e) => set({ isPublic: e.target.checked })}
                  style={{ marginTop: 3, width: 18, height: 18 }}
                />
                <span>
                  <span style={{ fontWeight: 500, color: A.ink, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    {localUser.isPublic ? <Eye size={14} aria-hidden="true" /> : <EyeOff size={14} aria-hidden="true" />}
                    Make my CV public
                  </span>
                  <span style={{ display: 'block', color: A.inkMuted, fontSize: 12, marginTop: 2, lineHeight: 1.5 }}>
                    Publishes name, headline, bio, specialties, license type and number, state, and credentials.
                    Your renewal date and email are never shown.
                  </span>
                </span>
              </label>
            </div>
          </Card>

          {/* Licensing & compliance */}
          <Card>
            <h2 style={{ ...cardTitle, marginBottom: 12 }}>Licensing &amp; compliance</h2>
            <div className="grid gap-3">
              <div>
                <label htmlFor="profile-state" style={fieldLabel}>Licensing state</label>
                <select
                  id="profile-state"
                  className="plum-input"
                  value={localUser.state || 'IL'}
                  onChange={(e) => set({ state: e.target.value })}
                  style={fieldStyle}
                >
                  {SUPPORTED_STATES.map((s) => {
                    const r = getRulesFor(s, 'PT') || getRulesFor(s, 'OT');
                    return <option key={s} value={s}>{(r ? r.jurisdictionName : s)}{r && r.verified === false ? ' (draft)' : ''}</option>;
                  })}
                </select>
              </div>

              <div>
                <span id="profile-license-label" style={fieldLabel}>License type</span>
                <div className="grid grid-cols-2 gap-3" role="group" aria-labelledby="profile-license-label">
                  {['PT', 'OT'].map((type) => {
                    const r = type === 'PT' ? ptRules : otRules;
                    const selected = localUser.licenseType === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => requestLicenseChange(type)}
                        className="p-3 text-left w-full transition-colors"
                        style={{
                          border: `1px solid ${selected ? 'rgba(240,195,168,0.55)' : LINE2}`,
                          background: selected ? 'rgba(240,195,168,0.10)' : 'transparent',
                          borderRadius: 6,
                          cursor: 'pointer',
                          minHeight: 56,
                        }}
                      >
                        <div style={{ fontFamily: FIG, fontWeight: 420, fontSize: 18, letterSpacing: '-0.02em', color: selected ? A.accent : A.ink }}>{type}</div>
                        <div style={{ fontFamily: FIG, fontSize: 11.5, color: selected ? A.inkBody : A.inkMuted, marginTop: 2, ...tabularNums }}>
                          {r ? `${r.totalHours}h / ${r.cycleYears}yr` : 'Unavailable'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <Input
                label={`${localUser.state} license number`}
                value={localUser.licenseNumber || ''}
                onChange={(e) => set({ licenseNumber: e.target.value })}
              />
              <Input
                type="date"
                label="Renewal date"
                value={localUser.renewalDate || ''}
                onChange={(e) => set({ renewalDate: e.target.value })}
              />
              <label className="flex items-center gap-2 text-sm" style={{ fontFamily: FIG }}>
                <input type="checkbox" checked={!!localUser.isFirstRenewal} onChange={(e) => set({ isFirstRenewal: e.target.checked })} style={{ width: 18, height: 18 }} />
                This is my first renewal (CE exempt)
              </label>
              {selectedRules && selectedRules.verified === false && (
                <p style={{ fontFamily: FIG, fontSize: 12, color: A.warn, margin: 0, lineHeight: 1.5 }}>
                  {selectedRules.jurisdictionName} rules are <strong>draft</strong>. Verify with{' '}
                  <a href={selectedRules.boardUrl} target="_blank" rel="noopener noreferrer" style={{ color: A.warn, fontWeight: 500 }}>
                    {selectedRules.citation}
                  </a>{' '}before relying on totals.
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Save bar */}
      <div className="flex items-center gap-3 flex-wrap mt-4" style={{ maxWidth: 1000 }}>
        <Button onClick={handleSave} disabled={saving || !handleValid}>
          <Save size={16} aria-hidden="true" /> {saving ? 'Saving…' : 'Save changes'}
        </Button>
        {savedAt && (
          <span role="status" style={{ fontFamily: FIG, fontSize: 13, fontWeight: 500, color: '#2fa894', ...tabularNums }}>
            ✓ Saved {savedAt.toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Credentials — full width below the editor */}
      <div className="mt-6" style={{ maxWidth: 1000 }}>
        <CredentialProfile />
      </div>

      <ConfirmDialog
        open={!!pendingLicenseChange}
        title="Change license type?"
        description="Changing license type updates all requirements (PT 40h vs OT 24h, different mandatory categories). Your logged courses stay; only the targets change."
        confirmLabel="Yes, change"
        cancelLabel="Keep current"
        onConfirm={() => { set({ licenseType: pendingLicenseChange }); setPendingLicenseChange(null); }}
        onCancel={() => setPendingLicenseChange(null)}
      />
    </div>
  );
}
