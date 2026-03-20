import React, { useState, useMemo } from 'react';
import { ChevronDown, BookOpen, ExternalLink, Info, SlidersHorizontal } from 'lucide-react';
import { colors } from '../../utils/constants';
import { formatCitation, citationsData } from '../../utils/citationsDataFinal';
import { CERTIFICATION_TO_CITATION_MAP, METHODOLOGY_CONTENT } from '../../utils/certificationCitationMap';
import {
  certifications as certData,
  DEFAULT_WEIGHTS,
  DIMENSION_LABELS,
  DIMENSION_DESCRIPTIONS,
  ALL_DISCIPLINES,
} from '../../utils/certificationData';

const computeScore = (subScores, weights) => {
  const total = Object.keys(weights).reduce((sum, key) => {
    return sum + (subScores[key] || 0) * (weights[key] / 100);
  }, 0);
  return Math.round(total * 10) / 10;
};

const CertificationsMatrix = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('strong');
  const [selectedDiscipline, setSelectedDiscipline] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [showMethodology, setShowMethodology] = useState(false);
  const [showCitations, setShowCitations] = useState(false);
  const [showWeights, setShowWeights] = useState(true);
  const [expandedCitations, setExpandedCitations] = useState({});
  const [expandedSubScores, setExpandedSubScores] = useState({});
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);

  // Compute dynamic scores and ranks
  const rankedCerts = useMemo(() => {
    const scored = certData.map(cert => ({
      ...cert,
      computedScore: computeScore(cert.subScores, weights),
    }));
    scored.sort((a, b) => b.computedScore - a.computedScore);
    return scored.map((cert, i) => ({ ...cert, rank: i + 1 }));
  }, [weights]);

  const totalCitations = useMemo(
    () => Object.values(citationsData).reduce((sum, arr) => sum + arr.length, 0),
    []
  );

  const handleWeightChange = (changedKey, newValue) => {
    const clamped = Math.max(0, Math.min(100, newValue));
    const otherKeys = Object.keys(weights).filter(k => k !== changedKey);
    const remaining = 100 - clamped;
    const currentOtherTotal = otherKeys.reduce((s, k) => s + weights[k], 0);

    let newWeights = { ...weights, [changedKey]: clamped };
    if (currentOtherTotal === 0) {
      const share = remaining / otherKeys.length;
      otherKeys.forEach(k => { newWeights[k] = Math.round(share); });
    } else {
      let distributed = 0;
      otherKeys.forEach((k, idx) => {
        if (idx === otherKeys.length - 1) {
          newWeights[k] = remaining - distributed;
        } else {
          const share = Math.round((weights[k] / currentOtherTotal) * remaining);
          newWeights[k] = share;
          distributed += share;
        }
      });
    }
    // Ensure sum is exactly 100
    const sum = Object.values(newWeights).reduce((s, v) => s + v, 0);
    if (sum !== 100) {
      const firstOther = otherKeys[0];
      newWeights[firstOther] += 100 - sum;
    }
    setWeights(newWeights);
  };

  const getFilteredCerts = () => {
    let filtered = rankedCerts;

    if (selectedFilter === 'strong') filtered = filtered.filter(c => c.computedScore >= 70);
    else if (selectedFilter === 'good') filtered = filtered.filter(c => c.computedScore >= 50 && c.computedScore < 70);
    else if (selectedFilter === 'moderate') filtered = filtered.filter(c => c.computedScore >= 30 && c.computedScore < 50);
    else if (selectedFilter === 'limited') filtered = filtered.filter(c => c.computedScore < 30);

    if (selectedDiscipline !== 'All') {
      filtered = filtered.filter(c => c.disciplines && c.disciplines.includes(selectedDiscipline));
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(term) ||
        c.discipline.toLowerCase().includes(term) ||
        c.evidence.toLowerCase().includes(term)
      );
    }

    return isExpanded ? filtered : filtered.slice(0, 5);
  };

  const tierCounts = useMemo(() => {
    const disc = selectedDiscipline === 'All'
      ? rankedCerts
      : rankedCerts.filter(c => c.disciplines && c.disciplines.includes(selectedDiscipline));
    return {
      all: disc.length,
      strong: disc.filter(c => c.computedScore >= 70).length,
      good: disc.filter(c => c.computedScore >= 50 && c.computedScore < 70).length,
      moderate: disc.filter(c => c.computedScore >= 30 && c.computedScore < 50).length,
      limited: disc.filter(c => c.computedScore < 30).length,
    };
  }, [rankedCerts, selectedDiscipline]);

  const getScoreStyle = (score) => {
    if (score >= 70) return { background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', color: 'white' };
    if (score >= 50) return { background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white' };
    if (score >= 30) return { background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', color: 'white' };
    return { background: 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)', color: 'white' };
  };

  const getBorderColor = (score) => {
    if (score >= 70) return '#22c55e';
    if (score >= 50) return colors.primaryBlue;
    if (score >= 30) return '#f59e0b';
    return '#94a3b8';
  };

  const getTypeStyle = (type) => {
    const styles = {
      'Certification': { background: colors.lightBlue, color: colors.primaryBlue },
      'Program': { background: colors.mutedTeal, color: '#0891b2' },
      'Technology': { background: colors.mutedPurple, color: colors.primaryPurple },
      'Fellowship': { background: '#fef3c7', color: '#d97706' },
      'Training': { background: '#fce7f3', color: '#be185d' },
      'Board Cert': { background: '#fee2e2', color: '#dc2626' },
      'Protocol': { background: colors.mutedTeal, color: '#0891b2' },
      'Specialty': { background: colors.lightBlue, color: colors.primaryBlue },
      'Equipment': { background: colors.mutedPurple, color: colors.primaryPurple },
      'Degree': { background: '#f3e8ff', color: '#7c3aed' },
    };
    return styles[type] || styles['Certification'];
  };

  const getCitationsForCertification = (certificationName) => {
    const mappedCategory = CERTIFICATION_TO_CITATION_MAP[certificationName];
    if (mappedCategory && citationsData[mappedCategory]) return citationsData[mappedCategory];
    if (citationsData[certificationName]) return citationsData[certificationName];
    const keys = Object.keys(citationsData);
    for (const key of keys) {
      if (key.toLowerCase().includes(certificationName.toLowerCase()) ||
          certificationName.toLowerCase().includes(key.toLowerCase())) {
        return citationsData[key];
      }
    }
    return [];
  };

  const toggleCitationsForCert = (certName) => {
    setExpandedCitations(prev => ({ ...prev, [certName]: !prev[certName] }));
  };

  const toggleSubScores = (certName) => {
    setExpandedSubScores(prev => ({ ...prev, [certName]: !prev[certName] }));
  };

  const filteredCerts = getFilteredCerts();

  const DIMENSION_KEYS = Object.keys(DEFAULT_WEIGHTS);

  const DIMENSION_BAR_COLORS = {
    clinicalOutcomes: '#22c55e',
    efficiency: '#3b82f6',
    costEffectiveness: '#f59e0b',
    evidenceQuality: '#8b5cf6',
    patientSatisfaction: '#ec4899',
  };

  const CitationSection = ({ certName }) => {
    const citations = getCitationsForCertification(certName);
    const isExp = expandedCitations[certName];
    if (citations.length === 0) return null;
    return (
      <div className="mt-2 pt-2" style={{ borderTop: `1px solid ${colors.slateLight}` }}>
        <button
          onClick={() => toggleCitationsForCert(certName)}
          className="flex items-center gap-2 text-xs hover:bg-gray-100 px-2 py-1 rounded transition-colors"
          style={{ color: colors.primaryBlue }}
        >
          <BookOpen className="w-3 h-3" />
          {isExp ? 'Hide' : 'View'} Citations ({citations.length})
          <ChevronDown className={`w-3 h-3 transition-transform ${isExp ? 'rotate-180' : ''}`} />
        </button>
        {isExp && (
          <div className="mt-2 space-y-1">
            {citations.map((citation, index) => (
              <div
                key={citation.id || index}
                className="text-xs p-2 rounded"
                style={{ background: colors.grayLight, color: colors.textGray, borderLeft: `2px solid ${colors.primaryBlue}` }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="font-medium mb-1" style={{ color: colors.textDark }}>{citation.title}</div>
                    <div className="text-xs space-y-1">
                      {citation.authors && <div><strong>Authors:</strong> {citation.authors}</div>}
                      {citation.journal && <div><strong>Journal:</strong> {citation.journal}</div>}
                      {citation.year && <div><strong>Year:</strong> {citation.year}</div>}
                      {citation.type && (
                        <span className="inline-block px-1.5 py-0.5 rounded text-xs" style={{ background: colors.lightBlue, color: colors.primaryBlue, fontSize: '0.7rem' }}>
                          {citation.type}
                        </span>
                      )}
                      {citation.pmcId && <div className="mt-1"><strong>PMC:</strong> {citation.pmcId}</div>}
                      {citation.pubmedId && <div><strong>PubMed ID:</strong> {citation.pubmedId}</div>}
                      {citation.doi && <div><strong>DOI:</strong> {citation.doi}</div>}
                    </div>
                  </div>
                  {citation.url && (
                    <a href={citation.url} target="_blank" rel="noopener noreferrer"
                      className="flex-shrink-0 p-1 hover:bg-white rounded transition-colors"
                      style={{ color: colors.primaryBlue }} title="Open citation link">
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const SubScoreSection = ({ cert }) => {
    const isExp = expandedSubScores[cert.name];
    return (
      <div className="mt-2 pt-2" style={{ borderTop: `1px solid ${colors.slateLight}` }}>
        <button
          onClick={() => toggleSubScores(cert.name)}
          className="flex items-center gap-2 text-xs hover:bg-gray-100 px-2 py-1 rounded transition-colors"
          style={{ color: colors.textGray }}
        >
          <SlidersHorizontal className="w-3 h-3" />
          {isExp ? 'Hide' : 'Show'} Score Breakdown
          <ChevronDown className={`w-3 h-3 transition-transform ${isExp ? 'rotate-180' : ''}`} />
        </button>
        {isExp && (
          <div className="mt-3 space-y-3">
            {DIMENSION_KEYS.map(key => {
              const val = cert.subScores[key] || 0;
              const barColor = DIMENSION_BAR_COLORS[key];
              const justification = cert.justifications && cert.justifications[key];
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium" style={{ color: colors.textDark }}>
                      {DIMENSION_LABELS[key]}
                      <span className="ml-1 font-normal text-xs" style={{ color: colors.textGray }}>
                        (weight: {weights[key]}%)
                      </span>
                    </span>
                    <span className="text-xs font-semibold" style={{ color: colors.textDark }}>{val}/100</span>
                  </div>
                  <div className="w-full rounded-full h-2 mb-1" style={{ background: colors.slateLight }}>
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{ width: `${val}%`, background: barColor }}
                    />
                  </div>
                  {justification && (
                    <p className="text-xs mt-1" style={{ color: colors.textGray, lineHeight: '1.4' }}>
                      {justification}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mb-6" style={{ background: 'white', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)', border: `1px solid ${colors.slateLight}` }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <h2 className="text-base md:text-lg font-semibold" style={{ color: colors.textDark }}>
            Evidence-Based Certification Rankings
          </h2>
          <span className="text-xs px-2 py-1" style={{ background: colors.lightBlue, color: colors.primaryBlue, borderRadius: '4px' }}>
            110 Ranked
          </span>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm transition-all w-full sm:w-auto justify-center"
          style={{
            background: isExpanded ? colors.primaryBlue : 'white',
            color: isExpanded ? 'white' : colors.primaryBlue,
            border: `1px solid ${colors.primaryBlue}`,
            cursor: 'pointer',
          }}
        >
          {isExpanded ? 'Collapse' : 'Expand'}
          <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
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
              borderRadius: '4px',
            }}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Adjust Scoring Weights
            <ChevronDown className={`w-3 h-3 transition-transform ${showWeights ? 'rotate-180' : ''}`} />
          </button>

          {showWeights && (
            <div className="p-4 mb-4 rounded" style={{ background: colors.grayLight, border: `1px solid ${colors.slateLight}` }}>
              <p className="text-xs mb-3" style={{ color: colors.textGray }}>
                Drag sliders to adjust how each dimension is weighted. Weights must sum to 100% — other dimensions adjust proportionally.
              </p>
              <div className="space-y-4">
                {DIMENSION_KEYS.map(key => (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <span className="text-sm font-medium" style={{ color: colors.textDark }}>
                          {DIMENSION_LABELS[key]}
                        </span>
                        <p className="text-xs mt-0.5" style={{ color: colors.textGray }}>
                          {DIMENSION_DESCRIPTIONS[key]}
                        </p>
                      </div>
                      <span
                        className="text-sm font-bold ml-4 px-2 py-0.5 rounded"
                        style={{ background: colors.primaryBlue, color: 'white', minWidth: '44px', textAlign: 'center' }}
                      >
                        {weights[key]}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={weights[key]}
                      onChange={e => handleWeightChange(key, parseInt(e.target.value, 10))}
                      className="w-full"
                      style={{ accentColor: DIMENSION_BAR_COLORS[key] }}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-3 flex justify-between items-center">
                <span className="text-xs" style={{ color: colors.textGray }}>
                  Total: {Object.values(weights).reduce((s, v) => s + v, 0)}%
                </span>
                <button
                  onClick={() => setWeights(DEFAULT_WEIGHTS)}
                  className="text-xs px-2 py-1 rounded"
                  style={{ background: 'white', color: colors.primaryBlue, border: `1px solid ${colors.primaryBlue}`, cursor: 'pointer' }}
                >
                  Reset to defaults
                </button>
              </div>
            </div>
          )}
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
        </div>

      {/* Tier Filter + Search */}
      <div className="mb-4 flex flex-col md:flex-row gap-3">
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
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
          <input
            type="text"
            placeholder="Search certifications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-1.5 text-sm w-full md:w-auto"
            style={{ border: `1px solid ${colors.slateLight}`, background: colors.grayLight, minWidth: '200px' }}
          />
        </div>

      {/* Certification List */}
      <div className="space-y-2">
        {filteredCerts.map((cert) => (
          <div
            key={cert.name}
            className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3 p-3 transition-all hover:bg-gray-50"
            style={{
              background: colors.grayLight,
              borderLeft: `3px solid ${getBorderColor(cert.computedScore)}`,
            }}
          >
            {/* Rank + Score (mobile: side by side) */}
            <div className="flex items-center justify-between sm:contents">
              <div className="text-center" style={{ minWidth: '40px' }}>
                <div className="text-xs" style={{ color: colors.textGray }}>Rank</div>
                <div className="font-semibold" style={{ color: colors.textDark }}>#{cert.rank}</div>
              </div>
              <div className="sm:hidden">
                <div
                  className="px-3 py-1 font-semibold text-center"
                  style={{ ...getScoreStyle(cert.computedScore), borderRadius: '4px', fontSize: '0.875rem', minWidth: '52px' }}
                >
                  {cert.computedScore}
                </div>
                <div className="text-center text-xs mt-0.5" style={{ color: colors.textGray }}>/ 100</div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="font-medium text-sm sm:text-base" style={{ color: colors.textDark }}>
                  {cert.name}
                </span>
                <span
                  className="text-xs px-2 py-0.5"
                  style={{ ...getTypeStyle(cert.type), borderRadius: '3px', fontWeight: '500' }}
                >
                  {cert.type}
                </span>
                <span className="text-xs" style={{ color: colors.textGray }}>{cert.discipline}</span>
              </div>
              <div className="text-xs sm:text-sm mb-1" style={{ color: colors.textGray }}>
                {cert.evidence}
              </div>
              <SubScoreSection cert={cert} />
              <CitationSection certName={cert.name} />
            </div>

            {/* Score (desktop) */}
            <div className="hidden sm:block text-center flex-shrink-0" style={{ minWidth: '64px' }}>
              <div
                className="px-3 py-1 font-semibold"
                style={{ ...getScoreStyle(cert.computedScore), borderRadius: '4px', fontSize: '0.875rem' }}
              >
                {cert.computedScore}
              </div>
              <div className="text-xs mt-0.5" style={{ color: colors.textGray }}>/ 100</div>
            </div>
          </div>
        ))}
      </div>

      {!isExpanded && (
        <div className="mt-3 pt-3 text-center" style={{ borderTop: `1px solid ${colors.slateLight}` }}>
          <p className="text-sm" style={{ color: colors.textGray }}>
            Showing top 5 evidence-based certifications. Click expand to view all 110 ranked certifications with adjustable weights.
          </p>
        </div>
      )}

      {/* Footer info */}
      {isExpanded && (
        <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${colors.slateLight}` }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2" style={{ color: colors.textDark }}>About This Matrix</h4>
              <p style={{ color: colors.textGray, fontSize: '0.813rem', lineHeight: '1.5' }}>
                Evidence-based rankings of 110 rehabilitation certifications. Scores are computed dynamically from 5 sub-dimensions — adjust weights above to personalize the ranking to your priorities.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2" style={{ color: colors.textDark }}>Scoring Methodology</h4>
              <p style={{ color: colors.textGray, fontSize: '0.813rem', lineHeight: '1.5' }}>
                {Object.entries(weights).map(([k, v]) => `${DIMENSION_LABELS[k]} ${v}%`).join(' • ')}
              </p>
              <button
                onClick={() => setShowMethodology(true)}
                className="text-xs mt-2 flex items-center gap-1 hover:underline"
                style={{ color: colors.primaryBlue, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                <Info className="w-3 h-3" />
                View Full Methodology →
              </button>
            </div>
            <div>
              <h4 className="font-medium mb-2" style={{ color: colors.textDark }}>Key Finding</h4>
              <p style={{ color: colors.textGray, fontSize: '0.813rem', lineHeight: '1.5' }}>
                Most credential-specific outcome evidence is absent — scores reflect evidence for the intervention, not the credential. Expand any row to see the scoring rationale.
              </p>
              <button
                onClick={() => setShowCitations(!showCitations)}
                className="text-xs mt-2"
                style={{ color: colors.primaryBlue, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                View All {totalCitations} Citations →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Citations Modal */}
      {showCitations && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowCitations(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-4xl max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            style={{ width: '90%' }}
          >
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold" style={{ color: colors.textDark }}>
                Complete Evidence-Based Certification Research Citations
              </h3>
              <button onClick={() => setShowCitations(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              <div className="mb-4 p-3 rounded" style={{ background: colors.lightBlue }}>
                <p className="text-sm" style={{ color: colors.primaryBlue }}>
                  <strong>{totalCitations} Citations</strong> from evidence-based rehabilitation certification research.
                  Citations are organized by certification type and include peer-reviewed studies, systematic reviews,
                  meta-analyses, and professional guidelines.
                </p>
              </div>
              <div className="space-y-6">
                {Object.entries(citationsData).map(([certName, citations]) => (
                  <div key={certName} className="border-l-4 pl-4" style={{ borderColor: colors.primaryBlue }}>
                    <h4 className="font-medium mb-2" style={{ color: colors.textDark }}>
                      {certName} ({citations.length} citations)
                    </h4>
                    <div className="space-y-2">
                      {citations.map((citation, index) => (
                        <div key={citation.id || index} className="text-sm p-2 rounded" style={{ background: colors.grayLight }}>
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex-1">
                              <div className="font-medium mb-1" style={{ color: colors.textDark }}>{citation.title}</div>
                              <div className="text-xs" style={{ color: colors.textGray }}>{formatCitation(citation)}</div>
                              {citation.type && (
                                <span className="inline-block px-2 py-0.5 rounded text-xs mt-1" style={{ background: colors.mutedTeal, color: '#0891b2', fontSize: '0.7rem' }}>
                                  {citation.type}
                                </span>
                              )}
                            </div>
                            {citation.url && (
                              <a href={citation.url} target="_blank" rel="noopener noreferrer"
                                className="flex-shrink-0 p-1 hover:bg-white rounded transition-colors"
                                style={{ color: colors.primaryBlue }} title="Open citation link">
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 border-t text-center">
              <p className="text-xs" style={{ color: colors.textGray }}>
                Citations compiled from multiple evidence-based rehabilitation certification analysis reports
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Methodology Modal */}
      {showMethodology && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowMethodology(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-4xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            style={{ width: '90%' }}
          >
            <div className="p-4 border-b flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold" style={{ color: colors.textDark }}>{METHODOLOGY_CONTENT.title}</h3>
                <p className="text-xs mt-1" style={{ color: colors.textGray }}>{METHODOLOGY_CONTENT.version}</p>
              </div>
              <button onClick={() => setShowMethodology(false)} className="text-gray-500 hover:text-gray-700 text-xl">✕</button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[75vh]">
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
