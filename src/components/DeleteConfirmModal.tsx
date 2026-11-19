import React, { useEffect } from 'react';
import { CancellationRecord } from '../../shared/types';

interface DeleteConfirmModalProps {
  record: CancellationRecord | null;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  record,
  deleting,
  onCancel,
  onConfirm,
}) => {
  useEffect(() => {
    if (!record) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !deleting) {
        onCancel();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [record, deleting, onCancel]);

  if (!record) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
    >
      <div
        className="fixed inset-0 bg-slate-900/45"
        onClick={() => !deleting && onCancel()}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-md bg-white border border-slate-200 rounded-lg shadow-lg p-6">
        <h2
          id="delete-modal-title"
          className="font-display text-base font-semibold text-slate-900"
        >
          Delete Cancellation Record
        </h2>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
          Remove <span className="font-medium text-slate-900">{record.bookingTitle}</span> (Ref{' '}
          <span className="font-mono text-xs">{record.referenceNumber}</span>) and its follow-up
          history? This action cannot be undone.
        </p>

        <div className="mt-5 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="px-4 py-2 text-sm font-medium text-white bg-red-700 rounded-md hover:bg-red-800 disabled:opacity-60 transition-colors whitespace-nowrap"
          >
            {deleting ? 'Deleting...' : 'Delete Record'}
          </button>
        </div>
      </div>
    </div>
  );
};
