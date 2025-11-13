const mongoose = require('mongoose');

const issuedCopySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    borrowerName: String,
    issueDate: Date,
    dueDate: Date,
    returnDate: Date,
    isReturned: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ['borrowed', 'pending_admin_verification', 'returned'],
      default: 'borrowed'
    },
    returnVerifiedBy: mongoose.Schema.Types.ObjectId,
    lastRenewedAt: Date
  },
  { _id: false }
);

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
  category: {
    type: String,
    enum: ['offline', 'online'],
    default: 'offline'
  },
  googleDriveLink: {
    type: String,
    trim: true,
    validate: {
      validator: function(value) {
        if (this.category === 'online') {
          return typeof value === 'string' && value.trim().length > 0;
        }
        return true;
      },
      message: 'Google Drive link is required for online books'
    }
  },
  location: {
    type: String,
    enum: ['Main library', 'Sub library', 'Digital library'],
    default: function() {
      return this.category === 'online' ? 'Digital library' : 'Main library';
    }
  },
  totalCopies: {
    type: Number,
    min: [0, 'Total copies cannot be negative'],
    default: function() {
      return this.category === 'offline' ? 1 : 0;
    },
    validate: {
      validator: function(value) {
        if (this.category === 'offline') {
          return Number.isInteger(value) && value >= 1;
        }
        return true;
      },
      message: 'Offline books must have at least 1 total copy'
    }
  },
  availableCopies: {
    type: Number,
    min: [0, 'Available copies cannot be negative'],
    default: function() {
      return this.category === 'offline' ? 1 : 0;
    }
  },
  issuedCopies: [issuedCopySchema],
  renewalIntervalDays: {
    type: Number,
    default: 15
  },
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
