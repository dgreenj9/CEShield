import React from 'react';
import { Compass, Clock } from 'lucide-react';
import { Link } from '../router';
import { PageHeader } from '../components/ui';
import CertificationsMatrix from '../components/dashboard/CertificationsMatrix';
import MatrixHowToPanel from '../components/dashboard/MatrixHowToPanel';
import { useUserData } from '../contexts/UserDataContext';
import siteStats from '../data/siteStats.json';

// Slim renewal nudge at the top of the default landing surface. The full
// breakdown lives on /compliance — this just makes an approaching deadline
// impossible to miss for users who live in the matrix.
function RenewalBanner() {
  const { user } = useUserData();
  if (!user?.renewalDate) return null;
  const days = Math.ceil(
    (new Date(user.renewalDate) - new Date()) / (1000 * 60 * 60 * 24),
  );
  if (!Number.isFinite(days) || days < 0 || days > 90) return null;
  return (
    <div
      role="status"
      className="mb-4 flex items-center gap-2 flex-wrap"
      style={{
        padding: '0.7rem 1rem',
        background: '#FEF3C7',
        border: '1px solid #F59E0B55',
        borderRadius: 8,
        fontSize: '0.9rem',
        color: '#78350F',
      }}
    >
      <Clock size={15} aria-hidden="true" />
      <span>
        <strong>{days} day{days === 1 ? '' : 's'}</strong> until your license
        renewal.
      </span>
      <Link to="/compliance" style={{ color: '#92400E', textDecoration: 'underline', fontWeight: 600 }}>
        Check your CE progress →
      </Link>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <div>
      <RenewalBanner />
      <PageHeader
        icon={Compass}
        title="Find the certification worth your next investment"
        subtitle={
          <>
            {siteStats.certCount} credentials across five career-path lenses,{' '}
            {siteStats.citationTotal.toLocaleString()} curated citations, six adjustable dimensions per lens. Pick a lens to see
            picks that actually move you forward on the path you&rsquo;ve
            chosen.{' '}
            <Link to="/career-paths" className="text-brand-blue underline">
              Learn about the paths
            </Link>
            .
          </>
        }
      />
      <MatrixHowToPanel />
      <CertificationsMatrix />
    </div>
  );
}
