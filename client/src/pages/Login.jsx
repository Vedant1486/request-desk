import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100">
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div className="card shadow-sm">
          <div className="card-body p-4">
            <h3 className="text-center mb-4">Client Request Desk</h3>

            {error && <div className="alert alert-danger">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-control"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-control"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>
        </div>

        <div className="alert alert-info mt-3">
          <strong>Demo Credentials</strong>
          <hr className="my-2" />
          <p className="mb-1"><strong>Workspace A:</strong></p>
          <p className="mb-1">Email: usera@example.com</p>
          <p className="mb-2">Password: Password123!</p>
          <p className="mb-1"><strong>Workspace B:</strong></p>
          <p className="mb-1">Email: userb@example.com</p>
          <p className="mb-0">Password: Password123!</p>
        </div>
      </div>
    </div>
  );
}
