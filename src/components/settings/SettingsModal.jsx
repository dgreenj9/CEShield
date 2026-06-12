import React, { useMemo, useState } from 'react';
import { colors } from '../../utils/constants';
import Modal from '../common/Modal';
import ConfirmDialog from '../ui/ConfirmDialog';
import { SUPPORTED_STATES, getRulesFor } from '../../data/stateRules';

const SettingsModal = ({ user, onSave, onClose, courses }) => {
  const [localUser, setLocalUser] = useState({...user});
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
  // even as we add states. PT/OT buttons show "{N} hours/{cycle} years".
  const ptRules = useMemo(() => getRulesFor(localUser.state, 'PT'), [localUser.state]);
  const otRules = useMemo(() => getRulesFor(localUser.state, 'OT'), [localUser.state]);
  const selectedRules = useMemo(
    () => getRulesFor(localUser.state, localUser.licenseType),
    [localUser.state, localUser.licenseType],
  );

  const LicenseButton = ({ type, selected, onClick }) => {
    const r = type === 'PT' ? ptRules : otRules;
    const summary = r
      ? `${r.totalHours} hours/${r.cycleYears} years`
      : 'Requirements unavailable';
    return (
      <button
        type="button"
        onClick={onClick}
        className="p-3"
        style={{
          border: `2px solid ${selected ? colors.primaryBlue : colors.slateLight}`,
          background: selected ? colors.lightBlue : 'white', cursor: 'pointer',
          borderRadius: 8,
        }}
      >
        <div className="font-semibold">{type}</div>
        <div className="text-xs" style={{ color: colors.textGray }}>{summary}</div>
        {r && r.verified === false && (
          <div className="text-xs mt-1" style={{ color: '#92400e', fontWeight: 600 }}>
            DRAFT
          </div>
        )}
      </button>
    );
  };
  
  return (
    <Modal onClose={onClose}>
      <h3 className="text-lg font-semibold mb-4" style={{ color: colors.textDark }}>Profile Settings</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: colors.textDark }}>State</label>
          <select
            value={localUser.state || 'IL'}
            onChange={(e) => setLocalUser({ ...localUser, state: e.target.value })}
            className="w-full px-3 py-2"
            style={{ border: `1px solid ${colors.slateLight}`, background: colors.grayLight, borderRadius: 6 }}
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
            <p className="text-xs mt-1" style={{ color: '#92400e' }}>
              {selectedRules.jurisdictionName} rules are <strong>draft</strong> —
              verify against{' '}
              <a
                href={selectedRules.boardUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'underline' }}
              >
                {selectedRules.citation}
              </a>
              {' '}before relying on totals.
            </p>
          )}
          {selectedRules && selectedRules.verified !== false && (
            <p className="text-xs mt-1" style={{ color: colors.textGray }}>
              Verified against {selectedRules.citation} (last reviewed {selectedRules.lastReviewed}).
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: colors.textDark }}>License Type</label>
          <div className="grid grid-cols-2 gap-4">
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

        {['name', 'licenseNumber', 'renewalDate'].map(field => (
          <div key={field}>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.textDark }}>
              {field === 'name' ? 'Your Name' : 
               field === 'licenseNumber' ? `${localUser.state} License Number` : 'Renewal Date'}
            </label>
            <input
              type={field === 'renewalDate' ? 'date' : 'text'}
              value={localUser[field]}
              onChange={(e) => setLocalUser({...localUser, [field]: e.target.value})}
              className="w-full px-3 py-2"
              style={{ border: `1px solid ${colors.slateLight}`, background: colors.grayLight }}
            />
          </div>
        ))}

        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={localUser.isFirstRenewal}
              onChange={(e) => setLocalUser({...localUser, isFirstRenewal: e.target.checked})}
              className="mr-2"
            />
            <span className="text-sm">This is my first renewal (CE exempt)</span>
          </label>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2"
            style={{ color: colors.textDark, background: colors.slateLight, border: 'none', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2"
            style={{ 
              background: saving ? colors.slateMedium : colors.primaryBlue, 
              color: 'white', border: 'none', 
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.5 : 1
            }}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
      <ConfirmDialog
        open={!!pendingLicenseChange}
        title="Change license type?"
        description="Changing license type will update all requirements (PT 40h ↔ OT 24h, different mandatory categories). Your logged courses stay — only the targets change."
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
