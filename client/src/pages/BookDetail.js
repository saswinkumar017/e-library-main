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
      await bookAPI.borrowBook(id);
      alert('Book borrowed successfully! Due date is 14 days from today.');
      fetchBookDetails();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to borrow book');
    }
  };

  const handleReturn = async () => {
    try {
      await bookAPI.returnBook(id);
      alert('Book returned successfully');
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

  const isBorrowedByUser = book.issuedCopies.some(
    copy => !copy.isReturned && copy.userId === localStorage.getItem('userId')
  );

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
                  <span className="stat-label">Total Copies:</span>
                  <span className="stat-value">{book.totalCopies}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Available:</span>
                  <span className="stat-value" style={{ color: '#16a34a' }}>
                    {book.availableCopies}
                  </span>
                </div>
                <div className="stat">
                  <span className="stat-label">Issued:</span>
                  <span className="stat-value" style={{ color: '#dc2626' }}>
                    {book.totalCopies - book.availableCopies}
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
                disabled={book.availableCopies === 0 || isBorrowedByUser}
              >
                {isBorrowedByUser ? 'Already Borrowed' : book.availableCopies > 0 ? 'Borrow Book' : 'Not Available'}
              </button>

              {isBorrowedByUser && (
                <button
                  onClick={handleReturn}
                  className="btn btn-success btn-large"
                >
                  Return Book
                </button>
              )}
            </div>
          </div>
        </div>

        {book.issuedCopies.length > 0 && (
          <div className="issued-history">
            <h3>Current Borrowers</h3>
            <div className="issue-list">
              {book.issuedCopies
                .filter(copy => !copy.isReturned)
                .map((copy, index) => (
                  <div key={index} className="issue-item">
                    <div className="issue-info">
                      <p><strong>Borrower:</strong> {copy.borrowerName}</p>
                      <p><strong>Issued Date:</strong> {new Date(copy.issueDate).toLocaleDateString()}</p>
                      <p><strong>Due Date:</strong> {new Date(copy.dueDate).toLocaleDateString()}</p>
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
