import React from 'react';
import { Link } from 'react-router-dom';

function StatusBadge({ status }) {
  return <span className={`status-badge status-${status}`}>{status}</span>;
}

function fmt(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function RequestList({ requests, loading }) {
  if (loading) {
    return (
      <div className="table-wrap">
        <div className="loading-state">
          <div className="spinner" />
          <span>Loading requests...</span>
        </div>
      </div>
    );
  }

  if (!requests || requests.length === 0) {
    return (
      <div className="table-wrap">
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <div className="empty-title">No customer requests found</div>
          <div className="empty-sub">Create your first request using the button above</div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table */}
      <div className="table-wrap table-desktop">
        <table className="requests-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Customer</th>
              <th>Service</th>
              <th>Scheduled</th>
              <th>Status</th>
              <th>Work Item</th>
              <th>Created</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {requests.map(r => (
              <tr key={r.id}>
                <td style={{ color: 'var(--gray-400)', fontSize: '0.78rem' }}>#{r.id}</td>
                <td className="customer-cell">
                  <div className="customer-name">{r.customer_name}</div>
                  <div className="customer-email">{r.customer_email}</div>
                </td>
                <td className="service-cell" title={r.requested_service}>{r.requested_service}</td>
                <td style={{ whiteSpace: 'nowrap', fontSize: '0.82rem' }}>{fmt(r.scheduled_date)}</td>
                <td><StatusBadge status={r.status} /></td>
                <td>
                  {r.has_work_item > 0
                    ? <span className="work-item-check">✓ Created</span>
                    : <span style={{ color: 'var(--gray-300)', fontSize: '0.78rem' }}>—</span>}
                </td>
                <td style={{ whiteSpace: 'nowrap', fontSize: '0.78rem', color: 'var(--gray-400)' }}>{fmt(r.created_at)}</td>
                <td>
                  <Link to={`/requests/${r.id}`} className="btn-view-custom">
                    View →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="cards-mobile">
        {requests.map(r => (
          <div key={r.id} className="request-card-mobile">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--gray-800)' }}>{r.customer_name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>{r.customer_email}</div>
              </div>
              <StatusBadge status={r.status} />
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--gray-600)', marginBottom: '0.6rem' }}>
              <strong>Service:</strong> {r.requested_service}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>📅 {fmt(r.scheduled_date)}</span>
              <Link to={`/requests/${r.id}`} className="btn-view-custom">View →</Link>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
