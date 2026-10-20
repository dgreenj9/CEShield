'use client';

// Chart pieces for the field: the composite beeswarm, the evidence-depth
// scatter, and the one shared tooltip. Single series throughout: every dot is
// a credential in lilac-violet (MX.c2); peach marks only the open dossier.

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { A, MX } from '@/components/atlas/theme';
import { beeswarm, domainOf, TIERS, shorten } from './_field';

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

// Width of a container, tracked with ResizeObserver. 0 until mounted.
export function useWidth(withHeight = false) {
  const ref = useRef(null);
  const [w, setW] = useState(0);
  const [hh, setH] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const set = () => { setW(Math.round(el.clientWidth)); if (withHeight) setH(Math.round(el.clientHeight)); };
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
  }, [withHeight]);
  return withHeight ? [ref, w, hh] : [ref, w];
}

// One tooltip for every mark. `tip` = { title, lines: [], x, y } in client px.
export function Tip({ tip }) {
  const ref = useRef(null);
  const [pos, setPos] = useState({ left: -9999, top: -9999 });
  useLayoutEffect(() => {
    if (!tip || !ref.current) return;
    const { offsetWidth: w, offsetHeight: h } = ref.current;
    let left = tip.x + 14;
    let top = tip.y - h - 12;
    if (left + w > window.innerWidth - 8) left = tip.x - w - 14;
    if (top < 8) top = tip.y + 16;
    left = clamp(left, 8, window.innerWidth - w - 8);
    setPos({ left, top });
  }, [tip]);
  return (
    <div ref={ref} className={`mx-tip${tip ? ' on' : ''}`} style={pos} aria-hidden="true">
      {tip && (
        <>
          <b>{tip.title}</b>
          {tip.lines.map((l) => <span key={l}>{l}</span>)}
        </>
      )}
    </div>
  );
}

export const tipLines = (row, lensLabel) => [
  `${row.type} · ${row.disciplines.slice(0, 4).join(', ')}`,
  `Composite ${row.v.toFixed(1)} · rank ${row.rank} in ${lensLabel}`,
  `${row.count.toLocaleString()} citations in the library`,
];

// ── Beeswarm ────────────────────────────────────────────────────────────────
export function Swarm({ rows, selectedName, onSelect, setTip, lensLabel }) {
  // The swarm fills whatever height its panel offers (the weights panel
  // beside it sets the row), with a floor for stacked layouts.
  const [wrapRef, w, boxH] = useWidth(true);
  const svgRef = useRef(null);
  const [cursor, setCursor] = useState(-1);
  const minH = w && w < 560 ? 236 : 280;
  const h = Math.max(minH, Math.min(boxH || 0, 460));

  const geo = useMemo(() => {
    if (!w) return null;
    const pad = 18;
    const x0 = pad;
    const x1 = w - pad;
    const axisY = h - 26;
    const top = 26;
    const cy = (axisY - top) / 2 + top;
    const r = clamp(w / 190, 3, 4.6);
    const [lo, hi] = domainOf(rows.map((d) => d.v));
    const pos = beeswarm(rows.map((d) => ({ id: d.name, v: d.v })), x0, x1, cy, r, lo, hi, cy - top);
    const xOf = (v) => x0 + ((v - lo) / (hi - lo)) * (x1 - x0);
    const order = rows.map((d) => ({ d, ...pos[d.name] })).sort((a, b) => a.x - b.x);
    const ticks = [];
    for (let v = lo; v <= hi; v += 10) ticks.push(v);
    return { x0, x1, axisY, top, r, lo, hi, pos, xOf, order, ticks };
  }, [rows, w, h]);

  // Keep the keyboard cursor in range when the set changes.
  useEffect(() => { setCursor(-1); }, [rows]);

  const showAt = (d, x, y) => {
    const b = svgRef.current?.getBoundingClientRect();
    if (!b) return;
    setTip({ title: d.name, lines: tipLines(d, lensLabel), x: b.left + x, y: b.top + y });
  };

  const onKey = (e) => {
    if (!geo || !geo.order.length) return;
    const n = geo.order.length;
    const start = cursor >= 0 ? cursor : Math.max(0, geo.order.findIndex((o) => o.d.name === selectedName));
    let next = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') next = clamp(start + (cursor < 0 ? 0 : 1), 0, n - 1);
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next = clamp(start - (cursor < 0 ? 0 : 1), 0, n - 1);
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = n - 1;
    else if ((e.key === 'Enter' || e.key === ' ') && cursor >= 0) {
      e.preventDefault();
      onSelect(geo.order[cursor].d.name, { scroll: false });
      return;
    } else if (e.key === 'Escape') { setTip(null); return; }
    if (next == null) return;
    e.preventDefault();
    setCursor(next);
    const o = geo.order[next];
    showAt(o.d, o.x, o.y);
  };

  const cursorItem = geo && cursor >= 0 ? geo.order[cursor] : null;
  const sel = geo && selectedName ? geo.pos[selectedName] : null;

  return (
    <div ref={wrapRef} style={{ marginTop: 8, minHeight: minH, flex: 1, position: 'relative' }}>
      {geo && (
        <svg
          ref={svgRef}
          className="mx-svg mx-swarm"
          style={{ position: 'absolute', inset: 0 }}
          width={w}
          height={h}
          viewBox={`0 0 ${w} ${h}`}
          tabIndex={0}
          role="group"
          aria-label={`Beeswarm of ${rows.length} credentials by composite score. Use the arrow keys to move between credentials and Enter to open one.`}
          onKeyDown={onKey}
          onBlur={() => { setTip(null); setCursor(-1); }}
        >
          {/* Tier bands: hairline boundaries, each band named. */}
          <g className="mx-axis" aria-hidden="true">
            {TIERS.map((t) => {
              const a = Math.max(t.lo, geo.lo);
              const b = Math.min(t.hi, geo.hi);
              if (b <= a) return null;
              const xa = geo.xOf(a);
              const xb = geo.xOf(b);
              return (
                <g key={t.key}>
                  {t.lo > geo.lo && t.lo < geo.hi && (
                    <line x1={xa} x2={xa} y1={geo.top - 8} y2={geo.axisY} strokeDasharray="2 4" style={{ stroke: '#ffffff17' }} />
                  )}
                  {xb - xa > 64 && (
                    <text x={(xa + xb) / 2} y={12} textAnchor="middle" style={{ fontSize: 9.5, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                      {t.label}
                    </text>
                  )}
                </g>
              );
            })}
            <line x1={geo.x0} x2={geo.x1} y1={geo.axisY} y2={geo.axisY} />
            {geo.ticks.map((v) => (
              <g key={v}>
                <line x1={geo.xOf(v)} x2={geo.xOf(v)} y1={geo.axisY} y2={geo.axisY + 4} />
                <text x={geo.xOf(v)} y={geo.axisY + 17} textAnchor="middle">{v}</text>
              </g>
            ))}
          </g>
          <g>
            {rows.map((d) => {
              const p = geo.pos[d.name];
              const on = d.name === selectedName;
              return (
                <g
                  key={d.name}
                  className="mx-dot"
                  style={{ transform: `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px)` }}
                  onPointerMove={(e) => setTip({ title: d.name, lines: tipLines(d, lensLabel), x: e.clientX, y: e.clientY })}
                  onPointerLeave={() => setTip(null)}
                  onClick={() => { setTip(null); onSelect(d.name, { scroll: true }); }}
                >
                  <circle className="mx-hit" r={geo.r + 3} />
                  <circle
                    r={on ? geo.r + 2 : geo.r}
                    fill={on ? A.accent : MX.c2}
                    opacity={on ? 1 : 0.8}
                    stroke={on ? MX.ring : 'none'}
                    strokeWidth={on ? 2 : 0}
                  />
                </g>
              );
            })}
          </g>
          {sel && (
            <circle cx={sel.x} cy={sel.y} r={geo.r + 6} fill="none" stroke={A.accent} strokeWidth={1.2} pointerEvents="none" />
          )}
          {cursorItem && (
            <circle cx={cursorItem.x} cy={cursorItem.y} r={geo.r + 5} fill="none" stroke={A.ink} strokeWidth={1.5} pointerEvents="none" />
          )}
        </svg>
      )}
      <span className="mx-sr" aria-live="polite">
        {cursorItem ? `${cursorItem.d.name}, composite ${cursorItem.d.v.toFixed(1)}, rank ${cursorItem.d.rank}` : ''}
      </span>
    </div>
  );
}

// ── Evidence depth vs. score ───────────────────────────────────────────────
export function Scatter({ rows, selectedName, onSelect, setTip, lensLabel }) {
  const [wrapRef, w] = useWidth();
  const h = w && w < 560 ? 270 : 330;

  const geo = useMemo(() => {
    if (!w) return null;
    const ml = 36;
    const mr = 14;
    const mt = 22;
    const mb = 38;
    const maxC = Math.max(10, ...rows.map((d) => d.count));
    const lx = (v) => ml + (Math.log10(v + 1) / Math.log10(maxC + 1)) * (w - ml - mr);
    const [lo, hi] = domainOf(rows.map((d) => d.v));
    const ly = (v) => mt + (1 - (v - lo) / (hi - lo)) * (h - mt - mb);
    const yt = [];
    for (let v = lo; v <= hi; v += 10) yt.push(v);
    const xt = [0, 1, 10, 100, 1000, 10000].filter((v) => v <= maxC);
    return { ml, mr, mt, mb, lx, ly, yt, xt };
  }, [rows, w, h]);

  const selRow = rows.find((d) => d.name === selectedName);

  return (
    <div ref={wrapRef} style={{ marginTop: 10, minHeight: h }}>
      {geo && (
        <svg className="mx-svg" width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`Scatter plot of citation count, on a log scale, against composite score for ${rows.length} credentials. The table view of the ranking lists the same values.`}>
          <g className="mx-axis">
            {geo.yt.map((v) => (
              <g key={v}>
                <line x1={geo.ml} x2={w - geo.mr} y1={geo.ly(v)} y2={geo.ly(v)} />
                <text x={geo.ml - 8} y={geo.ly(v) + 3} textAnchor="end">{v}</text>
              </g>
            ))}
            {geo.xt.map((v) => (
              <g key={v}>
                <line x1={geo.lx(v)} x2={geo.lx(v)} y1={h - geo.mb} y2={h - geo.mb + 4} />
                <text x={geo.lx(v)} y={h - geo.mb + 17} textAnchor="middle">{v.toLocaleString()}</text>
              </g>
            ))}
            <text x={w - geo.mr} y={h - 4} textAnchor="end">Citations in the library (log) →</text>
            <text x={geo.ml - 8} y={10} textAnchor="start">↑ Composite</text>
          </g>
          {rows.map((d) => {
            const on = d.name === selectedName;
            if (on) return null;
            return (
              <circle
                key={d.name}
                cx={geo.lx(d.count)}
                cy={geo.ly(d.v)}
                r={4}
                fill={MX.c2}
                opacity={0.72}
                stroke={MX.ring}
                strokeWidth={2}
                style={{ cursor: 'pointer' }}
                onPointerMove={(e) => setTip({ title: d.name, lines: tipLines(d, lensLabel), x: e.clientX, y: e.clientY })}
                onPointerLeave={() => setTip(null)}
                onClick={() => { setTip(null); onSelect(d.name, { scroll: true }); }}
              />
            );
          })}
          {selRow && (() => {
            const x = geo.lx(selRow.count);
            const y = geo.ly(selRow.v);
            const right = x > w * 0.55;
            return (
              <g>
                <circle
                  cx={x}
                  cy={y}
                  r={6}
                  fill={A.accent}
                  stroke={MX.ring}
                  strokeWidth={2}
                  onPointerMove={(e) => setTip({ title: selRow.name, lines: tipLines(selRow, lensLabel), x: e.clientX, y: e.clientY })}
                  onPointerLeave={() => setTip(null)}
                />
                <circle cx={x} cy={y} r={11} fill="none" stroke={A.accent} strokeWidth={1.2} pointerEvents="none" />
                <text x={x + (right ? -16 : 16)} y={y + 4} textAnchor={right ? 'end' : 'start'} fill={A.ink} fontSize={12} pointerEvents="none">
                  {shorten(selRow.name, w < 520 ? 22 : 44)}
                </text>
              </g>
            );
          })()}
        </svg>
      )}
    </div>
  );
}
