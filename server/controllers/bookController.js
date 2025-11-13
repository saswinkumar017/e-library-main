const Book = require('../models/Book');
const User = require('../models/User');

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
      category = 'offline',
      googleDriveLink
    } = req.body;

    if (!title || !author || !genre || !publicationYear) {
      return res.status(400).json({ message: 'Please provide required fields' });
    }

    const normalizedPublicationYear = parseInt(publicationYear, 10);
    if (Number.isNaN(normalizedPublicationYear)) {
      return res.status(400).json({ message: 'Publication year must be a number' });
    }

    const normalizedCategory = category === 'online' ? 'online' : 'offline';

    const bookData = {
      title,
      author,
      genre,
      publicationYear: normalizedPublicationYear,
      isbn,
      description,
      category: normalizedCategory
    };

    if (normalizedCategory === 'online') {
      if (!googleDriveLink) {
        return res.status(400).json({ message: 'Google Drive link is required for online books' });
      }
      bookData.googleDriveLink = googleDriveLink;
      bookData.location = 'Digital library';
      bookData.totalCopies = 0;
      bookData.availableCopies = 0;
    } else {
      const parsedTotalCopies = totalCopies !== undefined ? parseInt(totalCopies, 10) : 1;
      if (Number.isNaN(parsedTotalCopies) || parsedTotalCopies < 1) {
        return res.status(400).json({ message: 'Offline books must have at least one copy' });
      }
      bookData.location = location || 'Main library';
      bookData.totalCopies = parsedTotalCopies;
      bookData.availableCopies = parsedTotalCopies;
    }

    const book = new Book(bookData);

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

    if (title) book.title = title;
    if (author) book.author = author;
    if (genre) book.genre = genre;
    if (description !== undefined) book.description = description;

    if (publicationYear !== undefined) {
      const parsedYear = parseInt(publicationYear, 10);
      if (Number.isNaN(parsedYear)) {
        return res.status(400).json({ message: 'Publication year must be a number' });
      }
      book.publicationYear = parsedYear;
    }

    const activeIssuedCount = book.issuedCopies.filter(copy => !copy.isReturned).length;
    const allowedCategories = ['offline', 'online'];
    let targetCategory = book.category;
    const requestedCategory = allowedCategories.includes(category) ? category : null;

    if (requestedCategory && requestedCategory !== book.category) {
      if (requestedCategory === 'online' && activeIssuedCount > 0) {
        return res.status(400).json({ message: 'Cannot convert to an online book while copies are issued' });
      }
      targetCategory = requestedCategory;
      book.category = requestedCategory;
    }

    if (targetCategory === 'online') {
      if (googleDriveLink !== undefined) {
        if (!googleDriveLink) {
          return res.status(400).json({ message: 'Google Drive link is required for online books' });
        }
        book.googleDriveLink = googleDriveLink;
      } else if (!book.googleDriveLink) {
        return res.status(400).json({ message: 'Google Drive link is required for online books' });
      }

      book.location = 'Digital library';
      book.totalCopies = 0;
      book.availableCopies = 0;
    } else {
      if (googleDriveLink !== undefined) {
        book.googleDriveLink = googleDriveLink;
      }

      if (location && ['Main library', 'Sub library'].includes(location)) {
        book.location = location;
      }

      if (totalCopies !== undefined) {
        const parsedTotalCopies = parseInt(totalCopies, 10);
        if (Number.isNaN(parsedTotalCopies) || parsedTotalCopies < 1) {
          return res.status(400).json({ message: 'Total copies must be at least one' });
        }
        if (parsedTotalCopies < activeIssuedCount) {
          return res.status(400).json({ message: 'Total copies cannot be less than the number of active borrows' });
        }
        book.totalCopies = parsedTotalCopies;
        book.availableCopies = parsedTotalCopies - activeIssuedCount;
      } else if (book.totalCopies < activeIssuedCount) {
        book.availableCopies = Math.max(0, book.totalCopies - activeIssuedCount);
      }

      if (!['Main library', 'Sub library'].includes(book.location)) {
        book.location = 'Main library';
      }

      if (book.totalCopies < 1) {
        const fallbackCopies = Math.max(activeIssuedCount, 1);
        book.totalCopies = fallbackCopies;
        book.availableCopies = Math.max(0, fallbackCopies - activeIssuedCount);
      }
    }

    book.updatedAt = new Date();
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

    const bookCategory = book.category || 'offline';
    if (!book.category) {
      book.category = bookCategory;
    }

    const existingBorrow = book.issuedCopies.find(
      copy => !copy.isReturned && copy.userId.toString() === userId
    );

    if (existingBorrow) {
      const message =
        bookCategory === 'online'
          ? 'You already have ongoing access to this online book. Renew to extend your access.'
          : 'You have already borrowed this book.';
      return res.status(400).json({ message });
    }

    if (bookCategory === 'offline') {
      if (book.availableCopies <= 0) {
        return res.status(400).json({ message: 'Book is not available' });
      }
    }

    const now = new Date();
    const dueDate = new Date(now);

    if (bookCategory === 'online') {
      const renewalWindow = book.renewalIntervalDays || 15;
      dueDate.setDate(dueDate.getDate() + renewalWindow);
    } else {
      dueDate.setDate(dueDate.getDate() + 14);
    }

    const issuedCopy = {
      userId,
      borrowerName: user.name,
      issueDate: now,
      dueDate,
      isReturned: false,
      status: 'borrowed',
      lastRenewedAt: bookCategory === 'online' ? now : undefined
    };

    book.issuedCopies.push(issuedCopy);

    if (bookCategory === 'offline') {
      book.availableCopies = Math.max(0, (book.availableCopies || 0) - 1);
    }

    book.updatedAt = now;
    await book.save();

    user.borrowedBooks.push({
      bookId,
      bookTitle: book.title,
      bookCategory,
      googleDriveLink: bookCategory === 'online' ? book.googleDriveLink : undefined,
      borrowDate: now,
      dueDate,
      lastRenewedAt: bookCategory === 'online' ? now : undefined,
      isReturned: false,
      status: 'borrowed'
    });
    user.updatedAt = now;
    await user.save();

    const message =
      bookCategory === 'online'
        ? 'Online book access granted for 15 days. Renew to maintain access.'
        : 'Book borrowed successfully. Please return within the deadline.';

    res.json({
      message,
      dueDate
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.returnBook = async (req, res) => {
  try {
    const { bookId } = req.body;
    const userId = req.userId;

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    const bookCategory = book.category || 'offline';

    if (bookCategory === 'offline') {
      return res.status(403).json({
        message: 'Offline books must be returned at the library desk for admin verification.'
      });
    }

    const issuedCopy = book.issuedCopies.find(
      copy => !copy.isReturned && copy.userId.toString() === userId
    );

    if (!issuedCopy) {
      return res.status(400).json({ message: 'You do not have an active borrow for this book' });
    }

    const returnDate = new Date();
    issuedCopy.returnDate = returnDate;
    issuedCopy.isReturned = true;
    issuedCopy.status = 'returned';
    book.updatedAt = returnDate;
    await book.save();

    const user = await User.findById(userId);
    if (user) {
      const borrowedEntry = user.borrowedBooks.find(
        entry =>
          !entry.isReturned &&
          entry.bookId &&
          entry.bookId.toString() === bookId
      );

      if (borrowedEntry) {
        borrowedEntry.returnDate = returnDate;
        borrowedEntry.isReturned = true;
        borrowedEntry.status = 'returned';
      }

      user.updatedAt = returnDate;
      await user.save();
    }

    res.json({ message: 'Online book access revoked successfully.' });
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

    const bookCategory = book.category || 'offline';
    const activeIssuedCopies = book.issuedCopies.filter(copy => !copy.isReturned);
    const isDigital = bookCategory === 'online';

    res.json({
      bookId: book._id,
      title: book.title,
      category: bookCategory,
      totalCopies: isDigital ? null : book.totalCopies,
      availableCopies: isDigital ? null : book.availableCopies,
      issuedCopies: activeIssuedCopies,
      status: isDigital ? 'Digital access' : book.availableCopies > 0 ? 'Available' : 'Issued',
      isUnlimited: isDigital,
      googleDriveLink: isDigital ? book.googleDriveLink : undefined,
      renewalIntervalDays: book.renewalIntervalDays || 15
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.renewOnlineBook = async (req, res) => {
  try {
    const { bookId } = req.body;
    const userId = req.userId;

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    const bookCategory = book.category || 'offline';
    if (bookCategory !== 'online') {
      return res.status(400).json({ message: 'Only online books can be renewed' });
    }

    const issuedCopy = book.issuedCopies.find(
      copy => !copy.isReturned && copy.userId.toString() === userId
    );

    if (!issuedCopy) {
      return res.status(400).json({ message: 'You do not have active access to this book' });
    }

    const now = new Date();
    const renewalWindow = book.renewalIntervalDays || 15;
    const baseDate = issuedCopy.dueDate && new Date(issuedCopy.dueDate) > now
      ? new Date(issuedCopy.dueDate)
      : now;
    const newDueDate = new Date(baseDate);
    newDueDate.setDate(newDueDate.getDate() + renewalWindow);

    issuedCopy.dueDate = newDueDate;
    issuedCopy.lastRenewedAt = now;
    book.updatedAt = now;
    await book.save();

    const user = await User.findById(userId);
    if (user) {
      const borrowedEntry = user.borrowedBooks.find(
        entry =>
          !entry.isReturned &&
          entry.bookId &&
          entry.bookId.toString() === bookId
      );

      if (borrowedEntry) {
        borrowedEntry.dueDate = newDueDate;
        borrowedEntry.lastRenewedAt = now;
      }

      user.updatedAt = now;
      await user.save();
    }

    res.json({
      message: 'Online book access renewed for 15 more days.',
      dueDate: newDueDate
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
