'use client';

import { COURSE_FORMATS, EDUCATION_TYPES, SUBJECTS, COURSE_DIMENSIONS, courseScore, formatCoursePrice } from '@/utils/educationCatalog';
import { A, INS, FIG } from '@/components/atlas/theme';

const external = { target: '_blank', rel: 'noopener noreferrer' };
const link = { color: A.accent, fontWeight: 700 };
const button = { border: `1px solid ${A.ruleMinor}`, background: A.paper, color: A.accent, padding: '8px 12px', cursor: 'pointer', font: `600 13px ${FIG}` };
const unknown = 'Not yet checked';

export default function CourseComparison({ courses, onRemove, onBrowse, onClear }) {
  return <section aria-label="Course comparison">
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
      <h2 style={{ fontFamily: INS, fontSize: 25 }}>Compare course facts</h2>
      <div style={{ display: 'flex', gap: 8 }}><button style={button} onClick={onBrowse}>Browse courses</button>{courses.length > 0 && <button style={button} onClick={onClear}>Clear comparison</button>}</div>
    </div>
    {courses.length === 0 ? <p style={{ color: A.inkBody }}>Select Compare on up to three course cards, then return here.</p> : <>
      <p style={{ color: A.inkBody, lineHeight: 1.6 }}>Share this page to share your selection. Prices retain their listed currencies. Course details do not establish CE acceptance for your license.</p>
      <p className="ce-comparison-hint" style={{ fontSize: 12, color: A.inkMuted }}>Scroll across to see each course →</p>
      <div role="region" aria-label="Scrollable course comparison" tabIndex={0} style={{ overflowX: 'auto', maxWidth: '100%', border: `1px solid ${A.ink}`, background: A.paper }}>
        <table className="ce-comparison-table" style={{ '--comparison-count': courses.length, width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: 14, lineHeight: 1.5 }}>
          <caption className="sr-only">Selected course facts and review status</caption>
          <thead><tr><th className="ce-comparison-label" scope="col" style={{ padding: 16, textAlign: 'left', verticalAlign: 'top', position: 'sticky', left: 0, background: A.paper, zIndex: 1 }}>Course</th>{courses.map(c => <th key={c.id} scope="col" style={{ padding: 16, textAlign: 'left', verticalAlign: 'top', overflowWrap: 'anywhere' }}>
            <div style={{ color: A.inkMuted, fontWeight: 400, fontSize: 12, marginBottom: 8 }}>{c.providerName}</div>
            <a href={c.url} {...external} style={{ ...link, fontFamily: INS, fontSize: 18 }}>{c.title} ↗</a>
            <div style={{ marginTop: 12 }}><button onClick={() => onRemove(c.id)} aria-label={`Remove ${c.title} from comparison`} style={button}>Remove</button></div>
          </th>)}</tr></thead>
          <tbody>
            <Row label="Review status" courses={courses} render={c => courseScore(c) !== null ? 'Evaluated' : c.reviewStatus === 'verified' ? 'Facts checked · Not evaluated' : 'Discovered · Not evaluated'} />
            <Row label="Subjects" courses={courses} render={c => <>{c.subjects?.map(s => SUBJECTS[s]).join(', ') || unknown}{c.subjectBasis === 'title' && c.subjects?.length > 0 && <div style={{ color: A.inkMuted, fontSize: 12 }}>Matches from title</div>}</>} />
            <Row label="Course audience" courses={courses} render={c => c.audienceBasis === 'course' ? c.disciplines.join(', ') : unknown} />
            <Row label="Contact hours" courses={courses} render={c => c.contactHours != null ? `${c.contactHours} provider-listed hours` : unknown} />
            <Row label="Format" courses={courses} render={c => COURSE_FORMATS[c.format] || unknown} />
            <Row label="Listed session" courses={courses} render={c => c.sessionStart ? `${c.sessionStart.slice(0, 10)}${c.sessionEnd && c.sessionEnd.slice(0, 10) !== c.sessionStart.slice(0, 10) ? ` to ${c.sessionEnd.slice(0, 10)}` : ''}` : unknown} />
            <Row label="Education type" courses={courses} render={c => EDUCATION_TYPES[c.educationType] || unknown} />
            <Row label="Listed price" courses={courses} render={c => formatCoursePrice(c)?.replace(/^Listed price: /, '') || unknown} />
            <Row label="Scope" courses={courses} render={c => c.summary || unknown} />
            <Row label="Course evaluation" courses={courses} render={c => <Evaluation course={c} />} />
            <Row label="Source and date" courses={courses} render={c => <><a href={c.sourceUrl} {...external} style={link}>Provider source ↗</a><div>{c.reviewedOn ? `Facts checked ${c.reviewedOn}` : `Found ${c.discoveredOn}`}</div></>} />
          </tbody>
        </table>
      </div>
    </>}
  </section>;
}

function Row({ label, courses, render }) {
  const style = { padding: 16, verticalAlign: 'top', borderTop: `1px solid ${A.ruleMinor}`, overflowWrap: 'anywhere' };
  return <tr><th scope="row" style={{ ...style, textAlign: 'left', position: 'sticky', left: 0, background: A.paper, zIndex: 1 }}>{label}</th>{courses.map(c => <td key={c.id} style={style}>{render(c)}</td>)}</tr>;
}

function Evaluation({ course }) {
  const score = courseScore(course);
  if (score === null) return 'Not evaluated';
  const review = course.evaluation;
  return <><strong>{score}/100 · {SUBJECTS[review.subject]}</strong><div>{review.reviewBasis === 'course-access' ? 'Includes course access' : 'Public materials review'}</div><details><summary>Judgments and limitations</summary><p>{review.reviewer} · {review.reviewedOn}</p><p>{review.limitations}</p>{Object.entries(COURSE_DIMENSIONS).map(([key, d]) => <div key={key}><strong>{d.label}: {review.dimensions[key].score}/100</strong><p>{review.dimensions[key].rationale}</p>{review.dimensions[key].sources.map((url, i) => <p key={url}><a href={url} {...external} style={link}>Source {i + 1} ↗</a></p>)}</div>)}</details></>;
}
