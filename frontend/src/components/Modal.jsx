import React, { useEffect } from 'react';

export default function Modal({ isOpen, title, children, onClose, onSubmit, submitText = 'Save' }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="py-5">{children}</div>

        {/* Footer */}
        <div className="flex gap-3 pt-4 border-t border-slate-100 justify-end">
          <button onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          {onSubmit && (
            <button onClick={onSubmit} className="btn btn-primary">
              {submitText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
