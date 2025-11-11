import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Layout.css';

function Layout({ isLoggedIn, userRole, user, onLogout, children }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="navbar-container">
          <Link to="/" className="navbar-logo">
            📚 E-Library
          </Link>

          <div className="navbar-menu">
            {isLoggedIn ? (
              <>
                <Link to="/dashboard" className="nav-link">Dashboard</Link>
                <Link to="/e-library" className="nav-link">E-Library</Link>
                <Link to="/printouts" className="nav-link">Printouts</Link>
                
                {userRole === 'admin' && (
                  <Link to="/admin" className="nav-link nav-link-admin">Admin</Link>
                )}

                <div className="user-menu">
                  <span className="user-name">{user?.name}</span>
                  <button onClick={handleLogout} className="btn btn-small">
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-link">Login</Link>
                <Link to="/register" className="nav-link nav-link-register">Register</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="main-content">
        {children}
      </main>

      <footer className="footer">
        <div className="footer-content">
          <p>&copy; 2024 E-Library System. All rights reserved.</p>
          <p>Manage your books and print notes with ease using our digital platform.</p>
        </div>
      </footer>
    </div>
  );
}

export default Layout;
