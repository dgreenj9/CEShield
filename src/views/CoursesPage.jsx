import React, { useMemo, useState } from 'react';
import { BookOpen, Plus, Pencil, Trash2, Download } from 'lucide-react';
import { useUserData } from '../contexts/UserDataContext';
import { resolveCertificateUrl, resolveCertificateName } from '../services/certificateStorage';
import AddCourseModal from '../components/courses/AddCourseModal';
import DeleteConfirmationModal from '../components/courses/DeleteConfirmationModal';
import { Button, EmptyState } from '../components/ui';
import { A, FIG, INS, eyebrow, tabularNums } from '../components/atlas/theme';

// Courses — the working end of the ledger. Rows echo the Compliance course
// log (Table 4): date · title · provider · category · certificate badge ·
// hours, with edit/delete/download actions on each row.

const labelize = (key) => (key || '').replace(/([A-Z])/g, ' $1').trim();

const iconBtn = (color) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 5,
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
      <header style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '2rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ ...eyebrow(), marginBottom: 8, ...tabularNums }}>
            {courses.length} course{courses.length === 1 ? '' : 's'} · {Math.round(totalHours * 10) / 10} h logged this cycle
          </div>
          <h1 className="cs-h1-clamp" style={{ fontFamily: INS, fontWeight: 600, fontSize: 36, lineHeight: 1.02, letterSpacing: '-0.025em', margin: 0 }}>
            The course log.
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
          description="Log your first CE course to start tracking hours, mandatory categories, and renewal status, all in one place."
          action={(
            <Button onClick={() => setShowAddCourse(true)}>
              <Plus size={14} aria-hidden="true" /> Log a course
            </Button>
          )}
          variant="dashed"
        />
      ) : (
        <div style={{ border: `1px solid ${A.ink}`, background: A.paper }}>
          <div style={{ padding: '12px 1.5rem', borderBottom: `1px solid ${A.ruleFaint}`, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 10 }}>
            <span style={{ fontFamily: FIG, fontSize: 12.5, letterSpacing: '0.02em', fontWeight: 700, color: A.inkMuted, ...tabularNums }}>
              Course log · {courses.length} entries
            </span>
            <span style={{ fontFamily: FIG, fontSize: 12, color: A.inkMuted }}>Newest first</span>
          </div>
          {sortedCourses.map((course, i) => (
            <div
              key={course.id}
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '0.62rem 1.5rem', borderBottom: i < sortedCourses.length - 1 ? `1px solid ${A.ruleFaintest}` : 'none' }}
            >
              <span style={{ fontFamily: FIG, fontSize: 12, color: A.inkMuted, width: 84, flexShrink: 0, ...tabularNums }}>
                {course.date
                  ? new Date(`${course.date}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
                  : '—'}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontWeight: 600, fontSize: 14.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: A.ink }}>
                  {course.title}
                </span>
                <span style={{ display: 'block', fontFamily: FIG, fontSize: 11.5, color: A.inkMuted, marginTop: 1, textTransform: 'capitalize' }}>
                  {[course.provider, labelize(course.category)].filter(Boolean).join(' · ')}
                  {course.format === 'selfStudy' ? ' · self-study' : ''}
                  {course.category === 'culturalCompetency' && (
                    <span style={{ color: A.warn, fontWeight: 700, marginLeft: 6, fontSize: 10.5, letterSpacing: '0.02em' }}>New 2025</span>
                  )}
                </span>
              </span>
              {(course.certificate || course.certificate_storage) && (
                <span style={{ fontFamily: FIG, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.02em', padding: '2px 8px', border: `1px solid ${A.accent}`, color: A.accent, flexShrink: 0 }}>
                  Certificate
                </span>
              )}
              <span style={{ fontFamily: FIG, fontSize: 16, fontWeight: 800, width: 52, textAlign: 'right', flexShrink: 0, ...tabularNums }}>
                {course.hours}
                <span style={{ fontSize: 11, color: A.inkMuted, fontWeight: 600 }}> h</span>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                {(course.certificate || course.certificate_storage) && (
                  <button
                    type="button"
                    onClick={() => handleDownload(course)}
                    aria-label={`Download certificate for ${course.title}`}
                    title="Download certificate"
                    style={iconBtn(A.accent)}
                  >
                    <Download size={15} aria-hidden="true" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => { setEditingCourse(course); setShowAddCourse(true); }}
                  aria-label={`Edit ${course.title}`}
                  title="Edit course"
                  style={iconBtn(A.inkMuted)}
                >
                  <Pencil size={15} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setCourseToDelete(course)}
                  aria-label={`Delete ${course.title}`}
                  title="Delete course"
                  style={iconBtn(A.warn)}
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
