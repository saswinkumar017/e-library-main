const express = require('express');
const bookController = require('../controllers/bookController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', bookController.getBooks);

router.post('/borrow', authMiddleware, bookController.borrowBook);
router.post('/renew', authMiddleware, bookController.renewOnlineBook);
router.post('/return', authMiddleware, bookController.returnBook);

router.post('/', adminMiddleware, bookController.createBook);

router.get('/:id', bookController.getBookById);
router.get('/:id/availability', bookController.getAvailability);

router.put('/:id', adminMiddleware, bookController.updateBook);
router.delete('/:id', adminMiddleware, bookController.deleteBook);

module.exports = router;
