'use client';

// The Atlas landing ("Plate I — the credential field").
//
// The product presents itself as a published survey: numbered plates and
// tables, 1px ink rules, one petrol accent, and a single showpiece scroll
// sequence (Fig. 1) in which all credentials physically settle into a
// beeswarm distribution against the score axis. Every number on this page is
// computed from the real dataset — nothing is hardcoded copy except the
// declaration of interests, which is deliberately $0.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import PublicNav from '@/components/layout/PublicNav';
import PublicFooter from '@/components/layout/PublicFooter';
import { certifications } from '@/utils/certificationData';
import { PATH_ORDER, getPathDefaultWeights } from '@/utils/careerPaths';
import { computeScore, certScoresForPath, rankCertifications } from '@/utils/certScoring';
import { A, INS, eyebrow, tabularNums, tierColor, tierLabel } from '@/components/atlas/theme';
import { lensShortLabel } from '@/components/atlas/LensTabs';
import siteStats from '@/data/siteStats.json';

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const easeIO = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a, b, t) => a + (b - a) * t;
// Deterministic per-name noise (FNV-1a) so the scattered state is stable
// across reloads and SSR/CSR render identically.
const hash = (s) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
};

// Plate geometry, in % of the 460px plate.
const X0 = 3, XW = 94, BASE = 95, STACK = 1.95, BIN = 3.1, MAXROWS = 13;

// ── Fig. 1 — the beeswarm settle ─────────────────────────────────────────
function FigureOne() {
  const [p, setP] = useState(0);
  const [reduce, setReduce] = useState(false);
  const scrollerRef = useRef(null);
  const plateRef = useRef(null);
  const [hover, setHover] = useState(null);

  // Beeswarm packing, computed once. Sort ascending by score; bin each
  // point's x, stack within the bin — capped at MAXROWS, spilling sideways
  // into alternating sub-columns so dense bins read as broad mounds.
  const { points, tiers, swarmTop, top3, median } = useMemo(() => {
    const pts = certifications.map((c) => {
      let best = 0;
      for (const key of PATH_ORDER) {
        const subs = certScoresForPath(c, key);
        if (!subs) continue;
        const sc = computeScore(subs, getPathDefaultWeights(key));
        if (sc > best) best = sc;
      }
      return { name: c.name, score: best, rx: hash(c.name), ry: hash(`${c.name}y`) };
    });
    const cols = {};
    pts.sort((a, b) => a.score - b.score).forEach((pt) => {
      const x = X0 + (pt.score / 100) * XW;
      const col = Math.round(x / BIN);
      const n = cols[col] || 0;
      const row = n % MAXROWS;
      const sub = Math.floor(n / MAXROWS);
      const offset = sub === 0 ? 0 : (sub % 2 === 1 ? 1 : -1) * Math.ceil(sub / 2) * 0.95;
      pt.tx = col * BIN + offset;
      pt.ty = BASE - row * STACK;
      cols[col] = n + 1;
      pt.color = tierColor(pt.score);
      pt.delay = clamp01(pt.tx / 100) * 0.45; // left-to-right settling sweep
    });
    const sortedScores = pts.map((q) => q.score).sort((a, b) => a - b);
    const tiers = { Strong: 0, Good: 0, Moderate: 0, Limited: 0 };
    pts.forEach((q) => { tiers[tierLabel(q.score)] += 1; });
    return {
      points: pts,
      tiers,
      swarmTop: Math.min(...pts.map((q) => q.ty)),
      top3: [...pts].sort((a, b) => b.score - a.score).slice(0, 3),
      median: Math.round(sortedScores[Math.floor(sortedScores.length / 2)]),
    };
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncReduce = () => setReduce(mq.matches);
    syncReduce();
    mq.addEventListener?.('change', syncReduce);

    let frame = 0;
    const measure = () => {
      frame = 0;
      const el = scrollerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = el.offsetHeight - window.innerHeight;
      setP(clamp01(-rect.top / Math.max(1, total)));
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(measure); };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    measure();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      mq.removeEventListener?.('change', syncReduce);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const swarmRaw = reduce ? 1 : clamp01((p - 0.16) / 0.42);
  const axisT = reduce ? 1 : easeOut(clamp01((p - 0.14) / 0.16));
  const medianT = reduce ? 1 : easeOut(clamp01((p - 0.5) / 0.12));
  const callT = reduce ? 1 : easeOut(clamp01((p - 0.66) / 0.18));
  const scene = reduce ? 3 : p < 0.24 ? 1 : p < 0.64 ? 2 : 3;

  const capStyle = (n) => ({
    gridArea: '1 / 1',
    opacity: scene === n ? 1 : 0,
    transform: scene === n ? 'translateY(0)' : 'translateY(8px)',
    transition: 'opacity 0.4s ease, transform 0.4s ease',
  });

  let measured = 0;
  const dots = points.map((pt) => {
    const local = reduce ? 1 : easeIO(clamp01((swarmRaw - pt.delay) / 0.55));
    if (local > 0.55) measured += 1;
    const sx = 4 + pt.rx * 92;
    const sy = 4 + pt.ry * 84;
    const x = lerp(sx, pt.tx, local);
    const y = lerp(sy, pt.ty, local);
    const isTop = top3.indexOf(pt) !== -1;
    const isHover = hover === pt;
    const size = isHover ? 11 : isTop ? lerp(7, 13, callT) : lerp(7, 8, local);
    const dim = isHover || isTop ? 1 : lerp(1, pt.score >= 70 ? 1 : 0.26, callT) * (hover ? 0.55 : 1);
    return {
      key: pt.name,
      style: {
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        width: size,
        height: size,
        borderRadius: '50%',
        background: pt.color,
        boxShadow: isHover ? '0 0 0 4px rgba(35,94,107,0.18)' : isTop && callT > 0.4 ? `0 0 0 ${lerp(0, 4, callT)}px rgba(35,94,107,0.16)` : 'none',
        zIndex: isHover ? 3 : undefined,
        opacity: lerp(0.34, 1, local) * dim,
        transform: 'translate(-50%, -50%)',
        transition: reduce ? 'none' : 'left 0.1s linear, top 0.1s linear, opacity 0.25s ease, width 0.15s ease, height 0.15s ease',
        willChange: 'left, top',
      },
    };
  });

  // Callout rows are derived from the actual swarm height, never hardcoded.
  const gutter = Math.max(14, (swarmTop || 50) - 18);
  const ROWS = [0, 1, 2].map((i) => 3 + (i * (gutter - 3)) / 2);
  const labels = top3.map((pt, i) => {
    const rowY = ROWS[i];
    const labelBottom = rowY + 6.2;
    return {
      key: pt.name,
      name: pt.name.length > 26 ? `${pt.name.slice(0, 24)}…` : pt.name,
      score: Math.round(pt.score),
      style: {
        position: 'absolute',
        left: `${pt.tx}%`,
        top: `${rowY}%`,
        transform: `translate(-100%, 0) translateY(${(1 - callT) * 8}px)`,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        padding: '6px 13px',
        marginLeft: -6,
        background: A.paper,
        border: `1px solid ${A.ink}`,
        whiteSpace: 'nowrap',
        opacity: callT,
        transition: reduce ? 'none' : 'opacity 0.3s ease, transform 0.3s ease',
      },
      leaderStyle: {
        position: 'absolute',
        left: `${pt.tx}%`,
        top: `${labelBottom}%`,
        width: 1,
        height: `${Math.max(0, (pt.ty - labelBottom) * callT)}%`,
        background: A.ink,
        opacity: callT * 0.55,
        transition: reduce ? 'none' : 'height 0.3s ease, opacity 0.3s ease',
      },
    };
  });

  const xAt = (v) => `${X0 + (v / 100) * XW}%`;
  const settled = reduce || swarmRaw >= 1;

  // Hover readout: nearest settled point to the pointer, within ~14px.
  const onPlateMove = (e) => {
    if (!settled || !plateRef.current) return;
    const r = plateRef.current.getBoundingClientRect();
    let best = null;
    let bestD = 14 * 14;
    for (const pt of points) {
      const dx = (pt.tx / 100) * r.width - (e.clientX - r.left);
      const dy = (pt.ty / 100) * r.height - (e.clientY - r.top);
      const d = dx * dx + dy * dy;
      if (d < bestD) { bestD = d; best = pt; }
    }
    if (best !== hover) setHover(best);
  };

  const axisTick = (v, value = String(v), accent = false) => (
    <span
      style={{
        position: 'absolute',
        bottom: -28,
        left: xAt(v),
        transform: 'translateX(-50%)',
        fontSize: 10.5,
        color: accent ? A.accent : A.inkMuted,
        fontWeight: accent ? 700 : 600,
        ...tabularNums,
      }}
    >
      {value}
    </span>
  );

  const summary = `${points.length} credentials by best-lens score at default weights: `
    + `${tiers.Strong} strong, ${tiers.Good} good, ${tiers.Moderate} moderate, ${tiers.Limited} limited. `
    + `Median ${median}. Highest: ${top3.map((t) => `${t.name} ${Math.round(t.score)}`).join(', ')}.`;

  // Tier ranges drawn under the axis: the scale carries its own legend.
  const tierBands = [
    [0, 30, A.dim], [30, 50, A.warn], [50, 70, A.accentMid], [70, 100, A.accent],
  ];

  return (
    <div id="fig1" ref={scrollerRef} style={{ height: reduce ? 'auto' : '360vh', position: 'relative' }}>
      <div className={reduce ? undefined : 'atlas-fig-sticky'} style={{ position: 'relative', overflow: 'hidden' }}>
        <figure className="atlas-wrap" style={{ maxWidth: 1200, margin: '0 auto', padding: reduce ? '5rem 2rem' : '0 2rem', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {/* Caption + act meter */}
          <div className="atlas-fig-head">
            <div style={{ display: 'grid', flex: 1, minWidth: 0 }}>
              {[
                [1, 'Fig. 1a', 'The field, unmeasured.'],
                [2, 'Fig. 1b', 'Scored, the field settles.'],
                [3, 'Fig. 1c', 'The strong few, named.'],
              ].map(([n, fig, caption]) => (
                <div key={n} style={capStyle(n)} aria-hidden={scene !== n}>
                  <span style={{ fontSize: 12, letterSpacing: '0.02em', color: A.inkMuted, fontWeight: 600 }}>{fig}</span>
                  <h2 style={{ fontFamily: INS, fontWeight: 600, fontSize: 'clamp(22px, 5.6vw, 29px)', lineHeight: 1.1, letterSpacing: '-0.03em', margin: '3px 0 0' }}>{caption}</h2>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0, paddingBottom: 4 }}>
              <span style={{ fontSize: 12, letterSpacing: '0.02em', color: A.inkMuted, fontWeight: 600, ...tabularNums }}>
                n = {measured} measured
              </span>
              <span style={{ display: 'flex', gap: 4 }} aria-hidden="true">
                {[1, 2, 3].map((n) => (
                  <span key={n} style={{ width: 26, height: 3, display: 'inline-block', background: scene >= n ? A.accent : A.ruleMinor, transition: 'background 0.3s ease' }} />
                ))}
              </span>
            </div>
          </div>

          {/* The plate */}
          <div
            ref={plateRef}
            role="img"
            aria-label={summary}
            onPointerMove={onPlateMove}
            onPointerLeave={() => setHover(null)}
            style={{ position: 'relative', height: 'min(460px, 52vh)', minHeight: 300, marginTop: '2.25rem', borderLeft: `1px solid ${A.ink}`, cursor: settled ? 'crosshair' : 'default' }}
          >
            <span aria-hidden="true" style={{ position: 'absolute', left: 0, bottom: 0, height: 1, width: `${axisT * 100}%`, background: A.ink, transition: reduce ? 'none' : 'width 0.2s ease' }} />
            {tierBands.map(([lo, hi, color]) => (
              <span
                key={lo}
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  bottom: -6,
                  height: 3,
                  left: lo === 0 ? 0 : xAt(lo),
                  width: lo === 0 ? xAt(hi) : `${((hi - lo) / 100) * XW}%`,
                  background: color,
                  opacity: axisT,
                  transition: reduce ? 'none' : 'opacity 0.3s ease',
                }}
              />
            ))}
            {[30, 50, 70].map((v) => (
              <span key={v} aria-hidden="true" style={{ position: 'absolute', left: xAt(v), bottom: 0, width: 1, height: `${axisT * 100}%`, background: A.ink, opacity: 0.09 }} />
            ))}
            <span aria-hidden="true" style={{ position: 'absolute', left: xAt(median), bottom: 0, width: 1, height: `${medianT * 62}%`, background: A.warn, opacity: medianT * (1 - callT * 0.7), transition: reduce ? 'none' : 'height 0.3s ease, opacity 0.3s ease' }}>
              <span style={{ position: 'absolute', top: -19, left: 6, fontSize: 11.5, letterSpacing: '0.02em', fontWeight: 700, color: A.warn, whiteSpace: 'nowrap', ...tabularNums }}>
                Median {median}
              </span>
            </span>
            {dots.map((d) => (
              <span key={d.key} aria-hidden="true" style={d.style} />
            ))}
            {labels.map((lab) => (
              <React.Fragment key={lab.key}>
                <span aria-hidden="true" style={lab.leaderStyle} />
                <span aria-hidden="true" style={{ ...lab.style, opacity: hover ? lab.style.opacity * 0.3 : lab.style.opacity }}>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: A.accent, ...tabularNums }}>{lab.score}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>{lab.name}</span>
                </span>
              </React.Fragment>
            ))}
            {hover && (
              <span
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  left: `${hover.tx}%`,
                  top: `${hover.ty}%`,
                  transform: `translate(${hover.tx > 55 ? 'calc(-100% - 14px)' : '14px'}, -50%)`,
                  zIndex: 4,
                  background: A.paper,
                  border: `1px solid ${A.ink}`,
                  padding: '7px 11px',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600, color: A.ink, maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis' }}>{hover.name}</span>
                <span style={{ fontSize: 11.5, fontWeight: 600, color: A.inkMuted, ...tabularNums }}>
                  <span style={{ color: tierColor(hover.score), fontWeight: 700 }}>{Math.round(hover.score)}</span> · {tierLabel(hover.score)} · best lens
                </span>
              </span>
            )}
            <span aria-hidden="true" style={{ position: 'absolute', inset: 0, opacity: axisT, transition: 'opacity 0.3s ease', pointerEvents: 'none' }}>
              {axisTick(0)}
              {axisTick(30)}
              {axisTick(50)}
              {axisTick(70)}
              {axisTick(100, '100', true)}
            </span>
          </div>

          {/* Legend: every tier color paired with its word and its count. */}
          <figcaption className="atlas-fig-legend">
            {[
              ['Strong', '≥70', A.accent],
              ['Good', '50–69', A.accentMid],
              ['Moderate', '30–49', A.warn],
              ['Limited', '<30', A.dim],
            ].map(([label, range, color]) => (
              <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap' }}>
                <span aria-hidden="true" style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: color }} />
                {label}
                <span style={{ color: A.inkMuted, fontWeight: 500, ...tabularNums }}>{range} · n {tiers[label]}</span>
              </span>
            ))}
            <span className="atlas-fig-note">One point per credential · best lens · default weights</span>
          </figcaption>
        </figure>
      </div>
    </div>
  );
}

// ── The page ─────────────────────────────────────────────────────────────
export default function LandingPageClient() {
  const lensRows = useMemo(
    () => PATH_ORDER.map((key) => {
      const ranked = rankCertifications(certifications, getPathDefaultWeights(key), key);
      const top = ranked[0];
      return {
        key,
        label: lensShortLabel(key),
        count: ranked.length,
        topPick: top.name,
        topScore: Math.round(top.computedScore),
      };
    }),
    [],
  );

  const stats = [
    [siteStats.certCount.toLocaleString(), 'credentials'],
    [siteStats.citationTotal.toLocaleString(), 'citations'],
    [siteStats.rctSrMa.toLocaleString(), 'RCT · SR · meta-analyses'],
    [String(siteStats.lensCount), 'career lenses'],
  ];

  const underlineLink = {
    display: 'inline-block',
    fontWeight: 600,
    fontSize: 14.5,
    color: A.accent,
    textDecoration: 'none',
    borderBottom: `2px solid ${A.accent}`,
    paddingBottom: 2,
  };

  return (
    <div className="atlas-ground" style={{ minHeight: '100vh', color: A.ink, overflowX: 'clip' }}>
      <PublicNav
        maxWidth={1200}
        cta={(
          <>
            <Link href="/sign-in" className="atlas-nav-signin">
              Sign in
            </Link>
            <Link href="/matrix" className="atlas-btn atlas-btn-primary atlas-btn-sm">
              Explore the field →
            </Link>
          </>
        )}
      />

      <main id="main">
        {/* Hero */}
        <header className="atlas-wrap atlas-hero" style={{ maxWidth: 1200, margin: '0 auto', padding: '7rem 2rem 5.5rem' }}>
          <h1 style={{ fontFamily: INS, fontWeight: 600, fontSize: 'clamp(46px, 7.4vw, 96px)', lineHeight: 0.94, letterSpacing: '-0.045em', margin: 0, maxWidth: '11em', textWrap: 'balance' }}>
            {siteStats.certCount} credentials, scored and cited.
          </h1>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '2rem 3rem', marginTop: '2.5rem', flexWrap: 'wrap' }}>
            <p style={{ fontSize: 'clamp(17px, 2.2vw, 19px)', lineHeight: 1.55, color: A.inkBody, margin: 0, maxWidth: '24em', textWrap: 'pretty' }}>
              {siteStats.citationTotal.toLocaleString()} curated citations, five career lenses. Built by practicing PTs.
            </p>
            <div style={{ display: 'flex', gap: 22, alignItems: 'center', flexWrap: 'wrap' }}>
              <Link href="/matrix" className="atlas-btn atlas-btn-primary" style={{ fontSize: 15.5, padding: '15px 26px' }}>
                Explore the field →
              </Link>
              <Link href="/methodology" className="atlas-ink-link" style={{ textDecoration: 'none', fontWeight: 600, fontSize: 14.5, color: A.ink, borderBottom: `2px solid ${A.ink}`, paddingBottom: 2 }}>
                Methodology
              </Link>
            </div>
          </div>
        </header>

        {/* Stat band */}
        <section aria-label="By the numbers" style={{ borderTop: `1px solid ${A.ink}`, borderBottom: `1px solid ${A.ink}` }}>
          <dl className="atlas-wrap atlas-stats" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 2rem' }}>
            {stats.map(([value, label]) => (
              <div key={label}>
                <dt style={{ display: 'block', fontSize: 12.5, letterSpacing: '0.02em', color: A.inkMuted, fontWeight: 600, marginTop: 3, order: 2 }}>{label}</dt>
                <dd style={{ margin: 0, fontFamily: INS, fontSize: 27, fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1.15, order: 1, ...tabularNums }}>{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Fig. 1 — the scroll showpiece */}
        <FigureOne />

        {/* Table 2 — the five lenses */}
        <section aria-label="The five lenses" style={{ borderTop: `1px solid ${A.ink}`, background: A.band }}>
          <div className="atlas-wrap atlas-section" style={{ maxWidth: 1200, margin: '0 auto', padding: '6rem 2rem' }}>
            <div className="atlas-lens-split">
              <div>
                <h2 style={{ fontFamily: INS, fontWeight: 600, fontSize: 'clamp(32px, 4.4vw, 44px)', lineHeight: 0.98, letterSpacing: '-0.04em', margin: 0, textWrap: 'balance' }}>
                  One rubric per career.
                </h2>
                <p style={{ fontSize: 15.5, color: A.inkMuted, lineHeight: 1.6, margin: '1rem 0 0' }}>
                  Scores aren&rsquo;t comparable across lenses, deliberately.
                </p>
                <Link href="/career-paths" className="atlas-link" style={{ ...underlineLink, marginTop: '1.4rem' }}>
                  The lens definitions →
                </Link>
              </div>
              <div>
                <div aria-hidden="true" className="atlas-lens-row atlas-lens-head">
                  <span style={{ gridArea: 'lens' }}>Lens</span>
                  <span style={{ gridArea: 'n', textAlign: 'right' }}>Scored</span>
                  <span style={{ gridArea: 'pick' }}>Top credential</span>
                  <span style={{ gridArea: 'score', textAlign: 'right' }}>Score</span>
                </div>
                {lensRows.map((lens) => (
                  <Link
                    key={lens.key}
                    href={`/matrix?lens=${lens.key}`}
                    className="atlas-lens-row atlas-row"
                    aria-label={`${lens.label} lens: ${lens.count} scored, top credential ${lens.topPick}, ${lens.topScore}`}
                  >
                    <span style={{ gridArea: 'lens', fontFamily: INS, fontWeight: 600, fontSize: 17, letterSpacing: '-0.02em', color: A.ink }}>{lens.label}</span>
                    <span style={{ gridArea: 'n', fontSize: 12.5, color: A.inkMuted, fontWeight: 600, textAlign: 'right', ...tabularNums }}>{lens.count}</span>
                    <span title={lens.topPick} style={{ gridArea: 'pick', fontSize: 14.5, fontWeight: 500, color: A.inkBody, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lens.topPick}</span>
                    <span style={{ gridArea: 'score', fontFamily: INS, fontSize: 18, fontWeight: 600, color: A.accent, textAlign: 'right', letterSpacing: '-0.02em', ...tabularNums }}>
                      {lens.topScore}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Notes — what an account adds */}
        <section aria-label="Beyond the field" style={{ borderTop: `1px solid ${A.ink}` }}>
          <div className="atlas-wrap atlas-section" style={{ maxWidth: 1200, margin: '0 auto', padding: '6rem 2rem' }}>
            <h2 style={{ fontFamily: INS, fontWeight: 600, fontSize: 29, letterSpacing: '-0.03em', margin: '0 0 2.25rem' }}>
              What an account adds
            </h2>
            <div className="atlas-4col atlas-notes">
              {[
                ['a.', 'The Ledger', 'Compliance, computed live.', '/compliance'],
                ['b.', 'Dossiers', `${siteStats.certCount} published evidence pages.`, '/credentials'],
                ['c.', 'The CV', 'Your credentials, with evidence attached.', '/profile'],
                ['d.', 'Exports', 'The audit binder, one click.', '/compliance'],
              ].map(([index, title, copy, href]) => (
                <Link key={title} href={href} className="atlas-note" style={{ textDecoration: 'none', borderTop: `2px solid ${A.ink}`, paddingTop: 16, color: 'inherit' }}>
                  <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: A.accent, marginBottom: 8 }}>{index}</span>
                  <span className="atlas-note-title" style={{ display: 'block', fontFamily: INS, fontWeight: 600, fontSize: 20, letterSpacing: '-0.025em' }}>{title}</span>
                  <span style={{ display: 'block', fontSize: 14, color: A.inkMuted, marginTop: 5, lineHeight: 1.5 }}>{copy}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Declaration of interests */}
        <section aria-label="Declaration of interests" style={{ borderTop: `1px solid ${A.ink}`, background: A.band }}>
          <div className="atlas-wrap atlas-section" style={{ maxWidth: 1200, margin: '0 auto', padding: '7rem 2rem', textAlign: 'center' }}>
            <div style={eyebrow(13)}>Declaration of interests</div>
            <div style={{ fontFamily: INS, fontSize: 'clamp(96px, 14vw, 190px)', fontWeight: 600, lineHeight: 1, letterSpacing: '-0.055em', color: A.ink, margin: '1.5rem 0 1rem', ...tabularNums }}>
              $0
            </div>
            <p style={{ fontSize: 'clamp(16px, 2vw, 18px)', color: A.inkBody, margin: '0 auto', maxWidth: '30em', textWrap: 'balance' }}>from the programs we score. No ads. No sponsored rankings.</p>
            <Link href="/methodology" className="atlas-link" style={{ ...underlineLink, marginTop: '1.5rem' }}>
              Methodology, limitations included →
            </Link>
          </div>
        </section>

        {/* Closing */}
        <section aria-label="Closing" style={{ borderTop: `1px solid ${A.ink}` }}>
          <div className="atlas-wrap atlas-section" style={{ maxWidth: 1200, margin: '0 auto', padding: '5rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2rem 3rem', flexWrap: 'wrap' }}>
            <h2 style={{ fontFamily: INS, fontWeight: 600, fontSize: 'clamp(30px, 4.6vw, 46px)', lineHeight: 0.98, letterSpacing: '-0.04em', margin: 0, maxWidth: '13em', textWrap: 'balance' }}>
              See where your next credential lands.
            </h2>
            <Link href="/matrix" className="atlas-btn atlas-btn-primary" style={{ fontSize: 16, padding: '16px 28px' }}>
              Explore the field, free →
            </Link>
          </div>
        </section>
      </main>

      <PublicFooter maxWidth={1200} />
    </div>
  );
}
