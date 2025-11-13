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
  category: {
    type: String,
    enum: ['offline', 'online'],
    default: 'offline'
  },
  googleDriveLink: {
    type: String,
    trim: true
  },
  description: String,
  coverImage: String,
  location: {
    type: String,
    enum: ['Main library', 'Sub library', 'Online'],
    default: 'Main library'
  },
  totalCopies: {
    type: Number,
    default: 0,
    min: [0, 'Total copies cannot be negative'],
    validate: {
      validator(value) {
        if (this.category === 'offline') {
          return value > 0;
        }
        return true;
      },
      message: 'Offline books must have at least one copy'
    }
  },
  availableCopies: {
    type: Number,
    default: 0,
    min: [0, 'Available copies cannot be negative'],
    validate: {
      validator(value) {
        if (this.category === 'offline') {
          return value >= 0 && value <= this.totalCopies;
        }
        return true;
      },
      message: 'Available copies must be between zero and total copies for offline books'
    }
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
      },
      category: {
        type: String,
        enum: ['offline', 'online'],
        default: 'offline'
      },
      renewCount: {
        type: Number,
        default: 0
      },
      lastRenewedAt: Date
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

bookSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Book', bookSchema);
