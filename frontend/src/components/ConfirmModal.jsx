import { useState } from 'react';

/**
 * A beautiful, animated confirmation modal that replaces window.confirm.
 * Usage:
 *   const { confirmModal, openConfirm } = useConfirm();
 *   // in JSX: {confirmModal}
 *   // to trigger: const ok = await openConfirm({ title, message, confirmLabel?, danger? })
 */
export function useConfirm() {
  const [state, setState] = useState(null); // { title, message, confirmLabel, danger, resolve }

  const openConfirm = ({ title, message, confirmLabel = 'Confirm', danger = false }) =>
    new Promise((resolve) => {
      setState({ title, message, confirmLabel, danger, resolve });
    });

  const handleClose = (result) => {
    if (state?.resolve) state.resolve(result);
    setState(null);
  };

  const confirmModal = state ? (
    <div className="confirm-overlay" onClick={() => handleClose(false)}>
      <div
        className="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="confirm-icon-wrap" data-danger={String(state.danger)}>
          {state.danger ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          )}
        </div>
        <h3 id="confirm-title" className="confirm-title">{state.title}</h3>
        <p id="confirm-message" className="confirm-message">{state.message}</p>
        <div className="confirm-actions">
          <button className="confirm-btn confirm-btn-cancel" onClick={() => handleClose(false)}>
            Cancel
          </button>
          <button
            className={`confirm-btn ${state.danger ? 'confirm-btn-danger' : 'confirm-btn-primary'}`}
            onClick={() => handleClose(true)}
            autoFocus
          >
            {state.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return { confirmModal, openConfirm };
}
