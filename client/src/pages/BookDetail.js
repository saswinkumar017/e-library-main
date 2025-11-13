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
    try {
      const response = await bookAPI.borrowBook(id);
      const category = book?.category || 'offline';
      const message = response.data?.message || (category === 'online'
        ? 'Online book access granted for 15 days. Renew to maintain access.'
        : 'Book borrowed successfully! Please return within the deadline.');
      alert(message);
      fetchBookDetails();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to borrow book');
    }
  };

  const handleReturn = async () => {
    const isOnline = (book?.category || 'offline') === 'online';
    if (!isOnline) {
      alert('Offline returns are verified by the admin team. Please return the physical copy at the library desk.');
      return;
    }

    try {
      const response = await bookAPI.returnBook(id);
      alert(response.data?.message || 'Online access removed successfully.');
      fetchBookDetails();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to return book');
    }
  };

  const handleRenew = async () => {
    const isOnline = (book?.category || 'offline') === 'online';
    if (!isOnline) {
      alert('Renewal is only available for online books.');
      return;
    }

    setRenewing(true);
    try {
      const response = await bookAPI.renewBook(id);
      alert(response.data?.message || 'Online access renewed for 15 more days.');
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

  const normalizeId = (value) => {
    if (!value) return null;
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
      if (value._id) return value._id;
      if (typeof value.toString === 'function') return value.toString();
    }
    return null;
  };

  const storedUserRaw = localStorage.getItem('user');
  let currentUserId = null;
  if (storedUserRaw) {
    try {
      const parsed = JSON.parse(storedUserRaw);
      currentUserId = parsed?.id || null;
    } catch (err) {
      currentUserId = null;
    }
  }

  const issuedCopies = Array.isArray(book.issuedCopies) ? book.issuedCopies : [];
  const userIssuedCopy = currentUserId
    ? issuedCopies.find(copy => !copy.isReturned && normalizeId(copy.userId) === currentUserId)
    : null;

  const isBorrowedByUser = Boolean(userIssuedCopy);
  const isOnline = (book.category || 'offline') === 'online';
  const activeCopies = issuedCopies.filter(copy => !copy.isReturned);
  const activeReadersCount = activeCopies.length;
  const availableCount = book.availableCopies ?? 0;
  const totalCopies = book.totalCopies ?? 0;
  const issuedPhysicalCount = Math.max(totalCopies - availableCount, 0);
  const renewalInterval = book.renewalIntervalDays || 15;
  const userDueDate = userIssuedCopy?.dueDate ? new Date(userIssuedCopy.dueDate).toLocaleDateString() : null;
  const locationLabel = isOnline ? 'Digital library' : book.location;
  const canBorrow = isOnline || availableCount > 0;
  const borrowDisabled = !canBorrow || isBorrowedByUser;
  const borrowButtonLabel = isBorrowedByUser
    ? 'Already Borrowed'
    : isOnline
    ? 'Access Online'
    : canBorrow
    ? 'Borrow Book'
    : 'Not Available';

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
                <span className="meta-label">Genre:</span>
                <span className="meta-value">{book.genre}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Category:</span>
                <span className="meta-value">{isOnline ? 'Online (Digital)' : 'Offline (Physical)'}</span>
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
                <span className="meta-label">Location:</span>
                <span className="meta-value">{locationLabel}</span>
              </div>
            </div>

            <div className="availability-section">
              <h3>Availability</h3>
              <div className="availability-stats">
                {isOnline ? (
                  <>
                    <div className="stat">
                      <span className="stat-label">Digital Access:</span>
                      <span className="stat-value">Unlimited</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Renewal Cycle:</span>
                      <span className="stat-value">{renewalInterval} days</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Active Readers:</span>
                      <span className="stat-value" style={{ color: '#2563eb' }}>
                        {activeReadersCount}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="stat">
                      <span className="stat-label">Total Copies:</span>
                      <span className="stat-value">{totalCopies}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Available:</span>
                      <span className="stat-value" style={{ color: '#16a34a' }}>
                        {availableCount}
                      </span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Issued:</span>
                      <span className="stat-value" style={{ color: '#dc2626' }}>
                        {issuedPhysicalCount}
                      </span>
                    </div>
                  </>
                )}
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
                disabled={borrowDisabled}
              >
                {borrowButtonLabel}
              </button>

              {isOnline && isBorrowedByUser && (
                <>
                  <button
                    onClick={handleRenew}
                    className="btn btn-primary btn-large"
                    disabled={renewing}
                  >
                    {renewing ? 'Renewing...' : 'Renew Access'}
                  </button>

                  {book.googleDriveLink && (
                    <a
                      href={book.googleDriveLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline btn-large"
                    >
                      Open Google Drive
                    </a>
                  )}

                  <button
                    onClick={handleReturn}
                    className="btn btn-success btn-large"
                  >
                    Return Access
                  </button>
                </>
              )}

              {!isOnline && isBorrowedByUser && (
                <div className="return-note">
                  Return the physical copy at the admin desk for verification before the due date.
                </div>
              )}
            </div>

            {isOnline && isBorrowedByUser && userDueDate && (
              <p className="renewal-note">Renew before <strong>{userDueDate}</strong> to keep uninterrupted access.</p>
            )}
          </div>
        </div>

        {issuedCopies.length > 0 && (
          <div className="issued-history">
            <h3>{isOnline ? 'Active Readers' : 'Current Borrowers'}</h3>
            <div className="issue-list">
              {issuedCopies
                .filter(copy => !copy.isReturned)
                .map((copy, index) => {
                  const issuedDate = copy.issueDate ? new Date(copy.issueDate).toLocaleDateString() : '—';
                  const dueDate = copy.dueDate ? new Date(copy.dueDate).toLocaleDateString() : '—';
                  const lastRenewed = copy.lastRenewedAt ? new Date(copy.lastRenewedAt).toLocaleDateString() : null;

                  return (
                    <div key={index} className="issue-item">
                      <div className="issue-info">
                        <p><strong>Borrower:</strong> {copy.borrowerName}</p>
                        <p><strong>Issued Date:</strong> {issuedDate}</p>
                        <p><strong>{isOnline ? 'Renewal Due:' : 'Due Date:'}</strong> {dueDate}</p>
                        {isOnline && lastRenewed && (
                          <p><strong>Last Renewed:</strong> {lastRenewed}</p>
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
