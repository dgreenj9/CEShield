import React, { useMemo, useState } from 'react';
import { Search, X, Plus, ExternalLink, Award } from 'lucide-react';
import { Link } from '../../router';
import { useUserData } from '../../contexts/UserDataContext';
import { certifications as certData } from '../../utils/certificationData';
import { getLibraryMetaForCertification } from '../../utils/citationsLibrary';
import { PATHS, PATH_ORDER, getPathDefaultWeights } from '../../utils/careerPaths';
import { computeScore, certScoresForPath } from '../../utils/certScoring';
import { A, FIG, INS, tierColor, tabularNums } from '../atlas/theme';

// Best lens for a credential = the path (default weights) it scores highest on.
// Gives the CV a one-glance "where this credential pays off" signal.
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

// Status marks match the Explore claims card: ● earned petrol / ◐ in
// progress ochre / ○ planned stone.
const STATUS_META = {
  earned: { label: 'Earned', mark: '●', color: A.accent },
  in_progress: { label: 'In progress', mark: '◐', color: A.warn },
  planned: { label: 'Planned', mark: '○', color: A.dim },
};
const STATUS_ORDER = ['earned', 'in_progress', 'planned'];

export default function CredentialProfile() {
  const { credentials, courses, saveCredential, removeCredential, saving } = useUserData();
  const [query, setQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const heldNames = useMemo(
    () => new Set(credentials.map((c) => c.cert_name)),
    [credentials],
  );

  // Search the matrix for credentials not already on the profile.
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return certData
      .filter((c) => !heldNames.has(c.name) && c.name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, heldNames]);

  // Join the user's saved credential rows with matrix data for display.
  const enriched = useMemo(() => {
    return credentials
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
  }, [credentials]);

  const byStatus = useMemo(() => {
    const groups = { earned: [], in_progress: [], planned: [] };
    for (const e of enriched) (groups[e.status] || groups.earned).push(e);
    return groups;
  }, [enriched]);

  const totalCeHours = useMemo(
    () => courses.reduce((sum, c) => sum + (parseFloat(c.hours) || 0), 0),
    [courses],
  );
  const earnedCount = byStatus.earned.length;

  const addCredential = (name) => {
    saveCredential({ certName: name, status: 'earned' });
    setQuery('');
    setShowSearch(false);
  };

  return (
    <div style={{ background: A.paper, border: `1px solid ${A.ink}` }}>
      {/* Head strip */}
      <div style={{ padding: '12px 1.5rem', borderBottom: `1px solid ${A.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <h2 style={{ fontFamily: INS, fontWeight: 600, fontSize: 18, letterSpacing: '-0.02em', color: A.ink, margin: 0 }}>
          Your claims on the field
        </h2>
        <button
          type="button"
          onClick={() => setShowSearch((s) => !s)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '0.45rem 0.9rem',
            background: showSearch ? 'transparent' : A.accent,
            color: showSearch ? A.ink : A.onAccent,
            border: `1px solid ${showSearch ? A.ink : A.accent}`,
            fontFamily: FIG, fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          {showSearch ? <X size={14} aria-hidden="true" /> : <Plus size={14} aria-hidden="true" />}
          {showSearch ? 'Close' : 'Claim a credential'}
        </button>
      </div>

      <div style={{ padding: '1.25rem 1.5rem' }}>
        {/* CV snapshot strip */}
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          <Snapshot value={earnedCount} label={`credential${earnedCount === 1 ? '' : 's'} earned`} />
          <Snapshot value={byStatus.in_progress.length} label="in progress" />
          <Snapshot value={Math.round(totalCeHours)} label="CE hours logged" />
        </div>

        {/* Search / add */}
        {showSearch && (
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ position: 'relative' }}>
              <Search
                size={16}
                aria-hidden="true"
                style={{ position: 'absolute', left: 2, top: '50%', transform: 'translateY(-50%)', color: A.inkMuted, pointerEvents: 'none' }}
              />
              <input
                type="search"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search 143 credentials: OCS, pelvic, POCUS…"
                aria-label="Search credentials to add"
                style={{
                  width: '100%', padding: '8px 2px 8px 26px',
                  border: 'none', borderBottom: `2px solid ${A.ruleMinor}`,
                  background: 'transparent', fontFamily: FIG, fontSize: 'max(16px, 15px)',
                  color: A.ink, outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
            {results.length > 0 && (
              <ul style={{ listStyle: 'none', padding: 0, margin: '0.5rem 0 0', border: `1px solid ${A.ink}` }}>
                {results.map((c, i) => (
                  <li key={c.name}>
                    <button
                      type="button"
                      onClick={() => addCredential(c.name)}
                      disabled={saving}
                      style={{
                        width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10,
                        padding: '0.6rem 0.85rem', background: 'transparent', border: 'none',
                        borderBottom: i < results.length - 1 ? `1px solid ${A.ruleFaint}` : 'none',
                        cursor: 'pointer', fontFamily: 'inherit',
                      }}
                    >
                      <Plus size={14} aria-hidden="true" style={{ color: A.accent, flexShrink: 0 }} />
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: A.ink }}>{c.name}</span>
                        <span style={{ fontFamily: FIG, fontSize: 11.5, color: A.inkMuted, marginLeft: 8 }}>{c.type}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {query.trim() && results.length === 0 && (
              <p style={{ fontFamily: FIG, fontSize: 13, color: A.inkMuted, marginTop: 8 }}>
                No matching credential that isn&rsquo;t already on your profile. The field has 143; try a shorter term.
              </p>
            )}
          </div>
        )}

        {/* Credential groups */}
        {enriched.length === 0 ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', background: A.notice, border: `1px dashed ${A.ink}` }}>
            <Award size={22} aria-hidden="true" style={{ color: A.inkMuted, marginBottom: 6 }} />
            <div style={{ fontWeight: 600, color: A.ink, marginBottom: 4 }}>Stake your claims</div>
            <div style={{ fontFamily: FIG, fontSize: 13.5, color: A.inkMuted }}>
              Add the certifications you hold or are pursuing to assemble your living rehab CV.
            </div>
          </div>
        ) : (
          STATUS_ORDER.filter((s) => byStatus[s].length > 0).map((status) => (
            <div key={status} style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontFamily: FIG, fontSize: 12.5, letterSpacing: '0.02em', fontWeight: 700, color: A.inkMuted, borderTop: `2px solid ${A.ink}`, paddingTop: 8, marginBottom: 6, ...tabularNums }}>
                {STATUS_META[status].label} · {byStatus[status].length}
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {byStatus[status].map((e, i) => (
                  <CredentialRow
                    key={e.cert_name}
                    entry={e}
                    isLast={i === byStatus[status].length - 1}
                    onSetStatus={saveCredential}
                    onRemove={removeCredential}
                    saving={saving}
                  />
                ))}
              </ul>
            </div>
          ))
        )}

        <p style={{ fontFamily: FIG, fontSize: 11.5, color: A.inkMuted, margin: '0.5rem 0 0', letterSpacing: '0.02em' }}>
          Self-reported. Claims stay private unless you publish your profile.
        </p>
      </div>
    </div>
  );
}

function Snapshot({ value, label }) {
  return (
    <div>
      <div style={{ fontFamily: FIG, fontSize: 27, fontWeight: 800, color: A.ink, lineHeight: 1, ...tabularNums }}>
        {value}
      </div>
      <div style={{ fontFamily: FIG, fontSize: 11.5, fontWeight: 600, color: A.inkMuted, marginTop: 4, letterSpacing: '0.02em' }}>{label}</div>
    </div>
  );
}

function CredentialRow({ entry, isLast, onSetStatus, onRemove, saving }) {
  const { cert, slug, best, status, cert_name: name } = entry;
  const meta = STATUS_META[status] || STATUS_META.earned;
  return (
    <li
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '0.65rem 0.25rem',
        borderBottom: isLast ? 'none' : `1px solid ${A.ruleFaintest}`,
      }}
    >
      <span aria-hidden="true" style={{ color: meta.color, fontSize: 13, flexShrink: 0 }}>{meta.mark}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: A.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {slug ? (
            <Link to={`/credentials/${slug}`} style={{ color: A.ink, textDecoration: 'none' }}>
              {name}
            </Link>
          ) : name}
        </div>
        <div style={{ fontFamily: FIG, fontSize: 11.5, color: A.inkMuted, marginTop: 2 }}>
          {cert.type} · {(cert.disciplines || [cert.discipline]).join(' · ')}
        </div>
      </div>

      {best && (
        <div style={{ textAlign: 'right', flexShrink: 0 }} title={`Scores ${best.score}/100 on the ${best.label} lens (default weights)`}>
          <div style={{ fontFamily: FIG, fontSize: 16, fontWeight: 700, color: tierColor(best.score), lineHeight: 1, ...tabularNums }}>
            {best.score}
          </div>
          <div style={{ fontFamily: FIG, fontSize: 10.5, color: A.inkMuted, marginTop: 2 }}>{best.label.replace(' & Industry', '')}</div>
        </div>
      )}

      {/* Status selector */}
      <select
        value={status}
        disabled={saving}
        onChange={(e) => onSetStatus({ certName: name, status: e.target.value })}
        aria-label={`Status for ${name}`}
        style={{
          flexShrink: 0, fontFamily: FIG, fontSize: 12, padding: '0.3rem 0.5rem',
          borderRadius: 0, border: `1px solid ${meta.color === A.dim ? A.ruleMinor : meta.color}`,
          background: 'transparent', color: meta.color === A.dim ? A.inkMuted : meta.color,
          fontWeight: 700, cursor: 'pointer',
        }}
      >
        <option value="earned">Earned</option>
        <option value="in_progress">In progress</option>
        <option value="planned">Planned</option>
      </select>

      {slug && (
        <Link to={`/credentials/${slug}`} aria-label={`Open ${name} details`} style={{ color: A.accent, flexShrink: 0, display: 'inline-flex' }}>
          <ExternalLink size={14} aria-hidden="true" />
        </Link>
      )}

      <button
        type="button"
        onClick={() => onRemove(name)}
        disabled={saving}
        aria-label={`Remove ${name}`}
        title="Remove from profile"
        style={{ background: 'none', border: 'none', color: A.inkMuted, cursor: 'pointer', padding: 4, flexShrink: 0, display: 'inline-flex' }}
      >
        <X size={15} aria-hidden="true" />
      </button>
    </li>
  );
}
