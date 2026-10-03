import React from 'react';

export default function ConfirmationModal({ show, request, onConfirm, onCancel, loading }) {
  if (!show) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 1040,
        }}
        onClick={onCancel}
      />
      {/* Dialog */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1050,
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '24px',
          minWidth: '400px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
        }}
      >
        <h5 className="mb-3">Convert to Work Item</h5>
        {request && (
          <div className="mb-4">
            <p className="mb-1"><strong>Customer:</strong> {request.customer_name}</p>
            <p className="mb-1"><strong>Service:</strong> {request.requested_service}</p>
            <p className="mb-1">
              <strong>Scheduled Date:</strong>{' '}
              {request.scheduled_date
                ? new Date(request.scheduled_date).toLocaleDateString()
                : '—'}
            </p>
          </div>
        )}
        <p className="text-muted">A work item will be created from this request.</p>
        <div className="d-flex justify-content-end gap-2 mt-3">
          <button className="btn btn-secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button className="btn btn-success" onClick={onConfirm} disabled={loading}>
            {loading ? 'Creating...' : 'Create Work Item'}
          </button>
        </div>
      </div>
    </>
  );
}
