import React from 'react';

const Modal = ({ children, onClose }) => (
  <div className="fixed inset-0 flex items-center justify-center p-4 z-[200]" style={{ background: 'rgba(16,12,22,0.6)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}>
    <div role="dialog" aria-modal="true" className="w-full max-w-md max-h-[90vh] overflow-y-auto animate-slide-up"
         style={{ background: '#2B2434', padding: '2rem', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, boxShadow: '0 40px 80px rgba(13,8,26,0.45)' }}>
      {children}
    </div>
  </div>
);

export default Modal;
