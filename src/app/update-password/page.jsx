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

const inputClasses =
  'w-full px-3 py-2 rounded-none border border-atlas-rule-minor bg-atlas-paper text-sm text-atlas-ink ' +
  'placeholder:text-atlas-ink-muted focus:outline-none focus:border-atlas-accent focus:ring-1 focus:ring-atlas-accent';

const labelClasses = 'block mb-2 text-sm font-semibold text-atlas-ink';

const primaryBtn = (disabled) => ({
  background: '#F0C3A8',
  color: '#2A2230',
  border: 'none',
  fontWeight: 600,
  cursor: disabled ? 'not-allowed' : 'pointer',
  opacity: disabled ? 0.5 : 1,
  transition: 'background 0.15s ease, opacity 0.15s ease',
});

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
        className="w-full max-w-md"
        style={{ background: '#292331', padding: '2rem', border: '1px solid #F6EEE9' }}
      >
        <div className="text-center mb-6">
          <CEShieldLogo showTagline={false} centered size="xlarge" />
        </div>

        {phase === 'checking' && (
          <div className="text-center py-6" role="status" aria-live="polite">
            <Loader2 className="w-6 h-6 mx-auto animate-spin" style={{ color: '#F0C3A8' }} aria-hidden="true" />
            <p className="text-sm mt-3" style={{ color: '#A998AE' }}>
              Verifying your reset link…
            </p>
          </div>
        )}

        {phase === 'no-session' && (
          <div className="space-y-4">
            <div
              className="text-center p-4"
              style={{ border: '1px dashed #F6EEE9', background: '#3A3043' }}
              role="alert"
            >
              <AlertCircle className="w-8 h-8 mx-auto mb-2" style={{ color: '#E0A85A' }} aria-hidden="true" />
              <h3 className="font-semibold mb-2" style={{ fontFamily: INS, color: '#F6EEE9' }}>
                Reset link expired or invalid
              </h3>
              <p className="text-sm" style={{ color: '#D5C9D9' }}>
                Reset links are single-use and expire quickly. Request a new
                one from the sign-in page.
              </p>
            </div>
            <button
              onClick={() => router.replace('/sign-in')}
              className="w-full py-2 px-4"
              style={primaryBtn(false)}
            >
              Back to sign in
            </button>
          </div>
        )}

        {phase === 'ready' && (
          <div>
            <h2
              className="text-xl font-semibold text-center mb-2"
              style={{ fontFamily: INS, color: '#F6EEE9', letterSpacing: '-0.02em' }}
            >
              Set a new password
            </h2>
            <p className="text-center text-sm mb-6" style={{ color: '#A998AE' }}>
              Choose a new password for your account.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={labelClasses}>
                  <Lock className="inline w-4 h-4 mr-1" aria-hidden="true" />
                  New password
                </label>
                <div className="relative">
                  <input
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
                    className="absolute right-2 top-2.5"
                    style={{ color: '#A998AE', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" aria-hidden="true" /> : <Eye className="w-5 h-5" aria-hidden="true" />}
                  </button>
                </div>
              </div>
              <div>
                <label className={labelClasses}>
                  <Lock className="inline w-4 h-4 mr-1" aria-hidden="true" />
                  Confirm new password
                </label>
                <input
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
                    border: '1px dashed #F6EEE9',
                    background: '#3A3043',
                    padding: '0.75rem 1rem',
                    fontSize: '0.875rem',
                    color: '#D5C9D9',
                  }}
                >
                  <strong style={{ color: '#E0A85A', fontWeight: 700, marginRight: 8 }}>Error</strong>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={saving || !password || !confirm}
                className="w-full py-2 px-4 flex items-center justify-center"
                style={primaryBtn(saving || !password || !confirm)}
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> : 'Update password'}
              </button>
            </form>
          </div>
        )}

        {phase === 'done' && (
          <div
            className="text-center p-4"
            style={{ border: '1px solid #F0C3A8', background: '#292331' }}
            role="status"
          >
            <CheckCircle className="w-8 h-8 mx-auto mb-2" style={{ color: '#F0C3A8' }} aria-hidden="true" />
            <h3 className="font-semibold mb-2" style={{ fontFamily: INS, color: '#F6EEE9' }}>Password updated</h3>
            <p className="text-sm" style={{ color: '#D5C9D9' }}>
              Taking you to your dashboard…
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
