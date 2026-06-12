import React, { useMemo } from 'react';
import {
  Compass, Shield, BookOpen, User, LogOut,
  Sparkles, FileText, Info,
} from 'lucide-react';
import { Link, usePath } from '../../router';
import CEShieldLogo from '../common/CEShieldLogo';
import { colors } from '../../utils/constants';
import { useUserData } from '../../contexts/UserDataContext';
import { getRequirements, calculateHours } from '../../utils/calculations';

const NAV_ITEMS = [
  { to: '/explore',    label: 'Explore',    icon: Compass,  description: 'Certification matrix' },
  { to: '/compliance', label: 'Compliance', icon: Shield,   description: 'CE progress & mandatory hours' },
  { to: '/courses',    label: 'Courses',    icon: BookOpen, description: 'Your logged CE' },
  { to: '/profile',    label: 'Profile',    icon: User,     description: 'License, state, settings' },
];

// Marketing pages — surfaced as a secondary nav block so About / Methodology
// / Career Paths stay reachable from inside the app.
const INFO_ITEMS = [
  { to: '/career-paths', label: 'Career paths', icon: Sparkles,  description: 'Clinical / business / academic' },
  { to: '/methodology',  label: 'Methodology',  icon: FileText,  description: 'How scoring works' },
  { to: '/about',        label: 'About',        icon: Info,      description: 'About CE Shield' },
];

// Compliance health badge — green if on pace, amber if behind. Computed live
// from the user's data so it stays accurate as courses are added.
const useComplianceHealth = () => {
  const { user, courses } = useUserData();
  return useMemo(() => {
    const req = getRequirements(user.state, user.licenseType);
    if (!req || user.isFirstRenewal) return null;
    const hours = calculateHours(courses);
    const pct = req.total > 0 ? hours.total / req.total : 0;
    if (pct >= 1) return { color: '#2F6B4D', label: 'Complete' };
    if (pct >= 0.5) return { color: '#2F6B4D', label: 'On pace' };
    return { color: '#8A6332', label: 'Behind' };
  }, [user.state, user.licenseType, user.isFirstRenewal, courses]);
};

const NavLink = ({ to, label, icon: Icon, description, active }) => (
  <Link
    to={to}
    aria-current={active ? 'page' : undefined}
    title={description}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '0.6rem 0.75rem',
      borderRadius: 8,
      textDecoration: 'none',
      color: active ? colors.primaryBlue : colors.slateMedium,
      background: active ? colors.lightBlue : 'transparent',
      fontWeight: active ? 600 : 500,
      fontSize: '0.95rem',
      transition: 'background 0.15s ease, color 0.15s ease',
    }}
  >
    <Icon size={18} aria-hidden="true" />
    <span>{label}</span>
  </Link>
);

export default function SideNav({ user, onSignOut }) {
  const path = usePath();
  const health = useComplianceHealth();

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        aria-label="Primary"
        style={{
          display: 'none',
          flexDirection: 'column',
          width: 240,
          minHeight: '100vh',
          background: 'white',
          borderRight: `1px solid ${colors.slateLight}`,
          padding: '1.25rem 1rem',
          position: 'sticky',
          top: 0,
          alignSelf: 'flex-start',
        }}
        className="ceshield-sidenav"
      >
        <Link to="/explore" style={{ textDecoration: 'none', marginBottom: '1.75rem' }}>
          <CEShieldLogo size="medium" showTagline={false} />
        </Link>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }} aria-label="Primary">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} {...item} active={path === item.to} />
          ))}
          {/* Hairline separator + secondary marketing nav. */}
          <div style={{
            margin: '0.75rem 0.25rem 0.25rem',
            borderTop: `1px solid ${colors.slateLight}`,
            paddingTop: '0.75rem',
          }}>
            <div className="eyebrow" style={{ padding: '0 0.5rem 0.5rem', fontSize: '0.62rem' }}>
              About CE Shield
            </div>
          </div>
          {INFO_ITEMS.map((item) => (
            <NavLink key={item.to} {...item} active={path === item.to} />
          ))}
        </nav>

        {health && (
          <div
            style={{
              padding: '0.6rem 0.75rem',
              background: colors.grayLight,
              border: `1px solid ${colors.slateLight}`,
              borderRadius: 8,
              fontSize: '0.78rem',
              color: colors.slateMedium,
              marginBottom: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                aria-hidden="true"
                style={{
                  width: 8, height: 8, borderRadius: '50%', background: health.color,
                  display: 'inline-block',
                }}
              />
              <span style={{ fontWeight: 600, color: colors.textDark }}>
                Compliance: {health.label}
              </span>
            </div>
          </div>
        )}

        <div
          style={{
            paddingTop: '0.75rem',
            borderTop: `1px solid ${colors.slateLight}`,
            fontSize: '0.78rem',
            color: colors.textGray,
          }}
        >
          <div style={{ fontWeight: 600, color: colors.textDark, marginBottom: 2 }}>
            {user.name || 'Unnamed'}
          </div>
          <div>{user.state} {user.licenseType}{user.licenseNumber ? ` · #${user.licenseNumber}` : ''}</div>
          <button
            type="button"
            onClick={onSignOut}
            style={{
              marginTop: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'transparent',
              border: 'none',
              color: colors.slateMedium,
              cursor: 'pointer',
              fontSize: '0.85rem',
              padding: 0,
            }}
            aria-label="Sign out"
          >
            <LogOut size={14} aria-hidden="true" /> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top-nav */}
      <header
        aria-label="Primary"
        className="ceshield-topnav"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.75rem 1rem',
          background: 'white',
          borderBottom: `1px solid ${colors.slateLight}`,
          position: 'sticky',
          top: 0,
          zIndex: 30,
        }}
      >
        <Link to="/explore" style={{ textDecoration: 'none' }}>
          <CEShieldLogo size="small" showTagline={false} />
        </Link>
        <nav
          style={{
            display: 'flex',
            gap: 4,
            overflowX: 'auto',
          }}
        >
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
            const active = path === to;
            return (
              <Link
                key={to}
                to={to}
                aria-current={active ? 'page' : undefined}
                aria-label={label}
                title={label}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  color: active ? colors.primaryBlue : colors.slateMedium,
                  background: active ? colors.lightBlue : 'transparent',
                  textDecoration: 'none',
                }}
              >
                <Icon size={18} aria-hidden="true" />
              </Link>
            );
          })}
        </nav>
      </header>
    </>
  );
}
