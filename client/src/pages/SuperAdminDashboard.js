import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import './SuperAdminDashboard.css';

function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [bookStats, setBookStats] = useState(null);
  const [printoutStats, setPrintoutStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedUser, setExpandedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  useEffect(() => {
    fetchDashboardData();
  }, [activeTab]);

  const fetchDashboardData = async () => {
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
        setBookStats(bookStats.data);
        setPrintoutStats(printStats.data);
      } else if (activeTab === 'users') {
        const response = await adminAPI.getAllUsers();
        setUsers(response.data);
      } else if (activeTab === 'admins') {
        const response = await adminAPI.getAllAdmins();
        setAdmins(response.data);
      }
    } catch (error) {
      setError('Failed to fetch data');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePromoteUser = async (userId, userName) => {
    if (window.confirm(`Promote ${userName} to Admin?`)) {
      try {
        await adminAPI.promoteUserToAdmin(userId);
        alert('User promoted to admin');
        fetchDashboardData();
      } catch (error) {
        alert('Failed to promote user');
      }
    }
  };

  const handleDemoteAdmin = async (userId, userName) => {
    if (window.confirm(`Demote ${userName} from Admin?`)) {
      try {
        await adminAPI.demoteAdminToUser(userId);
        alert('User demoted to regular user');
        fetchDashboardData();
      } catch (error) {
        alert('Failed to demote user');
      }
    }
  };

  const handleDeactivateUser = async (userId, userName) => {
    if (window.confirm(`Deactivate ${userName}?`)) {
      try {
        await adminAPI.deactivateUser(userId);
        alert('User deactivated');
        fetchDashboardData();
      } catch (error) {
        alert('Failed to deactivate user');
      }
    }
  };

  const handleReactivateUser = async (userId, userName) => {
    if (window.confirm(`Reactivate ${userName}?`)) {
      try {
        await adminAPI.reactivateUser(userId);
        alert('User reactivated');
        fetchDashboardData();
      } catch (error) {
        alert('Failed to reactivate user');
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

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const filteredAdmins = admins.filter(admin => {
    const matchesSearch = 
      admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="superadmin-dashboard">
      <div className="container">
        <div className="superadmin-header">
          <div className="header-content">
            <h1>Super Administrator Dashboard</h1>
            <p>Complete system management and user role control.</p>
          </div>
          <div className="header-badge">
            <span>Full Control</span>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="superadmin-navigation">
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
            Regular Users
          </button>
          <button
            className={`nav-btn ${activeTab === 'admins' ? 'active' : ''}`}
            onClick={() => setActiveTab('admins')}
          >
            Administrator Accounts
          </button>
          <button
            className={`nav-btn ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            Reports
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="overview-section">
            {/* System Stats */}
            <div className="stats-card-group">
              <h2>System Overview</h2>
              <div className="stats-grid">
                <div className="stat-card primary">
                  <div className="stat-icon">Users</div>
                  <div className="stat-content">
                    <div className="stat-value">{userStats?.totalUsers || 0}</div>
                    <div className="stat-label">Total Users</div>
                  </div>
                </div>

                <div className="stat-card secondary">
                  <div className="stat-icon">Members</div>
                  <div className="stat-content">
                    <div className="stat-value">{userStats?.regularUsers || 0}</div>
                    <div className="stat-label">Regular Users</div>
                  </div>
                </div>

                <div className="stat-card warning">
                  <div className="stat-icon">Administrators</div>
                  <div className="stat-content">
                    <div className="stat-value">{userStats?.adminUsers || 0}</div>
                    <div className="stat-label">Admin Users</div>
                  </div>
                </div>

                <div className="stat-card info">
                  <div className="stat-icon">Super Admin</div>
                  <div className="stat-content">
                    <div className="stat-value">1</div>
                    <div className="stat-label">You (SuperAdmin)</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Book Stats */}
            <div className="stats-card-group">
              <h2>Book Inventory</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">Catalogue</div>
                  <div className="stat-content">
                    <div className="stat-value">{bookStats?.totalBooks || 0}</div>
                    <div className="stat-label">Total Books</div>
                  </div>
                </div>

                <div className="stat-card success">
                  <div className="stat-icon">Available</div>
                  <div className="stat-content">
                    <div className="stat-value">{bookStats?.availableCopies || 0}</div>
                    <div className="stat-label">Available</div>
                  </div>
                </div>

                <div className="stat-card danger">
                  <div className="stat-icon">Issued</div>
                  <div className="stat-content">
                    <div className="stat-value">{bookStats?.issuedBooks || 0}</div>
                    <div className="stat-label">Issued</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">Overdue</div>
                  <div className="stat-content">
                    <div className="stat-value">{bookStats?.borrowReturnStats?.overdue || 0}</div>
                    <div className="stat-label">Overdue</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Printout Stats */}
            {printoutStats && (
              <div className="stats-card-group">
                <h2>Printout Statistics</h2>
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-icon">Printouts</div>
                    <div className="stat-content">
                      <div className="stat-value">{printoutStats?.totalPrintouts || 0}</div>
                      <div className="stat-label">Total Printouts</div>
                    </div>
                  </div>

                  {printoutStats?.stats?.revenue?.[0] && (
                    <div className="stat-card success">
                      <div className="stat-icon">Revenue</div>
                      <div className="stat-content">
                        <div className="stat-value">₹{printoutStats.stats.revenue[0].total}</div>
                        <div className="stat-label">Revenue</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Regular Users Tab */}
        {activeTab === 'users' && (
          <div className="users-section">
            <div className="section-header">
              <h2>Regular Users Management</h2>
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>

            <div className="users-list">
              {filteredUsers.length === 0 ? (
                <div className="empty-state">
                  <p>No regular users found</p>
                </div>
              ) : (
                filteredUsers.map(user => (
                  <div key={user._id} className={`user-card ${!user.isActive ? 'inactive' : ''}`}>
                    <div className="user-header">
                      <div className="user-info">
                        <h3>{user.name}</h3>
                        <p className="user-email">{user.email}</p>
                        <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                          {user.isActive ? '✓ Active' : '✗ Inactive'}
                        </span>
                      </div>
                      <div className="user-stats">
                        <div className="stat">
                          <span className="label">Books Borrowed</span>
                          <span className="value">{user.totalBorrowedBooks}</span>
                        </div>
                        <div className="stat">
                          <span className="label">Active Borrows</span>
                          <span className="value">{user.activeBorrowedBooks}</span>
                        </div>
                        <div className="stat">
                          <span className="label">Spent on Printouts</span>
                          <span className="value">₹{user.totalPrintoutSpent}</span>
                        </div>
                      </div>
                    </div>
                    <div className="user-actions">
                      <button
                        className="btn btn-primary"
                        onClick={() => handlePromoteUser(user._id, user.name)}
                      >
                        Promote to Administrator
                      </button>
                      {user.isActive ? (
                        <button
                          className="btn btn-danger"
                          onClick={() => handleDeactivateUser(user._id, user.name)}
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          className="btn btn-success"
                          onClick={() => handleReactivateUser(user._id, user.name)}
                        >
                          Reactivate
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Admin Users Tab */}
        {activeTab === 'admins' && (
          <div className="admins-section">
            <div className="section-header">
              <h2>Administrator Management</h2>
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Search admins by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>

            <div className="admins-list">
              {filteredAdmins.length === 0 ? (
                <div className="empty-state">
                  <p>No admin users found</p>
                </div>
              ) : (
                filteredAdmins.map(admin => (
                  <div key={admin._id} className="admin-card">
                    <div className="admin-header">
                      <div className="admin-info">
                        <h3>{admin.name}</h3>
                        <p className="admin-email">{admin.email}</p>
                        <span className="admin-badge">Admin</span>
                      </div>
                      <div className="admin-stats">
                        <div className="stat">
                          <span className="label">Joined</span>
                          <span className="value">
                            {new Date(admin.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="stat">
                          <span className="label">Total Activity</span>
                          <span className="value">
                            {admin.totalBorrowedBooks + admin.totalPrintoutsCount}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="admin-actions">
                      <button
                        className="btn btn-warning"
                        onClick={() => handleDemoteAdmin(admin._id, admin.name)}
                      >
                        Demote to Member
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="reports-section">
            <h2>System Reports</h2>
            <div className="reports-grid">
              <div className="report-card">
                <div className="report-icon">Users</div>
                <h3>User Report</h3>
                <p>Export all users, roles, and activity data</p>
                <button
                  className="btn btn-primary"
                  onClick={() => handleGenerateReport('users')}
                >
                  Download Users Report
                </button>
              </div>

              <div className="report-card">
                <div className="report-icon">Books</div>
                <h3>Book Report</h3>
                <p>Export inventory, borrowing, and returns data</p>
                <button
                  className="btn btn-primary"
                  onClick={() => handleGenerateReport('books')}
                >
                  Download Books Report
                </button>
              </div>

              <div className="report-card">
                <div className="report-icon">Printouts</div>
                <h3>Printout Report</h3>
                <p>Export printout requests and payment data</p>
                <button
                  className="btn btn-primary"
                  onClick={() => handleGenerateReport('printouts')}
                >
                  Download Printout Report
                </button>
              </div>

              <div className="report-card">
                <div className="report-icon">Summary</div>
                <h3>Complete Report</h3>
                <p>Export all system data in one comprehensive file</p>
                <button
                  className="btn btn-primary"
                  onClick={() => handleGenerateReport('')}
                >
                  Download Complete Report
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SuperAdminDashboard;
