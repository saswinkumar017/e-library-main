import React, { useEffect, useState } from 'react';
import { authAPI, bookAPI } from '../services/api';
import './Profile.css';

function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionFeedback, setActionFeedback] = useState(null);
  const [processingBookId, setProcessingBookId] = useState(null);
  const [processingAction, setProcessingAction] = useState(null);

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

  const resolveBookId = (borrowEntry) => {
    if (!borrowEntry) {
      return '';
    }

    const value = borrowEntry.bookId?._id || borrowEntry.bookId;
    return value ? value.toString() : '';
  };

  const handleReturn = async (borrowEntry) => {
    const targetBookId = resolveBookId(borrowEntry);

    if (!targetBookId) {
      setActionFeedback({
        type: 'error',
        message: 'Book information is unavailable for this record.'
      });
      return;
    }

    setProcessingBookId(targetBookId);
    setProcessingAction('return');
    setActionFeedback(null);

    try {
      const response = await bookAPI.returnBook(targetBookId);
      const now = new Date().toISOString();
      const isDigitalBorrow = borrowEntry?.category === 'online';
      const feedbackMessage = response.data?.message || (isDigitalBorrow
        ? 'Digital access revoked successfully.'
        : 'Return request submitted. Awaiting admin verification.');

      setProfile(prevProfile => {
        if (!prevProfile) {
          return prevProfile;
        }

        const updatedBorrowedBooks = Array.isArray(prevProfile.borrowedBooks)
          ? prevProfile.borrowedBooks.map(entry => {
              const entryBookId = resolveBookId(entry);
              if (entryBookId === targetBookId) {
                if (isDigitalBorrow) {
                  return {
                    ...entry,
                    isReturned: true,
                    status: 'returned',
                    returnDate: now,
                    returnVerifiedAt: now,
                    accessLink: undefined
                  };
                }

                return {
                  ...entry,
                  status: 'pending_return',
                  returnRequestedAt: now
                };
              }
              return entry;
            })
          : [];

        return {
          ...prevProfile,
          borrowedBooks: updatedBorrowedBooks
        };
      });

      setActionFeedback({
        type: 'success',
        message: feedbackMessage
      });
    } catch (err) {
      setActionFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to return the book. Please try again.'
      });
    } finally {
      setProcessingBookId(null);
      setProcessingAction(null);
    }
  };

  const handleRenew = async (borrowEntry) => {
    const targetBookId = resolveBookId(borrowEntry);

    if (!targetBookId) {
      setActionFeedback({
        type: 'error',
        message: 'Book information is unavailable for this record.'
      });
      return;
    }

    setProcessingBookId(targetBookId);
    setProcessingAction('renew');
    setActionFeedback(null);

    try {
      const response = await bookAPI.renewBook(targetBookId);
      const now = new Date().toISOString();
      const renewedDueDate = response.data?.dueDate || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();

      setProfile(prevProfile => {
        if (!prevProfile) {
          return prevProfile;
        }

        const updatedBorrowedBooks = Array.isArray(prevProfile.borrowedBooks)
          ? prevProfile.borrowedBooks.map(entry => {
              const entryBookId = resolveBookId(entry);
              if (entryBookId === targetBookId) {
                const updatedRenewals = Array.isArray(entry.renewals) ? [...entry.renewals] : [];
                updatedRenewals.push({ renewedAt: now, dueDate: renewedDueDate });

                return {
                  ...entry,
                  dueDate: renewedDueDate,
                  lastRenewedAt: now,
                  renewals: updatedRenewals,
                  status: 'active'
                };
              }
              return entry;
            })
          : [];

        return {
          ...prevProfile,
          borrowedBooks: updatedBorrowedBooks
        };
      });

      setActionFeedback({
        type: 'success',
        message: response.data?.message || 'Digital access renewed successfully.'
      });
    } catch (err) {
      setActionFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to renew access. Please try again.'
      });
    } finally {
      setProcessingBookId(null);
      setProcessingAction(null);
    }
  };

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
            <div className="profile-stat-icon">📚</div>
            <div>
              <div className="profile-stat-value">{totalBorrowed}</div>
              <div className="profile-stat-label">Books Borrowed</div>
            </div>
          </div>
          <div className="profile-stat-card">
            <div className="profile-stat-icon">⏳</div>
            <div>
              <div className="profile-stat-value">{activeBorrowed}</div>
              <div className="profile-stat-label">Active Borrowings</div>
            </div>
          </div>
          <div className="profile-stat-card">
            <div className="profile-stat-icon">⏰</div>
            <div>
              <div className="profile-stat-value">{overdueBorrowed}</div>
              <div className="profile-stat-label">Overdue Books</div>
            </div>
          </div>
          <div className="profile-stat-card">
            <div className="profile-stat-icon">🖨️</div>
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

          {actionFeedback && (
            <div
              className={`alert ${
                actionFeedback.type === 'success'
                  ? 'alert-success'
                  : actionFeedback.type === 'error'
                  ? 'alert-error'
                  : 'alert-info'
              }`}
            >
              {actionFeedback.message}
            </div>
          )}

          {totalBorrowed === 0 ? (
            <div className="profile-empty-state">
              <div className="empty-icon">📚</div>
              <p>You haven't borrowed any books yet.</p>
            </div>
          ) : (
            <div className="borrow-list">
              {borrowedBooks
                .slice()
                .reverse()
                .map((borrow, index) => {
                  const isDigitalBorrow = borrow.category === 'online';
                  const isReturned = Boolean(borrow.isReturned || borrow.status === 'returned');
                  const isPendingReturn = borrow.status === 'pending_return';
                  const isOverdue =
                    !isReturned && !isDigitalBorrow &&
                    borrow.dueDate &&
                    new Date(borrow.dueDate) < new Date();
                  const isRenewalDue =
                    !isReturned && isDigitalBorrow &&
                    borrow.dueDate &&
                    new Date(borrow.dueDate) < new Date();

                  let normalizedStatus = 'active';
                  if (isReturned) {
                    normalizedStatus = 'returned';
                  } else if (isPendingReturn) {
                    normalizedStatus = 'pending';
                  } else if (isRenewalDue) {
                    normalizedStatus = 'renewal';
                  } else if (isOverdue) {
                    normalizedStatus = 'overdue';
                  }

                  const statusLabelMap = {
                    returned: 'Returned',
                    pending: 'Pending Return',
                    overdue: 'Overdue',
                    active: isDigitalBorrow ? 'Access Active' : 'Borrowed',
                    renewal: 'Renewal Due'
                  };
                  const statusLabel = statusLabelMap[normalizedStatus] || 'Borrowed';

                  const bookIdForAction = resolveBookId(borrow);
                  const isProcessing = Boolean(bookIdForAction && processingBookId === bookIdForAction);
                  const isReturnProcessing = isProcessing && processingAction === 'return';
                  const isRenewProcessing = isProcessing && processingAction === 'renew';
                  const canRenew = isDigitalBorrow && !isReturned;
                  const canReturn = !isReturned && Boolean(bookIdForAction);
                  const renewalCount = Array.isArray(borrow.renewals) ? borrow.renewals.length : 0;

                  return (
                    <div
                      key={borrow._id || `${borrow.bookId}-${index}`}
                      className={`borrow-item ${isPendingReturn ? 'borrow-item-pending' : ''}`}
                    >
                      <div className="borrow-item-main">
                        <h4>{borrow.bookTitle || 'Book'}</h4>
                        <div className="borrow-meta">
                          <span>Category: {isDigitalBorrow ? 'Online (Digital)' : 'Offline (Physical)'}</span>
                          <span>Borrowed: {formatDate(borrow.borrowDate)}</span>
                          <span>{isDigitalBorrow ? 'Renewal Due:' : 'Due:'} {formatDate(borrow.dueDate)}</span>
                          {isDigitalBorrow ? (
                            <span>Last Renewed: {formatDate(borrow.lastRenewedAt)}</span>
                          ) : (
                            <span>
                              Returned: {borrow.isReturned ? formatDate(borrow.returnDate) : isPendingReturn ? 'Pending Verification' : 'Not yet'}
                            </span>
                          )}
                          {isDigitalBorrow && <span>Renewals: {renewalCount}</span>}
                          {isPendingReturn && borrow.returnRequestedAt && (
                            <span>Return Requested: {formatDate(borrow.returnRequestedAt)}</span>
                          )}
                        </div>
                        {bookIdForAction && (
                          <span className="borrow-book-id">
                            Book ID: {bookIdForAction}
                          </span>
                        )}
                        {isDigitalBorrow && borrow.accessLink && !isReturned && (
                          <a
                            href={borrow.accessLink}
                            className="borrow-digital-link"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Open Google Drive Link ↗
                          </a>
                        )}
                      </div>
                      <div className="borrow-item-actions">
                        <span className={`status-badge status-${normalizedStatus}`}>
                          {statusLabel}
                        </span>
                        <div className="borrow-action-buttons">
                          {canRenew && (
                            <button
                              type="button"
                              className="btn btn-secondary btn-small"
                              onClick={() => handleRenew(borrow)}
                              disabled={isRenewProcessing}
                            >
                              {isRenewProcessing ? 'Renewing...' : 'Renew Access'}
                            </button>
                          )}
                          {canReturn && (
                            <button
                              type="button"
                              className="btn btn-success btn-small"
                              onClick={() => handleReturn(borrow)}
                              disabled={isReturnProcessing || isPendingReturn}
                            >
                              {isReturnProcessing
                                ? 'Processing...'
                                : isDigitalBorrow
                                ? 'Return Access'
                                : isPendingReturn
                                ? 'Pending Verification'
                                : 'Request Return'}
                            </button>
                          )}
                        </div>
                      </div>
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
