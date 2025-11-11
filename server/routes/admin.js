const express = require('express');
const adminController = require('../controllers/adminController');
const { adminMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/users', adminMiddleware, adminController.getAllUsers);
router.get('/users/stats', adminMiddleware, adminController.getUserStats);
router.get('/users/:userId/borrow-history', adminMiddleware, adminController.getUserBorrowHistory);
router.put('/users/:userId/promote', adminMiddleware, adminController.promoteUserToAdmin);
router.put('/users/:userId/demote', adminMiddleware, adminController.demoteAdminToUser);
router.put('/users/:userId/deactivate', adminMiddleware, adminController.deactivateUser);

router.get('/books', adminMiddleware, adminController.getAllBooks);
router.get('/books/stats', adminMiddleware, adminController.getBookStats);

router.get('/printouts/stats', adminMiddleware, adminController.getPrintoutStats);

router.get('/reports', adminMiddleware, adminController.generateReport);

module.exports = router;
