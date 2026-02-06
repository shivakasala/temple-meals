import React from 'react';

export default function Modal({ isOpen, title, children, onClose, onSubmit, submitText = 'Save' }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-800">{title}</h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>
        <div className="space-y-4">
          {children}
        </div>
        <div className="flex gap-3 mt-6 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200"
          >
            Cancel
          </button>
          {onSubmit && (
            <button
              onClick={onSubmit}
              className="px-4 py-2 rounded text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              {submitText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
