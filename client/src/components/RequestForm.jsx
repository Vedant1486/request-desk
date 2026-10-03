import React, { useState, useEffect } from 'react';
import api from '../api';

const EMPTY = {
  customer_name: '', customer_email: '', requested_service: '',
  description: '', scheduled_date: '', status: 'NEW',
};

export default function RequestForm({ initial = null, onSuccess, onCancel }) {
  const isEdit = Boolean(initial);
  const [form,    setForm]    = useState(initial || EMPTY);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [errors,  setErrors]  = useState({});

  useEffect(() => {
    if (initial) {
      setForm({
        customer_name:     initial.customer_name     || '',
        customer_email:    initial.customer_email    || '',
        requested_service: initial.requested_service || '',
        description:       initial.description       || '',
        scheduled_date:    initial.scheduled_date
          ? initial.scheduled_date.split('T')[0]
          : '',
        status: initial.status || 'NEW',
      });
    }
  }, [initial]);

  function validate() {
    const e = {};
    if (!form.customer_name.trim())     e.customer_name     = 'Customer name is required';
    if (!form.customer_email.trim())    e.customer_email    = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.customer_email)) e.customer_email = 'Invalid email address';
    if (!form.requested_service.trim()) e.requested_service = 'Service is required';
    if (!form.description.trim())       e.description       = 'Description is required';
    if (!form.scheduled_date)           e.scheduled_date    = 'Scheduled date is required';
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const v = validate();
    if (Object.keys(v).length) { setErrors(v); return; }
    setErrors({});
    setLoading(true);
    setError('');
    try {
      if (isEdit) {
        await api.patch(`/requests/${initial.id}`, form);
      } else {
        await api.post('/requests', form);
      }
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} request.`);
    } finally {
      setLoading(false);
    }
  }

  function field(name, value) {
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  }

  return (
    <div className="form-overlay">
      <div className="form-overlay-header">
        <div className="form-overlay-title">
          {isEdit ? '✏️ Edit Request' : '➕ Create New Request'}
        </div>
        {onCancel && (
          <button
            className="btn-secondary-custom"
            style={{ fontSize: '0.78rem', padding: '0.3rem 0.7rem' }}
            onClick={onCancel}
            type="button"
          >
            ✕ Cancel
          </button>
        )}
      </div>

      <div className="form-overlay-body">
        {error && <div className="alert-custom alert-danger-custom">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            {/* Customer Name */}
            <div>
              <label className="field-label">Customer Name *</label>
              <input
                className={`field-input ${errors.customer_name ? 'is-invalid' : ''}`}
                value={form.customer_name}
                onChange={e => field('customer_name', e.target.value)}
                placeholder="e.g. John Smith"
              />
              {errors.customer_name && <div style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.customer_name}</div>}
            </div>

            {/* Customer Email */}
            <div>
              <label className="field-label">Customer Email *</label>
              <input
                type="email"
                className={`field-input ${errors.customer_email ? 'is-invalid' : ''}`}
                value={form.customer_email}
                onChange={e => field('customer_email', e.target.value)}
                placeholder="customer@example.com"
              />
              {errors.customer_email && <div style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.customer_email}</div>}
            </div>

            {/* Requested Service */}
            <div>
              <label className="field-label">Requested Service *</label>
              <input
                className={`field-input ${errors.requested_service ? 'is-invalid' : ''}`}
                value={form.requested_service}
                onChange={e => field('requested_service', e.target.value)}
                placeholder="e.g. Website Development"
              />
              {errors.requested_service && <div style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.requested_service}</div>}
            </div>

            {/* Scheduled Date */}
            <div>
              <label className="field-label">Scheduled Date *</label>
              <input
                type="date"
                className={`field-input ${errors.scheduled_date ? 'is-invalid' : ''}`}
                value={form.scheduled_date}
                onChange={e => field('scheduled_date', e.target.value)}
              />
              {errors.scheduled_date && <div style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.scheduled_date}</div>}
            </div>

            {/* Status */}
            <div>
              <label className="field-label">Status</label>
              <select
                className="field-input"
                value={form.status}
                onChange={e => field('status', e.target.value)}
              >
                <option value="NEW">NEW</option>
                <option value="QUALIFIED">QUALIFIED</option>
                <option value="CLOSED">CLOSED</option>
              </select>
            </div>

            {/* Description */}
            <div className="span-2">
              <label className="field-label">Description *</label>
              <textarea
                className={`field-input ${errors.description ? 'is-invalid' : ''}`}
                rows={3}
                value={form.description}
                onChange={e => field('description', e.target.value)}
                placeholder="Describe the customer's request in detail..."
                style={{ resize: 'vertical' }}
              />
              {errors.description && <div style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.description}</div>}
            </div>
          </div>

          <div className="form-actions">
            {onCancel && (
              <button type="button" className="btn-secondary-custom" onClick={onCancel} disabled={loading}>
                Cancel
              </button>
            )}
            <button type="submit" className="btn-primary-custom" disabled={loading}>
              {loading
                ? <><span className="spinner-sm" style={{ display: 'inline-block', marginRight: '0.4rem' }} />Saving...</>
                : isEdit ? '💾 Save Changes' : '✓ Create Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
