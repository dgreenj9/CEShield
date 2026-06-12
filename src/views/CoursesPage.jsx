import React, { useMemo, useState } from 'react';
import { BookOpen, Plus, Pencil, Trash2, Download, FileText } from 'lucide-react';
import { colors } from '../utils/constants';
import { useUserData } from '../contexts/UserDataContext';
import { resolveCertificateUrl, resolveCertificateName } from '../services/certificateStorage';
import AddCourseModal from '../components/courses/AddCourseModal';
import DeleteConfirmationModal from '../components/courses/DeleteConfirmationModal';
import { PageHeader, Card, Button, EmptyState } from '../components/ui';

export default function CoursesPage() {
  const { courses, saveCourse, deleteCourse } = useUserData();
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [courseToDelete, setCourseToDelete] = useState(null);

  const sortedCourses = useMemo(
    () => [...courses].sort((a, b) => new Date(b.date) - new Date(a.date)),
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
      <PageHeader
        icon={BookOpen}
        title="Courses"
        subtitle={`Every CE course you've logged this cycle. ${courses.length} total.`}
        actions={
          <Button size="md" onClick={() => { setEditingCourse(null); setShowAddCourse(true); }}>
            <Plus size={16} aria-hidden="true" /> Add CE course
          </Button>
        }
      />

      <Card padding={courses.length === 0 ? 'none' : 'md'}>
        {courses.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="Nothing logged yet"
            description="Log your first CE course to start tracking hours, mandatory categories, and renewal status — all in one place."
            action={
              <Button onClick={() => setShowAddCourse(true)}>
                <Plus size={14} aria-hidden="true" /> Log a course
              </Button>
            }
            variant="dashed"
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${colors.slateLight}`, textAlign: 'left' }}>
                  {['Date', 'Course', 'Provider', 'Category', 'Hours', 'Actions'].map((header) => (
                    <th
                      key={header}
                      scope="col"
                      className="px-2 py-2 text-2xs font-semibold uppercase tracking-wider text-ink-gray"
                      style={{ textAlign: header === 'Hours' || header === 'Actions' ? 'center' : 'left' }}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedCourses.map((course) => (
                  <tr key={course.id} style={{ borderBottom: `1px solid ${colors.slateLight}` }}>
                    <td className="px-2 py-2 text-sm">
                      {new Date(course.date).toLocaleDateString()}
                    </td>
                    <td className="px-2 py-2 text-sm">
                      <div className="text-ink-dark">{course.title}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {course.format === 'selfStudy' && (
                          <span className="text-xs text-ink-gray">Self-study</span>
                        )}
                        {(course.certificate || course.certificate_storage) && (
                          <span className="inline-flex items-center text-xs text-green-600">
                            <FileText size={11} aria-hidden="true" className="mr-0.5" />
                            Certificate
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-2 text-sm">{course.provider}</td>
                    <td className="px-2 py-2 text-sm capitalize">
                      {course.category === 'culturalCompetency' && (
                        <span className="text-2xs text-brand-blue mr-1">(NEW)</span>
                      )}
                      {(course.category || '').replace(/([A-Z])/g, ' $1').trim()}
                    </td>
                    <td className="px-2 py-2 text-sm text-center">{course.hours}</td>
                    <td className="px-2 py-2 text-sm text-center">
                      <div className="flex items-center justify-center gap-1">
                        {(course.certificate || course.certificate_storage) && (
                          <button
                            type="button"
                            onClick={() => handleDownload(course)}
                            aria-label={`Download certificate for ${course.title}`}
                            title="Download certificate"
                            className="p-1 text-brand-blue hover:bg-brand-light-blue rounded"
                          >
                            <Download size={16} aria-hidden="true" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => { setEditingCourse(course); setShowAddCourse(true); }}
                          aria-label={`Edit ${course.title}`}
                          title="Edit course"
                          className="p-1 text-ink-gray hover:bg-slate-light rounded"
                        >
                          <Pencil size={16} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setCourseToDelete(course)}
                          aria-label={`Delete ${course.title}`}
                          title="Delete course"
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 size={16} aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

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
