import React, { useState, useEffect } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import { colors } from '../../utils/constants';
import { parseCertificate } from '../../utils/certificateParser';
import Modal from '../common/Modal';

const AddCourseModal = ({ editingCourse, onSave, onClose }) => {
  const [course, setCourse] = useState({
    title: '', provider: '', date: '', hours: '', category: 'general',
    format: 'live', hasTest: false, certificate: null
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
        certificate: editingCourse.certificate
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
    
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a PDF or image file (JPG, PNG)');
      e.target.value = '';
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = async () => {
      setCourse(prev => ({
        ...prev,
        certificate: { name: file.name, type: file.type, data: reader.result }
      }));

      if (!editingCourse && file.type !== 'application/pdf') {
        if (window.confirm('Would you like to scan this certificate to auto-fill the form fields?')) {
          setIsParsing(true);
          const parsedData = await parseCertificate(file);
          setIsParsing(false);
          
          if (parsedData) {
            setCourse(prev => ({
              ...prev,
              title: parsedData.title || prev.title,
              provider: parsedData.provider || prev.provider,
              date: parsedData.date || prev.date,
              hours: parsedData.hours || prev.hours,
              category: parsedData.category || prev.category
            }));
          }
        }
      }
    };
    reader.readAsDataURL(file);
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
        format: 'live', hasTest: false, certificate: null
      });
      onClose();
    }
  };

  return (
    <Modal onClose={onClose}>
      <h3 className="text-lg font-semibold mb-4" style={{ color: colors.textDark }}>
        {editingCourse ? 'Edit CE Course' : 'Add CE Course'}
      </h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: colors.textDark }}>
            Upload Certificate/Documentation <span className="text-xs" style={{ color: colors.textGray }}>(PDF, JPG, PNG)</span>
          </label>
          <div className="space-y-2">
            <div className="relative">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleCertificateUpload}
                className="w-full px-3 py-2 text-sm"
                style={{ border: `1px solid ${colors.slateLight}`, background: colors.grayLight }}
                disabled={isParsing}
              />
              {isParsing && (
                <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(255, 255, 255, 0.9)' }}>
                  <div className="text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" style={{ color: colors.primaryBlue }} />
                    <div className="text-sm" style={{ color: colors.primaryBlue }}>Scanning certificate...</div>
                  </div>
                </div>
              )}
            </div>
            {course.certificate && (
              <div className="flex items-center justify-between p-2" style={{ background: colors.grayLight }}>
                <span className="text-sm truncate" style={{ color: colors.textGray }}>
                  <FileText className="inline w-4 h-4 mr-1" />
                  {course.certificate.name}
                </span>
                <button
                  type="button"
                  onClick={() => setCourse(prev => ({...prev, certificate: null}))}
                  className="text-sm"
                  style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Remove
                </button>
              </div>
            )}
            <p className="text-xs" style={{ color: colors.textGray }}>
              Upload any supporting documentation: certificates, attendance lists, teaching records, etc.
              {!editingCourse && ' • Images can be scanned for auto-fill.'}
            </p>
          </div>
        </div>

        {['title', 'provider'].map(field => (
          <div key={field}>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.textDark }}>
              {field === 'title' ? 'Course Title' : 'Provider Name'} *
            </label>
            <input
              type="text"
              value={course[field]}
              onChange={(e) => setCourse(prev => ({...prev, [field]: e.target.value}))}
              className="w-full px-3 py-2"
              style={{ border: `1px solid ${colors.slateLight}`, background: colors.grayLight }}
              required
            />
          </div>
        ))}

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: colors.textDark }}>Date Completed *</label>
          <input
            type="date"
            value={course.date}
            onChange={(e) => setCourse(prev => ({...prev, date: e.target.value}))}
            className="w-full px-3 py-2"
            style={{ border: `1px solid ${colors.slateLight}`, background: colors.grayLight }}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: colors.textDark }}>
            Hours * <span className="text-xs" style={{ color: colors.textGray }}>(1 hour = 50 minutes)</span>
          </label>
          <input
            type="number"
            step="0.5"
            min="0.5"
            value={course.hours}
            onChange={(e) => setCourse(prev => ({...prev, hours: e.target.value}))}
            className="w-full px-3 py-2"
            style={{ border: `1px solid ${colors.slateLight}`, background: colors.grayLight }}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: colors.textDark }}>Category *</label>
          <select
            value={course.category}
            onChange={(e) => setCourse(prev => ({...prev, category: e.target.value}))}
            className="w-full px-3 py-2"
            style={{ border: `1px solid ${colors.slateLight}`, background: colors.grayLight }}
          >
            <option value="general">General CE</option>
            <option value="ethics">Ethics</option>
            <option value="sexualHarassment">Sexual Harassment Prevention</option>
            <option value="culturalCompetency">Cultural Competency (NEW 2025)</option>
            <option value="implicitBias">Implicit Bias</option>
            <option value="dementia">Alzheimer's Disease & Dementia</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: colors.textDark }}>Format *</label>
          <select
            value={course.format}
            onChange={(e) => setCourse(prev => ({...prev, format: e.target.value}))}
            className="w-full px-3 py-2"
            style={{ border: `1px solid ${colors.slateLight}`, background: colors.grayLight }}
          >
            <option value="live">Live/In-Person</option>
            <option value="selfStudy">Self-Study/Online</option>
            <option value="teaching">Teaching</option>
            <option value="clinicalInstructor">Clinical Instructor</option>
            <option value="journalClubs">Journal Club</option>
            <option value="inservices">Departmental Inservice</option>
            <option value="districtMeetings">IPTA District Meeting</option>
            <option value="skillsCertification">Skills Certification (CPR, etc.)</option>
          </select>
        </div>

        {course.format === 'selfStudy' && (
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={course.hasTest}
                onChange={(e) => setCourse(prev => ({...prev, hasTest: e.target.checked}))}
                className="mr-2"
              />
              <span className="text-sm">Course included a test (required for self-study)</span>
            </label>
          </div>
        )}

        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2"
            style={{ color: colors.textDark, background: colors.slateLight, border: 'none', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-2"
            style={{ background: colors.primaryBlue, color: 'white', border: 'none', cursor: 'pointer' }}
          >
            {editingCourse ? 'Update Course' : 'Add Course'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default AddCourseModal;
