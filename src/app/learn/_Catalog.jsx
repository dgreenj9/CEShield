'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { SUBJECTS, EDUCATION_TYPES, COURSE_DIMENSIONS, COURSE_FORMATS, courseScore, filterCourses, sortCourses, formatCoursePrice, selectComparisonCourses } from '@/utils/educationCatalog';
import CourseComparison from './_CourseComparison';
import { A, FIG, INS, tabularNums } from '@/components/atlas/theme';

const PAGE_SIZE = 24;
const FORMATS = COURSE_FORMATS;
const control = { width: '100%', padding: '10px 12px', minHeight: 43, background: A.paper, color: A.ink, border: `1px solid ${A.ruleMinor}`, font: `14px ${FIG}` };
const button = { padding: '9px 14px', background: A.paper, color: A.accent, border: `1px solid ${A.ruleMinor}`, cursor: 'pointer', font: `600 13px ${FIG}` };
const fieldLabel = { display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 5 };
const linkStyle = { color: A.accent, fontWeight: 700 };
const external = { target: '_blank', rel: 'noopener noreferrer' };

export default function Catalog({ courses, providers, directories }) {
  const searchParams = useSearchParams();
  const filters = {
    query: searchParams.get('q') || '', subject: searchParams.get('subject') || '',
    provider: searchParams.get('provider') || '', discipline: searchParams.get('discipline') || '',
    format: searchParams.get('format') || '', status: searchParams.get('status') || '',
    type: searchParams.get('type') || '',
  };
  const sort = searchParams.get('sort') || 'title';
  const activeTab = ['courses', 'providers', 'reviews', 'compare'].includes(searchParams.get('tab')) ? searchParams.get('tab') : 'courses';
  const comparison = selectComparisonCourses(courses, searchParams.get('compare') || '');
  const comparisonIds = comparison.map(c => c.id);
  const [page, setPage] = useState(1);
  const [providerQuery, setProviderQuery] = useState('');

  function update(values, resetPage = true) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(values)) {
      if (value) params.set(key, value); else params.delete(key);
    }
    const query = params.toString();
    window.history.replaceState(null, '', `/learn${query ? `?${query}` : ''}`);
    if (resetPage) setPage(1);
  }

  function toggleComparison(id) {
    const selected = comparisonIds.includes(id);
    if (!selected && comparisonIds.length >= 3) return;
    update({ compare: (selected ? comparisonIds.filter(value => value !== id) : [...comparisonIds, id]).join(',') }, false);
  }

  const filtered = useMemo(() => sortCourses(filterCourses(courses, filters), sort, filters.subject),
    [courses, filters.query, filters.subject, filters.provider, filters.discipline, filters.format, filters.status, filters.type, sort]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pages);
  const shown = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const counts = useMemo(() => courses.reduce((acc, course) => {
    acc[course.providerId] = (acc[course.providerId] || 0) + 1;
    return acc;
  }, {}), [courses]);
  const reviewed = courses.filter(c => c.reviewStatus === 'verified' || c.reviewStatus === 'ranked').length;
  const ranked = courses.filter(c => courseScore(c) !== null).length;
  const disciplines = [...new Set(providers.flatMap(p => p.disciplines))].sort();
  const sortedProviders = [...providers].sort((a, b) => a.name.localeCompare(b.name));
  const candidates = providers.reduce((n, p) => n + (p.coverage?.discoveredCount || 0), 0);

  return (
    <>
      <div className="ce-stats" aria-label="Catalog coverage">
        {[[courses.length, 'education listings'], [providers.length, 'provider sources'], [reviewed, 'fact-checked listings'], [ranked, 'course evaluations']].map(([value, label]) => (
          <div key={label} style={{ padding: '16px 20px', background: A.paper }}><strong style={{ fontFamily: INS, fontSize: 30, ...tabularNums }}>{value.toLocaleString()}</strong><div style={{ fontSize: 12, color: A.inkMuted }}>{label}</div></div>
        ))}
      </div>

      <nav aria-label="Catalog sections" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '24px 0 20px' }}>
        {[['courses', 'Courses'], ['providers', 'Providers & coverage'], ['compare', `Compare (${comparison.length})`], ['reviews', 'How reviews work']].map(([id, label]) => (
          <button key={id} onClick={() => update({ tab: id === 'courses' ? '' : id })} aria-pressed={activeTab === id} style={{ ...button, background: activeTab === id ? A.ink : A.paper, color: activeTab === id ? A.onAccent : A.ink }}>{label}</button>
        ))}
      </nav>

      {comparison.length > 0 && activeTab === 'courses' && <p role="status" style={{ fontSize: 13, color: A.inkBody }}>{comparison.length} of 3 selected · <button onClick={() => update({ tab: 'compare' })} style={button}>View comparison</button>{comparison.length === 3 && ' Remove a selection to add another course.'}</p>}
      {activeTab === 'compare' && <CourseComparison courses={comparison} onRemove={toggleComparison} onClear={() => update({ compare: '' })} onBrowse={() => update({ tab: '' })} />}

      {activeTab === 'courses' && <>
        <section aria-label="Filter courses" style={{ padding: 20, background: A.paper, border: `1px solid ${A.ink}` }}>
          <label><span style={fieldLabel}>Search courses, topics, or providers</span><input type="search" value={filters.query} onChange={e => update({ q: e.target.value })} placeholder="Try aphasia, hand therapy, or pain" style={control} /></label>
          <div className="ce-filters" style={{ marginTop: 14 }}>
            <Filter label="Subject" value={filters.subject} onChange={subject => update({ subject })} options={Object.entries(SUBJECTS)} />
            <Filter label="Profession" value={filters.discipline} onChange={discipline => update({ discipline })} options={disciplines.map(d => [d, d])} />
            <Filter label="Provider" value={filters.provider} onChange={provider => update({ provider })} options={sortedProviders.map(p => [p.id, p.name])} />
            <Filter label="Format" value={filters.format} onChange={format => update({ format })} options={Object.entries(FORMATS)} />
            <Filter label="Education type" value={filters.type} onChange={type => update({ type })} options={Object.entries(EDUCATION_TYPES)} />
            <Filter label="Review status" value={filters.status} onChange={status => update({ status })} options={[[ 'discovered', 'Listing discovered' ], [ 'verified', 'Facts checked' ], [ 'ranked', 'Evaluated & ranked' ]]} />
          </div>
          <p style={{ margin: '12px 0 0', fontSize: 12, color: A.inkMuted, lineHeight: 1.5 }}>For listings without a checked course audience, profession filters use the provider’s audience. Topic matches from titles are provisional. Confirm availability, eligibility, and CE credit on the course page.</p>
        </section>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, padding: '16px 0' }}>
          <span role="status" aria-live="polite" style={{ fontSize: 13 }}>{filtered.length.toLocaleString()} of {courses.length.toLocaleString()} listings</span>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <button onClick={() => update({ q: '', subject: '', provider: '', discipline: '', format: '', status: '', type: '', sort: '' })} style={button}>Clear filters</button>
            <label style={{ fontSize: 12 }}>Sort <select aria-label="Sort courses" value={sort === 'score' && (!filters.subject || !ranked) ? 'title' : sort} onChange={e => update({ sort: e.target.value })} style={{ ...control, width: 'auto' }}><option value="title">Title</option><option value="hours">Contact hours</option>{ranked > 0 && filters.subject && <option value="score">Course evaluation</option>}</select></label>
          </div>
        </div>

        {shown.length === 0 ? <div style={{ padding: 28, border: `1px dashed ${A.ink}`, background: A.notice }}><h2 style={{ fontFamily: INS, fontSize: 21, marginTop: 0 }}>No matching listings.</h2><p style={{ color: A.inkBody }}>Try fewer filters, or browse a provider’s catalog while its courses are being indexed.</p><button onClick={() => update({ tab: 'providers' })} style={button}>Browse providers</button></div> : (
          <div className="ce-course-grid">{shown.map(course => <CourseCard key={course.id} course={course} onSubject={subject => update({ subject })} compared={comparisonIds.includes(course.id)} comparisonFull={comparison.length >= 3} onCompare={() => toggleComparison(course.id)} />)}</div>
        )}
        {pages > 1 && <nav aria-label="Course result pages" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 24 }}><button disabled={safePage === 1} onClick={() => setPage(p => Math.max(1, p - 1))} style={button}>Previous</button><span style={{ fontSize: 13 }}>Page {safePage} of {pages}</span><button disabled={safePage === pages} onClick={() => setPage(p => Math.min(pages, p + 1))} style={button}>Next</button></nav>}
      </>}

      {activeTab === 'providers' && <section aria-label="Provider coverage">
        <h2 style={{ fontFamily: INS, fontSize: 25 }}>Coverage across the market</h2>
        <p style={{ color: A.inkBody, lineHeight: 1.6, maxWidth: 820 }}>{providers.length} registered sources · {candidates.toLocaleString()} candidate URLs found in the latest source checks. Candidate URLs can include sessions, duplicates, or non-course pages; they are not a count of verified courses. Coverage is expanding.</p>
        <label><span style={fieldLabel}>Find a provider</span><input type="search" style={control} value={providerQuery} onChange={e => setProviderQuery(e.target.value)} placeholder="Search provider or profession" /></label>
        <div style={{ marginTop: 18, border: `1px solid ${A.ink}`, background: A.paper }}>
          {sortedProviders.filter(p => `${p.name} ${p.disciplines.join(' ')}`.toLowerCase().includes(providerQuery.toLowerCase())).map(p => <article key={p.id} style={{ padding: 18, borderBottom: `1px solid ${A.ruleMinor}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div><h3 style={{ fontSize: 16, margin: '0 0 5px' }}>{p.name}</h3><div style={{ fontSize: 12, color: A.inkMuted }}>{p.disciplines.join(' · ')} · {counts[p.id] || 0} listings{!counts[p.id] && ' · indexing pending'}{p.closedCount > 0 && ` · ${p.closedCount} closed listings excluded`}</div>{p.coverage && <div style={{ fontSize: 12, color: A.inkMuted, marginTop: 5 }}>Discovery checked {p.coverage.attemptedAt.slice(0, 10)} · {p.coverage.status === 'blocked' ? 'Source access needs review' : `${p.coverage.discoveredCount.toLocaleString()} candidate URLs`}</div>}</div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>{Boolean(counts[p.id]) && <button onClick={() => update({ tab: '', provider: p.id, q: '', subject: '', discipline: '', format: '', status: '', type: '' })} style={button}>View listings</button>}<a href={p.catalogUrl} {...external} style={linkStyle}>Provider catalog ↗<span className="sr-only"> (opens in a new tab)</span></a></div>
          </article>)}
        </div>
        <h3 style={{ fontFamily: INS, marginTop: 28 }}>Find additional providers</h3>
        <p style={{ color: A.inkBody }}>Professional directories help extend coverage beyond the sources already indexed.</p>
        <ul>{directories.map(d => <li key={d.url} style={{ margin: '10px 0' }}><a href={d.url} {...external} style={linkStyle}>{d.name} ↗</a></li>)}</ul>
      </section>}

      {activeTab === 'reviews' && <section style={{ background: A.paper, border: `1px solid ${A.ink}`, padding: '24px', lineHeight: 1.65, maxWidth: 900 }}>
        <h2 style={{ fontFamily: INS, marginTop: 0 }}>From discovery to evaluation</h2>
        <ol style={{ paddingLeft: 22 }}>
          <li><strong>Listing discovered.</strong> A public provider page identifies an education offering. The title and link are captured; availability, audience, hours, and course content may still need review.</li>
          <li><strong>Facts checked.</strong> Course details are checked against a named source and dated. Missing facts remain unknown. This status is not an endorsement or CE approval.</li>
          <li><strong>Evaluated & ranked.</strong> A course-specific review records a rationale and supporting sources for every scored dimension, the material accessed, and review limitations. Courses are compared within a subject and relevant learning objective.</li>
        </ol>
        <h3 style={{ fontFamily: INS }}>Course evaluation rubric</h3>
        <p>The initial rubric below is separate from <Link href="/methodology" style={linkStyle}>credential scoring</Link>. Evidence for a clinical intervention does not establish the quality of a particular vendor’s course. {ranked === 0 ? 'No course evaluations have been published yet.' : `${ranked} course evaluations are published.`}</p>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}><thead><tr><th scope="col" style={{ textAlign: 'left', padding: 8 }}>Dimension</th><th scope="col" style={{ textAlign: 'right', padding: 8 }}>Weight</th></tr></thead><tbody>{Object.values(COURSE_DIMENSIONS).map(d => <tr key={d.label} style={{ borderTop: `1px solid ${A.ruleMinor}` }}><td style={{ padding: 8 }}>{d.label}</td><td style={{ padding: 8, textAlign: 'right' }}>{d.weight}%</td></tr>)}</tbody></table>
        <p>Missing evaluation evidence produces “Not evaluated,” never a zero score. Provider star ratings and sponsorship do not determine CE Shield scores.</p>
        <h3 style={{ fontFamily: INS }}>CE acceptance is a separate check</h3>
        <p>Contact hours describe a provider’s offering. Acceptance depends on profession, jurisdiction, delivery format, approval period, and sometimes the individual session. Catalog listings do not automatically satisfy requirements in your Ledger.</p>
        <p style={{ fontWeight: 700 }}>Scores are never sponsored.</p>
      </section>}
    </>
  );
}

function Filter({ label, value, onChange, options }) {
  return <label><span style={fieldLabel}>{label}</span><select aria-label={label} style={control} value={value} onChange={e => onChange(e.target.value)}><option value="">All</option>{options.map(([id, title]) => <option key={id} value={id}>{title}</option>)}</select></label>;
}

function CourseCard({ course, onSubject, compared, comparisonFull, onCompare }) {
  const score = courseScore(course);
  const price = formatCoursePrice(course);
  const reviewed = course.reviewStatus === 'verified' || course.reviewStatus === 'ranked';
  return <article style={{ padding: 20, background: A.paper, border: `1px solid ${A.ruleMinor}`, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
    <div style={{ fontSize: 12, color: A.inkMuted }}>{course.providerName} · {course.educationType ? EDUCATION_TYPES[course.educationType] : 'Education listing'}</div>
    <h2 style={{ fontFamily: INS, fontSize: 20, lineHeight: 1.3, margin: 0, overflowWrap: 'anywhere' }}><a href={course.url} {...external} style={{ color: A.ink, textDecoration: 'none' }}>{course.title}<span className="sr-only"> (opens provider page in a new tab)</span></a></h2>
    <div style={{ fontSize: 12, fontWeight: 700, color: A.accent }}>{score !== null ? `Course evaluation: ${score}/100` : reviewed ? 'Facts checked · Not evaluated' : 'Listing discovered · Not evaluated'}</div>
    {course.summary && <p style={{ fontSize: 14, color: A.inkBody, lineHeight: 1.55, margin: 0 }}>{course.summary}</p>}
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: A.inkBody }}><input type="checkbox" checked={compared} disabled={!compared && comparisonFull} onChange={onCompare} aria-label={`Compare ${course.title}`} />Compare</label>
    {course.subjects.length > 0 && <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{course.subjects.map(s => <button key={s} onClick={() => onSubject(s)} style={{ ...button, padding: '4px 8px', fontSize: 11 }}>{SUBJECTS[s]}</button>)}</div>}
    {course.subjectBasis === 'title' && course.subjects.length > 0 && <span style={{ fontSize: 11, color: A.inkMuted }}>Topic matches from title</span>}
    <div style={{ fontSize: 12, color: A.inkBody, lineHeight: 1.6 }}>
      {course.audienceBasis === 'course' ? <div>For {course.disciplines.join(', ')}</div> : <div>Course audience: check provider</div>}
      {course.contactHours != null && <div>{course.contactHours} provider-listed contact hours</div>}
      {course.format && <div>{FORMATS[course.format] || course.format}</div>}
      {price && <div>{price} · checked {course.reviewedOn}</div>}
    </div>
    {score !== null && <details style={{ fontSize: 12 }}><summary>Evaluation and sources</summary><p>{course.evaluation.subject && SUBJECTS[course.evaluation.subject]} · Reviewed by {course.evaluation.reviewer} on {course.evaluation.reviewedOn}</p><p>{course.evaluation.reviewBasis === 'course-access' ? 'Review included course access.' : 'Review based on public materials.'} {course.evaluation.limitations}</p>{Object.entries(COURSE_DIMENSIONS).map(([key, d]) => <div key={key}><strong>{d.label}: {course.evaluation.dimensions[key].score}/100</strong><p>{course.evaluation.dimensions[key].rationale}</p>{course.evaluation.dimensions[key].sources.map((url, i) => <a key={url} href={url} {...external} style={{ ...linkStyle, marginRight: 8 }}>Source {i + 1}</a>)}</div>)}</details>}
    <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: `1px solid ${A.ruleFaint}`, display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
      <span style={{ fontSize: 11, color: A.inkMuted }}>{reviewed ? `Checked ${course.reviewedOn}` : `Found ${course.discoveredOn}`} · <a href={course.sourceUrl} {...external} style={{ color: A.accent }}>Source ↗</a></span>
      <a href={course.url} {...external} style={{ ...linkStyle, fontSize: 13 }}>Check course details ↗<span className="sr-only"> (opens in a new tab)</span></a>
    </div>
  </article>;
}
