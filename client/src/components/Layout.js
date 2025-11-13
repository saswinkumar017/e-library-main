import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Layout.css';

function Layout({ isLoggedIn, userRole, user, onLogout, children }) {
  const navigate = useNavigate();

  const roleMeta = {
    superadmin: { icon: '👑', label: 'Super Admin' },
    admin: { icon: '⚙️', label: 'Administrator' },
    user: { icon: '📖', label: 'Member' }
  };

  const activeRole = userRole ? roleMeta[userRole] : null;

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const renderNavigationLinks = () => {
    if (!isLoggedIn) {
      return null;
    }

    if (userRole === 'superadmin') {
      return (
        <Link to="/superadmin" className="nav-link nav-link-superadmin">
          👑 Super Admin Suite
        </Link>
      );
    }

    if (userRole === 'admin') {
      return (
        <Link to="/admin" className="nav-link nav-link-admin">
          ⚙️ Admin Dashboard
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
        <Link to="/profile" className="nav-link">
          Profile
        </Link>
      </>
    );
  };

  return (
    <div className="layout">
      <span className="layout-spotlight layout-spotlight--primary" aria-hidden="true" />
      <span className="layout-spotlight layout-spotlight--secondary" aria-hidden="true" />

      <nav className="navbar">
        <div className="navbar-container">
          <Link to="/" className="navbar-logo" aria-label="E-Library home">
            <span className="logo-badge">EL</span>
            <div className="logo-copy">
              <span className="logo-title">E-Library</span>
              <span className="logo-subtitle">Digital Resource Center</span>
            </div>
          </Link>

          <div className="navbar-actions">
            <div className="navbar-links">
              {renderNavigationLinks() || (
                <Link to="/login" className="nav-link">
                  Login
                </Link>
              )}
            </div>

            <div className="navbar-user">
              {isLoggedIn ? (
                <div className="user-menu">
                  <div className="user-details">
                    <span className="user-name">{user?.name}</span>
                    {activeRole && (
                      <span className={`user-role-chip role-${userRole}`}>
                        <span className="role-icon" aria-hidden="true">
                          {activeRole.icon}
                        </span>
                        <span>{activeRole.label}</span>
                      </span>
                    )}
                  </div>
                  <button onClick={handleLogout} className="btn btn-ghost btn-small">
                    Logout
                  </button>
                </div>
              ) : (
                <div className="navbar-cta">
                  <span className="cta-copy">New here?</span>
                  <Link to="/register" className="btn btn-light btn-small">
                    Join the Library
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="main-content">
        <div className="main-shell">
          {children}
        </div>
      </main>

      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">
            <span className="footer-logo" aria-hidden="true">📚</span>
            <div>
              <h4>E-Library System</h4>
              <p>Empowering academic communities through streamlined access to knowledge.</p>
            </div>
          </div>
          <div className="footer-meta">
            <span>© 2024 E-Library System</span>
            <span className="footer-divider">•</span>
            <span>Crafted for modern campuses</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Layout;
