import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Layout.css';

const ROLE_LABELS = {
  superadmin: 'Super Administrator',
  admin: 'Administrator',
  user: 'Member'
};

const ROLE_BADGE_CLASS = {
  superadmin: 'role-badge--superadmin',
  admin: 'role-badge--admin',
  user: 'role-badge--user'
};

function Layout({ isLoggedIn, userRole, user, onLogout, children }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const userInitials = useMemo(() => {
    const name = (user?.name || '').trim();
    if (!name) {
      return 'EL';
    }
    const parts = name.split(/\s+/).filter(Boolean);
    const initials = parts.slice(0, 2).map((part) => part[0]).join('');
    return initials.toUpperCase();
  }, [user]);

  const roleLabel = ROLE_LABELS[userRole] || 'Guest';
  const roleBadgeClass = `role-badge ${ROLE_BADGE_CLASS[userRole] || ''}`;

  const renderLinks = () => {
    if (!isLoggedIn) {
      return null;
    }

    if (userRole === 'superadmin') {
      return (
        <Link to="/superadmin" className="nav-link nav-link--highlight">
          Super Admin Console
        </Link>
      );
    }

    if (userRole === 'admin') {
      return (
        <Link to="/admin" className="nav-link nav-link--accent">
          Admin Console
        </Link>
      );
    }

    return (
      <>
        <Link to="/dashboard" className="nav-link">
          Dashboard
        </Link>
        <Link to="/e-library" className="nav-link">
          E-Library
        </Link>
        <Link to="/printouts" className="nav-link">
          Printouts
        </Link>
      </>
    );
  };

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="navbar-container">
          <Link to="/" className="navbar-logo" aria-label="E-Library home">
            <span className="brand-mark">EL</span>
            <div className="brand-text">
              <span className="brand-title">E-Library Suite</span>
              <span className="brand-subtitle">Academic Resource Platform</span>
            </div>
          </Link>

          <div className="navbar-actions">
            <div className="nav-links">{renderLinks()}</div>

            {isLoggedIn ? (
              <div className="user-menu">
                <div className="user-avatar" aria-hidden="true">
                  {userInitials}
                </div>
                <div className="user-meta">
                  <span className="user-name">{user?.name}</span>
                  <span className={roleBadgeClass}>{roleLabel}</span>
                </div>
                <button onClick={handleLogout} className="btn btn-small btn-outline nav-logout">
                  Sign out
                </button>
              </div>
            ) : (
              <div className="auth-links">
                <Link to="/login" className="btn btn-small btn-outline">
                  Log in
                </Link>
                <Link to="/register" className="btn btn-small btn-primary">
                  Create account
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="main-content">{children}</main>

      <footer className="footer">
        <div className="footer-container">
          <div>
            <h4>E-Library Suite</h4>
            <p>
              A modern platform helping institutions deliver streamlined access to books,
              printouts, and academic services.
            </p>
          </div>
          <div>
            <h5>Reach us</h5>
            <p className="footer-contact">support@elibrary-suite.com</p>
            <p className="footer-contact">+91 00000 00000</p>
          </div>
          <div>
            <h5>Platform</h5>
            <ul>
              <li>Secure authentication</li>
              <li>Centralised resource tracking</li>
              <li>Automated print management</li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} E-Library Suite. All rights reserved.</p>
          <p>Built for academic teams that value efficiency and clarity.</p>
        </div>
      </footer>
    </div>
  );
}

export default Layout;
