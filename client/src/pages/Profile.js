import React, { useEffect, useState } from 'react';
import { authAPI } from '../services/api';
import './Profile.css';

function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await authAPI.getProfile();
        setProfile(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const formatDate = (value, options) => {
    if (!value) {
      return '—';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '—';
    }

    return date.toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <div className="container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="alert alert-error">{error}</div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const borrowedBooks = Array.isArray(profile.borrowedBooks)
    ? profile.borrowedBooks
    : [];
  const totalBorrowed = borrowedBooks.length;
  const activeBorrowed = borrowedBooks.filter((borrow) => !borrow.isReturned).length;
  const overdueBorrowed = borrowedBooks.filter((borrow) => {
    if (borrow.isReturned || !borrow.dueDate) {
      return false;
    }
    return new Date(borrow.dueDate) < new Date();
  }).length;
  const returnedBorrowed = totalBorrowed - activeBorrowed;

  return (
    <div className="profile-page">
      <div className="container">
        <div className="profile-header">
          <div className="profile-avatar">
            {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <h1>{profile.name}</h1>
          <p>{profile.email}</p>
          <div className="profile-header-meta">
            <span className={`role-badge role-${profile.role}`}>
              {profile.role === 'admin' ? 'Admin' : 'User'}
            </span>
            <span className="status-badge">
              {profile.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        <div className="profile-stats-grid">
          <div className="profile-stat-card">
            <div className="profile-stat-icon">Catalogue</div>
            <div>
              <div className="profile-stat-value">{totalBorrowed}</div>
              <div className="profile-stat-label">Books Borrowed</div>
            </div>
          </div>
          <div className="profile-stat-card">
            <div className="profile-stat-icon">In Progress</div>
            <div>
              <div className="profile-stat-value">{activeBorrowed}</div>
              <div className="profile-stat-label">Active Borrowings</div>
            </div>
          </div>
          <div className="profile-stat-card">
            <div className="profile-stat-icon">Overdue</div>
            <div>
              <div className="profile-stat-value">{overdueBorrowed}</div>
              <div className="profile-stat-label">Overdue Books</div>
            </div>
          </div>
          <div className="profile-stat-card">
            <div className="profile-stat-icon">Printouts</div>
            <div>
              <div className="profile-stat-value">{profile.totalPrintoutsCount || 0}</div>
              <div className="profile-stat-label">Printouts Completed</div>
            </div>
          </div>
        </div>

        <div className="profile-info-grid">
          <div className="profile-card">
            <h2>Account Details</h2>
            <div className="profile-details-grid">
              <div className="profile-detail">
                <span className="detail-label">Member Since</span>
                <span className="detail-value">
                  {formatDate(profile.createdAt, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <div className="profile-detail">
                <span className="detail-label">Last Updated</span>
                <span className="detail-value">
                  {formatDate(profile.updatedAt, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <div className="profile-detail">
                <span className="detail-label">Account Status</span>
                <span className="detail-value">
                  {profile.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="profile-detail">
                <span className="detail-label">Role</span>
                <span className="detail-value">
                  {profile.role === 'admin' ? 'Administrator' : 'Library User'}
                </span>
              </div>
            </div>
          </div>

          <div className="profile-card">
            <h2>Printout Summary</h2>
            <div className="profile-details-grid">
              <div className="profile-detail">
                <span className="detail-label">Total Printouts</span>
                <span className="detail-value">
                  {profile.totalPrintoutsCount || 0}
                </span>
              </div>
              <div className="profile-detail">
                <span className="detail-label">Total Spent</span>
                <span className="detail-value">
                  ₹{profile.totalPrintoutSpent || 0}
                </span>
              </div>
              <div className="profile-detail">
                <span className="detail-label">Returned Books</span>
                <span className="detail-value">{returnedBorrowed}</span>
              </div>
              <div className="profile-detail">
                <span className="detail-label">Active Borrowings</span>
                <span className="detail-value">{activeBorrowed}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="profile-card">
          <div className="profile-card-header">
            <h2>Borrowing Activity</h2>
            <p>Track your recent book borrowings and due dates</p>
          </div>

          {totalBorrowed === 0 ? (
            <div className="profile-empty-state">
              <div className="empty-icon">Library</div>
              <p>You haven't borrowed any books yet.</p>
            </div>
          ) : (
            <div className="borrow-list">
              {borrowedBooks
                .slice()
                .reverse()
                .map((borrow, index) => {
                  const isOverdue =
                    !borrow.isReturned &&
                    borrow.dueDate &&
                    new Date(borrow.dueDate) < new Date();
                  const status = borrow.isReturned
                    ? 'returned'
                    : isOverdue
                    ? 'overdue'
                    : 'active';

                  return (
                    <div
                      key={borrow._id || `${borrow.bookId}-${index}`}
                      className="borrow-item"
                    >
                      <div className="borrow-item-main">
                        <h4>{borrow.bookTitle || 'Book'}</h4>
                        <div className="borrow-meta">
                          <span>Borrowed: {formatDate(borrow.borrowDate)}</span>
                          <span>Due: {formatDate(borrow.dueDate)}</span>
                          <span>
                            Returned:{' '}
                            {borrow.isReturned
                              ? formatDate(borrow.returnDate)
                              : 'Not yet'}
                          </span>
                        </div>
                        {borrow.bookId && (
                          <span className="borrow-book-id">
                            Book ID: {borrow.bookId}
                          </span>
                        )}
                      </div>
                      <span className={`status-badge status-${status}`}>
                        {status === 'returned'
                          ? 'Returned'
                          : status === 'overdue'
                          ? 'Overdue'
                          : 'Borrowed'}
                      </span>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;
