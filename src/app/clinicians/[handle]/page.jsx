// /clinicians/<handle> — opt-in public clinician CV (Phase 2).
//
// Reads the safe public projections (public_clinicians / public_clinician_
// credentials views) with the anon key. Those views expose only non-sensitive
// columns for profiles the owner marked public — the license number never
// leaves the database. Rendered dynamically (force-dynamic) since profiles are
// user-generated and change between requests.

import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MapPin, BadgeCheck, ExternalLink } from 'lucide-react';
import { colors } from '@/utils/constants';
import PublicNav from '@/components/layout/PublicNav';
import { certifications as certData } from '@/utils/certificationData';
import { getLibraryMetaForCertification } from '@/utils/citationsLibrary';
import {
  PATHS, PATH_ORDER, getPathDefaultWeights, scoreColor,
} from '@/utils/careerPaths';
import { computeScore, certScoresForPath } from '@/utils/certScoring';

export const dynamic = 'force-dynamic';

const sb = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false } },
  );

const bestLensFor = (cert) => {
  let best = null;
  for (const key of PATH_ORDER) {
    const subs = certScoresForPath(cert, key);
    if (!subs) continue;
    const score = Math.round(computeScore(subs, getPathDefaultWeights(key)));
    if (!best || score > best.score) best = { key, label: PATHS[key].label, score };
  }
  return best;
};

const STATUS_LABEL = { earned: 'Earned', in_progress: 'In progress', planned: 'Planned' };

async function loadProfile(handle) {
  const client = sb();
  const { data: profile } = await client
    .from('public_clinicians')
    .select('*')
    .eq('handle', handle)
    .maybeSingle();
  if (!profile) return null;
  const { data: creds } = await client
    .from('public_clinician_credentials')
    .select('*')
    .eq('handle', handle);
  return { profile, creds: creds || [] };
}

export async function generateMetadata({ params }) {
  const { handle } = await params;
  const data = await loadProfile(handle);
  if (!data) return { title: 'Clinician not found' };
  const { profile } = data;
  const title = `${profile.name || handle}${profile.headline ? ' — ' + profile.headline : ''}`;
  const description =
    `${profile.name || 'This clinician'}${profile.license_type ? `, ${profile.license_type}` : ''}` +
    `${profile.years_experience ? ` · ${profile.years_experience} yrs experience` : ''}` +
    `${(profile.specialties || []).length ? ` · ${profile.specialties.slice(0, 4).join(', ')}` : ''}` +
    `. Credential profile on CE Shield.`;
  return {
    title,
    description,
    alternates: { canonical: `/clinicians/${handle}` },
    openGraph: { title, description, url: `/clinicians/${handle}` },
  };
}

export default async function ClinicianPage({ params }) {
  const { handle } = await params;
  const data = await loadProfile(handle);
  if (!data) notFound();
  const { profile, creds } = data;

  // Enrich credentials with matrix data; keep earned ones front-and-center.
  const enriched = creds
    .map((row) => {
      const cert = certData.find((c) => c.name === row.cert_name);
      if (!cert) return null;
      return {
        ...row,
        cert,
        slug: getLibraryMetaForCertification(cert.name).slug,
        best: bestLensFor(cert),
      };
    })
    .filter(Boolean)
    .sort((a, b) => (b.best?.score || 0) - (a.best?.score || 0));

  const earned = enriched.filter((e) => e.status === 'earned');
  const pursuing = enriched.filter((e) => e.status !== 'earned');
  const initials = (profile.name || handle).split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAFAF6', color: colors.textDark }}>
      <PublicNav />

      <main className="cs-page-pad" style={{ maxWidth: 1080, margin: '0 auto', padding: '3rem 2rem 6rem' }}>
        <div className="cs-cv-grid">
          {/* LEFT — identity sidebar */}
          <aside className="cs-cv-side">
            <div
              aria-hidden={!profile.avatar_url}
              style={{
                width: 120, height: 120, borderRadius: '50%', overflow: 'hidden',
                background: colors.lightBlue, color: colors.primaryBlue,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '2.2rem', fontWeight: 600, marginBottom: '1.25rem',
                border: `1px solid ${colors.slateLight}`,
              }}
            >
              {profile.avatar_url
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={profile.avatar_url} alt={profile.name || handle} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : initials}
            </div>

            <h1 style={{ fontSize: '1.6rem', fontWeight: 600, margin: 0, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
              {profile.name || handle}
            </h1>
            {profile.headline && (
              <p style={{ color: colors.slateMedium, marginTop: 8, fontSize: '0.98rem', lineHeight: 1.45 }}>
                {profile.headline}
              </p>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 14, fontSize: '0.85rem', color: colors.textGray }}>
              {profile.license_type && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <BadgeCheck size={14} aria-hidden="true" /> {profile.license_type}
                  {profile.license_number ? ` · #${profile.license_number}` : ''}
                </span>
              )}
              {profile.state && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <MapPin size={14} aria-hidden="true" /> {profile.state}
                </span>
              )}
              {profile.years_experience != null && (
                <span className="font-mono tabular-nums">{profile.years_experience} yrs</span>
              )}
            </div>

            {(profile.specialties || []).length > 0 && (
              <div style={{ marginTop: '1.5rem' }}>
                <div className="font-mono" style={{ fontSize: '0.66rem', color: colors.textGray, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 10 }}>
                  Specialties
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {profile.specialties.map((sp) => (
                    <span key={sp} style={{ fontSize: '0.78rem', padding: '3px 10px', borderRadius: 999, background: colors.lightBlue, color: colors.primaryBlue, fontWeight: 500 }}>
                      {sp}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* RIGHT — bio + credentials */}
          <div className="cs-cv-main" style={{ minWidth: 0 }}>
            {profile.bio && (
              <section style={{ marginBottom: '2.25rem' }}>
                <SectionLabel>About</SectionLabel>
                <p style={{ color: colors.slateMedium, lineHeight: 1.65, fontSize: '1rem', margin: 0, whiteSpace: 'pre-line' }}>
                  {profile.bio}
                </p>
              </section>
            )}

            <section style={{ marginBottom: pursuing.length ? '2.25rem' : 0 }}>
              <SectionLabel>Credentials{earned.length ? ` · ${earned.length}` : ''}</SectionLabel>
              {earned.length === 0 ? (
                <p style={{ color: colors.textGray, fontStyle: 'italic', margin: 0 }}>No credentials listed yet.</p>
              ) : (
                <CredList items={earned} />
              )}
            </section>

            {pursuing.length > 0 && (
              <section>
                <SectionLabel>Pursuing</SectionLabel>
                <CredList items={pursuing} showStatus />
              </section>
            )}

            <div style={{ marginTop: '2.5rem', paddingTop: '1.25rem', borderTop: `1px solid ${colors.slateLight}`, fontSize: '0.82rem', color: colors.textGray }}>
              Credentials are self-reported.{' '}
              <Link href="/credentials" style={{ color: colors.primaryBlue, textDecoration: 'none' }}>
                Explore the evidence behind each →
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
      <span className="font-mono" style={{ fontSize: '0.68rem', color: colors.textGray, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, whiteSpace: 'nowrap' }}>
        {children}
      </span>
      <hr style={{ flex: 1, border: 0, borderTop: `1px solid ${colors.slateLight}`, margin: 0 }} />
    </div>
  );
}

function CredList({ items, showStatus }) {
  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((e) => (
        <li
          key={e.cert_name}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '0.7rem 0.9rem', border: `1px solid ${colors.slateLight}`, borderRadius: 10, background: 'white',
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: '0.92rem', color: colors.textDark }}>
              {e.slug ? (
                <Link href={`/credentials/${e.slug}`} style={{ color: colors.textDark, textDecoration: 'none' }}>{e.cert_name}</Link>
              ) : e.cert_name}
            </div>
            <div style={{ fontSize: '0.76rem', color: colors.textGray, marginTop: 2 }}>
              {e.cert.type} · {(e.cert.disciplines || [e.cert.discipline]).join(' · ')}
              {showStatus && <> · {STATUS_LABEL[e.status]}</>}
            </div>
          </div>
          {e.best && (
            <div style={{ textAlign: 'right', flexShrink: 0 }} title={`${e.best.score}/100 on the ${e.best.label} lens`}>
              <div className="font-mono tabular-nums" style={{ fontSize: '1.05rem', fontWeight: 700, color: scoreColor(e.best.score), lineHeight: 1 }}>
                {e.best.score}
              </div>
              <div style={{ fontSize: '0.68rem', color: colors.textGray, marginTop: 2 }}>{e.best.label}</div>
            </div>
          )}
          {e.slug && (
            <Link href={`/credentials/${e.slug}`} aria-label={`Open ${e.cert_name}`} style={{ color: colors.primaryBlue, flexShrink: 0, display: 'inline-flex' }}>
              <ExternalLink size={14} aria-hidden="true" />
            </Link>
          )}
        </li>
      ))}
    </ul>
  );
}
