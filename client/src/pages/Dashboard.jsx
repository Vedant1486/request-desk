import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import RequestList from '../components/RequestList.jsx';
import RequestForm from '../components/RequestForm.jsx';
import api from '../api';

const FILTERS = ['', 'NEW', 'QUALIFIED', 'CLOSED'];
const FILTER_LABELS = { '': 'All', NEW: 'New', QUALIFIED: 'Qualified', CLOSED: 'Closed' };

export default function Dashboard() {
  const location = useLocation();
  const navigate  = useNavigate();

  const [requests,     setRequests]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm,     setShowForm]     = useState(false);
  const [successMsg,   setSuccessMsg]   = useState('');

  useEffect(() => {
    if (location.pathname === '/requests/new') setShowForm(true);
  }, [location.pathname]);

  useEffect(() => { fetchRequests(); }, [statusFilter]);

  async function fetchRequests() {
    setLoading(true);
    setError('');
    try {
      const url = statusFilter ? `/requests?status=${statusFilter}` : '/requests';
      const res = await api.get(url);
      setRequests(res.data);
    } catch {
      setError('Unable to load requests. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleFormSuccess() {
    setShowForm(false);
    if (location.pathname === '/requests/new') navigate('/');
    setSuccessMsg('Request created successfully! ✓');
    setTimeout(() => setSuccessMsg(''), 3500);
    fetchRequests();
  }

  // Count stats
  const counts = requests.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <>
      <Navbar />
      <div className="page-content">

        {/* Page Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Customer Requests</h1>
            <p className="page-subtitle">
              {user.name && <>Welcome back, <strong>{user.name}</strong> · </>}
              Manage and track all customer service requests
            </p>
          </div>
          {!showForm && (
            <button
              className="btn-primary-custom"
              onClick={() => { setShowForm(true); navigate('/requests/new'); }}
            >
              + Create Request
            </button>
          )}
        </div>

        {/* Stats Row */}
        {!loading && requests.length > 0 && (
          <div className="stats-row">
            <div className="stat-chip">
              <div className="stat-icon total">📊</div>
              <div className="stat-info">
                <div className="stat-num">{requests.length}</div>
                <div className="stat-label">Total</div>
              </div>
            </div>
            <div className="stat-chip">
              <div className="stat-icon new-stat">🔵</div>
              <div className="stat-info">
                <div className="stat-num">{counts.NEW || 0}</div>
                <div className="stat-label">New</div>
              </div>
            </div>
            <div className="stat-chip">
              <div className="stat-icon qual">✅</div>
              <div className="stat-info">
                <div className="stat-num">{counts.QUALIFIED || 0}</div>
                <div className="stat-label">Qualified</div>
              </div>
            </div>
            <div className="stat-chip">
              <div className="stat-icon closed">🔒</div>
              <div className="stat-info">
                <div className="stat-num">{counts.CLOSED || 0}</div>
                <div className="stat-label">Closed</div>
              </div>
            </div>
          </div>
        )}

        {/* Create Form */}
        {showForm && (
          <RequestForm
            onSuccess={handleFormSuccess}
            onCancel={() => { setShowForm(false); if (location.pathname === '/requests/new') navigate('/'); }}
          />
        )}

        {/* Filter Pills */}
        <div className="filter-row">
          {FILTERS.map(f => (
            <button
              key={f}
              className={`filter-pill ${statusFilter === f ? `active-${f || 'all'}` : ''}`}
              onClick={() => setStatusFilter(f)}
            >
              {FILTER_LABELS[f]}
              {f && counts[f] !== undefined && (
                <span style={{ marginLeft: '0.3rem', opacity: 0.8 }}>({counts[f] || 0})</span>
              )}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && <div className="alert-custom alert-danger-custom">{error}</div>}

        {/* List */}
        <RequestList requests={requests} loading={loading} />
      </div>

      {/* Success Toast */}
      {successMsg && (
        <div className="success-toast">✅ {successMsg}</div>
      )}
    </>
  );
}
