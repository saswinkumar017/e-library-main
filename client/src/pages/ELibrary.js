import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookAPI } from '../services/api';
import './ELibrary.css';

function ELibrary() {
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [genre, setGenre] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const currentUserId = localStorage.getItem('userId');

  const genres = [
    'Fiction',
    'Non-Fiction',
    'Science',
    'History',
    'Biography',
    'Self-Help',
    'Technology',
    'Education'
  ];

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await bookAPI.getBooks({
        search: searchTerm || undefined,
        genre: genre || undefined,
        location: location || undefined
      });
      setBooks(response.data);
      setFilteredBooks(response.data);
    } catch (error) {
      setError('Failed to fetch books');
      console.error('Error fetching books:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [searchTerm, genre, location]);

  const handleBorrow = async (bookId) => {
    try {
      const response = await bookAPI.borrowBook(bookId);
      const message = response.data?.message || 'Book borrowed successfully.';
      alert(message);
      fetchBooks();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to borrow book');
    }
  };

  const handleViewDetails = (bookId) => {
    navigate(`/book/${bookId}`);
  };

  if (loading) {
    return (
      <div className="container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="e-library">
      <div className="container">
        <div className="library-header">
          <h1>📚 E-Library</h1>
          <p>Explore our collection of academic resources</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="filters-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by book name or author..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filters">
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="filter-select"
            >
              <option value="">All Genres</option>
              {genres.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>

            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="filter-select"
            >
              <option value="">All Locations</option>
              <option value="Main library">Main library</option>
              <option value="Sub library">Sub library</option>
            </select>
          </div>
        </div>

        {filteredBooks.length === 0 ? (
          <div className="no-results">
            <p>No books found matching your criteria</p>
          </div>
        ) : (
          <div className="books-grid">
            {filteredBooks.map((book) => {
              const isDigital = book.category === 'online';
              const issuedCopies = Array.isArray(book.issuedCopies) ? book.issuedCopies : [];
              const activeIssued = issuedCopies.filter(
                (copy) => !(copy?.isReturned || copy?.status === 'returned')
              );
              const activeIssuedCount = activeIssued.length;
              const borrowedByUser = Boolean(
                currentUserId &&
                  activeIssued.some((copy) => {
                    const copyUserId = copy?.userId?._id || copy?.userId;
                    return copyUserId && copyUserId.toString() === currentUserId;
                  })
              );

              const availabilityState = isDigital
                ? 'digital'
                : (book.availableCopies || 0) > 0
                ? 'available'
                : 'issued';

              const availabilityLabel =
                availabilityState === 'digital'
                  ? 'Digital'
                  : availabilityState === 'available'
                  ? 'Available'
                  : 'Issued';

              const borrowDisabled = (!isDigital && (book.availableCopies || 0) === 0) || borrowedByUser;
              const borrowButtonLabel = borrowedByUser
                ? isDigital
                  ? 'Access Active'
                  : 'Already Borrowed'
                : isDigital
                ? 'Access Book'
                : (book.availableCopies || 0) > 0
                ? 'Borrow'
                : 'Not Available';

              const locationLabel = isDigital ? 'Digital Library' : book.location;
              const accessLabel = isDigital ? 'Unlimited' : `${book.availableCopies ?? 0}/${book.totalCopies ?? 0}`;
              const renewalLabel = `${book.renewalPeriodDays || 15} days`;
              const firstActiveBorrow = !isDigital ? activeIssued[0] : null;

              return (
                <div key={book._id} className="book-card">
                  <div className="book-image">
                    {book.coverImage ? (
                      <img src={book.coverImage} alt={book.title} />
                    ) : (
                      <div className="no-image">📖</div>
                    )}
                    <div className="availability-badge">
                      <span className={availabilityState}>{availabilityLabel}</span>
                    </div>
                  </div>

                  <div className="book-content">
                    <h3 className="book-title">{book.title}</h3>
                    <p className="book-author">by {book.author}</p>
                    <p className="book-genre">
                      {book.genre} • {isDigital ? 'Online' : 'Offline'}
                    </p>

                    <div className="book-details">
                      <div className="detail-item">
                        <span className="label">Category:</span>
                        <span className="value">{isDigital ? 'Online (Digital)' : 'Offline (Physical)'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">{isDigital ? 'Access:' : 'Available:'}</span>
                        <span className="value">{accessLabel}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">{isDigital ? 'Renewal:' : 'Location:'}</span>
                        <span className="value">{isDigital ? renewalLabel : locationLabel}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">{isDigital ? 'Active Users:' : 'Year:'}</span>
                        <span className="value">{isDigital ? activeIssuedCount : book.publicationYear}</span>
                      </div>
                    </div>

                    {isDigital && (
                      <div className="digital-info">
                        Renew access every {book.renewalPeriodDays || 15} days to keep reading online.
                      </div>
                    )}

                    {!isDigital && firstActiveBorrow && (
                      <div className="issued-info">
                        <p className="borrowed-by">
                          <strong>Borrowed by:</strong> {firstActiveBorrow.borrowerName}
                        </p>
                        <p className="due-date">
                          <strong>Due Date:</strong>{' '}
                          {firstActiveBorrow.dueDate
                            ? new Date(firstActiveBorrow.dueDate).toLocaleDateString()
                            : '—'}
                        </p>
                      </div>
                    )}

                    <div className="book-actions">
                      <button
                        onClick={() => handleViewDetails(book._id)}
                        className="btn btn-secondary btn-small"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => handleBorrow(book._id)}
                        className="btn btn-primary btn-small"
                        disabled={borrowDisabled}
                      >
                        {borrowButtonLabel}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default ELibrary;
