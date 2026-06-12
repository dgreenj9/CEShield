import React from 'react';
import { ExternalLink, BadgeCheck } from 'lucide-react';
import { colors } from '../../utils/constants';
import catalog from '../../data/courseCatalog.json';

// Course recommendations for compliance gaps.
//
// Given the user's state/license and the mandatory categories they're short
// on, surfaces catalog courses that would close the gap. Renders nothing
// when the catalog has no matches — safe to mount before any affiliate
// deals exist.
//
// Monetization rules (per the public commitment on /about):
//   - sponsored entries carry rel="sponsored" (Google requirement for paid
//     links) and an inline "Referral link" label (FTC disclosure)
//   - the section-level disclosure renders whenever ANY shown link is
//     sponsored
//   - this component must never appear on credential-score surfaces

const matches = (course, { state, licenseType, category }) => {
  const stateOk = course.states?.includes('*') || course.states?.includes(state);
  const licenseOk =
    course.licenseTypes?.includes('*') || course.licenseTypes?.includes(licenseType);
  const categoryOk = !category || course.category === category;
  return stateOk && licenseOk && categoryOk;
};

export default function CourseRecommendations({
  state,
  licenseType,
  // Array of category keys the user is short on, e.g. ['implicitBias'].
  // Pass null/undefined to show all matches for the state+license.
  neededCategories = null,
}) {
  const courses = (catalog.courses || []).filter((c) => {
    if (neededCategories && neededCategories.length > 0) {
      return neededCategories.some((cat) =>
        matches(c, { state, licenseType, category: cat }),
      );
    }
    return matches(c, { state, licenseType, category: null });
  });

  if (courses.length === 0) return null;

  const anySponsored = courses.some((c) => c.sponsored);

  return (
    <section style={{ marginTop: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, color: colors.textDark }}>
          Courses that close this gap
        </h3>
        {anySponsored && (
          <span style={{ fontSize: '0.72rem', color: colors.textGray }}>
            Some links below are referral links — we may earn a fee. They never
            affect credential scores.
          </span>
        )}
      </div>
      <ul style={{
        listStyle: 'none', padding: 0, margin: 0,
        border: `1px solid ${colors.slateLight}`, borderRadius: 10,
        overflow: 'hidden', background: 'white',
      }}>
        {courses.map((c, i) => (
          <li
            key={c.id}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '0.8rem 1rem',
              borderBottom: i < courses.length - 1 ? `1px solid ${colors.slateLight}` : 'none',
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '0.92rem', color: colors.textDark }}>
                {c.title}
              </div>
              <div style={{ fontSize: '0.78rem', color: colors.textGray, marginTop: 2, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                <span>{c.provider}</span>
                <span className="font-mono tabular-nums">{c.hours} hr</span>
                {typeof c.priceUsd === 'number' && (
                  <span className="font-mono tabular-nums">${c.priceUsd}</span>
                )}
                <span>{c.format}</span>
                {c.sponsored && (
                  <span
                    style={{
                      fontSize: '0.66rem', fontWeight: 600,
                      padding: '1px 7px', borderRadius: 999,
                      background: colors.grayLight, color: colors.textGray,
                      textTransform: 'uppercase', letterSpacing: '0.04em',
                    }}
                  >
                    Referral link
                  </span>
                )}
              </div>
            </div>
            <a
              href={c.url}
              target="_blank"
              rel={c.sponsored ? 'sponsored noopener noreferrer' : 'noopener noreferrer'}
              aria-label={`View course: ${c.title} (opens in new tab)`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '0.45rem 0.9rem', flexShrink: 0,
                background: colors.primaryBlue, color: 'white',
                textDecoration: 'none', borderRadius: 6,
                fontSize: '0.82rem', fontWeight: 500, whiteSpace: 'nowrap',
              }}
            >
              View course <ExternalLink size={13} aria-hidden="true" />
            </a>
          </li>
        ))}
      </ul>
      <p style={{ fontSize: '0.72rem', color: colors.textGray, marginTop: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
        <BadgeCheck size={13} aria-hidden="true" style={{ flexShrink: 0 }} />
        Courses listed here are vetted to satisfy the stated requirement.
        Always confirm category acceptance with your board before purchase.
      </p>
    </section>
  );
}
