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
import { colors } from '@/utils/constants';
import CEShieldLogo from '@/components/common/CEShieldLogo';

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

  const inputStyle = {
    border: `1px solid ${colors.slateLight}`,
    background: colors.grayLight,
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(180deg, #f0f9ff 0%, #e0f2fe 100%)' }}
    >
      <div
        className="w-full max-w-md"
        style={{
          background: 'white',
          padding: '2rem',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08)',
          border: `1px solid ${colors.slateLight}`,
        }}
      >
        <div className="text-center mb-6">
          <CEShieldLogo showTagline={false} centered size="xlarge" />
        </div>

        {phase === 'checking' && (
          <div className="text-center py-6" role="status" aria-live="polite">
            <Loader2 className="w-6 h-6 mx-auto animate-spin" style={{ color: colors.primaryBlue }} aria-hidden="true" />
            <p className="text-sm mt-3" style={{ color: colors.textGray }}>
              Verifying your reset link…
            </p>
          </div>
        )}

        {phase === 'no-session' && (
          <div className="space-y-4">
            <div className="text-center p-4" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
              <AlertCircle className="w-8 h-8 mx-auto mb-2" style={{ color: '#dc2626' }} aria-hidden="true" />
              <h3 className="font-semibold mb-2" style={{ color: '#991b1b' }}>
                Reset link expired or invalid
              </h3>
              <p className="text-sm" style={{ color: '#991b1b' }}>
                Reset links are single-use and expire quickly. Request a new
                one from the sign-in page.
              </p>
            </div>
            <button
              onClick={() => router.replace('/sign-in')}
              className="w-full py-2 px-4"
              style={{ background: colors.primaryBlue, color: 'white', border: 'none', fontWeight: 500, cursor: 'pointer' }}
            >
              Back to Sign In
            </button>
          </div>
        )}

        {phase === 'ready' && (
          <div>
            <h2 className="text-xl font-semibold text-center mb-2" style={{ color: colors.textDark }}>
              Set a new password
            </h2>
            <p className="text-center text-sm mb-6" style={{ color: colors.textGray }}>
              Choose a new password for your account.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-2 text-sm font-medium" style={{ color: colors.textDark }}>
                  <Lock className="inline w-4 h-4 mr-1" aria-hidden="true" />
                  New password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-10 focus:outline-none focus:ring-2"
                    style={inputStyle}
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2 top-2.5"
                    style={{ color: colors.textGray, background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" aria-hidden="true" /> : <Eye className="w-5 h-5" aria-hidden="true" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium" style={{ color: colors.textDark }}>
                  <Lock className="inline w-4 h-4 mr-1" aria-hidden="true" />
                  Confirm new password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full px-3 py-2 focus:outline-none focus:ring-2"
                  style={inputStyle}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>

              {error && (
                <div
                  role="alert"
                  style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#dc2626',
                    padding: '0.75rem',
                    fontSize: '0.875rem',
                  }}
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={saving || !password || !confirm}
                className="w-full py-2 px-4 flex items-center justify-center"
                style={{
                  background: saving || !password || !confirm ? colors.slateMedium : colors.primaryBlue,
                  color: 'white',
                  border: 'none',
                  fontWeight: 500,
                  cursor: saving || !password || !confirm ? 'not-allowed' : 'pointer',
                  opacity: saving || !password || !confirm ? 0.5 : 1,
                }}
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> : 'Update Password'}
              </button>
            </form>
          </div>
        )}

        {phase === 'done' && (
          <div className="text-center p-4" style={{ background: '#f0fdf4', border: '1px solid #86efac' }} role="status">
            <CheckCircle className="w-8 h-8 mx-auto mb-2" style={{ color: '#10b981' }} aria-hidden="true" />
            <h3 className="font-semibold mb-2" style={{ color: '#166534' }}>Password updated</h3>
            <p className="text-sm" style={{ color: '#166534' }}>
              Taking you to your dashboard…
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
