const express = require('express');
const adminController = require('../controllers/adminController');
const { adminMiddleware, superadminMiddleware } = require('../middleware/auth');

const router = express.Router();

// Admin and Superadmin routes
router.get('/users', adminMiddleware, adminController.getAllUsers);
router.get('/users/stats', adminMiddleware, adminController.getUserStats);
router.get('/users/:userId/borrow-history', adminMiddleware, adminController.getUserBorrowHistory);
router.get('/admins', adminMiddleware, adminController.getAllAdmins);

// Superadmin only routes (promote, demote, role changes)
router.put('/users/:userId/promote', superadminMiddleware, adminController.promoteUserToAdmin);
router.put('/users/:userId/demote', superadminMiddleware, adminController.demoteAdminToUser);
router.put('/users/:userId/deactivate', superadminMiddleware, adminController.deactivateUser);
router.put('/users/:userId/reactivate', superadminMiddleware, adminController.reactivateUser);

// Book management (both admin and superadmin)
router.get('/books', adminMiddleware, adminController.getAllBooks);
router.get('/books/stats', adminMiddleware, adminController.getBookStats);
router.get('/books/returns/pending', adminMiddleware, adminController.getPendingBookReturns);
router.put('/books/returns/:copyId/verify', adminMiddleware, adminController.verifyBookReturn);

// Printouts stats
router.get('/printouts/stats', adminMiddleware, adminController.getPrintoutStats);

// Reports
router.get('/reports', adminMiddleware, adminController.generateReport);

// Printout notifications
router.get('/printouts/pending', adminMiddleware, adminController.getPendingPrintouts);

module.exports = router;
