import React, { useState } from 'react';
import { CheckCircle, Loader2, Mail, Eye, EyeOff, Lock } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import CEShieldLogo from '../common/CEShieldLogo';
import siteStats from '../../data/siteStats.json';

// Auth form — Atlas register panel: 1px ink rule on paper, petrol actions,
// ochre for errors, sentence-case copy. All auth logic unchanged.

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

const textLink = {
  color: '#F0C3A8',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontWeight: 600,
};

const ErrorNotice = ({ children }) => (
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
    {children}
  </div>
);

const SuccessPanel = ({ title, children }) => (
  <div className="text-center p-4" style={{ border: '1px solid #F0C3A8', background: '#292331' }} role="status">
    <CheckCircle className="w-8 h-8 mx-auto mb-2" style={{ color: '#F0C3A8' }} aria-hidden="true" />
    <h3 className="font-semibold mb-2" style={{ fontFamily: INS, color: '#F6EEE9' }}>{title}</h3>
    <p className="text-sm" style={{ color: '#D5C9D9' }}>{children}</p>
  </div>
);

const AuthForm = ({ onSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [confirmEmailSent, setConfirmEmailSent] = useState(false);

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (!email || !password) return;

    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth[isSignUp ? 'signUp' : 'signInWithPassword']({
        email, password
      });

      if (error) throw error;
      // Signup with email-confirmation enabled returns a user but NO
      // session — the account isn't usable until the email link is
      // clicked. Without this branch the app would bounce the user to
      // /explore and straight back here with no explanation.
      if (isSignUp && data.user && !data.session) {
        setConfirmEmailSent(true);
        return;
      }
      if (data.session) onSuccess(data.user);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e?.preventDefault?.();
    if (!email) {
      setError('Enter your email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        // Lands on the dedicated set-new-password page, which handles the
        // PASSWORD_RECOVERY session from the email link.
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) throw error;
      setResetEmailSent(true);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 atlas-ground">
      <div
        className="w-full max-w-md"
        style={{ background: '#292331', padding: '2rem', border: '1px solid #F6EEE9' }}
      >
        <div className="text-center mb-6">
          <CEShieldLogo showTagline={true} centered={true} size="xlarge" />
        </div>

        {confirmEmailSent ? (
          <div className="space-y-4">
            <SuccessPanel title="Check your email">
              We&rsquo;ve sent a confirmation link to <strong>{email}</strong>.
              Click it to activate your account, then sign in here.
            </SuccessPanel>
            <button
              onClick={() => {
                setConfirmEmailSent(false);
                setIsSignUp(false);
                setPassword('');
                setError('');
              }}
              className="w-full py-2 px-4"
              style={primaryBtn(false)}
            >
              Back to sign in
            </button>
          </div>
        ) : resetEmailSent ? (
          <div className="space-y-4">
            <SuccessPanel title="Check your email">
              We&rsquo;ve sent a password reset link to {email}
            </SuccessPanel>
            <button
              onClick={() => {
                setShowForgotPassword(false);
                setResetEmailSent(false);
                setEmail('');
                setPassword('');
                setError('');
              }}
              className="w-full py-2 px-4"
              style={primaryBtn(false)}
            >
              Back to sign in
            </button>
          </div>
        ) : showForgotPassword ? (
          // Forgot Password Form
          <div>
            <div className="mb-6">
              <h2
                className="text-xl font-semibold text-center mb-2"
                style={{ fontFamily: INS, color: '#F6EEE9', letterSpacing: '-0.02em' }}
              >
                Reset your password
              </h2>
              <p className="text-center text-sm" style={{ color: '#A998AE' }}>
                Enter your email address and we&rsquo;ll send you a link to reset your password.
              </p>
            </div>

            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div>
                <label className={labelClasses}>
                  <Mail className="inline w-4 h-4 mr-1" aria-hidden="true" />
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClasses}
                  placeholder="Enter your email address"
                  required
                />
              </div>

              {error && <ErrorNotice>{error}</ErrorNotice>}

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full py-2 px-4 flex items-center justify-center"
                style={primaryBtn(loading || !email)}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> : 'Send reset link'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setShowForgotPassword(false);
                  setError('');
                }}
                className="text-sm"
                style={textLink}
              >
                Back to sign in
              </button>
            </div>
          </div>
        ) : (
          // Normal Sign In/Sign Up Form
          <div>
            <div className="mb-6">
              <p className="text-center" style={{ color: '#A998AE' }}>
                {isSignUp ? 'Create your account' : 'Sign in to your account'}
              </p>
              {isSignUp && (
                <p className="text-center text-sm mt-2" style={{ color: '#A998AE' }}>
                  Free during beta: the full field ({siteStats.certCount} credentials,{' '}
                  {siteStats.citationTotal.toLocaleString()} citations), five career lenses, and the CE
                  Ledger.{' '}
                  <strong style={{ color: '#F6EEE9' }}>
                    Students: CE Shield is free for you, always.
                  </strong>
                </p>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={labelClasses}>
                  <Mail className="inline w-4 h-4 mr-1" aria-hidden="true" />
                  Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`${inputClasses} pr-10`}
                    required
                  />
                </div>
              </div>

              <div>
                <label className={labelClasses}>
                  <Lock className="inline w-4 h-4 mr-1" aria-hidden="true" />
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${inputClasses} pr-10`}
                    required
                    minLength={8}
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

              {!isSignUp && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm"
                    style={textLink}
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {error && <ErrorNotice>{error}</ErrorNotice>}

              <button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full py-2 px-4 flex items-center justify-center"
                style={primaryBtn(loading || !email || !password)}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> : (isSignUp ? 'Create account' : 'Sign in')}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
                className="text-sm"
                style={textLink}
              >
                {isSignUp ? 'Already have an account? Sign in' : 'No account? Sign up, free'}
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 pt-6" style={{ borderTop: '1px solid #4A4055' }}>
          <p className="text-xs text-center" style={{ color: '#A998AE' }}>
            Stored securely. We never share your information.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
