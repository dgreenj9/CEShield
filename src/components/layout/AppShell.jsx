import React from 'react';
import { Loader2, LogOut } from 'lucide-react';
import { Link, usePath } from '../../router';
import AtlasLogo from '../atlas/AtlasLogo';
import { A, FIG, LINE, LINE2 } from '../atlas/theme';
import { useUserData } from '../../contexts/UserDataContext';

// Plum app chrome: a sticky blurred top bar over a hairline, with the
// section links as quiet pills (active = peach tint and peach text). Replaces
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
          background: 'rgba(13,27,32,0.72)',
          backdropFilter: 'blur(16px) saturate(1.2)',
          WebkitBackdropFilter: 'blur(16px) saturate(1.2)',
          borderBottom: `1px solid ${LINE}`,
        }}
      >
        <div
          className="plum-app-bar"
          style={{
            maxWidth: 1360,
            margin: '0 auto',
            padding: '0.7rem 2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1.5rem',
          }}
        >
          <Link to="/explore" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: 44 }} aria-label="CE Shield home">
            <AtlasLogo />
          </Link>
          <div
            className="atlas-nav-links plum-app-tabs"
            style={{ gap: 2, fontFamily: FIG, fontSize: 13.5, fontWeight: 450 }}
          >
            {NAV_ITEMS.map((item) => {
              const on = path === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-current={on ? 'page' : undefined}
                  className="plum-nav-item"
                  style={{
                    padding: '0 16px',
                    minHeight: 40,
                    display: 'inline-flex',
                    alignItems: 'center',
                    borderRadius: 999,
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                    background: on ? 'rgba(226,196,143,0.12)' : 'transparent',
                    color: on ? A.accent : A.inkBody,
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
            <span className="plum-app-who">
              <strong style={{ color: A.ink, fontWeight: 500 }}>{user?.name || 'Account'}</strong>
              {user?.state && user?.licenseType ? ` · ${user.state} ${user.licenseType}` : ''}
            </span>
            <button
              type="button"
              onClick={onSignOut}
              className="plum-signout"
              title="Sign out"
              aria-label="Sign out"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: 'transparent',
                border: `1px solid ${LINE2}`,
                borderRadius: 999,
                color: A.inkBody,
                fontFamily: FIG,
                fontSize: 12,
                fontWeight: 450,
                padding: '0 14px',
                minHeight: 36,
                cursor: 'pointer',
              }}
            >
              <LogOut size={12} aria-hidden="true" /> Sign out
            </button>
          </span>
        </div>
      </nav>
      <main id="main-content" className="flex-1" style={{ width: '100%' }}>
        <div className="plum-app-main" style={{ maxWidth: 1360, margin: '0 auto', padding: '3.5rem 2rem 6rem' }}>
          {loadError && (
            <div
              role="alert"
              style={{
                marginBottom: '1.5rem',
                padding: '0.85rem 1.4rem',
                border: '1px solid rgba(224,142,109,0.35)',
                borderRadius: 6,
                background: 'rgba(224,142,109,0.06)',
                color: A.inkBody,
                fontFamily: FIG,
                fontSize: 14,
              }}
            >
              <strong style={{ color: A.warn, fontSize: 10.5, fontWeight: 600, letterSpacing: '0.17em', textTransform: 'uppercase', marginRight: 12 }}>
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
