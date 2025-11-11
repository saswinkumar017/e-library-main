const express = require('express');
const printoutController = require('../controllers/printoutController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

router.post('/', authMiddleware, printoutController.createPrintout);
router.post('/confirm-payment', authMiddleware, printoutController.confirmPayment);
router.get('/history', authMiddleware, printoutController.getPrintoutHistory);
router.get('/:id', authMiddleware, printoutController.getPrintoutById);
router.put('/:printoutId/status', adminMiddleware, printoutController.updatePrintoutStatus);
router.delete('/:printoutId', authMiddleware, printoutController.cancelPrintout);

module.exports = router;
