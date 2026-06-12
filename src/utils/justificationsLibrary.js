// Lazy per-cert justification loader — mirrors citationsLibrary.js.
//
// Justification strings (1-2 sentences per dimension per path) were split
// out of certificationData.js to keep ~282KB out of the client bundle.
// They're only needed in the detail pane, fetched from
// /justifications/<slug>.json on first view and cached in memory.

import meta from '../data/citations_meta.json';

const cache = new Map();    // slug -> { 'path.dim': string }
const inFlight = new Map(); // slug -> Promise

export const loadJustifications = async (certName) => {
  const entry = meta[certName];
  if (!entry?.slug) return {};
  const slug = entry.slug;

  if (cache.has(slug)) return cache.get(slug);
  if (inFlight.has(slug)) return inFlight.get(slug);

  const p = (async () => {
    try {
      const res = await fetch(`/justifications/${slug}.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const just = data?.justifications || {};
      cache.set(slug, just);
      return just;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('loadJustifications failed for', certName, err);
      // Don't cache failures — transient errors retry on next select.
      return {};
    } finally {
      inFlight.delete(slug);
    }
  })();
  inFlight.set(slug, p);
  return p;
};
