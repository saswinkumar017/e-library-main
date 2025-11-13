const Book = require('../models/Book');
const User = require('../models/User');

const OFFLINE_BORROW_DAYS = 14;
const DEFAULT_RENEWAL_PERIOD_DAYS = 15;

const parseNumber = (value) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const getActiveIssuedCopies = (issuedCopies = []) =>
  issuedCopies.filter(copy => copy && copy.status !== 'returned' && !copy.isReturned);

exports.getBooks = async (req, res) => {
  try {
    const { search, genre, location, category } = req.query;
    const filter = {};

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

    if (category) {
      filter.category = category;
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
      googleDriveLink,
      renewalPeriodDays
    } = req.body;

    if (!title || !author || !genre || !publicationYear) {
      return res.status(400).json({ message: 'Please provide required fields' });
    }

    const parsedPublicationYear = parseNumber(publicationYear);
    if (parsedPublicationYear === undefined) {
      return res.status(400).json({ message: 'Publication year must be a valid number' });
    }

    const normalizedCategory = category === 'online' ? 'online' : 'offline';

    const book = new Book({
      title: title.trim(),
      author: author.trim(),
      genre: genre.trim(),
      publicationYear: parsedPublicationYear,
      isbn,
      description,
      category: normalizedCategory
    });

    if (normalizedCategory === 'online') {
      if (!googleDriveLink) {
        return res.status(400).json({ message: 'Google Drive link is required for online books' });
      }

      const parsedRenewalPeriod = parseNumber(renewalPeriodDays) ?? DEFAULT_RENEWAL_PERIOD_DAYS;

      book.googleDriveLink = googleDriveLink.trim();
      book.renewalPeriodDays = Math.max(parsedRenewalPeriod, 1);
      book.location = 'Digital Library';
      book.totalCopies = null;
      book.availableCopies = null;
    } else {
      const parsedTotalCopies = parseNumber(totalCopies) ?? 1;

      if (parsedTotalCopies < 1) {
        return res.status(400).json({ message: 'Total copies must be at least 1 for offline books' });
      }

      book.totalCopies = parsedTotalCopies;
      book.availableCopies = parsedTotalCopies;
      book.location = location || 'Main library';
      book.googleDriveLink = undefined;
      book.renewalPeriodDays = DEFAULT_RENEWAL_PERIOD_DAYS;
    }

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
      googleDriveLink,
      renewalPeriodDays
    } = req.body;

    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    if (category && category !== book.category) {
      return res.status(400).json({ message: 'Book category cannot be changed once created' });
    }

    if (title) book.title = title;
    if (author) book.author = author;
    if (genre) book.genre = genre;

    if (publicationYear !== undefined) {
      const parsedPublicationYear = parseNumber(publicationYear);
      if (parsedPublicationYear === undefined) {
        return res.status(400).json({ message: 'Publication year must be a valid number' });
      }
      book.publicationYear = parsedPublicationYear;
    }

    if (description !== undefined) book.description = description;

    if (book.category === 'offline') {
      if (location) {
        book.location = location;
      }

      if (totalCopies !== undefined) {
        const parsedTotalCopies = parseNumber(totalCopies);
        if (parsedTotalCopies === undefined || parsedTotalCopies < 1) {
          return res.status(400).json({ message: 'Total copies must be at least 1 for offline books' });
        }

        const currentlyIssued = getActiveIssuedCopies(book.issuedCopies).length;
        if (parsedTotalCopies < currentlyIssued) {
          return res.status(400).json({ message: 'Total copies cannot be less than the number of issued copies' });
        }

        const diff = parsedTotalCopies - (book.totalCopies || 0);
        book.totalCopies = parsedTotalCopies;
        book.availableCopies = Math.max(0, (book.availableCopies || 0) + diff);
      }
    } else {
      if (googleDriveLink !== undefined) {
        if (!googleDriveLink) {
          return res.status(400).json({ message: 'Google Drive link is required for online books' });
        }
        book.googleDriveLink = googleDriveLink.trim();
      }

      if (renewalPeriodDays !== undefined) {
        const parsedRenewalPeriod = parseNumber(renewalPeriodDays);
        if (parsedRenewalPeriod === undefined || parsedRenewalPeriod < 1) {
          return res.status(400).json({ message: 'Renewal period must be a positive number' });
        }
        book.renewalPeriodDays = Math.floor(parsedRenewalPeriod);
      }

      book.location = 'Digital Library';
    }

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

    const existingBorrow = user.borrowedBooks.find(
      borrow =>
        borrow.bookId &&
        borrow.bookId.toString() === bookId &&
        borrow.status !== 'returned'
    );

    if (existingBorrow) {
      if (book.category === 'online') {
        return res.status(400).json({
          message: 'You already have digital access to this book. Renew it from your profile.'
        });
      }

      if (existingBorrow.status === 'pending_return') {
        return res.status(400).json({
          message: 'Return verification is pending. Please wait until the admin confirms the return.'
        });
      }

      return res.status(400).json({ message: 'You have already borrowed this book.' });
    }

    if (book.category === 'offline') {
      if ((book.availableCopies || 0) <= 0) {
        return res.status(400).json({ message: 'Book is not available' });
      }
    }

    const borrowDate = new Date();
    const dueDate = new Date();

    if (book.category === 'offline') {
      dueDate.setDate(dueDate.getDate() + OFFLINE_BORROW_DAYS);
    } else {
      dueDate.setDate(dueDate.getDate() + (book.renewalPeriodDays || DEFAULT_RENEWAL_PERIOD_DAYS));
    }

    const issuedCopy = {
      userId,
      borrowerName: user.name,
      issueDate: borrowDate,
      dueDate,
      isReturned: false,
      status: 'active'
    };

    book.issuedCopies.push(issuedCopy);
    const savedIssuedCopy = book.issuedCopies[book.issuedCopies.length - 1];

    if (book.category === 'offline') {
      book.availableCopies = Math.max(0, (book.availableCopies || 0) - 1);
    }

    await book.save();

    const borrowRecord = {
      issuedCopyId: savedIssuedCopy._id,
      bookId,
      bookTitle: book.title,
      category: book.category,
      borrowDate,
      dueDate,
      status: 'active',
      isReturned: false
    };

    if (book.category === 'online') {
      borrowRecord.lastRenewedAt = borrowDate;
      borrowRecord.renewals = [
        {
          renewedAt: borrowDate,
          dueDate
        }
      ];
      borrowRecord.accessLink = book.googleDriveLink;
    }

    user.borrowedBooks.push(borrowRecord);
    user.updatedAt = new Date();
    await user.save();

    const responseMessage =
      book.category === 'online'
        ? `Digital access granted. Remember to renew every ${book.renewalPeriodDays || DEFAULT_RENEWAL_PERIOD_DAYS} days.`
        : `Book borrowed successfully. Please return it within ${OFFLINE_BORROW_DAYS} days.`;

    res.json({
      message: responseMessage,
      dueDate,
      accessLink: book.category === 'online' ? book.googleDriveLink : undefined
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

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const borrowEntry = user.borrowedBooks.find(
      borrow =>
        borrow.bookId &&
        borrow.bookId.toString() === bookId &&
        borrow.status !== 'returned'
    );

    if (!borrowEntry) {
      return res.status(400).json({ message: 'No active borrowing record found for this book' });
    }

    const issuedCopy = borrowEntry.issuedCopyId
      ? book.issuedCopies.id(borrowEntry.issuedCopyId)
      : book.issuedCopies.find(
          copy => copy.userId.toString() === userId && copy.status !== 'returned'
        );

    if (!issuedCopy) {
      return res.status(400).json({ message: 'No active borrowing record found for this book' });
    }

    if (book.category === 'offline') {
      if (issuedCopy.status === 'pending_return') {
        return res.status(400).json({
          message: 'Return request already submitted. Awaiting admin verification.'
        });
      }

      const requestTime = new Date();
      issuedCopy.status = 'pending_return';
      issuedCopy.returnRequestedAt = requestTime;

      borrowEntry.status = 'pending_return';
      borrowEntry.returnRequestedAt = requestTime;
      borrowEntry.accessLink = undefined;

      await book.save();
      await user.save();

      return res.json({
        message: 'Return request submitted. An admin will verify the physical return shortly.'
      });
    }

    const completionTime = new Date();
    issuedCopy.isReturned = true;
    issuedCopy.status = 'returned';
    issuedCopy.returnDate = completionTime;
    issuedCopy.returnVerifiedAt = completionTime;

    borrowEntry.isReturned = true;
    borrowEntry.status = 'returned';
    borrowEntry.returnDate = completionTime;
    borrowEntry.returnVerifiedAt = completionTime;
    borrowEntry.accessLink = undefined;

    await book.save();
    await user.save();

    res.json({ message: 'Digital access has been revoked successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.renewBook = async (req, res) => {
  try {
    const { bookId } = req.body;
    const userId = req.userId;

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    if (book.category !== 'online') {
      return res.status(400).json({ message: 'Renewal is available only for online books' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const borrowEntry = user.borrowedBooks.find(
      borrow =>
        borrow.bookId &&
        borrow.bookId.toString() === bookId &&
        borrow.status === 'active'
    );

    if (!borrowEntry) {
      return res.status(400).json({ message: 'No active digital access found to renew' });
    }

    const issuedCopy = borrowEntry.issuedCopyId
      ? book.issuedCopies.id(borrowEntry.issuedCopyId)
      : book.issuedCopies.find(
          copy => copy.userId.toString() === userId && copy.status === 'active'
        );

    if (!issuedCopy) {
      return res.status(400).json({ message: 'No active digital access found to renew' });
    }

    const now = new Date();
    const newDueDate = new Date();
    newDueDate.setDate(newDueDate.getDate() + (book.renewalPeriodDays || DEFAULT_RENEWAL_PERIOD_DAYS));

    issuedCopy.dueDate = newDueDate;
    issuedCopy.renewals = issuedCopy.renewals || [];
    issuedCopy.renewals.push({ renewedAt: now, dueDate: newDueDate });

    borrowEntry.dueDate = newDueDate;
    borrowEntry.lastRenewedAt = now;
    borrowEntry.renewals = borrowEntry.renewals || [];
    borrowEntry.renewals.push({ renewedAt: now, dueDate: newDueDate });

    await book.save();
    await user.save();

    res.json({ message: 'Digital access renewed successfully.', dueDate: newDueDate });
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

    const activeIssued = getActiveIssuedCopies(book.issuedCopies);

    res.json({
      bookId: book._id,
      title: book.title,
      category: book.category,
      totalCopies: book.category === 'online' ? null : book.totalCopies,
      availableCopies: book.category === 'online' ? null : book.availableCopies,
      issuedCopies: activeIssued,
      status:
        book.category === 'online'
          ? 'Digital'
          : (book.availableCopies || 0) > 0
          ? 'Available'
          : 'Issued'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
