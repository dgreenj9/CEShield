import React, { useMemo, useState } from 'react';
import { LogOut, User, ChevronDown } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import CEShieldLogo from '../common/CEShieldLogo';
import { SUPPORTED_STATES, getRulesFor } from '../../data/stateRules';

// Profile setup — Atlas register panel. All save/completion logic unchanged.

const INS = "'Instrument Sans', ui-sans-serif, system-ui, sans-serif";

const inputClasses =
  'w-full px-3 py-2 rounded-none border border-atlas-rule-minor bg-atlas-paper text-sm text-atlas-ink ' +
  'placeholder:text-atlas-ink-muted focus:outline-none focus:border-atlas-accent focus:ring-1 focus:ring-atlas-accent';

const labelClasses = 'block text-sm font-semibold mb-2 text-atlas-ink';

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

  const saveDisabled = !user.name || !user.licenseNumber || !user.renewalDate || saving;

  const LicenseButton = ({ type, selected, onClick }) => {
    const r = type === 'PT' ? ptRules : otRules;
    const summary = r
      ? `${r.totalHours} hours / ${r.cycleYears} years`
      : 'Pick a state first';
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={selected}
        className="p-4 text-left"
        style={{
          border: selected ? '1px solid #235E6B' : '1px solid #D5D3C6',
          boxShadow: selected ? 'inset 0 0 0 1px #235E6B' : 'none',
          background: selected ? '#F2F1E9' : '#FAFAF5',
          cursor: 'pointer',
          borderRadius: 0,
          transition: 'background 0.12s ease, border-color 0.12s ease',
        }}
      >
        <div className="font-semibold" style={{ fontFamily: INS, color: selected ? '#235E6B' : '#1B1A17' }}>
          {selected ? '● ' : ''}{type}
        </div>
        <div className="text-sm" style={{ color: '#56544C' }}>
          {type === 'PT' ? 'Physical Therapist' : 'Occupational Therapist'}
        </div>
        <div className="text-xs mt-1 tabular-nums" style={{ color: '#56544C' }}>{summary}</div>
        {r && r.verified === false && (
          <div className="text-xs mt-1" style={{ color: '#C77B2E', fontWeight: 700 }}>
            Draft rules
          </div>
        )}
      </button>
    );
  };

  return (
    <div className="min-h-screen p-4 atlas-ground">
      <div className="max-w-md mx-auto mt-10">
        <div style={{ background: '#FAFAF5', padding: '2rem', border: '1px solid #1B1A17' }}>
          <div className="flex justify-between items-center mb-6">
            <CEShieldLogo showTagline={false} size="medium" />
            <button
              onClick={onSignOut}
              style={{ color: '#56544C', background: 'none', border: 'none', cursor: 'pointer' }}
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          <div className="mb-4 p-3" style={{ background: '#F2F1E9', border: '1px solid #D5D3C6' }}>
            <p className="text-sm" style={{ color: '#1B1A17' }}>
              <User className="inline w-4 h-4 mr-1" aria-hidden="true" />
              Signed in as: {authUser.email}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className={labelClasses}>
                Your state
              </label>
              <div className="relative">
                <select
                  value={user.state}
                  onChange={(e) => setUser({ ...user, state: e.target.value })}
                  className={`${inputClasses} appearance-none`}
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
                  <ChevronDown className="w-5 h-5" style={{ color: '#56544C' }} aria-hidden="true" />
                </div>
              </div>
              {selectedRules && selectedRules.verified === false ? (
                <p className="text-xs mt-1" style={{ color: '#45433C' }}>
                  <strong style={{ color: '#C77B2E' }}>Draft:</strong>{' '}
                  {selectedRules.jurisdictionName} rules are unverified. Confirm
                  with your licensing board before relying on totals.
                </p>
              ) : (
                <p className="text-xs mt-1" style={{ color: '#56544C' }}>
                  More states rolling out monthly. Don&rsquo;t see yours? Email us.
                </p>
              )}
            </div>

            {user.state && (
              <>
                <div>
                  <label className={labelClasses}>
                    Your license type
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <LicenseButton type="PT" selected={user.licenseType === 'PT'} onClick={() => setUser({...user, licenseType: 'PT'})} />
                    <LicenseButton type="OT" selected={user.licenseType === 'OT'} onClick={() => setUser({...user, licenseType: 'OT'})} />
                  </div>
                </div>

                {user.licenseType && (
                  <>
                    <div>
                      <label className={labelClasses}>Your name</label>
                      <input
                        type="text"
                        value={user.name}
                        onChange={(e) => setUser({...user, name: e.target.value})}
                        className={inputClasses}
                        required
                      />
                    </div>

                    <div>
                      <label className={labelClasses}>
                        {user.state} license number
                      </label>
                      <input
                        type="text"
                        value={user.licenseNumber}
                        onChange={(e) => setUser({...user, licenseNumber: e.target.value})}
                        className={inputClasses}
                        placeholder={`Enter your ${user.state} license number`}
                        required
                      />
                    </div>

                    <div>
                      <label className={labelClasses}>Renewal date</label>
                      <input
                        type="date"
                        value={user.renewalDate}
                        onChange={(e) => setUser({...user, renewalDate: e.target.value})}
                        className={inputClasses}
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
                          style={{ accentColor: '#235E6B' }}
                        />
                        <span className="text-sm" style={{ color: '#1B1A17' }}>This is my first renewal (CE exempt)</span>
                      </label>
                    </div>

                    <button
                      onClick={handleSave}
                      className="w-full py-2 px-4"
                      style={{
                        background: '#235E6B',
                        color: '#FAFAF5',
                        border: 'none',
                        fontWeight: 600,
                        cursor: saveDisabled ? 'not-allowed' : 'pointer',
                        opacity: saveDisabled ? 0.5 : 1,
                        transition: 'background 0.15s ease, opacity 0.15s ease',
                      }}
                      disabled={saveDisabled}
                    >
                      {saving ? 'Saving…' : 'Continue'}
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
