import React from 'react';
import { colors } from '../../utils/constants';
import Modal from '../common/Modal';

const DeleteConfirmationModal = ({ course, onConfirm, onClose }) => (
  <Modal onClose={onClose}>
    <h3 className="text-lg font-semibold mb-4" style={{ color: colors.textDark }}>Confirm Deletion</h3>
    <p className="mb-6" style={{ color: colors.textGray }}>
      Are you sure you want to delete the course "{course.title}"? This action cannot be undone.
    </p>
    <div className="flex justify-end space-x-3">
      <button
        onClick={onClose}
        className="px-4 py-2"
        style={{ color: colors.textDark, background: colors.slateLight, border: 'none', cursor: 'pointer' }}
      >
        Cancel
      </button>
      <button
        onClick={() => { onConfirm(course.id); onClose(); }}
        className="px-4 py-2"
        style={{ background: '#dc2626', color: 'white', border: 'none', cursor: 'pointer' }}
      >
        Delete Course
      </button>
    </div>
  </Modal>
);

export default DeleteConfirmationModal;
