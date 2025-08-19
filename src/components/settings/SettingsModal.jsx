import React, { useState } from 'react';
import { colors } from '../../utils/constants';
import Modal from '../common/Modal';

const SettingsModal = ({ user, onSave, onClose, courses }) => {
  const [localUser, setLocalUser] = useState({...user});
  const [saving, setSaving] = useState(false);
  
  const handleSave = async () => {
    setSaving(true);
    const saved = await onSave(localUser);
    setSaving(false);
    
    if (saved) {
      onClose();
      alert('Settings saved successfully!');
    }
  };

  const LicenseButton = ({ type, selected, onClick }) => (
    <button
      onClick={onClick}
      className="p-3"
      style={{
        border: `2px solid ${selected ? colors.primaryBlue : colors.slateLight}`,
        background: selected ? colors.lightBlue : 'white', cursor: 'pointer'
      }}
    >
      <div className="font-semibold">{type}</div>
      <div className="text-xs" style={{ color: colors.textGray }}>
        {localUser.state === 'IL' ? (type === 'PT' ? '40 hours/2 years' : '24 hours/2 years') : 'Requirements vary'}
      </div>
    </button>
  );
  
  return (
    <Modal onClose={onClose}>
      <h3 className="text-lg font-semibold mb-4" style={{ color: colors.textDark }}>Profile Settings</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: colors.textDark }}>State</label>
          <select
            value={localUser.state || 'IL'}
            onChange={(e) => setLocalUser({...localUser, state: e.target.value})}
            className="w-full px-3 py-2"
            style={{ border: `1px solid ${colors.slateLight}`, background: colors.grayLight }}
          >
            <option value="IL">Illinois</option>
          </select>
          <p className="text-xs mt-1" style={{ color: colors.textGray }}>
            Currently supporting Illinois. More states coming soon!
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: colors.textDark }}>License Type</label>
          <div className="grid grid-cols-2 gap-4">
            <LicenseButton 
              type="PT" 
              selected={localUser.licenseType === 'PT'} 
              onClick={() => {
                if (localUser.licenseType !== 'PT' && courses.length > 0) {
                  if (window.confirm('Changing license type will update all requirements. Continue?')) {
                    setLocalUser({...localUser, licenseType: 'PT'});
                  }
                } else {
                  setLocalUser({...localUser, licenseType: 'PT'});
                }
              }}
            />
            <LicenseButton 
              type="OT" 
              selected={localUser.licenseType === 'OT'} 
              onClick={() => {
                if (localUser.licenseType !== 'OT' && courses.length > 0) {
                  if (window.confirm('Changing license type will update all requirements. Continue?')) {
                    setLocalUser({...localUser, licenseType: 'OT'});
                  }
                } else {
                  setLocalUser({...localUser, licenseType: 'OT'});
                }
              }}
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
    </Modal>
  );
};

export default SettingsModal;
