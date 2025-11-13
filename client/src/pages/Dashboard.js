import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css';

function Dashboard({ user }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const firstName = user?.name?.split(' ')?.[0] || user?.name || 'Reader';

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/auth/profile', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <div className="spinner"></div>;
  }

  return (
    <div className="dashboard">
      <div className="container">
        <section className="welcome-section">
          <div className="welcome-card">
            <div className="welcome-header">
              <span className="welcome-chip">Your personalized workspace</span>
              <h1>Welcome back, {firstName}.</h1>
              <p>
                Manage your reading journey, monitor borrowing activity, and stay on top of printout
                requests with our refreshed experience.
              </p>
            </div>

            <div className="welcome-actions">
              <Link to="/e-library" className="btn btn-primary btn-small">
                Browse Collection
              </Link>
              <Link to="/printouts" className="btn btn-light btn-small">
                Request Printout
              </Link>
              <Link to="/profile" className="btn btn-outline btn-small">
                Update Profile
              </Link>
            </div>

            {stats && (
              <div className="welcome-metrics">
                <div className="metric-card">
                  <span className="metric-label">Active borrows</span>
                  <span className="metric-value">{stats.borrowedBooks?.length || 0}</span>
                </div>
                <div className="metric-card">
                  <span className="metric-label">Printouts completed</span>
                  <span className="metric-value">{stats.totalPrintoutsCount || 0}</span>
                </div>
                <div className="metric-card">
                  <span className="metric-label">Printing spend</span>
                  <span className="metric-value">₹{stats.totalPrintoutSpent || 0}</span>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="dashboard-grid">
          <div className="dashboard-card">
            <div className="card-icon">Library</div>
            <div className="card-content">
              <h3>Digital Library</h3>
              <p>Search, filter, and reserve titles from our curated academic catalogue.</p>
              <Link to="/e-library" className="btn btn-outline btn-small">
                Explore titles
              </Link>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">Print</div>
            <div className="card-content">
              <h3>Printout Studio</h3>
              <p>Upload study materials, configure preferences, and monitor fulfilment.</p>
              <Link to="/printouts" className="btn btn-outline btn-small">
                Manage printouts
              </Link>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">Profile</div>
            <div className="card-content">
              <h3>Profile &amp; Activity</h3>
              <p>Review personal details, borrowing history, and upcoming due dates.</p>
              <Link to="/profile" className="btn btn-outline btn-small">
                View profile
              </Link>
            </div>
          </div>
        </section>

        {stats && (
          <section className="stats-section">
            <div className="section-heading">
              <div>
                <h2>Your insights</h2>
                <p>Keep a pulse on your borrowing activity and printing spends.</p>
              </div>
            </div>
            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-icon">Books</span>
                <div className="stat-number">{stats.borrowedBooks?.length || 0}</div>
                <div className="stat-label">Books Borrowed</div>
              </div>
              <div className="stat-card">
                <span className="stat-icon">Printouts</span>
                <div className="stat-number">{stats.totalPrintoutsCount || 0}</div>
                <div className="stat-label">Printouts Completed</div>
              </div>
              <div className="stat-card">
                <span className="stat-icon">Spending</span>
                <div className="stat-number">₹{stats.totalPrintoutSpent || 0}</div>
                <div className="stat-label">Spent on Printing</div>
              </div>
            </div>
          </section>
        )}

        <section className="info-section">
          <div className="info-card">
            <div className="info-icon">Library</div>
            <div>
              <h3>E-Library Essentials</h3>
              <p>
                Discover an ever-growing repository of titles, complete with availability, location details,
                and expected return timelines for transparent planning.
              </p>
            </div>
          </div>

          <div className="info-card">
            <div className="info-icon">Printouts</div>
            <div>
              <h3>Streamlined Printouts</h3>
              <p>
                Submit documents in seconds, choose between colour or monochrome, and receive notifications as
                soon as your materials are ready for collection.
              </p>
            </div>
          </div>

          <div className="info-card">
            <div className="info-icon">Insights</div>
            <div>
              <h3>Working Smarter</h3>
              <ul className="tips-list">
                <li>Set reminders for return dates to avoid overdue penalties.</li>
                <li>Leverage filters to pinpoint exactly what you need faster.</li>
                <li>Consolidate print requests to optimise costs.</li>
                <li>Review profile insights to track your academic progress.</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
