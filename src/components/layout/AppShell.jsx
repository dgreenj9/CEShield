import React from 'react';
import SideNav from './SideNav';
import { useUserData } from '../../contexts/UserDataContext';
import { colors } from '../../utils/constants';
import { Loader2 } from 'lucide-react';

// Wraps all authenticated routes with the nav chrome. Children render in
// the main content column. The shell handles the global loading state
// while user data hydrates so individual pages don't each need that
// boilerplate.
export default function AppShell({ onSignOut, children }) {
  const { user, loading, loadError } = useUserData();

  if (loading) {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label="Loading your data"
        className="min-h-screen flex items-center justify-center bg-paper-bg"
      >
        <Loader2 size={32} className="animate-spin" style={{ color: colors.primaryBlue }} aria-hidden="true" />
        <span className="sr-only">Loading…</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-paper-bg">
      <a href="#main-content" className="skip-to-main">Skip to main content</a>
      <div className="flex flex-1 min-h-screen">
        <SideNav user={user} onSignOut={onSignOut} />
        <main id="main-content" className="flex-1 p-6 max-w-full">
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            {loadError && (
              <div
                role="alert"
                style={{
                  marginBottom: '1rem',
                  padding: '0.75rem 1rem',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: 8,
                  color: '#991b1b',
                  fontSize: '0.9rem',
                }}
              >
                {loadError}
              </div>
            )}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
