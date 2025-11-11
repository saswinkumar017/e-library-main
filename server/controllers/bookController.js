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
    const { title, author, genre, publicationYear, isbn, description, location, totalCopies } = req.body;

    if (!title || !author || !genre || !publicationYear) {
      return res.status(400).json({ message: 'Please provide required fields' });
    }

    const book = new Book({
      title,
      author,
      genre,
      publicationYear,
      isbn,
      description,
      location: location || 'Main library',
      totalCopies: totalCopies || 1,
      availableCopies: totalCopies || 1
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
    const { title, author, genre, publicationYear, description, location, totalCopies } = req.body;

    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    if (title) book.title = title;
    if (author) book.author = author;
    if (genre) book.genre = genre;
    if (publicationYear) book.publicationYear = publicationYear;
    if (description) book.description = description;
    if (location) book.location = location;
    if (totalCopies !== undefined) {
      const diff = totalCopies - book.totalCopies;
      book.totalCopies = totalCopies;
      book.availableCopies = Math.max(0, book.availableCopies + diff);
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

    if (book.availableCopies <= 0) {
      return res.status(400).json({ message: 'Book is not available' });
    }

    const user = await User.findById(userId);
    const borrowDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    const issuedCopy = {
      userId,
      borrowerName: user.name,
      issueDate: borrowDate,
      dueDate,
      isReturned: false
    };

    book.issuedCopies.push(issuedCopy);
    book.availableCopies -= 1;
    book.updatedAt = new Date();
    await book.save();

    user.borrowedBooks.push({
      bookId,
      borrowDate,
      dueDate,
      isReturned: false
    });
    await user.save();

    res.json({
      message: 'Book borrowed successfully',
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

    const issuedIndex = book.issuedCopies.findIndex(
      copy => copy.userId.toString() === userId && !copy.isReturned
    );

    if (issuedIndex === -1) {
      return res.status(400).json({ message: 'This book was not borrowed by you' });
    }

    const returnDate = new Date();
    book.issuedCopies[issuedIndex].returnDate = returnDate;
    book.issuedCopies[issuedIndex].isReturned = true;
    book.availableCopies += 1;
    book.updatedAt = new Date();
    await book.save();

    const user = await User.findById(userId);
    const borrowedBookIndex = user.borrowedBooks.findIndex(
      b => b.bookId.toString() === bookId && !b.isReturned
    );

    if (borrowedBookIndex !== -1) {
      user.borrowedBooks[borrowedBookIndex].returnDate = returnDate;
      user.borrowedBooks[borrowedBookIndex].isReturned = true;
      await user.save();
    }

    res.json({ message: 'Book returned successfully' });
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

    res.json({
      bookId: book._id,
      title: book.title,
      totalCopies: book.totalCopies,
      availableCopies: book.availableCopies,
      issuedCopies: book.issuedCopies.filter(copy => !copy.isReturned),
      status: book.availableCopies > 0 ? 'Available' : 'Issued'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
