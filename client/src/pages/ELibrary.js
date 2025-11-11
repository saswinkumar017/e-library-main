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

  const handleBorrow = async (bookId) => {
    try {
      await bookAPI.borrowBook(bookId);
      alert('Book borrowed successfully! Due date is 14 days from today.');
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
            {filteredBooks.map((book) => (
              <div key={book._id} className="book-card">
                <div className="book-image">
                  {book.coverImage ? (
                    <img src={book.coverImage} alt={book.title} />
                  ) : (
                    <div className="no-image">📖</div>
                  )}
                  <div className="availability-badge">
                    {book.availableCopies > 0 ? (
                      <span className="available">Available</span>
                    ) : (
                      <span className="issued">Issued</span>
                    )}
                  </div>
                </div>

                <div className="book-content">
                  <h3 className="book-title">{book.title}</h3>
                  <p className="book-author">by {book.author}</p>
                  <p className="book-genre">{book.genre}</p>

                  <div className="book-details">
                    <div className="detail-item">
                      <span className="label">Location:</span>
                      <span className="value">{book.location}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Available:</span>
                      <span className="value">{book.availableCopies}/{book.totalCopies}</span>
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
                        <strong>Due Date:</strong> {new Date(book.issuedCopies[0]?.dueDate).toLocaleDateString()}
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
                      disabled={book.availableCopies === 0}
                    >
                      {book.availableCopies > 0 ? 'Borrow' : 'Not Available'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ELibrary;
