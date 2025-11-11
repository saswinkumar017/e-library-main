import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import './AdminDashboard.css';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [bookStats, setBookStats] = useState(null);
  const [printoutStats, setPrintoutStats] = useState(null);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAdminData();
  }, [activeTab]);

  const fetchAdminData = async () => {
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'overview') {
        const [stats, bookStats, printStats] = await Promise.all([
          adminAPI.getUserStats(),
          adminAPI.getBookStats(),
          adminAPI.getPrintoutStats()
        ]);
        setUserStats(stats.data);
        setBookStats(stats.data);
        setPrintoutStats(printStats.data);
      } else if (activeTab === 'users') {
        const response = await adminAPI.getAllUsers();
        setUsers(response.data);
      } else if (activeTab === 'books') {
        const response = await adminAPI.getAllBooks();
        setBooks(response.data);
      }
    } catch (error) {
      setError('Failed to fetch data');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePromoteUser = async (userId) => {
    try {
      await adminAPI.promoteUserToAdmin(userId);
      alert('User promoted to admin');
      fetchAdminData();
    } catch (error) {
      alert('Failed to promote user');
    }
  };

  const handleDemoteUser = async (userId) => {
    try {
      await adminAPI.demoteAdminToUser(userId);
      alert('User demoted to regular user');
      fetchAdminData();
    } catch (error) {
      alert('Failed to demote user');
    }
  };

  const handleDeactivateUser = async (userId) => {
    if (window.confirm('Are you sure you want to deactivate this user?')) {
      try {
        await adminAPI.deactivateUser(userId);
        alert('User deactivated');
        fetchAdminData();
      } catch (error) {
        alert('Failed to deactivate user');
      }
    }
  };

  const handleGenerateReport = async (reportType) => {
    try {
      const response = await adminAPI.generateReport(reportType);
      const dataStr = JSON.stringify(response.data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${reportType}-report-${new Date().toISOString()}.json`;
      link.click();
    } catch (error) {
      alert('Failed to generate report');
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="container">
        <div className="admin-header">
          <h1>⚙️ Admin Dashboard</h1>
          <p>Manage books, users, and view printout statistics</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="admin-navigation">
          <button
            className={`nav-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`nav-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Users
          </button>
          <button
            className={`nav-btn ${activeTab === 'books' ? 'active' : ''}`}
            onClick={() => setActiveTab('books')}
          >
            Books
          </button>
        </div>

        {activeTab === 'overview' && (
          <div className="overview-section">
            {/* User Stats */}
            <div className="stats-card-group">
              <h2>User Statistics</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">👥</div>
                  <div className="stat-content">
                    <div className="stat-value">{userStats?.totalUsers || 0}</div>
                    <div className="stat-label">Total Users</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">👨‍💼</div>
                  <div className="stat-content">
                    <div className="stat-value">{userStats?.adminUsers || 0}</div>
                    <div className="stat-label">Admin Users</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">👤</div>
                  <div className="stat-content">
                    <div className="stat-value">{userStats?.regularUsers || 0}</div>
                    <div className="stat-label">Regular Users</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Book Stats */}
            <div className="stats-card-group">
              <h2>Book Statistics</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">📚</div>
                  <div className="stat-content">
                    <div className="stat-value">{bookStats?.totalBooks || 0}</div>
                    <div className="stat-label">Total Books</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">✅</div>
                  <div className="stat-content">
                    <div className="stat-value">{bookStats?.availableCopies || 0}</div>
                    <div className="stat-label">Available Copies</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">📤</div>
                  <div className="stat-content">
                    <div className="stat-value">{bookStats?.issuedBooks || 0}</div>
                    <div className="stat-label">Issued Books</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">⏰</div>
                  <div className="stat-content">
                    <div className="stat-value">{bookStats?.borrowReturnStats?.overdue || 0}</div>
                    <div className="stat-label">Overdue Books</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Printout Stats */}
            <div className="stats-card-group">
              <h2>Printout Statistics</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">🖨️</div>
                  <div className="stat-content">
                    <div className="stat-value">{printoutStats?.totalPrintouts || 0}</div>
                    <div className="stat-label">Total Printouts</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">💰</div>
                  <div className="stat-content">
                    <div className="stat-value">
                      ₹{printoutStats?.stats?.[0]?.revenue?.[0]?.total || 0}
                    </div>
                    <div className="stat-label">Total Revenue</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Reports Section */}
            <div className="reports-section">
              <h2>Download Reports</h2>
              <div className="report-buttons">
                <button
                  onClick={() => handleGenerateReport('users')}
                  className="btn btn-primary"
                >
                  Users Report
                </button>
                <button
                  onClick={() => handleGenerateReport('books')}
                  className="btn btn-primary"
                >
                  Books Report
                </button>
                <button
                  onClick={() => handleGenerateReport('printouts')}
                  className="btn btn-primary"
                >
                  Printouts Report
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="users-section">
            <div className="section-card">
              <h2>All Users</h2>
              {users.length === 0 ? (
                <p>No users found</p>
              ) : (
                <div className="users-table">
                  {users.map((user) => (
                    <div key={user._id} className="user-item">
                      <div className="user-info">
                        <div>
                          <h4>{user.name}</h4>
                          <p>{user.email}</p>
                        </div>
                        <div className="user-meta">
                          <span className={`role-badge role-${user.role}`}>
                            {user.role}
                          </span>
                          <span className="status-badge">
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>

                      <div className="user-stats">
                        <div className="stat">
                          <span className="label">Borrowed:</span>
                          <span className="value">{user.totalBorrowedBooks || 0}</span>
                        </div>
                        <div className="stat">
                          <span className="label">Active:</span>
                          <span className="value">{user.activeBorrowedBooks || 0}</span>
                        </div>
                        <div className="stat">
                          <span className="label">Spent:</span>
                          <span className="value">₹{user.totalPrintoutSpent || 0}</span>
                        </div>
                      </div>

                      <div className="user-actions">
                        {user.role === 'user' ? (
                          <button
                            onClick={() => handlePromoteUser(user._id)}
                            className="btn btn-success btn-small"
                          >
                            Promote
                          </button>
                        ) : (
                          <button
                            onClick={() => handleDemoteUser(user._id)}
                            className="btn btn-secondary btn-small"
                          >
                            Demote
                          </button>
                        )}
                        <button
                          onClick={() => handleDeactivateUser(user._id)}
                          className="btn btn-danger btn-small"
                        >
                          Deactivate
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'books' && (
          <div className="books-section">
            <div className="section-card">
              <h2>All Books</h2>
              {books.length === 0 ? (
                <p>No books found</p>
              ) : (
                <div className="books-table">
                  {books.map((book) => (
                    <div key={book._id} className="book-item">
                      <div className="book-info">
                        <h4>{book.title}</h4>
                        <p className="author">by {book.author}</p>
                        <p className="details">
                          {book.genre} • {book.publicationYear} • {book.location}
                        </p>
                      </div>

                      <div className="book-stats">
                        <div className="stat">
                          <span className="label">Total:</span>
                          <span className="value">{book.totalCopies}</span>
                        </div>
                        <div className="stat">
                          <span className="label">Available:</span>
                          <span className="value" style={{ color: '#16a34a' }}>
                            {book.availableCopies}
                          </span>
                        </div>
                        <div className="stat">
                          <span className="label">Issued:</span>
                          <span className="value" style={{ color: '#dc2626' }}>
                            {book.issuedCount}
                          </span>
                        </div>
                        <div className="stat">
                          <span className={`status ${book.status}`}>
                            {book.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
