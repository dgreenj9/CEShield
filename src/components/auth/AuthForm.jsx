import React, { useState } from 'react';
import { CheckCircle, Loader2, Mail, Eye, EyeOff, Lock } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { colors } from '../../utils/constants';
import CEShieldLogo from '../common/CEShieldLogo';
import siteStats from '../../data/siteStats.json';

// Auth Form Component
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
      setError('Please enter your email address');
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
    <div className="min-h-screen flex items-center justify-center p-4" 
         style={{ background: `linear-gradient(180deg, #f0f9ff 0%, #e0f2fe 100%)` }}>
      <div className="w-full max-w-md" 
           style={{ background: 'white', padding: '2rem', boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08)', border: `1px solid ${colors.slateLight}` }}>
        
        <div className="text-center mb-6">
          <CEShieldLogo showTagline={true} centered={true} size="xlarge" />
        </div>

        {confirmEmailSent ? (
          <div className="space-y-4">
            <div className="text-center p-4" style={{ background: '#f0fdf4', border: '1px solid #86efac' }}>
              <CheckCircle className="w-8 h-8 mx-auto mb-2" style={{ color: '#10b981' }} />
              <h3 className="font-semibold mb-2" style={{ color: '#166534' }}>Check your email!</h3>
              <p className="text-sm" style={{ color: '#166534' }}>
                We&rsquo;ve sent a confirmation link to <strong>{email}</strong>.
                Click it to activate your account, then sign in here.
              </p>
            </div>
            <button
              onClick={() => {
                setConfirmEmailSent(false);
                setIsSignUp(false);
                setPassword('');
                setError('');
              }}
              className="w-full py-2 px-4 transition-all"
              style={{ background: colors.primaryBlue, color: 'white', border: 'none', fontWeight: 500, cursor: 'pointer' }}
            >
              Back to Sign In
            </button>
          </div>
        ) : resetEmailSent ? (
          <div className="space-y-4">
            <div className="text-center p-4" style={{ background: '#f0fdf4', border: '1px solid #86efac' }}>
              <CheckCircle className="w-8 h-8 mx-auto mb-2" style={{ color: '#10b981' }} />
              <h3 className="font-semibold mb-2" style={{ color: '#166534' }}>Check your email!</h3>
              <p className="text-sm" style={{ color: '#166534' }}>
                We've sent a password reset link to {email}
              </p>
            </div>
            <button
              onClick={() => {
                setShowForgotPassword(false);
                setResetEmailSent(false);
                setEmail('');
                setPassword('');
                setError('');
              }}
              className="w-full py-2 px-4 transition-all"
              style={{ background: colors.primaryBlue, color: 'white', border: 'none', fontWeight: 500, cursor: 'pointer' }}
            >
              Back to Sign In
            </button>
          </div>
        ) : showForgotPassword ? (
          // Forgot Password Form
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-center mb-2" style={{ color: colors.textDark }}>
                Reset your password
              </h2>
              <p className="text-center text-sm" style={{ color: colors.textGray }}>
                Enter your email address and we'll send you a link to reset your password.
              </p>
            </div>

            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div>
                <label className="block mb-2 text-sm font-medium" style={{ color: colors.textDark }}>
                  <Mail className="inline w-4 h-4 mr-1" />
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 focus:outline-none focus:ring-2"
                  style={{ border: `1px solid ${colors.slateLight}`, background: colors.grayLight }}
                  placeholder="Enter your email address"
                  required
                />
              </div>

              {error && (
                <div style={{ 
                  background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626',
                  padding: '0.75rem', fontSize: '0.875rem'
                }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full py-2 px-4 flex items-center justify-center transition-all"
                style={{
                  background: loading || !email ? colors.slateMedium : colors.primaryBlue,
                  color: 'white', border: 'none', fontWeight: 500,
                  cursor: loading || !email ? 'not-allowed' : 'pointer',
                  opacity: loading || !email ? 0.5 : 1
                }}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Reset Link'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setShowForgotPassword(false);
                  setError('');
                }}
                className="text-sm"
                style={{ color: colors.primaryBlue, background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Back to Sign In
              </button>
            </div>
          </div>
        ) : (
          // Normal Sign In/Sign Up Form
          <div>
            <div className="mb-6">
              <p className="text-center" style={{ color: colors.textGray }}>
                {isSignUp ? 'Create your account' : 'Sign in to your account'}
              </p>
              {isSignUp && (
                <p className="text-center text-sm mt-2" style={{ color: colors.textGray }}>
                  Free during beta &mdash; the full matrix ({siteStats.certCount} credentials,{' '}
                  {siteStats.citationTotal.toLocaleString()} citations), five career-path lenses, and your CE
                  compliance tracked in one place. Students: CE Shield is
                  free for you, always.
                </p>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-2 text-sm font-medium" style={{ color: colors.textDark }}>
                  <Mail className="inline w-4 h-4 mr-1" />
                  Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 pr-10 focus:outline-none focus:ring-2"
                    style={{ border: `1px solid ${colors.slateLight}`, background: colors.grayLight }}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium" style={{ color: colors.textDark }}>
                  <Lock className="inline w-4 h-4 mr-1" />
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-10 focus:outline-none focus:ring-2"
                    style={{ border: `1px solid ${colors.slateLight}`, background: colors.grayLight }}
                    required
                    minLength={8}
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

              {!isSignUp && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm"
                    style={{ color: colors.primaryBlue, background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {error && (
                <div style={{ 
                  background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626',
                  padding: '0.75rem', fontSize: '0.875rem'
                }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full py-2 px-4 flex items-center justify-center transition-all"
                style={{
                  background: loading || !email || !password ? colors.slateMedium : colors.primaryBlue,
                  color: 'white', border: 'none', fontWeight: 500,
                  cursor: loading || !email || !password ? 'not-allowed' : 'pointer',
                  opacity: loading || !email || !password ? 0.5 : 1
                }}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isSignUp ? 'Create Account' : 'Sign In')}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
                className="text-sm"
                style={{ color: colors.primaryBlue, background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 pt-6" style={{ borderTop: `1px solid ${colors.slateLight}` }}>
          <p className="text-xs text-center" style={{ color: colors.textGray }}>
            Stored securely. We never share your information.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
