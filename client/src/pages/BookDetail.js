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
  const currentUserId = localStorage.getItem('userId');

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
      const message = response.data?.message || 'Book borrowed successfully.';
      alert(message);
      fetchBookDetails();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to borrow book');
    }
  };

  const handleReturn = async () => {
    try {
      const response = await bookAPI.returnBook(id);
      const message = response.data?.message || 'Return processed successfully.';
      alert(message);
      fetchBookDetails();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to return book');
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

  const isDigital = book.category === 'online';
  const issuedCopies = Array.isArray(book.issuedCopies) ? book.issuedCopies : [];
  const activeIssued = issuedCopies.filter(
    copy => !(copy?.isReturned || copy?.status === 'returned')
  );
  const activeIssuedCount = activeIssued.length;
  const userBorrowRecord = currentUserId
    ? activeIssued.find(copy => {
        const copyUserId = copy?.userId?._id || copy?.userId;
        return copyUserId && copyUserId.toString() === currentUserId;
      })
    : null;
  const isBorrowedByUser = Boolean(userBorrowRecord);
  const isPendingReturn = userBorrowRecord?.status === 'pending_return';

  const borrowDisabled = (!isDigital && (book.availableCopies || 0) === 0) || isBorrowedByUser || isPendingReturn;
  const borrowLabel = isBorrowedByUser
    ? isDigital
      ? 'Access Active'
      : 'Already Borrowed'
    : isDigital
    ? 'Access Book'
    : (book.availableCopies || 0) > 0
    ? 'Borrow Book'
    : 'Not Available';

  const returnDisabled = isPendingReturn;
  const returnLabel = isDigital
    ? 'Return Access'
    : isPendingReturn
    ? 'Pending Verification'
    : 'Request Return';

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
                <span className="meta-value">{book.location}</span>
              </div>
            </div>

            <div className="availability-section">
              <h3>Availability</h3>
              <div className="availability-stats">
                <div className="stat">
                  <span className="stat-label">Category:</span>
                  <span className="stat-value">{isDigital ? 'Online (Digital)' : 'Offline (Physical)'}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">{isDigital ? 'Access:' : 'Total Copies:'}</span>
                  <span className="stat-value">{isDigital ? 'Unlimited' : book.totalCopies}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">{isDigital ? 'Active Users:' : 'Available:'}</span>
                  <span className="stat-value" style={{ color: '#16a34a' }}>
                    {isDigital ? activeIssuedCount : book.availableCopies}
                  </span>
                </div>
                <div className="stat">
                  <span className="stat-label">{isDigital ? 'Renewal Period:' : 'Issued:'}</span>
                  <span className="stat-value" style={{ color: '#dc2626' }}>
                    {isDigital
                      ? `${book.renewalPeriodDays || 15} days`
                      : Math.max(0, (book.totalCopies || 0) - (book.availableCopies || 0))}
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

            {isDigital && (
              <div className="digital-resource">
                <h3>Digital Resource</h3>
                {isBorrowedByUser && book.googleDriveLink ? (
                  <a
                    href={book.googleDriveLink}
                    className="digital-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open Google Drive Link ↗
                  </a>
                ) : (
                  <p>Borrow this digital title to unlock the Google Drive resource.</p>
                )}
              </div>
            )}

            <div className="actions">
              <button
                onClick={handleBorrow}
                className="btn btn-primary btn-large"
                disabled={borrowDisabled}
              >
                {borrowLabel}
              </button>

              {isBorrowedByUser && (
                <button
                  onClick={() => {
                    if (!returnDisabled) {
                      handleReturn();
                    }
                  }}
                  className={`btn ${isDigital ? 'btn-secondary' : 'btn-success'} btn-large`}
                  disabled={returnDisabled}
                >
                  {returnLabel}
                </button>
              )}
            </div>

            {isPendingReturn && !isDigital && (
              <p className="return-note">Return request submitted. Awaiting admin verification.</p>
            )}
          </div>
        </div>

        {activeIssuedCount > 0 && (
          <div className="issued-history">
            <h3>{isDigital ? 'Active Readers' : 'Current Borrowers'}</h3>
            <div className="issue-list">
              {activeIssued.map((copy, index) => (
                <div key={index} className="issue-item">
                  <div className="issue-info">
                    <p><strong>{isDigital ? 'Reader' : 'Borrower'}:</strong> {copy.borrowerName}</p>
                    <p><strong>Issued Date:</strong> {copy.issueDate ? new Date(copy.issueDate).toLocaleDateString() : '—'}</p>
                    <p><strong>{isDigital ? 'Renewal Due:' : 'Due Date:'}</strong> {copy.dueDate ? new Date(copy.dueDate).toLocaleDateString() : '—'}</p>
                    {copy.status === 'pending_return' && !isDigital && (
                      <span className="borrow-status pending">Pending Return Verification</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default BookDetail;
