import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bookAPI } from '../services/api';
import './BookDetail.css';

function BookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [renewing, setRenewing] = useState(false);

  const getStoredUser = () => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch (parseError) {
      return {};
    }
  };

  const storedUser = getStoredUser();
  const currentUserId = storedUser?.id || storedUser?._id || localStorage.getItem('userId');
  const currentUserRole = storedUser?.role || 'user';

  useEffect(() => {
    fetchBookDetails();
  }, [id]);

  const fetchBookDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await bookAPI.getBookById(id);
      setBook(response.data);
    } catch (error) {
      setError('Failed to fetch book details');
      console.error('Error fetching book:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBorrow = async () => {
    if (!book) {
      return;
    }

    try {
      await bookAPI.borrowBook(id);
      if (book.category === 'online') {
        alert('Online access granted for 15 days. Renew before the deadline to keep reading.');
      } else {
        alert('Book borrowed successfully! Please return it by the due date.');
      }
      fetchBookDetails();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to borrow book');
    }
  };

  const handleReturn = async () => {
    if (!book) {
      return;
    }

    if (book.category === 'offline' && currentUserRole === 'user') {
      alert('Please contact the library staff to verify your offline return.');
      return;
    }

    try {
      await bookAPI.returnBook(id);
      alert(book.category === 'online' ? 'Online access closed.' : 'Offline return verified.');
      fetchBookDetails();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to process the return');
    }
  };

  const handleRenew = async () => {
    if (!book) {
      return;
    }

    try {
      setRenewing(true);
      const response = await bookAPI.renewBook(id);
      alert(response.data?.message || 'Online access renewed for another 15 days.');
      fetchBookDetails();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to renew access');
    } finally {
      setRenewing(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="container">
        <div className="alert alert-error">{error || 'Book not found'}</div>
        <button onClick={() => navigate('/e-library')} className="btn btn-primary">
          Back to E-Library
        </button>
      </div>
    );
  }

  const normalizedCurrentUserId = currentUserId ? currentUserId.toString() : '';
  const activeBorrow = Array.isArray(book.issuedCopies)
    ? book.issuedCopies.find(copy => {
        const borrowerId = copy.userId?._id || copy.userId;
        return !copy.isReturned && borrowerId && borrowerId.toString() === normalizedCurrentUserId;
      })
    : null;
  const isBorrowedByUser = Boolean(activeBorrow);
  const isOnline = book.category === 'online';
  const canCurrentUserReturn = isBorrowedByUser && (isOnline || currentUserRole !== 'user');
  const canRenew = isOnline && isBorrowedByUser;
  const activeBorrowDueDate = activeBorrow?.dueDate ? new Date(activeBorrow.dueDate) : null;
  const activeIssuedCount = Array.isArray(book.issuedCopies)
    ? book.issuedCopies.filter(copy => !copy.isReturned).length
    : 0;

  return (
    <div className="book-detail">
      <div className="container">
        <button onClick={() => navigate('/e-library')} className="btn btn-secondary btn-small">
          ← Back to E-Library
        </button>

        <div className="book-detail-container">
          <div className="book-detail-image">
            {book.coverImage ? (
              <img src={book.coverImage} alt={book.title} />
            ) : (
              <div className="no-image-large">📖</div>
            )}
          </div>

          <div className="book-detail-info">
            <h1>{book.title}</h1>
            <p className="author">by {book.author}</p>

            <div className="meta-info">
              <div className="meta-item">
                <span className="meta-label">Format:</span>
                <span className="meta-value">{isOnline ? 'Online (Digital)' : 'Offline (Physical)'}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Genre:</span>
                <span className="meta-value">{book.genre}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Publication Year:</span>
                <span className="meta-value">{book.publicationYear}</span>
              </div>
              {book.isbn && (
                <div className="meta-item">
                  <span className="meta-label">ISBN:</span>
                  <span className="meta-value">{book.isbn}</span>
                </div>
              )}
              <div className="meta-item">
                <span className="meta-label">{isOnline ? 'Access Mode:' : 'Location:'}</span>
                <span className="meta-value">{isOnline ? 'Digital Library' : book.location}</span>
              </div>
              {isOnline && book.googleDriveLink && (
                <div className="meta-item">
                  <span className="meta-label">Access Link:</span>
                  <a
                    href={book.googleDriveLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="meta-link"
                  >
                    Open in Drive ↗
                  </a>
                </div>
              )}
            </div>

            <div className="availability-section">
              <h3>{isOnline ? 'Access Summary' : 'Availability'}</h3>
              <div className="availability-stats">
                <div className="stat">
                  <span className="stat-label">{isOnline ? 'Access Limit:' : 'Total Copies:'}</span>
                  <span className="stat-value">{isOnline ? 'Unlimited' : book.totalCopies}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">{isOnline ? 'Renewal Cycle:' : 'Available:'}</span>
                  <span className="stat-value" style={{ color: '#16a34a' }}>
                    {isOnline ? 'Renew every 15 days' : book.availableCopies}
                  </span>
                </div>
                <div className="stat">
                  <span className="stat-label">{isOnline ? 'Active Readers:' : 'Issued:'}</span>
                  <span className="stat-value" style={{ color: '#dc2626' }}>
                    {isOnline ? activeIssuedCount : Math.max(0, book.totalCopies - book.availableCopies)}
                  </span>
                </div>
              </div>
            </div>

            {book.description && (
              <div className="description-section">
                <h3>Description</h3>
                <p>{book.description}</p>
              </div>
            )}

            <div className="actions">
              <button
                onClick={handleBorrow}
                className="btn btn-primary btn-large"
                disabled={(!isOnline && book.availableCopies === 0) || isBorrowedByUser}
              >
                {isBorrowedByUser
                  ? (isOnline ? 'Access Active' : 'Already Borrowed')
                  : isOnline
                    ? 'Access Online'
                    : book.availableCopies > 0
                      ? 'Borrow Book'
                      : 'Not Available'}
              </button>

              {canRenew && (
                <button
                  onClick={handleRenew}
                  className="btn btn-secondary btn-large"
                  disabled={renewing}
                >
                  {renewing ? 'Renewing...' : 'Renew Access'}
                </button>
              )}

              {canCurrentUserReturn && (
                <button
                  onClick={handleReturn}
                  className="btn btn-success btn-large"
                >
                  {isOnline ? 'End Access' : 'Verify Return'}
                </button>
              )}
            </div>

            {isBorrowedByUser && activeBorrowDueDate && (
              <div className="borrow-status">
                <span className="borrow-status-badge">
                  {isOnline ? 'Renew by' : 'Due on'} {activeBorrowDueDate.toLocaleDateString()}
                </span>
              </div>
            )}

            {isBorrowedByUser && !canCurrentUserReturn && !isOnline && (
              <p className="return-hint">
                Please visit the library desk so an administrator can confirm your return.
              </p>
            )}
          </div>
        </div>

        {book.issuedCopies.length > 0 && (
          <div className="issued-history">
            <h3>Current Borrowers</h3>
            <div className="issue-list">
              {book.issuedCopies
                .filter(copy => !copy.isReturned)
                .map((copy, index) => {
                  const issueCategory = copy.category || book.category;
                  return (
                    <div key={index} className="issue-item">
                      <div className="issue-info">
                        <p><strong>Borrower:</strong> {copy.borrowerName}</p>
                        <p><strong>Issued Date:</strong> {copy.issueDate ? new Date(copy.issueDate).toLocaleDateString() : '—'}</p>
                        <p><strong>{issueCategory === 'online' ? 'Renew By:' : 'Due Date:'}</strong> {copy.dueDate ? new Date(copy.dueDate).toLocaleDateString() : '—'}</p>
                        {issueCategory === 'online' && (
                          <p><strong>Renewals:</strong> {copy.renewCount || 0}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default BookDetail;
