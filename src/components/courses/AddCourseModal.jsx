import React, { useState, useEffect } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import { parseCertificate } from '../../utils/certificateParser';
import Modal from '../common/Modal';
import { A, FIG, INS } from '../atlas/theme';

const label = { display: 'block', fontFamily: FIG, fontSize: 13.5, fontWeight: 600, color: A.ink, marginBottom: 6 };
const hint = { fontFamily: FIG, fontSize: 12, color: A.inkMuted, fontWeight: 500 };
const field = {
  width: '100%',
  padding: '8px 10px',
  fontFamily: FIG,
  fontSize: 14,
  border: `1px solid ${A.ruleMinor}`,
  background: A.paper,
  color: A.ink,
  borderRadius: 0,
  boxSizing: 'border-box',
};

const AddCourseModal = ({ editingCourse, onSave, onClose }) => {
  const [course, setCourse] = useState({
    title: '', provider: '', date: '', hours: '', category: 'general',
    format: 'live', hasTest: false,
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
      alert('File size must be less than 5MB');
      e.target.value = '';
      return;
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a PDF or image file (JPG, PNG, WEBP)');
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

    const hoursNum = parseFloat(course.hours);
    if (isNaN(hoursNum) || hoursNum <= 0) {
      alert('Please enter valid hours');
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
      <h3 style={{ fontFamily: INS, fontWeight: 600, fontSize: 22, letterSpacing: '-0.02em', color: A.ink, margin: '0 0 1.25rem' }}>
        {editingCourse ? 'Edit the course' : 'Log a course'}
      </h3>

      <div className="space-y-4">
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
                style={{ ...field, border: `1px dashed ${A.ink}`, background: A.notice, cursor: 'pointer', fontSize: 13 }}
                disabled={isParsing}
              />
              {isParsing && (
                <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(250, 250, 245, 0.92)' }}>
                  <div className="text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" style={{ color: A.accent }} />
                    <div style={{ fontFamily: FIG, fontSize: 13.5, color: A.accent, fontWeight: 600 }}>Scanning the certificate…</div>
                  </div>
                </div>
              )}
            </div>
            {displayedCertificateName && (
              <div className="flex items-center justify-between" style={{ padding: '6px 10px', background: A.band, border: `1px solid ${A.ruleMinor}` }}>
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
                  style={{ fontFamily: FIG, fontSize: 12.5, fontWeight: 700, color: A.warn, background: 'none', border: 'none', cursor: 'pointer' }}
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
            <label style={label}>
              {f === 'title' ? 'Course title' : 'Provider name'} <span aria-hidden="true" style={{ color: A.warn }}>*</span>
            </label>
            <input
              type="text"
              value={course[f]}
              onChange={(e) => setCourse((prev) => ({ ...prev, [f]: e.target.value }))}
              style={field}
              required
            />
          </div>
        ))}

        <div>
          <label style={label}>Date completed <span aria-hidden="true" style={{ color: A.warn }}>*</span></label>
          <input
            type="date"
            value={course.date}
            onChange={(e) => setCourse((prev) => ({ ...prev, date: e.target.value }))}
            style={field}
            required
          />
        </div>

        <div>
          <label style={label}>
            Hours <span aria-hidden="true" style={{ color: A.warn }}>*</span> <span style={hint}>(1 hour = 50 minutes)</span>
          </label>
          <input
            type="number"
            step="0.5"
            min="0.5"
            value={course.hours}
            onChange={(e) => setCourse((prev) => ({ ...prev, hours: e.target.value }))}
            style={field}
            required
          />
        </div>

        <div>
          <label style={label}>Category <span aria-hidden="true" style={{ color: A.warn }}>*</span></label>
          <select
            value={course.category}
            onChange={(e) => setCourse((prev) => ({ ...prev, category: e.target.value }))}
            style={field}
          >
            <option value="general">General CE</option>
            <option value="ethics">Ethics</option>
            <option value="sexualHarassment">Sexual harassment prevention</option>
            <option value="culturalCompetency">Cultural competency (new 2025)</option>
            <option value="implicitBias">Implicit bias</option>
            <option value="dementia">Alzheimer&rsquo;s disease &amp; dementia</option>
          </select>
        </div>

        <div>
          <label style={label}>Format <span aria-hidden="true" style={{ color: A.warn }}>*</span></label>
          <select
            value={course.format}
            onChange={(e) => setCourse((prev) => ({ ...prev, format: e.target.value }))}
            style={field}
          >
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
            <label className="flex items-center" style={{ fontFamily: FIG, fontSize: 13.5, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={course.hasTest}
                onChange={(e) => setCourse((prev) => ({ ...prev, hasTest: e.target.checked }))}
                className="mr-2"
              />
              <span>Course included a test (required for self-study)</span>
            </label>
          </div>
        )}

        <div className="flex justify-end gap-2.5 mt-6">
          <button
            type="button"
            onClick={onClose}
            style={{ fontFamily: FIG, fontSize: 13.5, fontWeight: 600, padding: '9px 16px', color: A.ink, background: 'transparent', border: `1px solid ${A.ink}`, cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            style={{ fontFamily: FIG, fontSize: 13.5, fontWeight: 600, padding: '9px 16px', background: A.accent, color: A.onAccent, border: `1px solid ${A.accent}`, cursor: 'pointer' }}
          >
            {editingCourse ? 'Update the course' : 'Add the course'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default AddCourseModal;
