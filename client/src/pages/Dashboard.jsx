import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import RequestList from '../components/RequestList.jsx';
import RequestForm from '../components/RequestForm.jsx';
import api from '../api';

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Show form when navigating to /requests/new
  useEffect(() => {
    if (location.pathname === '/requests/new') {
      setShowForm(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  async function fetchRequests() {
    setLoading(true);
    try {
      const url = statusFilter ? `/requests?status=${statusFilter}` : '/requests';
      const res = await api.get(url);
      setRequests(res.data);
    } catch (err) {
      console.error('Failed to load requests', err);
    } finally {
      setLoading(false);
    }
  }

  function handleFormSuccess() {
    setShowForm(false);
    // Navigate back to / so the URL reflects we're no longer on /requests/new
    if (location.pathname === '/requests/new') {
      navigate('/');
    }
    fetchRequests();
  }

  function handleFilterClick(value) {
    setStatusFilter(value);
  }

  return (
    <>
      <Navbar />
      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2>Requests</h2>
          {!showForm && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                setShowForm(true);
                navigate('/requests/new');
              }}
            >
              + New Request
            </button>
          )}
        </div>

        {/* Status Filter Buttons */}
        <div className="btn-group mb-3" role="group">
          {['', 'NEW', 'QUALIFIED', 'CLOSED'].map(s => (
            <button
              key={s}
              type="button"
              className={'btn btn-outline-secondary' + (statusFilter === s ? ' active' : '')}
              onClick={() => handleFilterClick(s)}
            >
              {s === '' ? 'All' : s}
            </button>
          ))}
        </div>

        {/* New Request Form */}
        {showForm && (
          <RequestForm
            onSuccess={handleFormSuccess}
          />
        )}

        <RequestList requests={requests} loading={loading} />
      </div>
    </>
  );
}
