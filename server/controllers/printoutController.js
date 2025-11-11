const Printout = require('../models/Printout');
const User = require('../models/User');

const PRICE_PER_PAGE_BW = 1;
const PRICE_PER_PAGE_COLOR = 3;

exports.createPrintout = async (req, res) => {
  try {
    const { documentName, fileUrl, colorMode, copies, totalPages } = req.body;
    const userId = req.userId;

    if (!documentName || !colorMode || !totalPages) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const pricePerPage = colorMode === 'Color' ? PRICE_PER_PAGE_COLOR : PRICE_PER_PAGE_BW;
    const totalCost = pricePerPage * totalPages * copies;

    const user = await User.findById(userId);

    const printout = new Printout({
      userId,
      userName: user.name,
      documentName,
      fileUrl,
      colorMode,
      copies: copies || 1,
      totalPages,
      totalCost,
      paymentStatus: 'pending'
    });

    await printout.save();

    res.status(201).json({
      message: 'Printout request created',
      printout,
      paymentDetails: {
        amount: totalCost,
        currency: 'INR',
        description: `${documentName} - ${totalPages} pages x ${copies} copies`
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.confirmPayment = async (req, res) => {
  try {
    const { printoutId, transactionId, paymentMethod } = req.body;
    const userId = req.userId;

    const printout = await Printout.findById(printoutId);
    if (!printout) {
      return res.status(404).json({ message: 'Printout not found' });
    }

    if (printout.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    printout.paymentStatus = 'completed';
    printout.status = 'processing';
    printout.transactionId = transactionId;
    printout.paymentMethod = paymentMethod || 'gpay';
    await printout.save();

    const user = await User.findById(userId);
    user.totalPrintoutSpent += printout.totalCost;
    user.totalPrintoutsCount += 1;
    await user.save();

    res.json({
      message: 'Payment confirmed, printout is being processed',
      printout
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPrintoutHistory = async (req, res) => {
  try {
    const userId = req.userId;
    const printouts = await Printout.find({ userId }).sort({ createdAt: -1 });
    res.json(printouts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPrintoutById = async (req, res) => {
  try {
    const { id } = req.params;
    const printout = await Printout.findById(id);

    if (!printout) {
      return res.status(404).json({ message: 'Printout not found' });
    }

    res.json(printout);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updatePrintoutStatus = async (req, res) => {
  try {
    const { printoutId } = req.params;
    const { status } = req.body;

    const printout = await Printout.findByIdAndUpdate(
      printoutId,
      {
        status,
        completedAt: status === 'completed' ? new Date() : undefined
      },
      { new: true }
    );

    if (!printout) {
      return res.status(404).json({ message: 'Printout not found' });
    }

    res.json({
      message: 'Printout status updated',
      printout
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.cancelPrintout = async (req, res) => {
  try {
    const { printoutId } = req.params;
    const userId = req.userId;

    const printout = await Printout.findById(printoutId);
    if (!printout) {
      return res.status(404).json({ message: 'Printout not found' });
    }

    if (printout.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (printout.status === 'completed' || printout.status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot cancel this printout' });
    }

    printout.status = 'cancelled';
    await printout.save();

    res.json({ message: 'Printout cancelled successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
