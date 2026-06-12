import React, { useMemo, useState } from 'react';
import { Search, X, Plus, ExternalLink, Award, Check } from 'lucide-react';
import { colors } from '../../utils/constants';
import { Link } from '../../router';
import { useUserData } from '../../contexts/UserDataContext';
import { certifications as certData } from '../../utils/certificationData';
import { getLibraryMetaForCertification } from '../../utils/citationsLibrary';
import {
  PATHS, PATH_ORDER, getPathDefaultWeights, scoreColor,
} from '../../utils/careerPaths';
import { computeScore, certScoresForPath } from '../../utils/certScoring';

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

const STATUS_META = {
  earned:      { label: 'Earned',       chip: '#2F6B4D', bg: '#E8EFEA' },
  in_progress: { label: 'In progress',  chip: '#8A6332', bg: '#F6F0E5' },
  planned:     { label: 'Planned',      chip: '#3b82f6', bg: '#e0f2fe' },
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
    <div
      style={{
        background: 'white',
        border: `1px solid ${colors.slateLight}`,
        borderRadius: 12,
        padding: '1.5rem',
      }}
    >
      <div className="flex items-center justify-between flex-wrap gap-2" style={{ marginBottom: '0.5rem' }}>
        <h2 className="text-base font-semibold" style={{ color: colors.textDark, margin: 0 }}>
          Your credential profile
        </h2>
        <button
          type="button"
          onClick={() => setShowSearch((s) => !s)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '0.45rem 0.9rem', borderRadius: 8,
            background: showSearch ? colors.grayLight : colors.primaryBlue,
            color: showSearch ? colors.slateMedium : 'white',
            border: showSearch ? `1px solid ${colors.slateLight}` : 'none',
            fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer',
          }}
        >
          {showSearch ? <X size={14} aria-hidden="true" /> : <Plus size={14} aria-hidden="true" />}
          {showSearch ? 'Close' : 'Add a credential'}
        </button>
      </div>

      {/* CV snapshot strip */}
      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
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
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: colors.textGray, pointerEvents: 'none' }}
            />
            <input
              type="search"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search 143 credentials — e.g. OCS, pelvic, POCUS…"
              aria-label="Search credentials to add"
              style={{
                width: '100%', padding: '0.7rem 1rem 0.7rem 2.4rem',
                border: `1px solid ${colors.slateLight}`, borderRadius: 10,
                background: colors.grayLight, fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
          {results.length > 0 && (
            <ul style={{ listStyle: 'none', padding: 0, margin: '0.5rem 0 0', border: `1px solid ${colors.slateLight}`, borderRadius: 10, overflow: 'hidden' }}>
              {results.map((c) => (
                <li key={c.name}>
                  <button
                    type="button"
                    onClick={() => addCredential(c.name)}
                    disabled={saving}
                    style={{
                      width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10,
                      padding: '0.6rem 0.85rem', background: 'white', border: 'none',
                      borderBottom: `1px solid ${colors.slateLight}`, cursor: 'pointer',
                    }}
                  >
                    <Plus size={14} aria-hidden="true" style={{ color: colors.primaryBlue, flexShrink: 0 }} />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 600, color: colors.textDark }}>{c.name}</span>
                      <span style={{ fontSize: '0.76rem', color: colors.textGray, marginLeft: 8 }}>{c.type}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {query.trim() && results.length === 0 && (
            <p style={{ fontSize: '0.85rem', color: colors.textGray, marginTop: 8 }}>
              No matching credential not already on your profile. The matrix has 143 — try a shorter term.
            </p>
          )}
        </div>
      )}

      {/* Credential groups */}
      {enriched.length === 0 ? (
        <div style={{ padding: '1.5rem', textAlign: 'center', background: colors.grayLight, border: `1px dashed ${colors.slateLight}`, borderRadius: 10 }}>
          <Award size={22} aria-hidden="true" style={{ color: colors.slateMedium, marginBottom: 6 }} />
          <div style={{ fontWeight: 600, color: colors.textDark, marginBottom: 4 }}>Build your credential picture</div>
          <div style={{ fontSize: '0.88rem', color: colors.textGray }}>
            Add the certifications you hold or are pursuing to assemble your living rehab CV.
          </div>
        </div>
      ) : (
        STATUS_ORDER.filter((s) => byStatus[s].length > 0).map((status) => (
          <div key={status} style={{ marginBottom: '1.25rem' }}>
            <div className="eyebrow" style={{ marginBottom: 8, display: 'block' }}>
              {STATUS_META[status].label} · {byStatus[status].length}
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {byStatus[status].map((e) => (
                <CredentialRow key={e.cert_name} entry={e} onSetStatus={saveCredential} onRemove={removeCredential} saving={saving} />
              ))}
            </ul>
          </div>
        ))
      )}

      <p style={{ fontSize: '0.74rem', color: colors.textGray, marginTop: '0.5rem', fontStyle: 'italic' }}>
        Self-reported. Credential verification is coming — for now this is your private working CV.
      </p>
    </div>
  );
}

function Snapshot({ value, label }) {
  return (
    <div>
      <div className="font-mono tabular-nums" style={{ fontSize: '1.5rem', fontWeight: 600, color: colors.textDark, lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: '0.76rem', color: colors.textGray, marginTop: 3 }}>{label}</div>
    </div>
  );
}

function CredentialRow({ entry, onSetStatus, onRemove, saving }) {
  const { cert, slug, best, status, cert_name: name } = entry;
  return (
    <li
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '0.7rem 0.85rem', border: `1px solid ${colors.slateLight}`, borderRadius: 10, background: 'white',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.92rem', fontWeight: 600, color: colors.textDark }}>
          {slug ? (
            <Link to={`/credentials/${slug}`} style={{ color: colors.textDark, textDecoration: 'none' }}>
              {name}
            </Link>
          ) : name}
        </div>
        <div style={{ fontSize: '0.76rem', color: colors.textGray, marginTop: 2 }}>
          {cert.type} · {(cert.disciplines || [cert.discipline]).join(' · ')}
        </div>
      </div>

      {best && (
        <div style={{ textAlign: 'right', flexShrink: 0 }} title={`Scores ${best.score}/100 on the ${best.label} lens (default weights)`}>
          <div className="font-mono tabular-nums" style={{ fontSize: '1.05rem', fontWeight: 700, color: scoreColor(best.score), lineHeight: 1 }}>
            {best.score}
          </div>
          <div style={{ fontSize: '0.68rem', color: colors.textGray, marginTop: 2 }}>{best.label}</div>
        </div>
      )}

      {/* Status selector */}
      <select
        value={status}
        disabled={saving}
        onChange={(e) => onSetStatus({ certName: name, status: e.target.value })}
        aria-label={`Status for ${name}`}
        style={{
          flexShrink: 0, fontSize: '0.78rem', padding: '0.3rem 0.5rem',
          borderRadius: 999, border: `1px solid ${STATUS_META[status].chip}`,
          background: STATUS_META[status].bg, color: STATUS_META[status].chip,
          fontWeight: 600, cursor: 'pointer',
        }}
      >
        <option value="earned">Earned</option>
        <option value="in_progress">In progress</option>
        <option value="planned">Planned</option>
      </select>

      {slug && (
        <Link to={`/credentials/${slug}`} aria-label={`Open ${name} details`} style={{ color: colors.primaryBlue, flexShrink: 0, display: 'inline-flex' }}>
          <ExternalLink size={14} aria-hidden="true" />
        </Link>
      )}

      <button
        type="button"
        onClick={() => onRemove(name)}
        disabled={saving}
        aria-label={`Remove ${name}`}
        title="Remove from profile"
        style={{ background: 'none', border: 'none', color: colors.textGray, cursor: 'pointer', padding: 4, flexShrink: 0, display: 'inline-flex' }}
      >
        <X size={15} aria-hidden="true" />
      </button>
    </li>
  );
}
