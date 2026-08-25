import React, { useMemo, useState } from 'react';
import Modal from '../common/Modal';
import ConfirmDialog from '../ui/ConfirmDialog';
import { SUPPORTED_STATES, getRulesFor } from '../../data/stateRules';
import { A, FIG, INS, tabularNums } from '../atlas/theme';

const label = { display: 'block', fontFamily: FIG, fontSize: 13.5, fontWeight: 600, color: A.ink, marginBottom: 6 };
const field = {
  width: '100%',
  padding: '8px 10px',
  fontFamily: FIG,
  fontSize: 14,
  border: `1px solid ${A.ruleMinor}`,
  background: A.paper,
  color: A.ink,
  borderRadius: 0,
  boxSizing: 'border-box',
};

const SettingsModal = ({ user, onSave, onClose, courses }) => {
  const [localUser, setLocalUser] = useState({ ...user });
  const [saving, setSaving] = useState(false);
  const [pendingLicenseChange, setPendingLicenseChange] = useState(null);

  const handleSave = async () => {
    setSaving(true);
    const saved = await onSave(localUser);
    setSaving(false);

    if (saved) {
      onClose();
    }
  };

  const requestLicenseChange = (nextType) => {
    if (localUser.licenseType === nextType) return;
    if (courses.length > 0) {
      setPendingLicenseChange(nextType);
    } else {
      setLocalUser((u) => ({ ...u, licenseType: nextType }));
    }
  };

  // Pull live total-hours from the rules registry so the buttons stay accurate
  // even as we add states. PT/OT buttons show "{N}h / {cycle}yr".
  const ptRules = useMemo(() => getRulesFor(localUser.state, 'PT'), [localUser.state]);
  const otRules = useMemo(() => getRulesFor(localUser.state, 'OT'), [localUser.state]);
  const selectedRules = useMemo(
    () => getRulesFor(localUser.state, localUser.licenseType),
    [localUser.state, localUser.licenseType],
  );

  const LicenseButton = ({ type, selected, onClick }) => {
    const r = type === 'PT' ? ptRules : otRules;
    const summary = r ? `${r.totalHours}h / ${r.cycleYears}yr` : 'Unavailable';
    return (
      <button
        type="button"
        aria-pressed={selected}
        onClick={onClick}
        className="p-3 text-left"
        style={{
          border: `1px solid ${selected ? A.accent : A.ruleMinor}`,
          background: selected ? A.accent : 'transparent',
          borderRadius: 0,
          cursor: 'pointer',
        }}
      >
        <div style={{ fontFamily: INS, fontWeight: 600, fontSize: 16, color: selected ? A.onAccent : A.ink }}>{type}</div>
        <div style={{ fontFamily: FIG, fontSize: 11.5, color: selected ? A.onAccent : A.inkMuted, marginTop: 2, ...tabularNums }}>{summary}</div>
        {r && r.verified === false && (
          <div style={{ fontFamily: FIG, fontSize: 10.5, fontWeight: 700, marginTop: 4, color: selected ? A.onAccent : A.warn, letterSpacing: '0.02em' }}>
            Draft rules
          </div>
        )}
      </button>
    );
  };

  return (
    <Modal onClose={onClose}>
      <h3 style={{ fontFamily: INS, fontWeight: 600, fontSize: 22, letterSpacing: '-0.02em', color: A.ink, margin: '0 0 1.25rem' }}>
        Profile settings
      </h3>

      <div className="space-y-4">
        <div>
          <label style={label}>State</label>
          <select
            value={localUser.state || 'IL'}
            onChange={(e) => setLocalUser({ ...localUser, state: e.target.value })}
            style={field}
          >
            {SUPPORTED_STATES.map((s) => {
              const r = getRulesFor(s, 'PT') || getRulesFor(s, 'OT');
              const name = r ? r.jurisdictionName : s;
              return (
                <option key={s} value={s}>
                  {name}{r && r.verified === false ? ' (draft)' : ''}
                </option>
              );
            })}
          </select>
          {selectedRules && selectedRules.verified === false && (
            <p style={{ fontFamily: FIG, fontSize: 12, color: A.warn, margin: '4px 0 0', lineHeight: 1.5 }}>
              {selectedRules.jurisdictionName} rules are <strong>draft</strong>.
              Verify against{' '}
              <a
                href={selectedRules.boardUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: A.warn, fontWeight: 700 }}
              >
                {selectedRules.citation}
              </a>
              {' '}before relying on totals.
            </p>
          )}
          {selectedRules && selectedRules.verified !== false && (
            <p style={{ fontFamily: FIG, fontSize: 12, color: A.inkMuted, margin: '4px 0 0' }}>
              Verified against {selectedRules.citation} (last reviewed {selectedRules.lastReviewed}).
            </p>
          )}
        </div>

        <div>
          <label style={label}>License type</label>
          <div className="grid grid-cols-2 gap-3">
            <LicenseButton
              type="PT"
              selected={localUser.licenseType === 'PT'}
              onClick={() => requestLicenseChange('PT')}
            />
            <LicenseButton
              type="OT"
              selected={localUser.licenseType === 'OT'}
              onClick={() => requestLicenseChange('OT')}
            />
          </div>
        </div>

        {['name', 'licenseNumber', 'renewalDate'].map((f) => (
          <div key={f}>
            <label style={label}>
              {f === 'name' ? 'Your name'
                : f === 'licenseNumber' ? `${localUser.state} license number` : 'Renewal date'}
            </label>
            <input
              type={f === 'renewalDate' ? 'date' : 'text'}
              value={localUser[f]}
              onChange={(e) => setLocalUser({ ...localUser, [f]: e.target.value })}
              style={field}
            />
          </div>
        ))}

        <div>
          <label className="flex items-center" style={{ fontFamily: FIG, fontSize: 13.5, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={localUser.isFirstRenewal}
              onChange={(e) => setLocalUser({ ...localUser, isFirstRenewal: e.target.checked })}
              className="mr-2"
            />
            <span>This is my first renewal (CE exempt)</span>
          </label>
        </div>

        <div className="flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            style={{ fontFamily: FIG, fontSize: 13.5, fontWeight: 600, padding: '9px 16px', color: A.ink, background: 'transparent', border: `1px solid ${A.ink}`, cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{
              fontFamily: FIG, fontSize: 13.5, fontWeight: 600, padding: '9px 16px',
              background: A.accent, color: A.onAccent, border: `1px solid ${A.accent}`,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.5 : 1,
            }}
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
      <ConfirmDialog
        open={!!pendingLicenseChange}
        title="Change license type?"
        description="Changing license type updates all requirements (PT 40h vs OT 24h, different mandatory categories). Your logged courses stay; only the targets change."
        confirmLabel="Yes, change"
        cancelLabel="Keep current"
        onConfirm={() => {
          setLocalUser((u) => ({ ...u, licenseType: pendingLicenseChange }));
          setPendingLicenseChange(null);
        }}
        onCancel={() => setPendingLicenseChange(null)}
      />
    </Modal>
  );
};

export default SettingsModal;
