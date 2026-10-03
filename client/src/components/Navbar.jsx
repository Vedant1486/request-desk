import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  function handleLogout() {
    localStorage.clear();
    navigate('/login');
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark px-3">
      <a className="navbar-brand" href="/">Client Request Desk</a>
      <div className="ms-auto d-flex align-items-center gap-2">
        {user.name && <span className="text-white me-2">{user.name}</span>}
        <button
          className="btn btn-outline-light btn-sm"
          onClick={() => navigate('/requests/new')}
        >
          New Request
        </button>
        <button
          className="btn btn-outline-danger btn-sm ms-2"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
