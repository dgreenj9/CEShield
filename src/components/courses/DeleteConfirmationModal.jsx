import React from 'react';
import Modal from '../common/Modal';
import { A, FIG, INS } from '../atlas/theme';

// Destructive confirmation. Atlas has no red — ochre is the warning voice.
const DeleteConfirmationModal = ({ course, onConfirm, onClose }) => (
  <Modal onClose={onClose}>
    <h3 style={{ fontFamily: INS, fontWeight: 600, fontSize: 22, letterSpacing: '-0.02em', color: A.ink, margin: '0 0 0.9rem' }}>
      Delete this course?
    </h3>
    <p style={{ fontFamily: FIG, fontSize: 14.5, color: A.inkBody, lineHeight: 1.55, margin: '0 0 1.5rem' }}>
      &ldquo;{course.title}&rdquo; will be removed from your log. This cannot be undone.
    </p>
    <div className="flex justify-end gap-2.5">
      <button
        type="button"
        onClick={onClose}
        style={{ fontFamily: FIG, fontSize: 13.5, fontWeight: 600, padding: '9px 16px', color: A.ink, background: 'transparent', border: `1px solid ${A.ink}`, cursor: 'pointer' }}
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={() => { onConfirm(course.id); onClose(); }}
        style={{ fontFamily: FIG, fontSize: 13.5, fontWeight: 600, padding: '9px 16px', background: A.warn, color: A.onAccent, border: `1px solid ${A.warn}`, cursor: 'pointer' }}
      >
        Delete the course
      </button>
    </div>
  </Modal>
);

export default DeleteConfirmationModal;
