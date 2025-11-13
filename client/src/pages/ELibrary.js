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

  const handleBorrow = async (book) => {
    try {
      await bookAPI.borrowBook(book._id);
      if (book.category === 'online') {
        alert('Online access granted for 15 days. Remember to renew to keep access active.');
      } else {
        alert('Book borrowed successfully! Please return it within the due date.');
      }
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
              const isOnline = book.category === 'online';
              const availabilityBadge = isOnline
                ? <span className="available">Online</span>
                : (book.availableCopies > 0
                    ? <span className="available">Available</span>
                    : <span className="issued">Issued</span>);
              const availabilityLabel = isOnline ? 'Unlimited' : `${book.availableCopies}/${book.totalCopies}`;
              const primaryActionLabel = isOnline
                ? 'Access'
                : book.availableCopies > 0
                  ? 'Borrow'
                  : 'Not Available';
              const isActionDisabled = !isOnline && book.availableCopies === 0;

              return (
                <div key={book._id} className="book-card">
                  <div className="book-image">
                    {book.coverImage ? (
                      <img src={book.coverImage} alt={book.title} />
                    ) : (
                      <div className="no-image">📖</div>
                    )}
                    <div className="availability-badge">
                      {availabilityBadge}
                    </div>
                  </div>

                  <div className="book-content">
                    <h3 className="book-title">{book.title}</h3>
                    <p className="book-author">by {book.author}</p>
                    <p className="book-genre">{book.genre}</p>

                    <div className="book-details">
                      <div className="detail-item">
                        <span className="label">Type:</span>
                        <span className="value">{isOnline ? 'Online Access' : 'Offline Stock'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Location:</span>
                        <span className="value">{isOnline ? 'Digital Library' : book.location}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Available:</span>
                        <span className="value">{availabilityLabel}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Year:</span>
                        <span className="value">{book.publicationYear}</span>
                      </div>
                    </div>

                    {book.issuedCopies.length > 0 && (
                      <div className="issued-info">
                        <p className="borrowed-by">
                          <strong>Borrowed by:</strong> {book.issuedCopies[0]?.borrowerName}
                        </p>
                        <p className="due-date">
                          <strong>{isOnline ? 'Renew By:' : 'Due Date:'}</strong>{' '}
                          {book.issuedCopies[0]?.dueDate
                            ? new Date(book.issuedCopies[0].dueDate).toLocaleDateString()
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
                        onClick={() => handleBorrow(book)}
                        className={`btn btn-primary btn-small ${isActionDisabled ? 'disabled' : ''}`}
                        disabled={isActionDisabled}
                      >
                        {primaryActionLabel}
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
