'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FaTrashAlt } from 'react-icons/fa';

interface DeleteConfirmModalProps {
  open: boolean;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmModal({
  open,
  title = 'Delete this recipe?',
  description = 'This will permanently remove the recipe and its image. This action cannot be undone.',
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  loading = false,
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const triggerElement = document.activeElement as HTMLElement | null;
    cancelButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        onCancel();
        return;
      }

      if (e.key === 'Tab') {
        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled)'
        );
        if (!focusable || focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      triggerElement?.focus();
    };
  }, [open, loading, onCancel]);

  if (!open) return null;

  return createPortal(
    <div
      className='fixed inset-0 z-[100] flex items-center justify-center p-4'
      role='presentation'
    >
      <div
        className='absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-fade-in'
        onClick={(e) => {
          e.stopPropagation();
          if (!loading) onCancel();
        }}
      />

      <div
        ref={dialogRef}
        role='alertdialog'
        aria-modal='true'
        aria-labelledby='delete-modal-title'
        aria-describedby='delete-modal-description'
        onClick={(e) => e.stopPropagation()}
        className='relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 sm:p-8 animate-scale-in'
      >
        <div className='w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5'>
          <FaTrashAlt className='w-6 h-6 text-red-500' />
        </div>

        <h2
          id='delete-modal-title'
          className='text-xl font-bold text-gray-800 text-center mb-2'
        >
          {title}
        </h2>
        <p
          id='delete-modal-description'
          className='text-gray-600 text-center mb-8'
        >
          {description}
        </p>

        <div className='flex gap-3'>
          <button
            ref={cancelButtonRef}
            type='button'
            onClick={onCancel}
            disabled={loading}
            className='flex-1 px-4 py-3 rounded-full font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {cancelLabel}
          </button>
          <button
            type='button'
            onClick={onConfirm}
            disabled={loading}
            className='flex-1 px-4 py-3 rounded-full font-medium text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2'
          >
            {loading ? (
              <>
                <svg
                  className='animate-spin h-4 w-4 text-white'
                  fill='none'
                  viewBox='0 0 24 24'
                >
                  <circle
                    className='opacity-25'
                    cx='12'
                    cy='12'
                    r='10'
                    stroke='currentColor'
                    strokeWidth='4'
                  ></circle>
                  <path
                    className='opacity-75'
                    fill='currentColor'
                    d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                  ></path>
                </svg>
                Deleting...
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(8px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.15s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>,
    document.body
  );
}
