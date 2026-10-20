import React, { useMemo, useState } from 'react';
import { BookOpen, Plus, Pencil, Trash2, Download } from 'lucide-react';
import { useUserData } from '../contexts/UserDataContext';
import { resolveCertificateUrl, resolveCertificateName } from '../services/certificateStorage';
import AddCourseModal from '../components/courses/AddCourseModal';
import DeleteConfirmationModal from '../components/courses/DeleteConfirmationModal';
import { Button, EmptyState } from '../components/ui';
import { A, FIG, tabularNums, kicker, display, panel, LINE_FAINT } from '../components/atlas/theme';

// Courses — the working end of the ledger. Rows echo the Compliance course
// log (Table 4): date · title · provider · category · certificate badge ·
// hours, with edit/delete/download actions on each row.

const labelize = (key) => (key || '').replace(/([A-Z])/g, ' $1').trim();

const iconBtn = (color) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 44,
  height: 44,
  borderRadius: 999,
  background: 'transparent',
  border: 'none',
  color,
  cursor: 'pointer',
});

export default function CoursesPage() {
  const { courses, saveCourse, deleteCourse } = useUserData();
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [courseToDelete, setCourseToDelete] = useState(null);

  const sortedCourses = useMemo(
    () => [...courses].sort((a, b) => new Date(b.date) - new Date(a.date)),
    [courses],
  );

  const totalHours = useMemo(
    () => courses.reduce((sum, c) => sum + (parseFloat(c.hours) || 0), 0),
    [courses],
  );

  const handleDownload = async (course) => {
    const url = await resolveCertificateUrl(course);
    if (!url) {
      alert('Certificate file is unavailable. Try re-uploading it.');
      return;
    }
    const link = document.createElement('a');
    link.href = url;
    link.download = resolveCertificateName(course);
    if (course.certificate_storage) link.target = '_blank';
    link.click();
  };

  return (
    <div>
      {/* Header */}
      <header className="plum-rise" style={{ marginBottom: '2rem', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1.25rem 2rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ ...kicker(), marginBottom: 14, ...tabularNums }}>
            {courses.length} course{courses.length === 1 ? '' : 's'} · {Math.round(totalHours * 10) / 10} h logged this cycle
          </div>
          <h1 style={display('clamp(2rem, 4.4vw, 3.25rem)', 360)}>
            The course <em style={{ fontStyle: 'normal', color: A.accentMid }}>log.</em>
          </h1>
        </div>
        <Button size="lg" onClick={() => { setEditingCourse(null); setShowAddCourse(true); }}>
          <Plus size={16} aria-hidden="true" /> Add a course
        </Button>
      </header>

      {courses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Nothing logged yet"
          description="Log your first CE course. Hours, mandatory categories, and renewal status compute from the log."
          action={(
            <Button onClick={() => setShowAddCourse(true)}>
              <Plus size={14} aria-hidden="true" /> Log a course
            </Button>
          )}
          variant="dashed"
        />
      ) : (
        <div style={{ ...panel, overflow: 'hidden' }}>
          <div style={{ padding: '16px 1.5rem 12px', borderBottom: `1px solid ${LINE_FAINT}`, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 10 }}>
            <span style={{ fontFamily: FIG, fontSize: 12, letterSpacing: '0.02em', fontWeight: 600, color: A.inkBody, ...tabularNums }}>
              Course log · {courses.length} entries
            </span>
            <span style={{ fontFamily: FIG, fontSize: 12, color: A.inkMuted }}>Newest first</span>
          </div>
          {sortedCourses.map((course, i) => (
            <div
              key={course.id}
              className="atlas-row plum-logrow"
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '0.35rem 0.75rem 0.35rem 1.5rem', borderBottom: i < sortedCourses.length - 1 ? `1px solid ${LINE_FAINT}` : 'none' }}
            >
              <span className="plum-logrow-date" style={{ fontFamily: FIG, fontSize: 12, color: A.inkMuted, width: 84, flexShrink: 0, ...tabularNums }}>
                {course.date
                  ? new Date(`${course.date}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
                  : '·'}
              </span>
              <span className="plum-logrow-title" style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontWeight: 400, fontSize: 14.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: A.ink }}>
                  {course.title}
                </span>
                <span style={{ display: 'block', fontFamily: FIG, fontSize: 11.5, color: A.inkMuted, marginTop: 1, textTransform: 'capitalize' }}>
                  {[course.provider, labelize(course.category)].filter(Boolean).join(' · ')}
                  {course.format === 'selfStudy' ? ' · self-study' : ''}
                  {course.category === 'culturalCompetency' && (
                    <span style={{ color: A.warn, fontWeight: 500, marginLeft: 6, fontSize: 10.5 }}>New 2025</span>
                  )}
                </span>
              </span>
              {(course.certificate || course.certificate_storage) && (
                <span className="plum-logrow-badge" style={{ fontFamily: FIG, fontSize: 10.5, fontWeight: 500, padding: '2px 9px', borderRadius: 20, border: '1px solid rgba(240,195,168,0.45)', color: A.accent, flexShrink: 0 }}>
                  Certificate
                </span>
              )}
              <span className="plum-logrow-hours" style={{ fontFamily: FIG, fontSize: 16, fontWeight: 400, letterSpacing: '-0.02em', width: 52, textAlign: 'right', flexShrink: 0, ...tabularNums }}>
                {course.hours}
                <span style={{ fontSize: 11, color: A.inkMuted, fontWeight: 400, letterSpacing: 0 }}> h</span>
              </span>
              <span className="plum-logrow-actions" style={{ display: 'flex', alignItems: 'center', gap: 0, flexShrink: 0 }}>
                {(course.certificate || course.certificate_storage) && (
                  <button
                    type="button"
                    onClick={() => handleDownload(course)}
                    aria-label={`Download certificate for ${course.title}`}
                    title="Download certificate"
                    className="plum-icon-btn" style={iconBtn(A.accent)}
                  >
                    <Download size={15} aria-hidden="true" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => { setEditingCourse(course); setShowAddCourse(true); }}
                  aria-label={`Edit ${course.title}`}
                  title="Edit course"
                  className="plum-icon-btn" style={iconBtn(A.inkMuted)}
                >
                  <Pencil size={15} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setCourseToDelete(course)}
                  aria-label={`Delete ${course.title}`}
                  title="Delete course"
                  className="plum-icon-btn" style={iconBtn(A.warn)}
                >
                  <Trash2 size={15} aria-hidden="true" />
                </button>
              </span>
            </div>
          ))}
        </div>
      )}

      {showAddCourse && (
        <AddCourseModal
          editingCourse={editingCourse}
          onSave={saveCourse}
          onClose={() => {
            setShowAddCourse(false);
            setEditingCourse(null);
          }}
        />
      )}

      {courseToDelete && (
        <DeleteConfirmationModal
          course={courseToDelete}
          onConfirm={deleteCourse}
          onClose={() => setCourseToDelete(null)}
        />
      )}
    </div>
  );
}
