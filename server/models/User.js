const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const renewalEventSchema = new mongoose.Schema(
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

const borrowedBookSchema = new mongoose.Schema({
  issuedCopyId: {
    type: mongoose.Schema.Types.ObjectId
  },
  bookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book'
  },
  bookTitle: String,
  category: {
    type: String,
    enum: ['offline', 'online'],
    default: 'offline'
  },
  accessLink: String,
  borrowDate: Date,
  dueDate: Date,
  lastRenewedAt: Date,
  renewals: [renewalEventSchema],
  returnDate: Date,
  isReturned: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['active', 'pending_return', 'returned', 'expired'],
    default: 'active'
  },
  returnRequestedAt: Date,
  returnVerifiedAt: Date
});

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  profilePicture: String,
  role: {
    type: String,
    enum: ['user', 'admin', 'superadmin'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  borrowedBooks: [borrowedBookSchema],
  totalPrintoutSpent: {
    type: Number,
    default: 0
  },
  totalPrintoutsCount: {
    type: Number,
    default: 0
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

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    this.updatedAt = new Date();
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    this.updatedAt = new Date();
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
