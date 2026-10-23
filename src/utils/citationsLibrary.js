// Unified citation library — split storage.
//
// Synchronous (small): src/data/citations_meta.json
//   Per-cert: source, last_reviewed, count, evidence_mix, slug.
//   Used by list rows, score badges, and the methodology stats page.
//
// Async (per-cert): public/citations/<slug>.json
//   Full citations list, fetched only when the user lands on a cert's
//   detail pane. Each is ~10–200KB, network-cached.
//
// See scripts/split_citations.py for the build step.

import meta from '../data/citations_meta.json';

export const EVIDENCE_LABELS = {
  meta_analysis: 'Meta-analysis',
  systematic_review: 'Systematic review',
  rct: 'RCT',
  guideline: 'Clinical guideline',
  cohort: 'Cohort study',
  case_control: 'Case-control',
  cross_sectional: 'Cross-sectional',
  case_series: 'Case series',
  pilot: 'Pilot/feasibility',
  protocol: 'Study protocol',
  qualitative: 'Qualitative',
  narrative: 'Narrative review',
  government_dataset: 'Government dataset',
  unknown: 'Other',
};

// Strength ranking (higher = stronger). Used by scoring + UI sort.
export const EVIDENCE_STRENGTH = {
  meta_analysis: 6,
  systematic_review: 5,
  rct: 4,
  guideline: 4,
  cohort: 3,
  case_control: 2,
  cross_sectional: 2,
  pilot: 2,
  case_series: 1,
  qualitative: 1,
  narrative: 1,
  protocol: 1,
  unknown: 0,
};

// Metadata-only accessors — synchronous, no network.

export const citationLibrary = meta;

export const getLibraryMetaForCertification = (name) => {
  const entry = meta[name];
  if (!entry) return { source: 'none', last_reviewed: null, count: 0, slug: null, year_dist: {} };
  return {
    source: entry.source,
    last_reviewed: entry.last_reviewed,
    count: entry.count,
    slug: entry.slug,
    year_dist: entry.year_dist || {},
  };
};

export const getEvidenceMix = (name) => {
  const entry = meta[name];
  return entry?.evidence_mix ? { ...entry.evidence_mix } : {};
};

export const getEvidenceStrengthScore = (name) => {
  const mix = getEvidenceMix(name);
  let total = 0;
  let weighted = 0;
  for (const [type, n] of Object.entries(mix)) {
    const w = EVIDENCE_STRENGTH[type] ?? 0;
    weighted += w * n;
    total += n;
  }
  return total > 0 ? weighted / total : 0;
};

export const getTotalCitationsCount = () => {
  let total = 0;
  for (const entry of Object.values(meta)) {
    total += entry.count || 0;
  }
  return total;
};

// Async citation loader — fetches per-cert file from /citations/<slug>.json.
// In-memory cache so a re-select is instant; we don't refetch.

const citationsCache = new Map();   // slug -> array<citation>
const inFlight = new Map();         // slug -> Promise<array>

// Some upstream bibliographic records arrive HTML-escaped ("Journal of
// Manual &amp; Manipulative Therapy"). Decode the handful of entities at
// display time so the data files stay untouched.
const ENTITY = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&apos;': "'" };
export const decodeEntities = (s) =>
  (typeof s === 'string' ? s.replace(/&(amp|lt|gt|quot|#39|apos);/g, (m) => ENTITY[m] || m) : s);
export const cleanCitation = (c) => (c && typeof c === 'object'
  ? { ...c, title: decodeEntities(c.title), authors: decodeEntities(c.authors), journal: decodeEntities(c.journal) }
  : c);

export const loadCitations = async (name) => {
  const entry = meta[name];
  if (!entry || !entry.slug) return [];
  const slug = entry.slug;

  if (citationsCache.has(slug)) return citationsCache.get(slug);
  if (inFlight.has(slug)) return inFlight.get(slug);

  const fetchPromise = (async () => {
    try {
      const url = `/citations/${slug}.json`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list = Array.isArray(data?.citations) ? data.citations.map(cleanCitation) : [];
      citationsCache.set(slug, list);
      return list;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('loadCitations failed for', name, err);
      // Do NOT cache failures — a transient network error must not show
      // "no citations" for the rest of the session. Next select retries.
      return [];
    } finally {
      inFlight.delete(slug);
    }
  })();
  inFlight.set(slug, fetchPromise);
  return fetchPromise;
};

// Optional prefetch — call when hovering a list row to warm the cache.
export const prefetchCitations = (name) => {
  const entry = meta[name];
  if (!entry || !entry.slug) return;
  if (citationsCache.has(entry.slug) || inFlight.has(entry.slug)) return;
  // Fire and forget.
  loadCitations(name);
};

// Pure citation helpers — unchanged. Used by the detail pane after load.

export const formatCitation = (citation) => {
  if (!citation) return '';
  const { authors, year, title, journal, volume, issue, pages, doi, pmid } = citation;
  let out = '';
  if (authors) out += authors;
  if (year) out += ` (${year})`;
  if (title) out += `. ${title}`;
  if (journal) out += `. ${journal}`;
  if (volume) out += `, ${volume}`;
  if (issue) out += `(${issue})`;
  if (pages) out += `, ${pages}`;
  if (doi) out += `. https://doi.org/${doi}`;
  else if (pmid) out += `. PMID: ${pmid}`;
  if (!out.endsWith('.')) out += '.';
  return out.trim();
};

// Only http(s) URLs are linkable. Citation JSON is partly agent-generated —
// a javascript: or data: scheme in a url field must never reach an href.
const safeHttpUrl = (raw) => {
  if (typeof raw !== 'string') return null;
  return /^https?:\/\//i.test(raw.trim()) ? raw.trim() : null;
};

export const citationUrl = (c) => {
  if (!c) return null;
  if (c.doi) return `https://doi.org/${encodeURIComponent(c.doi).replace(/%2F/gi, '/')}`;
  if (c.pmid) return `https://pubmed.ncbi.nlm.nih.gov/${encodeURIComponent(String(c.pmid))}/`;
  const direct = safeHttpUrl(c.url);
  if (direct) return direct;
  return safeHttpUrl(c.library_link);
};
