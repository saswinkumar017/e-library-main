import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { userAPI } from '../services/api';
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

  return (
    <div className="dashboard">
      <div className="container">
        <div className="welcome-section">
          <h1>Welcome, {user?.name}!</h1>
          <p>Manage your books, check availability, and print notes all in one place</p>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <div className="card-icon">📚</div>
            <h3>E-Library</h3>
            <p>Browse and search for books</p>
            <Link to="/e-library" className="btn btn-primary">
              Go to E-Library
            </Link>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">🖨️</div>
            <h3>Printouts</h3>
            <p>Upload and print your notes</p>
            <Link to="/printouts" className="btn btn-primary">
              Go to Printouts
            </Link>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">👤</div>
            <h3>Profile</h3>
            <p>View your account details</p>
            <button className="btn btn-primary">
              View Profile
            </button>
          </div>
        </div>

        {stats && (
          <div className="stats-section">
            <h2>Your Statistics</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-number">{stats.borrowedBooks?.length || 0}</div>
                <div className="stat-label">Books Borrowed</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{stats.totalPrintoutsCount || 0}</div>
                <div className="stat-label">Printouts Completed</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">₹{stats.totalPrintoutSpent || 0}</div>
                <div className="stat-label">Spent on Printing</div>
              </div>
            </div>
          </div>
        )}

        <div className="info-section">
          <div className="info-card">
            <h3>📖 About E-Library</h3>
            <p>
              Our E-Library is a comprehensive digital platform designed to make book management easy. 
              Browse our collection, track your borrowed books, and keep track of due dates all in one place.
            </p>
          </div>

          <div className="info-card">
            <h3>🖨️ Printing Service</h3>
            <p>
              Need to print your study materials? Upload your documents, choose between black & white 
              or color printing, and make a quick payment through GPay. Your printouts will be ready in no time!
            </p>
          </div>

          <div className="info-card">
            <h3>⚡ Quick Tips</h3>
            <ul className="tips-list">
              <li>Set reminders for book due dates</li>
              <li>Explore different genres to expand your knowledge</li>
              <li>Use the search feature to find books quickly</li>
              <li>Check book availability before visiting the library</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
