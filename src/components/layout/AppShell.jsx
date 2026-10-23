import React from 'react';
import { Loader2, LogOut } from 'lucide-react';
import { Link, usePath } from '../../router';
import AtlasLogo from '../atlas/AtlasLogo';
import { A, FIG } from '../atlas/theme';
import { useUserData } from '../../contexts/UserDataContext';

// Atlas app chrome: a sticky blurred top bar over a 1px ink rule, with the
// section links as Figtree tabs (active = petrol fill). Replaces
// the previous sidebar shell. Children render in the main content column;
// the shell handles the global loading state while user data hydrates.

const NAV_ITEMS = [
  { to: '/explore', label: 'Home' },
  { to: '/matrix', label: 'The field' },
  { to: '/compliance', label: 'Ledger' },
  { to: '/courses', label: 'Courses' },
  { to: '/learn', label: 'Find CE' },
  { to: '/profile', label: 'Profile' },
];

export default function AppShell({ onSignOut, children }) {
  const { user, loading, loadError } = useUserData();
  const path = usePath();

  if (loading) {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label="Loading your data"
        className="min-h-screen flex items-center justify-center"
        style={{ background: A.paper }}
      >
        <Loader2 size={32} className="animate-spin" style={{ color: A.accent }} aria-hidden="true" />
        <span className="sr-only">Loading…</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col atlas-ground">
      <a href="#main-content" className="skip-to-main">Skip to main content</a>
      <nav
        aria-label="Primary"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(250,250,245,0.95)',
          backdropFilter: 'blur(8px)',
          borderBottom: `1px solid ${A.ink}`,
        }}
      >
        <div
          style={{
            maxWidth: 1360,
            margin: '0 auto',
            padding: '0.8rem 2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1.5rem',
          }}
        >
          <Link to="/explore" style={{ textDecoration: 'none' }} aria-label="CE Shield home">
            <AtlasLogo />
          </Link>
          <div
            className="atlas-nav-links"
            style={{ gap: 0, fontFamily: FIG, fontSize: 13, fontWeight: 700, letterSpacing: '0.01em' }}
          >
            {NAV_ITEMS.map((item) => {
              const on = path === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-current={on ? 'page' : undefined}
                  style={{
                    padding: '8px 16px',
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                    background: on ? A.accent : 'transparent',
                    color: on ? A.onAccent : A.inkMuted,
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 12,
              fontFamily: FIG,
              fontSize: 12,
              color: A.inkMuted,
              whiteSpace: 'nowrap',
            }}
          >
            <span>
              <strong style={{ color: A.ink }}>{user?.name || 'Account'}</strong>
              {user?.state && user?.licenseType ? ` · ${user.state} ${user.licenseType}` : ''}
            </span>
            <button
              type="button"
              onClick={onSignOut}
              title="Sign out"
              aria-label="Sign out"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: 'transparent',
                border: `1px solid ${A.ruleMinor}`,
                color: A.inkMuted,
                fontFamily: FIG,
                fontSize: 11.5,
                fontWeight: 700,
                letterSpacing: '0.01em',
                padding: '4px 10px',
                cursor: 'pointer',
              }}
            >
              <LogOut size={12} aria-hidden="true" /> Sign out
            </button>
          </span>
        </div>
      </nav>
      <main id="main-content" className="flex-1" style={{ width: '100%' }}>
        <div style={{ maxWidth: 1360, margin: '0 auto', padding: '2.5rem 2rem 5rem' }}>
          {loadError && (
            <div
              role="alert"
              style={{
                marginBottom: '1.5rem',
                padding: '0.85rem 1.4rem',
                border: `1px dashed ${A.ink}`,
                background: A.notice,
                color: A.inkBody,
                fontFamily: FIG,
                fontSize: 14,
              }}
            >
              <strong style={{ color: A.warn, fontSize: 12, marginRight: 10 }}>
                Data error
              </strong>
              {loadError}
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
