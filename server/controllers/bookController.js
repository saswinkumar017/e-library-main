const Book = require('../models/Book');
const User = require('../models/User');

const OFFLINE_BORROW_PERIOD_DAYS = 14;
const ONLINE_RENEWAL_PERIOD_DAYS = 15;

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

exports.getBooks = async (req, res) => {
  try {
    const { search, genre, location } = req.query;
    let filter = {};

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } }
      ];
    }

    if (genre) {
      filter.genre = genre;
    }

    if (location) {
      filter.location = location;
    }

    const books = await Book.find(filter).sort({ createdAt: -1 });
    res.json(books);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    res.json(book);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createBook = async (req, res) => {
  try {
    const {
      title,
      author,
      genre,
      publicationYear,
      isbn,
      description,
      location,
      totalCopies,
      category,
      googleDriveLink
    } = req.body;

    if (!title || !author || !genre || !publicationYear) {
      return res.status(400).json({ message: 'Please provide required fields' });
    }

    const normalizedCategory = category === 'online' ? 'online' : 'offline';

    const sanitizedTotalCopies = Number.parseInt(totalCopies, 10);
    if (normalizedCategory === 'offline') {
      if (!Number.isInteger(sanitizedTotalCopies) || sanitizedTotalCopies < 1) {
        return res.status(400).json({ message: 'Offline books must include a valid total copies count' });
      }
    }

    const sanitizedDriveLink = typeof googleDriveLink === 'string' ? googleDriveLink.trim() : '';
    if (normalizedCategory === 'online' && !sanitizedDriveLink) {
      return res.status(400).json({ message: 'Online books must include a Google Drive link' });
    }

    const book = new Book({
      title,
      author,
      genre,
      publicationYear,
      isbn,
      description,
      category: normalizedCategory,
      googleDriveLink: normalizedCategory === 'online' ? sanitizedDriveLink : undefined,
      location: normalizedCategory === 'online' ? 'Online' : (location || 'Main library'),
      totalCopies: normalizedCategory === 'offline' ? sanitizedTotalCopies : 0,
      availableCopies: normalizedCategory === 'offline' ? sanitizedTotalCopies : 0
    });

    await book.save();
    res.status(201).json({
      message: 'Book created successfully',
      book
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      author,
      genre,
      publicationYear,
      description,
      location,
      totalCopies,
      category,
      googleDriveLink
    } = req.body;

    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    const requestedCategory = typeof category === 'string' ? category.toLowerCase() : undefined;
    const targetCategory = requestedCategory === 'online' || requestedCategory === 'offline'
      ? requestedCategory
      : book.category;

    if (title) book.title = title;
    if (author) book.author = author;
    if (genre) book.genre = genre;
    if (publicationYear) book.publicationYear = publicationYear;
    if (description !== undefined) book.description = description;

    if (targetCategory === 'online') {
      const sanitizedLink = typeof googleDriveLink === 'string'
        ? googleDriveLink.trim()
        : (book.googleDriveLink || '');

      if (!sanitizedLink) {
        return res.status(400).json({ message: 'Online books must include a Google Drive link' });
      }

      book.category = 'online';
      book.googleDriveLink = sanitizedLink;
      book.location = 'Online';
      book.totalCopies = 0;
      book.availableCopies = 0;
    } else {
      if (book.category === 'online' && targetCategory === 'offline' && totalCopies === undefined) {
        return res.status(400).json({ message: 'Please provide total copies when converting a book to offline' });
      }

      book.category = 'offline';
      if (location) {
        book.location = location;
      }

      if (totalCopies !== undefined) {
        const parsedCopies = Number.parseInt(totalCopies, 10);
        if (!Number.isInteger(parsedCopies) || parsedCopies < 1) {
          return res.status(400).json({ message: 'Total copies must be a whole number greater than zero' });
        }

        const diff = parsedCopies - book.totalCopies;
        book.totalCopies = parsedCopies;
        const updatedAvailable = book.availableCopies + diff;
        book.availableCopies = Math.min(book.totalCopies, Math.max(0, updatedAvailable));
      }

      if (book.availableCopies > book.totalCopies) {
        book.availableCopies = book.totalCopies;
      }

      book.googleDriveLink = undefined;
    }

    book.issuedCopies.forEach(copy => {
      copy.category = book.category;
    });

    await book.save();

    res.json({
      message: 'Book updated successfully',
      book
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteBook = async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.borrowBook = async (req, res) => {
  try {
    const { bookId } = req.body;
    const userId = req.userId;

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const activeBookIssue = book.issuedCopies.find(
      copy => copy.userId?.toString() === userId && !copy.isReturned
    );

    if (activeBookIssue) {
      if (book.category === 'online') {
        return res.status(400).json({ message: 'You already have access to this online book. Renew it instead of borrowing again.' });
      }
      return res.status(400).json({ message: 'You already have this book issued.' });
    }

    const hasActiveBorrowRecord = user.borrowedBooks.find(
      record => record.bookId?.toString() === bookId && !record.isReturned
    );

    if (hasActiveBorrowRecord) {
      if (book.category === 'online') {
        return res.status(400).json({ message: 'You already have access to this online book. Renew it instead of borrowing again.' });
      }
      return res.status(400).json({ message: 'You already have this book issued.' });
    }

    const borrowDate = new Date();
    const isOnline = book.category === 'online';
    const dueDate = addDays(borrowDate, isOnline ? ONLINE_RENEWAL_PERIOD_DAYS : OFFLINE_BORROW_PERIOD_DAYS);

    if (!isOnline) {
      if (book.availableCopies <= 0) {
        return res.status(400).json({ message: 'Book is not available' });
      }
      book.availableCopies -= 1;
    } else if (!book.googleDriveLink) {
      return res.status(400).json({ message: 'Online book is missing an access link. Please contact the administrator.' });
    }

    const issuedCopy = {
      userId,
      borrowerName: user.name,
      issueDate: borrowDate,
      dueDate,
      isReturned: false,
      category: book.category,
      renewCount: 0,
      lastRenewedAt: borrowDate
    };

    book.issuedCopies.push(issuedCopy);
    book.updatedAt = new Date();
    await book.save();

    user.borrowedBooks.push({
      bookId,
      bookTitle: book.title,
      borrowDate,
      dueDate,
      isReturned: false,
      category: book.category,
      renewCount: 0,
      lastRenewedAt: borrowDate,
      accessLink: isOnline ? book.googleDriveLink : undefined
    });
    user.updatedAt = new Date();
    await user.save();

    res.json({
      message: isOnline
        ? 'Online access granted. Please renew every 15 days to keep your access active.'
        : 'Book borrowed successfully. Please return it within the due date.',
      dueDate
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.returnBook = async (req, res) => {
  try {
    const { bookId, userId: borrowerId } = req.body;
    const callerId = req.userId;
    const callerRole = req.userRole;

    if (!bookId) {
      return res.status(400).json({ message: 'Book id is required' });
    }

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    const isStaff = callerRole === 'admin' || callerRole === 'superadmin';

    let effectiveUserId = callerId;
    if (isStaff) {
      if (borrowerId) {
        effectiveUserId = borrowerId;
      } else {
        const activeIssues = book.issuedCopies.filter(copy => !copy.isReturned);
        if (activeIssues.length === 1) {
          effectiveUserId = activeIssues[0].userId?.toString();
        }
      }
    }

    if (!effectiveUserId) {
      return res.status(400).json({ message: 'Unable to determine borrower for return processing' });
    }

    const issuedIndex = book.issuedCopies.findIndex(
      copy => copy.userId?.toString() === effectiveUserId && !copy.isReturned
    );

    if (issuedIndex === -1) {
      return res.status(400).json({ message: 'No active borrow record found for this book and user' });
    }

    const issueCategory = book.issuedCopies[issuedIndex].category || book.category;
    if (issueCategory === 'offline' && !isStaff) {
      return res.status(403).json({ message: 'Offline book returns must be processed by an administrator.' });
    }

    const returnDate = new Date();
    book.issuedCopies[issuedIndex].returnDate = returnDate;
    book.issuedCopies[issuedIndex].isReturned = true;
    book.issuedCopies[issuedIndex].lastRenewedAt = returnDate;

    if (issueCategory === 'offline') {
      book.availableCopies = Math.min(book.totalCopies, book.availableCopies + 1);
    }

    book.updatedAt = new Date();
    await book.save();

    const user = await User.findById(effectiveUserId);
    if (user) {
      const borrowedBookIndex = user.borrowedBooks.findIndex(
        record => record.bookId?.toString() === bookId && !record.isReturned
      );

      if (borrowedBookIndex !== -1) {
        user.borrowedBooks[borrowedBookIndex].returnDate = returnDate;
        user.borrowedBooks[borrowedBookIndex].isReturned = true;
        user.borrowedBooks[borrowedBookIndex].lastRenewedAt = returnDate;
      }

      user.updatedAt = new Date();
      await user.save();
    }

    res.json({
      message: issueCategory === 'offline'
        ? 'Offline book return verified successfully.'
        : 'Online access has been closed successfully.'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.renewBook = async (req, res) => {
  try {
    const { bookId } = req.body;
    const userId = req.userId;

    if (!bookId) {
      return res.status(400).json({ message: 'Book id is required for renewal' });
    }

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    if (book.category !== 'online') {
      return res.status(400).json({ message: 'Only online books support renewal' });
    }

    const issuedCopy = book.issuedCopies.find(
      copy => copy.userId?.toString() === userId && !copy.isReturned
    );

    if (!issuedCopy) {
      return res.status(400).json({ message: 'No active online access found to renew' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const borrowedEntry = user.borrowedBooks.find(
      entry => entry.bookId?.toString() === bookId && !entry.isReturned
    );

    if (!borrowedEntry) {
      return res.status(400).json({ message: 'Borrow record not found for renewal' });
    }

    const now = new Date();
    const currentDueDate = issuedCopy.dueDate instanceof Date
      ? issuedCopy.dueDate
      : new Date(issuedCopy.dueDate);
    const baseDate = currentDueDate && currentDueDate > now ? currentDueDate : now;
    const newDueDate = addDays(baseDate, ONLINE_RENEWAL_PERIOD_DAYS);

    issuedCopy.dueDate = newDueDate;
    issuedCopy.renewCount = (issuedCopy.renewCount || 0) + 1;
    issuedCopy.lastRenewedAt = now;

    borrowedEntry.dueDate = newDueDate;
    borrowedEntry.renewCount = (borrowedEntry.renewCount || 0) + 1;
    borrowedEntry.lastRenewedAt = now;

    book.updatedAt = now;
    await book.save();

    user.updatedAt = now;
    await user.save();

    res.json({
      message: 'Online access renewed for another 15 days.',
      dueDate: newDueDate
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAvailability = async (req, res) => {
  try {
    const { bookId } = req.params;
    const book = await Book.findById(bookId);

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    const isOnline = book.category === 'online';
    const activeIssuedCopies = book.issuedCopies.filter(copy => !copy.isReturned);

    res.json({
      bookId: book._id,
      title: book.title,
      category: book.category,
      totalCopies: isOnline ? null : book.totalCopies,
      availableCopies: isOnline ? null : book.availableCopies,
      issuedCopies: activeIssuedCopies,
      status: isOnline ? 'Online' : (book.availableCopies > 0 ? 'Available' : 'Issued'),
      accessLink: isOnline ? book.googleDriveLink : undefined
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
