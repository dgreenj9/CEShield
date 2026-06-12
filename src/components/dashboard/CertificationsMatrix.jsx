import React, { useState, useMemo, useEffect } from 'react';
import { ChevronDown, Info, SlidersHorizontal, Search, X } from 'lucide-react';
import { colors } from '../../utils/constants';
import { getTotalCitationsCount } from '../../utils/citationsLibrary';
import { METHODOLOGY_CONTENT } from '../../utils/certificationCitationMap';
import {
  certifications as certData,
  ALL_DISCIPLINES,
} from '../../utils/certificationData';
import useCertFilters from '../../hooks/useCertFilters';
import {
  PATHS,
  PATH_ORDER,
  PATH_DIMENSIONS,
  getPathDefaultWeights,
} from '../../utils/careerPaths';
import CertificationListItem from './CertificationListItem';
import CertificationDetail from './CertificationDetail';
import {
  getLibraryMetaForCertification,
  citationLibrary,
} from '../../utils/citationsLibrary';
import { useSearchParam, setSearchParam } from '../../router';
import { usePreference } from '../../utils/userPreferences';

// Slug helpers for URL deep-linking. The slug is stored on each cert's
// metadata entry; reverse lookup goes through citationLibrary.
const slugFor = (certName) => getLibraryMetaForCertification(certName).slug;
const certNameFromSlug = (slug) => {
  if (!slug) return null;
  for (const [name, entry] of Object.entries(citationLibrary)) {
    if (entry.slug === slug) return name;
  }
  return null;
};

// `Are current weights the path default?` — used to surface "Custom weights"
// when the user has tuned away from the preset.
const weightsAreDefault = (weights, pathKey) => {
  const def = getPathDefaultWeights(pathKey);
  if (!def) return false;
  return Object.keys(def).every((k) => def[k] === weights?.[k]);
};

const CertificationsMatrix = () => {
  // Persistent matrix state — see hooks/useCertFilters.js. Pure scoring/
  // filter math lives in utils/certScoring.js. This component now only
  // wires top-level controls + the master-detail layout.
  const { state, dispatch, filtered: rankedFiltered, tierCounts } = useCertFilters();
  const weights = state.weights;
  const selectedFilter = state.tier;
  const selectedDiscipline = state.discipline;
  const selectedType = state.type;
  const searchTerm = state.searchTerm;

  const setSelectedFilter = (v) => dispatch({ type: 'SET_TIER', value: v });
  const setSelectedDiscipline = (v) => dispatch({ type: 'SET_DISCIPLINE', value: v });
  const setSelectedType = (v) => dispatch({ type: 'SET_TYPE', value: v });
  const setSearchTerm = (v) => dispatch({ type: 'SET_SEARCH', value: v });
  const handleWeightChange = (key, value) =>
    dispatch({ type: 'SET_WEIGHT', key, value });
  const resetWeights = () => dispatch({ type: 'RESET_WEIGHTS' });

  // Local-only UI state.
  const [showMethodology, setShowMethodology] = useState(false);
  const [showWeights, setShowWeights] = useState(false);
  // Master-detail selection lives in the URL (?cert=<slug>) so links are
  // shareable. Reading the slug is reactive — back/forward and external
  // links propagate to the matrix without an extra state mirror.
  const selectedSlug = useSearchParam('cert');
  const selectedCertName = certNameFromSlug(selectedSlug);
  // Mobile-only: when the user taps a cert we hide the list and show the
  // detail panel full-width. Desktop ignores this and always shows both.
  const [showingDetailMobile, setShowingDetailMobile] = useState(false);

  // Active path (lens) drives both which dims show in the customizer and
  // which certs appear in the list. The path lives in the reducer state;
  // a localStorage-backed preference seeds it on first mount.
  const activePath = state.path;
  const dimsForActivePath = PATH_DIMENSIONS[activePath] || {};
  const dimensionKeys = Object.keys(dimsForActivePath);

  const [preferredPath, setPreferredPath] = usePreference('careerPath');
  const appliedInitialPathRef = React.useRef(false);
  useEffect(() => {
    if (appliedInitialPathRef.current) return;
    // URL params win over localStorage. If the URL specifies a lens (or
    // weights), useCertFilters has already hydrated from it; don't clobber.
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (url.searchParams.has('lens') || url.searchParams.has('w')) {
        appliedInitialPathRef.current = true;
        return;
      }
    }
    if (!preferredPath) return;
    if (!PATHS[preferredPath]) return;
    dispatch({ type: 'SET_PATH', value: preferredPath });
    appliedInitialPathRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferredPath]);

  const totalCitations = useMemo(() => getTotalCitationsCount(), []);

  // If the URL points at a cert that's been filtered out, drop the param so
  // the URL reflects what's actually visible. Browser back still navigates
  // back to the previous state.
  useEffect(() => {
    if (!selectedSlug) return;
    if (!selectedCertName) return;
    const inFilter = rankedFiltered.some((c) => c.name === selectedCertName);
    if (!inFilter && rankedFiltered.length > 0) {
      setSearchParam('cert', null, { replace: true });
    }
  }, [selectedSlug, selectedCertName, rankedFiltered]);

  // Deep-link on mobile: if the URL arrives with ?cert=<slug>, jump straight
  // into the detail view instead of the list.
  useEffect(() => {
    if (!selectedCertName) return;
    setShowingDetailMobile(true);
  }, [selectedCertName]);

  return (
    <div className="mb-6" style={{ background: 'white', padding: '1.5rem', boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.06)', border: `1px solid ${colors.slateLight}`, borderRadius: '12px' }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <h2 className="text-base md:text-lg font-semibold" style={{ color: colors.textDark }}>
            Evidence-Based Certification Rankings
          </h2>
          <span className="text-xs px-2 py-1" style={{ background: colors.lightBlue, color: colors.primaryBlue, borderRadius: '6px' }}>
            {certData.length} Ranked
          </span>
        </div>
      </div>

      {/* Career-path lens selector. Five lenses, each with its own native
          dimensions + ranking. Switching lens swaps both the dim set in the
          customizer and the eligible cert pool. */}
      <div className="mb-4" role="group" aria-label="Career path lens">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
          <div className="text-xs font-semibold" style={{ color: colors.textGray, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Career path lens
          </div>
          <a
            href="/career-paths"
            style={{ fontSize: '0.78rem', color: colors.primaryBlue, textDecoration: 'underline' }}
          >
            What are the paths?
          </a>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {PATH_ORDER.map((key) => {
            const path = PATHS[key];
            const active = activePath === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => dispatch({ type: 'SET_PATH', value: key })}
                aria-pressed={active}
                title={path.description}
                style={{
                  padding: '0.5rem 0.9rem',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  borderRadius: 9999,
                  background: active ? colors.primaryBlue : 'white',
                  color: active ? 'white' : colors.slateMedium,
                  border: `1px solid ${active ? colors.primaryBlue : colors.slateLight}`,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {path.label}
              </button>
            );
          })}
          {!weightsAreDefault(weights, activePath) && (
            <span
              style={{
                alignSelf: 'center',
                fontSize: '0.78rem',
                color: colors.textGray,
                fontStyle: 'italic',
              }}
            >
              Custom weights
            </span>
          )}
        </div>
        {/* "Save this lens as your default" — only when the active lens
            isn't already the saved preference. */}
        <div className="mt-2 flex items-center gap-2 flex-wrap" style={{ fontSize: '0.75rem' }}>
          {preferredPath === activePath ? (
            <span style={{ color: colors.textGray }}>
              Your default lens:{' '}
              <strong style={{ color: colors.textDark }}>{PATHS[activePath].label}</strong>
            </span>
          ) : (
            <>
              <span style={{ color: colors.textGray }}>
                Use{' '}
                <strong style={{ color: colors.textDark }}>{PATHS[activePath].label}</strong>{' '}
                as your default lens?
              </span>
              <button
                type="button"
                onClick={() => setPreferredPath(activePath)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: colors.primaryBlue,
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textDecoration: 'underline',
                }}
              >
                Save as default
              </button>
            </>
          )}
          {preferredPath && preferredPath !== activePath && (
            <button
              type="button"
              onClick={() => setPreferredPath(null)}
              style={{
                background: 'none',
                border: 'none',
                color: colors.textGray,
                cursor: 'pointer',
                padding: 0,
                fontSize: '0.75rem',
                textDecoration: 'underline',
              }}
            >
              clear saved default ({PATHS[preferredPath]?.label})
            </button>
          )}
        </div>
      </div>

      {/* Weight Sliders */}
      <div className="mb-4">
          <button
            onClick={() => setShowWeights(!showWeights)}
            className="flex items-center gap-2 text-sm px-3 py-1.5 mb-3 transition-colors"
            style={{
              background: showWeights ? colors.lightBlue : colors.grayLight,
              color: showWeights ? colors.primaryBlue : colors.textGray,
              border: `1px solid ${showWeights ? colors.primaryBlue : colors.slateLight}`,
              cursor: 'pointer',
              borderRadius: '6px',
            }}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Adjust Scoring Weights
            <ChevronDown className={`w-3 h-3 transition-transform ${showWeights ? 'rotate-180' : ''}`} />
          </button>

          {showWeights && (() => {
            const weightLabel = (n) => {
              if (n === 0) return 'Off';
              if (n < 10) return 'Low';
              if (n < 20) return 'Moderate';
              if (n < 30) return 'High';
              if (n < 45) return 'Heavy';
              return 'Dominant';
            };
            const total = Object.values(weights).reduce((s, v) => s + v, 0);
            return (
            <div
              style={{
                padding: '1.25rem',
                marginBottom: '1rem',
                background: 'white',
                border: `1px solid ${colors.slateLight}`,
                borderRadius: 12,
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem',
                flexWrap: 'wrap',
                marginBottom: '1rem',
                paddingBottom: '0.875rem',
                borderBottom: `1px solid ${colors.slateLight}`,
              }}>
                <div>
                  <div style={{ fontWeight: 600, color: colors.textDark, fontSize: '0.95rem' }}>
                    How much should each dimension matter?
                  </div>
                  <div style={{ fontSize: '0.8rem', color: colors.textGray, marginTop: 2 }}>
                    Dragging one slider rebalances the others so the total stays at 100.
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      padding: '4px 8px',
                      borderRadius: 999,
                      background: total === 100 ? '#dcfce7' : '#fef3c7',
                      color: total === 100 ? '#166534' : '#92400e',
                      fontWeight: 600,
                    }}
                  >
                    Total {total}%
                  </span>
                  <button
                    type="button"
                    onClick={resetWeights}
                    style={{
                      fontSize: '0.78rem',
                      padding: '0.4rem 0.75rem',
                      background: 'white',
                      color: colors.primaryBlue,
                      border: `1px solid ${colors.primaryBlue}`,
                      borderRadius: 6,
                      cursor: 'pointer',
                    }}
                  >
                    Reset
                  </button>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '0.875rem',
                }}
              >
                {dimensionKeys.map((key) => {
                  const value = weights[key];
                  const fillPct = value;  // 0–100 ⇒ background fill width
                  return (
                    <div
                      key={key}
                      style={{
                        position: 'relative',
                        padding: '0.875rem 1rem',
                        background: colors.grayLight,
                        border: `1px solid ${colors.slateLight}`,
                        borderRadius: 10,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        aria-hidden="true"
                        style={{
                          position: 'absolute', inset: 0, width: `${fillPct}%`,
                          background: `${colors.primaryBlue}14`,
                          transition: 'width 0.18s ease',
                          pointerEvents: 'none',
                        }}
                      />
                      <div style={{ position: 'relative' }}>
                        <div style={{
                          display: 'flex', alignItems: 'baseline',
                          justifyContent: 'space-between', gap: 8,
                        }}>
                          <div style={{ fontWeight: 600, color: colors.textDark, fontSize: '0.9rem' }}>
                            {(dimsForActivePath[key]?.label || key)}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                            <span className="font-mono tabular-nums" style={{ fontWeight: 600, color: colors.primaryBlue, fontSize: '1.15rem', letterSpacing: '-0.01em' }}>
                              {value}
                            </span>
                            <span className="font-mono" style={{ fontSize: '0.7rem', color: colors.textGray }}>/100</span>
                          </div>
                        </div>
                        <p style={{
                          fontSize: '0.78rem', color: colors.textGray,
                          margin: '4px 0 10px', lineHeight: 1.4,
                        }}>
                          {(dimsForActivePath[key]?.description || '')}
                        </p>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={value}
                          onChange={(e) => handleWeightChange(key, parseInt(e.target.value, 10))}
                          aria-label={`${(dimsForActivePath[key]?.label || key)} weight`}
                          style={{ width: '100%', accentColor: colors.primaryBlue }}
                        />
                        <div style={{
                          display: 'flex', justifyContent: 'space-between',
                          marginTop: 4, fontSize: '0.68rem', color: colors.textGray,
                        }}>
                          <span>{weightLabel(value)}</span>
                          <span className="font-mono">
                            0 · 25 · 50 · 75 · 100
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            );
          })()}
        </div>

      {/* Search */}
      <div className="mb-4">
        <div
          className="flex items-center gap-2 px-3 py-2.5"
          style={{
            border: `2px solid ${searchTerm ? colors.primaryBlue : colors.slateLight}`,
            background: 'white',
            borderRadius: '6px',
            transition: 'border-color 0.15s',
          }}
        >
          <Search className="w-4 h-4 flex-shrink-0" style={{ color: searchTerm ? colors.primaryBlue : colors.textGray }} />
          <input
            type="text"
            placeholder="Search by certification, discipline, or technique…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: colors.textDark, minWidth: 0 }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="flex-shrink-0 p-0.5 rounded"
              style={{ color: colors.textGray, cursor: 'pointer', background: 'none', border: 'none' }}
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Discipline Filter */}
      <div className="mb-3">
          <div className="flex flex-wrap gap-1.5 mb-3">
            {['All', ...ALL_DISCIPLINES].map(disc => (
              <button
                key={disc}
                onClick={() => setSelectedDiscipline(disc)}
                className="px-2.5 py-1 text-xs transition-all"
                style={{
                  background: selectedDiscipline === disc ? colors.textDark : colors.grayLight,
                  color: selectedDiscipline === disc ? 'white' : colors.textGray,
                  border: `1px solid ${selectedDiscipline === disc ? colors.textDark : colors.slateLight}`,
                  cursor: 'pointer',
                  borderRadius: '20px',
                  fontWeight: selectedDiscipline === disc ? '600' : '400',
                }}
              >
                {disc}
              </button>
            ))}
          </div>
          {selectedType !== 'All' && (
            <div className="flex items-center gap-1 mt-1.5">
              <span className="text-xs" style={{ color: colors.textGray }}>Type:</span>
              <button
                onClick={() => setSelectedType('All')}
                className="flex items-center gap-1 text-xs px-2 py-0.5 rounded"
                style={{ background: colors.lightBlue, color: colors.primaryBlue, border: `1px solid ${colors.primaryBlue}`, cursor: 'pointer' }}
              >
                {selectedType} <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

      {/* Tier Filter */}
      <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'all', label: 'All', count: tierCounts.all },
              { value: 'strong', label: 'Strong (70+)', count: tierCounts.strong },
              { value: 'good', label: 'Good (50-69)', count: tierCounts.good },
              { value: 'moderate', label: 'Moderate (30-49)', count: tierCounts.moderate },
              { value: 'limited', label: 'Limited (<30)', count: tierCounts.limited },
            ].map(filter => (
              <button
                key={filter.value}
                onClick={() => setSelectedFilter(filter.value)}
                className="px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm transition-all"
                style={{
                  background: selectedFilter === filter.value ? colors.primaryBlue : colors.grayLight,
                  color: selectedFilter === filter.value ? 'white' : colors.textGray,
                  border: `1px solid ${selectedFilter === filter.value ? colors.primaryBlue : colors.slateLight}`,
                  cursor: 'pointer',
                  borderRadius: '9999px',
                }}
              >
                <span className="hidden sm:inline">{filter.label}</span>
                <span className="sm:hidden">
                  {filter.value === 'all' ? 'All' : filter.value === 'strong' ? '70+' : filter.value === 'good' ? '50-69' : filter.value === 'moderate' ? '30-49' : '<30'}
                </span>
                <span className="ml-1">({filter.count})</span>
              </button>
            ))}
          </div>
        </div>

      {/* Master-detail */}
      {(() => {
        // The detail pane defaults to the top-ranked filtered cert if the
        // user hasn't picked one, or if their pick fell out of the filter.
        const inFilter = selectedCertName
          ? rankedFiltered.find((c) => c.name === selectedCertName)
          : null;
        const effectiveSelected = inFilter || rankedFiltered[0] || null;
        const handleSelect = (name) => {
          const slug = slugFor(name);
          if (slug) setSearchParam('cert', slug, { replace: true });
          setShowingDetailMobile(true);
        };
        const handleBack = () => setShowingDetailMobile(false);

        return (
          <div className="ceshield-matrix-split">
            {/* List column */}
            <div
              className="ceshield-matrix-list"
              style={{
                display: showingDetailMobile ? 'none' : 'block',
              }}
            >
              <div
                style={{
                  border: `1px solid ${colors.slateLight}`,
                  borderRadius: 12,
                  overflow: 'hidden',
                  maxHeight: 640,
                  overflowY: 'auto',
                  background: 'white',
                }}
              >
                {rankedFiltered.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: colors.textGray, fontSize: '0.9rem' }}>
                    No certifications match these filters.
                  </div>
                ) : (
                  rankedFiltered.map((cert) => (
                    <CertificationListItem
                      key={cert.name}
                      cert={cert}
                      active={effectiveSelected && effectiveSelected.name === cert.name}
                      onSelect={handleSelect}
                    />
                  ))
                )}
              </div>
              <p style={{ marginTop: 8, fontSize: '0.78rem', color: colors.textGray, textAlign: 'center' }}>
                {rankedFiltered.length} of {certData.length} certifications shown
              </p>
            </div>

            {/* Detail column. Mobile shows the detail only after an explicit
                cert tap (showingDetailMobile=true); desktop CSS forces it
                visible regardless via !important. Auto-defaulting to the
                top-ranked cert on mobile created a stacked list+detail UX
                with no way to get back to the list. */}
            <div
              className="ceshield-matrix-detail"
              style={{
                display: showingDetailMobile ? 'block' : 'none',
              }}
            >
              {effectiveSelected ? (
                <CertificationDetail
                  certName={effectiveSelected.name}
                  weights={weights}
                  path={activePath}
                  onBack={showingDetailMobile ? handleBack : undefined}
                />
              ) : (
                <div
                  style={{
                    padding: '3rem 1.5rem',
                    textAlign: 'center',
                    background: colors.grayLight,
                    border: `1px dashed ${colors.slateLight}`,
                    borderRadius: 12,
                    color: colors.textGray,
                  }}
                >
                  Pick a certification on the left to see its evidence base
                  and score breakdown.
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Old per-cert card rendering — disabled by short-circuit below */}

      {/* Footer — methodology link. The global citations modal was removed
          when we moved to master-detail; per-cert citations now live in the
          detail pane. */}
      <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${colors.slateLight}` }}>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <button
            type="button"
            onClick={() => setShowMethodology(true)}
            className="flex items-center gap-1 hover:underline"
            style={{ color: colors.primaryBlue, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <Info className="w-4 h-4" aria-hidden="true" />
            Full methodology
          </button>
          <span style={{ color: colors.textGray }}>
            {totalCitations.toLocaleString()} citations across {certData.length} certifications
          </span>
        </div>
      </div>

      {/* Methodology Modal */}
      {showMethodology && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowMethodology(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-4xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
            style={{ width: '90%', maxHeight: '90vh' }}
          >
            <div className="p-4 border-b flex justify-between items-center flex-shrink-0">
              <div>
                <h3 className="text-base sm:text-lg font-semibold" style={{ color: colors.textDark }}>{METHODOLOGY_CONTENT.title}</h3>
                <p className="text-xs mt-1" style={{ color: colors.textGray }}>{METHODOLOGY_CONTENT.version}</p>
              </div>
              <button onClick={() => setShowMethodology(false)} className="p-2 text-gray-500 hover:text-gray-700 text-xl flex-shrink-0">✕</button>
            </div>
            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              <div className="mb-6">
                <p className="text-sm leading-relaxed" style={{ color: colors.textGray }}>{METHODOLOGY_CONTENT.overview}</p>
              </div>
              <div className="mb-6">
                <h4 className="font-semibold mb-4" style={{ color: colors.textDark }}>Scoring Components</h4>
                <div className="space-y-4">
                  {METHODOLOGY_CONTENT.scoringComponents.map((component, index) => (
                    <div key={index} className="p-4 rounded-lg" style={{ background: colors.grayLight, borderLeft: `4px solid ${colors.primaryBlue}` }}>
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-medium" style={{ color: colors.textDark }}>{component.name}</h5>
                        <span className="px-2 py-1 rounded text-sm font-semibold" style={{ background: colors.primaryBlue, color: 'white' }}>
                          {weights[component.dimensionKey]}%
                        </span>
                      </div>
                      <p className="text-sm mb-2" style={{ color: colors.textGray }}>{component.description}</p>
                      <ul className="space-y-1">
                        {component.criteria.map((criterion, idx) => (
                          <li key={idx} className="text-xs flex items-start gap-2" style={{ color: colors.textGray }}>
                            <span style={{ color: colors.primaryBlue }}>•</span>
                            {criterion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mb-6">
                <h4 className="font-semibold mb-4" style={{ color: colors.textDark }}>Evidence Tiers</h4>
                <div className="space-y-2">
                  {METHODOLOGY_CONTENT.scoringTiers.map((tier, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 rounded" style={{ background: colors.grayLight }}>
                      <div className="w-12 h-12 rounded flex items-center justify-center text-white font-bold" style={{ background: tier.color }}>
                        {tier.count}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium" style={{ color: colors.textDark }}>{tier.tier}</span>
                          <span className="text-sm" style={{ color: colors.textGray }}>({tier.range} points)</span>
                        </div>
                        <p className="text-xs mt-1" style={{ color: colors.textGray }}>{tier.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mb-6">
                <h4 className="font-semibold mb-3" style={{ color: colors.textDark }}>Key Findings</h4>
                <ul className="space-y-2">
                  {METHODOLOGY_CONTENT.keyFindings.map((finding, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm" style={{ color: colors.textGray }}>
                      <span style={{ color: colors.primaryBlue }}>✓</span>
                      {finding}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mb-6">
                <h4 className="font-semibold mb-3" style={{ color: colors.textDark }}>Study Limitations</h4>
                <ul className="space-y-2">
                  {METHODOLOGY_CONTENT.limitations.map((limitation, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm" style={{ color: colors.textGray }}>
                      <span style={{ color: '#f59e0b' }}>⚠</span>
                      {limitation}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-4 rounded" style={{ background: colors.lightBlue }}>
                <p className="text-sm" style={{ color: colors.primaryBlue }}>
                  <strong>Data Source:</strong> {METHODOLOGY_CONTENT.dataSource}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificationsMatrix;
