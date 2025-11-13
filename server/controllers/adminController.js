const User = require('../models/User');
const Book = require('../models/Book');
const Printout = require('../models/Printout');

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    
    const usersWithStats = users.map(user => ({
      ...user.toObject(),
      totalBorrowedBooks: user.borrowedBooks.length,
      activeBorrowedBooks: user.borrowedBooks.filter(b => !b.isReturned).length
    }));

    res.json(usersWithStats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const adminUsers = await User.countDocuments({ role: 'admin' });
    const regularUsers = totalUsers - adminUsers;

    const usersPrintoutStats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalSpent: { $sum: '$totalPrintoutSpent' },
          totalPrintouts: { $sum: '$totalPrintoutsCount' }
        }
      }
    ]);

    res.json({
      totalUsers,
      adminUsers,
      regularUsers,
      printoutStats: usersPrintoutStats[0] || { totalSpent: 0, totalPrintouts: 0 }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllBooks = async (req, res) => {
  try {
    const books = await Book.find().sort({ createdAt: -1 });
    
    const booksWithStats = books.map(book => {
      const bookCategory = book.category || 'offline';
      const issuedCount = book.issuedCopies.filter(c => !c.isReturned).length;

      return {
        ...book.toObject(),
        category: bookCategory,
        status: bookCategory === 'online'
          ? 'Digital access'
          : book.availableCopies > 0
          ? 'Available'
          : 'Issued',
        issuedCount
      };
    });

    res.json(booksWithStats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.verifyOfflineReturn = async (req, res) => {
  try {
    const { bookId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    const bookCategory = book.category || 'offline';
    if (bookCategory !== 'offline') {
      return res.status(400).json({ message: 'Only offline books require return verification' });
    }

    const issuedCopy = book.issuedCopies.find(
      copy => !copy.isReturned && copy.userId.toString() === userId
    );

    if (!issuedCopy) {
      return res.status(400).json({ message: 'No active borrow found for this user' });
    }

    const verificationDate = new Date();
    issuedCopy.isReturned = true;
    issuedCopy.status = 'returned';
    issuedCopy.returnDate = verificationDate;
    issuedCopy.returnVerifiedBy = req.userId;

    book.availableCopies = Math.min(
      book.totalCopies,
      (book.availableCopies || 0) + 1
    );
    book.updatedAt = verificationDate;
    await book.save();

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const borrowedEntry = user.borrowedBooks.find(
      entry =>
        !entry.isReturned &&
        entry.bookId &&
        entry.bookId.toString() === bookId
    );

    if (borrowedEntry) {
      borrowedEntry.returnDate = verificationDate;
      borrowedEntry.isReturned = true;
      borrowedEntry.status = 'returned';
    }

    user.updatedAt = verificationDate;
    await user.save();

    res.json({
      message: 'Offline book return verified successfully',
      book,
      user: {
        id: user._id,
        name: user.name
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getBookStats = async (req, res) => {
  try {
    const [totalBooks, onlineBooks] = await Promise.all([
      Book.countDocuments(),
      Book.countDocuments({ category: 'online' })
    ]);

    const bookStats = await Book.aggregate([
      {
        $group: {
          _id: null,
          totalCopies: { $sum: '$totalCopies' },
          availableCopies: { $sum: '$availableCopies' }
        }
      }
    ]);

    const aggregatedStats = bookStats[0] || { totalCopies: 0, availableCopies: 0 };
    const issuedBooks = totalBooks > 0
      ? Math.max(0, (aggregatedStats.totalCopies || 0) - (aggregatedStats.availableCopies || 0))
      : 0;

    const offlineBooks = Math.max(totalBooks - onlineBooks, 0);

    res.json({
      totalBooks,
      onlineBooks,
      offlineBooks,
      totalCopies: aggregatedStats.totalCopies || 0,
      availableCopies: aggregatedStats.availableCopies || 0,
      issuedBooks,
      borrowReturnStats: await getBorrowReturnStats()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getBorrowReturnStats = async () => {
  const books = await Book.find();
  let totalBorrowed = 0;
  let totalReturned = 0;
  let overdue = 0;

  books.forEach(book => {
    book.issuedCopies.forEach(copy => {
      if (!copy.isReturned) {
        totalBorrowed += 1;
        if (copy.dueDate < new Date()) {
          overdue += 1;
        }
      } else {
        totalReturned += 1;
      }
    });
  });

  return { totalBorrowed, totalReturned, overdue };
};

exports.getPrintoutStats = async (req, res) => {
  try {
    const totalPrintouts = await Printout.countDocuments();
    
    const stats = await Printout.aggregate([
      {
        $facet: {
          byStatus: [
            { $group: { _id: '$status', count: { $sum: 1 } } }
          ],
          byPaymentStatus: [
            { $group: { _id: '$paymentStatus', count: { $sum: 1 } } }
          ],
          revenue: [
            { $match: { paymentStatus: 'completed' } },
            { $group: { _id: null, total: { $sum: '$totalCost' } } }
          ],
          colorModeBreakdown: [
            { $group: { _id: '$colorMode', count: { $sum: 1 }, revenue: { $sum: '$totalCost' } } }
          ]
        }
      }
    ]);

    res.json({
      totalPrintouts,
      stats: stats[0]
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.generateReport = async (req, res) => {
  try {
    const { reportType } = req.query;

    let report = {};

    if (reportType === 'users' || !reportType) {
      const users = await User.find().select('-password');
      report.users = users.map(u => ({
        name: u.name,
        email: u.email,
        role: u.role,
        totalBorrowed: u.borrowedBooks.length,
        activeBorrows: u.borrowedBooks.filter(b => !b.isReturned).length,
        totalPrintoutSpent: u.totalPrintoutSpent,
        totalPrintouts: u.totalPrintoutsCount
      }));
    }

    if (reportType === 'books' || !reportType) {
      const books = await Book.find();
      report.books = books.map(b => ({
        title: b.title,
        author: b.author,
        genre: b.genre,
        location: b.location,
        totalCopies: b.totalCopies,
        availableCopies: b.availableCopies,
        issuedCopies: b.issuedCopies.filter(c => !c.isReturned).length
      }));
    }

    if (reportType === 'printouts' || !reportType) {
      const printouts = await Printout.find().sort({ createdAt: -1 });
      report.printouts = printouts.map(p => ({
        documentName: p.documentName,
        userName: p.userName,
        colorMode: p.colorMode,
        copies: p.copies,
        totalPages: p.totalPages,
        totalCost: p.totalCost,
        status: p.status,
        paymentStatus: p.paymentStatus,
        createdAt: p.createdAt
      }));
    }

    report.generatedAt = new Date();
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUserBorrowHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const borrowHistory = [];
    for (const borrow of user.borrowedBooks) {
      const book = await Book.findById(borrow.bookId);
      borrowHistory.push({
        bookTitle: book?.title,
        author: book?.author,
        borrowDate: borrow.borrowDate,
        dueDate: borrow.dueDate,
        returnDate: borrow.returnDate,
        isReturned: borrow.isReturned
      });
    }

    res.json(borrowHistory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.promoteUserToAdmin = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByIdAndUpdate(
      userId,
      { role: 'admin' },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User promoted to admin',
      user
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.demoteAdminToUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByIdAndUpdate(
      userId,
      { role: 'user' },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Admin demoted to user',
      user
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deactivateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: false },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User deactivated',
      user
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.reactivateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: true },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User reactivated',
      user
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' }).select('-password').sort({ createdAt: -1 });
    
    const adminsWithStats = admins.map(admin => ({
      ...admin.toObject(),
      totalBorrowedBooks: admin.borrowedBooks.length,
      activeBorrowedBooks: admin.borrowedBooks.filter(b => !b.isReturned).length
    }));

    res.json(adminsWithStats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPendingPrintouts = async (req, res) => {
  try {
    const pendingPrintouts = await Printout.find({ 
      status: { $in: ['pending', 'processing'] }
    }).sort({ createdAt: -1 });
    
    res.json({
      total: pendingPrintouts.length,
      printouts: pendingPrintouts
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
