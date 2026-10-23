import React, { useState } from 'react';
import { CheckCircle, Loader2, Mail, Eye, EyeOff, Lock } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import CEShieldLogo from '../common/CEShieldLogo';
import siteStats from '../../data/siteStats.json';

// Auth form, plum register: a 6px hairline panel on the world light, plum
// inputs with a peach focus ring, one peach pill action, ochre for errors,
// sentence-case copy. All auth logic unchanged.

const INS = "'Figtree', ui-sans-serif, system-ui, sans-serif";

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

const textLink = {
  color: '#E2C48F',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontWeight: 500,
  minHeight: 44,
  padding: '0 4px',
};

const ErrorNotice = ({ children }) => (
  <div
    role="alert"
    style={{
      border: '1px solid rgba(224,142,109,0.35)',
      background: 'rgba(224,142,109,0.07)',
      borderRadius: 6,
      padding: '0.75rem 1rem',
      fontSize: '0.875rem',
      color: '#C5D2CE',
    }}
  >
    <strong style={{ color: '#E08E6D', fontWeight: 600, marginRight: 8 }}>Error</strong>
    {children}
  </div>
);

const SuccessPanel = ({ title, children }) => (
  <div className="text-center p-5" style={{ border: '1px solid rgba(226,196,143,0.4)', background: 'rgba(226,196,143,0.06)', borderRadius: 6 }} role="status">
    <CheckCircle className="w-8 h-8 mx-auto mb-3" style={{ color: '#E2C48F' }} aria-hidden="true" />
    <h3 className="mb-2" style={{ fontFamily: INS, color: '#EEF2EC', fontWeight: 450, fontSize: 18, letterSpacing: '-0.02em' }}>{title}</h3>
    <p className="text-sm" style={{ color: '#C5D2CE' }}>{children}</p>
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
        className="w-full max-w-md plum-rise"
        style={{ background: 'rgba(15,29,34,0.72)', padding: '2.25rem 2rem 1.75rem', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 6, boxShadow: '0 40px 80px rgba(3,10,12,0.35)', WebkitBackdropFilter: 'blur(12px)', backdropFilter: 'blur(12px)' }}
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
              className="w-full px-4"
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
              className="w-full px-4"
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
                className="text-center mb-2"
                style={{ fontFamily: INS, color: '#EEF2EC', letterSpacing: '-0.035em', fontWeight: 400, fontSize: 26, lineHeight: 1.15 }}
              >
                Reset your password
              </h2>
              <p className="text-center text-sm" style={{ color: '#8EA5A0' }}>
                Enter your email address and we&rsquo;ll send you a link to reset your password.
              </p>
            </div>

            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div>
                <label htmlFor="auth-reset-email" className={labelClasses} style={labelStyle}>
                  <Mail className="inline w-4 h-4" aria-hidden="true" />
                  Email
                </label>
                <input
                  id="auth-reset-email"
                  autoComplete="email"
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
                className="w-full px-4 flex items-center justify-center"
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
              <h2 className="text-center" style={{ fontFamily: INS, color: '#EEF2EC', letterSpacing: '-0.035em', fontWeight: 400, fontSize: 26, lineHeight: 1.15, margin: 0 }}>
                {isSignUp ? 'Create your account' : 'Sign in to your account'}
              </h2>
              {isSignUp && (
                <p className="text-center text-sm mt-3" style={{ color: '#8EA5A0', lineHeight: 1.65 }}>
                  Free during beta: the full field ({siteStats.certCount} credentials,{' '}
                  {siteStats.citationTotal.toLocaleString()} citations), five career lenses, and the CE
                  Ledger.{' '}
                  <strong style={{ color: '#EEF2EC' }}>
                    Students: CE Shield is free for you, always.
                  </strong>
                </p>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="auth-email" className={labelClasses} style={labelStyle}>
                  <Mail className="inline w-4 h-4" aria-hidden="true" />
                  Email
                </label>
                <div className="relative">
                  <input
                    id="auth-email"
                    autoComplete="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`${inputClasses} pr-10`}
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="auth-password" className={labelClasses} style={labelStyle}>
                  <Lock className="inline w-4 h-4" aria-hidden="true" />
                  Password
                </label>
                <div className="relative">
                  <input
                    id="auth-password"
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
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
                    className="absolute right-0 top-0 flex items-center justify-center"
                    style={{ color: '#8EA5A0', background: 'none', border: 'none', cursor: 'pointer', width: 44, height: 44 }}
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
                className="w-full px-4 flex items-center justify-center"
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

        <div className="mt-6 pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-xs text-center" style={{ color: '#8EA5A0' }}>
            Stored securely. We never share your information.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
