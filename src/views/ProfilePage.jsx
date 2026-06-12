import React, { useEffect, useMemo, useRef, useState } from 'react';
import { User, Save, Camera, Eye, EyeOff, ExternalLink, Loader2 } from 'lucide-react';
import { colors } from '../utils/constants';
import { useUserData } from '../contexts/UserDataContext';
import { SUPPORTED_STATES, getRulesFor } from '../data/stateRules';
import {
  PageHeader, Card, Button, Input, ConfirmDialog,
} from '../components/ui';
import CredentialProfile from '../components/dashboard/CredentialProfile';

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
      <PageHeader
        icon={User}
        title="Profile"
        subtitle="Build your living rehab CV — the credentials, specialties, and experience that define your practice. Licensing details below also drive your compliance tracker."
      />

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
                  overflow: 'hidden', border: `1px solid ${colors.slateLight}`,
                  background: colors.lightBlue, color: colors.primaryBlue, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '2rem', fontWeight: 600, padding: 0,
                }}
              >
                {localUser.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={localUser.avatarUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : initials}
                <span style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0, padding: '4px 0',
                  background: 'rgba(15,23,42,0.55)', color: 'white', fontSize: '0.62rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                }}>
                  {saving ? <Loader2 size={11} className="animate-spin" aria-hidden="true" /> : <Camera size={11} aria-hidden="true" />}
                  Photo
                </span>
              </button>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarPick} style={{ display: 'none' }} />
              <p className="text-2xs text-ink-gray mt-2">JPG, PNG, or WebP · up to 3MB</p>
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
            <h2 className="text-base font-semibold text-ink-dark m-0 mb-3">Specialties</h2>
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
                    style={{
                      padding: '0.3rem 0.7rem', fontSize: '0.8rem', fontWeight: 500,
                      borderRadius: 9999, cursor: 'pointer',
                      border: `1px solid ${selected ? colors.primaryBlue : colors.slateLight}`,
                      background: selected ? colors.primaryBlue : 'white',
                      color: selected ? 'white' : colors.slateMedium,
                    }}
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
            <h2 className="text-base font-semibold text-ink-dark m-0 mb-3">Bio</h2>
            <textarea
              rows={5}
              placeholder="A short professional summary — focus areas, populations you serve, your approach."
              value={localUser.bio || ''}
              onChange={(e) => set({ bio: e.target.value })}
              className="w-full rounded-md border border-slate-light bg-gray-bg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
              style={{ resize: 'vertical', lineHeight: 1.5, fontFamily: 'inherit' }}
            />
          </Card>

          {/* Public profile (Phase 2) */}
          <Card>
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
              <h2 className="text-base font-semibold text-ink-dark m-0">Public profile</h2>
              {publicLiveHandle && (
                <a
                  href={`/clinicians/${publicLiveHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.82rem', color: colors.primaryBlue, textDecoration: 'none' }}
                >
                  View public CV <ExternalLink size={13} aria-hidden="true" />
                </a>
              )}
            </div>
            <div className="grid gap-3">
              <div>
                <label className="block mb-1.5 text-sm font-medium" style={{ color: colors.textDark }}>Profile handle</label>
                <div className="flex items-center" style={{ border: `1px solid ${handleValid ? colors.slateLight : '#fca5a5'}`, borderRadius: 6, background: colors.grayLight, overflow: 'hidden' }}>
                  <span style={{ padding: '0.5rem 0 0.5rem 0.75rem', color: colors.textGray, fontSize: '0.85rem', whiteSpace: 'nowrap' }}>ceshield.com/clinicians/</span>
                  <input
                    value={localUser.handle || ''}
                    onChange={(e) => set({ handle: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    placeholder="your-name"
                    className="flex-1 bg-transparent px-1 py-2 text-sm focus:outline-none"
                    style={{ minWidth: 0 }}
                  />
                </div>
                {!handleValid && (
                  <p className="text-2xs mt-1" style={{ color: '#dc2626' }}>
                    3–30 chars: lowercase letters, numbers, hyphens (no leading/trailing hyphen).
                  </p>
                )}
              </div>

              <label className="flex items-start gap-2 text-sm" style={{ cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={!!localUser.isPublic}
                  onChange={(e) => set({ isPublic: e.target.checked })}
                  style={{ marginTop: 3 }}
                />
                <span>
                  <span className="font-medium" style={{ color: colors.textDark, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    {localUser.isPublic ? <Eye size={14} aria-hidden="true" /> : <EyeOff size={14} aria-hidden="true" />}
                    Make my CV public
                  </span>
                  <span className="block text-ink-gray text-2xs mt-0.5">
                    Publishes name, headline, bio, specialties, license type and number, state, and credentials.
                    Your renewal date and email are never shown.
                  </span>
                </span>
              </label>
            </div>
          </Card>

          {/* Licensing & compliance */}
          <Card>
            <h2 className="text-base font-semibold text-ink-dark m-0 mb-3">Licensing &amp; compliance</h2>
            <div className="grid gap-3">
              <div>
                <label className="block mb-1.5 text-sm font-medium" style={{ color: colors.textDark }}>Licensing state</label>
                <select
                  value={localUser.state || 'IL'}
                  onChange={(e) => set({ state: e.target.value })}
                  className="w-full rounded-md border border-slate-light bg-gray-bg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                >
                  {SUPPORTED_STATES.map((s) => {
                    const r = getRulesFor(s, 'PT') || getRulesFor(s, 'OT');
                    return <option key={s} value={s}>{(r ? r.jurisdictionName : s)}{r && r.verified === false ? ' (draft)' : ''}</option>;
                  })}
                </select>
              </div>

              <div>
                <label className="block mb-1.5 text-sm font-medium" style={{ color: colors.textDark }}>License type</label>
                <div className="grid grid-cols-2 gap-3">
                  {['PT', 'OT'].map((type) => {
                    const r = type === 'PT' ? ptRules : otRules;
                    const selected = localUser.licenseType === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => requestLicenseChange(type)}
                        className="p-3 text-left rounded-lg w-full transition-colors"
                        style={{ border: `2px solid ${selected ? colors.primaryBlue : colors.slateLight}`, background: selected ? colors.lightBlue : 'white' }}
                      >
                        <div className="font-semibold text-ink-dark">{type}</div>
                        <div className="text-2xs text-ink-gray mt-0.5">
                          {r ? `${r.totalHours}h / ${r.cycleYears}y` : 'Unavailable'}
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
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={!!localUser.isFirstRenewal} onChange={(e) => set({ isFirstRenewal: e.target.checked })} />
                This is my first renewal (CE exempt)
              </label>
              {selectedRules && selectedRules.verified === false && (
                <p className="text-2xs" style={{ color: '#92400e' }}>
                  {selectedRules.jurisdictionName} rules are <strong>draft</strong> — verify with{' '}
                  <a href={selectedRules.boardUrl} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: '#92400e' }}>
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
        {savedAt && <span className="text-sm text-green-600">Saved {savedAt.toLocaleTimeString()}</span>}
      </div>

      {/* Credentials — full width below the editor */}
      <div className="mt-6" style={{ maxWidth: 1000 }}>
        <CredentialProfile />
      </div>

      <ConfirmDialog
        open={!!pendingLicenseChange}
        title="Change license type?"
        description="Changing license type updates all requirements (PT 40h ↔ OT 24h, different mandatory categories). Your logged courses stay — only the targets change."
        confirmLabel="Yes, change"
        cancelLabel="Keep current"
        onConfirm={() => { set({ licenseType: pendingLicenseChange }); setPendingLicenseChange(null); }}
        onCancel={() => setPendingLicenseChange(null)}
      />
    </div>
  );
}
