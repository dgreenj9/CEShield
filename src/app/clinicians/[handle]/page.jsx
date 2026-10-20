// /clinicians/<handle> — opt-in public clinician CV (Phase 2).
//
// Reads the safe public projections (public_clinicians / public_clinician_
// credentials views) with the anon key. Those views expose only non-sensitive
// columns for profiles the owner marked public — the license number never
// leaves the database. Rendered dynamically (force-dynamic) since profiles are
// user-generated and change between requests.
//
// Plum: a published dossier on the open ground, 6px hairline panels, light
// display type, claims with status marks, self-reported disclosure kept.

import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import PublicNav from '@/components/layout/PublicNav';
import PublicFooter from '@/components/layout/PublicFooter';
import { certifications as certData } from '@/utils/certificationData';
import { getLibraryMetaForCertification } from '@/utils/citationsLibrary';
import { PATHS, PATH_ORDER, getPathDefaultWeights } from '@/utils/careerPaths';
import { computeScore, certScoresForPath } from '@/utils/certScoring';
import { A, FIG, tierColor, tierLabel, tabularNums, panel, hairHead, display, LINE, LINE2, LINE_FAINT } from '@/components/atlas/theme';

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
const STATUS_MARK = { earned: '●', in_progress: '◐', planned: '○' };
const statusColor = (status) =>
  status === 'earned' ? A.accent : status === 'in_progress' ? A.warn : A.dim;

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
  const title = `${profile.name || handle}${profile.headline ? ' · ' + profile.headline : ''}`;
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
    <div className="atlas-ground" style={{ minHeight: '100vh', color: A.ink }}>
      <PublicNav />

      <main id="main" className="atlas-wrap" style={{ maxWidth: 1080, margin: '0 auto', padding: '4.5rem 2rem 6rem' }}>
        <div className="cs-cv-grid plum-rise">
          {/* LEFT — identity sidebar */}
          <aside className="cs-cv-side">
            <div
              aria-hidden={!profile.avatar_url}
              style={{
                width: 120, height: 120, overflow: 'hidden', borderRadius: '50%',
                background: A.accentTint, color: A.accent,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: FIG, fontSize: 36, fontWeight: 350, letterSpacing: '-0.03em', marginBottom: '1.5rem',
                border: `1px solid ${LINE2}`,
              }}
            >
              {profile.avatar_url
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={profile.avatar_url} alt={profile.name || handle} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : initials}
            </div>

            <h1 style={{ ...display('clamp(1.9rem, 3vw, 2.4rem)', 380), lineHeight: 1.1 }}>
              {profile.name || handle}
            </h1>
            {profile.headline && (
              <p style={{ color: A.inkBody, marginTop: 8, fontSize: 15, lineHeight: 1.5 }}>
                {profile.headline}
              </p>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px', marginTop: 14, fontFamily: FIG, fontSize: 13, color: A.inkMuted }}>
              {profile.license_type && (
                <span>
                  {profile.license_type}
                  {profile.license_number ? ` · #${profile.license_number}` : ''}
                </span>
              )}
              {profile.state && <span>{profile.state}</span>}
              {profile.years_experience != null && (
                <span style={tabularNums}>{profile.years_experience} yrs</span>
              )}
            </div>

            {(profile.specialties || []).length > 0 && (
              <div style={{ marginTop: '1.5rem' }}>
                <div style={{ ...hairHead, paddingTop: 12, marginBottom: 12 }}>
                  Specialties
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {profile.specialties.map((sp) => (
                    <span key={sp} style={{ fontFamily: FIG, fontSize: 11.5, padding: '4px 11px', borderRadius: 20, border: `1px solid ${LINE2}`, color: A.inkBody, fontWeight: 450 }}>
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
                <p style={{ color: A.inkBody, lineHeight: 1.65, fontSize: 15, margin: 0, whiteSpace: 'pre-line' }}>
                  {profile.bio}
                </p>
              </section>
            )}

            <section style={{ marginBottom: pursuing.length ? '2.25rem' : 0 }}>
              <SectionLabel>Credentials{earned.length ? ` · ${earned.length}` : ''}</SectionLabel>
              {earned.length === 0 ? (
                <p style={{ color: A.inkMuted, margin: 0, fontSize: 14 }}>No credentials listed yet.</p>
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

            <div style={{ marginTop: '3rem', paddingTop: '1.25rem', borderTop: `1px solid ${LINE}`, fontFamily: FIG, fontSize: 12.5, color: A.inkMuted }}>
              Credentials are self-reported.{' '}
              <Link href="/credentials" className="atlas-link" style={{ fontWeight: 500, textDecoration: 'none', display: 'inline-block', padding: '10px 0' }}>
                Explore the evidence behind each →
              </Link>
            </div>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{ ...hairHead, marginBottom: 16 }}>
      {children}
    </div>
  );
}

function CredList({ items, showStatus }) {
  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0, ...panel }}>
      {items.map((e, i, arr) => (
        <li
          key={e.cert_name}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '0.85rem 1.1rem', minHeight: 56,
            borderBottom: i < arr.length - 1 ? `1px solid ${LINE_FAINT}` : 'none',
          }}
        >
          <span aria-hidden="true" style={{ color: statusColor(e.status), fontSize: 13, flexShrink: 0 }}>
            {STATUS_MARK[e.status] || '○'}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 450, fontSize: 14.5, letterSpacing: '-0.01em', color: A.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {e.slug ? (
                <Link href={`/credentials/${e.slug}`} className="atlas-ink-link" style={{ color: A.ink, textDecoration: 'none' }}>{e.cert_name}</Link>
              ) : e.cert_name}
            </div>
            <div style={{ fontFamily: FIG, fontSize: 11.5, color: A.inkMuted, marginTop: 2 }}>
              {e.cert.type} · {(e.cert.disciplines || [e.cert.discipline]).join(' · ')}
              {showStatus && <> · {STATUS_LABEL[e.status]}</>}
            </div>
          </div>
          {e.best && (
            <div style={{ textAlign: 'right', flexShrink: 0 }} title={`${e.best.score}/100 on the ${e.best.label} lens, ${tierLabel(e.best.score)}`}>
              <div style={{ fontFamily: FIG, fontSize: 18, fontWeight: 400, letterSpacing: '-0.03em', color: A.ink, lineHeight: 1, ...tabularNums }}>
                {e.best.score}{' '}
                <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: 0, color: tierColor(e.best.score) }}>{tierLabel(e.best.score)}</span>
              </div>
              <div style={{ fontFamily: FIG, fontSize: 11, color: A.inkMuted, marginTop: 3 }}>{e.best.label}</div>
            </div>
          )}
          {e.slug && (
            <Link
              href={`/credentials/${e.slug}`}
              aria-label={`Open ${e.cert_name}`}
              className="atlas-link"
              style={{ fontFamily: FIG, fontSize: 12, fontWeight: 500, flexShrink: 0, textDecoration: 'none', whiteSpace: 'nowrap', padding: '12px 0' }}
            >
              Dossier →
            </Link>
          )}
        </li>
      ))}
    </ul>
  );
}
