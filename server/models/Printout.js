const mongoose = require('mongoose');

const printoutSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: String,
  documentName: String,
  fileUrl: String,
  colorMode: {
    type: String,
    enum: ['BW', 'Color'],
    required: true
  },
  copies: {
    type: Number,
    required: true,
    default: 1
  },
  totalPages: {
    type: Number,
    required: true
  },
  totalCost: {
    type: Number,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['gpay', 'credit_card', 'debit_card'],
    default: 'gpay'
  },
  transactionId: String,
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'cancelled'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  notes: String
});

module.exports = mongoose.model('Printout', printoutSchema);
