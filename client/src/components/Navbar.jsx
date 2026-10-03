import React from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const initials = user.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  function handleLogout() {
    localStorage.clear();
    navigate('/login');
  }

  return (
    <nav className="app-navbar">
      {/* Brand */}
      <Link to="/" className="navbar-brand-wrap">
        <div className="navbar-logo">📋</div>
        <span className="navbar-title">
          Client <span>Request Desk</span>
        </span>
      </Link>

      {/* Right side */}
      <div className="navbar-right">
        {/* User pill — hidden on small screens via CSS */}
        {user.name && (
          <div className="navbar-user-pill">
            <div className="navbar-avatar">{initials}</div>
            <span className="navbar-user-name">{user.name}</span>
            {user.workspaceName && (
              <span className="navbar-workspace">{user.workspaceName}</span>
            )}
          </div>
        )}

        {/* New Request */}
        <button
          className="btn-primary-custom"
          style={{ fontSize: '0.78rem', padding: '0.38rem 0.85rem' }}
          onClick={() => navigate('/requests/new')}
        >
          + New
        </button>

        {/* Logout */}
        <button className="btn-logout" onClick={handleLogout}>
          Sign Out
        </button>
      </div>
    </nav>
  );
}
