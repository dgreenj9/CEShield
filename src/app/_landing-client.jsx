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
import { certifications } from '@/utils/certificationData';
import { PATH_ORDER, getPathDefaultWeights } from '@/utils/careerPaths';
import { computeScore, certScoresForPath, rankCertifications } from '@/utils/certScoring';
import { A, FIG, INS, eyebrow, tabularNums, tierColor } from '@/components/atlas/theme';
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

  // Beeswarm packing, computed once. Sort ascending by score; bin each
  // point's x, stack within the bin — capped at MAXROWS, spilling sideways
  // into alternating sub-columns so dense bins read as broad mounds.
  const { points, swarmTop, top3, median } = useMemo(() => {
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
    return {
      points: pts,
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

    let last = 0;
    let trail = null;
    const onScroll = () => {
      const now = performance.now();
      if (now - last < 28) {
        if (!trail) trail = setTimeout(() => { trail = null; onScroll(); }, 40);
        return;
      }
      last = now;
      const el = scrollerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = el.offsetHeight - window.innerHeight;
      setP(clamp01(-rect.top / Math.max(1, total)));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      mq.removeEventListener?.('change', syncReduce);
      if (trail) clearTimeout(trail);
    };
  }, []);

  const swarmRaw = reduce ? 1 : clamp01((p - 0.16) / 0.42);
  const axisT = reduce ? 1 : easeOut(clamp01((p - 0.14) / 0.16));
  const medianT = reduce ? 1 : easeOut(clamp01((p - 0.5) / 0.12));
  const callT = reduce ? 1 : easeOut(clamp01((p - 0.66) / 0.18));
  const scene = reduce ? 3 : p < 0.24 ? 1 : p < 0.64 ? 2 : 3;

  const capStyle = (n) => ({
    position: 'absolute',
    inset: 0,
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
    const size = isTop ? lerp(7, 13, callT) : lerp(7, 8, local);
    const dim = isTop ? 1 : lerp(1, pt.score >= 70 ? 1 : 0.26, callT);
    return {
      key: pt.name,
      title: `${pt.name} · ${Math.round(pt.score)}`,
      style: {
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        width: size,
        height: size,
        borderRadius: '50%',
        background: pt.color,
        boxShadow: isTop && callT > 0.4 ? `0 0 0 ${lerp(0, 4, callT)}px rgba(35,94,107,0.16)` : 'none',
        opacity: lerp(0.34, 1, local) * dim,
        transform: 'translate(-50%, -50%)',
        transition: reduce ? 'none' : 'left 0.1s linear, top 0.1s linear, opacity 0.25s ease',
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

  const axisTick = (leftProp, value, accent = false) => (
    <span
      style={{
        position: 'absolute',
        bottom: -26,
        ...leftProp,
        fontSize: 10.5,
        color: accent ? A.accent : A.inkMuted,
        fontWeight: accent ? 700 : 600,
        ...tabularNums,
      }}
    >
      {value}
    </span>
  );

  return (
    <div id="fig1" ref={scrollerRef} style={{ height: reduce ? '100vh' : '360vh', position: 'relative' }}>
      <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 2rem', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {/* Caption + act meter */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '2rem' }}>
            <div style={{ position: 'relative', height: 52, flex: 1, minWidth: 0 }}>
              {[
                [1, 'Fig. 1a', 'The field, unmeasured.'],
                [2, 'Fig. 1b', 'Scored, the field settles.'],
                [3, 'Fig. 1c', 'The strong few, named.'],
              ].map(([n, fig, caption]) => (
                <div key={n} style={capStyle(n)}>
                  <span style={{ fontSize: 12, letterSpacing: '0.02em', color: A.inkMuted, fontWeight: 600 }}>{fig}</span>
                  <h2 style={{ fontFamily: INS, fontWeight: 600, fontSize: 29, letterSpacing: '-0.03em', margin: '3px 0 0' }}>{caption}</h2>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0, paddingBottom: 4 }}>
              <span style={{ fontSize: 12, letterSpacing: '0.02em', color: A.inkMuted, fontWeight: 600, ...tabularNums }}>
                n = {String(measured).padStart(3, '0')} measured
              </span>
              <span style={{ display: 'flex', gap: 4 }} aria-hidden="true">
                {[1, 2, 3].map((n) => (
                  <span key={n} style={{ width: 26, height: 3, display: 'inline-block', background: scene >= n ? A.accent : A.ruleMinor, transition: 'background 0.3s ease' }} />
                ))}
              </span>
            </div>
          </div>

          {/* The plate */}
          <div style={{ position: 'relative', height: 460, marginTop: '2.25rem', borderLeft: `1px solid ${A.ink}` }}>
            <span aria-hidden="true" style={{ position: 'absolute', left: 0, bottom: 0, height: 1, width: `${axisT * 100}%`, background: A.ink, transition: reduce ? 'none' : 'width 0.2s ease' }} />
            {[30, 50, 70].map((v) => (
              <span key={v} aria-hidden="true" style={{ position: 'absolute', left: `${X0 + (v / 100) * XW}%`, bottom: 0, width: 1, height: `${axisT * 100}%`, background: A.ink, opacity: 0.09 }} />
            ))}
            <span aria-hidden="true" style={{ position: 'absolute', left: `${X0 + (median / 100) * XW}%`, bottom: 0, width: 1, height: `${medianT * 62}%`, background: A.warn, opacity: medianT * (1 - callT * 0.7), transition: reduce ? 'none' : 'height 0.3s ease, opacity 0.3s ease' }}>
              <span style={{ position: 'absolute', top: -19, left: 6, fontSize: 11.5, letterSpacing: '0.02em', fontWeight: 700, color: A.warn, whiteSpace: 'nowrap' }}>
                Median {median}
              </span>
            </span>
            {dots.map((d) => (
              <span key={d.key} title={d.title} style={d.style} />
            ))}
            {labels.map((lab) => (
              <React.Fragment key={lab.key}>
                <span aria-hidden="true" style={lab.leaderStyle} />
                <span style={lab.style}>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: A.accent, ...tabularNums }}>{lab.score}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>{lab.name}</span>
                </span>
              </React.Fragment>
            ))}
            <span aria-hidden="true" style={{ position: 'absolute', inset: 0, opacity: axisT, transition: 'opacity 0.3s ease', pointerEvents: 'none' }}>
              {axisTick({ left: 0 }, '0')}
              {axisTick({ left: '30%' }, '30')}
              {axisTick({ left: '50%' }, '50')}
              {axisTick({ left: '70%' }, '70')}
              {axisTick({ right: 0 }, '100 →', true)}
            </span>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 24, marginTop: 46, fontSize: 12, letterSpacing: '0.02em', color: A.inkMuted, fontWeight: 600, alignItems: 'center', flexWrap: 'wrap' }}>
            <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: A.accent, marginRight: 7 }} />Strong ≥70</span>
            <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: A.accentMid, marginRight: 7 }} />Good 50–69</span>
            <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: A.warn, opacity: 0.75, marginRight: 7 }} />Below</span>
            <span style={{ marginLeft: 'auto' }}>One point per credential · best lens · default weights</span>
          </div>
        </div>
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
        topPick: top.name.length > 24 ? `${top.name.slice(0, 22)}…` : top.name,
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
            <Link href="/sign-in" style={{ textDecoration: 'none', color: A.inkMuted, whiteSpace: 'nowrap' }}>
              Sign in
            </Link>
            <Link
              href="/matrix"
              style={{ textDecoration: 'none', fontWeight: 600, background: A.accent, color: A.onAccent, padding: '0.55rem 1.1rem', whiteSpace: 'nowrap' }}
            >
              Explore the field →
            </Link>
          </>
        )}
      />

      {/* Hero */}
      <header style={{ maxWidth: 1200, margin: '0 auto', padding: '7rem 2rem 5.5rem' }}>
        <h1 style={{ fontFamily: INS, fontWeight: 600, fontSize: 'clamp(56px, 7.4vw, 96px)', lineHeight: 0.94, letterSpacing: '-0.045em', margin: 0, maxWidth: '11em', textWrap: 'balance' }}>
          {siteStats.certCount} credentials, scored and cited.
        </h1>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '3rem', marginTop: '2.5rem', flexWrap: 'wrap' }}>
          <p style={{ fontSize: 19, lineHeight: 1.55, color: A.inkBody, margin: 0, maxWidth: '24em', textWrap: 'pretty' }}>
            {siteStats.citationTotal.toLocaleString()} curated citations, five career lenses. Built by practicing PTs.
          </p>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Link href="/matrix" style={{ textDecoration: 'none', fontWeight: 600, fontSize: 15.5, background: A.accent, color: A.onAccent, padding: '15px 26px', whiteSpace: 'nowrap' }}>
              Explore the field →
            </Link>
            <Link href="/methodology" style={{ textDecoration: 'none', fontWeight: 600, fontSize: 14.5, color: A.ink, borderBottom: `2px solid ${A.ink}`, paddingBottom: 2 }}>
              Methodology
            </Link>
          </div>
        </div>
      </header>

      {/* Stat band */}
      <section aria-label="By the numbers" style={{ borderTop: `1px solid ${A.ink}`, borderBottom: `1px solid ${A.ink}` }}>
        <div className="atlas-4col" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 2rem' }}>
          {stats.map(([value, label], i) => (
            <div
              key={label}
              style={{
                padding: `1.3rem ${i === 3 ? 0 : '1.5rem'} 1.3rem ${i === 0 ? 0 : '1.5rem'}`,
                borderRight: i < 3 ? `1px solid ${A.ruleMinor}` : 'none',
              }}
            >
              <span style={{ fontFamily: INS, fontSize: 27, fontWeight: 600, letterSpacing: '-0.03em', ...tabularNums }}>{value}</span>
              <span style={{ display: 'block', fontSize: 12.5, letterSpacing: '0.02em', color: A.inkMuted, fontWeight: 600, marginTop: 3 }}>{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Fig. 1 — the scroll showpiece */}
      <FigureOne />

      {/* Table 2 — the five lenses */}
      <section aria-label="The five lenses" style={{ borderTop: `1px solid ${A.ink}`, background: A.band }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '6rem 2rem' }}>
          <div className="atlas-lens-split">
            <div>
              <h2 className="cs-h2-clamp" style={{ fontFamily: INS, fontWeight: 600, fontSize: 44, lineHeight: 0.98, letterSpacing: '-0.04em', margin: 0, textWrap: 'balance' }}>
                One rubric per career.
              </h2>
              <p style={{ fontSize: 15.5, color: A.inkMuted, lineHeight: 1.6, margin: '1rem 0 0' }}>
                Scores aren&rsquo;t comparable across lenses, deliberately.
              </p>
              <Link href="/career-paths" style={{ ...underlineLink, marginTop: '1.4rem' }}>
                The lens definitions →
              </Link>
            </div>
            <div>
              {lensRows.map((lens) => (
                <div key={lens.key} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '0 2rem', alignItems: 'baseline', padding: '1rem 0.25rem', borderBottom: `1px solid ${A.ruleMinor}` }}>
                  <span style={{ fontFamily: INS, fontWeight: 600, fontSize: 17, letterSpacing: '-0.02em' }}>{lens.label}</span>
                  <span style={{ fontSize: 12, color: A.inkMuted, fontWeight: 600, ...tabularNums }}>n {lens.count}</span>
                  <span style={{ fontSize: 14.5, fontWeight: 500, color: A.inkBody }}>{lens.topPick}</span>
                  <span style={{ fontFamily: INS, fontSize: 18, fontWeight: 600, color: A.accent, minWidth: 34, textAlign: 'right', letterSpacing: '-0.02em', ...tabularNums }}>
                    {lens.topScore}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Notes — what an account adds */}
      <section aria-label="Beyond the field" style={{ borderTop: `1px solid ${A.ink}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '6rem 2rem' }}>
          <h2 style={{ fontFamily: INS, fontWeight: 600, fontSize: 29, letterSpacing: '-0.03em', margin: '0 0 2.25rem' }}>
            What an account adds
          </h2>
          <div className="atlas-4col" style={{ gap: '3rem' }}>
            {[
              ['a.', 'The Ledger', 'Compliance, computed live.', '/compliance'],
              ['b.', 'Dossiers', `${siteStats.certCount} published evidence pages.`, '/credentials'],
              ['c.', 'The CV', 'Your credentials, with evidence attached.', '/profile'],
              ['d.', 'Exports', 'The audit binder, one click.', '/compliance'],
            ].map(([index, title, copy, href]) => (
              <Link key={title} href={href} style={{ textDecoration: 'none', borderTop: `2px solid ${A.ink}`, paddingTop: 16, color: 'inherit' }}>
                <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: A.accent, marginBottom: 8 }}>{index}</span>
                <span style={{ display: 'block', fontFamily: INS, fontWeight: 600, fontSize: 20, letterSpacing: '-0.025em' }}>{title}</span>
                <span style={{ display: 'block', fontSize: 14, color: A.inkMuted, marginTop: 5, lineHeight: 1.5 }}>{copy}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Declaration of interests */}
      <section aria-label="Declaration of interests" style={{ borderTop: `1px solid ${A.ink}`, background: A.band }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '7rem 2rem', textAlign: 'center' }}>
          <div style={eyebrow(13)}>Declaration of interests</div>
          <div style={{ fontFamily: INS, fontSize: 'clamp(110px, 14vw, 190px)', fontWeight: 600, lineHeight: 1, letterSpacing: '-0.055em', color: A.ink, margin: '1.5rem 0 1rem', ...tabularNums }}>
            $0
          </div>
          <p style={{ fontSize: 18, color: A.inkBody, margin: 0 }}>from the programs we score. No ads. No sponsored rankings.</p>
          <Link href="/methodology" style={{ ...underlineLink, marginTop: '1.5rem' }}>
            Methodology, limitations included →
          </Link>
        </div>
      </section>

      {/* Closing */}
      <section aria-label="Closing" style={{ borderTop: `1px solid ${A.ink}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '5rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '3rem', flexWrap: 'wrap' }}>
          <h2 className="cs-h2-clamp" style={{ fontFamily: INS, fontWeight: 600, fontSize: 46, lineHeight: 0.98, letterSpacing: '-0.04em', margin: 0, maxWidth: '13em' }}>
            See where your next credential lands.
          </h2>
          <Link href="/matrix" style={{ textDecoration: 'none', fontWeight: 600, fontSize: 16, background: A.accent, color: A.onAccent, padding: '16px 28px', whiteSpace: 'nowrap' }}>
            Explore the field, free →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${A.ink}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', gap: '2rem', flexWrap: 'wrap', fontSize: 12.5, letterSpacing: '0.02em', color: A.inkMuted, fontWeight: 600 }}>
          <span>CE Shield © {new Date().getFullYear()}</span>
          <span style={{ display: 'flex', gap: 22, flexWrap: 'wrap' }}>
            {[
              ['/matrix', 'The field'],
              ['/credentials', 'Dossiers'],
              ['/states', 'States'],
              ['/about', 'About'],
            ].map(([href, label]) => (
              <Link key={href} href={href} style={{ color: A.inkMuted, textDecoration: 'none' }}>{label}</Link>
            ))}
          </span>
          <span>Scores are never sponsored</span>
        </div>
      </footer>
    </div>
  );
}
