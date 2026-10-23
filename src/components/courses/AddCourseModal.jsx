import React, { useState, useEffect } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import { parseCertificate } from '../../utils/certificateParser';
import Modal from '../common/Modal';
import { A, FIG, LINE2 } from '../atlas/theme';

// Plum form: labels in body ink, plum fields (.plum-input) with a peach
// focus ring, pill actions.
const label = { display: 'block', fontFamily: FIG, fontSize: 13, fontWeight: 500, color: A.inkBody, marginBottom: 8 };
const hint = { fontFamily: FIG, fontSize: 12, color: A.inkMuted, fontWeight: 400 };
const field = { fontFamily: FIG, fontSize: 14, boxSizing: 'border-box' };
const fieldClass = 'plum-input';

const AddCourseModal = ({ editingCourse, initialCourse, onSave, onClose }) => {
  const [course, setCourse] = useState({
    title: initialCourse?.title || '', provider: initialCourse?.provider || '', date: '', hours: '', category: initialCourse ? '' : 'general',
    format: initialCourse ? '' : 'live', hasTest: false,
    // Track three certificate states:
    //   certificateFile     — newly picked File, pending upload (server-side)
    //   certificate_storage — existing Storage descriptor on an edited course
    //   certificate         — legacy base64 blob on an unmigrated course
    certificateFile: null,
    certificate_storage: null,
    certificate: null,
  });
  const [isParsing, setIsParsing] = useState(false);

  useEffect(() => {
    if (editingCourse) {
      setCourse({
        title: editingCourse.title,
        provider: editingCourse.provider,
        date: editingCourse.date,
        hours: editingCourse.hours.toString(),
        category: editingCourse.category,
        format: editingCourse.format,
        hasTest: editingCourse.has_test || false,
        certificateFile: null,
        certificate_storage: editingCourse.certificate_storage || null,
        certificate: editingCourse.certificate || null,
      });
    }
  }, [editingCourse]);

  const handleCertificateUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('That file is over 5 MB. Upload a smaller file.');
      e.target.value = '';
      return;
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('That file type is not supported. Upload a PDF, JPG, PNG, or WEBP.');
      e.target.value = '';
      return;
    }

    // Hold the raw File. Upload happens in saveCourse so the storage path
    // can include the course id (or 'pending' for new courses).
    setCourse((prev) => ({
      ...prev,
      certificateFile: file,
      // Clear legacy/old descriptors so the save handler knows we want the
      // new file to win.
      certificate: null,
      certificate_storage: null,
    }));

    if (!editingCourse && file.type !== 'application/pdf') {
      // Skip the confirm dialog — auto-scan is cheap and the user can edit.
      setIsParsing(true);
      try {
        const parsedData = await parseCertificate(file);
        if (parsedData) {
          setCourse((prev) => ({
            ...prev,
            title: parsedData.title || prev.title,
            provider: parsedData.provider || prev.provider,
            date: parsedData.date || prev.date,
            hours: parsedData.hours || prev.hours,
            category: parsedData.category || prev.category,
          }));
        }
      } finally {
        setIsParsing(false);
      }
    }
    e.target.value = '';
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();

    if (!course.title.trim() || !course.provider.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(course.date) || !Number.isFinite(Date.parse(course.date)) || new Date(course.date).toISOString().slice(0, 10) !== course.date || course.date > new Date().toISOString().slice(0, 10)) {
      alert('Enter a title, provider, and valid completion date no later than today.');
      return;
    }
    const hoursNum = Number(course.hours);
    if (!Number.isFinite(hoursNum) || hoursNum <= 0) {
      alert('Hours must be a number above zero.');
      return;
    }

    if (!course.category || !course.format) {
      alert('Confirm the course category and delivery format before logging completion.');
      return;
    }
    if (course.format === 'selfStudy' && !course.hasTest) {
      alert('Self-study courses must include a test to count for CE');
      return;
    }

    const success = await onSave(course, editingCourse?.id);
    if (success) {
      setCourse({
        title: '', provider: '', date: '', hours: '', category: 'general',
        format: 'live', hasTest: false,
        certificateFile: null, certificate_storage: null, certificate: null,
      });
      onClose();
    }
  };

  const displayedCertificateName =
    course.certificateFile?.name ||
    course.certificate_storage?.name ||
    course.certificate?.name ||
    null;

  return (
    <Modal onClose={onClose}>
      <h3 style={{ fontFamily: FIG, fontWeight: 380, fontSize: 26, letterSpacing: '-0.035em', lineHeight: 1.15, color: A.ink, margin: '0 0 1.5rem' }}>
        {editingCourse ? 'Edit the course' : 'Log a course'}
      </h3>

      <div className="space-y-4">
        {initialCourse && !editingCourse && <p style={{...hint,lineHeight:1.6}}>From your learning plan. Enter the completion date and credited hours from your certificate; confirm category and format. {initialCourse.suggestedHours != null && `The provider listed ${initialCourse.suggestedHours} contact hours.`} <a href={initialCourse.sourceUrl} target="_blank" rel="noopener noreferrer">Course source ↗</a></p>}
        <div>
          <label style={label}>
            Certificate or documentation <span style={hint}>(PDF, JPG, PNG)</span>
          </label>
          <div className="space-y-2">
            <div className="relative">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleCertificateUpload}
                className={fieldClass}
                style={{ ...field, borderStyle: 'dashed', cursor: 'pointer', fontSize: 13, paddingTop: 10 }}
                disabled={isParsing}
              />
              {isParsing && (
                <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(43, 36, 52, 0.94)', borderRadius: 6 }}>
                  <div className="text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" style={{ color: A.accent }} />
                    <div style={{ fontFamily: FIG, fontSize: 13.5, color: A.accent, fontWeight: 500 }}>Scanning the certificate…</div>
                  </div>
                </div>
              )}
            </div>
            {displayedCertificateName && (
              <div className="flex items-center justify-between" style={{ padding: '4px 4px 4px 12px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${LINE2}`, borderRadius: 6 }}>
                <span className="truncate" style={{ fontFamily: FIG, fontSize: 13, color: A.inkBody }}>
                  <FileText className="inline w-4 h-4 mr-1" aria-hidden="true" />
                  {displayedCertificateName}
                </span>
                <button
                  type="button"
                  onClick={() => setCourse((prev) => ({
                    ...prev,
                    certificateFile: null,
                    certificate: null,
                    certificate_storage: null,
                  }))}
                  style={{ fontFamily: FIG, fontSize: 12.5, fontWeight: 500, color: A.warn, background: 'none', border: 'none', cursor: 'pointer', minHeight: 40, padding: '0 10px' }}
                  aria-label={`Remove ${displayedCertificateName}`}
                >
                  Remove
                </button>
              </div>
            )}
            <p style={{ ...hint, margin: 0 }}>
              Upload any supporting documentation: certificates, attendance lists, teaching records.
              {!editingCourse && ' Images can be scanned for auto-fill.'}
            </p>
          </div>
        </div>

        {['title', 'provider'].map((f) => (
          <div key={f}>
            <label htmlFor={`course-${f}`} style={label}>
              {f === 'title' ? 'Course title' : 'Provider name'} <span aria-hidden="true" style={{ color: A.warn }}>*</span>
            </label>
            <input
              id={`course-${f}`}
              className={fieldClass}
              type="text"
              value={course[f]}
              onChange={(e) => setCourse((prev) => ({ ...prev, [f]: e.target.value }))}
              style={field}
              required
            />
          </div>
        ))}

        <div>
          <label htmlFor="course-date" style={label}>Date completed <span aria-hidden="true" style={{ color: A.warn }}>*</span></label>
          <input
            id="course-date"
            className={fieldClass}
            type="date"
            value={course.date}
            onChange={(e) => setCourse((prev) => ({ ...prev, date: e.target.value }))}
            style={field}
            required
          />
        </div>

        <div>
          <label style={label} htmlFor="course-hours">
            Hours <span aria-hidden="true" style={{ color: A.warn }}>*</span> <span style={hint}>(credited hours from your documentation)</span>
          </label>
          <input
            id="course-hours"
            className={fieldClass}
            type="number"
            step="any"
            min="0.01"
            value={course.hours}
            onChange={(e) => setCourse((prev) => ({ ...prev, hours: e.target.value }))}
            style={field}
            required
          />
        </div>

        <div>
          <label htmlFor="course-category" style={label}>Category <span aria-hidden="true" style={{ color: A.warn }}>*</span></label>
          <select
            id="course-category"
            className={fieldClass}
            value={course.category}
            onChange={(e) => setCourse((prev) => ({ ...prev, category: e.target.value }))}
            style={field}
          >
            <option value="" disabled>Choose category</option>
            <option value="general">General CE</option>
            <option value="ethics">Ethics</option>
            <option value="sexualHarassment">Sexual harassment prevention</option>
            <option value="culturalCompetency">Cultural competency (new 2025)</option>
            <option value="implicitBias">Implicit bias</option>
            <option value="dementia">Alzheimer&rsquo;s disease &amp; dementia</option>
          </select>
        </div>

        <div>
          <label htmlFor="course-format" style={label}>Format <span aria-hidden="true" style={{ color: A.warn }}>*</span></label>
          <select
            id="course-format"
            className={fieldClass}
            value={course.format}
            onChange={(e) => setCourse((prev) => ({ ...prev, format: e.target.value }))}
            style={field}
          >
            <option value="" disabled>Choose delivery format</option>
            <option value="live">Live / in person</option>
            <option value="selfStudy">Self-study / online</option>
            <option value="teaching">Teaching</option>
            <option value="clinicalInstructor">Clinical instructor</option>
            <option value="journalClubs">Journal club</option>
            <option value="inservices">Departmental inservice</option>
            <option value="districtMeetings">IPTA district meeting</option>
            <option value="skillsCertification">Skills certification (CPR, etc.)</option>
          </select>
        </div>

        {course.format === 'selfStudy' && (
          <div>
            <label className="flex items-center" style={{ fontFamily: FIG, fontSize: 13.5, color: A.inkBody, cursor: 'pointer', minHeight: 44 }}>
              <input
                type="checkbox"
                checked={course.hasTest}
                onChange={(e) => setCourse((prev) => ({ ...prev, hasTest: e.target.checked }))}
                className="mr-2"
                style={{ width: 18, height: 18 }}
              />
              <span>Course included a test (required for self-study)</span>
            </label>
          </div>
        )}

        <div className="flex justify-end gap-2.5 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="atlas-btn atlas-btn-secondary"
            style={{ fontFamily: FIG, fontSize: 14, padding: '0 20px', minHeight: 44 }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="atlas-btn atlas-btn-primary"
            style={{ fontFamily: FIG, fontSize: 14, padding: '0 20px', minHeight: 44 }}
          >
            {editingCourse ? 'Update the course' : 'Add the course'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default AddCourseModal;
