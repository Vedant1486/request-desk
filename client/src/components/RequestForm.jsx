import React, { useState } from 'react';
import api from '../api';

const EMPTY_FORM = {
  customer_name: '',
  customer_email: '',
  requested_service: '',
  description: '',
  scheduled_date: '',
  status: 'NEW',
};

export default function RequestForm({ onSuccess }) {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await api.post('/requests', formData);
      setFormData(EMPTY_FORM);
      if (onSuccess) onSuccess(result.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create request.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card mb-4">
      <div className="card-header"><strong>New Request</strong></div>
      <div className="card-body">
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Customer Name</label>
            <input
              type="text"
              className="form-control"
              name="customer_name"
              value={formData.customer_name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Customer Email</label>
            <input
              type="email"
              className="form-control"
              name="customer_email"
              value={formData.customer_email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Requested Service</label>
            <input
              type="text"
              className="form-control"
              name="requested_service"
              value={formData.requested_service}
              onChange={handleChange}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Description</label>
            <textarea
              className="form-control"
              name="description"
              rows="3"
              value={formData.description}
              onChange={handleChange}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Scheduled Date</label>
            <input
              type="date"
              className="form-control"
              name="scheduled_date"
              value={formData.scheduled_date}
              onChange={handleChange}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Status</label>
            <select
              className="form-select"
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="NEW">NEW</option>
              <option value="QUALIFIED">QUALIFIED</option>
              <option value="CLOSED">CLOSED</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create Request'}
          </button>
        </form>
      </div>
    </div>
  );
}
