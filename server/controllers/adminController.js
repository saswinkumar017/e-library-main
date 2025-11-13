const User = require('../models/User');
const Book = require('../models/Book');
const Printout = require('../models/Printout');

const getActiveIssuedCopies = (issuedCopies = []) =>
  issuedCopies.filter(copy => copy && copy.status !== 'returned');

const isBorrowReturned = (borrow = {}) => Boolean(borrow.isReturned) || borrow.status === 'returned';
const isBorrowPendingReturn = (borrow = {}) => borrow.status === 'pending_return';

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });

    const usersWithStats = users.map(user => {
      const totalBorrowedBooks = Array.isArray(user.borrowedBooks) ? user.borrowedBooks.length : 0;
      const activeBorrowedBooks = Array.isArray(user.borrowedBooks)
        ? user.borrowedBooks.filter(borrow => !isBorrowReturned(borrow)).length
        : 0;
      const pendingReturnRequests = Array.isArray(user.borrowedBooks)
        ? user.borrowedBooks.filter(isBorrowPendingReturn).length
        : 0;

      return {
        ...user.toObject(),
        totalBorrowedBooks,
        activeBorrowedBooks,
        pendingReturnRequests
      };
    });

    res.json(usersWithStats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const adminUsers = await User.countDocuments({ role: 'admin' });
    const superAdmins = await User.countDocuments({ role: 'superadmin' });
    const regularUsers = totalUsers - adminUsers - superAdmins;

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
      superAdmins,
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
      const issuedCount = getActiveIssuedCopies(book.issuedCopies).length;
      const status =
        book.category === 'online'
          ? 'Digital'
          : (book.availableCopies || 0) > 0
          ? 'Available'
          : 'Issued';

      return {
        ...book.toObject(),
        availableCopies: book.category === 'online' ? null : book.availableCopies,
        status,
        issuedCount
      };
    });

    res.json(booksWithStats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getBookStats = async (req, res) => {
  try {
    const totalBooks = await Book.countDocuments();

    const aggregation = await Book.aggregate([
      {
        $group: {
          _id: null,
          totalCopies: { $sum: { $ifNull: ['$totalCopies', 0] } },
          availableCopies: { $sum: { $ifNull: ['$availableCopies', 0] } },
          digitalBooks: {
            $sum: {
              $cond: [{ $eq: ['$category', 'online'] }, 1, 0]
            }
          },
          offlineBooks: {
            $sum: {
              $cond: [{ $eq: ['$category', 'offline'] }, 1, 0]
            }
          }
        }
      }
    ]);

    const aggregateStats = aggregation[0] || {
      totalCopies: 0,
      availableCopies: 0,
      digitalBooks: 0,
      offlineBooks: 0
    };

    const issuedBooks = Math.max(0, aggregateStats.totalCopies - aggregateStats.availableCopies);

    res.json({
      totalBooks,
      totalCopies: aggregateStats.totalCopies,
      availableCopies: aggregateStats.availableCopies,
      issuedBooks,
      digitalBooks: aggregateStats.digitalBooks,
      offlineBooks: aggregateStats.offlineBooks,
      borrowReturnStats: await getBorrowReturnStats()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getBorrowReturnStats = async () => {
  const books = await Book.find();
  const now = new Date();
  let totalBorrowed = 0;
  let totalReturned = 0;
  let overdue = 0;
  let pendingReturns = 0;
  let activeDigitalAccess = 0;

  books.forEach(book => {
    book.issuedCopies.forEach(copy => {
      if (!copy) {
        return;
      }

      if (copy.status === 'returned' || copy.isReturned) {
        totalReturned += 1;
        return;
      }

      totalBorrowed += 1;

      if (book.category === 'online') {
        activeDigitalAccess += 1;
      }

      if (copy.status === 'pending_return') {
        pendingReturns += 1;
      }

      if (copy.dueDate && copy.dueDate < now) {
        overdue += 1;
      }
    });
  });

  return { totalBorrowed, totalReturned, overdue, pendingReturns, activeDigitalAccess };
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

    const report = {};

    if (reportType === 'users' || !reportType) {
      const users = await User.find().select('-password');
      report.users = users.map(user => ({
        name: user.name,
        email: user.email,
        role: user.role,
        totalBorrowed: user.borrowedBooks.length,
        activeBorrows: user.borrowedBooks.filter(borrow => !isBorrowReturned(borrow)).length,
        pendingReturns: user.borrowedBooks.filter(isBorrowPendingReturn).length,
        totalPrintoutSpent: user.totalPrintoutSpent,
        totalPrintouts: user.totalPrintoutsCount
      }));
    }

    if (reportType === 'books' || !reportType) {
      const books = await Book.find();
      report.books = books.map(book => ({
        title: book.title,
        author: book.author,
        genre: book.genre,
        category: book.category,
        location: book.location,
        totalCopies: book.totalCopies,
        availableCopies: book.availableCopies,
        issuedCopies: getActiveIssuedCopies(book.issuedCopies).length,
        renewalPeriodDays: book.renewalPeriodDays,
        googleDriveLink: book.category === 'online' ? book.googleDriveLink : undefined
      }));
    }

    if (reportType === 'printouts' || !reportType) {
      const printouts = await Printout.find().sort({ createdAt: -1 });
      report.printouts = printouts.map(printout => ({
        documentName: printout.documentName,
        userName: printout.userName,
        colorMode: printout.colorMode,
        copies: printout.copies,
        totalPages: printout.totalPages,
        totalCost: printout.totalCost,
        status: printout.status,
        paymentStatus: printout.paymentStatus,
        createdAt: printout.createdAt
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
        status: borrow.status || (borrow.isReturned ? 'returned' : 'active')
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
      activeBorrowedBooks: admin.borrowedBooks.filter(borrow => !isBorrowReturned(borrow)).length,
      pendingReturnRequests: admin.borrowedBooks.filter(isBorrowPendingReturn).length
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

exports.getPendingBookReturns = async (req, res) => {
  try {
    const books = await Book.find({ 'issuedCopies.status': 'pending_return' });

    if (!books.length) {
      return res.json({ total: 0, pending: [] });
    }

    const userIds = new Set();
    books.forEach(book => {
      book.issuedCopies.forEach(copy => {
        if (copy && copy.status === 'pending_return') {
          userIds.add(copy.userId.toString());
        }
      });
    });

    const users = await User.find({ _id: { $in: Array.from(userIds) } }).select('name email');
    const userMap = new Map(users.map(user => [user._id.toString(), user]));

    const pending = [];
    books.forEach(book => {
      book.issuedCopies.forEach(copy => {
        if (!copy || copy.status !== 'pending_return') {
          return;
        }

        const borrower = userMap.get(copy.userId.toString());
        pending.push({
          copyId: copy._id,
          bookId: book._id,
          bookTitle: book.title,
          category: book.category,
          location: book.location,
          userId: copy.userId,
          borrowerName: copy.borrowerName || borrower?.name,
          borrowerEmail: borrower?.email,
          issueDate: copy.issueDate,
          dueDate: copy.dueDate,
          returnRequestedAt: copy.returnRequestedAt
        });
      });
    });

    res.json({
      total: pending.length,
      pending
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.verifyBookReturn = async (req, res) => {
  try {
    const { copyId } = req.params;

    const book = await Book.findOne({ 'issuedCopies._id': copyId });
    if (!book) {
      return res.status(404).json({ message: 'Borrow record not found' });
    }

    const issuedCopy = book.issuedCopies.id(copyId);
    if (!issuedCopy || issuedCopy.status !== 'pending_return') {
      return res.status(400).json({ message: 'No pending return found for the provided record' });
    }

    const user = await User.findById(issuedCopy.userId);
    if (!user) {
      return res.status(404).json({ message: 'Borrowing user not found' });
    }

    const completionTime = new Date();

    issuedCopy.isReturned = true;
    issuedCopy.status = 'returned';
    issuedCopy.returnDate = completionTime;
    issuedCopy.returnVerifiedAt = completionTime;

    if (book.category === 'offline') {
      const total = book.totalCopies || 0;
      const current = book.availableCopies || 0;
      book.availableCopies = Math.min(total, current + 1);
    }

    await book.save();

    const borrowEntry = user.borrowedBooks.find(
      borrow => borrow.issuedCopyId && borrow.issuedCopyId.toString() === copyId
    );

    if (borrowEntry) {
      borrowEntry.isReturned = true;
      borrowEntry.status = 'returned';
      borrowEntry.returnDate = completionTime;
      borrowEntry.returnVerifiedAt = completionTime;
      borrowEntry.accessLink = undefined;
    }

    user.updatedAt = completionTime;
    await user.save();

    res.json({ message: 'Book return verified successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
