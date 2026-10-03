import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import ConfirmationModal from '../components/ConfirmationModal.jsx';
import RequestForm from '../components/RequestForm.jsx';
import api from '../api';

function StatusBadge({ status }) {
  return <span className={`status-badge status-${status}`}>{status}</span>;
}

function fmt(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}
function fmtTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function dotClass(type) {
  if (type === 'REQUEST_CREATED')  return 'created';
  if (type === 'REQUEST_UPDATED')  return 'updated';
  if (type === 'WORK_ITEM_CREATED') return 'converted';
  return 'created';
}

export default function RequestDetails() {
  const { id }    = useParams();
  const navigate  = useNavigate();

  const [request,      setRequest]      = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [showModal,    setShowModal]    = useState(false);
  const [converting,   setConverting]   = useState(false);
  const [convertError, setConvertError] = useState('');
  const [showEdit,     setShowEdit]     = useState(false);
  const [successMsg,   setSuccessMsg]   = useState('');

  useEffect(() => { loadRequest(); }, [id]);

  async function loadRequest() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/requests/${id}`);
      setRequest(res.data);
    } catch (err) {
      setError(err.response?.status === 404
        ? 'Request not found or you do not have access to it.'
        : 'Failed to load request.');
    } finally {
      setLoading(false);
    }
  }

  async function handleConvert() {
    setConverting(true);
    setConvertError('');
    try {
      await api.post(`/requests/${id}/convert`);
      setShowModal(false);
      setSuccessMsg('Work item created successfully! ✓');
      setTimeout(() => setSuccessMsg(''), 3500);
      await loadRequest();
    } catch (err) {
      setConvertError(err.response?.data?.message || 'Conversion failed.');
    } finally {
      setConverting(false);
    }
  }

  function handleEditSuccess() {
    setShowEdit(false);
    setSuccessMsg('Request updated successfully! ✓');
    setTimeout(() => setSuccessMsg(''), 3500);
    loadRequest();
  }

  /* ---- Loading ---- */
  if (loading) return (
    <>
      <Navbar />
      <div className="page-content">
        <div className="loading-state" style={{ minHeight: '40vh' }}>
          <div className="spinner" style={{ width: 32, height: 32 }} />
          <span>Loading request...</span>
        </div>
      </div>
    </>
  );

  /* ---- Error ---- */
  if (error) return (
    <>
      <Navbar />
      <div className="page-content">
        <div className="alert-custom alert-danger-custom" style={{ maxWidth: 500 }}>
          ⚠️ {error}
        </div>
        <button className="back-btn mt-3" onClick={() => navigate('/')}>← Back to Dashboard</button>
      </div>
    </>
  );

  if (!request) return null;

  const hasWorkItem = Boolean(request.work_item);

  return (
    <>
      <Navbar />
      <div className="page-content">

        {/* Page Header */}
        <div className="page-header">
          <div>
            <button className="back-btn mb-2" onClick={() => navigate('/')}>← Back to Dashboard</button>
            <h1 className="page-title">Request #{request.id}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.3rem' }}>
              <StatusBadge status={request.status} />
              <span style={{ color: 'var(--gray-400)', fontSize: '0.78rem' }}>
                Created {fmt(request.created_at)}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {!showEdit && (
              <button className="btn-secondary-custom" onClick={() => setShowEdit(true)}>
                ✏️ Edit
              </button>
            )}
          </div>
        </div>

        {/* Edit Form */}
        {showEdit && (
          <RequestForm
            initial={request}
            onSuccess={handleEditSuccess}
            onCancel={() => setShowEdit(false)}
          />
        )}

        {/* Two-col layout */}
        <div className="detail-grid">

          {/* Customer Info */}
          <div className="card">
            <div className="card-header-custom">
              <span className="card-header-label">👤 Customer</span>
            </div>
            <div className="card-body-custom">
              <div className="detail-item">
                <div className="detail-label">Name</div>
                <div className="detail-value">{request.customer_name}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Email</div>
                <div className="detail-value">
                  <a href={`mailto:${request.customer_email}`} style={{ color: 'var(--primary)' }}>
                    {request.customer_email}
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Request Info */}
          <div className="card">
            <div className="card-header-custom">
              <span className="card-header-label">📋 Request Info</span>
            </div>
            <div className="card-body-custom">
              <div className="detail-item">
                <div className="detail-label">Service</div>
                <div className="detail-value">{request.requested_service}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Scheduled</div>
                <div className="detail-value">{fmt(request.scheduled_date)}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Status</div>
                <div className="detail-value"><StatusBadge status={request.status} /></div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Last Updated</div>
                <div className="detail-value" style={{ fontSize: '0.82rem', color: 'var(--gray-500)' }}>{fmtTime(request.updated_at)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="card mb-3">
          <div className="card-header-custom">
            <span className="card-header-label">📝 Description</span>
          </div>
          <div className="card-body-custom">
            <div className="description-box">{request.description}</div>
          </div>
        </div>

        {/* Work Item Section */}
        <div className="mb-3">
          <div className="section-heading">📦 Work Item</div>

          {hasWorkItem ? (
            <div className="work-item-banner">
              <div className="work-item-stamp">✓ Converted</div>
              <div className="work-item-grid">
                <div>
                  <div className="wi-field-label">Work Item ID</div>
                  <div className="wi-field-value">#{request.work_item.id}</div>
                </div>
                <div>
                  <div className="wi-field-label">Created At</div>
                  <div className="wi-field-value">{fmtTime(request.work_item.created_at)}</div>
                </div>
                <div>
                  <div className="wi-field-label">Title</div>
                  <div className="wi-field-value" style={{ gridColumn: 'span 2' }}>{request.work_item.title}</div>
                </div>
              </div>
            </div>
          ) : request.status === 'QUALIFIED' ? (
            <div className="convert-prompt">
              <div className="convert-prompt-text">
                <strong>🎯 Ready to Convert</strong>
                This request is <strong>QUALIFIED</strong> and ready to be converted into a work item.
              </div>
              <button
                className="btn-success-custom"
                onClick={() => { setConvertError(''); setShowModal(true); }}
              >
                📦 Create Work Item
              </button>
            </div>
          ) : (
            <div style={{
              background: 'var(--gray-50)',
              border: '1px solid var(--gray-200)',
              borderRadius: 'var(--radius)',
              padding: '1.25rem',
              color: 'var(--gray-400)',
              fontSize: '0.875rem',
              textAlign: 'center',
            }}>
              No work item created yet.
              {request.status !== 'QUALIFIED' && (
                <span style={{ display: 'block', marginTop: '0.25rem', fontSize: '0.78rem' }}>
                  Set status to <strong>QUALIFIED</strong> to enable conversion.
                </span>
              )}
            </div>
          )}

          {convertError && (
            <div className="alert-custom alert-danger-custom mt-2">⚠️ {convertError}</div>
          )}
        </div>

        {/* Activity Timeline */}
        <div className="mb-3">
          <div className="section-heading">🕐 Activity Timeline</div>

          {request.activities && request.activities.length > 0 ? (
            <div className="timeline-wrap">
              {request.activities.map(a => (
                <div key={a.id} className="t-item">
                  <div className={`t-dot ${dotClass(a.activity_type)}`} />
                  <div className="t-card">
                    <div className={`t-type ${dotClass(a.activity_type)}`}>{a.activity_type.replace(/_/g, ' ')}</div>
                    <div className="t-message">{a.message}</div>
                    <div className="t-meta">
                      {a.user_name && <span>👤 {a.user_name}</span>}
                      <span>🕐 {fmtTime(a.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              background: 'var(--gray-50)',
              border: '1px solid var(--gray-200)',
              borderRadius: 'var(--radius)',
              padding: '1.5rem',
              color: 'var(--gray-400)',
              textAlign: 'center',
              fontSize: '0.875rem',
            }}>
              No activity recorded yet.
            </div>
          )}
        </div>

      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        show={showModal}
        request={request}
        onCancel={() => setShowModal(false)}
        onConfirm={handleConvert}
        loading={converting}
      />

      {/* Success Toast */}
      {successMsg && (
        <div className="success-toast">✅ {successMsg}</div>
      )}
    </>
  );
}
