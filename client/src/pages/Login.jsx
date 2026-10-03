import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const DEMO = [
  { workspace: 'Workspace A', email: 'usera@example.com', password: 'Password123!' },
  { workspace: 'Workspace B', email: 'userb@example.com', password: 'Password123!' },
];

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) { setError('Please enter your email and password.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(creds) {
    setEmail(creds.email);
    setPassword(creds.password);
    setError('');
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo-wrap">📋</div>
            <h1 className="login-title">Client Request Desk</h1>
            <p className="login-subtitle">Sign in to manage customer requests</p>
          </div>

          {error && (
            <div className="alert-custom alert-danger-custom mb-3">
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="field-label" htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                className="field-input"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoFocus
                required
              />
            </div>
            <div className="mb-3">
              <label className="field-label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="field-input"
                placeholder="••••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="btn-primary-custom w-100 justify-content-center mt-1"
              style={{ width: '100%', justifyContent: 'center' }}
              disabled={loading}
            >
              {loading ? <><span className="spinner-sm me-2" style={{display:'inline-block'}} />Signing in...</> : '🔐 Sign In'}
            </button>
          </form>

          <div className="login-demo">
            <div className="login-demo-title">🎯 Demo Accounts — click to fill</div>
            {DEMO.map(d => (
              <div key={d.workspace} className="demo-workspace" onClick={() => fillDemo(d)}>
                <div className="demo-ws-info">
                  <div className="demo-ws-name">{d.workspace}</div>
                  <div className="demo-ws-email">{d.email}</div>
                </div>
                <button
                  className="demo-use-btn"
                  type="button"
                  onClick={e => { e.stopPropagation(); fillDemo(d); }}
                >
                  Use
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
