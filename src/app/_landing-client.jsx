'use client';

// Client islands for the landing page. The page itself is a server
// component (all copy and numbers render as HTML); these add motion and the
// two live figures:
//
//   Reveals      masked line reveals + soft rises as sections enter, and the
//                warm light leaning toward the pointer.
//   FieldScene   the cinematic scroll field: every credential scatters, then
//                gathers by Clinical composite, glides to Business, then to
//                Research (same dot = same credential), and the five that
//                lead lift and get named. Canvas, lazy-started on approach.
//                Reduced motion renders the final frame.
//   FieldPreview a working preview of the field: switch lenses and watch the
//                same dots re-sort, hover or arrow through any credential,
//                open it in the full instrument.

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (t) => 1 - Math.pow(1 - t, 3);
const lerp = (a, b, t) => a + (b - a) * t;
const range = (p, a, b) => clamp((p - a) / (b - a));
const short = (n, m) => (n.length > m ? `${n.slice(0, m - 1).trimEnd()}…` : n);
const prefersReduced = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Validated categorical slot on the plum ground, plus the highlight voice.
const DOT = '#8f78e6';
const PEACH = '#f0c3a8';
const GROUND = '#292331';

// Greedy beeswarm: place each value on x, then step outward on y until it
// clears every placed dot.
function beeswarm(items, x0, x1, cy, r, lo, hi) {
  const gap = r * 2 + 1.6;
  const placed = [];
  const out = {};
  [...items].sort((a, b) => a.v - b.v).forEach((it) => {
    const x = x0 + ((it.v - lo) / (hi - lo)) * (x1 - x0);
    let off = 0;
    let k = 0;
    for (;;) {
      const y = cy + off;
      if (!placed.some((p) => Math.abs(p.x - x) < gap && Math.abs(p.y - y) < gap)) {
        placed.push({ x, y });
        out[it.i] = { x, y };
        break;
      }
      k += 1;
      off = (k % 2 ? 1 : -1) * Math.ceil(k / 2) * gap * 0.92;
    }
  });
  return out;
}

// ── Reveals ──────────────────────────────────────────────────────────────
export function Reveals() {
  useEffect(() => {
    const els = document.querySelectorAll('.lp .rise, .lp .lines');
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      }),
      { threshold: 0.14 },
    );
    els.forEach((el) => io.observe(el));

    // The warm light leans toward the pointer (fine pointers only).
    const world = document.querySelector('.world');
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const onMove = (e) => {
      world.style.setProperty('--lx', `${((e.clientX / window.innerWidth - 0.5) * 8).toFixed(2)}%`);
      world.style.setProperty('--ly', `${((e.clientY / window.innerHeight - 0.5) * 6).toFixed(2)}%`);
    };
    if (world && fine && !prefersReduced()) window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener('pointermove', onMove);
      if (world) { world.style.removeProperty('--lx'); world.style.removeProperty('--ly'); }
    };
  }, []);
  return null;
}

// ── FieldScene ───────────────────────────────────────────────────────────
const SCENE_LENSES = ['clinical', 'business', 'research'];
// Transition windows in scene progress: scatter→clinical, →business,
// →research, then the five that lead lift and get labels.
const SEGS = [[0.1, 0.26], [0.36, 0.5], [0.6, 0.74], [0.78, 0.88]];
const stepOf = (p) => (p < 0.2 ? 0 : p < 0.45 ? 1 : p < 0.68 ? 2 : p < 0.8 ? 3 : 4);

export function FieldScene({ certs, lensLabels, captions }) {
  const sectionRef = useRef(null);
  const stageRef = useRef(null);
  const canvasRef = useRef(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const cv = canvasRef.current;
    if (!section || !stage || !cv) return undefined;
    const cx = cv.getContext('2d');
    if (!cx) return undefined;
    const reduce = prefersReduced();

    // Deterministic scatter (same field on every load).
    let seed = 42;
    const rng = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const seeds = certs.map(() => [rng(), rng(), rng()]);

    let W = 0;
    let H = 0;
    let L = null;
    let lastP = reduce ? 1 : 0;
    let lastStep = -1;
    let raf = 0;
    let live = false;

    const layout = () => {
      const rect = cv.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      W = rect.width; H = rect.height;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      cx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const mobile = W < 700;
      const r = clamp(W / 260, 2.6, 4.6);
      const x0 = W * (mobile ? 0.07 : 0.1);
      const x1 = W * (mobile ? 0.93 : 0.9);
      const cy = H * (mobile ? 0.44 : 0.5);
      const vals = SCENE_LENSES.flatMap((l) => certs.map((c) => c.s[l]).filter((v) => v != null));
      const lo = Math.floor(Math.min(...vals) / 10) * 10;
      const hi = Math.ceil(Math.max(...vals) / 10) * 10;
      const scatter = certs.map((c, i) => ({
        x: W * (0.06 + seeds[i][0] * 0.88),
        y: H * (0.1 + seeds[i][1] * 0.62),
        a: 0.35 + seeds[i][2] * 0.4,
      }));
      const parkY = H * (mobile ? 0.12 : 0.17);
      const lensPos = {};
      let minY = Infinity;
      let maxY = -Infinity;
      for (const l of SCENE_LENSES) {
        const items = certs.map((c, i) => ({ i, v: c.s[l] })).filter((d) => d.v != null);
        const pos = beeswarm(items, x0, x1, cy, r, lo, hi);
        Object.values(pos).forEach((p) => { minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y); });
        const missing = certs.map((c, i) => i).filter((i) => !pos[i]);
        missing.forEach((i, j) => {
          pos[i] = { x: x0 + ((j + 0.5) / missing.length) * (x1 - x0), y: parkY, park: true };
        });
        const top = [...items].sort((a, b) => b.v - a.v).slice(0, 5).map((d) => d.i);
        const topY = Math.min(...top.map((i) => pos[i].y));
        lensPos[l] = { pos, top, topY };
      }
      L = { scatter, lensPos, r, x0, x1, cy, lo, hi, parkY, mobile, axisY: maxY + (mobile ? 30 : 44), labelY: mobile ? parkY + 46 : minY - 44 };
    };

    const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
    const mix = (a, b, t) => {
      const A = hex(a); const B = hex(b);
      return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], t))).join(',')})`;
    };
    const setSpacing = (v) => { if ('letterSpacing' in cx) cx.letterSpacing = v; };

    const draw = (p) => {
      if (!L) return;
      cx.clearRect(0, 0, W, H);
      const [t1, t2, t3, t4] = SEGS.map(([a, b]) => ease(range(p, a, b)));
      const C = L.lensPos.clinical.pos;
      const B = L.lensPos.business.pos;
      const R = L.lensPos.research.pos;
      const { top } = L.lensPos.research;
      const lensKey = t3 > 0.5 ? 'research' : t2 > 0.5 ? 'business' : 'clinical';

      // Axis, ticks, lens label, parking row label.
      if (t1 > 0) {
        cx.globalAlpha = t1 * 0.9;
        cx.strokeStyle = 'rgba(255,255,255,0.12)';
        cx.lineWidth = 1;
        cx.beginPath(); cx.moveTo(L.x0, L.axisY + 0.5); cx.lineTo(L.x1, L.axisY + 0.5); cx.stroke();
        cx.fillStyle = '#a998ae';
        cx.font = '10px Figtree, system-ui, sans-serif';
        setSpacing('0px');
        cx.textAlign = 'center';
        for (let v = L.lo; v <= L.hi; v += 10) {
          const x = L.x0 + ((v - L.lo) / (L.hi - L.lo)) * (L.x1 - L.x0);
          cx.fillRect(Math.round(x), L.axisY, 1, 4);
          cx.fillText(String(v), x, L.axisY + 17);
        }
        cx.textAlign = 'left';
        cx.fillStyle = PEACH;
        cx.font = '600 10px Figtree, system-ui, sans-serif';
        setSpacing('1.6px');
        cx.fillText(`${lensLabels[lensKey].toUpperCase()} LENS · COMPOSITE SCORE`, L.x0, L.labelY);
        setSpacing('0px');
        cx.fillStyle = '#a998ae';
        cx.font = '10px Figtree, system-ui, sans-serif';
        cx.fillText('Not scored in this lens', L.x0, L.parkY - 14);
        cx.globalAlpha = 1;
      }

      // Dots.
      certs.forEach((c, i) => {
        const s = L.scatter[i];
        let x = lerp(s.x, C[i].x, t1);
        let y = lerp(s.y, C[i].y, t1);
        x = lerp(x, B[i].x, t2); y = lerp(y, B[i].y, t2);
        x = lerp(x, R[i].x, t3); y = lerp(y, R[i].y, t3);
        const parked = clamp((C[i].park ? 1 - t2 : 0) * t1 + (B[i].park ? t2 - t3 : 0) + (R[i].park ? t3 : 0));
        const isTop = top.includes(i);
        if (isTop) y -= t4 * 18;
        cx.globalAlpha = lerp(s.a, 0.85, t1) * (1 - parked * 0.74);
        cx.fillStyle = isTop && t4 > 0 ? mix(DOT, PEACH, t4) : DOT;
        cx.beginPath(); cx.arc(x, y, L.r * (isTop ? 1 + t4 * 0.45 : 1), 0, Math.PI * 2); cx.fill();
        if (isTop && t4 > 0) { cx.globalAlpha = t4; cx.strokeStyle = GROUND; cx.lineWidth = 2; cx.stroke(); }
      });

      // Labels for the five that lead, in a column on the open side; the dot
      // farthest from the column takes the top row so leaders never cross.
      if (t4 > 0) {
        const pts = top.map((i) => ({ i, x: R[i].x, y: R[i].y - 18 }));
        const minX = Math.min(...pts.map((d) => d.x));
        const maxX = Math.max(...pts.map((d) => d.x));
        const onLeft = (minX + maxX) / 2 > W * 0.5;
        const colX = onLeft ? minX - (L.mobile ? 14 : 36) : maxX + (L.mobile ? 14 : 36);
        pts.sort((a, b) => (onLeft ? b.x - a.x : a.x - b.x));
        const rowH = L.mobile ? 17 : 21;
        const lowest = Math.min(...pts.map((d) => d.y)) - L.r * 2 - 12;
        const baseY = lowest - (pts.length - 1) * rowH;
        cx.font = `${L.mobile ? 11 : 12}px Figtree, system-ui, sans-serif`;
        pts.forEach((d, j) => {
          const ly = baseY + j * rowH;
          cx.globalAlpha = t4;
          cx.strokeStyle = 'rgba(240,195,168,0.45)';
          cx.lineWidth = 1;
          cx.beginPath();
          cx.moveTo(colX + (onLeft ? 4 : -4), ly - 4);
          cx.lineTo(d.x, ly - 4);
          cx.lineTo(d.x, d.y - L.r * 1.7);
          cx.stroke();
          cx.fillStyle = '#f6eee9';
          cx.textAlign = onLeft ? 'right' : 'left';
          const room = onLeft ? colX - 8 : W - colX - 8;
          let label = short(certs[d.i].n, 52);
          while (label.length > 8 && cx.measureText(label).width > room) label = short(label, label.length - 2);
          cx.fillText(label, colX + (onLeft ? -2 : 2), ly);
        });
        cx.textAlign = 'left';
        cx.globalAlpha = 1;
      }

      const st = stepOf(p);
      if (st !== lastStep) { lastStep = st; setStep(st); }
    };

    const stageTop = () => parseFloat(getComputedStyle(stage).top) || 0;
    const measure = () => {
      raf = 0;
      if (reduce) { draw(1); return; }
      const r = section.getBoundingClientRect();
      const total = r.height - stage.offsetHeight;
      const p = total > 0 ? clamp((stageTop() - r.top) / total) : 0;
      lastP = p;
      draw(p);
    };
    const request = () => { if (!raf) raf = requestAnimationFrame(measure); };

    // Lazy start: nothing is laid out or listened to until the field is near.
    const start = () => {
      if (live) return;
      live = true;
      layout();
      measure();
      if (!reduce) window.addEventListener('scroll', request, { passive: true });
    };
    const stop = () => {
      if (!live) return;
      live = false;
      window.removeEventListener('scroll', request);
    };
    const io = new IntersectionObserver(
      ([e]) => (e.isIntersecting ? start() : stop()),
      { rootMargin: '50% 0px 50% 0px' },
    );
    io.observe(section);
    const ro = new ResizeObserver(() => { if (live) { layout(); draw(reduce ? 1 : lastP); } });
    ro.observe(cv);
    document.fonts?.ready.then(() => { if (live) draw(reduce ? 1 : lastP); });

    return () => {
      io.disconnect();
      ro.disconnect();
      stop();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [certs, lensLabels]);

  return (
    <section ref={sectionRef} className="lp-field" aria-label="The field, animated: credentials gather by composite score under three career lenses">
      <div ref={stageRef} className="lp-field-stage">
        <canvas ref={canvasRef} aria-hidden="true" />
        <div className="lp-capt">
          {captions.map((c, i) => (
            <div key={c.title} data-on={i === step ? '' : undefined} aria-hidden={i === step ? undefined : 'true'}>
              <b>{c.eyebrow}</b>
              <strong>{c.title}</strong>
              <p>{c.body}</p>
            </div>
          ))}
        </div>
        <div className="lp-steps" aria-hidden="true">
          {captions.map((c, i) => <i key={c.title} data-on={i === step ? '' : undefined} />)}
        </div>
      </div>
    </section>
  );
}

// ── FieldPreview ─────────────────────────────────────────────────────────
const matrixHref = (lens, name) =>
  `/matrix?lens=${lens}${name ? `&cert=${encodeURIComponent(name)}` : ''}`;

export function FieldPreview({ certs, lenses }) {
  const router = useRouter();
  const wrapRef = useRef(null);
  const [lens, setLens] = useState(lenses[0].key);
  const [W, setW] = useState(760);
  const [hover, setHover] = useState(null); // cert index
  const [cursor, setCursor] = useState(-1); // index into xOrder (keyboard)

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(([e]) => {
      const w = Math.round(e.contentRect.width);
      if (w > 0) setW(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // One shared axis across lenses so a dot's glide between lenses is a
  // real change in score.
  const geo = useMemo(() => {
    const mobile = W < 560;
    const r = clamp(W / 190, 2.8, 4.6);
    const x0 = 18;
    const x1 = W - 18;
    const vals = certs.flatMap((c) => lenses.map((l) => c.s[l.key]).filter((v) => v != null));
    const lo = Math.floor(Math.min(...vals) / 10) * 10;
    const hi = Math.ceil(Math.max(...vals) / 10) * 10;
    const per = {};
    let minY = Infinity;
    let maxY = -Infinity;
    for (const l of lenses) {
      const items = certs.map((c, i) => ({ i, v: c.s[l.key] })).filter((d) => d.v != null);
      const pos = beeswarm(items, x0, x1, 0, r, lo, hi);
      Object.values(pos).forEach((p) => { minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y); });
      const ranked = [...items].sort((a, b) => b.v - a.v);
      const rank = {};
      ranked.forEach((d, k) => { rank[d.i] = k + 1; });
      per[l.key] = { pos, rank, ranked: ranked.map((d) => d.i), n: items.length };
    }
    const padTop = r + 14;
    const shift = padTop - minY;
    for (const l of lenses) {
      Object.values(per[l.key].pos).forEach((p) => { p.y += shift; });
    }
    const axisY = maxY + shift + r + 16;
    return { r, x0, x1, lo, hi, per, axisY, H: axisY + 26, mobile };
  }, [W, certs, lenses]);

  const cur = geo.per[lens];
  const lensMeta = lenses.find((l) => l.key === lens);
  const top5 = cur.ranked.slice(0, 5);
  const xOrder = useMemo(
    () => cur.ranked.map((i) => ({ i, x: cur.pos[i].x })).sort((a, b) => a.x - b.x).map((d) => d.i),
    [cur],
  );
  // Where an unscored dot rests while hidden: its spot in the first lens
  // that does score it, so it fades in place instead of flying.
  const restPos = useCallback((i) => {
    for (const l of lenses) { const p = geo.per[l.key].pos[i]; if (p) return p; }
    return { x: geo.x0, y: geo.axisY };
  }, [geo, lenses]);

  const pickLens = (k) => { setLens(k); setHover(null); setCursor(-1); };
  const active = cursor >= 0 ? xOrder[cursor] : hover;
  const activePos = active != null ? cur.pos[active] : null;

  const onKey = (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const start = cursor < 0 ? (e.key === 'ArrowRight' ? -1 : xOrder.length) : cursor;
      setCursor(clamp(start + (e.key === 'ArrowRight' ? 1 : -1), 0, xOrder.length - 1));
    } else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      setCursor(e.key === 'Home' ? 0 : xOrder.length - 1);
    } else if (e.key === 'Enter' && cursor >= 0) {
      router.push(matrixHref(lens, certs[xOrder[cursor]].n));
    } else if (e.key === 'Escape') {
      setCursor(-1);
    }
  };

  const ticks = [];
  for (let v = geo.lo; v <= geo.hi; v += 10) ticks.push(v);
  const xOf = (v) => geo.x0 + ((v - geo.lo) / (geo.hi - geo.lo)) * (geo.x1 - geo.x0);
  const describe = (i) => `${certs[i].n}. ${lensMeta.label} composite ${certs[i].s[lens].toFixed(1)}, rank ${cur.rank[i]} of ${cur.n}. ${certs[i].c.toLocaleString()} citations.`;

  return (
    <div className="lp-preview">
      <div className="lp-preview-controls">
        <div className="lp-seg" role="group" aria-label="Career lens">
          {lenses.map((l) => (
            <button key={l.key} type="button" aria-pressed={l.key === lens} onClick={() => pickLens(l.key)}>
              {l.label}
            </button>
          ))}
        </div>
      </div>

      <div className="lp-preview-grid">
        <div className="lp-panel lp-preview-swarm">
          <div className="lp-panel-top">
            <div>
              <h3>Every credential, by composite score</h3>
              <p className="lp-sub">{lensMeta.label} lens · default weights · higher is better</p>
            </div>
            <span className="lp-count">{cur.n} of {certs.length} scored</span>
          </div>
          <div ref={wrapRef} className="lp-swarm-wrap">
            <svg
              width={W}
              height={geo.H}
              viewBox={`0 0 ${W} ${geo.H}`}
              className="lp-swarm"
              tabIndex={0}
              role="group"
              aria-label={`Beeswarm of ${cur.n} credentials by ${lensMeta.label} composite score. Use the left and right arrow keys to move between credentials and Enter to open one in the field.`}
              onKeyDown={onKey}
              onBlur={() => setCursor(-1)}
              onPointerLeave={() => setHover(null)}
            >
              <g className="lp-axis" aria-hidden="true">
                {ticks.map((v) => (
                  <line key={`g${v}`} x1={xOf(v)} x2={xOf(v)} y1={8} y2={geo.axisY} className="lp-grid" />
                ))}
                <line x1={geo.x0} x2={geo.x1} y1={geo.axisY + 0.5} y2={geo.axisY + 0.5} />
                {ticks.map((v) => (
                  <text key={v} x={xOf(v)} y={geo.axisY + 17} textAnchor="middle">{v}</text>
                ))}
              </g>
              <g aria-hidden="true">
                {certs.map((c, i) => {
                  const p = cur.pos[i];
                  const on = !!p;
                  const at = p || restPos(i);
                  const lead = on && top5.includes(i);
                  const isActive = active === i;
                  return (
                    <circle
                      key={c.n}
                      r={lead || isActive ? geo.r + 1.4 : geo.r}
                      cx={0}
                      cy={0}
                      className="lp-dot"
                      style={{
                        transform: `translate(${at.x.toFixed(1)}px, ${at.y.toFixed(1)}px)`,
                        opacity: on ? (active != null && !isActive ? 0.55 : lead ? 1 : 0.82) : 0,
                        pointerEvents: on ? 'auto' : 'none',
                      }}
                      fill={lead || isActive ? PEACH : DOT}
                      stroke={lead || isActive ? GROUND : 'none'}
                      strokeWidth={lead || isActive ? 1.5 : 0}
                      onPointerEnter={() => { setCursor(-1); setHover(i); }}
                      onClick={() => router.push(matrixHref(lens, c.n))}
                    />
                  );
                })}
              </g>
              {activePos && (
                <circle cx={activePos.x} cy={activePos.y} r={geo.r + 6} fill="none" stroke={PEACH} strokeWidth={1.2} pointerEvents="none" aria-hidden="true" />
              )}
            </svg>
            {activePos && (
              <div
                className="lp-tip"
                aria-hidden="true"
                style={{
                  left: clamp(activePos.x, 110, Math.max(110, W - 110)),
                  top: activePos.y,
                }}
              >
                <b>{certs[active].n}</b>
                <span>{certs[active].t}{certs[active].d.length ? ` · ${certs[active].d.slice(0, 4).join(', ')}` : ''}</span>
                <span>Composite {certs[active].s[lens].toFixed(1)} · rank {cur.rank[active]} of {cur.n}</span>
                <span>{certs[active].c.toLocaleString()} citations</span>
              </div>
            )}
          </div>
          <p className="lp-note">
            <span className="lp-key" aria-hidden="true"><i /></span>
            The five that lead this lens. Hover or arrow through any dot; select one to open it in the field.
          </p>
          <p className="lp-sr" aria-live="polite">{cursor >= 0 ? describe(xOrder[cursor]) : ''}</p>
        </div>

        <div className="lp-panel lp-preview-top">
          <div className="lp-panel-top">
            <div>
              <h3>The five that lead</h3>
              <p className="lp-sub">{lensMeta.label} lens · weighted toward {lensMeta.heaviest.slice(0, 2).join(' and ')}</p>
            </div>
          </div>
          <ol className="lp-rank">
            {top5.map((i) => (
              <li key={certs[i].n}>
                <Link href={matrixHref(lens, certs[i].n)} onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)}>
                  <span className="lp-rank-r">{cur.rank[i]}</span>
                  <span className="lp-rank-n">{certs[i].n}<small>{certs[i].t}</small></span>
                  <span className="lp-rank-s">{certs[i].s[lens].toFixed(1)}</span>
                </Link>
              </li>
            ))}
          </ol>
          <Link href={matrixHref(lens)} className="lp-arrow-link">
            Open the {lensMeta.label} field
            <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d="M2 9h13M10 4l5 5-5 5" /></svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
