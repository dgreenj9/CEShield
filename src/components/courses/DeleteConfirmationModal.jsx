import React from 'react';
import Modal from '../common/Modal';
import { A, FIG } from '../atlas/theme';

// Destructive confirmation. Atlas has no red — ochre is the warning voice.
const DeleteConfirmationModal = ({ course, onConfirm, onClose }) => (
  <Modal onClose={onClose}>
    <h3 style={{ fontFamily: FIG, fontWeight: 380, fontSize: 26, letterSpacing: '-0.035em', lineHeight: 1.15, color: A.ink, margin: '0 0 0.9rem' }}>
      Delete this course?
    </h3>
    <p style={{ fontFamily: FIG, fontSize: 14.5, color: A.inkBody, lineHeight: 1.55, margin: '0 0 1.5rem' }}>
      &ldquo;{course.title}&rdquo; will be removed from your log. This cannot be undone.
    </p>
    <div className="flex justify-end gap-2.5">
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
        onClick={() => { onConfirm(course.id); onClose(); }}
        className="atlas-btn"
        style={{ fontFamily: FIG, fontSize: 14, padding: '0 20px', minHeight: 44, background: A.warn, color: A.onAccent, border: `1px solid ${A.warn}` }}
      >
        Delete the course
      </button>
    </div>
  </Modal>
);

export default DeleteConfirmationModal;
