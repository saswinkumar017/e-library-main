const mongoose = require('mongoose');

const renewalSchema = new mongoose.Schema(
  {
    renewedAt: {
      type: Date,
      default: Date.now
    },
    dueDate: {
      type: Date,
      required: true
    }
  },
  { _id: false }
);

const issuedCopySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  borrowerName: String,
  issueDate: {
    type: Date,
    default: Date.now
  },
  dueDate: Date,
  returnDate: Date,
  isReturned: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['active', 'pending_return', 'returned'],
    default: 'active'
  },
  returnRequestedAt: Date,
  returnVerifiedAt: Date,
  renewals: [renewalSchema]
});

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
    required: function() {
      return this.category === 'online';
    }
  },
  renewalPeriodDays: {
    type: Number,
    default: 15,
    min: 1
  },
  location: {
    type: String,
    enum: ['Main library', 'Sub library', 'Digital Library'],
    default: function() {
      return this.category === 'online' ? 'Digital Library' : 'Main library';
    }
  },
  totalCopies: {
    type: Number,
    min: 0,
    default: function() {
      return this.category === 'offline' ? 1 : null;
    },
    required: function() {
      return this.category === 'offline';
    }
  },
  availableCopies: {
    type: Number,
    min: 0,
    default: function() {
      return this.category === 'offline' ? 1 : null;
    },
    required: function() {
      return this.category === 'offline';
    }
  },
  issuedCopies: [issuedCopySchema],
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
