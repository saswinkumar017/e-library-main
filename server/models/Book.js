const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  author: {
    type: String,
    required: true
  },
  genre: {
    type: String,
    required: true
  },
  publicationYear: {
    type: Number,
    required: true
  },
  isbn: {
    type: String,
    unique: true,
    sparse: true
  },
  description: String,
  coverImage: String,
  location: {
    type: String,
    enum: ['Main library', 'Sub library'],
    default: 'Main library'
  },
  totalCopies: {
    type: Number,
    required: true,
    default: 1
  },
  availableCopies: {
    type: Number,
    required: true,
    default: 1
  },
  issuedCopies: [
    {
      userId: mongoose.Schema.Types.ObjectId,
      borrowerName: String,
      issueDate: Date,
      dueDate: Date,
      returnDate: Date,
      isReturned: {
        type: Boolean,
        default: false
      }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Book', bookSchema);
