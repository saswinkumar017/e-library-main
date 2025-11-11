const express = require('express');
const bookController = require('../controllers/bookController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', bookController.getBooks);
router.get('/:id', bookController.getBookById);
router.get('/:id/availability', bookController.getAvailability);

router.post('/', adminMiddleware, bookController.createBook);
router.put('/:id', adminMiddleware, bookController.updateBook);
router.delete('/:id', adminMiddleware, bookController.deleteBook);

router.post('/borrow', authMiddleware, bookController.borrowBook);
router.post('/return', authMiddleware, bookController.returnBook);

module.exports = router;
