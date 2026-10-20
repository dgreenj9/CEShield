import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]),' +
  ' select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Accessible modal: aria-modal, role=dialog, ESC closes, focus trapped within,
// click on backdrop closes, body scroll locked, returns focus to trigger.
//
// Keep this small. Anything more (transitions, stacking, route awareness)
// belongs in a real headless library; until we adopt one, this covers our
// five modal usages.
export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = 'md',
  closeOnBackdrop = true,
  ariaLabelledBy,
}) {
  const overlayRef = useRef(null);
  const dialogRef = useRef(null);
  const previouslyFocused = useRef(null);

  useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Move focus into the dialog
    requestAnimationFrame(() => {
      const node = dialogRef.current;
      if (!node) return;
      const focusables = node.querySelectorAll(FOCUSABLE_SELECTOR);
      const first = focusables[0];
      if (first) first.focus();
      else node.focus();
    });

    const handleKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose?.();
        return;
      }
      if (e.key !== 'Tab') return;
      const node = dialogRef.current;
      if (!node) return;
      const focusables = Array.from(node.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
        (el) => !el.hasAttribute('disabled') && el.tabIndex !== -1,
      );
      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = prevOverflow;
      const trigger = previouslyFocused.current;
      if (trigger && typeof trigger.focus === 'function') trigger.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizeClass = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[min(96vw,1100px)]',
  }[size] || 'max-w-lg';

  const titleId = ariaLabelledBy || (title ? 'modal-title' : undefined);

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(16,12,22,0.6)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
      onMouseDown={(e) => {
        if (closeOnBackdrop && e.target === overlayRef.current) onClose?.();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`rounded-md border border-white/12 w-full ${sizeClass} max-h-[90vh] overflow-y-auto outline-none animate-slide-up`}
        style={{ background: '#2B2434', boxShadow: '0 40px 80px rgba(13,8,26,0.45)' }}
      >
        {(title || onClose) && (
          <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-white/10">
            <div>
              {title ? (
                <h2 id={titleId} className="font-display text-2xl font-normal text-atlas-ink m-0 leading-tight">
                  {title}
                </h2>
              ) : null}
              {description ? (
                <p className="text-sm text-atlas-ink-muted mt-1">{description}</p>
              ) : null}
            </div>
            {onClose ? (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="text-atlas-ink-muted hover:text-atlas-ink hover:bg-white/5 w-11 h-11 -mr-3 -mt-2 flex items-center justify-center rounded-full transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-atlas-accent"
              >
                <X size={20} />
              </button>
            ) : null}
          </div>
        )}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

export const ModalFooter = ({ children, className = '' }) => (
  <div className={`mt-5 flex items-center justify-end gap-2 ${className}`}>{children}</div>
);
