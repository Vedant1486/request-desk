import React from 'react';
import { Link } from 'react-router-dom';

export default function RequestList({ requests, loading }) {
  if (loading) {
    return (
      <div className="text-center my-4">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!requests || requests.length === 0) {
    return <p className="text-muted">No requests found.</p>;
  }

  return (
    <div className="table-responsive">
      <table className="table table-hover table-bordered">
        <thead className="table-dark">
          <tr>
            <th>Customer</th>
            <th>Service</th>
            <th>Scheduled Date</th>
            <th>Status</th>
            <th>Work Item</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {requests.map(r => (
            <tr key={r.id}>
              <td>{r.customer_name}</td>
              <td>{r.requested_service}</td>
              <td>{r.scheduled_date ? new Date(r.scheduled_date).toLocaleDateString() : '—'}</td>
              <td>
                <span className={'badge ' + 'badge-' + r.status}>{r.status}</span>
              </td>
              <td className="text-center">{r.has_work_item > 0 ? '✓' : ''}</td>
              <td>
                <Link to={`/requests/${r.id}`} className="btn btn-sm btn-primary">View</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
