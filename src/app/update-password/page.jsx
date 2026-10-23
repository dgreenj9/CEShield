'use client';

// /update-password — destination for Supabase password-recovery emails.
//
// The reset email signs the user in via a recovery token in the URL hash;
// Supabase's client picks it up automatically and fires a PASSWORD_RECOVERY
// auth event. This page waits for a session, collects the new password,
// calls auth.updateUser, and sends the user to /explore.
//
// Without this route the reset link stranded users on the landing page
// with no way to actually set a new password.

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Loader2, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { supabase } from '@/services/supabaseClient';
import CEShieldLogo from '@/components/common/CEShieldLogo';

const INS = "'Figtree', ui-sans-serif, system-ui, sans-serif";

// Plum register, same as the sign-in panel: plum inputs with a peach focus
// ring, one peach pill action, ochre errors.
const inputClasses = 'plum-input text-sm';

const labelClasses = 'flex items-center gap-1.5 mb-2 text-sm';
const labelStyle = { color: '#C5D2CE', fontWeight: 500 };

const primaryBtn = (disabled) => ({
  background: '#E2C48F',
  color: '#10201F',
  border: 'none',
  borderRadius: 999,
  minHeight: 46,
  fontWeight: 500,
  fontSize: 15,
  cursor: disabled ? 'not-allowed' : 'pointer',
  opacity: disabled ? 0.45 : 1,
  transition: 'background 0.3s cubic-bezier(.2,.7,.2,1), opacity 0.3s ease',
});

const notice = {
  border: '1px solid rgba(224,142,109,0.35)',
  background: 'rgba(224,142,109,0.07)',
  borderRadius: 6,
};

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [phase, setPhase] = useState('checking'); // checking | ready | done | no-session
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // The recovery token arrives in the URL hash and Supabase processes it
    // asynchronously after page load. Listen for the auth event AND check
    // for an existing session (covers both the fresh-link and
    // already-processed cases).
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event === 'PASSWORD_RECOVERY' || session) setPhase('ready');
    });

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      if (data?.session) {
        setPhase('ready');
      } else {
        // Give the hash-processing a moment before declaring failure.
        setTimeout(() => {
          if (cancelled) return;
          setPhase((p) => (p === 'checking' ? 'no-session' : p));
        }, 2500);
      }
    });

    return () => {
      cancelled = true;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords don’t match.');
      return;
    }
    setSaving(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setPhase('done');
      setTimeout(() => router.replace('/explore'), 1800);
    } catch (err) {
      setError(err.message || 'Could not update password. Try requesting a new reset link.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 atlas-ground">
      <div
        className="w-full max-w-md plum-rise"
        style={{ background: 'rgba(15,29,34,0.72)', padding: '2.25rem 2rem 1.75rem', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 6, boxShadow: '0 40px 80px rgba(3,10,12,0.35)', WebkitBackdropFilter: 'blur(12px)', backdropFilter: 'blur(12px)' }}
      >
        <div className="text-center mb-6">
          <CEShieldLogo showTagline={false} centered size="xlarge" />
        </div>

        {phase === 'checking' && (
          <div className="text-center py-6" role="status" aria-live="polite">
            <Loader2 className="w-6 h-6 mx-auto animate-spin" style={{ color: '#E2C48F' }} aria-hidden="true" />
            <p className="text-sm mt-3" style={{ color: '#8EA5A0' }}>
              Verifying your reset link…
            </p>
          </div>
        )}

        {phase === 'no-session' && (
          <div className="space-y-4">
            <div
              className="text-center p-4"
              style={notice}
              role="alert"
            >
              <AlertCircle className="w-8 h-8 mx-auto mb-2" style={{ color: '#E08E6D' }} aria-hidden="true" />
              <h3 className="mb-2" style={{ fontFamily: INS, color: '#EEF2EC', fontWeight: 450, fontSize: 18, letterSpacing: '-0.02em' }}>
                Reset link expired or invalid
              </h3>
              <p className="text-sm" style={{ color: '#C5D2CE' }}>
                Reset links are single-use and expire quickly. Request a new
                one from the sign-in page.
              </p>
            </div>
            <button
              onClick={() => router.replace('/sign-in')}
              className="w-full px-4"
              style={primaryBtn(false)}
            >
              Back to sign in
            </button>
          </div>
        )}

        {phase === 'ready' && (
          <div>
            <h2
              className="text-center mb-2"
              style={{ fontFamily: INS, color: '#EEF2EC', letterSpacing: '-0.035em', fontWeight: 400, fontSize: 26, lineHeight: 1.15 }}
            >
              Set a new password
            </h2>
            <p className="text-center text-sm mb-6" style={{ color: '#8EA5A0' }}>
              Choose a new password for your account.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="new-password" className={labelClasses} style={labelStyle}>
                  <Lock className="inline w-4 h-4" aria-hidden="true" />
                  New password
                </label>
                <div className="relative">
                  <input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${inputClasses} pr-10`}
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-0 top-0 flex items-center justify-center"
                    style={{ color: '#8EA5A0', background: 'none', border: 'none', cursor: 'pointer', width: 44, height: 44 }}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" aria-hidden="true" /> : <Eye className="w-5 h-5" aria-hidden="true" />}
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="confirm-password" className={labelClasses} style={labelStyle}>
                  <Lock className="inline w-4 h-4" aria-hidden="true" />
                  Confirm new password
                </label>
                <input
                  id="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className={inputClasses}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>

              {error && (
                <div
                  role="alert"
                  style={{
                    ...notice,
                    padding: '0.75rem 1rem',
                    fontSize: '0.875rem',
                    color: '#C5D2CE',
                  }}
                >
                  <strong style={{ color: '#E08E6D', fontWeight: 600, marginRight: 8 }}>Error</strong>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={saving || !password || !confirm}
                className="w-full px-4 flex items-center justify-center"
                style={primaryBtn(saving || !password || !confirm)}
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> : 'Update password'}
              </button>
            </form>
          </div>
        )}

        {phase === 'done' && (
          <div
            className="text-center p-5"
            style={{ border: '1px solid rgba(226,196,143,0.4)', background: 'rgba(226,196,143,0.06)', borderRadius: 6 }}
            role="status"
          >
            <CheckCircle className="w-8 h-8 mx-auto mb-2" style={{ color: '#E2C48F' }} aria-hidden="true" />
            <h3 className="mb-2" style={{ fontFamily: INS, color: '#EEF2EC', fontWeight: 450, fontSize: 18, letterSpacing: '-0.02em' }}>Password updated</h3>
            <p className="text-sm" style={{ color: '#C5D2CE' }}>
              Taking you to your dashboard…
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
