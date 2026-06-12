import React, { useMemo, useState } from 'react';
import { LogOut, User, ChevronDown } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { colors } from '../../utils/constants';
import CEShieldLogo from '../common/CEShieldLogo';
import { SUPPORTED_STATES, getRulesFor } from '../../data/stateRules';

// Profile Setup Component
const ProfileSetup = ({ authUser, onComplete, onSignOut }) => {
  const [user, setUser] = useState({
    name: '', licenseType: '', licenseNumber: '', renewalDate: '', isFirstRenewal: false, state: 'IL'
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user.name || !user.licenseNumber || !user.renewalDate) return;
    
    setSaving(true);
    try {
      const { error } = await supabase.from('user_profiles').upsert({
        id: authUser.id,
        name: user.name,
        license_type: user.licenseType,
        license_number: user.licenseNumber,
        renewal_date: user.renewalDate,
        is_first_renewal: user.isFirstRenewal,
        state: user.state,
        updated_at: new Date().toISOString()
      });

      if (error) throw error;
      localStorage.setItem('ceTrackerUser', JSON.stringify(user));
      onComplete();
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Error saving profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const ptRules = useMemo(() => getRulesFor(user.state, 'PT'), [user.state]);
  const otRules = useMemo(() => getRulesFor(user.state, 'OT'), [user.state]);
  const selectedRules = useMemo(
    () => getRulesFor(user.state, user.licenseType),
    [user.state, user.licenseType],
  );

  const LicenseButton = ({ type, selected, onClick }) => {
    const r = type === 'PT' ? ptRules : otRules;
    const summary = r
      ? `${r.totalHours} hours/${r.cycleYears} years`
      : 'Pick a state first';
    return (
      <button
        type="button"
        onClick={onClick}
        className="p-4 transition-all"
        style={{
          border: `2px solid ${selected ? colors.primaryBlue : colors.slateLight}`,
          background: selected ? colors.lightBlue : 'white', cursor: 'pointer',
          borderRadius: 8,
        }}
      >
        <div className="font-semibold">{type}</div>
        <div className="text-sm" style={{ color: colors.textGray }}>
          {type === 'PT' ? 'Physical Therapist' : 'Occupational Therapist'}
        </div>
        <div className="text-xs mt-1" style={{ color: colors.textGray }}>{summary}</div>
        {r && r.verified === false && (
          <div className="text-xs mt-1" style={{ color: '#92400e', fontWeight: 600 }}>
            DRAFT
          </div>
        )}
      </button>
    );
  };

  return (
    <div className="min-h-screen p-4" style={{ background: colors.grayLight }}>
      <div className="max-w-md mx-auto mt-10">
        <div style={{ background: 'white', padding: '2rem', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.06)', border: `1px solid ${colors.slateLight}` }}>
          <div className="flex justify-between items-center mb-6">
            <CEShieldLogo showTagline={false} size="medium" />
            <button onClick={onSignOut} style={{ color: colors.textGray, background: 'none', border: 'none', cursor: 'pointer' }} title="Sign Out">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
          
          <div className="mb-4 p-3" style={{ background: colors.lightBlue }}>
            <p className="text-sm" style={{ color: colors.textDark }}>
              <User className="inline w-4 h-4 mr-1" />
              Signed in as: {authUser.email}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.textDark }}>
                Select Your State
              </label>
              <div className="relative">
                <select
                  value={user.state}
                  onChange={(e) => setUser({ ...user, state: e.target.value })}
                  className="w-full px-3 py-2 appearance-none focus:outline-none focus:ring-2"
                  style={{ border: `1px solid ${colors.slateLight}`, background: colors.grayLight, borderRadius: 6 }}
                >
                  <option value="">Choose a state</option>
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
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <ChevronDown className="w-5 h-5" style={{ color: colors.textGray }} aria-hidden="true" />
                </div>
              </div>
              {selectedRules && selectedRules.verified === false ? (
                <p className="text-xs mt-1" style={{ color: '#92400e' }}>
                  {selectedRules.jurisdictionName} rules are <strong>draft</strong> —
                  verify with your licensing board before relying on totals.
                </p>
              ) : (
                <p className="text-xs mt-1" style={{ color: colors.textGray }}>
                  More states rolling out monthly. Don&rsquo;t see yours? Email us.
                </p>
              )}
            </div>

            {user.state && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: colors.textDark }}>
                    Select Your License Type
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <LicenseButton type="PT" selected={user.licenseType === 'PT'} onClick={() => setUser({...user, licenseType: 'PT'})} />
                    <LicenseButton type="OT" selected={user.licenseType === 'OT'} onClick={() => setUser({...user, licenseType: 'OT'})} />
                  </div>
                </div>

                {user.licenseType && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: colors.textDark }}>Your Name</label>
                      <input
                        type="text"
                        value={user.name}
                        onChange={(e) => setUser({...user, name: e.target.value})}
                        className="w-full px-3 py-2 focus:outline-none focus:ring-2"
                        style={{ border: `1px solid ${colors.slateLight}`, background: colors.grayLight }}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: colors.textDark }}>
                        {user.state} License Number
                      </label>
                      <input
                        type="text"
                        value={user.licenseNumber}
                        onChange={(e) => setUser({...user, licenseNumber: e.target.value})}
                        className="w-full px-3 py-2 focus:outline-none focus:ring-2"
                        style={{ border: `1px solid ${colors.slateLight}`, background: colors.grayLight }}
                        placeholder={`Enter your ${user.state} license number`}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: colors.textDark }}>Renewal Date</label>
                      <input
                        type="date"
                        value={user.renewalDate}
                        onChange={(e) => setUser({...user, renewalDate: e.target.value})}
                        className="w-full px-3 py-2 focus:outline-none focus:ring-2"
                        style={{ border: `1px solid ${colors.slateLight}`, background: colors.grayLight }}
                        required
                      />
                    </div>

                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={user.isFirstRenewal}
                          onChange={(e) => setUser({...user, isFirstRenewal: e.target.checked})}
                          className="mr-2"
                        />
                        <span className="text-sm">This is my first renewal (CE exempt)</span>
                      </label>
                    </div>

                    <button
                      onClick={handleSave}
                      className="w-full py-2 px-4 transition-all"
                      style={{
                        background: (!user.name || !user.licenseNumber || !user.renewalDate || saving) ? colors.slateMedium : colors.primaryBlue,
                        color: 'white', border: 'none', fontWeight: 500,
                        cursor: (!user.name || !user.licenseNumber || !user.renewalDate || saving) ? 'not-allowed' : 'pointer',
                        opacity: (!user.name || !user.licenseNumber || !user.renewalDate || saving) ? 0.5 : 1
                      }}
                      disabled={!user.name || !user.licenseNumber || !user.renewalDate || saving}
                    >
                      {saving ? 'Saving...' : 'Continue'}
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;
