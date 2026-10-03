import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import ConfirmationModal from '../components/ConfirmationModal.jsx';
import api from '../api';

export default function RequestDetails() {
  const { id } = useParams();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [converting, setConverting] = useState(false);
  const [convertError, setConvertError] = useState('');

  useEffect(() => {
    loadRequest();
  }, [id]);

  async function loadRequest() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/requests/${id}`);
      setRequest(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load request.');
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(e) {
    const newStatus = e.target.value;
    setUpdating(true);
    try {
      await api.patch(`/requests/${id}`, { status: newStatus });
      await loadRequest();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update status.');
    } finally {
      setUpdating(false);
    }
  }

  async function handleConvert() {
    setConverting(true);
    setConvertError('');
    try {
      await api.post(`/requests/${id}/convert`);
      setShowModal(false);
      await loadRequest();
    } catch (err) {
      setConvertError(err.response?.data?.error || 'Conversion failed.');
    } finally {
      setConverting(false);
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString();
  }

  function formatDateTime(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString();
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container mt-4 text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="container mt-4">
          <div className="alert alert-danger">{error}</div>
        </div>
      </>
    );
  }

  if (!request) return null;

  return (
    <>
      <Navbar />
      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2>Request #{request.id}</h2>
          <a href="/" className="btn btn-outline-secondary btn-sm">← Back to Dashboard</a>
        </div>

        {/* Top cards: Customer Info + Request Info */}
        <div className="row mb-4">
          <div className="col-md-6 mb-3 mb-md-0">
            <div className="card h-100">
              <div className="card-header"><strong>Customer Info</strong></div>
              <div className="card-body">
                <p className="mb-1"><strong>Name:</strong> {request.customer_name}</p>
                <p className="mb-0"><strong>Email:</strong> {request.customer_email}</p>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card h-100">
              <div className="card-header"><strong>Request Info</strong></div>
              <div className="card-body">
                <p className="mb-1"><strong>Service:</strong> {request.requested_service}</p>
                <p className="mb-1"><strong>Description:</strong> {request.description}</p>
                <p className="mb-2"><strong>Scheduled:</strong> {formatDate(request.scheduled_date)}</p>
                <div className="d-flex align-items-center gap-2">
                  <strong>Status:</strong>
                  <span className={'badge ' + 'badge-' + request.status}>{request.status}</span>
                  <select
                    className="form-select form-select-sm"
                    style={{ width: 'auto' }}
                    value={request.status}
                    onChange={handleStatusChange}
                    disabled={updating}
                  >
                    <option value="NEW">NEW</option>
                    <option value="QUALIFIED">QUALIFIED</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                  {updating && <span className="spinner-border spinner-border-sm" role="status" />}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Work Item section */}
        <div className="mb-4">
          {request.work_item ? (
            <div className="card">
              <div className="card-header"><strong>Work Item</strong></div>
              <div className="card-body">
                <p className="mb-1"><strong>Title:</strong> {request.work_item.title}</p>
                <p className="mb-1"><strong>Service:</strong> {request.work_item.requested_service}</p>
                <p className="mb-1"><strong>Scheduled:</strong> {formatDate(request.work_item.scheduled_date)}</p>
                <p className="mb-0"><strong>Created:</strong> {formatDateTime(request.work_item.created_at)}</p>
              </div>
            </div>
          ) : request.status === 'QUALIFIED' ? (
            <div>
              {convertError && <div className="alert alert-danger mb-2">{convertError}</div>}
              <button
                className="btn btn-warning"
                onClick={() => setShowModal(true)}
              >
                Convert to Work Item
              </button>
            </div>
          ) : null}
        </div>

        {/* Activity Timeline */}
        <div className="mb-4">
          <h5>Activity Timeline</h5>
          {request.activities && request.activities.length > 0 ? (
            request.activities.map(a => (
              <div key={a.id} className="timeline-item">
                <div className="d-flex justify-content-between">
                  <strong>{a.activity_type}</strong>
                  <small className="text-muted">{formatDateTime(a.created_at)}</small>
                </div>
                <p className="mb-0">{a.message}</p>
                {a.user_name && <small className="text-muted">by {a.user_name}</small>}
              </div>
            ))
          ) : (
            <p className="text-muted">No activity recorded yet.</p>
          )}
        </div>
      </div>

      <ConfirmationModal
        show={showModal}
        request={request}
        onCancel={() => setShowModal(false)}
        onConfirm={handleConvert}
        loading={converting}
      />
    </>
  );
}
