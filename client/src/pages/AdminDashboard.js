import React, { useState, useEffect } from 'react';
import { adminAPI, bookAPI } from '../services/api';
import './AdminDashboard.css';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [bookStats, setBookStats] = useState(null);
  const [printoutStats, setPrintoutStats] = useState(null);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddBookForm, setShowAddBookForm] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    genre: '',
    publicationYear: '',
    isbn: '',
    description: '',
    location: 'Main library',
    totalCopies: 1,
    category: 'offline',
    googleDriveLink: ''
  });
  const [processingReturnId, setProcessingReturnId] = useState('');

  useEffect(() => {
    fetchAdminData();
  }, [activeTab]);

  const fetchAdminData = async () => {
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
      } else if (activeTab === 'books') {
        const response = await adminAPI.getAllBooks();
        setBooks(response.data);
      }
    } catch (error) {
      setError('Failed to fetch data');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateUser = async (userId) => {
    if (window.confirm('Are you sure you want to deactivate this user?')) {
      try {
        await adminAPI.deactivateUser(userId);
        alert('User deactivated');
        fetchAdminData();
      } catch (error) {
        alert('Failed to deactivate user');
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'category') {
      const nextCategory = value;
      setFormData(prev => ({
        ...prev,
        category: nextCategory,
        location: nextCategory === 'online' ? 'Online' : 'Main library',
        totalCopies:
          nextCategory === 'online'
            ? 0
            : (typeof prev.totalCopies === 'number' && prev.totalCopies > 0 ? prev.totalCopies : 1),
        googleDriveLink: nextCategory === 'online' ? prev.googleDriveLink : ''
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: name === 'publicationYear' || name === 'totalCopies'
        ? (value === '' ? '' : parseInt(value, 10))
        : value
    }));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      author: '',
      genre: '',
      publicationYear: '',
      isbn: '',
      description: '',
      location: 'Main library',
      totalCopies: 1,
      category: 'offline',
      googleDriveLink: ''
    });
    setEditingBook(null);
    setShowAddBookForm(false);
  };

  const handleAddBook = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title || !formData.author || !formData.genre || !formData.publicationYear) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.category === 'offline' && (!formData.totalCopies || formData.totalCopies < 1)) {
      setError('Offline books must have at least one available copy');
      return;
    }

    if (formData.category === 'online' && !formData.googleDriveLink) {
      setError('Please provide a Google Drive link for online books');
      return;
    }

    const payload = {
      ...formData,
      publicationYear: Number(formData.publicationYear),
      totalCopies: formData.category === 'offline' ? Number(formData.totalCopies) : undefined,
      googleDriveLink: formData.category === 'online' ? formData.googleDriveLink.trim() : undefined,
      location: formData.category === 'online' ? 'Online' : formData.location
    };

    try {
      await adminAPI.createBook(payload);
      alert('Book added successfully');
      resetForm();
      fetchAdminData();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to add book');
    }
  };

  const handleEditBook = (book) => {
    setEditingBook(book._id);
    const nextCategory = book.category || 'offline';
    setFormData({
      title: book.title,
      author: book.author,
      genre: book.genre,
      publicationYear: book.publicationYear,
      isbn: book.isbn || '',
      description: book.description || '',
      location: nextCategory === 'online' ? 'Online' : book.location,
      totalCopies: nextCategory === 'online' ? 0 : (book.totalCopies || 1),
      category: nextCategory,
      googleDriveLink: book.googleDriveLink || ''
    });
    setShowAddBookForm(true);
  };

  const handleUpdateBook = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title || !formData.author || !formData.genre || !formData.publicationYear) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.category === 'offline' && (!formData.totalCopies || formData.totalCopies < 1)) {
      setError('Offline books must have at least one available copy');
      return;
    }

    if (formData.category === 'online' && !formData.googleDriveLink) {
      setError('Please provide a Google Drive link for online books');
      return;
    }

    const payload = {
      ...formData,
      publicationYear: Number(formData.publicationYear),
      totalCopies: formData.category === 'offline' ? Number(formData.totalCopies) : undefined,
      googleDriveLink: formData.category === 'online' ? formData.googleDriveLink.trim() : undefined,
      location: formData.category === 'online' ? 'Online' : formData.location
    };

    try {
      await adminAPI.updateBook(editingBook, payload);
      alert('Book updated successfully');
      resetForm();
      fetchAdminData();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update book');
    }
  };

  const handleDeleteBook = async (bookId) => {
    if (window.confirm('Are you sure you want to delete this book?')) {
      try {
        await adminAPI.deleteBook(bookId);
        alert('Book deleted successfully');
        fetchAdminData();
      } catch (error) {
        alert('Failed to delete book');
      }
    }
  };

  const handleConfirmReturn = async (bookId, borrowerId, category) => {
    if (!borrowerId) {
      alert('Borrower information is required to verify this return.');
      return;
    }

    if (category === 'online') {
      alert('Online books do not require admin verification for returns.');
      return;
    }

    try {
      setProcessingReturnId(`${bookId}-${borrowerId}`);
      await bookAPI.returnBook(bookId, borrowerId);
      alert('Offline return verified successfully');
      fetchAdminData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to verify return');
    } finally {
      setProcessingReturnId('');
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="container">
        <div className="admin-header">
          <h1>⚙️ Admin Dashboard</h1>
          <p>Manage books, receive printout requests, and monitor user activities</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="admin-navigation">
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
            Users
          </button>
          <button
            className={`nav-btn ${activeTab === 'books' ? 'active' : ''}`}
            onClick={() => setActiveTab('books')}
          >
            Books
          </button>
        </div>

        {activeTab === 'overview' && (
          <div className="overview-section">
            {/* User Stats */}
            <div className="stats-card-group">
              <h2>User Statistics</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">👥</div>
                  <div className="stat-content">
                    <div className="stat-value">{userStats?.totalUsers || 0}</div>
                    <div className="stat-label">Total Users</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">👨‍💼</div>
                  <div className="stat-content">
                    <div className="stat-value">{userStats?.adminUsers || 0}</div>
                    <div className="stat-label">Admin Users</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">👤</div>
                  <div className="stat-content">
                    <div className="stat-value">{userStats?.regularUsers || 0}</div>
                    <div className="stat-label">Regular Users</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Book Stats */}
            <div className="stats-card-group">
              <h2>Book Statistics</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">📚</div>
                  <div className="stat-content">
                    <div className="stat-value">{bookStats?.totalBooks || 0}</div>
                    <div className="stat-label">Total Books</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">✅</div>
                  <div className="stat-content">
                    <div className="stat-value">{bookStats?.availableCopies || 0}</div>
                    <div className="stat-label">Available Copies</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">📤</div>
                  <div className="stat-content">
                    <div className="stat-value">{bookStats?.issuedBooks || 0}</div>
                    <div className="stat-label">Issued Books</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">⏰</div>
                  <div className="stat-content">
                    <div className="stat-value">{bookStats?.borrowReturnStats?.overdue || 0}</div>
                    <div className="stat-label">Offline Overdue</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">🌐</div>
                  <div className="stat-content">
                    <div className="stat-value">{bookStats?.onlineBooks || 0}</div>
                    <div className="stat-label">Online Titles</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">🔁</div>
                  <div className="stat-content">
                    <div className="stat-value">{bookStats?.borrowReturnStats?.onlineRenewalsDue || 0}</div>
                    <div className="stat-label">Renewals Due</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">👥</div>
                  <div className="stat-content">
                    <div className="stat-value">{bookStats?.borrowReturnStats?.onlineActive || 0}</div>
                    <div className="stat-label">Active Online Readers</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Printout Stats */}
            <div className="stats-card-group">
              <h2>Printout Statistics</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">🖨️</div>
                  <div className="stat-content">
                    <div className="stat-value">{printoutStats?.totalPrintouts || 0}</div>
                    <div className="stat-label">Total Printouts</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">💰</div>
                  <div className="stat-content">
                    <div className="stat-value">
                      ₹{printoutStats?.stats?.[0]?.revenue?.[0]?.total || 0}
                    </div>
                    <div className="stat-label">Total Revenue</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Reports Section */}
            <div className="reports-section">
              <h2>Download Reports</h2>
              <div className="report-buttons">
                <button
                  onClick={() => handleGenerateReport('users')}
                  className="btn btn-primary"
                >
                  Users Report
                </button>
                <button
                  onClick={() => handleGenerateReport('books')}
                  className="btn btn-primary"
                >
                  Books Report
                </button>
                <button
                  onClick={() => handleGenerateReport('printouts')}
                  className="btn btn-primary"
                >
                  Printouts Report
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="users-section">
            <div className="section-card">
              <div className="section-header">
                <div>
                  <h2>All Users</h2>
                  <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '5px' }}>
                    ℹ️ Role management (promote/demote) is available only to SuperAdmin
                  </p>
                </div>
              </div>
              {users.length === 0 ? (
                <p>No users found</p>
              ) : (
                <div className="users-table">
                  {users.map((user) => (
                    <div key={user._id} className="user-item">
                      <div className="user-info">
                        <div>
                          <h4>{user.name}</h4>
                          <p>{user.email}</p>
                        </div>
                        <div className="user-meta">
                          <span className={`role-badge role-${user.role}`}>
                            {user.role}
                          </span>
                          <span className="status-badge">
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>

                      <div className="user-stats">
                        <div className="stat">
                          <span className="label">Borrowed:</span>
                          <span className="value">{user.totalBorrowedBooks || 0}</span>
                        </div>
                        <div className="stat">
                          <span className="label">Active:</span>
                          <span className="value">{user.activeBorrowedBooks || 0}</span>
                        </div>
                        <div className="stat">
                          <span className="label">Spent:</span>
                          <span className="value">₹{user.totalPrintoutSpent || 0}</span>
                        </div>
                      </div>

                      <div className="user-actions">
                        <span className="info-text">Role: {user.role === 'user' ? '📖 Regular User' : '⚙️ Admin'}</span>
                        <button
                          onClick={() => handleDeactivateUser(user._id)}
                          className="btn btn-danger btn-small"
                          disabled={user.role === 'admin'}
                          title={user.role === 'admin' ? 'Contact SuperAdmin to manage admin users' : 'Deactivate this user'}
                        >
                          Deactivate
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'books' && (
          <div className="books-section">
            <div className="section-card">
              <div className="section-header">
                <h2>All Books</h2>
                <button
                  onClick={() => setShowAddBookForm(!showAddBookForm)}
                  className="btn btn-primary"
                >
                  {showAddBookForm ? 'Cancel' : '➕ Add New Book'}
                </button>
              </div>

              {showAddBookForm && (
                <form onSubmit={editingBook ? handleUpdateBook : handleAddBook} className="book-form">
                  {error && <div className="alert alert-error">{error}</div>}
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="title">Title *</label>
                      <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="author">Author *</label>
                      <input
                        type="text"
                        id="author"
                        name="author"
                        value={formData.author}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="genre">Genre *</label>
                      <input
                        type="text"
                        id="genre"
                        name="genre"
                        value={formData.genre}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="publicationYear">Publication Year *</label>
                      <input
                        type="number"
                        id="publicationYear"
                        name="publicationYear"
                        value={formData.publicationYear}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="category">Category *</label>
                      <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="offline">Offline (Physical)</option>
                        <option value="online">Online (Digital)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="location">Location</label>
                      <select
                        id="location"
                        name="location"
                        value={formData.category === 'online' ? 'Online' : formData.location}
                        onChange={handleInputChange}
                        disabled={formData.category === 'online'}
                      >
                        <option>Main library</option>
                        <option>Sub library</option>
                      </select>
                      {formData.category === 'online' && (
                        <small className="form-hint">Online books are accessible digitally.</small>
                      )}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="isbn">ISBN</label>
                      <input
                        type="text"
                        id="isbn"
                        name="isbn"
                        value={formData.isbn}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="googleDriveLink">
                        {formData.category === 'online' ? 'Google Drive Link *' : 'Google Drive Link'}
                      </label>
                      <input
                        type="url"
                        id="googleDriveLink"
                        name="googleDriveLink"
                        value={formData.googleDriveLink}
                        onChange={handleInputChange}
                        placeholder={formData.category === 'online' ? 'https://drive.google.com/...' : 'Not required for offline books'}
                        required={formData.category === 'online'}
                        disabled={formData.category !== 'online'}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="totalCopies">
                        {formData.category === 'offline' ? 'Total Copies *' : 'Stock'}
                      </label>
                      {formData.category === 'offline' ? (
                        <input
                          type="number"
                          id="totalCopies"
                          name="totalCopies"
                          value={formData.totalCopies}
                          onChange={handleInputChange}
                          min="1"
                          required
                        />
                      ) : (
                        <div className="info-field">Unlimited digital access (no stock tracking)</div>
                      )}
                    </div>
                    <div className="form-group">
                      <label htmlFor="description">Description</label>
                      <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows="3"
                      />
                    </div>
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="btn btn-success">
                      {editingBook ? 'Update Book' : 'Add Book'}
                    </button>
                    <button type="button" onClick={resetForm} className="btn btn-secondary">
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {books.length === 0 ? (
                <p>No books found</p>
              ) : (
                <div className="books-table">
                  {books.map((book) => {
                    const isOnline = book.category === 'online';
                    const activeIssues = Array.isArray(book.activeIssues)
                      ? book.activeIssues
                      : (Array.isArray(book.issuedCopies) ? book.issuedCopies.filter(issue => !issue.isReturned) : []);

                    return (
                      <div key={book._id} className="book-item">
                        <div className="book-info">
                          <div className="book-info-header">
                            <h4>{book.title}</h4>
                            <span className={`book-category-badge ${isOnline ? 'online' : 'offline'}`}>
                              {isOnline ? 'Online' : 'Offline'}
                            </span>
                          </div>
                          <p className="author">by {book.author}</p>
                          <p className="details">
                            {book.genre} • {book.publicationYear} • {isOnline ? 'Digital access' : book.location}
                          </p>
                          {isOnline && book.googleDriveLink && (
                            <a
                              href={book.googleDriveLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="book-link"
                            >
                              Open Access Link ↗
                            </a>
                          )}
                        </div>

                        <div className="book-stats">
                          <div className="stat">
                            <span className="label">Total:</span>
                            <span className="value">{isOnline ? '∞' : book.totalCopies}</span>
                          </div>
                          <div className="stat">
                            <span className="label">Available:</span>
                            <span className="value" style={{ color: '#16a34a' }}>
                              {isOnline ? 'Unlimited' : book.availableCopies}
                            </span>
                          </div>
                          <div className="stat">
                            <span className="label">{isOnline ? 'Active Access' : 'Issued'}</span>
                            <span className="value" style={{ color: '#dc2626' }}>
                              {book.issuedCount}
                            </span>
                          </div>
                          <div className="stat">
                            <span className={`status ${book.status}`}>
                              {book.status}
                            </span>
                          </div>
                        </div>

                        {activeIssues.length > 0 && (
                          <div className="active-issues">
                            <h5>{isOnline ? 'Active Readers' : 'Pending Returns'}</h5>
                            <div className="active-issues-list">
                              {activeIssues.map((issue) => {
                                const borrowerId = issue.userId?._id || issue.userId;
                                const dueDate = issue.dueDate ? new Date(issue.dueDate) : null;
                                const issueDate = issue.issueDate ? new Date(issue.issueDate) : null;
                                const isOverdue = dueDate ? dueDate < new Date() : false;
                                const processingKey = `${book._id}-${borrowerId}`;

                                return (
                                  <div key={processingKey} className="active-issue-item">
                                    <div>
                                      <p className="borrower-name">{issue.borrowerName || 'Borrower'}</p>
                                      <p className="borrower-dates">
                                        Issued: {issueDate ? issueDate.toLocaleDateString() : '—'} • Due: {dueDate ? dueDate.toLocaleDateString() : '—'}
                                      </p>
                                    </div>
                                    {isOnline ? (
                                      <span className={`renewal-badge ${isOverdue ? 'overdue' : ''}`}>
                                        Renew by {dueDate ? dueDate.toLocaleDateString() : '—'}
                                      </span>
                                    ) : (
                                      <button
                                        onClick={() => handleConfirmReturn(book._id, borrowerId, book.category)}
                                        className="btn btn-success btn-small"
                                        disabled={processingReturnId === processingKey}
                                      >
                                        {processingReturnId === processingKey ? 'Verifying…' : 'Verify Return'}
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        <div className="book-actions">
                          <button
                            onClick={() => handleEditBook(book)}
                            className="btn btn-secondary btn-small"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteBook(book._id)}
                            className="btn btn-danger btn-small"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
