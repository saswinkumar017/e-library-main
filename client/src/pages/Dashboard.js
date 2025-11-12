import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css';

function Dashboard({ user }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const firstName = (user?.name || '').split(' ')[0] || 'there';

  return (
    <div className="dashboard">
      <div className="container">
        <section className="dashboard-hero">
          <div className="hero-copy">
            <span className="dashboard-eyebrow">Personal workspace</span>
            <h1>Welcome back, {firstName}.</h1>
            <p>
              Stay ahead of deadlines, review your activity, and access the services you need in
              one refined experience.
            </p>
          </div>

          <div className="hero-actions">
            <Link to="/e-library" className="btn btn-primary">
              Browse collection
            </Link>
            <Link to="/printouts" className="btn btn-outline">
              Request printouts
            </Link>
          </div>
        </section>

        {stats && (
          <section className="stats-section">
            <div className="stat-card">
              <p className="stat-label">Active loans</p>
              <p className="stat-number">{stats.borrowedBooks?.length || 0}</p>
              <span className="stat-hint">Books currently issued to you</span>
            </div>
            <div className="stat-card">
              <p className="stat-label">Print jobs completed</p>
              <p className="stat-number">{stats.totalPrintoutsCount || 0}</p>
              <span className="stat-hint">Documents processed through the print studio</span>
            </div>
            <div className="stat-card">
              <p className="stat-label">Investment in printing</p>
              <p className="stat-number">₹{stats.totalPrintoutSpent || 0}</p>
              <span className="stat-hint">Total spent on high-quality printouts</span>
            </div>
          </section>
        )}

        <section className="feature-grid">
          <article className="feature-card">
            <span className="feature-tag">Library services</span>
            <h3>Explore the curated catalogue</h3>
            <p>
              Search across departments, view availability in real time, and place holds on titles
              essential to your coursework.
            </p>
            <Link to="/e-library" className="feature-link">
              Enter E-Library
            </Link>
          </article>

          <article className="feature-card">
            <span className="feature-tag">Print studio</span>
            <h3>Produce polished handouts</h3>
            <p>
              Upload documents, configure colour preferences, and manage payments with complete
              transparency from start to finish.
            </p>
            <Link to="/printouts" className="feature-link">
              Launch print request
            </Link>
          </article>

          <article className="feature-card">
            <span className="feature-tag">Profile & activity</span>
            <h3>Keep your account in sync</h3>
            <p>
              Review borrowed titles, monitor spending, and ensure your contact details stay up to
              date for seamless communication.
            </p>
            <Link to="/profile" className="feature-link">
              Manage profile
            </Link>
          </article>
        </section>

        <section className="insight-panels">
          <div className="insight-panel">
            <h3>Resource planning guidance</h3>
            <p>
              Set reminders for return dates, organise readings by module, and create a personal
              learning plan that keeps you focused throughout the semester.
            </p>
          </div>

          <div className="insight-panel">
            <h3>Smart usage tips</h3>
            <ul className="insight-list">
              <li>Leverage advanced search to filter by author, genre, or location.</li>
              <li>Track print history to repeat frequent orders in seconds.</li>
              <li>Download receipts instantly for reimbursements and records.</li>
              <li>Review upcoming due dates to avoid unexpected late fees.</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
