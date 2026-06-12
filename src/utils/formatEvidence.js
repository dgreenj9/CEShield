// Split a long evidence summary into readable paragraphs.
//
// Short summaries (<= 280 chars) are returned unchanged as a single
// paragraph. Longer ones are broken at sentence boundaries into paragraphs
// of up to ~300 chars, so a dense 1,000-char summary becomes 3-4 visually
// separated paragraphs instead of a wall of text. A sentence is never split
// mid-way, so an unavoidably long single sentence stays whole.
//
// Used by both the matrix detail pane (CertificationDetail) and the SSG
// credential page so they render evidence identically.

const PARAGRAPHIZE_THRESHOLD = 280; // below this, leave as one paragraph
const MAX_PARAGRAPH = 300; // flush a paragraph before it grows past this

// Abbreviations whose trailing period must NOT be treated as a sentence end.
const ABBREV = /\b(e\.g|i\.e|vs|Dr|St|approx|No|Inc|Ltd|Fig|al|U\.S|Ph\.D|M\.D)\.(\s)/g;

export function splitEvidence(text) {
  if (!text) return [];
  const clean = String(text).trim();
  if (clean.length <= PARAGRAPHIZE_THRESHOLD) return [clean];

  // Protect abbreviation periods, split on ". " before a capital / open paren,
  // then restore.
  const protectedText = clean.replace(ABBREV, '$1<DOT>$2');
  const sentences = protectedText
    .split(/(?<=[.!?])\s+(?=[A-Z(])/)
    .map((s) => s.replace(/<DOT>/g, '.').trim())
    .filter(Boolean);

  const paras = [];
  let cur = '';
  for (const s of sentences) {
    // Flush the current paragraph BEFORE adding a sentence that would push it
    // past the cap — keeps natural breakpoints (e.g. the intro sentence on
    // its own) instead of greedily over-packing the first paragraph.
    if (cur && cur.length + s.length + 1 > MAX_PARAGRAPH) {
      paras.push(cur);
      cur = '';
    }
    cur = cur ? `${cur} ${s}` : s;
  }
  if (cur) {
    // Avoid a tiny orphan trailing paragraph — fold short tails into the prior.
    if (paras.length && cur.length < 80) paras[paras.length - 1] += ` ${cur}`;
    else paras.push(cur);
  }
  return paras.length ? paras : [clean];
}
