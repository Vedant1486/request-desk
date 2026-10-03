import React from 'react';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

export default function ConfirmationModal({ show, request, onConfirm, onCancel, loading }) {
  if (!show || !request) return null;

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="modal-box" role="dialog" aria-modal="true" aria-labelledby="modal-title">

        {/* Header */}
        <div className="modal-top">
          <div className="modal-top-icon">📦</div>
          <div>
            <div className="modal-top-title" id="modal-title">Create Work Item</div>
            <div className="modal-top-sub">Review the details before confirming</div>
          </div>
        </div>

        {/* Body */}
        <div className="modal-middle">

          {/* Summary */}
          <div className="modal-summary">
            <div className="modal-row">
              <span className="modal-row-label">Customer</span>
              <span className="modal-row-value">{request.customer_name}</span>
            </div>
            <div className="modal-row">
              <span className="modal-row-label">Email</span>
              <span className="modal-row-value" style={{ fontWeight: 400, fontSize: '0.82rem', color: 'var(--gray-500)' }}>
                {request.customer_email}
              </span>
            </div>
            <div className="modal-row">
              <span className="modal-row-label">Service</span>
              <span className="modal-row-value">{request.requested_service}</span>
            </div>
            <div className="modal-row">
              <span className="modal-row-label">Scheduled Date</span>
              <span className="modal-row-value">{fmtDate(request.scheduled_date)}</span>
            </div>
          </div>

          {/* Warning */}
          <div className="modal-warning">
            <span style={{ fontSize: '1rem' }}>⚠️</span>
            <span>
              Are you sure you want to convert this qualified request into a work item?
              This action cannot be undone.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-bottom">
          <button
            className="btn-secondary-custom"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="btn-success-custom"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading
              ? <><span className="spinner-sm" style={{ display: 'inline-block', marginRight: '0.4rem' }} />Creating...</>
              : '📦 Create Work Item'}
          </button>
        </div>

      </div>
    </div>
  );
}
