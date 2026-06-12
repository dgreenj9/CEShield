import React from 'react';
import Modal, { ModalFooter } from './Modal';
import Button from './Button';

// Replacement for window.confirm() — keeps a11y / focus / styling consistent.
export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  onConfirm,
  onCancel,
  loading = false,
}) {
  return (
    <Modal open={open} onClose={onCancel} title={title} description={description} size="sm">
      <ModalFooter>
        <Button variant="ghost" onClick={onCancel} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button variant={variant} onClick={onConfirm} disabled={loading}>
          {loading ? 'Working…' : confirmLabel}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
