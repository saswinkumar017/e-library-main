import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
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
    category: 'offline',
    totalCopies: 1,
    googleDriveLink: '',
    renewalPeriodDays: 15
  });
  const [pendingReturns, setPendingReturns] = useState([]);
  const [verifyingReturnId, setVerifyingReturnId] = useState(null);

  useEffect(() => {
    fetchAdminData();
  }, [activeTab]);

  const fetchAdminData = async () => {
    setLoading(true);
    setError('');
    if (activeTab !== 'books') {
      setPendingReturns([]);
    }
    try {
      if (activeTab === 'overview') {
        const [userStatsResponse, bookStatsResponse, printStatsResponse] = await Promise.all([
          adminAPI.getUserStats(),
          adminAPI.getBookStats(),
          adminAPI.getPrintoutStats()
        ]);
        setUserStats(userStatsResponse.data);
        setBookStats(bookStatsResponse.data);
        setPrintoutStats(printStatsResponse.data);
      } else if (activeTab === 'users') {
        const response = await adminAPI.getAllUsers();
        setUsers(response.data);
      } else if (activeTab === 'books') {
        const [booksResponse, pendingReturnsResponse] = await Promise.all([
          adminAPI.getAllBooks(),
          adminAPI.getPendingBookReturns()
        ]);
        setBooks(booksResponse.data);
        setPendingReturns(pendingReturnsResponse.data?.pending || []);
      } else {
        setPendingReturns([]);
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
    setFormData(prev => {
      if (name === 'category') {
        if (value === 'online') {
          return {
            ...prev,
            category: 'online',
            location: 'Digital Library',
            totalCopies: '',
            googleDriveLink: prev.googleDriveLink || '',
            renewalPeriodDays: prev.renewalPeriodDays || 15
          };
        }

        return {
          ...prev,
          category: 'offline',
          location: prev.location === 'Digital Library' ? 'Main library' : prev.location || 'Main library',
          totalCopies: prev.totalCopies && prev.totalCopies !== '' ? prev.totalCopies : 1,
          googleDriveLink: ''
        };
      }

      if (['publicationYear', 'totalCopies', 'renewalPeriodDays'].includes(name)) {
        const numericValue = value === '' ? '' : parseInt(value, 10);
        return {
          ...prev,
          [name]: Number.isNaN(numericValue) ? '' : numericValue
        };
      }

      return {
        ...prev,
        [name]: value
      };
    });
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
      category: 'offline',
      totalCopies: 1,
      googleDriveLink: '',
      renewalPeriodDays: 15
    });
    setEditingBook(null);
    setShowAddBookForm(false);
  };

  const formatDate = (value) => {
    if (!value) {
      return '—';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '—';
    }
    return date.toLocaleString();
  };

  const handleAddBook = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title || !formData.author || !formData.genre || formData.publicationYear === '' || formData.publicationYear === undefined) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.category === 'online' && !formData.googleDriveLink) {
      setError('Please provide the Google Drive link for online books');
      return;
    }

    if (formData.category === 'offline' && (!formData.totalCopies || formData.totalCopies < 1)) {
      setError('Please provide total copies for offline books');
      return;
    }

    const payload = {
      title: formData.title,
      author: formData.author,
      genre: formData.genre,
      publicationYear: formData.publicationYear,
      isbn: formData.isbn,
      description: formData.description,
      category: formData.category
    };

    if (formData.category === 'online') {
      payload.googleDriveLink = formData.googleDriveLink.trim();
      if (formData.renewalPeriodDays) {
        payload.renewalPeriodDays = formData.renewalPeriodDays;
      }
    } else {
      payload.location = formData.location || 'Main library';
      payload.totalCopies = formData.totalCopies;
    }

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
    setFormData({
      title: book.title,
      author: book.author,
      genre: book.genre,
      publicationYear: book.publicationYear,
      isbn: book.isbn || '',
      description: book.description || '',
      location: book.category === 'online' ? 'Digital Library' : book.location || 'Main library',
      category: book.category || 'offline',
      totalCopies: book.category === 'offline' ? book.totalCopies : '',
      googleDriveLink: book.googleDriveLink || '',
      renewalPeriodDays: book.renewalPeriodDays || 15
    });
    setShowAddBookForm(true);
  };

  const handleUpdateBook = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title || !formData.author || !formData.genre || formData.publicationYear === '' || formData.publicationYear === undefined) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.category === 'online' && !formData.googleDriveLink) {
      setError('Please provide the Google Drive link for online books');
      return;
    }

    if (formData.category === 'offline' && (!formData.totalCopies || formData.totalCopies < 1)) {
      setError('Please provide total copies for offline books');
      return;
    }

    const payload = {
      title: formData.title,
      author: formData.author,
      genre: formData.genre,
      publicationYear: formData.publicationYear,
      isbn: formData.isbn,
      description: formData.description,
      category: formData.category
    };

    if (formData.category === 'online') {
      payload.googleDriveLink = formData.googleDriveLink.trim();
      if (formData.renewalPeriodDays) {
        payload.renewalPeriodDays = formData.renewalPeriodDays;
      }
    } else {
      payload.location = formData.location || 'Main library';
      if (formData.totalCopies !== '' && formData.totalCopies !== undefined) {
        payload.totalCopies = formData.totalCopies;
      }
    }

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

  const handleVerifyReturn = async (copyId) => {
    if (!window.confirm('Confirm that this book has been returned?')) {
      return;
    }

    setVerifyingReturnId(copyId);
    try {
      await adminAPI.verifyBookReturn(copyId);
      alert('Return verified successfully');
      fetchAdminData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to verify return');
    } finally {
      setVerifyingReturnId(null);
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
                    <div className="stat-label">Overdue Books</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">💾</div>
                  <div className="stat-content">
                    <div className="stat-value">{bookStats?.digitalBooks || 0}</div>
                    <div className="stat-label">Digital Titles</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">📝</div>
                  <div className="stat-content">
                    <div className="stat-value">{bookStats?.borrowReturnStats?.pendingReturns || 0}</div>
                    <div className="stat-label">Pending Returns</div>
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
                      <label htmlFor="category">Category *</label>
                      <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                      >
                        <option value="offline">Offline (Physical)</option>
                        <option value="online">Online (Digital)</option>
                      </select>
                    </div>
                  </div>

                  {formData.category === 'offline' ? (
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="location">Location</label>
                        <select
                          id="location"
                          name="location"
                          value={formData.location}
                          onChange={handleInputChange}
                        >
                          <option value="Main library">Main library</option>
                          <option value="Sub library">Sub library</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label htmlFor="totalCopies">Total Copies</label>
                        <input
                          type="number"
                          id="totalCopies"
                          name="totalCopies"
                          value={formData.totalCopies}
                          onChange={handleInputChange}
                          min="1"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="renewalPeriodDays">Renewal Period (Days)</label>
                        <input
                          type="number"
                          id="renewalPeriodDays"
                          name="renewalPeriodDays"
                          value={formData.renewalPeriodDays}
                          onChange={handleInputChange}
                          min="1"
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="googleDriveLink">Google Drive Link *</label>
                        <input
                          type="url"
                          id="googleDriveLink"
                          name="googleDriveLink"
                          value={formData.googleDriveLink}
                          onChange={handleInputChange}
                          placeholder="https://drive.google.com/..."
                          required={formData.category === 'online'}
                        />
                      </div>
                    </div>
                  )}

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
                    const isDigital = book.category === 'online';
                    const totalLabel = isDigital ? '—' : (book.totalCopies ?? 0);
                    const availableLabel = isDigital ? 'Unlimited' : (book.availableCopies ?? 0);
                    const locationLabel = isDigital ? 'Digital Library' : book.location;
                    const renewalLabel = `${book.renewalPeriodDays || 15} days`;

                    return (
                      <div key={book._id} className="book-item">
                        <div className="book-info">
                          <h4>{book.title}</h4>
                          <p className="author">by {book.author}</p>
                          <p className="details">
                            {book.genre} • {book.publicationYear} • {locationLabel}
                          </p>
                          <p className="details">
                            {isDigital ? '👩‍💻 Online Resource' : '🏛️ Physical Collection'}
                          </p>
                          {isDigital && book.googleDriveLink && (
                            <a
                              className="book-link"
                              href={book.googleDriveLink}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Open Drive Link ↗
                            </a>
                          )}
                        </div>

                        <div className="book-stats">
                          {isDigital ? (
                            <>
                              <div className="stat">
                                <span className="label">Access</span>
                                <span className="value" style={{ color: '#16a34a' }}>
                                  {availableLabel}
                                </span>
                              </div>
                              <div className="stat">
                                <span className="label">Renewal</span>
                                <span className="value">{renewalLabel}</span>
                              </div>
                              <div className="stat">
                                <span className="label">Active Users</span>
                                <span className="value" style={{ color: '#2563eb' }}>
                                  {book.issuedCount}
                                </span>
                              </div>
                              <div className="stat">
                                <span className={`status ${book.status}`}>
                                  {book.status}
                                </span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="stat">
                                <span className="label">Total</span>
                                <span className="value">{totalLabel}</span>
                              </div>
                              <div className="stat">
                                <span className="label">Available</span>
                                <span className="value" style={{ color: '#16a34a' }}>
                                  {availableLabel}
                                </span>
                              </div>
                              <div className="stat">
                                <span className="label">Issued</span>
                                <span className="value" style={{ color: '#dc2626' }}>
                                  {book.issuedCount}
                                </span>
                              </div>
                              <div className="stat">
                                <span className={`status ${book.status}`}>
                                  {book.status}
                                </span>
                              </div>
                            </>
                          )}
                        </div>

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

              <div className="pending-returns-section">
                <div className="section-subheader">
                  <h3>Pending Return Verifications</h3>
                  <span className="badge">{pendingReturns.length}</span>
                </div>
                {pendingReturns.length === 0 ? (
                  <p className="empty-state-text">No pending returns awaiting verification.</p>
                ) : (
                  <div className="pending-return-list">
                    {pendingReturns.map((request) => (
                      <div key={request.copyId} className="pending-return-item">
                        <div className="pending-return-info">
                          <h4>{request.bookTitle}</h4>
                          <p>
                            <strong>Borrower:</strong> {request.borrowerName || 'Unknown'}
                            {request.borrowerEmail ? ` (${request.borrowerEmail})` : ''}
                          </p>
                          <p>
                            <strong>Requested:</strong> {formatDate(request.returnRequestedAt)} •{' '}
                            <strong>Due:</strong> {formatDate(request.dueDate)}
                          </p>
                          <p>
                            <strong>Category:</strong> {request.category === 'online' ? 'Online' : 'Offline'}
                            {request.location ? ` • ${request.location}` : ''}
                          </p>
                        </div>
                        <div className="pending-return-actions">
                          <button
                            onClick={() => handleVerifyReturn(request.copyId)}
                            className="btn btn-success btn-small"
                            disabled={verifyingReturnId === request.copyId}
                          >
                            {verifyingReturnId === request.copyId ? 'Verifying...' : 'Mark Returned'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
