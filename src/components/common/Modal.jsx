import React from 'react';

const Modal = ({ children, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="w-full max-w-md max-h-[90vh] overflow-y-auto"
         style={{ background: '#292331', padding: '2rem', border: '1px solid #F6EEE9' }}>
      {children}
    </div>
  </div>
);

export default Modal;
